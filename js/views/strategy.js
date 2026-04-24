Object.assign(App, {
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
});
