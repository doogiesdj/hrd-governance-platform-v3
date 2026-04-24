Object.assign(App, {
  _COMP_L2_LABEL: {
    'Business_Admin':   '비즈니스 행정 (Business_Admin)',
    'ICT_Dev':          'ICT 개발 (ICT_Dev)',
    'Industrial_Tech':  '산업기술 (Industrial_Tech)',
    'Basic_Academic':   '기초학업 (Basic_Academic)',
    'Civic_Literacy':   '시민 리터러시 (Civic_Literacy)',
    'Digital_Literacy': '디지털 리터러시 (Digital_Literacy)',
    'Interpersonal':    '대인관계 (Interpersonal)',
    'Problem_Solving':  '문제해결 (Problem_Solving)',
    'Self_Management':  '자기관리 (Self_Management)',
  },

  _COMP_L2_DESC: {
    'Business_Admin':   '경영·마케팅·전략기획 등 비즈니스 행정 전문 역량. Protege 계층: HardSkill > Business_Admin',
    'ICT_Dev':          'AI·인프라·소프트웨어 개발 등 ICT 기술 역량. Protege 계층: HardSkill > ICT_Dev',
    'Industrial_Tech':  '제조·공공서비스 등 산업 현장 전문 기술 역량. Protege 계층: HardSkill > Industrial_Tech',
    'Basic_Academic':   'CS·수리·언어 등 학습 기반이 되는 기초학업 역량. Protege 계층: Literacy > Basic_Academic',
    'Civic_Literacy':   '시민의식·사회적 가치·윤리 등 시민 리터러시. Protege 계층: Literacy > Civic_Literacy',
    'Digital_Literacy': '데이터·AI 활용 및 디지털 보안 리터러시 역량. Protege 계층: Literacy > Digital_Literacy',
    'Interpersonal':    '협업·리더십·네트워킹 등 대인관계 역량. Protege 계층: SoftSkill > Interpersonal',
    'Problem_Solving':  '창의성·사고력 등 문제해결 역량. Protege 계층: SoftSkill > Problem_Solving',
    'Self_Management':  '적응력·신뢰성 등 자기관리 역량. Protege 계층: SoftSkill > Self_Management',
  },

  _COMP_L3_LABEL: {
    'Management':           '경영관리 (Management)',
    'Marketing_Sales':      '마케팅·영업 (Marketing_Sales)',
    'Marketing_Strategy':   '마케팅 전략 (Marketing_Strategy)',
    'AI_and_Infrastructure':'AI·인프라 (AI_and_Infrastructure)',
    'Software':             '소프트웨어 (Software)',
    'Manufacturing':        '제조·생산 (Manufacturing)',
    'Service_Public':       '공공서비스 (Service_Public)',
    'CS_Foundation':        'CS 기초 (CS_Foundation)',
    'Language_and_Math':    '언어·수리 (Language_and_Math)',
    'Social_Value':         '사회적 가치 (Social_Value)',
    'Data_Fluency':         '데이터 활용 (Data_Fluency)',
    'Data_and_AI':          '데이터·AI (Data_and_AI)',
    'Tech_Security':        '기술보안 (Tech_Security)',
    'Collaboration':        '협업 (Collaboration)',
    'Leadership':           '리더십 (Leadership)',
    'Thinking_Skill':       '사고력 (Thinking_Skill)',
    'Adaptability':         '적응력 (Adaptability)',
    'Reliability':          '신뢰성 (Reliability)',
  },

  _renderCompetency() {
    const d = HRDData;
    const hardCount = d.competencies.filter(c => c.class === 'HardSkill').length;
    const litCount  = d.competencies.filter(c => c.class === 'Literacy').length;
    const softCount = d.competencies.filter(c => c.class === 'SoftSkill').length;

    this._setKPI('totalCompetencies', d.competencies.length);
    this._setKPI('developmentTarget', hardCount + '개 전문기술');
    this._setKPI('avgProficiency', litCount + '개 기초소양');
    this._setKPI('improvementRate', softCount + '개 소프트스킬');

    const view = document.getElementById('view-competency');

    if (view && !view.querySelector('.comp-class-bar')) {
      const chartContainer = view.querySelector('.chart-container');
      const bar = document.createElement('div');
      bar.className = 'comp-class-bar policy-class-bar';
      bar.innerHTML = `
        <button class="comp-class-btn policy-class-btn active" data-mode="all">전체</button>
        <button class="comp-class-btn policy-class-btn" data-mode="HardSkill">Hard Skill</button>
        <button class="comp-class-btn policy-class-btn" data-mode="Literacy">Literacy</button>
        <button class="comp-class-btn policy-class-btn" data-mode="SoftSkill">Soft Skill</button>
      `;
      chartContainer.parentNode.insertBefore(bar, chartContainer);
      bar.querySelectorAll('.comp-class-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          bar.querySelectorAll('.comp-class-btn').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          this._compClassMode = btn.dataset.mode;
          this._updateCompetencyChart();
        });
      });
    }

    if (view && !view.querySelector('.comp-chart-split')) {
      const chartContainer = view.querySelector('.chart-container');
      const split = document.createElement('div');
      split.className = 'comp-chart-split policy-chart-split';
      const legendDiv = document.createElement('div');
      legendDiv.id = 'compLegend';
      legendDiv.className = 'comp-legend-panel policy-legend-panel';
      chartContainer.parentNode.insertBefore(split, chartContainer);
      split.appendChild(chartContainer);
      chartContainer.classList.add('policy-chart-half');
      split.appendChild(legendDiv);
    }

    if (!this._compClassMode) this._compClassMode = 'all';
    this._updateCompetencyChart();

    const listEl = document.getElementById('competencyList');
    if (listEl) {
      listEl.innerHTML = d.competencies.map(c => {
        const cls = c.class || '미분류';
        const l2 = this._COMP_L2_LABEL[c.level2] || c.level2 || '';
        const l3 = this._COMP_L3_LABEL[c.level3] || c.level3 || '';
        const clsColor = { HardSkill: '#00d4ff', Literacy: '#ffd700', SoftSkill: '#00ff41' }[cls] || '#a0aab8';
        return `<div class="item item-clickable" data-comp-id="${c.id}">
          <div class="item-name">${c.name || c.en}</div>
          <div class="item-detail">
            <span style="color:${clsColor};font-size:10px;font-weight:600">${cls}</span>
            · ${l2} · ${l3}
          </div>
        </div>`;
      }).join('');
      listEl.querySelectorAll('.item-clickable').forEach(el => {
        el.addEventListener('click', () => {
          const comp = d.competencies.find(c => c.id === el.dataset.compId);
          if (comp) this._showCompetencyDetail(comp);
        });
      });
    }
  },

  _updateCompetencyChart() {
    const d = HRDData;
    const mode = this._compClassMode || 'all';
    const l2Label = this._COMP_L2_LABEL;
    const l2Desc  = this._COMP_L2_DESC;
    const palette = {
      HardSkill: ['#00d4ff','#0099cc','#006699'],
      Literacy:  ['#ffd700','#ffaa00','#ff8800'],
      SoftSkill: ['#00ff41','#00cc33','#009922'],
    };
    const allPalette = ['#00d4ff','#ffd700','#00ff41'];

    const L2_ORDER = {
      HardSkill: ['Business_Admin','ICT_Dev','Industrial_Tech'],
      Literacy:  ['Basic_Academic','Civic_Literacy','Digital_Literacy'],
      SoftSkill: ['Interpersonal','Problem_Solving','Self_Management'],
    };

    let entries, colors, groupComps;

    if (mode === 'all') {
      const groups = { HardSkill: [], Literacy: [], SoftSkill: [] };
      const displayLabel = {
        HardSkill: 'Hard Skill (전문기술)',
        Literacy:  'Literacy (기초소양)',
        SoftSkill: 'Soft Skill (소프트스킬)',
      };
      d.competencies.forEach(c => { if (groups[c.class]) groups[c.class].push(c); });
      entries = ['HardSkill','Literacy','SoftSkill'].map(k => [displayLabel[k], groups[k].length]);
      colors = allPalette;
      groupComps = {
        [displayLabel.HardSkill]: groups.HardSkill,
        [displayLabel.Literacy]:  groups.Literacy,
        [displayLabel.SoftSkill]: groups.SoftSkill,
      };
    } else {
      const order = L2_ORDER[mode] || [];
      const subGroups = {};
      order.forEach(l2 => { subGroups[l2] = []; });
      d.competencies
        .filter(c => c.class === mode)
        .forEach(c => {
          const l2 = c.level2 || 'Unknown';
          if (!subGroups[l2]) subGroups[l2] = [];
          subGroups[l2].push(c);
        });
      const pal = palette[mode] || allPalette;
      entries = order
        .filter(l2 => subGroups[l2] && subGroups[l2].length > 0)
        .map((l2, i) => [l2Label[l2] || l2, subGroups[l2].length, pal[i % pal.length], l2]);
      colors = entries.map(e => e[2]);
      groupComps = {};
      entries.forEach(e => { groupComps[e[0]] = subGroups[e[3]]; });
      entries = entries.map(e => [e[0], e[1]]);
    }

    const chartLabels = entries.map(e => e[0]);
    const chartData   = entries.map(e => e[1]);

    this._chart('competencyChart', 'doughnut', {
      labels: chartLabels,
      datasets: [{ data: chartData, backgroundColor: colors.map(c => c + '99'), borderColor: colors, borderWidth: 2 }],
    }, {
      plugins: {
        tooltip: { callbacks: { label: ctx => `${ctx.label}: ${ctx.parsed}개` } },
        legend: { display: false },
      },
    });

    const legendEl = document.getElementById('compLegend');
    if (!legendEl) return;

    if (mode === 'all') {
      const mainDesc = {
        'Hard Skill (전문기술)':  'HardSkill — 비즈니스 행정(Business_Admin), ICT 개발(ICT_Dev), 산업기술(Industrial_Tech) 3개 하위 그룹',
        'Literacy (기초소양)':    'Literacy — 기초학업(Basic_Academic), 시민 리터러시(Civic_Literacy), 디지털 리터러시(Digital_Literacy) 3개 하위 그룹',
        'Soft Skill (소프트스킬)':'SoftSkill — 대인관계(Interpersonal), 문제해결(Problem_Solving), 자기관리(Self_Management) 3개 하위 그룹',
      };
      legendEl.innerHTML = entries.map(([label, count], i) => {
        const col = colors[i];
        const desc = mainDesc[label] || '';
        return `
          <div class="policy-legend-item comp-legend-item" data-group="${label}" style="flex-direction:column;align-items:flex-start;gap:2px;padding:6px 0;border-bottom:1px solid rgba(255,255,255,0.05);cursor:pointer">
            <div style="display:flex;align-items:center;gap:6px;width:100%">
              <span class="policy-legend-dot" style="background:${col};box-shadow:0 0 6px ${col}88;flex-shrink:0"></span>
              <span class="policy-legend-label" style="flex:1;font-size:12px">${label}</span>
              <span class="policy-legend-count">${count}</span>
            </div>
            <div style="font-size:10px;color:#6a7f90;margin-left:16px;line-height:1.4">${desc}</div>
          </div>`;
      }).join('');
    } else {
      const order = L2_ORDER[mode] || [];
      const pal = palette[mode] || allPalette;
      legendEl.innerHTML = order
        .filter(l2 => groupComps[l2Label[l2] || l2] && groupComps[l2Label[l2] || l2].length > 0)
        .map((l2, i) => {
          const label = l2Label[l2] || l2;
          const count = (groupComps[label] || []).length;
          const col = pal[i % pal.length];
          const desc = l2Desc[l2] || '';
          return `
            <div class="policy-legend-item comp-legend-item" data-group="${label}" style="flex-direction:column;align-items:flex-start;gap:2px;padding:6px 0;border-bottom:1px solid rgba(255,255,255,0.05);cursor:pointer">
              <div style="display:flex;align-items:center;gap:6px;width:100%">
                <span class="policy-legend-dot" style="background:${col};box-shadow:0 0 6px ${col}88;flex-shrink:0"></span>
                <span class="policy-legend-label" style="flex:1;font-size:12px">${label}</span>
                <span class="policy-legend-count">${count}</span>
              </div>
              ${desc ? `<div style="font-size:10px;color:#6a7f90;margin-left:16px;line-height:1.4">${desc}</div>` : ''}
            </div>`;
        }).join('');
    }

    legendEl.querySelectorAll('.comp-legend-item').forEach(item => {
      item.addEventListener('click', () => {
        const group = item.dataset.group;
        this._showCompGroupPopup(group, groupComps[group] || []);
      });
    });
  },

  _showCompGroupPopup(groupName, comps) {
    const l3Label = this._COMP_L3_LABEL;
    const byL3 = {};
    comps.forEach(c => {
      const l3key = l3Label[c.level3] || c.level3 || '기타';
      if (!byL3[l3key]) byL3[l3key] = [];
      byL3[l3key].push(c);
    });

    const clsColor = { HardSkill: '#00d4ff', Literacy: '#ffd700', SoftSkill: '#00ff41' };
    const listHtml = Object.entries(byL3).map(([l3, items]) => `
      <div style="margin-bottom:8px">
        <div style="font-size:11px;color:#a0aab8;font-weight:600;margin-bottom:4px;padding-left:4px">${l3}</div>
        ${items.map(c => {
          const col = clsColor[c.class] || '#a0aab8';
          return `<div class="detail-list-item comp-group-row" data-comp-id="${c.id}" style="cursor:pointer">
            <span class="detail-dot"></span>
            <span style="flex:1">${c.name || c.en}</span>
            <span style="color:${col};font-size:10px">${c.en || ''}</span>
          </div>`;
        }).join('')}
      </div>`).join('');

    const html = `
      <div class="detail-header-block">
        <div class="detail-strategy-label">COMPETENCY GROUP</div>
        <h2 class="detail-title">${groupName}</h2>
        <div class="detail-en">총 ${comps.length}개 역량 · 클릭하면 상세 정보 확인</div>
      </div>
      <div class="detail-section">
        <div class="detail-section-title">역량 목록 (Level 3 하위분류별)</div>
        <div class="detail-list">${listHtml}</div>
      </div>
    `;
    this._openDetail(html);

    document.querySelectorAll('.comp-group-row').forEach(row => {
      row.addEventListener('click', () => {
        const comp = HRDData.competencies.find(c => c.id === row.dataset.compId);
        if (comp) this._showCompetencyDetail(comp);
      });
    });
  },

  _showCompetencyDetail(comp) {
    const l2Label = this._COMP_L2_LABEL;
    const l3Label = this._COMP_L3_LABEL;
    const l2Desc  = this._COMP_L2_DESC;
    const cls = comp.class || '미분류';
    const clsKo = { HardSkill: 'Hard Skill', Literacy: 'Literacy', SoftSkill: 'Soft Skill' }[cls] || cls;
    const clsColor = { HardSkill: '#00d4ff', Literacy: '#ffd700', SoftSkill: '#00ff41' }[cls] || '#a0aab8';
    const l2 = l2Label[comp.level2] || comp.level2 || '';
    const l3 = l3Label[comp.level3] || comp.level3 || '';
    const descStr = l2Desc[comp.level2] || '';

    const relPrograms = HRDData.programs.filter(p =>
      (Array.isArray(p.relatedCompetencyIds) && p.relatedCompetencyIds.includes(comp.id)) ||
      p.targetCompetencyId === comp.id ||
      p.competencyCategory === comp.category ||
      (comp.catCode && p.fieldCatCode === comp.catCode)
    );

    const progHtml = relPrograms.length
      ? relPrograms.slice(0, 8).map(p => `
          <div class="detail-list-item detail-clickable" data-program-id="${p.id}">
            <span class="detail-dot"></span>
            <span style="flex:1;font-size:11px">${p.name}</span>
            <span style="color:#a0aab8;font-size:10px">${p.org || ''}</span>
          </div>`).join('') + (relPrograms.length > 8 ? `<div style="color:#607080;font-size:11px;padding:4px 0">외 ${relPrograms.length - 8}개 프로그램</div>` : '')
      : '<span class="detail-empty">연관 프로그램 없음</span>';

    const html = `
      <div class="detail-header-block">
        <div class="detail-strategy-label" style="color:${clsColor}">${clsKo}</div>
        <h2 class="detail-title">${comp.name || comp.en}</h2>
        <div class="detail-en">${comp.en || ''}</div>
      </div>

      <div class="detail-section">
        <div class="detail-section-title">역량 소개</div>
        <p class="detail-description">${comp.description || descStr || `${comp.name || comp.en}은(는) ${clsKo} 영역의 핵심 역량으로, ${l2 || '해당 역량군'} 분야 인재 육성을 위한 교육 프로그램(${relPrograms.length}개)과 연계됩니다.`}</p>
        <p class="detail-source"><span class="detail-source-label">📋 근거 문서</span> ${comp.basis || 'NCS(국가직무능력표준), 인재개발법, 국가역량체계(NQF) 등 관련 기준'}</p>
      </div>

      <div class="detail-section">
        <div class="detail-section-title">Protege 온톨로지 분류 경로</div>
        <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-top:6px">
          <span class="detail-tag" style="border-color:${clsColor};color:${clsColor}">${clsKo}</span>
          <span style="color:#506070">▶</span>
          <span class="detail-tag comp">${l2}</span>
          <span style="color:#506070">▶</span>
          <span class="detail-tag comp">${l3}</span>
        </div>
      </div>

      ${descStr ? `
      <div class="detail-section">
        <div class="detail-section-title">역량군 설명</div>
        <div class="detail-en" style="font-size:12px;line-height:1.6">${descStr}</div>
      </div>` : ''}

      <div class="detail-section">
        <div class="detail-section-title">연관 교육 프로그램 (${relPrograms.length}개) <span class="detail-hint">클릭하면 상세 정보</span></div>
        <div class="detail-list">${progHtml}</div>
      </div>
    `;
    this._openDetail(html);
    const rebind = () => this._bindCompetencyDetailClicks(comp, relPrograms);
    this._currentRebind = rebind;
    rebind();
  },

  _bindCompetencyDetailClicks(comp, relPrograms) {
    const body = document.getElementById('detailBody');
    if (!body) return;
    const d = HRDData;
    body.querySelectorAll('[data-program-id]').forEach(el => {
      el.addEventListener('click', () => {
        const program = d.programs.find(p => p.id === el.dataset.programId);
        if (program) this._pushProgramDetail(program);
      });
    });
  },
});
