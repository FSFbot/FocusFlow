const API_URL = "http://127.0.0.1:8000";

const api = {

  // ── Auth ──────────────────────────────────────────
  async register(username, password) {
    const res = await fetch(`${API_URL}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ username, password })
    });
    if (!res.ok) throw await res.json();
    return res.json();
  },

  async login(username, password) {
    const form = new FormData();
    form.append("username", username);
    form.append("password", password);
    const res = await fetch(`${API_URL}/auth/login`, {
      method: "POST",
      credentials: "include",
      body: form
    });
    if (!res.ok) throw await res.json();
    return res.json();
  },

  async logout() {
    await fetch(`${API_URL}/auth/logout`, {
      method: "POST",
      credentials: "include"
    });
  },

  // ── Tasks ─────────────────────────────────────────
  async getTasks() {
    const res = await fetch(`${API_URL}/tasks/`, { credentials: "include" });
    if (!res.ok) throw await res.json();
    return res.json();
  },

  async createTask(text, skillId = null) {
    const res = await fetch(`${API_URL}/tasks/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ text, skill_id: skillId })
    });
    if (!res.ok) throw await res.json();
    return res.json();
  },

  async updateTask(id, data) {
    const res = await fetch(`${API_URL}/tasks/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(data)
    });
    if (!res.ok) throw await res.json();
    return res.json();
  },

  async deleteTask(id) {
    const res = await fetch(`${API_URL}/tasks/${id}`, {
      method: "DELETE",
      credentials: "include"
    });
    if (!res.ok) throw await res.json();
    return res.json();
  },

  // ── Skills ────────────────────────────────────────
  async getSkills() {
    const res = await fetch(`${API_URL}/skills/`, { credentials: "include" });
    if (!res.ok) throw await res.json();
    return res.json();
  },

  async createSkill(name) {
    const res = await fetch(`${API_URL}/skills/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ name })
    });
    if (!res.ok) throw await res.json();
    return res.json();
  },

  async addXp(skillId, xp) {
    const res = await fetch(`${API_URL}/skills/${skillId}/xp?xp=${xp}`, {
      method: "PATCH",
      credentials: "include"
    });
    if (!res.ok) throw await res.json();
    return res.json();
  },

  async setActiveSkill(skillId) {
    const res = await fetch(`${API_URL}/skills/${skillId}/active`, {
      method: "PATCH",
      credentials: "include"
    });
    if (!res.ok) throw await res.json();
    return res.json();
  },

  async deleteSkill(id) {
    const res = await fetch(`${API_URL}/skills/${id}`, {
      method: "DELETE",
      credentials: "include"
    });
    if (!res.ok) throw await res.json();
    return res.json();
  },

  // ── Config ────────────────────────────────────────
  async getConfig() {
    const res = await fetch(`${API_URL}/config/`, { credentials: "include" });
    if (!res.ok) throw await res.json();
    return res.json();
  },

  async saveConfig(focusMin, breakMin) {
    const res = await fetch(`${API_URL}/config/`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ focus_min: focusMin, break_min: breakMin })
    });
    if (!res.ok) throw await res.json();
    return res.json();
  },

  // ── Daily ─────────────────────────────────────────
  async getDaily() {
    const res = await fetch(`${API_URL}/daily/`, { credentials: "include" });
    if (!res.ok) throw await res.json();
    return res.json();
  },

  async saveDaily(date, seconds) {
    const res = await fetch(`${API_URL}/daily/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ date, seconds })
    });
    if (!res.ok) throw await res.json();
    return res.json();
  }
};