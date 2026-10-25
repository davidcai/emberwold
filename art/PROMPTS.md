# Art Prompts — copy-paste sheet (41 assets)

**Generated from [`prompts.json`](prompts.json)** · spec: [`../docs/design/16-art-brief.md`](../docs/design/16-art-brief.md) · workflow: [`../docs/design/18-ai-art-prompts.md`](../docs/design/18-ai-art-prompts.md)

> **Reality note:** no images were generated for this repo. This is the prompt pack to run in your chosen tool.

## How to use this in the ChatGPT desktop app or Grok Imagine

1. **Style-lock first (4 images):** `hero_emberdrinker`, `enemy_slot_01`, `motif_01_stride`, `tile_countryside_1`. Expect 3–5 rounds each. These 4 become your reference set.
2. **Feed references forward.** ChatGPT and Grok Imagine accept the locked images as style/character references — attach 1–3 of them to every later prompt. Paste the prompt first, then attach references with a line like: *"Match the attached art style, palette and rendering."*
3. **No negative-prompt field?** Most chat-style image tools ignore separate negatives. Every slot below includes the global **Avoid** list inline — keep it in the same message, after the prompt.
4. **Aspect ratio:** set it in the tool UI to the slot's `aspect` (square, portrait, landscape, 16:9). Do not let the tool crop heroes/enemies to landscape.
5. **Save as:** `art/final/<category>/<id>@2x.png` (see `export_hint`), then update `art/manifest.json` (`status: final`, `art_ref`).
6. **Do not AI-generate** the logo slot; use typography/vector instead.
7. **Never** paste official Mage Knight art as a reference or mention its name/official card names/artists in prompts.
8. **Consistency repair:** if a piece drifts, re-attach the style-lock images and add: *"same palette, same brushwork, same light direction as the attached references."*

## Global style block (already included in every prompt)

```text
Stylized 2D fantasy illustration for a hex-and-card board game. Hand-inked line art: confident warm-umber outlines (#312523) of varying weight that clearly describe every shape, with clean interior linework for folds and gear. Smooth cel shading: flat mid-tone fills, soft airbrushed transitions in the shadows, one clean highlight per form; matte finish, no rendered texture, no gloss, no photographic detail. Stylized storybook proportions: oversized expressive head, compact torso, slightly oversized hands and feet, rounded appealing silhouette. Muted earthy palette: moss and olive greens (#7D8B50, highlights #C4D553), dusty rust and oxblood (#9C5A4E, #7C4B48), ochre and dull brass (#AD9A70), worn leather browns (#645146, #7B5749), parchment off-whites (#E9E5D9, #E1DFD6); low saturation, no pure black, no neon. Soft, even daylight from the upper front with gentle contact shadows; no dramatic chiaroscuro, no coloured rim light. Cozy-gritty storybook-adventure mood; clean readable shapes with modest detail that survives at 48–96 px. No text, no letters, no numbers, no logo, no signature, no watermark, no border, no frame, no UI, no baked hex grid.
```

## Global avoid list (already included in every slot)

```text
text, letters, words, numbers, captions, typography, watermark, signature, artist name, logo, lettered emblem, border, frame, card frame, UI, HUD, interface, buttons, hex grid, grid lines, grid overlay, map labels, arrows, annotations, photorealistic, photograph, 3D render, CGI, octane render, ray tracing, plastic, glossy, chrome, metallic shine, neon, oversaturated, HDR glow, lens flare, bloom, heavy bokeh, motion blur, oil painting, impasto, dry-brush texture, canvas texture, painterly, dramatic chiaroscuro, low contrast, muddy values, flat gray lighting, sketch, unfinished, concept sketch lines, extra limbs, extra arms, extra fingers, fused fingers, deformed hands, malformed hands, duplicate subject, multiple heads, floating objects, cluttered background, white background, studio backdrop, official game art, fan art, photobash
```


---

## P0 — build-critical (style lock + hero/enemy/tile/Seat set)


### `enemy_slot_01` — enemy · 1024x1024 · 1:1 · P0

```text
Enemy token figure: a Gutterkin skirmisher — a squat, bandy-legged scavenger kin about four feet tall, wide shoulders, soot-smeared grey-brown hide, a too-wide grin of small teeth and a long hooked nose; mismatched scavenged plate lashed on with rope over torn ember-red rags, a rusted hook-blade in one hand and a splintered scrap-wood shield in the other; crouched forward mid-slink, weight on the front foot, eyes narrowed; full-body, three-quarter view facing slightly left, weapon and feet well inside frame; centred on a flat untextured mid-grey backdrop, no scenery, no cast shadow, subject filling about 80% of the frame, clean strong outer contour, no fragile details; stylized 2D illustration, warm ink linework, smooth cel shading, flat mid-tones, silhouette-first; ember-orange #E0662E rag accents, bone #E7DCC6 teeth highlights, soot-black #17120F and charcoal #2A221C shadow core, soft, even warm light from front-left; no text, no letters, no watermark, no signature, no logo, no border, no frame.
```

**Avoid:** text, letters, words, numbers, captions, typography, watermark, signature, artist name, logo, lettered emblem, border, frame, card frame, UI, HUD, interface, buttons, hex grid, grid lines, grid overlay, map labels, arrows, annotations, photorealistic, photograph, 3D render, CGI, octane render, ray tracing, plastic, glossy, chrome, metallic shine, neon, oversaturated, HDR glow, lens flare, bloom, heavy bokeh, motion blur, oil painting, impasto, dry-brush texture, canvas texture, painterly, dramatic chiaroscuro, low contrast, muddy values, flat gray lighting, sketch, unfinished, concept sketch lines, extra limbs, extra arms, extra fingers, fused fingers, deformed hands, malformed hands, duplicate subject, multiple heads, floating objects, cluttered background, white background, studio backdrop, official game art, fan art, photobash background scenery, ground, floor, horizon, cast shadow, multiple figures, cropped weapon, cropped feet, thin spikes

*Notes:* P0. Gutterkin family signature: squat build, scavenged plate, ember-red rags, hooked weapons. Must pass the 48 px black-silhouette test (flip the image to pure black and squint). Generate against flat grey, cut out with rembg/BiRefNet, add 4 px transparent padding, export 1024 px master + 96 px and 48 px WebP. Body proportions must match slots 02-04.

*Save as:* `art/enemy/gutterkin_skirmisher@2x.png (plus 96 px WebP)`


### `enemy_slot_02` — enemy · 1024x1024 · 1:1 · P0

```text
Enemy token figure: a Gutterkin raider — leaner and taller than a skirmisher but still squat and hunched, soot-smeared grey-brown hide, a salvaged iron cap with a hammered nail-spike, a heavy notched cleaver in one hand and a looted sack over the other shoulder, torn ember-red rags wrapped round one arm, a rope belt hung with a stolen brass hearth token; charging forward in a low lope, mouth open in a snarl, weapon low and ready; full-body, three-quarter view facing slightly right, strong diagonal silhouette, weapon and feet inside frame; centred on a flat untextured mid-grey backdrop, no scenery, no cast shadow, subject filling about 80% of the frame, clean strong outer contour; stylized 2D illustration, warm ink linework, smooth cel shading, flat mid-tones, silhouette-first; ember-orange #E0662E rag accents, charcoal #2A221C plate, bone #E7DCC6 teeth, soot-black #17120F shadow core, soft, even warm light from front-right; no text, no letters, no watermark, no signature, no logo, no border, no frame.
```

**Avoid:** text, letters, words, numbers, captions, typography, watermark, signature, artist name, logo, lettered emblem, border, frame, card frame, UI, HUD, interface, buttons, hex grid, grid lines, grid overlay, map labels, arrows, annotations, photorealistic, photograph, 3D render, CGI, octane render, ray tracing, plastic, glossy, chrome, metallic shine, neon, oversaturated, HDR glow, lens flare, bloom, heavy bokeh, motion blur, oil painting, impasto, dry-brush texture, canvas texture, painterly, dramatic chiaroscuro, low contrast, muddy values, flat gray lighting, sketch, unfinished, concept sketch lines, extra limbs, extra arms, extra fingers, fused fingers, deformed hands, malformed hands, duplicate subject, multiple heads, floating objects, cluttered background, white background, studio backdrop, official game art, fan art, photobash background scenery, ground, floor, horizon, cast shadow, multiple figures, cropped weapon, cropped feet, thin spikes

*Notes:* P0. Shares the Gutterkin family sheet with slot 01: same proportions, hide tone, rag colour and plate language, only gear and pose change. Readable at 48 px as a hunched, club-armed mass. Cut out, pad, export master + 96/48 px WebP.

*Save as:* `art/enemy/gutterkin_raider@2x.png (plus 96 px WebP)`


### `enemy_slot_03` — enemy · 1024x1024 · 1:1 · P0

```text
Enemy token figure: a Gutterkin brute — a hulking, top-heavy Gutterkin almost twice the width of a raider, patchwork plate strapped over a barrel chest with rope and chain, a small scarred head sunk between huge shoulder plates, one forearm wrapped in iron bands and the other dragging a massive spiked maul; standing planted, leaning forward, breathing hard, knuckles white on the haft; full-body, three-quarter view facing slightly left, silhouette like a boulder with a weapon, the maul held so it stays inside the frame; centred on a flat untextured mid-grey backdrop, no scenery, no cast shadow, subject filling about 85% of the frame, clean strong outer contour, no thin spikes; stylized 2D illustration, warm ink linework, smooth cel shading, flat mid-tones, silhouette-first; ember-orange #E0662E rag at the belt, charcoal #2A221C plate, bone #E7DCC6 rivets, soot-black #17120F shadow core, soft, even warm light from front-left; no text, no letters, no watermark, no signature, no logo, no border, no frame.
```

**Avoid:** text, letters, words, numbers, captions, typography, watermark, signature, artist name, logo, lettered emblem, border, frame, card frame, UI, HUD, interface, buttons, hex grid, grid lines, grid overlay, map labels, arrows, annotations, photorealistic, photograph, 3D render, CGI, octane render, ray tracing, plastic, glossy, chrome, metallic shine, neon, oversaturated, HDR glow, lens flare, bloom, heavy bokeh, motion blur, oil painting, impasto, dry-brush texture, canvas texture, painterly, dramatic chiaroscuro, low contrast, muddy values, flat gray lighting, sketch, unfinished, concept sketch lines, extra limbs, extra arms, extra fingers, fused fingers, deformed hands, malformed hands, duplicate subject, multiple heads, floating objects, cluttered background, white background, studio backdrop, official game art, fan art, photobash background scenery, ground, floor, horizon, cast shadow, multiple figures, cropped weapon, cropped feet, thin spikes, lean build

*Notes:* P0. The family's size anchor: same Gutterkin proportions and gear language, scaled to a boulder silhouette. Keep the maul head chunky rather than spiky so it survives 48 px. Cut out, pad, export master + 96/48 px WebP.

*Save as:* `art/enemy/gutterkin_brute@2x.png (plus 96 px WebP)`


### `enemy_slot_04` — enemy · 1024x1024 · 1:1 · P0

```text
Enemy token figure: a Gutterkin beast-handler — a wiry, hunched Gutterkin in a thick leather apron and a bone-handled goad, one arm wrapped in chain, leading a lean, scarred wold-hound on a short chain; the hound is low at his heel, ribs showing, ears back, ember-orange #E0662E eyes reflecting firelight; the handler stands braced and watchful while the hound presses forward; the pair must read as one compact silhouette mass, handler upright and hound low, no gap between them, both fully inside frame; full-body, three-quarter view facing slightly right; centred on a flat untextured mid-grey backdrop, no scenery, no cast shadow, the pair filling about 80% of the frame, clean strong outer contour; stylized 2D illustration, warm ink linework, smooth cel shading, flat mid-tones, silhouette-first; charcoal #2A221C apron and hide, bone #E7DCC6 teeth and chain highlights, soot-black #17120F shadow core, soft, even warm light from front-right; no text, no letters, no watermark, no signature, no logo, no border, no frame.
```

**Avoid:** text, letters, words, numbers, captions, typography, watermark, signature, artist name, logo, lettered emblem, border, frame, card frame, UI, HUD, interface, buttons, hex grid, grid lines, grid overlay, map labels, arrows, annotations, photorealistic, photograph, 3D render, CGI, octane render, ray tracing, plastic, glossy, chrome, metallic shine, neon, oversaturated, HDR glow, lens flare, bloom, heavy bokeh, motion blur, oil painting, impasto, dry-brush texture, canvas texture, painterly, dramatic chiaroscuro, low contrast, muddy values, flat gray lighting, sketch, unfinished, concept sketch lines, extra limbs, extra arms, extra fingers, fused fingers, deformed hands, malformed hands, duplicate subject, multiple heads, floating objects, cluttered background, white background, studio backdrop, official game art, fan art, photobash background scenery, ground, floor, horizon, cast shadow, separated figures, cropped chain, cropped hound, cropped feet, thin spikes

*Notes:* P0. Highest token-readability risk in the set: two subjects at 48 px. Keep the hound's head overlapping the handler's leg so the pair form one blob; test by flattening to black. Cut out both together, pad, export master + 96/48 px WebP.

*Save as:* `art/enemy/gutterkin_beast_handler@2x.png (plus 96 px WebP)`


### `enemy_slot_05` — enemy · 1024x1024 · 1:1 · P0

```text
Enemy token figure: a Wyrmspawn cinder — a low-slung, four-limbed horned reptile-kin the size of a large hound, ash-grey scales cracked with ember-orange #E0662E seams glowing between the plates of throat and chest; a crown of three backswept horns — two long temple horns and one short brow horn, our own original horn arrangement, no bat-wing cape silhouette and no known dragon design; a whip-like tail, clawed forelimbs planted wide, head low and forward, mouth ajar with a soft molten glow inside and no gore; muscular but lean; full-body, three-quarter view facing slightly left, tail and horns fully inside frame; centred on a flat untextured mid-grey backdrop, no scenery, no cast shadow, subject filling about 80% of the frame, clean strong outer contour; stylized 2D illustration, warm ink linework, smooth cel shading, flat mid-tones, silhouette-first; ember-orange #E0662E throat and seams, bone #E7DCC6 horn tips and claws, soot-black #17120F and charcoal #2A221C scales, soft, even warm light from the underside; no text, no letters, no watermark, no signature, no logo, no border, no frame.
```

**Avoid:** text, letters, words, numbers, captions, typography, watermark, signature, artist name, logo, lettered emblem, border, frame, card frame, UI, HUD, interface, buttons, hex grid, grid lines, grid overlay, map labels, arrows, annotations, photorealistic, photograph, 3D render, CGI, octane render, ray tracing, plastic, glossy, chrome, metallic shine, neon, oversaturated, HDR glow, lens flare, bloom, heavy bokeh, motion blur, oil painting, impasto, dry-brush texture, canvas texture, painterly, dramatic chiaroscuro, low contrast, muddy values, flat gray lighting, sketch, unfinished, concept sketch lines, extra limbs, extra arms, extra fingers, fused fingers, deformed hands, malformed hands, duplicate subject, multiple heads, floating objects, cluttered background, white background, studio backdrop, official game art, fan art, photobash background scenery, ground, floor, horizon, cast shadow, multiple creatures, bat wings, membrane wings, dragon resembling existing game art, crest frill, cropped horns, cropped tail, cropped feet

*Notes:* P0. Wyrmspawn family signature: the three-horn crown (two long temple horns, one short brow horn) and ember-lit throat must be identical across slots 05-07. Deliberately not a known dragon design: no wings on this one, four limbs, low-slung. Readable at 48 px as a horned quadruped. Cut out, pad, export master + 96/48 px WebP.

*Save as:* `art/enemy/wyrmspawn_cinder@2x.png (plus 96 px WebP)`


### `enemy_slot_06` — enemy · 1024x1024 · 1:1 · P0

```text
Enemy token figure: a Wyrmspawn rime — a smaller, paler sibling of the cinder Wyrmspawn, rime-cyan #4FA8B8 scales rimed with frost and gale-pale #DCE6E8 plates, the same three-horn crown as the family (two long temple horns, one short brow horn), a throat that glows cold rime instead of ember, frost smoke curling from its nostrils, an old spear scar on one shoulder; forelimbs planted in a wary crouch, tail curled tight to the body for a compact silhouette, head turned slightly toward the viewer; full-body, three-quarter view facing slightly right, horns and tail fully inside frame; centred on a flat untextured mid-grey backdrop, no scenery, no cast shadow, subject filling about 80% of the frame, clean strong outer contour; stylized 2D illustration, warm ink linework, smooth cel shading, flat mid-tones, silhouette-first; soft, even cool light, rime-cyan #4FA8B8 and gale-pale #DCE6E8 highlights, gloam-violet #5B4B8A shadow core, one tiny warm ember #E0662E accent in the eye; no text, no letters, no watermark, no signature, no logo, no border, no frame.
```

**Avoid:** text, letters, words, numbers, captions, typography, watermark, signature, artist name, logo, lettered emblem, border, frame, card frame, UI, HUD, interface, buttons, hex grid, grid lines, grid overlay, map labels, arrows, annotations, photorealistic, photograph, 3D render, CGI, octane render, ray tracing, plastic, glossy, chrome, metallic shine, neon, oversaturated, HDR glow, lens flare, bloom, heavy bokeh, motion blur, oil painting, impasto, dry-brush texture, canvas texture, painterly, dramatic chiaroscuro, low contrast, muddy values, flat gray lighting, sketch, unfinished, concept sketch lines, extra limbs, extra arms, extra fingers, fused fingers, deformed hands, malformed hands, duplicate subject, multiple heads, floating objects, cluttered background, white background, studio backdrop, official game art, fan art, photobash background scenery, ground, floor, horizon, cast shadow, multiple creatures, bat wings, membrane wings, dragon resembling existing game art, crest frill, cropped horns, cropped tail, cropped feet, warm fire breath

*Notes:* P0. Same family sheet as slot 05; only colour and posture change (cool key instead of warm). Check the horn arrangement matches slot 05 exactly. Cut out, pad, export master + 96/48 px WebP.

*Save as:* `art/enemy/wyrmspawn_rime@2x.png (plus 96 px WebP)`


### `enemy_slot_07` — enemy · 1024x1024 · 1:1 · P0

```text
Enemy token figure: a Wyrmspawn elder — an old, tall Wyrmspawn standing on two legs, dull ash-grey scales cracked with age, wings reduced to folded, scarred stubs held tight against the back so the silhouette stays compact and wingless, the family three-horn crown grown long and blackened (two temple horns, one short brow horn), throat and brow seamed with ember-orange #E0662E light, forelimbs held close like heavy hands, a heavy tail dragging behind; gold #E3B341 grave-jewellery at the neck, patient and regal, head lowered slightly; full-body, three-quarter view facing left, horns and tail fully inside frame; centred on a flat untextured mid-grey backdrop, no scenery, no cast shadow, subject filling about 85% of the frame, clean strong outer contour; stylized 2D illustration, warm ink linework, smooth cel shading, flat mid-tones, silhouette-first; soft, even warm light from its own throat and a low brazier, bone #E7DCC6 horn highlights, soot-black #17120F and charcoal #2A221C scales; no text, no letters, no watermark, no signature, no logo, no border, no frame.
```

**Avoid:** text, letters, words, numbers, captions, typography, watermark, signature, artist name, logo, lettered emblem, border, frame, card frame, UI, HUD, interface, buttons, hex grid, grid lines, grid overlay, map labels, arrows, annotations, photorealistic, photograph, 3D render, CGI, octane render, ray tracing, plastic, glossy, chrome, metallic shine, neon, oversaturated, HDR glow, lens flare, bloom, heavy bokeh, motion blur, oil painting, impasto, dry-brush texture, canvas texture, painterly, dramatic chiaroscuro, low contrast, muddy values, flat gray lighting, sketch, unfinished, concept sketch lines, extra limbs, extra arms, extra fingers, fused fingers, deformed hands, malformed hands, duplicate subject, multiple heads, floating objects, cluttered background, white background, studio backdrop, official game art, fan art, photobash background scenery, ground, floor, horizon, cast shadow, multiple creatures, open bat wings, membrane wings, dragon resembling existing game art, crest frill, cropped horns, cropped tail, cropped feet

*Notes:* P0. The family's large silhouette and the city-tier threat: same horn crown as 05/06, but taller, two-legged and wingless-by-design. Keep the folded wing stubs inside the body outline. Cut out, pad, export master + 96/48 px WebP.

*Save as:* `art/enemy/wyrmspawn_elder@2x.png (plus 96 px WebP)`


### `enemy_slot_08` — enemy · 1024x1024 · 1:1 · P0

```text
Enemy token figure: a Vault dweller — a pale, blind, many-limbed thing from the Sunken Vaults, hairless bone-white hide, no eyes at all, a smooth eyeless face turned up as if listening, long over-jointed arms ending in spade-like claws, two extra thin limbs folded against its ribs, a hunched crab-like crouch; a rusted iron collar and scraps of drowned leather, a thin seam of a mouth; it reaches one long arm forward, the rest of the body coiled; full-body, three-quarter view facing slightly right, all limbs inside frame, compact spider-like silhouette with strong readable limb shapes; centred on a flat untextured mid-grey backdrop, no scenery, no cast shadow, subject filling about 80% of the frame, clean strong outer contour; stylized 2D illustration, warm ink linework, smooth cel shading, flat mid-tones, silhouette-first; soft, even cool light from above, bone #E7DCC6 highlights on the pale hide, soot-black #17120F shadows, gloam-violet #5B4B8A ambient, no gore; no text, no letters, no watermark, no signature, no logo, no border, no frame.
```

**Avoid:** text, letters, words, numbers, captions, typography, watermark, signature, artist name, logo, lettered emblem, border, frame, card frame, UI, HUD, interface, buttons, hex grid, grid lines, grid overlay, map labels, arrows, annotations, photorealistic, photograph, 3D render, CGI, octane render, ray tracing, plastic, glossy, chrome, metallic shine, neon, oversaturated, HDR glow, lens flare, bloom, heavy bokeh, motion blur, oil painting, impasto, dry-brush texture, canvas texture, painterly, dramatic chiaroscuro, low contrast, muddy values, flat gray lighting, sketch, unfinished, concept sketch lines, extra limbs, extra arms, extra fingers, fused fingers, deformed hands, malformed hands, duplicate subject, multiple heads, floating objects, cluttered background, white background, studio backdrop, official game art, fan art, photobash background scenery, ground, floor, horizon, cast shadow, multiple creatures, eyes, visible face, gore, blood, teeth, cropped limbs, thin spider legs

*Notes:* P0. Vault Dweller motif: pale, blind, many-limbed. Keep the extra limbs thick and folded in, not spindly, or the token turns to mush at 48 px. Cut out, pad, export master + 96/48 px WebP.

*Save as:* `art/enemy/vault_dweller@2x.png (plus 96 px WebP)`


### `enemy_slot_09` — enemy · 1024x1024 · 1:1 · P0

```text
Enemy token figure: a Barrow wight — a tall, thin tomb guardian wrapped in moss-stained grave cloth, hung with tarnished bronze grave-goods: a heavy neck torque, a horn cup at the belt, a rusted spear trailing a rag of faded banner; its face is a dry leather mask of a face with hollow sockets lit by cold rime-cyan #4FA8B8 light, and cold light leaks between its ribs; it stands upright and very still, spear planted, head tilted as if listening; full-body, three-quarter view facing slightly left, spear and tattered cloth fully inside frame; centred on a flat untextured mid-grey backdrop, no scenery, no cast shadow, subject filling about 85% of the frame, clean strong outer contour; stylized 2D illustration, warm ink linework, smooth cel shading, flat mid-tones, silhouette-first; soft, even cool light, bone and ash palette, gold #E3B341 tarnish highlights, gloam-violet #5B4B8A shadows, one tiny ember #E0662E accent in the spear socket; no gore, no text, no letters, no watermark, no signature, no logo, no border, no frame.
```

**Avoid:** text, letters, words, numbers, captions, typography, watermark, signature, artist name, logo, lettered emblem, border, frame, card frame, UI, HUD, interface, buttons, hex grid, grid lines, grid overlay, map labels, arrows, annotations, photorealistic, photograph, 3D render, CGI, octane render, ray tracing, plastic, glossy, chrome, metallic shine, neon, oversaturated, HDR glow, lens flare, bloom, heavy bokeh, motion blur, oil painting, impasto, dry-brush texture, canvas texture, painterly, dramatic chiaroscuro, low contrast, muddy values, flat gray lighting, sketch, unfinished, concept sketch lines, extra limbs, extra arms, extra fingers, fused fingers, deformed hands, malformed hands, duplicate subject, multiple heads, floating objects, cluttered background, white background, studio backdrop, official game art, fan art, photobash background scenery, ground, floor, horizon, cast shadow, multiple figures, gore, blood, modern elements, cropped spear, cropped cloth, cropped feet

*Notes:* P0. Barrow Wight motif: grave-goods and cold light, not a generic zombie. Keep the spear as a strong vertical for silhouette readability at 48 px. Cut out, pad, export master + 96/48 px WebP.

*Save as:* `art/enemy/barrow_wight@2x.png (plus 96 px WebP)`


### `enemy_slot_10` — enemy · 1024x1024 · 1:1 · P0

```text
Enemy token figure: a Watchguard — a disciplined Hearthwarden garrison soldier in mended, well-kept plate over charcoal mail, a kettle helm with a nose guard and a torn ember-red plume, a tall tower shield painted with only an abstract hearth glyph (a simple flame inside a ring, no lettering) held square in front of the body, a spear angled ready in the other hand; standing shoulder-on in a shield-wall stance, feet planted, calm and professional; full-body, three-quarter view facing slightly left, shield and spear inside frame, strong rectangular silhouette; centred on a flat untextured mid-grey backdrop, no scenery, no cast shadow, subject filling about 80% of the frame, clean strong outer contour; stylized 2D illustration, warm ink linework, smooth cel shading, flat mid-tones, silhouette-first; soft, even cool light from the upper left, rime-cyan #4FA8B8 edge highlight on the shield edge, bone #E7DCC6 mortar highlights, charcoal #2A221C plate, soot-black #17120F shadow side, one warm ember #E0662E accent from a wall brazier; no text, no letters, no watermark, no signature, no logo, no border, no frame.
```

**Avoid:** text, letters, words, numbers, captions, typography, watermark, signature, artist name, logo, lettered emblem, border, frame, card frame, UI, HUD, interface, buttons, hex grid, grid lines, grid overlay, map labels, arrows, annotations, photorealistic, photograph, 3D render, CGI, octane render, ray tracing, plastic, glossy, chrome, metallic shine, neon, oversaturated, HDR glow, lens flare, bloom, heavy bokeh, motion blur, oil painting, impasto, dry-brush texture, canvas texture, painterly, dramatic chiaroscuro, low contrast, muddy values, flat gray lighting, sketch, unfinished, concept sketch lines, extra limbs, extra arms, extra fingers, fused fingers, deformed hands, malformed hands, duplicate subject, multiple heads, floating objects, cluttered background, white background, studio backdrop, official game art, fan art, photobash background scenery, ground, floor, horizon, cast shadow, multiple figures, lettering on shield, heraldic letters, cropped shield, cropped spear, cropped feet

*Notes:* P0. Watchguard motif: order, discipline, shield-wall. The shield glyph must stay abstract (flame-in-ring); no letters or real-world heraldry. Cut out, pad, export master + 96/48 px WebP.

*Save as:* `art/enemy/watchguard@2x.png (plus 96 px WebP)`


### `enemy_slot_11` — enemy · 1024x1024 · 1:1 · P0

```text
Enemy token figure: a Seat Guard halberdier — the gilded ceremonial guard of the Seat, tall and immaculate in dark enamelled plate edged with gold #E3B341 filigree, a plume-less helm mask with narrow eye slits, a long ember-red cloak, a brass scale skirt; a heavy halberd with a crescent blade and a hammer head held across the body; armour engraved only with abstract hearth patterns, no letters and no heraldry; standing at guard, feet apart, the halberd a strong vertical counterweight, chin down, utterly still and lethal; full-body, three-quarter view facing slightly right, halberd fully inside frame, tall clean silhouette; centred on a flat untextured mid-grey backdrop, no scenery, no cast shadow, subject filling about 85% of the frame, clean strong outer contour; stylized 2D illustration, warm ink linework, smooth cel shading, flat mid-tones, silhouette-first; soft, even warm light from gate braziers, gold #E3B341 glints, bone #E7DCC6 highlights, soot-black #17120F shadow side, gloam-violet #5B4B8A cloak shadows; no text, no letters, no readable insignia, no watermark, no signature, no logo, no border, no frame.
```

**Avoid:** text, letters, words, numbers, captions, typography, watermark, signature, artist name, logo, lettered emblem, border, frame, card frame, UI, HUD, interface, buttons, hex grid, grid lines, grid overlay, map labels, arrows, annotations, photorealistic, photograph, 3D render, CGI, octane render, ray tracing, plastic, glossy, chrome, metallic shine, neon, oversaturated, HDR glow, lens flare, bloom, heavy bokeh, motion blur, oil painting, impasto, dry-brush texture, canvas texture, painterly, dramatic chiaroscuro, low contrast, muddy values, flat gray lighting, sketch, unfinished, concept sketch lines, extra limbs, extra arms, extra fingers, fused fingers, deformed hands, malformed hands, duplicate subject, multiple heads, floating objects, cluttered background, white background, studio backdrop, official game art, fan art, photobash background scenery, ground, floor, horizon, cast shadow, multiple figures, lettering, heraldic letters, cropped halberd, cropped feet, gore

*Notes:* P0 city garrison, higher threat tier: richer materials than the Watchguard (gold filigree, embroidered cloak) but same disciplined stance language. Halberd head must be chunky enough to read at 48 px. Cut out, pad, export master + 96/48 px WebP.

*Save as:* `art/enemy/seat_guard_halberdier@2x.png (plus 96 px WebP)`


### `enemy_slot_12` — enemy · 1024x1024 · 1:1 · P0

```text
Enemy token figure: a Seat Guard arcanist — the Seat's masked officer-mage, a slender figure in dark layered robes of smoke-grey and gloam-violet #5B4B8A with gold #E3B341 embroidered edges in abstract zigzag hearth patterns (no letters), a smooth hollow gold mask with no face and narrow vertical eye slits, one hand raised holding a small ember shard, the other gripping a staff of bound brass; five small abstract sigils float around the raised hand — pure light shapes of rings, triangles and spirals, deliberately not letters and not readable runes; feet together, cloak settling, head turned toward the viewer; full-body, three-quarter view facing slightly left, staff and sigils inside frame; centred on a flat untextured mid-grey backdrop, no scenery, no cast shadow, subject filling about 80% of the frame, clean strong outer contour; stylized 2D illustration, warm ink linework, smooth cel shading, flat mid-tones, silhouette-first; soft, even cool light, rime-cyan #4FA8B8 edge glow on the mask, one warm ember #E0662E core in the shard and sigils, gold #E3B341 and bone #E7DCC6 highlights; no text, no letters, no watermark, no signature, no logo, no border, no frame.
```

**Avoid:** text, letters, words, numbers, captions, typography, watermark, signature, artist name, logo, lettered emblem, border, frame, card frame, UI, HUD, interface, buttons, hex grid, grid lines, grid overlay, map labels, arrows, annotations, photorealistic, photograph, 3D render, CGI, octane render, ray tracing, plastic, glossy, chrome, metallic shine, neon, oversaturated, HDR glow, lens flare, bloom, heavy bokeh, motion blur, oil painting, impasto, dry-brush texture, canvas texture, painterly, dramatic chiaroscuro, low contrast, muddy values, flat gray lighting, sketch, unfinished, concept sketch lines, extra limbs, extra arms, extra fingers, fused fingers, deformed hands, malformed hands, duplicate subject, multiple heads, floating objects, cluttered background, white background, studio backdrop, official game art, fan art, photobash background scenery, ground, floor, horizon, cast shadow, multiple figures, lettering, runic text, readable symbols, cropped staff, cropped robe, cropped feet, gore

*Notes:* P0 city garrison, higher threat tier. The floating sigils are shapes only — if a model produces letter-like marks, remove them in inpainting or paint them out. Cloak silhouette must stay narrow to contrast with the halberdier. Cut out, pad, export master + 96/48 px WebP.

*Save as:* `art/enemy/seat_guard_arcanist@2x.png (plus 96 px WebP)`


### `hero_emberdrinker` — hero · 2048x2048 · 1:1 · P0

```text
Bust portrait of Veska Rhee, the Ember-Drinker — an adult Vowbound woman in her late thirties, gaunt and sun-scorched, short-cropped dark hair, a brass ember-bead in one ear; she holds a cracked ember shard cupped in both hands close to her chest, thin ember-orange #E0662E light rising onto her face; fresh and old scars across her forearms glow faintly like cooling cracks, mended leather wraps and a brass-ringed harness, soot on her cheekbones; her expression is weary, stubborn and faintly amused, eyes fixed on the shard rather than the viewer; three-quarter bust composition, head in the upper third, generous negative space for HUD and select-screen crops, slight low angle; soft, even warm light from the shard, soot-black #17120F background with drifting charcoal #2A221C smoke, bone #E7DCC6 edge highlights; stylized 2D illustration, warm ink linework, smooth cel shading, flat mid-tones, silhouette-first, no gore; no text, no letters, no watermark, no signature, no logo, no border, no frame.
```

**Avoid:** text, letters, words, numbers, captions, typography, watermark, signature, artist name, logo, lettered emblem, border, frame, card frame, UI, HUD, interface, buttons, hex grid, grid lines, grid overlay, map labels, arrows, annotations, photorealistic, photograph, 3D render, CGI, octane render, ray tracing, plastic, glossy, chrome, metallic shine, neon, oversaturated, HDR glow, lens flare, bloom, heavy bokeh, motion blur, oil painting, impasto, dry-brush texture, canvas texture, painterly, dramatic chiaroscuro, low contrast, muddy values, flat gray lighting, sketch, unfinished, concept sketch lines, extra limbs, extra arms, extra fingers, fused fingers, deformed hands, malformed hands, duplicate subject, multiple heads, floating objects, cluttered background, white background, studio backdrop, official game art, fan art, photobash

*Notes:* P0. Working gender assumption — 15 does not specify one; swap freely, but lock the choice before making the character sheet. Warm/ember key is deliberate: she is the day half of the hero pair. Readable at 64 px: keep the face high-contrast and the background quiet. Build a character sheet (front, 3/4, profile) from this prompt before finalising; reuse the same seed/reference for the bust.

*Save as:* `art/hero/emberdrinker_portrait@2x.png (plus 512 px WebP)`


### `hero_oathless` — hero · 2048x2048 · 1:1 · P0

```text
Bust portrait of Bered Kask, the Oathless — an adult Vowbound man in his mid-forties, weathered and broad, close-cropped iron-grey hair, a short grey-streaked beard, an old pale scar splitting one brow; mended plate and mail over a charcoal gambeson, a hearthwarden tower shield slung behind one shoulder bearing only an abstract hearth glyph (a simple flame inside a ring, no lettering), one hand resting on the pommel of a plain longsword, helmet removed and held low; his expression is calm, tired and immovable, gaze level at the viewer; three-quarter bust, head in the upper third, shoulders squared, generous negative space; soft, even cool light from the upper left, rime-cyan #4FA8B8 edge highlight on the plate, one small warm ember #E0662E accent from a distant brazier reflected in the shield boss; soot-black #17120F background, charcoal #2A221C midtones, bone #E7DCC6 highlights; stylized 2D illustration, warm ink linework, smooth cel shading, flat mid-tones, silhouette-first; no text, no letters, no watermark, no signature, no logo, no border, no frame.
```

**Avoid:** text, letters, words, numbers, captions, typography, watermark, signature, artist name, logo, lettered emblem, border, frame, card frame, UI, HUD, interface, buttons, hex grid, grid lines, grid overlay, map labels, arrows, annotations, photorealistic, photograph, 3D render, CGI, octane render, ray tracing, plastic, glossy, chrome, metallic shine, neon, oversaturated, HDR glow, lens flare, bloom, heavy bokeh, motion blur, oil painting, impasto, dry-brush texture, canvas texture, painterly, dramatic chiaroscuro, low contrast, muddy values, flat gray lighting, sketch, unfinished, concept sketch lines, extra limbs, extra arms, extra fingers, fused fingers, deformed hands, malformed hands, duplicate subject, multiple heads, floating objects, cluttered background, white background, studio backdrop, official game art, fan art, photobash

*Notes:* P0. Cool/gloam key is deliberate: he is the night half of the hero pair, so the two portraits read as one set without copying each other. Keep the shield glyph abstract (no letters, no heraldic lettering). Readable at 64 px: face and shield edge carry the silhouette. Same character-sheet process as Veska; keep armour design consistent across any future alt art.

*Save as:* `art/hero/oathless_portrait@2x.png (plus 512 px WebP)`


### `seat_plate` — city_plate · 2048x1536 · 4:3 · P0

```text
Assault backdrop for the Seat: a low, ground-level view of the city's outer gate at gloam, filling the frame — a monumental soot-black #17120F wall of fitted stone, a gatehouse flanked by two heavy towers, vast brass-banded doors with ember light spilling out beneath them, tattered hanging banners bearing only the abstract hearth glyph (a flame inside a ring, no lettering), ember-orange #E0662E braziers along the wall and tiny watch-fires; a lone Vowbound silhouette in the lower foreground, seen from behind, cloak torn, for scale; a gloam-violet #5B4B8A storm sky with a pale moon behind cloud, rime-cyan #4FA8B8 cold light on the upper wall, the warm gate glow as the single warm accent; composition keeps the upper third dark and simple for UI overlays; strong single focal point at the gate, storybook-illustrated cinematic 4:3 with ink linework and cel shading; no text, no letters, no watermark, no signature, no logo, no border, no frame.
```

**Avoid:** text, letters, words, numbers, captions, typography, watermark, signature, artist name, logo, lettered emblem, border, frame, card frame, UI, HUD, interface, buttons, hex grid, grid lines, grid overlay, map labels, arrows, annotations, photorealistic, photograph, 3D render, CGI, octane render, ray tracing, plastic, glossy, chrome, metallic shine, neon, oversaturated, HDR glow, lens flare, bloom, heavy bokeh, motion blur, oil painting, impasto, dry-brush texture, canvas texture, painterly, dramatic chiaroscuro, low contrast, muddy values, flat gray lighting, sketch, unfinished, concept sketch lines, extra limbs, extra arms, extra fingers, fused fingers, deformed hands, malformed hands, duplicate subject, multiple heads, floating objects, cluttered background, white background, studio backdrop, official game art, fan art, photobash text, lettered banners, heraldic letters, modern architecture, sci-fi, crowded foreground, wide-angle distortion, multiple focal points, bright daylight

*Notes:* P0. The assault-screen backdrop: UI sits on top, so the upper third and outer edges must stay dark and low-contrast. Generate after tile_seat so the wall, gate and banner language match. Keep the foreground silhouette small so it never fights the UI.

*Save as:* `art/city_plate/seat_plate@2x.png (plus 1024 px WebP)`


### `tile_countryside_1` — tile · 2048x2368 · 32:37 (portrait hex, approx 1:1.156) · P0

```text
Top-down painted board-game map image in portrait 32:37 format, full-bleed, intended to be masked into a hex: ashen countryside under a gloam-violet #5B4B8A dusk — rolling heath of dry root-green #6E8F4E and burnt umber grass, a mended dry-stone wall winding across the tile from edge to edge, one lone waystone with a faint ember #E0662E crack glowing in its face, a shallow dry stream bed, scattered black thorn trees, and a small hearthstead far off with a single lit chimney; the outer edges darken and fade into heath so the tile sits beside its neighbours; keep all landmarks inside the central 80 percent; no baked hex border, no grid, no hex lines, no labels, no numbers, no icons, no UI, no compass, no text, no frame; stylized 2D illustration, warm ink linework, smooth cel shading, flat mid-tones, clean readable values, limited palette of soot, charcoal #2A221C, root #6E8F4E, bone #E7DCC6 and ember #E0662E, soft, even warm dusk light low from the left.
```

**Avoid:** text, letters, words, numbers, captions, typography, watermark, signature, artist name, logo, lettered emblem, border, frame, card frame, UI, HUD, interface, buttons, hex grid, grid lines, grid overlay, map labels, arrows, annotations, photorealistic, photograph, 3D render, CGI, octane render, ray tracing, plastic, glossy, chrome, metallic shine, neon, oversaturated, HDR glow, lens flare, bloom, heavy bokeh, motion blur, oil painting, impasto, dry-brush texture, canvas texture, painterly, dramatic chiaroscuro, low contrast, muddy values, flat gray lighting, sketch, unfinished, concept sketch lines, extra limbs, extra arms, extra fingers, fused fingers, deformed hands, malformed hands, duplicate subject, multiple heads, floating objects, cluttered background, white background, studio backdrop, official game art, fan art, photobash hexagon border, grid, hex lines, map labels, numbers, text, icons, UI, compass, isometric view, perspective, horizon, buildings in elevation, border, frame

*Notes:* P0. Countryside A = settled, dry, mended farmland margins; keep it calm and empty of enemies so site icons read on top. Same masking/edge test as tile_start; no directional road required.

*Save as:* `art/tile/countryside_1@2x.png`


### `tile_countryside_2` — tile · 2048x2368 · 32:37 (portrait hex, approx 1:1.156) · P0

```text
Top-down painted board-game map image in portrait 32:37 format, full-bleed, intended to be masked into a hex: the Glimmer marsh edge under a cold gloam — black reed beds and shallow rime-cyan #4FA8B8 pools reflecting a pale sky, gnarled wind-bent trees, gale-pale #DCE6E8 mist drifting in patches, a drowned stone shrine half-sunk in the water, moss and bone-white stones, gloam-violet #5B4B8A shadows deep and cold; a narrow causeway of stepping stones crosses from one edge toward another so the tile can connect; the outer edges darken and fade into marsh so the tile sits beside its neighbours; keep all landmarks inside the central 80 percent; no baked hex border, no grid, no hex lines, no labels, no numbers, no icons, no UI, no compass, no text, no frame; stylized 2D illustration, warm ink linework, smooth cel shading, flat mid-tones, clean readable values, limited palette of soot, charcoal #2A221C, rime #4FA8B8, gale #DCE6E8 and gloam #5B4B8A, soft, even cool light.
```

**Avoid:** text, letters, words, numbers, captions, typography, watermark, signature, artist name, logo, lettered emblem, border, frame, card frame, UI, HUD, interface, buttons, hex grid, grid lines, grid overlay, map labels, arrows, annotations, photorealistic, photograph, 3D render, CGI, octane render, ray tracing, plastic, glossy, chrome, metallic shine, neon, oversaturated, HDR glow, lens flare, bloom, heavy bokeh, motion blur, oil painting, impasto, dry-brush texture, canvas texture, painterly, dramatic chiaroscuro, low contrast, muddy values, flat gray lighting, sketch, unfinished, concept sketch lines, extra limbs, extra arms, extra fingers, fused fingers, deformed hands, malformed hands, duplicate subject, multiple heads, floating objects, cluttered background, white background, studio backdrop, official game art, fan art, photobash hexagon border, grid, hex lines, map labels, numbers, text, icons, UI, compass, isometric view, perspective, horizon, buildings in elevation, border, frame, warm sunlight

*Notes:* P0. Countryside B = cold, wet, uncanny contrast to tile_countryside_1 (same map, different hour). Rime pools must stay muted; the only bright areas are the mist and water highlights. Same masking/edge test.

*Save as:* `art/tile/countryside_2@2x.png`


### `tile_seat` — tile · 2048x2368 · 32:37 (portrait hex, approx 1:1.156) · P0

```text
Top-down painted board-game map image in portrait 32:37 format, full-bleed, intended to be masked into a hex: the Seat seen from directly above — the last hearth-city, three concentric rings of black stone wall with square towers, gilded roofs and brass domes catching gold #E3B341, narrow streets and courtyards, a wide outer gate facing the lower edge, and at the very centre one great hearth flame burning ember-orange #E0662E with smoke drifting; ember light radiates from the centre out through the streets; tiny banners and market squares are abstract marks only, no lettering; keep the city inside the central 80 percent with dark outer ground; no baked hex border, no grid, no hex lines, no labels, no numbers, no icons, no UI, no compass, no text, no frame; stylized 2D illustration, warm ink linework, smooth cel shading, flat mid-tones, clean readable values, limited palette of soot, charcoal #2A221C, gold #E3B341, bone #E7DCC6 and ember #E0662E, soft, even warm light from the central hearth.
```

**Avoid:** text, letters, words, numbers, captions, typography, watermark, signature, artist name, logo, lettered emblem, border, frame, card frame, UI, HUD, interface, buttons, hex grid, grid lines, grid overlay, map labels, arrows, annotations, photorealistic, photograph, 3D render, CGI, octane render, ray tracing, plastic, glossy, chrome, metallic shine, neon, oversaturated, HDR glow, lens flare, bloom, heavy bokeh, motion blur, oil painting, impasto, dry-brush texture, canvas texture, painterly, dramatic chiaroscuro, low contrast, muddy values, flat gray lighting, sketch, unfinished, concept sketch lines, extra limbs, extra arms, extra fingers, fused fingers, deformed hands, malformed hands, duplicate subject, multiple heads, floating objects, cluttered background, white background, studio backdrop, official game art, fan art, photobash hexagon border, grid, hex lines, map labels, numbers, text, icons, UI, compass, isometric view, perspective, horizon, buildings in elevation, border, frame, modern city

*Notes:* P0. The map's climax tile: the concentric wall rings plus central flame must read at full-map zoom. Generate last among tiles so its palette matches the Seat plate. Same masking/edge test; the dark outer ground is intentional.

*Save as:* `art/tile/seat@2x.png`


### `tile_start` — tile · 2048x2368 · 32:37 (portrait hex, approx 1:1.156) · P0

```text
Top-down painted board-game map image in portrait 32:37 format, full-bleed, intended to be masked into a hex: the Woldgate, starting ground of the Emberwold — a broad cracked stone gate-arch standing alone across an old road at the edge of the wold, two leaning monoliths flanking it, iron fire-baskets burning low with ember-orange #E0662E flames, broken flagstones and soot-black #17120F earth, dry root-green #6E8F4E grass tufts creeping through the cracks, the road entering from the left edge and leaving at the lower right so it can connect to neighbouring tiles, a scatter of old pennant stones and one ruined waymarker; the outer edges darken and fade into heath so the tile sits beside its neighbours; keep all landmarks inside the central 80 percent; no baked hex border, no grid, no hex lines, no labels, no numbers, no icons, no UI, no compass, no text, no frame; stylized 2D illustration, warm ink linework, smooth cel shading, flat mid-tones, clean readable values, limited palette of soot, charcoal #2A221C, root #6E8F4E, bone #E7DCC6 and ember #E0662E, soft, even warm late-ember light.
```

**Avoid:** text, letters, words, numbers, captions, typography, watermark, signature, artist name, logo, lettered emblem, border, frame, card frame, UI, HUD, interface, buttons, hex grid, grid lines, grid overlay, map labels, arrows, annotations, photorealistic, photograph, 3D render, CGI, octane render, ray tracing, plastic, glossy, chrome, metallic shine, neon, oversaturated, HDR glow, lens flare, bloom, heavy bokeh, motion blur, oil painting, impasto, dry-brush texture, canvas texture, painterly, dramatic chiaroscuro, low contrast, muddy values, flat gray lighting, sketch, unfinished, concept sketch lines, extra limbs, extra arms, extra fingers, fused fingers, deformed hands, malformed hands, duplicate subject, multiple heads, floating objects, cluttered background, white background, studio backdrop, official game art, fan art, photobash hexagon border, grid, hex lines, map labels, numbers, text, icons, UI, compass, isometric view, perspective, horizon, buildings in elevation, border, frame

*Notes:* P0. Generate at the target 32:37 if the tool allows; otherwise generate square and crop/mask to 2048x2368. Roads must reach the image edge (they become connections in the engine). Test by masking to a hex and placing beside countryside tiles: no visible straight seams or bright edge rims.

*Save as:* `art/tile/starting_a@2x.png`


---

## P1 — polish set (sites, key art, card motifs)


### `key_art` — key_art · 3840x2160 · 16:9 · P1

```text
Wide cinematic 16:9 key art: a lone Vowbound of the Emberwold seen from behind, small in the lower third of a broken black ridge, torn travel cloak and mended leather, a single ember shard glowing ember-orange #E0662E in their lowered hand; ahead, across a vast dark wold, the Seat rises as a colossal walled hearth-city, concentric black walls and towers, one great central hearth flame hazing the sky, tiny ember fires along the battlements; a low gloam-violet #5B4B8A moon in a soot-black #17120F sky, rime-cyan #4FA8B8 edge highlights on the figure's shoulders, faint bone #E7DCC6 highlights on the ridge stones; soft, even cool light with the distant warm city glow as the single warm accent; huge calm negative space in the upper left for a title overlay; stylized 2D illustration, warm ink linework, smooth cel shading, flat mid-tones, strong flat value structure, silhouette-first, epic scale and quiet dread; no text, no letters, no watermark, no signature, no logo, no border, no frame.
```

**Avoid:** text, letters, words, numbers, captions, typography, watermark, signature, artist name, logo, lettered emblem, border, frame, card frame, UI, HUD, interface, buttons, hex grid, grid lines, grid overlay, map labels, arrows, annotations, photorealistic, photograph, 3D render, CGI, octane render, ray tracing, plastic, glossy, chrome, metallic shine, neon, oversaturated, HDR glow, lens flare, bloom, heavy bokeh, motion blur, oil painting, impasto, dry-brush texture, canvas texture, painterly, dramatic chiaroscuro, low contrast, muddy values, flat gray lighting, sketch, unfinished, concept sketch lines, extra limbs, extra arms, extra fingers, fused fingers, deformed hands, malformed hands, duplicate subject, multiple heads, floating objects, cluttered background, white background, studio backdrop, official game art, fan art, photobash text, title lettering, logo, crowded composition, character facing camera, modern city, sci-fi towers, bright daylight

*Notes:* P1. The portfolio/title piece; generate last, once the style is locked, so it matches the heroes and the Seat plate. Keep the upper-left third simple for the wordmark, which is overlaid by the engine (never generated into the art). Export 4K master + 1920x1080 and 1280x720 WebP.

*Save as:* `art/key_art/key_art@2x.png (plus 1920x1080 WebP)`


### `motif_01_stride` — card_motif · 1024x768 · 4:3 · P1

```text
Card motif: STRIDE — a single worn leather walking boot seen in side silhouette, mid-step over a cracked flat stone, hobnailed sole, mended laces, one ember-orange #E0662E spark at the heel, a few dry root-green #6E8F4E grass blades and three faint gale-pale #DCE6E8 speed strokes behind it; movement, travel, quiet determination; flat cel-shaded emblem with clean ink linework, bold simple shape readable at 96 px, two to three values, centred with generous margins; soot-black #17120F field with a soft charcoal #2A221C radial vignette, bone #E7DCC6 edge highlight, no glossy 3D; no text, no letters, no numbers, no watermark, no logo, no border, no frame. Icon variant: the same boot symbol isolated on a transparent background with a clean 2 px bone #E7DCC6 keyline.
```

**Avoid:** text, letters, words, numbers, captions, typography, watermark, signature, artist name, logo, lettered emblem, border, frame, card frame, UI, HUD, interface, buttons, hex grid, grid lines, grid overlay, map labels, arrows, annotations, photorealistic, photograph, 3D render, CGI, octane render, ray tracing, plastic, glossy, chrome, metallic shine, neon, oversaturated, HDR glow, lens flare, bloom, heavy bokeh, motion blur, oil painting, impasto, dry-brush texture, canvas texture, painterly, dramatic chiaroscuro, low contrast, muddy values, flat gray lighting, sketch, unfinished, concept sketch lines, extra limbs, extra arms, extra fingers, fused fingers, deformed hands, malformed hands, duplicate subject, multiple heads, floating objects, cluttered background, white background, studio backdrop, official game art, fan art, photobash 3D render, glossy plastic, letters, numbers, complex scene, background landscape, drop shadow, frame, border, multiple objects

*Notes:* P1. Motifs are reused across ~40 cards and tinted by the engine, so they must be flat, symbolic and free of narrative. Deliver two variants: tinted background + transparent icon. Stride is a top-third crop of the boot, not a full landscape.

*Save as:* `art/card_motif/stride@2x.png (tinted + transparent icon variants)`


### `motif_02_volley` — card_motif · 1024x768 · 4:3 · P1

```text
Card motif: VOLLEY — three arrows in a fanned flight seen from the side, ember-orange #E0662E arrowheads and ember-lit fletching, one arrow slightly ahead of the other two, thin gale-pale #DCE6E8 speed streaks, a few ember sparks; ranged attack and reach; flat cel-shaded emblem with clean ink linework, bold simple shapes readable at 96 px, two to three values, centred with generous margins; soot-black #17120F field with a soft charcoal #2A221C radial vignette, bone #E7DCC6 edge highlight, no glossy 3D; no text, no letters, no numbers, no watermark, no logo, no border, no frame. Icon variant: the same three-arrow fan isolated on a transparent background with a clean 2 px bone #E7DCC6 keyline.
```

**Avoid:** text, letters, words, numbers, captions, typography, watermark, signature, artist name, logo, lettered emblem, border, frame, card frame, UI, HUD, interface, buttons, hex grid, grid lines, grid overlay, map labels, arrows, annotations, photorealistic, photograph, 3D render, CGI, octane render, ray tracing, plastic, glossy, chrome, metallic shine, neon, oversaturated, HDR glow, lens flare, bloom, heavy bokeh, motion blur, oil painting, impasto, dry-brush texture, canvas texture, painterly, dramatic chiaroscuro, low contrast, muddy values, flat gray lighting, sketch, unfinished, concept sketch lines, extra limbs, extra arms, extra fingers, fused fingers, deformed hands, malformed hands, duplicate subject, multiple heads, floating objects, cluttered background, white background, studio backdrop, official game art, fan art, photobash 3D render, glossy plastic, letters, numbers, bow and archer, complex scene, background landscape, drop shadow, frame, border

*Notes:* P1. Ranged attack family. No archer figure: the arrows are the symbol, so the motif stays reusable for any Volley card. Deliver tinted + transparent icons.

*Save as:* `art/card_motif/volley@2x.png (tinted + transparent icon variants)`


### `motif_03_siege` — card_motif · 1024x768 · 4:3 · P1

```text
Card motif: SIEGE — an iron battering-ram head with a mended crack, ember-orange #E0662E heat glowing at the seam, breaking through a block of soot-black #17120F masonry, splintered stone fragments and dust, a few brass bands on the ram; siege attack against walls; flat cel-shaded emblem with clean ink linework, bold simple shapes readable at 96 px, two to three values, centred with generous margins; soot-black #17120F field with a soft charcoal #2A221C radial vignette, bone #E7DCC6 edge highlight, no glossy 3D; no text, no letters, no numbers, no watermark, no logo, no border, no frame. Icon variant: the same ram-head symbol isolated on a transparent background with a clean 2 px bone #E7DCC6 keyline.
```

**Avoid:** text, letters, words, numbers, captions, typography, watermark, signature, artist name, logo, lettered emblem, border, frame, card frame, UI, HUD, interface, buttons, hex grid, grid lines, grid overlay, map labels, arrows, annotations, photorealistic, photograph, 3D render, CGI, octane render, ray tracing, plastic, glossy, chrome, metallic shine, neon, oversaturated, HDR glow, lens flare, bloom, heavy bokeh, motion blur, oil painting, impasto, dry-brush texture, canvas texture, painterly, dramatic chiaroscuro, low contrast, muddy values, flat gray lighting, sketch, unfinished, concept sketch lines, extra limbs, extra arms, extra fingers, fused fingers, deformed hands, malformed hands, duplicate subject, multiple heads, floating objects, cluttered background, white background, studio backdrop, official game art, fan art, photobash 3D render, glossy plastic, letters, numbers, complex scene, background landscape, people, drop shadow, frame, border

*Notes:* P1. Siege attack family. The ram head plus cracked wall block is the whole read; keep it horizontal so it works in a wide card window. Deliver tinted + transparent icons.

*Save as:* `art/card_motif/siege@2x.png (tinted + transparent icon variants)`


### `motif_04_block` — card_motif · 1024x768 · 4:3 · P1

```text
Card motif: BLOCK — a round mended shield seen straight on, its iron boss shaped like an abstract flame inside a ring (our hearth glyph, no lettering), two brass rivets, one split in the rim mended with gold #E3B341 wire, a leather strap behind, a small ember-orange #E0662E glow at the repair; defence and ward; flat cel-shaded emblem with clean ink linework, bold simple shape readable at 96 px, two to three values, centred with generous margins; soot-black #17120F field with a soft charcoal #2A221C radial vignette, bone #E7DCC6 edge highlight, no glossy 3D; no text, no letters, no numbers, no watermark, no logo, no border, no frame. Icon variant: the same shield symbol isolated on a transparent background with a clean 2 px bone #E7DCC6 keyline.
```

**Avoid:** text, letters, words, numbers, captions, typography, watermark, signature, artist name, logo, lettered emblem, border, frame, card frame, UI, HUD, interface, buttons, hex grid, grid lines, grid overlay, map labels, arrows, annotations, photorealistic, photograph, 3D render, CGI, octane render, ray tracing, plastic, glossy, chrome, metallic shine, neon, oversaturated, HDR glow, lens flare, bloom, heavy bokeh, motion blur, oil painting, impasto, dry-brush texture, canvas texture, painterly, dramatic chiaroscuro, low contrast, muddy values, flat gray lighting, sketch, unfinished, concept sketch lines, extra limbs, extra arms, extra fingers, fused fingers, deformed hands, malformed hands, duplicate subject, multiple heads, floating objects, cluttered background, white background, studio backdrop, official game art, fan art, photobash 3D render, glossy plastic, letters, numbers, heraldry, crossed swords, complex scene, background landscape, drop shadow, frame, border

*Notes:* P1. Defence family. The mended rim is the signature detail; keep the shield shape clean and avoid real-world heraldry. Deliver tinted + transparent icons.

*Save as:* `art/card_motif/block@2x.png (tinted + transparent icon variants)`


### `motif_05_ember` — card_motif · 1024x768 · 4:3 · P1

```text
Card motif: EMBER — a single angular ember shard, a crystal with a molten ember-orange #E0662E core and bone #E7DCC6 fractured edges, bound in two turns of brass wire, a few sparks drifting off it, a faint gold #E3B341 inner glow; the mana resource in its raw form; flat cel-shaded emblem with clean ink linework, bold simple shape readable at 96 px, two to three values, centred with generous margins; soot-black #17120F field with a soft charcoal #2A221C radial vignette, no glossy 3D; no text, no letters, no numbers, no watermark, no logo, no border, no frame. Icon variant: the same shard symbol isolated on a transparent background with a clean 2 px bone #E7DCC6 keyline.
```

**Avoid:** text, letters, words, numbers, captions, typography, watermark, signature, artist name, logo, lettered emblem, border, frame, card frame, UI, HUD, interface, buttons, hex grid, grid lines, grid overlay, map labels, arrows, annotations, photorealistic, photograph, 3D render, CGI, octane render, ray tracing, plastic, glossy, chrome, metallic shine, neon, oversaturated, HDR glow, lens flare, bloom, heavy bokeh, motion blur, oil painting, impasto, dry-brush texture, canvas texture, painterly, dramatic chiaroscuro, low contrast, muddy values, flat gray lighting, sketch, unfinished, concept sketch lines, extra limbs, extra arms, extra fingers, fused fingers, deformed hands, malformed hands, duplicate subject, multiple heads, floating objects, cluttered background, white background, studio backdrop, official game art, fan art, photobash 3D render, glossy plastic, letters, numbers, flames as realistic fire, complex scene, background landscape, drop shadow, frame, border

*Notes:* P1. The core resource motif; reused on Ember cards, tokens and the Emberwell UI. Keep the crystal angular and the core warm so it differs from the rime/root/gale element motifs added later. Deliver tinted + transparent icons.

*Save as:* `art/card_motif/ember@2x.png (tinted + transparent icon variants)`


### `motif_06_mend` — card_motif · 1024x768 · 4:3 · P1

```text
Card motif: MEND — a bone-white needle pulling ember-lit sinew thread through a cross-stitched crack in dark mended leather, a small triangle of thread path, a faint ember-orange #E0662E warmth along the repair, one brass thimble; healing and mending; flat cel-shaded emblem with clean ink linework, bold simple shapes readable at 96 px, two to three values, centred with generous margins; soot-black #17120F field with a soft charcoal #2A221C radial vignette, bone #E7DCC6 highlights, no glossy 3D; no text, no letters, no numbers, no watermark, no logo, no border, no frame. Icon variant: the same needle-and-thread symbol isolated on a transparent background with a clean 2 px bone #E7DCC6 keyline.
```

**Avoid:** text, letters, words, numbers, captions, typography, watermark, signature, artist name, logo, lettered emblem, border, frame, card frame, UI, HUD, interface, buttons, hex grid, grid lines, grid overlay, map labels, arrows, annotations, photorealistic, photograph, 3D render, CGI, octane render, ray tracing, plastic, glossy, chrome, metallic shine, neon, oversaturated, HDR glow, lens flare, bloom, heavy bokeh, motion blur, oil painting, impasto, dry-brush texture, canvas texture, painterly, dramatic chiaroscuro, low contrast, muddy values, flat gray lighting, sketch, unfinished, concept sketch lines, extra limbs, extra arms, extra fingers, fused fingers, deformed hands, malformed hands, duplicate subject, multiple heads, floating objects, cluttered background, white background, studio backdrop, official game art, fan art, photobash 3D render, glossy plastic, letters, numbers, medical cross, complex scene, background landscape, drop shadow, frame, border, gore

*Notes:* P1. Mending family. Must not read as medical/red-cross iconography: the leather and thread carry it. Deliver tinted + transparent icons.

*Save as:* `art/card_motif/mend@2x.png (tinted + transparent icon variants)`


### `motif_07_renown` — card_motif · 1024x768 · 4:3 · P1

```text
Card motif: RENOWN — an ember shard carved with a row of tally notches (deliberately abstract marks, never letters or numbers), bound in brass wire and hanging from a leather cord, three short gold #E3B341 radiance lines behind it, a faint ember-orange #E0662E glow in the deepest notch; fame and the name that is known; flat cel-shaded emblem with clean ink linework, bold simple shape readable at 96 px, two to three values, centred with generous margins; soot-black #17120F field with a soft charcoal #2A221C radial vignette, bone #E7DCC6 edge highlight, no glossy 3D; no text, no letters, no numbers, no watermark, no logo, no border, no frame. Icon variant: the same notched-shard symbol isolated on a transparent background with a clean 2 px bone #E7DCC6 keyline.
```

**Avoid:** text, letters, words, numbers, captions, typography, watermark, signature, artist name, logo, lettered emblem, border, frame, card frame, UI, HUD, interface, buttons, hex grid, grid lines, grid overlay, map labels, arrows, annotations, photorealistic, photograph, 3D render, CGI, octane render, ray tracing, plastic, glossy, chrome, metallic shine, neon, oversaturated, HDR glow, lens flare, bloom, heavy bokeh, motion blur, oil painting, impasto, dry-brush texture, canvas texture, painterly, dramatic chiaroscuro, low contrast, muddy values, flat gray lighting, sketch, unfinished, concept sketch lines, extra limbs, extra arms, extra fingers, fused fingers, deformed hands, malformed hands, duplicate subject, multiple heads, floating objects, cluttered background, white background, studio backdrop, official game art, fan art, photobash 3D render, glossy plastic, letters, numbers, written script, laurel wreath, complex scene, background landscape, drop shadow, frame, border

*Notes:* P1. Renown track motif. The tally notches are the trap: models like to turn them into text. Check at 100 percent and paint out any letter-like marks. Deliver tinted + transparent icons.

*Save as:* `art/card_motif/renown@2x.png (tinted + transparent icon variants)`


### `motif_08_bond` — card_motif · 1024x768 · 4:3 · P1

```text
Card motif: BOND — two interlinked iron rings joined by a short braided leather cord, one ring cold rime-cyan #4FA8B8, the other warm ember-orange #E0662E, both pitted and old, a small brass keeper at the knot; companions and the bonds that carry them; flat cel-shaded emblem with clean ink linework, bold simple shapes readable at 96 px, two to three values, centred with generous margins; soot-black #17120F field with a soft charcoal #2A221C radial vignette, bone #E7DCC6 edge highlights, no glossy 3D; no text, no letters, no numbers, no watermark, no logo, no border, no frame. Icon variant: the same linked-rings symbol isolated on a transparent background with a clean 2 px bone #E7DCC6 keyline.
```

**Avoid:** text, letters, words, numbers, captions, typography, watermark, signature, artist name, logo, lettered emblem, border, frame, card frame, UI, HUD, interface, buttons, hex grid, grid lines, grid overlay, map labels, arrows, annotations, photorealistic, photograph, 3D render, CGI, octane render, ray tracing, plastic, glossy, chrome, metallic shine, neon, oversaturated, HDR glow, lens flare, bloom, heavy bokeh, motion blur, oil painting, impasto, dry-brush texture, canvas texture, painterly, dramatic chiaroscuro, low contrast, muddy values, flat gray lighting, sketch, unfinished, concept sketch lines, extra limbs, extra arms, extra fingers, fused fingers, deformed hands, malformed hands, duplicate subject, multiple heads, floating objects, cluttered background, white background, studio backdrop, official game art, fan art, photobash 3D render, glossy plastic, letters, numbers, wedding rings, hands, complex scene, background landscape, drop shadow, frame, border

*Notes:* P1. Companion/bond motif. Keep the rings clearly separate from wedding-band imagery by adding the cord and brass keeper. Deliver tinted + transparent icons.

*Save as:* `art/card_motif/bond@2x.png (tinted + transparent icon variants)`


### `motif_09_relic` — card_motif · 1024x768 · 4:3 · P1

```text
Card motif: RELIC — a small ancient bronze hand-bell with a mended crack, a gold #E3B341 rim, ember-orange #E0662E glow inside its mouth, resting on folded ash-grey cloth, a few bone-white fragments of old inlay beside it; unique old things recovered from the wold; flat cel-shaded emblem with clean ink linework, bold simple shape readable at 96 px, two to three values, centred with generous margins; soot-black #17120F field with a soft charcoal #2A221C radial vignette, bone #E7DCC6 highlights, no glossy 3D; no text, no letters, no numbers, no watermark, no logo, no border, no frame. Icon variant: the same bell symbol isolated on a transparent background with a clean 2 px bone #E7DCC6 keyline.
```

**Avoid:** text, letters, words, numbers, captions, typography, watermark, signature, artist name, logo, lettered emblem, border, frame, card frame, UI, HUD, interface, buttons, hex grid, grid lines, grid overlay, map labels, arrows, annotations, photorealistic, photograph, 3D render, CGI, octane render, ray tracing, plastic, glossy, chrome, metallic shine, neon, oversaturated, HDR glow, lens flare, bloom, heavy bokeh, motion blur, oil painting, impasto, dry-brush texture, canvas texture, painterly, dramatic chiaroscuro, low contrast, muddy values, flat gray lighting, sketch, unfinished, concept sketch lines, extra limbs, extra arms, extra fingers, fused fingers, deformed hands, malformed hands, duplicate subject, multiple heads, floating objects, cluttered background, white background, studio backdrop, official game art, fan art, photobash 3D render, glossy plastic, letters, numbers, inscriptions, complex scene, background landscape, drop shadow, frame, border

*Notes:* P1. Relic family. The cracked bell ties to the bible's The Mended Bell relic name; keep any surface marks abstract. Deliver tinted + transparent icons.

*Save as:* `art/card_motif/relic@2x.png (tinted + transparent icon variants)`


### `motif_10_invocation` — card_motif · 1024x768 · 4:3 · P1

```text
Card motif: INVOCATION — an open cupped hand from which rises an abstract spiral of ember-orange #E0662E flame and rime-cyan #4FA8B8 light threads, forming a loose spiral sigil in the air as pure light shapes, not letters and not readable runes; spells spoken with ember; flat cel-shaded emblem with clean ink linework, bold simple shapes readable at 96 px, two to three values, centred with generous margins; soot-black #17120F field with a soft charcoal #2A221C radial vignette, bone #E7DCC6 highlights on the hand, no glossy 3D; no text, no letters, no numbers, no watermark, no logo, no border, no frame. Icon variant: the same hand-and-spiral symbol isolated on a transparent background with a clean 2 px bone #E7DCC6 keyline.
```

**Avoid:** text, letters, words, numbers, captions, typography, watermark, signature, artist name, logo, lettered emblem, border, frame, card frame, UI, HUD, interface, buttons, hex grid, grid lines, grid overlay, map labels, arrows, annotations, photorealistic, photograph, 3D render, CGI, octane render, ray tracing, plastic, glossy, chrome, metallic shine, neon, oversaturated, HDR glow, lens flare, bloom, heavy bokeh, motion blur, oil painting, impasto, dry-brush texture, canvas texture, painterly, dramatic chiaroscuro, low contrast, muddy values, flat gray lighting, sketch, unfinished, concept sketch lines, extra limbs, extra arms, extra fingers, fused fingers, deformed hands, malformed hands, duplicate subject, multiple heads, floating objects, cluttered background, white background, studio backdrop, official game art, fan art, photobash 3D render, glossy plastic, letters, runes, readable symbols, numbers, complex scene, background landscape, drop shadow, frame, border, extra fingers

*Notes:* P1. Invocation family. Hands are the classic failure mode: generate several, pick one with five clean fingers, inpaint the rest. The sigil must be abstract light shapes only. Deliver tinted + transparent icons.

*Save as:* `art/card_motif/invocation@2x.png (tinted + transparent icon variants)`


### `motif_11_gloam` — card_motif · 1024x768 · 4:3 · P1

```text
Card motif: GLOAM — a crescent moon of gloam-violet #5B4B8A with a thin ember-orange #E0662E rim, half-veiled by a rime-cyan #4FA8B8 mist band and two dark charcoal #2A221C cloud shapes; the night phase and the cold half of the turning sky; flat cel-shaded emblem with clean ink linework, bold simple shapes readable at 96 px, two to three values, centred with generous margins; soot-black #17120F field with a soft charcoal #2A221C radial vignette, bone #E7DCC6 edge highlights, no glossy 3D; no text, no letters, no numbers, no watermark, no logo, no border, no frame. Icon variant: the same crescent-and-mist symbol isolated on a transparent background with a clean 2 px bone #E7DCC6 keyline.
```

**Avoid:** text, letters, words, numbers, captions, typography, watermark, signature, artist name, logo, lettered emblem, border, frame, card frame, UI, HUD, interface, buttons, hex grid, grid lines, grid overlay, map labels, arrows, annotations, photorealistic, photograph, 3D render, CGI, octane render, ray tracing, plastic, glossy, chrome, metallic shine, neon, oversaturated, HDR glow, lens flare, bloom, heavy bokeh, motion blur, oil painting, impasto, dry-brush texture, canvas texture, painterly, dramatic chiaroscuro, low contrast, muddy values, flat gray lighting, sketch, unfinished, concept sketch lines, extra limbs, extra arms, extra fingers, fused fingers, deformed hands, malformed hands, duplicate subject, multiple heads, floating objects, cluttered background, white background, studio backdrop, official game art, fan art, photobash 3D render, glossy plastic, letters, numbers, face in the moon, stars as text, complex scene, background landscape, drop shadow, frame, border

*Notes:* P1. Gloam phase motif. Pairs with motif_05_ember (warm) and motif_12_seat. Avoid a literal face-in-the-moon. Deliver tinted + transparent icons.

*Save as:* `art/card_motif/gloam@2x.png (tinted + transparent icon variants)`


### `motif_12_seat` — card_motif · 1024x768 · 4:3 · P1

```text
Card motif: SEAT — a minimal walled-city sigil: three concentric broken rings of black wall with one gate, a small ember-orange #E0662E flame at the centre, two gold #E3B341 tower marks, all drawn as clean emblem shapes; the city and the endgame; flat cel-shaded emblem with clean ink linework, bold simple shapes readable at 96 px, two to three values, centred with generous margins; soot-black #17120F field with a soft charcoal #2A221C radial vignette, bone #E7DCC6 edge highlights, no glossy 3D; no text, no letters, no numbers, no watermark, no logo, no border, no frame. Icon variant: the same city sigil isolated on a transparent background with a clean 2 px bone #E7DCC6 keyline.
```

**Avoid:** text, letters, words, numbers, captions, typography, watermark, signature, artist name, logo, lettered emblem, border, frame, card frame, UI, HUD, interface, buttons, hex grid, grid lines, grid overlay, map labels, arrows, annotations, photorealistic, photograph, 3D render, CGI, octane render, ray tracing, plastic, glossy, chrome, metallic shine, neon, oversaturated, HDR glow, lens flare, bloom, heavy bokeh, motion blur, oil painting, impasto, dry-brush texture, canvas texture, painterly, dramatic chiaroscuro, low contrast, muddy values, flat gray lighting, sketch, unfinished, concept sketch lines, extra limbs, extra arms, extra fingers, fused fingers, deformed hands, malformed hands, duplicate subject, multiple heads, floating objects, cluttered background, white background, studio backdrop, official game art, fan art, photobash 3D render, glossy plastic, letters, numbers, complex cityscape, perspective, background landscape, drop shadow, frame, border

*Notes:* P1. Endgame motif and the bridge to the Seat plate / tile_seat emblem language. Keep it a sigil, not a picture. Deliver tinted + transparent icons.

*Save as:* `art/card_motif/seat@2x.png (tinted + transparent icon variants)`


### `site_glimmer_glade` — site · 1024x1024 · 1:1 · P1

```text
Site illustration vignette: the Glimmer Glade — a pale clearing of gale-pale #DCE6E8 grass ringed by old leaning standing stones, a shallow still pool reflecting a rime-cyan #4FA8B8 sky, dozens of small floating motes of light drifting like fireflies between the stones, one bare old tree bent by wind, faint gloam-violet #5B4B8A mist at the roots; soft, even cool light from above, bone #E7DCC6 highlights, no warm accent; no people; the ring of stones and the drifting motes are the whole read; centred single vignette, edges falling into dark; stylized 2D illustration, warm ink linework, smooth cel shading, flat mid-tones, strong readable silhouette, usable as a site icon at 128 px; no text, no letters, no watermark, no signature, no logo, no border, no frame.
```

**Avoid:** text, letters, words, numbers, captions, typography, watermark, signature, artist name, logo, lettered emblem, border, frame, card frame, UI, HUD, interface, buttons, hex grid, grid lines, grid overlay, map labels, arrows, annotations, photorealistic, photograph, 3D render, CGI, octane render, ray tracing, plastic, glossy, chrome, metallic shine, neon, oversaturated, HDR glow, lens flare, bloom, heavy bokeh, motion blur, oil painting, impasto, dry-brush texture, canvas texture, painterly, dramatic chiaroscuro, low contrast, muddy values, flat gray lighting, sketch, unfinished, concept sketch lines, extra limbs, extra arms, extra fingers, fused fingers, deformed hands, malformed hands, duplicate subject, multiple heads, floating objects, cluttered background, white background, studio backdrop, official game art, fan art, photobash text, signage, people, ground plane extending to edges, horizon, multiple landmarks, dense forest, bright saturated magic glow, fairies with wings, border, frame

*Notes:* P1. Glimmer Glade motif: pale grass, standing stones, floating motes, cool light. The motes are the identifying feature at icon size. Vignette master + optional cut-out.

*Save as:* `art/site/glimmer_glade@2x.png (plus 128 px WebP)`


### `site_gloam_choir` — site · 1024x1024 · 1:1 · P1

```text
Site illustration vignette: the Gloam-choir — a round stone chapel with a tall thin bell tower, a ring of leaning standing stones around it, long tattered banners bearing only abstract crescent-moon shapes (no lettering), cold rime-cyan #4FA8B8 light in the chapel windows and a pale gale #DCE6E8 glow above the tower; the bell hangs as a dark shape in the tower; gloam-violet #5B4B8A night sky, soot-black #17120F and charcoal #2A221C stone, bone #E7DCC6 carved highlights; one distant ember #E0662E lantern at the gate as the only warm accent; soft, even cool light from the moon; no people; centred single vignette, edges falling into dark; stylized 2D illustration, warm ink linework, smooth cel shading, flat mid-tones, strong readable silhouette, usable as a site icon at 128 px; no text, no letters, no runes, no watermark, no signature, no logo, no border, no frame.
```

**Avoid:** text, letters, words, numbers, captions, typography, watermark, signature, artist name, logo, lettered emblem, border, frame, card frame, UI, HUD, interface, buttons, hex grid, grid lines, grid overlay, map labels, arrows, annotations, photorealistic, photograph, 3D render, CGI, octane render, ray tracing, plastic, glossy, chrome, metallic shine, neon, oversaturated, HDR glow, lens flare, bloom, heavy bokeh, motion blur, oil painting, impasto, dry-brush texture, canvas texture, painterly, dramatic chiaroscuro, low contrast, muddy values, flat gray lighting, sketch, unfinished, concept sketch lines, extra limbs, extra arms, extra fingers, fused fingers, deformed hands, malformed hands, duplicate subject, multiple heads, floating objects, cluttered background, white background, studio backdrop, official game art, fan art, photobash text, signage, runes, people, ground plane extending to edges, horizon, multiple landmarks, border, frame

*Notes:* P1. Gloam-choir motif: bell tower + moon banners + stone ring, cold light. Keep banners abstract crescents, never letters or lettered heraldry. Vignette master + optional cut-out.

*Save as:* `art/site/gloam_choir@2x.png (plus 128 px WebP)`


### `site_hearthstead` — site · 1024x1024 · 1:1 · P1

```text
Site illustration vignette: the Hearthstead — a small Woldkin settlement of six low turf-roofed cottages and one stone hall clustered around a lit open hearth; the hall door stands open with warm ember-orange #E0662E light spilling out and smoke rising into a soot-black #17120F night; a mended wooden fence, a well, stacked peat and a hand-cart; root-green #6E8F4E moss on the roofs, bone #E7DCC6 plaster patches; a soft, even warm light from the hearth door, cool gloam-violet #5B4B8A ambient sky; the landmark is the lit hearth seen through the cluster of roofs; no people; centred single vignette with the centre of interest slightly above middle, edges falling into a soft dark vignette; stylized 2D illustration, warm ink linework, smooth cel shading, flat mid-tones, strong readable silhouette, usable as a site icon at 128 px; no text, no letters, no watermark, no signature, no logo, no border, no frame.
```

**Avoid:** text, letters, words, numbers, captions, typography, watermark, signature, artist name, logo, lettered emblem, border, frame, card frame, UI, HUD, interface, buttons, hex grid, grid lines, grid overlay, map labels, arrows, annotations, photorealistic, photograph, 3D render, CGI, octane render, ray tracing, plastic, glossy, chrome, metallic shine, neon, oversaturated, HDR glow, lens flare, bloom, heavy bokeh, motion blur, oil painting, impasto, dry-brush texture, canvas texture, painterly, dramatic chiaroscuro, low contrast, muddy values, flat gray lighting, sketch, unfinished, concept sketch lines, extra limbs, extra arms, extra fingers, fused fingers, deformed hands, malformed hands, duplicate subject, multiple heads, floating objects, cluttered background, white background, studio backdrop, official game art, fan art, photobash text, signage, people, ground plane extending to edges, horizon, multiple landmarks, border, frame

*Notes:* P1. Sites are vignettes, not scenes: one landmark, easy map read. The hearth is the warm point that identifies Hearthstead at a glance. Deliver vignette master + optional cut-out; engine can drop it into a site panel at 128-256 px.

*Save as:* `art/site/hearthstead@2x.png (plus 128 px WebP)`


### `site_seat` — site · 1024x1024 · 1:1 · P1

```text
Site illustration vignette: the Seat at a distance — the last hearth-city seen whole on a dark plain, three concentric rings of black wall with square towers, gilded roofs and towers catching gold #E3B341, one great hearth flame at the centre hazing the air ember-orange #E0662E, a single road leading to the outer gate, tiny pennants; the city reads as a crown of walls on the horizon; soot-black #17120F plain and sky, gloam-violet #5B4B8A clouds, rime-cyan #4FA8B8 moon rim; the single warm accent is the central hearth; symmetric and iconic like a map pin; no people; centred single vignette, edges falling into dark; stylized 2D illustration, warm ink linework, smooth cel shading, flat mid-tones, strong readable silhouette, usable as a site icon at 128 px; no text, no letters, no watermark, no signature, no logo, no border, no frame.
```

**Avoid:** text, letters, words, numbers, captions, typography, watermark, signature, artist name, logo, lettered emblem, border, frame, card frame, UI, HUD, interface, buttons, hex grid, grid lines, grid overlay, map labels, arrows, annotations, photorealistic, photograph, 3D render, CGI, octane render, ray tracing, plastic, glossy, chrome, metallic shine, neon, oversaturated, HDR glow, lens flare, bloom, heavy bokeh, motion blur, oil painting, impasto, dry-brush texture, canvas texture, painterly, dramatic chiaroscuro, low contrast, muddy values, flat gray lighting, sketch, unfinished, concept sketch lines, extra limbs, extra arms, extra fingers, fused fingers, deformed hands, malformed hands, duplicate subject, multiple heads, floating objects, cluttered background, white background, studio backdrop, official game art, fan art, photobash text, signage, people, ground plane extending to edges, multiple landmarks, modern city skyline, border, frame

*Notes:* P1. The destination site icon: same visual language as tile_seat and seat_plate (concentric walls, central flame, gold roofs), simplified for 128 px. Vignette master + optional cut-out.

*Save as:* `art/site/seat@2x.png (plus 128 px WebP)`


### `site_shardmine` — site · 1024x1024 · 1:1 · P1

```text
Site illustration vignette: a Shardmine — cut terraces descending into a cliff face, glowing ember-orange #E0662E seams of crystal in the rock, timber gantries and a winding gear, a small cart on rails, a dark mine adit with warm light spilling out and smoke, spoil heaps of soot-black #17120F stone, brass and rope details, one lantern; root-green #6E8F4E moss on the timbers; soft, even warm light from the seams and the adit mouth, cold gloam-violet #5B4B8A ambient; the stepped terraces give a strong stepped silhouette; no people; centred single vignette, edges falling into dark; stylized 2D illustration, warm ink linework, smooth cel shading, flat mid-tones, strong readable silhouette, usable as a site icon at 128 px; no text, no numbers, no signage, no watermark, no signature, no logo, no border, no frame.
```

**Avoid:** text, letters, words, numbers, captions, typography, watermark, signature, artist name, logo, lettered emblem, border, frame, card frame, UI, HUD, interface, buttons, hex grid, grid lines, grid overlay, map labels, arrows, annotations, photorealistic, photograph, 3D render, CGI, octane render, ray tracing, plastic, glossy, chrome, metallic shine, neon, oversaturated, HDR glow, lens flare, bloom, heavy bokeh, motion blur, oil painting, impasto, dry-brush texture, canvas texture, painterly, dramatic chiaroscuro, low contrast, muddy values, flat gray lighting, sketch, unfinished, concept sketch lines, extra limbs, extra arms, extra fingers, fused fingers, deformed hands, malformed hands, duplicate subject, multiple heads, floating objects, cluttered background, white background, studio backdrop, official game art, fan art, photobash text, numbers, signage, people, ground plane extending to edges, horizon, multiple landmarks, modern mining equipment, border, frame

*Notes:* P1. Shardmine motif: terraced cliff, glowing seams, timber gantry. Keep the mine read as folk-industry, not modern mining. Vignette master + optional cut-out.

*Save as:* `art/site/shardmine@2x.png (plus 128 px WebP)`


### `site_shardspire` — site · 1024x1024 · 1:1 · P1

```text
Site illustration vignette: a Shardspire — a tall slender tower of dark stone with a spire of raw crystal jutting from its crown, ember-orange #E0662E veins cracking up the rock and glowing through the crystal, brass rings and mended scaffolding around the base, three large shards floating in slow orbit around the spire as abstract geometry (no lettering), a narrow stair spiralling out of sight; soot-black #17120F rock, charcoal #2A221C tower, bone #E7DCC6 chipped edges, gold #E3B341 brass fittings; soft, even warm light from the ember veins, cold gloam-violet #5B4B8A ambient sky; no people; the tower plus crystal spire is the whole read; centred single vignette, edges falling into dark; stylized 2D illustration, warm ink linework, smooth cel shading, flat mid-tones, strong readable silhouette, usable as a site icon at 128 px; no text, no letters, no runes, no watermark, no signature, no logo, no border, no frame.
```

**Avoid:** text, letters, words, numbers, captions, typography, watermark, signature, artist name, logo, lettered emblem, border, frame, card frame, UI, HUD, interface, buttons, hex grid, grid lines, grid overlay, map labels, arrows, annotations, photorealistic, photograph, 3D render, CGI, octane render, ray tracing, plastic, glossy, chrome, metallic shine, neon, oversaturated, HDR glow, lens flare, bloom, heavy bokeh, motion blur, oil painting, impasto, dry-brush texture, canvas texture, painterly, dramatic chiaroscuro, low contrast, muddy values, flat gray lighting, sketch, unfinished, concept sketch lines, extra limbs, extra arms, extra fingers, fused fingers, deformed hands, malformed hands, duplicate subject, multiple heads, floating objects, cluttered background, white background, studio backdrop, official game art, fan art, photobash text, signage, runes, people, ground plane extending to edges, horizon, multiple landmarks, sci-fi tower, glowing neon, border, frame

*Notes:* P1. Shardspire motif: crystal spire with ember veins, brass, floating shards. Keep it masonry-and-crystal, never sci-fi. Vignette master + optional cut-out.

*Save as:* `art/site/shardspire@2x.png (plus 128 px WebP)`


### `site_watchhold` — site · 1024x1024 · 1:1 · P1

```text
Site illustration vignette: a Watchhold — a squat square keep of dark fitted stone on a low ridge, crenellated, with a tall beacon brazier burning ember-orange #E0662E on the roof and a Hearthwarden banner with only the abstract flame-in-ring glyph (no lettering) hanging from the wall; a mended palisade and narrow gate, stone steps cut into the ridge, soot-black #17120F shadows, charcoal #2A221C stone, bone #E7DCC6 mortar highlights; cold gloam-violet #5B4B8A dusk with the beacon as the single warm accent; the silhouette of keep plus beacon is the whole read; no people; centred single vignette, edges falling into dark; stylized 2D illustration, warm ink linework, smooth cel shading, flat mid-tones, strong readable silhouette, usable as a site icon at 128 px; no text, no letters, no watermark, no signature, no logo, no border, no frame.
```

**Avoid:** text, letters, words, numbers, captions, typography, watermark, signature, artist name, logo, lettered emblem, border, frame, card frame, UI, HUD, interface, buttons, hex grid, grid lines, grid overlay, map labels, arrows, annotations, photorealistic, photograph, 3D render, CGI, octane render, ray tracing, plastic, glossy, chrome, metallic shine, neon, oversaturated, HDR glow, lens flare, bloom, heavy bokeh, motion blur, oil painting, impasto, dry-brush texture, canvas texture, painterly, dramatic chiaroscuro, low contrast, muddy values, flat gray lighting, sketch, unfinished, concept sketch lines, extra limbs, extra arms, extra fingers, fused fingers, deformed hands, malformed hands, duplicate subject, multiple heads, floating objects, cluttered background, white background, studio backdrop, official game art, fan art, photobash text, lettering on banner, heraldic letters, people, ground plane extending to edges, horizon, multiple landmarks, towers in extreme perspective, border, frame

*Notes:* P1. Watchhold motif: walled tower on a ridge, beacon fire, hearthwarden banner. Keep the banner glyph abstract. Vignette master + optional cut-out.

*Save as:* `art/site/watchhold@2x.png (plus 128 px WebP)`


### `site_woldgate` — site · 1024x1024 · 1:1 · P1

```text
Site illustration vignette: a Woldgate — a free-standing ancient stone arch on the wold, two carved pillars and a lintel of mended stone, the space inside the arch filled with a soft ember-orange #E0662E haze that is brighter than the world behind it, a broken road passing through the arch, low standing stones and dry root-green #6E8F4E grass around it, soot-black #17120F sky, charcoal #2A221C stone, bone #E7DCC6 carved edges; the carvings are abstract weathered shapes only, no runes and no letters; soft, even warm light from the haze inside the arch, cool gloam-violet #5B4B8A ambient; the arch's negative space is the focal point; no people; centred single vignette, edges falling into dark; stylized 2D illustration, warm ink linework, smooth cel shading, flat mid-tones, strong readable silhouette, usable as a site icon at 128 px; no text, no letters, no runes, no watermark, no signature, no logo, no border, no frame.
```

**Avoid:** text, letters, words, numbers, captions, typography, watermark, signature, artist name, logo, lettered emblem, border, frame, card frame, UI, HUD, interface, buttons, hex grid, grid lines, grid overlay, map labels, arrows, annotations, photorealistic, photograph, 3D render, CGI, octane render, ray tracing, plastic, glossy, chrome, metallic shine, neon, oversaturated, HDR glow, lens flare, bloom, heavy bokeh, motion blur, oil painting, impasto, dry-brush texture, canvas texture, painterly, dramatic chiaroscuro, low contrast, muddy values, flat gray lighting, sketch, unfinished, concept sketch lines, extra limbs, extra arms, extra fingers, fused fingers, deformed hands, malformed hands, duplicate subject, multiple heads, floating objects, cluttered background, white background, studio backdrop, official game art, fan art, photobash text, signage, runes, lettered carvings, people, ground plane extending to edges, horizon, multiple landmarks, sci-fi portal, laser glow, border, frame

*Notes:* P1. Woldgate motif: stone arch with ember haze inside, broken road through. Portal, not sci-fi: no neon, no laser rings. Vignette master + optional cut-out.

*Save as:* `art/site/woldgate@2x.png (plus 128 px WebP)`


---

## P2 — branding (do not AI-generate)


### `logo` — branding · vector · vector (n/a) · P2

```text
DO NOT GENERATE THIS SLOT WITH AN IMAGE MODEL. This is a wordmark, not an illustration: AI image models cannot reliably set letterforms, kerning or optical spacing, and AI-shaped typefaces are hard to trademark-screen and to reproduce as editable SVG. Do it with typography and vector tools instead: pick SIL OFL display faces (e.g. Cinzel for the Emberwold wordmark, EB Garamond for secondary text), set the wordmark in Inkscape/Affinity/Illustrator in soot-black #17120F or bone #E7DCC6 with a single ember-orange #E0662E accent (gold #E3B341 optional), add a small hearth-shard mark (a shard with an ember core, or the abstract flame-in-ring glyph) drawn as clean vector paths, and test at 16 px, 64 px and favicon scale. AI may be used only to brainstorm abstract mark silhouettes with no letterforms, and any chosen shape must be redrawn as vector by hand. No AI-generated lettering ships.
```

**Avoid:** text, letters, words, numbers, captions, typography, watermark, signature, artist name, logo, lettered emblem, border, frame, card frame, UI, HUD, interface, buttons, hex grid, grid lines, grid overlay, map labels, arrows, annotations, photorealistic, photograph, 3D render, CGI, octane render, ray tracing, plastic, glossy, chrome, metallic shine, neon, oversaturated, HDR glow, lens flare, bloom, heavy bokeh, motion blur, oil painting, impasto, dry-brush texture, canvas texture, painterly, dramatic chiaroscuro, low contrast, muddy values, flat gray lighting, sketch, unfinished, concept sketch lines, extra limbs, extra arms, extra fingers, fused fingers, deformed hands, malformed hands, duplicate subject, multiple heads, floating objects, cluttered background, white background, studio backdrop, official game art, fan art, photobash AI-generated lettering, distorted type, fake glyphs, pseudo-text, diffusion artifacts, mangled letterforms

*Notes:* P2, not needed for v1. The cheapest legitimate route is free: Inkscape + two OFL fonts. Hash the prompt and record it if AI was used for shape exploration. Screen the name before any public use (15 section 11). Never generate the wordmark itself; the engine overlays the SVG.

*Save as:* `art/branding/logo.svg + wordmark@2x.png (hand-built, not AI)`


---

## After generation (per asset)

1. Pick the best of 3–5 variants; reject any with readable text, extra limbs, or muddy values.
2. Remove background where the slot needs transparency (enemies, sites, motifs) — `rembg` or the tool's built-in cutout.
3. Upscale to the target `size_px` (Real-ESRGAN or the tool's upscaler).
4. Palette-grade toward the nine-colour palette in `15-retheme-bible.md` §8.
5. Save to `art/final/<category>/<id>@2x.png` + a ≤512 px WebP.
6. Update `art/manifest.json` (`status: final`, `art_ref`, note the tool/seed if offered).
7. Silhouette test before accepting: recognizable in solid black at 48–96 px.

**Next:** generate the 4 style-lock images (v2 style) and drop them in `art/brief/style-lock/`; the rest follows the same sheet.
