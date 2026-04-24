Object.assign(App, {
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
    const strategy = program.alignedStrategy ? d.strategies.find(s => s.id === program.alignedStrategy) : null;
    const stratName = strategy ? strategy.name : null;

    const orgInfo = program.orgId ? d.organizations.find(o => o.id === program.orgId) : null;
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

    const budgetObj = program.budgetCode ? d.budgets.find(x => x.id === program.budgetCode) : null;
    const budgetInfo = budgetObj ? `${budgetObj.name} (${budgetObj.amountStr || d.formatWon(budgetObj.amount || 0)})` : null;

    const html = `
      <div class="detail-header-block">
        <div class="detail-strategy-label">EDUCATION PROGRAM</div>
        <h2 class="detail-title">${program.name}</h2>
        <div class="detail-en">${program.en || ''}</div>
      </div>

      <div class="detail-section">
        <div class="detail-section-title">프로그램 소개</div>
        <p class="detail-description">${program.description || `본 프로그램은 ${orgDisplay || '관련 기관'}이 운영하는 ${program.competencyCategory || '역량'} 분야 교육 과정으로, ${targetGroupInfo || program.targetGroup || '대상 그룹'}을 위한 인적자원 개발 교육을 제공합니다.`}</p>
        <p class="detail-source"><span class="detail-source-label">📋 근거 문서</span> ${program.basis || '인재개발법, NCS(국가직무능력표준), 공무원 교육훈련법 등 관련 법령'}</p>
      </div>

      <div class="detail-section">
        <div class="detail-section-title">연관 전략 <span class="detail-hint">클릭하면 상세 정보</span></div>
        <div class="detail-tags">
          ${stratName
            ? `<span class="detail-tag org detail-clickable" data-strategy-id="${program.alignedStrategy}">${stratName}</span>`
            : '<span class="detail-empty">미분류</span>'}
        </div>
      </div>

      <div class="detail-grid-2">
        <div class="detail-section">
          <div class="detail-section-title">관리 기관 <span class="detail-hint">클릭하면 상세 정보</span></div>
          <div class="detail-tags">
            ${orgInfo
              ? `<span class="detail-tag org detail-clickable" data-org-id="${orgInfo.id}">${orgDisplay}</span>`
              : (program.org ? `<span class="detail-tag org detail-clickable" data-org-name="${program.org}">${orgDisplay}</span>` : `<span class="detail-tag org">${orgDisplay}</span>`)}
          </div>
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
        <div class="detail-section-title">연관 예산 <span class="detail-hint">클릭하면 상세 정보</span></div>
        <div class="detail-tags"><span class="detail-tag detail-clickable" style="color:#ffd700" data-budget-id="${program.budgetCode}">${budgetInfo}</span></div>
      </div>` : ''}

      <div class="detail-section">
        <div class="detail-section-title">프로그램 ID</div>
        <div class="detail-en" style="font-family:monospace;font-size:12px">${program.id}</div>
      </div>
    `;
    this._openDetail(html);
    const rebind = () => this._bindProgramDetailClicks(program);
    this._currentRebind = rebind;
    rebind();
  },

  _bindProgramDetailClicks(program) {
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
    body.querySelectorAll('[data-strategy-id]').forEach(el => {
      el.addEventListener('click', () => {
        const strat = d.strategies.find(s => s.id === el.dataset.strategyId);
        if (strat) this._pushStrategyDetail(strat);
      });
    });
    body.querySelectorAll('[data-budget-id]').forEach(el => {
      el.addEventListener('click', () => {
        const budget = d.budgets.find(b => b.id === el.dataset.budgetId);
        if (budget) this._pushBudgetDetail(budget);
      });
    });
  },
});
