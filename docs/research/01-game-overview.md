# 01 · Game Overview — Mage Knight Board Game, and what Emberwold should be

**Status:** v1 (Lead) · **Sources:** see `08-sources.md`

This document answers: what game are we adapting, why is it worth adapting, what makes it
hard to adapt, and what exactly is the "scaled-down Emberwold" thesis. Rules details live
in `02-rules-core.md` / `03-rules-reference.md`; this is the context those docs sit in.

## 1. Fact sheet

| Item | Value |
|---|---|
| Title | **Mage Knight Board Game** (MK) |
| Designer | Vlaada Chvátil (design credit) |
| Illustrators | J. Lonnee, Milan Vavroň, Octographics.net (Raimo et al. = graphic design) |
| Publisher / IP owner | WizKids (NECA) |
| Released | November 2011 |
| Players | 1–4 (base); **1–5** in Ultimate Edition |
| Play time | 60–240 min depending on scenario |
| Age | 14+ |
| Genres | Strategy, tactics, "logic puzzle"; RPG + deckbuilding + board game hybrid |
| Modes | **Solo**, competitive, **co-operative** |
| Current definitive box | **Ultimate Edition (Dec 2018)** = base + Lost Legion + Krang + Shades of Tezla + 5 new cards |
| Later content | The Apocalypse Dragon expansion (Mar 2026), Dual Color Cards (2019) |
| Reception | Origins Hall of Fame 2019; BGG 2024 People's Choice #2 solo game (third year at #2); 2012 Golden Geek Most Thematic |
| Sibling | *Star Trek: Frontiers* (2016) reuses the MK system — evidence the engine generalises |

## 2. Why this game, and why it's a good adaptation candidate

**The fantasy.** You are a lone Mage Knight in a hostile, fog-of-war continent. You have a
hand of cards that is both your action economy *and* your character's body — playing a card
for its printed effect is powerful but narrow; playing it sideways gives a weak generic
effect. Every turn is a small optimisation puzzle: which 5 cards, in which order, boosted by
which mana, to move across which terrain, to assault which site before the round ends.

**Why it is beloved.** It delivers a genuine "sandbox of competence": the map reveals
progressively, enemies are plastic and legible, and the power curve (fame → levels → skills
→ advanced actions → spells/artifacts → units → city assaults) is one of the best in
board gaming. It is the consensus #2 solo board game.

**Why digital is attractive.** The game is famously **fiddly**: many tokens, mana dice,
decks, offers, enemy abilities, resistances, phase bookkeeping, and edge-case timing. A
computer can enforce all of it, teach the game, save/resume a 3-hour session, animate the
hex map, and let you play a real solo campaign on a phone. Almost every complaint about MK
is *bookkeeping*, not design.

**Why it is dangerous.** The same fiddliness is a rules-engine surface area problem: the
card pool is large, effects interact, and timing questions are numerous. And it is
IP-encumbered: the name, art and card text belong to WizKids. Both are analysed in
`06-legal-ip.md` and `12-architecture.md`.

## 3. The experience we must preserve (non-negotiables)

These are the load-bearing pillars; any "scaled-down" version that drops them stops being
Mage Knight:

1. **Cards are the character.** Hand management with dual-use cards (printed effect vs.
   sideway "1" effect) and the tension of whether to keep cards for combat.
2. **Fog-of-war hex exploration** with terrain that costs movement and sites that must be
   earned.
3. **The assault loop.** Reveal → approach → ranged/siege → block → attack → damage →
   reward; fortified sites and enemy resistances make ordering matter.
4. **The power curve.** Fame and levels buy skills and cards; the run must feel like
   growing from weak to city-cracking.
5. **Day/Night pressure.** A round is a clock; mana is colour-dependent on time of day, so
   planning spans turns.
6. **Meaningful choice density.** The game's whole identity is "a turn is a puzzle" — a
   version that auto-resolves turns is not this game.

## 4. The Emberwold thesis (what "scaled down" means)

Full MKUE is a 2–4 hour, **7-hero**, 3-expansion, ~60-tile experience (8 heroes if you count
Coral from the 2026 *Apocalypse Dragon* expansion). Emberwold keeps the
pillars and cuts breadth, not depth. Proposed v1 target:

| Axis | Full MKUE | Emberwold v1 |
|---|---|---|
| Players | 1–5 competitive/co-op | **1 (solo)** first; co-op later |
| Heroes | 7 in UE (8 incl. 2026 *Apocalypse Dragon*) | **2** (provisional: Arythea + Goldyx; Tovak is the alternate) |
| Map | 5–7 countryside tiles + cities, random | **fixed, hand-crafted 3–4 tile map** with authored site placement |
| Rounds | scenario-defined (3–6) | **3 rounds (Day/Night/Day)**, ~30–45 min |
| Cards | full pools | curated subset: core basic actions, ~12 advanced actions, ~6 spells, ~4 artifacts, ~6 units |
| Enemies | all tokens | curated ~12 enemies + 1 city garrison |
| Scenario | all | **one tuned "Conquer the City" solo scenario** |
| Combat | full | full phases, but no PvP |
| Progression | full skill trees | 2 heroes × 8 skills, 3 levels |
| Presentation | tabletop fidelity | **2D hex map + card UI**, animated, tutorialised |

The full rules are still researched and specified (`02`,`03`) because the engine must be
faithful underneath even when content is cut, and because v2/v3 restore content.

## 5. What already exists digitally (headline; detail in `05-digital-precedents.md`)

* **Tabletop Simulator / Vassal mods** — de facto digital versions; human-enforced rules,
  no engine, no AI, awkward online. TTS alone has ~21 Mage Knight mods with ≈276k lifetime
  subscriptions (top mod 161,894) — the demand signal (`05` §3).
* **Licensed-but-cancelled official attempt** — Dire Wolf Digital announced a WizKids digital
  deal in Jan 2019 with *Mage Knight* as the first title; it never shipped (`06` §5.3–5.4).
* **Open-source engine** `mage-knight-digital/MageKnight` (a.k.a. eshaffer321/MageKnight):
  Rust engine (6-crate workspace at first review, 8 crates later; ~2,100→~2,459 tests),
  React client, RL training harness, data modules for cards/enemies/units/skills/tiles/
  scenarios. Created Dec 2025, active as of Oct 2026, but **no licence declared** (all rights
  reserved by default) and 147 open issues. Strong evidence that the engine is buildable;
  not necessarily reusable code.
* **Smaller web/Haskell/Python remakes** — partial, mostly solo or simplified.
* No publicly released official digital adaptation of the board game exists (the 2006 PC/DS
  *Mage Knight* games are based on the miniatures line; the 2019 Dire Wolf licence produced
  nothing — ⚠️ absence of evidence, not proof of no plans).

**Implication:** technical feasibility is no longer speculative — it is demonstrated. The
real risks are *scope*, *content completeness*, *UX*, and *IP*.

## 6. Reading order for the rest of this repo

1. `02-rules-core.md` — the engine spec.
2. `03-rules-reference.md` — tables/content.
3. `04-faq-clarifications.md` — ambiguity register.
4. `05-digital-precedents.md`, `06-legal-ip.md`, `07-assets-art-inventory.md` — context/risk.
5. `10-feasibility-analysis.md` — verdict + risk register.
6. `11-mvp-scope.md`, `12-architecture.md`, `13-ai-opponents.md`, `14-roadmap.md` — the plan.

## Sources

- Wikipedia, *Mage Knight Board Game* — https://en.wikipedia.org/wiki/Mage_Knight_Board_Game
- WizKids, *Mage Knight: Ultimate Edition* product page — https://wizkids.com/mage-knight-ultimate-edition/ (1–5 players, 14+, components list: base + all three expansions + 5 new cards)
- WizKids, *Mage Knight* product page — https://wizkids.com/mage-knight/
- MKUE Rulebook (official PDF, `reference/rulebooks/MKUE_rulebook.pdf`)
- GitHub, `mage-knight-digital/MageKnight` README and repository metadata (retrieved 2026-10-24)
