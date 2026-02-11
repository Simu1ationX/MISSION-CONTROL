// MISSION CONTROL // HOLO
// Auto-calc engine: session gate + readiness + risk lock + setup state.
// No TradingView data scraping (blocked). This is the "brain overlay."

const $ = (id) => document.getElementById(id);

const state = {
  theme: localStorage.getItem("mc_theme") || "cyan",
  bias: localStorage.getItem("mc_bias") || "NEUTRAL", // BULL / BEAR / NEUTRAL
  setupAPlus: JSON.parse(localStorage.getItem("mc_setupAPlus") || "false"),
  wins: parseInt(localStorage.getItem("mc_wins") || "0", 10),
  losses: parseInt(localStorage.getItem("mc_losses") || "0", 10),
  cfg: {
    sessionStart: localStorage.getItem("mc_sessionStart") || "07:30",
    sessionEnd: localStorage.getItem("mc_sessionEnd") || "10:30",
    dailyMaxLoss: parseFloat(localStorage.getItem("mc_dailyMaxLoss") || "-300"),
    dailyTarget: parseFloat(localStorage.getItem("mc_dailyTarget") || "500"),
    stopAfterLosses: parseInt(localStorage.getItem("mc_stopAfterLosses") || "2", 10)
  }
};

function logLine(text, cls="muted"){
  const log = $("log");
  const el = document.createElement("div");
  el.className = `line ${cls}`;
  const ts = new Date().toLocaleTimeString([], {hour12:false});
  el.textContent = `[${ts}] ${text}`;
  log.prepend(el);
}

function applyTheme(name){
  document.body.classList.remove("theme-cyan","theme-purple","theme-mamba","theme-red");
  document.body.classList.add(`theme-${name}`);
  state.theme = name;
  localStorage.setItem("mc_theme", name);
  $("modeTag").textContent = name.toUpperCase();
  logLine(`Theme → ${name.toUpperCase()}`, name === "red" ? "bad" : (name === "purple" || name === "mamba") ? "purple" : "cyan");
}

function setBias(b){
  state.bias = b;
  localStorage.setItem("mc_bias", b);
  $("biasState").textContent = `BIAS: ${b}`;
  logLine(`Bias set → ${b}`, b === "BULL" ? "ok" : b === "BEAR" ? "bad" : "cyan");
}

function setSetupAPlus(on){
  state.setupAPlus = on;
  localStorage.setItem("mc_setupAPlus", JSON.stringify(on));
  logLine(on ? "A+ setup flagged." : "Setup cleared.", on ? "purple" : "muted");
}

function incWin(){
  state.wins += 1;
  localStorage.setItem("mc_wins", String(state.wins));
  logLine("WIN logged.", "ok");
}
function incLoss(){
  state.losses += 1;
  localStorage.setItem("mc_losses", String(state.losses));
  logLine("LOSS logged.", "bad");
}

function resetDay(){
  state.wins = 0;
  state.losses = 0;
  state.setupAPlus = false;
  localStorage.setItem("mc_wins","0");
  localStorage.setItem("mc_losses","0");
  localStorage.setItem("mc_setupAPlus","false");
  logLine("Day reset. Clean slate.", "cyan");
}

function parseTimeToMinutes(hhmm){
  const [h,m] = hhmm.split(":").map(Number);
  return (h*60)+m;
}

function getSessionGate(now){
  const start = parseTimeToMinutes(state.cfg.sessionStart);
  const end = parseTimeToMinutes(state.cfg.sessionEnd);
  const cur = now.getHours()*60 + now.getMinutes();
  if (cur < start) return {status:"CLOSED", detail:"Pre-session"};
  if (cur >= start && cur <= end) return {status:"OPEN", detail:"Gate active"};
  return {status:"CLOSED", detail:"Outside window"};
}

function calcReadiness(session, lock){
  // Readiness logic (no market data):
  // LOCKED always wins, then session gate, then A+ setup + bias.
  if (lock.locked) return {level:"LOCKED", detail:`Stop triggered (${state.losses}/${state.cfg.stopAfterLosses} losses)`};

  if (session.status !== "OPEN") return {level:"WAIT", detail:`Session gate closed (${state.cfg.sessionStart}–${state.cfg.sessionEnd})`};

  if (!state.setupAPlus) return {level:"PREPARE", detail:"Waiting for A+ setup flag"};

  // bias-based messaging
  if (state.bias === "NEUTRAL") return {level:"PREPARE", detail:"A+ flagged — bias neutral (confirm VWAP/EMA)"};

  return {level:"FIRE", detail:`A+ flagged — bias ${state.bias} (execute plan)`};
}

function calcLock(){
  const locked = state.losses >= state.cfg.stopAfterLosses;
  return {locked};
}

function render(){
  // clock
  const now = new Date();
  $("clock").textContent = now.toLocaleTimeString([], {hour12:false});
  $("date").textContent = now.toLocaleDateString([], {weekday:"long", year:"numeric", month:"long", day:"numeric"});

  // config readouts
  $("dailyMaxLoss").textContent = `$${state.cfg.dailyMaxLoss}`;
  $("dailyTarget").textContent = `$${state.cfg.dailyTarget}`;
  $("lossCount").textContent = String(state.losses);
  $("winCount").textContent = String(state.wins);

  // session
  const session = getSessionGate(now);
  $("sessionState").textContent = `SESSION: ${session.status}`;
  $("metricSession").textContent = `${session.status} • ${session.detail}`;

  // lock
  const lock = calcLock();
  $("lockState").textContent = `LOCK: ${lock.locked ? "ON" : "OFF"}`;
  $("metricRisk").textContent = lock.locked
    ? `LOCKED • losses ${state.losses}/${state.cfg.stopAfterLosses}`
    : `CLEAR • losses ${state.losses}/${state.cfg.stopAfterLosses}`;

  // setup
  $("metricSetup").textContent = state.setupAPlus ? "A+ FLAGGED" : "WAITING";
  $("biasState").textContent = `BIAS: ${state.bias}`;

  // readiness
  const r = calcReadiness(session, lock);
  $("readiness").textContent = r.level;
  $("readinessDetail").textContent = r.detail;
  $("metricExec").textContent = `${r.level} • ${r.detail}`;

  // status line color vibe
  $("statusLine").textContent = r.level === "FIRE"
    ? "FIRE WHEN READY"
    : r.level === "LOCKED"
      ? "SYSTEM LOCKED"
      : r.level === "PREPARE"
        ? "STAND BY"
        : "WAIT";

  // theme auto accent for states (optional)
  // We do NOT override your chosen theme, but we can punch glow in mamba moments:
  const stage = $("coreStage");
  stage.dataset.state = r.level;
  stage.style.boxShadow =
    r.level === "FIRE" ? "0 0 34px rgba(57,255,136,.18)" :
    r.level === "LOCKED" ? "0 0 34px rgba(255,53,101,.18)" :
    r.level === "PREPARE" ? "0 0 30px rgba(167,139,250,.14)" :
    "0 0 26px rgba(60,247,255,.12)";
}

function bind(){
  // themes
  $("themeCyan").addEventListener("click",()=>applyTheme("cyan"));
  $("themePurple").addEventListener("click",()=>applyTheme("purple"));
  $("themeMamba").addEventListener("click",()=>applyTheme("mamba"));
  $("themeRed").addEventListener("click",()=>applyTheme("red"));

  // fullscreen
  $("btnFullscreen").addEventListener("click", ()=>{
    if (!document.fullscreenElement) document.documentElement.requestFullscreen();
    else document.exitFullscreen();
  });

  // setup & results
  $("chipAPlus").addEventListener("click", ()=>{ setSetupAPlus(true); render(); });
  $("chipResetSetup").addEventListener("click", ()=>{ setSetupAPlus(false); render(); });
  $("chipWin").addEventListener("click", ()=>{ incWin(); render(); });
  $("chipLoss").addEventListener("click", ()=>{ incLoss(); render(); });

  // bias
  $("biasBull").addEventListener("click", ()=>{ setBias("BULL"); render(); });
  $("biasBear").addEventListener("click", ()=>{ setBias("BEAR"); render(); });
  $("biasNeutral").addEventListener("click", ()=>{ setBias("NEUTRAL"); render(); });

  // config inputs
  $("sessionStart").value = state.cfg.sessionStart;
  $("sessionEnd").value = state.cfg.sessionEnd;
  $("cfgDailyMaxLoss").value = state.cfg.dailyMaxLoss;
  $("cfgDailyTarget").value = state.cfg.dailyTarget;
  $("cfgStopAfterLosses").value = state.cfg.stopAfterLosses;

  $("btnSaveCfg").addEventListener("click", ()=>{
    state.cfg.sessionStart = $("sessionStart").value;
    state.cfg.sessionEnd = $("sessionEnd").value;
    state.cfg.dailyMaxLoss = parseFloat($("cfgDailyMaxLoss").value || "-300");
    state.cfg.dailyTarget = parseFloat($("cfgDailyTarget").value || "500");
    state.cfg.stopAfterLosses = parseInt($("cfgStopAfterLosses").value || "2", 10);

    localStorage.setItem("mc_sessionStart", state.cfg.sessionStart);
    localStorage.setItem("mc_sessionEnd", state.cfg.sessionEnd);
    localStorage.setItem("mc_dailyMaxLoss", String(state.cfg.dailyMaxLoss));
    localStorage.setItem("mc_dailyTarget", String(state.cfg.dailyTarget));
    localStorage.setItem("mc_stopAfterLosses", String(state.cfg.stopAfterLosses));

    logLine("Config saved.", "cyan");
    render();
  });

  $("btnHardReset").addEventListener("click", ()=>{
    resetDay();
    render();
  });

  // Hotkeys
  window.addEventListener("keydown", (e)=>{
    if (e.target && ["INPUT","TEXTAREA"].includes(e.target.tagName)) return;

    const k = e.key.toLowerCase();
    if (k === "a"){ setSetupAPlus(true); render(); }
    if (k === "r"){ setSetupAPlus(false); render(); }
    if (k === "w"){ incWin(); render(); }
    if (k === "l"){ incLoss(); render(); }
    if (k === "f"){
      if (!document.fullscreenElement) document.documentElement.requestFullscreen();
      else document.exitFullscreen();
    }
  });
}

(function init(){
  applyTheme(state.theme);
  setBias(state.bias);
  logLine("Boot complete.", "cyan");
  logLine(`Session gate set ${state.cfg.sessionStart}–${state.cfg.sessionEnd} (local time).`, "muted");
  bind();
  render();
  setInterval(render, 500);
})();
