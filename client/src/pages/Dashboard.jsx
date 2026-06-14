import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import {
  ArrowRight,
  Gear,
  Fire,
  Funnel,
  Leaf,
  Moon,
  Drop,
  Trash,
  TreeEvergreen,
  Tree,
  UserCircle,
  Sparkle,
} from "@phosphor-icons/react";
import { checkDecay, deleteTree, getTrees } from "../lib/api";
import { supabase } from "../lib/supabase";

function getStatusMeta(hoursSinceActive) {
  if (hoursSinceActive > 72) {
    return { label: "Dormant", text: "#e05252", fill: "#e05252", tagBg: "#fef0f0", accent: "#e05252" };
  }
  if (hoursSinceActive > 48) {
    return { label: "Wilting", text: "#D4A017", fill: "#D4A017", tagBg: "#fff8e6", accent: "#D4A017" };
  }
  return { label: "Growing", text: "#2D6A4F", fill: "#52B788", tagBg: "#e8f5ee", accent: "#52B788" };
}

function getProgress(tree) {
  return tree.node_count ? Math.round((tree.completed_count / tree.node_count) * 100) : 0;
}

function getDisplayName(email) {
  if (!email) return "Learner";
  const [name] = email.split("@");
  return name.charAt(0).toUpperCase() + name.slice(1);
}

function StatPill({ icon, text }) {
  return (
    <div
      className="dashboard-stat-pill"
      style={{
        background: "#fff",
        borderRadius: 999,
        padding: "8px 18px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
      }}
    >
      {icon}
      <span style={{ fontFamily: "Raleway, sans-serif", fontSize: 12, color: "#555" }}>{text}</span>
    </div>
  );
}

function StatCell({ value, label }) {
  return (
    <div
      style={{
        background: "#f0f4f1",
        borderRadius: 12,
        padding: "10px 8px",
        textAlign: "center",
      }}
    >
      <div style={{ fontFamily: '"Courier New", Courier, monospace', fontSize: 24, fontWeight: 600, color: "#1a1a1a", lineHeight: 1 }}>
        {value}
      </div>
      <div style={{ marginTop: 2, fontFamily: "Raleway, sans-serif", fontSize: 9, color: "#888", textTransform: "uppercase", letterSpacing: "0.8px" }}>
        {label}
      </div>
    </div>
  );
}

function HoverIconButton({ icon, label, onClick, color = "#aaa", activeColor = "#2D6A4F" }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      aria-label={label}
      style={{
        position: "relative",
        width: 32,
        height: 32,
        border: "none",
        borderRadius: "50%",
        background: "transparent",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: onClick ? "pointer" : "default",
        color,
        transition: "all 0.18s ease",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-1px) scale(1.04)";
        e.currentTarget.style.color = activeColor;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translateY(0) scale(1)";
        e.currentTarget.style.color = color;
      }}
    >
      {icon}
      <span
        style={{
          position: "absolute",
          top: -36,
          left: "50%",
          transform: "translateX(-50%)",
          background: "#1a1a1a",
          color: "#fff",
          borderRadius: 999,
          padding: "4px 10px",
          fontFamily: "Raleway, sans-serif",
          fontSize: 11,
          whiteSpace: "nowrap",
          pointerEvents: "none",
          opacity: 0,
          transition: "opacity 0.15s ease, transform 0.15s ease",
          zIndex: 2,
        }}
        className="dashboard-icon-tip"
      >
        {label}
      </span>
    </button>
  );
}

function TreeCard({ tree, onContinue, onDelete, compact = false }) {
  const status = getStatusMeta(tree.hoursSinceActive ?? 0);
  const progress = getProgress(tree);

  return (
    <div
      style={{
        background: "#fff",
        borderRadius: compact ? 18 : 20,
        padding: compact ? "22px 24px" : "26px 28px",
        boxShadow: "0 2px 10px rgba(0,0,0,0.05)",
        border: "1px solid rgba(0,0,0,0.04)",
        borderLeft: `4px solid ${status.accent}`,
        transition: "all 0.2s ease",
        minWidth: compact ? 270 : "auto",
        flexShrink: 0,
        position: "relative",
      }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = "translateY(-3px)";
          e.currentTarget.style.boxShadow = "0 8px 20px rgba(0,0,0,0.09)";
          e.currentTarget.style.borderLeftWidth = "5px";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = "translateY(0)";
          e.currentTarget.style.boxShadow = "0 2px 10px rgba(0,0,0,0.05)";
          e.currentTarget.style.borderLeftWidth = "4px";
        }}
    >
      <div
        style={{
          display: "inline-flex",
          alignItems: "center",
          borderRadius: 999,
          padding: "3px 12px",
          background: status.tagBg,
          color: status.text,
          fontFamily: "Raleway, sans-serif",
          fontSize: 10,
          fontWeight: 600,
        }}
      >
        {status.label}
      </div>

      <div
        style={{
          marginTop: 8,
          fontFamily: '"Courier New", Courier, monospace',
          fontSize: compact ? 22 : 26,
          fontWeight: 600,
          color: "#1a1a1a",
          textTransform: "capitalize",
          lineHeight: 1.05,
        }}
      >
        {tree.topic}
      </div>

      <div style={{ height: 3, background: "#e8ede9", borderRadius: 999, margin: "14px 0", overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${progress}%`, background: status.fill, borderRadius: 999 }} />
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
        <div style={{ fontFamily: "Raleway, sans-serif", fontSize: 11, color: "#aaa" }}>
          {tree.completed_count || 0}/{tree.node_count || 0} nodes
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button
            className="premium-button"
            type="button"
            onClick={() => onDelete(tree)}
            title="Delete seed"
            aria-label="Delete seed"
            style={{
              width: 30,
              height: 30,
              borderRadius: "50%",
              border: "1px solid rgba(0,0,0,0.08)",
              background: "#fff",
              color: "#e05252",
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Trash size={14} weight="bold" />
          </button>
          <button
            className="premium-button"
            type="button"
            onClick={() => onContinue(tree.id)}
            style={{
              background: "#1a1a1a",
              color: "#fff",
              border: "none",
              borderRadius: 999,
              padding: "7px 16px",
              fontFamily: "Raleway, sans-serif",
              fontSize: 11,
              fontWeight: 600,
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <ArrowRight size={11} weight="duotone" />
            {compact ? "Resume" : "Continue"}
          </button>
        </div>
      </div>

      {!compact && (
        <div style={{ marginTop: 10, textAlign: "right", fontFamily: "Raleway, sans-serif", fontSize: 10, color: "#bbb" }}>
          Last active {tree.last_active ? new Date(tree.last_active).toLocaleDateString() : ""}
        </div>
      )}
    </div>
  );
}

export default function Dashboard() {
  const location = useLocation();
  const navigate = useNavigate();
  const [trees, setTrees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("All");
  const decayFiredRef = useRef(false);
  async function handleDeleteTree(tree) {
    const ok = window.confirm(`Delete "${tree.topic}"? This will remove the entire planted seed and its nodes.`);
    if (!ok) return;
    try {
      await deleteTree(tree.id);
      setTrees((current) => current.filter((item) => item.id !== tree.id));
    } catch (err) {
      console.error(err);
      window.alert("Unable to delete that seed.");
    }
  }

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const session = await supabase.auth.getSession();
        if (mounted) setEmail(session.data.session?.user?.email || "");
        const data = await getTrees();
        if (mounted) setTrees(data.trees || []);
      } catch (err) {
        console.error(err);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (loading || decayFiredRef.current || trees.length === 0) return;
    decayFiredRef.current = true;
    Promise.all(
      trees.map(async (tree) => {
        try {
          const decay = await checkDecay(tree.id);
          return { ...tree, hoursSinceActive: decay.hoursSinceActive };
        } catch (err) {
          console.error(err);
          return { ...tree, hoursSinceActive: 0 };
        }
      })
    ).then((nextTrees) => setTrees(nextTrees));
  }, [loading, trees]);

  const featuredTrees = useMemo(() => {
    const searchQuery = new URLSearchParams(location.search).get("q")?.trim().toLowerCase() || "";
    return trees
      .filter((tree) => {
        if (!searchQuery) return true;
        return [tree.topic, tree.streak_days, tree.completed_count, tree.node_count]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(searchQuery));
      })
      .filter((tree) => ["Growing", "Wilting"].includes(getStatusMeta(tree.hoursSinceActive ?? 0).label))
      .slice()
      .sort((a, b) => {
        const aTime = a.last_active ? new Date(a.last_active).getTime() : 0;
        const bTime = b.last_active ? new Date(b.last_active).getTime() : 0;
        return bTime - aTime;
      })
      .slice(0, 2);
  }, [location.search, trees]);

  const filteredTrees = useMemo(() => {
    const searchQuery = new URLSearchParams(location.search).get("q")?.trim().toLowerCase() || "";
    return trees.filter((tree) => {
      const statusMatch = selectedFilter === "All" || getStatusMeta(tree.hoursSinceActive ?? 0).label === selectedFilter;
      const searchMatch = !searchQuery || [tree.topic, tree.streak_days, tree.completed_count, tree.node_count]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(searchQuery));
      return statusMatch && searchMatch;
    });
  }, [location.search, selectedFilter, trees]);

  const bestStreak = trees.reduce((max, tree) => Math.max(max, tree.streak_days || 0), 0);
  const totalNodesMastered = trees.reduce((sum, tree) => sum + (tree.completed_count || 0), 0);
  const totalTreesPlanted = trees.length;
  const displayName = getDisplayName(email);
  const searchQuery = new URLSearchParams(location.search).get("q")?.trim() || "";

  const weekDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const now = new Date();
  const monday = new Date(now);
  monday.setDate(now.getDate() - ((now.getDay() + 6) % 7));
  monday.setHours(0, 0, 0, 0);
  const weekDates = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });
  const activeDaySet = new Set(trees.filter((tree) => tree.last_active).map((tree) => new Date(tree.last_active).toDateString()));

  return (
    <div className="animate-fadeIn dashboard-shell" style={{ minHeight: "100vh", background: "#f0f4f1", paddingTop: 120, boxSizing: "border-box" }}>
      <div className="dashboard-layout" style={{ display: "flex", gap: 32, maxWidth: 1300, margin: "0 auto", padding: "0 48px 48px", boxSizing: "border-box" }}>
        <main style={{ flex: 1, minWidth: 0 }}>
          <style>{`
            .dashboard-icon-tip { opacity: 0; transform: translateX(-50%) translateY(4px); }
            button:hover .dashboard-icon-tip { opacity: 1; transform: translateX(-50%) translateY(0); }
            @keyframes dashboardFadeUp {
              from { opacity: 0; transform: translateY(12px); }
              to { opacity: 1; transform: translateY(0); }
            }
            @media (max-width: 1100px) {
              .dashboard-layout {
                flex-direction: column;
                padding: 0 20px 32px !important;
              }
              .dashboard-sidebar {
                width: 100% !important;
                position: static !important;
                top: auto !important;
              }
            }
            @media (max-width: 720px) {
              .dashboard-shell {
                padding-top: 104px !important;
              }
              .dashboard-hero {
                font-size: clamp(36px, 12vw, 52px) !important;
              }
              .dashboard-filter-row {
                gap: 8px !important;
              }
              .dashboard-featured {
                flex-direction: column !important;
              }
              .dashboard-featured-card {
                padding: 22px 20px !important;
              }
              .dashboard-grid {
                grid-template-columns: 1fr !important;
              }
              .dashboard-stats-grid {
                grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
              }
            }
            @media (max-width: 640px) {
              .dashboard-shell {
                padding-top: 110px !important;
              }
              .dashboard-hero {
                font-size: 36px !important;
              }
              .dashboard-stats-row {
                gap: 8px !important;
              }
              .dashboard-stat-pill {
                font-size: 11px !important;
                padding: 6px 12px !important;
              }
              .dashboard-filter-row {
                display: flex !important;
                flex-wrap: wrap !important;
                gap: 8px !important;
              }
            }
          `}</style>
          <div style={{ marginBottom: 36 }}>
            <div style={{ fontFamily: "Raleway, sans-serif", fontSize: 11, color: "#888", letterSpacing: "2px", textTransform: "uppercase" }}>
              Welcome back
            </div>
            <div className="dashboard-hero" style={{ fontFamily: '"Courier New", Courier, monospace', fontSize: 52, fontWeight: 600, color: "#1a1a1a", lineHeight: 1, marginTop: 4 }}>
              {displayName}
            </div>
            {searchQuery ? (
              <div style={{ marginTop: 10, display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                <div style={{ fontFamily: "Raleway, sans-serif", fontSize: 13, color: "#666" }}>
                  Showing results for "{searchQuery}"
                </div>
                <button
                  type="button"
                  onClick={() => navigate("/", { replace: true })}
                  className="premium-button"
                  style={{
                    border: "none",
                    background: "#fff",
                    color: "#2D6A4F",
                    borderRadius: 999,
                    padding: "6px 12px",
                    fontFamily: "Raleway, sans-serif",
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  Clear search
                </button>
              </div>
            ) : null}

            <div className="dashboard-stats-row" style={{ display: "flex", gap: 10, marginTop: 16, flexWrap: "wrap" }}>
              <StatPill icon={<Tree size={14} color="#2D6A4F" weight="duotone" />} text={`${totalTreesPlanted} Trees`} />
              <StatPill icon={<Leaf size={14} color="#2D6A4F" weight="duotone" />} text={`${totalNodesMastered} Nodes Mastered`} />
              <StatPill icon={<Fire size={14} color="#2D6A4F" weight="duotone" />} text={`${bestStreak} Day Streak`} />
            </div>

            <div style={{ marginTop: 24, borderBottom: "1px solid rgba(0,0,0,0.08)" }} />
          </div>

          <div className="dashboard-filter-row" style={{ display: "flex", gap: 10, marginTop: 8, marginBottom: 32, flexWrap: "wrap" }}>
            {[
              {
                label: "All",
                icon: <Funnel size={13} weight="duotone" />,
                activeStyle: { background: "#1a1a1a", color: "#fff", borderColor: "#1a1a1a" },
                inactiveStyle: { background: "#fff", color: "#888", borderColor: "rgba(0,0,0,0.1)", boxShadow: "0 2px 8px rgba(0,0,0,0.05)" },
              },
              {
                label: "Growing",
                icon: <TreeEvergreen size={13} weight="duotone" color="#2D6A4F" />,
                activeStyle: { background: "#e8f5ee", color: "#2D6A4F", borderColor: "#2D6A4F" },
                inactiveStyle: { background: "#fff", color: "#2D6A4F", borderColor: "#c8e6c9", boxShadow: "0 2px 8px rgba(0,0,0,0.05)" },
              },
              {
                label: "Wilting",
                icon: <Drop size={13} weight="duotone" color="#D4A017" />,
                activeStyle: { background: "#fff8e6", color: "#D4A017", borderColor: "#D4A017" },
                inactiveStyle: { background: "#fff", color: "#D4A017", borderColor: "#f5e6b0", boxShadow: "0 2px 8px rgba(0,0,0,0.05)" },
              },
              {
                label: "Dormant",
                icon: <Moon size={13} weight="duotone" color="#888" />,
                activeStyle: { background: "#f5f5f5", color: "#888", borderColor: "#888" },
                inactiveStyle: { background: "#fff", color: "#888", borderColor: "rgba(0,0,0,0.1)", boxShadow: "0 2px 8px rgba(0,0,0,0.05)" },
              },
            ].map(({ label, icon, activeStyle, inactiveStyle }) => {
              const selected = selectedFilter === label;
              const styles = selected ? activeStyle : inactiveStyle;
              return (
              <button
                className="premium-button"
                key={label}
                  type="button"
                  onClick={() => setSelectedFilter(label)}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    borderRadius: 999,
                    padding: "8px 18px",
                    cursor: "pointer",
                    fontFamily: "Raleway, sans-serif",
                    fontSize: 13,
                    fontWeight: 500,
                    transition: "all 0.15s ease",
                    border: "1px solid transparent",
                    ...styles,
                  }}
                >
                  {icon}
                  <span>{label}</span>
                </button>
              );
            })}
          </div>

          {featuredTrees.length > 0 && (
            <section style={{ marginBottom: 36, animation: "dashboardFadeUp 420ms ease both" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div style={{ fontFamily: "Raleway, sans-serif", fontSize: 11, color: "#888", letterSpacing: "1.5px", textTransform: "uppercase" }}>
                Pick up where you left off
              </div>
              <button
                className="premium-button"
                type="button"
                onClick={() => {
                  setSelectedFilter("All");
                  document.getElementById("your-forest-grid")?.scrollIntoView({ behavior: "smooth", block: "start" });
                }}
                style={{ border: "none", background: "transparent", padding: 0, cursor: "pointer", fontFamily: "Raleway, sans-serif", fontSize: 12, color: "#52B788" }}
              >
                See all →
              </button>
            </div>

              <div className="dashboard-featured" style={{ display: "flex", gap: 20 }}>
                {featuredTrees.map((tree) => {
                  const status = getStatusMeta(tree.hoursSinceActive ?? 0);
                  const progress = getProgress(tree);
                  return (
                    <div
                      className="dashboard-featured-card"
                      key={tree.id}
                      style={{
                        flex: 1,
                        background: "#fff",
                        borderRadius: 20,
                        padding: "28px 32px",
                        boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
                        border: "1px solid rgba(0,0,0,0.04)",
                        borderLeft: `4px solid ${status.accent}`,
                        position: "relative",
                        overflow: "hidden",
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16 }}>
                        <div
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            borderRadius: 999,
                            padding: "4px 12px",
                            background: status.tagBg,
                            color: status.text,
                            fontFamily: "Raleway, sans-serif",
                            fontSize: 11,
                            fontWeight: 600,
                          }}
                        >
                          {status.label}
                        </div>
                        <div style={{ fontFamily: "Raleway, sans-serif", fontSize: 11, color: "#bbb" }}>
                          Last active {tree.last_active ? new Date(tree.last_active).toLocaleDateString() : ""}
                        </div>
                      </div>

                      <div
                        style={{
                          margin: "12px 0 8px",
                          fontFamily: '"Courier New", Courier, monospace',
                          fontSize: 32,
                          fontWeight: 600,
                          color: "#1a1a1a",
                          textTransform: "capitalize",
                          lineHeight: 1.02,
                        }}
                      >
                        {tree.topic}
                      </div>

                      <div style={{ height: 4, background: "#e8ede9", borderRadius: 999, marginBottom: 6, overflow: "hidden" }}>
                        <div style={{ height: "100%", width: `${progress}%`, background: status.fill, borderRadius: 999 }} />
                      </div>
                      <div style={{ fontFamily: "Raleway, sans-serif", fontSize: 11, color: "#aaa", marginBottom: 20 }}>
                        {tree.completed_count || 0} of {tree.node_count || 0} nodes mastered
                      </div>

                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6, fontFamily: "Raleway, sans-serif", fontSize: 12, color: "#555" }}>
                          <Fire size={14} weight="duotone" color="#D4A017" />
                          {tree.streak_days || 0} day streak
                        </div>
                        <button
                          className="premium-button"
                          type="button"
                          onClick={() => navigate(`/tree/${tree.id}`)}
                          style={{
                            background: "#1a1a1a",
                            color: "#fff",
                            borderRadius: 999,
                            padding: "10px 24px",
                            fontFamily: "Raleway, sans-serif",
                            fontSize: 13,
                            fontWeight: 600,
                            cursor: "pointer",
                            border: "none",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 8,
                          }}
                        >
                          <ArrowRight size={13} weight="duotone" />
                          Resume
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          <section id="your-forest-grid">
            <div style={{ fontFamily: "Raleway, sans-serif", fontSize: 11, color: "#888", letterSpacing: "1.5px", textTransform: "uppercase", marginBottom: 16 }}>
              Your Forest
            </div>

            {filteredTrees.length === 0 ? (
              <div style={{ textAlign: "center", padding: "80px 0" }}>
                <Leaf size={52} color="#c8d8c8" weight="duotone" style={{ margin: "0 auto" }} />
                <div style={{ fontFamily: '"Courier New", Courier, monospace', fontSize: 32, color: "#1a1a1a", marginTop: 20 }}>
                  {searchQuery ? "No matches found" : "Your forest is empty"}
                </div>
                <div style={{ fontFamily: "Raleway, sans-serif", fontSize: 14, color: "#888", marginTop: 8 }}>
                  {searchQuery ? "Try a broader search or clear it to see everything again" : "Plant your first seed to begin growing"}
                </div>
                <div style={{ display: "flex", justifyContent: "center", gap: 12, marginTop: 24, flexWrap: "wrap" }}>
                  <button
                    className="premium-button"
                    type="button"
                    onClick={() => navigate("/new")}
                    style={{
                      background: "#1a1a1a",
                      color: "#fff",
                      borderRadius: 999,
                      padding: "13px 32px",
                      fontFamily: "Raleway, sans-serif",
                      fontSize: 14,
                      fontWeight: 600,
                      cursor: "pointer",
                      border: "none",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 8,
                    }}
                  >
                    <Leaf size={14} weight="duotone" />
                    Plant a seed
                  </button>
                  {searchQuery ? (
                    <button
                      type="button"
                      onClick={() => navigate("/", { replace: true })}
                      style={{
                        background: "#fff",
                        color: "#2D6A4F",
                        borderRadius: 999,
                        padding: "13px 32px",
                        fontFamily: "Raleway, sans-serif",
                        fontSize: 14,
                        fontWeight: 600,
                        cursor: "pointer",
                        border: "1px solid rgba(45,106,79,0.2)",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 8,
                      }}
                    >
                      Clear search
                    </button>
                  ) : null}
                </div>
              </div>
            ) : (
              <div className="dashboard-grid" style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 18 }}>
                {filteredTrees.map((tree) => (
                  <TreeCard
                    key={tree.id}
                    tree={tree}
                    onContinue={(id) => navigate(`/tree/${id}`)}
                    onDelete={handleDeleteTree}
                  />
                ))}
              </div>
            )}
          </section>
        </main>

        <aside
          className="dashboard-sidebar"
          style={{
            width: 300,
            flexShrink: 0,
            position: "sticky",
            top: 112,
            alignSelf: "flex-start",
            display: "flex",
            flexDirection: "column",
            gap: 16,
          }}
        >
          <div style={{ background: "#fff", borderRadius: 20, padding: 24, boxShadow: "0 2px 12px rgba(0,0,0,0.06)", animation: "dashboardFadeUp 420ms ease both" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <HoverIconButton
                icon={<UserCircle size={20} color="currentColor" weight="duotone" />}
                label="Open profile"
                onClick={() => navigate("/profile")}
              />
              <HoverIconButton
                icon={<Gear size={20} color="currentColor" weight="duotone" />}
                label="Profile settings"
                onClick={() => navigate("/profile")}
              />
            </div>
            <div
              style={{
                width: 52,
                height: 52,
                borderRadius: "50%",
                background: "linear-gradient(135deg, #2D6A4F, #52B788)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: '"Courier New", Courier, monospace',
                fontSize: 22,
                color: "#fff",
                margin: "12px 0 8px 0",
              }}
            >
              {email ? email[0].toUpperCase() : "?"}
            </div>
            <div style={{ fontFamily: "Raleway, sans-serif", fontSize: 12, color: "#888" }}>{email || "Learner"}</div>

            <div className="dashboard-stats-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, marginTop: 16 }}>
              <StatCell value={totalTreesPlanted} label="Trees Planted" />
              <StatCell value={totalNodesMastered} label="Nodes Mastered" />
              <StatCell value={bestStreak} label="Best Streak" />
            </div>
          </div>

          <div style={{ background: "#fff", borderRadius: 20, padding: 24, boxShadow: "0 2px 12px rgba(0,0,0,0.06)", animation: "dashboardFadeUp 520ms ease both" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div style={{ fontFamily: "Raleway, sans-serif", fontSize: 11, color: "#888", letterSpacing: "1.5px", textTransform: "uppercase" }}>
                This Week
              </div>
              <HoverIconButton icon={<Sparkle size={14} color="currentColor" weight="duotone" />} label="Weekly activity" />
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              {weekDays.map((day, index) => {
                const active = activeDaySet.has(weekDates[index].toDateString());
                return (
                  <div key={day} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                    <div style={{ fontFamily: "Raleway, sans-serif", fontSize: 10, color: "#aaa" }}>{day}</div>
                    <div
                      style={{
                        width: 30,
                        height: 30,
                        borderRadius: "50%",
                        background: active ? "#2D6A4F" : "#f0f4f1",
                        boxShadow: active ? "0 2px 8px rgba(45,106,79,0.25)" : "none",
                      }}
                    />
                  </div>
                );
              })}
            </div>
          </div>

          <div style={{ background: "#fff", borderRadius: 20, padding: 24, boxShadow: "0 2px 12px rgba(0,0,0,0.06)", animation: "dashboardFadeUp 620ms ease both" }}>
            <div style={{ fontFamily: "Raleway, sans-serif", fontSize: 11, color: "#888", letterSpacing: "1.5px", textTransform: "uppercase", marginBottom: 14 }}>
              Quick Actions
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <button
                className="premium-button"
                type="button"
                onClick={() => navigate("/new")}
                style={{
                  width: "100%",
                  background: "#1a1a1a",
                  color: "#fff",
                  borderRadius: 999,
                  padding: "12px",
                  fontFamily: "Raleway, sans-serif",
                  fontSize: 13,
                  fontWeight: 600,
                  textAlign: "center",
                  cursor: "pointer",
                  border: "none",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                }}
              >
                <Leaf size={14} weight="duotone" />
                Plant new seed
              </button>
              <button
                type="button"
                onClick={() => navigate("/profile")}
                style={{
                  width: "100%",
                  background: "#f0f4f1",
                  color: "#555",
                  borderRadius: 999,
                  padding: "12px",
                  fontFamily: "Raleway, sans-serif",
                  fontSize: 13,
                  fontWeight: 500,
                  textAlign: "center",
                  cursor: "pointer",
                  border: "1px solid rgba(0,0,0,0.08)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                }}
              >
                <UserCircle size={14} weight="duotone" />
                View profile
              </button>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
