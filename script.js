// Lucen17 — minimal stable cockpit logic
(function(){
  const memoryKey = 'lucen.memory';
  const modeKey = 'nucleos.mode';
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

  // helpers
  const now = () => new Date().toISOString();
  const loadJSON = (k, d)=>{try{ return JSON.parse(localStorage.getItem(k) || JSON.stringify(d)); }catch(e){ return d; }};
  const saveJSON = (k, v)=> localStorage.setItem(k, JSON.stringify(v));

  function setMode(m){
    saveJSON(modeKey, m);
    modeGuidance.classList.toggle('active', m==='Guidance');
    modeCreation.classList.toggle('active', m==='Creation');
    // Beam breathing speed
    beam.querySelector('.beam-pulse').style.animationDuration = m==='Creation' ? '1.5s' : '3s';
  }

  function classifyTone(text){
    const t = text.toLowerCase();
    const isDirective = /(todo|do:|plan|today|goal|next|build|start|ship|fix|deploy|make)/.test(t);
    const isCreative = /(idea|imagine|design|invent|story|sketch|dream|concept)/.test(t);
    const isReflective = /(feel|thinking|learned|why|because|note|reflect|journal)/.test(t);
    if(isDirective && !isCreative) return 'Directive';
    if(isCreative && !isDirective) return 'Creative';
    if(isReflective) return 'Reflective';
    // fallback based on slider balance
    return remCreate.value>60 ? 'Creative' : 'Reflective';
  }

  function renderMemory(){
    const mem = loadJSON(memoryKey, []);
    memoryList.innerHTML = '';
    mem.slice().reverse().forEach(entry=>{
      const div = document.createElement('div');
      div.className = 'entry';
      const toneClass = entry.tone.toLowerCase();
      div.innerHTML = `
        <div class="meta"><span class="node ${toneClass}"></span>
          <span class="tone">${entry.tone}</span>
          <span>${new Date(entry.ts).toLocaleString()}</span>
        </div>
        <div class="text">${escapeHtml(entry.text)}</div>
      `;
      memoryList.appendChild(div);
    });

    // recent in Core panel
    recentList.innerHTML = '';
    mem.slice(-5).reverse().forEach(e=>{
      const li = document.createElement('li');
      li.innerHTML = `<span class="tone">[${e.tone}]</span> ${escapeHtml(e.text.slice(0,100))}`;
      recentList.appendChild(li);
    });
  }

  function escapeHtml(s){
    return s.replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  }

  function driftIfGuidance(){
    const mode = loadJSON(modeKey, 'Guidance');
    if(mode !== 'Guidance') return;
    // gentle drift using memory stats
    const mem = loadJSON(memoryKey, []);
    const creativeCount = mem.filter(m=>m.tone==='Creative').length;
    const reflectiveCount = mem.filter(m=>m.tone==='Reflective').length;
    const directiveCount = mem.filter(m=>m.tone==='Directive').length;

    // drift remembrance<->creation toward dominant tone
    const total = creativeCount + reflectiveCount + directiveCount + 1;
    const creativePull = (creativeCount/total)*20; // up to +20
    const reflectivePull = (reflectiveCount/total)*20; // up to +20
    let rc = 50 + creativePull - reflectivePull;
    rc = Math.min(100, Math.max(0, rc));
    remCreate.value = rc;

    // gen<->evo: more directives tighten (generation), more creative loosens (evolution)
    let ge = 50 + (creativeCount*2) - (directiveCount*2);
    ge = Math.min(100, Math.max(0, ge));
    genEvo.value = ge;
  }

  // Events
  beam.addEventListener('click', ()=> controlsEl.classList.toggle('hidden'));
  modeGuidance.addEventListener('click', ()=> setMode('Guidance'));
  modeCreation.addEventListener('click', ()=> setMode('Creation'));

  logBtn.addEventListener('click', ()=>{
    const text = visionInput.value.trim();
    if(!text) return;
    const mem = loadJSON(memoryKey, []);
    const tone = classifyTone(text);
    mem.push({ text, tone, ts: now() });
    saveJSON(memoryKey, mem);
    visionInput.value = '';
    renderMemory();
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

  // init
  setMode(loadJSON(modeKey, 'Guidance'));
  renderMemory();
  setInterval(driftIfGuidance, 4000);
})();
