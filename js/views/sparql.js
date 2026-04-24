Object.assign(App, {
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
    const queryArea = document.getElementById('sparqlQueryArea');
    if (!container) return;
    container.innerHTML = '';
    if (queryArea) queryArea.innerHTML = '';

    const showCategory = (catId) => {
      container.querySelectorAll('.sparql-category-header').forEach(h => {
        h.classList.toggle('active', h.dataset.catId === catId);
      });
      if (!queryArea) return;
      queryArea.innerHTML = '';
      queryArea.classList.add('active');
      const cat = data.categories.find(c => c.id === catId);
      if (!cat) return;
      cat.queries.forEach(q => {
        const btn = document.createElement('button');
        btn.className = 'sparql-query-btn';
        const qdata = data.queries[q.id];
        if (qdata && qdata.result && qdata.result.error) btn.classList.add('has-error');
        btn.innerHTML = `<span class="sparql-qid">${q.id}</span>${q.title}`;
        btn.addEventListener('click', () => {
          queryArea.querySelectorAll('.sparql-query-btn').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          this._showSparqlResult(q.id);
        });
        queryArea.appendChild(btn);
      });
    };

    data.categories.forEach(cat => {
      const hdr = document.createElement('div');
      hdr.className = 'sparql-category-header';
      hdr.dataset.catId = cat.id;
      hdr.innerHTML = `<span class="sparql-category-id">${cat.id}</span><span class="sparql-category-label">${cat.label}</span>`;
      hdr.addEventListener('click', () => showCategory(cat.id));
      container.appendChild(hdr);
    });

    if (data.categories.length > 0) showCategory(data.categories[0].id);
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
});
