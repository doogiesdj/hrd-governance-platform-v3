Object.assign(App, {
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
    if (catKey === 'sankey') { this._showSankeyMode(); return; }
    this._hideSankeyMode();
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

    let relatedPolicies = [];
    if (budget.relatedPolicies && budget.relatedPolicies.length) {
      relatedPolicies = budget.relatedPolicies.map(pid => d.policies.find(p => p.id === pid)).filter(Boolean);
    } else if (stratId) {
      relatedPolicies = d.policies.filter(p => p.relatedStrategy === stratId);
    }

    const budgetTypeLabel = budget.budgetType === 'PolicyBudget' ? '정책예산' : budget.budgetType === 'OrgBudget' ? '기관예산' : 'Budget';
    const typeColor = budget.budgetType === 'PolicyBudget' ? 'rgba(255,100,0,0.15);color:#ff6400;border-color:rgba(255,100,0,0.4)' : 'rgba(255,215,0,0.12);color:#ffd700;border-color:rgba(255,215,0,0.3)';

    const managingOrg = (() => {
      if (budget.managingOrgId) return d.organizations.find(o => o.id === budget.managingOrgId) || null;
      if (budget.managingOrg) return d.organizations.find(o => o.name === budget.managingOrg || o.abbr === budget.managingOrg) || null;
      return null;
    })();
    const managingOrgName = managingOrg ? managingOrg.name : (budget.managingOrg || null);

    const stratBlock = strategy
      ? `<div class="detail-section">
          <div class="detail-section-title">연관 전략 <span class="detail-hint">클릭하면 상세 정보</span></div>
          <div class="detail-tags"><span class="detail-tag org detail-clickable" data-strategy-id="${strategy.id}">${strategy.name}</span></div>
        </div>`
      : '';

    const polHtml = relatedPolicies.length
      ? relatedPolicies.map(p => `<div class="detail-list-item detail-clickable" data-policy-id="${p.id}"><span class="detail-dot"></span>${p.name}${p.budgetAmountStr ? ' <span style="color:#ffd700;font-size:11px">· ' + p.budgetAmountStr + '</span>' : ''}</div>`).join('')
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

      <div class="detail-section">
        <div class="detail-section-title">예산 소개</div>
        <p class="detail-description">${budget.description || `본 예산은 FY${budget.fiscalYear || '2026'} 회계연도에 ${managingOrgName || '관련 기관'}이(가) 관리하는 ${budgetTypeLabel}으로, 인적자원 개발 정책 추진에 활용됩니다.`}</p>
        <p class="detail-source"><span class="detail-source-label">📋 근거 문서</span> ${budget.basis || '국가재정법, 정부회계법, 기금관리기본법 등 관련 법령'}</p>
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
        <div class="detail-section-title">관리 기관 <span class="detail-hint">클릭하면 상세 정보</span></div>
        <div class="detail-tags">
          ${managingOrgName
            ? `<span class="detail-tag org detail-clickable" ${managingOrg ? `data-org-id="${managingOrg.id}"` : `data-org-name="${managingOrgName}"`}>${managingOrgName}</span>`
            : '<span class="detail-empty">미지정</span>'}
        </div>
      </div>

      ${stratBlock}

      <div class="detail-section">
        <div class="detail-section-title">연관 정책 <span class="detail-hint">클릭하면 상세 정보</span> (${relatedPolicies.length}건)</div>
        <div class="detail-list">${polHtml}</div>
      </div>
    `;

    this._openDetail(html);
    const rebind = () => this._bindBudgetDetailClicks(budget, relatedPolicies, strategy);
    this._currentRebind = rebind;
    rebind();
  },

  _bindBudgetDetailClicks(budget, relatedPolicies, strategy) {
    const body = document.getElementById('detailBody');
    if (!body) return;
    const d = HRDData;

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

    body.querySelectorAll('[data-policy-id]').forEach(el => {
      el.addEventListener('click', () => {
        const pol = relatedPolicies.find(p => p.id === el.dataset.policyId)
          || d.policies.find(p => p.id === el.dataset.policyId);
        if (pol) this._showPolicyDetailPush(pol);
      });
    });

    body.querySelectorAll('[data-strategy-id]').forEach(el => {
      el.addEventListener('click', () => {
        const strat = strategy && strategy.id === el.dataset.strategyId
          ? strategy
          : d.strategies.find(s => s.id === el.dataset.strategyId);
        if (strat) this._pushStrategyDetail(strat);
      });
    });
  },

  _pushBudgetDetail(budget) {
    const body = document.getElementById('detailBody');
    this._pushDetailWith(body ? body.innerHTML : '', () => {
      const d = HRDData;
      const stratId = budget.relatedStrategy;
      const strategy = stratId ? d.strategies.find(s => s.id === stratId) : null;
      let relatedPolicies = [];
      if (budget.relatedPolicies && budget.relatedPolicies.length) {
        relatedPolicies = budget.relatedPolicies.map(pid => d.policies.find(p => p.id === pid)).filter(Boolean);
      } else if (stratId) {
        relatedPolicies = d.policies.filter(p => p.relatedStrategy === stratId);
      }
      const budgetTypeLabel = budget.budgetType === 'PolicyBudget' ? '정책예산' : budget.budgetType === 'OrgBudget' ? '기관예산' : 'Budget';
      const typeColor = budget.budgetType === 'PolicyBudget' ? 'rgba(255,100,0,0.15);color:#ff6400;border-color:rgba(255,100,0,0.4)' : 'rgba(255,215,0,0.12);color:#ffd700;border-color:rgba(255,215,0,0.3)';
      const managingOrg = (() => {
        if (budget.managingOrgId) return d.organizations.find(o => o.id === budget.managingOrgId) || null;
        if (budget.managingOrg) return d.organizations.find(o => o.name === budget.managingOrg || o.abbr === budget.managingOrg) || null;
        return null;
      })();
      const managingOrgName = managingOrg ? managingOrg.name : (budget.managingOrg || null);
      const stratBlock = strategy
        ? `<div class="detail-section"><div class="detail-section-title">연관 전략 <span class="detail-hint">클릭하면 상세 정보</span></div><div class="detail-tags"><span class="detail-tag org detail-clickable" data-strategy-id="${strategy.id}">${strategy.name}</span></div></div>`
        : '';
      const polHtml = relatedPolicies.length
        ? relatedPolicies.map(p => `<div class="detail-list-item detail-clickable" data-policy-id="${p.id}"><span class="detail-dot"></span>${p.name}</div>`).join('')
        : '<span class="detail-empty">연관 정책 데이터 없음</span>';
      const execBlock = budget.executedAmount > 0
        ? `<div class="detail-grid-2"><div class="detail-section"><div class="detail-section-title">집행 금액</div><div class="detail-budget-value">${budget.executedAmountStr || d.formatWon(budget.executedAmount)}</div></div><div class="detail-section"><div class="detail-section-title">집행률</div><div class="detail-budget-value">${budget.execRate != null ? budget.execRate + '%' : '-'}</div></div></div>` : '';
      const detailBody = document.getElementById('detailBody');
      if (!detailBody) return;
      detailBody.innerHTML = `
        <div class="detail-header">
          <div class="detail-type-badge" style="background:${typeColor}">${budgetTypeLabel}</div>
          <h2 class="detail-title">${budget.name}</h2>
          ${budget.en ? `<div class="detail-en">${budget.en}</div>` : ''}
        </div>
        <div class="detail-grid-2">
          <div class="detail-section"><div class="detail-section-title">배정 예산</div><div class="detail-budget-value">${budget.amountStr || d.formatWon(budget.amount || 0)}</div></div>
          <div class="detail-section"><div class="detail-section-title">회계연도</div><div class="detail-budget-value">FY${budget.fiscalYear || '2026'}</div></div>
        </div>
        ${execBlock}
        <div class="detail-section">
          <div class="detail-section-title">관리 기관 <span class="detail-hint">클릭하면 상세 정보</span></div>
          <div class="detail-tags">
            ${managingOrgName
              ? `<span class="detail-tag org detail-clickable" ${managingOrg ? `data-org-id="${managingOrg.id}"` : `data-org-name="${managingOrgName}"`}>${managingOrgName}</span>`
              : '<span class="detail-empty">미지정</span>'}
          </div>
        </div>
        ${stratBlock}
        <div class="detail-section">
          <div class="detail-section-title">연관 정책 <span class="detail-hint">클릭하면 상세 정보</span> (${relatedPolicies.length}건)</div>
          <div class="detail-list">${polHtml}</div>
        </div>
      `;
      detailBody.scrollTop = 0;
      const rebind = () => this._bindBudgetDetailClicks(budget, relatedPolicies, strategy);
      this._currentRebind = rebind;
      rebind();
    });
  },

  _sankeyLevel: 'l2',

  _showSankeyMode() {
    const catContent = document.getElementById('budgetCatContent');
    if (!catContent) return;
    const chartWrap = catContent.querySelector('.budget-cat-chart-wrap');
    const listEl    = document.getElementById('budgetCatList');
    if (chartWrap) chartWrap.style.display = 'none';
    if (listEl)    listEl.style.display    = 'none';
    let sankeyEl = document.getElementById('sankey-container');
    if (!sankeyEl) {
      sankeyEl = document.createElement('div');
      sankeyEl.id = 'sankey-container';
      sankeyEl.innerHTML = `
        <div class="sankey-toolbar" id="sankey-toolbar">
          <span class="sankey-toolbar-label">역량 레벨:</span>
          <button class="sankey-level-btn active" data-level="l2">L2 (9개 대분류)</button>
          <button class="sankey-level-btn" data-level="l3">L3 (세분류)</button>
        </div>
        <div class="sankey-split">
          <div class="sankey-chart-panel" id="sankey-chart-panel"></div>
          <div class="sankey-info-panel" id="sankey-info-panel"></div>
        </div>`;
      catContent.appendChild(sankeyEl);
    }
    sankeyEl.style.display = 'block';
    sankeyEl.querySelectorAll('.sankey-level-btn').forEach(btn => {
      btn.onclick = () => {
        this._sankeyLevel = btn.dataset.level;
        sankeyEl.querySelectorAll('.sankey-level-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const cp = document.getElementById('sankey-chart-panel');
        this._renderSankey(cp);
        this._renderSankeyInfo(document.getElementById('sankey-info-panel'));
      };
    });
    const chartPanel = document.getElementById('sankey-chart-panel');
    chartPanel.getBoundingClientRect();
    this._renderSankey(chartPanel);
    this._renderSankeyInfo(document.getElementById('sankey-info-panel'));
  },

  _hideSankeyMode() {
    const catContent = document.getElementById('budgetCatContent');
    if (!catContent) return;
    const chartWrap = catContent.querySelector('.budget-cat-chart-wrap');
    const listEl    = document.getElementById('budgetCatList');
    const sankeyEl  = document.getElementById('sankey-container');
    if (chartWrap) chartWrap.style.display = '';
    if (listEl)    listEl.style.display    = '';
    if (sankeyEl)  sankeyEl.style.display  = 'none';
  },

  _COMP_LABEL: {
    'Business_Admin':        '비즈니스행정',
    'ICT_Dev':               'ICT개발',
    'Industrial_Tech':       '산업기술',
    'Basic_Academic':        '기초학업',
    'Civic_Literacy':        '시민역량',
    'Digital_Literacy':      '디지털',
    'Interpersonal':         '대인관계',
    'Problem_Solving':       '문제해결',
    'Self_Management':       '자기관리',
    'AI_and_Infrastructure': 'AI/인프라',
    'Adaptability':          '적응력',
    'Collaboration':         '협업',
    'Data_Fluency':          '데이터활용',
    'Language_and_Math':     '언어수리',
    'Leadership':            '리더십',
    'Management':            '경영관리',
    'Manufacturing':         '제조기술',
    'Marketing_Strategy':    '마케팅전략',
    'Service_Public':        '공공서비스',
    'Social_Value':          '사회가치',
    'Software':              '소프트웨어',
    'Tech_Security':         '보안기술',
    'Thinking_Skill':        '사고력',
  },

  _buildSankeyData(level) {
    const useLevel = level || this._sankeyLevel || 'l2';
    const d = HRDData;

    const compMap = {};
    d.competencies.forEach(c => {
      compMap[c.id] = useLevel === 'l3' ? (c.level3 || c.level2) : c.level2;
    });

    const stratNames = [...new Set(d.programs.map(p => p.alignedStrategy).filter(Boolean))];
    const compKeys   = [...new Set(d.competencies.map(c => useLevel === 'l3' ? (c.level3 || c.level2) : c.level2).filter(Boolean))].sort();

    const label = k => this._COMP_LABEL[k] || k;

    const nodes = [
      ...stratNames.map(name => ({ name, isStrat: true })),
      ...compKeys.map(k => ({ name: label(k), key: k, isComp: true })),
    ];

    const stratIdx = {};
    stratNames.forEach((name, i) => { stratIdx[name] = i; });
    const compIdx = {};
    compKeys.forEach((k, i) => { compIdx[k] = stratNames.length + i; });

    const linkMap = {};
    d.programs.forEach(p => {
      const strat = p.alignedStrategy;
      if (!strat || stratIdx[strat] === undefined) return;
      const ids = Array.isArray(p.relatedCompetencyIds) ? p.relatedCompetencyIds
                  : (p.targetCompetencyId ? [p.targetCompetencyId] : []);
      const seen = new Set();
      ids.forEach(id => { const ck = compMap[id]; if (ck) seen.add(ck); });
      seen.forEach(ck => {
        if (compIdx[ck] === undefined) return;
        const key = `${stratIdx[strat]}_${compIdx[ck]}`;
        linkMap[key] = (linkMap[key] || 0) + 1;
      });
    });

    const links = Object.entries(linkMap).map(([key, val]) => {
      const [source, target] = key.split('_').map(Number);
      return { source, target, value: val };
    });
    return { nodes, links, stratNames, compKeys };
  },

  _sankeyCompColors: [
    '#00d4ff','#0099cc','#006699','#ffd700','#ffaa00','#ff8800',
    '#00ff41','#00cc33','#009922','#ee82ee','#cc44cc','#aa22aa',
    '#ff6b6b','#ff4444','#ffb347',
  ],

  _renderSankey(el) {
    if (typeof d3 === 'undefined' || typeof d3.sankey !== 'function') {
      el.innerHTML = '<div class="sankey-empty">d3-sankey 라이브러리를 로딩 중입니다. 잠시 후 다시 시도해주세요.</div>';
      return;
    }
    const { nodes, links, compKeys } = this._buildSankeyData();
    if (!nodes.length || !links.length) {
      el.innerHTML = '<div class="sankey-empty">전략–역량 연결 데이터가 없습니다.</div>';
      return;
    }
    el.innerHTML = '';
    const W = el.clientWidth || 560;
    const nodePad = this._sankeyLevel === 'l3' ? 5 : 8;
    const H = Math.max(480, nodes.length * (nodePad + 12));
    const margin = { top: 10, right: 120, bottom: 20, left: 120 };

    const colorByKey = {};
    compKeys.forEach((k, i) => { colorByKey[k] = this._sankeyCompColors[i % this._sankeyCompColors.length]; });
    const nodeColor = n => n.isStrat ? '#4a90d9' : (colorByKey[n.key] || '#00d4ff');

    const svg = d3.select(el)
      .append('svg')
      .attr('width', W)
      .attr('height', H);

    const sankey = d3.sankey()
      .nodeWidth(14)
      .nodePadding(nodePad)
      .extent([[margin.left, margin.top], [W - margin.right, H - margin.bottom]]);

    const graph = sankey({
      nodes: nodes.map(n => Object.assign({}, n)),
      links: links.map(l => Object.assign({}, l)),
    });

    svg.append('g')
      .attr('fill', 'none')
      .selectAll('path')
      .data(graph.links)
      .join('path')
      .attr('d', d3.sankeyLinkHorizontal())
      .attr('stroke', l => nodeColor(l.target))
      .attr('stroke-opacity', 0.28)
      .attr('stroke-width', l => Math.max(1, l.width))
      .append('title')
      .text(l => `${l.source.name} → ${l.target.name}: ${l.value}개 프로그램`);

    const self = this;
    svg.append('g')
      .selectAll('rect')
      .data(graph.nodes)
      .join('rect')
      .attr('x', n => n.x0)
      .attr('y', n => n.y0)
      .attr('height', n => Math.max(1, n.y1 - n.y0))
      .attr('width', n => n.x1 - n.x0)
      .attr('fill', n => nodeColor(n))
      .attr('opacity', 0.85)
      .attr('rx', 2)
      .style('cursor', 'pointer')
      .on('click', function(event, n) {
        svg.selectAll('rect').attr('opacity', 0.45);
        d3.select(this).attr('opacity', 1);
        self._renderSankeyDrilldown(document.getElementById('sankey-info-panel'), n);
      })
      .append('title')
      .text(n => `${n.name}: ${n.value}개 프로그램 (클릭하면 상세)`);

    svg.append('g')
      .selectAll('text')
      .data(graph.nodes)
      .join('text')
      .attr('x', n => n.x0 < W / 2 ? n.x1 + 6 : n.x0 - 6)
      .attr('y', n => (n.y1 + n.y0) / 2)
      .attr('dy', '0.35em')
      .attr('text-anchor', n => n.x0 < W / 2 ? 'start' : 'end')
      .attr('fill', '#c0ccd8')
      .attr('font-size', 11)
      .style('pointer-events', 'none')
      .text(n => n.name.length > 16 ? n.name.slice(0, 15) + '…' : n.name);
  },

  _buildSankeyInsight() {
    const { nodes, links } = this._buildSankeyData();
    if (!links.length) return null;
    const stratCount = new Set(links.map(l => l.source)).size;
    const l2Count    = new Set(links.map(l => l.target)).size;
    const totalConns = links.reduce((s, l) => s + l.value, 0);
    const maxLink    = links.reduce((best, l) => l.value > best.value ? l : best, { value: 0, source: 0, target: 0 });
    return {
      stratCount,
      l2Count,
      totalConns,
      topSource: nodes[maxLink.source]?.name || '',
      topTarget: nodes[maxLink.target]?.name || '',
      topValue:  maxLink.value,
    };
  },

  _renderSankeyInfo(el) {
    if (!el) return;
    const ins = this._buildSankeyInsight();
    const lvLabel = this._sankeyLevel === 'l3' ? 'L3 세분류' : 'L2 대분류';
    if (!ins) { el.innerHTML = '<p style="color:#6a7f90;padding:20px;font-size:12px">데이터 없음</p>'; return; }
    el.innerHTML = `
      <div class="split-info-panel">
        <h3 class="split-info-title">전략–역량 Sankey 차트</h3>
        <p class="split-info-desc">
          HRD <strong>추진전략</strong>(좌측 노드)과 <strong>역량군 ${lvLabel}</strong>(우측 노드)의 연결 흐름을 시각화합니다.
          흐름의 두께는 해당 전략에서 특정 역량군을 다루는 프로그램 수에 비례합니다.
        </p>
        <div class="split-info-stats">
          <div class="split-stat-item">
            <span class="split-stat-value">${ins.stratCount}</span>
            <span class="split-stat-label">연결 전략 수</span>
          </div>
          <div class="split-stat-item">
            <span class="split-stat-value">${ins.l2Count}</span>
            <span class="split-stat-label">역량군 수</span>
          </div>
          <div class="split-stat-item">
            <span class="split-stat-value">${ins.totalConns}</span>
            <span class="split-stat-label">총 연결 건수</span>
          </div>
        </div>
        <div class="split-info-highlight">
          <div class="split-highlight-label">가장 강한 연결</div>
          <div class="split-highlight-content">${ins.topSource} → ${ins.topTarget}<br><span style="color:#00d4ff;font-weight:700">${ins.topValue}개</span> 프로그램 공유</div>
        </div>
        <div class="split-info-howto">
          <div class="split-howto-title">읽는 방법</div>
          <ul class="split-howto-list">
            <li>왼쪽 막대 — 추진전략 노드</li>
            <li>오른쪽 막대 — 역량군 ${lvLabel} 노드</li>
            <li>흐름 두께 ∝ 연결 프로그램 수</li>
            <li>색상은 역량군 종류를 구분</li>
            <li><strong>노드를 클릭</strong>하면 상세 드릴다운</li>
          </ul>
        </div>
      </div>
    `;
  },

  _renderSankeyDrilldown(el, node) {
    if (!el) return;
    const d = HRDData;
    const isStrat = node.isStrat;
    const label = k => this._COMP_LABEL[k] || k;

    if (isStrat) {
      const stratName = node.name;
      const progs = d.programs.filter(p => p.alignedStrategy === stratName);

      const compCount = {};
      progs.forEach(p => {
        const ids = Array.isArray(p.relatedCompetencyIds) ? p.relatedCompetencyIds
                    : (p.targetCompetencyId ? [p.targetCompetencyId] : []);
        ids.forEach(id => {
          const comp = d.competencies.find(c => c.id === id);
          if (!comp) return;
          const key = this._sankeyLevel === 'l3' ? (comp.level3 || comp.level2) : comp.level2;
          if (key) compCount[key] = (compCount[key] || 0) + 1;
        });
      });

      const sorted = Object.entries(compCount).sort((a, b) => b[1] - a[1]);
      const maxVal = sorted[0]?.[1] || 1;

      const barsHtml = sorted.map(([k, v]) => `
        <div class="dd-bar-row">
          <span class="dd-bar-label">${label(k)}</span>
          <div class="dd-bar-track">
            <div class="dd-bar-fill" style="width:${(v/maxVal*100).toFixed(1)}%"></div>
          </div>
          <span class="dd-bar-val">${v}</span>
        </div>`).join('');

      el.innerHTML = `
        <div class="split-info-panel">
          <h3 class="split-info-title" style="font-size:13px">📌 ${stratName}</h3>
          <p class="split-info-desc" style="font-size:11px">이 전략에 속한 <strong>${progs.length}개</strong> 프로그램의 역량 분포</p>
          <div class="dd-bar-chart">${barsHtml || '<p style="color:#6a7f90;font-size:11px">역량 연결 없음</p>'}</div>
          <button class="dd-back-btn" onclick="App._renderSankeyInfo(document.getElementById('sankey-info-panel'))">← 전체 요약으로</button>
        </div>`;
    } else {
      const compKey = node.key;
      const compLabel = node.name;
      const matchField = this._sankeyLevel === 'l3' ? 'level3' : 'level2';

      const relComps = d.competencies.filter(c => (c[matchField] || c.level2) === compKey);
      const progSet = new Set();
      relComps.forEach(comp => {
        d.programs.forEach(p => {
          const ids = Array.isArray(p.relatedCompetencyIds) ? p.relatedCompetencyIds
                      : (p.targetCompetencyId ? [p.targetCompetencyId] : []);
          if (ids.includes(comp.id)) progSet.add(p.alignedStrategy || '미분류');
        });
      });

      const stratCount = {};
      progSet.forEach(s => stratCount[s] = (stratCount[s] || 0));
      d.programs.forEach(p => {
        const ids = Array.isArray(p.relatedCompetencyIds) ? p.relatedCompetencyIds
                    : (p.targetCompetencyId ? [p.targetCompetencyId] : []);
        const matchesComp = ids.some(id => {
          const comp = d.competencies.find(c => c.id === id);
          return comp && (comp[matchField] || comp.level2) === compKey;
        });
        if (matchesComp && p.alignedStrategy) {
          stratCount[p.alignedStrategy] = (stratCount[p.alignedStrategy] || 0) + 1;
        }
      });

      const sorted = Object.entries(stratCount).sort((a, b) => b[1] - a[1]);
      const maxVal = sorted[0]?.[1] || 1;

      const compsHtml = relComps.map(c => `<span class="dd-comp-tag">${c.name || c.en || c.id}</span>`).join('');
      const barsHtml = sorted.map(([k, v]) => `
        <div class="dd-bar-row">
          <span class="dd-bar-label" style="font-size:10px">${k.length > 18 ? k.slice(0,17)+'…' : k}</span>
          <div class="dd-bar-track">
            <div class="dd-bar-fill" style="width:${(v/maxVal*100).toFixed(1)}%"></div>
          </div>
          <span class="dd-bar-val">${v}</span>
        </div>`).join('');

      el.innerHTML = `
        <div class="split-info-panel">
          <h3 class="split-info-title" style="font-size:13px">🎯 ${compLabel}</h3>
          <p class="split-info-desc" style="font-size:11px">세부 역량 <strong>${relComps.length}개</strong> · 연결 전략 <strong>${sorted.length}개</strong></p>
          <div class="dd-comp-tags">${compsHtml}</div>
          <div class="split-info-howto" style="margin-top:10px">
            <div class="split-howto-title">전략별 프로그램 수</div>
            <div class="dd-bar-chart">${barsHtml || '<p style="color:#6a7f90;font-size:11px">연결 전략 없음</p>'}</div>
          </div>
          <button class="dd-back-btn" onclick="App._renderSankeyInfo(document.getElementById('sankey-info-panel'))">← 전체 요약으로</button>
        </div>`;
    }
  },
});
