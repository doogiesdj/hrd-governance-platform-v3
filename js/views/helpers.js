Object.assign(App, {
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
});
