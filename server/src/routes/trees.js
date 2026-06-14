import { Router } from "express";
import { supabase } from "../index.js";
import { requireAuth } from "../middleware/auth.js";
import { generateCurriculum } from "../lib/ai.js";

export const treeRoutes = Router();

treeRoutes.post("/create", requireAuth, async (req, res) => {
  try {
    const { topic, difficulty } = req.body;
    console.log("Creating tree for topic:", topic, "user:", req.user.id);
    if (!topic) return res.status(400).json({ error: "Topic required" });

    const curriculum = await generateCurriculum(topic, difficulty);

    const { data: tree, error: treeErr } = await supabase
      .from("trees")
      .insert({
        user_id: req.user.id,
        topic: curriculum.topic,
        curriculum,
        last_active: new Date().toISOString(),
      })
      .select()
      .single();

    if (treeErr) throw treeErr;

    const nodeRows = [];
    curriculum.branches.forEach((branch, bi) => {
      branch.nodes.forEach((node, ni) => {
        const nodeKey = `branch_${bi + 1}_node_${ni + 1}`;
        nodeRows.push({
          tree_id: tree.id,
          node_key: nodeKey,
          branch_index: bi,
          node_index: ni,
          title: node.title,
          lesson_content: node.lesson,
          sources: node.sources || [],
          status: bi === 0 && ni === 0 ? "unlocked" : "locked",
          mastery_score: 0,
        });
      });
    });

    const { data: nodes, error: nodesErr } = await supabase
      .from("nodes")
      .insert(nodeRows)
      .select();

    if (nodesErr) {
      await supabase.from("trees").delete().eq("id", tree.id);
      throw nodesErr;
    }

    const firstNode = nodes.find((n) => n.status === "unlocked");

    res.json({
      treeId: tree.id,
      firstNode: firstNode
        ? { id: firstNode.id, title: firstNode.title, lesson_content: firstNode.lesson_content }
        : null,
    });
  } catch (err) {
    console.error("Tree create error:", err);
    res.status(500).json({ error: "Failed to create tree" });
  }
});

treeRoutes.get("/", requireAuth, async (req, res) => {
  try {
    const { data: trees, error: treesErr } = await supabase
      .from("trees")
      .select("id, topic, last_active, streak_days, created_at")
      .eq("user_id", req.user.id)
      .order("last_active", { ascending: false });

    if (treesErr) throw treesErr;

    const treeIds = (trees || []).map((t) => t.id);
    const countsByTree = new Map(treeIds.map((treeId) => [treeId, { node_count: 0, completed_count: 0 }]));

    if (treeIds.length) {
      const { data: nodes, error: nodesErr } = await supabase
        .from("nodes")
        .select("tree_id, status")
        .in("tree_id", treeIds);

      if (nodesErr) throw nodesErr;

      for (const node of nodes || []) {
        const current = countsByTree.get(node.tree_id) || { node_count: 0, completed_count: 0 };
        current.node_count += 1;
        if (node.status === "completed") current.completed_count += 1;
        countsByTree.set(node.tree_id, current);
      }
    }

    res.json({
      trees: (trees || []).map((tree) => ({
        ...tree,
        ...(countsByTree.get(tree.id) || { node_count: 0, completed_count: 0 }),
      })),
    });
  } catch (err) {
    console.error("Trees list error:", err);
    res.status(500).json({ error: "Failed to list trees" });
  }
});

treeRoutes.get("/:treeId", requireAuth, async (req, res) => {
  try {
    const { treeId } = req.params;

    const { data: tree, error: treeErr } = await supabase
      .from("trees")
      .select("*")
      .eq("id", treeId)
      .eq("user_id", req.user.id)
      .single();

    if (treeErr) return res.status(404).json({ error: "Tree not found" });

    const { data: nodes, error: nodesErr } = await supabase
      .from("nodes")
      .select("id, node_key, branch_index, node_index, title, status, mastery_score, unlocked_at, completed_at, lesson_content, sources, user_notes")
      .eq("tree_id", treeId)
      .order("branch_index")
      .order("node_index");

    if (nodesErr) throw nodesErr;

    res.json({ tree, nodes: nodes || [] });
  } catch (err) {
    console.error("Tree get error:", err);
    res.status(500).json({ error: "Failed to get tree" });
  }
});

treeRoutes.delete("/:treeId", requireAuth, async (req, res) => {
  try {
    const { treeId } = req.params;

    const { data: tree, error: treeErr } = await supabase
      .from("trees")
      .select("id, user_id")
      .eq("id", treeId)
      .single();

    if (treeErr || !tree) return res.status(404).json({ error: "Tree not found" });
    if (tree.user_id !== req.user.id) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    const { error: nodesErr } = await supabase
      .from("nodes")
      .delete()
      .eq("tree_id", treeId);

    if (nodesErr) throw nodesErr;

    const { error: deleteErr } = await supabase
      .from("trees")
      .delete()
      .eq("id", treeId);

    if (deleteErr) throw deleteErr;

    res.json({ success: true });
  } catch (err) {
    console.error("Tree delete error:", err);
    res.status(500).json({ error: "Failed to delete tree" });
  }
});

treeRoutes.post("/:treeId/decay-check", requireAuth, async (req, res) => {
  try {
    const { treeId } = req.params;

    const { data: tree, error: treeErr } = await supabase
      .from("trees")
      .select("*")
      .eq("id", treeId)
      .eq("user_id", req.user.id)
      .single();

    if (treeErr) return res.status(404).json({ error: "Tree not found" });

    const now = new Date();
    const lastActive = new Date(tree.last_active);
    const hoursSinceActive = (now - lastActive) / (1000 * 60 * 60);

    const affectedNodes = [];

    if (hoursSinceActive > 72) {
      const { data: allNodes } = await supabase
        .from("nodes")
        .select("*")
        .eq("tree_id", treeId)
        .eq("status", "completed")
        .order("branch_index", { ascending: true })
        .order("node_index", { ascending: true });

      if (allNodes?.length) {
        for (let i = Math.max(0, allNodes.length - 2); i < allNodes.length; i++) {
          const { error: upErr } = await supabase
            .from("nodes")
            .update({ status: "decaying" })
            .eq("id", allNodes[i].id);
          if (!upErr) affectedNodes.push(allNodes[i].id);
        }
      }
    } else if (hoursSinceActive > 48) {
      const { data: lastCompleted } = await supabase
        .from("nodes")
        .select("*")
        .eq("tree_id", treeId)
        .eq("status", "completed")
        .order("branch_index", { ascending: false })
        .order("node_index", { ascending: false })
        .limit(1);

      if (lastCompleted?.length) {
        const { error: upErr } = await supabase
          .from("nodes")
          .update({ status: "decaying" })
          .eq("id", lastCompleted[0].id);
        if (!upErr) affectedNodes.push(lastCompleted[0].id);
      }
    }

    res.json({
      decayed: affectedNodes.length > 0,
      affectedNodes,
      hoursSinceActive,
    });
  } catch (err) {
    console.error("Decay check error:", err);
    res.status(500).json({ error: "Failed to check decay" });
  }
});
