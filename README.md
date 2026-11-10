# LIVE ARENA

Mobile-first creator dashboard and minigame demo for TikTok LIVE.

## Start locally
Requires Node.js 20+.

```bash
npm install
npm start
```

Open `http://localhost:3000` on your phone or computer (same network for local testing).

## What works
- Mobile-first control dashboard and 9:16 game stage
- Name Drop, Glücksrad, Survival, Namens-Rennen, Quiz Battle, Gift Rush
- Demo chat events for comments, gifts, likes and follows
- Participant list and leaderboard
- Optional server-side public TikTok LIVE chat listener via `tiktok-live-connector`

## TikTok limitations
- This app does **not** start or broadcast a TikTok LIVE.
- You must start LIVE separately in the official TikTok app.
- A public chat listener is not an official TikTok API. It can break without notice and must be used in compliance with TikTok's terms and applicable law.
- Connecting to public chat does not make the game screen visible to TikTok viewers.
- iOS Safari cannot inject a website's game canvas into the native TikTok camera broadcast. External video streaming requires TikTok's own approval/access and a supported streaming workflow.
- Never give this app your TikTok password, session cookies or a stream key.
- No revenue, gifts or viewers are guaranteed.

## Deploy
Deploy the Node app to a Node.js host that supports persistent WebSocket connections. Use HTTPS. Do not deploy as a static-only site if you want the optional live chat listener.

## Important
The TikTok connector is an unofficial reverse-engineered community project. TikTok can change its internal protocol. The demo works independently of it.
