// server.js — Lucen17 API (dual-mode ready)
const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

// In-memory buffers (survive process life, not restarts)
// Dual-mode resilience right now = device localStorage + these buffers.
// Phase 2 = swap to Postgres on Render.
const memory = [];       // { id, text, tone, ts, deviceId }
const tolls = [];        // { id, gate, amount, currency, ts, deviceId }

const gates = [
  { key: "rootline", name: "RootLine", toll: "free", blurb: "Resilience + lineage knowledge base" },
  { key: "dara",     name: "Dara",     toll: "£3/mo", blurb: "Earth gate — grounded creation" },
  { key: "vara",     name: "Vara",     toll: "£3/mo", blurb: "Sky gate — connective interface" },
];

app.get("/health", (_req, res) => res.json({ ok: true, service: "lucen17", ts: Date.now() }));

app.get("/gates", (_req, res) => res.json({ gates }));

app.get("/memory", (req, res) => {
  const limit = Math.min(parseInt(req.query.limit || "200", 10), 1000);
  res.json(memory);
});

app.post("/memory", (req, res) => {
  const { text, tone, ts, deviceId } = req.body || {};
  if (!text || !ts) return res.status(400).json({ error: "text and ts required" });
  const item = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    text: String(text).slice(0, 4000),
    tone: tone || "Reflective",
    ts: Number(ts) || Date.now(),
    deviceId: deviceId || "unknown",
  };
  memory.push(item);
  if (memory.length > 5000) memory.splice(0, memory.length - 5000); // cap
  res.json({ saved: true, item });
});

app.post("/tolls", (req, res) => {
  const { gate, amount, currency, deviceId } = req.body || {};
  if (!gate) return res.status(400).json({ error: "gate required" });
  const tx = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    gate,
    amount: Number(amount) || 0,
    currency: currency || "GBP",
    ts: Date.now(),
    deviceId: deviceId || "unknown",
  };
  tolls.push(tx);
  if (tolls.length > 5000) tolls.splice(0, tolls.length - 5000);
  res.json({ saved: true, tx });
});

const PORT = process.env.PORT || 8081;
app.listen(PORT, () => console.log(`[lucen17] API on :${PORT}`));
