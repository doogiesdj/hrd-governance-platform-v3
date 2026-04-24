Object.assign(App, {
  _showStrategyDetail(strategy) {
    const budgetStr = strategy.totalBudgetStr || (strategy.totalBudget ? HRDData.formatWon(strategy.totalBudget) : '미배정');

    const policiesHtml = strategy.policies && strategy.policies.length
      ? strategy.policies.map(p => `<span class="detail-tag detail-clickable" data-policy-id="${p.id}">${p.name}</span>`).join('')
      : '<span class="detail-empty">연관 정책 데이터 없음</span>';

    const orgsHtml = strategy.implementingOrgs && strategy.implementingOrgs.length
      ? strategy.implementingOrgs.map(o => {
          const label = o.abbr ? `${o.abbr} (${o.name})` : o.name;
          return `<span class="detail-tag org detail-clickable" data-org-id="${o.id}">${label}</span>`;
        }).join('')
      : '<span class="detail-empty">집행 기관 데이터 없음</span>';

    const tgHtml = strategy.targetGroups && strategy.targetGroups.length
      ? strategy.targetGroups.map(t => `<span class="detail-tag tg detail-clickable" data-tg="${t}">${t}</span>`).join('')
      : '<span class="detail-empty">수혜대상 데이터 없음</span>';

    const progHtml = strategy.programs && strategy.programs.length
      ? strategy.programs.slice(0, 12).map(p => `<div class="detail-list-item detail-clickable" data-program-id="${p.id}"><span class="detail-dot"></span>${p.name}</div>`).join('')
        + (strategy.programs.length > 12 ? `<div class="detail-more">외 ${strategy.programs.length - 12}개 프로그램</div>` : '')
      : '<span class="detail-empty">프로그램 데이터 없음</span>';

    const compHtml = strategy.competencies && strategy.competencies.length
      ? strategy.competencies.slice(0, 10).map(c => `<span class="detail-tag comp detail-clickable" data-comp-id="${c.id}">${c.name}</span>`).join('')
      : '<span class="detail-empty">역량 데이터 없음</span>';

    const perfHtml = strategy.performanceGoals && strategy.performanceGoals.length
      ? strategy.performanceGoals.map(g => `<div class="detail-list-item detail-clickable" data-goal-name="${g.name}"><span class="detail-dot perf"></span>${g.name}</div>`).join('')
      : '<span class="detail-empty">성과 목표 데이터 없음</span>';

    const html = `
      <div class="detail-header-block">
        <div class="detail-strategy-label">NATIONAL STRATEGY</div>
        <h2 class="detail-title">${strategy.name}</h2>
        <div class="detail-en">${strategy.en || ''}</div>
      </div>

      <div class="detail-section">
        <div class="detail-section-title">전략 소개</div>
        <p class="detail-description">${strategy.description || `${strategy.name}은 국가 인적자원 개발의 핵심 전략으로, 관련 정책 및 교육 프로그램을 통해 추진됩니다.`}</p>
        ${strategy.implementingOrgBasis ? `<p class="detail-source"><span class="detail-source-label">📋 근거 문서</span> ${strategy.implementingOrgBasis}</p>` : ''}
      </div>

      <div class="detail-grid-2">
        <div class="detail-section">
          <div class="detail-section-title">예산 규모</div>
          <div class="detail-budget-value">${budgetStr}</div>
        </div>
        <div class="detail-section">
          <div class="detail-section-title">연관 정책 수</div>
          <div class="detail-budget-value">${strategy.policyCount || (strategy.policies ? strategy.policies.length : 0)}개</div>
        </div>
      </div>

      <div class="detail-section">
        <div class="detail-section-title">연관 정책 <span class="detail-hint">클릭하면 상세 정보</span></div>
        <div class="detail-tags">${policiesHtml}</div>
      </div>

      <div class="detail-section">
        <div class="detail-section-title">집행 기관 <span class="detail-hint">클릭하면 상세 정보</span></div>
        <div class="detail-tags">${orgsHtml}</div>
      </div>

      <div class="detail-section">
        <div class="detail-section-title">수혜 대상</div>
        <div class="detail-tags">${tgHtml}</div>
      </div>

      <div class="detail-section">
        <div class="detail-section-title">교육 프로그램 (${strategy.programCount || 0}개) <span class="detail-hint">클릭하면 상세 정보</span></div>
        <div class="detail-list">${progHtml}</div>
      </div>

      <div class="detail-section">
        <div class="detail-section-title">연관 역량 <span class="detail-hint">클릭하면 상세 정보</span></div>
        <div class="detail-tags">${compHtml}</div>
      </div>

      <div class="detail-section">
        <div class="detail-section-title">성과 목표</div>
        <div class="detail-list">${perfHtml}</div>
      </div>
    `;
    this._openDetail(html);
    const rebind = () => this._bindStrategyDetailClicks(strategy);
    this._currentRebind = rebind;
    rebind();
  },

  _bindStrategyDetailClicks(strategy) {
    const body = document.getElementById('detailBody');
    if (!body) return;
    const d = HRDData;

    body.querySelectorAll('[data-policy-id]').forEach(el => {
      el.addEventListener('click', () => {
        const pol = d.policies.find(p => p.id === el.dataset.policyId)
          || (strategy.policies || []).find(p => p.id === el.dataset.policyId);
        if (pol) this._showPolicyDetailPush(pol);
      });
    });

    body.querySelectorAll('[data-org-id]').forEach(el => {
      el.addEventListener('click', () => {
        const orgRef = (strategy.implementingOrgs || []).find(o => o.id === el.dataset.orgId);
        const orgId = orgRef ? orgRef.id : el.dataset.orgId;
        const org = d.organizations.find(o => o.id === orgId);
        if (org) this._pushOrgDetail(org);
      });
    });

    body.querySelectorAll('[data-program-id]').forEach(el => {
      el.addEventListener('click', () => {
        const prog = d.programs.find(p => p.id === el.dataset.programId)
          || (strategy.programs || []).find(p => p.id === el.dataset.programId);
        if (prog) this._pushProgramDetail(prog);
      });
    });

    body.querySelectorAll('[data-comp-id]').forEach(el => {
      el.addEventListener('click', () => {
        const comp = d.competencies.find(c => c.id === el.dataset.compId)
          || (strategy.competencies || []).find(c => c.id === el.dataset.compId);
        if (comp) this._pushCompDetail(comp);
      });
    });

    body.querySelectorAll('[data-goal-name]').forEach(el => {
      el.addEventListener('click', () => {
        const goal = (strategy.performanceGoals || []).find(g => g.name === el.dataset.goalName);
        if (goal) this._pushGoalDetail(goal);
      });
    });
  },

  _showPolicyDetailPush(policy) {
    const body = document.getElementById('detailBody');
    this._pushDetailWith(body ? body.innerHTML : '', () => {
      body.innerHTML = this._buildPolicyDetailHtml(policy);
      body.scrollTop = 0;
      const rebind = () => this._bindPolicyDetailClicks(policy);
      this._currentRebind = rebind;
      rebind();
    });
  },

  _buildPolicyDetailHtml(policy) {
    const d = HRDData;
    const compHtml = policy.competencies && policy.competencies.length
      ? policy.competencies.map(c => `<span class="detail-tag comp detail-clickable" data-comp-id="${c.id}">${c.name}</span>`).join('')
      : '<span class="detail-empty">역량 데이터 없음</span>';
    const catHtml = policy.competencyCategories && policy.competencyCategories.length
      ? policy.competencyCategories.map(c => `<span class="detail-tag">${c}</span>`).join('')
      : '<span class="detail-empty">역량 분야 데이터 없음</span>';
    const perfHtml = policy.performanceGoals && policy.performanceGoals.length
      ? policy.performanceGoals.map(g => {
          const val = g.value ? ` (${parseInt(g.value).toLocaleString()}명)` : '';
          return `<div class="detail-list-item detail-clickable" data-goal-name="${g.name}"><span class="detail-dot perf"></span>${g.name}${val}</div>`;
        }).join('')
      : '<span class="detail-empty">성과 목표 데이터 없음</span>';
    const managingOrgObj = policy.managingOrg
      ? d.organizations.find(o => o.name === policy.managingOrg || o.abbr === policy.managingOrg)
      : null;
    const managingOrgTag = policy.managingOrg
      ? `<span class="detail-tag org detail-clickable" ${managingOrgObj ? `data-org-id="${managingOrgObj.id}"` : `data-org-name="${policy.managingOrg}"`}>${policy.managingOrg}${policy.managingOrgAbbr ? ' (' + policy.managingOrgAbbr + ')' : ''}</span>`
      : '';
    const relOrgsHtml = policy.relatedOrgs && policy.relatedOrgs.length
      ? policy.relatedOrgs.map(orgRef => {
          const orgId = typeof orgRef === 'string' ? orgRef : orgRef.id;
          const org = d.organizations.find(o => o.id === orgId);
          const label = org ? org.name : (typeof orgRef === 'string' ? orgRef : orgRef.name);
          return `<span class="detail-tag org detail-clickable" data-org-id="${orgId}">${label}</span>`;
        }).join('')
      : '';
    const relBudgetsHtml = policy.relatedBudgets && policy.relatedBudgets.length
      ? policy.relatedBudgets.map(bId => {
          const b = d.budgets.find(x => x.id === bId);
          return b
            ? `<div class="detail-list-item"><span class="detail-dot perf"></span>${b.name}<span style="color:#ffd700;font-size:11px;margin-left:6px">${b.amountStr || ''}</span></div>`
            : `<div class="detail-list-item"><span class="detail-dot"></span>${bId}</div>`;
        }).join('')
      : '';
    const strategyTag = policy.relatedStrategyName
      ? `<span class="detail-tag org detail-clickable" data-strategy-id="${policy.relatedStrategy || ''}" data-strategy-name="${policy.relatedStrategyName}">${policy.relatedStrategyName}</span>`
      : '<span class="detail-empty">데이터 없음</span>';
    return `
      <div class="detail-header-block">
        <div class="detail-strategy-label">PUBLIC POLICY</div>
        <h2 class="detail-title">${policy.name}</h2>
        <div class="detail-en">${policy.en || ''}</div>
      </div>
      <div class="detail-section">
        <div class="detail-section-title">정책 소개</div>
        <p class="detail-description">${policy.description || `${policy.name}은(는) ${policy.relatedStrategyName ? policy.relatedStrategyName + ' 전략과 연계된' : '국가'} 공공정책으로, 인적자원 개발 촉진을 위해 추진됩니다.`}</p>
        <p class="detail-source"><span class="detail-source-label">📋 근거 문서</span> ${policy.basis || '인재개발법, 국가공무원법, 정부조직법 등 관련 법령'}</p>
      </div>
      <div class="detail-section">
        <div class="detail-section-title">연관 전략 <span class="detail-hint">클릭하면 상세 정보</span></div>
        <div class="detail-tags">${strategyTag}</div>
      </div>
      <div class="detail-grid-2">
        <div class="detail-section">
          <div class="detail-section-title">예산 규모</div>
          <div class="detail-budget-value">${policy.budgetAmountStr || '미배정'}</div>
        </div>
        <div class="detail-section">
          <div class="detail-section-title">규모 등급</div>
          <div class="detail-budget-value">${policy.budgetScale || '미배정'}</div>
        </div>
      </div>
      ${managingOrgTag ? `<div class="detail-section"><div class="detail-section-title">관리 기관 <span class="detail-hint">클릭하면 상세 정보</span></div><div class="detail-tags">${managingOrgTag}</div></div>` : ''}
      ${relOrgsHtml ? `<div class="detail-section"><div class="detail-section-title">연관 기관 (${policy.relatedOrgs.length}개) <span class="detail-hint">클릭하면 상세 정보</span></div><div class="detail-tags">${relOrgsHtml}</div></div>` : ''}
      ${relBudgetsHtml ? `<div class="detail-section"><div class="detail-section-title">연관 예산 (${policy.relatedBudgets.length}건)</div><div class="detail-list">${relBudgetsHtml}</div></div>` : ''}
      <div class="detail-section">
        <div class="detail-section-title">역량 분야</div>
        <div class="detail-tags">${catHtml}</div>
      </div>
      <div class="detail-section">
        <div class="detail-section-title">지원 역량 <span class="detail-hint">클릭하면 상세 정보</span></div>
        <div class="detail-tags">${compHtml}</div>
      </div>
      <div class="detail-section">
        <div class="detail-section-title">성과 목표</div>
        <div class="detail-list">${perfHtml}</div>
      </div>
    `;
  },

  _bindPolicyDetailClicks(policy) {
    const body = document.getElementById('detailBody');
    if (!body) return;
    const d = HRDData;

    body.querySelectorAll('[data-strategy-id],[data-strategy-name]').forEach(el => {
      el.addEventListener('click', () => {
        const strat = (el.dataset.strategyId ? d.strategies.find(s => s.id === el.dataset.strategyId) : null)
          || d.strategies.find(s => s.name === el.dataset.strategyName);
        if (strat) this._pushStrategyDetail(strat);
      });
    });

    body.querySelectorAll('[data-org-id]').forEach(el => {
      el.addEventListener('click', () => {
        const org = d.organizations.find(o => o.id === el.dataset.orgId);
        if (org) this._pushOrgDetail(org);
      });
    });

    body.querySelectorAll('[data-org-name]').forEach(el => {
      el.addEventListener('click', () => {
        const org = d.organizations.find(o => o.name === el.dataset.orgName || o.abbr === el.dataset.orgName);
        if (org) this._pushOrgDetail(org);
      });
    });

    body.querySelectorAll('[data-comp-id]').forEach(el => {
      el.addEventListener('click', () => {
        const comp = d.competencies.find(c => c.id === el.dataset.compId)
          || (policy.competencies || []).find(c => c.id === el.dataset.compId);
        if (comp) this._pushCompDetail(comp);
      });
    });

    body.querySelectorAll('[data-goal-name]').forEach(el => {
      el.addEventListener('click', () => {
        const goal = (policy.performanceGoals || []).find(g => g.name === el.dataset.goalName);
        if (goal) this._pushGoalDetail(goal);
      });
    });
  },

  _pushStrategyDetail(strategy) {
    const body = document.getElementById('detailBody');
    this._pushDetailWith(body ? body.innerHTML : '', () => {
      const d = HRDData;
      const budgetStr = strategy.totalBudgetStr || (strategy.totalBudget ? d.formatWon(strategy.totalBudget) : '미배정');
      const policiesHtml = strategy.policies && strategy.policies.length
        ? strategy.policies.map(p => `<span class="detail-tag detail-clickable" data-policy-id="${p.id}">${p.name}</span>`).join('')
        : '<span class="detail-empty">연관 정책 데이터 없음</span>';
      const orgsHtml = strategy.implementingOrgs && strategy.implementingOrgs.length
        ? strategy.implementingOrgs.map(o => {
            const label = o.abbr ? `${o.abbr} (${o.name})` : o.name;
            return `<span class="detail-tag org detail-clickable" data-org-id="${o.id}">${label}</span>`;
          }).join('')
        : '<span class="detail-empty">집행 기관 데이터 없음</span>';
      const compHtml = strategy.competencies && strategy.competencies.length
        ? strategy.competencies.slice(0, 10).map(c => `<span class="detail-tag comp detail-clickable" data-comp-id="${c.id}">${c.name}</span>`).join('')
        : '<span class="detail-empty">역량 데이터 없음</span>';
      const perfHtml = strategy.performanceGoals && strategy.performanceGoals.length
        ? strategy.performanceGoals.map(g => `<div class="detail-list-item detail-clickable" data-goal-name="${g.name}"><span class="detail-dot perf"></span>${g.name}</div>`).join('')
        : '<span class="detail-empty">성과 목표 데이터 없음</span>';
      body.innerHTML = `
        <div class="detail-header-block">
          <div class="detail-strategy-label">NATIONAL STRATEGY</div>
          <h2 class="detail-title">${strategy.name}</h2>
          <div class="detail-en">${strategy.en || ''}</div>
        </div>
        <div class="detail-section">
          <div class="detail-section-title">전략 소개</div>
          <p class="detail-description">${strategy.description || `${strategy.name}은 국가 인적자원 개발의 핵심 전략입니다.`}</p>
          ${strategy.implementingOrgBasis ? `<p class="detail-source"><span class="detail-source-label">📋 근거 문서</span> ${strategy.implementingOrgBasis}</p>` : ''}
        </div>
        <div class="detail-grid-2">
          <div class="detail-section">
            <div class="detail-section-title">예산 규모</div>
            <div class="detail-budget-value">${budgetStr}</div>
          </div>
          <div class="detail-section">
            <div class="detail-section-title">연관 정책 수</div>
            <div class="detail-budget-value">${strategy.policyCount || (strategy.policies ? strategy.policies.length : 0)}개</div>
          </div>
        </div>
        <div class="detail-section">
          <div class="detail-section-title">연관 정책 <span class="detail-hint">클릭하면 상세 정보</span></div>
          <div class="detail-tags">${policiesHtml}</div>
        </div>
        <div class="detail-section">
          <div class="detail-section-title">집행 기관 <span class="detail-hint">클릭하면 상세 정보</span></div>
          <div class="detail-tags">${orgsHtml}</div>
        </div>
        <div class="detail-section">
          <div class="detail-section-title">연관 역량 <span class="detail-hint">클릭하면 상세 정보</span></div>
          <div class="detail-tags">${compHtml}</div>
        </div>
        <div class="detail-section">
          <div class="detail-section-title">성과 목표</div>
          <div class="detail-list">${perfHtml}</div>
        </div>
      `;
      body.scrollTop = 0;
      const rebind = () => this._bindStrategyDetailClicks(strategy);
      this._currentRebind = rebind;
      rebind();
    });
  },

  _pushOrgDetail(org) {
    const body = document.getElementById('detailBody');
    this._pushDetailWith(body ? body.innerHTML : '', () => {
      const d = HRDData;
      const policies = d.policies.filter(p =>
        (p.relatedOrgs || []).some(o => o.id === org.id) ||
        p.managingOrg === org.name ||
        (org.abbr && p.managingOrgAbbr === org.abbr)
      );
      const isCoImplementor = policies.length === 0 &&
        d.strategies.some(s => (s.implementingOrgs || []).some(o => o.id === org.id));
      const polHtml = policies.length
        ? policies.map(p => `<div class="detail-list-item detail-clickable" data-policy-id="${p.id}"><span class="detail-dot"></span>${p.name}</div>`).join('')
        : isCoImplementor
          ? '<span class="detail-empty">직접 담당 정책 없음 — 전략 공동 집행기관으로 참여</span>'
          : '<span class="detail-empty">관련 정책 데이터 없음</span>';
      const contactHtml = (org.dept || org.mainTel || org.directTel) ? `
        <div class="detail-section">
          <div class="detail-section-title">담당 정보</div>
          <div class="detail-contact-grid">
            ${org.dept ? `<div class="detail-contact-row"><span class="detail-contact-label">담당부서</span><span class="detail-contact-value">${org.dept}</span></div>` : ''}
            ${org.mainTel ? `<div class="detail-contact-row"><span class="detail-contact-label">대표전화</span><span class="detail-contact-value">${org.mainTel}</span></div>` : ''}
            ${org.directTel ? `<div class="detail-contact-row"><span class="detail-contact-label">담당자전화</span><span class="detail-contact-value">${org.directTel}</span></div>` : ''}
          </div>
        </div>` : '';
      const detailBody = document.getElementById('detailBody');
      if (!detailBody) return;
      detailBody.innerHTML = `
        <div class="detail-header-block">
          <div class="detail-strategy-label">ORGANIZATION</div>
          <h2 class="detail-title">${org.name}</h2>
          <div class="detail-en">${org.abbr || ''}</div>
        </div>
        <div class="detail-section">
          <div class="detail-section-title">유형</div>
          <div class="detail-tags"><span class="detail-tag">${org.type || '기관'}</span></div>
        </div>
        ${contactHtml}
        ${org.description ? `<div class="detail-section"><div class="detail-section-title">설명</div><p class="detail-description">${org.description}</p></div>` : ''}
        <div class="detail-section">
          <div class="detail-section-title">관련 정책${policies.length > 0 ? ` <span class="detail-hint">클릭하면 상세 정보</span> (${policies.length}건)` : ''}</div>
          <div class="detail-list">${polHtml}</div>
        </div>
      `;
      detailBody.scrollTop = 0;
      const rebind = () => this._bindOrgDetailClicks(org, policies);
      this._currentRebind = rebind;
      rebind();
    });
  },

  _bindOrgDetailClicks(org, policies) {
    const body = document.getElementById('detailBody');
    if (!body) return;
    body.querySelectorAll('[data-policy-id]').forEach(el => {
      el.addEventListener('click', () => {
        const pol = policies.find(p => p.id === el.dataset.policyId)
          || HRDData.policies.find(p => p.id === el.dataset.policyId);
        if (pol) this._showPolicyDetailPush(pol);
      });
    });
  },

  _pushProgramDetail(program) {
    const body = document.getElementById('detailBody');
    this._pushDetailWith(body ? body.innerHTML : '', () => {
      const d = HRDData;
      const strategy = program.alignedStrategy ? d.strategies.find(s => s.id === program.alignedStrategy) : null;
      const stratName = strategy ? strategy.name : null;
      const orgInfo = program.orgId ? d.organizations.find(o => o.id === program.orgId) : null;
      const orgDisplay = orgInfo
        ? orgInfo.name + (orgInfo.abbr ? ' (' + orgInfo.abbr + ')' : '')
        : (program.org || '미지정') + (program.orgAbbr ? ' (' + program.orgAbbr + ')' : '');
      const budgetObj = program.budgetCode ? d.budgets.find(x => x.id === program.budgetCode) : null;
      const budgetInfo = budgetObj ? `${budgetObj.name} (${budgetObj.amountStr || d.formatWon(budgetObj.amount || 0)})` : null;
      const detailBody = document.getElementById('detailBody');
      if (!detailBody) return;
      detailBody.innerHTML = `
        <div class="detail-header-block">
          <div class="detail-strategy-label">EDUCATION PROGRAM</div>
          <h2 class="detail-title">${program.name}</h2>
          <div class="detail-en">${program.en || ''}</div>
        </div>
        <div class="detail-section">
          <div class="detail-section-title">연관 전략 <span class="detail-hint">클릭하면 상세 정보</span></div>
          <div class="detail-tags">
            ${stratName
              ? `<span class="detail-tag org detail-clickable" data-strategy-id="${program.alignedStrategy}">${stratName}</span>`
              : '<span class="detail-empty">미분류</span>'}
          </div>
        </div>
        <div class="detail-grid-2">
          <div class="detail-section">
            <div class="detail-section-title">관리 기관 <span class="detail-hint">클릭하면 상세 정보</span></div>
            <div class="detail-tags">
              ${orgInfo
                ? `<span class="detail-tag org detail-clickable" data-org-id="${orgInfo.id}">${orgDisplay}</span>`
                : (program.org ? `<span class="detail-tag org detail-clickable" data-org-name="${program.org}">${orgDisplay}</span>` : `<span class="detail-tag org">${orgDisplay}</span>`)}
            </div>
          </div>
          <div class="detail-section">
            <div class="detail-section-title">교육 시간</div>
            <div class="detail-budget-value">${program.hours || '?'}시간</div>
          </div>
        </div>
        <div class="detail-section">
          <div class="detail-section-title">역량 분야</div>
          <div class="detail-tags">
            <span class="detail-tag comp">${program.competencyCategory || '미분류'}</span>
            ${program.competency ? `<span class="detail-tag">${program.competency}</span>` : ''}
            ${program.competencyEn ? `<span class="detail-tag">${program.competencyEn}</span>` : ''}
          </div>
        </div>
        <div class="detail-section">
          <div class="detail-section-title">대상 그룹</div>
          <div class="detail-tags">
            <span class="detail-tag">${program.targetGroup || '미지정'}</span>
          </div>
        </div>
        ${budgetInfo ? `<div class="detail-section"><div class="detail-section-title">연관 예산 <span class="detail-hint">클릭하면 상세 정보</span></div><div class="detail-tags"><span class="detail-tag detail-clickable" style="color:#ffd700" data-budget-id="${program.budgetCode}">${budgetInfo}</span></div></div>` : ''}
        <div class="detail-section">
          <div class="detail-section-title">프로그램 ID</div>
          <div class="detail-en" style="font-family:monospace;font-size:12px">${program.id}</div>
        </div>
      `;
      detailBody.scrollTop = 0;
      const rebind = () => this._bindProgramDetailClicks(program);
      this._currentRebind = rebind;
      rebind();
    });
  },

  _pushCompDetail(comp) {
    const html = `
      <div class="detail-header-block">
        <div class="detail-strategy-label">COMPETENCY</div>
        <h2 class="detail-title">${comp.name}</h2>
        <div class="detail-en">${comp.en || comp.id || ''}</div>
      </div>
      ${comp.description ? `<div class="detail-section"><div class="detail-section-title">설명</div><p class="detail-description">${comp.description}</p></div>` : ''}
      ${comp.category ? `<div class="detail-section"><div class="detail-section-title">분류</div><div class="detail-tags"><span class="detail-tag">${comp.category}</span></div></div>` : ''}
      ${comp.level ? `<div class="detail-section"><div class="detail-section-title">수준</div><div class="detail-tags"><span class="detail-tag comp">${comp.level}</span></div></div>` : ''}
    `;
    this._pushDetail(html);
  },

  _pushGoalDetail(goal) {
    const html = `
      <div class="detail-header-block">
        <div class="detail-strategy-label">PERFORMANCE GOAL</div>
        <h2 class="detail-title">${goal.name}</h2>
      </div>
      ${goal.description ? `<div class="detail-section"><div class="detail-section-title">설명</div><p class="detail-description">${goal.description}</p></div>` : ''}
      ${goal.value ? `<div class="detail-section"><div class="detail-section-title">목표값</div><div class="detail-budget-value">${parseInt(goal.value).toLocaleString()}명</div></div>` : ''}
      ${goal.year ? `<div class="detail-section"><div class="detail-section-title">목표 연도</div><div class="detail-budget-value">${goal.year}년</div></div>` : ''}
    `;
    this._pushDetail(html);
  },
});
