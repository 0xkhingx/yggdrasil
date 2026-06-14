import { Router } from "express";
import { supabase } from "../index.js";
import { requireAuth } from "../middleware/auth.js";

export const profileRoutes = Router();

profileRoutes.get("/stats", requireAuth, async (req, res) => {
  try {
    const { data: trees, error: treesErr } = await supabase
      .from("trees")
      .select("id, topic, streak_days, last_active, created_at")
      .eq("user_id", req.user.id);

    if (treesErr) throw treesErr;

    const treeIds = (trees || []).map((t) => t.id);

    const { data: nodes, error: nodesErr } = await supabase
      .from("nodes")
      .select("id, tree_id, title, completed_at, status")
      .in("tree_id", treeIds.length ? treeIds : ["00000000-0000-0000-0000-000000000000"]);

    if (nodesErr) throw nodesErr;

    const { data: recentActivity, error: activityErr } = await supabase
      .from("nodes")
      .select("title, completed_at, tree_id, trees(topic)")
      .eq("status", "completed")
      .order("completed_at", { ascending: false })
      .limit(10);

    if (activityErr) throw activityErr;

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    res.json({
      treesPlanted: trees?.length || 0,
      nodesMastered: (nodes || []).filter((n) => n.status === "completed").length,
      bestStreak: Math.max(0, ...(trees || []).map((t) => t.streak_days || 0)),
      activeTrees: (trees || []).filter((t) => new Date(t.last_active) > sevenDaysAgo).length,
      recentActivity: (recentActivity || []).map((entry) => ({
        topic: entry.trees?.topic || "",
        nodeTitle: entry.title,
        completedAt: entry.completed_at,
      })),
    });
  } catch (err) {
    console.error("Profile stats error:", err);
    res.status(500).json({ error: "Failed to get profile stats" });
  }
});
