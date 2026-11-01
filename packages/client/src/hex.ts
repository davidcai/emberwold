/**
 * Board geometry: turns placed map tiles into world-space hexes and SVG polygons. The board is
 * driven by the engine state (`state.map.tiles`), so reveals and tile rotations show up without
 * the client knowing scenario setup rules.
 */
import { bundle } from "@emberwold/content";
import type { GameState } from "@emberwold/engine";
import type { Terrain } from "@emberwold/shared";

export const HEX_SIZE = 20;
const HALF_WIDTH = Math.sqrt(3) * HEX_SIZE;

export interface Hex {
  readonly q: number;
  readonly r: number;
}

export interface Pixel {
  readonly x: number;
  readonly y: number;
}

export interface BoardHex {
  readonly hex: Hex;
  readonly terrain: Terrain;
  readonly site: string | null;
  readonly mineColor: string | null;
  readonly revealed: boolean;
}

export const TERRAIN_FILL: Readonly<Record<Terrain, string>> = {
  plains: "#4a4632",
  hills: "#5a4a2e",
  forest: "#2f4a33",
  wasteland: "#54462f",
  desert: "#6b5c39",
  swamp: "#37453a",
  lake: "#25374a",
  mountain: "#4a4240",
  city: "#5b3b3b",
};

export function axialToPixel(hex: Hex): Pixel {
  return {
    x: HALF_WIDTH * (hex.q + hex.r / 2),
    y: HEX_SIZE * 1.5 * hex.r,
  };
}

export function hexPoints(hex: Hex): string {
  const center = axialToPixel(hex);
  const corners: string[] = [];
  for (let i = 0; i < 6; i += 1) {
    const angle = (Math.PI / 180) * (60 * i - 30);
    const x = center.x + HEX_SIZE * Math.cos(angle);
    const y = center.y + HEX_SIZE * Math.sin(angle);
    corners.push(`${x.toFixed(2)},${y.toFixed(2)}`);
  }
  return corners.join(" ");
}

export function hexKey(hex: Hex): string {
  return `${hex.q},${hex.r}`;
}

/** Rotate axial coordinates by `steps` * 60 degrees (same cube rotation as the engine). */
export function rotateHex(hex: Hex, steps: number): Hex {
  const turns = ((steps % 6) + 6) % 6;
  let q = hex.q;
  let r = hex.r;
  for (let i = 0; i < turns; i += 1) {
    const z = r;
    const x = q;
    const y = -x - z;
    q = -z;
    r = -y;
  }
  return { q, r };
}

export function boardHexes(state: GameState): readonly BoardHex[] {
  const hexes: BoardHex[] = [];
  for (const tile of state.map.tiles) {
    const def = bundle.tiles[tile.tileId];
    if (def === undefined) {
      continue;
    }
    for (const local of def.hexes) {
      const rotated = rotateHex({ q: local.q, r: local.r }, tile.rotation);
      hexes.push({
        hex: { q: tile.origin.q + rotated.q, r: tile.origin.r + rotated.r },
        terrain: local.terrain,
        site: local.site,
        mineColor: local.mine_color,
        revealed: tile.revealed,
      });
    }
  }
  return hexes;
}

export function boardHexAt(state: GameState, hex: Hex): BoardHex | undefined {
  const key = hexKey(hex);
  return boardHexes(state).find((boardHex) => hexKey(boardHex.hex) === key);
}
