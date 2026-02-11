function pad2(n){ return String(n).padStart(2,"0"); }

function updateClock(){
  const now = new Date();
  document.getElementById("clock").textContent =
    `${pad2(now.getHours())}:${pad2(now.getMinutes())}:${pad2(now.getSeconds())}`;

  document.getElementById("date").textContent = now.toLocaleDateString(undefined, {
    weekday:"long", year:"numeric", month:"long", day:"numeric"
  });
}
setInterval(updateClock, 250);
updateClock();

// Theme buttons
const btnCyan = document.getElementById("btnCyan");
const btnPurple = document.getElementById("btnPurple");
const btnMamba = document.getElementById("btnMamba");
const themeState = document.getElementById("themeState");

function setActive(btn){
  [btnCyan, btnPurple, btnMamba].forEach(b => b.classList.remove("active"));
  btn.classList.add("active");
}

function setTheme(mode){
  const r = document.documentElement;

  if(mode === "PURPLE"){
    r.style.setProperty("--accent","rgba(170,120,255,0.92)");
    r.style.setProperty("--accentSoft","rgba(170,120,255,0.18)");
    r.style.setProperty("--stroke","rgba(180,130,255,0.22)");
    themeState.textContent = "PURPLE";
  }else if(mode === "MAMBA"){
    r.style.setProperty("--accent","rgba(200,120,255,0.95)");
    r.style.setProperty("--accentSoft","rgba(200,120,255,0.22)");
    r.style.setProperty("--stroke","rgba(220,150,255,0.26)");
    themeState.textContent = "MAMBA";
  }else{
    r.style.setProperty("--accent","rgba(0,255,220,0.92)");
    r.style.setProperty("--accentSoft","rgba(0,255,220,0.18)");
    r.style.setProperty("--stroke","rgba(80,255,240,0.22)");
    themeState.textContent = "CYAN";
  }
}

btnCyan.addEventListener("click", () => { setTheme("CYAN"); setActive(btnCyan); });
btnPurple.addEventListener("click", () => { setTheme("PURPLE"); setActive(btnPurple); });
btnMamba.addEventListener("click", () => { setTheme("MAMBA"); setActive(btnMamba); });

// Fullscreen
document.getElementById("btnFull").addEventListener("click", () => {
  if(!document.fullscreenElement) document.documentElement.requestFullscreen?.();
  else document.exitFullscreen?.();
});

// Parallax tilt for holo stage
const stage = document.getElementById("holoStage");
let raf = null;

function onMove(e){
  if(!stage) return;
  const rect = stage.getBoundingClientRect();
  const x = (e.clientX - rect.left) / rect.width;
  const y = (e.clientY - rect.top) / rect.height;
  const rx = (0.5 - y) * 6;
  const ry = (x - 0.5) * 8;

  if(raf) cancelAnimationFrame(raf);
  raf = requestAnimationFrame(() => {
    stage.style.transform = `perspective(1200px) rotateX(${rx}deg) rotateY(${ry}deg)`;
  });
}
window.addEventListener("mousemove", onMove);

// Alive numbers + “fire when ready” vibe (simulated for now)
function rnd(min, max){ return Math.random() * (max - min) + min; }

function tickMicros(){
  document.querySelectorAll("[data-live]").forEach(el => {
    const k = el.getAttribute("data-live");
    let v = "";
    if(k === "vol") v = `${rnd(40, 88).toFixed(1)}%`;
    if(k === "flow") v = `${rnd(0.8, 3.4).toFixed(2)}x`;
    if(k === "range") v = `${rnd(12, 42).toFixed(0)} pts`;
    if(k === "heat") v = `${rnd(55, 96).toFixed(0)}`;
    el.textContent = v;
  });

  const core = document.getElementById("coreStatus");
  const exec = document.getElementById("execState");
  const gate = document.getElementById("gateState");
  const execTop = document.getElementById("execStateTop");
  const gateTop = document.getElementById("gateStateTop");
  const fire = document.getElementById("fireState");

  const armed = Math.random() > 0.80;
  core.textContent = armed ? "TRACKING SIGNAL" : "SYSTEM READY";
  exec.textContent = armed ? "ARMED" : "WAIT";
  gate.textContent = "SESSION";
  execTop.textContent = exec.textContent;
  gateTop.textContent = gate.textContent;
  fire.textContent = armed ? "FIRE WHEN READY" : "STANDBY";
}
setInterval(tickMicros, 900);
tickMicros();

// Default theme by time
(function themeByTime(){
  const h = new Date().getHours();
  if(h < 7 || h >= 17){ setTheme("PURPLE"); setActive(btnPurple); }
  else{ setTheme("CYAN"); setActive(btnCyan); }
})();
