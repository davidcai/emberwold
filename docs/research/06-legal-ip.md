# 06 · Legal & IP — who owns what, how exposed each path is, and what to do before release

**Status:** v1 (precedent-analyst) · **Date:** 2026-10-24 · **Companion docs:** `05-digital-precedents.md`, `07-assets-art-inventory.md`

> ### ⚠️ This is not legal advice
> This document is a **risk map**, written by a researcher, for engineering and product
> decision-making. It is based on public sources: the official rulebooks, publisher web pages,
> statute text, and the observable behaviour of shipped fan projects. It is **not** a legal
> opinion, it does not create a lawyer–client relationship, and it cannot tell you whether a
> specific use is lawful — that depends on jurisdiction, on facts we cannot see (contracts,
> registrations, the publisher's current enforcement posture), and on judgement calls.
>
> **Before any public release or any money changes hands, get a lawyer** qualified in your
> jurisdiction who does IP work for games. Everything below should be treated as the brief you
> hand that lawyer so the expensive hour is spent on decisions, not on explaining Mage Knight.

---

## 1. Executive summary

| Question | Answer |
|---|---|
| Who owns Mage Knight? | **WizKids (NECA/WizKids LLC)** owns the trademark and the published game's copyrights; **Vlaada Chvátil** is credited as original designer; **J. Lonnee, Milan Vavroň, Octographics.net** are credited for illustration. See §2. |
| Is the *game system* protected? | Rules **as an idea/system** are generally not copyrightable, but the **rulebook text, card text, art, iconography, logo, and trade dress** are. A faithful reimplementation of mechanics is the defensible part; a reproduction of the *expression* is not. See §3. |
| Are there official digital rights available? | Yes in principle — WizKids licenses its catalogue, and **Dire Wolf Digital signed a Mage Knight digital deal in 2019** (then never shipped). See §5.3. |
| What do fan projects actually do? | They ship anyway: the most mature engine has **no licence at all**; the most complete web remake **bundles official art and the official PDFs** with a disclaimer; the biggest audience is a **Tabletop Simulator mod with ~162 k lifetime subscriptions**. See §5. |
| What is the bottom line for Emberwold? | **Build the prototype now. Do not publicly release under the Mage Knight name or with official assets without a licence decision.** The cheapest defensible public path is a **clean-room re-theme** (own name, own art, own text, same mechanics). See §8. |
| Is "Emberwold" a safe name? | **Not established** — the repo/project name is chosen, but no trademark/store/domain screen has been run. The retired codename "Miniknight" was unsafe (third-party uses, similarity). Full screen before any public release. See §7. |

---

## 2. Ownership map — layer by layer

The single most useful exercise is to stop treating "Mage Knight" as one thing. It is at least
eight separable layers, owned differently and protected differently.

| # | Layer | Who owns it | Evidence (primary source) | What Emberwold may do |
|---|---|---|---|---|
| 1 | **The name / trademark** "Mage Knight", plus "WizKids", "HeroClix" | WizKids/NECA, LLC | Rulebook: "**WizKids and related marks and logos are trademarks of WizKids. All rights reserved.**" (MKUE Rulebook, p.22). Explicitly enumerated: "**HeroClix, WizKids, Mage Knight are trademarks of WIZKIDS/NECA, LLC.**" (Master Reference Sheet, p.2; identical line in MKUE Expansions Rulebook, p.15) | Use only as a *descriptive reference* to the source game in internal docs; never as the product name, logo, or store listing. |
| 2 | **The rulebook text** (rules prose, examples, diagrams) | WizKids | "© 2018 WizKids/NECA, LLC … All rights reserved." (MKUE Rulebook, p.22) | Do **not** copy or redistribute the text. Rewrite rules in your own words / compact notation (`game-data/README.md`). |
| 3 | **Card, skill, unit, enemy names and flavour text** | WizKids (as publisher of the game's text) | Card text is printed on the cards and partially reproduced in the rulebook; fan projects transcribe it wholesale — e.g. the flagship's `docs/reference/artifacts.md` reproduces artifact card text verbatim, including "Banner of Courage … You may play this any time other than combat to Ready all Units you control." ⚠️ (quoted from the fan transcription; the physical card was not inspected) | ⚠️ Names are short and some may be generic ("Rage", "March"), but the *set* and the flavour text are expressive. Rewrite effect text in your own notation; consider renaming in a public build. |
| 4 | **Artwork** (heroes, enemies, tiles, sites, card illustrations) | WizKids as publisher; illustrators credited | "Illustrations: J. Lonnee, Milan Vavroň, Octographics.net"; "Graphic Design: Chris Raimo, Filip Murmak, Scott Hartman" (MKUE Rulebook, p.22) | No reproduction without a licence. Build or buy art (`07`). |
| 5 | **Logo, card frames, iconography, trade dress** (the visual "look" of the game) | WizKids | Same copyright line; logo/trade dress also protected by trademark and unfair-competition law | Do not replicate the frames/logo. Use your own visual system. |
| 6 | **Game mechanics / rules system** (card-driven movement, mana dice, 4-phase combat, fame/levels) | **Generally not copyrightable** as an idea/system; may be claimed via patents (none known here) | 17 U.S.C. §102(b): copyright does not extend to "any idea, procedure, process, system, method of operation…" ([Cornell LII](https://www.law.cornell.edu/uscode/text/17/102)) | ✅ Reimplement the mechanics freely. This is the legitimate core of a "spiritual successor". |
| 7 | **Fonts used in the official product** | Their respective foundries (not WizKids) | The product's display faces are licensed commercial fonts ⚠️ UNVERIFIED (not identified in the rulebook) | Use SIL OFL / Google Fonts instead (`07` §5). Never extract fonts from PDFs or scans. |
| 8 | **The code and data of existing fan projects** | Their authors | e.g. `mage-knight-digital/MageKnight` has **no LICENSE** → all rights reserved; `kyle-ip` has none either | Do not copy files, tables, or identifiers. See `05` §7. |

**Practical consequence:** layers 6 (mechanics) are where you are free. Layers 1–5 (name, text,
art, trade dress) are where every fan project is exposed. Emberwold's legal strategy is
essentially: *take layer 6, replace layers 1–5.*

---

## 3. What the law protects (plain-language version)

> ⚠️ Simplified for planning. Jurisdiction matters; the notes below are US-centric because the
> publisher is US-based and the biggest storefronts are US-based.

**Copyright** protects *expression fixed in a medium*: the rulebook prose, the card text, the
art, the layout, the code. It does **not** protect ideas, rules, systems, or methods of operation
(17 U.S.C. §102(b), link above). So:

- A program that *implements* "move costs 2 in forest at night" is not, by itself, a copyright
  problem.
- A program that *displays* the actual card art, or reproduces the rulebook's sentences, is.

**Trademark** protects *source identifiers*: names, logos, and things that signal who made a
product. Infringement does not require copying — it requires **likelihood of confusion** about
origin, sponsorship, or affiliation (Lanham Act §32, 15 U.S.C. §1114; §43(a), 15 U.S.C. §1125,
[Cornell LII](https://www.law.cornell.edu/uscode/text/15/1114)). So:

- Calling a game **"Mage Knight"**, or "Mage Knight Digital", or using the MK logo, is the core
  trademark problem.
- A name that merely *evokes* the original can still be a problem if buyers think WizKids approved
  it — this is the "Emberwold" question in §7.
- Non-commercial status is **not a defence** to trademark infringement, though it is relevant to
  remedies and to a plaintiff's appetite.

**"Fan project" is not a legal category.** There is no statutory fan-works exception. The
practical protections people rely on are: non-commercial use, disclaimers, no official art, the
publisher's tolerance, and the cost/benefit of enforcement. Those are *risk reducers*, not rights.

---

## 4. Risk tiers

Ordered by exposure, not by morality. Each tier lists what raises it to the next one.

| Tier | Description | Typical exposure | What makes it worse |
|---|---|---|---|
| **T0** | Private prototype on your machine, never distributed | Negligible in practice | Nothing — but note that *creating* copies of art is still technically reproduction; it only becomes actionable on distribution. |
| **T1** | Closed playtest (friends, NDA-less, no public download) | Low | Streaming it publicly; accepting donations; a public repo. |
| **T2** | Free public release, **own code, own art, own text**, descriptive "inspired by" wording, disclaimer | Moderate-low; the *defensible* fan path | Using the MK name in the product name or store listing; reproducing card names wholesale; using official icons/frames; accepting money. |
| **T3** | Free public release that **bundles official art / rulebook PDFs / card scans** | High — this is direct reproduction of protected expression | Monetisation, app-store distribution, ads, merch, Kickstarter. |
| **T4** | Commercial release using MK name/art/text | Very high; requires a licence | — (this is simply an unlicensed derivative commercial product) |

Both of the most complete precedents sit at **T3**, and the biggest audience (TTS mods) sits at
T3 as well. That tells you what the community tolerates — **not** what is lawful.

---

## 5. Enforcement reality — what actually happens

### 5.1 The observed record (as of 2026-10-24)

| Project | Posture | Age | Public scale | Enforcement observed |
|---|---|---|---|---|
| `mage-knight-digital/MageKnight` | T3-adjacent: no licence, **full rulebook text committed**, official art kept external and labelled "potentially copyrighted" | since 2025-12 | 5 stars, 147 open issues, no release | **None found.** No takedown, no rename, no disclaimer added. |
| `kyle-ip/mage-knight` | T3: bundles **official card art, 72 enemy tokens, tiles, and the three official rulebook PDFs** on GitHub Pages | since 2026-08 | 16 stars | **None found.** |
| Tabletop Simulator mods | T3: 21 Mage-Knight-specific items, top one **161,894 lifetime subscriptions**, still updated 2026-10 | 2015 → present | ≈276 k subscriptions across MK mods | **None found** (Valve/Workshop DMCA process exists but no evidence of use here). |
| Vassal module | T3: official art in a `.vmod`, 31 MiB | 2013 → ~2020 | long-lived | **None found.** |
| Dire Wolf Digital (commercial) | Licensed | announced 2019 | — | Project **cancelled** before release. |

⚠️ **Absence of evidence is not evidence of a policy.** I found no public C&D, DMCA notice, or
statement either way. It is entirely possible that (a) WizKids tolerates non-commercial fan works,
(b) nobody has escalated to a level where enforcement is worth it, or (c) notices have been sent
privately and complied with silently. Do not read "nobody has been sued" as permission.

### 5.2 What the record *does* tell you

1. **The realistic enforcement trigger is visibility + money**, not existence. A decade of
   TTS mods and a 16-star static site have not attracted action. A Steam/App Store product,
   a Kickstarter, or a viral post is a different risk class.
2. **The community norm is to ship first and disclaim.** kyle-ip's README disclaimer is the
   current best practice among fans — but it explicitly concedes the point ("Game design &
   official artwork remain with their rights holders") while still redistributing both.
3. **The most mature engine chose the opposite trade**: code public, **art private**, assets
   hosted separately, `.gitignore` comment "potentially copyrighted". That is a deliberate
   risk-reduction design, and it is the one Emberwold should study.

### 5.3 WizKids' posture (what can be sourced)

| Finding | Evidence |
|---|---|
| WizKids is a **licensor** of its catalogue, including for digital | Dire Wolf Digital announced a WizKids deal with **Mage Knight as the first title** (Stately Play, 2019-01-18). WizKids' own site lists a licensed digital product for another own-IP title: [Fantasy Realms: Digital Edition](https://wizkids.com/fantasy-realms-digital-edition/) ⚠️ (developer not stated on the page). |
| WizKids' site asserts blanket rights | Footer on product pages: "©2026 NECA/WizKids LLC (WizKids). The marks and logos for WizKids, Dice Masters, Quarriors, Dice Building Game, HeroClix, SwitchClix, and Combat Dial are trademarks of WizKids. All rights reserved. All other trademarks and copyrights are the property of their respective owners." ([wizkids.com/mage-knight-ultimate-edition](https://wizkids.com/mage-knight-ultimate-edition/)) |
| WizKids has a published **Legal Notices** page | <https://wizkids.com/legal-notices/> — a per-licence attribution list (Batman, Critical Role, DC, …). ⚠️ The page did **not** contain a Mage Knight entry when retrieved 2026-10-24; the Mage Knight rights statement lives in the rulebooks (p.22) instead. |
| **No public fan-content / fan-game policy was found** | Searched the site's own WordPress API on 2026-10-24: `wizkids.com/wp-json/wp/v2/search?search=fan`, `…?search=fan+content`, `…?search=content+policy`, `…?search=intellectual+property` → no fan-content, fan-art, or fan-game policy page. `search=licensing` returns only partnership announcements. |
| Official rulebooks are offered for **download** by the publisher | Product page has "Download Rules / Download Expansion Rules / Download Walkthrough Booklet" links ([wizkids.com/mage-knight-ultimate-edition](https://wizkids.com/mage-knight-ultimate-edition/)). This supports *reading* them; it is not a licence to redistribute them, and it is certainly not a licence for derivative works. |

**Interpretation:** WizKids is a company that monetises IP through licences and has no published
fan policy. In practice that means: **tolerance is discretionary and revocable**, and the only
reliable permission is a signed licence.

### 5.4 The cancelled commercial precedent

Dire Wolf signed for Mage Knight in 2019 and never shipped it; the title is absent from their
current catalogue ([direwolfdigital.com/games](https://www.direwolfdigital.com/games/), verified
2026-10-24), and community reporting is that it was cancelled
([r/boardgames](https://www.reddit.com/r/boardgames/comments/ptwyfa/any_news_on_the_mage_knight_digital_adaptation_by/),
⚠️ community source). Two readings, both important:

- **Optimistic:** the rights have been licensed before, so a licensing conversation is possible.
- **Pessimistic:** a professional studio with the licence could not make the economics work. A
  solo developer is unlikely to out-negotiate or out-spend them — so *don't plan on the licence
  as the default path*.

---

## 6. Why this matters for Emberwold specifically

Emberwold is a **deliberately reduced** adaptation (`00-brief.md` §5). Reduction does not reduce
IP exposure: a smaller Mage Knight is still a derivative work. In fact the *name* makes the
derivation explicit, which is the one thing a trademark plaintiff needs.

The exposure is also **asymmetric across layers**:

| What you build | Cost to make legal | Cost to make illegal |
|---|---|---|
| Rules engine (mechanics) | Free — mechanics are not protected | n/a |
| Own card text in compact notation | Low — a writing task | Copying text is free but exposed |
| Own art | Medium–high (money/time) | Using official art is free but exposed |
| Own name/brand | Low | Using "Mage Knight"/evocative name is free but exposed |

**The rational strategy is therefore: spend your effort on layers 6 (mechanics) and buy/build
layers 1–5.** That is exactly the opposite of what the fan precedents did — they took the
expensive layer (art) for free and paid for it with legal exposure.

---

## 7. Naming: why "Miniknight" was retired, and the screen still needed for "Emberwold"

> **Historical note (2026-10-24).** The project was codenamed "Miniknight" and has been renamed
> **Emberwold** (repo `davidcai/emberwold`). This section is kept because it documents *why* the
> codename was a weak, crowded name, and because a proper screen of **Emberwold** is still
> required before any public product release. The `miniknight` strings below refer to the retired
> codename and third-party uses, not to this project.

### 7.1 The retired codename ("Miniknight") — do not resurrect it

| Risk | Analysis |
|---|---|
| **Similarity to "Mage Knight"** | Sight: different first word ("Mini" vs "Mage"), shared "night"/"knight" ending. Sound: "MIN-ee-nite" vs "MAYJ-nite" — same stress and terminal sound. Meaning: "mini knight" is a natural diminutive; in the context of a scaled-down Mage Knight it reads as *"small Mage Knight"*. Channels: identical (tabletop/digital strategy games). Under a likelihood-of-confusion analysis this was **not a safe name**. |
| **Third-party uses already exist** | Steam store search for "miniknight" returns **"Mini Knight's Journey"** (app 2222250) and its demo. GitHub has **12 repos** named `miniknight`/`MiniKnight`, including a 53-star F# platformer (`ChrisPritchard/MiniKnight`). The name was already taken in the games market and weak as a brand (descriptive/crowded). |
| **One word does not create a safe harbour** | Compounding words does not avoid confusion; "Mini" + "Knight" is exactly the kind of variant a trademark examiner or a plaintiff's lawyer calls a colourable imitation. |
| **Domain/store availability** | ⚠️ Not screened for the retired codename; assume `.com` and store names were contested. |

**Disposition:** stop using "Miniknight" for anything user-visible. It appears in this repo only
as historical context and in `docs/prompts/1st-prompt.md` (the original brief).

### 7.2 "Emberwold" — preliminary status (not a clearance opinion)

| Item | Status (2026-10-24) |
|---|---|
| Chosen by owner | ✅ Yes; GitHub repo renamed `davidcai/emberwold` (old URL redirects) |
| Preliminary GitHub check | ✅ No bare-name repository/user collision found for `emberwold` at time of check (GitHub API search). This is **not** a trademark screen. |
| Trademark / store / domain screen | ❌ Not done. Required before any public product release (§7.3). Deferred while the game is a private hobby project for the owner and friends. |
| Product branding/wordmark | ❌ Deferred until v1 (ADR-007) |

**Reading:** for a private hobby project tested with friends, no further naming work is needed.
The moment anything is published (public repo *product*, store page, trailer, itch.io build), run
§7.3 and record the results.

### 7.3 Minimum trademark screen (before reserving or publishing a name)

- [ ] **USPTO Trademark Search** (<https://tmsearch.uspto.gov/>) — exact name, plurals and
      phonetic variants; classes 9 (software), 16 (printed matter), 28 (games), 41
      (entertainment services). ⚠️ Registration records for "MAGE KNIGHT" could not be retrieved
      programmatically (USPTO/Justia endpoints are JS- or Cloudflare-gated); use a lawyer or paid
      search for anything public.
- [ ] **EUIPO eSearch** and **WIPO Global Brand Database** if selling in the EU/UK/international.
- [ ] **Store searches**: Steam, App Store, Google Play, itch.io for exact and near names.
- [ ] **Domain + social handle** availability for the chosen name.
- [ ] **Common-law search**: GitHub, Reddit, BGG, Board Game Arena, Tabletopia.
- [ ] Record date-stamped screenshots of every search in a naming file.

---

## 8. Options matrix

| Option | What it means | Effort / cost | Legal risk | Ceiling | Notes |
|---|---|---|---|---|---|
| **A. Personal prototype** | Build and play locally; never distribute binaries or a public repo with assets | Lowest | **T0** — negligible in practice | You learn whether the game is fun and buildable | Recommended **now**. Nothing in this doc blocks prototyping. Keep official PDFs/art in a gitignored `reference/` (as the repo already does). |
| **B. Free non-commercial fan release** | Public build, own code, **own art and rewritten text**, disclaimer, no donations, no ads | Medium (art + writing is the cost) | **T2** — moderate-low, but not zero | Community goodwill; a portfolio piece; possible takedown | This is the *defensible* fan path. Do not bundle official art/PDFs, do not use the name. Even then, "Mage Knight" in the *description* is a trademark use — keep it factual and minimal. |
| **C. Licensed commercial product** | Negotiate a licence from WizKids; ship with official name/art | High: advance/royalty, legal fees, publisher approval, milestone risk | **Low** (contractual) | Real revenue, official assets, storefronts | The only path that legitimises the name and art. Precedent exists (Dire Wolf, 2019) but that deal did not ship — expect a hard commercial conversation and a long timeline. |
| **D. Clean-room original IP ("inspired by")** | Same mechanics, own name, own art, own world/text; marketed as a spiritual successor | Medium–high (art + narrative design) | **T0–T2** — lowest for a public/commercial product | Highest long-term: ownable IP, sellable, expandable | The only option that can become a business without a licence. Precedent: `tvhees/Colour-Quest` — "Single player game loosely inspired by Mage Knight Board Game". Also instructive: *Star Trek: Frontiers* (2016) — the same designer and publisher reusing the MK system under a licensed Star Trek theme, i.e. re-theming this exact rules engine is a proven pattern (see `01-game-overview.md`). |

### Decision taken (2026-10-24)

The owner chose **ADR-001 + ADR-002**: a **personal, educational, non-commercial hobby
project** built as a **clean-room re-theme (option D)**. Consequences and remaining release
gates are recorded in [`../design/00-decisions.md`](../design/00-decisions.md); the original
world/name mapping is in [`../design/15-retheme-bible.md`](../design/15-retheme-bible.md).
The options analysis below is kept as the reasoning behind that choice.

### Recommendation

**Do A now → design for D → decide between B and C before any public build leaves your machine.**

1. **Prototype freely (A).** Build the engine against the official rules. Keep the `reference/`
   gitignore policy; never commit PDFs or art.
2. **Architect for D from day one.** Treat the Mage Knight *content* (names, art, text) as a
   **skin**: a data pack that can be swapped. This is cheap now and enormously valuable later —
   it is the difference between "throw it away" and "re-theme in a week". Concretely: content IDs
   are internal and stable; display names/art/text come from a content pack; no MK name/art in
   code or UI strings.
3. **Decide B vs C before publicity.** If the goal is a portfolio/community piece, B with own art
   and a disclaimer is the pragmatic ceiling. If the goal is revenue, you need C or D — and D is
   the only one you can execute unilaterally.
4. **Do not** pick "C by default" because the rights were licensed once. A cancelled AAA deal is
   evidence the economics are hard, not that the door is open.

---

## 9. Pre-release checklist

Nothing in this list applies to a private prototype. All of it applies before the first public
download, store page, trailer, or paid build.

**Content provenance**
- [ ] Every art file has a recorded source and licence (spreadsheet or `CREDITS.md`), including
      commissioned work with a signed assignment/licence.
- [ ] No official scans, no PDF-derived images, no extracted fonts, no ripped TTS/Vassal assets.
- [ ] No verbatim rulebook text; rules rewritten in your own words/notation; card effect text
      rewritten (and, for a public build, ideally renamed).
- [ ] No official logo, card frames, iconography, or trade dress; own visual system.
- [ ] Fonts are SIL OFL / Apache / ISC and their licence files are shipped as required (`07` §5).
- [ ] Audio is CC0/CC-BY with attribution, or commissioned with a licence.

**Name and brand**
- [ ] Trademark screen completed (§7.3), documented, dated.
- [ ] Product name contains no "Mage Knight" and no confusing variant.
- [ ] Store listing uses "Mage Knight" only as a factual descriptive reference ("a fan-made
      tribute to Vlaada Chvátil's Mage Knight Board Game") — or not at all.
- [ ] Domains/handles secured for the final name.

**Legal hygiene**
- [ ] Prominent disclaimer: "Not affiliated with, endorsed by, or sponsored by WizKids/NECA or
      Vlaada Chvátil. Mage Knight is a trademark of WizKids/NECA." (A disclaimer does not create
      a licence — it reduces confusion.)
- [ ] No monetisation of any kind if using any MK-derived content (no ads, donations, Patreon,
      paid DLC, bundles).
- [ ] EULA/terms, privacy policy (if any data leaves the device), age rating, store compliance.
- [ ] A takedown contact address that a rights-holder can use, and a written plan for what you
      will do if you receive one (comply fast; have the ability to swap the content pack).
- [ ] Consider a **content-pack split**: ship the engine + original content publicly; keep any
      MK-derived data out of the distributed artifact entirely (the upstream project's model).
- [ ] Lawyer review of the above, in your jurisdiction, before release.

---

## 10. Open questions for counsel

1. Does WizKids assert registered trademark rights in "MAGE KNIGHT" in classes 9/41, and what is
   the registration/owner record? (Needs a paid or professional search — §7.3.)
2. Is a non-commercial, own-art, own-text reimplementation with a descriptive "inspired by"
   reference defensible in our jurisdiction, or does the game's *trade dress* and card-naming
   still create unacceptable risk?
3. Does the answer change if the product is free but ad-supported, or free with paid cosmetic DLC?
4. What is the minimum licence structure WizKids would consider (advance? royalty? approval
   rights?) and is an unsolicited pitch appropriate, or does it require an agent?
5. For a re-theme (option D), how close can the *rules* be before the "idea/expression" line is
   crossed in our jurisdiction — particularly the specific card names and the scenario
   structures?

---

## Sources

**Primary (publisher material, on disk under `reference/`, not redistributed — see `08-sources.md`):**
- MKUE Rulebook, p.22 — design credits, illustration credits, "© 2018 WizKids/NECA, LLC. WizKids
  and related marks and logos are trademarks of WizKids. All rights reserved."
- MKUE Expansions Rulebook, p.15 — "© 2015 WizKids/NECA, LLC. All Rights reserved. Heroclix,
  Wizkids, Mage Knight are trademarks of WIZKIDS/NECA, LLC."
- Master Reference Sheet, p.2 — "© 2015 WizKids/NECA, LLC. All Rights reserved. HeroClix, WizKids,
  Mage Knight are trademarks of WIZKIDS/NECA, LLC."

**Publisher web:**
- WizKids, *Mage Knight: Ultimate Edition* (product page, rules downloads, copyright footer): <https://wizkids.com/mage-knight-ultimate-edition/>
- WizKids, *Mage Knight*: <https://wizkids.com/mage-knight/>
- WizKids, *Legal Notices*: <https://wizkids.com/legal-notices/>
- WizKids, *Fantasy Realms: Digital Edition* (licensed digital product page): <https://wizkids.com/fantasy-realms-digital-edition/>
- WizKids site search API (used to establish absence of a fan-content policy), e.g. <https://wizkids.com/wp-json/wp/v2/search?search=fan+content>

**Statute:**
- 17 U.S.C. §102 — subject matter of copyright (idea/expression, methods of operation): <https://www.law.cornell.edu/uscode/text/17/102>
- 15 U.S.C. §1114 — trademark infringement / remedies: <https://www.law.cornell.edu/uscode/text/15/1114>
- 15 U.S.C. §1125 — false designation of origin, dilution: <https://www.law.cornell.edu/uscode/text/15/1125>
- USPTO Trademark Search (screen tool): <https://tmsearch.uspto.gov/>

**Precedents:**
- Stately Play, Dire Wolf / WizKids licensing announcement, 2019-01-18: <https://statelyplay.com/2019/01/18/dire-wolf-is-about-to-blow-up-your-digital-board-game-world/>
- Dire Wolf games catalogue (Mage Knight absent): <https://www.direwolfdigital.com/games/>
- r/boardgames, cancellation report: <https://www.reddit.com/r/boardgames/comments/ptwyfa/any_news_on_the_mage_knight_digital_adaptation_by/> (⚠️ community source)
- `mage-knight-digital/MageKnight` (no LICENSE; rulebook committed; art external): <https://github.com/mage-knight-digital/MageKnight>
- `kyle-ip/mage-knight` (bundles official art + PDFs + disclaimer): <https://github.com/kyle-ip/mage-knight>
- Tabletop Simulator Workshop, appid 286160, "mage knight": <https://steamcommunity.com/workshop/browse/?appid=286160&searchtext=mage+knight>
- Vassal module: <https://vassalengine.org/wiki/Module:Mage_Knight_Board_Game>
- Clean-room re-theme precedent, `tvhees/Colour-Quest` ("loosely inspired by Mage Knight"): <https://github.com/tvhees/Colour-Quest>
- Steam store search "miniknight" → *Mini Knight's Journey* (app 2222250): <https://store.steampowered.com/search/?term=miniknight>
- GitHub search "miniknight" (12 repositories): <https://github.com/search?q=miniknight&type=repositories>
