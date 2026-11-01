import { bundle } from "@emberwold/content";
import type { GameState } from "@emberwold/engine";
import type { ReactElement } from "react";

import { HEX_SIZE, TERRAIN_FILL, boardHexes, hexPoints } from "./hex";

const SITE_LABEL: Readonly<Record<string, string>> = {
  portal: "P",
  village: "V",
  magical_glade: "G",
};

export function Board({ state }: { state: GameState }): ReactElement {
  const placed = new Set(
    state.map.tiles
      .filter((tile) => tile.revealed)
      .flatMap((tile) => {
        const def = bundle.tiles[tile.tileId];
        return (def?.hexes ?? []).map((hex) => `${tile.origin.q + hex.q},${tile.origin.r + hex.r}`);
      }),
  );
  const hexes = boardHexes();
  const points = hexes.map((entry) => {
    const center = {
      x: Math.sqrt(3) * HEX_SIZE * (entry.hex.q + entry.hex.r / 2),
      y: HEX_SIZE * 1.5 * entry.hex.r,
    };
    return { ...entry, center };
  });
  const xs = points.map((entry) => entry.center.x);
  const ys = points.map((entry) => entry.center.y);
  const minX = Math.min(...xs) - HEX_SIZE * 2;
  const maxX = Math.max(...xs) + HEX_SIZE * 2;
  const minY = Math.min(...ys) - HEX_SIZE * 2;
  const maxY = Math.max(...ys) + HEX_SIZE * 2;

  const player = state.players[0];
  const enemies = state.map.enemies.filter((enemy) => enemy.alive);

  return (
    <svg
      className="board"
      viewBox={`${minX} ${minY} ${maxX - minX} ${maxY - minY}`}
      role="img"
      aria-label="Emberwold map"
      data-testid="board"
    >
      {points.map((entry) => {
        const key = `${entry.hex.q},${entry.hex.r}`;
        const revealed = placed.has(key);
        return (
          <g key={key} className={revealed ? "hex" : "hex hidden"} data-terrain={entry.terrain}>
            <polygon
              points={hexPoints(entry.hex)}
              fill={revealed ? (TERRAIN_FILL[entry.terrain] ?? "#3a3a3a") : "#15130f"}
              stroke={revealed ? "#11100e" : "#2b2822"}
              strokeWidth={1.5}
              strokeDasharray={revealed ? undefined : "4 3"}
            />
            {revealed && entry.site !== null ? (
              <text x={entry.center.x} y={entry.center.y + 4} textAnchor="middle" className="site">
                {SITE_LABEL[entry.site] ?? entry.site.slice(0, 1).toUpperCase()}
              </text>
            ) : null}
          </g>
        );
      })}
      {enemies.map((enemy) => {
        const center = {
          x: Math.sqrt(3) * HEX_SIZE * (enemy.hex.q + enemy.hex.r / 2),
          y: HEX_SIZE * 1.5 * enemy.hex.r,
        };
        return (
          <circle
            key={enemy.instanceId}
            cx={center.x}
            cy={center.y - HEX_SIZE * 0.35}
            r={HEX_SIZE * 0.32}
            className="enemy"
            data-testid="enemy"
          />
        );
      })}
      {player !== undefined ? (
        <circle
          cx={Math.sqrt(3) * HEX_SIZE * (player.position.q + player.position.r / 2)}
          cy={HEX_SIZE * 1.5 * player.position.r}
          r={HEX_SIZE * 0.4}
          className="hero"
          data-testid="hero"
        />
      ) : null}
    </svg>
  );
}
