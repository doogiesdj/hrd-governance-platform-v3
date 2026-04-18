// OntoGraf - Protege-style interactive ontology graph browser

const OntoGraf = (() => {
  const HIERARCHY = {
    // Competency branch
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
    MLOps: 'AI_and_Infrastructure', Cloud_Arch: 'AI_and_Infrastructure', LLM_Fine_Tuning: 'AI_and_Infrastructure', DevOps: 'AI_and_Infrastructure',
    // Organization branch
    LocalGovernment: 'Organization', RearchCenter: 'Organization', PublicInstitution: 'Organization',
    GovernmentAgency: 'Organization', CertificationBody: 'Organization', Enterprise: 'Organization',
    // Policy branch
    TuitionSupport: 'Policy', EmploymentSubsidy: 'Policy', R_D_Project: 'Policy', PublicPolicy: 'Policy',
    // EducationProgram branch
    K_DigitalTraining: 'EducationProgram', DegreeCourse: 'EducationProgram', JobRetraining: 'EducationProgram',
    // HumanResource branch
    Unemployed: 'HumanResource', Student: 'HumanResource', Incumbent: 'HumanResource', Person: 'HumanResource',
    RetiredProfessional: 'Person', HighPerformer: 'Person',
    // Region branch
    GangLeng: 'Region', Daejeon: 'Region', Inchun: 'Region', Busan: 'Region',
    Guangju: 'Region', Daegu: 'Region', Seoul: 'Region', Geoje: 'Region', Sejong: 'Region', Suwon: 'Region',
    // Outcome branch
    Employment: 'Outcome', Entrepreneurship: 'Outcome', EconomicImpact: 'Outcome', SocialImpact: 'Outcome', SkillGrowth: 'Outcome',
    // Event branch
    PolicyParticipation: 'Event', OutcomeMeasurement: 'Event', AssessmentEvent: 'Event', ProgramCompletion: 'Event', ProgramEnrollment: 'Event',
    // TalentSegment branch
    JuniorTalent: 'TalentSegment',
    // EmploymentStatus branch
    Active: 'EmploymentStatus', Retired: 'EmploymentStatus'
  };

  const ROOT_CLASSES = [
    'NationalStrategy', 'Policy', 'EducationProgram', 'Organization', 'Budget',
    'Competency', 'HumanResource', 'Region', 'Outcome', 'Event',
    'TalentSegment', 'EmploymentStatus', 'CompetencyAssessment', 'CompetencyCategory',
    'CompetencyGap', 'StrategicGoal', 'Recommendation', 'Occupation', 'Benefit',
    'CareerHistory', 'Certification', 'MatchScore', 'TargetGroup'
  ];

  // Sample instances per class (representative)
  const INSTANCES = {
    Civic_Literacy: ['inst_CivicLit_01', 'inst_CivicLit_02'],
    Digital_Literacy: ['inst_DigLit_01', 'inst_DigLit_02'],
    Competency: ['inst_Comp_01'],
    Organization: ['inst_Org_MOEL', 'inst_Org_KIRD', 'inst_Org_NCS', 'inst_Org_HRD'],
    Policy: ['inst_Pol_DigiNew', 'inst_Pol_EmpSup', 'inst_Pol_KDT'],
    EducationProgram: ['inst_Prog_KDT_Backend', 'inst_Prog_AI_Boot', 'inst_Prog_Cloud'],
    HumanResource: ['inst_HR_B6', 'inst_HR_C3', 'inst_HR_A1'],
    Region: ['inst_Seoul_01', 'inst_Busan_01'],
    Outcome: ['inst_Outcome_Emp_2024', 'inst_Outcome_Skill_Q3'],
    NationalStrategy: ['inst_NS_Digital2030', 'inst_NS_HRD2025'],
    Budget: ['inst_Budget_2024_Total', 'inst_Budget_MOEL'],
    Literacy: ['inst_Lit_Basic_01'],
    SoftSkill: ['inst_SS_Collab_01'],
    HardSkill: ['inst_HS_ICT_01'],
  };

  let _svg = null;
  let _sim = null;
  let _container = null;

  // Build children map from HIERARCHY
  function _childrenOf(cls) {
    return Object.entries(HIERARCHY)
      .filter(([, p]) => p === cls)
      .map(([c]) => c);
  }

  function _allClasses() {
    const set = new Set(ROOT_CLASSES);
    Object.keys(HIERARCHY).forEach(k => set.add(k));
    Object.values(HIERARCHY).forEach(v => set.add(v));
    return [...set];
  }

  function _instancesOf(cls) {
    return INSTANCES[cls] || [];
  }

  // --- Tree builder ---
  function _buildTreeHTML(cls, depth) {
    const children = _childrenOf(cls);
    const instances = _instancesOf(cls);
    const hasChildren = children.length > 0 || instances.length > 0;
    const id = 'og-node-' + cls;

    let html = `<div class="og-tree-node" style="padding-left:${depth * 14}px">`;
    if (hasChildren) {
      html += `<span class="og-tree-toggle" data-cls="${cls}">▶</span>`;
    } else {
      html += `<span class="og-tree-spacer"></span>`;
    }
    html += `<span class="og-tree-class" data-cls="${cls}" id="${id}">${cls}</span>`;
    html += `</div>`;

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
    let html = '';
    ROOT_CLASSES.forEach(rc => { html += _buildTreeHTML(rc, 0); });
    return html;
  }

  // --- Focus logic ---
  function focusClass(cls) {
    const nodes = [], links = [];
    const added = new Set();

    function addNode(id, type, label) {
      if (!added.has(id)) { nodes.push({ id, type, label: label || id }); added.add(id); }
    }

    // Selected class
    addNode(cls, 'selected', cls);

    // Parent
    const parent = HIERARCHY[cls];
    if (parent) {
      addNode(parent, 'parent', parent);
      links.push({ source: cls, target: parent, rel: 'subClassOf' });

      // Grandparent
      const gp = HIERARCHY[parent];
      if (gp) {
        addNode(gp, 'grandparent', gp);
        links.push({ source: parent, target: gp, rel: 'subClassOf' });
      }
    }

    // Children
    const children = _childrenOf(cls);
    children.forEach(ch => {
      addNode(ch, 'child', ch);
      links.push({ source: ch, target: cls, rel: 'subClassOf' });

      // Grandchildren
      _childrenOf(ch).slice(0, 3).forEach(gch => {
        addNode(gch, 'grandchild', gch);
        links.push({ source: gch, target: ch, rel: 'subClassOf' });
      });
    });

    // Instances
    const insts = _instancesOf(cls);
    const MAX_INST = 5;
    insts.slice(0, MAX_INST).forEach(inst => {
      addNode(inst, 'instance', inst);
      links.push({ source: inst, target: cls, rel: 'instanceOf' });
    });
    if (insts.length > MAX_INST) {
      const moreId = `+${insts.length - MAX_INST} more`;
      addNode(moreId, 'more', moreId);
      links.push({ source: moreId, target: cls, rel: 'instanceOf' });
    }

    _render(nodes, links, cls);
    _highlightTree(cls);
  }

  function focusInstance(inst, cls) {
    const nodes = [], links = [];
    const added = new Set();

    function addNode(id, type, label) {
      if (!added.has(id)) { nodes.push({ id, type, label: label || id }); added.add(id); }
    }

    addNode(inst, 'selected-inst', inst);
    if (cls) {
      addNode(cls, 'parent', cls);
      links.push({ source: inst, target: cls, rel: 'instanceOf' });

      const gp = HIERARCHY[cls];
      if (gp) {
        addNode(gp, 'grandparent', gp);
        links.push({ source: cls, target: gp, rel: 'subClassOf' });
      }

      // Sibling instances
      _instancesOf(cls).filter(i => i !== inst).slice(0, 4).forEach(sib => {
        addNode(sib, 'instance', sib);
        links.push({ source: sib, target: cls, rel: 'instanceOf' });
      });
    }

    _render(nodes, links, inst);
  }

  // --- D3 render ---
  function _render(nodes, links, selectedId) {
    const wrap = document.getElementById('og-graph-wrap');
    if (!wrap) return;
    wrap.innerHTML = '';

    const W = wrap.clientWidth || 700;
    const H = wrap.clientHeight || 500;

    const svg = d3.select(wrap).append('svg')
      .attr('width', '100%').attr('height', '100%')
      .attr('viewBox', `0 0 ${W} ${H}`);

    // Arrow markers
    const defs = svg.append('defs');

    defs.append('marker').attr('id', 'og-arr-sub')
      .attr('viewBox', '0 -5 10 10').attr('refX', 10).attr('refY', 0)
      .attr('markerWidth', 8).attr('markerHeight', 8).attr('orient', 'auto')
      .append('path').attr('d', 'M0,-5L10,0L0,5Z').attr('fill', 'none')
      .attr('stroke', '#5b9bd5').attr('stroke-width', 1.5);

    defs.append('marker').attr('id', 'og-arr-inst')
      .attr('viewBox', '0 -5 10 10').attr('refX', 10).attr('refY', 0)
      .attr('markerWidth', 8).attr('markerHeight', 8).attr('orient', 'auto')
      .append('path').attr('d', 'M0,-5L10,0L0,5Z').attr('fill', '#e08040')
      .attr('stroke', '#e08040').attr('stroke-width', 1);

    const g = svg.append('g');

    // Zoom/pan
    svg.call(d3.zoom().scaleExtent([0.3, 3])
      .on('zoom', evt => g.attr('transform', evt.transform)));

    // Node dimensions
    const NODE_W = 110, NODE_H = 32, INST_R = 22;

    // Assign initial positions in a radial layout
    const cx = W / 2, cy = H / 2;
    nodes.forEach((n, i) => {
      if (n.id === selectedId) { n.x = cx; n.y = cy; n.fx = cx; n.fy = cy; return; }
      const angle = (i / (nodes.length - 1 || 1)) * 2 * Math.PI;
      const r = 170 + Math.random() * 60;
      n.x = cx + r * Math.cos(angle);
      n.y = cy + r * Math.sin(angle);
    });

    // Links
    const linkSel = g.append('g').selectAll('line')
      .data(links).join('line')
      .attr('class', d => 'og-link og-link-' + d.rel)
      .attr('marker-end', d => d.rel === 'instanceOf' ? 'url(#og-arr-inst)' : 'url(#og-arr-sub)');

    // Nodes group
    const nodeSel = g.append('g').selectAll('g.og-node')
      .data(nodes).join('g')
      .attr('class', d => 'og-node og-node-' + d.type)
      .call(d3.drag()
        .on('start', (evt, d) => { if (!evt.active) sim.alphaTarget(0.3).restart(); d.fx = d.x; d.fy = d.y; })
        .on('drag', (evt, d) => { d.fx = evt.x; d.fy = evt.y; })
        .on('end', (evt, d) => { if (!evt.active) sim.alphaTarget(0); d.fx = null; d.fy = null; }))
      .on('click', (evt, d) => {
        evt.stopPropagation();
        if (d.type === 'instance' || d.type === 'selected-inst') {
          focusInstance(d.id, d.parentCls);
        } else if (d.type !== 'more') {
          focusClass(d.id);
        }
        _showNodeInfo(d);
      });

    // Assign parentCls for instances
    links.forEach(l => {
      if (l.rel === 'instanceOf') {
        const iNode = nodes.find(n => n.id === (typeof l.source === 'object' ? l.source.id : l.source));
        if (iNode) iNode.parentCls = typeof l.target === 'object' ? l.target.id : l.target;
      }
    });

    // Draw shapes
    nodeSel.each(function(d) {
      const sel = d3.select(this);
      if (d.type === 'instance' || d.type === 'selected-inst' || d.type === 'more') {
        sel.append('circle').attr('r', INST_R);
        sel.append('text').attr('text-anchor', 'middle').attr('dy', '0.35em')
          .text(d => d.label.length > 14 ? d.label.slice(0, 13) + '…' : d.label);
      } else {
        sel.append('rect').attr('x', -NODE_W / 2).attr('y', -NODE_H / 2)
          .attr('width', NODE_W).attr('height', NODE_H).attr('rx', 4);
        sel.append('text').attr('text-anchor', 'middle').attr('dy', '0.35em')
          .text(d => d.label.length > 16 ? d.label.slice(0, 15) + '…' : d.label);
      }
    });

    // Simulation
    const sim = d3.forceSimulation(nodes)
      .force('link', d3.forceLink(links).id(d => d.id).distance(140).strength(0.5))
      .force('charge', d3.forceManyBody().strength(-300))
      .force('center', d3.forceCenter(cx, cy))
      .force('collide', d3.forceCollide(60))
      .on('tick', () => {
        nodeSel.attr('transform', d => `translate(${d.x},${d.y})`);
        linkSel
          .attr('x1', d => _edgeX(d.source, d.target, NODE_W, NODE_H, INST_R, true))
          .attr('y1', d => _edgeY(d.source, d.target, NODE_W, NODE_H, INST_R, true))
          .attr('x2', d => _edgeX(d.source, d.target, NODE_W, NODE_H, INST_R, false))
          .attr('y2', d => _edgeY(d.source, d.target, NODE_W, NODE_H, INST_R, false));
      });

    _sim = sim;
  }

  function _isCircle(node) {
    return node.type === 'instance' || node.type === 'selected-inst' || node.type === 'more';
  }

  function _edgeX(src, tgt, nw, nh, ir, fromSrc) {
    const s = fromSrc ? src : tgt, t = fromSrc ? tgt : src;
    const dx = t.x - s.x, dy = t.y - s.y, dist = Math.sqrt(dx * dx + dy * dy) || 1;
    if (_isCircle(s)) return s.x + (ir * dx / dist);
    const hw = nw / 2, hh = nh / 2;
    const scx = Math.abs(dx) * hh, scy = Math.abs(dy) * hw;
    const r = scx > scy ? hw / Math.abs(dx) : hh / Math.abs(dy);
    return s.x + dx * r;
  }

  function _edgeY(src, tgt, nw, nh, ir, fromSrc) {
    const s = fromSrc ? src : tgt, t = fromSrc ? tgt : src;
    const dx = t.x - s.x, dy = t.y - s.y, dist = Math.sqrt(dx * dx + dy * dy) || 1;
    if (_isCircle(s)) return s.y + (ir * dy / dist);
    const hw = nw / 2, hh = nh / 2;
    const scx = Math.abs(dx) * hh, scy = Math.abs(dy) * hw;
    const r = scx > scy ? hw / Math.abs(dx) : hh / Math.abs(dy);
    return s.y + dy * r;
  }

  // --- Info panel ---
  function _showNodeInfo(d) {
    const panel = document.getElementById('og-info-panel');
    if (!panel) return;
    const parent = HIERARCHY[d.id];
    const children = _childrenOf(d.id);
    const insts = _instancesOf(d.id);
    let html = `<div class="og-info-title">${d.id}</div>`;
    html += `<div class="og-info-row"><b>Type:</b> ${d.type}</div>`;
    if (parent) html += `<div class="og-info-row"><b>subClassOf:</b> ${parent}</div>`;
    if (children.length) html += `<div class="og-info-row"><b>Children (${children.length}):</b> ${children.slice(0, 5).join(', ')}${children.length > 5 ? '…' : ''}</div>`;
    if (insts.length) html += `<div class="og-info-row"><b>Instances (${insts.length}):</b> ${insts.slice(0, 4).join(', ')}${insts.length > 4 ? '…' : ''}</div>`;
    panel.innerHTML = html;
    panel.style.display = 'block';
  }

  // --- Tree highlight ---
  function _highlightTree(cls) {
    document.querySelectorAll('.og-tree-class').forEach(el => el.classList.remove('og-selected'));
    const el = document.querySelector(`.og-tree-class[data-cls="${cls}"]`);
    if (!el) return;
    el.classList.add('og-selected');
    // Expand parents
    let cur = HIERARCHY[cls];
    while (cur) {
      const ch = document.getElementById('ogc-' + cur);
      if (ch) { ch.style.display = 'block'; const tog = document.querySelector(`.og-tree-toggle[data-cls="${cur}"]`); if (tog) tog.textContent = '▼'; }
      cur = HIERARCHY[cur];
    }
    el.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }

  // --- Search ---
  function _search(query) {
    const q = query.trim().toLowerCase();
    if (!q) return;
    const allCls = _allClasses();
    const matched = allCls.find(c => c.toLowerCase() === q) || allCls.find(c => c.toLowerCase().includes(q));
    if (matched) { focusClass(matched); return; }

    // Check instances
    for (const [cls, insts] of Object.entries(INSTANCES)) {
      const inst = insts.find(i => i.toLowerCase().includes(q));
      if (inst) { focusInstance(inst, cls); return; }
    }

    const panel = document.getElementById('og-info-panel');
    if (panel) { panel.innerHTML = `<div class="og-info-row" style="color:#e07;">No results for "${query}"</div>`; panel.style.display = 'block'; }
  }

  // --- Public init ---
  function init(containerId) {
    const wrap = document.getElementById(containerId);
    if (!wrap) return;

    wrap.innerHTML = `
      <div class="og-layout">
        <div class="og-left-panel">
          <div class="og-search-box">
            <input id="og-search-input" type="text" placeholder="Search class or instance…" autocomplete="off"/>
            <button id="og-search-btn">🔍</button>
          </div>
          <div class="og-legend">
            <span class="og-legend-class"></span> Class &nbsp;
            <span class="og-legend-inst"></span> Instance &nbsp;
            <span class="og-legend-selected"></span> Selected
          </div>
          <div class="og-tree-scroll" id="og-tree-scroll"></div>
        </div>
        <div class="og-right-panel">
          <div id="og-graph-wrap" class="og-graph-wrap"></div>
          <div id="og-info-panel" class="og-info-panel" style="display:none;"></div>
        </div>
      </div>`;

    // Build tree
    document.getElementById('og-tree-scroll').innerHTML = _buildFullTree();

    // Tree toggle clicks
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
      if (clsEl) { focusClass(clsEl.dataset.cls); return; }
      const instEl = evt.target.closest('.og-tree-instance');
      if (instEl) { focusInstance(instEl.dataset.inst, instEl.dataset.cls); return; }
    });

    // Search
    const input = document.getElementById('og-search-input');
    const btn = document.getElementById('og-search-btn');
    btn.addEventListener('click', () => _search(input.value));
    input.addEventListener('keydown', e => { if (e.key === 'Enter') _search(input.value); });

    // Close info panel on graph click
    document.getElementById('og-graph-wrap').addEventListener('click', () => {
      const panel = document.getElementById('og-info-panel');
      if (panel) panel.style.display = 'none';
    });

    // Default view
    focusClass('Competency');
  }

  return { init, focusClass, focusInstance };
})();
