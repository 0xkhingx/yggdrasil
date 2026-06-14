import { useEffect, useMemo, useState } from "react";

const DEFAULT_PATH_COLOR = "#1a2e1a";
const STATUS_COLORS = {
  locked: DEFAULT_PATH_COLOR,
  unlocked: "#52B788",
  completed: "#2D6A4F",
  decaying: "#D4A017",
};

function getLeafColor(status) {
  return STATUS_COLORS[status] || DEFAULT_PATH_COLOR;
}

function getPathCenter(d) {
  const match = d.match(/[Mm]\s*([\d.]+)[,\s]+([\d.]+)/);
  return match ? { x: parseFloat(match[1]), y: parseFloat(match[2]) } : null;
}

function parsePaths(svgText) {
  const viewBoxMatch = svgText.match(/viewBox="([^"]+)"/i);
  const viewBox = viewBoxMatch?.[1] || "0 0 1024 1024";

  const pathMatches = [...svgText.matchAll(/<path\b[\s\S]*?\/>/gi)];
  const paths = pathMatches.map((match, index) => {
    const full = match[0];
    const id = full.match(/\bid="([^"]+)"/i)?.[1] || `path${index + 1}`;
    const d = full.match(/\bd="([^"]+)"/i)?.[1] || "";
    const fill = full.match(/\bfill="([^"]+)"/i)?.[1] || null;
    const opacity = full.match(/\bopacity="([^"]+)"/i)?.[1] || null;
    return { id, d, fill, opacity };
  });

  return { viewBox, paths };
}

function extractLeafEntries(paths) {
  return paths
    .filter((path) => path.id !== "path1" && path.id !== "path2")
    .slice(0, 95)
    .map((path, index) => ({
      ...path,
      leafIndex: index + 3,
      center: getPathCenter(path.d),
      numericId: path.id.startsWith("path") ? Number(path.id.slice(4)) : index + 3,
    }))
    .sort((a, b) => a.numericId - b.numericId);
}

function zoneForLeaf(center) {
  if (!center) return null;
  const { x, y } = center;
  if (x > 560 && y >= 200 && y <= 400) return 2;
  if (x < 460 && y >= 200 && y <= 400) return 3;
  if (x > 512 && y > 400) return 0;
  if (x < 512 && y > 400) return 1;
  if (x > 512 && y < 200) return 4;
  if (x < 512 && y < 200) return 5;
  const zoneCenters = [
    { x: 700, y: 500 },
    { x: 324, y: 500 },
    { x: 700, y: 300 },
    { x: 324, y: 300 },
    { x: 700, y: 100 },
    { x: 324, y: 100 },
  ];
  let best = 0;
  let bestDist = Infinity;
  zoneCenters.forEach((zoneCenter, index) => {
    const dx = x - zoneCenter.x;
    const dy = y - zoneCenter.y;
    const dist = Math.hypot(dx, dy);
    if (dist < bestDist) {
      bestDist = dist;
      best = index;
    }
  });
  return best;
}

function distanceFromTrunk(center) {
  if (!center) return Infinity;
  return Math.hypot(center.x - 512, center.y - 512);
}

export default function TreeSVG({ nodes = [], onNodeSelect }) {
  const [svgData, setSvgData] = useState(null);

  useEffect(() => {
    let alive = true;
    fetch("/tree.svg")
      .then((res) => res.text())
      .then((text) => {
        if (alive) setSvgData(parsePaths(text));
      })
      .catch(() => {
        if (alive) setSvgData(null);
      });
    return () => {
      alive = false;
    };
  }, []);

  const nodeMap = useMemo(() => {
    const map = new Map();
    (nodes || []).forEach((node) => {
      map.set(`${node.branch_index}-${node.node_index}`, node);
    });
    return map;
  }, [nodes]);

  const leafEntries = useMemo(() => extractLeafEntries(svgData?.paths || []), [svgData]);

  const groupedLeaves = useMemo(() => {
    const zones = Array.from({ length: 6 }, () => []);
    for (const leaf of leafEntries) {
      const zone = zoneForLeaf(leaf.center);
      zones[zone || 0].push(leaf);
    }

    const counts = zones.map((zoneLeaves, index) => ({ zone: index, count: zoneLeaves.length }));
    console.log("TreeSVG leaf zone counts:", counts);

    return zones.flatMap((zoneLeaves, branchIndex) => {
      const sorted = [...zoneLeaves].sort((a, b) => distanceFromTrunk(a.center) - distanceFromTrunk(b.center));
      const nodeBuckets = [[], [], [], []];
      const chunkSize = Math.max(1, Math.ceil(sorted.length / 4));

      for (let i = 0; i < sorted.length; i += 1) {
        const bucketIndex = Math.min(3, Math.floor(i / chunkSize));
        nodeBuckets[bucketIndex].push(sorted[i]);
      }

      return nodeBuckets.map((paths, nodeIndex) => {
        const node = nodeMap.get(`${branchIndex}-${nodeIndex}`) || null;
        return { branchIndex, nodeIndex, node, paths };
      });
    });
  }, [leafEntries, nodeMap]);

  const trunkPath = svgData?.paths?.find((p) => p.id === "path2") || null;
  const detailPath = svgData?.paths?.find((p) => p.id === "path1") || null;

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        minHeight: "500px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
      }}
    >
      <style>{`
        @keyframes leafPulse {
          0%, 100% { opacity: 0.8; }
          50% { opacity: 1; filter: drop-shadow(0 0 10px #52B788); }
        }
        @keyframes treeSpin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .leaf-unlocked {
          animation: leafPulse 2s ease-in-out infinite;
          filter: drop-shadow(0 0 6px #52B788);
        }
        .tree-root-float {
          animation: softFloat 8s ease-in-out infinite;
        }
      `}</style>

      <svg
        className="tree-root-float"
        viewBox={svgData?.viewBox || "0 0 1024 1024"}
        width="100%"
        height="100%"
        preserveAspectRatio="xMidYMid meet"
        style={{ width: "100%", height: "100%", display: "block" }}
      >
        {detailPath?.d ? (
          <path d={detailPath.d} fill={detailPath.fill || DEFAULT_PATH_COLOR} opacity={detailPath.opacity || 1} />
        ) : null}

        {trunkPath?.d ? <path d={trunkPath.d} fill="#7c5c3a" /> : null}

        {groupedLeaves.map((group) => {
          const node = group.node;
          const status = node?.status || "locked";
          const color = getLeafColor(status);
          const isClickable = !!node && status !== "locked";

          if (!group.paths.length) return null;

          return (
            <g
              key={`${group.branchIndex}-${group.nodeIndex}`}
              onClick={() => isClickable && onNodeSelect?.(node)}
              style={{ cursor: isClickable ? "pointer" : "default" }}
              className={status === "unlocked" ? "leaf-unlocked" : ""}
            >
              {node?.title ? <title>{node.title}</title> : null}
              {group.paths.map((entry) => (
                <path
                  key={entry.id}
                  d={entry.d}
                  fill={color}
                  opacity={status === "locked" ? 0.35 : 1}
                  style={{ transition: "fill 0.35s ease, opacity 0.35s ease" }}
                />
              ))}
            </g>
          );
        })}
      </svg>
    </div>
  );
}
