# AGENTS.md — instructions for AI agents

This file is for AI coding agents (Claude Code, Codex, Cursor, Copilot, DSH, etc.) working in
this repository. **Humans:** start at [`README.md`](README.md).

Project status, goals, the document map, repository layout, reproduction commands and the
decision summary live in `README.md` — **read it first and do not repeat it here or in new
docs; link to it instead.** This file only adds agent-specific rules that are not in the README.

---

## 0. Before you do anything

1. Read [`README.md`](README.md) (status, doc map, repository layout, decisions).
2. Read [`docs/design/00-decisions.md`](docs/design/00-decisions.md) — the ADRs are **binding**.
3. Read the one or two documents that actually cover your task (use the README's "Read in this
   order"; do not bulk-read the whole repo).
4. If you touch game content, also read [`game-data/README.md`](game-data/README.md).
5. If you touch anything user-visible or public-facing, also read
   [`docs/research/06-legal-ip.md`](docs/research/06-legal-ip.md) and
   [`docs/design/15-retheme-bible.md`](docs/design/15-retheme-bible.md).

**Settled decisions are settled.** Do not silently re-open stack, scope, art or naming choices.
If you believe one is wrong, propose a new ADR to the human; do not implement a different
direction.

## 1. This repository is PUBLIC — never store secrets here

The GitHub remote is public. **Everything committed is world-readable forever, including git
history.** This rule is non-negotiable and overrides any convenience.

- **Never commit** API keys, access tokens (GitHub, OpenAI, Anthropic, Midjourney, image
  generators, etc.), passwords, cookies, session tokens, private keys, `.env` files, cloud
  credentials, webhook URLs, or personal data — not even temporarily, not even in a test
  fixture, not even in a comment or commit message.
- **Never paste** a secret into a doc, prompt, test, log, sample config, issue text, or chat
  output that gets committed.
- **Never run** commands that print secrets into a transcript you might commit (e.g. `env`,
  `gh auth token`, `cat ~/.aws/credentials`). If you need a credential at runtime, read it from
  an environment variable or the OS keychain, and document only the variable's **name**.
- Use dummy values (`sk-test-...`, `changeme`) in examples and tests.
- Do not weaken [`.gitignore`](.gitignore) or `git add -f` ignored files.
- Prefer the existing keyring-authenticated `gh` CLI over tokens written to files.
- Public also means: no private URLs, no personal information, no unlicensed third-party
  content, no internal-only notes.
- **If you discover a committed secret:** stop, tell the human immediately, and do not try to
  rewrite public history yourself. The credential must be rotated first; history cleanup is a
  human decision.

## 2. Current phase: pre-implementation (do not start the game)

- `README.md` says research + design are complete and there is **no game code yet**. Unless the
  human **explicitly** asks for implementation, do **not**: scaffold the app, add runtime
  dependencies, create build config, or write game code.
- The planned first implementation step is the T0 spike in
  [`docs/design/14-roadmap.md`](docs/design/14-roadmap.md) §5. It requires explicit owner
  approval; status and stack are in the ADRs and
  [`docs/design/17-platform-analysis.md`](docs/design/17-platform-analysis.md).
- Documentation, game data, art prompts, decision records and tooling fixes are in scope when
  asked — but still follow the rules below.

## 3. IP / clean-room rules (ADR-002)

- Mechanics may be implemented; **expression may not be copied**: no official names, card text,
  rules prose, art, logo, card frames or trade dress in any new file, string, identifier, asset
  name or UI text.
- **Never commit** publisher PDFs, extracted rulebook text or official art. `reference/` is
  intentionally gitignored and must stay that way; keep it local.
- The upstream open-source project is a **cross-check only** — do not copy its code, data
  tables, identifiers or comments; it has no licence (`docs/research/05-digital-precedents.md`).
- New user-visible strings and names must follow the terminology map and forbidden-term list in
  `docs/design/15-retheme-bible.md`. If a name is not covered there, ask the human; do not invent
  a public name.
- The project is **Emberwold** (repo `davidcai/emberwold`; formerly codenamed "Miniknight").
  Public product branding, domains, store pages and wordmarks stay deferred until v1 (ADR-007);
  do not create them or rename the repository without the owner's explicit instruction.
- AI art: follow `docs/design/16-art-brief.md` + `docs/design/18-ai-art-prompts.md`. Never use
  official art as image input, never prompt living-artist styles, and never AI-generate the
  wordmark.

## 4. Game-data changes

- The schema, effect DSL, provenance rules and known discrepancies are in
  [`game-data/README.md`](game-data/README.md) — read it before editing any JSON.
- Every content item needs `source`/`page` provenance and a confidence/status marker. Never
  invent values. Mark uncertain values `⚠️ UNVERIFIED` rather than guessing.
- After any `game-data/` change, run the data validator (exact command and environment setup
  are in `README.md` → "Reproducing the research"). It must pass before you commit.
- Do not "fix" verified official values back to upstream-project values, and do not regenerate
  data from upstream unless explicitly asked. Existing discrepancy notes (e.g. fame thresholds)
  are deliberate and documented.

## 5. Documentation conventions

- Docs are the source of truth and are cross-linked. Use **relative Markdown links**, and keep
  `README.md` / `docs/README.md` indexes in sync when you add, rename or remove a doc.
- Follow the citation/source rules documented in `README.md` ("Reproducing the research") and
  `docs/research/08-sources.md`; never fabricate a citation; mark anything unverified.
- Do not duplicate README content in new docs — link to the README section instead.
- Decisions are append-only: add a new ADR to `docs/design/00-decisions.md`; don't rewrite old
  ones except to mark them superseded, and update the docs they affect.
- If multiple agents work concurrently, respect the file-ownership table in
  [`docs/research/00-brief.md`](docs/research/00-brief.md) §7 and claim shared tasks before
  writing; never edit a file another agent has in flight.

## 6. Working in this repository

- **Toolchain, blocked websites, fetch proxy and PDF extraction** are documented in
  [`docs/research/00-brief.md`](docs/research/00-brief.md) §3 and
  [`docs/research/08-sources.md`](docs/research/08-sources.md) §6. Follow those recipes instead
  of re-discovering them; do not commit downloaded publisher files.
- `reference/` is local-only research material. Restore it with the commands in
  `docs/research/08-sources.md` §1. Never force-add it to git.
- Do not add generated artifacts, caches, `.venv/`, `reference/`, `art/source/` or large binaries
  to the repo. If a genuinely large asset must be tracked, ask the human first.
- There are no application build/test commands yet. The only current executable check is the
  data validator above.

## 7. Git and publishing

- Make small, descriptive commits. Do not amend/rewrite history, force-push, or change the
  remote without explicit human approval.
- **Before any push, scan the diff for secrets, personal data and third-party content** — this
  repository is public.
- Do not create GitHub releases, issues, discussions or store pages unless asked.
- If a task requires publishing something (a web build, an art drop, a demo), confirm with the
  human first.

## 8. Do-not list (quick reference)

1. No secrets in the repo — ever (see §1).
2. No game implementation or app scaffolding before explicit approval.
3. No official art/PDFs/rulebook text, no copied upstream code/data.
4. No public branding, domains, store pages or wordmarks before v1 (ADR-007); no repo renames without approval.
5. No invented rules, citations, names or data values — mark uncertainty or ask.
6. No scope changes (content manifest/heroes/scenario) without human approval.
7. No force-push or history rewrite on the public remote.
8. No legal conclusions; document risk per `06` and escalate.

## 9. When you are stuck

- Rules questions → check the ambiguity register in
  [`docs/research/04-faq-clarifications.md`](docs/research/04-faq-clarifications.md) before asking.
- Missing/unavailable sources → `docs/research/08-sources.md` §5.
- Anything that is an owner decision (see the "Pending decisions" table in
  `docs/design/00-decisions.md`) → ask the human; do not pick a default silently.
