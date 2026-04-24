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
});
