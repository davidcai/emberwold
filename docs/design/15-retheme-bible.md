# 15 · Re-Theme Bible (v0.1) — original IP for Emberwold

**Status:** draft proposal · **Owner:** Lead · **Date:** 2026-10-24
**Decision:** ADR-002 — clean-room re-theme. This document replaces the *expression* of Mage
Knight while keeping its *mechanics* (which are not copyrightable). It is the source of truth
for names, tone and copy until a public name is screened.

> **Name policy.** **Emberwold** is the project/repository name (renamed 2026-10-24, ADR-007).
> It is **not yet cleared** for a public product launch: no store page, domain, wordmark or
> marketing until v1 and until the screen in `06` §7 is done. Game-world strings follow this bible.

---

## 1. Goals of the re-theme

1. **Legal clarity.** No Mage Knight names, text, art, logo, card frames or trade dress.
2. **Coherence.** One world, one voice, one visual language — so commissioned art looks like
   it belongs to a game, not a parts bin.
3. **Practicality.** Names short enough for cards (≤ ~20 chars), easy to translate later,
   and mechanically transparent (a player should guess what "Shardmine" is).
4. **Cheap to apply.** Every string is data (content pack), so the re-theme is a data pass,
   not a rewrite.

## 2. Pitch and world

**Name: Emberwold** *(chosen 2026-10-24; the GitHub repo is `davidcai/emberwold`)*.
Invented compound, pronounceable, no "Mage/Knight", and the world's name too. Candidates
considered and not chosen: **The Ashen Vow** ("Ashen" is widely used) and **Gloamreach**
(several existing software projects use it). No public product branding or wordmark until v1 —
see §11 and ADR-007.

**Premise (one paragraph).**
The sun and the moon once shared the sky in a measured turning. That turning broke — nobody
alive remembers how — and now the **Ember** (sun) and the **Gloam** (moon) hold the sky for
long, uneven stretches. The land, the **Wold**, is lit by ember-shards: old fires that still
remember the turning. You are one of the last **Vowbound**: a wanderer who swore their true
name to a shard in exchange for a fragment of its fire. The oath lives in your hand as a deck
of **Vows**; playing one spends the power you borrowed. To keep your name, you must reach the
last city with a living hearth — **the Seat** — and take it before the third dawn.

**Tone pillars.** Weary heroic; folk-fantasy not high-fantasy; warm embers against cold
gloam; everything is old, mended, and still burning. Humour is dry, never slapstick.

**What the player is doing, in theme.** A lone Vowbound crossing a broken wold, earning
**Renown** by facing what the Sundering left behind, gathering companions and relics, and
taking the Seat before the light runs out. The hand of cards is literally your oath — which is
why discarding one to rest is called *letting the oath rest*.

**Factions (flavour only — no mechanical factions in v1).**

| Faction | Role in the world | Typical sites |
|---|---|---|
| **Hearthwardens** | Keepers of the last walled hearths; distrustful, orderly | Watchholds, the Seat |
| **Gloam-choir** | Hermits who sing the moon down; keep old lore and training | Gloam-choirs, Fallen Altars |
| **Shardwrights** | Artificers who cut and bind ember-shards | Shardspires, Shardmines |
| **Woldkin** | Villagers, guides, traders; the people all this is for | Hearthsteads, Wayfarer Camps |

## 3. Terminology map (mechanical term → in-world term)

These are the strings the UI uses. Internal IDs stay neutral (see §9).

| Mechanics (generic) | Public term | Notes |
|---|---|---|
| Player character / "Mage Knight" | **Vowbound** | Never "knight" for the player archetype |
| Deed deck | **Vow deck** | The hand of cards is the oath |
| Basic Action card | **Vow** | Verb-named (see §6) |
| Advanced Action card | **Rite** | Older, stranger oath-techniques |
| Spell | **Invocation** | Requires ember to speak |
| Artifact | **Relic** | Unique old things |
| Unit | **Companion** | People who follow your vow |
| Skill | **Gift** | Shard-granted talent |
| Tactics card | **Stance** | How you meet the turning of the sky |
| Fame | **Renown** | The track is the Renown track |
| Reputation | **Standing** | Your name among settlements |
| Influence | **Leverage** | What your name buys |
| Armor | **Ward** | Damage soak |
| Wound | **Scar** | Cards that clog your oath |
| Mana | **Ember** | Red/blue/green/white basic; gold/black special |
| Mana token | **Ember token** | |
| Mana crystal | **Ember shard** (inventory) | Crystallised, persistent |
| Mana die / Source | **Ember die / the Emberwell** | The dice pool |
| Day / Night | **Ember phase / Gloam phase** | Cards may say "Sun"/"Moon" for brevity |
| Movement point | **Stride** | |
| Ranged / Siege attack | **Volley / Siege attack** | Siege remains generic |
| Fortified | **Warded** (site defence) | Avoid overloading "Ward" as armor — use **Walled** for fortification |
| Healing | **Mending** | |
| Command limit / token | **Bond limit / bond** | Companions occupy bonds |
| Deck/discard/hand | **Oath deck / spent pile / hand** | |

**Rules-text vocabulary.** "Enemy", "attack", "block", "movement", "site", "tile" are generic
gaming terms and stay — re-theming every noun produces unreadable text. Rename only proper
nouns, flavour nouns, and terms that carry the original product's identity.

## 4. Places

| Original concept (internal ID) | Public name | Art cue |
|---|---|---|
| Village (`site:village`) | **Hearthstead** | clustered rooftops, one lit hearth |
| Monastery (`site:monastery`) | **Gloam-choir** | bell tower, moon banners |
| Keep (`site:keep`) | **Watchhold** | walled tower on a ridge |
| Mage tower (`site:mage_tower`) | **Shardspire** | crystal spire, ember veins |
| Magical glade (`site:magical_glade`) | **Glimmer Glade** | floating motes, pale grass |
| Crystal mine (`site:mine`) | **Shardmine** | cut terraces, glowing seams |
| City (`site:city`) | **Seat** | vast walled hearth-city |
| Ancient ruins (`site:ancient_ruins`) | **Fallen Altar** | broken stone ring |
| Dungeon (`site:dungeon`) | **Sunken Vault** | stairs down into dark |
| Tomb (`site:tomb`) | **Barrow** | mound with standing stones |
| Monster den (`site:monster_den`) | **Warren** | holes, bones, smoke |
| Spawning grounds (`site:spawning_grounds`) | **Brood Roost** | nests, egg sacs |
| Portal (`site:portal`) | **Woldgate** | stone arch, ember haze |
| Refugee camp (`site:refugee_camp`) | **Wayfarer Camp** | tents, cookfires |

## 5. People and enemies

### 5.1 Playable Vowbound (archetypes mapped from the four base heroes)

| Original archetype | Public name | Playstyle hook | v1? |
|---|---|---|---|
| Blood cultist (Arythea) | **Veska Rhee, the Ember-Drinker** | spends Scars for power; risk/reward | **recommended pair** |
| Dragon-blood mana savant (Goldyx) | **Sorhul Veyn, the Wyrmsouled** | ember engine; big Invocations | T2 |
| Elven captain (Norowas) | **Aelinor Sael, the Banner-Sworn** | companions and leadership | T2 |
| Knight (Tovak) | **Bered Kask, the Oathless** | direct combat, reliable defence | **recommended pair** |

*Owner-confirmed (2026-10-24): Veska Rhee is a woman; Bered Kask is a man. Age/appearance are
still open; art prompts already assume adult woman / adult man.*

**Recommended v1 pair:** **Bered** (teaches combat cleanly) + **Veska** (teaches risk and
ember economy). One playable at T1, second as the stretch hero per `11`.

### 5.2 Enemy families

| Original family | Public name | Visual motif |
|---|---|---|
| Orc marauders | **Gutterkin** | squat, scavenged plate, red rags |
| Draconum | **Wyrmspawn** | horned, ember-lit throats |
| Dungeon monsters | **Vault Dwellers** | pale, blind, many-limbed |
| Tomb guardians | **Barrow Wights** | grave-goods, cold light |
| Keep garrisons | **Watchguard** | disciplined, shield-wall |
| Mage-tower garrison | **Spire Adepts** | masked, floating glyphs |
| City garrison | **Seat Guard** | gilded, ceremonial, deadly |
| Spawning-ground broods | **Broodlings** | swarm, egg-sac texture |
| Ruin guardians | **Altar Guardians** | stone-and-ember constructs |

Specific enemy names are authored per unit in the content pack (e.g. "Gutterkin Ravager",
"Wyrmspawn Cinder", "Seat Guard Halberdier") — one or two words, no original card names.

## 6. Naming conventions for cards

* **Vows** (basic actions): one word, verb or verb-adjacent. `Trek`, `Bulwark`, `Fervor`,
  `Mend`, `Stride`, `Threaten`, `Focus`, `Cleave`. Two words max if needed (`Hearth Step`).
* **Rites** (advanced actions): two words, evocative: `Borrowed Fire`, `Oath of Ash`,
  `Gloamstep`, `Iron Vow`, `Split the Sky`.
* **Invocations** (spells): three words max, elemental: `Ember Lance`, `Rime Lock`,
  `Root and Stone`, `Gale of Names`.
* **Relics** (artifacts): noun + modifier: `Hearthstone Ring`, `Wanderer's Ledger`,
  `Cinder Crown`, `The Mended Bell`.
* **Companions** (units): role + kin: `Hearthstead Spear`, `Barrow Warden`, `Gloam-choir
  Singer`, `Shardwright Apprentice`.
* **Gifts** (skills): short abstract nouns: `Emberblood`, `Long Stride`, `Bondkeeper`,
  `Scar-Song`.
* Never use: "Mage Knight", "Atlantean", "Volkare", "Tezla", "Draconum", "Mage Tower",
  "Lost Legion", "Krang", "Braevalar", "Wolfhawk", or any official card name. Keep the
  forbidden-list in one place (content pack `ip.forbidden_terms`).
* Effects text: write fresh, in a compact style, e.g.
  *"Attack 3. If you spend an ember, Attack 5 instead."* — no flavour text copied, no
  original examples.

## 7. Rules-copy style guide

* Second person, present tense, imperative: "Spend 1 ember to…".
* One effect per sentence. Numbers as digits. Keywords bold/coloured, defined in a glossary.
* No marketing voice, no lore paragraphs on cards (flavour text optional later, authored
  fresh, ≤ 12 words).
* Rules explanations in the UI are *our* prose, not the rulebook's: short form on hover,
  long form in the compendium.
* Localisation-ready: no string concatenation; placeholders `{value}`; all strings in the
  content pack.

## 8. Visual identity (feeds `16-art-brief.md`)

* **Materials:** mended leather, brass, charcoal, ember-light. Nothing glossy or sci-fi.
* **Palette:** soot-black/near-black backgrounds; parchment/bone for card faces; ember orange
  `#E0662E`, rime cyan `#4FA8B8`, root green `#6E8F4E`, gale pale `#DCE6E8`, gold `#E3B341`,
  gloam violet `#5B4B8A`. Element colours must remain distinguishable in greyscale and for
  common colour-blindness (pair each with a shape/glyph).
* **Card frames:** hand-cut leather border with a brass corner; element stripe; no
  reproduction of any existing game's frame.
* **Icons:** silhouette-first, 2 px keyline, readable at 16 px; commissioned icons avoided
  where an open icon set works (`07`).
* **Typography:** SIL OFL faces only (e.g. Cinzel/EB Garamond for display, Inter/Source Sans
  for UI — final pair chosen in the art brief).

## 9. Data and code policy

* Internal IDs remain neutral and IP-free: `hero:emberdrinker`, `site:shardmine`,
  `card:vow:trek`, `enemy:gutterkin_ravager`. IDs never change once shipped (saves/replays).
* All display strings live in the content pack: `name`, `display_name`, `flavor_text`,
  `rules_short`, `rules_long`, `art_ref`. Code and UI components contain no proper nouns.
* Art files are referenced by neutral ID (`art/hero/emberdrinker_portrait.png`), never by
  original names.
* Forbidden terms live in one list and are checked by a test (`ip.forbidden_terms`); a CI
  grep over the build output is cheap insurance.

## 10. Provenance and the clean-room boundary

* Mechanics were learned from the official rulebooks (allowed) and written up in our own
  words (`02`/`03`). That is the legitimate core.
* `game-data/` currently contains values that are cross-checked against an unlicensed
  upstream project (`upstream-only` confidence items). For a **private** hobby build this is
  noted scaffolding; **before any public build**, re-derive those values from primary sources
  and apply the re-theme names. This is a release gate, not a v1 blocker.
* Never copy upstream code, identifiers, comments or card tables; the extraction script is a
  research cross-check, not a source of product content.

## 11. Public-name screening checklist (before any public build)

1. Search the name on Steam, itch.io, Google Play, BoardGameGeek, GitHub, and general web.
2. USPTO TESS / EUIPO / UKIPO quick searches (classes 9, 28, 41 are the relevant ones) —
   ⚠️ not legal advice; a paid clearance search if the project ever matters commercially.
3. Domain + social handles available?
4. Check it doesn't read as a diminutive/derivative of an existing game's name.
5. Record results and the chosen name in this document.

| Candidate | Screen date | Result | Notes |
|---|---|---|---|
| **Emberwold** | 2026-10-24 | GitHub repo name in use by us; no GitHub org/repo collision found for the bare name; GitHub check only | **chosen** — full product/trademark screen still required before any public release |
| The Ashen Vow | — | not screened | "Ashen" widely used |
| Gloamreach | — | not screened | several existing software projects |

## 12. Open creative questions

1. How much lore to put on cards? (Recommendation: none in v1; 3–4 lines in the compendium.)
2. Keep "ember" as the mana noun everywhere, or vary per element (ember/rime/root/gale)?
   Recommendation: "ember" is the *resource*; elements are adjectives.
3. Do the two v1 heroes share a starting deck identity or use different Vows? (Recommendation:
   different, to make hero choice meaningful — data supports per-hero decks.)
4. Public name choice — needs the screen in §11.

## Sources

- `06-legal-ip.md` (ownership layers, options, screening).
- `02-rules-core.md`, `03-rules-reference.md` (mechanics being re-expressed).
- `11-mvp-scope.md` (v1 content), `16-art-brief.md` (visual execution).
