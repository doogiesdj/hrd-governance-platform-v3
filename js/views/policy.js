Object.assign(App, {
  _renderPolicy() {
    const d = HRDData;
    const policyBudgetTotal = d.policies.reduce((s, p) => s + (p.budgetAmount || 0), 0);
    const budgetedCount = d.policies.filter(p => p.budgetAmount > 0).length;
    this._setKPI('policyTotal', d.policies.length);
    this._setKPI('activePolicies', budgetedCount);
    this._setKPI('policyBudget', d.formatWon(policyBudgetTotal));
    this._setKPI('policyPrograms', d.programs.length);

    const view = document.getElementById('view-policy');

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
});
