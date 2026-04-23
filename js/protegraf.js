// ProteGraf — Protege OntoGraf-style dynamic graph viewer
// Search by class name → selected class centered, all relationships shown as colorful dashed edges

const ProteGraf = (() => {
  // ── Ontology schema data ────────────────────────────────────────────────────
  const HIERARCHY = {
    Literacy: 'Competency', SoftSkill: 'Competency', HardSkill: 'Competency',
    Basic_Academic: 'Literacy', Digital_Literacy: 'Literacy', Civic_Literacy: 'Literacy',
    Social_Value: 'Civic_Literacy',
    Ethics: 'Social_Value', Global_Citizenship: 'Social_Value', Environmental_Awareness: 'Social_Value',
    Language_and_Math: 'Basic_Academic', CS_Foundation: 'Basic_Academic',
    Foreign_Language: 'Language_and_Math', Business_Writing: 'Language_and_Math',
    Numeracy: 'Language_and_Math', Statistics: 'Language_and_Math',
    Algorithm: 'CS_Foundation', Computer_Science: 'CS_Foundation',
    Data_Structure: 'CS_Foundation', OS: 'CS_Foundation',
    Data_and_AI: 'Digital_Literacy', Data_Fluency: 'Digital_Literacy', Tech_Security: 'Digital_Literacy',
    AI_Utilization: 'Data_and_AI', Data_Analysis_Basic: 'Data_and_AI',
    Privacy_Protection: 'Tech_Security', Network_Ethics: 'Tech_Security', Info_Security: 'Tech_Security',
    Self_Management: 'SoftSkill', Interpersonal: 'SoftSkill', Problem_Solving: 'SoftSkill',
    Adaptability: 'Self_Management', Reliability: 'Self_Management',
    Time_Management: 'Adaptability', Resilience: 'Adaptability', Continuous_Learning: 'Adaptability',
    Responsibility: 'Reliability', Integrity: 'Reliability', Professionalism: 'Reliability',
    Collaboration: 'Interpersonal', Leadership: 'Interpersonal',
    Networking: 'Collaboration', Conflict_Management: 'Collaboration', Negotiation: 'Collaboration',
    Motivation: 'Leadership', Coaching: 'Leadership', Team_Building: 'Leadership', Vision_Setting: 'Leadership',
    Creativity: 'Problem_Solving', Thinking_Skill: 'Problem_Solving',
    Design_Thinking: 'Creativity', Innovation: 'Creativity', Creative_Planning: 'Creativity',
    Strategic_Thinking: 'Thinking_Skill', Logical_Reasoning: 'Thinking_Skill', Critical_Analysis: 'Thinking_Skill',
    Business_Admin: 'HardSkill', Industrial_Tech: 'HardSkill', ICT_Dev: 'HardSkill',
    Management: 'Business_Admin', Marketing_Strategy: 'Business_Admin', Marketing_Sales: 'Business_Admin',
    Strategy: 'Management', Legal_Affairs: 'Management', HR_Management: 'Management', Accounting: 'Management',
    Digital_Branding: 'Marketing_Sales', Market_Research: 'Marketing_Sales', Sales_Management: 'Marketing_Sales',
    Service_Public: 'Industrial_Tech', Manufacturing: 'Industrial_Tech',
    Public_Admin: 'Service_Public', Social_Welfare: 'Service_Public', Education_Planning: 'Service_Public',
    Semiconductor_Design: 'Manufacturing', Welding: 'Manufacturing', Quality_Control: 'Manufacturing',
    Software: 'ICT_Dev', AI_and_Infrastructure: 'ICT_Dev',
    Mobile_App: 'Software', Web_Dev: 'Software', Java: 'Software',
    MLOps: 'AI_and_Infrastructure', Cloud_Arch: 'AI_and_Infrastructure',
    LLM_Fine_Tuning: 'AI_and_Infrastructure', DevOps: 'AI_and_Infrastructure',
    LocalGovernment: 'Organization', ResearchCenter: 'Organization', PublicInstitution: 'Organization',
    GovernmentAgency: 'Organization', CertificationBody: 'Organization', Enterprise: 'Organization',
    CentralMinistry: 'Organization',
    TuitionSupport: 'Policy', EmploymentSubsidy: 'Policy', R_D_Project: 'Policy', PublicPolicy: 'Policy',
    VoucherProgram: 'Policy', TrainingIncentive: 'Policy',
    OrgBudget: 'Budget', PolicyBudget: 'Budget', StrategyBudget: 'Budget',
    K_DigitalTraining: 'EducationProgram', DegreeCourse: 'EducationProgram', JobRetraining: 'EducationProgram',
    OnlineModule: 'EducationProgram', WorkshopSeminar: 'EducationProgram',
    Unemployed: 'HumanResource', Student: 'HumanResource', Incumbent: 'HumanResource', Person: 'HumanResource',
    RetiredProfessional: 'Person', HighPerformer: 'Person',
    GangLeng: 'Region', Daejeon: 'Region', Inchun: 'Region', Busan: 'Region',
    Guangju: 'Region', Daegu: 'Region', Seoul: 'Region', Geoje: 'Region', Sejong: 'Region', Suwon: 'Region',
    Employment: 'Outcome', Entrepreneurship: 'Outcome', EconomicImpact: 'Outcome',
    SocialImpact: 'Outcome', SkillGrowth: 'Outcome', RevenueGrowth: 'Outcome',
    PolicyParticipation: 'Event', OutcomeMeasurement: 'Event', AssessmentEvent: 'Event',
    ProgramCompletion: 'Event', ProgramEnrollment: 'Event',
    JuniorTalent: 'TalentSegment',
    Active: 'EmploymentStatus', Retired: 'EmploymentStatus',
    COMPCAT_Leadership: 'CompetencyCategory', COMPCAT_Management: 'CompetencyCategory',
    COMPCAT_Thinking_Skill: 'CompetencyCategory', COMPCAT_ICT: 'CompetencyCategory',
    COMPCAT_Manufacturing: 'CompetencyCategory', COMPCAT_Service: 'CompetencyCategory',
  };

  const ROOT_CLASSES = [
    'Benefit', 'Budget', 'CareerHistory', 'Certification', 'Competency',
    'CompetencyAssessment', 'CompetencyCategory', 'CompetencyGap',
    'EducationProgram', 'EmploymentStatus', 'Event', 'HumanResource',
    'MatchScore', 'NationalStrategy', 'Occupation', 'Organization', 'Outcome',
    'Policy', 'Recommendation', 'Region', 'StrategicGoal',
    'TalentSegment', 'TargetGroup'
  ];

  const OBJECT_PROPS = [
    ['Policy', 'hasAllocatedBudget',      'Budget',               '예산배정'],
    ['Policy', 'supportsCompetency',      'Competency',           '역량지원'],
    ['Policy', 'supportsOutcome',         'Outcome',              '성과지원'],
    ['Policy', 'alignsWithStrategy',      'NationalStrategy',     '전략정렬'],
    ['Policy', 'implementedBy',           'Organization',         '시행기관'],
    ['Policy', 'appliesTo',               'TargetGroup',          '적용대상'],
    ['Policy', 'hasParticipation',        'PolicyParticipation',  '참여기록'],
    ['Policy', 'providesBenefit',         'Benefit',              '혜택제공'],
    ['Budget', 'managedBy',              'Organization',          '관리기관'],
    ['Budget', 'alignedWithStrategy',    'NationalStrategy',      '연계전략'],
    ['Budget', 'fundsProgram',           'EducationProgram',      '지원프로그램'],
    ['EducationProgram', 'hasTargetGroup',      'TargetGroup',         '대상집단'],
    ['EducationProgram', 'developsCompetency',  'Competency',          '목표역량'],
    ['EducationProgram', 'operatedBy',          'Organization',        '운영기관'],
    ['EducationProgram', 'alignsWithStrategy',  'NationalStrategy',    '정렬전략'],
    ['EducationProgram', 'fundedByBudget',      'Budget',              '재원'],
    ['EducationProgram', 'hasEnrollment',       'ProgramEnrollment',   '등록현황'],
    ['HumanResource', 'belongsToTargetGroup',    'TargetGroup',          '대상분류'],
    ['HumanResource', 'hasCompetency',           'Competency',           '보유역량'],
    ['HumanResource', 'contributesToStrategy',   'NationalStrategy',     '기여전략'],
    ['HumanResource', 'achievesOutcome',         'Outcome',              '성과달성'],
    ['HumanResource', 'participatesIn',          'PolicyParticipation',  '정책참여'],
    ['HumanResource', 'hasCompetencyAssessment', 'CompetencyAssessment', '역량평가'],
    ['HumanResource', 'hasCompetencyGap',        'CompetencyGap',        '역량갭'],
    ['HumanResource', 'hasRecommendation',       'Recommendation',       '추천기록'],
    ['HumanResource', 'enrollsInProgram',        'ProgramEnrollment',    '프로그램등록'],
    ['HumanResource', 'hasCareerHistory',        'CareerHistory',        '경력이력'],
    ['Outcome', 'improvesCompetency',   'Competency',    '향상역량'],
    ['Outcome', 'linkedToPolicy',       'Policy',        '연계정책'],
    ['Outcome', 'achievedBy',           'HumanResource', '달성인원'],
    ['PolicyParticipation', 'byPerson',       'HumanResource', '참여인원'],
    ['PolicyParticipation', 'receivesBenefit','Benefit',        '혜택'],
    ['PolicyParticipation', 'producesOutcome','Outcome',        '성과'],
    ['PolicyParticipation', 'underPolicy',    'Policy',         '참여정책'],
    ['Recommendation', 'recommendsProgram', 'EducationProgram', '추천프로그램'],
    ['Recommendation', 'forPerson',         'HumanResource',    '추천대상'],
    ['Recommendation', 'addressesGap',      'CompetencyGap',    '갭기반'],
    ['ProgramEnrollment', 'intoProgram', 'EducationProgram', '등록프로그램'],
    ['ProgramEnrollment', 'byPerson',    'HumanResource',    '등록인원'],
    ['CompetencyGap', 'gapInCompetency', 'CompetencyCategory', '갭역량'],
    ['CompetencyGap', 'gapOfPerson',     'HumanResource',      '갭대상'],
    ['CompetencyAssessment', 'assessesCompetency', 'Competency',    '평가역량'],
    ['CompetencyAssessment', 'assessesPerson',     'HumanResource', '평가대상'],
    ['Benefit', 'benefitFor',  'HumanResource', '혜택대상'],
    ['Benefit', 'fromPolicy',  'Policy',         '제공정책'],
    ['Competency', 'inCategory',          'CompetencyCategory', '역량분류'],
    ['Competency', 'requiredByOccupation','Occupation',         '직업요건'],
    ['Organization', 'locatedIn', 'Region', '소재지역'],
    ['CareerHistory', 'acquiredCompetency', 'Competency',    '습득역량'],
    ['CareerHistory', 'ofPerson',           'HumanResource', '경력인원'],
    ['NationalStrategy', 'targetCompetency', 'Competency', '목표역량'],
  ];

  // ── Edge color palette ──────────────────────────────────────────────────────
  const PALETTE = [
    '#FF6B6B','#4ECDC4','#45B7D1','#96CEB4','#DDA0DD',
    '#F7DC6F','#BB8FCE','#85C1E9','#82E0AA','#F0B27A',
    '#AED6F1','#FAD7A0','#D7BDE2','#A3E4D7','#ABEBC6',
    '#F9E79F','#FF9A8B','#88D8B0','#FFCC5C','#96CCEA',
  ];

  const _propColors = new Map();
  let _colorIdx = 0;

  function _edgeColor(prop) {
    if (prop === 'subClassOf') return '#5b9bd5';
    if (!_propColors.has(prop)) {
      _propColors.set(prop, PALETTE[_colorIdx++ % PALETTE.length]);
    }
    return _propColors.get(prop);
  }

  // ── State ───────────────────────────────────────────────────────────────────
  let _centerCls = null;
  let _expanded = new Set();
  let _sim = null;

  // ── Helpers ─────────────────────────────────────────────────────────────────
  function _childrenOf(cls) {
    return Object.entries(HIERARCHY).filter(([, p]) => p === cls).map(([c]) => c);
  }

  function _propsOf(cls) {
    return OBJECT_PROPS.filter(([s, , t]) => s === cls || t === cls);
  }

  function _allClasses() {
    const s = new Set(ROOT_CLASSES);
    Object.keys(HIERARCHY).forEach(k => s.add(k));
    Object.values(HIERARCHY).forEach(v => s.add(v));
    return [...s].sort();
  }

  // ── Search ──────────────────────────────────────────────────────────────────
  function _doSearch(query, mode) {
    const q = query.trim().toLowerCase();
    const badge = document.getElementById('pg-result-count');
    if (!q) { if (badge) badge.textContent = ''; return; }

    const all = _allClasses();
    let hits;
    if (mode === 'exact')  hits = all.filter(c => c.toLowerCase() === q);
    else if (mode === 'starts') hits = all.filter(c => c.toLowerCase().startsWith(q));
    else hits = all.filter(c => c.toLowerCase().includes(q));

    if (badge) badge.textContent = `${hits.length} result(s) found.`;

    if (hits.length > 0) {
      _centerCls = hits[0];
      _expanded.clear();
      _renderGraph();
    }
  }

  function _doClear() {
    _centerCls = null;
    _expanded.clear();
    const badge = document.getElementById('pg-result-count');
    if (badge) badge.textContent = '';
    _renderGraph();
  }

  // ── Graph data builder ──────────────────────────────────────────────────────
  function _buildData() {
    const nodes = [], links = [];
    const nodeSet = new Set();

    function addNode(id, isFocus) {
      if (nodeSet.has(id)) return;
      nodeSet.add(id);
      nodes.push({ id, isFocus: !!isFocus });
    }

    function addLink(src, tgt, prop, kor) {
      if (links.some(l => l.source === src && l.target === tgt && l.prop === prop)) return;
      links.push({ source: src, target: tgt, prop, kor, color: _edgeColor(prop), _idx: links.length });
    }

    // After collecting all nodes, add EVERY edge between any two visible nodes
    // This matches Protege OntoGraf behavior
    function addAllEdges() {
      OBJECT_PROPS.forEach(([s, p, t, k]) => {
        if (nodeSet.has(s) && nodeSet.has(t)) addLink(s, t, p, k);
      });
      Object.entries(HIERARCHY).forEach(([child, parent]) => {
        if (nodeSet.has(child) && nodeSet.has(parent)) addLink(child, parent, 'subClassOf', 'subClassOf');
      });
    }

    // ── Default overview (no selection) ──
    if (!_centerCls) {
      ROOT_CLASSES.forEach(rc => addNode(rc, false));
      addNode('owl:Thing', false);
      addAllEdges();
      return { nodes, links };
    }

    // ── Focus mode: first collect nodes, then add all edges between them ──
    addNode(_centerCls, true);

    // 1. Object property neighbors (both directions)
    _propsOf(_centerCls).forEach(([s, , t]) => {
      addNode(s === _centerCls ? t : s, false);
    });

    // 2. Hierarchy: parent + children
    const parent = HIERARCHY[_centerCls];
    if (parent) addNode(parent, false);
    _childrenOf(_centerCls).forEach(ch => addNode(ch, false));

    // 3. Expanded secondary nodes' neighborhoods
    _expanded.forEach(expCls => {
      if (!nodeSet.has(expCls)) return;
      _propsOf(expCls).forEach(([s, , t]) => addNode(s === expCls ? t : s, false));
      const ep = HIERARCHY[expCls];
      if (ep) addNode(ep, false);
      _childrenOf(expCls).forEach(ch => addNode(ch, false));
    });

    // 4. owl:Thing
    if (ROOT_CLASSES.includes(_centerCls) || [...nodeSet].some(n => ROOT_CLASSES.includes(n))) {
      addNode('owl:Thing', false);
    }

    // 5. Add ALL edges between every visible node pair
    addAllEdges();

    return { nodes, links };
  }

  // ── D3 Render ───────────────────────────────────────────────────────────────
  const NW = 144, NH = 30, INST_R = 9, PLUS_R = 8;

  function _edgeEndX(src, tgt, fromSrc) {
    const s = fromSrc ? src : tgt, t = fromSrc ? tgt : src;
    const dx = (t.x || 0) - (s.x || 0), dy = (t.y || 0) - (s.y || 0);
    const dist = Math.sqrt(dx * dx + dy * dy) || 1;
    if (s.id === 'owl:Thing') return (s.x || 0) + INST_R * dx / dist;
    const hw = NW / 2, hh = NH / 2;
    const r = (Math.abs(dx) * hh > Math.abs(dy) * hw) ? hw / Math.abs(dx) : hh / Math.abs(dy);
    return (s.x || 0) + dx * r;
  }

  function _edgeEndY(src, tgt, fromSrc) {
    const s = fromSrc ? src : tgt, t = fromSrc ? tgt : src;
    const dx = (t.x || 0) - (s.x || 0), dy = (t.y || 0) - (s.y || 0);
    const dist = Math.sqrt(dx * dx + dy * dy) || 1;
    if (s.id === 'owl:Thing') return (s.y || 0) + INST_R * dy / dist;
    const hw = NW / 2, hh = NH / 2;
    const r = (Math.abs(dx) * hh > Math.abs(dy) * hw) ? hw / Math.abs(dx) : hh / Math.abs(dy);
    return (s.y || 0) + dy * r;
  }

  function _renderGraph() {
    const wrap = document.getElementById('pg-graph-wrap');
    if (!wrap) return;
    if (_sim) { _sim.stop(); _sim = null; }
    wrap.innerHTML = '';

    const { nodes, links } = _buildData();
    const W = wrap.clientWidth || 900;
    const H = wrap.clientHeight || 580;
    const cx = W / 2, cy = H / 2;

    const svg = d3.select(wrap).append('svg')
      .attr('width', '100%').attr('height', '100%')
      .attr('viewBox', `0 0 ${W} ${H}`);

    // ── Arrow markers per color ──
    const defs = svg.append('defs');
    const uniqueColors = [...new Set(links.map(l => l.color))];
    const colorToMarkerId = new Map();
    uniqueColors.forEach((col, i) => {
      const mid = `pga-${i}`;
      colorToMarkerId.set(col, mid);
      defs.append('marker').attr('id', mid)
        .attr('viewBox', '-1 -6 12 12').attr('refX', 10).attr('refY', 0)
        .attr('markerWidth', 9).attr('markerHeight', 9).attr('orient', 'auto')
        .append('path').attr('d', 'M0,-5L10,0L0,5Z')
        .attr('fill', 'none').attr('stroke', col).attr('stroke-width', 1.6);
    });

    const g = svg.append('g');
    svg.call(d3.zoom().scaleExtent([0.08, 5]).on('zoom', e => g.attr('transform', e.transform)));

    // ── Initial positions ──
    nodes.forEach((n, i) => {
      if (n.isFocus) { n.x = cx; n.y = cy; n.fx = cx; n.fy = cy; }
      else {
        const a = (i / Math.max(nodes.length, 1)) * 2 * Math.PI;
        const r = 180 + Math.random() * 60;
        n.x = cx + r * Math.cos(a);
        n.y = cy + r * Math.sin(a);
      }
    });

    // ── Assign curvature per link ──
    // Group by undirected node-pair; single edge → straight (0), multiple → symmetric fan
    const pairMap = new Map();
    links.forEach(l => {
      const key = [l.source, l.target].sort().join('|||');
      if (!pairMap.has(key)) pairMap.set(key, []);
      pairMap.get(key).push(l);
    });
    links.forEach(l => {
      const key = [l.source, l.target].sort().join('|||');
      const group = pairMap.get(key);
      const n = group.length;
      const idx = group.indexOf(l);
      l._curve = n === 1 ? 0 : (idx - (n - 1) / 2) * 50;
    });

    // ── Links (curved path, hollow arrowhead) ──
    const linkG = g.append('g');
    const linkSel = linkG.selectAll('path.pg-link').data(links).join('path')
      .attr('class', 'pg-link')
      .attr('stroke', d => d.color)
      .attr('stroke-width', 1.8)
      .attr('stroke-dasharray', '9,5')
      .attr('fill', 'none')
      .attr('marker-end', d => `url(#${colorToMarkerId.get(d.color)})`);

    const labelSel = linkG.selectAll('text.pg-link-lbl').data(links).join('text')
      .attr('class', 'pg-link-lbl')
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'middle')
      .attr('fill', d => d.color)
      .text(d => d.kor || d.prop);

    // ── Nodes ──
    const nodeG = g.append('g');
    const nodeSel = nodeG.selectAll('g.pg-ng').data(nodes).join('g')
      .attr('class', d => `pg-ng${d.isFocus ? ' pg-ng-focus' : ''}`)
      .style('cursor', 'pointer')
      .call(d3.drag()
        .on('start', (e, d) => { if (!e.active) sim.alphaTarget(0.3).restart(); d.fx = d.x; d.fy = d.y; })
        .on('drag',  (e, d) => { d.fx = e.x; d.fy = e.y; })
        .on('end',   (e, d) => { if (!e.active) sim.alphaTarget(0); if (!d.isFocus) { d.fx = null; d.fy = null; } }))
      .on('click', (e, d) => {
        if (e.target.closest('.pg-plus-g')) return;
        if (d.id === 'owl:Thing') return;
        _centerCls = d.id;
        _expanded.clear();
        const badge = document.getElementById('pg-result-count');
        if (badge) badge.textContent = '1 result(s) found.';
        const inp = document.getElementById('pg-search-input');
        if (inp) inp.value = d.id;
        _renderGraph();
      });

    // owl:Thing rendered as a circle
    nodeSel.each(function(d) {
      const sel = d3.select(this);
      if (d.id === 'owl:Thing') {
        sel.append('circle').attr('r', 24).attr('class', 'pg-node-owl');
        sel.append('text').attr('text-anchor', 'middle').attr('dy', '0.35em')
          .attr('class', 'pg-node-owl-lbl').text('owl:Thing');
        return;
      }
      // Node box
      sel.append('rect')
        .attr('x', -NW / 2).attr('y', -NH / 2)
        .attr('width', NW).attr('height', NH)
        .attr('rx', 4).attr('class', 'pg-node-rect');

      // Left yellow dot (Protege style)
      sel.append('circle')
        .attr('cx', -NW / 2 + 13).attr('cy', 0).attr('r', 7)
        .attr('class', 'pg-node-dot');

      // Class name
      sel.append('text')
        .attr('x', 4).attr('y', 0)
        .attr('text-anchor', 'middle').attr('dominant-baseline', 'middle')
        .attr('class', 'pg-node-lbl')
        .text(d.id.length > 16 ? d.id.slice(0, 15) + '…' : d.id);

      // + / − expand button
      const plusG = sel.append('g')
        .attr('class', 'pg-plus-g')
        .attr('transform', `translate(${NW / 2 - 11}, 0)`)
        .on('click', (e, d) => {
          e.stopPropagation();
          if (_expanded.has(d.id)) _expanded.delete(d.id);
          else _expanded.add(d.id);
          _renderGraph();
        });
      plusG.append('circle').attr('r', PLUS_R).attr('class', 'pg-plus-circle');
      plusG.append('text')
        .attr('text-anchor', 'middle').attr('dominant-baseline', 'middle')
        .attr('class', 'pg-plus-lbl')
        .text(d => _expanded.has(d.id) ? '−' : '+');
    });

    // ── Force simulation ──
    const sim = d3.forceSimulation(nodes)
      .force('link', d3.forceLink(links).id(d => d.id).distance(d => d.prop === 'subClassOf' ? 150 : 200).strength(0.3))
      .force('charge', d3.forceManyBody().strength(-420))
      .force('center', d3.forceCenter(cx, cy))
      .force('collide', d3.forceCollide(88))
      .on('tick', () => {
        nodeSel.attr('transform', d => `translate(${d.x},${d.y})`);
        linkSel.attr('d', d => {
          const sx = _edgeEndX(d.source, d.target, true);
          const sy = _edgeEndY(d.source, d.target, true);
          const tx = _edgeEndX(d.source, d.target, false);
          const ty = _edgeEndY(d.source, d.target, false);
          if (d._curve === 0) return `M${sx},${sy} L${tx},${ty}`;
          const dx = tx - sx, dy = ty - sy;
          const len = Math.sqrt(dx * dx + dy * dy) || 1;
          const cpx = (sx + tx) / 2 - (dy / len) * d._curve;
          const cpy = (sy + ty) / 2 + (dx / len) * d._curve;
          return `M${sx},${sy} Q${cpx},${cpy} ${tx},${ty}`;
        });
        labelSel
          .attr('x', d => {
            const sx = _edgeEndX(d.source, d.target, true);
            const tx = _edgeEndX(d.source, d.target, false);
            if (d._curve === 0) return (sx + tx) / 2;
            const dy2 = (d.target.y || 0) - (d.source.y || 0);
            const len = Math.sqrt(Math.pow((d.target.x||0)-(d.source.x||0),2)+Math.pow(dy2,2))||1;
            return (sx + tx) / 2 - (dy2 / len) * d._curve * 0.5;
          })
          .attr('y', d => {
            const sy = _edgeEndY(d.source, d.target, true);
            const ty = _edgeEndY(d.source, d.target, false);
            if (d._curve === 0) return (sy + ty) / 2 - 7;
            const dx2 = (d.target.x || 0) - (d.source.x || 0);
            const len = Math.sqrt(Math.pow(dx2,2)+Math.pow((d.target.y||0)-(d.source.y||0),2))||1;
            return (sy + ty) / 2 + (dx2 / len) * d._curve * 0.5 - 7;
          });
      });

    _sim = sim;
  }

  // ── Init ────────────────────────────────────────────────────────────────────
  function init(containerId) {
    const wrap = document.getElementById(containerId);
    if (!wrap) return;

    wrap.innerHTML = `
      <div class="pg-layout">
        <div class="pg-toolbar">
          <span class="pg-toolbar-logo">OntoGraf</span>
          <span class="pg-toolbar-sep"></span>
          <span class="pg-toolbar-label">Search:</span>
          <input id="pg-search-input" type="text" class="pg-search-input" placeholder="class name…" autocomplete="off"/>
          <select id="pg-search-mode" class="pg-search-mode">
            <option value="contains">contains</option>
            <option value="starts">starts with</option>
            <option value="exact">exact</option>
          </select>
          <button id="pg-search-btn" class="pg-btn">Search</button>
          <button id="pg-clear-btn" class="pg-btn pg-btn-clear">Clear</button>
          <span id="pg-result-count" class="pg-result-count"></span>
          <span class="pg-toolbar-hint">노드 클릭: 포커스 전환 &nbsp;|&nbsp; [+] 클릭: 이웃 확장 &nbsp;|&nbsp; 드래그: 이동 &nbsp;|&nbsp; 스크롤: 줌</span>
        </div>
        <div id="pg-graph-wrap" class="pg-graph-wrap"></div>
      </div>`;

    document.getElementById('pg-search-btn').addEventListener('click', () =>
      _doSearch(document.getElementById('pg-search-input').value,
                document.getElementById('pg-search-mode').value));
    document.getElementById('pg-search-input').addEventListener('keydown', e => {
      if (e.key === 'Enter')
        _doSearch(e.target.value, document.getElementById('pg-search-mode').value);
    });
    document.getElementById('pg-clear-btn').addEventListener('click', _doClear);

    _renderGraph();
  }

  return { init };
})();
