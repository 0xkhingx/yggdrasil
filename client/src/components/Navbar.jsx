import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ArrowSquareOut, Gear, House, Leaf, Lightning, List, MagnifyingGlass, Plus, UserCircle, X } from "@phosphor-icons/react";
import Logo from "../components/Logo";
import { getTrees } from "../lib/api";
import { supabase } from "../lib/supabase";

function getPageLabel(pathname) {
  if (pathname.startsWith("/tree/")) return "Growing";
  if (pathname === "/new") return "New Seed";
  if (pathname === "/profile") return "Profile";
  if (pathname === "/") return "My Forest";
  return "";
}

function HoverTip({ children }) {
  return (
    <span
      className="navbar-icon-tip"
      style={{
        position: "absolute",
        top: -34,
        left: "50%",
        transform: "translateX(-50%) translateY(4px)",
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
      }}
    >
      {children}
    </span>
  );
}

function IconAction({ children, label, onClick, title, style = {}, tooltip = true, className = "" }) {
  return (
    <div className={`navbar-action ${className}`.trim()} style={{ position: "relative" }}>
      <button type="button" onClick={onClick} title={title || label} aria-label={label} style={style}>
        {children}
      </button>
      {tooltip ? <HoverTip>{label}</HoverTip> : null}
    </div>
  );
}

export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const moreMenuRef = useRef(null);
  const searchInputRef = useRef(null);
  const [email, setEmail] = useState("");
  const [session, setSession] = useState(null);
  const [moreOpen, setMoreOpen] = useState(false);
  const [trees, setTrees] = useState([]);
  const [searchOpen, setSearchOpen] = useState(false);
  const searchParams = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const searchQuery = searchParams.get("q") || "";
  const normalizedQuery = searchQuery.trim().toLowerCase();

  useEffect(() => {
    let active = true;
    async function loadSession() {
      const { data } = await supabase.auth.getSession();
      if (!active) return;
      setSession(data.session || null);
      setEmail(data.session?.user?.email || "");
    }
    loadSession();

    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession || null);
      setEmail(nextSession?.user?.email || "");
    });

    return () => {
      active = false;
      listener?.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    setMoreOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (location.pathname !== "/") return;
    let active = true;
    getTrees()
      .then((data) => {
        if (active) setTrees(data.trees || []);
      })
      .catch(() => {
        if (active) setTrees([]);
      });
    return () => {
      active = false;
    };
  }, [location.pathname, session]);

  useEffect(() => {
    if (searchInputRef.current && document.activeElement !== searchInputRef.current) {
      searchInputRef.current.value = searchQuery;
    }
  }, [searchQuery]);

  useEffect(() => {
    function handlePointerDown(event) {
      if (!moreMenuRef.current?.contains(event.target)) {
        setMoreOpen(false);
      }
    }

    window.addEventListener("pointerdown", handlePointerDown);
    return () => window.removeEventListener("pointerdown", handlePointerDown);
  }, []);

  const pageLabel = getPageLabel(location.pathname);
  const avatarLetter = (email || "?")[0].toUpperCase();

  function updateSearch(nextValue) {
    const value = nextValue.trim();
    const params = new URLSearchParams(location.search);
    if (value) params.set("q", value);
    else params.delete("q");
    const nextSearch = params.toString();
    const nextPath = location.pathname === "/" ? `/${nextSearch ? `?${nextSearch}` : ""}` : `/${nextSearch ? `?${nextSearch}` : ""}`;
    navigate(nextPath, { replace: true });
  }

  const suggestions = useMemo(() => {
    if (!normalizedQuery) return [];
    return trees
      .filter((tree) => {
        const haystack = [tree.topic, tree.streak_days, tree.completed_count, tree.node_count]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        return haystack.includes(normalizedQuery);
      })
      .slice(0, 5);
  }, [normalizedQuery, trees]);

  const matchCount = useMemo(() => {
    if (!normalizedQuery) return 0;
    return trees.filter((tree) => {
      const haystack = [tree.topic, tree.streak_days, tree.completed_count, tree.node_count]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(normalizedQuery);
    }).length;
  }, [normalizedQuery, trees]);

  if (location.pathname === "/auth") return null;
  if (location.pathname === "/" && !session) return null;

  return (
    <div
      className="animate-riseIn"
      style={{
        position: "fixed",
        top: 16,
        left: 24,
        right: 24,
        zIndex: 1000,
        pointerEvents: "none",
      }}
    >
      <style>{`
        @keyframes navbarFadeUp {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes navbarNudge {
          0%, 100% { transform: translateY(0) scale(1); }
          50% { transform: translateY(-1px) scale(1.02); }
        }
        .navbar-shell {
          animation: navbarFadeUp 420ms ease both;
        }
        .navbar-item {
          transition: transform 180ms var(--motion-ease-out), box-shadow 180ms var(--motion-ease-out), background-color 180ms var(--motion-ease-out), color 180ms var(--motion-ease-out), border-color 180ms var(--motion-ease-out);
        }
        .navbar-item:hover {
          transform: translateY(-2px);
        }
        .navbar-item:active {
          transform: translateY(0) scale(0.98);
        }
        .navbar-action:hover .navbar-icon-tip {
          opacity: 1;
          transform: translateX(-50%) translateY(0);
        }
        .navbar-more-menu {
          animation: navbarFadeUp 180ms var(--motion-ease-out) both;
        }
        .navbar-more-item:hover {
          background: #f4f7f5;
        }
        .navbar-pill:hover .navbar-pill-arrow {
          transform: translateX(3px);
        }
        .navbar-pill:hover .navbar-pill-dot {
          animation: navbarNudge 900ms ease-in-out infinite;
        }
        .navbar-menu-button:hover .navbar-menu-icon {
          transform: rotate(90deg) scale(1.04);
        }
        .navbar-avatar {
          transition: transform 180ms var(--motion-ease-out), box-shadow 180ms var(--motion-ease-out);
        }
        .navbar-avatar:hover {
          transform: translateY(-1px) scale(1.04);
          box-shadow: 0 8px 16px rgba(45,106,79,0.22);
        }
        .navbar-search {
          position: relative;
          transition: transform 180ms var(--motion-ease-out), box-shadow 180ms var(--motion-ease-out), background-color 180ms var(--motion-ease-out), border-color 180ms var(--motion-ease-out);
        }
        .navbar-search:focus-within {
          transform: translateX(-50%) translateY(-1px);
          box-shadow: 0 8px 20px rgba(0,0,0,0.1);
          border-color: rgba(82,183,136,0.25) !important;
        }
        .navbar-search-clear {
          opacity: 0;
          transform: translateX(3px) scale(0.96);
          transition: opacity 160ms var(--motion-ease-out), transform 160ms var(--motion-ease-out), background-color 160ms var(--motion-ease-out);
        }
        .navbar-search:hover .navbar-search-clear,
        .navbar-search:focus-within .navbar-search-clear {
          opacity: 1;
          transform: translateX(0) scale(1);
        }
        .navbar-search-results {
          position: absolute;
          left: 0;
          right: 0;
          top: calc(100% + 10px);
          background: rgba(255,255,255,0.96);
          border: 1px solid rgba(0,0,0,0.08);
          border-radius: 18px;
          box-shadow: 0 18px 40px rgba(0,0,0,0.12);
          overflow: hidden;
          backdrop-filter: blur(8px);
        }
        .navbar-search-result {
          width: 100%;
          border: none;
          background: transparent;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          padding: 12px 14px;
          cursor: pointer;
          text-align: left;
        }
        .navbar-search-result:hover {
          background: rgba(82,183,136,0.06);
        }
        @media (max-width: 920px) {
          .navbar-root {
            top: 10px !important;
            left: 10px !important;
            right: 10px !important;
          }
          .navbar-inner {
            flex-wrap: wrap;
            gap: 10px;
          }
          .navbar-left,
          .navbar-right {
            width: 100%;
            justify-content: space-between;
          }
          .navbar-search {
            position: static !important;
            transform: none !important;
            width: 100%;
            min-width: 0 !important;
            order: 3;
          }
          .navbar-search-results {
            left: 0;
            right: 0;
          }
          .navbar-item button,
          .navbar-avatar,
          .navbar-menu-button {
            width: 40px !important;
            height: 40px !important;
          }
          .navbar-plant {
            padding: 8px 14px !important;
          }
          .navbar-pill {
            display: none !important;
          }
        }
        @media (max-width: 640px) {
          .navbar-search { display: none !important; }
          .navbar-pill { display: none !important; }
          .navbar-plant { display: none !important; }
          .navbar-right > .navbar-action:nth-child(1) { display: none !important; }
          .navbar-right > .navbar-action:nth-child(3) { display: none !important; }
          .navbar-mobile-add { display: none !important; }
          .navbar-avatar { display: none !important; }
          .navbar-inner { flex-wrap: nowrap !important; }
          .navbar-left,
          .navbar-right { width: auto !important; }
        }
      `}</style>

      <div
        className="premium-panel navbar-root"
        style={{
          position: "relative",
          maxWidth: 1200,
          width: "100%",
          margin: "0 auto",
          background: "rgba(240,244,241,0.6)",
          backdropFilter: "blur(8px)",
          WebkitBackdropFilter: "blur(8px)",
          borderRadius: 999,
          padding: "8px 16px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
          border: "1px solid rgba(255,255,255,0.5)",
          pointerEvents: "auto",
        }}
      >
        <div className="navbar-shell navbar-inner" style={{ display: "flex", width: "100%", alignItems: "center", justifyContent: "space-between", position: "relative" }}>
          <div className="navbar-left" style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <button
              className="premium-button navbar-item"
              type="button"
              onClick={() => navigate(session ? "/" : "/auth")}
              style={{ border: "none", background: "transparent", padding: 0, cursor: "pointer" }}
              aria-label="Go home"
            >
              <Logo />
            </button>

            <IconAction
              className="navbar-pill"
              label="Current page"
              title="Current page"
              tooltip
              onClick={() => {
                if (location.pathname.startsWith("/tree/")) navigate("/");
                else if (location.pathname === "/profile") navigate("/profile");
                else if (location.pathname === "/new") navigate("/new");
                else navigate(session ? "/" : "/auth");
              }}
              style={{
                background: "rgba(0,0,0,0.06)",
                borderRadius: 999,
                padding: "6px 14px",
                display: "flex",
                alignItems: "center",
                gap: 6,
                cursor: "pointer",
                border: "none",
                color: "#444",
                fontFamily: "Raleway, sans-serif",
                fontSize: 13,
                transition: "transform 0.18s ease, box-shadow 0.18s ease, background 0.18s ease",
              }}
            >
              <span>{pageLabel}</span>
              <span className="navbar-pill-arrow" style={{ lineHeight: 1, transition: "transform 180ms var(--motion-ease-out)" }}>∨</span>
            </IconAction>
          </div>

          <div
            className="premium-panel navbar-action navbar-item navbar-search"
            style={{
              position: "absolute",
              left: "50%",
              transform: "translateX(-50%)",
              display: "flex",
              alignItems: "center",
              gap: 10,
              minWidth: 280,
              background: "rgba(0,0,0,0.06)",
              borderRadius: 999,
              padding: "8px 20px",
              border: "1px solid rgba(0,0,0,0.06)",
              boxSizing: "border-box",
              transition: "transform 0.18s ease, box-shadow 0.18s ease",
            }}
            onFocusCapture={() => setSearchOpen(true)}
            onBlurCapture={(e) => {
              if (!e.currentTarget.contains(e.relatedTarget)) setSearchOpen(false);
            }}
          >
            <MagnifyingGlass size={14} color="#888" weight="duotone" />
            <input
              ref={searchInputRef}
              type="text"
              defaultValue={searchQuery}
              placeholder="Search your forest..."
              aria-label="Search your forest"
              onChange={(e) => updateSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Escape") updateSearch("");
                if (e.key === "Enter") e.currentTarget.blur();
              }}
              style={{
                flex: 1,
                border: "none",
                outline: "none",
                background: "transparent",
                fontFamily: "Raleway, sans-serif",
                fontSize: 13,
                color: "#444",
                minWidth: 0,
              }}
            />
            {normalizedQuery ? (
              <span style={{ fontFamily: "Raleway, sans-serif", fontSize: 11, color: "#777", whiteSpace: "nowrap", flexShrink: 0 }}>
                {matchCount} match{matchCount === 1 ? "" : "es"}
              </span>
            ) : null}
            {searchQuery ? (
              <button
                type="button"
                className="navbar-search-clear"
                onClick={() => updateSearch("")}
                aria-label="Clear search"
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: "50%",
                  border: "none",
                  background: "rgba(0,0,0,0.06)",
                  color: "#666",
                  display: "grid",
                  placeItems: "center",
                  cursor: "pointer",
                  flexShrink: 0,
                }}
              >
                ×
              </button>
            ) : (
            <span
              className="navbar-pill-dot"
              style={{
                width: 22,
                height: 22,
                borderRadius: "50%",
                background: "linear-gradient(135deg, #52B788, #2D6A4F)",
                flexShrink: 0,
              }}
            />
            )}
            {searchOpen && normalizedQuery && location.pathname === "/" && suggestions.length > 0 ? (
              <div className="navbar-search-results">
                {suggestions.map((tree) => (
                  <button
                    key={tree.id}
                    type="button"
                    className="navbar-search-result"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => {
                      updateSearch("");
                      navigate(`/tree/${tree.id}`);
                    }}
                  >
                    <span style={{ minWidth: 0 }}>
                      <span style={{ display: "block", fontFamily: "Raleway, sans-serif", fontSize: 12, color: "#666" }}>{tree.topic}</span>
                      <span style={{ display: "block", fontFamily: "Raleway, sans-serif", fontSize: 10, color: "#9aa" }}>
                        {tree.completed_count || 0}/{tree.node_count || 0} mastered
                      </span>
                    </span>
                    <span style={{ fontFamily: "Raleway, sans-serif", fontSize: 10, color: "#888", whiteSpace: "nowrap" }}>
                      {tree.streak_days || 0} day streak
                    </span>
                  </button>
                ))}
              </div>
            ) : null}
          </div>

          <div className="navbar-right" style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <IconAction
              className="navbar-item"
              label="New seed"
              onClick={() => navigate("/new")}
              style={{
                width: 32,
                height: 32,
                borderRadius: "50%",
                background: "rgba(0,0,0,0.06)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                color: "#52B788",
                fontSize: 15,
                border: "none",
                transition: "all 0.18s ease",
              }}
            >
              <Lightning size={16} color="#52B788" weight="duotone" />
            </IconAction>

            <IconAction
              className="navbar-item navbar-plant"
              label="Plant new seed"
              onClick={() => navigate("/new")}
              style={{
                background: "#1a1a1a",
                color: "#fff",
                borderRadius: 999,
                padding: "6px 18px",
                fontFamily: "Raleway, sans-serif",
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
                border: "none",
                display: "inline-flex",
                alignItems: "center",
                transition: "transform 0.18s ease, box-shadow 0.18s ease, background 0.18s ease",
              }}
            >
              <Leaf size={12} weight="duotone" style={{ marginRight: 6 }} />
              Plant
            </IconAction>

            <IconAction
              className="navbar-item"
              label="Profile settings"
              onClick={() => navigate("/profile")}
              style={{
                width: 32,
                height: 32,
                borderRadius: "50%",
                background: "rgba(0,0,0,0.06)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                color: "#888",
                fontSize: 15,
                border: "none",
                transition: "all 0.18s ease",
              }}
            >
              <Gear size={16} color="#888" weight="duotone" />
            </IconAction>

            <button
              type="button"
              className="navbar-mobile-add"
              onClick={() => navigate("/new")}
              aria-label="Add new"
              style={{
                width: 36,
                height: 36,
                borderRadius: "50%",
                background: "rgba(0,0,0,0.06)",
                display: "none",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                border: "none",
                flexShrink: 0,
              }}
            >
              <Plus size={18} weight="bold" color="#1a1a1a" />
            </button>
            <button
              className="navbar-avatar"
              type="button"
              onClick={() => navigate("/profile")}
              title="Profile"
              style={{
                width: 30,
                height: 30,
                borderRadius: "50%",
                background: "linear-gradient(135deg, #2D6A4F, #52B788)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: "Raleway, sans-serif",
                fontSize: 11,
                fontWeight: 600,
                color: "#fff",
                border: "none",
                cursor: "pointer",
              }}
              aria-label="Profile"
            >
              {avatarLetter}
            </button>

            <div ref={moreMenuRef} className="navbar-action" style={{ position: "relative" }}>
              <button
                className="navbar-menu-button navbar-item"
                type="button"
                onClick={() => setMoreOpen((next) => !next)}
                title="More"
                aria-label="More"
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: "50%",
                  background: "rgba(0,0,0,0.06)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  color: "#888",
                  fontSize: 15,
                  border: "none",
                  transition: "all 0.18s ease",
                }}
              >
                <span style={{ display: "flex", transition: "transform 0.25s ease", transform: moreOpen ? "rotate(90deg)" : "rotate(0deg)" }}>
                  {moreOpen ? <X size={16} color="#888" weight="duotone" /> : <List className="navbar-menu-icon" size={16} color="#888" weight="duotone" />}
                </span>
              </button>
              <HoverTip>More</HoverTip>

              {moreOpen ? (
                <div
                  className="navbar-more-menu"
                  style={{
                    position: "absolute",
                    right: 0,
                    top: 42,
                    width: 220,
                    background: "#fff",
                    borderRadius: 18,
                    border: "1px solid rgba(0,0,0,0.08)",
                    boxShadow: "0 18px 40px rgba(0,0,0,0.12)",
                    overflow: "hidden",
                    zIndex: 20,
                  }}
                >
                  <button
                    type="button"
                    className="navbar-more-item navbar-item"
                    onClick={() => navigate("/profile")}
                    style={{
                      width: "100%",
                      padding: "14px 16px",
                      border: "none",
                      background: "transparent",
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      cursor: "pointer",
                      textAlign: "left",
                      fontFamily: "Raleway, sans-serif",
                      fontSize: 13,
                      color: "#1a1a1a",
                    }}
                  >
                    <UserCircleIcon />
                    Profile
                  </button>
                  <button
                    type="button"
                    className="navbar-more-item navbar-item"
                    onClick={() => navigate("/new")}
                    style={{
                      width: "100%",
                      padding: "14px 16px",
                      border: "none",
                      background: "transparent",
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      cursor: "pointer",
                      textAlign: "left",
                      fontFamily: "Raleway, sans-serif",
                      fontSize: 13,
                      color: "#1a1a1a",
                    }}
                  >
                    <Leaf size={14} color="#2D6A4F" weight="duotone" />
                    Plant new seed
                  </button>
                  <button
                    type="button"
                    className="navbar-more-item navbar-item"
                    onClick={() => navigate("/")}
                    style={{
                      width: "100%",
                      padding: "14px 16px",
                      border: "none",
                      background: "transparent",
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      cursor: "pointer",
                      textAlign: "left",
                      fontFamily: "Raleway, sans-serif",
                      fontSize: 13,
                      color: "#1a1a1a",
                    }}
                  >
                    <HomeIcon />
                    Dashboard
                  </button>
                  <div style={{ height: 1, background: "rgba(0,0,0,0.06)" }} />
                  <button
                    type="button"
                    className="navbar-more-item navbar-item"
                    onClick={async () => {
                      await supabase.auth.signOut();
                      navigate("/auth");
                    }}
                    style={{
                      width: "100%",
                      padding: "14px 16px",
                      border: "none",
                      background: "transparent",
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      cursor: "pointer",
                      textAlign: "left",
                      fontFamily: "Raleway, sans-serif",
                      fontSize: 13,
                      color: "#e05252",
                    }}
                  >
                    <LogoutIcon />
                    Sign out
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function HomeIcon() {
  return <House size={14} color="#888" weight="duotone" />;
}

function UserCircleIcon() {
  return <UserCircle size={14} color="#888" weight="duotone" />;
}

function LogoutIcon() {
  return <ArrowSquareOut size={14} color="#e05252" weight="duotone" />;
}
