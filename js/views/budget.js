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
      catContent.appendChild(sankeyEl);
    }
    sankeyEl.style.display = 'block';
    this._renderSankey(sankeyEl);
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

  _buildSankeyData() {
    const d = HRDData;
    const L2_KEYS = ['Business_Admin','ICT_Dev','Industrial_Tech','Basic_Academic','Civic_Literacy','Digital_Literacy','Interpersonal','Problem_Solving','Self_Management'];
    const L2_SHORT = {
      'Business_Admin':   '비즈니스',
      'ICT_Dev':          'ICT개발',
      'Industrial_Tech':  '산업기술',
      'Basic_Academic':   '기초학업',
      'Civic_Literacy':   '시민',
      'Digital_Literacy': '디지털',
      'Interpersonal':    '대인관계',
      'Problem_Solving':  '문제해결',
      'Self_Management':  '자기관리',
    };
    const compL2 = {};
    d.competencies.forEach(c => { compL2[c.id] = c.level2; });

    const stratNames = [...new Set(d.programs.map(p => p.alignedStrategy).filter(Boolean))];
    const nodes = [
      ...stratNames.map(name => ({ name })),
      ...L2_KEYS.map(k => ({ name: L2_SHORT[k] })),
    ];

    const stratIdx = {};
    stratNames.forEach((name, i) => { stratIdx[name] = i; });
    const l2Idx = {};
    L2_KEYS.forEach((k, i) => { l2Idx[k] = stratNames.length + i; });

    const linkMap = {};
    d.programs.forEach(p => {
      const strat = p.alignedStrategy;
      if (!strat || stratIdx[strat] === undefined) return;
      const ids = Array.isArray(p.relatedCompetencyIds) ? p.relatedCompetencyIds
                  : (p.targetCompetencyId ? [p.targetCompetencyId] : []);
      const l2Set = new Set();
      ids.forEach(id => { const l2 = compL2[id]; if (l2) l2Set.add(l2); });
      l2Set.forEach(l2 => {
        if (l2Idx[l2] === undefined) return;
        const key = `${stratIdx[strat]}_${l2Idx[l2]}`;
        linkMap[key] = (linkMap[key] || 0) + 1;
      });
    });

    const links = Object.entries(linkMap).map(([key, val]) => {
      const [source, target] = key.split('_').map(Number);
      return { source, target, value: val };
    });
    return { nodes, links };
  },

  _renderSankey(el) {
    if (typeof d3 === 'undefined' || typeof d3.sankey !== 'function') {
      el.innerHTML = '<div class="sankey-empty">d3-sankey 라이브러리를 로딩 중입니다. 잠시 후 다시 시도해주세요.</div>';
      return;
    }
    const { nodes, links } = this._buildSankeyData();
    if (!nodes.length || !links.length) {
      el.innerHTML = '<div class="sankey-empty">전략–역량 연결 데이터가 없습니다.</div>';
      return;
    }
    el.innerHTML = '';
    const W = el.clientWidth || 820;
    const H = Math.max(480, nodes.length * 18);
    const margin = { top: 10, right: 175, bottom: 20, left: 175 };

    const svg = d3.select(el)
      .append('svg')
      .attr('width', W)
      .attr('height', H);

    const sankey = d3.sankey()
      .nodeWidth(14)
      .nodePadding(8)
      .extent([[margin.left, margin.top], [W - margin.right, H - margin.bottom]]);

    const graph = sankey({
      nodes: nodes.map(n => Object.assign({}, n)),
      links: links.map(l => Object.assign({}, l)),
    });

    const l2Names  = ['비즈니스','ICT개발','산업기술','기초학업','시민','디지털','대인관계','문제해결','자기관리'];
    const l2Colors = ['#00d4ff','#0099cc','#006699','#ffd700','#ffaa00','#ff8800','#00ff41','#00cc33','#009922'];
    const colorByName = {};
    l2Names.forEach((n, i) => { colorByName[n] = l2Colors[i]; });
    const nodeColor = n => colorByName[n.name] || '#00d4ff';

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
      .append('title')
      .text(n => `${n.name}: ${n.value}개 프로그램`);

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
      .text(n => n.name.length > 15 ? n.name.slice(0, 14) + '…' : n.name);
  },
});
