import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { createTree } from "../lib/api";

export default function Onboarding() {
  const [topic, setTopic] = useState("");
  const [difficulty, setDifficulty] = useState("Intermediate");
  const [phase, setPhase] = useState("input");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const timersRef = useRef([]);

  useEffect(() => {
    return () => {
      timersRef.current.forEach(clearTimeout);
      timersRef.current = [];
    };
  }, []);

  function wait(ms) {
    return new Promise((resolve) => {
      const id = setTimeout(resolve, ms);
      timersRef.current.push(id);
    });
  }

  async function handleConfirm() {
    setLoading(true);
    try {
      const data = await createTree(topic, difficulty);
      pendo.track("tree_created", {
        topic: topic,
        difficulty: difficulty,
        tree_id: data.treeId
      });
      setPhase("seed");
      await wait(800);
      setPhase("bounce");
      await wait(200);
      setPhase("crack");
      await wait(300);
      setPhase("sprout");
      await wait(700);
      navigate(`/tree/${data.treeId}`);
    } catch (err) {
      console.error(err);
      setLoading(false);
      setPhase("input");
    }
  }

  const style = `
    @keyframes orbPulse {
      0%, 100% { transform: scale(1); box-shadow: 0 0 60px rgba(82,183,136,0.4); }
      50% { transform: scale(1.05); box-shadow: 0 0 72px rgba(82,183,136,0.52); }
    }
    @keyframes seedFall {
      0% { transform: translateY(-300px) rotate(-5deg); opacity: 0; }
      100% { transform: translateY(0) rotate(0deg); opacity: 1; }
    }
    @keyframes seedBounce {
      0% { transform: scale(1); }
      30% { transform: scale(1.1); }
      60% { transform: scale(0.95); }
      100% { transform: scale(1); }
    }
    @keyframes crackLine {
      from { stroke-dashoffset: 80; opacity: 0; }
      to { stroke-dashoffset: 0; opacity: 1; }
    }
    @keyframes stemGrow {
      from { stroke-dashoffset: 50; opacity: 0; }
      to { stroke-dashoffset: 0; opacity: 1; }
    }
    @keyframes leafPop {
      0% { transform: scale(0); opacity: 0; }
      100% { transform: scale(1); opacity: 1; }
    }
    @keyframes treeSpin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
    .seed-fall { animation: seedFall 800ms ease-in forwards; }
    .seed-bounce { animation: seedBounce 200ms ease-out forwards; }
    .crack-line { animation: crackLine 300ms ease-out forwards; }
    .stem-grow { animation: stemGrow 700ms ease-out forwards; }
    .leaf-pop { animation: leafPop 300ms ease-out forwards; transform-box: fill-box; transform-origin: center; }
    @media (max-width: 640px) {
      .onboarding-shell {
        padding: 96px 16px 32px !important;
      }
      .onboarding-title {
        font-size: clamp(30px, 9vw, 40px) !important;
        margin-bottom: 28px !important;
      }
      .onboarding-card {
        padding: 18px !important;
      }
      .onboarding-row {
        flex-direction: column;
        align-items: stretch !important;
      }
      .onboarding-pill-row {
        justify-content: center;
      }
      .onboarding-submit {
        align-self: flex-end;
      }
    }
  `;

  return (
    <div className="min-h-screen w-full relative overflow-hidden bg-[#f0f4f1] animate-fadeIn">
      <style>{style}</style>
      <div
        className="onboarding-shell"
        style={{
          minHeight: "100vh",
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "120px 24px 60px",
          boxSizing: "border-box",
        }}
      >
        <div
          className="onboarding-title"
          style={{
            width: "100%",
            maxWidth: 680,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            textAlign: "center",
          }}
        >
          <div
            style={{
              width: 96,
              height: 96,
              borderRadius: "50%",
              marginBottom: 28,
              background: "radial-gradient(circle at 30% 30%, #95E1B0, #52B788 40%, #2D6A4F 80%)",
              boxShadow: "0 0 60px rgba(82,183,136,0.4)",
              animation: "orbPulse 3s ease-in-out infinite",
            }}
          />

          <h1
            style={{
              margin: "0 0 48px",
              fontFamily: '"Courier New", Courier, monospace',
              fontSize: 44,
              fontWeight: 600,
              color: "#1a1a1a",
              lineHeight: 1.3,
            }}
          >
            Welcome back. What shall we grow today?
          </h1>

          {phase === "input" && (
            <>
              <div
                className="onboarding-card premium-panel"
                style={{
                  width: "100%",
                  maxWidth: 640,
                  background: "#ffffff",
                  borderRadius: 24,
                  padding: 24,
                  boxShadow: "0 8px 32px rgba(0,0,0,0.06)",
                  border: "1px solid rgba(0,0,0,0.06)",
                  display: "flex",
                  flexDirection: "column",
                  gap: 16,
                  boxSizing: "border-box",
                }}
              >
              <input
                type="text"
                placeholder="What do you want to learn? (e.g. Mental toughness, Python, Norse mythology...)"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && topic.trim() && !loading) handleConfirm();
                }}
                style={{
                  width: "100%",
                  border: "none",
                  background: "transparent",
                  fontFamily: "Raleway, sans-serif",
                  fontSize: 16,
                  color: "#1a1a1a",
                  outline: "none",
                  minHeight: 28,
                }}
                className="onboarding-input"
              />
              <div className="onboarding-row" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
                <div className="onboarding-pill-row" style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                {["Beginner", "Intermediate", "Advanced"].map((level) => {
                  const selected = difficulty === level;
                  return (
                    <button
                      className="premium-button"
                      key={level}
                      onClick={() => setDifficulty(level)}
                      type="button"
                      style={{
                        borderRadius: 999,
                        padding: "8px 16px",
                        fontFamily: "Raleway, sans-serif",
                        fontSize: 13,
                        fontWeight: 500,
                        cursor: "pointer",
                        transition: "all 0.15s ease",
                        border: selected ? "1px solid #52B788" : "1px solid transparent",
                        background: selected ? "#e8f5ee" : "#f0f4f1",
                        color: selected ? "#2D6A4F" : "#888",
                      }}
                    >
                      {level}
                    </button>
                  );
                })}
                </div>

                <button
                  className="premium-button onboarding-submit"
                  onClick={handleConfirm}
                  disabled={!topic.trim() || loading}
                  type="button"
                  aria-label="Submit"
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: "50%",
                    background: loading ? "#1a1a1a" : "#1a1a1a",
                    color: "#fff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    border: "none",
                    transition: "all 0.15s ease",
                    flexShrink: 0,
                  }}
                  onMouseEnter={(e) => {
                    if (!e.currentTarget.disabled) e.currentTarget.style.background = "#2d2d2d";
                  }}
                  onMouseLeave={(e) => {
                    if (!e.currentTarget.disabled) e.currentTarget.style.background = "#1a1a1a";
                  }}
                >
                  {loading ? (
                    <span
                      style={{
                        width: 16,
                        height: 16,
                        borderRadius: "50%",
                        border: "2px solid rgba(255,255,255,0.35)",
                        borderTopColor: "#fff",
                        display: "inline-block",
                        animation: "treeSpin 0.8s linear infinite",
                      }}
                    />
                  ) : (
                    <span style={{ fontSize: 14, lineHeight: 1 }}>{">>"}</span>
                  )}
                </button>
              </div>
              </div>

              <div
                style={{
                  marginTop: 16,
                  fontFamily: "Raleway, sans-serif",
                  fontSize: 12,
                  color: topic.trim() ? "#aaa" : "#e05252",
                }}
              >
                {topic.trim() ? "Type a topic, choose a difficulty, then plant the seed." : "Add a topic to continue."}
              </div>
            </>
          )}

        {phase !== "input" && (
          <div
            style={{
              position: "absolute",
              left: "50%",
              top: "56%",
              transform: "translate(-50%, -50%)",
            }}
          >
            <div className={`relative ${phase === "seed" ? "seed-fall" : ""} ${phase === "bounce" ? "seed-bounce" : ""}`}>
              <svg viewBox="0 0 140 180" className="w-28 h-36 overflow-visible">
                <ellipse cx="70" cy="132" rx="24" ry="12" fill="#3d2b1f" opacity="0.4" />
                <path
                  d="M70 70 C58 72 48 84 50 98 C52 114 61 126 70 132 C79 126 88 114 90 98 C92 84 82 72 70 70 Z"
                  fill="#8B7355"
                  stroke="#c7a27a"
                  strokeWidth="2"
                />
                {(phase === "crack" || phase === "sprout") && (
                  <>
                    <path
                      d="M70 84 L66 96"
                      stroke="#8B7355"
                      strokeWidth="2"
                      fill="none"
                      strokeLinecap="round"
                      strokeDasharray="20"
                      className="crack-line"
                    />
                    <path
                      d="M70 84 L76 97"
                      stroke="#8B7355"
                      strokeWidth="2"
                      fill="none"
                      strokeLinecap="round"
                      strokeDasharray="20"
                      className="crack-line"
                    />
                  </>
                )}
                {phase === "sprout" && (
                  <>
                    <path
                      d="M70 95 C70 86 70 78 70 62"
                      stroke="#52B788"
                      strokeWidth="4"
                      fill="none"
                      strokeLinecap="round"
                      strokeDasharray="50"
                      className="stem-grow"
                    />
                    <path
                      d="M70 66 C63 62 58 58 54 52"
                      stroke="#52B788"
                      strokeWidth="3"
                      fill="none"
                      strokeLinecap="round"
                      className="leaf-pop"
                      style={{ animationDelay: "100ms" }}
                    />
                    <path
                      d="M70 66 C77 62 82 58 86 52"
                      stroke="#52B788"
                      strokeWidth="3"
                      fill="none"
                      strokeLinecap="round"
                      className="leaf-pop"
                      style={{ animationDelay: "200ms" }}
                    />
                  </>
                )}
              </svg>
            </div>
          </div>
        )}
        </div>
      </div>
    </div>
  );
}
