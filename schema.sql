-- Yggdrasil Supabase Schema

-- Trees table
CREATE TABLE trees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  topic text NOT NULL,
  difficulty text DEFAULT 'intermediate',
  curriculum jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  last_active timestamptz NOT NULL DEFAULT now(),
  streak_days integer NOT NULL DEFAULT 0,
  last_streak_date date
);

ALTER TABLE trees ADD COLUMN IF NOT EXISTS difficulty text DEFAULT 'intermediate';

-- Nodes table
CREATE TABLE nodes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tree_id uuid NOT NULL REFERENCES trees(id) ON DELETE CASCADE,
  node_key text NOT NULL,
  branch_index integer NOT NULL,
  node_index integer NOT NULL,
  title text NOT NULL,
  lesson_content text NOT NULL,
  sources jsonb NOT NULL DEFAULT '[]',
  status text NOT NULL DEFAULT 'locked' CHECK (status IN ('locked', 'unlocked', 'completed', 'decaying')),
  mastery_score integer NOT NULL DEFAULT 0 CHECK (mastery_score >= 0 AND mastery_score <= 100),
  unlocked_at timestamptz,
  completed_at timestamptz,
  user_notes text NOT NULL DEFAULT ''
);

-- Indexes
CREATE INDEX idx_trees_user_id ON trees(user_id);
CREATE INDEX idx_nodes_tree_id ON nodes(tree_id);
CREATE INDEX idx_nodes_status ON nodes(status);

-- Row Level Security
ALTER TABLE trees ENABLE ROW LEVEL SECURITY;
ALTER TABLE nodes ENABLE ROW LEVEL SECURITY;

-- Trees policies
CREATE POLICY "Users can view own trees"
  ON trees FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own trees"
  ON trees FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own trees"
  ON trees FOR UPDATE
  USING (auth.uid() = user_id);

-- Nodes policies
CREATE POLICY "Users can view own nodes"
  ON nodes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM trees
      WHERE trees.id = nodes.tree_id
      AND trees.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own nodes"
  ON nodes FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM trees
      WHERE trees.id = nodes.tree_id
      AND trees.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own nodes"
  ON nodes FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM trees
      WHERE trees.id = nodes.tree_id
      AND trees.user_id = auth.uid()
    )
  );
