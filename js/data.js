// HRD Governance Platform - Data Loader
// Loads ontology.json; falls back to embedded demo data on file:// protocol

const HRDData = {
  raw: null,
  budgetAnalysis: null,

  async load() {
    if (typeof OntologyData !== 'undefined') {
      this.raw = OntologyData;
    } else {
      try {
        const res = await fetch('data/ontology.json');
        if (!res.ok) throw new Error('fetch failed');
        const parsed = await res.json();
        // Handle both wrapped ({meta, strategies, ...}) and flat ({strategies, ...}) formats
        this.raw = parsed.strategies ? parsed : (parsed.meta ? parsed : this._demo());
      } catch {
        this.raw = this._demo();
      }
    }
    if (typeof BudgetAnalysisData !== 'undefined') {
      this.budgetAnalysis = BudgetAnalysisData;
    } else {
      try {
        const res2 = await fetch('data/budget_analysis.json');
        if (res2.ok) this.budgetAnalysis = await res2.json();
      } catch { /* optional */ }
    }
    return this.raw;
  },

  _demo() {
    return {
      strategies: [
        { id: '인공지능주권', name: 'AI 디지털 대전환', en: 'AI and Digital Transformation', type: 'NationalStrategy', policyCount: 15, programCount: 28, policies: [], programs: [], budgets: [], implementingOrgs: [], targetGroups: [], competencies: [], performanceGoals: [], totalBudget: 50000000000, totalBudgetStr: '500억원', description: 'AI 디지털 대전환은 국가 인적자원 개발의 핵심 전략입니다.' },
        { id: '전략기술주권', name: '전략기술 자립·주권 확보', en: 'Strategic Technology Sovereignty', type: 'NationalStrategy', policyCount: 13, programCount: 29, policies: [], programs: [], budgets: [], implementingOrgs: [], targetGroups: [], competencies: [], performanceGoals: [], totalBudget: 30000000000, totalBudgetStr: '300억원', description: '전략기술 자립·주권 확보 전략입니다.' },
        { id: '탄소중립·재생에너지', name: '탄소중립 및 에너지 대전환', en: 'Carbon Neutrality', type: 'NationalStrategy', policyCount: 2, programCount: 8, policies: [], programs: [], budgets: [], implementingOrgs: [], targetGroups: [], competencies: [], performanceGoals: [], totalBudget: 0, totalBudgetStr: '미배정', description: '탄소중립 및 에너지 대전환 전략입니다.' },
      ],
      organizations: [
        { id: 'ORG_MINISTRY_01', name: '과학기술정보통신부', en: 'Ministry of Science and ICT', abbr: 'MSIT', type: 'CentralMinistry', role: '디지털 전환·AI·ICT 인재 양성' },
        { id: 'ORG_MINISTRY_02', name: '교육부', en: 'Ministry of Education', abbr: 'MOE', type: 'CentralMinistry', role: '학교·대학 교육정책' },
      ],
      policies: [
        { id: 'POLICY_01', name: '은퇴과학자 활용 지원사업', en: 'Retired Scientist Utilization Support', type: 'PublicPolicy' },
        { id: 'POLICY_02', name: '디지털 전환 교육 프로그램', en: 'Digital Transformation Education', type: 'PublicPolicy' },
      ],
      budgets: [
        { id: 'BUDGET_STRAT_01', name: 'AI·디지털 인재양성 전략예산', amount: 50000000000, fiscalYear: '2026', type: 'Budget' },
      ],
      programs: [
        { id: 'HS_BAM_01', name: '전략기획실무', en: 'Strategic Planning Fundamentals', type: 'EducationProgram' },
      ],
      competencies: [
        { id: 'COMP_AI_01', name: 'AI·머신러닝', en: 'AI/Machine Learning', type: 'Competency' },
      ],
      targetGroups: [],
    };
  },

  get meta() { return this.raw?.meta || {}; },
  get strategies() { return this.raw?.strategies || []; },
  get organizations() { return this.raw?.organizations || []; },
  get policies() { return this.raw?.policies || []; },
  get budgets() { return this.raw?.budgets || []; },
  get programs() { return this.raw?.programs || []; },
  get competencies() { return this.raw?.competencies || []; },
  get targetGroups() { return this.raw?.targetGroups || []; },
  get persons() { return this.raw?.persons || []; },
  get outcomes() { return this.raw?.outcomes || []; },
  get benefits() { return this.raw?.benefits || []; },
  get competencyAssessments() { return this.raw?.competencyAssessments || []; },
  get policyParticipations() { return this.raw?.policyParticipations || []; },
  get recommendations() { return this.raw?.recommendations || []; },
  get competencyGaps() { return this.raw?.competencyGaps || []; },
  get programEnrollments() { return this.raw?.programEnrollments || []; },

  totalBudget() {
    return this.budgets.reduce((s, b) => s + (b.amount || 0), 0);
  },

  formatWon(n) {
    if (n >= 1e12) return (n / 1e12).toFixed(1) + '조원';
    if (n >= 1e8) return (n / 1e8).toFixed(0) + '억원';
    if (n >= 1e4) return (n / 1e4).toFixed(0) + '만원';
    return n.toLocaleString() + '원';
  },

  orgsByType() {
    const map = {};
    this.organizations.forEach(o => {
      map[o.type] = (map[o.type] || 0) + 1;
    });
    return map;
  },
};
