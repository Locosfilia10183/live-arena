
/* LIVE ARENA — INFINITE RUN */
(() => {
  const $ = id => document.getElementById(id);

  const style = document.createElement("style");
  style.textContent = `
    .game[data-game="infinite"] {
      border-color:#48e5ef;
      background:linear-gradient(145deg,#152b37,#171526)
    }
    #infiniteRunPanel {
      display:none;width:100%;max-width:430px;margin:14px auto 0
    }
    #infiniteRunPanel.active {display:block}
    #irCanvas {
      display:block;width:100%;aspect-ratio:9/16;
      border-radius:22px;border:1px solid #51416f;
      background:#090d19;touch-action:manipulation
    }
    .ir-controls {
      display:flex;gap:8px;flex-wrap:wrap;margin:10px 0
    }
    .ir-controls button {
      border:1px solid #39334f;border-radius:12px;
      background:#1b1930;color:#fff;padding:10px 13px;font-weight:800
    }
    .ir-stats {
      display:grid;grid-template-columns:repeat(3,1fr);
      gap:7px;margin:10px 0
    }
    .ir-stat {
      background:#171729;border:1px solid #302b49;
      border-radius:12px;padding:9px;text-align:center
    }
    .ir-stat b {
      display:block;font-size:19px;color:#8feaf0
    }
    .ir-stat small {color:#aaa2c8;font-size:10px}
    .ir-help {
      color:#aaa2c8;font-size:11px;line-height:1.5;margin:8px 2px
    }
  `;
  document.head.appendChild(style);

  const gameGrid = document.querySelector("#studio .game-grid");
  if (!gameGrid || $("infiniteRunPanel")) return;

  const tile = document.createElement("button");
  tile.className = "game";
  tile.dataset.game = "infinite";
  tile.innerHTML =
    '<span class="emoji">🏃</span><b>INFINITE RUN</b><small class="muted">Endloses Stickman-Rennen</small>';
  gameGrid.appendChild(tile);

  const panel = document.createElement("section");
  panel.id = "infiniteRunPanel";
  panel.innerHTML = `
    <div class="ir-stats">
      <div class="ir-stat"><b id="irRunners">0</b><small>LÄUFER</small></div>
      <div class="ir-stat"><b id="irSpeed">1.0×</b><small>BOOST</small></div>
      <div class="ir-stat"><b id="irDistance">0 m</b><small>STRECKE</small></div>
    </div>
    <canvas id="irCanvas" width="540" height="960"></canvas>
    <div class="ir-controls">
      <button id="irAdd">＋ Test-Läufer</button>
      <button id="irPause">Ⅱ Pause</button>
      <button id="irReset">↻ Neustart</button>
    </div>
    <p class="ir-help">
      !join = mitrennen · Kommentare = kleiner Boost ·
      Likes = kleiner Boost · Geschenke = stärkerer Boost.
      Das Rennen endet nie.
    </p>
  `;

  const stageWrap = document.querySelector("#studio .stage-wrap");
  stageWrap.insertAdjacentElement("beforebegin", panel);

  const canvas = $("irCanvas");
  const ctx = canvas.getContext("2d");
  const W = canvas.width;
  const H = canvas.height;

  let runners = [];
  let running = true;
  let last = 0;
  let world = 0;
  let globalBoost = 1;
  let raf = 0;
  const oldSelect = window.selectGame;

  const colors = [
    "#9c77ff","#42dce9","#ffbd62","#ff6f9a",
    "#7ce6a5","#f28cff","#9cbaff","#ffe27c"
  ];

  const safe = s =>
    String(s || "Gast").replace(/^@/,"").slice(0,18);

  function add(name) {
    name = safe(name);

    if (!runners.some(
      r => r.name.toLowerCase() === name.toLowerCase()
    )) {
      runners.push({
        name,
        lane: runners.length % 5,
        distance: 0,
        boost: 1,
        color: colors[runners.length % colors.length],
        phase: Math.random() * 6
      });
    }

    updateStats();
  }

  function boost(name, amount) {
    let r = runners.find(
      x => x.name.toLowerCase() === safe(name).toLowerCase()
    );

    if (!r) {
      add(name);
      r = runners[runners.length - 1];
    }

    r.boost = Math.min(4, r.boost + amount);
    globalBoost = Math.min(3, globalBoost + amount * .08);
    updateStats();
  }

  function updateStats() {
    $("irRunners").textContent = runners.length;
    $("irSpeed").textContent = globalBoost.toFixed(1) + "×";
    $("irDistance").textContent = Math.floor(world) + " m";
  }

  function stickman(x,y,scale,color,phase) {
    const bob = Math.sin(phase) * 5 * scale;
    const swing = Math.sin(phase * 1.7) * .55;

    ctx.save();
    ctx.translate(x,y+bob);
    ctx.scale(scale,scale);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.shadowColor = color;
    ctx.shadowBlur = 13;
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = 7;

    ctx.beginPath();
    ctx.arc(0,-49,13,0,Math.PI*2);
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(0,-35);
    ctx.lineTo(0,5);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(0,-25);
    ctx.lineTo(-19+swing*13,-7);
    ctx.moveTo(0,-25);
    ctx.lineTo(18-swing*13,-8);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(0,5);
    ctx.lineTo(-13+swing*22,34);
    ctx.moveTo(0,5);
    ctx.lineTo(14-swing*22,34);
    ctx.stroke();

    ctx.restore();
  }

  function draw(t) {
    const dt = Math.min(.04,(t-last)/1000 || 0);
    last = t;

    if (running) {
      world += dt * 8 * globalBoost;

      runners.forEach(r => {
        r.distance += dt * (7.5 * r.boost * globalBoost);
        r.phase += dt * 11 * r.boost;
      });
    }

    ctx.clearRect(0,0,W,H);

    const bg = ctx.createLinearGradient(0,0,0,H);
    bg.addColorStop(0,"#17152e");
    bg.addColorStop(.55,"#101a2b");
    bg.addColorStop(1,"#080d18");
    ctx.fillStyle = bg;
    ctx.fillRect(0,0,W,H);

    ctx.fillStyle = "#c6b4ff";
    ctx.font = "900 27px system-ui";
    ctx.textAlign = "center";
    ctx.fillText("INFINITE RUN",W/2,65);

    ctx.fillStyle = "#9e9ab8";
    ctx.font = "14px system-ui";
    ctx.fillText("DIE COMMUNITY RENNT WEITER ∞",W/2,92);

    const horizon = 145;
    const bottom = H-110;

    ctx.fillStyle = "#171b2e";
    ctx.beginPath();
    ctx.moveTo(W*.34,horizon);
    ctx.lineTo(W*.66,horizon);
    ctx.lineTo(W*.98,bottom);
    ctx.lineTo(W*.02,bottom);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = "#51466f";
    ctx.lineWidth = 3;

    for (let i=0;i<=5;i++) {
      const x = W*(.34+i*.064);
      ctx.beginPath();
      ctx.moveTo(x,horizon);
      ctx.lineTo(W*(.02+i*.192),bottom);
      ctx.stroke();
    }

    for (let i=0;i<18;i++) {
      const z = ((i*70+(world*22)%70)%1260)/1260;
      const y = horizon+z*(bottom-horizon);
      const half = W*(.02+z*.30);

      ctx.strokeStyle = "#77708f";
      ctx.lineWidth = 1+z*3;
      ctx.beginPath();
      ctx.moveTo(W/2-half,y);
      ctx.lineTo(W/2+half,y);
      ctx.stroke();
    }

    runners.slice(0,12).forEach((r,i) => {
      const laneX = W*(.16+r.lane*.17);
      const y = bottom-45-(i%3)*15;

      stickman(
        laneX,y,Math.min(1.12,.7+i*.025),r.color,r.phase
      );

      ctx.fillStyle = "#fff";
      ctx.font = "bold 14px system-ui";
      ctx.textAlign = "center";
      ctx.fillText(r.name,laneX,y+52);

      ctx.fillStyle = "#8eeaf0";
      ctx.font = "11px system-ui";
      ctx.fillText(Math.floor(r.distance)+" m",laneX,y+69);
    });

    if (!runners.length) {
      ctx.fillStyle = "#d4c8ff";
      ctx.font = "bold 20px system-ui";
      ctx.fillText("Warte auf !join …",W/2,H*.56);
    }

    ctx.fillStyle = "#b9acd9";
    ctx.font = "13px system-ui";
    ctx.fillText("STRECKE "+Math.floor(world)+" m",W/2,H-45);

    updateStats();
    raf = requestAnimationFrame(draw);
  }

  function activate() {
    document.querySelectorAll("#studio .game").forEach(b => {
      b.classList.toggle("active",b.dataset.game==="infinite");
    });

    panel.classList.add("active");
    stageWrap.style.display = "none";
    document.querySelector("#studio .notice")?.classList.add("hide");

    if (!raf) {
      last = performance.now();
      raf = requestAnimationFrame(draw);
    }
  }

  function deactivate() {
    panel.classList.remove("active");
    stageWrap.style.display = "";
    document.querySelector("#studio .notice")?.classList.remove("hide");
  }

  window.selectGame = function(g) {
    if (g === "infinite") {
      activate();
      return;
    }

    deactivate();
    return oldSelect?.(g);
  };

  tile.addEventListener("click",() => {
    window.selectGame("infinite");
  });

  $("irAdd").onclick = () => {
    add(["TurboTom","LunaPlay","PixelNinja","MiaCraft","NekoStar"][runners.length%5]);
  };

  $("irPause").onclick = () => {
    running = !running;
    $("irPause").textContent = running ? "Ⅱ Pause" : "▶ Weiter";
  };

  $("irReset").onclick = () => {
    runners = [];
    world = 0;
    globalBoost = 1;
    running = true;
    updateStats();
  };

  if (typeof socket !== "undefined" && socket) {
    socket.on("live-event", e => {
      if (!panel.classList.contains("active") || !e) return;

      const name = e.nickname || e.username || "Gast";
      const txt = String(e.text || "").trim().toLowerCase();

      if (e.type === "comment") {
        if (txt === "!join" || txt === "join" || txt === "rennen") {
          add(name);
        } else if (
          runners.some(r => r.name.toLowerCase() === safe(name).toLowerCase())
        ) {
          boost(name,.08);
        }
      } else if (e.type === "gift") {
        boost(name,Math.min(.9,.35*(e.repeatCount||1)));
      } else if (e.type === "like" || e.type === "follow") {
        boost(name,.04);
      }
    });
  }

  document.addEventListener("visibilitychange",() => {
    if (!document.hidden && !raf) {
      last = performance.now();
      raf = requestAnimationFrame(draw);
    }
  });

  updateStats();
})();
