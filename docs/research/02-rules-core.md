# Emberwold — Rules Core (engine specification)

**Status:** research draft · **Owner:** rules-analyst · **Last updated:** 2026-10-24
**Scope:** decision-complete specification of the *full* Mage Knight Ultimate Edition
(MKUE) rules, written for a rules-engine implementer. Emberwold (the reduced adaptation)
will import/variant this spec; reductions are argued in `docs/design/`.

> **Reading this document.** Every non-obvious rule is cited `(MKUE Rulebook p.N)` — the
> page numbers are the PDF pages of `reference/rulebooks/MKUE_rulebook.pdf` as marked in
> `reference/extracted/MKUE_rulebook.txt`. Worked examples / board artwork are cited
> `(MKUE Walkthrough p.N)`. Site rules come from the one-page-per-site reference card
> text in `reference/extracted/MK_master_reference_sheet.txt` (cited `(Site Reference,
> p.N)`). Scenario-book rules exist twice: the 2018 UE rulebook only *summarises* them
> (pp.18–22); the complete 2012 Scenario Book text is bundled in the base rulebook
> (`reference/extracted/MK_base_rulebook_2012.txt`, pp.12–20), cited `(2012 Scenario
> Book p.N)`. Where the two disagree, both are quoted and the conflict is flagged.
>
> Rules read off board **artwork** (Day/Night board, Fame track, Reputation track,
> City cards) are cited as such and marked **⚠️ UNVERIFIED** where the scan is not
> legible enough to be certain. Anything I could not trace to a source is marked
> **⚠️ UNVERIFIED** and must not be shipped as-is.

## Contents

1. [State machine overview](#1-state-machine-overview)
2. [Setup](#2-setup)
3. [Round structure](#3-round-structure)
4. [Turn structure](#4-turn-structure)
5. [Movement and terrain](#5-movement-and-terrain)
6. [Actions](#6-actions)
7. [Combat with enemies](#7-combat-with-enemies)
8. [Mana](#8-mana)
9. [Deed cards, playing cards, deck building](#9-deed-cards-playing-cards-deck-building)
10. [Units](#10-units)
11. [Skills](#11-skills)
12. [Fame, levels, level-up](#12-fame-levels-level-up)
13. [Reputation](#13-reputation)
14. [Wounds and healing](#14-wounds-and-healing)
15. [End of turn / end of round / end of game](#15-end-of-turn--end-of-round--end-of-game)
16. [Sites](#16-sites)
17. [Solo and co-operative play](#17-solo-and-co-operative-play)
18. [Player vs. Player combat](#18-player-vs-player-combat)
19. [Timing, priority, undo](#19-timing-priority-undo)
20. [Sources](#sources)

---

## 1. State machine overview

### 1.1 Entities

| Entity | Cardinality / state |
|---|---|
| `Game` | scenario config, round number, time of day, tile deck/map, offers, source dice, decks, players, dummy player |
| `Round` | `day` \| `night`; phase = `prepare` → `tactics` → `turns`; `endOfRoundAnnounced: bool` |
| `Turn` | player, `turnKind` = `regular` \| `rest` \| `forfeit`; sub-state = `special` → `movement` → `action` → `end`; `skipTurn: bool` |
| `Combat` | `enemy` (site/adventure/rampaging) or `pvp`; enemy combat phases: `rangedSiege` → `block` → `assignDamage` → `attack`; pvp phases: `rangedSiege` → `melee` |
| `Player` | hero, deed deck / hand / discard / play area, units (Ready/Spent/Wounded), skills (face up/down, centre-of-table), crystals (≤3/colour), level, fame, reputation, shields on map, command tokens |
| `Map` | placed tiles on a hex grid, hex terrain/site/rampaging/enemy tokens, shield tokens, city cards/figures |
| `Offers` | spell offer (3), advanced-action offer (3), unit offer (players+2), common-skill offer, monastery AA cards in unit offer |
| `Source` | mana dice (players+2), each `active` or `depleted` |

### 1.2 Top-level loop

```
SETUP
└─ for round = 1 .. roundLimit:
     ROUND_PREPARE        (skipped in round 1 — already done during setup, p.4 §2)
     TACTICS_SELECTION    (MKUE Rulebook p.4 §3)
     TURN_LOOP            (MKUE Rulebook p.4 §4)
        for each player in roundOrder:
            TURN(player)
            check ScenarioEnd conditions (MKUE Rulebook p.4 §4c)
        end when endOfRoundAnnounced and every other player has had their final turn
     if ScenarioEnd or roundLimit reached: GAME_OVER → SCORING (MKUE Rulebook p.4 §5)
```

### 1.3 Round / end-of-round state machine (engine-critical)

Two events can terminate a round, and they interact (MKUE Rulebook p.4 §4b–d; p.6 §3):

1. **End of Round announced** — only at the start of a turn whose owner has an empty deed deck
   (MKUE Rulebook p.6 §3). Announcing *forfeits that turn*; every other player gets one more turn, then the
   round ends. The announcer does not get a further turn.
2. **Scenario end triggered** — checked at the end of each player's turn (MKUE Rulebook p.4 §4c); the
   scenario says how many extra turns remain (usually: every player gets one last turn,
   often including the triggerer; e.g. "all players, including the one who revealed the
   city, have one last turn", p.18 First Reconnaissance).

If both occur, final turns follow **whichever occurred first** (MKUE Rulebook p.4 §4d). Operationally:
keep a `finalTurnPending: set<player>`; whichever event fires first *seeds* it; when the set is
exhausted the round and/or game ends. A player whose round-order token is face-down still
"has a turn" that is skipped (MKUE Rulebook p.6 §2b).

### 1.4 Turn state machine

```
TURN_START
├─ if roundOrderToken faceDown: flip up; SKIP turn (still expire own centre-of-table skills) (MKUE Rulebook p.6 §2)
├─ if deedDeck empty and endOfRound not announced:
│     if hand empty: MUST announce End of Round (MKUE Rulebook p.6 §3b)
│     else: MAY announce End of Round or play normally (MKUE Rulebook p.6 §3c)
├─ special/turn-start effects window (MKUE Rulebook p.6 §5b): play any "special" effects, healing (not in combat),
│  use magical-glade start-of-turn mana (Site Reference p.1), play "before your turn" effects
├─ choose REGULAR TURN or REST (MKUE Rulebook p.6 §5)   [if forfeit → END_TURN immediately]
│   REGULAR: MOVEMENT (optional) → ACTION (mandatory if triggered, else ≤1 voluntary)
│   REST: standard rest or slow recovery; no movement, no action
├─ "my turn is over" announcement (MKUE Rulebook p.6 §8)
└─ END_OF_TURN_SEQUENCE (MKUE Rulebook p.11 §1–7) — no effects may be played during this sequence (MKUE Rulebook p.6 §8c)
```

### 1.5 Combat state machine (enemy combat)

```
START_COMBAT
  assemble enemies (reveal tokens / face-up survivors / joiners; p.8 §1–3)
  RANGED_SIEGE_PHASE   : declare attacks (may be 0..n); damage is immediate & final (MKUE Rulebook p.9 §1–8)
  BLOCK_PHASE          : draw Summon replacements first; block enemies one at a time (MKUE Rulebook p.9 §1–10)
  ASSIGN_DAMAGE_PHASE  : unblocked enemies deal damage; assign in any order (MKUE Rulebook p.9–10 §1–7)
  ATTACK_PHASE         : any attacks; all fortification ignored (MKUE Rulebook p.10 §1–2)
END_COMBAT → outcomes (MKUE Rulebook p.10 §1–3)
```

Non-combat phases (movement/action) never interleave with combat; combat is entered from the
action (or from movement for provocations/assaults) and runs to completion.

---

## 2. Setup

Follow in this order (MKUE Rulebook p.1 §1–2, p.3 bullets; the rulebook's setup is a *list of stations*, not
strictly ordered — the order below is a safe engine order that also satisfies "reveal starting
tiles last"). Numbered per rulebook where possible.

1. **Scenario + variants** chosen and announced before hero selection (MKUE Rulebook p.1 §1; p.16).
2. **Player order / heroes.** Determine random player order; in that order each player picks a
   hero. Players who picked earlier put their Round Order token higher in the column
   (MKUE Rulebook p.1 §2). *Engine note:* token order at start = hero-pick order; Tactic cards re-order it.
3. **Fame/Reputation tracks** — shield on Fame `0`; shield on the central `0` of the
   Reputation track (MKUE Rulebook p.3).
4. **Enemy and Ruin token piles.** Sort enemy tokens (round) and ruin tokens (hex) by reverse
   side into **seven** face-down piles, one space for discards next to each. On depletion,
   reshuffle the discard pile into a new face-down pile (MKUE Rulebook p.3).
5. **Artifact deck** shuffled face down. Artifacts are **never** displayed in an offer (MKUE Rulebook p.3).
6. **Wound pile** face up (all identical) (MKUE Rulebook p.3).
7. **Spell deck + Spell offer**: shuffle; reveal top **3** as the offer (MKUE Rulebook p.3).
8. **Advanced Action deck + offer**: same as Spells (3) (MKUE Rulebook p.3).
9. **Common Skill offer**: empty area for skill tokens not chosen at level-up (MKUE Rulebook p.3).
10. **Regular (silver) and Elite (gold) Unit decks** shuffled separately (MKUE Rulebook p.3).
11. **Unit offer**: reveal *(actual players + 2)* Regular Unit cards. Later, each unburned
    monastery adds one Advanced Action card to the *unit offer* (not the AA offer) (MKUE Rulebook p.3, p.7 §5f).
12. **Round Order tokens** placed in hero-pick order (MKUE Rulebook p.3).
13. **Day/Night board** day side up (MKUE Rulebook p.3). Roll **players + 2** mana dice into the Source;
    **at least half** must show a basic colour (red/blue/white/green). If not, reroll *all*
    black and gold dice together until the condition holds (MKUE Rulebook p.3). *The dice remain as rolled.*
14. **Day Tactics** displayed face up; **Night Tactics** set aside (not shuffled) (MKUE Rulebook p.3).
15. **Tile deck** (scenario-defined counts, p.3):
    * Countryside (green back): pick randomly *(UE)* / **sorted by number** *(2012 first
      scenario only — see conflict note in §16.1)*.
    * Core (brown back): separate into city / non-city; choose randomly the required number of
      each; **shuffle chosen brown tiles together**, then put the shuffled green tiles on top.
    * `⚠️ CONFLICT (engine-relevant):` the mage-knight-digital engine puts non-city core tiles
      on top of city core tiles (cities always last). The rulebook only says the brown tiles
      are shuffled together, so cities may appear before all non-city tiles are out. Follow
      the rulebook; do not order cities last unless a scenario says so.
16. **Map**: starting tile A or B side up per scenario; reveal 2 (A) or 3 (B) tiles and place
    per scenario diagram, oriented identically to the starting tile. For every site on a
    revealed tile, apply its **"When revealed"** instructions immediately (MKUE Rulebook p.3; Site Reference).
17. **Site Description cards + Scoring card** nearby (MKUE Rulebook p.3).
18. **City cards/figures** nearby but out of reach (MKUE Rulebook p.3).
19. **Bank**: mana crystals accessible; unused mana dice go here for effect-rolled dice (MKUE Rulebook p.3).
20. **Per player**: hero card (Inventory), level-token pile (1-2 on top, 9-10 bottom), the blank
    token shield-side-up as first **Command token**, unit area, deed deck = that hero's **16
    Basic Action cards**, draw **5** (= hand limit for level 1–2) (MKUE Rulebook p.3).
21. **Skill tokens**: each hero has **11** tokens; remove the competitive interactive skill in a
    co-op game, the co-op interactive skill in a competitive game (and one for solo, see
    §17); randomise the remaining **10** face down; keep the Hero's Skill Description card
    available (MKUE Rulebook p.3; p.15).
22. **First round preparation is considered already done** — skip round-prepare for round 1
    (MKUE Rulebook p.4 §2).

**Not at setup:** players start with **no crystals**, no units, no skills, no advanced cards.
The three starting crystals shown on the hero card are for the **Dummy player only** (MKUE Rulebook p.15).

---

## 3. Round structure

### 3.1 Prepare the Round — skip on round 1 (MKUE Rulebook p.4 §2)

Order matters for information-timing; implement in this sequence:

1. **Flip the Day/Night board** (day↔night) (MKUE Rulebook p.4 §2a).
2. **Reset the Source**: reroll all mana dice in the Source under the same constraint as setup
   (≥ half basic colours; reroll all black+gold together until true) (MKUE Rulebook p.4 §2b). *Note: this
   also un-depletes dice: at night, gold dice rerolled as gold become depleted again — see
   §8.4.*
3. **Create a new Unit offer** (MKUE Rulebook p.4 §2c):
   1. All Unit cards currently in the offer → bottom of their decks (Regular to Regular,
      Elite to Elite).
   2. Any Advanced Action cards in the unit offer → bottom of the AA deck.
   3. Deal *(actual players + 2)* Unit cards:
      * if **no** Core tile has been revealed: Regular (silver) only;
      * if **at least one** Core tile has been revealed: alternate **Elite, Regular, Elite, …**
        (first card Elite).
   4. For each **monastery on the map that has not been burned**, add one Advanced Action card
      (top of AA deck) to the unit offer. *(Monastery "training" cards live here, not in the
      AA offer.)*
4. **Refresh the AA offer**: remove the **lowest-position** card → bottom of AA deck; shift
   others down; draw a new card into the **top** position (MKUE Rulebook p.4 §2d).
5. **Refresh the Spell offer**: same procedure (MKUE Rulebook p.4 §2e).
6. **Collect Tactics**: take back all Tactic cards from the previous round; display the correct
   set face up (MKUE Rulebook p.4 §2f).
7. **Each player** (MKUE Rulebook p.4 §2g), simultaneously:
   1. Flip all Banner Artifacts and Skill tokens in the play area face up; *may* discard any
      Banner Artifact assigned to a Unit at this moment.
   2. Ready **all** Units — including Wounded ones (readiness changes; Wounded units are **not**
      healed).
   3. Shuffle all your Deed cards — deck, discard pile **and cards in hand** (any Wounds in
      hand are included, RB p.11 §1c) — into a new Deed deck. Cards removed from the game stay
      out.
   4. Draw up to hand limit:
      * if you are **on or next to a keep you own**, your hand limit increases by **the number
        of keeps you own anywhere on the map** (not just that one) (MKUE Rulebook p.11 §7b);
      * +1 (+2 if city leader) if on/next to a conquered city you have a shield in;
      * if both apply, **use only the higher bonus** (MKUE Rulebook p.4 §2g, p.11 §7b);
      * may also be increased by an effect that increased hand limit "next time you draw cards"
        cast on the player's **final turn of the previous round** (MKUE Rulebook p.4 §2g, p.4 §4f).

### 3.2 Tactic selection (MKUE Rulebook p.4 §3)

1. Each player chooses one displayed Tactic card.
   * Order: **lowest Fame first**, then second-lowest, etc. Ties broken by lower position in
     the current round-order token column (MKUE Rulebook p.4 §3a). Corollary: in round 1 the player who
     picked their hero **last** picks a Tactic **first** (MKUE Rulebook p.4 §3a note).
2. Resolve any "when you take this Tactic" instructions immediately (MKUE Rulebook p.4 §3b).
3. Re-arrange round-order tokens by **Tactic number** (lowest number on top/first) (MKUE Rulebook p.4 §3c).
4. Remove unclaimed Tactics and set aside; they are *not* available this round (MKUE Rulebook p.4 §3d).

Scenarios override step 1 ordering for the Dummy player (see §17.1) and solo (you always
choose first, then Dummy takes one at random — p.19 Solo Conquest).

### 3.3 Player turns (MKUE Rulebook p.4 §4)

* Turns proceed by round-order token. After the last player, the first player plays again.
* End-of-Round announcement: see §1.3 / §4.2.
* **After every turn**, check the scenario end condition (MKUE Rulebook p.4 §4c). If it fires, seed final
  turns per scenario; a scenario may end immediately if the round ends during final turns
  (e.g. p.18).
* **Last-turn rule:** a player may not play effects after their final turn of the round — not
  even effects usable "on another player's turn" (MKUE Rulebook p.4 §4e; p.6 §1c).
* An effect that increases hand limit "next time you draw cards" on a player's final turn
  transfers to the start of the next round (MKUE Rulebook p.4 §4f).

### 3.4 End of round — what the engine must reset

Triggered when the final-turn list is exhausted (no explicit "end of round" step in the
rulebook; the next *prepare the round* does the work). State to reset/collect:

* Units: Ready all (wounded stay wounded) — done in next round-prep.
* Skills: flip all face down Skill tokens face up; expire centre-of-table (interactive)
  skills; return flip-tokens (MKUE Rulebook p.4 §2g; p.5 USING SKILLS).
* Banners: owner may discard/keep banners; discarded banners shuffle back into deck at end of
  round (MKUE Rulebook p.5 USING UNITS §8b).
* Play area: all played cards already discarded in end-of-turn; mana tokens disappear.
* Wounds in hand: when the round ends, ALL Wounds in hand are shuffled back into the Deed deck
  with the other Deed cards (MKUE Rulebook p.11 §1c).
* Tactics: collected in next round-prep.
* Source/offers: refreshed in next round-prep.
* Scenario counters: e.g. remove used Tactics permanently in solo (MKUE Rulebook p.19), remove glade shields
  in Druid Nights (MKUE Rulebook p.21).

---

## 4. Turn structure

### 4.1 Turn start (MKUE Rulebook p.6 §1–5)

1. **Round-order token check.** If your token is face down (because you fully attended a PvP
   defence or joined a co-op city assault since your last turn): flip it back up and **miss
   your turn** (MKUE Rulebook p.6 §2). Regardless of flipping, any of your co-op/interactive skill tokens
   still in effect now expire (MKUE Rulebook p.6 §2c). You may **not** announce End of Round on a turn in
   which you flip your token back (MKUE Rulebook p.6 §2d).
2. **Deed-deck-empty check** (MKUE Rulebook p.6 §3):
   * deck empty at start of turn and End of Round not yet announced:
     * hand also empty → **must** announce End of Round (turn forfeited);
     * hand not empty → choose: announce End of Round (forfeit) or play normally.
   * deck empty and hand empty but End of Round already announced → must forfeit (MKUE Rulebook p.6 §3d).
3. **Forfeit** = turn ends immediately; you may not even use map-space benefits (mine/glade)
   (MKUE Rulebook p.6 §4).
4. **Before choosing regular/rest**, you may play (MKUE Rulebook p.6 §5b–c):
   * any number of **special** effects at any time after the turn starts and before announcing
     its end;
   * any number of **healing** effects, except during combat;
   * any number of **move/influence** effects, but see next point.
5. **Movement/exploration phase restriction** (MKUE Rulebook p.6 §5c bullet): unless an effect explicitly
   allows it, you may not move your figure or explore new tiles outside the Movement phase;
   such parts of an effect are ignored if played outside Movement. (Example: move effects can
   technically be generated late, but move points not spent before the action are lost —
   p.6 §5e.)

### 4.2 Regular turn (MKUE Rulebook p.6 §6)

1. **Movement (optional).** Reveal tiles / spend move points (§5). Results of movement may
   make an action **mandatory**:
   * ended on a space with another player → **must** initiate PvP combat (MKUE Rulebook p.6 §6b);
   * entered (assaulted) a fortified site → **must** fight all garrisoned enemies;
   * movement ended because a rampaging enemy attacked you (provoked) → **must** fight it.
     Note: a provoked enemy is fought *as part of movement* and can itself be forced by an
     assault move; multiple provoked enemies are merged into one combat (§7.1).
2. **Action.** If no mandatory action, choose **at most one** of (MKUE Rulebook p.6 §6c):
   * interact with locals at an inhabited site (village, monastery, owned keep, mage tower or
     city conquered by any player);
   * explore an adventure site (ruins, dungeon, tomb, monster den, spawning grounds) → combat;
   * challenge one or more rampaging enemies on adjacent spaces → combat;
   * burn a monastery (if on a monastery) → combat;
   * do nothing.
3. **Action economy constraints:**
   * at most **one action per turn**, mandatory or voluntary (MKUE Rulebook p.6 §6d);
   * **all** movement and exploration must be before the action; no moving after an action;
   * unspent Move and Influence points are lost the moment the action phase starts
     (MKUE Rulebook p.6 §6e).
4. **Movement once the action ends:** none, with rare exceptions (card text). Turn ends.

### 4.3 Resting (MKUE Rulebook p.6 §7)

No movement, no combat, no interaction (MKUE Rulebook p.6 §7). You must take exactly one type, depending on
hand contents **at the time you choose to rest**:

| Rest type | Requirement | Effect |
|---|---|---|
| **Standard Rest** | ≥ 1 non-Wound card in hand | Discard **one non-Wound card** and **any number** of Wound cards (Wounds go to discard, not to the Wound pile — this is *not* healing) |
| **Slow Recovery** | Only Wound cards in hand | Reveal hand to prove it; discard **one Wound card** to discard |

Note: playing all non-Wound cards earlier in the turn changes which rest type is legal (MKUE Rulebook p.6 §7a
note). Healing effects may be used while resting (MKUE Rulebook p.11 §3).

### 4.4 Announcing end of turn → begin next player's turn (MKUE Rulebook p.6 §8)

1. Announce the turn is over.
2. **First action: return any mana dice to the Source, rerolling used dice.** This is
   deliberately first so the next player can plan (MKUE Rulebook p.6 §8a; p.11 §1).
3. Tell the next player they may start their turn (they may now act while you finish your
   end-of-turn sequence) (MKUE Rulebook p.6 §8b).
4. Complete the **End of Turn sequence** (§15.1) — during which **no effects may be played**
   (MKUE Rulebook p.6 §8c).

### 4.5 Effects usable outside your turn (MKUE Rulebook p.6 §1)

* "Before your turn" and "on another player's turn" are the same window for game purposes
  (MKUE Rulebook p.6 §1a). You may use them:
  * between any two turns, including immediately consecutive turns of yours;
  * in reaction to another player announcing an effect — **before** that effect is evaluated
    (MKUE Rulebook p.6 §1b); never in the middle of an effect's evaluation.
* You may **not** use them: during your own End-of-Turn sequence; before Tactic selection at
  the start of the round is complete; after your last turn of the round (MKUE Rulebook p.6 §1c).
* Other (non-"outside-turn") effects may **not** be played outside your turn (MKUE Rulebook p.6 §1d).
* Draw conditions are checked **after** the outside-turn actions complete (MKUE Rulebook p.6 §1e).

---

## 5. Movement and terrain

### 5.1 Terrain move costs

From the **Day/Night board** (left half). Costs are what you pay to enter a space; the terrain
you leave is irrelevant (Walkthrough p.8; board artwork Walkthrough p.6).

| Terrain | Move cost Day | Move cost Night |
|---|---|---|
| Plains | 2 | 2 |
| Hills | 3 | 3 |
| Forest | 3 | **5** |
| Wasteland | 4 | 4 |
| Desert | 5 | **3** |
| Swamp | 5 | 5 |
| Lake | ✗ impassable | ✗ |
| Mountain | ✗ impassable | ✗ |
| City space | 2 | 2 |

Blank/other spaces (e.g. city spaces, tile-specific sites) use the cost of the underlying
terrain; a **city space always costs 2** regardless of printed terrain (MKUE Rulebook p.7 §3a note; board
artwork). `⚠️ UNVERIFIED:` the night values for Forest and Desert are legible on the board
image (3/5 and 5/3); all other terrains have **no** night variant and keep their day cost (the
rulebook says only forest and desert differ: p.7 §3a note; Walkthrough p.6). A community
engine cross-check disagrees on several night costs — do not follow the cross-check.

**Movement effect modifiers** (MKUE Rulebook p.7 §7):
* Terrain-cost reductions apply to all later movement this turn; multiple reductions may be
  applied in any order; cost may reach **0** but not below; an effect may set a terrain
  cost (e.g. mountains at cost 5) rather than reduce it.
* Some effects allow entering normally inaccessible terrain at a stated cost. If the turn ends
  in unsafe terrain, Forced Withdrawal applies.
* Some effects move you directly N spaces at a stated cost; you ignore normal costs and may
  cross inaccessible/occupied/fortified spaces unless the effect says otherwise; some must
  end on a safe space.
* Effects that reduce **explore** costs (e.g. "exploring costs 1 less") do not reduce terrain
  costs.

### 5.2 Movement procedure

1. During movement you may play **any number** of movement effects (cards, powered cards,
   skills, unit abilities) — total their Move points (MKUE Rulebook p.7 §2–3).
2. Move space by space, paying the entry cost. You may only move to **accessible adjacent
   spaces** (MKUE Rulebook p.7 §3).
3. **Entering a space with an unconquered fortified site** (keep, mage tower, city) or **a
   keep owned by another player** immediately ends movement and counts as an **assault**
   (MKUE Rulebook p.7 §4a).
4. **Rampaging enemies** (orc marauders/draconum): cannot enter their space until defeated
   (MKUE Rulebook p.7 §4b). If you **provoke** one (move from a space adjacent to its token to another space
   adjacent to the same token), it attacks you and your movement ends immediately (MKUE Rulebook p.7 §4c).
   → This starts combat *during* the movement phase (§6.2, §7.1).
5. **Adventure sites** (ruins, dungeon, tomb, monster den, spawning grounds) do not end
   movement; you may ignore them and treat the space as empty even with enemy tokens on it
   (MKUE Rulebook p.7 §4d).
6. `⚠️ Important asymmetry (implementation trap):` you may not *enter* a rampaging enemy's
   space, but you may move *through* the space of another hero and may end movement there
   (which is an attack).

### 5.3 Exploring / revealing map tiles (MKUE Rulebook p.7 §5–6)

1. You may reveal tiles only if you occupy a space adjacent to a legal position for a new tile
   (MKUE Rulebook p.7 §5a).
2. Cost: **2 Move points** per tile (MKUE Rulebook p.7 §5b).
3. The tile is taken from the top of the tile deck. If two positions are legal, announce which
   you are exploring **before** revealing (MKUE Rulebook p.7 §5c).
4. Orientation: fixed by corner symbols + artwork direction; players do not rotate (unless
   the Random Tiles Orientation variant is used, p.16) (MKUE Rulebook p.7 §5d).
5. Placement restrictions:
   * Countryside (green): must be adjacent to ≥ 2 other tiles, **or** adjacent to a tile that
     itself borders ≥ 2 other tiles (MKUE Rulebook p.7 §5e);
   * Core (brown): must be adjacent to ≥ 2 other tiles;
   * If the deck is empty: use removed countryside tiles, then removed non-city core tiles;
     tiles placed this way must be adjacent to ≥ 3 other tiles (fill holes). If none, no more
     exploring (MKUE Rulebook p.7 §5e).
6. Apply **"when revealed"** site rules (MKUE Rulebook p.7 §5f): e.g. monastery → draw 1 AA card into the
   **unit offer**; rampaging enemies placed face up; ruins tokens face up by day / face down
   by night (Site Reference p.1); cities → place City card, city figure at scenario level, draw
   one face-down enemy token per coloured circle on the figure base (MKUE Rulebook p.7 §5g).
7. You may alternate moving and exploring; may play extra movement effects at any time,
   including after a reveal; Move points carry over (MKUE Rulebook p.7 §6). You may not power an already
   played card later (MKUE Rulebook p.7 §6b).

### 5.4 Other figures, safe spaces, forced withdrawal

* You may pass through another player's figure freely **unless** it is a keep owned by that
  player (MKUE Rulebook p.7 §8a).
* Ending movement on another player's space (or entering an opponent-owned keep they occupy)
  = attack (§18); entering their keep while they're absent draws a random grey garrison
  (MKUE Rulebook p.8 §1a).
* Multi-occupancy spaces: **portal** and **conquered city** only. On a portal: at end of turn,
  remove your figure from the map (any number of heroes can be "on" the portal); return it at
  the start of your next turn (MKUE Rulebook p.7 §8d). In a conquered city: place your figure on the City
  card; any number of heroes may be there; no combat occurs on multi-occupancy spaces
  (MKUE Rulebook p.7 §8d).
* **No-PvP situations** — if you end movement on the same space as another player and PvP is
  forbidden (their token face down; End-of-Round called and final turns; scenario end and final
  turns; co-op scenario or agreed no-PvP; team-mate), you may take **no action** at all this
  turn and Forced Withdrawal applies (MKUE Rulebook p.7 §8e).
* **Safe space** (MKUE Rulebook p.7 §7d): accessible under normal conditions; not an unconquered fortified
  site or opponent-owned keep; does not contain another hero (except portal/conquered city
  which allow multiple heroes). Special effects can make a space safe (e.g. Secret Ways
  mountains) — see skill/card text.
* **Forced Withdrawal** (MKUE Rulebook p.11 §2): if you end the turn on an unsafe space, backtrack your move
  until you reach a safe space; **+1 Wound card per space backtracked**.

---

## 6. Actions

### 6.1 Action catalogue

Only **one** action per turn. The action is either forced by movement or chosen voluntarily
(MKUE Rulebook p.6 §6b–c).

| # | Action | Trigger / requirement | Resolution | Notes |
|---|---|---|---|---|
| A1 | **Assault fortified site** | entered a space with unconquered keep/mage tower/city | lose 1 Reputation; fight garrison (all fortified). City: also city combat bonus (§16.3) | mandatory (MKUE Rulebook p.6 §6b, p.8 §1a, p.10) |
| A2 | **Assault opponent's keep** | entered a keep owned by another player | lose 1 Rep; if owner present → PvP; else random grey enemy token garrison ("worth half Fame", p.8 §1a) | mandatory; owner present ends movement (MKUE Rulebook p.7 §8b) |
| A3 | **Enter adventure site** | on/at an adventure site with enemies | announce entry; fight **all** enemies there | voluntary; cannot add adjacent rampaging enemies (MKUE Rulebook p.8 §1b, §2d) |
| A4 | **Challenge rampaging enemies** | adjacent to ≥1 rampaging enemy token | choose one or more adjacent tokens; fight all | voluntary; one combat (MKUE Rulebook p.8 §1d) |
| A5 | **Burn monastery** | standing at a monastery | **Reputation −3**; draw random **violet** enemy; defeat → shield, monastery burned, gain Artifact at end of turn | Units cannot be used (Site Reference p.1); mandatory combat once started |
| A6 | **Interact with locals** | at inhabited site | generate Influence and spend (§16.2) | voluntary (MKUE Rulebook p.8 §1, p.8 §3) |
| A7 | **PvP combat** | on same space as another player, PvP legal | see §18 | voluntary; attacker = aggressor |
| A8 | **Do nothing** | — | pass | allowed (MKUE Rulebook p.6 §6c) |

`⚠️ UNVERIFIED:` A5 "Units cannot be used" comes from the Site Reference card text
("Your Units cannot be used in this combat") — the rulebook body (MKUE Rulebook p.8 §1c) does not repeat it.

### 6.2 Combat initiation and merging (MKUE Rulebook p.8 §2)

* **Only one combat per turn**, but a single combat may contain enemies from several spaces:
  * a single move can provoke two rampaging enemies → fight both (MKUE Rulebook p.8 §2a);
  * an **assault** is a move and can also provoke rampaging enemies → fight defenders **and**
    provoked enemies **at once**; provoked enemies are *not* fortified, and you can conquer the
    site without defeating them (MKUE Rulebook p.8 §2b);
  * if your move started a combat and rampaging enemies are adjacent to the **target space**,
    you may challenge them to join the fight (assault: join defenders; adventure site: not
    allowed) (MKUE Rulebook p.8 §2c–d);
  * never fight enemy tokens and another player in the same combat/action (MKUE Rulebook p.8 §2e).
* **Simultaneous/ordered initiation:** provoked-during-move and the assault target are one
  combat; resolve by assembling the enemy set before the Ranged phase (§7.1).

### 6.3 Order of a turn with forced combat

If movement forces combat (assault/provoke), the action is that combat; you may not interact
or perform another voluntary action afterwards. If movement ends on another player and PvP is
forbidden → no action at all (§5.4). If movement produced **no** action, choose at most one
voluntary action.

---

## 7. Combat with enemies

### 7.1 Starting a combat — assemble the enemy set (MKUE Rulebook p.8 §3)

1. Determine the combat cause: assault / adventure-site entry / provocation / challenge /
   monastery burn. The cause fixes which enemies are legal (§6.1–6.2).
2. Draw and/or reveal **all** enemies you must fight:
   * keep/mage tower: draw the garrison enemy token per site rules (keep: grey; mage tower:
     violet) — placed when revealed and revealed when adjacent by day or on assault at night;
   * city: garrison tokens were drawn at reveal (face down on City card) — reveal all;
   * dungeon/tomb/monster den/spawning grounds: draw brown/red/brown/brown respectively
     (Site Reference p.1);
   * ruins: yellow token → altar (no combat; pay 3 mana of depicted colour → 7 Fame, shield) or
     enemies (Site Reference p.1);
   * rampaging: green/red tokens already on map;
   * monastery burn: random violet token; also Reputation −3 before combat.
3. **Assault Reputation loss** is applied when the assault begins, regardless of outcome
   (MKUE Rulebook p.8 §1a).
4. Effects may be played during any phase unless restrictive text says otherwise; effects
   persist until end of turn unless stated (MKUE Rulebook p.8 §5).
5. **Special-effect / healing rules in combat** (MKUE Rulebook p.8 §6): special effects may be played in any
   phase; **no healing effects** may be played during combat; entering combat discards unspent
   healing points (MKUE Rulebook p.11 §3d).

### 7.2 Phase 1 — Ranged and Siege Attack phase (MKUE Rulebook p.9)

1. You may perform **0..n attacks**; each attack has one or more chosen target enemy tokens.
2. Play any number of Ranged and Siege attacks of any element (Fire, Ice, Cold Fire, physical)
   — cards, skills, unit abilities; stack them in a column per attack (MKUE Rulebook p.9 §3).
3. **Fortification targeting rules** (MKUE Rulebook p.9 §3a, p.10 ATTACK PHASE, p.24 ability table):

   | Enemy status | Can be targeted in Ranged/Siege phase? |
   |---|---|
   | unfortified | Ranged **or** Siege (or any) |
   | defending a fortified site (site fortification only) | **Siege only** |
   | has Fortified ability, not at a fortified site | **Siege only** |
   | has Fortified ability **and** defending a fortified site (fortified twice) | **cannot be targeted at all** in this phase |
   | has **Unfortified** ability while defending a fortified site | treated as not fortified → Ranged allowed |

   If an attack targets a mix of fortified and unfortified enemies, only Siege attacks may be
   used; a mixed attack cannot include Ranged (MKUE Rulebook p.9 §3a).
   Cards **cannot** be played sideways to contribute to Ranged/Siege (MKUE Rulebook p.9 §3b).
4. **Resistances halve total inefficient attack value** (MKUE Rulebook p.9 §4): compute the total attack
   value by element; if at least one *targeted* enemy has a resistance matching an element in
   the attack, all attacks of that element are **halved** (total then ÷2, round down).
   * Cold Fire attacks are halved only if at least one targeted enemy has **both** Fire and
     Ice resistance (MKUE Rulebook p.9 §4a).
   * Because halving happens after summing, grouping attacks against resistant enemies
     separately is a player decision (MKUE Rulebook p.9 §7b).
5. **Success test**: total attack value ≥ **total Armor** of all targeted enemies → all targeted
   enemies are defeated (MKUE Rulebook p.9 §5). Lower total → no effect at all; damage does not carry over
   (MKUE Rulebook p.9 §6). Defeated tokens discarded to their pile's discard space, out of combat
   (MKUE Rulebook p.9 §5a).
6. **Fame** for each defeated enemy = number on bottom of token; move Fame track now, but
   **no level-up until end of turn** (MKUE Rulebook p.9 §5b).
7. **Attack points are not saved**: assign immediately or waste them (MKUE Rulebook p.9 §8).
8. You may declare attacks sequentially, observing results (an "attack" is a commitment
   except that, before new information, players may revert — see §19/undo rules: p.5
   REVERTING allows taking back cards if **no new information** was revealed; an enemy
   reveal happens at combat start, so decisions after seeing enemies are binding unless the
   table agrees otherwise).

### 7.3 Phase 2 — Block phase (MKUE Rulebook p.9–10)

1. Any enemy not eliminated may attack; players may block one or more (MKUE Rulebook p.9 §1).
2. **Summon**: at the start of the Block phase, for EACH enemy with Summon, draw a brown enemy
   token and add it to the enemy group (MKUE Rulebook p.9 §2):
   * in Block and Assign-Damage phases the **summoned** enemy replaces the summoner;
     no effect can target the summoner in those phases (MKUE Rulebook p.9 §2a);
   * at the start of the Attack phase the summoner is back in play (MKUE Rulebook p.9 §2b);
   * the summoned token is discarded after the combat (MKUE Rulebook p.10 §6c).
3. Choose **one** attacking enemy to block; play any amount of Blocks of any element; stack
   (MKUE Rulebook p.9 §3–4). Any non-Wound card may be played sideways as **Block 1 — always physical**
   (MKUE Rulebook p.9 §4b).
4. **Block efficiency matrix** (MKUE Rulebook p.9 §5a):

   | Enemy attack element | Efficient Blocks (full value) | Inefficient (halved) |
   |---|---|---|
   | Physical | **any** Block type | — |
   | Fire | Ice, Cold Fire | physical, Fire |
   | Ice | Fire, Cold Fire | physical, Ice |
   | Cold Fire | Cold Fire only | physical, Fire, Ice |

   Inefficient total is summed, ÷2 rounded down, then added to full efficient total (MKUE Rulebook p.9 §5b).
5. **Swift** enemy: its attack value is **doubled for the purpose of blocking** (MKUE Rulebook p.9 §6a;
   p.24).
6. Block succeeds if block total ≥ (modified) attack value. Success sets the enemy **aside**
   (it does no damage, but is **not yet eliminated** — you may kill it in the Attack phase)
   (MKUE Rulebook p.9 §7). A blocked **summoned** monster is discarded, no Fame (MKUE Rulebook p.9 §7a).
7. Failed block: **no partial effect** — the enemy attacks at full strength (MKUE Rulebook p.9 §8). Other
   parts of a blocking card still apply unless stated otherwise (MKUE Rulebook p.9 §8a).
8. You may block any number of enemies, each resolved individually; block points must be
   assigned immediately, cannot be saved (MKUE Rulebook p.9 §9–10).
9. **Multiple attacks** (expansion enemies, p.24 / expansion p.4): each attack must be blocked
   separately; a single block cannot cover two attacks; an enemy is "successfully blocked"
   only if **all** its attacks are blocked; anti-attack effects prevent all attacks, while
   attack-modifiers affect only one attack (controller's choice).

### 7.4 Phase 3 — Assign Damage phase (MKUE Rulebook p.9–10)

1. If no unblocked enemies, skip (MKUE Rulebook p.9 §1a). Otherwise process unblocked enemies **one by one in
   any order chosen by the player** (MKUE Rulebook p.9 §1b).
2. Each enemy deals damage = its Attack value; **Brutal** deals **double** (MKUE Rulebook p.9 §2, p.24).
3. Assign **all** damage. You may assign to one or more **Unwounded** Units (Spent units may
   take damage); the rest to your Hero (MKUE Rulebook p.9 §3–4).
4. **Unit damage assignment** (MKUE Rulebook p.9 §4a):
   * putting ≥1 damage on a unit puts **one Wound** on it regardless of amount; then reduce
     remaining damage by the unit's Armor.
   * exception — unit **resistant** to the attack element: first reduce damage by Armor
     **without** wounding; if damage remains, then wound the unit and reduce by Armor again
     (so resistant units absorb up to 2×Armor; wounded only if damage > Armor) (MKUE Rulebook p.9 §4b).
   * a unit assigned damage but not wounded due to resistance **cannot be assigned damage
     again during the same combat** (MKUE Rulebook p.9 §4b last bullet).
5. **Hero damage** (MKUE Rulebook p.9 §5): put a Wound card in hand; reduce damage by Hero Armor (left number
   on the current Level token). Repeat until all damage assigned. Even if assigned damage <
   Armor, the Hero still takes a Wound (1 wound per Armor points of damage, rounded up).
6. **Knock out** (MKUE Rulebook p.9 §5c): if Wounds added to hand during a combat ≥ unmodified Hand limit,
   you are knocked out → immediately discard all **non-Wound** cards from hand. Wounds from
   other in-combat effects count. While knocked out: Units may continue, Skills usable, and
   you keep taking Wounds if damage remains.
7. **Special abilities on damage**:
   * **Poison** (MKUE Rulebook p.10 §6a): unit wounded by Poison gets **two** Wound cards (heal twice); hero
     takes an extra Wound **into the discard pile** for each Wound taken to hand.
   * **Paralyze** (MKUE Rulebook p.10 §6b): unit wounded by Paralyze is **destroyed** (removed from game);
     hero must **discard all non-Wound cards** from hand immediately.
   * **Summon** (MKUE Rulebook p.10 §6c): assign damage of the summoned enemy (with its own abilities); then
     discard the summoned token.
   * **Assassination** (MKUE Rulebook p.24/expansion): unblocked damage cannot be assigned to Units — all to
     Hero (can still be blocked with Unit help).
   * **Vampiric** (expansion p.2): Armor +1 for the rest of combat for each Unit wounded and
     each Wound card added to a player's hand by its attacks.
   * **Elusive** (expansion p.4): two Armor values; high used in Ranged/Siege phase;
     low used in Attack phase **only if all** its attacks were successfully blocked (blocked
     to 0 counts as blocked). If not, it keeps high value for the rest of combat. Armor
     modifiers apply to both values.
   * **Cumbersome** (expansion p.4): during Block phase you may spend Move points; each point
     reduces **one** attack of a Cumbersome enemy by 1 (for Block and Damage phases); attack
     reduced to 0 counts as successfully blocked.
8. Phase ends when all unblocked enemies' damage is assigned (MKUE Rulebook p.10 §7).

### 7.5 Phase 4 — Attack phase (MKUE Rulebook p.10)

1. Works like the Ranged/Siege phase **except** (MKUE Rulebook p.10 §1):
   * may combine **any** attacks (Ranged, Siege, regular) — no difference now; **all
     fortification is ignored**; any enemy is targetable;
   * any non-Wound card may be played sideways into an attack column as **Attack 1 – physical**
     (this is the only phase where sideways attack is allowed);
   * effects labelled "usable in Attack phase" only.
2. Multiple enemies may be defeated in one attack or across several; **resistance rules are
   unchanged** (MKUE Rulebook p.10 §2).
3. Defeated enemies: Fame immediately (no level yet); tokens discarded.
4. You may also attack enemies that were set aside as blocked (MKUE Rulebook p.9 §7).

### 7.6 Combat outcomes (MKUE Rulebook p.10 §1–3)

1. Combat ends after the Attack phase; you may have defeated none/one/several.
2. City assault: put one of your shields on the City card **per enemy you defeated**, in a row
   so the sequence can be reconstructed later (MKUE Rulebook p.10 §1a). (Used for city leadership; §16.3.)
3. **If you defeated all enemies at the site** (MKUE Rulebook p.10 §2):
   * rampaging: remove tokens from map; space becomes empty; **no shield**; Reputation +1 per
     orc, +2 per draconum (MKUE Rulebook p.10 §2a). Orcs/draconum defeated elsewhere don't give Reputation.
   * adventure site: mark the space with a **shield**; claim rewards **at end of turn**
     (MKUE Rulebook p.10 §2b) — ruins rewards can be Artifact / Spell / Advanced Action / 4 crystals / Unit
     (MKUE Rulebook p.10 §2b bullet).
   * fortified site: end your turn **on** the conquered space; keep/mage tower marked with
     shield; mage tower gives a **Spell** reward at end of turn; city → §16.3 (MKUE Rulebook p.10 §2c).
     Rampaging joiners do not affect conquest (MKUE Rulebook p.10 §2c note).
   * monastery: shield on monastery; monastery is **burned** = empty space for the rest of the
     game; gain an **Artifact** at end of turn (MKUE Rulebook p.10 §2d).
4. **If not all enemies defeated** (MKUE Rulebook p.10 §3):
   * rampaging enemy stays on its space (MKUE Rulebook p.10 §3a);
   * dungeon/tomb/monastery enemies drawn for the fight are **discarded** — fresh enemies next
     attempt (MKUE Rulebook p.10 §3b);
   * monster den (1 brown) / spawning grounds (2 brown) / ruins remaining monsters are
     **returned face up on the space**; next attempt fights the same enemies. They may be
     flipped face down to distinguish from rampaging but remain public information
     (MKUE Rulebook p.10 §3c);
   * failed assault on a fortified site: withdraw to the space you attacked from; this is not
     Forced Withdrawal, but if the withdrawal space is unsafe, Forced Withdrawal applies
     (MKUE Rulebook p.10 §3d).
5. **Combat special-effect rules** used by many cards (MKUE Rulebook p.10 SPECIAL COMBAT EFFECTS):
   * effects that target enemies can target an opponent's **unwounded Units** in PvP; never
     the enemy Hero (MKUE Rulebook p.10 §2);
   * red-card / red-mana effects are ignored by **Fire-resistant** enemies; blue by
     **Ice-resistant** ones (MKUE Rulebook p.8 §5a–b; p.10 §2a–b);
   * "destroy an enemy" in PvP wounds the Unit instead (MKUE Rulebook p.10 §2c);
   * a Unit's Armor can never be reduced below 1 (MKUE Rulebook p.10 §2d);
   * armour/attack reduction effects, "prevent attack" effects, and skip-Block-and-Damage
     effects have the specific rules in p.10 §3–5 (persist for the whole combat; prevent-attack
     can be played while blocking but cannot cancel enemy specials or blocks; "skip Block and
     Damage phases" can cancel any one attack, cards remain spent, combat continues).

---

## 8. Mana

### 8.1 Colours and forms (MKUE Rulebook p.5 USING MANA)

| Form | Basic colours (red/blue/white/green) | Gold | Black |
|---|---|---|---|
| **Pure mana** (mana token / die) | yes | day only | night only |
| **Crystal** (in Inventory) | max 3 of each colour | never | never |
| Storage duration | crystal: permanent; token: until end of turn | turn only | turn only |

* Pure mana (token) must be used before end of turn or vanishes (MKUE Rulebook p.5 §1a).
* A crystal can be converted to pure mana at any moment of your turn; cannot convert back
  unless an effect allows (MKUE Rulebook p.5 §1b).
* **Gold** during Day = mana of **any basic colour** (counts as exactly that colour for all
  purposes). Gold cannot be used at Night (MKUE Rulebook p.5 §2a).
* **Black** during Night amplifies: used together with a basic mana to power a Spell's strong
  effect (MKUE Rulebook p.4 §3b, p.5 §2b). Black cannot be used during the Day.

### 8.2 Source (MKUE Rulebook p.5 §3)

* At any time during your turn you may take **one** die from the Source and use it as the
  colour shown (MKUE Rulebook p.5 §3; p.6 summary). **One die per turn** unless an effect says otherwise.
* Take the die at the moment of use; you may not take a die and not use the mana (MKUE Rulebook p.5 §3b).
* At end of your turn, **reroll** used dice and return them to the Source (MKUE Rulebook p.5 §3a; p.6 §8a).
* **Depleted dice**: during Day, any Source die showing **black** is immediately depleted (placed
  top-right of Source); during Night, any showing **gold** is depleted. Depleted dice cannot
  normally be used (MKUE Rulebook p.5 §3c). Dice rolled at round reset that come up the "wrong" special colour
  become depleted, reducing the pool — this is intended (MKUE Rulebook p.19 variant note about night arrival).
* Source composition: **players + 2** dice (MKUE Rulebook p.3; setup). If an effect rerolls Source dice, the
  ≥ half-basic constraint applies only to setup/reset unless stated (reroll effects may produce
  black/gold freely).

### 8.3 Paying costs

* Power an Action card: pay 1 mana of its colour → strong effect (MKUE Rulebook p.4 DEED CARDS §3a).
* Power a Spell: pay 1 mana of its colour → basic effect; at **Night**, pay 1 of its colour
  **+ 1 black** → strong effect (MKUE Rulebook p.4 §3b).
* Artifact: play for basic effect; **throw away** (remove from game) for strong effect
  (MKUE Rulebook p.4 §3c).
* Unit ability with a mana symbol: pay mana of that colour first (MKUE Rulebook p.5 USING UNITS §5b).
* Wounds can never be played or powered (MKUE Rulebook p.4 §3d).
* Composite effects (Concentration, Magic Talent, Maximal Effect): evaluated as one effect;
  resistances use each effect's own colour even if mana was not actually paid (MKUE Rulebook p.5 COMPOSITE).

### 8.4 Timing consequences (engine)

* Day→Night flip changes legality of gold/black immediately at round-prepare (dice in Source
  rerolled; gold dice at night become depleted).
* "Gain a mana token" → Play area; "gain a crystal" → Inventory; if already 3 crystals of the
  colour, gain a **mana token** instead (MKUE Rulebook p.5 GAIN §1–2; p.11 rewards §5a).
* Crystals cannot exceed 3 per colour; **Deep Mine** effect chooses one colour; crystal gain
  from end-of-turn mine benefit gives nothing if at 3 (MKUE Rulebook p.11 §4b).

---

## 9. Deed cards, playing cards, deck building

### 9.1 Card taxonomy (MKUE Rulebook p.4 DEED CARDS; p.5)

| Type | How played | Powered by |
|---|---|---|
| **Basic Action** | basic effect, or strong effect for 1 mana of card colour | 1 matching mana |
| **Advanced Action** | same | 1 matching mana |
| **Spell** | basic effect for 1 matching mana; strong at Night for matching + 1 black | mana |
| **Artifact** | basic effect free; strong effect by **throwing away** (remove from game) | free |
| **Wound** | cannot be played at all | — |

Any non-Wound card can be played **sideways** for one of: **Move 1, Influence 1, Attack 1,
Block 1** — never Ranged/Siege/elemental attack or block (MKUE Rulebook p.4 §3e). Sideways Attack 1 and
Block 1 are **physical** (MKUE Rulebook p.9 §4b; p.10 §1b).

### 9.2 Playing and combining (MKUE Rulebook p.4 §4–6)

* Cards with similar effects stack — sum totals; different types may be combined (MKUE Rulebook p.4 §4).
* At end of turn all played cards go to discard; unplayed cards stay in hand unless discarded
  (MKUE Rulebook p.4 §5).
* Effects that require paying extra mana / discarding / throwing away a card **cannot be played**
  if you cannot pay (MKUE Rulebook p.4 §6). "Any card" excludes Wounds unless explicit (MKUE Rulebook p.4 §6a).
* Composite effects evaluated as a single effect; Maximal Effect cannot split a single-target
  effect across enemies (MKUE Rulebook p.5 COMPOSITE §1a).
* Gain effects: new Deed cards go **on top of your Deed deck** unless stated; offers replenish
  immediately for AA/Spell offers (shift + new top), but **not** for the unit offer or
  monastery-learned cards (replenished next round) (MKUE Rulebook p.5 GAIN §3–4).
* Artifacts and combat rewards are gained **at end of turn** (MKUE Rulebook p.5 GAIN §4; p.11 §5).
* Discard vs throw away: discard → discard pile; throw away Wound → Wound pile, other → remove
  from game (MKUE Rulebook p.5 DISCARDING §1–2).

### 9.3 Deck building sources (summary)

| Source | Gains | Where it goes |
|---|---|---|
| Level-up (even levels) | 1 Advanced Action from AA offer (+ skill) | top of deed deck (MKUE Rulebook p.11 §6b) |
| Monastery (6 Influence, action=interaction) | 1 AA **from the unit offer** | top of deed deck; offer not replenished until next round (MKUE Rulebook p.8 §4c) |
| Mage tower (7 Influence + 1 mana of spell colour) | 1 Spell from spell offer | top of deck; spell offer replenished (MKUE Rulebook p.8 §4d) |
| City options | red: artifacts for 12 Inf; blue: spells as mage tower; white: recruit any unit / 2 Inf to add Elite unit to offer; green: 6 Inf for AA (offer or random top) | see §16.3 |
| Ruins / dungeon / tomb / spawning grounds rewards | AA / Spell / Artifact / crystals / Unit | various; combat rewards at end of turn (MKUE Rulebook p.10 §2b; Site Reference) |
| Combat rewards | spells/AA from offers, artifacts (draw n+1, put 1 bottom), units from unit offer | top of deck / unit area (MKUE Rulebook p.11 §5) |
| Card effects | as written | top of deck unless stated |

* Artifact acquisition rule: draw **that many + 1** artifacts, put one on bottom, rest on top of
  deck in any order (MKUE Rulebook p.11 §5b). City red purchase uses "drawn at end of turn as if won in
  combat" (MKUE Rulebook p.8 §4e).
* Units: recruit from unit offer via interaction; no immediate replenishment (MKUE Rulebook p.8 §4a; p.9).

### 9.4 Reverting / take-backs (MKUE Rulebook p.5 REVERTING)

Players may take back actions/decisions freely **until** new information is revealed (tile,
enemy token, card), a die is rolled, or another player reacts specifically (PvP). After that,
all decisions/moves/cards/skills/units/mana are locked (MKUE Rulebook p.5 REVERTING §2). **Engine
implication:** implement a "commit point" wherever hidden information is revealed or a die is
rolled; undo only within the open segment before the next commit point. In a digital
adaptation "undo-irrelevant states" must be enumerated — see `04-faq-clarifications.md` A-xx.

---

## 10. Units

### 10.1 States and command (MKUE Rulebook p.5 USING UNITS)

* Units are displayed in the Unit area; never in hand/deck/discard (MKUE Rulebook p.5 §2).
* Each unit needs a Command token. **Ready** = command token above the card; **Spent** =
  token on the card; **Wounded** = Wound card across the card (MKUE Rulebook p.5 §3). A wounded unit may
  also be Ready or Spent independently (MKUE Rulebook p.11 WOUNDS §2b).
* Command limit = number of command tokens; start 1; +1 each odd-numbered level (MKUE Rulebook p.3; p.11 §6a).
* Recruiting with all tokens occupied → **disband** a unit (remove from game) first; newly
  recruited unit is Ready and unwounded regardless (MKUE Rulebook p.5 §4a).
* Activate: Ready + unwounded → put command token on it → choose **one** ability → apply; may
  combine with card/skill/unit effects; mana symbol → pay first (MKUE Rulebook p.5 §5).
* "Ready a Unit" effects move the command token back above (MKUE Rulebook p.5 §6).
* An effect can only alter an ability the unit has (e.g. +Block only if it has Block) (MKUE Rulebook p.5 §7).
* Banners: assign during your turn; unit benefits from banner's basic effect, not the strong;
  banner discarded if unit destroyed/disbanded/reassigned; end of round choose keep with unit
  or shuffle back into deed deck (MKUE Rulebook p.5 §8).
* Units **do not ready at end of turn**; they ready at end of round (MKUE Rulebook p.5 §9).
* Wounded units can't activate or be assigned damage (MKUE Rulebook p.11 §2a). Units can be healed (§14.3).
* Units cannot be used in some combats (dungeon/tomb: "Units cannot be used"; monastery burn:
  Units cannot be used) (Site Reference p.1).

### 10.2 Unit offer / recruitment rules (MKUE Rulebook p.8 §4a; p.9)

* Offer = players + 2; refreshed only at round start (MKUE Rulebook p.4 §2c).
* Recruit only units whose **site icon** matches the site (unit's upper-left icons; site's
  upper-right icon on Description card) (MKUE Rulebook p.8 §4a).
* Influence cost = number in unit card's upper-left corner.
* A newly recruited unit may be used immediately; it may not pay its own recruitment cost with
  its own Influence ability (MKUE Rulebook p.8 §4a).
* At a conquered **white city**: can recruit units of **all** types and may pay 2 Influence to
  add one Elite unit card to the offer (MKUE Rulebook p.8 §4e).

---

## 11. Skills

### 11.1 Skill tokens and types (MKUE Rulebook p.5 USING SKILLS)

* Skills belong to heroes but once in play are usable by their owner regardless of origin;
  players may gain skills of other characters present in the game (MKUE Rulebook p.5 §2b).
* Gained at **each even-numbered Fame level** (MKUE Rulebook p.5 §2; p.12).
* Three rulebook types (MKUE Rulebook p.5 §4):
  1. **Flip, once per round, on your turn** (Motivation exception: usable during other
     players' turns): flip face down until start of next round.
  2. **Once per round, persistent until start of your next turn**: announce loudly, put token
     in centre of table; it affects other players; take back at start of your next turn (or
     round end if sooner), flip face down; flipped up next round.
  3. **Once each turn** (no special symbol).
* Engine state: `available | flipped`, plus `centreUntilStartOfMyNextTurn` for type 2.
* Some skills are passive and always on (e.g. Bonds of Loyalty gives an extra command token —
  cross-check source only, ⚠️).

### 11.2 Skill acquisition at level-up (MKUE Rulebook p.12 §6b)

Flip the top **2** skill tokens from your skill deck; then choose one of two options:

* **Option A:** take one of the two (face up in front of you), put the other into the Common
  Skill offer, and take **any** Advanced Action card from the AA offer.
* **Option B:** take a token of another player from the Common Skill offer (if any), put
  **both** revealed tokens into the Common Skill offer, and take the AA card from the **lowest**
  position of the AA offer.

Either way: put new skill face up, put new AA card on top of deed deck, refresh the AA offer
(shift + new top) (MKUE Rulebook p.12 §6b).

### 11.3 Skill pile composition

* 11 tokens per hero; remove one interactive skill depending on game mode (competitive vs
  co-op) leaving 10; randomise face down (MKUE Rulebook p.3; p.15).
* **Solo:** also use the Dummy hero's skill set: remove its competitive interactive skill;
  whenever you gain a skill, also reveal one Dummy skill into the Common Skill offer; if you
  take such a skill, you must take the **lowest** AA card (MKUE Rulebook p.15 "Skills in a Solo Game").
* Skill phase restrictions and effect text are on the hero's Skill Description card (MKUE Rulebook p.5 §3);
  the extracted rulebook does not contain those card texts → see `03-rules-reference.md` §F for
  a secondary-source reconstruction marked ⚠️.

---

## 12. Fame, levels, level-up

### 12.1 Fame

* Fame is the main score resource; gained from defeating enemies, site rewards, exploration
  (First Reconnaissance), scenario bonuses, cards, etc.
* Fame track position = total Fame (can be reduced by Achievements at scoring only; some
  variants start with negative-equivalent). Moving the shield crosses **lines** (level
  thresholds).
* Level-up is **deferred to end of turn**, never immediate (MKUE Rulebook p.9 §5b bullet).

### 12.2 Level thresholds and stats

Thresholds read from the Fame-track artwork (Walkthrough p.6) — row starts:

| Level | Fame needed | Level-up reward | Armor | Hand limit | Command tokens |
|---|---|---|---|---|---|
| 1 | 0 | — | 2 | 5 | 1 |
| 2 | 3 | **skill + AA** | 2 | 5 | 1 |
| 3 | 8 | **level token / command** | 3 | 5 | 2 |
| 4 | 15 | skill + AA | 3 | 5 | 2 |
| 5 | 24 | level token / command | 3 | 6 | 3 |
| 6 | 35 | skill + AA | 3 | 6 | 3 |
| 7 | 48 | level token / command | 4 | 6 | 4 |
| 8 | 63 | skill + AA | 4 | 6 | 4 |
| 9 | 80 | level token / command | 4 | 7 | 5 |
| 10 | 99 | skill + AA | 4 | 7 | 5 |

* ✅ **VERIFIED 2026-10-24.** The threshold row-boundaries are read off the official UE Fame
  track (rows: 0–2, 3–7, 8–14, 15–23, 24–34, 35–47, 48–62, 63–79, 80–98, 99–119; 120 spaces
  total, consistent with the rulebook's "space 118 … last row" in the Auctioning Heroes
  variant, p.16). The Lead re-rendered the walkthrough's board photo (p.6) at ~300 dpi and read
  every row start: **3/8/15/24/35/48/63/80/99**. The community engine
  (`mage-knight-digital`, `levels.ts`) value `[0, 3, 8, 14, 21, 29, 38, 48, 59, 71]` is **wrong
  from level 4 onward** — do not use it. `game-data/levels.json` now carries the verified
  values (`status: verified-official`); see `game-data/README.md` §7.15.
* Armor/hand values per Level token: 1-2 → 2/5; 3-4 → 3/5; 5-6 → 3/6; 7-8 → 4/6; 9-10 → 4/7
  (rulebook p.3 states 1-2 values; Walkthrough p.6 gives level-5 hand limit 6; the intermediate
  tokens are cross-checked from engine data, ⚠️ verify on physical tokens).

### 12.3 Level-up procedure (MKUE Rulebook p.11 §6, p.12 §6b)

Process **each crossed line in ascending order**:

1. If the new level is **odd** (3,5,7,9): remove top Level token → new Armor/Hand; flip removed
   token to shield side → new **Command token**.
2. If the new level is **even** (2,4,6,8,10): gain **1 Skill** (§11.2) and **1 Advanced
   Action**.
3. Multiple levels in one turn are all processed, in order (e.g. 1→3 gives level-2 skill/AA
   then level-3 command token) — infer from p.11 §6 "for each line crossed".
4. A new command token gained during the same turn allows postponing a Unit reward until after
   level-up (MKUE Rulebook p.11 §5d exception).

---

## 13. Reputation

* Track with a **central 0**; positive to one side, negative to the other; a **red X** space at
  which locals refuse to interact (**no interaction at all**) (MKUE Rulebook p.8 §2a; Walkthrough p.9).
* Interaction modifier = the number on your current reputation space, applied **once** at the
  moment interaction starts; later reputation changes this turn have no effect on this
  interaction (MKUE Rulebook p.8 §2a; p.8 §5a).
* Reputation changes (table; each is a direct move along the track):

| Event | Reputation |
|---|---|
| Assault any fortified site (keep/mage tower/city) | **−1** per assault (MKUE Rulebook p.8 §1a) |
| Assault another player's keep | **−1** (MKUE Rulebook p.8 §1a) |
| Burn a monastery | **−3** (MKUE Rulebook p.8 §1c) |
| Plunder a village (once between your turns, not an action) | **−1**; draw 2 cards (Site Reference p.1; Walkthrough p.9) |
| Defeat rampaging orc marauders | **+1** each (MKUE Rulebook p.10 §2a) |
| Defeat rampaging draconum | **+2** each (MKUE Rulebook p.10 §2a) |
| Some card/unit effects, scenarios | as written (e.g. Northern Monks +1 on destroy; scenario starts +2) |

* Reputation track numeric spaces: `⚠️ UNVERIFIED` — the track is photographed at an angle in
  the walkthrough (MKUE Rulebook p.6); visible values include −11, −9, −7, −5, −3, −2, −1, 0, and positives
  +1…+5 with an **X** at the negative extreme. Exact mapping/`X` position must be verified on
  the physical board. Engine should model it as an ordered list of spaces with a
  `noInteraction` flag rather than hard-coded arithmetic.
* Scenario modifiers: Blitz Conquer starts +2 Reputation; first-turn reputation changes affect
  Tactic selection? — no, Tactic selection uses Fame only.

---

## 14. Wounds and healing

### 14.1 Wound cards (MKUE Rulebook p.11 WOUNDS §1)

* A wounded Hero takes Wound cards **into hand** (MKUE Rulebook p.11 §1).
* Wounds can never be discarded unless an effect explicitly allows; cannot be played sideways;
  cannot be discarded at end of turn (MKUE Rulebook p.11 §1a).
* Resting (or effects) move Wounds to the discard pile (MKUE Rulebook p.11 §1b).
* When the **round ends**, all Wounds in hand are shuffled back into the Deed deck (MKUE Rulebook p.11 §1c).
* Unit Wounds: Wound card across the unit card (MKUE Rulebook p.11 §2). Poison can give a unit 2 Wound cards
  (needs 2 heals) (MKUE Rulebook p.11 §3c; p.10 §6a).
* Knock-out: see §7.4.6.

### 14.2 Healing points (MKUE Rulebook p.11 §3)

* Effects provide **Heal X** points; heal points may also be bought at villages (3 Influence
  each) and monasteries (2 Influence each) (MKUE Rulebook p.8 §4b; p.11 §3b).
* Uses (pool all points first, then spend):
  * 1 point → throw away one Wound from **hand** (return to Wound pile);
  * heal a Wounded **Unit**: pay points equal to the Unit's **level** (upper-right number);
    remove the Wound card; if it has 2 Wounds, repeat (MKUE Rulebook p.11 §3c);
  * an effect that "heals a Unit" heals **one** Wound on it (MKUE Rulebook p.11 §3c).
* Timing: healing any time during your turn **except during combat**; combat damage may be
  healed later in the same turn once combat is over; unspent heal points disappear when
  entering combat (MKUE Rulebook p.11 §3d).
* Magical Glade is **not** healing: may throw away one Wound from hand or discard pile; cannot
  heal Units; cannot combine with other healing (MKUE Rulebook p.11 §3d note; Site Reference p.1).
* Resting is not healing (Wounds go to discard, not Wound pile) (MKUE Rulebook p.6 §7; p.11 §3).

---

## 15. End of turn / end of round / end of game

### 15.1 End-of-turn sequence (MKUE Rulebook p.11 §1–7)

No effects may be played during this sequence (MKUE Rulebook p.6 §8c). Implement as a fixed pipeline with
the following ordered steps:

1. **Return mana dice** to Source with reroll — actually announced before the pipeline
   (MKUE Rulebook p.6 §8a), but the pipeline starts with it for engine ordering (MKUE Rulebook p.11 §1).
2. **Forced Withdrawal** if not on a safe space: backtrack to a safe space, **+1 Wound per space
   backtracked** (MKUE Rulebook p.11 §2). (Order note: rulebook lists withdrawal after dice return; damage
   from withdrawal can affect the rest of the pipeline, e.g. knock-out is *not* re-checked
   outside combat.)
3. **Clear the play area** (MKUE Rulebook p.11 §3): return all mana crystals/tokens from play area to bank;
   put all cards played this turn into discard; thrown-away cards removed (Wounds back to
   Wound pile).
4. **Use the benefits of your space** (MKUE Rulebook p.11 §4):
   * Magical Glade: may throw away 1 Wound from hand or discard pile; no unit healing;
   * Crystal Mine: gain 1 crystal of the mine's colour (nothing if already 3 of that colour);
   * (Deep Mine: choose one of its colours, Site Reference p.2.)
5. **Claim combat rewards**, in any order (MKUE Rulebook p.11 §5): crystals (random rewards rolled: black =
   1 Fame instead, gold = choose colour); Artifacts (draw n+1, 1 bottom, rest top of deck);
   Spells/AAs (choose from offers; cannot take AA from unit offer this way; replenish);
   Units (any from unit offer, ignore type/cost; if no command slot, disband or forfeit; may
   postpone if a level-up this turn grants a command token).
6. **Level up** for each line crossed this turn (MKUE Rulebook p.11 §6; §12.3).
7. **Draw new cards** (MKUE Rulebook p.11 §7):
   * before drawing, may discard any number of **non-Wound** cards from hand;
   * draw up to **modified hand limit** (keep/city bonus per §3.1.7; Planning Tactic; "next
     time you draw" effects);
   * if hand > limit, do not discard down (just draw none);
   * if deed deck runs out while drawing, stop; do **not** reshuffle discard (only "Long Night"
     Tactic allows it) (MKUE Rulebook p.11 §7d).
8. **At least one card must have been played or discarded** during/at end of the turn, except
   when hand was empty but deck not empty (MKUE Rulebook p.6 §5a; summary p.23 "at least one if no cards were
   played"). Engine: enforce as a legality check on turn submission, not as a forced discard.

### 15.2 End of round

See §3.4. Also: **Wounds in hand shuffle back into the deed deck** when the round ends
(MKUE Rulebook p.11 §1c); this is the main Wound-recycling mechanism and matters for the Greatest Beating
achievement (Wounds in deck).

### 15.3 End of game

Scenario-defined (MKUE Rulebook p.4 §5, pp.18–22). Engine: check scenario end after every turn, seed final
turns, then evaluate the scenario's success condition and scoring (`03-rules-reference.md` §K).

---

## 16. Sites

### 16.1 Site taxonomy (rulebook grouping, p.1 note)

* **Fortified sites**: keep, mage tower, city → assault, movement ends, Reputation −1, garrison
  fortified (MKUE Rulebook p.7 §4a, p.8 §1a).
* **Inhabited sites**: village, monastery, keep, mage tower, (conquered) city → interaction
  (MKUE Rulebook p.6 §6c, p.8 §1).
* **Adventure sites**: ruins (ancient ruins), dungeon, tomb, monster den, spawning grounds →
  entry as action leads to combat/reward (MKUE Rulebook p.6 §6c, p.8 §1b; Site Reference p.1).
* **Rampaging enemies**: orc marauders (green tokens), draconum (red tokens) — on map spaces,
  challenge/provoke (MKUE Rulebook p.7 §4b–c, p.8 §1d–e).
* **Special terrain/sites**: magical glade, crystal mine, portal, walls (expansion), deep mine,
  refugee camp, maze, labyrinth, graveyard, necropolis, hidden valley, Volkare's camp
  (Site Reference pp.1–2; expansion delta §L of 03).

### 16.2 Interaction (MKUE Rulebook p.8 "Interacting with Locals")

1. Interaction is your **action** for the turn (MKUE Rulebook p.8 §1).
2. Generate Influence: play any number of Influence effects; apply your Reputation modifier
   **once** at start (MKUE Rulebook p.8 §2a); at X reputation you cannot interact at all; add +1 per shield
   you have on the City card when interacting in that city (MKUE Rulebook p.8 §3a).
3. Spend Influence on the site's options (any number, same or different types) (MKUE Rulebook p.8 §5):
   * **Recruit Units** whose site icon matches; cost as printed (MKUE Rulebook p.8 §4a);
   * **Healing**: village 3 Inf/point, monastery 2 Inf/point (MKUE Rulebook p.8 §4b);
   * **Monastery**: learn an AA from the **unit offer** for 6 Inf (MKUE Rulebook p.8 §4c);
   * **Mage tower**: buy a Spell from the spell offer for 7 Inf + 1 mana of that colour
     (MKUE Rulebook p.8 §4d);
   * **City**: city-specific options (§16.3);
   * (Mines/glades don't have interaction; their benefit is at end of turn / start of turn.)
4. Reputation/shield bonus applies **once per turn**, no matter how many purchases (MKUE Rulebook p.8 §5a).

### 16.3 Cities

* Assault rules: normal fortified site + city combat bonus from the City card's upper part
  (MKUE Rulebook p.10 CITY ASSAULTS §1):
  * **White city**: all defenders +1 Armor;
  * **Blue city**: defenders with Ice or Fire Attack +2 Attack, defenders with Cold Fire +1;
  * **Red city**: defenders with physical Attack gain **Brutal**;
  * **Green city**: defenders with physical Attack gain **Poison**.
* Garrison: at reveal, draw face-down enemy tokens per coloured circles on the city figure
  base (level-dependent). Composition (from game data, ⚠️ secondary source — verify against
  city level tables on the City cards / scenario book): see `03-rules-reference.md` §C.
* Conquest: put a shield on the City card per defeated enemy; when all defenders defeated →
  conquered; determine **City leader** = most shields (tie → the player whose shield is first
  in the row) (MKUE Rulebook p.10 §2); leader takes the City card with all shields; visitors place their
  figure on the card (MKUE Rulebook p.10 §2b).
* City purchase options (lower half of City card, p.8 §4e):
  * **Red**: buy Artifacts for 12 Inf each (drawn at end of turn like a combat reward);
  * **Blue**: buy Spells as at a mage tower (7 Inf + mana);
  * **White**: recruit Units of all types; 2 Inf to add one Elite Unit card to the offer;
  * **Green**: pay 6 Inf to gain a card from the AA offer (replenish) or a random card from the
    top of the AA deck; put on top of deed deck.
* Interaction in a conquered city: +1 Influence per own shield on the City card (MKUE Rulebook p.8 §3a);
  hand-limit bonus +1 (+2 leader) (MKUE Rulebook p.11 §7b).
* Megapolis variant (MKUE Rulebook p.18): two cities on adjacent spaces treated as one big city for assault;
  levels must sum to the Megapolis level; conquered it counts as one city.

### 16.4 Site reference

Page-level interaction/reward rules for every site are tabulated in
`03-rules-reference.md` §C (canonical source: the site description card text in
`MK_master_reference_sheet.txt`, which is a scan of the actual Site Description cards).

### 16.5 Scenario interface (what a scenario config must provide)

A scenario is data + a small set of overrides; the engine's scenario schema needs
(RB pp.18–22; SB pp.14–20; EXP pp.6–13 — full tables in `03-rules-reference.md` §I):

1. **Player count/type** (competitive / co-op / solo / team).
2. **Round limit and starting time of day.**
3. **Map shape** (Wedge A / Fully Open B / open limited to 3–5 columns / predefined).
4. **Tile counts** (countryside count; core city count; core non-city count) and any tile
   inclusion/exclusion rules (e.g. Mines Liberation removes tiles without mines).
5. **City levels** (per reveal order or fixed) and whether cities are enterable/conquerable
   or "friendly" (none is leader).
6. **Special setup** (dummy player; starting Fame/Reputation; extra Source die / unit offer
   size; deck removals such as the 4 competitive spells; higher-level start).
7. **Special rules hooks** (e.g. +1 Fame per tile revealed; explore cost ×3; secret dungeon
   entrances; faction leader levels; starting-location rules).
8. **End condition + final-turn seeding rule** (see §1.3).
9. **Scoring** (Achievements only / + cities / + goal-and-time scoring for solo & co-op).
10. **Per-round housekeeping overrides** (Tactic removal, glade shield removal, mine income,
    etc.).

Treat every item as data in the scenario definition, not as engine code; scenario rules
interact with core rules in ways the engine must not special-case (e.g. "cities cannot be
entered" changes the movement legality checks; "friendly city" changes interaction flags).

---

## 17. Solo and co-operative play

### 17.1 Dummy player (MKUE Rulebook p.15)

Setup: randomly choose an unused hero as Dummy; keep only Hero card, round-order token and its
16 basic-action deck. Give the Dummy **three crystals** in the colours of the three dots at the
bottom of its Hero card. Do **not** count the Dummy for "players + 2" dice/units.

Per round: Tactic per scenario rule; Dummy does not benefit from the Tactic — it only sets
round order.

On the Dummy's turn (MKUE Rulebook p.15):
1. If its deed deck is **empty** → announce End of Round; other players get one more turn.
2. Otherwise flip the top **3** cards into its discard pile. Look at the colour of the last
   flipped card (top of discard):
   * no crystal of that colour in its Inventory → turn over;
   * has crystals of that colour → flip that many additional cards; turn over.
3. If the deck lacks enough cards → flip as many as possible; next turn it announces End of
   Round.

Round prep extra (MKUE Rulebook p.15):
* When an AA card is removed from the lowest position of the AA offer, add it to the Dummy's
  deck instead, then shuffle the Dummy's deck.
* When a Spell is removed from the lowest position of the spell offer, put it under the spell
  deck as usual, and give the Dummy **one crystal of that Spell's colour** (Dummy may exceed 3
  crystals). *Note: in solo, the Dummy does not take AA offers; p.19 says remove used tactics.*

Solo skills (MKUE Rulebook p.15): use the Dummy hero's skill set as described in §11.3.

### 17.2 Co-operative / team rules (MKUE Rulebook p.15, p.19)

* Team scenarios: hidden teams; interactive skills ignore teammates; interactive **Spells**
  do not ("magic does not recognise friend from foe") (MKUE Rulebook p.15).
* Allied players cannot trade crystals/artifacts/units; cannot share spaces at end of turn
  (except cities/portal → Forced Withdrawal for the later entrant); cannot PvP each other
  (MKUE Rulebook p.15).
* Team scoring: base = lower Fame of the two; per Achievements category use the **better**
  player's score; Greatest Beating uses the **largest** penalty; shared score (MKUE Rulebook p.15).

### 17.3 Co-operative city assault (MKUE Rulebook p.13)

1. Initiator must: End of Round not announced; scenario conditions not yet fulfilled; no action
   taken yet this turn; figure on a space adjacent to the city with no other player there (or
   able to reach it via "Underground Attack" Spell) (MKUE Rulebook p.13 §2).
2. Suitable heroes: adjacent to the city; round-order token not face down; ≥1 non-Wound card in
   hand. Initiator invites one or more; may exclude suitable heroes (MKUE Rulebook p.13 §2d, §3a).
3. Propose distribution of **enemy tokens**; each player must get at least one. If all invited
   agree → begin; else initiator may re-propose or continue their turn as if nothing happened
   (MKUE Rulebook p.13 §3).
4. All participants flip round-order tokens face down (skip next turn) (MKUE Rulebook p.13 §4).
5. Randomly distribute enemy tokens face down, respecting agreed counts (in secret, even from
   reverse side) (MKUE Rulebook p.13 §5).
6. Participants assault in round order starting with initiator; each resolves **all phases** of
   *their own* combat before the next player (MKUE Rulebook p.13 §6):
   * each may use one Source die (returned only after the assault) and all effects available
     before/at start/during their turn;
   * each must move directly to the city first; no other movement/action; provoked rampaging
     enemies join that player's portion; may voluntarily challenge other adjacent rampaging
     enemies;
   * each faces only assigned enemies; "all enemies" effects only affect assigned ones;
   * reputation loss and city shields as usual.
7. City conquered when all defenders defeated (regardless of joined rampaging enemies); then
   participants end their turns in round order (healing/special effects allowed before end)
   (MKUE Rulebook p.13 §7–8).

---

## 18. Player vs. Player combat

### 18.1 Legality (MKUE Rulebook p.12 §1)

Invoke PvP as your action if: you entered a space containing another player and cannot/won't
continue moving; the space is not a portal or city; End of Round not announced and scenario end
not triggered; the defender's round-order token is not face down. **Not** allowed to enter a
player's space via a move that provokes a rampaging enemy (MKUE Rulebook p.12 §1 note).

### 18.2 Attendance (MKUE Rulebook p.12 §2–3)

* **Aggressor** vs **defender**. Defender may play any effects normally usable before their
  turn/in other players' turns; may not declare End of Round.
* **Fully attend**: defender takes their next turn in advance.
  * flips round-order token face down (cannot be attacked while face down; when their turn
    would come, flip back and skip it completely, no End-of-Round announcement);
  * may benefit from start-of-turn effects (e.g. magical glade mana), use a Source die, use
    Skills valid in the situation;
  * after combat may play special/healing effects, then completes the usual end-of-turn steps;
  * may not move, reveal a tile, or perform any other action;
  * cannot fully attend with **no non-Wound cards in hand**.
* **Partially attend**: does not flip token (attachable), plays next turn normally; during the
  combat may **not** use a Source die (unless an effect allows) and may not use Skill tokens
  except those usable on other players' turns; after combat their part of the turn ends
  immediately — no healing/after-combat special effects, no end-of-turn procedure, no draw;
  unused crystals remain for their regular turn (MKUE Rulebook p.12 §3b).

### 18.3 Phases (MKUE Rulebook p.12–13)

**Phase 1 — Ranged and Siege Attacks.** Players alternate; **defender starts as attacker**.
When it's your turn to attack: attack or pass; attacker plays any number of Ranged/Siege attacks
+ special effects:
* if the blocker is the defender and the combat is at a fortified site (keep/mage tower), the
  aggressor can only use Siege Attacks (MKUE Rulebook p.12 §3a);
* cards played sideways cannot contribute (MKUE Rulebook p.12 §3b);
* blocker plays any Blocks: efficiency rules as normal; if attack has multiple elements the
  Block is efficient if efficient against **at least one** element (MKUE Rulebook p.12 §4a);
* **partial blocking is allowed**: attack total is reduced by **1 per 2 points** of block
  (Swift-like) (MKUE Rulebook p.12 §4c; example in text: Fire Ranged Attack 4 vs Ice Block 4 → 2; Block 7 →
  3). An effect that removes Swiftness makes block fully efficient (1:1);
* leftover attack → damage assigned by the **attacker**, who chooses targets: to wound a Unit
  requires damage = its Armor (double if resistant to any element in the attack); to wound the
  Hero requires damage = Hero Armor (repeatable); attacker may leave damage unassigned if no
  target has Armor ≤ remaining damage (MKUE Rulebook p.12 §5);
* if both pass in succession → phase ends.

**Phase 2 — Melee Attacks.** Aggressor starts as attacker; any attacks (including Ranged/Siege;
fortifications ignored); sideways card = physical Attack 1 (adding it makes the attack physical);
blocks work **fully** (1 damage removed per 1 block) (MKUE Rulebook p.13 MELEE §1); damage used as above plus:
* **steal an Artifact** for 5 damage (only artifacts in blocker's discard pile, play area, or
  assigned to a **wounded** unit — not hand/deck/unwounded unit's banner); put it in the
  attacker's discard pile (MKUE Rulebook p.13 §2a);
* **force retreat** by converting damage to Move: choose an accessible safe adjacent space;
  spend damage equal to its **unmodified Move cost**; blocker moves there, combat ends; never
  provokes rampaging enemies (MKUE Rulebook p.13 §2b).
* alternate until one retreats or both pass in succession (MKUE Rulebook p.13 §3).

### 18.4 Outcome (MKUE Rulebook p.13 COMBAT OUTCOME)

* Retreat → other player victorious:
  * if victor is **lower level**: 1 Fame + 2 per level they are lower;
  * same level but **lower Fame**: 1 Fame;
  * same/higher Fame: nothing.
* Both stop attacking → **draw**, no Fame; aggressor withdraws to the space attacked from
  (not Forced Withdrawal; if that space is unsafe, Forced Withdrawal applies).

### 18.5 Special combat effects in PvP (MKUE Rulebook p.13)

* Effects targeting enemies can target opponent's **unwounded Units**, never the Hero; red/blue
  elemental-resistance rules as normal; "destroy" → wound; Unit Armor never below 1;
  "number of enemies" for scaling effects = opponent's Ready unwounded Units + Units
  contributing to the current attack/block + 1 for the Hero (MKUE Rulebook p.13 §2e–f).
* Value/rule modifiers last for whole combat (MKUE Rulebook p.13 §3).
* "Prevent an enemy from attacking" → choose one contributing Unit and deduct its contribution;
  the Unit stays Spent; cannot cancel special effects or Blocks (MKUE Rulebook p.13 §4).
* "Skip Block and Damage phases" → cancel one attack (no damage), cards stay played/spent,
  combat continues (MKUE Rulebook p.13 §5).

---

## 19. Timing, priority, undo

### 19.1 Effect windows (engine event points)

| Window | Who may act | Source |
|---|---|---|
| Before Tactic selection completes | nobody (blocked) | p.6 §1c |
| Pre-turn / other-player's-turn | any player with "before your turn"/"on another player's turn" effects; also reactions to announced effects | p.6 §1 |
| Turn start | active player: start-of-turn effects (glade mana, keep? no), special/healing, "before turn" | p.6 §5b; Site Reference p.1 |
| Movement | active player: move/influence/special/healing effects; reveals | p.7 |
| Action declaration & resolution | active player; reveal of hidden information creates a commit point | p.6 §6d; p.5 REVERTING |
| Combat phases | inside a phase, effects legally tagged; no healing; opponent may react only in PvP (as attacker/blocker in turn order) | p.8 §5–6; p.12 |
| End-of-turn sequence | **nobody** — no effects | p.6 §8c |
| Between turns | "on another player's turn" effects only | p.6 §1 |
| End-of-round announce + final turns | no effects after your last turn | p.4 §4e; p.6 §1c |

### 19.2 Simultaneous resolutions

The rulebook does not state a general "active player chooses order" rule; it gives local ones:
* Assign Damage: player chooses the order of unblocked enemies (MKUE Rulebook p.9 §1b).
* Multiple enemy Defend abilities (expansion): the fighting player decides the assignment
  order (expansion p.2).
* Co-op assault: order fixed by round order.
Implement: **the player whose turn it is owns all simultaneous-ordering choices**; for
PvP, the phase's attacker owns choices within their attack. Flag as an engine decision (see
`04-faq-clarifications.md` A-xx).

### 19.3 Undo / take-backs

See §9.4. Engine must be able to roll back to the last commit point (hidden-info reveal, die
roll, opponent reaction). Digital undo is **not** a rules entitlement — it is a convenience;
anything already locked by p.5 REVERTING must not be undoable in "strict" mode. 04 lists the
states that are irrelevant to the outcome and therefore safe to auto-collapse (e.g. which
sideways card paid which point, order of identical mana payments).

---

## Sources

* `reference/rulebooks/MKUE_rulebook.pdf` → `reference/extracted/MKUE_rulebook.txt`
  (MKUE Rulebook, pp.1–24) — primary rules authority.
* `reference/rulebooks/MKUE_walkthrough.pdf` → `reference/extracted/MKUE_walkthrough.txt`
  (MKUE Game Walkthrough, pp.1–20) — worked examples, board artwork (move costs p.6,
  Fame/Reputation tracks p.6, interaction/units p.9).
* `reference/rulebooks/MK_master_reference_sheet.pdf` →
  `reference/extracted/MK_master_reference_sheet.txt` (Site Description card text, enemy
  abilities, walls/location tiles) — secondary primary source for site rules.
* `reference/rulebooks/MK_base_rulebook_2012.pdf` →
  `reference/extracted/MK_base_rulebook_2012.txt` (2012 base rulebook; **complete Scenario
  Book** pp.12–20) — scenario authority, cross-checked against UE summaries.
* `reference/rulebooks/MKUE_expansions_rulebook.pdf` →
  `reference/extracted/MKUE_expansions_rulebook.txt` (Lost Legion/Krang/Shades of Tezla deltas,
  pp.1–15; official mini-FAQ p.15).
* Cross-check only (secondary, not authoritative): `mage-knight-digital/MageKnight` GitHub
  `packages/engine-rs/crates/mk-data/src/*.rs` and `docs/reference/*.md`, accessed 2026-10-24.
  Used for card/unit/skill/enemy inventories and level thresholds; **never** as the sole source
  for a rule.
