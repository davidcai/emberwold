/**
 * SVG board. Draws every placed tile hex from engine state (revealed or not), sites, living
 * enemies and the hero. Coordinates come from ./hex so the board matches the engine's map rules.
 */
import { bundle } from "@emberwold/content";
import type { GameState, MapSite } from "@emberwold/engine";
import type { ReactElement } from "react";

import { HEX_SIZE, TERRAIN_FILL, axialToPixel, boardHexes, hexPoints } from "./hex";

const SITE_LETTER_BY_KIND: Readonly<Record<string, string>> = {
  portal: "P",
  village: "V",
  magical_glade: "G",
  monastery: "N",
  mage_tower: "T",
  keep: "K",
  mine: "M",
  city: "C",
};

function siteLetter(siteId: string): string {
  const def = bundle.sites[siteId];
  if (def === undefined) {
    return siteId.slice(0, 1).toUpperCase();
  }
  return SITE_LETTER_BY_KIND[def.siteKind] ?? def.name.slice(0, 1).toUpperCase();
}

export function Board({ state }: { readonly state: GameState }): ReactElement {
  const hexes = boardHexes(state);
  const centers = hexes.map((boardHex) => axialToPixel(boardHex.hex));
  const xs = centers.map((center) => center.x);
  const ys = centers.map((center) => center.y);
  const minX = xs.length === 0 ? -2 * HEX_SIZE : Math.min(...xs) - 2 * HEX_SIZE;
  const minY = ys.length === 0 ? -2 * HEX_SIZE : Math.min(...ys) - 2 * HEX_SIZE;
  const width = xs.length === 0 ? 4 * HEX_SIZE : Math.max(...xs) + 2 * HEX_SIZE - minX;
  const height = ys.length === 0 ? 4 * HEX_SIZE : Math.max(...ys) + 2 * HEX_SIZE - minY;
  const siteByKey = new Map<string, MapSite>(
    state.map.sites.map((site) => [`${site.hex.q},${site.hex.r}`, site] as const),
  );
  const player = state.players[0];
  const heroCenter = player === undefined ? null : axialToPixel(player.position);

  return (
    <svg
      className="board"
      viewBox={`${minX} ${minY} ${width} ${height}`}
      role="img"
      aria-label="Emberwold map"
      data-testid="board"
    >
      {hexes.map((boardHex) => {
        const center = axialToPixel(boardHex.hex);
        const key = `${boardHex.hex.q},${boardHex.hex.r}`;
        const mapSite = siteByKey.get(key);
        const siteId = mapSite?.siteId ?? boardHex.site;
        return (
          <g
            key={key}
            className={boardHex.revealed ? "hex" : "hex hidden"}
            data-terrain={boardHex.terrain}
          >
            <polygon
              points={hexPoints(boardHex.hex)}
              fill={boardHex.revealed ? (TERRAIN_FILL[boardHex.terrain] ?? "#3a3a3a") : "#15130f"}
              stroke={boardHex.revealed ? "#11100e" : "#2b2822"}
              strokeDasharray={boardHex.revealed ? undefined : "4 3"}
            />
            {siteId === null || siteId === undefined ? null : (
              <text
                className={mapSite?.conquered === true ? "site conquered" : "site"}
                x={center.x}
                y={center.y + 4}
                textAnchor="middle"
              >
                {siteLetter(siteId)}
              </text>
            )}
          </g>
        );
      })}
      {state.map.enemies
        .filter((enemy) => enemy.alive)
        .map((enemy) => {
          const center = axialToPixel(enemy.hex);
          return (
            <circle
              key={enemy.instanceId}
              className={enemy.kind === "city" ? "enemy enemy-city" : "enemy"}
              data-testid="enemy"
              cx={center.x}
              cy={center.y - HEX_SIZE * 0.35}
              r={HEX_SIZE * 0.32}
            />
          );
        })}
      {heroCenter === null ? null : (
        <circle
          className="hero"
          data-testid="hero"
          cx={heroCenter.x}
          cy={heroCenter.y}
          r={HEX_SIZE * 0.4}
        />
      )}
    </svg>
  );
}
