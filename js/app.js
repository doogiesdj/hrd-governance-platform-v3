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
      case 'sparql':     this._renderSparql();     break;
      case 'ontograf':   this._renderOntograf();   break;
      case 'coderef':    this._renderCoderef();    break;
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

  _coderefInited: false,
  _renderCoderef() {
    if (this._coderefInited || typeof CodeRef === 'undefined') return;
    this._coderefInited = true;
    CodeRef.init();
  },

  // --- SPARQL View ---
  _sparqlData: null,

  _nlqInited: false,

  async _renderSparql() {
    if (this._sparqlData) {
      this._buildSparqlUI();
      if (!this._nlqInited && typeof NLQ !== 'undefined') {
        NLQ.init(() => this._sparqlData);
        this._nlqInited = true;
      }
      return;
    }
    const container = document.getElementById('sparqlCategoryList');
    if (container) container.innerHTML = '<div class="sparql-loading">데이터 로딩 중...</div>';
    try {
      const resp = await fetch('data/sparql_results.json');
      this._sparqlData = await resp.json();
      this._buildSparqlUI();
      if (!this._nlqInited && typeof NLQ !== 'undefined') {
        NLQ.init(() => this._sparqlData);
        this._nlqInited = true;
      }
    } catch (e) {
      if (container) container.innerHTML = `<div class="sparql-error-msg">⚠ 데이터 로드 실패: ${e.message}</div>`;
    }
  },

  _buildSparqlUI() {
    const data = this._sparqlData;
    const container = document.getElementById('sparqlCategoryList');
    if (!container) return;
    container.innerHTML = '';

    data.categories.forEach(cat => {
      const sec = document.createElement('div');
      sec.className = 'sparql-category';

      const hdr = document.createElement('div');
      hdr.className = 'sparql-category-header';
      hdr.innerHTML = `<span class="sparql-category-id">${cat.id}</span><span class="sparql-category-label">${cat.label}<br><small style="opacity:.6;font-size:9px;">${cat.labelEn}</small></span><span class="sparql-category-chevron">▼</span>`;
      hdr.addEventListener('click', () => sec.classList.toggle('collapsed'));

      const list = document.createElement('div');
      list.className = 'sparql-query-list';

      cat.queries.forEach(q => {
        const btn = document.createElement('button');
        btn.className = 'sparql-query-btn';
        const qdata = data.queries[q.id];
        if (qdata && qdata.result && qdata.result.error) btn.classList.add('has-error');
        btn.innerHTML = `<span class="sparql-qid">${q.id}</span>${q.title}`;
        btn.addEventListener('click', () => {
          document.querySelectorAll('.sparql-query-btn').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          this._showSparqlResult(q.id);
        });
        list.appendChild(btn);
      });

      sec.appendChild(hdr);
      sec.appendChild(list);
      container.appendChild(sec);
    });
  },

  _showSparqlResult(qid) {
    const data = this._sparqlData;
    const qdata = data.queries[qid];
    if (!qdata) return;

    const placeholder = document.getElementById('sparqlPlaceholder');
    const content = document.getElementById('sparqlResultContent');
    const titleEl = document.getElementById('sparqlResultTitle');
    const codeEl = document.getElementById('sparqlCode');
    const tableWrap = document.getElementById('sparqlTableWrap');
    const toggleBtn = document.getElementById('sparqlToggleBtn');

    if (placeholder) placeholder.style.display = 'none';
    if (content) content.style.display = 'flex';
    if (titleEl) titleEl.textContent = `[${qid}] ${qdata.title}`;
    if (codeEl) { codeEl.textContent = qdata.sparql; codeEl.style.display = 'none'; }

    if (toggleBtn) {
      toggleBtn.classList.remove('active');
      toggleBtn.onclick = () => {
        const visible = codeEl.style.display !== 'none';
        codeEl.style.display = visible ? 'none' : 'block';
        toggleBtn.classList.toggle('active', !visible);
        toggleBtn.textContent = visible ? 'SPARQL 보기' : 'SPARQL 숨기기';
      };
    }

    if (!tableWrap) return;
    const res = qdata.result;

    if (res.error) {
      tableWrap.innerHTML = `<div class="sparql-error-msg">⚠ 쿼리 오류: ${res.error}</div>`;
      return;
    }
    if (!res.rows || res.rows.length === 0) {
      tableWrap.innerHTML = '<div class="sparql-empty-msg">결과 없음 (0 rows)</div>';
      return;
    }

    const truncNote = res.truncated ? `<div class="sparql-truncated-note">⚠ 결과가 500행으로 제한되었습니다.</div>` : '';
    const rowCount = `<div class="sparql-row-count">${res.rows.length}개 결과${res.truncated ? ' (truncated)' : ''}</div>`;

    const thead = `<thead><tr>${res.columns.map(c => `<th>${c}</th>`).join('')}</tr></thead>`;
    const tbody = `<tbody>${res.rows.map(row =>
      `<tr>${row.map(cell => `<td title="${(cell || '').replace(/"/g, '&quot;')}">${cell != null ? cell : ''}</td>`).join('')}</tr>`
    ).join('')}</tbody>`;

    tableWrap.innerHTML = rowCount + `<table class="sparql-result-table">${thead}${tbody}</table>` + truncNote;
  },

  // --- Detail Panel ---
  // Stack entries: { html: string, rebind: fn|null }
  _detailStack: [],
  _currentRebind: null,

  _initDetailPanel() {
    const overlay = document.getElementById('detailOverlay');
    const closeBtn = document.getElementById('detailClose');
    const backBtn = document.getElementById('detailBack');
    if (overlay) overlay.addEventListener('click', e => { if (e.target === overlay) this._closeDetail(); });
    if (closeBtn) closeBtn.addEventListener('click', () => this._closeDetail());
    if (backBtn) backBtn.addEventListener('click', () => this._popDetail());
    document.addEventListener('keydown', e => { if (e.key === 'Escape') this._closeDetail(); });
  },

  _openDetail(html) {
    const overlay = document.getElementById('detailOverlay');
    const body = document.getElementById('detailBody');
    if (!overlay || !body) return;
    this._detailStack = [];
    this._currentRebind = null;
    body.innerHTML = html;
    overlay.classList.add('active');
    this._updateBackBtn();
  },

  _pushDetail(html) {
    const body = document.getElementById('detailBody');
    if (!body) return;
    this._detailStack.push({ html: body.innerHTML, rebind: this._currentRebind });
    this._currentRebind = null;
    body.innerHTML = html;
    body.scrollTop = 0;
    this._updateBackBtn();
  },

  _pushDetailWith(savedHtml, renderFn) {
    this._detailStack.push({ html: savedHtml, rebind: this._currentRebind });
    this._currentRebind = null;
    renderFn();
    this._updateBackBtn();
  },

  _popDetail() {
    if (!this._detailStack.length) return;
    const body = document.getElementById('detailBody');
    if (!body) return;
    const { html, rebind } = this._detailStack.pop();
    body.innerHTML = html;
    body.scrollTop = 0;
    this._currentRebind = rebind;
    if (rebind) rebind();
    this._updateBackBtn();
  },

  _updateBackBtn() {
    const btn = document.getElementById('detailBack');
    if (btn) btn.style.display = this._detailStack.length ? 'inline-flex' : 'none';
  },

  _closeDetail() {
    const overlay = document.getElementById('detailOverlay');
    if (overlay) overlay.classList.remove('active');
    this._detailStack = [];
    this._currentRebind = null;
    this._updateBackBtn();
  },

  _showStrategyDetail(strategy) {
    const budgetStr = strategy.totalBudgetStr || (strategy.totalBudget ? HRDData.formatWon(strategy.totalBudget) : '미배정');

    const policiesHtml = strategy.policies && strategy.policies.length
      ? strategy.policies.map(p => `<span class="detail-tag detail-clickable" data-policy-id="${p.id}">${p.name}</span>`).join('')
      : '<span class="detail-empty">연관 정책 데이터 없음</span>';

    const orgsHtml = strategy.implementingOrgs && strategy.implementingOrgs.length
      ? strategy.implementingOrgs.map(o => `<span class="detail-tag org detail-clickable" data-org-id="${o.id}">${o.abbr || o.name}</span>`).join('')
      : '<span class="detail-empty">집행 기관 데이터 없음</span>';

    const tgHtml = strategy.targetGroups && strategy.targetGroups.length
      ? strategy.targetGroups.map(t => `<span class="detail-tag tg detail-clickable" data-tg="${t}">${t}</span>`).join('')
      : '<span class="detail-empty">수혜대상 데이터 없음</span>';

    const progHtml = strategy.programs && strategy.programs.length
      ? strategy.programs.slice(0, 12).map(p => `<div class="detail-list-item detail-clickable" data-program-id="${p.id}"><span class="detail-dot"></span>${p.name}</div>`).join('')
        + (strategy.programs.length > 12 ? `<div class="detail-more">외 ${strategy.programs.length - 12}개 프로그램</div>` : '')
      : '<span class="detail-empty">프로그램 데이터 없음</span>';

    const compHtml = strategy.competencies && strategy.competencies.length
      ? strategy.competencies.slice(0, 10).map(c => `<span class="detail-tag comp detail-clickable" data-comp-id="${c.id}">${c.name}</span>`).join('')
      : '<span class="detail-empty">역량 데이터 없음</span>';

    const perfHtml = strategy.performanceGoals && strategy.performanceGoals.length
      ? strategy.performanceGoals.map(g => `<div class="detail-list-item detail-clickable" data-goal-name="${g.name}"><span class="detail-dot perf"></span>${g.name}</div>`).join('')
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
        <div class="detail-section-title">연관 정책 <span class="detail-hint">클릭하면 상세 정보</span></div>
        <div class="detail-tags">${policiesHtml}</div>
      </div>

      <div class="detail-section">
        <div class="detail-section-title">집행 기관 <span class="detail-hint">클릭하면 상세 정보</span></div>
        <div class="detail-tags">${orgsHtml}</div>
      </div>

      <div class="detail-section">
        <div class="detail-section-title">수혜 대상</div>
        <div class="detail-tags">${tgHtml}</div>
      </div>

      <div class="detail-section">
        <div class="detail-section-title">교육 프로그램 (${strategy.programCount || 0}개) <span class="detail-hint">클릭하면 상세 정보</span></div>
        <div class="detail-list">${progHtml}</div>
      </div>

      <div class="detail-section">
        <div class="detail-section-title">연관 역량 <span class="detail-hint">클릭하면 상세 정보</span></div>
        <div class="detail-tags">${compHtml}</div>
      </div>

      <div class="detail-section">
        <div class="detail-section-title">성과 목표</div>
        <div class="detail-list">${perfHtml}</div>
      </div>
    `;
    this._openDetail(html);
    const rebind = () => this._bindStrategyDetailClicks(strategy);
    this._currentRebind = rebind;
    rebind();
  },

  _bindStrategyDetailClicks(strategy) {
    const body = document.getElementById('detailBody');
    if (!body) return;
    const d = HRDData;

    body.querySelectorAll('[data-policy-id]').forEach(el => {
      el.addEventListener('click', () => {
        const pol = d.policies.find(p => p.id === el.dataset.policyId)
          || (strategy.policies || []).find(p => p.id === el.dataset.policyId);
        if (pol) this._showPolicyDetailPush(pol);
      });
    });

    body.querySelectorAll('[data-org-id]').forEach(el => {
      el.addEventListener('click', () => {
        const org = d.organizations.find(o => o.id === el.dataset.orgId)
          || (strategy.implementingOrgs || []).find(o => o.id === el.dataset.orgId);
        if (org) this._pushOrgDetail(org);
      });
    });

    body.querySelectorAll('[data-program-id]').forEach(el => {
      el.addEventListener('click', () => {
        const prog = d.programs.find(p => p.id === el.dataset.programId)
          || (strategy.programs || []).find(p => p.id === el.dataset.programId);
        if (prog) this._pushProgramDetail(prog);
      });
    });

    body.querySelectorAll('[data-comp-id]').forEach(el => {
      el.addEventListener('click', () => {
        const comp = d.competencies.find(c => c.id === el.dataset.compId)
          || (strategy.competencies || []).find(c => c.id === el.dataset.compId);
        if (comp) this._pushCompDetail(comp);
      });
    });

    body.querySelectorAll('[data-goal-name]').forEach(el => {
      el.addEventListener('click', () => {
        const goal = (strategy.performanceGoals || []).find(g => g.name === el.dataset.goalName);
        if (goal) this._pushGoalDetail(goal);
      });
    });
  },

  _showPolicyDetailPush(policy) {
    const body = document.getElementById('detailBody');
    this._pushDetailWith(body ? body.innerHTML : '', () => {
      body.innerHTML = this._buildPolicyDetailHtml(policy);
      body.scrollTop = 0;
      const rebind = () => this._bindPolicyDetailClicks(policy);
      this._currentRebind = rebind;
      rebind();
    });
  },

  _buildPolicyDetailHtml(policy) {
    const d = HRDData;
    const compHtml = policy.competencies && policy.competencies.length
      ? policy.competencies.map(c => `<span class="detail-tag comp detail-clickable" data-comp-id="${c.id}">${c.name}</span>`).join('')
      : '<span class="detail-empty">역량 데이터 없음</span>';
    const catHtml = policy.competencyCategories && policy.competencyCategories.length
      ? policy.competencyCategories.map(c => `<span class="detail-tag">${c}</span>`).join('')
      : '<span class="detail-empty">역량 분야 데이터 없음</span>';
    const perfHtml = policy.performanceGoals && policy.performanceGoals.length
      ? policy.performanceGoals.map(g => {
          const val = g.value ? ` (${parseInt(g.value).toLocaleString()}명)` : '';
          return `<div class="detail-list-item detail-clickable" data-goal-name="${g.name}"><span class="detail-dot perf"></span>${g.name}${val}</div>`;
        }).join('')
      : '<span class="detail-empty">성과 목표 데이터 없음</span>';
    const managingOrgObj = policy.managingOrg
      ? d.organizations.find(o => o.name === policy.managingOrg || o.abbr === policy.managingOrg)
      : null;
    const managingOrgTag = policy.managingOrg
      ? `<span class="detail-tag org detail-clickable" ${managingOrgObj ? `data-org-id="${managingOrgObj.id}"` : `data-org-name="${policy.managingOrg}"`}>${policy.managingOrg}${policy.managingOrgAbbr ? ' (' + policy.managingOrgAbbr + ')' : ''}</span>`
      : '';
    const relOrgsHtml = policy.relatedOrgs && policy.relatedOrgs.length
      ? policy.relatedOrgs.map(orgId => {
          const org = d.organizations.find(o => o.id === orgId);
          return `<span class="detail-tag org detail-clickable" data-org-id="${orgId}">${org ? org.name : orgId}</span>`;
        }).join('')
      : '';
    const relBudgetsHtml = policy.relatedBudgets && policy.relatedBudgets.length
      ? policy.relatedBudgets.map(bId => {
          const b = d.budgets.find(x => x.id === bId);
          return b
            ? `<div class="detail-list-item"><span class="detail-dot perf"></span>${b.name}<span style="color:#ffd700;font-size:11px;margin-left:6px">${b.amountStr || ''}</span></div>`
            : `<div class="detail-list-item"><span class="detail-dot"></span>${bId}</div>`;
        }).join('')
      : '';
    const strategyTag = policy.relatedStrategyName
      ? `<span class="detail-tag org detail-clickable" data-strategy-id="${policy.relatedStrategy || ''}" data-strategy-name="${policy.relatedStrategyName}">${policy.relatedStrategyName}</span>`
      : '<span class="detail-empty">데이터 없음</span>';
    return `
      <div class="detail-header-block">
        <div class="detail-strategy-label">PUBLIC POLICY</div>
        <h2 class="detail-title">${policy.name}</h2>
        <div class="detail-en">${policy.en || ''}</div>
      </div>
      ${policy.description ? `<div class="detail-section"><div class="detail-section-title">정책 소개</div><p class="detail-description">${policy.description}</p></div>` : ''}
      <div class="detail-section">
        <div class="detail-section-title">연관 전략 <span class="detail-hint">클릭하면 상세 정보</span></div>
        <div class="detail-tags">${strategyTag}</div>
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
      ${managingOrgTag ? `<div class="detail-section"><div class="detail-section-title">관리 기관 <span class="detail-hint">클릭하면 상세 정보</span></div><div class="detail-tags">${managingOrgTag}</div></div>` : ''}
      ${relOrgsHtml ? `<div class="detail-section"><div class="detail-section-title">연관 기관 (${policy.relatedOrgs.length}개) <span class="detail-hint">클릭하면 상세 정보</span></div><div class="detail-tags">${relOrgsHtml}</div></div>` : ''}
      ${relBudgetsHtml ? `<div class="detail-section"><div class="detail-section-title">연관 예산 (${policy.relatedBudgets.length}건)</div><div class="detail-list">${relBudgetsHtml}</div></div>` : ''}
      <div class="detail-section">
        <div class="detail-section-title">역량 분야</div>
        <div class="detail-tags">${catHtml}</div>
      </div>
      <div class="detail-section">
        <div class="detail-section-title">지원 역량 <span class="detail-hint">클릭하면 상세 정보</span></div>
        <div class="detail-tags">${compHtml}</div>
      </div>
      <div class="detail-section">
        <div class="detail-section-title">성과 목표</div>
        <div class="detail-list">${perfHtml}</div>
      </div>
    `;
  },

  _bindPolicyDetailClicks(policy) {
    const body = document.getElementById('detailBody');
    if (!body) return;
    const d = HRDData;

    body.querySelectorAll('[data-strategy-id],[data-strategy-name]').forEach(el => {
      el.addEventListener('click', () => {
        const strat = (el.dataset.strategyId ? d.strategies.find(s => s.id === el.dataset.strategyId) : null)
          || d.strategies.find(s => s.name === el.dataset.strategyName);
        if (strat) this._pushStrategyDetail(strat);
      });
    });

    body.querySelectorAll('[data-org-id]').forEach(el => {
      el.addEventListener('click', () => {
        const org = d.organizations.find(o => o.id === el.dataset.orgId);
        if (org) this._pushOrgDetail(org);
      });
    });

    body.querySelectorAll('[data-org-name]').forEach(el => {
      el.addEventListener('click', () => {
        const org = d.organizations.find(o => o.name === el.dataset.orgName || o.abbr === el.dataset.orgName);
        if (org) this._pushOrgDetail(org);
      });
    });

    body.querySelectorAll('[data-comp-id]').forEach(el => {
      el.addEventListener('click', () => {
        const comp = d.competencies.find(c => c.id === el.dataset.compId)
          || (policy.competencies || []).find(c => c.id === el.dataset.compId);
        if (comp) this._pushCompDetail(comp);
      });
    });

    body.querySelectorAll('[data-goal-name]').forEach(el => {
      el.addEventListener('click', () => {
        const goal = (policy.performanceGoals || []).find(g => g.name === el.dataset.goalName);
        if (goal) this._pushGoalDetail(goal);
      });
    });
  },

  _pushStrategyDetail(strategy) {
    const body = document.getElementById('detailBody');
    this._pushDetailWith(body ? body.innerHTML : '', () => {
      const d = HRDData;
      const budgetStr = strategy.totalBudgetStr || (strategy.totalBudget ? d.formatWon(strategy.totalBudget) : '미배정');
      const policiesHtml = strategy.policies && strategy.policies.length
        ? strategy.policies.map(p => `<span class="detail-tag detail-clickable" data-policy-id="${p.id}">${p.name}</span>`).join('')
        : '<span class="detail-empty">연관 정책 데이터 없음</span>';
      const orgsHtml = strategy.implementingOrgs && strategy.implementingOrgs.length
        ? strategy.implementingOrgs.map(o => `<span class="detail-tag org detail-clickable" data-org-id="${o.id}">${o.abbr || o.name}</span>`).join('')
        : '<span class="detail-empty">집행 기관 데이터 없음</span>';
      const compHtml = strategy.competencies && strategy.competencies.length
        ? strategy.competencies.slice(0, 10).map(c => `<span class="detail-tag comp detail-clickable" data-comp-id="${c.id}">${c.name}</span>`).join('')
        : '<span class="detail-empty">역량 데이터 없음</span>';
      const perfHtml = strategy.performanceGoals && strategy.performanceGoals.length
        ? strategy.performanceGoals.map(g => `<div class="detail-list-item detail-clickable" data-goal-name="${g.name}"><span class="detail-dot perf"></span>${g.name}</div>`).join('')
        : '<span class="detail-empty">성과 목표 데이터 없음</span>';
      body.innerHTML = `
        <div class="detail-header-block">
          <div class="detail-strategy-label">NATIONAL STRATEGY</div>
          <h2 class="detail-title">${strategy.name}</h2>
          <div class="detail-en">${strategy.en || ''}</div>
        </div>
        <div class="detail-section">
          <div class="detail-section-title">전략 소개</div>
          <p class="detail-description">${strategy.description || `${strategy.name}은 국가 인적자원 개발의 핵심 전략입니다.`}</p>
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
          <div class="detail-section-title">연관 정책 <span class="detail-hint">클릭하면 상세 정보</span></div>
          <div class="detail-tags">${policiesHtml}</div>
        </div>
        <div class="detail-section">
          <div class="detail-section-title">집행 기관 <span class="detail-hint">클릭하면 상세 정보</span></div>
          <div class="detail-tags">${orgsHtml}</div>
        </div>
        <div class="detail-section">
          <div class="detail-section-title">연관 역량 <span class="detail-hint">클릭하면 상세 정보</span></div>
          <div class="detail-tags">${compHtml}</div>
        </div>
        <div class="detail-section">
          <div class="detail-section-title">성과 목표</div>
          <div class="detail-list">${perfHtml}</div>
        </div>
      `;
      body.scrollTop = 0;
      const rebind = () => this._bindStrategyDetailClicks(strategy);
      this._currentRebind = rebind;
      rebind();
    });
  },

  _pushOrgDetail(org) {
    const body = document.getElementById('detailBody');
    this._pushDetailWith(body ? body.innerHTML : '', () => {
      const d = HRDData;
      const policies = d.policies.filter(p => (p.relatedOrgs || []).includes(org.id));
      const polHtml = policies.length
        ? policies.map(p => `<div class="detail-list-item detail-clickable" data-policy-id="${p.id}"><span class="detail-dot"></span>${p.name}</div>`).join('')
        : '<span class="detail-empty">데이터 없음</span>';
      const contactHtml = (org.dept || org.mainTel || org.directTel) ? `
        <div class="detail-section">
          <div class="detail-section-title">담당 정보</div>
          <div class="detail-contact-grid">
            ${org.dept ? `<div class="detail-contact-row"><span class="detail-contact-label">담당부서</span><span class="detail-contact-value">${org.dept}</span></div>` : ''}
            ${org.mainTel ? `<div class="detail-contact-row"><span class="detail-contact-label">대표전화</span><span class="detail-contact-value">${org.mainTel}</span></div>` : ''}
            ${org.directTel ? `<div class="detail-contact-row"><span class="detail-contact-label">담당자전화</span><span class="detail-contact-value">${org.directTel}</span></div>` : ''}
          </div>
        </div>` : '';
      const detailBody = document.getElementById('detailBody');
      if (!detailBody) return;
      detailBody.innerHTML = `
        <div class="detail-header-block">
          <div class="detail-strategy-label">ORGANIZATION</div>
          <h2 class="detail-title">${org.name}</h2>
          <div class="detail-en">${org.abbr || ''}</div>
        </div>
        <div class="detail-section">
          <div class="detail-section-title">유형</div>
          <div class="detail-tags"><span class="detail-tag">${org.type || '기관'}</span></div>
        </div>
        ${contactHtml}
        ${org.description ? `<div class="detail-section"><div class="detail-section-title">설명</div><p class="detail-description">${org.description}</p></div>` : ''}
        <div class="detail-section">
          <div class="detail-section-title">관련 정책 <span class="detail-hint">클릭하면 상세 정보</span> (${policies.length}건)</div>
          <div class="detail-list">${polHtml}</div>
        </div>
      `;
      detailBody.scrollTop = 0;
      const rebind = () => this._bindOrgDetailClicks(org, policies);
      this._currentRebind = rebind;
      rebind();
    });
  },

  _bindOrgDetailClicks(org, policies) {
    const body = document.getElementById('detailBody');
    if (!body) return;
    body.querySelectorAll('[data-policy-id]').forEach(el => {
      el.addEventListener('click', () => {
        const pol = policies.find(p => p.id === el.dataset.policyId)
          || HRDData.policies.find(p => p.id === el.dataset.policyId);
        if (pol) this._showPolicyDetailPush(pol);
      });
    });
  },

  _pushProgramDetail(program) {
    const body = document.getElementById('detailBody');
    this._pushDetailWith(body ? body.innerHTML : '', () => {
      const d = HRDData;
      const compHtml = program.competencies && program.competencies.length
        ? program.competencies.map(c => `<span class="detail-tag comp">${c.name || c}</span>`).join('')
        : '<span class="detail-empty">역량 데이터 없음</span>';
      body.innerHTML = `
        <div class="detail-header-block">
          <div class="detail-strategy-label">EDUCATION PROGRAM</div>
          <h2 class="detail-title">${program.name}</h2>
          <div class="detail-en">${program.en || program.id || ''}</div>
        </div>
        ${program.description ? `<div class="detail-section"><div class="detail-section-title">프로그램 소개</div><p class="detail-description">${program.description}</p></div>` : ''}
        <div class="detail-grid-2">
          ${program.duration ? `<div class="detail-section"><div class="detail-section-title">기간</div><div class="detail-budget-value">${program.duration}</div></div>` : ''}
          ${program.targetGroup ? `<div class="detail-section"><div class="detail-section-title">대상</div><div class="detail-budget-value">${program.targetGroup}</div></div>` : ''}
        </div>
        ${program.managingOrg ? `<div class="detail-section"><div class="detail-section-title">운영 기관</div><div class="detail-tags"><span class="detail-tag org">${program.managingOrg}</span></div></div>` : ''}
        <div class="detail-section">
          <div class="detail-section-title">연관 역량</div>
          <div class="detail-tags">${compHtml}</div>
        </div>
      `;
      body.scrollTop = 0;
    });
  },

  _pushCompDetail(comp) {
    const html = `
      <div class="detail-header-block">
        <div class="detail-strategy-label">COMPETENCY</div>
        <h2 class="detail-title">${comp.name}</h2>
        <div class="detail-en">${comp.en || comp.id || ''}</div>
      </div>
      ${comp.description ? `<div class="detail-section"><div class="detail-section-title">설명</div><p class="detail-description">${comp.description}</p></div>` : ''}
      ${comp.category ? `<div class="detail-section"><div class="detail-section-title">분류</div><div class="detail-tags"><span class="detail-tag">${comp.category}</span></div></div>` : ''}
      ${comp.level ? `<div class="detail-section"><div class="detail-section-title">수준</div><div class="detail-tags"><span class="detail-tag comp">${comp.level}</span></div></div>` : ''}
    `;
    this._pushDetail(html);
  },

  _pushGoalDetail(goal) {
    const html = `
      <div class="detail-header-block">
        <div class="detail-strategy-label">PERFORMANCE GOAL</div>
        <h2 class="detail-title">${goal.name}</h2>
      </div>
      ${goal.description ? `<div class="detail-section"><div class="detail-section-title">설명</div><p class="detail-description">${goal.description}</p></div>` : ''}
      ${goal.value ? `<div class="detail-section"><div class="detail-section-title">목표값</div><div class="detail-budget-value">${parseInt(goal.value).toLocaleString()}명</div></div>` : ''}
      ${goal.year ? `<div class="detail-section"><div class="detail-section-title">목표 연도</div><div class="detail-budget-value">${goal.year}년</div></div>` : ''}
    `;
    this._pushDetail(html);
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
      <div class="detail-list-item policy-group-row detail-clickable" data-policy-id="${p.id}">
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
        <div class="detail-section-title">정책 목록 <span class="detail-hint">클릭하면 상세 정보</span></div>
        <div class="detail-list">${listHtml}</div>
      </div>
    `;
    this._openDetail(html);
    const rebind = () => {
      document.querySelectorAll('.policy-group-row').forEach(row => {
        row.addEventListener('click', () => {
          const pol = HRDData.policies.find(p => p.id === row.dataset.policyId);
          if (pol) this._showPolicyDetailPush(pol);
        });
      });
    };
    this._currentRebind = rebind;
    rebind();
  },

  _showPolicyDetail(policy) {
    const html = this._buildPolicyDetailHtml(policy);
    this._openDetail(html);
    const rebind = () => this._bindPolicyDetailClicks(policy);
    this._currentRebind = rebind;
    rebind();
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
    this._renderBudgetList('budgetList', sorted);

    // Category tabs
    this._budgetCatKey = 'byOrg';
    this._renderBudgetCatChart('byOrg');

    const tabs = document.getElementById('budgetCatTabs');
    if (tabs) {
      tabs.querySelectorAll('.budget-cat-tab').forEach(btn => {
        btn.addEventListener('click', () => {
          tabs.querySelectorAll('.budget-cat-tab').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          this._budgetCatKey = btn.dataset.cat;
          this._renderBudgetCatChart(btn.dataset.cat);
        });
      });
    }
  },

  _renderBudgetCatChart(catKey) {
    const ba = HRDData.budgetAnalysis;
    if (!ba || !ba[catKey]) {
      const el = document.getElementById('budgetCatList');
      if (el) el.innerHTML = '<span style="color:#a0aab8">데이터 로딩 중...</span>';
      return;
    }
    const groups = ba[catKey];
    const top = groups.slice(0, 20);

    const wrap = document.querySelector('.budget-cat-chart-wrap');
    if (wrap) wrap.style.height = Math.max(320, top.length * 30 + 60) + 'px';

    this._chart('budgetCatChart', 'bar', {
      labels: top.map(g => g.key),
      datasets: [{
        label: '예산합계',
        data: top.map(g => g.totalAmount),
        backgroundColor: 'rgba(255,165,0,0.35)',
        borderColor: '#ffa500',
        borderWidth: 1,
        borderRadius: 3,
      }],
    }, {
      indexAxis: 'y',
      onClick: (evt, elems) => {
        if (elems.length) this._showBudgetCatDetail(groups[elems[0].index]);
      },
      plugins: {
        tooltip: {
          callbacks: {
            label: ctx => {
              const g = top[ctx.dataIndex];
              return [`합계: ${g.totalAmountStr}`, `예산 ${g.count}건`];
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
              return name.length > 16 ? name.slice(0, 15) + '…' : name;
            },
          },
          grid: { color: 'rgba(26,58,74,0.4)' },
        },
        x: {
          ticks: {
            color: '#a0aab8',
            font: { size: 10 },
            callback: v => v >= 1e8 ? (v / 1e8).toFixed(0) + '억' : v,
          },
          grid: { color: 'rgba(26,58,74,0.4)' },
        },
      },
    });

    const listEl = document.getElementById('budgetCatList');
    if (!listEl) return;
    listEl.innerHTML = groups.map((g, i) => `
      <div class="budget-cat-item" data-idx="${i}">
        <span class="budget-cat-rank">${i + 1}</span>
        <span class="budget-cat-name">${g.key}</span>
        <span class="budget-cat-amt">${g.totalAmountStr}</span>
        <span class="budget-cat-cnt">${g.count}건</span>
      </div>
    `).join('');
    listEl.querySelectorAll('.budget-cat-item').forEach(row => {
      row.addEventListener('click', () => this._showBudgetCatDetail(groups[+row.dataset.idx]));
    });
  },

  _showBudgetCatDetail(group) {
    const d = HRDData;
    const budgets = group.budgets || [];
    const budgetRows = budgets.map(b => `
      <div class="budget-popup-item">
        <div class="budget-popup-name">${b.name}</div>
        <div class="budget-popup-meta">
          <span class="budget-popup-amt">${b.amountStr}</span>
          ${b.executedAmount > 0 ? `<span class="budget-popup-exec">집행 ${b.executedAmountStr}${b.execRate != null ? ' (' + b.execRate + '%)' : ''}</span>` : ''}
          ${b.managingOrg ? `<span class="budget-popup-org">${b.managingOrg}</span>` : ''}
          ${b.policy ? `<span class="budget-popup-tag">정책: ${b.policy}</span>` : ''}
          ${b.strategy ? `<span class="budget-popup-tag">전략: ${b.strategy}</span>` : ''}
          ${b.fiscalYear ? `<span class="budget-popup-tag">FY${b.fiscalYear}</span>` : ''}
          ${b.programs && b.programs.length ? `<span class="budget-popup-tag">프로그램 ${b.programs.length}개</span>` : ''}
        </div>
      </div>
    `).join('');

    const html = `
      <div class="detail-header">
        <div class="detail-type-badge" style="background:rgba(255,165,0,0.15);color:#ffa500;border-color:rgba(255,165,0,0.4)">예산 분류</div>
        <h2 class="detail-title">${group.key}</h2>
      </div>
      <div class="detail-grid-2">
        <div class="detail-section">
          <div class="detail-section-title">총 예산합계</div>
          <div class="detail-budget-value">${group.totalAmountStr}</div>
        </div>
        <div class="detail-section">
          <div class="detail-section-title">예산 건수</div>
          <div class="detail-budget-value">${group.count}건</div>
        </div>
      </div>
      <div class="detail-section">
        <div class="detail-section-title">예산 항목 (${budgets.length}건)</div>
        <div class="budget-popup-list">${budgetRows || '<span class="detail-empty">상세 데이터 없음</span>'}</div>
      </div>
    `;
    this._openDetail(html);
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

    // Direct related policies from budget data, or fall back to strategy-level lookup
    let relatedPolicies = [];
    if (budget.relatedPolicies && budget.relatedPolicies.length) {
      relatedPolicies = budget.relatedPolicies.map(pid => d.policies.find(p => p.id === pid)).filter(Boolean);
    } else if (stratId) {
      relatedPolicies = d.policies.filter(p => p.relatedStrategy === stratId);
    }

    const budgetTypeLabel = budget.budgetType === 'PolicyBudget' ? '정책예산' : budget.budgetType === 'OrgBudget' ? '기관예산' : 'Budget';
    const typeColor = budget.budgetType === 'PolicyBudget' ? 'rgba(255,100,0,0.15);color:#ff6400;border-color:rgba(255,100,0,0.4)' : 'rgba(255,215,0,0.12);color:#ffd700;border-color:rgba(255,215,0,0.3)';

    const stratBlock = strategy
      ? `<div class="detail-section">
          <div class="detail-section-title">연관 전략</div>
          <div class="detail-tags"><span class="detail-tag org">${strategy.name}</span></div>
        </div>`
      : '';

    const managingOrgName = (() => {
      if (budget.managingOrg) return budget.managingOrg;
      if (budget.managingOrgId) {
        const org = d.organizations.find(o => o.id === budget.managingOrgId);
        return org ? org.name : budget.managingOrgId;
      }
      return null;
    })();

    const polHtml = relatedPolicies.length
      ? relatedPolicies.map(p => `<div class="detail-list-item"><span class="detail-dot"></span>${p.name}${p.budgetAmountStr ? ' <span style="color:#ffd700;font-size:11px">· ' + p.budgetAmountStr + '</span>' : ''}</div>`).join('')
      : '<span class="detail-empty">연관 정책 데이터 없음</span>';

    const execBlock = budget.executedAmount > 0
      ? `<div class="detail-grid-2">
          <div class="detail-section">
            <div class="detail-section-title">집행 금액</div>
            <div class="detail-budget-value">${budget.executedAmountStr || d.formatWon(budget.executedAmount)}</div>
          </div>
          <div class="detail-section">
            <div class="detail-section-title">집행률</div>
            <div class="detail-budget-value">${budget.execRate != null ? budget.execRate + '%' : '-'}</div>
          </div>
        </div>` : '';

    const html = `
      <div class="detail-header">
        <div class="detail-type-badge" style="background:${typeColor}">${budgetTypeLabel}</div>
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

      ${execBlock}

      <div class="detail-section">
        <div class="detail-section-title">관리 기관</div>
        <div class="detail-tags">
          ${managingOrgName
            ? `<span class="detail-tag org">${managingOrgName}</span>`
            : '<span class="detail-empty">미지정</span>'}
        </div>
      </div>

      ${stratBlock}

      <div class="detail-section">
        <div class="detail-section-title">연관 정책 (${relatedPolicies.length}건)</div>
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

    const orgInfo = (() => {
      if (program.orgId) return d.organizations.find(o => o.id === program.orgId) || null;
      return null;
    })();
    const orgDisplay = orgInfo
      ? orgInfo.name + (orgInfo.abbr ? ' (' + orgInfo.abbr + ')' : '')
      : (program.org || '미지정') + (program.orgAbbr ? ' (' + program.orgAbbr + ')' : '');

    const targetGroupInfo = (() => {
      if (program.targetGroupId) {
        const tg = d.targetGroups ? d.targetGroups.find(t => t.id === program.targetGroupId) : null;
        return tg ? tg.name : program.targetGroupId;
      }
      return null;
    })();

    const budgetInfo = (() => {
      if (program.budgetCode) {
        const b = d.budgets.find(x => x.id === program.budgetCode);
        return b ? `${b.name} (${b.amountStr || d.formatWon(b.amount || 0)})` : program.budgetCode;
      }
      return null;
    })();

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
          <div class="detail-budget-value" style="font-size:13px">${orgDisplay}</div>
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
          <span class="detail-tag">${targetGroupInfo || program.targetGroup || '미지정'}</span>
          ${program.targetGroupEn ? `<span class="detail-tag">${program.targetGroupEn}</span>` : ''}
        </div>
      </div>

      ${budgetInfo ? `
      <div class="detail-section">
        <div class="detail-section-title">연관 예산</div>
        <div class="detail-tags"><span class="detail-tag" style="color:#ffd700">${budgetInfo}</span></div>
      </div>` : ''}

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

    // Use real Person data for KPIs
    const personOrgs = [...new Set(d.persons.map(p => p.orgId).filter(Boolean))];
    const personRoles = [...new Set(d.persons.map(p => p.role).filter(Boolean))];
    const personTargets = [...new Set(d.persons.map(p => p.targetGroupId).filter(Boolean))];

    this._setKPI('talentCount', d.persons.length.toLocaleString() + '명');
    this._setKPI('employmentRate', personOrgs.length + '개 기관');
    this._setKPI('competencyAchievement', personRoles.length + '개 역할유형');
    this._setKPI('avgRating', d.programs.length + '개 과정');

    const view = document.getElementById('view-talent');

    if (view && !view.querySelector('.talent-class-bar')) {
      const chartContainer = view.querySelector('.chart-container');
      const bar = document.createElement('div');
      bar.className = 'talent-class-bar policy-class-bar';
      bar.innerHTML = `
        <button class="talent-class-btn policy-class-btn active" data-mode="competency">역량별</button>
        <button class="talent-class-btn policy-class-btn" data-mode="org">기관별</button>
        <button class="talent-class-btn policy-class-btn" data-mode="strategy">전략별</button>
        <button class="talent-class-btn policy-class-btn" data-mode="target">대상별</button>
      `;
      chartContainer.parentNode.insertBefore(bar, chartContainer);
      bar.querySelectorAll('.talent-class-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          bar.querySelectorAll('.talent-class-btn').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          this._talentClassMode = btn.dataset.mode;
          this._updateTalentChart();
        });
      });
    }

    // Split layout: radar left, description right
    if (view && !view.querySelector('.talent-chart-split')) {
      const chartContainer = view.querySelector('.chart-container');
      const split = document.createElement('div');
      split.className = 'talent-chart-split policy-chart-split';
      const descDiv = document.createElement('div');
      descDiv.id = 'talentDesc';
      descDiv.className = 'talent-desc-panel policy-legend-panel';
      chartContainer.parentNode.insertBefore(split, chartContainer);
      split.appendChild(chartContainer);
      chartContainer.classList.add('policy-chart-half');
      split.appendChild(descDiv);
    }

    if (!this._talentClassMode) this._talentClassMode = 'competency';
    this._updateTalentChart();
    this._renderTalentStats();
  },

  _updateTalentChart() {
    const d = HRDData;
    const mode = this._talentClassMode || 'competency';

    // Build group → program count map
    const groupCount = {};
    d.programs.forEach(p => {
      let key;
      switch (mode) {
        case 'competency': key = p.competencyCategory || '미분류'; break;
        case 'org':        key = p.org || '미분류'; break;
        case 'strategy':   key = p.alignedStrategy
          ? (d.strategies.find(s => s.id === p.alignedStrategy) || {}).name || p.alignedStrategy
          : '미분류'; break;
        case 'target':     key = p.targetGroup || '미분류'; break;
        default:           key = '기타';
      }
      groupCount[key] = (groupCount[key] || 0) + 1;
    });

    const entries = Object.entries(groupCount).sort((a, b) => b[1] - a[1]).slice(0, 8);
    const labels = entries.map(e => e[0]);
    const counts = entries.map(e => e[1]);
    const maxCount = Math.max(...counts, 1);

    // Normalize to 30–90 for current level; target = min(100, current + 10~15)
    const currentData = counts.map(c => Math.round(30 + (c / maxCount) * 60));
    const targetData  = currentData.map(v => Math.min(100, Math.round(v * 1.15)));

    const modeDescriptions = {
      competency: {
        'AI·인프라 역량':     'AI·클라우드·데이터 인프라 설계 및 운영 역량',
        '기술보안 역량':      '사이버보안·정보보호 전문 기술 역량',
        '녹색기술·탄소중립 역량': '탄소중립·친환경 기술 및 에너지 전환 역량',
        '데이터 활용 역량':   '데이터 분석·시각화·의사결정 지원 역량',
        '디자인 역량':        'UX/UI 및 서비스 디자인 창의적 역량',
        '마케팅 전략 역량':   '디지털 마케팅·브랜딩·시장 전략 역량',
        '바이오헬스 역량':    '바이오·헬스케어 기술 및 임상 역량',
        '반도체 설계 역량':   '반도체 회로 설계 및 첨단소재 개발 역량',
        '소프트웨어 개발 역량': '프로그래밍·SW 아키텍처 설계 역량',
        '행정법무 역량':      '공공행정·법무·정책 기획 역량',
      },
      org: {
        '고용노동부':         '직업훈련·고용서비스·노동시장 정책 총괄',
        '과학기술정보통신부': 'AI·ICT·디지털 전환 R&D 및 인재 양성',
        '교육부':             '학교·대학 교육과정 및 평생학습 정책',
        '국방부':             '국방 전문인력 양성 및 방산기술 역량 개발',
        '문화체육관광부':     '문화콘텐츠·관광·스포츠 분야 인재 육성',
        '산업통상자원부':     '산업기술·에너지·통상 분야 전문인력 지원',
        '인사혁신처':         '공무원 역량개발 및 공직 인재 경쟁력 강화',
      },
      strategy: {},
      target: {
        '경력단절여성': '경력 단절 후 재취업을 준비하는 여성 대상',
        '다문화가정':   '다문화 배경 구성원의 역량 강화 지원',
        '은퇴자':       '퇴직 후 사회 재참여 및 재취업 준비 인력',
        '일반인':       '특별한 제한 없이 참여 가능한 일반 시민',
        '재직자':       '현재 직장에 재직 중인 종사자 대상 향상 교육',
        '전문가':       '해당 분야 전문 지식 보유자 심화 역량 개발',
        '청소년':       '미래 인재 육성을 위한 청소년 대상 교육',
        '취약계층':     '경제적·사회적 취약 계층의 자립 역량 지원',
      },
    };

    this._chart('talentChart', 'radar', {
      labels,
      datasets: [{
        label: '현재 프로그램 수준',
        data: currentData,
        backgroundColor: 'rgba(0,212,255,0.2)',
        borderColor: '#00d4ff',
        borderWidth: 2,
        pointBackgroundColor: '#00d4ff',
      }, {
        label: '목표 수준',
        data: targetData,
        backgroundColor: 'rgba(0,255,65,0.08)',
        borderColor: '#00ff41',
        borderWidth: 2,
        borderDash: [5, 5],
        pointBackgroundColor: '#00ff41',
      }],
    }, {
      plugins: {
        legend: {
          display: true,
          labels: { color: '#c0ccd8', font: { size: 11 } },
        },
        tooltip: {
          callbacks: {
            label: ctx => {
              const entry = entries[ctx.dataIndex];
              if (!entry) return ctx.dataset.label + ': ' + ctx.parsed.r;
              return ctx.datasetIndex === 0
                ? `현재: ${entry[1]}개 프로그램 (지수 ${ctx.parsed.r})`
                : `목표: 지수 ${ctx.parsed.r}`;
            },
          },
        },
      },
      scales: {
        r: {
          min: 0, max: 100,
          ticks: { display: false },
          grid: { color: 'rgba(0,212,255,0.15)' },
          angleLines: { color: 'rgba(0,212,255,0.2)' },
          pointLabels: { color: '#c0ccd8', font: { size: 10 } },
        },
      },
    });

    // Right-side description panel
    const descEl = document.getElementById('talentDesc');
    if (!descEl) return;
    const descMap = mode === 'strategy'
      ? Object.fromEntries(d.strategies.map(s => [s.name, s.description || s.en || '국가 핵심 전략 분야']))
      : (modeDescriptions[mode] || {});

    const gapLabel = { competency: '역량분야', org: '기관', strategy: '전략', target: '대상그룹' };
    descEl.innerHTML = `
      <div style="font-size:11px;color:#00d4ff;font-weight:600;letter-spacing:.06em;margin-bottom:10px;padding-bottom:6px;border-bottom:1px solid rgba(0,212,255,0.2)">
        ${gapLabel[mode] || ''} 현황 · 목표 갭
      </div>
      ${entries.map(([label, count], i) => {
        const current = currentData[i];
        const target  = targetData[i];
        const gap     = target - current;
        const desc    = descMap[label] || '';
        const pct     = Math.round((current / 100) * 100);
        return `
          <div class="talent-desc-item" style="margin-bottom:12px;padding-bottom:10px;border-bottom:1px solid rgba(255,255,255,0.05)">
            <div style="display:flex;align-items:center;gap:6px;margin-bottom:3px">
              <span style="width:8px;height:8px;border-radius:50%;background:#00d4ff;display:inline-block;flex-shrink:0"></span>
              <span style="font-size:12px;font-weight:600;color:#e0e8f0">${label}</span>
              <span style="margin-left:auto;font-size:11px;color:#00d4ff">${count}개</span>
            </div>
            ${desc ? `<div style="font-size:10px;color:#8090a0;margin:2px 0 4px 14px;line-height:1.4">${desc}</div>` : ''}
            <div style="margin-left:14px">
              <div style="display:flex;justify-content:space-between;font-size:10px;color:#607080;margin-bottom:2px">
                <span>현재 ${current}</span><span>목표 ${target} <span style="color:#00ff41">+${gap}</span></span>
              </div>
              <div style="height:4px;background:rgba(255,255,255,0.08);border-radius:2px;overflow:hidden">
                <div style="height:100%;width:${pct}%;background:linear-gradient(90deg,#00d4ff,#0099cc);border-radius:2px"></div>
              </div>
            </div>
          </div>`;
      }).join('')}
    `;
  },

  _renderTalentStats() {
    const d = HRDData;
    const statsEl = document.getElementById('talentStats');
    if (!statsEl) return;

    // Group persons by orgId
    const orgPersonMap = {};
    d.persons.forEach(p => {
      const key = p.orgId || '미분류';
      if (!orgPersonMap[key]) orgPersonMap[key] = [];
      orgPersonMap[key].push(p);
    });

    // Fallback: group programs by org if no person data
    const hasPeople = d.persons.length > 0;
    if (!hasPeople) {
      const orgMap = {};
      d.programs.forEach(p => {
        const key = p.org || '미분류';
        if (!orgMap[key]) orgMap[key] = [];
        orgMap[key].push(p);
      });
      const entries = Object.entries(orgMap).sort((a, b) => b[1].length - a[1].length);
      statsEl.innerHTML = entries.map(([orgName, progs]) => {
        const abbr = (d.organizations.find(o => o.name === orgName) || {}).abbr || orgName.slice(0, 4);
        const cats = [...new Set(progs.map(p => p.competencyCategory).filter(Boolean))].length;
        return `<div class="stat-card talent-stat-card" data-org="${orgName.replace(/"/g, '&quot;')}" style="cursor:pointer">
          <div class="stat-card-label">${abbr}</div>
          <div class="stat-card-value">${progs.length}</div>
          <div class="stat-card-label" style="margin-top:4px;font-size:10px">${cats}개 역량분야</div>
        </div>`;
      }).join('');
      statsEl.querySelectorAll('.talent-stat-card').forEach(card => {
        card.addEventListener('click', () => {
          const orgName = card.dataset.org;
          this._showTalentOrgDetail(orgName, orgMap[orgName] || []);
        });
      });
      return;
    }

    const entries = Object.entries(orgPersonMap).sort((a, b) => b[1].length - a[1].length);

    statsEl.innerHTML = entries.map(([orgId, persons]) => {
      const orgInfo = d.organizations.find(o => o.id === orgId) || {};
      const abbr = orgInfo.abbr || orgInfo.name || orgId.slice(0, 6);
      const roles = [...new Set(persons.map(p => p.role).filter(Boolean))].length;
      return `<div class="stat-card talent-stat-card" data-orgid="${orgId.replace(/"/g, '&quot;')}" style="cursor:pointer">
        <div class="stat-card-label">${abbr}</div>
        <div class="stat-card-value">${persons.length.toLocaleString()}</div>
        <div class="stat-card-label" style="margin-top:4px;font-size:10px">${roles}개 역할유형</div>
      </div>`;
    }).join('');

    statsEl.querySelectorAll('.talent-stat-card').forEach(card => {
      card.addEventListener('click', () => {
        const orgId = card.dataset.orgid;
        this._showTalentPersonDetail(orgId, orgPersonMap[orgId] || []);
      });
    });
  },

  _showTalentPersonDetail(orgId, persons) {
    const d = HRDData;
    const orgInfo = d.organizations.find(o => o.id === orgId) || {};
    const roles = [...new Set(persons.map(p => p.role).filter(Boolean))];
    const targets = [...new Set(persons.map(p => p.targetGroupId).filter(Boolean))];
    const levels = [...new Set(persons.map(p => p.competencyLevel).filter(Boolean))];

    const roleHtml = roles.length
      ? roles.map(r => `<span class="detail-tag comp">${r}</span>`).join('')
      : '<span class="detail-empty">없음</span>';
    const targetHtml = targets.length
      ? targets.map(t => `<span class="detail-tag">${t}</span>`).join('')
      : '<span class="detail-empty">없음</span>';
    const levelHtml = levels.length
      ? levels.map(l => `<span class="detail-tag">${l}</span>`).join('')
      : '<span class="detail-empty">없음</span>';

    const samplePersons = persons.slice(0, 20);
    const personListHtml = samplePersons.map(p => `
      <div class="detail-list-item">
        <span class="detail-dot"></span>
        <span style="flex:1">${p.name || p.id}</span>
        <span style="color:#a0aab8;font-size:11px">${p.role || ''} · ${p.competencyLevel || ''}</span>
      </div>
    `).join('') + (persons.length > 20 ? `<div class="detail-list-item" style="color:#607080;font-size:11px">… 외 ${persons.length - 20}명</div>` : '');

    const html = `
      <div class="detail-header-block">
        <div class="detail-strategy-label">ORGANIZATION · PEOPLE</div>
        <h2 class="detail-title">${orgInfo.name || orgId}</h2>
        <div class="detail-en">${orgInfo.en || ''}</div>
      </div>

      <div class="detail-grid-2">
        <div class="detail-section">
          <div class="detail-section-title">소속 인원</div>
          <div class="detail-budget-value">${persons.length.toLocaleString()}명</div>
        </div>
        <div class="detail-section">
          <div class="detail-section-title">역할 유형 수</div>
          <div class="detail-budget-value">${roles.length}개</div>
        </div>
      </div>

      <div class="detail-section">
        <div class="detail-section-title">역할 유형</div>
        <div class="detail-tags">${roleHtml}</div>
      </div>
      <div class="detail-section">
        <div class="detail-section-title">대상 그룹</div>
        <div class="detail-tags">${targetHtml}</div>
      </div>
      <div class="detail-section">
        <div class="detail-section-title">역량 수준</div>
        <div class="detail-tags">${levelHtml}</div>
      </div>
      <div class="detail-section">
        <div class="detail-section-title">인원 샘플 (최대 20명)</div>
        <div class="detail-list">${personListHtml}</div>
      </div>
    `;
    this._openDetail(html);
  },

  _showTalentOrgDetail(orgName, programs) {
    const d = HRDData;
    const orgInfo = d.organizations.find(o => o.name === orgName) || {};
    const strategies = [...new Set(programs.map(p => {
      if (!p.alignedStrategy) return null;
      return (d.strategies.find(s => s.id === p.alignedStrategy) || {}).name || p.alignedStrategy;
    }).filter(Boolean))];
    const compCats = [...new Set(programs.map(p => p.competencyCategory).filter(Boolean))];
    const targetGroups = [...new Set(programs.map(p => p.targetGroup).filter(Boolean))];
    const totalHours = programs.reduce((s, p) => s + (parseInt(p.hours) || 0), 0);

    const stratHtml = strategies.length
      ? strategies.map(s => `<span class="detail-tag org">${s}</span>`).join('')
      : '<span class="detail-empty">없음</span>';
    const compHtml = compCats.length
      ? compCats.map(c => `<span class="detail-tag comp">${c}</span>`).join('')
      : '<span class="detail-empty">없음</span>';
    const targetHtml = targetGroups.length
      ? targetGroups.map(t => `<span class="detail-tag">${t}</span>`).join('')
      : '<span class="detail-empty">없음</span>';

    const progListHtml = programs.map(p => `
      <div class="detail-list-item">
        <span class="detail-dot"></span>
        <span style="flex:1">${p.name}</span>
        <span style="color:#a0aab8;font-size:11px">${p.competencyCategory || ''} · ${p.hours || '?'}h</span>
      </div>
    `).join('');

    const html = `
      <div class="detail-header-block">
        <div class="detail-strategy-label">MANAGING ORGANIZATION</div>
        <h2 class="detail-title">${orgName}</h2>
        <div class="detail-en">${orgInfo.en || ''}</div>
      </div>

      <div class="detail-grid-2">
        <div class="detail-section">
          <div class="detail-section-title">운영 프로그램 수</div>
          <div class="detail-budget-value">${programs.length}개</div>
        </div>
        <div class="detail-section">
          <div class="detail-section-title">총 교육 시간</div>
          <div class="detail-budget-value">${totalHours.toLocaleString()}h</div>
        </div>
      </div>

      <div class="detail-section">
        <div class="detail-section-title">연관 전략</div>
        <div class="detail-tags">${stratHtml}</div>
      </div>
      <div class="detail-section">
        <div class="detail-section-title">역량 분야</div>
        <div class="detail-tags">${compHtml}</div>
      </div>
      <div class="detail-section">
        <div class="detail-section-title">교육 대상</div>
        <div class="detail-tags">${targetHtml}</div>
      </div>
      <div class="detail-section">
        <div class="detail-section-title">프로그램 목록</div>
        <div class="detail-list">${progListHtml}</div>
      </div>
    `;
    this._openDetail(html);
  },

  // --- Competency View ---

  // Ontology-based classification maps
  // Protege 온톨로지 3단계 계층 구조 레이블 (Level2)
  _COMP_L2_LABEL: {
    'Business_Admin':   '비즈니스 행정 (Business_Admin)',
    'ICT_Dev':          'ICT 개발 (ICT_Dev)',
    'Industrial_Tech':  '산업기술 (Industrial_Tech)',
    'Basic_Academic':   '기초학업 (Basic_Academic)',
    'Civic_Literacy':   '시민 리터러시 (Civic_Literacy)',
    'Digital_Literacy': '디지털 리터러시 (Digital_Literacy)',
    'Interpersonal':    '대인관계 (Interpersonal)',
    'Problem_Solving':  '문제해결 (Problem_Solving)',
    'Self_Management':  '자기관리 (Self_Management)',
  },

  _COMP_L2_DESC: {
    'Business_Admin':   '경영·마케팅·전략기획 등 비즈니스 행정 전문 역량. Protege 계층: HardSkill > Business_Admin',
    'ICT_Dev':          'AI·인프라·소프트웨어 개발 등 ICT 기술 역량. Protege 계층: HardSkill > ICT_Dev',
    'Industrial_Tech':  '제조·공공서비스 등 산업 현장 전문 기술 역량. Protege 계층: HardSkill > Industrial_Tech',
    'Basic_Academic':   'CS·수리·언어 등 학습 기반이 되는 기초학업 역량. Protege 계층: Literacy > Basic_Academic',
    'Civic_Literacy':   '시민의식·사회적 가치·윤리 등 시민 리터러시. Protege 계층: Literacy > Civic_Literacy',
    'Digital_Literacy': '데이터·AI 활용 및 디지털 보안 리터러시 역량. Protege 계층: Literacy > Digital_Literacy',
    'Interpersonal':    '협업·리더십·네트워킹 등 대인관계 역량. Protege 계층: SoftSkill > Interpersonal',
    'Problem_Solving':  '창의성·사고력 등 문제해결 역량. Protege 계층: SoftSkill > Problem_Solving',
    'Self_Management':  '적응력·신뢰성 등 자기관리 역량. Protege 계층: SoftSkill > Self_Management',
  },

  // Level3 레이블
  _COMP_L3_LABEL: {
    'Management':           '경영관리 (Management)',
    'Marketing_Sales':      '마케팅·영업 (Marketing_Sales)',
    'Marketing_Strategy':   '마케팅 전략 (Marketing_Strategy)',
    'AI_and_Infrastructure':'AI·인프라 (AI_and_Infrastructure)',
    'Software':             '소프트웨어 (Software)',
    'Manufacturing':        '제조·생산 (Manufacturing)',
    'Service_Public':       '공공서비스 (Service_Public)',
    'CS_Foundation':        'CS 기초 (CS_Foundation)',
    'Language_and_Math':    '언어·수리 (Language_and_Math)',
    'Social_Value':         '사회적 가치 (Social_Value)',
    'Data_Fluency':         '데이터 활용 (Data_Fluency)',
    'Data_and_AI':          '데이터·AI (Data_and_AI)',
    'Tech_Security':        '기술보안 (Tech_Security)',
    'Collaboration':        '협업 (Collaboration)',
    'Leadership':           '리더십 (Leadership)',
    'Thinking_Skill':       '사고력 (Thinking_Skill)',
    'Adaptability':         '적응력 (Adaptability)',
    'Reliability':          '신뢰성 (Reliability)',
  },

  _renderCompetency() {
    const d = HRDData;
    const hardCount = d.competencies.filter(c => c.class === 'HardSkill').length;
    const litCount  = d.competencies.filter(c => c.class === 'Literacy').length;
    const softCount = d.competencies.filter(c => c.class === 'SoftSkill').length;

    this._setKPI('totalCompetencies', d.competencies.length);
    this._setKPI('developmentTarget', hardCount + '개 전문기술');
    this._setKPI('avgProficiency', litCount + '개 기초소양');
    this._setKPI('improvementRate', softCount + '개 소프트스킬');

    const view = document.getElementById('view-competency');

    if (view && !view.querySelector('.comp-class-bar')) {
      const chartContainer = view.querySelector('.chart-container');
      const bar = document.createElement('div');
      bar.className = 'comp-class-bar policy-class-bar';
      bar.innerHTML = `
        <button class="comp-class-btn policy-class-btn active" data-mode="all">전체</button>
        <button class="comp-class-btn policy-class-btn" data-mode="HardSkill">Hard Skill</button>
        <button class="comp-class-btn policy-class-btn" data-mode="Literacy">Literacy</button>
        <button class="comp-class-btn policy-class-btn" data-mode="SoftSkill">Soft Skill</button>
      `;
      chartContainer.parentNode.insertBefore(bar, chartContainer);
      bar.querySelectorAll('.comp-class-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          bar.querySelectorAll('.comp-class-btn').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          this._compClassMode = btn.dataset.mode;
          this._updateCompetencyChart();
        });
      });
    }

    if (view && !view.querySelector('.comp-chart-split')) {
      const chartContainer = view.querySelector('.chart-container');
      const split = document.createElement('div');
      split.className = 'comp-chart-split policy-chart-split';
      const legendDiv = document.createElement('div');
      legendDiv.id = 'compLegend';
      legendDiv.className = 'comp-legend-panel policy-legend-panel';
      chartContainer.parentNode.insertBefore(split, chartContainer);
      split.appendChild(chartContainer);
      chartContainer.classList.add('policy-chart-half');
      split.appendChild(legendDiv);
    }

    if (!this._compClassMode) this._compClassMode = 'all';
    this._updateCompetencyChart();

    const listEl = document.getElementById('competencyList');
    if (listEl) {
      listEl.innerHTML = d.competencies.map(c => {
        const cls = c.class || '미분류';
        const l2 = this._COMP_L2_LABEL[c.level2] || c.level2 || '';
        const l3 = this._COMP_L3_LABEL[c.level3] || c.level3 || '';
        const clsColor = { HardSkill: '#00d4ff', Literacy: '#ffd700', SoftSkill: '#00ff41' }[cls] || '#a0aab8';
        return `<div class="item item-clickable" data-comp-id="${c.id}">
          <div class="item-name">${c.name || c.en}</div>
          <div class="item-detail">
            <span style="color:${clsColor};font-size:10px;font-weight:600">${cls}</span>
            · ${l2} · ${l3}
          </div>
        </div>`;
      }).join('');
      listEl.querySelectorAll('.item-clickable').forEach(el => {
        el.addEventListener('click', () => {
          const comp = d.competencies.find(c => c.id === el.dataset.compId);
          if (comp) this._showCompetencyDetail(comp);
        });
      });
    }
  },

  _updateCompetencyChart() {
    const d = HRDData;
    const mode = this._compClassMode || 'all';
    const l2Label = this._COMP_L2_LABEL;
    const l2Desc  = this._COMP_L2_DESC;
    const palette = {
      HardSkill: ['#00d4ff','#0099cc','#006699'],
      Literacy:  ['#ffd700','#ffaa00','#ff8800'],
      SoftSkill: ['#00ff41','#00cc33','#009922'],
    };
    const allPalette = ['#00d4ff','#ffd700','#00ff41'];

    // Level2 sub-groups per main class
    const L2_ORDER = {
      HardSkill: ['Business_Admin','ICT_Dev','Industrial_Tech'],
      Literacy:  ['Basic_Academic','Civic_Literacy','Digital_Literacy'],
      SoftSkill: ['Interpersonal','Problem_Solving','Self_Management'],
    };

    let entries, colors, groupComps;

    if (mode === 'all') {
      const groups = { HardSkill: [], Literacy: [], SoftSkill: [] };
      const displayLabel = {
        HardSkill: 'Hard Skill (전문기술)',
        Literacy:  'Literacy (기초소양)',
        SoftSkill: 'Soft Skill (소프트스킬)',
      };
      d.competencies.forEach(c => { if (groups[c.class]) groups[c.class].push(c); });
      entries = ['HardSkill','Literacy','SoftSkill'].map(k => [displayLabel[k], groups[k].length]);
      colors = allPalette;
      groupComps = {
        [displayLabel.HardSkill]: groups.HardSkill,
        [displayLabel.Literacy]:  groups.Literacy,
        [displayLabel.SoftSkill]: groups.SoftSkill,
      };
    } else {
      // Group by level2 within the selected main class
      const order = L2_ORDER[mode] || [];
      const subGroups = {};
      order.forEach(l2 => { subGroups[l2] = []; });
      d.competencies
        .filter(c => c.class === mode)
        .forEach(c => {
          const l2 = c.level2 || 'Unknown';
          if (!subGroups[l2]) subGroups[l2] = [];
          subGroups[l2].push(c);
        });
      const pal = palette[mode] || allPalette;
      entries = order
        .filter(l2 => subGroups[l2] && subGroups[l2].length > 0)
        .map((l2, i) => [l2Label[l2] || l2, subGroups[l2].length, pal[i % pal.length], l2]);
      colors = entries.map(e => e[2]);
      groupComps = {};
      entries.forEach(e => { groupComps[e[0]] = subGroups[e[3]]; });
      entries = entries.map(e => [e[0], e[1]]);
    }

    const chartLabels = entries.map(e => e[0]);
    const chartData   = entries.map(e => e[1]);

    this._chart('competencyChart', 'doughnut', {
      labels: chartLabels,
      datasets: [{ data: chartData, backgroundColor: colors.map(c => c + '99'), borderColor: colors, borderWidth: 2 }],
    }, {
      plugins: {
        tooltip: { callbacks: { label: ctx => `${ctx.label}: ${ctx.parsed}개` } },
        legend: { display: false },
      },
    });

    const legendEl = document.getElementById('compLegend');
    if (!legendEl) return;

    if (mode === 'all') {
      const mainDesc = {
        'Hard Skill (전문기술)':  'HardSkill — 비즈니스 행정(Business_Admin), ICT 개발(ICT_Dev), 산업기술(Industrial_Tech) 3개 하위 그룹',
        'Literacy (기초소양)':    'Literacy — 기초학업(Basic_Academic), 시민 리터러시(Civic_Literacy), 디지털 리터러시(Digital_Literacy) 3개 하위 그룹',
        'Soft Skill (소프트스킬)':'SoftSkill — 대인관계(Interpersonal), 문제해결(Problem_Solving), 자기관리(Self_Management) 3개 하위 그룹',
      };
      legendEl.innerHTML = entries.map(([label, count], i) => {
        const col = colors[i];
        const desc = mainDesc[label] || '';
        return `
          <div class="policy-legend-item comp-legend-item" data-group="${label}" style="flex-direction:column;align-items:flex-start;gap:2px;padding:6px 0;border-bottom:1px solid rgba(255,255,255,0.05);cursor:pointer">
            <div style="display:flex;align-items:center;gap:6px;width:100%">
              <span class="policy-legend-dot" style="background:${col};box-shadow:0 0 6px ${col}88;flex-shrink:0"></span>
              <span class="policy-legend-label" style="flex:1;font-size:12px">${label}</span>
              <span class="policy-legend-count">${count}</span>
            </div>
            <div style="font-size:10px;color:#6a7f90;margin-left:16px;line-height:1.4">${desc}</div>
          </div>`;
      }).join('');
    } else {
      // Show level2 groups with their descriptions
      const order = L2_ORDER[mode] || [];
      const pal = palette[mode] || allPalette;
      legendEl.innerHTML = order
        .filter(l2 => groupComps[l2Label[l2] || l2] && groupComps[l2Label[l2] || l2].length > 0)
        .map((l2, i) => {
          const label = l2Label[l2] || l2;
          const count = (groupComps[label] || []).length;
          const col = pal[i % pal.length];
          const desc = l2Desc[l2] || '';
          return `
            <div class="policy-legend-item comp-legend-item" data-group="${label}" style="flex-direction:column;align-items:flex-start;gap:2px;padding:6px 0;border-bottom:1px solid rgba(255,255,255,0.05);cursor:pointer">
              <div style="display:flex;align-items:center;gap:6px;width:100%">
                <span class="policy-legend-dot" style="background:${col};box-shadow:0 0 6px ${col}88;flex-shrink:0"></span>
                <span class="policy-legend-label" style="flex:1;font-size:12px">${label}</span>
                <span class="policy-legend-count">${count}</span>
              </div>
              ${desc ? `<div style="font-size:10px;color:#6a7f90;margin-left:16px;line-height:1.4">${desc}</div>` : ''}
            </div>`;
        }).join('');
    }

    legendEl.querySelectorAll('.comp-legend-item').forEach(item => {
      item.addEventListener('click', () => {
        const group = item.dataset.group;
        this._showCompGroupPopup(group, groupComps[group] || []);
      });
    });
  },

  _showCompGroupPopup(groupName, comps) {
    const l3Label = this._COMP_L3_LABEL;
    // Group comps by level3 inside the popup
    const byL3 = {};
    comps.forEach(c => {
      const l3key = l3Label[c.level3] || c.level3 || '기타';
      if (!byL3[l3key]) byL3[l3key] = [];
      byL3[l3key].push(c);
    });

    const clsColor = { HardSkill: '#00d4ff', Literacy: '#ffd700', SoftSkill: '#00ff41' };
    const listHtml = Object.entries(byL3).map(([l3, items]) => `
      <div style="margin-bottom:8px">
        <div style="font-size:11px;color:#a0aab8;font-weight:600;margin-bottom:4px;padding-left:4px">${l3}</div>
        ${items.map(c => {
          const col = clsColor[c.class] || '#a0aab8';
          return `<div class="detail-list-item comp-group-row" data-comp-id="${c.id}" style="cursor:pointer">
            <span class="detail-dot"></span>
            <span style="flex:1">${c.name || c.en}</span>
            <span style="color:${col};font-size:10px">${c.en || ''}</span>
          </div>`;
        }).join('')}
      </div>`).join('');

    const html = `
      <div class="detail-header-block">
        <div class="detail-strategy-label">COMPETENCY GROUP</div>
        <h2 class="detail-title">${groupName}</h2>
        <div class="detail-en">총 ${comps.length}개 역량 · 클릭하면 상세 정보 확인</div>
      </div>
      <div class="detail-section">
        <div class="detail-section-title">역량 목록 (Level 3 하위분류별)</div>
        <div class="detail-list">${listHtml}</div>
      </div>
    `;
    this._openDetail(html);

    document.querySelectorAll('.comp-group-row').forEach(row => {
      row.addEventListener('click', () => {
        const comp = HRDData.competencies.find(c => c.id === row.dataset.compId);
        if (comp) this._showCompetencyDetail(comp);
      });
    });
  },

  _showCompetencyDetail(comp) {
    const l2Label = this._COMP_L2_LABEL;
    const l3Label = this._COMP_L3_LABEL;
    const l2Desc  = this._COMP_L2_DESC;
    const cls = comp.class || '미분류';
    const clsKo = { HardSkill: 'Hard Skill', Literacy: 'Literacy', SoftSkill: 'Soft Skill' }[cls] || cls;
    const clsColor = { HardSkill: '#00d4ff', Literacy: '#ffd700', SoftSkill: '#00ff41' }[cls] || '#a0aab8';
    const l2 = l2Label[comp.level2] || comp.level2 || '';
    const l3 = l3Label[comp.level3] || comp.level3 || '';
    const descStr = l2Desc[comp.level2] || '';

    const relPrograms = HRDData.programs.filter(p =>
      (Array.isArray(p.relatedCompetencyIds) && p.relatedCompetencyIds.includes(comp.id)) ||
      p.targetCompetencyId === comp.id ||
      p.competencyCategory === comp.category ||
      (comp.catCode && p.fieldCatCode === comp.catCode)
    );

    const progHtml = relPrograms.length
      ? relPrograms.slice(0, 8).map(p => `
          <div class="detail-list-item">
            <span class="detail-dot"></span>
            <span style="flex:1;font-size:11px">${p.name}</span>
            <span style="color:#a0aab8;font-size:10px">${p.org || ''}</span>
          </div>`).join('') + (relPrograms.length > 8 ? `<div style="color:#607080;font-size:11px;padding:4px 0">외 ${relPrograms.length - 8}개 프로그램</div>` : '')
      : '<span class="detail-empty">연관 프로그램 없음</span>';

    const html = `
      <div class="detail-header-block">
        <div class="detail-strategy-label" style="color:${clsColor}">${clsKo}</div>
        <h2 class="detail-title">${comp.name || comp.en}</h2>
        <div class="detail-en">${comp.en || ''}</div>
      </div>

      <div class="detail-section">
        <div class="detail-section-title">Protege 온톨로지 분류 경로</div>
        <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-top:6px">
          <span class="detail-tag" style="border-color:${clsColor};color:${clsColor}">${clsKo}</span>
          <span style="color:#506070">▶</span>
          <span class="detail-tag comp">${l2}</span>
          <span style="color:#506070">▶</span>
          <span class="detail-tag comp">${l3}</span>
        </div>
      </div>

      ${descStr ? `
      <div class="detail-section">
        <div class="detail-section-title">역량군 설명</div>
        <div class="detail-en" style="font-size:12px;line-height:1.6">${descStr}</div>
      </div>` : ''}

      <div class="detail-section">
        <div class="detail-section-title">연관 교육 프로그램 (${relPrograms.length}개)</div>
        <div class="detail-list">${progHtml}</div>
      </div>
    `;
    this._openDetail(html);
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
