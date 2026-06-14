import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import Logo from "../components/Logo";
import { supabase } from "../lib/supabase";

function IconSignIn() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M10 17l5-5-5-5" />
      <path d="M15 12H4" />
      <path d="M20 4v16" />
    </svg>
  );
}

function IconSignOut() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M14 17l5-5-5-5" />
      <path d="M19 12H8" />
      <path d="M13 5V4a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h5a2 2 0 0 0 2-2v-1" />
    </svg>
  );
}

export default function Landing() {
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    let active = true;
    supabase.auth.getSession().then(({ data }) => {
      if (active) setIsLoggedIn(Boolean(data.session));
    });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    function handlePointerDown(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, []);

  return (
    <div
      className="animate-fadeIn landing-shell"
      style={{
        width: "100vw",
        height: "100vh",
        overflow: "hidden",
        background: "#e1e8e5",
        position: "relative",
        color: "#1a1a1a",
      }}
      >
      <style>{`
        .landing-menu-button,
        .landing-menu-item,
        .landing-cta,
        .landing-logo-button {
          transition: transform 180ms var(--motion-ease-out), box-shadow 180ms var(--motion-ease-out), background-color 180ms var(--motion-ease-out), color 180ms var(--motion-ease-out), border-color 180ms var(--motion-ease-out);
        }
        .landing-menu-button:hover,
        .landing-menu-item:hover,
        .landing-cta:hover,
        .landing-logo-button:hover {
          transform: translateY(-2px);
        }
        .landing-menu-button:active,
        .landing-menu-item:active,
        .landing-cta:active,
        .landing-logo-button:active {
          transform: translateY(0) scale(0.98);
        }
        .landing-menu-button:hover {
          box-shadow: 0 10px 24px rgba(0,0,0,0.08);
        }
        .landing-menu-button:hover .landing-menu-badge {
          transform: rotate(90deg) scale(1.04);
        }
        .landing-menu-item:hover {
          background: rgba(17,17,17,0.04) !important;
        }
        .landing-cta:hover .landing-cta-arrow {
          transform: translateX(4px);
        }
        .landing-cta:hover .landing-cta-label {
          letter-spacing: 0.04em;
        }
        @media (max-width: 900px) {
          .landing-shell {
            width: 100vw;
            min-height: 100dvh;
            height: auto;
            overflow-x: hidden;
            overflow-y: auto;
          }
          .landing-main {
            flex-direction: column;
            height: auto;
            min-height: calc(100dvh - 72px);
            padding-top: 88px;
          }
          .landing-hero,
          .landing-aside {
            width: 100% !important;
          }
          .landing-hero {
            padding: 28px 20px 20px !important;
          }
          .landing-hero h1 {
            font-size: clamp(34px, 10vw, 48px) !important;
          }
          .landing-hero p {
            font-size: 15px !important;
            max-width: 100% !important;
          }
          .landing-aside {
            min-height: 320px;
            border-radius: 28px 28px 0 0 !important;
            margin: 0 !important;
          }
          .landing-hero + .landing-aside {
            margin-top: 20px !important;
          }
          .landing-menu-button {
            height: 44px !important;
            padding-right: 16px !important;
          }
          .landing-menu-button span:last-child {
            font-size: 14px !important;
          }
        }
      `}</style>

      <header
        className="animate-riseIn"
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100%",
          padding: "28px 34px 0 28px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          zIndex: 100,
          background: "transparent",
          boxSizing: "border-box",
        }}
        >
        <Logo className="landing-logo-button" />
        <div ref={menuRef} style={{ position: "relative" }}>
          <button
            className="landing-menu-button"
            type="button"
            onClick={() => setMenuOpen((value) => !value)}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 10,
              height: 42,
              borderRadius: 999,
              border: "1px solid rgba(0,0,0,0.85)",
              background: "#fff",
              padding: "0 18px 0 6px",
              cursor: "pointer",
              boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
            }}
            aria-expanded={menuOpen}
            aria-haspopup="menu"
            aria-label="Open menu"
          >
            <span
              className="landing-menu-badge"
              style={{
                width: 34,
                height: 34,
                borderRadius: "50%",
                background: "#111",
                color: "#fff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.05), 0 2px 5px rgba(0,0,0,0.08)",
                transition: "transform 180ms var(--motion-ease-out)",
              }}
            >
              <svg viewBox="0 0 16 16" width="16" height="16" fill="currentColor" aria-hidden="true">
                <circle cx="4.2" cy="4.2" r="1.45" />
                <circle cx="11.8" cy="4.2" r="1.45" />
                <circle cx="4.2" cy="11.8" r="1.45" />
                <circle cx="11.8" cy="11.8" r="1.45" />
              </svg>
            </span>
            <span
              style={{
                fontFamily: "'Raleway', sans-serif",
                fontSize: 15,
                color: "#111",
                lineHeight: 1,
                letterSpacing: "0.01em",
                fontWeight: 500,
              }}
            >
              Menu
            </span>
          </button>

          {menuOpen && (
            <div
              role="menu"
              style={{
                position: "absolute",
                top: 48,
                right: 0,
                minWidth: 152,
                background: "#fff",
                border: "1px solid rgba(0,0,0,0.06)",
                borderRadius: 14,
                boxShadow: "0 12px 28px rgba(0,0,0,0.08)",
                overflow: "hidden",
                zIndex: 200,
                padding: 8,
              }}
            >
              {[
                { label: "My Forest", action: () => navigate(isLoggedIn ? "/" : "/auth") },
                { label: "Plant a new seed", action: () => navigate("/new") },
                { label: "Profile", action: () => navigate("/profile") },
                isLoggedIn
                  ? { label: "Sign out", action: async () => { await supabase.auth.signOut(); navigate("/"); } }
                  : { label: "Sign in", action: () => navigate("/auth") },
              ].map((item) => (
                  <button
                    className="landing-menu-item"
                    key={item.label}
                    type="button"
                  role="menuitem"
                  onClick={() => {
                    setMenuOpen(false);
                    item.action();
                  }}
                  style={{
                    width: "100%",
                    textAlign: "left",
                    border: "none",
                    background: "transparent",
                    padding: "9px 10px",
                    fontFamily: "'Raleway', sans-serif",
                    fontSize: 13,
                    color: "#222",
                    borderRadius: 10,
                    cursor: "pointer",
                  }}
                >
                  {item.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </header>

      <main
        className="landing-main"
        style={{
          display: "flex",
          width: "100%",
          height: "100%",
          paddingTop: 72,
          boxSizing: "border-box",
        }}
      >
          <section
            className="landing-hero animate-riseIn"
            style={{
              width: "55%",
              padding: "74px 40px 60px 60px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              position: "relative",
              boxSizing: "border-box",
            }}
          >
            <span
              style={{
                position: "absolute",
                top: 144,
                left: 56,
                color: "#444",
                fontSize: 18,
                lineHeight: 1,
              }}
            >
              +
            </span>

            <h1
              style={{
              margin: 0,
              fontFamily: '"Courier New", Courier, monospace',
              fontSize: 52,
              fontWeight: 700,
              color: "#111",
              lineHeight: 1.2,
              marginBottom: 30,
                letterSpacing: "-0.02em",
              }}
            >
              Grow your knowledge,
              <br />
              one leaf{" "}
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: "#e7f2e8",
                  borderRadius: 999,
                  padding: "4px 10px",
                  fontSize: 26,
                  lineHeight: 1,
                  verticalAlign: "middle",
                }}
              >
                {"🌱"}
              </span>{" "}
              at
              <br />
              a time.
            </h1>

            <p
              style={{
                margin: "0 0 42px",
                maxWidth: 360,
                fontFamily: "'Raleway', sans-serif",
                fontSize: 13,
                color: "#666",
                lineHeight: 1.55,
                letterSpacing: "0.01em",
              }}
            >
              Your AI builds a structured learning path from any topic. Master each lesson to unlock the next branch. Miss a few days and your tree begins to wilt.
            </p>

                <button
                  className="landing-cta premium-button"
                  type="button"
                  onClick={() => navigate("/auth")}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 0,
                    width: "fit-content",
                    border: "none",
                    background: "transparent",
                    padding: 0,
                    cursor: "pointer",
                  }}
                >
                  <span
                    className="landing-cta-label"
                    style={{
                      background: "#111",
                      color: "#fff",
                      fontFamily: "'Raleway', sans-serif",
                      fontSize: 14,
                      padding: "14px 24px",
                      borderRadius: 999,
                      letterSpacing: "0.02em",
                    }}
                  >
                    Explore your forest
                  </span>
                  <span
                    className="landing-cta-arrow"
                    style={{
                      width: 44,
                      height: 44,
                      background: "#111",
                      borderRadius: "50%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#fff",
                      fontSize: 12,
                      marginLeft: -1,
                      transition: "transform 180ms var(--motion-ease-out)",
                    }}
                  >
                    &gt;&gt;
                  </span>
                </button>

          </section>

          <aside
            className="landing-aside animate-riseIn"
            style={{
              width: "45%",
              position: "relative",
              background: "#dfe7e4",
              borderRadius: "32px 0 0 32px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              overflow: "hidden",
              margin: "16px 0 16px 0",
              boxSizing: "border-box",
            }}
          >
            <img
              src="/undraw_tree-swing_5010.svg"
              alt="Yggdrasil"
              style={{
                width: "87%",
                maxWidth: 490,
                objectFit: "contain",
                filter: "drop-shadow(0 8px 32px rgba(0,0,0,0.08))",
                position: "relative",
                zIndex: 1,
              }}
            />

            <div
              className="premium-panel"
              style={{
                position: "absolute",
                bottom: 26,
                right: 26,
                background: "#fff",
                borderRadius: 18,
                padding: "20px 22px 18px",
                boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
                minWidth: 156,
                zIndex: 2,
              }}
            >
              <div
                style={{
                  position: "absolute",
                  top: 12,
                  right: 12,
                  width: 32,
                  height: 32,
                  borderRadius: "50%",
                  background: "#e6ebe8",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 12,
                  color: "#333",
                }}
              >
                ↗
              </div>
              <div style={{ fontFamily: "'Raleway', sans-serif", color: "#111", lineHeight: 1 }}>
                <div style={{ fontSize: 43, fontWeight: 700, letterSpacing: "-0.04em" }}>847</div>
                <div style={{ marginTop: 6, fontSize: 13, color: "#7b7b7b", fontWeight: 500 }}>Nodes</div>
                <div style={{ marginTop: 2, fontSize: 13, color: "#7b7b7b", fontWeight: 500 }}>Mastered</div>
              </div>
            </div>
          </aside>
        </main>
    </div>
  );
}
