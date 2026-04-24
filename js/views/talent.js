Object.assign(App, {
  _renderTalent() {
    const d = HRDData;

    const personOrgs = [...new Set(d.persons.map(p => p.orgId).filter(Boolean))];
    const personRoles = [...new Set(d.persons.map(p => p.role).filter(Boolean))];

    this._setKPI('talentCount', d.persons.length.toLocaleString() + '명');
    this._setKPI('employmentRate', personOrgs.length + '개 기관');
    this._setKPI('competencyAchievement', personRoles.length + '개 역할유형');
    this._setKPI('avgRating', d.programs.length + '개 과정');

    const view = document.getElementById('view-talent');

    if (view && !view.querySelector('.talent-class-bar')) {
      const chartContainer = view.querySelector('.chart-container');
      const bar = document.createElement('div');
      bar.className = 'talent-class-bar policy-class-bar';
      bar.innerHTML = `
        <button class="talent-class-btn policy-class-btn active" data-mode="competency">역량별</button>
        <button class="talent-class-btn policy-class-btn" data-mode="org">기관별</button>
        <button class="talent-class-btn policy-class-btn" data-mode="strategy">전략별</button>
        <button class="talent-class-btn policy-class-btn" data-mode="target">대상별</button>
      `;
      chartContainer.parentNode.insertBefore(bar, chartContainer);
      bar.querySelectorAll('.talent-class-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          bar.querySelectorAll('.talent-class-btn').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          this._talentClassMode = btn.dataset.mode;
          this._updateTalentChart();
        });
      });
    }

    if (view && !view.querySelector('.talent-chart-split')) {
      const chartContainer = view.querySelector('.chart-container');
      const split = document.createElement('div');
      split.className = 'talent-chart-split policy-chart-split';
      const descDiv = document.createElement('div');
      descDiv.id = 'talentDesc';
      descDiv.className = 'talent-desc-panel policy-legend-panel';
      chartContainer.parentNode.insertBefore(split, chartContainer);
      split.appendChild(chartContainer);
      chartContainer.classList.add('policy-chart-half');
      split.appendChild(descDiv);
    }

    if (!this._talentClassMode) this._talentClassMode = 'competency';
    this._updateTalentChart();
    this._renderTalentStats();
  },

  _updateTalentChart() {
    const d = HRDData;
    const mode = this._talentClassMode || 'competency';

    const groupCount = {};
    d.programs.forEach(p => {
      let key;
      switch (mode) {
        case 'competency': key = p.competencyCategory || '미분류'; break;
        case 'org':        key = p.org || '미분류'; break;
        case 'strategy':   key = p.alignedStrategy
          ? (d.strategies.find(s => s.id === p.alignedStrategy) || {}).name || p.alignedStrategy
          : '미분류'; break;
        case 'target':     key = p.targetGroup || '미분류'; break;
        default:           key = '기타';
      }
      groupCount[key] = (groupCount[key] || 0) + 1;
    });

    const entries = Object.entries(groupCount).sort((a, b) => b[1] - a[1]).slice(0, 8);
    const labels = entries.map(e => e[0]);
    const counts = entries.map(e => e[1]);
    const maxCount = Math.max(...counts, 1);

    const currentData = counts.map(c => Math.round(30 + (c / maxCount) * 60));
    const targetData  = currentData.map(v => Math.min(100, Math.round(v * 1.15)));

    const modeDescriptions = {
      competency: {
        'AI·인프라 역량':     'AI·클라우드·데이터 인프라 설계 및 운영 역량',
        '기술보안 역량':      '사이버보안·정보보호 전문 기술 역량',
        '녹색기술·탄소중립 역량': '탄소중립·친환경 기술 및 에너지 전환 역량',
        '데이터 활용 역량':   '데이터 분석·시각화·의사결정 지원 역량',
        '디자인 역량':        'UX/UI 및 서비스 디자인 창의적 역량',
        '마케팅 전략 역량':   '디지털 마케팅·브랜딩·시장 전략 역량',
        '바이오헬스 역량':    '바이오·헬스케어 기술 및 임상 역량',
        '반도체 설계 역량':   '반도체 회로 설계 및 첨단소재 개발 역량',
        '소프트웨어 개발 역량': '프로그래밍·SW 아키텍처 설계 역량',
        '행정법무 역량':      '공공행정·법무·정책 기획 역량',
      },
      org: {
        '고용노동부':         '직업훈련·고용서비스·노동시장 정책 총괄',
        '과학기술정보통신부': 'AI·ICT·디지털 전환 R&D 및 인재 양성',
        '교육부':             '학교·대학 교육과정 및 평생학습 정책',
        '국방부':             '국방 전문인력 양성 및 방산기술 역량 개발',
        '문화체육관광부':     '문화콘텐츠·관광·스포츠 분야 인재 육성',
        '산업통상자원부':     '산업기술·에너지·통상 분야 전문인력 지원',
        '인사혁신처':         '공무원 역량개발 및 공직 인재 경쟁력 강화',
      },
      strategy: {},
      target: {
        '경력단절여성': '경력 단절 후 재취업을 준비하는 여성 대상',
        '다문화가정':   '다문화 배경 구성원의 역량 강화 지원',
        '은퇴자':       '퇴직 후 사회 재참여 및 재취업 준비 인력',
        '일반인':       '특별한 제한 없이 참여 가능한 일반 시민',
        '재직자':       '현재 직장에 재직 중인 종사자 대상 향상 교육',
        '전문가':       '해당 분야 전문 지식 보유자 심화 역량 개발',
        '청소년':       '미래 인재 육성을 위한 청소년 대상 교육',
        '취약계층':     '경제적·사회적 취약 계층의 자립 역량 지원',
      },
    };

    this._chart('talentChart', 'radar', {
      labels,
      datasets: [{
        label: '현재 프로그램 수준',
        data: currentData,
        backgroundColor: 'rgba(0,212,255,0.2)',
        borderColor: '#00d4ff',
        borderWidth: 2,
        pointBackgroundColor: '#00d4ff',
      }, {
        label: '목표 수준',
        data: targetData,
        backgroundColor: 'rgba(0,255,65,0.08)',
        borderColor: '#00ff41',
        borderWidth: 2,
        borderDash: [5, 5],
        pointBackgroundColor: '#00ff41',
      }],
    }, {
      plugins: {
        legend: {
          display: true,
          labels: { color: '#c0ccd8', font: { size: 11 } },
        },
        tooltip: {
          callbacks: {
            label: ctx => {
              const entry = entries[ctx.dataIndex];
              if (!entry) return ctx.dataset.label + ': ' + ctx.parsed.r;
              return ctx.datasetIndex === 0
                ? `현재: ${entry[1]}개 프로그램 (지수 ${ctx.parsed.r})`
                : `목표: 지수 ${ctx.parsed.r}`;
            },
          },
        },
      },
      scales: {
        r: {
          min: 0, max: 100,
          ticks: { display: false },
          grid: { color: 'rgba(0,212,255,0.15)' },
          angleLines: { color: 'rgba(0,212,255,0.2)' },
          pointLabels: { color: '#c0ccd8', font: { size: 10 } },
        },
      },
    });

    const descEl = document.getElementById('talentDesc');
    if (!descEl) return;
    const descMap = mode === 'strategy'
      ? Object.fromEntries(d.strategies.map(s => [s.name, s.description || s.en || '국가 핵심 전략 분야']))
      : (modeDescriptions[mode] || {});

    const gapLabel = { competency: '역량분야', org: '기관', strategy: '전략', target: '대상그룹' };
    descEl.innerHTML = `
      <div style="font-size:11px;color:#00d4ff;font-weight:600;letter-spacing:.06em;margin-bottom:10px;padding-bottom:6px;border-bottom:1px solid rgba(0,212,255,0.2)">
        ${gapLabel[mode] || ''} 현황 · 목표 갭 <span style="font-size:10px;color:#607080;font-weight:400">(클릭하면 상세)</span>
      </div>
      ${entries.map(([label, count], i) => {
        const current = currentData[i];
        const target  = targetData[i];
        const gap     = target - current;
        const desc    = descMap[label] || '';
        const pct     = Math.round((current / 100) * 100);
        return `
          <div class="talent-desc-item detail-clickable" data-label="${label.replace(/"/g,'&quot;')}" data-mode="${mode}" style="margin-bottom:12px;padding-bottom:10px;border-bottom:1px solid rgba(255,255,255,0.05);cursor:pointer">
            <div style="display:flex;align-items:center;gap:6px;margin-bottom:3px">
              <span style="width:8px;height:8px;border-radius:50%;background:#00d4ff;display:inline-block;flex-shrink:0"></span>
              <span style="font-size:12px;font-weight:600;color:#e0e8f0">${label}</span>
              <span style="margin-left:auto;font-size:11px;color:#00d4ff">${count}개</span>
            </div>
            ${desc ? `<div style="font-size:10px;color:#8090a0;margin:2px 0 4px 14px;line-height:1.4">${desc}</div>` : ''}
            <div style="margin-left:14px">
              <div style="display:flex;justify-content:space-between;font-size:10px;color:#607080;margin-bottom:2px">
                <span>현재 ${current}</span><span>목표 ${target} <span style="color:#00ff41">+${gap}</span></span>
              </div>
              <div style="height:4px;background:rgba(255,255,255,0.08);border-radius:2px;overflow:hidden">
                <div style="height:100%;width:${pct}%;background:linear-gradient(90deg,#00d4ff,#0099cc);border-radius:2px"></div>
              </div>
            </div>
          </div>`;
      }).join('')}
    `;

    descEl.querySelectorAll('.talent-desc-item[data-label]').forEach(el => {
      el.addEventListener('click', () => {
        const label = el.dataset.label;
        const elMode = el.dataset.mode;
        const progs = d.programs.filter(p => {
          switch (elMode) {
            case 'competency': return (p.competencyCategory || '미분류') === label;
            case 'org':        return (p.org || '미분류') === label;
            case 'strategy':   return ((d.strategies.find(s => s.id === p.alignedStrategy) || {}).name || (p.alignedStrategy ? p.alignedStrategy : '미분류')) === label;
            case 'target':     return (p.targetGroup || '미분류') === label;
            default: return false;
          }
        });
        switch (elMode) {
          case 'competency': {
            const comp = d.competencies.find(c => c.category === label || c.name === label);
            if (comp) this._showCompetencyDetail(comp);
            break;
          }
          case 'org': this._showTalentOrgDetail(label, progs); break;
          case 'strategy': {
            const strat = d.strategies.find(s => s.name === label);
            if (strat) this._showStrategyDetail(strat);
            break;
          }
          case 'target': this._showTargetDetail(label, progs); break;
        }
      });
    });

    this._renderTalentStats();
  },

  _renderTalentStats() {
    const d = HRDData;
    const statsEl = document.getElementById('talentStats');
    if (!statsEl) return;

    const mode = this._talentClassMode || 'competency';
    const groupMap = {};
    d.programs.forEach(p => {
      let key;
      switch (mode) {
        case 'competency': key = p.competencyCategory || '미분류'; break;
        case 'org':        key = p.org || '미분류'; break;
        case 'strategy':   key = p.alignedStrategy
          ? (d.strategies.find(s => s.id === p.alignedStrategy) || {}).name || p.alignedStrategy
          : '미분류'; break;
        case 'target':     key = p.targetGroup || '미분류'; break;
        default:           key = '기타';
      }
      if (!groupMap[key]) groupMap[key] = [];
      groupMap[key].push(p);
    });

    const entries = Object.entries(groupMap).sort((a, b) => b[1].length - a[1].length);

    statsEl.innerHTML = entries.map(([label, progs]) => {
      let displayLabel = label;
      let subLabel = `${progs.length}개 프로그램`;
      if (mode === 'org') {
        const org = d.organizations.find(o => o.name === label);
        displayLabel = (org && org.abbr) ? org.abbr : label.slice(0, 5);
        const cats = [...new Set(progs.map(p => p.competencyCategory).filter(Boolean))].length;
        subLabel = `${cats}개 역량분야`;
      } else if (mode === 'strategy') {
        displayLabel = label.length > 7 ? label.slice(0, 7) + '…' : label;
      } else if (mode === 'target') {
        displayLabel = label.length > 5 ? label.slice(0, 5) + '…' : label;
      } else {
        displayLabel = label.length > 6 ? label.slice(0, 6) + '…' : label;
      }
      return `<div class="stat-card talent-stat-card" data-label="${label.replace(/"/g,'&quot;')}" data-mode="${mode}" style="cursor:pointer">
        <div class="stat-card-label">${displayLabel}</div>
        <div class="stat-card-value">${progs.length}</div>
        <div class="stat-card-label" style="margin-top:4px;font-size:10px">${subLabel}</div>
      </div>`;
    }).join('');

    statsEl.querySelectorAll('.talent-stat-card').forEach(card => {
      card.addEventListener('click', () => {
        const label = card.dataset.label;
        const progs = groupMap[label] || [];
        switch (mode) {
          case 'org': this._showTalentOrgDetail(label, progs); break;
          case 'competency': {
            const comp = d.competencies.find(c => c.category === label || c.name === label);
            if (comp) this._showCompetencyDetail(comp);
            else this._showTalentOrgDetail(label, progs);
            break;
          }
          case 'strategy': {
            const strat = d.strategies.find(s => s.name === label);
            if (strat) this._showStrategyDetail(strat);
            break;
          }
          case 'target': this._showTargetDetail(label, progs); break;
        }
      });
    });
  },

  _showTalentPersonDetail(orgId, persons) {
    const d = HRDData;
    const orgInfo = d.organizations.find(o => o.id === orgId) || {};
    const roles = [...new Set(persons.map(p => p.role).filter(Boolean))];
    const targets = [...new Set(persons.map(p => p.targetGroupId).filter(Boolean))];
    const levels = [...new Set(persons.map(p => p.competencyLevel).filter(Boolean))];

    const roleHtml = roles.length
      ? roles.map(r => `<span class="detail-tag comp">${r}</span>`).join('')
      : '<span class="detail-empty">없음</span>';
    const targetHtml = targets.length
      ? targets.map(t => `<span class="detail-tag">${t}</span>`).join('')
      : '<span class="detail-empty">없음</span>';
    const levelHtml = levels.length
      ? levels.map(l => `<span class="detail-tag">${l}</span>`).join('')
      : '<span class="detail-empty">없음</span>';

    const samplePersons = persons.slice(0, 20);
    const personListHtml = samplePersons.map(p => `
      <div class="detail-list-item">
        <span class="detail-dot"></span>
        <span style="flex:1">${p.name || p.id}</span>
        <span style="color:#a0aab8;font-size:11px">${p.role || ''} · ${p.competencyLevel || ''}</span>
      </div>
    `).join('') + (persons.length > 20 ? `<div class="detail-list-item" style="color:#607080;font-size:11px">… 외 ${persons.length - 20}명</div>` : '');

    const html = `
      <div class="detail-header-block">
        <div class="detail-strategy-label">ORGANIZATION · PEOPLE</div>
        <h2 class="detail-title">${orgInfo.name || orgId}</h2>
        <div class="detail-en">${orgInfo.en || ''}</div>
        ${orgInfo.id ? `<div class="detail-tags" style="margin-top:8px"><span class="detail-tag org detail-clickable" data-org-id="${orgInfo.id}">기관 상세보기 →</span></div>` : ''}
      </div>

      <div class="detail-grid-2">
        <div class="detail-section">
          <div class="detail-section-title">소속 인원</div>
          <div class="detail-budget-value">${persons.length.toLocaleString()}명</div>
        </div>
        <div class="detail-section">
          <div class="detail-section-title">역할 유형 수</div>
          <div class="detail-budget-value">${roles.length}개</div>
        </div>
      </div>

      <div class="detail-section">
        <div class="detail-section-title">역할 유형</div>
        <div class="detail-tags">${roleHtml}</div>
      </div>
      <div class="detail-section">
        <div class="detail-section-title">대상 그룹</div>
        <div class="detail-tags">${targetHtml}</div>
      </div>
      <div class="detail-section">
        <div class="detail-section-title">역량 수준</div>
        <div class="detail-tags">${levelHtml}</div>
      </div>
      <div class="detail-section">
        <div class="detail-section-title">인원 샘플 (최대 20명)</div>
        <div class="detail-list">${personListHtml}</div>
      </div>
    `;
    this._openDetail(html);
    const rebind = () => {
      const body = document.getElementById('detailBody');
      if (!body) return;
      body.querySelectorAll('[data-org-id]').forEach(el => {
        el.addEventListener('click', () => {
          const org = HRDData.organizations.find(o => o.id === el.dataset.orgId);
          if (org) this._pushOrgDetail(org);
        });
      });
    };
    this._currentRebind = rebind;
    rebind();
  },

  _showTargetDetail(targetLabel, programs) {
    const d = HRDData;
    const orgs = [...new Set(programs.map(p => p.org).filter(Boolean))];
    const strategies = [...new Map(programs.map(p => {
      if (!p.alignedStrategy) return null;
      const s = d.strategies.find(st => st.id === p.alignedStrategy);
      return s ? [s.id, s] : null;
    }).filter(Boolean)).values()];
    const totalHours = programs.reduce((s, p) => s + (parseInt(p.hours) || 0), 0);

    const orgHtml = orgs.length
      ? orgs.map(o => {
          const org = d.organizations.find(x => x.name === o);
          return org
            ? `<span class="detail-tag org detail-clickable" data-org-id="${org.id}">${o}</span>`
            : `<span class="detail-tag org">${o}</span>`;
        }).join('')
      : '<span class="detail-empty">없음</span>';

    const stratHtml = strategies.length
      ? strategies.map(s => `<span class="detail-tag org detail-clickable" data-strategy-id="${s.id}">${s.name}</span>`).join('')
      : '<span class="detail-empty">없음</span>';

    const progListHtml = programs.map(p => `
      <div class="detail-list-item detail-clickable" data-program-id="${p.id}">
        <span class="detail-dot"></span>
        <span style="flex:1">${p.name}</span>
        <span style="color:#a0aab8;font-size:11px">${p.org || ''} · ${p.hours || '?'}h</span>
      </div>
    `).join('');

    const html = `
      <div class="detail-header-block">
        <div class="detail-strategy-label">TARGET GROUP</div>
        <h2 class="detail-title">${targetLabel}</h2>
      </div>

      <div class="detail-section">
        <div class="detail-section-title">인재/대상 소개</div>
        <p class="detail-description">${`'${targetLabel}' 대상 그룹은 총 ${programs.length}개 교육 프로그램(${totalHours.toLocaleString()}시간)에 참여하며, 다양한 역량 개발 기회를 통해 국가 인적자원 육성에 기여합니다.`}</p>
        <p class="detail-source"><span class="detail-source-label">📋 근거 문서</span> 인재개발법, 국가공무원법, 공무원 교육훈련법 등 관련 법령</p>
      </div>

      <div class="detail-grid-2">
        <div class="detail-section">
          <div class="detail-section-title">프로그램 수</div>
          <div class="detail-budget-value">${programs.length}개</div>
        </div>
        <div class="detail-section">
          <div class="detail-section-title">총 교육 시간</div>
          <div class="detail-budget-value">${totalHours.toLocaleString()}h</div>
        </div>
      </div>

      <div class="detail-section">
        <div class="detail-section-title">운영 기관 <span class="detail-hint">클릭하면 상세 정보</span></div>
        <div class="detail-tags">${orgHtml}</div>
      </div>
      <div class="detail-section">
        <div class="detail-section-title">연관 전략 <span class="detail-hint">클릭하면 상세 정보</span></div>
        <div class="detail-tags">${stratHtml}</div>
      </div>
      <div class="detail-section">
        <div class="detail-section-title">프로그램 목록 <span class="detail-hint">클릭하면 상세 정보</span></div>
        <div class="detail-list">${progListHtml}</div>
      </div>
    `;
    this._openDetail(html);
    const rebind = () => {
      const body = document.getElementById('detailBody');
      if (!body) return;
      body.querySelectorAll('[data-org-id]').forEach(el => {
        el.addEventListener('click', () => {
          const org = d.organizations.find(o => o.id === el.dataset.orgId);
          if (org) this._pushOrgDetail(org);
        });
      });
      body.querySelectorAll('[data-strategy-id]').forEach(el => {
        el.addEventListener('click', () => {
          const strat = d.strategies.find(s => s.id === el.dataset.strategyId);
          if (strat) this._pushStrategyDetail(strat);
        });
      });
      body.querySelectorAll('[data-program-id]').forEach(el => {
        el.addEventListener('click', () => {
          const prog = d.programs.find(p => p.id === el.dataset.programId);
          if (prog) this._pushProgramDetail(prog);
        });
      });
    };
    this._currentRebind = rebind;
    rebind();
  },

  _showTalentOrgDetail(orgName, programs) {
    const d = HRDData;
    const orgInfo = d.organizations.find(o => o.name === orgName) || {};
    const strategyObjs = [...new Map(programs.map(p => {
      if (!p.alignedStrategy) return null;
      const s = d.strategies.find(st => st.id === p.alignedStrategy);
      return s ? [s.id, s] : null;
    }).filter(Boolean)).values()];
    const compCats = [...new Set(programs.map(p => p.competencyCategory).filter(Boolean))];
    const targetGroups = [...new Set(programs.map(p => p.targetGroup).filter(Boolean))];
    const totalHours = programs.reduce((s, p) => s + (parseInt(p.hours) || 0), 0);

    const stratHtml = strategyObjs.length
      ? strategyObjs.map(s => `<span class="detail-tag org detail-clickable" data-strategy-id="${s.id}">${s.name}</span>`).join('')
      : '<span class="detail-empty">없음</span>';
    const compHtml = compCats.length
      ? compCats.map(c => `<span class="detail-tag comp">${c}</span>`).join('')
      : '<span class="detail-empty">없음</span>';
    const targetHtml = targetGroups.length
      ? targetGroups.map(t => `<span class="detail-tag">${t}</span>`).join('')
      : '<span class="detail-empty">없음</span>';

    const progListHtml = programs.map(p => `
      <div class="detail-list-item detail-clickable" data-program-id="${p.id}">
        <span class="detail-dot"></span>
        <span style="flex:1">${p.name}</span>
        <span style="color:#a0aab8;font-size:11px">${p.competencyCategory || ''} · ${p.hours || '?'}h</span>
      </div>
    `).join('');

    const html = `
      <div class="detail-header-block">
        <div class="detail-strategy-label">MANAGING ORGANIZATION</div>
        <h2 class="detail-title">${orgName}</h2>
        <div class="detail-en">${orgInfo.en || ''}</div>
        ${orgInfo.id ? `<div class="detail-tags" style="margin-top:8px"><span class="detail-tag org detail-clickable" data-org-id="${orgInfo.id}">기관 상세보기 →</span></div>` : ''}
      </div>

      <div class="detail-section">
        <div class="detail-section-title">기관 소개</div>
        <p class="detail-description">${`${orgName}은(는) 총 ${programs.length}개 교육 프로그램(${totalHours.toLocaleString()}시간)을 운영하며, 인적자원 개발 교육 프로그램을 통해 역량 강화를 지원하는 기관입니다.`}</p>
        <p class="detail-source"><span class="detail-source-label">📋 근거 문서</span> 정부조직법, 인재개발법, 공무원 교육훈련법 등 관련 법령</p>
      </div>

      <div class="detail-grid-2">
        <div class="detail-section">
          <div class="detail-section-title">운영 프로그램 수</div>
          <div class="detail-budget-value">${programs.length}개</div>
        </div>
        <div class="detail-section">
          <div class="detail-section-title">총 교육 시간</div>
          <div class="detail-budget-value">${totalHours.toLocaleString()}h</div>
        </div>
      </div>

      <div class="detail-section">
        <div class="detail-section-title">연관 전략 <span class="detail-hint">클릭하면 상세 정보</span></div>
        <div class="detail-tags">${stratHtml}</div>
      </div>
      <div class="detail-section">
        <div class="detail-section-title">역량 분야</div>
        <div class="detail-tags">${compHtml}</div>
      </div>
      <div class="detail-section">
        <div class="detail-section-title">교육 대상</div>
        <div class="detail-tags">${targetHtml}</div>
      </div>
      <div class="detail-section">
        <div class="detail-section-title">프로그램 목록 <span class="detail-hint">클릭하면 상세 정보</span></div>
        <div class="detail-list">${progListHtml}</div>
      </div>
    `;
    this._openDetail(html);
    const rebind = () => this._bindTalentOrgDetailClicks(orgName, strategyObjs, programs);
    this._currentRebind = rebind;
    rebind();
  },

  _bindTalentOrgDetailClicks(orgName, strategyObjs, programs) {
    const body = document.getElementById('detailBody');
    if (!body) return;
    const d = HRDData;
    body.querySelectorAll('[data-org-id]').forEach(el => {
      el.addEventListener('click', () => {
        const org = d.organizations.find(o => o.id === el.dataset.orgId);
        if (org) this._pushOrgDetail(org);
      });
    });
    body.querySelectorAll('[data-strategy-id]').forEach(el => {
      el.addEventListener('click', () => {
        const strat = d.strategies.find(s => s.id === el.dataset.strategyId);
        if (strat) this._pushStrategyDetail(strat);
      });
    });
    body.querySelectorAll('[data-program-id]').forEach(el => {
      el.addEventListener('click', () => {
        const program = d.programs.find(p => p.id === el.dataset.programId);
        if (program) this._pushProgramDetail(program);
      });
    });
  },
});
