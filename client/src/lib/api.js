import { supabase } from "./supabase";

const API =
  import.meta.env.VITE_API_URL ||
  (window.location.hostname === "localhost" ? "http://localhost:3001" : "");

async function authFetch(path, options = {}) {
  const session = (await supabase.auth.getSession());
  const token = session.data.session?.access_token;

  async function doFetch(requestPath) {
    return fetch(`${API}${requestPath}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
      },
    });
  }

  let res = await doFetch(path);
  if (res.status === 404) {
    const fallbackPath =
      path.startsWith("/api/trees") ? path.replace("/api/trees", "/api/tree") :
      path.startsWith("/api/tree") ? path.replace("/api/tree", "/api/trees") :
      null;
    if (fallbackPath) {
      res = await doFetch(fallbackPath);
    }
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Request failed");
  }

  return res.json();
}

export function createTree(topic, difficulty = "Intermediate") {
  return authFetch("/api/trees/create", {
    method: "POST",
    body: JSON.stringify({ topic, difficulty }),
  });
}

export function getTree(treeId) {
  return authFetch(`/api/trees/${treeId}`);
}

export function deleteTree(treeId) {
  return authFetch(`/api/trees/${treeId}`, {
    method: "DELETE",
  });
}

export function getNode(nodeId) {
  return authFetch(`/api/node/${nodeId}`);
}

export function getQuestion(nodeId) {
  return authFetch(`/api/node/${nodeId}/question`, { method: "POST" });
}

export function submitAnswer(nodeId, question, answer) {
  return authFetch(`/api/node/${nodeId}/answer`, {
    method: "POST",
    body: JSON.stringify({ question, answer }),
  });
}

export function checkDecay(treeId) {
  return authFetch(`/api/trees/${treeId}/decay-check`, { method: "POST" });
}

export function getTrees() {
  return authFetch("/api/trees");
}

export function getProfileStats() {
  return authFetch("/api/profile/stats");
}

export function restoreNode(nodeId) {
  return authFetch(`/api/node/${nodeId}/restore`, {
    method: "POST",
  });
}

export function saveNotes(nodeId, notes) {
  return authFetch(`/api/node/${nodeId}/notes`, {
    method: "PATCH",
    body: JSON.stringify({ notes }),
  });
}
