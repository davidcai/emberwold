# Miniknight — Rules Reference Tables

**Status:** research draft · **Owner:** rules-analyst · **Last updated:** 2026-10-24
**Scope:** dense reference data for the MKUE rules engine: terrain/movement, map tiles,
sites, enemies, cards, heroes/skills, units, tactics, scenarios, expansion deltas, scoring.
Rules *procedures* live in `02-rules-core.md`; this file is the lookup companion.

**Source key**

| Tag | Source |
|---|---|
| `RB p.N` | MKUE Rulebook, PDF page N (`reference/extracted/MKUE_rulebook.txt`) |
| `WT p.N` | MKUE Game Walkthrough, PDF page N (`.../MKUE_walkthrough.txt`) |
| `SITE p.N` | Site Description card text, `MK_master_reference_sheet.txt` (2 pp.) |
| `SB p.N` | 2012 Scenario Book, bundled in base rulebook (`MK_base_rulebook_2012.txt`, pp.12–20) |
| `EXP p.N` | MKUE Expansions Rulebook (`MKUE_expansions_rulebook.txt`, pp.1–16) |
| `ENG†` | Secondary cross-check only: `mage-knight-digital/MageKnight` `mk-data` / `docs/reference` (accessed 2026-10-24). Never authoritative. |
| `UG†` | Secondary: UltraBoardGames transcription of the 2012 Walkthrough, `ultraboardgames.com/mage-knight/` (accessed 2026-10-24). |

⚠️ = unverified / scan-dependent. Anything marked `ENG†` or `UG†` needs verification against
physical components before shipping.

## Contents

A. [Terrain and movement](#a-terrain-and-movement)
B. [Map tiles](#b-map-tiles)
C. [Sites, cities, garrisons](#c-sites-cities-garrisons)
D. [Enemy tokens](#d-enemy-tokens)
E. [Card inventory](#e-card-inventory)
F. [Heroes and skills](#f-heroes-and-skills)
G. [Units](#g-units)
H. [Tactics](#h-tactics)
I. [Scenarios](#i-scenarios)
J. [Scoring](#j-scoring)
K. [Levels, fame, reputation, mana](#k-levels-fame-reputation-mana)
L. [Expansion deltas](#l-expansion-deltas)
M. [Component counts and setup numbers](#m-component-counts-and-setup-numbers)
N. [Sources](#sources)

---

## A. Terrain and movement

### A.1 Move costs

Read from the Day/Night board artwork (WT p.6; rulebook text RB p.7 §3):

| Terrain | Day | Night | Notes |
|---|---:|---:|---|
| Plains | 2 | 2 | — |
| Hills | 3 | 3 | — |
| Forest | 3 | **5** | only terrain besides desert with a night cost |
| Wasteland | 4 | 4 | — |
| Desert | 5 | **3** | easier at night (WT p.6) |
| Swamp | 5 | 5 | — |
| Lake | — | — | **X** = inaccessible |
| Mountain | — | — | **X** = inaccessible |
| City (any printed terrain) | 2 | 2 | "cost to move into a city is always 2" (RB p.7 §3a) |
| Hidden Valley location tile | 2 | 2 | SITE p.2 |
| Necropolis location tile | 2 | 2 | SITE p.2 |
| Graveyard location tile | terrain of covered space | " | SITE p.2; night rules apply on the tile |
| Wall (expansion) | +1 extra Move | " | "terrain discounts cannot negate this" (SITE p.2) |

* Moving always pays the cost of the space **entered** (WT p.8; RB p.7 §3).
* Explore a tile = **2 Move** (RB p.7 §5b).
* Move cost cannot be reduced below 0; cost reductions apply in any order (RB p.7 §7a).
* Effects that let you enter inaccessible terrain state the cost (e.g. mountains cost 5 via
  Secret Ways `ENG†`).

### A.2 Movement limits quick list

| Situation | Rule | Cite |
|---|---|---|
| Enter unconquered fortified site / opponent keep | movement ends, becomes assault | RB p.7 §4a |
| Enter space with rampaging enemy | not allowed until defeated | RB p.7 §4b |
| Provoke: move between two spaces both adjacent to same rampaging token | attacked, movement ends | RB p.7 §4c |
| Enter adventure site | allowed; may ignore enemies on it | RB p.7 §4d |
| Enter portal | allowed; figure removed at end of turn | RB p.7 §8d |
| Enter conquered city | allowed; figure on City card | RB p.7 §8d |
| Enter space with another hero | allowed; if you stop there = attack (or no action if PvP illegal) | RB p.7 §8a–e |
| End turn not on safe space | Forced Withdrawal, 1 Wound per space backtracked | RB p.11 §2 |
| Wall between spaces (expansion) | +1 Move to cross; combat/provoke effects | SITE p.2 |

### A.3 Map placement (exploration) constraints

| Tile type | Placement rule | Cite |
|---|---|---|
| Countryside (green) | adjacent to ≥2 tiles, or adjacent to a tile that borders ≥2 other tiles | RB p.7 §5e |
| Core (brown) | adjacent to ≥2 tiles | RB p.7 §5e |
| Replacement tile (deck exhausted) | adjacent to ≥3 tiles ("fill holes") | RB p.7 §5e |
| All | fixed corner-symbol connection + fixed orientation; never behind coastline | RB p.7 §5a, §5d |

---

## B. Map tiles

Base game inventory: **11 countryside (green back) + 8 core (brown back; 4 non-city + 4 city)
+ 2-sided starting tile**. `UG†`, and the rulebook implies it via "separate them into city and
non-city" (RB p.3); `ENG†` tile registry matches (11 countryside, 4 non-city core, 4 city core).
Lost Legion adds 3 countryside tiles (12–14), 2 non-city core tiles (9–10) and Volkare's camp
tile `ENG†` ⚠️ (verify physical expansion contents).

Even tile: 7 hexes (centre + 6). Content notation: `T/terrain`, `S:site`, `M:mine-colour`,
`R:rampaging enemy`. All base tiles are listed below (`ENG†` layout; exact art can vary — treat
hex-level layouts as verified against component photos before use).

### B.1 Starting tiles (portal in centre)

| Hex | A side | B side |
|---|---|---|
| Centre | Plains + **Portal** | Plains + **Portal** |
| N/W/S/E ring | NW Plains, NE Forest, W Lake, E Plains, SW Lake, SE Mountain | NE Forest, E Plains, SE Plains, SW Mountain, W Lake, NW Plains |
| Map shape | **Wedge** (also used for smaller maps) | **Fully open / open limited** (max 3/4/5 columns per scenario) |

### B.2 Countryside tiles (base game)

| Tile | Centre | Other hexes (terrain/site/mine/rampaging) |
|---|---|---|
| 1 | Forest + **Magical Glade** | NE Lake · E Plains+Village · SE Plains · SW Plains · W Forest · NW Forest + Orc Marauder |
| 2 | Hills | NE Forest+Magical Glade · E Plains+Village · SE Plains · SW Hills+Mine(green) · W Plains · NW Hills + Orc Marauder |
| 3 | Forest | NE Hills+Keep · E Hills · SE Hills+Mine(white) · SW Plains+Village · W Plains · NW Plains |
| 4 | Desert + **Mage Tower** | NE Desert · E Mountain · SE Plains+Village · SW Plains · W Hills + Orc Marauder · NW Desert |
| 5 | Lake | NE Plains+Monastery · E Plains + Orc Marauder · SE Hills+Mine(blue) · SW Forest · W Forest+Magical Glade · NW Forest |
| 6 | Hills + **Mine(red)** | NE Forest · E Plains · SE Forest + Orc Marauder · SW Hills · W Hills+Monster Den · NW Mountain |
| 7 | Swamp | NE Forest + Orc Marauder · E Forest+Magical Glade · SE Plains+Tomb · SW Plains · W Plains+Monastery · NW Lake |
| 8 | Swamp + Orc Marauder | NE Forest+Ancient Ruins · E Plains · SE Swamp+Village · SW Swamp · W Forest · NW Forest+Magical Glade |
| 9 | Mountain | NE Mountain · E Wasteland+Keep · SE Plains · SW Wasteland+Mage Tower · W Plains · NW Wasteland+Tomb |
| 10 | Mountain | NE Forest · E Plains · SE Hills+Ancient Ruins · SW Hills+Keep · W Hills · NW Hills+Monster Den |
| 11 | Plains + **Mage Tower** | NE Lake · E Lake · SE Hills + Orc Marauder · SW Lake · W Plains+Ancient Ruins · NW Hills |

### B.3 Core tiles (base game)

| Tile | Centre | Other hexes |
|---|---|---|
| Core 1 (non-city) | Desert + **Monastery** | NE Desert+Tomb · E Desert · SE Desert · SW Hills · W Hills+Spawning Grounds · NW Mountain |
| Core 2 (non-city) | Lake | NE Wasteland+Ancient Ruins · E Hills+Mine(green) · SE Swamp + Draconum · SW Swamp+Mage Tower · W Forest · NW Lake |
| Core 3 (non-city) | Wasteland | NE Wasteland+Ancient Ruins · E Hills+Mage Tower · SE Wasteland · SW Hills+Mine(white) · W Wasteland+Tomb · NW Mountain |
| Core 4 (non-city) | Mountain + Draconum | NE Hills · E Hills+Keep · SE Wasteland · SW Wasteland+Ancient Ruins · W Wasteland · NW Wasteland+Mine(blue) |
| Core 5 (**Green City**) | Plains + **City** | NE Swamp+Village · E Swamp + Orc Marauder · SE Swamp · SW Forest + Orc Marauder · W Lake · NW Forest+Magical Glade |
| Core 6 (**Blue City**) | Plains + **City** | NE Plains+Monastery · E Lake · SE Lake · SW Hills · W Mountain + Draconum · NW Forest |
| Core 7 (**White City**) | Plains + **City** | NE Plains · E Forest · SE Lake + Draconum · SW Lake · W Wasteland+Keep · NW Wasteland+Spawning Grounds |
| Core 8 (**Red City**) | Wasteland + **City** | NE Hills+Mine(red) · E Desert · SE Desert + Draconum · SW Wasteland · W Wasteland + Draconum · NW Desert+Ancient Ruins |

Notes:
* Cities always sit on the tile centre; the White city tile has a lake, Red desert+dragons
  (flavour reason for fixed city identities; RB p.16 Random Cities variant).
* Each countryside tile carries exactly one rampaging enemy space; core tiles carry 0–2
  (draconum on core, orcs on some countryside). This is how the map seeds its monsters.

### B.4 Lost Legion tiles (`ENG†` ⚠️)

| Tile | Contents summary |
|---|---|
| Countryside 12 | Plains centre + Orc; Monastery(E), Maze(SW), Refugee Camp(W), Wasteland(NE)+Hills/Mountain filler |
| Countryside 13 | Forest + **Mage Tower** centre; Hills + Orc (NE); Deep Mine(SE); Magical Glade(W); Lake(E) |
| Countryside 14 | Plains; Keep(NE); Maze(E); Village(SE); Deep Mine(W); Desert(NW) |
| Core 9 | Plains + Draconum; Mage Tower(NE); Refugee Camp(SE); Labyrinth(NW) |
| Core 10 | Wasteland; Labyrinth(E); Keep(W); Deep Mine(NW all 4 colours); 2× Orc Marauder |
| Volkare's Camp | Plains + **Volkare's Camp** centre; Village(SE); Draconum; Orc |

---

## C. Sites, cities, garrisons

Site rules below are the **canonical Site Description card text** (`SITE pp.1–2` = the
one-sheet reference) with rulebook cross-references. This is the table the engine's
site-interaction state machine should be coded from.

### C.1 Site taxonomy

| Class | Sites | Consequence |
|---|---|---|
| Fortified | Keep, Mage Tower, City | assault on entry; Rep −1; garrison fortified; movement ends |
| Inhabited | Village, Monastery, Keep, Mage Tower, conquered City, Refugee Camp | can be interacted with as action |
| Adventure | Ancient Ruins, Dungeon, Tomb, Monster Den, Spawning Grounds, (Maze/Labyrinth) | enter as action; combat/reward |
| Rampaging | Orc Marauders (green), Draconum (red) | provoke/challenge; Rep reward; block movement |
| Passive | Magical Glade, Crystal Mine, Deep Mine, Portal, Graveyard/Necropolis/Hidden Valley (location tiles) | movement/end-of-turn/start-of-turn effects |

### C.2 Site rules table

| Site | When revealed | While unconquered / visit rules | Action & reward |
|---|---|---|---|
| **Village** | — | Recruit Units with **village** icon; buy Healing 3 Inf/point; **Plunder** (once between your turns, not an action): Rep −1, draw 2 cards | Interaction |
| **Monastery** | Draw top AA card into **unit offer** (RB p.7 §5f) | Recruit monastery-icon Units; Healing 2 Inf/point; learn AA from unit offer for 6 Inf; **Burn** as action: Rep −3, draw random violet enemy, **Units cannot be used**, defeat → shield, monastery burned (empty space), Artifact at end of turn | Interaction or Burn |
| **Mage Tower** | Place violet token face down; revealed during Day when a player is adjacent | Assault (Rep −1, defender fortified) → shield; at end of turn choose 1 **Spell** reward; afterwards any player may recruit units and buy Spells here (7 Inf + 1 mana of spell colour) | Assault / interaction |
| **Keep** | Place grey token face down; revealed Day when adjacent | Assault (Rep −1, defenders fortified) → shield, you own it. Own keep: recruit keep-icon Units; if on/next to a keep you own, hand limit +**number of keeps you own anywhere** (RB p.11 §7b). Opponent keep: assault (Rep −1); if owner absent, random grey token garrison, half Fame (rounded up), replace owner's shield | Assault / interaction |
| **Monster Den** | — | Enter as action → draw **1 brown** enemy; if undefeated, leave face up (same enemy next time) | Defeat → shield + **2 random crystals** (gold → choose colour; black → 1 Fame instead) |
| **Spawning Grounds** | — | Enter as action → draw **2 brown** enemies; undefeated stay face up, defeated replaced by new face-down brown token | Defeat both → shield + **1 Artifact + 3 random crystals** (same roll rules) |
| **Dungeon** | — | Enter as action → reveal **1 brown** enemy; **Night rules apply; Units cannot be used**. Conquered dungeon may be re-entered to fight a random brown enemy (night, no Units) for Fame only | Defeat → shield + roll 1 die: gold/black → **Spell**, else **Artifact** |
| **Tomb** | — | Enter as action → draw **1 red Draconum**; **Night rules; Units cannot be used**. Conquered tomb re-enterable as random red enemy (night, no Units), Fame only | Defeat → shield + **1 Spell + 1 Artifact**; on failure discard the token |
| **Ancient Ruins** | Place yellow token face up by Day / face down by Night (face-down revealed at next Day round start or when entered) | Enter as action: token is either **altar** or **enemies** | **Altar**: pay 3 mana of shown colour → shield + **7 Fame**. **Enemies**: draw pictured enemies; undefeated remain and can be fought later; defeat last → shield + token reward |
| **Magical Glade** | — | End turn here: throw away 1 Wound from hand **or discard pile** (not healing; no Units; cannot combine). Start turn here: Day → **gold** mana token, Night → **black** mana token | passive |
| **Crystal Mine** | — | End turn here: gain 1 crystal of mine colour (nothing at 3) | passive |
| **Deep Mine** (EXP) | — | End turn here: choose and gain 1 crystal of one of the mine's colours | passive |
| **Portal** | — | Start of map; players may remove figure at end of turn; return next turn. Multi-occupancy, no combat | passive |
| **Refugee Camp** (EXP) | — | Recruit Units — count as any depicted site; Units needing "more advanced" sites cost more; for multi-site units choose cheapest option | Interaction |
| **Maze** (EXP) | — | Enter as action; choose 1 Ready unwounded Unit to accompany (only that Unit usable); choose path: pay 2/4/6 Move (**not from leftover Move points**); draw tan enemy; defeated → reward by price: 2 crystals of choice / Spell / Artifact; discard token either way; each path conquerable once | action |
| **Labyrinth** (EXP) | — | Same as maze but red Draconum enemy and **also gain 1 Advanced Action** in every case | action |
| **Graveyard / Necropolis / Hidden Valley location tiles** | Placed over a map space by scenarios | Night rules apply in Graveyard/Necropolis during Day; start-of-turn black mana at Night; movement cost per A.1; effects locked until liberated (scenario rule) | passive/scenario |
| **Walls** (EXP) | printed map feature | +1 Move to cross; combat across a wall treats target as fortified; assault across wall = defender double fortified; no provocation across a wall | map feature |
| **Volkare's Camp** (EXP) | — | Scenario-specific (Volkare scenarios not covered by UE rulebook) | ⚠️ unverified |

### C.3 Cities

**City combat bonuses** (City card upper half, RB p.10 §1):

| City | Bonus to all defenders |
|---|---|
| White | +1 Armor |
| Blue | +2 Attack if they have Ice or Fire Attack; +1 Attack if Cold Fire Attack |
| Red | physical-attack defenders gain **Brutal** |
| Green | physical-attack defenders gain **Poison** |

**City interaction options** (lower half, RB p.8 §4e):

| City | Purchase option |
|---|---|
| Red | Artifacts for **12 Influence** each (drawn at end of turn like a combat reward) |
| Blue | Spells as at a mage tower (7 Influence + 1 mana of the spell's colour) |
| White | Recruit Units of **all** types; pay **2 Influence** to add one Elite (gold) Unit card to the Unit offer |
| Green | Pay **6 Influence** for a card from the AA offer (replenish) or a random card from the top of the AA deck; put on top of deed deck |

**Conquest / leadership** (RB p.10): place one shield per enemy defeated on the City card, in
order; leader = most shields (ties → player whose shield is first). Leader keeps City card.
Visitors place their figure on the City card. Hand limit +1 in a city you have a shield in
(+2 if leader) (RB p.11 §7b). Interaction: +1 Influence per own shield there (RB p.8 §3a).

**Garrison composition by city colour and level** (`ENG†` ⚠️ — verify against City cards):
draw one enemy token of each listed colour.

| Level | Blue | Green | Red | White |
|---|---|---|---|---|
| 1 | Gray, Violet | Gray, Brown | White | White |
| 2 | Violet, Violet | Brown, Brown | Brown, Violet | Gray, White |
| 3 | Violet, White | Gray, Gray, Brown | Brown, White | White, White |
| 4 | Gray, Violet, White | Gray, Brown, White | Brown, Violet, Violet | Gray, Gray, White |
| 5 | Violet, Violet, White | Brown, Brown, White | Brown, Violet, White | Gray, White, White |
| 6 | Violet, White, White | Gray, Gray, Brown, White | Brown, Brown, Violet, Violet | Gray, Gray, Gray, White |
| 7 | Gray, Violet, Violet, White | Gray, Brown, Brown, White | Brown, Violet, Violet, White | Gray, Gray, White, White |
| 8 | Violet, Violet, White, White | Brown, Brown, White, White | Brown, Violet, White, White | Gray, White, White, White |
| 9 | Violet, White, White, White | Gray, Brown, Brown, Brown, White | Brown, Brown, Violet, Violet, White | Gray, Gray, Gray, White, White |
| 10 | Gray, Violet, Violet, White, White | Gray, Brown, Brown, White, White | Brown, Brown, Violet, White, White | Gray, Gray, White, White, White |
| 11 | Violet, Violet, White, White, White | Brown, Brown, White, White, White | Brown, Violet, White, White, White | Gray, White, White, White, White |

**City levels per scenario**: see §I. City figures are rotated to the scenario level; draw one
face-down enemy token per coloured circle on the figure base at reveal (RB p.7 §5g).

**Megapolis** (RB p.18): two adjacent city spaces treated as one city for assault; level split
(odd → left rounds up); garrisons combined; all defenders fortified and gain **both** city
bonuses; conquered → treated as one city with two spaces (move between them for city cost 2);
counts as **one** city for scoring.

### C.4 Ancient Ruins tokens (15 tokens)

5 altars + 10 enemy tokens `ENG†` (matches RB p.10 §2b reward list: Artifact / Spell / Advanced
Action / 4 crystals / Unit). ⚠️ Token-by-token composition must be verified against the 15
physical ruin tokens; `ENG†` gives:

| Type | Tokens |
|---|---|
| Altars | pay 3 blue / 3 green / 3 red / 3 white / **one of each basic colour** → 7 Fame + shield |
| Enemy tokens | mixed brown/green/grey/violet groupings with rewards: Artifact; Artifact+Unit; Spell+4 crystals; Artifact+Spell; Spell+Unit; 4 crystals; Unit; 3 enemies+Artifact; etc. |

---

## D. Enemy tokens

### D.1 Token categories (colour → role)

| Colour | Role | Base game? | Typical first appearance |
|---|---|---|---|
| **Green** | Marauding orcs (rampaging); basic dungeons/ruins | base (+ LL faction variants) | map rampaging spaces, brown-token draws for Orc Summoners |
| **Grey** | Keep garrisons; some city/ruin draws | base | keep reveal |
| **Brown** | Monsters: dungeons, monster dens, spawning grounds, summons | base | adventure sites / Summon |
| **Red** | Draconum (rampaging); tombs; ruins; cities | base | ruins/tomb/city draws |
| **Violet** | Mage-tower garrisons; city draws; monastery burn | base | mage tower reveal |
| **White** | City defenders (Altem/Delphana etc.) | base | high-level city garrisons |
| **Tan** | Maze enemy | LL expansion | Maze action |
| Green/Brown/Red with **faction icon** | Elementalist / Dark Crusader (Shades of Tezla) | EXP | faction scenarios |

Physical token counts (`ENG†` sum of `copies`): green **40**, grey **15**, brown **32**,
violet **14**, red **22**, white **20** = 143 basic tokens; `⚠️` exact physical counts differ
between base game and UE (LL adds faction tokens). Verify against component list before
implementing bag ratios.

### D.2 Enemy token stats (`ENG†` ⚠️ — verify against token faces)

Format: `name — Attack (element) / Armor / Fame / abilities / resistances / copies`.
Multiple-attack enemies show their attack list. Ability legend in D.3.

**Green (40 tokens)**

| Enemy | Atk | Armor | Fame | Abilities & resistances | # |
|---|---|---:|---:|---|---:|
| Diggers | 3 phys | 3 | 2 | Fortified | 2 |
| Prowlers | 4 phys | 3 | 2 | — | 2 |
| Cursed Hags | 3 phys | 5 | 3 | Poison | 2 |
| Wolf Riders | 3 phys | 4 | 3 | Swift | 2 |
| Ironclads | 4 phys | 3 | 4 | Brutal; Phys res | 2 |
| Orc Summoners | Summon | 4 | 4 | Summon | 2 |
| Centaur Outriders | 3 phys | 5 | 2 | Swift | 2 |
| Orc Skirmishers | 1+1 phys | 4 | 2 | multi-attack | 2 |
| Orc War Beasts | 3 phys | 5 | 3 | Unfortified, Brutal; Fire+Ice res | 2 |
| Orc Stonethrowers | 7 phys | 2 | 4 | Fortified, Cumbersome; Phys res | 2 |
| Orc Tracker | 4 phys | 3 (6 elusive) | 3 | Elusive, Assassination | 2 |
| Skeletal Warriors | 3 phys | 4 | 1 | Fire res | 2 |
| Shrouded Necromancers | Summon | 5 | 3 | Fortified, Summon (green) | 2 |
| Corrupted Priests | 4 cold fire | 5 | 3 | Defend 1 | 2 |
| Gibbering Ghouls | 4 phys | 4 | 2 | Vampiric | 2 |
| Elemental Priests | multi | 4 | 3 | Fire+Ice res; multi-attack | 2 |
| Elven Protectors | 3 phys | 4 | 2 | Defend 2; Fire res | 2 |
| Cloud Griffons | 4 phys | 4 (8 elusive) | 3 | Unfortified, Swift, Elusive | 2 |
| Crystal Sprites | multi (1 phys?) | 1 (2 elusive) | 1 | Elusive, Defend 1; Ice res | 2 |
| Zombie Horde | multi | 5 | 2 | Cumbersome; Ice res | 2 |

**Grey (15 tokens)**

| Enemy | Atk | Armor | Fame | Abilities & resistances | # |
|---|---|---:|---:|---|---:|
| Crossbowmen | 4 phys | 4 | 3 | Swift | 3 |
| Guardsmen | 3 phys | 7 | 3 | Fortified | 3 |
| Swordsmen | 6 phys | 5 | 4 | — | 2 |
| Golems | 2 phys | 5 | 4 | Phys res | 2 |
| Heroes | 5 phys | 4 | 5 | Fortified (engine data flags a Reputation modifier — verify) | 1 |
| Thugs | 3 phys | 5 | 2 | Brutal; Rep +1 (`repBonus` field) | 2 |
| Shocktroops | 5 phys | 3 (6 elusive) | 3 | Unfortified, Elusive | 2 |

**Brown (32 tokens)**

| Enemy | Atk | Armor | Fame | Abilities & resistances | # |
|---|---|---:|---:|---|---:|
| Air Elemental | 3 cold fire | 4 (8 elusive) | 4 | Swift, Elusive; Fire+Ice res | 2 |
| Minotaur | 5 phys | 5 | 4 | Brutal | 2 |
| Gargoyle | 5 phys | 4 | 4 | Phys res | 2 |
| Medusa | 6 phys | 4 | 5 | Paralyze | 2 |
| Crypt Worm | 6 phys | 6 | 5 | Fortified | 2 |
| Werewolf | 7 phys | 5 | 5 | Swift | 2 |
| Shadow | 4 cold fire | 4 (8 elusive) | 4 | Elusive, Arcane Immunity | 2 |
| Fire Elemental | 7 phys | 6 | 4 | Fire res | 2 |
| Earth Elemental | 4 phys | 5 | 4 | Fortified, Cumbersome, Brutal; Phys res | 2 |
| Mummy | 4 phys | 5 | 4 | Poison; Ice+Phys res | 2 |
| Hydra | 2+2+2 phys | 6 | 5 | multi-attack; Ice res | 2 |
| Manticore | 4 phys | 6 | 5 | Swift, Assassination, Poison; Fire res | 2 |
| Water Elemental | 6 phys | 7 | 4 | Ice res | 2 |
| Vampire | 5 phys | 5 (10 elusive) | 4 | Elusive, Vampiric | 2 |
| Blood Demon | 6 phys | 6 | 5 | Brutal, Assassination, Arcane Immunity; Fire res | 2 |
| Pain Wraith | 4 phys | 4 (8 elusive) | 3 | Elusive, Paralyze | 2 |

**Violet (14 tokens)**

| Enemy | Atk | Armor | Fame | Abilities & resistances | # |
|---|---|---:|---:|---|---:|
| Monks | 5 phys | 5 | 4 | Poison | 2 |
| Illusionists | Summon | 3 | 4 | Summon; Phys res | 2 |
| Ice Mages | 5 ice | 6 | 5 | Ice res | 2 |
| Fire Mages | 6 fire | 5 | 5 | Fire res | 2 |
| Ice Golems | 2 ice | 4 | 5 | Paralyze; Ice+Phys res | 1 |
| Fire Golems | 3 fire | 4 | 5 | Brutal; Fire+Phys res | 1 |
| Sorcerers | 6 phys | 6 | 5 | Assassination, Poison, Arcane Immunity | 2 |
| Magic Familiars | multi | 7 | 5 | Unfortified, Brutal | 2 |

**Red (22 tokens — Draconum)**

| Enemy | Atk | Armor | Fame | Abilities & resistances | # |
|---|---|---:|---:|---|---:|
| Swamp Dragon | 5 phys | 9 | 7 | Swift, Paralyze | 2 |
| Fire Dragon | 9 fire | 7 | 8 | Phys+Fire res | 2 |
| Ice Dragon | 6 ice | 7 | 8 | Paralyze; Phys+Ice res | 2 |
| High Dragon | 6 cold fire | 9 | 9 | Brutal; Fire+Ice res | 2 |
| Death Dragon | 7 phys | 9 | 6 | Assassination, Paralyze | 2 |
| Lava Dragon | 6 fire | 8 | 8 | Fortified, Brutal; Fire res | 2 |
| Savage Dragon | 5 phys | 7 | 6 | Brutal; Phys res | 2 |
| Dragon Summoner | Summon×2 | 8 | 9 | Arcane Immunity; Phys res | 2 |
| Lightning Dragon | 6 cold fire | 7 (14 elusive) | 7 | Elusive; Fire+Ice res | 2 |
| Vampire Dragon | 8 phys | 8 (16 elusive) | 7 | Elusive, Vampiric | 2 |
| Storm Dragon | 4 ice | 7 (14 elusive) | 7 | Elusive, Swift; Ice res | 2 |

**White (20 tokens — city defenders)**

| Enemy | Atk | Armor | Fame | Abilities & resistances | # |
|---|---|---:|---:|---|---:|
| Thugs | 6 phys | 5 | 5 | — | 2 |
| Shocktroops | 5 phys | 5 | 5 | Swift, Brutal | 2 |
| Freezers | 3 ice | 7 | 7 | Paralyze, Swift; Fire res | 3 |
| Gunners | 6 fire | 6 | 7 | Brutal; Ice res | 3 |
| Fire Catapult | 8 fire | 7 | 7 | Fortified, Cumbersome | 1 |
| Ice Catapult | 9 ice | 6 | 7 | Fortified, Cumbersome | 1 |
| Altem Guardsmen | 5 phys | 7 | 8 | Fortified; Phys+Fire+Ice res | 2 |
| Altem Mages | 4 cold fire | 8 | 8 | Brutal, Poison; Phys res | 2 |
| Delphana Masters | 5 cold fire | 8 | 9 | Assassination, Paralyze; Fire+Ice res | 2 |
| Grim Legionnaries | 11 phys | 10 | 8 | Unfortified, Arcane Immunity | 2 |

### D.3 Enemy ability glossary (RB p.24; EXP pp.2–4)

| Ability | Effect |
|---|---|
| **Fortified** | Only Siege Attacks in Ranged/Siege phase; if also at fortified site → untargetable in that phase |
| **Unfortified** | Ignores all site fortifications (summoned enemies have this) |
| **Physical/Fire/Ice Resistance** | Attacks of that element halved (total inefficient ÷2 floor); Fire res also ignores non-attack effects of red cards/red-mana unit abilities; Ice res ignores blue equivalents |
| **Both Fire and Ice Resistance** | Also halves Cold Fire attacks |
| **Swift** | Attack value counts **double** for blocking |
| **Brutal** | If unblocked, deals **double** damage |
| **Poison** | Unit wounded → 2 Wound cards; Hero takes extra Wound to discard per Wound taken to hand |
| **Paralyze** | Unit wounded → destroyed; Hero discards all non-Wound cards on taking Wounds |
| **Summon** | At Block phase start draw a brown enemy from same faction; replaces summoner in Block+Damage, then discarded; summoner back for Attack phase |
| **Assassination** | Unblocked damage must all go to Hero (Units can still help block) |
| **Cumbersome** | In Block phase spend Move points 1:1 to reduce one attack; reduced to 0 = blocked |
| **Vampiric** | Armor +1 for rest of combat per Unit wounded / Wound card added to a hand by its attacks |
| **Elusive** | Two Armor values (high/low): high in Ranged/Siege; in Attack phase use low only if all its attacks were blocked, else high for the rest of combat; modifiers apply to both |
| **Arcane Immunity** | Unaffected by non-Attack/Block effects (its attacks can still be reduced/prevented) |
| **Defend X** | First enemy you attack (Ranged or Attack phase) gets +X Armor until end of combat; with multiple Defend enemies, assign each to a different enemy, order chosen by the player; a Defend enemy defeated before its bonus is applied loses the bonus |
| **Multiple attacks** | Each attack blocked/damaged separately; "prevent attack" effects stop all; enemy "successfully blocked" only if all attacks blocked; attack bonuses apply to each attack separately |
| **Ambush** (EXP) | Can attack from up to 2 spaces away; provoke conditions differ; challenge still adjacent-only |
| **Pursuit** (EXP) | Marker-follows hero: moves 1 space toward hero after hero's movement; fights hero as action when adjacent; undefeated flips |

### D.4 Faction tokens (Shades of Tezla, EXP p.3)

* Green/brown/red enemy tokens may carry a **faction icon** (Elementalist / Dark Crusader).
  Defeating one gives a faction token (one-use minor item) from that faction's pile.
* Faction token uses: its printed one-use ability; or discard during interaction for **1 Fame
  or 3 Influence**; usable when knocked out like a skill; unused tokens = **1 Fame** each at
  final scoring.
* Option "Just Fame": play without faction tokens; each faction enemy gives +1 Fame instead.
* Enemy with Summon summons from **its own faction**.
* Random faction placement: roll mana die — Gold/Green/White = Elementalist; Black/Red/Blue =
  Dark Crusader (EXP p.2).

---

## E. Card inventory

Counts are the hardest data in this document: UE = base + Lost Legion + Krang + Shades of Tezla
("all expansions minus duplication, plus 5 new cards", WizKids UE product page). The extracted
rulebooks **do not print a card list**, so counts below combine the base-game component
transcription (`UG†`: 28 Advanced Actions, 4 heroes × 16 basic actions) with the cross-check
card definitions (`ENG†`). Treat every total as ⚠️ UNVERIFIED until checked against the actual
card stacks.

### E.1 Card types and totals

| Type | Base game | UE (all included) | Notes |
|---|---|---|---|
| Basic Action | 4 heroes × 16 = 64 physical (12 distinct standard names, 4 hero-specific replacements) | 7 heroes × 16 = 112 physical; **28 distinct + Wound** (`ENG†`) | every hero shares the same 16-card template; hero replacements listed F.2 |
| Advanced Action | **28** (`UG†`) | **43 distinct** (`ENG†`) | numbered 1–28 in base; UE renumbers (see references to spells 109–112 / 17–20 in EXP) |
| Spell | 20 (`UG†`; competitive ones numbered 17–20) | **24 distinct** (`ENG†`) | 4 "competitive" spells removed in solo/co-op (RB p.19) |
| Artifact | 24 (`UG†` ⚠️) | **25 distinct** (`ENG†`) | artifacts are never in an offer; drawn from deck |
| Unit | 15 Regular + 15 Elite = **30** (`UG†`/`ENG†` agree) | 30 | regular = silver backs, levels I–II; elite = gold, III–IV; some cards have 2 copies ("Heroes" units) |
| Wound | one identical card type | — | face-up pile, unlimited substitute |

`⚠️ CONFLICT`: expansion rulebook refers to "the four competitive Spells (numbered 17–20)" (base
numbering, EXP p.7) and "numbered 109–112" (UE numbering, RB p.19) for the same four spells.
The engine should key cards by stable IDs, not print numbers.

### E.1b How cards are obtained (the only "costs" that exist)

Cards other than Basic Actions are **not bought with Influence directly** — they come through
offers and site interactions, then go **on top of the deed deck** unless stated:

| Card type | Acquisition route | Cost |
|---|---|---|
| Advanced Action | Level-up (even level) | free (1 skill choice + 1 AA; see RB p.12 §6b) |
| Advanced Action | Monastery interaction (from the **unit offer**) | **6 Influence** (RB p.8 §4c) |
| Advanced Action | Green city interaction | **6 Influence** (offer or random top of AA deck) (RB p.8 §4e) |
| Advanced Action | Ruins / adventure-site / combat rewards | free reward |
| Spell | Mage tower interaction | **7 Influence + 1 mana of the spell's colour** (RB p.8 §4d) |
| Spell | Blue city interaction | same as mage tower (RB p.8 §4e) |
| Spell | Ruins / dungeon / tomb / combat rewards | free reward |
| Artifact | Red city interaction | **12 Influence** (drawn at end of turn like a combat reward) (RB p.8 §4e) |
| Artifact | Ruins / spawning grounds / monastery burn / combat rewards | free reward |
| Artifact | Artifact deck draw rule | draw n+1, 1 to bottom, rest on top of deck (RB p.11 §5b) |
| Unit | recruit at matching inhabited site | Unit's printed **Influence cost** (RB p.8 §4a) |
| Unit | combat reward | free; must have a free command token or disband (RB p.11 §5d) |
| Basic Action | never acquired; fixed starting deck | — |

`⚠️` Card **numbers** and any print-number→ID mapping are unverified; gives cards by stable IDs.

### E.2 Basic Action cards — standard 16 (+ hero replacements)

The card **effects are deliberately not transcribed here.** No extracted rulebook contains
card text, and transcribing effects from secondary sources risks inventing rules. Card effect
data is owned by `game-data/**` (data-extractor) and must be transcribed from card images.
This section fixes only the **identities and deck composition** so the engine can model decks.

Standard deck template — 16 cards, 12 distinct names (`ENG† heroes.rs STANDARD_DECK`):

| Card | Colour | Copies |
|---|---|---:|
| March | green | 2 |
| Swiftness | white | 2 |
| Stamina | blue | 2 |
| Rage | red | 2 |
| Determination | blue | 1 |
| Tranquility | green | 1 |
| Promise | white | 1 |
| Threaten | red | 1 |
| Crystallize | blue | 1 |
| Mana Draw | white | 1 |
| Concentration | green | 1 |
| Improvisation | red | 1 |

Basic Action deck facts that *are* in the rulebook:
* Every hero has 16 Basic Actions; all share one card back; the hero-specific card is treated
  as a normal Basic Action (RB p.3; `UG†`).
* Every Basic Action can be played for its basic effect, powered by 1 mana of its colour for
  its strong effect, or played sideways (RB p.4 DEED CARDS).
* The card colour is the colour needed for the strong effect (RB p.4 §3a).

### E.3 Advanced Actions (43 distinct — names only)

Red: Blood Rage · Intimidate · Blood Ritual · Counterattack · Fire Bolt · Into the Heat ·
Decompose · Ritual Attack · Maximal Effect · Blood of Ancients · Rush of Adrenaline.
Blue: Ice Bolt · Steady Tempo · Frost Bridge · Ice Shield · Temporal Portal · Shield Bash ·
Pure Magic · Crystal Mastery · Magic Talent · Spell Forge · Chilling Stare.
Green: Refreshing Walk · In Need · Crushing Bolt · Ambush · Path Finding · Mountain Lore ·
Regeneration · Force of Nature · Stout Resolve · Training · Power of Crystals.
White: Swift Bolt · Agility · Diplomacy · Song of Wind · Heroic Tale · Learning · Chivalry ·
Mana Storm · Peaceful Moment · Dodge and Weave.

Base-game numbering: cards 1–16 allowed in the first scenario, 17–28 used in later scenarios
(`UG†`). Cannot map numbers → names from available sources ⚠️.

### E.4 Spells (24 distinct — names only)

Red: Fireball · Flame Wall · Tremor · Mana Meltdown · Demolish · Burning Shield · Offering.
Blue: Snowstorm · Chill · Mist Form · Mana Claim · Space Bending · Mana Bolt.
Green: Restoration · Energy Flow · Underground Travel · Meditation.
White: Whirlwind · Expose · Cure · Call to Arms · Mind Read · Wings of Wind · Charm.

* Four **competitive** spells (hinder other players): **Mana Meltdown, Mana Claim, Mind Read,
  Energy Flow** — removed for solo/co-op scenarios (RB pp.16, 19; EXP pp.7–12). ⚠️ That
  removal list is given by name in RB p.16 and must be cross-checked with the four spell cards
  in the deck.
* Spell strong effect requires, at Night, colour mana **+ black** (RB p.4); at Day, gold mana
  can substitute for the colour.

### E.5 Artifacts (25 distinct — names only)

Rings: Ruby Ring · Sapphire Ring · Diamond Ring · Emerald Ring.
Banners: Banner of Command · Banner of Courage · Banner of Fortitude · Banner of Protection ·
Banner of Fear · Banner of Glory (Banner artifacts can be assigned to Units, RB p.5 §8).
Others: Endless Bag of Gold · Sword of Justice · Horn of Wrath · Bow of Starsdawn ·
Soul Harvester · Shield of the Fallen Kings · Amulet of the Sun · Amulet of Darkness ·
Golden Grail · Endless Gem Pouch · Book of Wisdom · Tome of All Spells · Circlet of
Proficiency · Druidic Staff · Mysterious Box.

* 6 banners (Courage/Fortitude/Protection/Fear/Glory/Command) + 19 non-banner artifacts = 25
  (`ENG†` list). Base game had 24 ⚠️ (one is expansion/new).
* Artifact acquisition: draw n+1, one to bottom, rest on top of deed deck (RB p.11 §5b).

---

## F. Heroes and skills

### F.1 Hero roster (7 in UE)

| Hero | Set | Starting crystals (Dummy only) | Notes |
|---|---|---|---|
| **Arythea** | base | red, red, white | dark/fire/wounds |
| **Tovak** | base | blue, red, white | physical/anti-magic |
| **Goldyx** | base | blue, blue, white | crystals/mana/siege |
| **Norowas** | base | green, green, white | leadership/units |
| **Wolfhawk** | Lost Legion | green, white, white | ranged/hunt |
| **Krang** | Krang character exp. | red, green, white | chaos/enemy manipulation |
| **Braevalar** | Shades of Tezla | green, blue, white | nature/terrain |

Starting crystals are only used by the **Dummy player** (RB p.15). Physical heroes start with
no crystals. Each hero has 11 skill tokens (10 usable after mode-based interactive-skill
removal) and its own 16-card basic deck (`ENG†`).

### F.2 Hero starting decks

All heroes: the standard 16 (`STANDARD_DECK` in `ENG†`) with these replacements (replace first
copy):

| Hero | Replaces | With |
|---|---|---|
| Arythea | 1× Rage, Mana Draw | **Battle Versatility** (red), **Mana Pull** (white) |
| Tovak | Determination, Improvisation | **Cold Toughness** (blue), **Instinct** (red) |
| Goldyx | Concentration, Crystallize | **Will Focus** (green), **Crystal Joy** (blue; powered by **any** basic colour) |
| Norowas | Promise, Tranquility | **Noble Manners** (white), **Rejuvenate** (green) |
| Wolfhawk | 1× Swiftness, 1× Stamina, Concentration | **Swift Reflexes** (white), **Tirelessness** (blue), **Axe Throw** (white) |
| Krang | 1× March, Threaten, 1× Rage | **Savage Harvesting** (green), **Ruthless Coercion** (red), **Battle Rage** (red) |
| Braevalar | 1× March, 1× Stamina | **One With The Land** (green), **Druidic Paths** (blue) |

### F.3 Skills per hero (10 each; `ENG†` reconstruction of Skill Description cards ⚠️)

Legend: T = once per turn · R = once per round (flip) · I = interactive/persistent · P =
passive. Skill texts are paraphrased from the cross-check reference (`ENG† docs/reference/
skills.md`, itself sourced from the Unofficial Mage Knight Wiki); treat wording as ⚠️ and
verify against the Skill Description cards before implementing exact numbers.

**Arythea:** Dark Paths (T: Move 1 day / 2 night) · Burning Power (T: Siege 1 or Fire Siege 1)
· Hot Swordsmanship (T: Attack 2 or Fire Attack 2) · Dark Negotiation (T: Influence 2 day /
3 night) · Dark Fire Magic (R: red crystal + red or black mana) · Power of Pain (T: play a
Wound sideways as 2; Wound to discard at end of turn) · Invocation (T: discard Wound → red/black
mana; discard card → white/green mana; must spend immediately) · Polarization (T: use one mana
as opposite colour) · Motivation (R: any player's turn, draw 2; if lowest Fame +1 red mana) ·
Healing Ritual (I: discard up to 2 Wounds; one goes to closest hero).

**Tovak:** Double Time (T: Move 2 day / 1 night) · Night Sharpshooting (T: Ranged 1 day /
2 night) · Cold Swordsmanship (T: Attack 2 or Ice Attack 2) · Shield Mastery (T: Block 3, or
Fire/Ice Block 2) · Resistance Break (T: enemy Armor −1 per resistance, min 1) · I Feel No
Pain (T: outside combat discard a Wound from hand, draw) · I Don't Give a Damn (T: one sideways
card gives +2/+3) · Who Needs Magic? (T: sideways bonus; if no Source die used this turn +3) ·
Motivation (R, +1 blue mana) · Mana Exploit (I: mark a mana colour; others take Wounds using
other colours).

**Goldyx:** Freezing Power (T: Siege 1 or Ice Siege 1) · Potion Making (R: Heal 2 outside
combat) · White/Green/Red Crystal Craft (R: blue crystal + matching mana token) · Glittering
Fortune (T: interaction Influence 1 per different crystal colour) · Flight (R: move to adjacent
space free, or 2 spaces for 2 Move; must end safe; does not provoke) · Universal Power (T: add
1 mana to a sideways card → +3, or +4 if same-colour Action/Spell) · Motivation (R, +1 green
mana) · Source Freeze (I: others cannot use their standard Source die; you gain a crystal of a
Source colour next turn).

**Norowas:** Forward March (T: Move 1 per Ready unwounded Unit, max 3) · Day Sharpshooting
(T: Ranged 2 day / 1 night) · Inspiration (R: Ready or Heal a Unit, not in combat) · Bright
Negotiation (T: Influence 3 day / 2 night) · Leaves in the Wind (R: green crystal + white
mana) · Whispers in the Treetops (R: white crystal + green mana) · Leadership (T: when
activating a Unit +3 Block / +2 Attack / +1 Ranged) · Bonds of Loyalty (P: acts as a Command
token; recruit discount −5; unit works where units normally cannot; cannot be disbanded) ·
Motivation (R, +1 white mana) · Prayer of Weather (I: your terrain costs −2 min 1; others +1
max 5 until your next turn).

**Wolfhawk:** Refreshing Bath (R: Heal 1 + blue crystal) · Refreshing Breeze (R: Heal 1 +
white crystal) · Hawk Eyes (T: Move 1; night explore −1; day reveal garrisons at distance 2) ·
On Her Own (T: Influence 1, or 3 if you recruit no Unit this turn) · Deadly Aim (T: +1 to an
Attack card in Ranged/Siege, +2 in Attack phase incl. sideways) · Know Your Prey (R: ignore
one enemy ability or remove one element from its attack; not vs Arcane Immunity) · Taunt
(T, Block phase: −1 enemy attack, or +2 enemy attack and −2 enemy Armor min 1) · Dueling
(T, Block phase: Block 1 and Attack 1 vs same enemy; +1 Fame if defeated without Unit
abilities) · Motivation (R, +1 Fame) · Wolf's Howl (I: one sideways card gives +4, +1 per
empty command token; others' Units −1 Attack/Block until your next turn).

**Krang:** Spirit Guides (T: Move 1 and may add +1 to a Block) · Battle Hardened (T: ignore
next 2 damage from one physical attack or 1 from non-physical) · Battle Frenzy (T: Attack 2,
flip for Attack 4; flips back when resting) · Shamanic Ritual (R: mana token of any colour;
may flip back as your action) · Regenerate (T: pay mana, discard Wound; if red mana or lowest
Fame also draw) · Arcane Disguise (T: Influence 2, or flip to ignore reputation this turn;
flip back by paying green) · Puppet Master (T: keep a defeated enemy token; discard it for
Attack at half its Attack / Block at half its Armor, elements transfer) · Master of Chaos
(T: rotate shield for Blue=Block 3, Green=Move 1, Black=Cold Fire Ranged 1, White=Influence 2,
Red=Attack 2, Gold=any) · Curse (T: enemy Attack −1 or Armor −1 min 1; not on fortified enemy
in Ranged/Siege phase) · Mana Enhancement (I: when spending basic mana gain a crystal, token
in centre; others may return it for the mana).

**Braevalar:** Elemental Resistance (T: ignore next 2 Fire/Ice damage or 1 other) · Feral
Allies (T: explore −1 Move; Attack 1 or reduce enemy attack 1) · Thunderstorm (R: green or
blue mana + green or white mana) · Lightning Storm (R: blue or green mana + blue or red mana)
· Beguile (T: Influence 3; 2 at fortified site; 4 at Magical Glade) · Forked Lightning
(T: Ranged Cold Fire 1 against up to 3 enemies) · Shapeshift (T: a fixed Move/Attack/Block
basic action gives the same amount as one of the other two; elements preserved) · Secret Ways
(T: Move 1; may enter mountains for 5 Move (safe space); pay blue to enter lakes for 2 Move
(safe at end of turn)) · Regenerate (as Krang) · Nature's Vengeance (I: reduce enemy attack 1
and give it Cumbersome; other enemies +1 attack in Block phase until your next turn).

Skill types by symbol (RB p.5 §4): flip-arrow = once per round; centre-of-table = persistent
until your next turn; no symbol = once per turn. **Motivation** is the only skill usable on
other players' turns (RB p.5 §4a).

---

## G. Units

30 Unit cards (15 Regular silver I–II, 15 Elite gold III–IV). Costs are Influence. `ENG†`
reconstruction ⚠️ verify ability numbers against cards. Icons: attack/block/move/heal/
influence/mana; site icons = recruiting locations.

### G.1 Regular Units (levels I–II)

| Unit | Cost | Lvl | Armor | Abilities |
|---|---:|---:|---:|---|
| Peasants | 4 | I | 3 | Attack 2 / Block 2 |
| Foresters | 5 | I | 3 | Move 2 / Attack or Block 2 |
| Herbalists | 3 | I | 2 | Heal 2 / Ready another Unit of level ≤ II |
| Illusionists | 5 | I | 2 | target enemy does not attack this combat / one enemy −3 Armor (min 1) |
| Magic Familiars | 4 | I | 2 | gain 1 mana token of any basic colour / use basic effect of a Spell in the offer |
| Northern Monks | 6 | II | 3 | Attack 3 (+1 Rep if it destroys an enemy) / Ice Block 4 |
| Red Cape Monks | 6 | II | 3 | Attack 3 / Fire Block 4 |
| Guardian Golems | 7 | II | 4 | Block 3 (Phys res) / Attack 2 (Phys res) |
| Savage Monks | 7 | II | 4 | Attack or Block 3 / Siege Attack 4 |
| Scouts | 4 | I | 2 | Siege Attack 1 (+peek token, +1 Fame if defeated this turn) / Move 2 (reveal tile at distance 2) |
| Shocktroops | 6 | II | 3 | Ranged Attack 1 (+1 Attack to all your other Units this turn) / enemy Armor & one attack −1 / reduce one enemy attack by 3 with damage to this Unit first |
| Thugs | 5 | I | 5 | Block 3 / Attack 3 & Rep −1 / Influence 4 & Rep −1 (cannot take damage unless you pay 2 Influence) |
| Utem Crossbowmen | 6 | II | 4 | Attack or Block 3 / Ranged Attack 2 |
| Utem Guardsmen | 5 | II | 5 | Attack 2 / Block 4 (counts double vs Swift) |
| Utem Swordsmen | 6 | II | 4 | Attack or Block 3 / Attack or Block 6 (Unit becomes Wounded) |

### G.2 Elite Units (levels III–IV)

| Unit | Cost | Lvl | Armor | Resistances | Abilities |
|---|---:|---:|---:|---|---|
| Altem Guardians | 11 | IV | 7 | — | Attack 5 / Block 8 (double vs Swift) / all your Units gain all resistances this turn |
| Altem Mages | 12 | IV | 5 | Fire, Ice | gain 2 mana tokens of any colours / Cold Fire Attack or Block 5 (pay blue/red → 7, both → 9) / make all your attacks Cold Fire, or all Siege |
| Amotep Freezers | 8 | III | 6 | Ice | Attack or Block 5 / target enemy does not attack and gets Armor −3 (min 1) |
| Amotep Gunners | 8 | III | 6 | Fire | Attack or Block 5 / Ranged Fire Attack 6 |
| Catapults | 9 | III | 4 | — | Siege Attack 3 / Siege Fire 5 / Siege Ice 5 |
| Delphana Masters | 13 | IV | 3 | Fire, Ice, Phys | multi-ability activation: target doesn't attack / destroyed if blocked / Armor −5 / loses fortifications & resistances |
| Fire Golems | 8 | III | 4 | Fire, Phys | Attack or Block 3 / Ranged Fire Attack 4 |
| Fire Mages | 9 | III | 3 | Fire | Ranged Fire 3 / (red mana) Fire Attack or Block 6 / red mana token + red crystal |
| Heroes (4 variants) | 9 ×2 | III | 3–6 | Ice / Fire / — / — | pay 2 Influence to activate during assault or attack on another player; Attack or Block 5; variant ability (Cold Fire Block 8 / Cold Fire Attack 6 / Heal 4 / Ranged Attack 7); Influence 5 (+1 Rep if used in interaction) |
| Ice Golems | 8 | III | 4 | Ice, Phys | Attack or Block 3 / Ice Attack 6 |
| Ice Mages | 9 | III | 4 | Ice | Ice Attack or Block 4 / Siege Ice Attack 4 / blue mana token + blue crystal |
| Sorcerers | 9 | III | 4 | Fire, Ice | Ranged Attack 3 / enemy loses fortifications + Ranged 3 / enemy loses resistances + Ranged 3 |

Notes: "Heroes" units are four distinct cards with 2 copies each (08–11 in `ENG†`); unit
card back means nothing once in play (RB p.5 §1). Elite units are only added to the offer once
a Core tile is revealed (RB p.4 §2c).

---

## H. Tactics

6 Day + 6 Night Tactic cards; **Tactic number = turn order** in the round (lowest first)
(RB p.4 §3c). Names and order confirmed by the base rulebook setup photo (p.2: Early Bird 1 … The Right
Moment 6) and the `ENG†` tactic ID list; Night names from `ENG†` (⚠️ verify card faces).

| # | Day Tactic | Night Tactic |
|---|---|---|
| 1 | Early Bird | From the Dusk |
| 2 | Rethink | Long Night |
| 3 | Mana Steal | Mana Search |
| 4 | Planning | Midnight Meditation |
| 5 | Great Start | Preparation |
| 6 | The Right Moment | Sparing Power |

Known individual effects from the rulebook text:
* **Planning** (Day 4): increases hand limit the next time you draw (RB pp.4, 11).
* **Long Night** (Night 2): may reshuffle discard pile into deed deck when drawing (RB p.11 §7d).

`⚠️ GAP: the Tactic card texts are not in any extracted source.` Effects and "when you take
this Tactic" instructions (e.g. Mana Steal, Midnight Meditation) must be captured from card
images before implementation — assign to data-extractor. `ENG†` has only IDs, not effects.

---

## I. Scenarios

Two authorities: UE rulebook summaries (RB pp.18–22, 2018) and the complete 2012 Scenario Book
(SB pp.15–20 / base rulebook pp.12–20, 2012). Setup numbers match between them where both
cover a scenario. Scenario book is the authority for procedure; flag any difference with ⚠️.

### I.1 Scenario overview table

| Scenario | Players | Type | Rounds (Day/Night) | Map shape | Countryside | Core non-city | Core city | Cities level |
|---|---|---|---:|---|---:|---:|---:|---|
| **The First Reconnaissance** | 2–4 (+solo) | slightly competitive, tutorial | 3 (2D 1N) | Wedge, no limits | 8/9/11 | 2 | 1 | cities cannot be conquered or entered |
| **Solo Conquest** | 1 | solo | 6 (3D 3N) | Wedge | 7 | 2 | 2 | 1st = 5, 2nd = 8 |
| **Full Conquest** | 2–4 | competitive, standard | 6 (3D 3N) | Wedge (2–3p) / Fully Open (4p) | 8/9/11 | 1/2/3 (players−1) | 2/3/4 (=players) | each 4 |
| **Blitz Conquest** | 2–4 | competitive | 4 (2D 2N) | Wedge (2–3p) / Open 4 cols (4p) | 6/7/9 | 1/2/3 (players−1) | 2/3/4 (=players) | each 3 |
| **Full Cooperation** | 2–3 | co-op, standard | 6 (3D 3N) | Fully open | 8/10 | 2/3 | 3/4 (players+1) | 5, …, final 8 (2p) / 11 (3p) |
| **Blitz Cooperation** | 2–3 | co-op | 4 (2D 2N) | (Full Cooperation setup) | 7/8 | 1/2 | 2/3 (=players) | 5 and 8 (2p) / 5, 8, 11 (3p) |
| **Mines Liberation** | 2–4 | competitive | 4 (2D 2N) | Wedge / Open 4 | 8/9/11 (only tiles with mines) | 1/2/3 | 1 (Red city, friendly) | friendly, no leader |
| **Dungeon Lords** | 2–4 | competitive | 5 (3D 2N) | Wedge / Open 4 | 8/9/11 (only tiles with dungeons) | 1/2/3 (incl. desert/monastery/tomb tile) | 1 (Blue city, friendly) | friendly, no leader |
| **Druid Nights** | 2–4 | slightly competitive | 4 (2D 2N) | Wedge / Open 4 | 8/9/11 (only glades) | 1/2/3 (players−1) | 1 (Green city, friendly) | friendly, no leader |
| **One to Return** | 2–4 | very competitive (last man standing) | 4 (2D 2N) | Wedge or agreed | 7/8/10 | 1/2/3 (players−1) | 1/2/3 (players−1) | each 3 |
| **Conquer and Hold** | 2 or 4 (teams) / 3 optional | very competitive (VP control) | 4 (4p) / 6 (2p) | predefined | 5 (forts/towers) | 3 (forts/towers) | 1 (White city, closed) | closed, not enterable |
| **Life and Death** (EXP) | 2–4 / coop / solo | competitive / coop / solo | 6 (3D 3N) | Wedge / Fully Open | 7/9/11 (3–5 glades) | 1–3 / 2–4 | 3 (Green+Red+one friendly) | leaders level = #players+2 (comp) / 2×players+4 (coop) / 6 (solo) |
| **The Realm of the Dead** (EXP) | 2–4 / coop / solo | competitive / coop / solo | 4 (2D 2N) | Wedge / Fully Open | 5/7/9 (2–4 glades) | 2–4 | 2 (Blue + Green friendly) | necromancer level = #players+3 / 2×players+4 / 4 |
| **The Hidden Valley** (EXP) | 2–4 / coop / solo | competitive / coop / solo | 4 (2D 2N) | Wedge / Fully Open | 5/7/9 | 2–4 | 2 (White + Green friendly) | high priestess level = #players+3 / 2×players+4 / 4 |
| **The Lost Relic** (EXP) | 2–4 / coop / solo | competitive / coop / solo | 2 (1D 1N) | Open limited 3/4, Fully Open | 6/7/8/9/6 | 1/2/3 | 2/3/4 city tiles (destroyed cities) | no cities; destroyed-city rules |

Numbers are per player count in the order given (2p/3p/4p). Sources: RB pp.18–22 (UE
summaries), SB pp.15–20 (2012 full text), EXP pp.6–13 (expansion scenarios).

### I.2 Scenario special rules (short form)

| Scenario | Special rules | End | Scoring |
|---|---|---|---|
| First Reconnaissance | +1 Fame per tile revealed; no PvP (unless agreed); no Elite Units; don't reveal Spells/AA until needed | when a player reveals a city, all players one last turn; game ends immediately if round ends | standard Achievements, most Fame wins, ties shared |
| Solo Conquest | Dummy player; Tactics: you choose first, Dummy random; remove both used Tactic cards at end of each day/night; remove 4 competitive spells + 1 interactive skill | all cities conquered → one last turn (no Dummy turn) | Fame + Achievements (no titles) + 10/city + 15 all cities + 30/round saved + 1 per Dummy deck card + 5 if End of Round not announced |
| Full Conquest | standard | all cities conquered → everyone one last turn; game ends immediately if round ends | Achievements + cities (7 leader / 4 participant / +5 Greatest City Conqueror, +2 if tied) |
| Blitz Conquest | start 1 Fame, +1 bonus whenever crossing a line; start +2 Reputation; one extra die + one extra Unit in offer | as Full Conquest | Achievements + cities |
| Full Cooperation | Dummy player takes random Tactic first; remove one used player Tactic each day/night (not last); Team Rules (all one team) | all cities conquered → all but Dummy one last turn | team: lowest Fame base; best per achievement category; no titles; 10/city + 10 every player leader of ≥1 city + 15 all cities + 30/round saved + Dummy cards + 5 |
| Blitz Cooperation | as Full Cooperation + start 1 Fame/+1 per line, +2 Rep, extra die/unit | as Full Cooperation | as Full Cooperation with Blitz numbers |
| Mines Liberation | mines guarded by green/red + brown token; fight both, night rules as dungeon but Units allowed; liberate → +1 Rep (+2 core); each player gains crystal from every mine they own at each day/night start | all tiles revealed + all mines liberated → one last turn | Achievements + 4 Fame per countryside mine / 7 per core mine + Greatest Liberator +5 |
| Dungeon Lords | village reveal → secret dungeon entrance; monastery reveal → secret tomb; conquered dungeons/tombs connected (travel 2 Move + 1/space, avoid lakes/swamps) | all tiles revealed + all dungeons/tombs conquered → one last turn | Achievements; dungeons/tombs worth 4 (not 2); Greatest Dungeon Crawler +5 (+2 shared) |
| Druid Nights | activate glades by ending movement there (shield); incantation once during each Night as action (not at inhabited space): summon 1 brown (night 1) / red (night 2) per marked glade, double Fame for defeats, crystals per summon; shields removed after night 1 | all players performed 2nd-night incantation (each one more turn) or end of 2nd night | standard Achievements; most Fame |
| One to Return | portal closes end of Day 1; only player on portal at end wins; no scoring, Fame irrelevant | end of 2nd Night: player on portal wins | none (winner only) |
| Conquer and Hold | keeps/towers worth VP; no Rep loss for assaulting keeps/towers; mage towers act like keeps (no spell reward, extra mana if own); units availability by round half | round limit or concession | 3 VP/keep + 2 VP/tower; most wins; tie = no winner |
| Life and Death (EXP) | enemy tokens sorted by faction; north = Dark Crusader, south = Elementalist rampaging; glades become graveyards in north; liberate for Artifact/Spell; faction leaders (avatars) with levels; Hidden Valley/Necropolis location tiles | both faction leaders defeated → one last turn | Achievements + Greatest Enemy (per faction) +5 |
| Realm of the Dead (EXP) | Dark Crusader sorting; glades→graveyards with escalation; seal graveyards (pay 1 mana, not an action, +1 Rep); necromancer faction leader in Necropolis over Blue city | all graveyards sealed + necromancer defeated → one last turn | Achievements + Greatest Enemy +5; coop/solo goal points |
| Hidden Valley (EXP) | Elementalist sorting; exploring costs **triple** Move (influence may be used as Move for exploring); defeating rampaging Elementalist lets you add a tile anywhere; white city keep defended by 2 green Elementalists; high priestess in Hidden Valley | high priestess defeated → one last turn | Achievements + Greatest Enemy +5 |
| Lost Relic (EXP) | start at level 3 (higher-level start rules); start 9 Fame; +1 Fame per tile, +1 more if ruined city; cities destroyed (no city cards/figures; cost 2 to enter, 1 hero/space); draconum guardian per destroyed city; rampaging draconum on core tiles become green | all relic parts collected → one more turn | Achievements + 4 Fame per relic piece + Greatest Relic Hunter +4 (+2 tied) |

### I.3 First scenario / tutorial differences (SB pp.14–18; RB p.18)

* Countryside tiles are used **sorted by number** (1 on top), not random; the city is the last
  tile (SB p.18 setup diagram).
* Cities cannot be conquered nor entered in this scenario (RB p.18).
* Solo variant: 8 countryside tiles, **4 rounds** (2D 2N), Dummy player + Solo Conquest tactic
  rules, no titles (RB p.18).

### I.4 Higher-level start (Lost Relic and optional) — EXP p.13

Start at level N: for each odd level after the first, draw 2 skills, keep 1, other to common
pool; start with appropriate command tokens. Gain 6 Influence per level to buy cards:

| Card type | Number to draw | Influence cost each |
|---|---|---|
| Advanced Action | character level + 2 | 6 per card beyond the free ones |
| Spell | character level | 9, or 7 + a crystal of appropriate colour |
| Crystal | — | 3 |
| Regular Unit | character level + 2 | the Unit's influence cost |
| Artifact | character level − 1 | 12 |

Free AA per odd level after the first; 2 starting crystals of hero colours; leftover Influence
→ 1 Fame (any remainder). Example (level 3): 18 Influence, draw 5 AA / 4 Units / 3 Spells /
2 Artifacts; 1 free AA.

---

## J. Scoring

### J.1 Standard Achievements (RB p.15; "Scoring card" side A)

| Achievement | Score | Title bonus |
|---|---|---|
| **Greatest Knowledge** | 2 Fame per Spell, 1 Fame per Advanced Action in your deck | most → +3 Fame (tied players each +1 unless tie is 0) |
| **Greatest Loot** | 2 Fame per Artifact in deck or on Units; 1 Fame per 2 crystals in Inventory | +3 (or +1 each if tied) |
| **Greatest Leader** | Fame = total level of your Units; Wounded Units count half (round down) | +3 (or +1 each if tied) |
| **Greatest Conqueror** | 2 Fame per shield on a keep, mage tower or monastery | +3 / +1 each |
| **Greatest Adventurer** | 2 Fame per shield on an adventure site | +3 / +1 each |
| **Greatest Beating** | −2 Fame per Wound card **in your deck** (not on Units) | worst → extra −3 (−1 if tied, except if tie is between players with no Wounds) |

Scoring is applied at game end (conquest scenarios: Achievements + city scoring). City scoring:
**7 Fame** per city you lead; **4 Fame** per city you have ≥1 shield in but do not lead; most
city Fame → +5 Greatest City Conqueror (+2 if tied) (RB p.19).

### J.2 Solo/co-op goal scoring

| Scenario | Goal points |
|---|---|
| Solo Conquest | 10 per city conquered; +15 all cities; +30 per round finished before limit; +1 per card left in Dummy deck (not yet flipped this round); +5 if End of Round not announced in last round |
| Full Cooperation | 10 per city; +10 if every player leads ≥1 city; +15 all cities; +30/round saved; + Dummy cards; +5 |
| Blitz Cooperation | same as Full Cooperation (shorter limit) |
| Life and Death (coop/solo) | 10 per avatar, +15 both; +10 every player has a shield on ≥1 leader tile, +10 more if on both; +30/round saved; +Dummy cards; +5 |
| Realm of the Dead (coop/solo) | 5 per sealed graveyard, 10 necromancer, +10 all sealed+defeated; +20 every player has shield on leader; +30/round saved; +Dummy cards; +5 |
| Hidden Valley (coop/solo) | 20 high priestess defeated; +20 every player has shield on leader; +30/round saved; +Dummy cards; +5 |
| Lost Relic (coop/solo) | 5 per relic piece (+5 every player found ≥1; +10 all pieces coop) / solo: 5 per piece +10 all; +30/round saved; +Dummy cards; +5 |

`⚠️` Title/achievement scoring in solo: no titles awarded (RB pp.18–22; SB p.17).

### J.3 Team scoring (RB p.15; SB p.19)

* Base score = **lower** Fame of the two players; higher Fame ignored.
* Each Achievement category: use the **better** score of the two players.
* Greatest Beating: use the **largest** penalty.
* Titles: compare the larger team values only.
* Best strategy is specialisation — but no one may fall behind in Fame or Wounds.

---

## K. Levels, fame, reputation, mana

### K.1 Fame/level table (see 02 §12.2 for the full discussion)

| Level | Fame | Reward | Armor | Hand |
|---|---:|---|---:|---:|
| 1 | 0 | — | 2 | 5 |
| 2 | 3 | skill + AA | 2 | 5 |
| 3 | 8 | level token/command | 3 | 5 |
| 4 | 15 | skill + AA | 3 | 5 |
| 5 | 24 | level token/command | 3 | 6 |
| 6 | 35 | skill + AA | 3 | 6 |
| 7 | 48 | level token/command | 4 | 6 |
| 8 | 63 | skill + AA | 4 | 6 |
| 9 | 80 | level token/command | 4 | 7 |
| 10 | 99 | skill + AA | 4 | 7 |

✅ **Verified 2026-10-24** by rendering the official board photo (Walkthrough p.6) and reading
each row start. The community engine's `[3,8,14,21,29,38,48,59,71]` is **wrong from level 4** —
do not use it. Data: `game-data/levels.json` (`verified-official`).

### K.2 Reputation effects (see 02 §13)

| Reputation | Interaction modifier |
|---|---|
| positive spaces | + that value Influence |
| 0 | 0 |
| negative spaces | − that value Influence |
| **X space** | no interaction at all |

Reputation changes table is in 02 §13 (assault −1, monastery −3, orc +1, draconum +2, plunder
−1, plus card/scenario effects). Track numeric spaces ⚠️ unverified (see 02 §13).

### K.3 Mana / component numbers (WT p.6)

| Item | Count |
|---|---|
| Basic mana tokens (each of red/blue/white/green) | **15** |
| Special mana tokens (gold, black) | **4 each** |
| Mana dice | **8** total; Source = actual players + 2 |
| Crystals per colour per player max | 3 (max 12 total) |
| Source dice constraint | ≥ half must show basic colours, else reroll black+gold together |
| Source dice per turn per player | **1** (effects may allow more) |

### K.4 Level token stats and command tokens

| Level token | Armor | Hand limit | Command tokens at these levels |
|---|---:|---:|---:|
| 1–2 | 2 | 5 | 1 |
| 3–4 | 3 | 5 | 2 |
| 5–6 | 3 | 6 | 3 |
| 7–8 | 4 | 6 | 4 |
| 9–10 | 4 | 7 | 5 |

(Command token gained on **odd** levels: 3,5,7,9 — RB p.3, p.11 §6a.)

---

## L. Expansion deltas

### L.1 Lost Legion (included in UE)

| Element | Delta |
|---|---|
| Hero | **Wolfhawk** (see F.1/F.2) |
| Tiles | Countryside 12–14, Core 9–10, Volkare's Camp `ENG†` ⚠️ |
| Sites | **Refugee Camp, Maze, Labyrinth** (SITE p.2); **Deep Mines**; **Walls** map feature |
| Scenarios | Volkare's scenarios (Volkare's Return / Quest / Strike) — **not covered by the UE rulebook extracts** ⚠️; needs separate scenario source |
| Rules used by UE | Walls, Deep Mine, Refugee Camp, Maze, Labyrinth all reprinted in the UE Site Reference |
| Enemy abilities | Defend, Vampiric (EXP p.2), Ambush, Pursuit (EXP pp.2–3); the other new abilities (Elusive, Assassination, Cumbersome, Unfortified, Arcane Immunity, multiple attacks) are documented in EXP pp.2–4 and the UE rulebook ability table (RB p.24). Exact expansion attribution is ⚠️ — attribute by what the UE rules print, not by guess. |

`⚠️` The UE expansions rulebook does **not** provide a Lost Legion scenario list or Volkare
rules; it only reprints the rules the UE scenarios need. Volkare scenarios are out of scope for
the current extracts.

### L.2 Krang (character expansion, included in UE)

* Hero **Krang** with 16-card deck (3 replacements) and 11 skills; 6 level tokens.
* No new map/enemy rules. Card list impact only.

### L.3 Shades of Tezla (included in UE)

| Element | Delta | Cite |
|---|---|---|
| Hero | **Braevalar** (16-card deck, 11 skills) | EXP pp.1–2 |
| Enemies | new **faction** variants of green/brown/red tokens (Elementalist vs Dark Crusader icons) | EXP p.2 |
| Faction tokens | one-use items; defeat enemy → take top token; use for ability, or discard for 1 Fame/3 Influence; unused = 1 Fame at end | EXP p.3 |
| New abilities | **Defend, Vampiric, Ambush, Pursuit, Elusive, Assassination, Cumbersome, Unfortified, Arcane Immunity, multiple attacks** (full texts EXP pp.2–4, RB p.24) | EXP pp.2–4 |
| Location tiles | **Hidden Valley, Graveyard, Necropolis** | EXP pp.4–5 |
| Faction leaders | 2 large leader tokens (Elementalists / Dark Crusaders) with levels; combat = reduce level per Armor-worth of attack; block their attacks; cooperative attacks allowed; defeated → no faction token | EXP p.5 |
| Scenarios | Life and Death; Realm of the Dead; Hidden Valley; The Lost Relic (competitive/coop/solo) | EXP pp.6–13 |
| Higher-level start | start-at-higher-level creation rules | EXP pp.13–14 |
| FAQ | official mini-FAQ (Mystical Map, Tome of Relearning, Vial of Toxin, Ice Shard/Fire Gem, Forked Lightning, Shapeshift, avatars) | EXP p.15 |

---

## M. Component counts and setup numbers

| Items | Number |
|---|---|
| Heroes | 7 (4 base + Wolfhawk + Krang + Braevalar) |
| Hero components each | hero card/figures, round-order token, 16 basic actions, 11 skill tokens, 6 level tokens, ~20 shield tokens |
| Map tiles | 11 countryside + 8 core base; UE adds LL tiles (see B.4) |
| Enemy token piles | 7 face-down piles by reverse side (+ per-pile discard space); deplete → reshuffle discards |
| Ruin tokens | 15 (5 altars + 10 enemy tokens) |
| Mana dice | 8; Source = players + 2 |
| Mana tokens | 15/basic colour, 4/gold, 4/black |
| Spells / AA offers | 3 each |
| Unit offer size | actual players + 2 (+1 AA per unburned monastery) |
| Skill offer | 10 per hero (after mode removal); common skill offer |
| Starting hand | 5 |
| Starting deed deck | 16 basic actions |
| Cities | 4 city cards/figures (Red, Blue, White, Green) |
| Site Description cards | 7 two-sided cards (base) + expansions' cards |
| Round-order tokens | 1 per hero |
| Level tokens | 5 numbered (1-2 … 9-10) + 1 blank command token per hero |

Component counts from RB pp.2–3 setup diagrams, WT pp.2–6, `UG†`; UE-specific additions
(Wolfhawk/Krang/Braevalar packs, TEZLA components) from EXP p.1 (Shades of Tezla component
list) ⚠️ base-game counts vs UE may differ.

---

## Sources

* `reference/rulebooks/MKUE_rulebook.pdf` → `reference/extracted/MKUE_rulebook.txt` (RB, 24 pp.)
* `reference/rulebooks/MKUE_walkthrough.pdf` → `reference/extracted/MKUE_walkthrough.txt` (WT, 20 pp.)
* `reference/rulebooks/MK_master_reference_sheet.pdf` →
  `reference/extracted/MK_master_reference_sheet.txt` (SITE, 2 pp.)
* `reference/rulebooks/MK_base_rulebook_2012.pdf` → `reference/extracted/MK_base_rulebook_2012.txt`
  (SB; complete 2012 Scenario Book, pp.12–20; rules pp.1–11 cross-check)
* `reference/rulebooks/MKUE_expansions_rulebook.pdf` →
  `reference/extracted/MKUE_expansions_rulebook.txt` (EXP, 16 pp.)
* Secondary cross-check: `mage-knight-digital/MageKnight`, GitHub
  `packages/engine-rs/crates/mk-data/src/{heroes,levels,skills,tiles,enemies,units,cards,tactics,city_garrison,ruins_tokens}.rs`,
  `docs/reference/{skills,units,enemy-abilities}.md`, and the Unofficial Mage Knight Wiki
  reconstruction therein — accessed 2026-10-24. Not authoritative.
* Secondary: UltraBoardGames transcription of the 2012 Game Walkthrough,
  `https://www.ultraboardgames.com/mage-knight/game-elements.php` — accessed 2026-10-24.
