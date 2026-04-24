// HRD Governance Platform - Core Application

const App = {
  charts: {},
  currentView: 'strategy',

  async init() {
    this._startClock();
    await HRDData.load();
    this._updateHeaderStats();
    this._initNav();
    this._renderView('strategy');
    this._initDetailPanel();
  },

  _startClock() {
    const tick = () => {
      const now = new Date();
      const el = document.getElementById('liveClock');
      if (el) el.textContent = now.toLocaleTimeString('ko-KR', { hour12: false });
    };
    tick();
    setInterval(tick, 1000);
  },

  _updateHeaderStats() {
    const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
    set('strategyCount', HRDData.strategies.length);
    set('policyCount', HRDData.policies.length);
    set('programCount', HRDData.programs.length);
  },

  _initNav() {
    document.querySelectorAll('.nav-group-toggle').forEach(toggle => {
      toggle.addEventListener('click', () => {
        const groupId = toggle.dataset.group;
        const subItems = document.getElementById('nav-group-' + groupId);
        const isOpen = toggle.classList.contains('open');
        toggle.classList.toggle('open', !isOpen);
        subItems.classList.toggle('open', !isOpen);
      });
    });

    document.querySelectorAll('.nav-item:not(.nav-group-toggle)').forEach(btn => {
      btn.addEventListener('click', () => {
        const layer = btn.dataset.layer;
        if (!layer) return;
        document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this._switchView(layer);
      });
    });
  },

  _switchView(layer) {
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    const next = document.getElementById('view-' + layer);
    if (next) next.classList.add('active');
    this.currentView = layer;
    this._renderView(layer);
  },

  _renderView(layer) {
    switch (layer) {
      case 'strategy':  this._renderStrategy();  break;
      case 'policy':    this._renderPolicy();    break;
      case 'budget':    this._renderBudget();    break;
      case 'program':   this._renderProgram();   break;
      case 'talent':    this._renderTalent();    break;
      case 'competency':this._renderCompetency();break;
      case 'ontology':  this._renderOntology();  break;
      case 'sparql':    this._renderSparql();    break;
      case 'ontograf':  this._renderOntograf();  break;
      case 'protegraf': this._renderProtegraf(); break;
      case 'coderef':   this._renderCoderef();   break;
    }
  },

  _renderOntology() {
    if (typeof VowlGraph === 'undefined') return;
    setTimeout(() => VowlGraph.build('vowl-container'), 50);
  },

  _renderOntograf() {
    if (typeof OntoGraf === 'undefined') return;
    const el = document.getElementById('ontografMain');
    if (!el || el.dataset.initialized) return;
    el.dataset.initialized = 'true';
    setTimeout(() => OntoGraf.init('ontografMain'), 50);
  },

  _renderProtegraf() {
    if (typeof ProteGraf === 'undefined') return;
    const el = document.getElementById('protegrafMain');
    if (!el || el.dataset.initialized) return;
    el.dataset.initialized = 'true';
    setTimeout(() => ProteGraf.init('protegrafMain'), 50);
  },

  _coderefInited: false,
  _renderCoderef() {
    if (this._coderefInited || typeof CodeRef === 'undefined') return;
    this._coderefInited = true;
    CodeRef.init();
  },
};

document.addEventListener('DOMContentLoaded', () => App.init());
