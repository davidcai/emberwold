# T1 winning line (First Conquest, seed 1)

**Status:** reference note · **Scope:** T1 engineering evidence and fun-pass aid · **Owner:** Lead

This is the deterministic winning line recorded as
[`tools/golden-traces/050-victory.json`](../../tools/golden-traces/050-victory.json) (seed 1,
Goldyx): **victory in round 3, fame 7, score 17, city conquered**. It exists so the owner's
fun pass and the tutorial copy can be checked against a real finished game, and so a bug in
the setup→city loop is reproducible. It is not a tuned strategy guide and not a balance claim:
the line was produced by an analysis bot, not a human playtester.

## Setup

- Scenario: First Conquest, 3 rounds (Day / Night / Day), city level 4, simplified dummy.
- Tiles: `starting_a` at (0,0), `countryside_1` at (2,1), `countryside_2` at (−2,−1),
  `core_city_green` at (4,2). Only the start tile is revealed at setup; `countryside_2` is
  never revealed in this line.
- Sites by end of game: portal (0,0), keep (0,−1), magical glade (2,1), village (3,1),
  monastery (2,2), city (4,2, conquered), plus the city tile's village (5,1) and glade (4,1).
- Enemies present: diggers (1,1), prowlers (3,0) — both left alive — and the city garrison
  guardsmen + swordsmen at (4,2). The line avoids the two rampaging enemies and assaults the
  city directly.

```
        q=-2      q=0        q=2        q=4        q=5
r=-1   countryside_2           ·          ·          ·
r= 0   ·        start          ·          ·          ·
                 portal(0,0)
                 keep(0,-1)
                 prowlers(3,0)  ← tile edge, not entered
r= 1   ·        ·            countryside_1  glade(4,1) village(5,1)
                              glade(2,1)
                              village(3,1)
r= 2   ·        ·            monastery(2,2) city(4,2) ★ conquered
```

Hero path: (0,0) → (1,0) → (2,0) → (2,1) → (3,1) → (4,1) → (4,2).

## Turn log

| Round/turn | What happens                                                                                                                                                                                                                                                                        | Key state       |
| ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------- |
| R1 T1      | Tactic `early_bird`; two Move cards (4 Move) → (1,0); explore (−2 Move) reveals `countryside_1` and spawns diggers/prowlers; discard three unplayable cards; end turn.                                                                                                              | Move 0, hand 0  |
| R1 T2      | One Move card (2 Move); discard four cards; end turn (dummy flips 3 of 16).                                                                                                                                                                                                         | Hand 0          |
| R1 T3      | Two Move cards (4 Move) → (2,0); play a Move card whose choice resolves to extra Move; move to (2,1).                                                                                                                                                                               | Move 0          |
| R1 T4      | One Move card (2 Move) → village (3,1); end turn. Dummy deck empties → End of Round announced; round 2 (Night) prepare runs.                                                                                                                                                        | Fame 0, round 2 |
| R2 T1      | Tactic `rethink`; play Move cards to explore the city tile from the village (2 Move), revealing the garrison; move to (4,1).                                                                                                                                                        | City visible    |
| R2 T2      | Two Move cards (4 Move) → city (4,2), cost 2. Challenge the city (reputation −1). No blocks; damage is taken as two Wounds; attack cards kill the **swordsmen** (armor 5) → fame 4. Combat ends. End of turn: level 2, first skill, level-up Advanced Action.                       | Fame 4          |
| R2 T3      | Challenge again — the one-combat-per-space-per-turn rule now allows it. Take the guardsmen's damage, make no attack, end combat; discard the level-up card; end turn.                                                                                                               | Guardsmen alive |
| R2 T4–T7   | Pass turns to run the dummy deck down; the dummy announces End of Round on T7; round 3 (Day) prepare runs.                                                                                                                                                                          | Round 3         |
| R3 T1      | Tactic `mana_steal`; discard five cards; end turn.                                                                                                                                                                                                                                  | Hand 0          |
| R3 T2      | Challenge the guardsmen (armor 7, fortified). Take one Wound; play the level-up Advanced Action (take a Wound → 5 melee attack) and a powered attack card (4 melee attack) → 9 attack ≥ 7; guardsmen defeated → fame 7. City conquered: game ends, score **17** (fame 7 + city 10). | Victory         |

## Why this line works

- **The city is only reachable through the village tile.** Exploring from the village reveals
  `core_city_green`, and the city hex (4,2) is one Move step from the adjacent tile hexes.
- **The 3-round clock is tight but sufficient**: about seven hero turns reach the city and two
  more fight it. Wounds do not matter because the game ends on conquest; healing and recruiting
  are not required for this line.
- **The city garrison needs two separate combats** (one combat per space per turn): the first
  combat kills the swordsmen, whose fame 4 triggers level 2 and the level-up Advanced Action;
  the second combat chips the guardsmen, and the third lands the 9-damage attack.
- **No blocks are needed.** Taking the garrison's attacks as Wounds is cheaper than spending
  cards on block when the game ends this turn.

## Reproduce

```bash
pnpm exec tsx tools/golden-traces/src/verify.ts   # replays and checks 050-victory.json
pnpm test:e2e --grep "victory golden trace"       # replays the same line through the real UI
```

The trace is hashed against the current bundle digest; if content or rules change, re-record it
and re-apply the trace-maintenance recipe in [`PROGRESS.md`](../../PROGRESS.md) (history).
