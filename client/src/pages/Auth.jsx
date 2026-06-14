import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { EnvelopeSimple, LockSimple } from "@phosphor-icons/react";
import Logo from "../components/Logo";
import { supabase } from "../lib/supabase";

export default function Auth({ onAuth }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    const fn = isSignUp
      ? supabase.auth.signUp({ email, password })
      : supabase.auth.signInWithPassword({ email, password });

    const { data, error } = await fn;

    if (error) {
      setMessage(error.message);
    } else if (isSignUp) {
      setMessage("Check your email to confirm signup, then sign in.");
    } else if (data?.session) {
      onAuth(data.session);
      navigate("/");
    }
    setLoading(false);
  }

  const title = isSignUp ? "Create your account" : "Welcome Back";
  const subtitle = isSignUp
    ? "Plant your first seed and start growing"
    : "Sign in to continue growing your forest";

  return (
    <div
      className="animate-fadeIn auth-shell"
      style={{
        width: "100vw",
        minHeight: "100dvh",
        overflow: "hidden",
        background: "#f0f4f1",
        display: "flex",
      }}
    >
      <style>{`
        @keyframes authFadeUp {
          from { opacity: 0; transform: translateY(18px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes authFloat {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }
        @keyframes authGlow {
          0%, 100% { opacity: 0.55; transform: scale(1); }
          50% { opacity: 0.8; transform: scale(1.05); }
        }
        @keyframes authDrift {
          0%, 100% { transform: translate3d(0, 0, 0); }
          50% { transform: translate3d(0, -10px, 0); }
        }
        @keyframes authSway {
          0%, 100% { transform: translateX(0); }
          50% { transform: translateX(6px); }
        }
        @media (max-width: 768px) {
          .auth-right {
            display: none !important;
          }
          .auth-left {
            width: 100% !important;
          }
        }
        @keyframes authSpin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .auth-page {
          animation: authFadeUp 700ms ease both;
        }
        .auth-left {
          animation: authFloat 7s ease-in-out infinite;
        }
        .auth-right img {
          animation: authDrift 8s ease-in-out infinite;
        }
        .auth-right::before {
          content: "";
          position: absolute;
          inset: 0;
          background:
            radial-gradient(circle at 30% 20%, rgba(255,255,255,0.5), transparent 28%),
            radial-gradient(circle at 70% 70%, rgba(82,183,136,0.12), transparent 30%);
          pointer-events: none;
          animation: authGlow 6s ease-in-out infinite;
        }
        .auth-card {
          animation: authFadeUp 800ms ease both;
        }
        .auth-pill {
          transition: transform 0.18s ease, box-shadow 0.18s ease, background 0.18s ease, color 0.18s ease;
        }
        .auth-pill:hover {
          transform: translateY(-1px);
        }
        .auth-input-wrap {
          transition: transform 0.18s ease, border-color 0.18s ease, box-shadow 0.18s ease;
        }
        .auth-input-wrap:focus-within {
          transform: translateY(-1px);
          border-color: rgba(45,106,79,0.18) !important;
          box-shadow: 0 8px 20px rgba(0,0,0,0.05);
        }
        .auth-submit {
          transition: transform 0.18s ease, background 0.15s ease, box-shadow 0.18s ease;
          box-shadow: 0 8px 20px rgba(0,0,0,0.08);
        }
        .auth-submit:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 12px 24px rgba(0,0,0,0.12);
        }
        .auth-right .auth-hero-pill {
          animation: authFadeUp 900ms ease both, authSway 7s ease-in-out infinite;
        }
        @media (max-width: 768px) {
          .auth-page {
            animation: none;
          }
          .auth-left {
            width: 100% !important;
            padding: 28px 20px 24px !important;
          }
          .auth-card {
            max-width: 100% !important;
          }
          .auth-input-wrap {
            min-height: 48px;
          }
          .auth-submit {
            min-height: 48px;
          }
          .auth-footer {
            max-width: 100% !important;
          }
        }
      `}</style>

      <section
        className="auth-left auth-page"
        style={{
          width: "50%",
          background: "#ffffff",
          display: "flex",
          flexDirection: "column",
          padding: "48px 64px",
          justifyContent: "space-between",
          boxSizing: "border-box",
        }}
      >
        <div>
          <Logo />
        </div>

        <div
          className="auth-card"
          style={{
            width: "100%",
            maxWidth: 380,
            margin: "0 auto",
          }}
        >
          <div style={{ textAlign: "center", marginBottom: 8 }}>
            <h1
              className="premium-button"
              style={{
                margin: 0,
                fontFamily: '"Cormorant Garamond", serif',
                fontSize: 36,
                fontWeight: 600,
                color: "#1a1a1a",
                lineHeight: 1.15,
              }}
            >
              {title}
            </h1>
          </div>

          <p
            style={{
              margin: "0 0 28px",
              fontFamily: "Raleway, sans-serif",
              fontSize: 13,
              color: "#888",
              textAlign: "center",
            }}
          >
            {subtitle}
          </p>

          <div
            style={{
              display: "flex",
              background: "#f0f4f1",
              borderRadius: 14,
              padding: 4,
              marginBottom: 24,
            }}
          >
            <button
              type="button"
              onClick={() => {
                setIsSignUp(false);
                setMessage("");
              }}
              style={{
                flex: 1,
                textAlign: "center",
                padding: "10px",
                borderRadius: 10,
                fontFamily: "Raleway, sans-serif",
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
                border: "none",
                transition: "all 0.15s ease",
                background: !isSignUp ? "#ffffff" : "transparent",
                color: !isSignUp ? "#1a1a1a" : "#999",
                boxShadow: !isSignUp ? "0 2px 8px rgba(0,0,0,0.06)" : "none",
              }}
            className="auth-pill premium-button"
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setIsSignUp(true);
                setMessage("");
              }}
              style={{
                flex: 1,
                textAlign: "center",
                padding: "10px",
                borderRadius: 10,
                fontFamily: "Raleway, sans-serif",
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
                border: "none",
                transition: "all 0.15s ease",
                background: isSignUp ? "#ffffff" : "transparent",
                color: isSignUp ? "#1a1a1a" : "#999",
                boxShadow: isSignUp ? "0 2px 8px rgba(0,0,0,0.06)" : "none",
              }}
            className="auth-pill premium-button"
            >
              Sign Up
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            <label
                className="auth-input-wrap premium-input"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                marginBottom: 12,
                border: "1px solid rgba(0,0,0,0.08)",
                borderRadius: 14,
                padding: "12px 16px",
                background: "#ffffff",
              }}
            >
              <EnvelopeSimple size={16} weight="duotone" color="#888" />
              <input
                type="email"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                style={{
                  flex: 1,
                  border: "none",
                  outline: "none",
                  background: "transparent",
                  fontFamily: "Raleway, sans-serif",
                  fontSize: 14,
                  color: "#1a1a1a",
                }}
              />
            </label>

            <label
                className="auth-input-wrap premium-input"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                marginBottom: 20,
                border: "1px solid rgba(0,0,0,0.08)",
                borderRadius: 14,
                padding: "12px 16px",
                background: "#ffffff",
              }}
            >
              <LockSimple size={16} weight="duotone" color="#888" />
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                style={{
                  flex: 1,
                  border: "none",
                  outline: "none",
                  background: "transparent",
                  fontFamily: "Raleway, sans-serif",
                  fontSize: 14,
                  color: "#1a1a1a",
                }}
              />
            </label>

            <button
              type="submit"
              disabled={loading}
              className="auth-submit premium-button"
              style={{
                width: "100%",
                background: "#1a1a1a",
                color: "#fff",
                borderRadius: 999,
                padding: "14px",
                fontFamily: "Raleway, sans-serif",
                fontSize: 14,
                fontWeight: 600,
                border: "none",
                cursor: "pointer",
                transition: "background 0.15s ease",
              }}
              onMouseEnter={(e) => {
                if (!e.currentTarget.disabled) e.currentTarget.style.background = "#2d2d2d";
              }}
              onMouseLeave={(e) => {
                if (!e.currentTarget.disabled) e.currentTarget.style.background = "#1a1a1a";
              }}
            >
              {loading ? (
                <span style={{ display: "inline-flex", alignItems: "center", gap: 8, justifyContent: "center" }}>
                  <span
                    style={{
                      width: 14,
                      height: 14,
                      borderRadius: "50%",
                      border: "2px solid rgba(255,255,255,0.35)",
                      borderTopColor: "#fff",
                      display: "inline-block",
                      animation: "authSpin 0.8s linear infinite",
                    }}
                  />
                  Loading...
                </span>
              ) : isSignUp ? "Sign Up" : "Sign In"}
            </button>
          </form>

          {message && (
            <p
              style={{
                marginTop: 12,
                fontFamily: "Raleway, sans-serif",
                fontSize: 12,
                color: "#e05252",
                textAlign: "center",
              }}
            >
              {message}
            </p>
          )}
        </div>

        <p
          className="auth-footer"
          style={{
            margin: "0 auto",
            maxWidth: 360,
            textAlign: "center",
            fontFamily: "Raleway, sans-serif",
            fontSize: 11,
            color: "#aaa",
          }}
        >
          Your AI builds a structured learning path from any topic. Master each lesson to unlock the next branch.
        </p>
      </section>

      <aside
        className="auth-right auth-page"
        style={{
          width: "50%",
          position: "relative",
          background: "#e8ede9",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
        }}
      >
        <div
          className="auth-hero-pill"
          style={{
            position: "absolute",
            top: 28,
            right: 28,
            background: "rgba(255,255,255,0.7)",
            backdropFilter: "blur(8px)",
            WebkitBackdropFilter: "blur(8px)",
            borderRadius: 999,
            padding: "8px 18px",
            fontFamily: "Raleway, sans-serif",
            fontSize: 12,
            color: "#555",
          }}
        >
          Yggdrasil
        </div>

        <img
          src="/undraw_tree-swing_5010.svg"
          alt="Yggdrasil"
          style={{
            width: "80%",
            maxWidth: 440,
            objectFit: "contain",
            filter: "drop-shadow(0 12px 40px rgba(0,0,0,0.1))",
          }}
        />
      </aside>
    </div>
  );
}
