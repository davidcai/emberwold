#!/usr/bin/env python3
"""Extract structured, machine-readable Mage Knight data from the upstream
open-source project `mage-knight-digital/MageKnight`.

Why this exists
---------------
The official rulebooks in `reference/extracted/` contain *rules*, but they do
not enumerate per-card effect text, enemy stats or tile layouts.  The upstream
project's Rust data module (`packages/engine-rs/crates/mk-data`) does encode that
information structurally.  This script downloads those files to a cache, parses
the Rust data literals, normalises them into the compact Emberwold data model
(see `game-data/README.md`), and writes the generated JSON files under
`game-data/`.

This is a *cross-check / gap-filler* source, never the authority:
  * Anything confirmed by the official rulebooks is recorded in
    `game-data/manifest.json` (`official_cross_check`) and in the README.
  * Items whose only source is upstream are tagged `"confidence":
    "upstream-only"` and must be re-verified against physical cards before any
    commercial use.

IP
--
Only short names, numeric stats and structured effect notation are emitted.
No flavour text, no rules prose from cards is copied.  The upstream project
does not ship a LICENSE file at the pinned revision (see manifest), so this
data is treated as a research cross-check only.

Usage
-----
    .venv/bin/python tools/extract_upstream_mkdata.py            # fetch + write
    .venv/bin/python tools/extract_upstream_mkdata.py --no-fetch # use cache only
    .venv/bin/python tools/extract_upstream_mkdata.py --cache /tmp/mk-cache

Requires only the Python standard library.
"""

from __future__ import annotations

import argparse
import ast
import hashlib
import json
import re
import sys
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

REPO = "mage-knight-digital/MageKnight"
PINNED_REF = "HEAD"  # used only when no commit is pinned yet (see upstream-pin.json)
RAW_TEMPLATE = "https://raw.githubusercontent.com/{repo}/{ref}/packages/engine-rs/crates/mk-data/src"
MFILES = [
    "heroes",
    "cards",
    "enemies",
    "units",
    "skills",
    "tiles",
    "ruins_tokens",
    "tactics",
    "levels",
]
MANUAL_FILES = [
    "sites",
    "scenarios",
    "tactics",
    "keywords",
    "levels",
]

DATA_DIR = Path(__file__).resolve().parent.parent / "game-data"
DEFAULT_CACHE = Path("/tmp/emberwold-upstream-cache")
SCHEMA_VERSION = "1.0.0"
GENERATED_BY = "tools/extract_upstream_mkdata.py"


# ---------------------------------------------------------------------------
# tiny Rust-expression parser (only the subset used by the upstream data files)
# ---------------------------------------------------------------------------

TOKEN_RE = re.compile(
    r"""
      (?P<ws>\s+)
    | (?P<comment>//[^\n]*)
    | (?P<string>"(?:\\.|[^"\\])*")
    | (?P<number>\d+(?:\.\d+)?[A-Za-z0-9_]*)
    | (?P<ident>[A-Za-z_][A-Za-z0-9_]*)
    | (?P<punct>::|->|\.\.=|\.\.|[{}()\[\],:;=&*|+\-!?.<>])
    """,
    re.X,
)


class Tok:
    __slots__ = ("kind", "val", "pos")

    def __init__(self, kind, val, pos):
        self.kind = kind
        self.val = val
        self.pos = pos

    def __repr__(self):  # pragma: no cover - debugging aid
        return f"Tok({self.kind},{self.val!r})"


EOF_TOK = Tok("eof", "", -1)


def tokenize(text: str) -> list[Tok]:
    out: list[Tok] = []
    i = 0
    n = len(text)
    while i < n:
        m = TOKEN_RE.match(text, i)
        if not m:
            raise ValueError(f"tokenizer stuck at {i}: {text[i:i+40]!r}")
        i = m.end()
        kind = m.lastgroup
        if kind in ("ws", "comment"):
            continue
        out.append(Tok(kind, m.group(0), m.start()))
    return out


# expression AST -------------------------------------------------------------

# scalar values are plain python values; composite nodes are dicts:
#   {"t": "path", "parts": [...]}
#   {"t": "variant", "parts": [...], "fields": {...}}
#   {"t": "call", "parts": [...], "args": [...]}
#   {"t": "list", "items": [...]}
#   {"t": "tuple", "items": [...]}
#   {"t": "neg", "value": 3}
#   {"t": "some", "value": <node>}
#   {"t": "none"}


class RustParser:
    def __init__(self, toks: list[Tok], pos: int = 0):
        self.toks = toks
        self.i = pos

    # -- helpers ---------------------------------------------------------
    def tok(self, k: int = 0) -> Tok:
        idx = self.i + k
        if idx >= len(self.toks):
            return EOF_TOK
        return self.toks[idx]

    def at(self, val: str, k: int = 0) -> bool:
        return self.tok(k).val == val

    def eat(self, val: str) -> bool:
        if self.at(val):
            self.i += 1
            return True
        return False

    def expect(self, val: str) -> None:
        if not self.eat(val):
            raise ValueError(f"expected {val!r} at token {self.i}: {self.tok()!r}")

    def parse_path(self) -> list[str]:
        parts = [self.tok().val]
        self.i += 1
        while self.at("::"):
            self.i += 1
            parts.append(self.tok().val)
            self.i += 1
        return parts

    # -- expressions -----------------------------------------------------
    def parse_expr(self):
        node = self.parse_primary()
        # postfix method calls: `x.clone()`
        while self.at(".") and self.tok(1).kind == "ident":
            self.i += 2
            name = self.toks[self.i - 1].val
            args = []
            if self.at("("):
                self.i += 1
                args = self.parse_comma_list(")")
            node = {"t": "method", "recv": node, "name": name, "args": args}
        return node

    def parse_primary(self):
        t = self.tok()
        if t.val == "&":
            self.i += 1
            return self.parse_expr()
        if t.val == "vec" and self.at("!", 1):
            self.i += 2
            self.expect("[")
            return {"t": "list", "items": self.parse_comma_list("]")}
        if t.val == "[":
            self.i += 1
            return {"t": "list", "items": self.parse_comma_list("]")}
        if t.val == "(":
            self.i += 1
            items = self.parse_comma_list(")")
            if len(items) == 1:
                return items[0]
            return {"t": "tuple", "items": items}
        if t.val == "-":
            self.i += 1
            inner = self.parse_expr()
            return {"t": "neg", "value": inner}
        if t.kind == "string":
            self.i += 1
            return ast.literal_eval(t.val)
        if t.kind == "number":
            self.i += 1
            raw = re.sub(r"[A-Za-z0-9_]*$", "", t.val) if re.search(r"[A-Za-z]", t.val) else t.val
            if "." in raw:
                return float(raw)
            return int(raw)
        if t.kind == "ident":
            if t.val in ("true", "false"):
                self.i += 1
                return t.val == "true"
            if t.val == "None":
                self.i += 1
                return {"t": "none"}
            if t.val == "Some" and self.at("(", 1):
                self.i += 2
                inner = self.parse_expr()
                self.expect(")")
                return {"t": "some", "value": inner}
            parts = self.parse_path()
            if self.at("{"):
                return {"t": "variant", "parts": parts, "fields": self.parse_struct()}
            if self.at("("):
                self.i += 1
                args = self.parse_comma_list(")")
                return {"t": "call", "parts": parts, "args": args}
            return {"t": "path", "parts": parts}
        raise ValueError(f"unexpected token {t!r} at {self.i}")

    def parse_comma_list(self, close: str) -> list:
        items = []
        if self.at(close):
            self.i += 1
            return items
        while True:
            items.append(self.parse_expr())
            if self.eat(","):
                if self.at(close):  # trailing comma
                    self.i += 1
                    return items
                continue
            self.expect(close)
            return items

    def parse_struct(self) -> dict:
        self.expect("{")
        fields: dict = {}
        while not self.at("}"):
            if self.at(".."):  # struct-update spread; not used by data literals
                self.i += 1
                self.parse_expr()
            elif self.tok().kind == "ident" and self.at(":", 1):
                key = self.tok().val
                self.i += 2
                fields[key] = self.parse_expr()
            elif self.tok().kind == "ident" and (self.at(",", 1) or self.at("}", 1)):
                # field shorthand: `id,`
                key = self.tok().val
                self.i += 1
                fields[key] = {"t": "path", "parts": [key]}
            else:
                raise ValueError(f"bad struct field at {self.i}: {self.tok()!r} {self.tok(1)!r}")
            if not self.eat(","):
                break
        self.expect("}")
        return fields


# ---------------------------------------------------------------------------
# JSON normalisation
# ---------------------------------------------------------------------------

CAMEL_RE1 = re.compile(r"(.)([A-Z][a-z]+)")
CAMEL_RE2 = re.compile(r"([a-z0-9])([A-Z])")


def snake(name: str) -> str:
    s = CAMEL_RE1.sub(r"\1_\2", name)
    s = CAMEL_RE2.sub(r"\1_\2", s)
    return s.lower()


# helper const-fn shims used by units.rs to keep literals short
UNIT_ABILITY_HELPERS = {
    "atk": ("attack", ["value", "element"]),
    "blk": ("block", ["value", "element"]),
    "rng": ("ranged_attack", ["value", "element"]),
    "siege": ("siege_attack", ["value", "element"]),
    "mov": ("move", ["value"]),
    "inf": ("influence", ["value"]),
    "heal": ("heal", ["value"]),
}


# Enums whose field-less variants are *effect operations*, not scalar values.
# A path like `CardEffect::TakeWound` must become {"op": "take_wound"}, while
# `Element::Fire` must stay the string "fire".
EFFECT_ENUMS = {"CardEffect", "UnitAbility", "CardEndTurnEffect", "EffectCondition"}


class Normalizer:
    """Converts parsed Rust expression ASTs into the Emberwold JSON notation."""

    def __init__(self, consts: dict | None = None, locals_: dict | None = None):
        self.consts = consts or {}
        self.locals = locals_ or {}

    def node(self, node):
        if not isinstance(node, dict):
            return node
        t = node["t"]
        if t == "none":
            return None
        if t == "some":
            return self.node(node["value"])
        if t == "neg":
            return -self.node(node["value"])
        if t == "list":
            return [self.node(x) for x in node["items"]]
        if t == "tuple":
            return [self.node(x) for x in node["items"]]
        if t == "path":
            return self.path(node["parts"])
        if t == "method":
            if node["name"] == "clone":
                return self.node(node["recv"])
            return {
                "op": "method_" + snake(node["name"]),
                "receiver": self.node(node["recv"]),
                "args": [self.node(a) for a in node["args"]],
            }
        if t == "call":
            return self.call(node)
        if t == "variant":
            type_name = node["parts"][-1]
            fields = {k: self.node(v) for k, v in node["fields"].items() if v is not None}
            out = {"op": snake(type_name)}
            out.update(fields)
            return out
        raise ValueError(f"cannot normalise {node!r}")

    def path(self, parts: list[str]):
        if len(parts) >= 2 and parts[0] in EFFECT_ENUMS:
            return {"op": snake(parts[-1])}
        if len(parts) == 1:
            if parts[0] in self.locals:
                return self.locals[parts[0]]
            if parts[0] in self.consts:
                return self.consts[parts[0]]
        return snake(parts[-1])

    def call(self, node):
        parts = node["parts"]
        name = parts[-1]
        args = [self.node(a) for a in node["args"]]
        # PoweredBy::Single(color) -> color, other PoweredBy variants -> token
        if len(parts) >= 2 and parts[-2] == "PoweredBy":
            return args[0] if name == "Single" else snake(name)
        # Box::new(inner) -> inner
        if name == "new" and len(parts) >= 2 and parts[-2] == "Box":
            return args[0]
        # HexCoord::new(q, r) -> {q, r}
        if name == "new" and len(parts) >= 2 and parts[-2] == "HexCoord":
            return {"q": args[0], "r": args[1]}
        # UnitAbilitySlot::free / costed
        if len(parts) >= 2 and parts[-2] == "UnitAbilitySlot" and name in ("free", "costed"):
            return {
                "mana_cost": args[1] if name == "costed" else None,
                "ability": args[0],
            }
        # short helper constructors
        if len(parts) == 1 and name in UNIT_ABILITY_HELPERS:
            op, field_names = UNIT_ABILITY_HELPERS[name]
            out = {"op": op}
            for field_name, value in zip(field_names, args):
                out[field_name] = value
            return out
        if len(parts) >= 2 and parts[-2] == "TerrainOrAll" and name == "Specific":
            return {"op": "terrain_specific", "terrain": args[0]}
        # enum-style tuple variants: merge a single structured payload
        if len(parts) >= 2 and parts[0] in EFFECT_ENUMS and len(args) == 1 and isinstance(args[0], dict):
            merged = {"op": snake(name)}
            merged.update({k: v for k, v in args[0].items() if k != "op"})
            if len(merged) > 1:
                return merged
        # fallback: keep a structured call node
        return {"op": snake(name), "args": args}


def balanced_region(text: str, start: int) -> str:
    """Return the balanced bracket region starting at/after `start`.

    Handles Rust references (`&[...]`), slices, tuples and struct bodies while
    skipping strings and line comments.
    """
    i = start
    while i < len(text) and text[i] in " \t\r\n&":
        i += 1
    if i >= len(text):
        raise ValueError("no expression after match")
    open_to_close = {"(": ")", "[": "]", "{": "}"}
    opener = text[i]
    if opener not in open_to_close:
        raise ValueError(f"expected bracket at {i}: {text[i:i+40]!r}")
    depth = 0
    in_str = False
    esc = False
    comment = False
    j = i
    while j < len(text):
        c = text[j]
        if comment:
            if c == "\n":
                comment = False
        elif in_str:
            if esc:
                esc = False
            elif c == "\\":
                esc = True
            elif c == '"':
                in_str = False
        elif c == "/" and j + 1 < len(text) and text[j + 1] == "/":
            comment = True
            j += 1
        elif c == '"':
            in_str = True
        elif c in "([{":
            depth += 1
        elif c in ")]}":
            depth -= 1
            if depth == 0:
                return text[i : j + 1]
        j += 1
    raise ValueError("unbalanced brackets")


# ---------------------------------------------------------------------------
# fetching
# ---------------------------------------------------------------------------


def fetch_sources(cache_dir: Path, offline: bool, pinned_commit: str | None, repin: bool) -> dict:
    cache_dir.mkdir(parents=True, exist_ok=True)
    raw_base = RAW_TEMPLATE.format(repo=REPO, ref=(pinned_commit or PINNED_REF))
    meta = {"repo": REPO, "ref": pinned_commit or PINNED_REF, "url_base": raw_base, "commit": pinned_commit, "files": {}}
    if not offline and (pinned_commit is None or repin):
        try:
            req = urllib.request.Request(
                f"https://api.github.com/repos/{REPO}/commits/{PINNED_REF}",
                headers={"User-Agent": "emberwold-research/1.0", "Accept": "application/vnd.github+json"},
            )
            with urllib.request.urlopen(req, timeout=30) as r:
                meta["commit"] = json.load(r).get("sha")
            raw_base = RAW_TEMPLATE.format(repo=REPO, ref=meta["commit"])
            meta["url_base"] = raw_base
            meta["ref"] = meta["commit"]
        except Exception as exc:  # network optional; pinned SHA is a nice-to-have
            meta["commit_error"] = str(exc)
    for name in MFILES:
        path = cache_dir / f"{name}.rs"
        if not offline:
            req = urllib.request.Request(f"{raw_base}/{name}.rs", headers={"User-Agent": "emberwold-research/1.0"})
            with urllib.request.urlopen(req, timeout=60) as r:
                body = r.read()
            path.write_bytes(body)
        if not path.exists():
            raise SystemExit(f"missing cached source {path}; run without --no-fetch")
        raw = path.read_text(encoding="utf-8")
        meta["files"][name] = {
            "path": f"packages/engine-rs/crates/mk-data/src/{name}.rs",
            "sha256": hashlib.sha256(raw.encode()).hexdigest(),
            "bytes": len(raw),
        }
    meta["fetched_at"] = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    return meta


# ---------------------------------------------------------------------------
# extraction helpers
# ---------------------------------------------------------------------------


def find_structural(text: str, pattern: str) -> list[tuple[re.Match, str]]:
    """Find regex matches and return (match, balanced bracket region)."""
    out = []
    for m in re.finditer(pattern, text):
        try:
            block = balanced_region(text, m.end())
        except ValueError:
            continue
        out.append((m, block))
    return out


def parse_block(block: str, consts: dict | None = None):
    toks = tokenize(block)
    p = RustParser(toks)
    if p.at("{"):
        fields = p.parse_struct()
        return {k: Normalizer(consts).node(v) for k, v in fields.items()}
    locals_: dict = {}
    while p.at("let"):
        p.i += 1
        name = p.tok().val
        p.i += 1
        p.expect("=")
        expr_node = p.parse_expr()
        p.expect(";")
        locals_[name] = Normalizer(consts).node(expr_node)
    node = p.parse_expr()
    if p.i < len(toks) and p.tok().val != ";":
        raise ValueError(f"trailing tokens after expression: {p.tok()!r}")
    return Normalizer(consts, locals_).node(node)


def parse_pub_const_expr(text: str, name: str, keyword: str = "const"):
    m = re.search(rf"(?:pub\s+)?{keyword}\s+{name}\s*:\s*[^=]+=\s*", text)
    if not m:
        return None
    rest = text[m.end() :]
    depth = 0
    in_str = False
    esc = False
    comment = False
    end = None
    for j, c in enumerate(rest):
        if comment:
            if c == "\n":
                comment = False
        elif in_str:
            if esc:
                esc = False
            elif c == "\\":
                esc = True
            elif c == '"':
                in_str = False
        elif c == "/" and j + 1 < len(rest) and rest[j + 1] == "/":
            comment = True
        elif c == '"':
            in_str = True
        elif c in "([{":
            depth += 1
        elif c in ")]}":
            depth -= 1
        elif c == ";" and depth == 0:
            end = j
            break
    if end is None:
        raise ValueError(f"unterminated const {name}")
    expr = rest[:end].strip()
    return parse_block(expr)



def parse_fn_body(block: str, consts: dict | None = None):
    """Parse the single expression inside a `fn ...() -> T { <expr> }` body."""
    inner = block.strip()
    if not (inner.startswith("{") and inner.endswith("}")):
        raise ValueError("not a function body block")
    return parse_block(inner[1:-1], consts)


def consts_from_file(text: str, pattern: str = r"(?:pub\s+)?const\s+([A-Z][A-Z0-9_]*)\s*:") -> dict:
    """Resolve simple scalar/array consts used inside data literals."""
    out: dict = {}
    for m in re.finditer(pattern, text):
        name = m.group(1)
        try:
            val = parse_pub_const_expr(text, name)
        except Exception:
            continue
        if val is not None:
            out[name] = val
    return out


def slice_statics_from_file(text: str) -> dict:
    """Resolve module-level `static NAME: &[...] = &[...];` values (enemy attack lists)."""
    out: dict = {}
    for m in re.finditer(r"static\s+([A-Z][A-Z0-9_]*)\s*:\s*(?:&\s*)?\[", text):
        name = m.group(1)
        try:
            val = parse_pub_const_expr(text, name, keyword="static")
        except Exception:
            continue
        if val is not None:
            out[name] = val
    return out


HERO_PREFIXES = {
    "arythea": "arythea",
    "tovak": "tovak",
    "goldyx": "goldyx",
    "norowas": "norowas",
    "wolfhawk": "wolfhawk",
    "krang": "krang",
    "braevalar": "braevalar",
}

HERO_EXPANSION = {
    "arythea": "base",
    "tovak": "base",
    "goldyx": "base",
    "norowas": "base",
    "wolfhawk": "lost_legion",
    "krang": "krang",
    "braevalar": "shades_of_tezla",
}

# Hero-specific basic action cards that do not carry the hero name in the id.
HERO_CARD_OWNER = {
    "axe_throw": "wolfhawk",
}


# ---------------------------------------------------------------------------
# Emberwold MVP curation (docs/design/11-mvp-scope.md §3)
# ---------------------------------------------------------------------------
# The v1.0 content targets are 1-2 heroes, 12 advanced actions, 6 spells,
# 4 artifacts, 6 units, 10+2 enemies, 6 site types and 4 fixed tiles. The
# selections below are *provisional* (marked placeholder) because the hero
# roster and final tuning are not fixed in docs/research/03-rules-reference.md
# yet. `mvp` marks what v1.0 needs; `status` is the v1.0 content status:
#   data-ready  -> data complete and provenance strong enough to implement now
#   placeholder -> data present but partly unverified / selection provisional
#   omitted     -> not needed for v1.0
MVP_HEROES = {"arythea", "goldyx"}  # direct-combat (red) + mana/magic (green)
MVP_ADVANCED_ACTIONS = [
    "blood_rage", "intimidate", "blood_ritual", "counterattack",
    "fire_bolt", "into_the_heat", "ice_bolt", "steady_tempo",
    "frost_bridge", "refreshing_walk", "in_need", "crushing_bolt",
]
MVP_SPELLS = ["fireball", "snowstorm", "restoration", "whirlwind", "expose", "cure"]
MVP_ARTIFACTS = ["ruby_ring", "sapphire_ring", "diamond_ring", "emerald_ring"]
MVP_UNITS = [
    "peasants", "foresters", "herbalist", "scouts",
    "utem_guardsmen", "utem_crossbowmen",
]
MVP_ENEMIES = [
    "diggers", "prowlers", "cursed_hags", "wolf_riders",   # green
    "guardsmen", "swordsmen",                               # gray
    "minotaur", "medusa",                                   # brown
    "sorcerers", "monks",                                   # violet
    "shocktroops", "gunners",                               # white (city garrison)
]
MVP_TILES = {"starting_a", "countryside_1", "countryside_2", "core_city_green"}


def content_status(is_mvp: bool, *, data_ready: bool = False) -> tuple[bool, str]:
    if not is_mvp:
        return False, "omitted"
    return True, ("data-ready" if data_ready else "placeholder")


def item(domain_id: str, **fields) -> dict:
    it = {"id": domain_id}
    it.update(fields)
    return it


def json_write(path: Path, payload: dict) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    text = json.dumps(payload, indent=2, ensure_ascii=False) + "\n"
    path.write_text(text, encoding="utf-8")


# ---------------------------------------------------------------------------
# heroes
# ---------------------------------------------------------------------------


def extract_heroes(text: str, src_meta: dict):
    deck = parse_pub_const_expr(text, "STANDARD_DECK")
    std_deck = [f"basic:{c}" for c in deck]

    # hero_replacements() match arms
    repl_fn = text[text.index("fn hero_replacements") :]
    repl_fn = repl_fn[: repl_fn.index("\n}\n")]
    replacements: dict[str, list] = {}
    for m in re.finditer(r"Hero::(\w+)\s*=>\s*&\[", repl_fn):
        hero = m.group(1)
        block = balanced_region(repl_fn, m.end() - 1)
        pairs = []
        for r in re.finditer(r'from:\s*"([a-z_]+)"\s*,\s*to:\s*"([a-z_]+)"', block):
            pairs.append((r.group(1), r.group(2)))
        replacements[hero] = pairs

    # hero_starting_crystals() match arms
    cry_fn = text[text.index("fn hero_starting_crystals") :]
    cry_fn = cry_fn[: cry_fn.index("\n}\n")]
    crystals: dict[str, list] = {}
    for m in re.finditer(r"Hero::(\w+)\s*=>\s*\[([^\]]*)\]", cry_fn):
        hero = m.group(1)
        crystals[hero] = re.findall(r"BasicManaColor::(\w+)", m.group(2))

    items = []
    for hero_pascal, pairs in replacements.items():
        hid = snake(hero_pascal)
        deck_ids = list(std_deck)
        for frm, to in pairs:
            for idx, cid in enumerate(deck_ids):
                if cid == f"basic:{frm}":
                    deck_ids[idx] = f"basic:{to}"
                    break
        up_crystals = [snake(c) for c in crystals.get(hero_pascal, [])]
        if hid == "goldyx":
            # Official rulebook example overrides upstream (see README discrepancies).
            crystals_used = ["green", "green", "blue"]
            crystals_note = (
                "Official: MKUE Rulebook p.15 gives Goldyx as the worked example "
                "('Goldyx has green, green and blue'). Upstream heroes.rs says "
                "blue, blue, white -> DISCREPANCY; official value used."
            )
        else:
            crystals_used = up_crystals
            crystals_note = (
                "Upstream heroes.rs; the official rulebooks do not enumerate every "
                "hero's three dummy-player crystal dots, so this is UNVERIFIED."
            )
        items.append(
            item(
                f"hero:{hid}",
                name=hero_pascal,
                expansion=HERO_EXPANSION.get(hid, "unknown"),
                starting_deck=deck_ids,
                deck_size=len(deck_ids),
                starting_crystals=crystals_used,
                starting_crystals_source="official" if hid == "goldyx" else "upstream-mk-data",
                starting_crystals_note=crystals_note,
                starting_crystals_upstream=up_crystals,
                mvp=hid in MVP_HEROES,
                status=content_status(hid in MVP_HEROES, data_ready=True)[1],
                source="upstream-mk-data/heroes.rs",
                confidence="upstream-only",
                official_cross_check=(
                    "MKUE Walkthrough p.5: 'There are four Heroes in the game'; "
                    "p.3/MKUE Rulebook: each starting deck is 16 Basic Action cards; "
                    "p.15: dummy player starts with three crystals matching the hero "
                    "card dots (Goldyx example)."
                ),
            )
        )
    items.sort(key=lambda h: ["arythea", "tovak", "goldyx", "norowas", "wolfhawk", "krang", "braevalar"].index(h["id"][5:]))
    return items, std_deck


# ---------------------------------------------------------------------------
# cards
# ---------------------------------------------------------------------------

CARD_CATEGORY_ORDER = ["movement", "combat", "influence", "healing", "special", "action", "banner"]

CARD_TYPES = {
    "BasicAction": "basic_action",
    "AdvancedAction": "advanced_action",
    "Spell": "spell",
    "Artifact": "artifact",
    "Wound": "wound",
}

POWERED_BY_SPECIAL = {"AnyBasic": "any_basic", "None": None, "Free": "free"}


def normalize_powered_by(value):
    if isinstance(value, str):
        if value in ("none", "None"):
            return None
        if value == "any_basic":
            return "any_basic"
        if value == "free":
            return "free"
        return value
    if isinstance(value, dict):
        return value.get("op")
    return value


def extract_cards(text: str, src_meta: dict):
    consts = consts_from_file(text)
    cards: dict[str, dict] = {}
    for m, block in find_structural(text, r"fn\s+([a-z_][a-z0-9_]*)\(\)\s*->\s*CardDefinition\s*"):
        name = m.group(1)
        try:
            c = parse_fn_body(block, consts)
        except Exception as exc:  # pragma: no cover - surfaced during development
            raise RuntimeError(f"failed to parse card {name}: {exc}") from exc
        cards[name] = c
    return cards


MVP_CARD_IDS = {
    "advanced": set(MVP_ADVANCED_ACTIONS),
    "spell": set(MVP_SPELLS),
    "artifact": set(MVP_ARTIFACTS),
}


def card_item(cid: str, c: dict, *, domain: str, expansion: str, hero: str | None, extra: dict | None = None):
    ctype = CARD_TYPES.get(c.get("card_type"), c.get("card_type"))
    out = item(
        f"{domain}:{cid}",
        name=c["name"],
        card_type=ctype,
        color=c.get("color"),
        expansion=expansion,
        hero=hero,
        powered_by=normalize_powered_by(c.get("powered_by")),
        sideways_value=c.get("sideways_value", 1),
        destroy_on_powered=bool(c.get("destroy_on_powered", False)),
        effects={
            "basic": c.get("basic_effect"),
            "powered": c.get("powered_effect"),
        },
        categories={
            "basic": c.get("basic_categories") or [],
            "powered": c.get("powered_categories") or [],
        },
        source="upstream-mk-data/cards.rs",
        confidence="upstream-only",
    )
    out["mvp"], out["status"] = content_status(out["id"].split(":", 1)[1] in MVP_CARD_IDS.get(domain, set()))
    if extra:
        out.update(extra)
    return out


def extract_basic_actions(cards: dict):
    standard = [
        "march",
        "stamina",
        "swiftness",
        "rage",
        "determination",
        "tranquility",
        "promise",
        "threaten",
        "crystallize",
        "mana_draw",
        "concentration",
        "improvisation",
    ]
    items = []
    for cid in standard:
        items.append(
            card_item(
                cid,
                cards[cid],
                domain="basic",
                expansion="base",
                hero=None,
                extra={"in_standard_deck": True, "mvp": True, "status": "data-ready"},
            )
        )
    hero_cards = []
    for cid, c in cards.items():
        if c.get("card_type") != "basic_action" or cid in standard or cid == "wound":
            continue
        owner = None
        for prefix in HERO_PREFIXES:
            if cid.startswith(prefix + "_"):
                owner = prefix
                break
        owner = owner or HERO_CARD_OWNER.get(cid)
        hero_cards.append(
            card_item(
                cid,
                cards[cid],
                domain="basic",
                expansion=HERO_EXPANSION.get(owner, "unknown"),
                hero=owner,
                extra=dict(
                    zip(("in_standard_deck", "mvp", "status"),
                        (False, owner in MVP_HEROES,
                         content_status(owner in MVP_HEROES)[1]))
                ),
            )
        )
    hero_cards.sort(key=lambda x: (x["hero"] or "", x["id"]))
    return items + hero_cards


def extract_advanced_actions(cards: dict):
    items = []
    for cid, c in cards.items():
        if c.get("card_type") != "advanced_action":
            continue
        items.append(
            card_item(cid, c, domain="advanced", expansion="unknown", hero=None)
        )
    return items


def extract_spells(cards: dict):
    items = []
    for cid, c in cards.items():
        if c.get("card_type") != "spell":
            continue
        items.append(card_item(cid, c, domain="spell", expansion="unknown", hero=None))
    return items


def extract_artifacts(cards: dict):
    items = []
    for cid, c in cards.items():
        if c.get("card_type") != "artifact":
            continue
        items.append(card_item(cid, c, domain="artifact", expansion="unknown", hero=None))
    return items


# ---------------------------------------------------------------------------
# enemies
# ---------------------------------------------------------------------------


def extract_enemies(text: str, src_meta: dict):
    consts = consts_from_file(text)
    consts.update(slice_statics_from_file(text))
    items = []
    for m, block in find_structural(text, r"static\s+[A-Z0-9_]+:\s*EnemyDefinition\s*=\s*EnemyDefinition\s*"):
        e = parse_block(block, consts)
        abilities = [a for a in (e.get("abilities") or []) if a]
        resistances = [r for r in (e.get("resistances") or []) if r]
        attacks = e.get("attacks")
        if isinstance(attacks, list):
            flat_attacks = []
            for a in attacks:
                if isinstance(a, dict):
                    flat_attacks.append(
                        {
                            "damage": a.get("damage"),
                            "element": a.get("element"),
                            "ability": a.get("ability"),
                        }
                    )
            attacks = flat_attacks
        items.append(
            item(
                f"enemy:{e['id']}",
                name=e["name"],
                color=e.get("color"),
                attack=e.get("attack"),
                attack_element=e.get("attack_element"),
                armor=e.get("armor"),
                armor_elusive=e.get("armor_elusive"),
                defend=e.get("defend"),
                fame=e.get("fame"),
                resistances=resistances,
                abilities=abilities,
                attacks=attacks,
                reputation_penalty=e.get("reputation_penalty"),
                reputation_bonus=e.get("reputation_bonus"),
                copies=e.get("copies", 2),
                mvp=e["id"] in MVP_ENEMIES,
                status=content_status(e["id"] in MVP_ENEMIES)[1],
                expansion="unknown",
                source="upstream-mk-data/enemies.rs",
                confidence="upstream-only",
            )
        )
    color_order = {"green": 0, "gray": 1, "brown": 2, "violet": 3, "white": 4, "red": 5}
    items.sort(key=lambda x: (color_order.get(x["color"], 9), x["id"]))
    return items


# ---------------------------------------------------------------------------
# units
# ---------------------------------------------------------------------------


def extract_units(text: str, src_meta: dict):
    consts = consts_from_file(text)
    items = []
    for m, block in find_structural(text, r"static\s+[A-Z0-9_]+:\s*UnitDefinition\s*=\s*UnitDefinition\s*"):
        u = parse_block(block, consts)
        abilities = []
        for slot in u.get("abilities") or []:
            if isinstance(slot, dict) and "ability" in slot:
                abilities.append(
                    {
                        "mana_cost": slot.get("mana_cost"),
                        "ability": slot.get("ability"),
                    }
                )
        items.append(
            item(
                f"unit:{u['id']}",
                name=u["name"],
                level=u.get("level"),
                influence_cost=u.get("influence_cost"),
                armor=u.get("armor"),
                recruit_sites=[snake(s) for s in (u.get("recruit_sites") or []) if s],
                copies=u.get("copies", 1),
                is_hero_unit=bool(u.get("is_hero", False)),
                reversed_reputation=bool(u.get("reversed_reputation", False)),
                restricted_from_free_recruit=bool(u.get("restricted_from_free_recruit", False)),
                abilities=abilities,
                mvp=u["id"] in MVP_UNITS,
                status=content_status(u["id"] in MVP_UNITS)[1],
                expansion="unknown",
                source="upstream-mk-data/units.rs",
                confidence="upstream-only",
            )
        )
    items.sort(key=lambda x: (x["level"] or 0, x["id"]))
    return items


# ---------------------------------------------------------------------------
# skills
# ---------------------------------------------------------------------------

SKILL_USAGE = {
    "OncePerTurn": "once_per_turn",
    "OncePerRound": "once_per_round",
    "Passive": "passive",
    "Interactive": "interactive",
}

SKILL_PHASE = {
    "none": "any",
    "combat_only": "combat_only",
    "melee_attack_only": "melee_attack_only",
    "ranged_siege_or_attack": "ranged_siege_or_attack",
    "block_only": "block_only",
    "no_combat": "no_combat",
}

RUINS_REWARD = {"crystals4": "crystals_4"}


def skill_name_from_id(sid: str) -> str:
    for prefix in HERO_PREFIXES:
        if sid.startswith(prefix + "_"):
            rest = sid[len(prefix) + 1 :]
            break
    else:
        rest = sid
    words = rest.split("_")
    return " ".join(w.capitalize() for w in words)


def extract_skills(text: str, src_meta: dict):
    consts = consts_from_file(text)
    items = []
    # main match table
    pattern = r'"([a-z_]+)"\s*=>\s*Some\(\s*SkillDefinition\s*'
    for m, block in find_structural(text, pattern):
        sid = m.group(1)
        s = parse_block(block, consts)
        effect = s.get("effect")
        hero = next((p for p in HERO_PREFIXES if sid.startswith(p + "_")), None)
        items.append(
            item(
                f"skill:{sid}",
                hero=hero,
                name=skill_name_from_id(sid),
                name_derived=True,
                usage_type=SKILL_USAGE.get(s.get("usage_type"), s.get("usage_type")),
                phase_restriction=SKILL_PHASE.get(
                    s.get("phase_restriction"), s.get("phase_restriction")
                ),
                is_motivation=bool(s.get("is_motivation", False)),
                effect=effect,
                implemented=effect is not None,
                mvp=hero in MVP_HEROES,
                status=content_status(hero in MVP_HEROES)[1],
                expansion=HERO_EXPANSION.get(hero, "unknown"),
                source="upstream-mk-data/skills.rs",
                confidence="upstream-only",
            )
        )
    # stub skills: Some(stub("id", ...))
    for m in re.finditer(r'Some\(\s*stub\(\s*"([a-z_]+)"\s*,\s*SkillUsageType::(\w+)\s*,\s*SkillPhaseRestriction::(\w+)\s*\)\s*\)', text):
        sid, usage, phase = m.group(1), m.group(2), m.group(3)
        hero = next((p for p in HERO_PREFIXES if sid.startswith(p + "_")), None)
        items.append(
            item(
                f"skill:{sid}",
                hero=hero,
                name=skill_name_from_id(sid),
                name_derived=True,
                usage_type=SKILL_USAGE.get(snake(usage), snake(usage)),
                phase_restriction=SKILL_PHASE.get(snake(phase), snake(phase)),
                is_motivation=False,
                effect=None,
                implemented=False,
                mvp=hero in MVP_HEROES,
                status=content_status(hero in MVP_HEROES)[1],
                expansion=HERO_EXPANSION.get(hero, "unknown"),
                source="upstream-mk-data/skills.rs",
                confidence="upstream-only",
            )
        )
    hero_order = list(HERO_EXPANSION)
    items.sort(key=lambda x: (hero_order.index(x["hero"]) if x["hero"] in hero_order else 9, x["id"]))
    return items


# ---------------------------------------------------------------------------
# tiles
# ---------------------------------------------------------------------------

TILE_VARS = {
    "STARTING_TILE_A": ("starting_a", "starting", "base"),
    "STARTING_TILE_B": ("starting_b", "starting", "base"),
}


def tile_identity(var: str) -> tuple[str, str, str] | None:
    if var in TILE_VARS:
        return TILE_VARS[var]
    m = re.match(r"COUNTRYSIDE_(\d+)$", var)
    if m:
        n = int(m.group(1))
        expansion = "base" if n <= 11 else "lost_legion"
        return f"countryside_{n}", "countryside", expansion
    m = re.match(r"CORE_(\d+)$", var)
    if m:
        n = int(m.group(1))
        kind = "core_non_city" if n <= 4 else "core_non_city"
        expansion = "base" if n <= 8 else "lost_legion"
        return f"core_non_city_{n}", kind, expansion
    m = re.match(r"CORE_(\d+)_(GREEN|BLUE|WHITE|RED)_CITY$", var)
    if m:
        return f"core_city_{m.group(2).lower()}", "core_city", "base"
    if var == "CORE_VOLKARE":
        return "core_volkare", "core_volkare", "lost_legion"
    return None


def extract_tiles(text: str, src_meta: dict):
    consts = consts_from_file(text)
    items = []
    for m, block in find_structural(text, r"pub\s+static\s+([A-Z0-9_]+)\s*:\s*&\[TileHex\]\s*=\s*"):
        var = m.group(1)
        ident = tile_identity(var)
        if not ident:
            continue
        tid, kind, expansion = ident
        try:
            hexes = parse_block(block, consts)
        except Exception as exc:  # pragma: no cover
            raise RuntimeError(f"failed to parse tile {var}: {exc}") from exc
        out_hexes = []
        for h in hexes:
            if not isinstance(h, dict):
                continue
            local = h.get("local") or {}
            out_hexes.append(
                {
                    "q": local.get("q"),
                    "r": local.get("r"),
                    "terrain": h.get("terrain"),
                    "site": h.get("site_type"),
                    "mine_color": h.get("mine_color"),
                    "deep_mine_colors": h.get("deep_mine_colors") or [],
                    "rampaging": h.get("rampaging") or [],
                }
            )
        items.append(
            item(
                f"tile:{tid}",
                name=tid.replace("_", " ").title(),
                tile_kind=kind,
                expansion=expansion,
                hex_count=len(out_hexes),
                hexes=out_hexes,
                mvp=tid in MVP_TILES,
                status=content_status(tid in MVP_TILES)[1],
                source="upstream-mk-data/tiles.rs",
                confidence="upstream-only",
                official_cross_check=(
                    "MKUE Walkthrough p.2: 11 Countryside tiles, 8 Core tiles "
                    "(4 city + 4 non-city), 2-sided starting tile."
                ),
            )
        )
    tile_order = {"starting": 0, "countryside": 1, "core_non_city": 2, "core_city": 3, "core_volkare": 4}
    items.sort(key=lambda x: (tile_order.get(x["tile_kind"], 9), x["id"]))
    return items


# ---------------------------------------------------------------------------
# ruins tokens
# ---------------------------------------------------------------------------


def extract_ruins_tokens(text: str, src_meta: dict):
    consts = consts_from_file(text)
    items = []
    for m, block in find_structural(
        text, r"static\s+[A-Z0-9_]+:\s*RuinsTokenDef\s*=\s*RuinsTokenDef::(\w+)"
    ):
        kind = snake(m.group(1))
        node = parse_block(block, consts)
        payload = node
        if not isinstance(payload, dict):
            continue
        if kind == "altar":
            items.append(
                item(
                    f"ruins:{payload['token_id']}",
                    kind="altar",
                    cost=payload.get("cost"),
                    fame=payload.get("fame"),
                    mvp=False,
                    status="omitted",
                    source="upstream-mk-data/ruins_tokens.rs",
                    confidence="upstream-only",
                )
            )
        elif kind == "enemy":
            items.append(
                item(
                    f"ruins:{payload['token_id']}",
                    kind="enemy",
                    enemy_colors=[snake(c) for c in payload.get("enemy_colors") or [] if c],
                    rewards=[RUINS_REWARD.get(snake(r), snake(r)) for r in payload.get("rewards") or [] if r],
                    mvp=False,
                    status="omitted",
                    source="upstream-mk-data/ruins_tokens.rs",
                    confidence="upstream-only",
                )
            )
    return items


# ---------------------------------------------------------------------------
# levels
# ---------------------------------------------------------------------------


def extract_levels(text: str, src_meta: dict):
    thresholds = parse_pub_const_expr(text, "LEVEL_THRESHOLDS")
    stats = []
    for m in re.finditer(
        r"(\d+|_\s*)\s*(?:\.\.=\s*(\d+))?\s*(?:\|\s*(\d+)\s*)?=>\s*LevelStats\s*\{([^}]*)\}", text
    ):
        block = m.group(4)
        nums = [int(x) for x in re.findall(r"armor:\s*(\d+)|hand_limit:\s*(\d+)|command_slots:\s*(\d+)", block) for x in x if x]
        lo_raw = m.group(1).strip()
        hi = m.group(2) or m.group(3)
        if lo_raw == "_":  # final catch-all arm: 9, 10+
            lo, hi = 9, 10
        else:
            lo = int(lo_raw)
            hi = int(hi) if hi else lo
        if len(nums) != 3:
            continue
        stats.append({"min_level": max(1, lo), "max_level": hi, "armor": nums[0], "hand_limit": nums[1], "command_slots": nums[2]})
    return thresholds, stats


# ---------------------------------------------------------------------------
# tactics (ids only; effects are hand-curated in game-data/tactics.json)
# ---------------------------------------------------------------------------


def extract_tactics(text: str, src_meta: dict):
    out = {}
    for const_name, tod in (("DAY_TACTIC_IDS", "day"), ("NIGHT_TACTIC_IDS", "night")):
        ids = parse_pub_const_expr(text, const_name)
        out[tod] = ids
    return out


# ---------------------------------------------------------------------------
# effect-op registry
# ---------------------------------------------------------------------------


def walk_ops(node, counter: dict, fields: dict):
    if isinstance(node, dict):
        if "op" in node:
            op = node["op"]
            counter[op] = counter.get(op, 0) + 1
            fset = fields.setdefault(op, set())
            fset.update(k for k in node.keys() if k != "op")
        for k, v in node.items():
            if k == "op":
                continue
            walk_ops(v, counter, fields)
    elif isinstance(node, list):
        for v in node:
            walk_ops(v, counter, fields)


def build_effect_ops(all_items: dict, extra_ops: dict | None = None) -> dict:
    counter: dict[str, int] = {}
    fields: dict[str, set] = {}
    for domain, items in all_items.items():
        for it in items:
            for key in ("effects", "effect", "abilities"):
                if key in it:
                    walk_ops(it[key], counter, fields)
    ops = []
    for op in sorted(counter, key=lambda o: (-counter[o], o)):
        ops.append(
            {
                "op": op,
                "used": counter[op],
                "fields": sorted(fields.get(op, [])),
            }
        )
    return {
        "schema_version": SCHEMA_VERSION,
        "domain": "effect-ops",
        "provenance": {
            "generated_by": GENERATED_BY,
            "upstream": {
                "repo": REPO,
                "commit": extra_ops.get("commit") if extra_ops else None,
            },
            "note": (
                "Registry of every structured effect operation emitted in "
                "game-data/cards**.json, skills.json and units.json. The notation "
                "is documented in game-data/README.md. Op names are normalised from "
                "the upstream engine's CardEffect/UnitAbility enum variants; they are "
                "not official card text."
            ),
        },
        "op_count": len(ops),
        "total_nodes": sum(counter.values()),
        "ops": ops,
    }


# ---------------------------------------------------------------------------
# main
# ---------------------------------------------------------------------------


def provenance_block(src_meta: dict, rs_file: str, *, confidence: str = "upstream-only", notes: str | None = None) -> dict:
    fmeta = src_meta["files"].get(rs_file, {})
    return {
        "generated_by": GENERATED_BY,
        "schema_version": SCHEMA_VERSION,
        "upstream": {
            "repo": REPO,
            "commit": src_meta.get("commit"),
            "path": fmeta.get("path"),
            "sha256": fmeta.get("sha256"),
            "fetched_at": src_meta.get("fetched_at"),
        },
        "confidence": confidence,
        "notes": notes
        or (
            "Upstream is a community engine, not the official rules. "
            "Counts/stats are cross-checked against the official rulebooks where "
            "they state them; per-card effect text is NOT available in the official "
            "sources we have and is represented only as structured effect notation."
        ),
    }


def file_payload(domain: str, items: list, provenance: dict, **extra) -> dict:
    payload = {
        "schema_version": SCHEMA_VERSION,
        "domain": domain,
        "count": len(items),
    }
    payload.update(extra)
    payload["provenance"] = provenance
    payload["items"] = items
    return payload


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--cache", type=Path, default=DEFAULT_CACHE)
    ap.add_argument("--no-fetch", action="store_true", help="use cached .rs files only")
    ap.add_argument("--data-dir", type=Path, default=DATA_DIR)
    ap.add_argument("--repin", action="store_true", help="re-resolve HEAD to a new commit instead of reusing the pinned one")
    args = ap.parse_args()

    data_dir = args.data_dir.resolve()
    data_dir.mkdir(parents=True, exist_ok=True)
    pin_path = data_dir / "upstream-pin.json"
    pinned_commit = None
    prev_pin: dict = {}
    if pin_path.exists() and not args.repin:
        try:
            prev_pin = json.loads(pin_path.read_text())
            pinned_commit = prev_pin.get("commit")
        except Exception:
            prev_pin = {}
    src_meta = fetch_sources(args.cache, args.no_fetch, pinned_commit, args.repin)
    # Keep the pin timestamp stable across regenerations of the same commit so
    # that generated files (and their manifest hashes) are deterministic.
    if prev_pin.get("commit") == src_meta.get("commit") and prev_pin.get("fetched_at"):
        src_meta["fetched_at"] = prev_pin["fetched_at"]
    src = {name: (args.cache / f"{name}.rs").read_text(encoding="utf-8") for name in MFILES}

    commit_short = (src_meta.get("commit") or "unknown")[:12]
    print(f"upstream {REPO}@{commit_short} ({'fetched' if not args.no_fetch else 'cache'})")

    heroes, std_deck = extract_heroes(src["heroes"], src_meta)
    cards = extract_cards(src["cards"], src_meta)
    basic = extract_basic_actions(cards)
    advanced = extract_advanced_actions(cards)
    spells = extract_spells(cards)
    artifacts = extract_artifacts(cards)
    enemies = extract_enemies(src["enemies"], src_meta)
    units = extract_units(src["units"], src_meta)
    skills = extract_skills(src["skills"], src_meta)
    tiles = extract_tiles(src["tiles"], src_meta)
    ruins = extract_ruins_tokens(src["ruins_tokens"], src_meta)
    thresholds, level_stats = extract_levels(src["levels"], src_meta)
    tactic_ids = extract_tactics(src["tactics"], src_meta)

    files = {
        "heroes": file_payload(
            "heroes",
            heroes,
            provenance_block(
                src_meta,
                "heroes",
                notes=(
                    "Starting decks and hero-specific replacements from upstream "
                    "heroes.rs. Four base-game heroes confirmed by MKUE Walkthrough p.5; "
                    "Wolfhawk/Krang/Braevalar are expansion heroes (Krang and Braevalar "
                    "are named in reference/extracted/MKUE_expansions_rulebook.txt; "
                    "Wolfhawk expansion attribution is community knowledge, "
                    "UNVERIFIED in our extracted sources)."
                ),
            ),
            standard_deck=std_deck,
            sources=["upstream-mk-data/heroes.rs", "MKUE Walkthrough p.5", "MKUE Rulebook p.3"],
        ),
        "basic-actions": file_payload(
            "basic_actions",
            basic,
            provenance_block(
                src_meta,
                "cards",
                notes=(
                    "Basic Action deck cards. Official: each hero deck has 16 cards "
                    "(MKUE Rulebook p.3); 12 shared card types plus hero-specific "
                    "replacements (MKUE Walkthrough p.4). Expansion attribution for "
                    "expansion-hero cards follows the hero sets."
                ),
            ),
            deck_composition={
                "standard_deck_types": 12,
                "unique_card_types": len(basic),
                "per_hero_deck_size": 16,
                "standard_deck": [f"basic:{c}" for c in std_deck],
            },
            sources=["upstream-mk-data/cards.rs", "MKUE Rulebook p.3", "MKUE Walkthrough p.4"],
        ),
        "advanced-actions": file_payload(
            "advanced_actions",
            advanced,
            provenance_block(
                src_meta,
                "cards",
                notes=(
                    "Upstream aggregates the Ultimate-Edition card pool; per-card "
                    "expansion attribution is not encoded there and the official "
                    "sources we have do not list card-by-card set membership. "
                    "Official count note: the 2012 rulebook scenario book refers to "
                    "the base Advanced Action deck by number ranges (16 used in the "
                    "first scenario, 12 more removed), and the UE walkthrough states "
                    "'There are 28 Advanced Action cards' (base game). Upstream ships "
                    "44 -> likely base 28 + Lost Legion 16, UNVERIFIED per card."
                ),
            ),
            sources=["upstream-mk-data/cards.rs", "MKUE Walkthrough p.4", "MK Base Rulebook 2012 p.15+ (scenario book)"],
        ),
        "spells": file_payload(
            "spells",
            spells,
            provenance_block(
                src_meta,
                "cards",
                notes=(
                    "Base-game Spell deck is numbered 1-20 (2012 rulebook refers to the "
                    "four competitive Spells as 17-20); upstream ships 24, consistent "
                    "with 20 base + 4 Lost Legion spells. Per-card set attribution "
                    "UNVERIFIED."
                ),
            ),
            sources=["upstream-mk-data/cards.rs", "MKUE Rulebook p.19", "MK Base Rulebook 2012 p.17"],
        ),
        "artifacts": file_payload(
            "artifacts",
            artifacts,
            provenance_block(
                src_meta,
                "cards",
                notes=(
                    "The official rulebooks we extracted do not state the base-game "
                    "Artifact count; upstream ships 25. Count/set UNVERIFIED against "
                    "physical components."
                ),
            ),
            sources=["upstream-mk-data/cards.rs"],
        ),
        "skills": file_payload(
            "skills",
            skills,
            provenance_block(
                src_meta,
                "skills",
                notes=(
                    "Upstream models 10 skills per hero (70 total, one stub with no "
                    "effect). Official: 11 Skill tokens per hero, of which the skill "
                    "not used in the current mode is removed (MKUE Walkthrough p.5; "
                    "MKUE Rulebook p.3). The 11th (missing) token is the non-selected "
                    "interactive skill; DISCREPANCY noted in game-data/README.md."
                ),
            ),
            per_hero_counts={h: sum(1 for s in skills if s["hero"] == h) for h in HERO_EXPANSION},
            sources=["upstream-mk-data/skills.rs", "MKUE Walkthrough p.5", "MKUE Rulebook p.3"],
        ),
        "units": file_payload(
            "units",
            units,
            provenance_block(
                src_meta,
                "units",
                notes=(
                    "Unit cards (regular + elite). Upstream blocks describe 'all base "
                    "game units' but include hero units used by scenarios and a few "
                    "expansion-flavoured units; per-unit set attribution UNVERIFIED."
                ),
            ),
            counts={
                "total": len(units),
                "hero_units": sum(1 for u in units if u["is_hero_unit"]),
                "regular_max_level2": sum(1 for u in units if (u["level"] or 0) <= 2 and not u["is_hero_unit"]),
                "elite_min_level3": sum(1 for u in units if (u["level"] or 0) >= 3),
            },
            sources=["upstream-mk-data/units.rs"],
        ),
        "enemies": file_payload(
            "enemies",
            enemies,
            provenance_block(
                src_meta,
                "enemies",
                notes=(
                    "Enemy tokens by pile colour. Upstream header says 'base game + "
                    "Lost Legion' but also contains enemies introduced in later "
                    "expansion rulebooks (e.g. Centaur Outriders, Elven Protectors, "
                    "Crystal Sprites appear in MKUE_expansions_rulebook.txt p.2). "
                    "Per-enemy set attribution UNVERIFIED; base-game piles are the "
                    "green/gray/brown/violet/white/red colours."
                ),
            ),
            colour_counts={c: sum(1 for e in enemies if e["color"] == c) for c in ["green", "gray", "brown", "violet", "white", "red"]},
            total_token_copies=sum(e["copies"] for e in enemies),
            sources=["upstream-mk-data/enemies.rs", "MKUE Rulebook p.3 (seven token piles)"],
        ),
        "ruins-tokens": file_payload(
            "ruins_token",
            ruins,
            provenance_block(
                src_meta,
                "ruins_tokens",
                notes=(
                    "15 ancient-ruins tokens: 5 altars (pay mana for fame) and 10 "
                    "enemy/reward tokens. Upstream claim; official Site Description "
                    "card text not available, see master reference sheet p.1."
                ),
            ),
            sources=["upstream-mk-data/ruins_tokens.rs", "MK Master Reference Sheet p.1"],
        ),
        "tiles": file_payload(
            "tiles",
            tiles,
            provenance_block(
                src_meta,
                "tiles",
                notes=(
                    "Hex layouts for starting tiles and the base-game countryside/core "
                    "tiles (11 countryside + 8 core confirmed by MKUE Walkthrough p.2). "
                    "Lost Legion tiles 12-14 / core 9-10 / Volkare tile are included and "
                    "tagged expansion=lost_legion."
                ),
            ),
            counts={
                "starting": sum(1 for t in tiles if t["tile_kind"] == "starting"),
                "countryside": sum(1 for t in tiles if t["tile_kind"] == "countryside"),
                "core_non_city": sum(1 for t in tiles if t["tile_kind"] == "core_non_city"),
                "core_city": sum(1 for t in tiles if t["tile_kind"] == "core_city"),
                "core_volkare": sum(1 for t in tiles if t["tile_kind"] == "core_volkare"),
            },
            sources=["upstream-mk-data/tiles.rs", "MKUE Walkthrough p.2"],
        ),
        "levels": file_payload(
            "levels",
            [
                {"op": "fame_threshold", "level": i + 1, "fame": f,
                 "mvp": True, "status": "placeholder"}
                for i, f in enumerate(thresholds)
            ],
            provenance_block(
                src_meta,
                "levels",
                notes=(
                    "Level-up fame thresholds and stat table. Rulebook confirms level "
                    "1-2 armor 2 / hand limit 5 (MKUE Rulebook p.3) and that odd levels "
                    "grant a Command token (p.3); full table is upstream-derived."
                ),
            ),
            level_stats=level_stats,
            sources=["upstream-mk-data/levels.rs", "MKUE Rulebook p.3"],
        ),
        "tactics": file_payload(
            "tactic_ids",
            [],
            provenance_block(
                src_meta,
                "tactics",
                notes=(
                    "Only the tactic ID lists are taken from upstream tactics.rs; "
                    "names/effects are hand-curated in game-data/tactics.json with "
                    "provenance to upstream docs/reference/tactics.md."
                ),
            ),
            ids=tactic_ids,
            sources=["upstream-mk-data/tactics.rs"],
        ),
    }

    # build the effect-op registry from everything that has effects
    ops = build_effect_ops(
        {"basic_actions": basic, "advanced_actions": advanced, "spells": spells, "artifacts": artifacts, "skills": skills, "units": units},
        {"commit": src_meta.get("commit")},
    )

    written = []
    for name, payload in files.items():
        if name == "tactics":
            continue  # tactics.json is hand-curated; ids are merged by the validator
        path = data_dir / f"{name}.json"
        json_write(path, payload)
        written.append((path, payload.get("count")))
    json_write(data_dir / "effect-ops.json", ops)
    written.append((data_dir / "effect-ops.json", ops["op_count"]))

    # machine-readable upstream pin (used by manifest/validator)
    pin = {
        "schema_version": SCHEMA_VERSION,
        "domain": "provenance",
        "repo": REPO,
        "commit": src_meta.get("commit"),
        "fetched_at": src_meta.get("fetched_at"),
        "files": src_meta["files"],
        "url": f"https://github.com/{REPO}/tree/{src_meta.get('commit') or PINNED_REF}",
    }
    json_write(data_dir / "upstream-pin.json", pin)
    written.append((data_dir / "upstream-pin.json", None))

    print("wrote:")
    for path, count in written:
        suffix = f" ({count} items)" if count is not None else ""
        print(f"  {path.relative_to(data_dir.parent)}{suffix}")
    print(f"  effect ops: {ops['op_count']} distinct, {ops['total_nodes']} nodes")
    return 0


if __name__ == "__main__":
    sys.exit(main())
