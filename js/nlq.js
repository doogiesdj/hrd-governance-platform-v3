// nlq.js — Natural Language Query with RAG for HRD Governance Platform
// RAG: searches sparql_results.json + ontology structure, then calls Claude or Gemini

const NLQ = (() => {
  const STORAGE_KEY = 'hrd_nlq_config';

  // ── Config ─────────────────────────────────────────────────────────────────
  function _loadConfig() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'); }
    catch { return {}; }
  }
  function _saveConfig(cfg) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cfg));
  }

  // ── Ontology context (duplicated from ontograf.js for self-containment) ───
  const OBJECT_PROPS = [
    ['Policy', 'hasAllocatedBudget', 'Budget', '예산배정'],
    ['Policy', 'alignsWithStrategy', 'NationalStrategy', '전략정렬'],
    ['Policy', 'implementedBy', 'Organization', '시행기관'],
    ['Policy', 'appliesTo', 'TargetGroup', '적용대상'],
    ['Policy', 'supportsCompetency', 'Competency', '역량지원'],
    ['Policy', 'supportsOutcome', 'Outcome', '성과지원'],
    ['Policy', 'hasParticipation', 'PolicyParticipation', '참여기록'],
    ['Policy', 'providesBenefit', 'Benefit', '혜택제공'],
    ['Budget', 'managedBy', 'Organization', '관리기관'],
    ['Budget', 'fundsProgram', 'EducationProgram', '지원프로그램'],
    ['Budget', 'alignedWithStrategy', 'NationalStrategy', '연계전략'],
    ['EducationProgram', 'hasTargetGroup', 'TargetGroup', '대상집단'],
    ['EducationProgram', 'developsCompetency', 'Competency', '목표역량'],
    ['EducationProgram', 'operatedBy', 'Organization', '운영기관'],
    ['EducationProgram', 'fundedByBudget', 'Budget', '재원'],
    ['EducationProgram', 'hasEnrollment', 'ProgramEnrollment', '등록현황'],
    ['HumanResource', 'hasCompetency', 'Competency', '보유역량'],
    ['HumanResource', 'belongsToTargetGroup', 'TargetGroup', '대상분류'],
    ['HumanResource', 'achievesOutcome', 'Outcome', '성과달성'],
    ['HumanResource', 'participatesIn', 'PolicyParticipation', '정책참여'],
    ['HumanResource', 'hasCompetencyGap', 'CompetencyGap', '역량갭'],
    ['HumanResource', 'hasRecommendation', 'Recommendation', '추천기록'],
    ['HumanResource', 'enrollsInProgram', 'ProgramEnrollment', '프로그램등록'],
    ['HumanResource', 'contributesToStrategy', 'NationalStrategy', '기여전략'],
    ['Outcome', 'improvesCompetency', 'Competency', '향상역량'],
    ['Outcome', 'linkedToPolicy', 'Policy', '연계정책'],
    ['Outcome', 'achievedBy', 'HumanResource', '달성인원'],
    ['PolicyParticipation', 'byPerson', 'HumanResource', '참여인원'],
    ['PolicyParticipation', 'receivesBenefit', 'Benefit', '혜택'],
    ['PolicyParticipation', 'producesOutcome', 'Outcome', '성과'],
    ['PolicyParticipation', 'underPolicy', 'Policy', '참여정책'],
    ['Recommendation', 'recommendsProgram', 'EducationProgram', '추천프로그램'],
    ['Recommendation', 'forPerson', 'HumanResource', '추천대상'],
    ['Recommendation', 'addressesGap', 'CompetencyGap', '갭기반'],
    ['ProgramEnrollment', 'intoProgram', 'EducationProgram', '등록프로그램'],
    ['ProgramEnrollment', 'byPerson', 'HumanResource', '등록인원'],
    ['CompetencyGap', 'gapInCompetency', 'CompetencyCategory', '갭역량분류'],
    ['CompetencyGap', 'gapOfPerson', 'HumanResource', '갭대상'],
    ['CompetencyAssessment', 'assessesCompetency', 'Competency', '평가역량'],
    ['CompetencyAssessment', 'assessesPerson', 'HumanResource', '평가대상'],
    ['Benefit', 'benefitFor', 'HumanResource', '혜택대상'],
    ['Benefit', 'fromPolicy', 'Policy', '제공정책'],
    ['Competency', 'inCategory', 'CompetencyCategory', '역량분류'],
    ['Competency', 'requiredByOccupation', 'Occupation', '직업요건'],
    ['Organization', 'locatedIn', 'Region', '소재지역'],
    ['CareerHistory', 'acquiredCompetency', 'Competency', '습득역량'],
    ['CareerHistory', 'ofPerson', 'HumanResource', '경력인원'],
    ['NationalStrategy', 'targetCompetency', 'Competency', '목표역량'],
  ];

  // Korean domain keyword → search terms mapping
  const KEYWORD_MAP = {
    '정책': ['policy', '정책', 'policies'],
    '예산': ['budget', '예산', 'fund', '재원'],
    '프로그램': ['program', '교육', '훈련', 'education', 'training'],
    '역량': ['competency', '역량', 'skill', '기술'],
    '인원': ['person', 'human', '인원', '사람', 'personnel'],
    '성과': ['outcome', '성과', 'result', '결과'],
    '기관': ['organization', '기관', 'org', '기업'],
    '전략': ['strategy', '전략', 'national'],
    '혜택': ['benefit', '혜택', '수혜'],
    '추천': ['recommendation', '추천', 'recommend'],
    '지역': ['region', '지역', 'location', '지방'],
    '역량갭': ['gap', '역량갭', '부족', 'shortage'],
    '평가': ['assessment', '평가', 'evaluate'],
    '등록': ['enrollment', '등록', 'enroll'],
    '직업': ['occupation', '직업', 'job', '직종'],
    '대상': ['target', '대상', 'targetgroup'],
    '고용': ['employment', '고용', 'employ'],
    '경력': ['career', '경력', 'history'],
  };

  // ── RAG: search SPARQL results ─────────────────────────────────────────────
  function _expandKeywords(question) {
    const base = question.toLowerCase();
    const expanded = new Set(
      base.split(/[\s,。、]+/).filter(k => k.length > 1)
    );
    for (const [kor, alts] of Object.entries(KEYWORD_MAP)) {
      if (alts.some(a => base.includes(a)) || base.includes(kor)) {
        alts.forEach(a => expanded.add(a));
        expanded.add(kor);
      }
    }
    return [...expanded];
  }

  function _searchSparql(question, sparqlData) {
    if (!sparqlData) return [];
    const keywords = _expandKeywords(question);

    const scored = Object.entries(sparqlData.queries).map(([qid, qdata]) => {
      let score = 0;
      const title = (qdata.title || '').toLowerCase();
      const res = qdata.result || {};
      const cols = (res.columns || []).map(c => c.toLowerCase()).join(' ');

      for (const kw of keywords) {
        if (title.includes(kw)) score += 3;
        if (cols.includes(kw)) score += 2;
      }

      // Bonus for queries with actual data
      if (score > 0 && res.rows && res.rows.length > 0) score += 1;

      return { qid, title: qdata.title, score, result: res };
    });

    return scored
      .filter(s => s.score > 0 && s.result && s.result.rows && s.result.rows.length > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);
  }

  function _formatTable(title, result, maxRows = 12) {
    const { columns, rows } = result;
    if (!columns || !rows || rows.length === 0) return '';

    const cleanCell = c => (c == null ? '' : String(c).replace(/hrd:/g, '').replace(/\|/g, '/'));
    const header = columns.join(' | ');
    const sep = columns.map(() => '---').join(' | ');
    const body = rows.slice(0, maxRows)
      .map(r => r.map(cleanCell).join(' | '))
      .join('\n');
    const note = rows.length > maxRows ? `\n(총 ${rows.length}건 중 ${maxRows}건 표시)` : '';

    return `**[${title}]**\n| ${header} |\n| ${sep} |\n${body.split('\n').map(l => `| ${l} |`).join('\n')}${note}\n`;
  }

  // ── Prompt builder ─────────────────────────────────────────────────────────
  function _buildPrompt(question, sparqlData) {
    const relevant = _searchSparql(question, sparqlData);

    const propsCtx = OBJECT_PROPS
      .map(([src, prop, tgt, kor]) => `  ${src} --[${kor}]--> ${tgt}`)
      .join('\n');

    const dataCtx = relevant.length > 0
      ? relevant.map(r => _formatTable(r.title, r.result)).join('\n')
      : '(질문과 직접 연관된 사전 집계 데이터를 찾지 못했습니다. 온톨로지 구조 기반으로 답변합니다.)';

    const system = `당신은 한국 인적자원개발(HRD) 거버넌스 플랫폼의 온톨로지 전문가이자 데이터 분석가입니다.
RDF/OWL 온톨로지와 SPARQL 쿼리로 구축된 HRD 데이터베이스를 기반으로 사용자 질문에 답변합니다.

## 온톨로지 주요 클래스 관계 (Object Properties)
${propsCtx}

## 관련 실제 데이터 (SPARQL 결과)
${dataCtx}

## 답변 지침
- 반드시 한국어로 답변하세요
- **데이터 기반 사실**과 **온톨로지 구조 기반 추론**을 명확히 구분하세요
- 구체적인 수치나 예시가 데이터에 있으면 반드시 인용하세요
- 데이터에 없는 내용은 "온톨로지 구조상으로는..." 또는 "추론하면..."으로 시작하세요
- 관련 클래스/프로퍼티 이름을 백틱(\`)으로 표시하세요
- 답변은 3~5개 단락으로 구성하세요`;

    return { system, user: question, relevant };
  }

  // ── API calls ──────────────────────────────────────────────────────────────
  async function _callClaude(apiKey, system, user) {
    const resp = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1500,
        system,
        messages: [{ role: 'user', content: user }],
      }),
    });
    if (!resp.ok) {
      const err = await resp.json().catch(() => ({}));
      throw new Error(err.error?.message || `Claude API 오류 (HTTP ${resp.status})`);
    }
    const data = await resp.json();
    return data.content?.[0]?.text || '응답을 받지 못했습니다.';
  }

  async function _callGemini(apiKey, system, user) {
    const fullPrompt = `${system}\n\n---\n사용자 질문: ${user}`;
    const resp = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: fullPrompt }] }],
          generationConfig: { maxOutputTokens: 1500, temperature: 0.3 },
        }),
      }
    );
    if (!resp.ok) {
      const err = await resp.json().catch(() => ({}));
      throw new Error(err.error?.message || `Gemini API 오류 (HTTP ${resp.status})`);
    }
    const data = await resp.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || '응답을 받지 못했습니다.';
  }

  // ── Markdown renderer (minimal) ────────────────────────────────────────────
  function _renderMarkdown(text) {
    return text
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/^## (.+)$/gm, '<h3 class="nlq-h3">$1</h3>')
      .replace(/^### (.+)$/gm, '<h4 class="nlq-h4">$1</h4>')
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      .replace(/`(.+?)`/g, '<code class="nlq-code">$1</code>')
      .replace(/^\| (.+) \|$/gm, (_, inner) => {
        const cells = inner.split(' | ');
        return '<tr>' + cells.map(c => `<td>${c}</td>`).join('') + '</tr>';
      })
      .replace(/(<tr>.*<\/tr>\n?)+/g, match => `<table class="nlq-table">${match}</table>`)
      .replace(/^---+$/gm, '<hr>')
      .replace(/\n\n/g, '</p><p class="nlq-p">')
      .replace(/\n/g, '<br>')
      .replace(/^(.)/s, '<p class="nlq-p">$1')
      .replace(/(.)$/s, '$1</p>');
  }

  // ── UI ─────────────────────────────────────────────────────────────────────
  let _sparqlDataGetter = null;

  function _showPanel(type, html, sources) {
    const placeholder = document.getElementById('sparqlPlaceholder');
    const sparqlContent = document.getElementById('sparqlResultContent');
    const nlqPanel = document.getElementById('nlqResponsePanel');

    if (placeholder) placeholder.style.display = 'none';
    if (sparqlContent) sparqlContent.style.display = 'none';
    if (!nlqPanel) return;
    nlqPanel.style.display = 'flex';

    const body = document.getElementById('nlqResponseBody');
    const sourcesEl = document.getElementById('nlqSources');

    if (type === 'loading') {
      body.innerHTML = '<div class="nlq-loading"><span class="nlq-spinner"></span>AI가 온톨로지 데이터를 분석 중입니다...</div>';
      sourcesEl.innerHTML = '';
    } else if (type === 'error') {
      body.innerHTML = `<div class="nlq-error-box">${html}</div>`;
      sourcesEl.innerHTML = '';
    } else {
      body.innerHTML = `<div class="nlq-answer-text">${html}</div>`;
      if (sources && sources.length) {
        sourcesEl.innerHTML = '<span class="nlq-sources-label">참조한 데이터:</span> '
          + sources.map(s => `<span class="nlq-source-tag">${s}</span>`).join('');
      } else {
        sourcesEl.innerHTML = '<span class="nlq-sources-none">온톨로지 구조 기반 추론</span>';
      }
    }
  }

  async function _onQuery() {
    const input = document.getElementById('nlqInput');
    const question = (input?.value || '').trim();
    if (!question) {
      input?.focus();
      return;
    }

    const cfg = _loadConfig();
    if (!cfg.claudeKey && !cfg.geminiKey) {
      _showPanel('error', '⚙ API 키가 설정되지 않았습니다.<br>우측 상단 <strong>⚙ 설정</strong> 버튼을 클릭하여 Claude 또는 Gemini API 키를 입력하세요.<br><br><small>Claude 키: <a href="https://console.anthropic.com" target="_blank" style="color:#58a6ff">console.anthropic.com</a> | Gemini 키: <a href="https://aistudio.google.com/app/apikey" target="_blank" style="color:#58a6ff">aistudio.google.com</a></small>');
      return;
    }

    _showPanel('loading', '', []);

    try {
      const sparqlData = _sparqlDataGetter ? _sparqlDataGetter() : null;
      const { system, user, relevant } = _buildPrompt(question, sparqlData);

      let answer;
      const useGemini = cfg.provider === 'gemini' && cfg.geminiKey;
      if (useGemini) {
        answer = await _callGemini(cfg.geminiKey, system, user);
      } else if (cfg.claudeKey) {
        answer = await _callClaude(cfg.claudeKey, system, user);
      } else {
        answer = await _callGemini(cfg.geminiKey, system, user);
      }

      _showPanel('answer', _renderMarkdown(answer), relevant.map(r => r.title));
    } catch (err) {
      _showPanel('error', `오류가 발생했습니다: <strong>${err.message}</strong><br><small>API 키를 확인하거나 네트워크 상태를 점검해주세요.</small>`);
    }
  }

  function _updateBadge() {
    const cfg = _loadConfig();
    const badge = document.getElementById('nlqProviderBadge');
    if (!badge) return;
    const hasKey = !!(cfg.claudeKey || cfg.geminiKey);
    if (!hasKey) {
      badge.textContent = 'API 키 미설정';
      badge.className = 'nlq-badge nlq-badge-warn';
    } else {
      badge.textContent = cfg.provider === 'gemini' ? '● Gemini' : '● Claude';
      badge.className = 'nlq-badge nlq-badge-ok';
    }
  }

  function _openSettings() {
    const modal = document.getElementById('nlqSettingsModal');
    if (!modal) return;
    const cfg = _loadConfig();
    const clEl = document.getElementById('nlqClaudeKey');
    const gmEl = document.getElementById('nlqGeminiKey');
    const prEl = document.getElementById('nlqProvider');
    if (clEl) clEl.value = cfg.claudeKey || '';
    if (gmEl) gmEl.value = cfg.geminiKey || '';
    if (prEl) prEl.value = cfg.provider || 'claude';
    modal.style.display = 'flex';
  }

  function _saveSettings() {
    const cfg = {
      claudeKey: document.getElementById('nlqClaudeKey')?.value.trim() || '',
      geminiKey: document.getElementById('nlqGeminiKey')?.value.trim() || '',
      provider: document.getElementById('nlqProvider')?.value || 'claude',
    };
    _saveConfig(cfg);
    _updateBadge();
    document.getElementById('nlqSettingsModal').style.display = 'none';
  }

  function bindEvents() {
    document.getElementById('nlqQueryBtn')?.addEventListener('click', _onQuery);
    document.getElementById('nlqSettingsBtn')?.addEventListener('click', _openSettings);
    document.getElementById('nlqSaveSettings')?.addEventListener('click', _saveSettings);
    document.getElementById('nlqCancelSettings')?.addEventListener('click', () => {
      document.getElementById('nlqSettingsModal').style.display = 'none';
    });
    document.getElementById('nlqSettingsModal')?.addEventListener('click', e => {
      if (e.target.id === 'nlqSettingsModal') document.getElementById('nlqSettingsModal').style.display = 'none';
    });
    document.getElementById('nlqInput')?.addEventListener('keydown', e => {
      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) _onQuery();
    });
    // Example chips
    document.querySelectorAll('.nlq-example-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        const input = document.getElementById('nlqInput');
        if (input) { input.value = chip.dataset.q; input.focus(); }
      });
    });
    _updateBadge();
  }

  function init(sparqlDataGetter) {
    _sparqlDataGetter = sparqlDataGetter;
    bindEvents();
  }

  return { init };
})();
