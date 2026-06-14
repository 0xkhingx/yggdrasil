import { useEffect, useRef, useState } from "react";
import { getNode, getQuestion, getTree, restoreNode, saveNotes, submitAnswer } from "../lib/api";

export default function LessonPanel({ nodeId, treeId, nodeData, onNodeUpdated }) {
  const [node, setNode] = useState(null);
  const [loading, setLoading] = useState(true);
  const [phase, setPhase] = useState("lesson");
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [result, setResult] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [branchSize, setBranchSize] = useState(0);
  const [notes, setNotes] = useState("");
  const [notesSaved, setNotesSaved] = useState(false);
  const notesTimerRef = useRef(null);
  const savedTimerRef = useRef(null);

  useEffect(() => {
    if (nodeId) {
      loadNode();
    }
    return () => {
      if (notesTimerRef.current) clearTimeout(notesTimerRef.current);
      if (savedTimerRef.current) clearTimeout(savedTimerRef.current);
    };
  }, [nodeId]);

  async function loadNode() {
    setLoading(true);
    setPhase("lesson");
    setQuestion("");
    setAnswer("");
    setResult(null);
    setNotes("");
    setNotesSaved(false);
    try {
      const treePromise = getTree(treeId);
      const nodePromise = nodeData?.lesson_content ? Promise.resolve({ node: nodeData }) : getNode(nodeId);
      const [treeData, data] = await Promise.all([treePromise, nodePromise]);
      const resolvedNode = data.node || nodeData;
      setNode(resolvedNode);
      setNotes(resolvedNode?.user_notes || "");
      setBranchSize(
        (treeData.nodes || []).filter((n) => n.branch_index === resolvedNode.branch_index).length
      );
    } catch (err) {
      if (err?.message === "Tree not found" || err?.message === "Node not found") {
        if (nodeData?.lesson_content) {
          setNode(nodeData);
          setNotes(nodeData.user_notes || "");
          setLoading(false);
          return;
        }
        setNode(null);
        onNodeUpdated?.(null);
      }
      console.error(err);
    }
    setLoading(false);
  }

  async function handleRequestQuestion() {
    setPhase("question");
    setAnswer("");
    setResult(null);
    try {
      const data = await getQuestion(nodeId);
      setQuestion(data.question);
    } catch (err) {
      console.error(err);
    }
  }

  async function handleSubmitAnswer() {
    if (!answer.trim()) return;
    setSubmitting(true);
    try {
      const data = await submitAnswer(nodeId, question, answer);
      setResult(data);
      setPhase("result");

      if (data.passed) {
        setTimeout(() => {
          onNodeUpdated?.(data.nextNodeId);
        }, 1500);
      }
    } catch (err) {
      console.error(err);
    }
    setSubmitting(false);
  }

  async function handleRestore() {
    setSubmitting(true);
    try {
      await restoreNode(nodeId);
      setResult({ ...(result || {}), restored: true, feedback: "Knowledge restored" });
      setTimeout(() => {
        onNodeUpdated?.(nodeId);
      }, 1200);
    } catch (err) {
      console.error(err);
    }
    setSubmitting(false);
  }

  function handleNotesChange(value) {
    setNotes(value);
    setNotesSaved(false);
    if (notesTimerRef.current) clearTimeout(notesTimerRef.current);
    if (savedTimerRef.current) clearTimeout(savedTimerRef.current);
    notesTimerRef.current = setTimeout(async () => {
      try {
        await saveNotes(nodeId, value);
        setNotesSaved(true);
        savedTimerRef.current = setTimeout(() => setNotesSaved(false), 2000);
      } catch (err) {
        console.error(err);
      }
    }, 1000);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-5 h-5 border-2 border-[#52B788] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!node) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-500">
        <svg viewBox="0 0 40 40" className="w-12 h-12 mb-4 opacity-30">
          <path
            d="M20 38 L20 12 M20 12 C16 8, 10 10, 8 14 M20 12 C24 8, 30 10, 32 14"
            stroke="#2D6A4F"
            strokeWidth="2"
            fill="none"
            strokeLinecap="round"
          />
        </svg>
        <p className="font-serif text-[1.25rem]">Select a node on the tree to begin</p>
      </div>
    );
  }

  const isDecaying = node.status === "decaying";
  const showReviewResult = phase === "result";
  const sources = Array.isArray(node.sources) ? node.sources : [];

  return (
    <div className="h-full flex flex-col px-8 py-6 overflow-y-auto animate-riseIn">
      <div className="flex items-center gap-3 mb-6">
        <div
          className={`w-3 h-3 rounded-full ${
            node.status === "completed"
              ? "bg-[#52B788]"
              : node.status === "decaying"
                ? "bg-[#D4A017]"
                : "bg-[#52B788] animate-pulse"
          }`}
        />
        <span className="text-xs font-sans uppercase tracking-wider text-gray-400">
          {node.status === "completed"
            ? "Completed"
            : node.status === "decaying"
              ? "Decaying - needs review"
              : "In Progress"}
        </span>
      </div>

      <div className="mb-2 text-[0.75rem] text-gray-500">
        Branch {node.branch_index + 1} · Node {node.node_index + 1} of {branchSize}
      </div>

      <h2 className="text-[1.65rem] font-serif text-[#F0EDE4] mb-6">
        {isDecaying ? "This knowledge is fading" : node.title}
      </h2>

      <div className="flex-1">
        <div className="prose prose-invert max-w-none">
          {node.lesson_content.split("\n").map((p, i) => (
            <p key={i} className="text-[#E0DCD0] leading-relaxed mb-4 font-sans text-base">
              {p}
            </p>
          ))}
        </div>

        {sources.length > 0 && (
          <div className="mt-6">
            <div className="text-[0.75rem] text-[#6b7280] mb-2">Sources &amp; Further Reading</div>
            <div className="flex flex-col gap-2">
              {sources.map((source, index) => (
                <a
                  key={`${source.url || source.title || index}`}
                  href={source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[#52B788] text-[0.85rem] hover:underline w-fit"
                >
                  <svg viewBox="0 0 12 12" className="w-3 h-3" aria-hidden="true">
                    <path
                      d="M4.5 2.5H2.5A1 1 0 0 0 1.5 3.5v6A1 1 0 0 0 2.5 10.5h6A1 1 0 0 0 9.5 9.5V7.5"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M6 1.5h4.5V6"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M10.5 1.5 5 7"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <span>{source.title}</span>
                </a>
              ))}
            </div>
          </div>
        )}

        <div className="mt-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs uppercase tracking-wider text-gray-500">My Notes</span>
            {notesSaved && <span className="text-xs text-[#52B788]">Saved</span>}
          </div>
          <textarea
            value={notes}
            onChange={(e) => handleNotesChange(e.target.value)}
            placeholder="Write your thoughts, connections, or questions..."
            rows={5}
            className="premium-input w-full min-h-[100px] px-4 py-3 bg-[#161B22] border border-[#21262d] rounded-lg text-[#F0EDE4] placeholder-gray-500 focus:outline-none focus:border-[#52B788] resize-y"
          />
        </div>

        {phase === "lesson" && !isDecaying && (
          <button
            onClick={handleRequestQuestion}
            className="premium-button mt-6 px-6 py-3 bg-[#2D6A4F] hover:bg-[#52B788] text-[#F0EDE4] rounded-lg font-sans font-medium transition-colors"
          >
            I&apos;ve read this - test me
          </button>
        )}

        {isDecaying && phase === "lesson" && (
          <button
            onClick={handleRequestQuestion}
            className="premium-button mt-6 px-6 py-3 bg-[#2D6A4F] hover:bg-[#52B788] text-[#F0EDE4] rounded-lg font-sans font-medium transition-colors"
          >
            Review &amp; Restore
          </button>
        )}

        {phase === "question" && (
          <div className="mt-6">
            <p className="text-[1.25rem] font-serif text-[#F0EDE4] mb-4">{question}</p>

            <textarea
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder="Type your answer..."
              rows={4}
              className="premium-input w-full px-4 py-3 bg-[#161B22] border border-[#2D6A4F] rounded-lg text-[#F0EDE4] placeholder-gray-500 focus:outline-none focus:border-[#52B788] resize-none"
            />

            <div className="flex gap-3 mt-4">
              <button
                onClick={() => setPhase("lesson")}
                className="premium-button px-4 py-2 border border-[#2D6A4F] text-[#F0EDE4] rounded-lg hover:bg-[#161B22] transition-colors"
              >
                Back to lesson
              </button>
              <button
                onClick={handleSubmitAnswer}
                disabled={submitting || !answer.trim()}
                className="premium-button px-6 py-2 bg-[#2D6A4F] hover:bg-[#52B788] text-[#F0EDE4] rounded-lg font-sans font-medium transition-colors disabled:opacity-50"
              >
                {submitting ? "Evaluating..." : "Submit"}
              </button>
            </div>
          </div>
        )}

        {showReviewResult && result && (
          <div className="mt-6">
            {result.restored ? (
              <div className="p-4 bg-[#1B3A2D] border border-[#2D6A4F] rounded-lg text-[#52B788] font-medium">
                Knowledge restored
              </div>
            ) : (
              <>
                <div className="mb-6">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-lg font-sans font-semibold">
                      Score: {result.score}/100
                    </span>
                    {result.passed ? (
                      <span className="px-3 py-1 bg-[#2D6A4F] text-[#F0EDE4] text-xs rounded-full font-sans font-medium">
                        Passed
                      </span>
                    ) : (
                      <span className="px-3 py-1 bg-[#D4A017] text-[#0D1117] text-xs rounded-full font-sans font-medium">
                        Needs improvement
                      </span>
                    )}
                  </div>
                  <div className="w-full bg-[#161B22] rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all duration-700 ${
                        result.passed ? "bg-[#52B788]" : "bg-[#D4A017]"
                      }`}
                      style={{ width: `${result.score}%` }}
                    />
                  </div>
                </div>

                <p className="text-[#E0DCD0] font-sans italic mb-6">{result.feedback}</p>

                {result.passed ? (
                  isDecaying ? (
                    <button
                      onClick={handleRestore}
                      className="premium-button px-6 py-3 bg-[#2D6A4F] hover:bg-[#52B788] text-[#F0EDE4] rounded-lg font-sans font-medium transition-colors"
                      disabled={submitting}
                    >
                      {submitting ? "Restoring..." : "Restore knowledge"}
                    </button>
                  ) : (
                    <div className="p-4 bg-[#1B3A2D] border border-[#2D6A4F] rounded-lg">
                      <p className="text-[#52B788] font-medium">
                        {result.nextNodeId
                          ? "Branch growing! The next lesson is unlocking..."
                          : "All lessons in this area complete!"}
                      </p>
                    </div>
                  )
                ) : (
                  <div className="flex gap-3">
                    <button
                      onClick={() => setPhase("lesson")}
                      className="premium-button px-4 py-2 border border-[#2D6A4F] text-[#F0EDE4] rounded-lg hover:bg-[#161B22] transition-colors"
                    >
                      Review lesson
                    </button>
                    <button
                      onClick={handleRequestQuestion}
                      className="premium-button px-6 py-2 bg-[#2D6A4F] hover:bg-[#52B788] text-[#F0EDE4] rounded-lg font-sans font-medium transition-colors"
                    >
                      Try another question
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
