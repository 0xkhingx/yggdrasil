# Yggdrasil

A gamified AI-powered learning system where knowledge grows as a living tree.

## What It Is

Yggdrasil is a learning platform that turns a topic into a structured, living curriculum tree. Each branch represents a major concept, and each node is a lesson you can complete, test, and revisit over time. As you progress, the tree unlocks new knowledge and tracks your mastery. If you go inactive, completed knowledge can decay and be restored through review.

## Key Features

- Tree visualization
- AI curriculum generation
- Mastery testing
- Streak system
- Decay mechanic
- Difficulty levels
- Note-taking
- Web-sourced content

## Tech Stack

- Frontend: React + Vite + Tailwind
- Backend: Node.js + Express
- Database: Supabase
- AI: featherless.ai with DeepSeek-V3

## How It Works

1. Enter a topic and difficulty.
2. The AI searches the web for current, relevant information.
3. A curriculum is generated and stored as a tree.
4. You learn through nodes as the tree grows.
5. Nodes decay if inactive for too long.
6. Restore decayed knowledge by reviewing and testing again.

## Getting Started

### 1. Install dependencies

```bash
cd server
npm install

cd ../client
npm install
```

### 2. Environment variables

Create the environment files and configure them:

```bash
cp server/.env.example server/.env
cp client/.env.example client/.env
```

Required server env vars:

- `FEATHERLESS_API_KEY`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_KEY`

Required client env vars:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_API_URL`

### 3. Run the app

```bash
# Terminal 1
cd server
npm run dev

# Terminal 2
cd client
npm run dev
```

## Supabase SQL

Add the `sources` column to the `nodes` table:

```sql
ALTER TABLE nodes ADD COLUMN sources jsonb DEFAULT '[]';
```

## Screenshots

Add screenshots here
