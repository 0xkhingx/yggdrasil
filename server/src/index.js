import "dotenv/config";
import express from "express";
import cors from "cors";
import { createClient } from "@supabase/supabase-js";
import { treeRoutes } from "./routes/trees.js";
import { profileRoutes } from "./routes/profile.js";
import { nodeRoutes } from "./routes/nodes.js";

export const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY,
);

const app = express();
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

app.use("/api/trees", treeRoutes);
app.use("/api/tree", treeRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/node", nodeRoutes);

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Yggdrasil server on ${PORT}`));
