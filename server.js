import express from "express";
import http from "node:http";
import { Server } from "socket.io";
import { TikTokLiveConnection, WebcastEvent } from "tiktok-live-connector";

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: false } });
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: "32kb" }));
app.use(express.static("public"));

let liveConnection = null;
let connectedHandle = null;

app.get("/api/status", (_req, res) => {
  res.json({
    app: "LIVE ARENA",
    chatProvider: liveConnection?.isConnected ? "connected" : "disconnected",
    handle: connectedHandle,
    streaming: false,
    streamingNote: "TikTok broadcast is not started or controlled by this app."
  });
});

// Connects to the publicly viewable chat of a creator who is ALREADY live.
// This is an unofficial community connector and may stop working when TikTok changes its protocol.
// No TikTok password, session cookie, or stream key is accepted or stored.
app.post("/api/tiktok/connect", async (req, res) => {
  const handle = String(req.body?.handle || "").trim().replace(/^@/, "");
  if (!/^[A-Za-z0-9._]{2,24}$/.test(handle)) {
    return res.status(400).json({ error: "Bitte einen gültigen öffentlichen TikTok-Handle eingeben." });
  }
  try {
    if (liveConnection) {
      try { liveConnection.disconnect(); } catch {}
      liveConnection = null;
    }
    const connection = new TikTokLiveConnection(handle);
    liveConnection = connection;
    connectedHandle = handle;

    connection.on(WebcastEvent.CHAT, data => io.emit("live-event", {
      type: "comment",
      username: data?.user?.uniqueId || data?.user?.nickname || "TikTok-User",
      nickname: data?.user?.nickname || data?.user?.uniqueId || "TikTok-User",
      text: data?.comment || "",
      source: "tiktok",
      at: Date.now()
    }));
    connection.on(WebcastEvent.GIFT, data => io.emit("live-event", {
      type: "gift",
      username: data?.user?.uniqueId || data?.user?.nickname || "TikTok-User",
      nickname: data?.user?.nickname || data?.user?.uniqueId || "TikTok-User",
      giftName: data?.giftDetails?.giftName || data?.giftName || "Geschenk",
      repeatCount: data?.repeatCount || 1,
      source: "tiktok",
      at: Date.now()
    }));
    connection.on(WebcastEvent.LIKE, data => io.emit("live-event", {
      type: "like", username: data?.user?.uniqueId || "TikTok-User",
      nickname: data?.user?.nickname || data?.user?.uniqueId || "TikTok-User",
      count: data?.likeCount || 1, source: "tiktok", at: Date.now()
    }));
    connection.on(WebcastEvent.FOLLOW, data => io.emit("live-event", {
      type: "follow", username: data?.user?.uniqueId || "TikTok-User",
      nickname: data?.user?.nickname || data?.user?.uniqueId || "TikTok-User",
      source: "tiktok", at: Date.now()
    }));
    connection.on("disconnected", () => io.emit("provider-status", { connected: false, handle }));
    connection.on("error", err => io.emit("provider-error", { message: String(err?.message || err) }));

    await connection.connect();
    io.emit("provider-status", { connected: true, handle });
    res.json({ ok: true, handle, note: "Chat-Verbindung aktiv. Dein TikTok-LIVE muss bereits laufen." });
  } catch (err) {
    liveConnection = null;
    res.status(502).json({ error: `TikTok-Chat konnte nicht verbunden werden: ${err?.message || err}` });
  }
});

app.post("/api/tiktok/disconnect", (_req, res) => {
  try { liveConnection?.disconnect(); } catch {}
  liveConnection = null;
  connectedHandle = null;
  io.emit("provider-status", { connected: false, handle: null });
  res.json({ ok: true });
});

io.on("connection", socket => {
  socket.emit("server-ready", { ok: true });
});

server.listen(PORT, () => console.log(`LIVE ARENA läuft auf http://localhost:${PORT}`));
