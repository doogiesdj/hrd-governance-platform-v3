// HRD Governance Platform - Main Application Logic

const App = {
  charts: {},
  currentView: 'strategy',

  async init() {
    this._startClock();
    await HRDData.load();
    this._updateHeaderStats();
    this._initNav();
    this._renderView('strategy');
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
    document.querySelectorAll('.nav-item').forEach(btn => {
      btn.addEventListener('click', () => {
        const layer = btn.dataset.layer;
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
      case 'strategy': this._renderStrategy(); break;
      case 'policy': this._renderPolicy(); break;
      case 'budget': this._renderBudget(); break;
      case 'program': this._renderProgram(); break;
      case 'talent': this._renderTalent(); break;
      case 'competency': this._renderCompetency(); break;
    }
  },

  // --- Strategy View ---
  _renderStrategy() {
    const d = HRDData;
    this._setKPI('strategyTotal', d.strategies.length);
    this._setKPI('strategyPolicies', d.policies.length);
    this._setKPI('strategyBudget', d.formatWon(d.totalBudget()));
    this._setKPI('strategyPrograms', d.programs.length);

    this._chart('strategyChart', 'bar', {
      labels: d.strategies.slice(0, 8).map(s => s.name.slice(0, 14)),
      datasets: [{
        label: '관련 정책 수',
        data: d.strategies.slice(0, 8).map(() => Math.floor(Math.random() * 10 + 2)),
        backgroundColor: 'rgba(0,212,255,0.3)',
        borderColor: '#00d4ff',
        borderWidth: 1,
      }],
    });

    this._renderList('strategyList', d.strategies, s => ({
      name: s.name,
      detail: s.en,
    }));
  },

  // --- Policy View ---
  _renderPolicy() {
    const d = HRDData;
    this._setKPI('policyTotal', d.policies.length);
    this._setKPI('activePolicies', Math.round(d.policies.length * 0.85));
    this._setKPI('policyBudget', d.formatWon(d.totalBudget() * 0.6));
    this._setKPI('policyPrograms', d.programs.length);

    const typeMap = {};
    d.policies.forEach(p => { const t = p.type || 'PublicPolicy'; typeMap[t] = (typeMap[t] || 0) + 1; });
    const labels = Object.keys(typeMap);
    const colors = ['#00d4ff', '#00ff41', '#ffd700', '#ff3333', '#9933ff'];

    this._chart('policyChart', 'doughnut', {
      labels,
      datasets: [{
        data: Object.values(typeMap),
        backgroundColor: colors.slice(0, labels.length).map(c => c + '99'),
        borderColor: colors.slice(0, labels.length),
        borderWidth: 2,
      }],
    });

    this._renderList('policyList', d.policies.slice(0, 30), p => ({
      name: p.name,
      detail: p.en || p.type,
    }));
  },

  // --- Budget View ---
  _renderBudget() {
    const d = HRDData;
    const total = d.totalBudget();
    const avg = d.budgets.length ? total / d.budgets.length : 0;
    const max = d.budgets.reduce((m, b) => Math.max(m, b.amount || 0), 0);

    this._setKPI('totalBudget', d.formatWon(total));
    this._setKPI('budgetCount', d.budgets.length);
    this._setKPI('avgBudget', d.formatWon(avg));
    this._setKPI('maxBudget', d.formatWon(max));

    const sorted = [...d.budgets].sort((a, b) => (b.amount || 0) - (a.amount || 0)).slice(0, 10);
    this._chart('budgetChart', 'bar', {
      labels: sorted.map(b => b.name.slice(0, 12)),
      datasets: [{
        label: '예산 (원)',
        data: sorted.map(b => b.amount || 0),
        backgroundColor: 'rgba(255,215,0,0.3)',
        borderColor: '#ffd700',
        borderWidth: 1,
      }],
    }, { indexAxis: 'y' });

    this._renderList('budgetList', d.budgets, b => ({
      name: b.name,
      detail: `${d.formatWon(b.amount || 0)} · FY${b.fiscalYear || '2025'}`,
    }));
  },

  // --- Program View ---
  _renderProgram() {
    const d = HRDData;
    const fakeParticipants = d.programs.length * 120;

    this._setKPI('totalPrograms', d.programs.length);
    this._setKPI('programParticipants', fakeParticipants.toLocaleString());
    this._setKPI('completionRate', '87%');
    this._setKPI('satisfaction', '92%');

    this._chart('programChart', 'bar', {
      labels: d.programs.slice(0, 10).map(p => p.name.slice(0, 12)),
      datasets: [{
        label: '참여자 수',
        data: d.programs.slice(0, 10).map(() => Math.floor(Math.random() * 300 + 50)),
        backgroundColor: 'rgba(153,51,255,0.3)',
        borderColor: '#9933ff',
        borderWidth: 1,
      }],
    });

    this._renderList('programList', d.programs.slice(0, 40), p => ({
      name: p.name,
      detail: p.en || p.type,
    }));
  },

  // --- Talent View ---
  _renderTalent() {
    const d = HRDData;
    this._setKPI('talentCount', (d.programs.length * 120).toLocaleString());
    this._setKPI('employmentRate', '76%');
    this._setKPI('competencyAchievement', '82%');
    this._setKPI('avgRating', '4.3');

    const orgTypes = d.orgsByType();
    const labels = Object.keys(orgTypes);
    const colors = ['#00d4ff', '#00ff41', '#ffd700', '#ff3333', '#9933ff', '#ff8800'];

    this._chart('talentChart', 'radar', {
      labels: ['기술역량', '직무역량', '리더십', '협업', '창의혁신', '글로벌'],
      datasets: [{
        label: '현재 수준',
        data: [82, 75, 68, 88, 71, 65],
        backgroundColor: 'rgba(0,212,255,0.2)',
        borderColor: '#00d4ff',
        borderWidth: 2,
        pointBackgroundColor: '#00d4ff',
      }, {
        label: '목표 수준',
        data: [90, 85, 80, 92, 85, 80],
        backgroundColor: 'rgba(0,255,65,0.1)',
        borderColor: '#00ff41',
        borderWidth: 2,
        borderDash: [5, 5],
        pointBackgroundColor: '#00ff41',
      }],
    });

    const statsEl = document.getElementById('talentStats');
    if (statsEl) {
      statsEl.innerHTML = d.organizations.slice(0, 12).map(o => `
        <div class="stat-card">
          <div class="stat-card-label">${o.abbr || o.name.slice(0, 6)}</div>
          <div class="stat-card-value">${Math.floor(Math.random() * 500 + 100)}</div>
          <div class="stat-card-label" style="margin-top:4px;font-size:10px">${o.type}</div>
        </div>
      `).join('');
    }
  },

  // --- Competency View ---
  _renderCompetency() {
    const d = HRDData;
    this._setKPI('totalCompetencies', d.competencies.length);
    this._setKPI('developmentTarget', Math.round(d.competencies.length * 0.4));
    this._setKPI('avgProficiency', '3.2');
    this._setKPI('improvementRate', '18%');

    const sample = d.competencies.slice(0, 8);
    this._chart('competencyChart', 'bar', {
      labels: sample.map(c => c.name.slice(0, 14)),
      datasets: [{
        label: '숙련도 점수',
        data: sample.map(() => Math.floor(Math.random() * 40 + 60)),
        backgroundColor: 'rgba(0,255,65,0.3)',
        borderColor: '#00ff41',
        borderWidth: 1,
      }],
    });

    this._renderList('competencyList', d.competencies.slice(0, 30), c => ({
      name: c.name,
      detail: c.en || c.type,
    }));
  },

  // --- Helpers ---
  _setKPI(id, val) {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
  },

  _renderList(containerId, items, mapper) {
    const el = document.getElementById(containerId);
    if (!el) return;
    el.innerHTML = items.map(item => {
      const { name, detail } = mapper(item);
      return `<div class="item">
        <div class="item-name">${name}</div>
        ${detail ? `<div class="item-detail">${detail}</div>` : ''}
      </div>`;
    }).join('');
  },

  _chart(canvasId, type, data, extraOpts = {}) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;

    if (this.charts[canvasId]) {
      this.charts[canvasId].destroy();
    }

    const baseOpts = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          labels: { color: '#a0aab8', font: { size: 11 } },
        },
      },
      scales: type === 'doughnut' || type === 'radar' ? {} : {
        x: {
          ticks: { color: '#a0aab8', font: { size: 10 } },
          grid: { color: 'rgba(26,58,74,0.5)' },
        },
        y: {
          ticks: { color: '#a0aab8', font: { size: 10 } },
          grid: { color: 'rgba(26,58,74,0.5)' },
        },
      },
    };

    if (type === 'radar') {
      baseOpts.scales = {
        r: {
          ticks: { color: '#a0aab8', font: { size: 9 }, backdropColor: 'transparent' },
          grid: { color: 'rgba(26,58,74,0.7)' },
          pointLabels: { color: '#e0e8f0', font: { size: 11 } },
          angleLines: { color: 'rgba(26,58,74,0.5)' },
        },
      };
    }

    const opts = Object.assign({}, baseOpts, extraOpts);
    if (extraOpts.indexAxis === 'y' && opts.scales) {
      opts.indexAxis = 'y';
    }

    this.charts[canvasId] = new Chart(canvas, { type, data, options: opts });
  },
};

document.addEventListener('DOMContentLoaded', () => App.init());
