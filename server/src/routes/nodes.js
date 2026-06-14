import { Router } from "express";
import { supabase } from "../index.js";
import { requireAuth } from "../middleware/auth.js";
import { generateQuestion, evaluateAnswer } from "../lib/ai.js";

export const nodeRoutes = Router();

function getTodayIso() {
  return new Date().toISOString().slice(0, 10);
}

function getYesterdayIso() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10);
}

nodeRoutes.get("/:nodeId", requireAuth, async (req, res) => {
  try {
    const { nodeId } = req.params;

    const { data: node, error } = await supabase
      .from("nodes")
      .select("*")
      .eq("id", nodeId)
      .single();

    if (error) return res.status(404).json({ error: "Node not found" });

    const { data: tree } = await supabase
      .from("trees")
      .select("user_id, difficulty")
      .eq("id", node.tree_id)
      .single();

    if (!tree) {
      return res.status(404).json({ error: "Node not found" });
    }

    if (tree.user_id !== req.user.id) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    if (node.status === "locked") {
      return res.status(403).json({ error: "Node is locked" });
    }

    res.json({ node: { ...node, sources: node.sources || [] } });
  } catch (err) {
    console.error("Node get error:", err);
    res.status(500).json({ error: "Failed to get node" });
  }
});

nodeRoutes.post("/:nodeId/question", requireAuth, async (req, res) => {
  try {
    const { nodeId } = req.params;

    const { data: node, error } = await supabase
      .from("nodes")
      .select("*")
      .eq("id", nodeId)
      .single();

    if (error) return res.status(404).json({ error: "Node not found" });

    const { data: tree } = await supabase
      .from("trees")
      .select("user_id")
      .eq("id", node.tree_id)
      .single();

    if (!tree) {
      return res.status(404).json({ error: "Node not found" });
    }

    if (tree.user_id !== req.user.id) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    if (node.status === "locked") {
      return res.status(403).json({ error: "Node is locked" });
    }

    const question = await generateQuestion(node.lesson_content, tree?.difficulty || "intermediate");
    res.json({ question });
  } catch (err) {
    console.error("Question error:", err);
    res.status(500).json({ error: "Failed to generate question" });
  }
});

nodeRoutes.post("/:nodeId/answer", requireAuth, async (req, res) => {
  try {
    const { nodeId } = req.params;
    const { question, answer } = req.body;

    if (!question || !answer) {
      return res.status(400).json({ error: "Question and answer required" });
    }

    const { data: node, error } = await supabase
      .from("nodes")
      .select("*")
      .eq("id", nodeId)
      .single();

    if (error) return res.status(404).json({ error: "Node not found" });

    const { data: tree } = await supabase
      .from("trees")
      .select("user_id")
      .eq("id", node.tree_id)
      .single();

    if (!tree) {
      return res.status(404).json({ error: "Node not found" });
    }

    if (tree.user_id !== req.user.id) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    const { score, feedback } = await evaluateAnswer(
      node.lesson_content,
      question,
      answer,
    );

    const passed = score >= 80;

    if (passed) {
      const today = getTodayIso();
      const yesterday = getYesterdayIso();
      const { data: currentTree } = await supabase
        .from("trees")
        .select("streak_days, last_streak_date")
        .eq("id", node.tree_id)
        .single();

      let nextStreak = 1;
      if (currentTree?.last_streak_date === today) {
        nextStreak = currentTree.streak_days || 1;
      } else if (currentTree?.last_streak_date === yesterday) {
        nextStreak = (currentTree.streak_days || 0) + 1;
      }

      await supabase
        .from("nodes")
        .update({
          status: "completed",
          mastery_score: score,
          completed_at: new Date().toISOString(),
        })
        .eq("id", nodeId);

      await supabase
        .from("trees")
        .update({
          last_active: new Date().toISOString(),
          streak_days: nextStreak,
          last_streak_date: today,
        })
        .eq("id", node.tree_id);

      const { data: nextNode } = await supabase
        .from("nodes")
        .select("*")
        .eq("tree_id", node.tree_id)
        .eq("branch_index", node.branch_index)
        .eq("node_index", node.node_index + 1)
        .single();

      let nextNodeId = null;
      if (nextNode) {
        await supabase
          .from("nodes")
          .update({ status: "unlocked", unlocked_at: new Date().toISOString() })
          .eq("id", nextNode.id);
        nextNodeId = nextNode.id;
      } else {
        const { data: nextBranch } = await supabase
          .from("nodes")
          .select("*")
          .eq("tree_id", node.tree_id)
          .eq("branch_index", node.branch_index + 1)
          .eq("node_index", 0)
          .single();

        if (nextBranch) {
          await supabase
            .from("nodes")
            .update({ status: "unlocked", unlocked_at: new Date().toISOString() })
            .eq("id", nextBranch.id);
          nextNodeId = nextBranch.id;
        }
      }

      res.json({ score, feedback, passed, nextNodeId });
    } else {
      await supabase
        .from("nodes")
        .update({ mastery_score: score })
        .eq("id", nodeId);

      res.json({ score, feedback, passed, nextNodeId: null });
    }
  } catch (err) {
    console.error("Answer error:", err);
    res.status(500).json({ error: "Failed to evaluate answer" });
  }
});

nodeRoutes.post("/:nodeId/restore", requireAuth, async (req, res) => {
  try {
    const { nodeId } = req.params;

    const { data: node, error } = await supabase
      .from("nodes")
      .select("*")
      .eq("id", nodeId)
      .single();

    if (error) return res.status(404).json({ error: "Node not found" });

    const { data: tree } = await supabase
      .from("trees")
      .select("user_id")
      .eq("id", node.tree_id)
      .single();

    if (!tree) {
      return res.status(404).json({ error: "Node not found" });
    }

    if (tree.user_id !== req.user.id) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    await supabase
      .from("nodes")
      .update({
        status: "completed",
        completed_at: new Date().toISOString(),
      })
      .eq("id", nodeId);

    await supabase
      .from("trees")
      .update({ last_active: new Date().toISOString() })
      .eq("id", node.tree_id);

    res.json({ success: true });
  } catch (err) {
    console.error("Restore error:", err);
    res.status(500).json({ error: "Failed to restore node" });
  }
});

nodeRoutes.patch("/:nodeId/notes", requireAuth, async (req, res) => {
  try {
    const { nodeId } = req.params;
    const { notes = "" } = req.body;

    const { data: node, error } = await supabase
      .from("nodes")
      .select("id, tree_id")
      .eq("id", nodeId)
      .single();

    if (error) return res.status(404).json({ error: "Node not found" });

    const { data: tree } = await supabase
      .from("trees")
      .select("user_id")
      .eq("id", node.tree_id)
      .single();

    if (!tree) {
      return res.status(404).json({ error: "Node not found" });
    }

    if (tree.user_id !== req.user.id) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    await supabase
      .from("nodes")
      .update({ user_notes: notes })
      .eq("id", nodeId);

    res.json({ success: true });
  } catch (err) {
    console.error("Notes save error:", err);
    res.status(500).json({ error: "Failed to save notes" });
  }
});
