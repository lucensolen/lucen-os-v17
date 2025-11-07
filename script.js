// enhanced front-end with divisions + gates URL field
console.log("Lucen script loaded successfully");

(function() {
  const memoryKey = 'lucen.memory';
const modeKey = 'nucleos.mode';
const divisionsKey = 'lucen.divisions';
const apiUrlKey = 'lucen.api.url';

// Load saved API URL into the input field if it exists
const savedApi = localStorage.getItem('lucen.api');
if (savedApi) {
  const apiUrlInput = document.querySelector('#apiUrlInput');
  if (apiUrlInput) apiUrlInput.value = savedApi;
}

  const now = () => new Date().toISOString();

  const loadJSON = (k, d) => {
    try {
      return JSON.parse(localStorage.getItem(k)) || d;
    } catch (e) {
      return d;
    }
  };

  const saveJSON = (k, v) => {
    localStorage.setItem(k, JSON.stringify(v));
  };

  const escapeHtml = (s) =>
    s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  const tabs = [...document.querySelectorAll('[data-tab]')];
  const panels = [...document.querySelectorAll('.tab-panel')];

  tabs.forEach((btn) =>
    btn.addEventListener('click', () => {
      tabs.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      const tab = btn.dataset.tab;
      panels.forEach((p) => p.classList.toggle('hidden', p.dataset.tab !== tab));
    })
  );

  const controlsEl = document.getElementById('controls');
  const beam = document.getElementById('beam');
  const modeGuidance = document.getElementById('modeGuidance');
  const modeCreation = document.getElementById('modeCreation');
  const remCreate = document.getElementById('remCreate');
  const genEvo = document.getElementById('genEvo');
  const visionInput = document.getElementById('visionInput');
  const logBtn = document.getElementById('logBtn');
  const exportBtn = document.getElementById('exportBtn');
  const memoryList = document.getElementById('memoryList');
  const coreBtn = document.getElementById('coreBtn');
  const corePanel = document.getElementById('corePanel');
  const recentList = document.getElementById('recentList');
  const visionBtn = document.getElementById('visionBtn');
  const visionModal = document.getElementById('visionModal');
  const closeVision = document.getElementById('closeVision');
  const backendBadge = document.getElementById('backendBadge');
  const apiUrlInput = document.getElementById('apiUrl');
  const saveApiUrlBtn = document.getElementById('saveApiUrl');
  const gateList = document.getElementById('gateList');
  const divisionPanel = document.getElementById('divisionPanel');
  const divisionTitle = document.getElementById('divisionTitle');
  const closeDivision = document.getElementById('closeDivision');
  const focusHours = document.getElementById('focusHours');
  const recentWins = document.getElementById('recentWins');
  const blockers = document.getElementById('blockers');
  const moodTone = document.getElementById('moodTone');
  const saveDivision = document.getElementById('saveDivision');

  // === Dual-mode helpers ===
function apiBase() {
  return localStorage.getItem("lucen.api")
    || document.querySelector("#apiBase")?.value
    || "";
}

async function postJSON(url, data) {
  const r = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  });
  if (!r.ok) throw new Error(`POST ${url} ${r.status}`);
  return r.json();
}

async function getJSON(url) {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`GET ${url} ${r.status}`);
  return r.json();
}

// Save reflection locally + send to server (if configured)
async function saveReflectionDual(text, tone) {
  const entry = { text, tone, ts: Date.now(), deviceId: "web" };
  const key = "lucen_memory";
  const mem = JSON.parse(localStorage.getItem(key) || "[]");
  mem.push(entry);
  localStorage.setItem(key, JSON.stringify(mem));

  const base = apiBase();
  if (base) {
    try { await postJSON(`${base}/memory`, entry); }
    catch (e) { console.warn("Server save failed:", e.message); }
  }
}

// Sync from server into UI
async function syncFromServerIntoUI() {
  const base = apiBase();
  if (!base) return;
  try {
    const items = await getJSON(`${base}/memory?limit=200`);
    renderServerMemory(items || []);
  } catch (e) {
    console.warn("Server fetch failed:", e.message);
  }
}

function renderServerMemory(items) {
  const list = document.querySelector("#memoryList");
  if (!list) return;
  const fmt = (t) => new Date(t).toLocaleString();
  list.innerHTML = items.slice().reverse().map(i => `
    <div class="card">
      <div class="tone">${i.tone || "Reflective"}</div>
      <div class="ts">${fmt(i.ts)}</div>
      <div class="txt">${i.text}</div>
    </div>
  `).join("");
}
  function setMode(m){
    saveJSON(modeKey, m);
    modeGuidance.classList.toggle('active', m==='Guidance');
    modeCreation.classList.toggle('active', m==='Creation');
    beam.querySelector('.beam-pulse').style.animationDuration = m==='Creation' ? '1.5s' : '3s';
  }
  function classifyTone(text){
    const t = text.toLowerCase();
    const dir = /(todo|do:|plan|today|goal|next|build|start|ship|fix|deploy|make)/.test(t);
    const cre = /(idea|imagine|design|invent|story|sketch|dream|concept)/.test(t);
    const ref = /(feel|thinking|learned|why|because|note|reflect|journal)/.test(t);
    if(dir && !cre) return 'Directive';
    if(cre && !dir) return 'Creative';
    if(ref) return 'Reflective';
    return remCreate.value>60 ? 'Creative' : 'Reflective';
  }
  function renderMemory(){
    const mem = loadJSON(memoryKey, []);
    memoryList.innerHTML = '';
    mem.slice().reverse().forEach(entry=>{
      const div = document.createElement('div');
      div.className = 'entry';
      const toneClass = entry.tone.toLowerCase();
      div.innerHTML = `<div class="meta"><span class="node ${toneClass}"></span>
        <span class="tone">[${entry.tone}]</span>
        <span>${new Date(entry.ts).toLocaleString()}</span></div>
        <div class="text">${escapeHtml(entry.text)}</div>`;
      memoryList.appendChild(div);
    });
    recentList.innerHTML='';
    mem.slice(-5).reverse().forEach(e=>{
      const li=document.createElement('li');
      li.innerHTML = `<span class="tone">[${e.tone}]</span> ${escapeHtml(e.text.slice(0,100))}`;
      recentList.appendChild(li);
    });
  }
  function driftIfGuidance(){
    const mode = loadJSON(modeKey, 'Guidance');
    if(mode !== 'Guidance') return;
    const mem = loadJSON(memoryKey, []);
    const creative = mem.filter(m=>m.tone==='Creative').length;
    const reflective = mem.filter(m=>m.tone==='Reflective').length;
    const directive = mem.filter(m=>m.tone==='Directive').length;
    const total = creative+reflective+directive+1;
    let rc = 50 + (creative/total)*20 - (reflective/total)*20;
    rc = Math.min(100, Math.max(0, rc));
    remCreate.value = rc;
    let ge = 50 + (creative*2) - (directive*2);
    ge = Math.min(100, Math.max(0, ge));
    genEvo.value = ge;
  }

  function openDivision(name){
    divisionTitle.textContent = name;
    const state = loadJSON(divisionsKey, {});
    const d = state[name] || { hours:0, wins:'', blockers:'', mood:'' };
    focusHours.value = d.hours || 0;
    recentWins.value = d.wins || '';
    blockers.value = d.blockers || '';
    moodTone.value = d.mood || '';
    divisionPanel.classList.remove('hidden');
  }
  function saveDivisionState(){
    const name = divisionTitle.textContent;
    const state = loadJSON(divisionsKey, {});
    state[name] = {
      hours: Number(focusHours.value||0),
      wins: recentWins.value||'',
      blockers: blockers.value||'',
      mood: moodTone.value||'',
      ts: now()
    };
    saveJSON(divisionsKey, state);
  }

  function setBackendStatus(online){
    backendBadge.textContent = online ? 'Online' : 'Offline';
    backendBadge.classList.toggle('online', online);
    backendBadge.classList.toggle('offline', !online);
  }
  async function refreshGates(){
    gateList.innerHTML = '';
    const url = loadJSON(apiUrlKey, '');
    apiUrlInput.value = url || '';
    if(!url){ setBackendStatus(false); return; }
    try{
      setBackendStatus(false);
      const res = await fetch(url + '/gates');
      if(!res.ok) throw new Error('Bad status');
      const data = await res.json();
      setBackendStatus(true);
      if(!Array.isArray(data) || !data.length){
        gateList.innerHTML = '<div class="entry"><div class="meta">No gates yet.</div></div>';
        return;
      }
      data.forEach(g=>{
        const div = document.createElement('div');
        div.className = 'entry';
        div.innerHTML = `<div class="meta"><strong>${escapeHtml(g.name)}</strong> — toll: ${escapeHtml(String(g.toll||'free'))}</div>
                         <div>${escapeHtml(g.description||'')}</div>`;
        gateList.appendChild(div);
      });
    }catch(e){
      setBackendStatus(false);
      gateList.innerHTML = '<div class="entry"><div class="meta">Cannot reach API. Check URL.</div></div>';
    }
  }

  document.querySelectorAll('[data-div]').forEach(btn=>{
    btn.addEventListener('click', ()=> openDivision(btn.dataset.div));
  });
  closeDivision.addEventListener('click', ()=> divisionPanel.classList.add('hidden'));
  saveDivision.addEventListener('click', saveDivisionState);

  beam.addEventListener('click', ()=> controlsEl.classList.toggle('hidden'));
  modeGuidance.addEventListener('click', ()=> setMode('Guidance'));
  modeCreation.addEventListener('click', ()=> setMode('Creation'));

  logBtn.addEventListener("click", async () => {
  const ta = document.querySelector("#visionInput");
  const text = (ta.value || "").trim();
  if (!text) return;
  const tone = classifyTone(text);
  await saveReflectionDual(text, tone);
  ta.value = "";
  await syncFromServerIntoUI();
});
  exportBtn.addEventListener('click', ()=>{
    const data = loadJSON(memoryKey, []);
    const blob = new Blob([JSON.stringify(data, null, 2)], {type:'application/json'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `lucen17-memory-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  });

  coreBtn.addEventListener('click', ()=> corePanel.classList.toggle('hidden'));
  visionBtn.addEventListener('click', ()=> visionModal.classList.remove('hidden'));
  closeVision.addEventListener('click', ()=> visionModal.classList.add('hidden'));

  saveApiUrlBtn.addEventListener('click', ()=>{
  const val = (apiUrlInput.value || '').trim();
  if (!val) {
    alert('Please enter a valid API URL');
    return;
  }
  localStorage.setItem('lucen.api', val);
  apiUrlInput.value = val;
  refreshGates();
  alert('API URL saved successfully');
});

  setMode(loadJSON(modeKey, 'Guidance'));
  renderMemory();
  setInterval(driftIfGuidance, 4000);
  refreshGates();

  window.addEventListener("load", async () => {
  const base = localStorage.getItem("lucen.api") || "https://lucen-os-v17.onrender.com";
  const badge = document.querySelector("#onlineBadge");

  if (!base) {
    if (badge) badge.textContent = "Offline";
    return;
  }

  try {
    const res = await fetch(`${base}/health`);
    const data = await res.json();
    if (data.ok) {
      if (badge) {
        badge.textContent = "Online";
        badge.classList.add("online");
      }
    } else if (badge) {
      badge.textContent = "Offline";
    }
  } catch (e) {
    if (badge) badge.textContent = "Offline";
  }
});

})(); // closes the Lucen self-invoking function
