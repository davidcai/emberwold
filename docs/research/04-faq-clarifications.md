# Emberwold — Official FAQ Recovery & Rules Ambiguity Register

**Status:** research draft · **Owner:** rules-analyst · **Last updated:** 2026-10-24
**Purpose:** (A) record the recovery of the official Mage Knight FAQ and its contents;
(B) provide a prioritised register of rules ambiguities/edge cases that a rules engine must
decide, each with source quotes, options, a recommendation, and the risk of getting it wrong.

Citation keys: `FAQ p.N` = official WizKids *Mage Knight* FAQ v1.0 (7 Feb 2014), recovered via
the Wayback Machine (see §A.2); `RB p.N` = MKUE Rulebook; `WT p.N` = MKUE Walkthrough;
`SITE p.N` = Site Description card text (`MK_master_reference_sheet.txt`); `SB p.N` = 2012
Scenario Book (base rulebook pp.12–20); `EXP p.N` = MKUE Expansions Rulebook.
⚠️ = unverified.

---

## Part A — Official FAQ

### A.1 What the rulebooks promise

* "If you do not understand an effect or the interaction of two or more effects in combination,
  check the game website for FAQs." (RB p.5, EFFECTS §2)
* The UE rulebook contains **no FAQ section**. The **Shades of Tezla expansion rulebook has a
  one-page official mini-FAQ** (EXP p.15), reproduced in §A.4.

### A.2 Recovery attempts log

| # | Attempt | Result |
|---|---|---|
| 1 | Direct `wizkidsgames.com` (old official site) | **Site now redirects (HTTP 302) to `wizkids.com`** — old content, including the FAQ, is gone from the live site. |
| 2 | `wizkids.com` live site + WordPress REST search API (`/wp-json/wp/v2/search`) | Product pages and rulebook PDFs only (MKUE rulebook, expansions rulebook, walkthrough). **No FAQ page/PDF.** |
| 3 | Wayback Machine CDX API (`web.archive.org/cdx/search/cdx?...faq...`) | Two attempts, both **timed out after 60 s with 0 bytes** (host resolved, no response). Wayback CDX remains unreliable from this environment. |
| 4 | Wayback availability API (`archive.org/wayback/available?url=...`) | **SUCCESS**: snapshot of `wizkidsgames.com/mageknight/` exists (2024-02-29). The archived page still lists **`wp-content/uploads/mage/MK_FAQ_1.0v2.pdf`**. Direct archived FAQ URL (`/mageknight/faq`) has no snapshot — the PDF link is the route. |
| 5 | Fetch archived FAQ PDF through Wayback (`http://web.archive.org/web/20240229125017if_/http://wizkidsgames.com/wp-content/uploads/mage/MK_FAQ_1.0v2.pdf`) | **SUCCESS — official FAQ recovered**, 3 pages, v1.0 dated 7 Feb 2014. Content reproduced in §A.3. ✅ Lead preserved the PDF as `reference/rulebooks/MK_Official_FAQ_v1.0_2014.pdf` (+ extracted text) — gitignored, same policy as the other publisher files. |
| 6 | `r.jina.ai` proxy on Wayback / BGG / Fandom / Brave | CAPTCHA / 429 pages. |
| 7 | BoardGameGeek (files, threads, FAQ) | Cloudflare 403 (as briefed). |
| 8 | Fandom wikis (`mageknight.fandom.com`, `unofficialmageknighttheboardgame.fandom.com`) | Cloudflare 403. |
| 9 | Brave Search HTML (discovery) | Worked once for discovery of community rules pages; subsequently rate-limited/CAPTCHA. Not used for FAQ retrieval. |
| 10 | DuckDuckGo html/lite, Mojeek, Marginalia | anomaly/CAPTCHA/no result. |

**Conclusion:** the official FAQ **was recovered** (v1.0, 2014 — i.e. the base-game era; it
references the Lost Legion rules but predates the 2018 Ultimate Edition). Where FAQ v1.0 and
the 2018 UE rulebook differ, the **UE rulebook wins**; the FAQ still resolves many questions
the rulebook leaves implicit. No post-UE official FAQ was located. Shade of Tezla's mini-FAQ
(§A.4) is the only later official clarification found.

### A.3 Official FAQ v1.0 — full content, organised

> Quoted/condensed from the recovered PDF (3 pp.). Answers are official; page numbers refer to
> the FAQ PDF pages.

#### Game setup (FAQ p.1)

| Q | A |
|---|---|
| What do the 3 coloured circles on the bottom of the Hero card mean? | They are for the **Dummy player** rules used in solo/co-op. |
| "Wedge, Wedge, or Fully Open" in scenarios? | Lists the map shape per player count (e.g. 2–3 players Wedge, 4 players Fully Open). |
| Do setup-placed map tiles count toward the scenario's tile number? | **Yes.** With 8 countryside tiles and start tile A, 6 remain to explore. |
| How many dice/Units in a solo game? | Dummy does not count → normally 3, plus extras for Blitz/Volkare. |
| When do Elite (gold) Units come into play? | When creating the unit offer, **alternate Gold and Silver starting with Gold** if at least one Core tile is revealed. |

#### Mana (FAQ p.1)

| Q | A |
|---|---|
| Reroll mana dice one at a time when the "at least half basic" rule fails? | **Simultaneously reroll all black and gold dice**; repeat as needed. |
| Is black a wildcard at night? | **No** — black only for specific effects. |
| How can I pay mana? | Crystal from Inventory / mana token / **one** Source die per turn. Cards like Mana Draw allow more Source dice. |
| Can "Rebirth" be cast in a dungeon during the day? | **No** — healing spell, cannot be cast in combat; once combat ends you're no longer in the dungeon so black mana is unavailable. |
| Does the Mana Steal Tactic die count as "a die from the Source"? | **No** — it is no longer in the Source. |
| Does "take a mana die from the Source" (Mana Draw strong) count as the 1/turn Source die? | **No.** "Pay a mana" ≠ "take a mana die from the Source". |
| Entering a dungeon during the day — black mana from Source? | **Yes**, a dungeon counts as night. |

#### Cards (FAQ pp.1–2)

| Q | A |
|---|---|
| What do the top-left icons mean? | Timing limits on when the card can be played. **Rules changed with Lost Legion**; the LL rules (LL rulebook p.9) should be used **even without LL**. ⚠️ That LL timing-rules page is **not in our extracts** — see gap §C item 3. |
| Do Wounds count as cards in hand for the Tactic "Planning"? | **Yes.** The "Wounds aren't cards" ruling is for effects like Improvisation, not hand-size. |
| Is a spell powered by red mana a "red card" for resistances/specials? | **Yes** — example: Fire Attack + polymorph vs Fire-resistant enemy → attack halved, polymorph ignored. |
| Can I play Noble Manners in a village without spending the Influence and still get Fame? | **Yes**, as long as you use your action to interact. |
| Explain Maximal Effect. | Copies another card's text 2× (basic) or 3× (strong), e.g. Maximal + Rage = 3× Attack 2 (cannot split between enemies); Maximal basic + Crystallize = 3 crystal conversions; Maximal strong + Crystallize = "gain a crystal of any colour" ×2 → 2 crystals. |
| Does Demolish work on Fire-resistant enemies? | First part **yes** (targets the building, not the enemy); second part (−1 Armor) **no effect**. |
| Recruit a Unit via Heroic Tale, disband it, recruit another in the same interaction — Fame/Rep for both? | **Yes.** |
| Maximal Effect + Determination to block 2 enemies? | **No** — both blocks come from one card; block must be fully assigned to one enemy; leftovers are wasted. |
| Composite cards (Concentration, Will Focus, Maximal Effect) + resistances? | The **second card** dictates resistance interaction; e.g. Maximal strong + Ice Shield vs Ice-resistant enemy → special effect does not happen. |
| Crystal Mastery strong: crystals used before/after the card, and the one used to power it? | **Returns all crystals used that turn**, including before/after, including one used to power it — but only if it was actually a **crystal**; a Source die payment returns nothing. |
| Call to Arms basic + Utem Swordsmen ("Attack or Block 6. This Unit becomes Wounded")? | You may self-wound them (not "assigning damage"); when recruited from the offer it arrives **ready and healthy**, so it heals. |
| Tovak's Cold Toughness strong — how many +1s? | Ice Block 5 +1 per **ability printed on the token** (Swift, Brutal, Paralyze, Poison, Fortified, Unfortified, Assassination, Cumbersome, Elusive, Fire res, Ice res, Physical res) +1 per attack colour (Cold Fire counts as two). **Abilities granted by the site/city do NOT count.** Special attack types are not abilities (LL rulebook). |
| "Long Night" — when can I add 3 cards? | As soon as the deck is empty, **even mid-draw** (RB p.9 → actually RB p.11 §7d). |
| Into the Heat: only units with intrinsic attack/block? | **Yes** — it increases an existing ability; cannot grant one. It boosts any type of Attack or Block. |
| Magic Talent: enter combat, use Call to Glory from the spell offer, recruit a Unit mid-combat? | **Yes** — Magic Talent has the "playable in combat" icon. |
| Space Bending: still pay 2 Move to explore? | **Yes.** |
| Arythea's Mana Pull: black Source die during the day? | **Yes.** |
| Extra Source dice from effects without using the regular 1 die? | **Yes.** |

#### PvP (FAQ p.2)

| Q | A |
|---|---|
| Can you declare End of Round during PvP combat? | **No.** |

#### Skills (FAQ p.2)

| Q | A |
|---|---|
| Motivation in solo: do I get the mana? | **Yes** — you have both least and most Fame. |
| Can "Who Needs Magic?", "I Don't Give A Damn" and "Universal Power" apply to the same sideways card? | **No.** |
| Who Needs Magic +3 if no Source die used — can I use a die later? | **No.** |
| Can Leadership boost a Unit ability it doesn't have? | **No.** |

#### Combat (FAQ p.2)

| Q | A |
|---|---|
| Adjacent to rampaging enemy, spend 2 Move to **explore** — provoke? | **No** — only actually moving from one adjacent space to another provokes. |
| Assault a city with Earthquake + Demolish? | **Order matters**: Earthquake first (−4 Armor), then Demolish (removes fortification). |
| Ice Shield block insufficient — does the armor reduction still apply? | **Yes** — extra effects apply unless stated otherwise. |
| Exploding Shield blocking a summoned creature — destroy the summoner? | **No** — destroys the summoned creature; no Fame. |
| Does Ambush boost a sideways card (Attack 1/Block 1)? | **Yes** — sideways play equals "Attack 1"; but **not** Unit-activated attacks. |
| Can Armor drop below 1? | **No** ("to a minimum of 1" implied on such cards). |
| Poison wounds put into discard count toward knockout? | **No** — only Wounds taken to hand. |

#### Cities (FAQ pp.2–3)

| Q | A |
|---|---|
| Move cost into a city? | **Always 2**, ignoring terrain. |
| Must I fight all city enemies? | **Yes** — combat with every enemy; you may choose not to attack/block some, as normal. |
| Killed city enemies respawn on retreat? | **No.** |
| How do cities get shields? | One per defender defeated, in order (RB p.9 Combat Outcomes). |
| Do summoned creatures get the city bonus? | **Yes** (e.g. summoned monster in Red City becomes Brutal). |
| City with Crypt Worm — are all defenders double fortified? | **Not necessarily** — you group enemies for attack purposes; those grouped with the Crypt Worm become double fortified. |
| Does city shield scoring count if not conquered? | **No.** |

#### Resting (FAQ p.3)

| Q | A |
|---|---|
| Declare Standard Rest, then heal away the last non-Wound card? | You first declare "Resting" (type not yet fixed). If healing leaves only Wounds, your only legal rest is **Slow Recovery**. (Better: don't heal and Standard Rest discarding the heal card.) |

#### Other (FAQ p.3)

| Q | A |
|---|---|
| Planning/Keep wording vs rulebook ("draw an extra card") | Both cards should read **"increases your hand limit by one"**; the rulebook is correct. |
| Always +1 Reputation for green/red enemies? | **No** — only for **rampaging** enemies. |
| "At the start of turn" effects (e.g. Magical Glade) when attacked by Volkare/another player? | Only if you **fully attend**. |
| Must I fight ruins enemies after moving onto a face-down ruins token? | **No** — the reveal does not force combat; ruins remain an adventure site/safe space. |
| How often can the Scout's "explore at distance 2" be used? | **Once per turn** ("a new tile" wording). |
| Explain Forced Withdrawal. | Failed fortified assault withdrawal is **not** Forced Withdrawal. Forced Withdrawal only at end of turn when not on a safe space (e.g. assault/PvP from a lake, or exploring while standing on a lake). Also applies if your turn ends on another player's space when PvP is not allowed (and you lose the action — RB p.6 §8e). |
| "Exhaustion"/"Depleted mana dice"? | Walkthrough-only terms; "exhaustion" = hand of only Wounds; black dice depleted in Day, gold at Night. |
| Heal effect on a Unit with 2 Wounds? | Heals **one** Wound. |
| Can I disband a Unit voluntarily? | **Only** when recruiting a new one and no free command token. |

#### Commonly missed / misplayed rules (FAQ p.3)

1. You **must pay a mana** when buying a spell at a mage tower.
2. When a monastery is revealed, add an AA card to the **unit space**; remove it if still there
   at end of round; each new round reveal one AA per unburned monastery on the map.
3. At the start of each round after the first, remove the **bottom** spell and advanced action
   from the offers and put them at the bottom of their decks.

### A.4 Official mini-FAQ — Shades of Tezla (EXP p.15)

| Q | A |
|---|---|
| **Mystical Map** | Must be used in the movement part of your turn; you do not have to move or have Move points. |
| **Tome of Relearning** | May swap out a skill you previously flipped; the exchanged skill is **unflipped**; may take one of your own skills from the common skills area. |
| **Vial of Toxin** | Bonus can be added to any source, including a Unit's attack. |
| **Ice Shard / Fire Gem** | Add an element to an attack/block (e.g. Rage + red mana = Attack 4; + Ice Shard = Ice Attack 4; Fire Gem + Ice Shield basic (Ice Block 3) = Cold Fire Block 3). |
| Higher-level start with **Magic Familiars** | Pay Influence 6 **and** provide a crystal (could buy one for 3 Influence). |
| **Forked Lightning** (PvP) | Ranged Cold Fire Attack 1 per enemy up to 3; when assigning damage must assign ≥1 to that many different enemies even if useless. |
| **Shapeshift** | If Tovak gets Shapeshift, Cold Toughness can only give 5 Move or Ice Attack (no longer blocking). |
| **Avatars/enemies counting** | Avatars count as enemies for Flame Wave/Forked Lightning; Chivalry only if defeated. Krang's Puppet Master can take an avatar using **level-1 attacks and armor only**. |
| **Defend + Arcane Immunity** | Defend can increase Armor of an Arcane-Immune enemy. |
| **Vampiric Chalice** | Does not stop you being knocked out. |

---

## Part B — Ambiguity register (engine implementation)

Priority: **P0** = blocks a correct engine / produces wrong outcomes in common play;
**P1** = common edge cases / player-visible disputes; **P2** = rare, polish, or UI-level.
Columns: *Question* — *sources* — *options* — **recommendation** — *risk if wrong*.
Status tags: `[FAQ]` resolved by official FAQ, `[RB]` resolvable from the rulebook text (engine
just must implement exactly), `[LL]` resolved by the Lost Legion timing rules (which we do not
have — see §C item 3), `[OPEN]` genuinely undecided.

### B.1 Timing windows and effect ordering

**A-01 · P0 · When may "at the start of turn" / "before your turn" effects be played, relative
to round-start bookkeeping and End-of-Round announcement?**
*Sources:* RB p.6 §1a–c (windows; not allowed "after your last turn"), p.6 §5b (any special
effect after turn start), FAQ p.3 (start-of-turn effects only if you fully attend PvP).
*Options:* (a) a single window after End-of-Round check but before regular/rest decision;
(b) allow throughout the turn for "special" effects; (c) block once the End-of-Round has been
announced.
**Recommendation:** implement two distinct windows: `BEFORE_TURN` (also used for
"on another player's turn" effects, legal between any two turns including before your first and
after your last until the last-turn-of-round restriction) and `TURN_START` (start-of-turn
effects — glade mana, "at the start of your turn" cards). Both precede the regular/rest
decision. Kill both windows as soon as the player's final turn of the round has ended (RB
p.4 §4e). *Risk:* mis-sequencing lets players play buffs after seeing the next card draw or
after a round-ending announcement, which is a real rules violation (RB p.6 §1c).

**A-02 · P0 · Reaction timing: can a player respond to an announced effect before it resolves,
and can they respond to the resolution?**
*Sources:* RB p.6 §1b — "You can also play these effects in reaction to another player
announcing they will play an effect (and evaluate them before that effect). You cannot do this
in the middle of an effect evaluation."
**Recommendation:** model an **announce → reaction window → resolve** loop. The total
resolution of the announced effect (including any choices it makes) is atomic for reaction
purposes. *Risk:* allowing interruption mid-effect (e.g. between Maximal Effect copying and
choice of target) changes outcomes and contradicts the rulebook.

**A-03 · P1 · Who chooses the order of simultaneous effects (e.g. two players' persistent
interactive skills; multiple end-of-turn triggers for one player)?**
*Sources:* RB gives local rules only (damage order p.9 §1b; Defend assignment order EXP p.2;
co-op fixed by round order pp.13). No global rule.
*Options:* (a) active player chooses; (b) trigger-owner chooses theirs, ties to active player;
(c) fixed engine order.
**Recommendation:** **turn owner chooses order of their own simultaneous triggers**; when
multiple players' triggers would fire simultaneously (rare, mainly interactive skills at start
of a player's turn), the **turn owner** orders them. *Risk:* low; must match table conventions
and be consistent, otherwise disputes in PvP/co-op.

**A-04 · P1 · When exactly do "until the start of your next turn" persistent skills expire
relative to PvP combat/round end?**
*Sources:* RB p.5 USING SKILLS §4b (take back at start of your next turn, or when the round
ends if that comes first); p.6 §2c (on a skipped turn they still expire).
**Recommendation:** expire at the *turn-start step* — after the face-down-token skip check,
before start-of-turn effects. At round end, expire before round-prepare. *Risk:* a persistent
skill wrongly active during an extra turn changes combat math.

**A-05 · P1 · Can effects be played during another player's **enemy** combat (not PvP)?**
*Sources:* RB p.6 §1d — "You are not allowed to play other effects outside of your turn";
only "before your turn / on another player's turn" effects are allowed, plus PvP reactions.
**Recommendation:** only explicitly-tagged outside-turn effects; no ordinary cards/skills/
units in someone else's enemy combat. *Risk:* significant if the engine exposes them.

### B.2 Movement and provocation

**A-06 · P0 · Does exploring (spending 2 Move while staying put) provoke an adjacent rampaging
enemy?** `[FAQ]`
*Source:* FAQ p.2 — "No. Only actually moving from one adjacent space to another provokes."
**Recommendation:** provocation requires a *space change* satisfying: origin adjacent to
token AND destination adjacent to the same token AND destination ≠ occupied-by-token space.
Exploring/standing still never provokes. *Risk:* frequent wrong forced combats.

**A-07 · P0 · Does a move that both provokes a rampaging enemy and enters a fortified site
merge both into one combat, and can the site be conquered without defeating the provoked
enemies?** `[RB]`
*Source:* RB p.8 §2b — "You have to fight both the defenders and these rampaging enemies at
once. The rampaging enemies are not fortified, though, and you can conquer the site even if
you do not defeat them."
**Recommendation:** enemy set = garrison + provoked/joiners, flagged `joined:true`; conquest
condition ignores `joined` enemies. Block/attack targeting is per enemy, so mixed fortified
states are handled per group (§A-09). *Risk:* wrongly preventing conquest.

**A-08 · P1 · Can the same move provoke more than one rampaging enemy, and can provoking then
challenging adjacent enemies stack?**
*Sources:* RB p.8 §2a ("a single move can provoke two"), §2c (may challenge enemies adjacent
to the space moved into).
**Recommendation:** collect all provoked tokens (they must attack you); may additionally
challenge any other rampaging tokens adjacent to the destination, added to the same combat.
*Risk:* missed enemies in the fight.

**A-09 · P0 · Fortified-target grouping: when I attack a mixed group (some fortified, some
not), which attacks are legal, and how does a "fortified twice" enemy work?** `[FAQ]`
*Sources:* RB p.9 §3a, p.10 §1a, p.24; FAQ pp.2–3 (city with Crypt Worm: "you can divide them
into groups... Any enemies that you choose to put in the group with the Crypt Worm become
double fortified").
**Recommendation:** an attack declaration is a **group**. Legal attacks for the group = those
allowed against **every** enemy in the group: any group containing a site-fortified or
Fortified-ability enemy in the Ranged/Siege phase allows **Siege only**; a group containing an
enemy that is fortified twice is **illegal in that phase**. In the Attack phase all attacks are
allowed. Players may split groups freely to work around this. *Risk:* huge (combat legality and
balance).

**A-10 · P1 · Does the city mage-tower/keep "reveal when adjacent by day" happen
automatically, and who controls the timing?**
*Sources:* SITE p.1 (mage tower/keep: "The token is revealed during the Day if a player is
adjacent to it"); RB p.7 (visibility only).
*Options:* (a) automatic on adjacency; (b) the adjacent player may reveal it at any time.
**Recommendation:** **automatic reveal as a state-based effect** whenever a Day round has any
hero adjacent (checked after every movement step), or when assaulted at Night. *Risk:* hidden
garrison info leaks or is withheld incorrectly.

**A-11 · P1 · "Safe space" and movers — is the space a unit is on safe while the *unit* is
unconquered/occupied?** `[RB]`
*Source:* RB p.7 §7d (safe = accessible, not unconquered fortified/opponent keep, no other
hero except multi-occupancy sites).
**Recommendation:** safe-space test is **terrain/site/figure based only**; enemy tokens other
than rampaging do not make a space unsafe (adventure sites are explicitly safe — FAQ p.3). A
conquered fortified site is safe. *Risk:* wrong Forced Withdrawal Wounds.

### B.3 Combat resolution

**A-12 · P0 · Resistance halving on multi-attack declarations: is the ÷2 applied per
declaration or across the whole phase?** `[RB]`
*Source:* RB p.9 §4 — total the inefficient attacks, divide by two, round down; "You can declare
none, one or more attacks... Group the cards and effects you play for each attack in separate
columns" (§7).
**Recommendation:** **per attack declaration** (per column/group). Within one declaration,
sum inefficient by element then halve. Separate declarations against resistant vs non-resistant
enemies are the point of the rule. *Risk:* wrong damage totals; players lose/waste attack.

**A-13 · P1 · Block efficiency ordering and rounding.** `[RB]`
*Source:* RB p.9 §5b — inefficient blocks summed, ÷2 floor, then efficient blocks added at full
value.
**Recommendation:** compute `floor(sum(inefficient)/2) + sum(efficient)`. Cold Fire blocks are
efficient only vs Cold Fire; Fire/Ice blocks efficient vs the opposite element; physical blocks
efficient only vs physical. *Risk:* off-by-one block failures.

**A-14 · P0 · Knock-out timing: when is knockout checked, and do pre-existing Wounds count?**
`[RB]`/`[FAQ]`
*Sources:* RB p.9 §5c — "If the number of Wound cards added to your hand during a combat equals
or exceeds your unmodified Hand limit ... you are knocked out – immediately discard all non-Wound
cards"; FAQ p.2 — poison Wounds put into the **discard pile** do not count toward knockout.
*Options:* (a) literal printed rule: count only Wounds added **during this combat**, checked
immediately each time one is added; (b) total Wounds in hand reaching the hand limit; (c) check
once at the end of the Assign Damage phase.
**Recommendation:** implement (a) as the printed rule, checked **immediately** after each Wound
card is added to hand (including from non-damage in-combat effects), ignoring Wounds placed in
the discard pile (Poison's extra Wound). Flag (b) as an alternative table convention — the
printed wording is unambiguous enough to follow. *Risk:* knockout fires too early (b) or too
late (c), changing combat outcomes and Wound economy.

**A-15 · P1 · Unit resistance absorption "cannot be assigned damage again during the same
combat" — how to track it?** `[RB]`
*Source:* RB p.9 §4b last bullet.
**Recommendation:** per-combat `unitDamageAssigned` set; excluded for the rest of the combat.
*Risk:* extra damage absorption makes combat easier.

**A-16 · P1 · "Prevented from attacking" vs "successfully blocked" for Elusive / conditional
effects.** `[RB]`/`[EXP]`
*Sources:* EXP p.4 (Elusive: lower Armor only if all attacks successfully blocked; if you let
it deal damage **even if no damage was dealt**, or prevent it attacking, it keeps the higher
value); RB p.9 §7 (blocked enemy set aside, not eliminated).
**Recommendation:** statuses: `blocked` (all attacks) vs `attackPrevented` vs `damageDealt`.
Elusive's low armor requires `blocked`. "If successfully blocked" card effects require
`blocked` (or attack reduced to 0 by Cumbersome — EXP p.4 treats 0 as blocked). *Risk:* wrong
armor values in Attack phase.

**A-17 · P1 · Multiple-attack enemies and city bonuses.** `[EXP]`
*Source:* EXP p.4 — each attack handled separately in Block/Damage; "For the purposes of attack
bonuses or abilities that cities give to their garrison, each attack is handled separately."
**Recommendation:** store attacks as a list; block each separately; city bonuses apply per
attack (e.g. Blue city +2 to each Ice/Fire attack; Red city Brutal doubles each physical
attack's damage). *Risk:* doubled city bonuses misapplied.

**A-18 · P2 · Summon in Ranged/Siege phase: can the summoning enemy be killed before it
summons?** `[RB]`
*Source:* RB p.9 §2 — summon token is drawn at the start of the Block phase; nothing replaces
the summoner in the Ranged/Siege phase.
**Recommendation:** yes — the summoner is targetable normally in the Ranged/Siege phase; if
defeated there, no summon occurs. *Risk:* extra enemy in combat.

### B.4 Card play and composite effects

**A-19 · P0 · Card timing icons (which cards may be played in which phases) — the Lost Legion
timing rules are missing from our sources.** `[LL]`/§C item 3
*Sources:* FAQ p.1 — "These rules changed when the Lost Legion expansion came out... Page 9 of the
Lost Legion rulebook... should be used even if you do not have LL."
*Options:* (a) recover LL rulebook p.9; (b) approximate from card icons in the cross-check data;
(c) design Emberwold's own timing rules.
**Recommendation:** recover the LL rulebook (WizKids has the PDF; the old WizKids site also
linked `mk-lost-legion-rulebook-en.pdf`). Until then mark all card-timing behaviour
⚠️ UNVERIFIED and gate combats to "card's labelled phases only". *Risk:* P0 — wrong legality
for ~all cards in combat (e.g. can a Move card be played in the Block phase as Block 1?). Note
the UE rulebook DOES constrain sideways play per phase (RB p.9 §3b, p.10 §1b), which is a safe
fallback.

**A-20 · P1 · Composite effects (Concentration/Will Focus/Maximal Effect/Magic Talent) with
resistances.** `[FAQ]`
*Source:* FAQ pp.1–2 — "The second card played is what matters... For the purposes of
resistances, each effect maintains its colour, even if the mana is not actually paid"
(RB p.5 COMPOSITE §1b).
**Recommendation:** model as an effect wrapper with `copiedEffect`; resolve resistance checks
against the copied card's colour/element, not the composite's; Maximal Effect copies are one
effect and cannot be split across enemies. *Risk:* wrong half-damage calculations.

**A-21 · P1 · "Gain a crystal/token" overflow and timing.** `[RB]`
*Sources:* RB p.5 GAIN (overflow crystal → token), p.11 §4b (mine: nothing at 3).
**Recommendation:** centralise `gainCrystal()` with overflow rule; note mine/end-of-turn reward
gives *nothing* on overflow (RB p.11 §4b), whereas generic "gain a crystal" converts to a token.
*Risk:* resource inflation.

**A-22 · P1 · Can a card be powered after it has been played, or after seeing the result?**
`[RB]`
*Source:* RB p.7 §6b — "It is not possible to power previously played cards with mana for the
strong effect – this has to be done when the card is played."
**Recommendation:** powering is part of the play action, atomic; undo only via the reversion
window (§A-29). *Risk:* illegal take-backs become possible.

**A-23 · P2 · Sideways play in each phase.** `[RB]`
*Sources:* RB p.4 §3e (any non-Wound card → Move 1/Influence 1/Attack 1/Block 1), p.9 §3b
(no sideways in Ranged/Siege), p.9 §4b (sideways Block = physical), p.10 §1b (sideways attack
1 in Attack phase = physical).
**Recommendation:** legal sideways targets are phase-dependent; "sideways Attack 1" only in the
Attack phase; "sideways Block 1" only in Block phase; Move/Influence during movement/
interaction. Sideways cards count as physical (so Ambush boosts them — FAQ p.2). *Risk:* phase
legality bugs.

**A-24 · P2 · Banner Artifact assignment timing ("at any time during your turn") — can it be
assigned during combat, and to a Spent unit?**
*Source:* RB p.5 USING UNITS §8 — "at any time during your turn"; b) end-of-round choice.
*Options:* (a) any time including combat; (b) outside combat only.
**Recommendation:** allow during your turn including combat phases (it is not an activation and
does not spend the unit); allow on a Spent unit (it benefits from basic effect passively).
*Risk:* minor.

**A-25 · P2 · Artifact "throw away for strong effect" vs "destroyed" wording.** `[RB]`
*Source:* RB p.4 §3c (throw away = remove from game); artifacts lost via PvP steal go to
attacker's discard pile (RB p.13 §2a).
**Recommendation:** distinguish `removedFromGame` from `toDiscard(owner=attacker)`.
*Risk:* artifact economy leaks.

### B.5 PvP

**A-26 · P0 · PvP damage over-assignment: may the attacker assign more than the target's
Armor to a Unit/Hero, and does excess carry over?** `[RB]`
*Source:* RB p.12 §5 — "the attacker has to have as much damage as is the Armor of the chosen
target to wound it"; "may leave some attack points unassigned"; no statement about
over-assignment or carry-over.
*Options:* (a) exactly Armor per wound, excess lost; (b) may over-assign, excess lost;
(c) excess carries over to next target.
**Recommendation:** (a) assign **exactly** Armor-worth per wound (repeatedly for hero/units);
attacker leaves the rest unassigned. No carry-over between targets. This matches "as much
damage as is the Armor" and regular combat's no-carry-over principle (RB p.9 §6). *Risk:* PvP
lethality changes substantially.

**A-27 · P1 · Partial attend: which of the defender's effects remain usable?** `[RB]`
*Source:* RB p.12 §3b — no Source die, no Skills except those usable on other players' turns;
combat end → part of turn ends immediately; no end-of-turn procedure, no draw; unused mana
crystals remain until their regular turn.
**Recommendation:** state machine flag `attendance = full|partial` controlling: Source die,
skill legality, end-of-turn pipeline execution, mana persistence. *Risk:* wrong resource use.

**A-28 · P1 · Forced retreat in PvP — destination legality and modifier costs.** `[RB]`
*Source:* RB p.13 MELEE §2b — accessible safe space adjacent to the fight; cost = **unmodified**
Move cost; blocker moved there; never provokes rampaging enemies.
**Recommendation:** cost from base terrain table only (no reductions); destination must pass the
safe-space test and must not require assaulting or entering another player's space; if no legal
destination exists, retreat cannot be forced (attacker must find another option). *Risk:* PvP
stalemates or illegal retreats.

### B.6 End of turn / end of round / level-up

**A-29 · P0 · Order of end-of-turn steps and interrupts.** `[RB]`
*Source:* RB p.11 §1–7 (return dice; forced withdrawal; clear play area; use space benefits;
claim rewards; level up; draw).
*Options:* fixed order as printed vs allowing player to interleave (e.g. claim rewards before
space benefits).
**Recommendation:** fixed pipeline with the printed order. Two subtleties: (1) **forced
withdrawal comes before playing-area cleanup** per printed order — wounds from withdrawal are
then handled; (2) rewards are claimed before level-up, and a Unit reward may be **postponed**
until after level-up if the level-up grants a command token (RB p.11 §5d exception). *Risk:*
different rewards/level outcomes.

**A-30 · P0 · Multiple level-ups in one end-of-turn: order and offer state.** `[RB]`
*Source:* RB p.11 §6 ("a level for each line crossed"), p.12 §6b (skill/AA procedure).
**Recommendation:** process ascending: level 2 (skill+AA) → level 3 (token/command) → level 4 …
Each skill choice updates the Common Skill offer and AA offer immediately, so later choices see
those updates. If ≥2 skill levels in one turn, resolve each fully in order. *Risk:* wrong
skill/AA availability.

**A-31 · P1 · End-of-Round announcement vs scenario end simultaneous triggers.** `[RB]`
*Source:* RB p.4 §4b–d; p.6 §3.
**Recommendation:** both events seed a `finalTurns` set; the earlier event fixes the set;
players who already had a final turn do not get another. If End of Round announced and scenario
end already met, use the earlier. A player with a face-down token is counted as having taken
their final turn (skipped). *Risk:* off-by-one extra turns — very visible.

**A-32 · P1 · Do Wounds in hand go back into the deck at end of round even if the round ended
early via scenario end?** `[RB]`
*Source:* RB p.11 §1c — "When the Round ends, any Wounds in your hand get shuffled back into
your Deed deck."
**Recommendation:** yes; also when the **game** ends because the round ended (scoring then uses
Wounds in deck — Greatest Beating). *Risk:* scoring error.

**A-33 · P2 · Drawing with a modified hand limit and multiple bonuses.** `[RB]`/`[FAQ]`
*Sources:* RB p.11 §7b (keeps, city, higher only), FAQ p.3 (Planning/keep = hand-limit +1);
RB p.4 §4f (final-turn hand-limit effect transfers to next round).
**Recommendation:** hand-limit modifiers are a list; keep/city bonus = max (not sum); Planning
and other card effects add; "next time you draw" effects attach to the next draw event
(including the next round's draw if gained on the final turn). *Risk:* too many/too few cards.

### B.7 Solo / co-op / dummy

**A-34 · P0 · Dummy player deck exhaustion mid-flip.** `[RB]`
*Source:* RB p.15 — "If there are not enough cards in their Deed deck, flip as many as you can.
On their next turn, the Dummy player announces End of the Round."
**Recommendation:** model as `dummyDeckShort: bool`; next Dummy turn → End of Round. Note the
Dummy's flips are public (deck face down but flips revealed). *Risk:* wrong round length in
solo — the MVP scenario.

**A-35 · P1 · Co-op city assault: who owns combat effects that target "all enemies"?** `[RB]`
*Source:* RB p.13 §6d — "Each player faces only the enemies assigned to them and ignores the
others. Effects affecting 'all enemies' affect only those assigned to the player."
**Recommendation:** combat scope is per-player; no cross-player targeting/buffs. Shields on
city card placed by each player for enemies *they* defeated, in resolution order. *Risk:* wrong
city leader.

**A-36 · P1 · Solo skill removal and Dummy skill reveal.** `[RB]`
*Sources:* RB p.3 (11 tokens, remove one interactive), p.15 "Skills in a Solo Game".
**Recommendation:** implement hero skill pools (11 each) with `removedByMode`; solo additionally
reveals one Dummy skill into the Common offer each time you gain a skill; taking it forces the
lowest AA card. *Risk:* skill economy drift.

**A-37 · P2 · Dummy player's crystals can exceed 3.** `[RB]`
*Source:* RB p.15 — "Contrary to real players, they can have more than 3 crystals of the same
colour."
**Recommendation:** separate crystal cap for Dummy. *Risk:* Dummy tempo wrong.

### B.8 Hidden information and undo

**A-38 · P0 · What information is public, and when is it revealed?**
*Sources:* RB p.10 §3c note ("anyone can take a look at any token that was revealed earlier in
the game"); RB p.7 (ruins face down at night; keep/tower revealed by day proximity); RB p.3
(city garrisons face down on City card); SITE p.1 (ruins token reveal).
**Recommendation:** `openInformation` state: revealed enemy tokens (on map or in site) are
public forever; unrevealed tokens remain hidden; City garrison tokens are hidden until the
assault reveals all; decks are hidden (counts public); discard piles public; Dummy deck hidden
but flips revealed. *Risk:* UI information leaks are functional bugs in a digital adaptation.

**A-39 · P0 · Undo/rollback commit points.** `[RB]`
*Source:* RB p.5 REVERTING §2 — no take-back after new information revealed (tile, enemy token,
card), a die rolled, or another player reacting specifically.
**Recommendation:** maintain a commit-point marker; allow full undo within the current open
segment; on any hidden-info reveal/die roll/PvP reaction, commit (no undo past it unless all
players agree). In single-player digital play, a strict mode and a casual mode can differ, but
auto-commit at "new information" is the rules-correct default. *Risk:* undo exploited to
re-roll unknown draws.

**A-40 · P2 · Undo-irrelevant states (safe to auto-collapse).**
*Candidates:* the identity/order of cards paid sideways for the *same* point type; which of
multiple identical mana sources (crystal vs token vs die) paid a cost **when the choice has no
future consequence**; order of identical units/cards played into one column; display order of
same-value rewards; assigning shields on a city in a chosen order **when** the tie-break rule
makes order irrelevant (it almost always matters — keep ordered!). **Recommendation:** do NOT
collapse shield order (city leader tie-break depends on it: RB p.10 §2a); DO allow auto-choice
of identical mana when no crystal-cap or Source-depletion consequence exists. *Risk:* subtle
scoring/leadership differences if over-collapsed.

**A-41 · P2 · Simultaneous reveal of two sites (e.g. new tile with several enemies/sites).**
*Sources:* RB p.7 §5f ("For sites on a newly revealed tile, check the 'When revealed' section
... follow the text"), p.7 §5g (city reveal steps order).
**Recommendation:** deterministic order: place tile → apply site reveals in a defined order
(city last? rules do not say; choose fixed order: mines/glades (passive) → monasteries
(AA to unit offer) → rampaging tokens placed → city garrison drawn). Document as an engine
decision; nothing in the rules makes it player-choosable. *Risk:* low.

### B.9 Known source conflicts to resolve before implementation

**A-42 · P0 · Fame-level thresholds.** Board-derived `3,8,15,24,35,48,63,80,99` vs community
engine `3,8,14,21,29,38,48,59,71`. Both given sources are secondary for the exact values; the
board artwork (WT p.6) supports the first set. **Recommendation:** verify on the physical Fame
track; implement thresholds as a data table (not formulas) so it can be corrected in one place.
*Risk:* every level-up timing and thus the whole game's power curve.

**A-43 · P1 · Night movement costs.** The board shows only Forest (5) and Desert (3) night
variants; a community engine applies night costs to Plains/Hills/Wasteland as well.
**Recommendation:** use the board (only forest/desert change). *Risk:* movement pacing in Night
rounds.

**A-44 · P1 · Reputation track exact spaces / `X` position.** Track values not fully legible;
`X` = no interaction. **Recommendation:** encode the track as an ordered list of
`{value, noInteraction}` read from the physical board; never compute modifiers arithmetically.
*Risk:* interaction totals wrong.

**A-45 · P1 · City garrison tables.** Taken from engine data ⚠️. The rulebook tells you to use
the city-level colours on the City figure/card, not a numeric table. **Recommendation:** verify
against the 4 City cards / scenario book; encode as data. *Risk:* city difficulty wrong (core
endgame).

**A-46 · P1 · Tactic card effects and "when you take this Tactic" triggers are missing.**
Names/initiative order known, effects not in extracted sources. **Recommendation:** transcribe
from card images (data-extractor) — this is a **data gap**, not an ambiguity. *Risk:* round
order/tempo features (Early Bird etc.) unimplementable.

**A-47 · P1 · Skill card exact numbers are from a secondary reconstruction.** ⚠️ 70 skills in
`03` §F.3. **Recommendation:** verify each against Skill Description cards before coding.

**A-48 · P2 · Card effect texts missing entirely from primary sources.** Data gap for
data-extractor; see §C.

### B.10 Emberwold-specific simplification opportunities (avoid the ambiguity instead of solving it)

| Open ambiguity | Cheapest Emberwold simplification |
|---|---|
| A-19 card timing icons (LL rules) | Restrict Emberwold decks to cards whose legal phases are already clear from the engine's own labels; ship only cards tested against a rules whitelist. |
| A-26 PvP over-assignment | If Emberwold is solo/co-op only (design option), PvP ambiguity disappears entirely. |
| A-38 hidden info and scouting/reveal rules | Keep the visual reveal rules but make all map tokens public in a "learning mode". |
| A-42/A-43/A-44 board-art values | Verify once from physical components and freeze in data files. |
| A-30 multiple level-ups | Reduce XP curve so >1 level per turn is rare (still implement correctly). |

---

## Part C — Source gaps (owner: data-extractor unless noted)

1. **Card effect texts** — all Basic/Advanced Actions, Spells, Artifacts, Units, Tactics. Not in
   any extracted rulebook; must be transcribed from card images. (Primary blocker for the
   engine's effect layer.)
2. **Skill Description card texts** — 70 skill texts; only a secondary reconstruction exists
   (`03` §F.3 ⚠️).
3. **Lost Legion rulebook p.9 card-timing rules** — required by FAQ p.1 ("new rules on when
   cards can be played should be used"). The old WizKids site lists
   `wp-content/uploads/.../mk-lost-legion-rulebook-en.pdf`; recovery should be attempted
   through the same Wayback route as the FAQ (§A.2 #4–5). ⚠️ Not yet recovered.
4. **UE Scenario Book as a separate booklet** — not online (confirmed by Lead: WizKids PDFs +
   Wayback + BGG checked). Use 2012 Scenario Book + UE summaries (`03` §I); flag base→UE
   scenario differences ⚠️.
5. **Volkare scenarios** (Lost Legion) — not in UE extracts; out of current scope.
6. **City level tables / City cards** — garrison colours per level (`03` §C.3 ⚠️ engine data).
7. **Physical token counts** (enemy bags, faction tokens) — `03` §D.1 ⚠️ engine data.

---

## Sources

* **Official FAQ v1.0 (7 Feb 2014)** — recovered 2026-10-24 from
  `http://web.archive.org/web/20240229125017if_/http://wizkidsgames.com/wp-content/uploads/mage/MK_FAQ_1.0v2.pdf`
  (linked from the archived Mage Knight product page
  `http://web.archive.org/web/20240229125017/http://wizkidsgames.com/mageknight/`). 3 pp.
  Content reproduced in §A.3.
* `reference/rulebooks/MKUE_rulebook.pdf` → `reference/extracted/MKUE_rulebook.txt` (RB, 24 pp.)
* `reference/rulebooks/MKUE_walkthrough.pdf` → `reference/extracted/MKUE_walkthrough.txt` (WT)
* `reference/rulebooks/MK_master_reference_sheet.pdf` → `reference/extracted/MK_master_reference_sheet.txt` (SITE)
* `reference/rulebooks/MK_base_rulebook_2012.pdf` → `reference/extracted/MK_base_rulebook_2012.txt` (SB)
* `reference/rulebooks/MKUE_expansions_rulebook.pdf` → `reference/extracted/MKUE_expansions_rulebook.txt` (EXP)
* Secondary cross-check: `mage-knight-digital/MageKnight` GitHub data/reference docs (accessed
  2026-10-24) — used only to quantify ambiguity, never as authority.
