// HRD Governance Platform - D3 Knowledge Graph (optional overlay)
// Renders a force-directed graph when #graph-container exists in DOM

const KnowledgeGraph = {
  svg: null,
  simulation: null,

  build() {
    const container = document.getElementById('graph-container');
    if (!container || typeof d3 === 'undefined' || !HRDData.raw) return;

    const W = container.clientWidth || 800;
    const H = container.clientHeight || 500;

    container.innerHTML = '';
    this.svg = d3.select(container)
      .append('svg')
      .attr('width', W)
      .attr('height', H);

    // Add zoom
    const g = this.svg.append('g');
    this.svg.call(d3.zoom().scaleExtent([0.3, 3]).on('zoom', e => g.attr('transform', e.transform)));

    const { nodes, links } = this._buildGraph();

    // Arrow marker
    this.svg.append('defs').append('marker')
      .attr('id', 'arrow')
      .attr('viewBox', '0 -5 10 10')
      .attr('refX', 18)
      .attr('refY', 0)
      .attr('markerWidth', 6)
      .attr('markerHeight', 6)
      .attr('orient', 'auto')
      .append('path')
      .attr('d', 'M0,-5L10,0L0,5')
      .attr('fill', '#1a3a4a');

    const link = g.append('g').selectAll('line')
      .data(links).join('line')
      .attr('stroke', '#1a3a4a')
      .attr('stroke-width', 1)
      .attr('marker-end', 'url(#arrow)')
      .attr('opacity', 0.6);

    const node = g.append('g').selectAll('g')
      .data(nodes).join('g')
      .attr('cursor', 'pointer')
      .call(d3.drag()
        .on('start', (e, d) => { if (!e.active) this.simulation.alphaTarget(0.3).restart(); d.fx = d.x; d.fy = d.y; })
        .on('drag', (e, d) => { d.fx = e.x; d.fy = e.y; })
        .on('end', (e, d) => { if (!e.active) this.simulation.alphaTarget(0); d.fx = null; d.fy = null; })
      );

    node.append('circle')
      .attr('r', d => d.radius)
      .attr('fill', d => d.color + '33')
      .attr('stroke', d => d.color)
      .attr('stroke-width', 1.5);

    node.append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', '0.35em')
      .attr('fill', '#e0e8f0')
      .attr('font-size', d => d.radius > 14 ? 9 : 7)
      .attr('font-family', 'sans-serif')
      .text(d => d.label.slice(0, 8));

    node.append('title').text(d => d.label);

    this.simulation = d3.forceSimulation(nodes)
      .force('link', d3.forceLink(links).id(d => d.id).distance(80))
      .force('charge', d3.forceManyBody().strength(-120))
      .force('center', d3.forceCenter(W / 2, H / 2))
      .force('collision', d3.forceCollide().radius(d => d.radius + 4))
      .on('tick', () => {
        link
          .attr('x1', d => d.source.x)
          .attr('y1', d => d.source.y)
          .attr('x2', d => d.target.x)
          .attr('y2', d => d.target.y);
        node.attr('transform', d => `translate(${d.x},${d.y})`);
      });
  },

  _buildGraph() {
    const nodes = [];
    const links = [];
    const colors = {
      NationalStrategy: '#00d4ff',
      Organization: '#00ff41',
      PublicPolicy: '#ffd700',
      Budget: '#ff8800',
      EducationProgram: '#9933ff',
      Competency: '#ff3333',
    };

    // Add strategy nodes
    HRDData.strategies.slice(0, 11).forEach(s => {
      nodes.push({ id: 'S_' + s.id, label: s.name, group: 'NationalStrategy', color: colors.NationalStrategy, radius: 16 });
    });

    // Add org nodes (sample)
    HRDData.organizations.slice(0, 10).forEach(o => {
      nodes.push({ id: 'O_' + o.id, label: o.abbr || o.name, group: 'Organization', color: colors.Organization, radius: 12 });
    });

    // Add policy nodes (sample)
    HRDData.policies.slice(0, 15).forEach(p => {
      nodes.push({ id: 'P_' + p.id, label: p.name, group: 'PublicPolicy', color: colors.PublicPolicy, radius: 10 });
    });

    // Add program nodes (sample)
    HRDData.programs.slice(0, 12).forEach(p => {
      nodes.push({ id: 'PR_' + p.id, label: p.name, group: 'EducationProgram', color: colors.EducationProgram, radius: 8 });
    });

    // Add competency nodes (sample)
    HRDData.competencies.slice(0, 10).forEach(c => {
      nodes.push({ id: 'C_' + c.id, label: c.name, group: 'Competency', color: colors.Competency, radius: 7 });
    });

    const idSet = new Set(nodes.map(n => n.id));
    const safeLink = (s, t) => { if (idSet.has(s) && idSet.has(t)) links.push({ source: s, target: t }); };

    // Strategy → Policy chain (synthetic)
    HRDData.strategies.slice(0, 5).forEach((s, si) => {
      HRDData.policies.slice(si * 3, si * 3 + 3).forEach(p => safeLink('S_' + s.id, 'P_' + p.id));
    });

    // Policy → Program chain
    HRDData.policies.slice(0, 10).forEach((p, pi) => {
      HRDData.programs.slice(pi, pi + 2).forEach(pr => safeLink('P_' + p.id, 'PR_' + pr.id));
    });

    // Org → Program
    HRDData.organizations.slice(0, 5).forEach((o, oi) => {
      HRDData.programs.slice(oi * 2, oi * 2 + 2).forEach(pr => safeLink('O_' + o.id, 'PR_' + pr.id));
    });

    // Program → Competency
    HRDData.programs.slice(0, 10).forEach((pr, pi) => {
      HRDData.competencies.slice(pi % 10, pi % 10 + 2).forEach(c => safeLink('PR_' + pr.id, 'C_' + c.id));
    });

    return { nodes, links };
  },

  destroy() {
    if (this.simulation) this.simulation.stop();
  },
};
