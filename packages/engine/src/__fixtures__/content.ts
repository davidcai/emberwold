/**
 * Hand-written content bundle for engine tests (S3). The generated spike bundle from
 * `game-data/` replaces this in S4; both must satisfy the same shared `ContentBundle` type.
 */
import type { CardDef, ContentBundle, EffectOp } from "@emberwold/shared";

function card(
  id: string,
  color: "green" | "blue" | "red" | "white",
  poweredBy: "green" | "blue" | "red" | "white" | "any_basic",
  basic: EffectOp,
  powered: EffectOp,
): CardDef {
  return { id, name: id, color, poweredBy, sidewaysValue: 1, effects: { basic, powered } };
}

const woundCard: CardDef = {
  id: "card:wound",
  name: "Wound",
  color: "white",
  poweredBy: null,
  sidewaysValue: 0,
  effects: { basic: { op: "special", id: "none" }, powered: null },
};

export function createFixtureContent(): ContentBundle {
  const cards: Record<string, CardDef> = {
    "basic:march": card(
      "basic:march",
      "green",
      "green",
      { op: "gain_move", amount: 2 },
      { op: "gain_move", amount: 4 },
    ),
    "basic:promise": card(
      "basic:promise",
      "white",
      "white",
      { op: "gain_influence", amount: 2 },
      { op: "gain_influence", amount: 4 },
    ),
    "basic:tranquility": card(
      "basic:tranquility",
      "green",
      "green",
      {
        op: "choice",
        options: [
          { op: "gain_healing", amount: 1 },
          { op: "draw_cards", count: 1 },
        ],
      },
      {
        op: "choice",
        options: [
          { op: "gain_healing", amount: 2 },
          { op: "draw_cards", count: 2 },
        ],
      },
    ),
    "basic:rage": card(
      "basic:rage",
      "red",
      "red",
      {
        op: "choice",
        options: [
          { op: "gain_attack", amount: 2, combat_type: "melee", element: "physical" },
          { op: "gain_block", amount: 2, element: "physical" },
        ],
      },
      { op: "gain_attack", amount: 4, combat_type: "melee", element: "physical" },
    ),
    "basic:improvisation": card(
      "basic:improvisation",
      "red",
      "red",
      {
        op: "discard_cost",
        count: 1,
        filter_wounds: true,
        wounds_only: false,
        then_effect: {
          op: "choice",
          options: [
            { op: "gain_move", amount: 3 },
            { op: "gain_attack", amount: 3, combat_type: "melee", element: "physical" },
          ],
        },
      },
      { op: "gain_move", amount: 5 },
    ),
    "basic:will_focus": card(
      "basic:will_focus",
      "green",
      "green",
      {
        op: "choice",
        options: [
          { op: "gain_mana", color: "blue", amount: 1 },
          { op: "gain_mana", color: "white", amount: 1 },
        ],
      },
      {
        op: "choice",
        options: [
          { op: "gain_mana", color: "blue", amount: 1 },
          { op: "gain_mana", color: "gold", amount: 1 },
        ],
      },
    ),
    "basic:mana_draw": card(
      "basic:mana_draw",
      "white",
      "white",
      {
        op: "apply_modifier",
        effect: { op: "rule_override", rule: "extra_source_die" },
        duration: "turn",
      },
      { op: "mana_draw_powered", dice_count: 1, tokens_per_die: 2 },
    ),
    "basic:swiftness": card(
      "basic:swiftness",
      "white",
      "white",
      { op: "gain_move", amount: 2 },
      { op: "gain_attack", amount: 3, combat_type: "ranged", element: "physical" },
    ),
  };

  const deck = [
    "basic:march",
    "basic:march",
    "basic:march",
    "basic:march",
    "basic:march",
    "basic:march",
    "basic:promise",
    "basic:promise",
    "basic:promise",
    "basic:tranquility",
    "basic:tranquility",
    "basic:rage",
    "basic:rage",
    "basic:improvisation",
    "basic:will_focus",
    "basic:mana_draw",
  ];

  return {
    schemaVersion: 1,
    contentHash: "fixture-content-hash",
    rulesConstants: {
      startingHandSize: 5,
      heroArmor: 2,
      heroHandLimit: 5,
      deedDeckSize: 16,
      tileRevealCost: 2,
      terrainMoveCost: {
        plains: { day: 2, night: 2 },
        hills: { day: 3, night: 3 },
        forest: { day: 3, night: 5 },
        wasteland: { day: 4, night: 4 },
        desert: { day: 5, night: 3 },
        swamp: { day: 5, night: 5 },
        lake: null,
        mountain: null,
        city: { day: 2, night: 2 },
      },
    },
    cards: { ...cards, [woundCard.id]: woundCard },
    heroes: {
      "hero:test": {
        id: "hero:test",
        name: "Test Hero",
        startingCrystals: ["green", "green", "blue"],
        startingDeck: deck,
      },
    },
    tiles: {
      "tile:start": {
        id: "tile:start",
        name: "Start",
        hexes: [
          { q: 0, r: 0, terrain: "plains", site: "portal", mine_color: null, rampaging: [] },
          { q: 1, r: 0, terrain: "plains", site: null, mine_color: null, rampaging: [] },
          { q: 0, r: 1, terrain: "forest", site: null, mine_color: null, rampaging: [] },
          { q: -1, r: 1, terrain: "forest", site: null, mine_color: null, rampaging: [] },
          { q: -1, r: 0, terrain: "plains", site: null, mine_color: null, rampaging: [] },
          { q: 0, r: -1, terrain: "hills", site: null, mine_color: null, rampaging: [] },
          { q: 1, r: -1, terrain: "plains", site: null, mine_color: null, rampaging: [] },
          { q: -1, r: 2, terrain: "lake", site: null, mine_color: null, rampaging: [] },
          { q: 0, r: 2, terrain: "mountain", site: null, mine_color: null, rampaging: [] },
        ],
      },
      "tile:countryside": {
        id: "tile:countryside",
        name: "Countryside",
        hexes: [
          { q: 0, r: 0, terrain: "hills", site: "village", mine_color: null, rampaging: [] },
          { q: 1, r: 0, terrain: "plains", site: null, mine_color: null, rampaging: [] },
          { q: 0, r: 1, terrain: "forest", site: null, mine_color: null, rampaging: [] },
        ],
      },
    },
    enemies: {
      "enemy:test_brute": {
        id: "enemy:test_brute",
        name: "Test Brute",
        color: "green",
        attack: 3,
        attackElement: "physical",
        armor: 3,
        fame: 2,
        resistances: [],
        abilities: [],
      },
    },
    sites: {
      "site:village": {
        id: "site:village",
        name: "Village",
        siteKind: "inhabited",
        fortified: false,
        inhabited: true,
        healing: { influencePerPoint: 3 },
        interaction: ["buy healing"],
      },
      "site:portal": {
        id: "site:portal",
        name: "Portal",
        siteKind: "special",
        fortified: false,
        inhabited: false,
        healing: null,
        interaction: [],
      },
    },
    scenario: {
      id: "scenario:spike-fixture",
      roundCap: 3,
      heroId: "hero:test",
      tiles: [
        { tileId: "tile:start", origin: { q: 0, r: 0 } },
        { tileId: "tile:countryside", origin: { q: 2, r: 0 } },
      ],
      spawns: [
        { enemyId: "enemy:test_brute", hex: { q: 2, r: 0 } },
        { enemyId: "enemy:test_brute", hex: { q: 2, r: 1 } },
      ],
      site: null,
      startHex: { q: 0, r: 0 },
    },
    woundCard,
  };
}
