// HRD Governance Platform - Data Loader
// Loads ontology.json; falls back to embedded demo data on file:// protocol

const HRDData = {
  raw: null,

  async load() {
    try {
      const res = await fetch('data/ontology.json');
      if (!res.ok) throw new Error('fetch failed');
      this.raw = await res.json();
    } catch {
      this.raw = this._demo();
    }
    return this.raw;
  },

  _demo() {
    return {
      strategies: [
        { id: 'AI디지털', name: 'AI 디지털 대전환', en: 'AI and Digital Transformation', type: 'NationalStrategy' },
        { id: '전략기술', name: '전략기술 자립·주권 확보', en: 'Strategic Technology Sovereignty', type: 'NationalStrategy' },
        { id: '탄소중립', name: '탄소중립 및 에너지 대전환', en: 'Carbon Neutrality', type: 'NationalStrategy' },
        { id: '미래모빌리티', name: '미래 모빌리티 산업 육성', en: 'Future Mobility Industry', type: 'NationalStrategy' },
        { id: '포용복지', name: '포용적 복지국가 실현', en: 'Inclusive Welfare State', type: 'NationalStrategy' },
      ],
      organizations: [
        { id: 'MSIT', name: '과학기술정보통신부', en: 'Ministry of Science and ICT', abbr: 'MSIT', type: 'CentralMinistry', role: '디지털 전환·AI·ICT 인재 양성' },
        { id: 'MOE', name: '교육부', en: 'Ministry of Education', abbr: 'MOE', type: 'CentralMinistry', role: '학교·대학 교육정책' },
        { id: 'MoEL', name: '고용노동부', en: 'Ministry of Employment and Labor', abbr: 'MoEL', type: 'CentralMinistry', role: '직업훈련·고용서비스' },
        { id: 'MOTIE', name: '산업통상자원부', en: 'Ministry of Trade, Industry and Energy', abbr: 'MOTIE', type: 'CentralMinistry', role: '전략기술 인재 양성' },
        { id: 'MOF', name: '기획재정부', en: 'Ministry of Economy and Finance', abbr: 'MOF', type: 'CentralMinistry', role: 'HRD 예산 총괄' },
      ],
      policies: [
        { id: 'POL_001', name: 'AI 인재 10만 양성 정책', en: 'AI Talent 100K Policy', type: 'PublicPolicy' },
        { id: 'POL_002', name: '디지털 새싹 캠프', en: 'Digital Sapling Camp', type: 'PublicPolicy' },
        { id: 'POL_003', name: '국가전략기술 인재양성', en: 'National Strategic Tech Talent', type: 'PublicPolicy' },
      ],
      budgets: [
        { id: 'BUD_001', name: 'AI 디지털 인재양성 예산', amount: 5000000000, fiscalYear: 2025, type: 'Budget' },
        { id: 'BUD_002', name: '직업훈련 지원 예산', amount: 3200000000, fiscalYear: 2025, type: 'Budget' },
        { id: 'BUD_003', name: '첨단기술 R&D 인력 예산', amount: 2800000000, fiscalYear: 2025, type: 'Budget' },
      ],
      programs: [
        { id: 'PROG_001', name: 'AI 부트캠프', en: 'AI Bootcamp', type: 'EducationProgram' },
        { id: 'PROG_002', name: '디지털 전환 교육', en: 'Digital Transformation Training', type: 'EducationProgram' },
        { id: 'PROG_003', name: '스마트 제조 훈련', en: 'Smart Manufacturing Training', type: 'EducationProgram' },
        { id: 'PROG_004', name: '탄소중립 전문가 과정', en: 'Carbon Neutral Expert Course', type: 'EducationProgram' },
        { id: 'PROG_005', name: '모빌리티 기술 교육', en: 'Mobility Tech Training', type: 'EducationProgram' },
      ],
      competencies: [
        { id: 'COMP_001', name: 'AI·머신러닝', en: 'AI/Machine Learning', type: 'Competency' },
        { id: 'COMP_002', name: '클라우드 컴퓨팅', en: 'Cloud Computing', type: 'Competency' },
        { id: 'COMP_003', name: '데이터 분석', en: 'Data Analytics', type: 'Competency' },
        { id: 'COMP_004', name: '사이버보안', en: 'Cybersecurity', type: 'Competency' },
        { id: 'COMP_005', name: '반도체 설계', en: 'Semiconductor Design', type: 'Competency' },
      ],
    };
  },

  get strategies() { return this.raw?.strategies || []; },
  get organizations() { return this.raw?.organizations || []; },
  get policies() { return this.raw?.policies || []; },
  get budgets() { return this.raw?.budgets || []; },
  get programs() { return this.raw?.programs || []; },
  get competencies() { return this.raw?.competencies || []; },

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
