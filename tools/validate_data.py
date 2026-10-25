#!/usr/bin/env python3
"""Validate the Miniknight game-data set.

Runs every check described in game-data/schema.md:

  1. manifest <-> filesystem/count/sha consistency
  2. file envelopes + item shapes + ID conventions
  3. enum vocabularies from keywords.json
  4. referential integrity (hero decks, tile sites, scenario tiles, ...)
  5. effect-DSL operations against the generated effect-ops registry
  6. official coverage counts recorded in manifest.official_counts
  7. effect-ops registry freshness (re-walk all effect trees)
  8. MVP markers / status fields against manifest.mvp_subset

Exit code 0 = all checks passed (warnings may exist), 1 = errors.

Usage:  .venv/bin/python tools/validate_data.py [--data-dir game-data]
"""

from __future__ import annotations

import argparse
import hashlib
import json
import sys
from collections import Counter
from pathlib import Path

SCHEMA_VERSION = "1.0.0"
REPO_ROOT = Path(__file__).resolve().parent.parent

ENUM_FIELDS = {
    "card_type": "card_types",
    "element": "elements",
    "attack_element": "elements",
    "combat_type": "combat_types",
    "terrain": "terrain",
    "site": "site_types",
    "recruit_sites": "recruit_sites",
    "mana_cost": "basic_mana_colors",
    "usage_type": "skill_usage_types",
    "phase_restriction": "skill_phase_restrictions",
    "tile_kind": "tile_kinds",
    "expansion": "expansions",
    "time_of_day": "time_of_day",
    "map_shape": "map_shapes",
    "rewards": "ruins_rewards",
    "kind": "ruins_token_kinds",
    "site_kind": "site_kinds",
    "status": "item_statuses",
    "rampaging": "rampaging_types",
}
# keys that can appear nested inside effects but are still enum-valued
EFFECT_ENUM_FIELDS = {
    "element": "elements",
    "combat_type": "combat_types",
    "terrain": "terrain",
    "mana_cost": "basic_mana_colors",
    "duration": "modifier_durations",
    "scope": "modifier_scopes",
}
ALLOWED_STATUSES = {"data-ready", "placeholder", "omitted"}
COVERAGE_STATUSES = {
    "complete",
    "complete_for_base",
    "complete_enough",
    "partial",
    "missing",
}

DOMAIN_PREFIX = {
    "heroes": "hero",
    "basic_actions": "basic",
    "advanced_actions": "advanced",
    "spells": "spell",
    "artifacts": "artifact",
    "skills": "skill",
    "units": "unit",
    "enemies": "enemy",
    "ruins_token": "ruins",
    "tiles": "tile",
    "sites": "site",
    "scenarios": "scenario",
    "tactics": "tactic",
    "levels": "level",
    "keywords": "kw",
}


class Report:
    def __init__(self) -> None:
        self.errors: list[str] = []
        self.warnings: list[str] = []
        self.sections: list[tuple[str, int, int]] = []  # name, checks, failures
        self._checks = 0
        self._fails = 0
        self._cur: tuple[str, int, int] | None = None

    def check(self, ok: bool, msg: str) -> bool:
        self._checks += 1
        if not ok:
            self._fails += 1
            self.errors.append(msg)
        return ok

    def warn(self, msg: str) -> None:
        self.warnings.append(msg)

    def begin(self, name: str) -> None:
        self.close()
        self._cur = (name, self._checks, self._fails)

    def close(self) -> None:
        if self._cur is not None:
            name, c0, f0 = self._cur
            self.sections.append((name, self._checks - c0, self._fails - f0))
            self._cur = None

    @property
    def n_checks(self) -> int:
        return self._checks

    @property
    def n_fails(self) -> int:
        return self._fails


def load_json(path: Path, rep: Report) -> dict | None:
    if not path.exists():
        rep.check(False, f"missing file: {path}")
        return None
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except json.JSONDecodeError as exc:
        rep.check(False, f"{path}: invalid JSON: {exc}")
        return None


def is_int(v) -> bool:
    return isinstance(v, int) and not isinstance(v, bool)


def check_effect_ops(node, ops: set[str], enums: dict, rep: Report, where: str) -> int:
    """Walk an effect tree; validate op vocabulary and enum-ish fields."""
    n = 0
    if isinstance(node, dict):
        if "op" not in node:
            rep.check(False, f"{where}: effect node without 'op': {str(node)[:80]}")
            return 1
        op = node["op"]
        if op not in ops:
            rep.check(False, f"{where}: unknown effect op '{op}'")
        for k, v in node.items():
            if k == "op":
                continue
            if isinstance(v, str) and k in EFFECT_ENUM_FIELDS:
                allowed = enums.get(EFFECT_ENUM_FIELDS[k], [])
                if allowed and v not in allowed:
                    rep.check(False, f"{where}: {op}.{k} value '{v}' not in {EFFECT_ENUM_FIELDS[k]}")
            n += 1 + check_effect_ops(v, ops, enums, rep, where)
    elif isinstance(node, list):
        for v in node:
            n += check_effect_ops(v, ops, enums, rep, where)
    return n


def gather_ops(node, counter: Counter) -> None:
    if isinstance(node, dict):
        if "op" in node:
            counter[node["op"]] += 1
        for v in node.values():
            gather_ops(v, counter)
    elif isinstance(node, list):
        for v in node:
            gather_ops(v, counter)


def main() -> int:
    ap = argparse.ArgumentParser(description="Validate Miniknight game data")
    ap.add_argument("--data-dir", type=Path, default=REPO_ROOT / "game-data")
    ap.add_argument("--quiet", action="store_true", help="only print the summary")
    args = ap.parse_args()
    data_dir: Path = args.data_dir
    rep = Report()

    # ------------------------------------------------------------------ load
    rep.begin("manifest")
    manifest = load_json(data_dir / "manifest.json", rep)
    if manifest is None:
        rep.close()
        print_report(rep, args)
        return 1
    rep.check(manifest.get("schema_version") == SCHEMA_VERSION, "manifest: bad schema_version")

    files_meta = {f["path"]: f for f in manifest.get("files", [])}
    loaded: dict[str, dict] = {}
    for path, meta in files_meta.items():
        p = REPO_ROOT / path
        if p.suffix == ".md":
            rep.check(p.exists(), f"manifest: missing doc {path}")
            continue
        doc = load_json(p, rep)
        if doc is not None:
            loaded[meta["domain"]] = doc
        rep.check(p.exists(), f"manifest: missing data file {path}")

    # -- count + sha consistency for JSON data files
    for path, meta in files_meta.items():
        p = REPO_ROOT / path
        if not p.exists() or p.suffix != ".json":
            continue
        raw = p.read_bytes()
        doc = loaded.get(meta["domain"])
        if doc is not None:
            rep.check(doc.get("schema_version") == SCHEMA_VERSION, f"{path}: bad schema_version")
            expected = doc.get("count")
            if expected is None and "op_count" in doc:
                expected = doc["op_count"]
            if meta.get("count") is not None and expected is not None:
                rep.check(
                    meta["count"] == expected,
                    f"{path}: manifest count {meta['count']} != file count {expected}",
                )
            if meta.get("count") is not None and "items" in doc:
                rep.check(
                    meta["count"] == len(doc["items"]),
                    f"{path}: manifest count {meta['count']} != len(items) {len(doc['items'])}",
                )
        if meta.get("sha256"):
            digest = hashlib.sha256(raw).hexdigest()[:16]
            rep.check(meta["sha256"] == digest, f"{path}: sha256 mismatch (data changed since manifest update)")

    # ------------------------------------------------------------------ enums
    rep.begin("enums/keywords")
    kw = loaded.get("keywords")
    if kw is None:
        rep.check(False, "keywords.json not loaded")
        rep.close()
        print_report(rep, args)
        return 1
    enums = kw.get("enums", {})
    required_enum_keys = {
        "elements", "mana_colors", "basic_mana_colors", "card_colors", "terrain",
        "site_types", "recruit_sites", "enemy_colors", "combat_types", "card_categories",
        "card_types", "time_of_day", "map_shapes", "tile_kinds", "expansions",
        "skill_usage_types", "skill_phase_restrictions", "powered_by",
        "rampaging_types", "ruins_token_kinds", "ruins_rewards", "site_kinds",
        "item_statuses", "modifier_durations", "modifier_scopes",
    }
    for key in sorted(required_enum_keys):
        rep.check(isinstance(enums.get(key), list) and enums[key], f"keywords.enums missing/empty: {key}")
    for key, values in enums.items():
        rep.check(len(values) == len(set(values)), f"keywords.enums.{key} has duplicates")
    keyword_ids = [k["id"] for k in kw.get("keywords", [])]
    rep.check(len(keyword_ids) == len(set(keyword_ids)), "keywords: duplicate keyword ids")
    rep.check(kw.get("count") == len(kw.get("keywords", [])), "keywords: count != len(keywords)")
    for k in kw.get("keywords", []):
        for field in ("id", "kind", "name", "short", "official_ref"):
            rep.check(field in k, f"keyword {k.get('id')}: missing {field}")
        rep.check(k.get("id", "").startswith("kw:"), f"keyword {k.get('id')}: id must start with kw:")
        rep.check(isinstance(k.get("short", ""), str) and len(k.get("short", "")) <= 220, f"keyword {k.get('id')}: 'short' too long (IP rule: keep paraphrases short)")
        rep.check(k.get("kind") in {
            "enemy_ability", "unit_resistance", "combat", "resource", "site",
        }, f"keyword {k.get('id')}: unknown kind {k.get('kind')}")
    ability_kw = {k["id"][3:] for k in kw["keywords"] if k["kind"] == "enemy_ability"}
    resist_kw = {k["id"][3:] for k in kw["keywords"] if k["kind"] == "unit_resistance"}
    rules_const = kw.get("rules_constants", {})
    rep.check(rules_const.get("deed_deck_size") == 16, "keywords.rules_constants.deed_deck_size must be 16")
    rep.check(rules_const.get("starting_hand_size") == 5, "keywords.rules_constants.starting_hand_size must be 5")

    # ------------------------------------------------------------------ items
    rep.begin("item shapes + enums")
    ops_registry = loaded.get("effect-ops")
    ops = {o["op"] for o in ops_registry.get("ops", [])} if ops_registry else set()
    rep.check(bool(ops), "effect-ops registry empty or missing")

    def check_enum_value(domain_key: str, value, where: str) -> None:
        enum_key = ENUM_FIELDS.get(domain_key)
        if not enum_key or value is None:
            return
        allowed = enums.get(enum_key, [])
        if isinstance(value, list):
            for v in value:
                rep.check(v in allowed, f"{where}: '{v}' not in enums.{enum_key}")
        else:
            rep.check(value in allowed, f"{where}: '{value}' not in enums.{enum_key}")

    ids_global: Counter = Counter()

    def check_common(it: dict, prefix: str, where: str) -> None:
        iid = it.get("id")
        rep.check(isinstance(iid, str) and iid.startswith(prefix + ":"), f"{where}: id '{iid}' must start with {prefix}:")
        if isinstance(iid, str):
            rep.check(len(iid.split(":", 1)[1]) > 0, f"{where}: empty slug in id {iid}")
            ids_global[iid] += 1
        rep.check("source" in it, f"{where}: missing source")
        rep.check("confidence" in it, f"{where}: missing confidence")
        if "mvp" in it:
            rep.check(isinstance(it["mvp"], bool), f"{where}: mvp must be boolean")
        if "status" in it:
            rep.check(it["status"] in ALLOWED_STATUSES, f"{where}: bad status {it['status']}")
        if "expansion" in it:
            rep.check(it["expansion"] in enums["expansions"], f"{where}: bad expansion {it['expansion']}")

    # heroes
    heroes_doc = loaded.get("heroes") or {"items": []}
    hero_ids = set()
    for h in heroes_doc.get("items", []):
        where = f"heroes/{h.get('id')}"
        check_common(h, "hero", where)
        hero_ids.add(h["id"])
        for field in ("name", "expansion", "starting_deck", "starting_crystals", "source", "confidence"):
            rep.check(field in h, f"{where}: missing {field}")
        deck = h.get("starting_deck", [])
        rep.check(len(deck) == 16, f"{where}: starting_deck must have 16 cards, has {len(deck)}")
        rep.check(h.get("deck_size") == 16, f"{where}: deck_size must be 16")
        rep.check(len(h.get("starting_crystals", [])) == 3, f"{where}: starting_crystals must have 3 entries")
        for c in h.get("starting_crystals", []):
            rep.check(c in enums["mana_colors"], f"{where}: bad crystal colour {c}")
        rep.check(h.get("starting_crystals_source") in {"official", "upstream-mk-data", None}, f"{where}: bad crystals source")

    # cards (all four files)
    card_ids: dict[str, set] = {}
    card_type_for_domain = {
        "basic_actions": "basic_action",
        "advanced_actions": "advanced_action",
        "spells": "spell",
        "artifacts": "artifact",
    }
    effect_nodes_total = 0
    for domain in card_type_for_domain:
        doc = loaded.get(domain) or {"items": []}
        card_ids[domain] = set()
        for c in doc.get("items", []):
            where = f"{domain}/{c.get('id')}"
            check_common(c, DOMAIN_PREFIX[domain], where)
            for field in ("name", "card_type", "color", "expansion", "powered_by", "sideways_value", "effects", "categories", "source", "confidence"):
                rep.check(field in c, f"{where}: missing {field}")
            rep.check(c.get("card_type") == card_type_for_domain[domain], f"{where}: card_type must be {card_type_for_domain[domain]}")
            check_enum_value("card_type", c.get("card_type"), where)
            rep.check(c.get("color") in enums["card_colors"], f"{where}: bad color {c.get('color')}")
            pb = c.get("powered_by")
            if pb is not None:
                allowed = set(enums["powered_by"])
                rep.check(pb in allowed, f"{where}: bad powered_by {pb}")
            rep.check(is_int(c.get("sideways_value")), f"{where}: sideways_value must be int")
            rep.check(isinstance(c.get("destroy_on_powered"), bool), f"{where}: destroy_on_powered must be bool")
            fx = c.get("effects") or {}
            rep.check(isinstance(fx, dict) and "basic" in fx and "powered" in fx, f"{where}: effects must have basic+powered")
            for mode in ("basic", "powered"):
                node = fx.get(mode)
                if node is not None:
                    effect_nodes_total += check_effect_ops(node, ops, enums, rep, f"{where}.{mode}")
            cats = c.get("categories") or {}
            for mode in ("basic", "powered"):
                for cat in cats.get(mode, []) or []:
                    rep.check(cat in enums["card_categories"], f"{where}: bad category {cat}")
            if domain == "basic_actions":
                rep.check(isinstance(c.get("in_standard_deck"), bool), f"{where}: missing in_standard_deck")
                if c.get("in_standard_deck"):
                    rep.check(c.get("powered_by") in set(enums["basic_mana_colors"]) | {"any_basic", None}, f"{where}: standard card powered_by odd")
            card_ids[domain].add(c["id"])

    # hero decks resolve + standard deck composition
    std = set(heroes_doc.get("standard_deck", []))
    if std:
        rep.check(len(std) == 12, "heroes: standard_deck must list 12 card types")
        for cid in std:
            rep.check(cid in card_ids["basic_actions"], f"heroes: standard_deck card {cid} missing from basic-actions")
    for h in heroes_doc.get("items", []):
        for cid in h.get("starting_deck", []):
            rep.check(cid in card_ids["basic_actions"], f"heroes/{h['id']}: deck card {cid} not in basic-actions")

    # skills
    skills_doc = loaded.get("skills") or {"items": []}
    skill_ids = set()
    for s in skills_doc.get("items", []):
        where = f"skills/{s.get('id')}"
        check_common(s, "skill", where)
        skill_ids.add(s["id"])
        rep.check(s.get("hero") in {h["id"][5:] for h in heroes_doc.get("items", [])}, f"{where}: unknown hero {s.get('hero')}")
        check_enum_value("usage_type", s.get("usage_type"), where)
        check_enum_value("phase_restriction", s.get("phase_restriction"), where)
        rep.check(isinstance(s.get("is_motivation"), bool), f"{where}: is_motivation must be bool")
        rep.check(isinstance(s.get("implemented"), bool), f"{where}: implemented must be bool")
        if s.get("effect") is not None:
            effect_nodes_total += check_effect_ops(s["effect"], ops, enums, rep, f"{where}.effect")
            rep.check(s.get("implemented") is True, f"{where}: has effect but implemented=false")
        else:
            rep.check(s.get("implemented") is False, f"{where}: no effect but implemented=true")
        rep.check(isinstance(s.get("name_derived"), bool), f"{where}: name_derived must be bool")

    # units
    units_doc = loaded.get("units") or {"items": []}
    unit_ids = set()
    for u in units_doc.get("items", []):
        where = f"units/{u.get('id')}"
        check_common(u, "unit", where)
        unit_ids.add(u["id"])
        for field in ("name", "level", "influence_cost", "armor", "copies"):
            rep.check(field in u, f"{where}: missing {field}")
        rep.check(is_int(u.get("level")) and 1 <= u["level"] <= 4, f"{where}: level must be 1-4")
        for rs in u.get("recruit_sites", []):
            rep.check(rs in enums["recruit_sites"], f"{where}: bad recruit site {rs}")
        rep.check(isinstance(u.get("abilities"), list), f"{where}: abilities must be a list")
        for slot in u.get("abilities", []):
            rep.check(isinstance(slot, dict) and "ability" in slot, f"{where}: bad ability slot")
            mc = slot.get("mana_cost")
            rep.check(mc is None or mc in enums["basic_mana_colors"], f"{where}: bad ability mana_cost {mc}")
            effect_nodes_total += check_effect_ops(slot["ability"], ops, enums, rep, f"{where}.ability")

    # enemies
    enemies_doc = loaded.get("enemies") or {"items": []}
    enemy_ids = set()
    colour_counter: Counter = Counter()
    for e in enemies_doc.get("items", []):
        where = f"enemies/{e.get('id')}"
        check_common(e, "enemy", where)
        enemy_ids.add(e["id"])
        rep.check(e.get("color") in enums["enemy_colors"], f"{where}: bad colour {e.get('color')}")
        colour_counter[e.get("color")] += 1
        for field in ("name", "attack", "armor", "fame", "copies"):
            rep.check(field in e, f"{where}: missing {field}")
        check_enum_value("element", e.get("attack_element"), where)
        for ab in e.get("abilities", []):
            rep.check(ab in ability_kw, f"{where}: unknown enemy ability keyword '{ab}' (add to keywords.json)")
        for r in e.get("resistances", []):
            rep.check({"physical": "physical_resistance", "fire": "fire_resistance", "ice": "ice_resistance"}.get(r) in resist_kw,
                      f"{where}: bad resistance {r}")
        if e.get("armor_elusive") is not None:
            rep.check(is_int(e["armor_elusive"]), f"{where}: armor_elusive must be int")
        if e.get("defend") is not None:
            rep.check(is_int(e["defend"]), f"{where}: defend must be int")
        if e.get("attacks") is not None:
            rep.check(isinstance(e["attacks"], list) and e["attacks"], f"{where}: attacks must be non-empty list")
            for atk in e["attacks"]:
                rep.check(isinstance(atk, dict) and "damage" in atk, f"{where}: bad attack entry")
                check_enum_value("element", atk.get("element"), where)
    if enemies_doc.get("colour_counts"):
        rep.check(dict(colour_counter) == enemies_doc["colour_counts"], "enemies: colour_counts stale")
    if enemies_doc.get("total_token_copies") is not None:
        rep.check(enemies_doc["total_token_copies"] == sum(e.get("copies", 0) for e in enemies_doc["items"]), "enemies: total_token_copies stale")

    # ruins tokens
    ruins_doc = loaded.get("ruins-tokens") or {"items": []}
    for r in ruins_doc.get("items", []):
        where = f"ruins/{r.get('id')}"
        check_common(r, "ruins", where)
        rep.check(r.get("kind") in enums["ruins_token_kinds"], f"{where}: bad kind {r.get('kind')}")
        if r.get("kind") == "altar":
            rep.check(is_int(r.get("fame")), f"{where}: altar fame must be int")
            for pair in r.get("cost", []):
                rep.check(isinstance(pair, list) and len(pair) == 2, f"{where}: altar cost must be [colour, amount]")
                rep.check(pair[0] in enums["basic_mana_colors"], f"{where}: bad altar colour {pair[0]}")
        else:
            for c in r.get("enemy_colors", []):
                rep.check(c in enums["enemy_colors"], f"{where}: bad enemy colour {c}")
            for reward in r.get("rewards", []):
                rep.check(reward in enums["ruins_rewards"], f"{where}: bad reward {reward}")

    # tiles
    tiles_doc = loaded.get("tiles") or {"items": []}
    site_doc = loaded.get("sites") or {"items": []}
    site_ids = {s["id"] for s in site_doc.get("items", [])}
    tile_ids = set()
    for t in tiles_doc.get("items", []):
        where = f"tiles/{t.get('id')}"
        check_common(t, "tile", where)
        tile_ids.add(t["id"])
        rep.check(t.get("tile_kind") in enums["tile_kinds"], f"{where}: bad tile_kind {t.get('tile_kind')}")
        hexes = t.get("hexes", [])
        rep.check(len(hexes) == 7, f"{where}: expected 7 hexes, got {len(hexes)}")
        rep.check(t.get("hex_count") == len(hexes), f"{where}: hex_count stale")
        seen = set()
        for hx in hexes:
            for coord in ("q", "r"):
                rep.check(is_int(hx.get(coord)), f"{where}: hex missing int {coord}")
            key = (hx.get("q"), hx.get("r"))
            rep.check(key not in seen, f"{where}: duplicate hex coordinate {key}")
            seen.add(key)
            rep.check(hx.get("terrain") in enums["terrain"], f"{where}: bad terrain {hx.get('terrain')}")
            site = hx.get("site")
            if site is not None:
                rep.check(f"site:{site}" in site_ids, f"{where}: site '{site}' not in sites.json")
            mc = hx.get("mine_color")
            if mc is not None:
                rep.check(mc in enums["basic_mana_colors"], f"{where}: bad mine_color {mc}")
                rep.check(site in {"mine", "deep_mine"}, f"{where}: mine_color on non-mine site {site}")
            for r in hx.get("rampaging", []) or []:
                rep.check(r in enums["rampaging_types"], f"{where}: bad rampaging type {r}")
        if tiles_doc.get("counts"):
            rep.check(dict(Counter(t["tile_kind"] for t in tiles_doc["items"])) == tiles_doc["counts"], "tiles: counts stale")

    # sites
    base_site_cards = [s for s in site_doc.get("items", []) if s.get("expansion") == "base" and s.get("id") != "site:portal"]
    rep.check(len(base_site_cards) == site_doc.get("base_site_count"), f"sites: base_site_count {site_doc.get('base_site_count')} != base entries {len(base_site_cards)}")
    rep.check(site_doc.get("base_site_count") == 14, "sites: official base Site Description card count is 14")
    for s in site_doc.get("items", []):
        where = f"sites/{s.get('id')}"
        check_common(s, "site", where)
        rep.check(s.get("site_kind") in enums["site_kinds"], f"{where}: bad site_kind {s.get('site_kind')}")
        for rs in s.get("recruit_sites", []):
            rep.check(rs in enums["recruit_sites"], f"{where}: bad recruit site {rs}")
        for gfield in ("garrison",):
            g = s.get(gfield)
            if g:
                rep.check(g.get("color") in enums["enemy_colors"], f"{where}: bad garrison colour {g.get('color')}")
        ec = s.get("entry_combat")
        if ec and ec.get("color") is not None:
            rep.check(ec.get("color") in enums["enemy_colors"], f"{where}: bad entry combat colour {ec.get('color')}")
        for flag in ("mvp", "status"):
            rep.check(flag in s, f"{where}: missing {flag}")
    mvp_site_types = set(site_doc.get("mvp_site_types", []))
    rep.check(mvp_site_types == {"village", "monastery", "keep", "mage_tower", "magical_glade", "mine"}, "sites: mvp_site_types must be the six MVP types")
    allowed_extra_mvp_sites = {"city", "portal"}
    for s in site_doc.get("items", []):
        suffix = s["id"][5:]
        expected_mvp = suffix in mvp_site_types or suffix in allowed_extra_mvp_sites
        rep.check(expected_mvp == bool(s.get("mvp")), f"sites/{s['id']}: mvp flag disagrees with mvp_site_types")

    # scenarios
    scen_doc = loaded.get("scenarios") or {"items": []}
    scen_ids = {s["id"] for s in scen_doc.get("items", [])}
    for pid in ("scenario:first-conquest", "scenario:classic"):
        rep.check(pid in scen_ids, f"scenarios: required MVP scenario {pid} missing")
    for s in scen_doc.get("items", []):
        where = f"scenarios/{s.get('id')}"
        check_common(s, "scenario", where)
        for field in ("name", "type", "players", "rounds", "map", "cities", "dummy_player", "end_condition", "mvp", "status"):
            rep.check(field in s, f"{where}: missing {field}")
        r = s.get("rounds", {})
        rep.check(r.get("total") == r.get("day", 0) + r.get("night", 0), f"{where}: rounds total != day+night")
        for shape in s.get("map", {}).get("shape", []):
            rep.check(shape in enums["map_shapes"], f"{where}: bad map shape {shape}")
        st = s.get("map", {}).get("starting_tile")
        rep.check(st in {"A", "B", None}, f"{where}: starting_tile must be A, B or null")
        for tid in s.get("map", {}).get("fixed_tiles") or []:
            rep.check(tid in tile_ids, f"{where}: fixed tile {tid} not in tiles.json")
        for entry in s.get("map", {}).get("fixed_tiles") or []:
            pass
    # official Solo Conquest parameter cross-check
    classic = next((s for s in scen_doc["items"] if s["id"] == "scenario:classic"), None)
    if classic:
        m = classic["map"]
        rep.check(classic["rounds"] == {"total": 6, "day": 3, "night": 3}, "scenario:classic: rounds must be 6 (3 day + 3 night)")
        rep.check(m.get("countryside") == [7], "scenario:classic: 7 countryside tiles")
        rep.check(m.get("core_city") == [2], "scenario:classic: 2 core city tiles")
        rep.check(m.get("core_non_city") == [2], "scenario:classic: 2 core non-city tiles")
        rep.check(classic["cities"] == {"count": 2, "levels": [5, 8]}, "scenario:classic: cities level 5 then 8")
        rep.check(classic.get("dummy_player") is True, "scenario:classic: dummy player required")
    fc = next((s for s in scen_doc["items"] if s["id"] == "scenario:first-conquest"), None)
    if fc:
        rep.check(fc["rounds"] == {"total": 3, "day": 2, "night": 1}, "scenario:first-conquest: 3 rounds (day/night/day)")
        rep.check(fc["cities"] == {"count": 1, "levels": [4]}, "scenario:first-conquest: 1 city level 4")
        rep.check(len(fc["map"].get("fixed_tiles") or []) == 4, "scenario:first-conquest: fixed 4 tiles")
        rep.check(fc["map"].get("layout_status") == "todo", "scenario:first-conquest: layout must be TODO until authored")

    # tactics
    tact_doc = loaded.get("tactics") or {"items": []}
    for t in tact_doc.get("items", []):
        where = f"tactics/{t.get('id')}"
        check_common(t, "tactic", where)
        rep.check(t.get("time_of_day") in enums["time_of_day"], f"{where}: bad time_of_day")
        rep.check(is_int(t.get("turn_order")) and 1 <= t["turn_order"] <= 6, f"{where}: turn_order must be 1-6")
        rep.check(isinstance(t.get("effect_summary"), str) and len(t["effect_summary"]) <= 200, f"{where}: effect_summary missing/too long")
        if t.get("effect") is not None:
            effect_nodes_total += check_effect_ops(t["effect"], ops, enums, rep, f"{where}.effect")
    day_orders = [t["turn_order"] for t in tact_doc.get("items", []) if t["time_of_day"] == "day"]
    night_orders = [t["turn_order"] for t in tact_doc.get("items", []) if t["time_of_day"] == "night"]
    rep.check(sorted(day_orders) == [1, 2, 3, 4, 5, 6], "tactics: day turn orders must be 1-6")
    rep.check(sorted(night_orders) == [1, 2, 3, 4, 5, 6], "tactics: night turn orders must be 1-6")
    rep.check(tact_doc.get("counts") == {"day": 6, "night": 6}, "tactics: counts must be day 6 / night 6")

    # levels
    levels_doc = loaded.get("levels") or {"items": []}
    fames = [x["fame"] for x in levels_doc.get("items", [])]
    rep.check(len(fames) == 10, "levels: need 10 fame thresholds")
    rep.check(fames == sorted(fames) and fames[0] == 0 and len(set(fames)) == 10, "levels: fame thresholds must be ascending, unique, starting at 0")
    stats = levels_doc.get("level_stats", [])
    covered = set()
    for st in stats:
        covered |= set(range(st["min_level"], st["max_level"] + 1))
        rep.check(st["min_level"] <= st["max_level"], "levels: bad min/max level range")
    rep.check(covered == set(range(1, 11)), "levels: level_stats must cover levels 1-10")

    # effect-ops registry shape
    if ops_registry:
        op_rows = ops_registry.get("ops", [])
        rep.check(ops_registry.get("op_count") == len(op_rows), "effect-ops: op_count stale")
        rep.check(len({o["op"] for o in op_rows}) == len(op_rows), "effect-ops: duplicate op entries")
        for o in op_rows:
            rep.check(o.get("used", 0) > 0, f"effect-ops: op {o['op']} has used == 0 (stale registry)")

    # globals
    dupes = [iid for iid, n in ids_global.items() if n > 1]
    # duplicate ids are allowed only between levels (level<N>) -- none expected
    rep.check(not dupes, f"global: duplicate ids across data set: {dupes[:10]}")

    # ------------------------------------------------------------- registry freshness
    rep.begin("effect-ops freshness")
    counter: Counter = Counter()
    for domain in ("basic_actions", "advanced_actions", "spells", "artifacts", "skills", "units"):
        for it in (loaded.get(domain) or {"items": []}).get("items", []):
            for key in ("effects", "effect", "abilities"):
                if key in it:
                    gather_ops(it[key], counter)
    if ops_registry:
        expected = {o["op"]: o["used"] for o in ops_registry["ops"]}
        rep.check(dict(counter) == expected, "effect-ops: registry used-counts do not match a fresh walk of the data (re-run extractor)")
        rep.check(effect_nodes_total > 0, "effect DSL: no effect nodes found at all")

    # ------------------------------------------------------------- manifest coverage
    rep.begin("manifest coverage")
    for domain, cov in manifest.get("coverage", {}).items():
        rep.check(cov.get("status") in COVERAGE_STATUSES, f"coverage.{domain}: bad status {cov.get('status')}")
        rep.check("evidence" in cov, f"coverage.{domain}: missing evidence")
    official_counts = {c["id"]: c for c in manifest.get("official_counts", [])}
    for required in (
        "deed_deck_size", "skills_per_hero", "countryside_tiles_base", "core_tiles_base",
        "site_description_cards", "tactics", "levels", "advanced_actions_base",
        "spells_base", "solo_conquest_rounds", "solo_conquest_countryside", "token_piles",
    ):
        rep.check(required in official_counts, f"manifest.official_counts missing {required}")
    rep.check(official_counts.get("deed_deck_size", {}).get("count") == 16, "official count: deed deck size must be 16")
    rep.check(official_counts.get("skills_per_hero", {}).get("count") == 11, "official count: skills per hero must be 11")
    rep.check(official_counts.get("countryside_tiles_base", {}).get("count") == 11, "official count: base countryside tiles must be 11")
    rep.check(official_counts.get("core_tiles_base", {}).get("count") == 8, "official count: base core tiles must be 8")
    rep.check(official_counts.get("site_description_cards", {}).get("count") == 14, "official count: base sites must be 14")
    rep.check(official_counts.get("tactics", {}).get("count") == 12, "official count: tactics must be 12")
    rep.check(official_counts.get("solo_conquest_rounds", {}).get("count") == 6, "official count: solo conquest rounds must be 6")
    rep.check(official_counts.get("solo_conquest_countryside", {}).get("count") == 7, "official count: solo conquest countryside must be 7")
    # verified counts vs data
    rep.check(len(heroes_doc.get("items", [])) == 7, "coverage: expected 7 heroes (4 base + 3 expansion)")
    rep.check(all(len(h["starting_deck"]) == 16 for h in heroes_doc.get("items", [])), "coverage: every hero deck must be 16 cards")
    rep.check(sum(1 for t in tiles_doc.get("items", []) if t["tile_kind"] == "countryside" and t.get("expansion") == "base") == 11, "coverage: 11 base countryside tiles")
    rep.check(sum(1 for t in tiles_doc.get("items", []) if t["tile_kind"] == "core_non_city" and t.get("expansion") == "base") == 4, "coverage: 4 base core non-city tiles")
    rep.check(sum(1 for t in tiles_doc.get("items", []) if t["tile_kind"] == "core_city") == 4, "coverage: 4 city tiles")
    rep.check(len(tact_doc.get("items", [])) == 12, "coverage: 12 tactics")
    rep.check(len(levels_doc.get("items", [])) == 10, "coverage: 10 levels")

    # ------------------------------------------------------------- MVP
    rep.begin("mvp markers")
    mvp_expected = manifest.get("mvp_subset", {}).get("counts", {})
    domain_for_key = {
        "heroes": "heroes",
        "basic_actions": "basic_actions",
        "skills": "skills",
        "advanced_actions": "advanced_actions",
        "spells": "spells",
        "artifacts": "artifacts",
        "units": "units",
        "enemies": "enemies",
        "sites": "sites",
        "tiles": "tiles",
        "ruins_tokens": "ruins_token",
    }
    for key, expected_n in mvp_expected.items():
        doc = loaded.get(domain_for_key.get(key, key)) or {"items": []}
        actual = sum(1 for it in doc.get("items", []) if it.get("mvp"))
        rep.check(actual == expected_n, f"mvp: {key} expected {expected_n} mvp items, found {actual}")
    for domain, doc in loaded.items():
        if "items" not in doc:
            continue
        for it in doc["items"]:
            rep.check("mvp" in it and isinstance(it["mvp"], bool), f"mvp: {it.get('id')} missing boolean mvp")
            rep.check("status" in it, f"mvp: {it.get('id')} missing status")
    mvp_scenarios = manifest.get("mvp_subset", {}).get("scenario", [])
    for sid in mvp_scenarios:
        rep.check(sid in scen_ids, f"mvp: scenario {sid} missing")
    for sid in mvp_scenarios:
        sc = next(s for s in scen_doc["items"] if s["id"] == sid)
        rep.check(sc.get("mvp") is True, f"mvp: scenario {sid} not marked mvp")
    mvp_sites = manifest.get("mvp_subset", {}).get("sites", [])
    for sid in mvp_sites:
        site = next((s for s in site_doc.get("items", []) if s["id"] == sid), None)
        rep.check(site is not None, f"mvp: site {sid} missing")
        if site:
            rep.check(site.get("mvp") is True, f"mvp: site {sid} not marked mvp")
            if sid.split(":", 1)[1] in site_doc.get("mvp_site_types", []):
                rep.check(site.get("status") == "data-ready", f"mvp: site {sid} should be data-ready")
    for tid in manifest.get("mvp_subset", {}).get("tiles", []):
        rep.check(tid in tile_ids, f"mvp: tile {tid} missing")

    # ------------------------------------------------------------- summary
    rep.close()
    print_report(rep, args)
    return 0 if not rep.errors else 1


def print_report(rep: Report, args) -> None:
    width = 34
    print("")
    print("Miniknight game-data validation")
    print("=" * 72)
    for name, checks, fails in rep.sections:
        if name.startswith("~"):
            continue
        status = "ok  " if fails == 0 else "FAIL"
        print(f"  [{status}] {name:<{width}} {checks:>4} checks" + ("" if fails == 0 else f", {fails} failure(s)"))
    print("-" * 72)
    total_fails = len(rep.errors)
    total_checks = rep.n_checks
    print(f"  checks: {total_checks}    errors: {total_fails}    warnings: {len(rep.warnings)}")
    if rep.warnings:
        print("\nWarnings (non-fatal):")
        for w in rep.warnings[:30]:
            print(f"  ! {w}")
        if len(rep.warnings) > 30:
            print(f"  ... and {len(rep.warnings) - 30} more")
    if rep.errors:
        print("\nErrors:")
        for e in rep.errors[:80]:
            print(f"  x {e}")
        if len(rep.errors) > 80:
            print(f"  ... and {len(rep.errors) - 80} more")
        print("\nRESULT: FAIL")
    else:
        print("\nRESULT: OK — all game-data files, references, effect ops and coverage counts are valid.")
    print("")


if __name__ == "__main__":
    sys.exit(main())
