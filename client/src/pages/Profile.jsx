import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getProfileStats } from "../lib/api";
import { supabase } from "../lib/supabase";

function formatDate(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString();
}

function StatCard({ label, value, sublabel }) {
  return (
    <div
      className="animate-fadeIn"
      style={{
        background: "#fff",
        borderRadius: 16,
        padding: 20,
        boxShadow: "0 2px 10px rgba(0,0,0,0.05)",
        border: "1px solid rgba(0,0,0,0.04)",
      }}
    >
      <div style={{ fontFamily: "Raleway, sans-serif", fontSize: 11, color: "#888", textTransform: "uppercase", letterSpacing: "1px", marginBottom: 8 }}>
        {label}
      </div>
      <div style={{ fontFamily: '"Courier New", Courier, monospace', fontSize: 32, fontWeight: 600, color: "#1a1a1a", lineHeight: 1 }}>
        {value}
      </div>
      {sublabel ? (
        <div style={{ marginTop: 6, fontFamily: "Raleway, sans-serif", fontSize: 11, color: "#aaa" }}>
          {sublabel}
        </div>
      ) : null}
    </div>
  );
}

function TreeRow({ item, onView }) {
  const status = item.status || "Dormant";
  const dotColor =
    status === "Growing" ? "#52B788" : status === "Wilting" ? "#D4A017" : "#e05252";
  const hasTarget = !!item.treeId;

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 16,
        padding: "16px 24px",
        borderTop: "1px solid rgba(0,0,0,0.04)",
        transition: "background 0.15s ease",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = "#f9fafa";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = "#fff";
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 16, minWidth: 0 }}>
        <span style={{ width: 8, height: 8, borderRadius: "50%", background: dotColor, flexShrink: 0 }} />
        <div style={{ minWidth: 0 }}>
          <div style={{ fontFamily: '"Courier New", Courier, monospace', fontSize: 18, fontWeight: 600, color: "#1a1a1a", textTransform: "capitalize", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {item.topic || "Untitled tree"}
          </div>
        </div>
      </div>

      <div style={{ fontFamily: "Raleway, sans-serif", fontSize: 13, color: "#888", whiteSpace: "nowrap" }}>
        {item.detail || "Recent activity"}
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
        <div style={{ fontFamily: "Raleway, sans-serif", fontSize: 12, color: "#aaa", whiteSpace: "nowrap" }}>
          {formatDate(item.lastActive || item.completedAt)}
        </div>
        <button
          type="button"
          onClick={() => hasTarget && onView(item)}
          disabled={!hasTarget}
          style={{
            background: "#1a1a1a",
            color: "#fff",
            borderRadius: 999,
            padding: "6px 16px",
            fontFamily: "Raleway, sans-serif",
            fontSize: 12,
            fontWeight: 600,
            cursor: "pointer",
            border: "none",
            opacity: hasTarget ? 1 : 0.45,
          }}
        >
          View →
        </button>
      </div>
    </div>
  );
}

export default function Profile() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const session = await supabase.auth.getSession();
        if (mounted) setEmail(session.data.session?.user?.email || "");
        const data = await getProfileStats();
        if (mounted) setStats(data);
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

  const trees = useMemo(() => {
    const activity = Array.isArray(stats?.recentActivity) ? stats.recentActivity : [];
    return activity
      .map((item) => ({
        treeId: item.treeId,
        topic: item.topic || "Untitled tree",
        completedAt: item.completedAt,
        lastActive: item.completedAt,
        status: "Growing",
        detail: item.nodeTitle ? `Last update: ${item.nodeTitle}` : "Recent completion",
      }))
      .sort((a, b) => new Date(b.lastActive || 0) - new Date(a.lastActive || 0));
  }, [stats?.recentActivity]);

  const avatarLetter = (email || "Y")[0].toUpperCase();
  const totalTrees = stats?.treesPlanted || 0;
  const nodesMastered = stats?.nodesMastered || 0;
  const bestStreak = stats?.bestStreak || 0;
  const activeTrees = stats?.activeTrees || 0;

  return (
    <div
      style={{
        minHeight: "100vh",
        width: "100%",
        background: "#f0f4f1",
        paddingTop: 120,
        boxSizing: "border-box",
      }}
    >
      <div style={{ maxWidth: 900, margin: "0 auto", padding: "0 24px 60px" }}>
        {loading ? (
          <div style={{ minHeight: "50vh", display: "grid", placeItems: "center" }}>
            <div style={{ width: 28, height: 28, borderRadius: "50%", border: "2px solid rgba(0,0,0,0.12)", borderTopColor: "#52B788", animation: "spin 1s linear infinite" }} />
          </div>
        ) : (
          <>
            <style>{`
              @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
              @media (max-width: 720px) {
                .profile-stats-grid { grid-template-columns: repeat(2, minmax(0, 1fr)) !important; }
                .profile-history-row { align-items: flex-start !important; flex-direction: column !important; }
                .profile-history-left { width: 100% !important; }
                .profile-history-meta { width: 100% !important; justify-content: space-between !important; }
              }
            `}</style>

            <div
              style={{
                background: "#fff",
                borderRadius: 24,
                padding: 32,
                boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
                border: "1px solid rgba(0,0,0,0.04)",
                display: "flex",
                alignItems: "center",
                gap: 24,
                marginBottom: 24,
              }}
            >
              <div
                style={{
                  width: 72,
                  height: 72,
                  borderRadius: "50%",
                  background: "linear-gradient(135deg, #2D6A4F, #52B788)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontFamily: '"Courier New", Courier, monospace',
                  fontSize: 32,
                  color: "#fff",
                  flexShrink: 0,
                }}
              >
                {avatarLetter}
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 4, minWidth: 0 }}>
                <div style={{ fontFamily: '"Courier New", Courier, monospace', fontSize: 28, fontWeight: 600, color: "#1a1a1a", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {email || "your profile"}
                </div>
                <div style={{ fontFamily: "Raleway, sans-serif", fontSize: 13, color: "#888" }}>
                  Growing knowledge since you planted your first seed
                </div>
              </div>
            </div>

            <section
              className="profile-stats-grid"
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(4, 1fr)",
                gap: 16,
                marginBottom: 24,
              }}
            >
              <StatCard label="Trees Planted" value={totalTrees} sublabel="All trees created" />
              <StatCard label="Nodes Mastered" value={nodesMastered} sublabel="Completed lessons" />
              <StatCard label="Best Streak" value={bestStreak} sublabel="Longest active streak" />
              <StatCard label="Active Trees" value={activeTrees} sublabel="Growing or wilting" />
            </section>

            <section
              style={{
                background: "#fff",
                borderRadius: 20,
                padding: 8,
                boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
                border: "1px solid rgba(0,0,0,0.04)",
                overflow: "hidden",
              }}
            >
              <div style={{ padding: "20px 24px 12px", fontFamily: "Raleway, sans-serif", fontSize: 11, color: "#888", textTransform: "uppercase", letterSpacing: "1.5px" }}>
                Your Forest
              </div>

              {trees.length === 0 ? (
                <div style={{ textAlign: "center", padding: "60px 24px" }}>
                  <div style={{ fontFamily: '"Courier New", Courier, monospace', fontSize: 22, color: "#1a1a1a" }}>
                    Nothing planted yet
                  </div>
                  <div style={{ marginTop: 8, fontFamily: "Raleway, sans-serif", fontSize: 13, color: "#888" }}>
                    Your learning history will appear here
                  </div>
                </div>
              ) : (
                trees.map((tree, index) => (
                  <TreeRow
                    key={`${tree.topic}-${tree.completedAt || index}`}
                    item={tree}
                    onView={() => navigate(`/tree/${tree.treeId || tree.id || ""}`)}
                  />
                ))
              )}
            </section>
          </>
        )}
      </div>
    </div>
  );
}
