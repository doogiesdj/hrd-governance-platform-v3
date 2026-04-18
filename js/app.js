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
      case 'ontology':   this._renderOntology();   break;
    }
  },

  _renderOntology() {
    if (typeof VowlGraph === 'undefined') return;
    setTimeout(() => VowlGraph.build('vowl-container'), 50);
  },

  // --- Detail Panel ---
  _initDetailPanel() {
    const overlay = document.getElementById('detailOverlay');
    const closeBtn = document.getElementById('detailClose');
    if (overlay) overlay.addEventListener('click', e => { if (e.target === overlay) this._closeDetail(); });
    if (closeBtn) closeBtn.addEventListener('click', () => this._closeDetail());
    document.addEventListener('keydown', e => { if (e.key === 'Escape') this._closeDetail(); });
  },

  _openDetail(html) {
    const overlay = document.getElementById('detailOverlay');
    const body = document.getElementById('detailBody');
    if (!overlay || !body) return;
    body.innerHTML = html;
    overlay.classList.add('active');
  },

  _closeDetail() {
    const overlay = document.getElementById('detailOverlay');
    if (overlay) overlay.classList.remove('active');
  },

  _showStrategyDetail(strategy) {
    const budgetStr = strategy.totalBudgetStr || (strategy.totalBudget ? HRDData.formatWon(strategy.totalBudget) : '미배정');

    const policiesHtml = strategy.policies && strategy.policies.length
      ? strategy.policies.map(p => `<span class="detail-tag">${p.name}</span>`).join('')
      : '<span class="detail-empty">연관 정책 데이터 없음</span>';

    const orgsHtml = strategy.implementingOrgs && strategy.implementingOrgs.length
      ? strategy.implementingOrgs.map(o => `<span class="detail-tag org">${o.abbr || o.name}</span>`).join('')
      : '<span class="detail-empty">집행 기관 데이터 없음</span>';

    const tgHtml = strategy.targetGroups && strategy.targetGroups.length
      ? strategy.targetGroups.map(t => `<span class="detail-tag tg">${t}</span>`).join('')
      : '<span class="detail-empty">수혜대상 데이터 없음</span>';

    const progHtml = strategy.programs && strategy.programs.length
      ? strategy.programs.slice(0, 12).map(p => `<div class="detail-list-item"><span class="detail-dot"></span>${p.name}</div>`).join('')
        + (strategy.programs.length > 12 ? `<div class="detail-more">외 ${strategy.programs.length - 12}개 프로그램</div>` : '')
      : '<span class="detail-empty">프로그램 데이터 없음</span>';

    const compHtml = strategy.competencies && strategy.competencies.length
      ? strategy.competencies.slice(0, 10).map(c => `<span class="detail-tag comp">${c.name}</span>`).join('')
      : '<span class="detail-empty">역량 데이터 없음</span>';

    const perfHtml = strategy.performanceGoals && strategy.performanceGoals.length
      ? strategy.performanceGoals.map(g => `<div class="detail-list-item"><span class="detail-dot perf"></span>${g.name}</div>`).join('')
      : '<span class="detail-empty">성과 목표 데이터 없음</span>';

    const html = `
      <div class="detail-header-block">
        <div class="detail-strategy-label">NATIONAL STRATEGY</div>
        <h2 class="detail-title">${strategy.name}</h2>
        <div class="detail-en">${strategy.en || ''}</div>
      </div>

      <div class="detail-section">
        <div class="detail-section-title">전략 소개</div>
        <p class="detail-description">${strategy.description || `${strategy.name}은 국가 인적자원 개발의 핵심 전략으로, 관련 정책 및 교육 프로그램을 통해 추진됩니다.`}</p>
      </div>

      <div class="detail-grid-2">
        <div class="detail-section">
          <div class="detail-section-title">예산 규모</div>
          <div class="detail-budget-value">${budgetStr}</div>
        </div>
        <div class="detail-section">
          <div class="detail-section-title">연관 정책 수</div>
          <div class="detail-budget-value">${strategy.policyCount || (strategy.policies ? strategy.policies.length : 0)}개</div>
        </div>
      </div>

      <div class="detail-section">
        <div class="detail-section-title">연관 정책</div>
        <div class="detail-tags">${policiesHtml}</div>
      </div>

      <div class="detail-section">
        <div class="detail-section-title">집행 기관</div>
        <div class="detail-tags">${orgsHtml}</div>
      </div>

      <div class="detail-section">
        <div class="detail-section-title">수혜 대상</div>
        <div class="detail-tags">${tgHtml}</div>
      </div>

      <div class="detail-section">
        <div class="detail-section-title">교육 프로그램 (${strategy.programCount || 0}개)</div>
        <div class="detail-list">${progHtml}</div>
      </div>

      <div class="detail-section">
        <div class="detail-section-title">연관 역량</div>
        <div class="detail-tags">${compHtml}</div>
      </div>

      <div class="detail-section">
        <div class="detail-section-title">성과 목표</div>
        <div class="detail-list">${perfHtml}</div>
      </div>
    `;
    this._openDetail(html);
  },

  // --- Strategy View ---
  _renderStrategy() {
    const d = HRDData;
    this._setKPI('strategyTotal', d.strategies.length);
    this._setKPI('strategyPolicies', d.policies.length);
    this._setKPI('strategyBudget', d.formatWon(d.totalBudget()));
    this._setKPI('strategyPrograms', d.programs.length);

    const stratSample = d.strategies.slice(0, 11);
    const policyNamesByStrategy = {};
    stratSample.forEach(s => {
      policyNamesByStrategy[s.id] = (s.policies || []).map(p => p.name);
    });

    this._chart('strategyChart', 'bar', {
      labels: stratSample.map(s => s.name.slice(0, 14)),
      datasets: [{
        label: '관련 정책 수',
        data: stratSample.map(s => s.policyCount || (s.policies ? s.policies.length : 0)),
        backgroundColor: 'rgba(0,212,255,0.3)',
        borderColor: '#00d4ff',
        borderWidth: 1,
      }],
    }, {
      plugins: {
        tooltip: {
          callbacks: {
            title: (items) => stratSample[items[0].dataIndex]?.name || '',
            afterBody: (items) => {
              const idx = items[0].dataIndex;
              const names = policyNamesByStrategy[stratSample[idx]?.id] || [];
              if (!names.length) return [];
              return ['', '관련 정책:', ...names.map(n => `  • ${n}`)];
            },
          },
        },
      },
    });

    const listEl = document.getElementById('strategyList');
    if (listEl) {
      listEl.innerHTML = d.strategies.map(s => `
        <div class="item item-clickable" data-strategy-id="${s.id}">
          <div class="item-name">${s.name}</div>
          ${s.en ? `<div class="item-detail">${s.en}</div>` : ''}
        </div>
      `).join('');

      listEl.querySelectorAll('.item-clickable').forEach(el => {
        el.addEventListener('click', () => {
          const sid = el.dataset.strategyId;
          const strat = d.strategies.find(s => s.id === sid);
          if (strat) this._showStrategyDetail(strat);
        });
      });
    }
  },

  // --- Policy View ---
  _renderPolicy() {
    const d = HRDData;
    const policyBudgetTotal = d.policies.reduce((s, p) => s + (p.budgetAmount || 0), 0);
    const budgetedCount = d.policies.filter(p => p.budgetAmount > 0).length;
    this._setKPI('policyTotal', d.policies.length);
    this._setKPI('activePolicies', budgetedCount);
    this._setKPI('policyBudget', d.formatWon(policyBudgetTotal));
    this._setKPI('policyPrograms', d.programs.length);

    const view = document.getElementById('view-policy');

    // Inject classification toggle bar (once)
    if (view && !view.querySelector('.policy-class-bar')) {
      const chartContainer = view.querySelector('.chart-container');
      const bar = document.createElement('div');
      bar.className = 'policy-class-bar';
      bar.innerHTML = `
        <button class="policy-class-btn active" data-mode="strategy">전략별</button>
        <button class="policy-class-btn" data-mode="budget">예산 규모별</button>
        <button class="policy-class-btn" data-mode="competency">역량 분야별</button>
        <button class="policy-class-btn" data-mode="org">관리기관별</button>
      `;
      chartContainer.parentNode.insertBefore(bar, chartContainer);
      bar.querySelectorAll('.policy-class-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          bar.querySelectorAll('.policy-class-btn').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          this._policyClassMode = btn.dataset.mode;
          this._updatePolicyChart();
        });
      });
    }

    // Restructure chart area into split layout (once)
    if (view && !view.querySelector('.policy-chart-split')) {
      const chartContainer = view.querySelector('.chart-container');
      const split = document.createElement('div');
      split.className = 'policy-chart-split';
      const legendDiv = document.createElement('div');
      legendDiv.id = 'policyLegend';
      legendDiv.className = 'policy-legend-panel';
      chartContainer.parentNode.insertBefore(split, chartContainer);
      split.appendChild(chartContainer);
      chartContainer.classList.add('policy-chart-half');
      split.appendChild(legendDiv);
    }

    if (!this._policyClassMode) this._policyClassMode = 'strategy';
    this._updatePolicyChart();

    const listEl = document.getElementById('policyList');
    if (listEl) {
      listEl.innerHTML = d.policies.map(p => `
        <div class="item item-clickable" data-policy-id="${p.id}">
          <div class="item-name">${p.name}</div>
          <div class="item-detail">${p.relatedStrategyName || ''} · ${p.budgetAmountStr || '미배정'}</div>
        </div>
      `).join('');
      listEl.querySelectorAll('.item-clickable').forEach(el => {
        el.addEventListener('click', () => {
          const pol = d.policies.find(p => p.id === el.dataset.policyId);
          if (pol) this._showPolicyDetail(pol);
        });
      });
    }
  },

  _updatePolicyChart() {
    const d = HRDData;
    const mode = this._policyClassMode || 'strategy';
    const palette = ['#00d4ff','#00ff41','#ffd700','#ff3333','#9933ff','#ff6b00','#00ffcc','#ff0099','#66ff00','#ff9933','#33ccff','#99ff33'];

    const groupMap = {};
    const groupPolicies = {};
    d.policies.forEach(p => {
      let key;
      switch (mode) {
        case 'strategy':   key = p.relatedStrategyName || '미분류'; break;
        case 'budget':     key = p.budgetScale || '미배정'; break;
        case 'competency': key = (p.competencyCategories && p.competencyCategories[0]) || '미분류'; break;
        case 'org':        key = p.managingOrg || '미분류'; break;
        default:           key = '기타';
      }
      groupMap[key] = (groupMap[key] || 0) + 1;
      if (!groupPolicies[key]) groupPolicies[key] = [];
      groupPolicies[key].push(p);
    });

    const entries = Object.entries(groupMap).sort((a, b) => b[1] - a[1]);
    const labels = entries.map(e => e[0]);
    const data = entries.map(e => e[1]);
    const colors = labels.map((_, i) => palette[i % palette.length]);

    this._chart('policyChart', 'doughnut', {
      labels,
      datasets: [{ data, backgroundColor: colors.map(c => c + '99'), borderColor: colors, borderWidth: 2 }],
    }, {
      plugins: {
        tooltip: { callbacks: { label: ctx => `${ctx.label}: ${ctx.parsed}개` } },
        legend: { display: false },
      },
    });

    // Render custom vertical legend
    const legendEl = document.getElementById('policyLegend');
    if (!legendEl) return;
    legendEl.innerHTML = entries.map(([label, count], i) => `
      <div class="policy-legend-item" data-group="${label.replace(/"/g, '&quot;')}">
        <span class="policy-legend-dot" style="background:${colors[i]};box-shadow:0 0 6px ${colors[i]}88"></span>
        <span class="policy-legend-label">${label}</span>
        <span class="policy-legend-count">${count}</span>
      </div>
    `).join('');

    legendEl.querySelectorAll('.policy-legend-item').forEach(item => {
      item.addEventListener('click', () => {
        const group = item.dataset.group;
        this._showPolicyGroupPopup(group, groupPolicies[group] || []);
      });
    });
  },

  _showPolicyGroupPopup(groupName, policies) {
    const listHtml = policies.map(p => `
      <div class="detail-list-item policy-group-row" data-policy-id="${p.id}" style="cursor:pointer">
        <span class="detail-dot"></span>
        <span class="policy-group-name">${p.name}</span>
        <span class="policy-group-budget">${p.budgetAmountStr || '미배정'}</span>
      </div>
    `).join('');

    const html = `
      <div class="detail-header-block">
        <div class="detail-strategy-label">POLICY GROUP</div>
        <h2 class="detail-title">${groupName}</h2>
        <div class="detail-en">총 ${policies.length}개 정책 · 클릭하면 상세 정보 확인</div>
      </div>
      <div class="detail-section">
        <div class="detail-section-title">정책 목록</div>
        <div class="detail-list">${listHtml}</div>
      </div>
    `;
    this._openDetail(html);

    // Bind click → policy detail (replace panel content)
    document.querySelectorAll('.policy-group-row').forEach(row => {
      row.addEventListener('click', () => {
        const pol = HRDData.policies.find(p => p.id === row.dataset.policyId);
        if (pol) this._showPolicyDetail(pol);
      });
    });
  },

  _showPolicyDetail(policy) {
    const compHtml = policy.competencies && policy.competencies.length
      ? policy.competencies.map(c => `<span class="detail-tag comp">${c.name}</span>`).join('')
      : '<span class="detail-empty">역량 데이터 없음</span>';

    const catHtml = policy.competencyCategories && policy.competencyCategories.length
      ? policy.competencyCategories.map(c => `<span class="detail-tag">${c}</span>`).join('')
      : '<span class="detail-empty">역량 분야 데이터 없음</span>';

    const perfHtml = policy.performanceGoals && policy.performanceGoals.length
      ? policy.performanceGoals.map(g => {
          const val = g.value ? ` (${parseInt(g.value).toLocaleString()}명)` : '';
          return `<div class="detail-list-item"><span class="detail-dot perf"></span>${g.name}${val}</div>`;
        }).join('')
      : '<span class="detail-empty">성과 목표 데이터 없음</span>';

    const orgBlock = policy.managingOrg ? `
      <div class="detail-section">
        <div class="detail-section-title">관리 기관</div>
        <div class="detail-tags">
          <span class="detail-tag org">${policy.managingOrg}${policy.managingOrgAbbr ? ' (' + policy.managingOrgAbbr + ')' : ''}</span>
        </div>
      </div>` : '';

    const html = `
      <div class="detail-header-block">
        <div class="detail-strategy-label">PUBLIC POLICY</div>
        <h2 class="detail-title">${policy.name}</h2>
        <div class="detail-en">${policy.en || ''}</div>
      </div>

      <div class="detail-section">
        <div class="detail-section-title">연관 전략</div>
        <div class="detail-tags">
          ${policy.relatedStrategyName
            ? `<span class="detail-tag org">${policy.relatedStrategyName}</span>`
            : '<span class="detail-empty">데이터 없음</span>'}
        </div>
      </div>

      <div class="detail-grid-2">
        <div class="detail-section">
          <div class="detail-section-title">예산 규모</div>
          <div class="detail-budget-value">${policy.budgetAmountStr || '미배정'}</div>
        </div>
        <div class="detail-section">
          <div class="detail-section-title">규모 등급</div>
          <div class="detail-budget-value">${policy.budgetScale || '미배정'}</div>
        </div>
      </div>

      ${orgBlock}

      <div class="detail-section">
        <div class="detail-section-title">역량 분야</div>
        <div class="detail-tags">${catHtml}</div>
      </div>

      <div class="detail-section">
        <div class="detail-section-title">지원 역량</div>
        <div class="detail-tags">${compHtml}</div>
      </div>

      <div class="detail-section">
        <div class="detail-section-title">성과 목표</div>
        <div class="detail-list">${perfHtml}</div>
      </div>
    `;
    this._openDetail(html);
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

    const sorted = [...d.budgets].sort((a, b) => (b.amount || 0) - (a.amount || 0));

    const chartContainer = document.querySelector('#view-budget .chart-container');
    if (chartContainer) chartContainer.style.minHeight = Math.max(400, sorted.length * 28 + 60) + 'px';

    this._chart('budgetChart', 'bar', {
      labels: sorted.map(b => b.name),
      datasets: [{
        label: '예산 (원)',
        data: sorted.map(b => b.amount || 0),
        backgroundColor: 'rgba(255,215,0,0.3)',
        borderColor: '#ffd700',
        borderWidth: 1,
      }],
    }, {
      indexAxis: 'y',
      plugins: {
        tooltip: {
          callbacks: {
            label: ctx => {
              const b = sorted[ctx.dataIndex];
              return [`금액: ${b.amountStr || d.formatWon(b.amount || 0)}`, `관리기관: ${b.managingOrg || '미지정'}`, `회계연도: FY${b.fiscalYear || '2026'}`];
            },
          },
        },
        legend: { display: false },
      },
      scales: {
        y: {
          ticks: {
            color: '#c0ccd8',
            font: { size: 11 },
            callback(val) {
              const name = this.getLabelForValue(val);
              return name.length > 18 ? name.slice(0, 17) + '…' : name;
            },
          },
          grid: { color: 'rgba(26,58,74,0.5)' },
        },
        x: {
          ticks: {
            color: '#a0aab8',
            font: { size: 10 },
            callback: v => v >= 1e10 ? (v / 1e8).toFixed(0) + '억' : v >= 1e8 ? (v / 1e8).toFixed(0) + '억' : v,
          },
          grid: { color: 'rgba(26,58,74,0.5)' },
        },
      },
    });

    this._renderBudgetList('budgetList', sorted);
  },

  _renderBudgetList(containerId, budgets) {
    const el = document.getElementById(containerId);
    if (!el) return;
    const d = HRDData;
    el.innerHTML = budgets.map((b, i) => {
      const stratName = b.relatedStrategyName || (b.relatedStrategy
        ? (d.strategies.find(s => s.id === b.relatedStrategy) || {}).name || b.relatedStrategy
        : '');
      return `<div class="item budget-item" data-budget-idx="${i}" style="cursor:pointer">
        <div class="item-name">${b.name}</div>
        <div class="item-detail">${b.amountStr || d.formatWon(b.amount || 0)} · FY${b.fiscalYear || '2026'}${stratName ? ' · ' + stratName : ''}</div>
      </div>`;
    }).join('');
    el.querySelectorAll('.budget-item').forEach(row => {
      row.addEventListener('click', () => this._showBudgetDetail(budgets[+row.dataset.budgetIdx]));
    });
  },

  _showBudgetDetail(budget) {
    const d = HRDData;
    const stratId = budget.relatedStrategy;
    const strategy = stratId ? d.strategies.find(s => s.id === stratId) : null;
    const relatedPolicies = stratId ? d.policies.filter(p => p.relatedStrategy === stratId) : [];

    const stratBlock = strategy
      ? `<div class="detail-section">
          <div class="detail-section-title">연관 전략</div>
          <div class="detail-tags"><span class="detail-tag org">${strategy.name}</span></div>
        </div>`
      : '';

    const polHtml = relatedPolicies.length
      ? relatedPolicies.map(p => `<div class="detail-list-item"><span class="detail-dot"></span>${p.name}${p.budgetAmountStr ? ' <span style="color:#ffd700;font-size:11px">· ' + p.budgetAmountStr + '</span>' : ''}</div>`).join('')
      : '<span class="detail-empty">연관 정책 데이터 없음</span>';

    const html = `
      <div class="detail-header">
        <div class="detail-type-badge" style="background:rgba(255,215,0,0.12);color:#ffd700;border-color:rgba(255,215,0,0.3)">Budget</div>
        <h2 class="detail-title">${budget.name}</h2>
        ${budget.en ? `<div class="detail-en">${budget.en}</div>` : ''}
      </div>

      <div class="detail-grid-2">
        <div class="detail-section">
          <div class="detail-section-title">배정 예산</div>
          <div class="detail-budget-value">${budget.amountStr || d.formatWon(budget.amount || 0)}</div>
        </div>
        <div class="detail-section">
          <div class="detail-section-title">회계연도</div>
          <div class="detail-budget-value">FY${budget.fiscalYear || '2026'}</div>
        </div>
      </div>

      <div class="detail-section">
        <div class="detail-section-title">관리 기관</div>
        <div class="detail-tags">
          ${budget.managingOrg
            ? `<span class="detail-tag org">${budget.managingOrg}</span>`
            : '<span class="detail-empty">미지정</span>'}
        </div>
      </div>

      ${stratBlock}

      <div class="detail-section">
        <div class="detail-section-title">연관 전략 소속 정책 (${relatedPolicies.length}건)</div>
        <div class="detail-list">${polHtml}</div>
      </div>
    `;
    this._openDetail(html);
  },

  // --- Program View ---
  _renderProgram() {
    const d = HRDData;
    const orgs = [...new Set(d.programs.map(p => p.org).filter(Boolean))];
    const totalHours = d.programs.reduce((s, p) => s + (parseInt(p.hours) || 0), 0);
    const avgHours = d.programs.length ? Math.round(totalHours / d.programs.length) : 0;

    this._setKPI('totalPrograms', d.programs.length);
    this._setKPI('programParticipants', orgs.length + '개 기관');
    this._setKPI('completionRate', avgHours + '시간');
    this._setKPI('satisfaction', [...new Set(d.programs.map(p => p.competencyCategory).filter(Boolean))].length + '개 분야');

    const view = document.getElementById('view-program');

    if (view && !view.querySelector('.program-class-bar')) {
      const chartContainer = view.querySelector('.chart-container');
      const bar = document.createElement('div');
      bar.className = 'program-class-bar policy-class-bar';
      bar.innerHTML = `
        <button class="program-class-btn policy-class-btn active" data-mode="org">관리기관별</button>
        <button class="program-class-btn policy-class-btn" data-mode="strategy">전략별</button>
        <button class="program-class-btn policy-class-btn" data-mode="competency">역량분야별</button>
        <button class="program-class-btn policy-class-btn" data-mode="target">대상별</button>
      `;
      chartContainer.parentNode.insertBefore(bar, chartContainer);
      bar.querySelectorAll('.program-class-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          bar.querySelectorAll('.program-class-btn').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          this._programClassMode = btn.dataset.mode;
          this._updateProgramChart();
        });
      });
    }

    if (view && !view.querySelector('.program-chart-split')) {
      const chartContainer = view.querySelector('.chart-container');
      const split = document.createElement('div');
      split.className = 'program-chart-split policy-chart-split';
      const legendDiv = document.createElement('div');
      legendDiv.id = 'programLegend';
      legendDiv.className = 'program-legend-panel policy-legend-panel';
      chartContainer.parentNode.insertBefore(split, chartContainer);
      split.appendChild(chartContainer);
      chartContainer.classList.add('policy-chart-half');
      split.appendChild(legendDiv);
    }

    if (!this._programClassMode) this._programClassMode = 'org';
    this._updateProgramChart();

    const listEl = document.getElementById('programList');
    if (listEl) {
      listEl.innerHTML = d.programs.map(p => {
        const stratName = p.alignedStrategy
          ? (d.strategies.find(s => s.id === p.alignedStrategy) || {}).name || p.alignedStrategy
          : '';
        return `<div class="item item-clickable" data-program-id="${p.id}">
          <div class="item-name">${p.name}</div>
          <div class="item-detail">${p.org || ''}${stratName ? ' · ' + stratName : ''} · ${p.hours || '?'}h</div>
        </div>`;
      }).join('');
      listEl.querySelectorAll('.item-clickable').forEach(el => {
        el.addEventListener('click', () => {
          const prog = d.programs.find(p => p.id === el.dataset.programId);
          if (prog) this._showProgramDetail(prog);
        });
      });
    }
  },

  _updateProgramChart() {
    const d = HRDData;
    const mode = this._programClassMode || 'org';
    const palette = ['#9933ff','#00d4ff','#00ff41','#ffd700','#ff3333','#ff6b00','#00ffcc','#ff0099','#66ff00','#ff9933','#33ccff','#99ff33'];

    const groupMap = {};
    const groupPrograms = {};
    d.programs.forEach(p => {
      let key;
      switch (mode) {
        case 'org':        key = p.org || '미분류'; break;
        case 'strategy':   key = p.alignedStrategy
          ? (d.strategies.find(s => s.id === p.alignedStrategy) || {}).name || p.alignedStrategy
          : '미분류'; break;
        case 'competency': key = p.competencyCategory || '미분류'; break;
        case 'target':     key = p.targetGroup || '미분류'; break;
        default:           key = '기타';
      }
      groupMap[key] = (groupMap[key] || 0) + 1;
      if (!groupPrograms[key]) groupPrograms[key] = [];
      groupPrograms[key].push(p);
    });

    const entries = Object.entries(groupMap).sort((a, b) => b[1] - a[1]);
    const labels = entries.map(e => e[0]);
    const data = entries.map(e => e[1]);
    const colors = labels.map((_, i) => palette[i % palette.length]);

    this._chart('programChart', 'doughnut', {
      labels,
      datasets: [{ data, backgroundColor: colors.map(c => c + '99'), borderColor: colors, borderWidth: 2 }],
    }, {
      plugins: {
        tooltip: { callbacks: { label: ctx => `${ctx.label}: ${ctx.parsed}개` } },
        legend: { display: false },
      },
    });

    const legendEl = document.getElementById('programLegend');
    if (!legendEl) return;
    legendEl.innerHTML = entries.map(([label, count], i) => `
      <div class="policy-legend-item" data-group="${label.replace(/"/g, '&quot;')}">
        <span class="policy-legend-dot" style="background:${colors[i]};box-shadow:0 0 6px ${colors[i]}88"></span>
        <span class="policy-legend-label">${label}</span>
        <span class="policy-legend-count">${count}</span>
      </div>
    `).join('');

    legendEl.querySelectorAll('.policy-legend-item').forEach(item => {
      item.addEventListener('click', () => {
        const group = item.dataset.group;
        this._showProgramGroupPopup(group, groupPrograms[group] || []);
      });
    });
  },

  _showProgramGroupPopup(groupName, programs) {
    const listHtml = programs.map(p => `
      <div class="detail-list-item policy-group-row program-group-row" data-program-id="${p.id}" style="cursor:pointer">
        <span class="detail-dot"></span>
        <span class="policy-group-name">${p.name}</span>
        <span class="policy-group-budget">${p.org || ''} · ${p.hours || '?'}h</span>
      </div>
    `).join('');

    const html = `
      <div class="detail-header-block">
        <div class="detail-strategy-label">PROGRAM GROUP</div>
        <h2 class="detail-title">${groupName}</h2>
        <div class="detail-en">총 ${programs.length}개 프로그램 · 클릭하면 상세 정보 확인</div>
      </div>
      <div class="detail-section">
        <div class="detail-section-title">프로그램 목록</div>
        <div class="detail-list">${listHtml}</div>
      </div>
    `;
    this._openDetail(html);

    document.querySelectorAll('.program-group-row').forEach(row => {
      row.addEventListener('click', () => {
        const prog = HRDData.programs.find(p => p.id === row.dataset.programId);
        if (prog) this._showProgramDetail(prog);
      });
    });
  },

  _showProgramDetail(program) {
    const d = HRDData;
    const stratName = program.alignedStrategy
      ? (d.strategies.find(s => s.id === program.alignedStrategy) || {}).name || program.alignedStrategy
      : null;

    const html = `
      <div class="detail-header-block">
        <div class="detail-strategy-label">EDUCATION PROGRAM</div>
        <h2 class="detail-title">${program.name}</h2>
        <div class="detail-en">${program.en || ''}</div>
      </div>

      <div class="detail-section">
        <div class="detail-section-title">연관 전략</div>
        <div class="detail-tags">
          ${stratName
            ? `<span class="detail-tag org">${stratName}</span>`
            : '<span class="detail-empty">미분류</span>'}
        </div>
      </div>

      <div class="detail-grid-2">
        <div class="detail-section">
          <div class="detail-section-title">관리 기관</div>
          <div class="detail-budget-value">${program.org || '미지정'}${program.orgAbbr ? ' (' + program.orgAbbr + ')' : ''}</div>
        </div>
        <div class="detail-section">
          <div class="detail-section-title">교육 시간</div>
          <div class="detail-budget-value">${program.hours || '?'}시간</div>
        </div>
      </div>

      <div class="detail-section">
        <div class="detail-section-title">역량 분야</div>
        <div class="detail-tags">
          <span class="detail-tag comp">${program.competencyCategory || '미분류'}</span>
          ${program.competency ? `<span class="detail-tag">${program.competency}</span>` : ''}
          ${program.competencyEn ? `<span class="detail-tag">${program.competencyEn}</span>` : ''}
        </div>
      </div>

      <div class="detail-section">
        <div class="detail-section-title">대상 그룹</div>
        <div class="detail-tags">
          <span class="detail-tag">${program.targetGroup || '미지정'}</span>
          ${program.targetGroupEn ? `<span class="detail-tag">${program.targetGroupEn}</span>` : ''}
        </div>
      </div>

      <div class="detail-section">
        <div class="detail-section-title">프로그램 ID</div>
        <div class="detail-en" style="font-family:monospace;font-size:12px">${program.id}</div>
      </div>
    `;
    this._openDetail(html);
  },

  // --- Talent View ---
  _renderTalent() {
    const d = HRDData;
    this._setKPI('talentCount', (d.programs.length * 120).toLocaleString());
    this._setKPI('employmentRate', '76%');
    this._setKPI('competencyAchievement', '82%');
    this._setKPI('avgRating', '4.3');

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

    // Deep merge plugins
    const mergedPlugins = Object.assign({}, baseOpts.plugins, extraOpts.plugins || {});
    if (extraOpts.plugins?.tooltip) {
      mergedPlugins.tooltip = Object.assign({}, baseOpts.plugins?.tooltip, extraOpts.plugins.tooltip);
    }

    const { plugins: _ep, ...restExtra } = extraOpts;
    const opts = Object.assign({}, baseOpts, restExtra, { plugins: mergedPlugins });

    if (extraOpts.indexAxis === 'y' && opts.scales) {
      opts.indexAxis = 'y';
    }

    this.charts[canvasId] = new Chart(canvas, { type, data, options: opts });
  },
};

document.addEventListener('DOMContentLoaded', () => App.init());
