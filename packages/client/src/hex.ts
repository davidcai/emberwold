import { bundle } from "@emberwold/content";
import type { Hex } from "@emberwold/shared";

export const HEX_SIZE = 20;
const HALF_WIDTH = Math.sqrt(3) * HEX_SIZE;

export function axialToPixel(hex: Hex): { x: number; y: number } {
  return { x: HALF_WIDTH * (hex.q + hex.r / 2), y: HEX_SIZE * 1.5 * hex.r };
}

export function hexPoints(hex: Hex): string {
  const center = axialToPixel(hex);
  const points: string[] = [];
  for (let i = 0; i < 6; i += 1) {
    const angle = (Math.PI / 180) * (60 * i - 30);
    const x = center.x + HEX_SIZE * Math.cos(angle);
    const y = center.y + HEX_SIZE * Math.sin(angle);
    points.push(`${x.toFixed(2)},${y.toFixed(2)}`);
  }
  return points.join(" ");
}

export interface BoardHex {
  readonly hex: Hex;
  readonly terrain: string;
  readonly site: string | null;
  readonly mineColor: string | null;
  readonly revealed: boolean;
}

export function boardHexes(): BoardHex[] {
  const hexes: BoardHex[] = [];
  for (const tile of bundle.scenario.tiles) {
    const def = bundle.tiles[tile.tileId];
    if (def === undefined) {
      continue;
    }
    for (const hex of def.hexes) {
      hexes.push({
        hex: { q: tile.origin.q + hex.q, r: tile.origin.r + hex.r },
        terrain: hex.terrain,
        site: hex.site,
        mineColor: hex.mine_color,
        revealed: true,
      });
    }
  }
  return hexes;
}

export const TERRAIN_FILL: Readonly<Record<string, string>> = {
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
