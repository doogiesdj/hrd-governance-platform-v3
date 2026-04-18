// OntoGraf - Protege-style interactive ontology graph browser (multi-select + object properties)

const OntoGraf = (() => {
  // ── Class hierarchy (subClassOf) ──────────────────────────────────────────
  const HIERARCHY = {
    // Competency taxonomy
    Literacy: 'Competency', SoftSkill: 'Competency', HardSkill: 'Competency',
    Basic_Academic: 'Literacy', Digital_Literacy: 'Literacy', Civic_Literacy: 'Literacy',
    Social_Value: 'Civic_Literacy',
    Ethics: 'Social_Value', Global_Citizenship: 'Social_Value', Environmental_Awareness: 'Social_Value',
    Language_and_Math: 'Basic_Academic', CS_Foundation: 'Basic_Academic',
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
    // Organization types
    LocalGovernment: 'Organization', ResearchCenter: 'Organization', PublicInstitution: 'Organization',
    GovernmentAgency: 'Organization', CertificationBody: 'Organization', Enterprise: 'Organization',
    CentralMinistry: 'Organization',
    // Policy types
    TuitionSupport: 'Policy', EmploymentSubsidy: 'Policy', R_D_Project: 'Policy', PublicPolicy: 'Policy',
    VoucherProgram: 'Policy', TrainingIncentive: 'Policy',
    // Budget types
    OrgBudget: 'Budget', PolicyBudget: 'Budget', StrategyBudget: 'Budget',
    // EducationProgram types
    K_DigitalTraining: 'EducationProgram', DegreeCourse: 'EducationProgram', JobRetraining: 'EducationProgram',
    OnlineModule: 'EducationProgram', WorkshopSeminar: 'EducationProgram',
    // HumanResource types
    Unemployed: 'HumanResource', Student: 'HumanResource', Incumbent: 'HumanResource', Person: 'HumanResource',
    RetiredProfessional: 'Person', HighPerformer: 'Person',
    // Region
    GangLeng: 'Region', Daejeon: 'Region', Inchun: 'Region', Busan: 'Region',
    Guangju: 'Region', Daegu: 'Region', Seoul: 'Region', Geoje: 'Region', Sejong: 'Region', Suwon: 'Region',
    // Outcome types
    Employment: 'Outcome', Entrepreneurship: 'Outcome', EconomicImpact: 'Outcome',
    SocialImpact: 'Outcome', SkillGrowth: 'Outcome', RevenueGrowth: 'Outcome',
    // Events
    PolicyParticipation: 'Event', OutcomeMeasurement: 'Event', AssessmentEvent: 'Event',
    ProgramCompletion: 'Event', ProgramEnrollment: 'Event',
    // Others
    JuniorTalent: 'TalentSegment',
    Active: 'EmploymentStatus', Retired: 'EmploymentStatus',
    // CompetencyCategory taxonomy
    COMPCAT_Leadership: 'CompetencyCategory', COMPCAT_Management: 'CompetencyCategory',
    COMPCAT_Thinking_Skill: 'CompetencyCategory', COMPCAT_ICT: 'CompetencyCategory',
    COMPCAT_Manufacturing: 'CompetencyCategory', COMPCAT_Service: 'CompetencyCategory',
  };

  const ROOT_CLASSES = [
    'NationalStrategy', 'Policy', 'EducationProgram', 'Organization', 'Budget',
    'Competency', 'HumanResource', 'Region', 'Outcome', 'Event',
    'TalentSegment', 'EmploymentStatus', 'CompetencyAssessment', 'CompetencyCategory',
    'CompetencyGap', 'StrategicGoal', 'Recommendation', 'Occupation', 'Benefit',
    'CareerHistory', 'Certification', 'MatchScore', 'TargetGroup'
  ];

  const INSTANCES = {
    NationalStrategy: [
      '인공지능주권', '전략기술주권', '탄소중립·재생에너지', '미래모빌리티',
      '디지털플랫폼정부', '포용적복지국가', '혁신인재양성',
    ],
    Policy: [
      'POLICY_01', 'POLICY_02', 'POLICY_03', 'POLICY_04', 'POLICY_05',
      'POLICY_06', 'POLICY_07', 'POLICY_08',
    ],
    Organization: [
      'ORG_MINISTRY_01', 'ORG_MINISTRY_02', 'ORG_MINISTRY_03', 'ORG_MINISTRY_04',
      'ORG_AGENCY_01', 'ORG_AGENCY_02', 'ORG_KIRD_01',
    ],
    Budget: [
      'BUDGET_01', 'BUDGET_02', 'BUDGET_03',
      'BUDGET_STRAT_01', 'BUDGET_STRAT_02', 'BUDGET_STRAT_03',
    ],
    EducationProgram: [
      'HS_BAM_01', 'HS_IAI_01', 'HS_ISW_01', 'LT_DAI_01',
      'SS_IPL_01', 'SS_PST_01',
    ],
    HumanResource: [
      'PERSON_01', 'PERSON_02', 'PERSON_03', 'PERSON_11', 'PERSON_12', 'PERSON_13',
    ],
    TargetGroup: [
      'TGROUP_Employee', 'TGROUP_Unemployed', 'TGROUP_Expert', 'TGROUP_Youth',
    ],
    Competency: [
      'COMP_AI_01', 'COMP_SW_01', 'COMP_Shipbuilding', 'COMP_BioHealth',
      'COMP_DataAnalysis', 'COMP_CloudSec', 'COMP_AdminLaw',
    ],
    Outcome: [
      'OUT_01', 'OUT_02', 'OUT_03', 'OUT_11', 'OUT_12',
    ],
    Benefit: ['BENEFIT_11', 'BENEFIT_12', 'BENEFIT_13'],
    CompetencyAssessment: [
      'ASSESS_PERSON_01_COMP_AI_01', 'ASSESS_PERSON_02_COMP_SW_01',
    ],
    CompetencyGap: [
      'GAP_PERSON_01_COMPCAT_Leadership', 'GAP_PERSON_01_COMPCAT_Management',
    ],
    Recommendation: [
      'REC_PERSON_01_HS_BAM_01', 'REC_PERSON_01_SS_IPL_01',
    ],
    ProgramEnrollment: [
      'ENROLL_PERSON_11_HS_IAI_02', 'ENROLL_PERSON_12_HS_ISW_02',
    ],
    Civic_Literacy: ['inst_CivicLit_01', 'inst_CivicLit_02'],
    Digital_Literacy: ['inst_DigLit_01', 'inst_DigLit_02'],
    Region: ['inst_Seoul_01', 'inst_Busan_01'],
    Literacy: ['inst_Lit_Basic_01'],
  };

  // ── Object Properties (Domain → Range) ───────────────────────────────────
  // Format: [sourceClass, propertyName, targetClass, korLabel]
  // Bidirectional lookup: shown when EITHER src or tgt class is selected.
  const OBJECT_PROPS = [
    // ── 정책(Policy) ─────────────────────────────
    ['Policy', 'hasAllocatedBudget',      'Budget',            '예산배정'],
    ['Policy', 'supportsCompetency',      'Competency',        '역량지원'],
    ['Policy', 'supportsOutcome',         'Outcome',           '성과지원'],
    ['Policy', 'alignsWithStrategy',      'NationalStrategy',  '전략정렬'],
    ['Policy', 'implementedBy',           'Organization',      '시행기관'],
    ['Policy', 'appliesTo',               'TargetGroup',       '적용대상'],
    ['Policy', 'hasParticipation',        'PolicyParticipation','참여기록'],
    ['Policy', 'providesBenefit',         'Benefit',           '혜택제공'],
    // ── 예산(Budget) ─────────────────────────────
    ['Budget', 'managedBy',              'Organization',      '관리기관'],
    ['Budget', 'alignedWithStrategy',    'NationalStrategy',  '연계전략'],
    ['Budget', 'fundsProgram',           'EducationProgram',  '지원프로그램'],
    // ── 교육프로그램(EducationProgram) ────────────
    ['EducationProgram', 'hasTargetGroup',      'TargetGroup',      '대상집단'],
    ['EducationProgram', 'developsCompetency',  'Competency',       '목표역량'],
    ['EducationProgram', 'operatedBy',          'Organization',     '운영기관'],
    ['EducationProgram', 'alignsWithStrategy',  'NationalStrategy', '정렬전략'],
    ['EducationProgram', 'fundedByBudget',      'Budget',           '재원'],
    ['EducationProgram', 'hasEnrollment',       'ProgramEnrollment','등록현황'],
    // ── 인원/인적자원(HumanResource) ─────────────
    ['HumanResource', 'belongsToTargetGroup',    'TargetGroup',       '대상분류'],
    ['HumanResource', 'hasCompetency',           'Competency',        '보유역량'],
    ['HumanResource', 'contributesToStrategy',   'NationalStrategy',  '기여전략'],
    ['HumanResource', 'achievesOutcome',         'Outcome',           '성과달성'],
    ['HumanResource', 'participatesIn',          'PolicyParticipation','정책참여'],
    ['HumanResource', 'hasCompetencyAssessment', 'CompetencyAssessment','역량평가'],
    ['HumanResource', 'hasCompetencyGap',        'CompetencyGap',     '역량갭'],
    ['HumanResource', 'hasRecommendation',       'Recommendation',    '추천기록'],
    ['HumanResource', 'enrollsInProgram',        'ProgramEnrollment', '프로그램등록'],
    ['HumanResource', 'hasCareerHistory',        'CareerHistory',     '경력이력'],
    // ── 성과(Outcome) ─────────────────────────────
    ['Outcome', 'improvesCompetency',   'Competency',    '향상역량'],
    ['Outcome', 'linkedToPolicy',       'Policy',        '연계정책'],
    ['Outcome', 'achievedBy',           'HumanResource', '달성인원'],
    // ── 정책참여(PolicyParticipation) ────────────
    ['PolicyParticipation', 'byPerson',       'HumanResource', '참여인원'],
    ['PolicyParticipation', 'receivesBenefit','Benefit',        '혜택'],
    ['PolicyParticipation', 'producesOutcome','Outcome',        '성과'],
    ['PolicyParticipation', 'underPolicy',    'Policy',         '참여정책'],
    // ── 추천(Recommendation) ─────────────────────
    ['Recommendation', 'recommendsProgram', 'EducationProgram', '추천프로그램'],
    ['Recommendation', 'forPerson',         'HumanResource',    '추천대상'],
    ['Recommendation', 'addressesGap',      'CompetencyGap',    '갭기반'],
    // ── 프로그램등록(ProgramEnrollment) ──────────
    ['ProgramEnrollment', 'intoProgram', 'EducationProgram', '등록프로그램'],
    ['ProgramEnrollment', 'byPerson',    'HumanResource',    '등록인원'],
    // ── 역량갭(CompetencyGap) ─────────────────────
    ['CompetencyGap', 'gapInCompetency', 'CompetencyCategory', '갭역량'],
    ['CompetencyGap', 'gapOfPerson',     'HumanResource',      '갭대상'],
    // ── 역량평가(CompetencyAssessment) ───────────
    ['CompetencyAssessment', 'assessesCompetency', 'Competency',   '평가역량'],
    ['CompetencyAssessment', 'assessesPerson',     'HumanResource','평가대상'],
    // ── 혜택(Benefit) ─────────────────────────────
    ['Benefit', 'benefitFor',  'HumanResource', '혜택대상'],
    ['Benefit', 'fromPolicy',  'Policy',         '제공정책'],
    // ── 역량(Competency) ─────────────────────────
    ['Competency', 'inCategory',         'CompetencyCategory', '역량분류'],
    ['Competency', 'requiredByOccupation','Occupation',         '직업요건'],
    // ── 기관(Organization) ───────────────────────
    ['Organization', 'locatedIn', 'Region', '소재지역'],
    // ── 경력이력(CareerHistory) ──────────────────
    ['CareerHistory', 'acquiredCompetency', 'Competency',   '습득역량'],
    ['CareerHistory', 'ofPerson',           'HumanResource','경력인원'],
    // ── 국가전략(NationalStrategy) ───────────────
    ['NationalStrategy', 'targetCompetency', 'Competency', '목표역량'],
  ];

  // ── Selection state ───────────────────────────────────────────────────────
  const _selClasses = new Set();
  const _selInstances = new Map();

  let _sim = null;

  // ── Helpers ───────────────────────────────────────────────────────────────
  function _childrenOf(cls) {
    return Object.entries(HIERARCHY).filter(([, p]) => p === cls).map(([c]) => c);
  }

  function _allClasses() {
    const s = new Set(ROOT_CLASSES);
    Object.keys(HIERARCHY).forEach(k => s.add(k));
    Object.values(HIERARCHY).forEach(v => s.add(v));
    return [...s];
  }

  function _instancesOf(cls) { return INSTANCES[cls] || []; }

  // Return all OBJECT_PROPS where cls is source OR target
  function _propsOf(cls) {
    return OBJECT_PROPS.filter(([src, , tgt]) => src === cls || tgt === cls);
  }

  // ── Tree builder ──────────────────────────────────────────────────────────
  function _buildTreeHTML(cls, depth) {
    const children = _childrenOf(cls);
    const instances = _instancesOf(cls);
    const hasChildren = children.length > 0 || instances.length > 0;
    const pad = depth * 14;

    let html = `<div class="og-tree-node" style="padding-left:${pad}px">`;
    html += hasChildren
      ? `<span class="og-tree-toggle" data-cls="${cls}">▶</span>`
      : `<span class="og-tree-spacer"></span>`;
    html += `<span class="og-tree-class" data-cls="${cls}" id="og-node-${cls}">${cls}</span></div>`;

    if (hasChildren) {
      html += `<div class="og-tree-children" id="ogc-${cls}" style="display:none;">`;
      children.forEach(ch => { html += _buildTreeHTML(ch, depth + 1); });
      instances.forEach(inst => {
        html += `<div class="og-tree-node" style="padding-left:${(depth + 1) * 14}px">
          <span class="og-tree-spacer"></span>
          <span class="og-tree-instance" data-inst="${inst}" data-cls="${cls}">◉ ${inst}</span>
        </div>`;
      });
      html += `</div>`;
    }
    return html;
  }

  function _buildFullTree() {
    return ROOT_CLASSES.map(rc => _buildTreeHTML(rc, 0)).join('');
  }

  // ── Selection management ──────────────────────────────────────────────────
  function _toggleClass(cls) {
    if (_selClasses.has(cls)) {
      _selClasses.delete(cls);
    } else {
      _selClasses.add(cls);
      let cur = HIERARCHY[cls];
      while (cur) {
        const ch = document.getElementById('ogc-' + cur);
        if (ch && ch.style.display === 'none') {
          ch.style.display = 'block';
          const tog = document.querySelector(`.og-tree-toggle[data-cls="${cur}"]`);
          if (tog) tog.textContent = '▼';
        }
        cur = HIERARCHY[cur];
      }
    }
    _syncTreeHighlight();
    _updateBadge();
    _buildMultiGraph();
  }

  function _toggleInstance(inst, cls) {
    if (_selInstances.has(inst)) {
      _selInstances.delete(inst);
    } else {
      _selInstances.set(inst, cls);
    }
    _syncTreeHighlight();
    _updateBadge();
    _buildMultiGraph();
  }

  function _clearSelection() {
    _selClasses.clear();
    _selInstances.clear();
    _syncTreeHighlight();
    _updateBadge();
    _buildMultiGraph();
  }

  function _syncTreeHighlight() {
    document.querySelectorAll('.og-tree-class').forEach(el => {
      el.classList.toggle('og-selected', _selClasses.has(el.dataset.cls));
    });
    document.querySelectorAll('.og-tree-instance').forEach(el => {
      el.classList.toggle('og-sel-inst', _selInstances.has(el.dataset.inst));
    });
  }

  function _updateBadge() {
    const badge = document.getElementById('og-sel-badge');
    if (!badge) return;
    const total = _selClasses.size + _selInstances.size;
    badge.textContent = total > 0 ? `${total}개 선택됨` : '선택 없음';
    badge.className = total > 0 ? 'og-badge og-badge-active' : 'og-badge';
  }

  // ── Multi-graph builder ───────────────────────────────────────────────────
  function _buildMultiGraph() {
    const nodes = [], links = [];
    const nodeMap = new Map();

    const PRIORITY = { selected: 6, 'selected-inst': 6, child: 5, instance: 4, context: 3, propctx: 2, grandcontext: 1 };

    function addNode(id, type) {
      if (nodeMap.has(id)) {
        const ex = nodeMap.get(id);
        if ((PRIORITY[type] || 0) > (PRIORITY[ex.type] || 0)) ex.type = type;
        return ex;
      }
      const n = { id, type, label: id };
      nodeMap.set(id, n);
      nodes.push(n);
      return n;
    }

    function addLink(src, tgt, rel, propName, korLabel) {
      const key = `${src}|${tgt}|${rel}|${propName || ''}`;
      if (links.some(l => `${l.source}|${l.target}|${l.rel}|${l.propName || ''}` === key)) return;
      // Merge duplicate objectProp edges between same pair (show combined label)
      if (rel === 'objectProp') {
        const existing = links.find(l =>
          l.rel === 'objectProp' &&
          ((l.source === src && l.target === tgt) || (l.source === tgt && l.target === src))
        );
        if (existing) {
          if (korLabel && !existing.korLabel.includes(korLabel)) {
            existing.korLabel += ' / ' + korLabel;
          }
          return;
        }
      }
      links.push({ source: src, target: tgt, rel, propName: propName || '', korLabel: korLabel || '' });
    }

    if (_selClasses.size === 0 && _selInstances.size === 0) {
      ROOT_CLASSES.slice(0, 14).forEach(rc => addNode(rc, 'context'));
      // Show object property links between root classes in overview
      OBJECT_PROPS.forEach(([src, prop, tgt, kor]) => {
        if (nodeMap.has(src) && nodeMap.has(tgt)) {
          addLink(src, tgt, 'objectProp', prop, kor);
        }
      });
      _render(nodes, links, null);
      return;
    }

    // Add each selected class and its neighborhood
    _selClasses.forEach(cls => {
      addNode(cls, 'selected');

      // ── subClassOf hierarchy ──
      const parent = HIERARCHY[cls];
      if (parent) {
        addNode(parent, _selClasses.has(parent) ? 'selected' : 'context');
        addLink(cls, parent, 'subClassOf');
        const gp = HIERARCHY[parent];
        if (gp && !_selClasses.has(gp)) {
          addNode(gp, 'grandcontext');
          addLink(parent, gp, 'subClassOf');
        }
      }
      _childrenOf(cls).forEach(ch => {
        addNode(ch, _selClasses.has(ch) ? 'selected' : 'child');
        addLink(ch, cls, 'subClassOf');
        if (!_selClasses.has(ch)) {
          _childrenOf(ch).slice(0, 2).forEach(gch => {
            addNode(gch, _selClasses.has(gch) ? 'selected' : 'grandcontext');
            addLink(gch, ch, 'subClassOf');
          });
        }
      });

      // ── Instances ──
      const insts = _instancesOf(cls);
      insts.slice(0, 4).forEach(inst => {
        addNode(inst, _selInstances.has(inst) ? 'selected-inst' : 'instance');
        addLink(inst, cls, 'instanceOf');
        nodeMap.get(inst).parentCls = cls;
      });
      if (insts.length > 4) {
        const moreId = `+${insts.length - 4} (${cls})`;
        addNode(moreId, 'more');
        addLink(moreId, cls, 'instanceOf');
      }

      // ── Object properties: add prop-context neighbors ──
      _propsOf(cls).forEach(([src, prop, tgt, kor]) => {
        const neighborCls = (src === cls) ? tgt : src;
        if (!_selClasses.has(neighborCls)) {
          addNode(neighborCls, 'propctx');
        }
        // Always draw the objectProp edge between canonical direction
        addLink(src, tgt, 'objectProp', prop, kor);
      });
    });

    // Add each selected instance and its neighborhood
    _selInstances.forEach((cls, inst) => {
      addNode(inst, 'selected-inst');
      nodeMap.get(inst).parentCls = cls;

      if (cls) {
        addNode(cls, _selClasses.has(cls) ? 'selected' : 'context');
        addLink(inst, cls, 'instanceOf');

        const gp = HIERARCHY[cls];
        if (gp) {
          addNode(gp, _selClasses.has(gp) ? 'selected' : 'grandcontext');
          addLink(cls, gp, 'subClassOf');
        }

        _instancesOf(cls).filter(i => i !== inst && !_selInstances.has(i)).slice(0, 3).forEach(sib => {
          addNode(sib, 'instance');
          addLink(sib, cls, 'instanceOf');
          nodeMap.get(sib).parentCls = cls;
        });

        // Show object properties of the parent class
        _propsOf(cls).forEach(([src, prop, tgt, kor]) => {
          const neighborCls = (src === cls) ? tgt : src;
          if (!nodeMap.has(neighborCls)) addNode(neighborCls, 'propctx');
          addLink(src, tgt, 'objectProp', prop, kor);
        });
      }
    });

    // Bridge shared ancestors between selected classes
    if (_selClasses.size >= 2) {
      const selArr = [..._selClasses];
      for (let i = 0; i < selArr.length; i++) {
        for (let j = i + 1; j < selArr.length; j++) {
          _findSharedAncestor(selArr[i], selArr[j], nodeMap, addLink);
        }
      }
    }

    _render(nodes, links, null);
  }

  function _findSharedAncestor(a, b, nodeMap, addLink) {
    const pathA = _ancestorPath(a);
    const pathB = _ancestorPath(b);
    for (const anc of pathA) {
      if (pathB.includes(anc) && nodeMap.has(anc)) {
        const idxA = pathA.indexOf(anc);
        const idxB = pathB.indexOf(anc);
        if (idxA > 0 && nodeMap.has(pathA[idxA - 1])) addLink(pathA[idxA - 1], anc, 'subClassOf');
        if (idxB > 0 && nodeMap.has(pathB[idxB - 1])) addLink(pathB[idxB - 1], anc, 'subClassOf');
        return;
      }
    }
  }

  function _ancestorPath(cls) {
    const path = [];
    let cur = HIERARCHY[cls];
    while (cur) { path.push(cur); cur = HIERARCHY[cur]; }
    return path;
  }

  // ── D3 render ─────────────────────────────────────────────────────────────
  const NODE_W = 120, NODE_H = 32, INST_R = 22;

  function _render(nodes, links, _selectedId) {
    const wrap = document.getElementById('og-graph-wrap');
    if (!wrap) return;
    if (_sim) { _sim.stop(); _sim = null; }
    wrap.innerHTML = '';

    const W = wrap.clientWidth || 700;
    const H = wrap.clientHeight || 520;

    const svg = d3.select(wrap).append('svg').attr('width', '100%').attr('height', '100%')
      .attr('viewBox', `0 0 ${W} ${H}`);

    const defs = svg.append('defs');

    // subClassOf arrow — hollow blue triangle
    defs.append('marker').attr('id', 'og-arr-sub')
      .attr('viewBox', '0 -5 10 10').attr('refX', 10).attr('refY', 0)
      .attr('markerWidth', 8).attr('markerHeight', 8).attr('orient', 'auto')
      .append('path').attr('d', 'M0,-5L10,0L0,5Z')
      .attr('fill', 'none').attr('stroke', '#5b9bd5').attr('stroke-width', 1.5);

    // instanceOf arrow — filled orange
    defs.append('marker').attr('id', 'og-arr-inst')
      .attr('viewBox', '0 -5 10 10').attr('refX', 10).attr('refY', 0)
      .attr('markerWidth', 8).attr('markerHeight', 8).attr('orient', 'auto')
      .append('path').attr('d', 'M0,-5L10,0L0,5Z')
      .attr('fill', '#e08040').attr('stroke', '#e08040').attr('stroke-width', 1);

    // objectProp arrow — green diamond/arrow
    defs.append('marker').attr('id', 'og-arr-prop')
      .attr('viewBox', '0 -5 10 10').attr('refX', 10).attr('refY', 0)
      .attr('markerWidth', 8).attr('markerHeight', 8).attr('orient', 'auto')
      .append('path').attr('d', 'M0,-5L10,0L0,5L3,0Z')
      .attr('fill', '#3fb950').attr('stroke', '#3fb950').attr('stroke-width', 1);

    const g = svg.append('g');
    svg.call(d3.zoom().scaleExtent([0.15, 4]).on('zoom', e => g.attr('transform', e.transform)));

    const cx = W / 2, cy = H / 2;
    const selNodes = nodes.filter(n => n.type === 'selected' || n.type === 'selected-inst');
    const otherNodes = nodes.filter(n => n.type !== 'selected' && n.type !== 'selected-inst');

    selNodes.forEach((n, i) => {
      const a = (i / (selNodes.length || 1)) * 2 * Math.PI;
      n.x = cx + 80 * Math.cos(a);
      n.y = cy + 60 * Math.sin(a);
    });
    otherNodes.forEach((n, i) => {
      const a = (i / (otherNodes.length || 1)) * 2 * Math.PI;
      const r = 200 + Math.random() * 80;
      n.x = cx + r * Math.cos(a);
      n.y = cy + r * Math.sin(a);
    });

    // Draw links
    const linkSel = g.append('g').selectAll('line').data(links).join('line')
      .attr('class', d => {
        if (d.rel === 'objectProp') return 'og-link og-link-objectProp';
        return 'og-link og-link-' + d.rel;
      })
      .attr('marker-end', d => {
        if (d.rel === 'instanceOf') return 'url(#og-arr-inst)';
        if (d.rel === 'objectProp') return 'url(#og-arr-prop)';
        return 'url(#og-arr-sub)';
      });

    // Link labels for objectProp edges
    const propLinks = links.filter(l => l.rel === 'objectProp');
    const linkLabelSel = g.append('g').selectAll('text.og-link-label')
      .data(propLinks).join('text')
      .attr('class', 'og-link-label')
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'middle')
      .text(d => d.korLabel || d.propName || '');

    // Draw nodes
    const nodeSel = g.append('g').selectAll('g.og-node').data(nodes).join('g')
      .attr('class', d => 'og-node og-node-' + d.type)
      .call(d3.drag()
        .on('start', (e, d) => { if (!e.active) sim.alphaTarget(0.3).restart(); d.fx = d.x; d.fy = d.y; })
        .on('drag', (e, d) => { d.fx = e.x; d.fy = e.y; })
        .on('end', (e, d) => { if (!e.active) sim.alphaTarget(0); d.fx = null; d.fy = null; }))
      .on('click', (e, d) => {
        e.stopPropagation();
        if (d.type === 'more') return;
        if (d.type === 'instance' || d.type === 'selected-inst') {
          _toggleInstance(d.id, d.parentCls);
        } else {
          _toggleClass(d.id);
        }
        _showNodeInfo(d);
      });

    // Propagate parentCls to instance nodes
    links.forEach(l => {
      if (l.rel === 'instanceOf') {
        const iid = typeof l.source === 'object' ? l.source.id : l.source;
        const tid = typeof l.target === 'object' ? l.target.id : l.target;
        const iNode = nodes.find(n => n.id === iid);
        if (iNode && !iNode.parentCls) iNode.parentCls = tid;
      }
    });

    nodeSel.each(function(d) {
      const sel = d3.select(this);
      if (d.type === 'instance' || d.type === 'selected-inst' || d.type === 'more') {
        sel.append('circle').attr('r', INST_R);
        sel.append('text').attr('text-anchor', 'middle').attr('dy', '0.35em')
          .text(d.label.length > 13 ? d.label.slice(0, 12) + '…' : d.label);
      } else {
        sel.append('rect').attr('x', -NODE_W / 2).attr('y', -NODE_H / 2)
          .attr('width', NODE_W).attr('height', NODE_H).attr('rx', 4);
        sel.append('text').attr('text-anchor', 'middle').attr('dy', '0.35em')
          .text(d.label.length > 16 ? d.label.slice(0, 15) + '…' : d.label);
      }
    });

    const sim = d3.forceSimulation(nodes)
      .force('link', d3.forceLink(links).id(d => d.id).distance(d => d.rel === 'objectProp' ? 200 : 140).strength(0.4))
      .force('charge', d3.forceManyBody().strength(-350))
      .force('center', d3.forceCenter(cx, cy))
      .force('collide', d3.forceCollide(70))
      .on('tick', () => {
        nodeSel.attr('transform', d => `translate(${d.x},${d.y})`);
        linkSel
          .attr('x1', d => _edgeX(d.source, d.target, true))
          .attr('y1', d => _edgeY(d.source, d.target, true))
          .attr('x2', d => _edgeX(d.source, d.target, false))
          .attr('y2', d => _edgeY(d.source, d.target, false));
        linkLabelSel
          .attr('x', d => ((d.source.x || 0) + (d.target.x || 0)) / 2)
          .attr('y', d => ((d.source.y || 0) + (d.target.y || 0)) / 2 - 7);
      });

    _sim = sim;
  }

  function _isCircleNode(n) {
    return n.type === 'instance' || n.type === 'selected-inst' || n.type === 'more';
  }

  function _edgeX(src, tgt, fromSrc) {
    const s = fromSrc ? src : tgt, t = fromSrc ? tgt : src;
    const dx = t.x - s.x, dy = t.y - s.y, dist = Math.sqrt(dx * dx + dy * dy) || 1;
    if (_isCircleNode(s)) return s.x + INST_R * dx / dist;
    const hw = NODE_W / 2, hh = NODE_H / 2;
    const r = (Math.abs(dx) * hh > Math.abs(dy) * hw) ? hw / Math.abs(dx) : hh / Math.abs(dy);
    return s.x + dx * r;
  }

  function _edgeY(src, tgt, fromSrc) {
    const s = fromSrc ? src : tgt, t = fromSrc ? tgt : src;
    const dx = t.x - s.x, dy = t.y - s.y, dist = Math.sqrt(dx * dx + dy * dy) || 1;
    if (_isCircleNode(s)) return s.y + INST_R * dy / dist;
    const hw = NODE_W / 2, hh = NODE_H / 2;
    const r = (Math.abs(dx) * hh > Math.abs(dy) * hw) ? hw / Math.abs(dx) : hh / Math.abs(dy);
    return s.y + dy * r;
  }

  // ── Info panel ────────────────────────────────────────────────────────────
  function _showNodeInfo(d) {
    const panel = document.getElementById('og-info-panel');
    if (!panel) return;
    const parent = HIERARCHY[d.id];
    const children = _childrenOf(d.id);
    const insts = _instancesOf(d.id);
    const isSelCls = _selClasses.has(d.id);
    const isSelInst = _selInstances.has(d.id);
    const props = _propsOf(d.id);

    let html = `<div class="og-info-title">${d.id}</div>`;
    html += `<div class="og-info-status">${isSelCls || isSelInst ? '✅ 선택됨' : '선택 안 됨'} — 클릭하여 ${isSelCls || isSelInst ? '해제' : '추가'}</div>`;
    if (parent) html += `<div class="og-info-row"><b>subClassOf:</b> ${parent}</div>`;
    if (children.length) html += `<div class="og-info-row"><b>하위클래스(${children.length}):</b> ${children.slice(0, 5).join(', ')}${children.length > 5 ? '…' : ''}</div>`;
    if (insts.length) html += `<div class="og-info-row"><b>인스턴스(${insts.length}):</b> ${insts.slice(0, 4).join(', ')}${insts.length > 4 ? '…' : ''}</div>`;

    // Object properties
    const outProps = props.filter(([src]) => src === d.id);
    const inProps  = props.filter(([, , tgt]) => tgt === d.id);
    if (outProps.length) {
      html += `<div class="og-info-row"><b>→ 관계(출력):</b></div>`;
      outProps.forEach(([, prop, tgt, kor]) => {
        html += `<div class="og-info-row og-prop-row"><span class="og-prop-tag">→</span> <em>${kor || prop}</em> ▶ <b>${tgt}</b></div>`;
      });
    }
    if (inProps.length) {
      html += `<div class="og-info-row"><b>← 관계(입력):</b></div>`;
      inProps.forEach(([src, prop, , kor]) => {
        html += `<div class="og-info-row og-prop-row"><span class="og-prop-tag">←</span> <b>${src}</b> ▶ <em>${kor || prop}</em></div>`;
      });
    }

    panel.innerHTML = html;
    panel.style.display = 'block';
  }

  // ── Search ────────────────────────────────────────────────────────────────
  function _search(query) {
    const q = query.trim().toLowerCase();
    if (!q) return;
    const allCls = _allClasses();
    const matched = allCls.find(c => c.toLowerCase() === q) || allCls.find(c => c.toLowerCase().includes(q));
    if (matched) {
      if (!_selClasses.has(matched)) _toggleClass(matched);
      const el = document.getElementById('og-node-' + matched);
      if (el) el.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      return;
    }
    for (const [cls, insts] of Object.entries(INSTANCES)) {
      const inst = insts.find(i => i.toLowerCase().includes(q));
      if (inst && !_selInstances.has(inst)) { _toggleInstance(inst, cls); return; }
    }
    const panel = document.getElementById('og-info-panel');
    if (panel) {
      panel.innerHTML = `<div class="og-info-row" style="color:#f47;">검색 결과 없음: "${query}"</div>`;
      panel.style.display = 'block';
    }
  }

  // ── Init ──────────────────────────────────────────────────────────────────
  function init(containerId) {
    const wrap = document.getElementById(containerId);
    if (!wrap) return;

    wrap.innerHTML = `
      <div class="og-layout">
        <div class="og-left-panel">
          <div class="og-search-box">
            <input id="og-search-input" type="text" placeholder="클래스/인스턴스 검색…" autocomplete="off"/>
            <button id="og-search-btn">🔍</button>
          </div>
          <div class="og-sel-toolbar">
            <span class="og-badge" id="og-sel-badge">선택 없음</span>
            <button class="og-clear-btn" id="og-clear-btn" title="선택 초기화">✕ 초기화</button>
          </div>
          <div class="og-legend">
            <span class="og-legend-selected"></span>선택&nbsp;
            <span class="og-legend-class"></span>컨텍스트&nbsp;
            <span class="og-legend-child"></span>자식&nbsp;
            <span class="og-legend-propctx"></span>속성관계&nbsp;
            <span class="og-legend-inst"></span>인스턴스
          </div>
          <div class="og-legend og-legend-links">
            <span class="og-legend-link-sub"></span>subClassOf&nbsp;&nbsp;
            <span class="og-legend-link-inst"></span>instanceOf&nbsp;&nbsp;
            <span class="og-legend-link-prop"></span>objectProp
          </div>
          <div class="og-tree-hint">클릭: 선택/해제 &nbsp;|&nbsp; ▶ 클릭: 펼치기</div>
          <div class="og-tree-scroll" id="og-tree-scroll"></div>
        </div>
        <div class="og-right-panel">
          <div id="og-graph-wrap" class="og-graph-wrap"></div>
          <div id="og-info-panel" class="og-info-panel" style="display:none;"></div>
        </div>
      </div>`;

    document.getElementById('og-tree-scroll').innerHTML = _buildFullTree();

    wrap.addEventListener('click', evt => {
      const tog = evt.target.closest('.og-tree-toggle');
      if (tog) {
        const cls = tog.dataset.cls;
        const ch = document.getElementById('ogc-' + cls);
        if (ch) {
          const open = ch.style.display !== 'none';
          ch.style.display = open ? 'none' : 'block';
          tog.textContent = open ? '▶' : '▼';
        }
        return;
      }
      const clsEl = evt.target.closest('.og-tree-class');
      if (clsEl) { _toggleClass(clsEl.dataset.cls); return; }
      const instEl = evt.target.closest('.og-tree-instance');
      if (instEl) { _toggleInstance(instEl.dataset.inst, instEl.dataset.cls); return; }
    });

    document.getElementById('og-search-btn').addEventListener('click', () =>
      _search(document.getElementById('og-search-input').value));
    document.getElementById('og-search-input').addEventListener('keydown', e => {
      if (e.key === 'Enter') _search(e.target.value);
    });
    document.getElementById('og-clear-btn').addEventListener('click', _clearSelection);
    document.getElementById('og-graph-wrap').addEventListener('click', () => {
      const p = document.getElementById('og-info-panel');
      if (p) p.style.display = 'none';
    });

    // Default: show overview (no selection) with object property relationships
    _buildMultiGraph();
  }

  return { init };
})();
