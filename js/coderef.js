const CodeRef = (() => {
  let _data = null;
  let _activeSheet = null;
  let _searchQuery = '';

  const SHEET_LABELS = {
    '요약(Summary)': { label: '요약', icon: '📋' },
    '정책(Policy)': { label: '정책', icon: '📜' },
    '기관배정예산(OrgBudget)': { label: '기관예산', icon: '🏛' },
    '정책별예산(PolicyBudget)': { label: '정책예산', icon: '💰' },
    '기관(Organization)': { label: '기관', icon: '🏢' },
    '국가전략(NationalStrategy)': { label: '국가전략', icon: '🎯' },
    '교육프로그램(EducationProgram)': { label: '교육프로그램', icon: '📚' },
    '대상집단(TargetGroup)': { label: '대상집단', icon: '👥' },
    '인원(Person)': { label: '인원', icon: '👤' },
    '역량평가(CompetencyAssessment)': { label: '역량평가', icon: '📊' },
    '혜택(Benefit)': { label: '혜택', icon: '🎁' },
    '성과(Outcome)': { label: '성과', icon: '📈' },
    '정책참여(PolicyParticipation)': { label: '정책참여', icon: '🤝' },
    '역량(Competency)': { label: '역량', icon: '⭐' },
    '역량분류(CompetencyCategory)': { label: '역량분류', icon: '🗂' },
    '추천(Recommendation)': { label: '추천', icon: '💡' },
    '역량갭(CompetencyGap)': { label: '역량갭', icon: '🔺' },
    '프로그램등록(ProgramEnrollment)': { label: '프로그램등록', icon: '✅' },
    '기타': { label: '기타', icon: '📌' },
  };

  function _getLabel(sheet) {
    return SHEET_LABELS[sheet] || { label: sheet, icon: '📄' };
  }

  function _buildTabs() {
    const container = document.getElementById('coderefTabs');
    if (!container || !_data) return;
    container.innerHTML = _data.meta.map(m => {
      const info = _getLabel(m.sheet);
      const active = m.sheet === _activeSheet ? ' active' : '';
      return `<button class="coderef-tab${active}" data-sheet="${m.sheet}" title="${m.sheet} (${m.count}건)">
        ${info.icon} ${info.label}
        <span class="coderef-tab-count">${m.count}</span>
      </button>`;
    }).join('');
    container.querySelectorAll('.coderef-tab').forEach(btn => {
      btn.addEventListener('click', () => {
        _activeSheet = btn.dataset.sheet;
        _render();
      });
    });
  }

  function _filterRows(rows) {
    if (!_searchQuery) return rows;
    const q = _searchQuery.toLowerCase();
    return rows.filter(r =>
      r.code.toLowerCase().includes(q) || r.name.toLowerCase().includes(q)
    );
  }

  function _render() {
    _buildTabs();
    const body = document.getElementById('coderefBody');
    if (!body || !_data) return;

    if (_searchQuery) {
      _renderSearch(body);
      return;
    }

    const rows = _data.sheets[_activeSheet] || [];
    const info = _getLabel(_activeSheet);
    body.innerHTML = `
      <div class="coderef-sheet-header">
        <span class="coderef-sheet-icon">${info.icon}</span>
        <span class="coderef-sheet-name">${_activeSheet}</span>
        <span class="coderef-sheet-total">${rows.length}건</span>
      </div>
      <div class="coderef-table-wrap">
        <table class="coderef-table">
          <thead>
            <tr><th>코드</th><th>한글명</th></tr>
          </thead>
          <tbody>
            ${rows.map(r => `<tr><td class="coderef-code">${_esc(r.code)}</td><td class="coderef-name">${_esc(r.name)}</td></tr>`).join('')}
          </tbody>
        </table>
      </div>`;
  }

  function _renderSearch(body) {
    const q = _searchQuery.toLowerCase();
    let allMatches = [];
    for (const [sheet, rows] of Object.entries(_data.sheets)) {
      const filtered = rows.filter(r =>
        r.code.toLowerCase().includes(q) || r.name.toLowerCase().includes(q)
      );
      if (filtered.length) {
        const info = _getLabel(sheet);
        allMatches.push({ sheet, info, rows: filtered });
      }
    }

    if (!allMatches.length) {
      body.innerHTML = `<div class="coderef-empty">검색 결과가 없습니다 — "<strong>${_esc(_searchQuery)}</strong>"</div>`;
      return;
    }

    const totalFound = allMatches.reduce((s, m) => s + m.rows.length, 0);
    body.innerHTML = `
      <div class="coderef-search-summary">"<strong>${_esc(_searchQuery)}</strong>" 검색 결과: ${totalFound}건 (${allMatches.length}개 시트)</div>
      ${allMatches.map(({ sheet, info, rows }) => `
        <div class="coderef-search-group">
          <div class="coderef-search-group-title">${info.icon} ${sheet} <span class="coderef-tab-count">${rows.length}</span></div>
          <table class="coderef-table">
            <thead><tr><th>코드</th><th>한글명</th></tr></thead>
            <tbody>
              ${rows.map(r => `<tr><td class="coderef-code">${_highlight(r.code, q)}</td><td class="coderef-name">${_highlight(r.name, q)}</td></tr>`).join('')}
            </tbody>
          </table>
        </div>
      `).join('')}`;
  }

  function _highlight(text, q) {
    const escaped = _esc(text);
    const re = new RegExp(`(${q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    return escaped.replace(re, '<mark class="coderef-hl">$1</mark>');
  }

  function _esc(s) {
    return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }

  async function init() {
    try {
      const resp = await fetch('data/code_reference.json');
      _data = await resp.json();
      _activeSheet = _data.meta[0]?.sheet || null;
      _buildTabs();
      _render();

      const searchEl = document.getElementById('coderefSearch');
      if (searchEl) {
        searchEl.addEventListener('input', e => {
          _searchQuery = e.target.value.trim();
          _render();
        });
      }
    } catch (err) {
      const body = document.getElementById('coderefBody');
      if (body) body.innerHTML = `<div class="coderef-empty">데이터 로드 실패: ${err.message}</div>`;
    }
  }

  return { init };
})();
