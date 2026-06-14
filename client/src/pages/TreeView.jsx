import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Trash } from "@phosphor-icons/react";
import { checkDecay, deleteTree, getTree } from "../lib/api";
import TreeSVG from "../components/TreeSVG";
import LessonPanel from "../components/LessonPanel";

function HeroChip({ children }) {
  return (
    <div
      className="animate-fadeIn"
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        padding: "6px 12px",
        borderRadius: 999,
        border: "1px solid rgba(0,0,0,0.12)",
        background: "#f6f6f3",
        color: "#232323",
        fontFamily: "Raleway, sans-serif",
        fontSize: 11,
        textTransform: "uppercase",
        letterSpacing: "0.14em",
      }}
    >
      <span
        style={{
          width: 7,
          height: 7,
          borderRadius: "50%",
          background: "#111",
          display: "inline-block",
        }}
      />
      {children}
    </div>
  );
}

export default function TreeView() {
  const { treeId } = useParams();
  const navigate = useNavigate();
  const [tree, setTree] = useState(null);
  const [nodes, setNodes] = useState([]);
  const [selectedNode, setSelectedNode] = useState(null);
  const [loading, setLoading] = useState(true);
  const [decayBanner, setDecayBanner] = useState(false);

  useEffect(() => {
    setSelectedNode(null);
    setLoading(true);
  }, [treeId]);

  const loadTree = useCallback(async () => {
    try {
      const data = await getTree(treeId);
      setTree(data.tree);
      setNodes(data.nodes);

      const decay = await checkDecay(treeId);
      setDecayBanner(decay.decayed);

      const currentSelectionId = selectedNode?.id;
      const currentSelectionStillExists = currentSelectionId
        ? data.nodes.some((n) => n.id === currentSelectionId)
        : false;

      if (currentSelectionId && !currentSelectionStillExists) {
        setSelectedNode(null);
      }

      if (data.nodes.length > 0 && !currentSelectionStillExists) {
        const firstUnlocked = data.nodes.find((n) => n.status === "unlocked" || n.status === "decaying");
        if (firstUnlocked) setSelectedNode(firstUnlocked);
      }

      return data;
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [treeId, selectedNode?.id]);

  useEffect(() => {
    loadTree();
  }, [loadTree]);

  async function handleNodeUpdated(nextNodeId) {
    if (!nextNodeId) {
      setSelectedNode(null);
      await loadTree();
      return;
    }

    const data = await loadTree();
    if (nextNodeId && data?.nodes) {
      const next = data.nodes.find((n) => n.id === nextNodeId);
      if (next) setSelectedNode(next);
    }
  }

  async function handleDeleteTree() {
    if (!tree) return;
    const confirmed = window.confirm(`Delete "${tree.topic}"? This will remove the planted seed and all of its nodes.`);
    if (!confirmed) return;
    try {
      await deleteTree(treeId);
      navigate("/", { replace: true });
    } catch (err) {
      console.error(err);
      window.alert("Unable to delete this seed.");
    }
  }

  const totalNodes = nodes.length;
  const completedNodes = nodes.filter((n) => n.status === "completed").length;
  const currentBranch = selectedNode?.branch_index ?? 0;
  const branchNodeIndex = selectedNode?.node_index ?? 0;
  const branchSize = selectedNode
    ? nodes.filter((n) => n.branch_index === selectedNode.branch_index).length
    : 0;
  const progressWidth = totalNodes ? `${Math.max(8, (completedNodes / totalNodes) * 100)}%` : "8%";

  const heroStats = useMemo(
    () => [
      { label: "Branches", value: tree?.curriculum?.branches?.length ?? 0 },
      { label: "Nodes", value: totalNodes },
      { label: "Mastered", value: completedNodes },
    ],
    [tree?.curriculum?.branches?.length, totalNodes, completedNodes],
  );

  if (loading) {
    return (
      <div
        style={{
          height: "100vh",
          width: "100%",
          background: "#f0f4f1",
          display: "grid",
          placeItems: "center",
          overflow: "hidden",
        }}
      >
        <div style={{ width: 34, height: 34, borderRadius: "50%", border: "2px solid rgba(255,255,255,0.15)", borderTopColor: "#fff", animation: "treeSpin 1s linear infinite" }} />
      </div>
    );
  }

  return (
    <div
      style={{
        height: "100vh",
        width: "100%",
        background: "#f0f4f1",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        paddingTop: 0,
        boxSizing: "border-box",
      }}
    >
      <style>{`
        @keyframes treeFadeUp {
          from { opacity: 0; transform: translateY(14px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes treeFloat {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-6px); }
        }
        @keyframes treeSpin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .treeview-shell {
          max-width: 1320px;
          margin: 0 auto;
          padding-top: 112px;
          animation: treeFadeUp 520ms ease both;
          flex: 1;
          width: 100%;
          min-height: 0;
        }
        .treeview-card {
          display: grid;
          grid-template-columns: 0.96fr 1.04fr;
          height: 100%;
          overflow: hidden;
          gap: 16px;
        }
        .treeview-left {
          background: #ffffff;
          color: #121212;
          padding: 24px 34px 30px;
          display: flex;
          flex-direction: column;
          justify-content: flex-start;
          position: relative;
          height: calc(100vh - 112px);
          overflow-y: auto;
          scrollbar-width: thin;
          scrollbar-color: rgba(0,0,0,0.1) transparent;
        }
        .treeview-right {
          background: #e8ede9;
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 22px;
          height: calc(100vh - 128px);
          overflow: hidden;
          margin-top: 16px;
          margin-bottom: 16px;
        }
        .treeview-right > div {
          background: #e8ede9 !important;
          background-image: none !important;
        }
        .treeview-left::-webkit-scrollbar {
          width: 4px;
        }
        .treeview-left::-webkit-scrollbar-track {
          background: transparent;
        }
        .treeview-left::-webkit-scrollbar-thumb {
          background: rgba(0,0,0,0.1);
          border-radius: 999px;
        }
        .treeview-left .lesson-panel {
          border: 1px solid rgba(0,0,0,0.08);
          border-radius: 20px;
          overflow: hidden;
          box-shadow: 0 10px 30px rgba(0,0,0,0.06);
          min-height: 340px;
          flex: 1;
        }
        .treeview-left .lesson-panel,
        .treeview-left .lesson-panel * {
          color: #1a1a1a;
        }
        .treeview-left .lesson-panel h2 {
          color: #1a1a1a !important;
          opacity: 1 !important;
        }
        .treeview-left .lesson-panel .prose p {
          color: #444 !important;
          opacity: 1 !important;
        }
        .treeview-left .lesson-panel textarea {
          background: #ffffff !important;
          color: #1a1a1a !important;
          border-color: rgba(0,0,0,0.14) !important;
          opacity: 1 !important;
        }
        .treeview-left .lesson-panel textarea::placeholder {
          color: #8a8a8a !important;
          opacity: 1 !important;
        }
        .treeview-left .lesson-panel button {
          opacity: 1 !important;
        }
        .treeview-left .lesson-panel button[disabled] {
          opacity: 0.55 !important;
        }
        .treeview-left .lesson-panel .bg-\\[\\#161B22\\] {
          background: #ffffff !important;
        }
        .treeview-left .lesson-panel .text-\\[\\#F0EDE4\\] {
          color: #1a1a1a !important;
        }
        .treeview-left .lesson-panel .text-\\[\\#E0DCD0\\] {
          color: #444 !important;
        }
        .treeview-left .lesson-panel .text-gray-500,
        .treeview-left .lesson-panel .text-gray-400 {
          color: #666 !important;
        }
        .treeview-left .lesson-panel .bg-\\[\\#161B22\\].border-\\[\\#21262d\\] {
          background: #ffffff !important;
          border-color: rgba(0,0,0,0.14) !important;
        }
        .treeview-left .lesson-panel .bg-\\[\\#2D6A4F\\],
        .treeview-left .lesson-panel .hover\\:bg-\\[\\#2D6A4F\\]:hover {
          background: #2D6A4F !important;
        }
        .treeview-left .lesson-panel .mb-2.text-\\[0\\.75rem\\].text-gray-500 {
          display: none !important;
        }
        .treeview-delete-btn {
          background: #fff;
          color: #e05252;
          border: 1px solid rgba(0,0,0,0.08);
          border-radius: 999px;
          padding: 8px 12px;
          font-family: "Raleway", sans-serif;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.15s ease;
          display: inline-flex;
          align-items: center;
          gap: 8px;
        }
        .treeview-delete-btn:hover {
          background: #fff7f7;
          border-color: rgba(224,82,82,0.2);
        }
        @media (max-width: 980px) {
          .treeview-card {
            grid-template-columns: 1fr;
            gap: 0;
          }
          .treeview-right {
            height: 420px;
            order: -1;
            margin-top: 16px;
          }
          .treeview-left {
            height: auto;
            overflow-y: auto;
            padding-top: 24px;
          }
        }
        @media (max-width: 640px) {
          .treeview-left {
            padding: 24px 22px 22px;
          }
          .treeview-right {
            padding: 18px;
          }
        }
      `}</style>

      {decayBanner ? (
        <div style={{ maxWidth: 1320, margin: "0 auto 18px" }}>
          <div
            style={{
              background: "#fff4cc",
              color: "#6a4f00",
              borderRadius: 16,
              padding: "12px 16px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 16,
            }}
          >
            <span style={{ fontFamily: "Raleway, sans-serif", fontSize: 13 }}>
              Your tree is wilting. Complete a review to restore it.
            </span>
            <button
              type="button"
              onClick={() => setDecayBanner(false)}
              style={{
                border: "none",
                background: "transparent",
                color: "#6a4f00",
                cursor: "pointer",
                fontFamily: "Raleway, sans-serif",
                fontSize: 13,
                fontWeight: 600,
              }}
            >
              Dismiss
            </button>
          </div>
        </div>
      ) : null}

      <div className="treeview-shell">
        <div className="treeview-card">
          <section className="treeview-left">
            <div>
              <HeroChip>
                Branch {currentBranch + 1} · Node {branchNodeIndex + 1} of {Math.max(branchSize, 1)}
              </HeroChip>

              <div style={{ marginTop: 22, maxWidth: 420 }}>
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 16 }}>
              <button type="button" className="treeview-delete-btn" onClick={handleDeleteTree}>
                <Trash size={14} weight="bold" />
                Delete seed
              </button>
            </div>

            <div style={{ marginTop: 28 }}>
              <div className="lesson-panel">
                <LessonPanel
                  nodeId={selectedNode?.id}
                  treeId={treeId}
                  nodeData={selectedNode}
                  onNodeUpdated={handleNodeUpdated}
                />
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
                  gap: 10,
                  marginTop: 14,
                }}
              >
                {heroStats.map((item) => (
                  <div
                    key={item.label}
                    style={{
                      border: "1px solid rgba(0,0,0,0.08)",
                      borderRadius: 16,
                      padding: "14px 14px 12px",
                      background: "#faf8f4",
                    }}
                  >
                    <div style={{ fontFamily: "Raleway, sans-serif", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.12em", color: "#777" }}>
                      {item.label}
                    </div>
                    <div style={{ marginTop: 8, fontFamily: '"Courier New", Courier, monospace', fontSize: 30, lineHeight: 1, color: "#111" }}>
                      {item.value}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="treeview-right">
            <div
              style={{
                position: "absolute",
                top: 24,
                right: 24,
                display: "flex",
                alignItems: "center",
                gap: 10,
                zIndex: 2,
              }}
            >
              <div
                style={{
                  background: "rgba(255,255,255,0.94)",
                  color: "#171717",
                  borderRadius: 999,
                  padding: "8px 14px",
                  fontFamily: "Raleway, sans-serif",
                  fontSize: 12,
                  boxShadow: "0 10px 24px rgba(0,0,0,0.18)",
                }}
              >
                {completedNodes} / {totalNodes} mastered
              </div>
            </div>

            <div
              style={{
                position: "absolute",
                left: 24,
                right: 24,
                bottom: 24,
                display: "flex",
                gap: 8,
                zIndex: 2,
              }}
            >
              <span style={{ width: 34, height: 4, borderRadius: 999, background: "#e7d87a", display: "inline-block" }} />
              <span style={{ width: 20, height: 4, borderRadius: 999, background: "rgba(255,255,255,0.45)", display: "inline-block" }} />
              <span style={{ width: 20, height: 4, borderRadius: 999, background: "rgba(255,255,255,0.45)", display: "inline-block" }} />
            </div>

            <div
              style={{
                width: "100%",
                height: "100%",
                borderRadius: 24,
                background: "#e8ede9",
                boxShadow: "0 8px 24px rgba(0,0,0,0.06)",
                border: "1px solid rgba(0,0,0,0.04)",
                overflow: "hidden",
                animation: "treeFloat 6s ease-in-out infinite",
              }}
            >
              <div style={{ width: "100%", height: "100%" }}>
                <TreeSVG branches={tree?.curriculum?.branches || []} nodes={nodes} onNodeSelect={setSelectedNode} />
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
