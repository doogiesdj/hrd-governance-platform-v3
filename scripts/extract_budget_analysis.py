"""
Extract budget breakdown data by 6 categories from the RDF ontology.
Output: platform/data/budget_analysis.json
"""
import json
import io
import contextlib
from pathlib import Path

import rdflib

_SCRIPTS_DIR = Path(__file__).parent
_REPO_ROOT = _SCRIPTS_DIR.parent
RDF_PATH = str(_REPO_ROOT / "src" / "HRD_Governance_Extended_v2.rdf")
OUTPUT_PATH = str(_REPO_ROOT / "data" / "budget_analysis.json")

HRD = rdflib.Namespace("http://www.human-resource.go.kr/ontology/hrd#")
RDFS = rdflib.namespace.RDFS

PREFIXES = """
PREFIX hrd:  <http://www.human-resource.go.kr/ontology/hrd#>
PREFIX rdf:  <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
PREFIX xsd:  <http://www.w3.org/2001/XMLSchema#>
"""

TARGET_LABELS = {
    'TGROUP_Employee': '재직자',
    'TGROUP_Expert': '전문가',
    'TGROUP_Vulnerable': '취약계층',
    'TGROUP_GeneralPublic': '일반인',
    'TGROUP_Youth': '청소년',
    'TGROUP_Retiree': '은퇴자',
    'TGROUP_CareerInterrupted': '경력단절여성',
    'TGROUP_Multicultural': '다문화가정',
}


def fmt_won(n):
    if n is None or n == 0:
        return "미배정"
    if n >= 1e12:
        return f"{n/1e12:.1f}조원"
    if n >= 1e8:
        return f"{n/1e8:.0f}억원"
    if n >= 1e4:
        return f"{n/1e4:.0f}만원"
    return f"{int(n):,}원"


def to_float(val):
    if val is None:
        return 0.0
    try:
        return float(str(val))
    except Exception:
        return 0.0


def get_ko_label(g, uri):
    """Get Korean label for a URI — prefer non-ASCII, fallback to first label."""
    labels = list(g.objects(uri, RDFS.label))
    if not labels:
        return str(uri).split('#')[-1]
    ko = [str(l) for l in labels if any(ord(c) > 0x7F for c in str(l))]
    if ko:
        return ko[0]
    return str(labels[0])


def tg_label(uri_str):
    suffix = uri_str.split('#')[-1]
    return TARGET_LABELS.get(suffix, suffix)


def run(g, sparql):
    stderr_buf = io.StringIO()
    with contextlib.redirect_stderr(stderr_buf):
        return g.query(PREFIXES + sparql)


def build_budget_detail(g, budget_uri):
    b = {}
    b['id'] = str(budget_uri).split('#')[-1]
    b['name'] = get_ko_label(g, budget_uri)

    amount_lit = g.value(budget_uri, HRD.hasBudgetAmount)
    amount = to_float(amount_lit)
    b['amount'] = amount
    b['amountStr'] = fmt_won(amount)

    exec_lit = g.value(budget_uri, HRD.executedAmount)
    exec_amt = to_float(exec_lit)
    b['executedAmount'] = exec_amt
    b['executedAmountStr'] = fmt_won(exec_amt)

    if amount > 0 and exec_amt > 0:
        b['execRate'] = round(exec_amt / amount * 100, 1)
    else:
        b['execRate'] = None

    fy = g.value(budget_uri, HRD.fiscalYear)
    b['fiscalYear'] = str(fy) if fy else '2026'

    org = g.value(budget_uri, HRD.hasAssignedAgency)
    b['managingOrg'] = get_ko_label(g, org) if org else None

    policy = g.value(budget_uri, HRD.allocatedTo)
    b['policy'] = get_ko_label(g, policy) if policy else None

    strat = g.value(budget_uri, HRD.supportsStrategy)
    b['strategy'] = get_ko_label(g, strat) if strat else None

    programs = []
    for prog in g.objects(budget_uri, HRD.fundedPrograms):
        programs.append(get_ko_label(g, prog))
    b['programs'] = programs

    return b


def extract_by_org(g):
    """기관별 — group by org URI to avoid label-language duplicates."""
    qr = run(g, """
SELECT ?org (SUM(?amtNum) AS ?totalAmt) (COUNT(DISTINCT ?budget) AS ?cnt)
WHERE {
  ?budget a hrd:Budget ;
          hrd:hasAssignedAgency ?org ;
          hrd:hasBudgetAmount ?amt .
  BIND(xsd:decimal(STR(?amt)) AS ?amtNum)
}
GROUP BY ?org
ORDER BY DESC(?totalAmt)
""")
    groups = []
    for row in qr:
        org_uri = row['org']
        total = to_float(str(row['totalAmt']))
        cnt = int(str(row['cnt']))
        label = get_ko_label(g, org_uri)

        budgets_q = list(g.subjects(HRD.hasAssignedAgency, org_uri))
        budgets = [build_budget_detail(g, bu) for bu in budgets_q]
        budgets.sort(key=lambda x: x['amount'], reverse=True)

        groups.append({
            'key': label,
            'totalAmount': total,
            'totalAmountStr': fmt_won(total),
            'count': cnt,
            'budgets': budgets,
        })
    return groups


def extract_by_policy(g):
    """정책별 — group by policy URI."""
    qr = run(g, """
SELECT ?policy (SUM(?amtNum) AS ?totalAmt) (COUNT(DISTINCT ?budget) AS ?cnt)
WHERE {
  ?budget a hrd:Budget ;
          hrd:allocatedTo ?policy ;
          hrd:hasBudgetAmount ?amt .
  BIND(xsd:decimal(STR(?amt)) AS ?amtNum)
}
GROUP BY ?policy
ORDER BY DESC(?totalAmt)
""")
    groups = []
    for row in qr:
        pol_uri = row['policy']
        total = to_float(str(row['totalAmt']))
        cnt = int(str(row['cnt']))
        label = get_ko_label(g, pol_uri)

        budgets_q = list(g.subjects(HRD.allocatedTo, pol_uri))
        budgets = [build_budget_detail(g, bu) for bu in budgets_q]
        budgets.sort(key=lambda x: x['amount'], reverse=True)

        groups.append({
            'key': label,
            'totalAmount': total,
            'totalAmountStr': fmt_won(total),
            'count': cnt,
            'budgets': budgets,
        })
    return groups


def extract_by_strategy(g):
    """전략별 — group by strategy URI."""
    qr = run(g, """
SELECT ?strategy (SUM(?amtNum) AS ?totalAmt) (COUNT(DISTINCT ?budget) AS ?cnt)
WHERE {
  ?budget a hrd:Budget ;
          hrd:supportsStrategy ?strategy ;
          hrd:hasBudgetAmount ?amt .
  BIND(xsd:decimal(STR(?amt)) AS ?amtNum)
}
GROUP BY ?strategy
ORDER BY DESC(?totalAmt)
""")
    groups = []
    for row in qr:
        strat_uri = row['strategy']
        total = to_float(str(row['totalAmt']))
        cnt = int(str(row['cnt']))
        label = get_ko_label(g, strat_uri)

        budgets_q = list(g.subjects(HRD.supportsStrategy, strat_uri))
        budgets = [build_budget_detail(g, bu) for bu in budgets_q]
        budgets.sort(key=lambda x: x['amount'], reverse=True)

        groups.append({
            'key': label,
            'totalAmount': total,
            'totalAmountStr': fmt_won(total),
            'count': cnt,
            'budgets': budgets,
        })
    return groups


def extract_by_program(g):
    """프로그램별 — group by program URI."""
    qr = run(g, """
SELECT ?prog (SUM(?amtNum) AS ?totalAmt) (COUNT(DISTINCT ?budget) AS ?cnt)
WHERE {
  ?budget a hrd:Budget ;
          hrd:fundedPrograms ?prog ;
          hrd:hasBudgetAmount ?amt .
  BIND(xsd:decimal(STR(?amt)) AS ?amtNum)
}
GROUP BY ?prog
ORDER BY DESC(?totalAmt)
""")
    groups = []
    for row in qr:
        prog_uri = row['prog']
        total = to_float(str(row['totalAmt']))
        cnt = int(str(row['cnt']))
        label = get_ko_label(g, prog_uri)

        budgets_q = list(g.subjects(HRD.fundedPrograms, prog_uri))
        budgets = [build_budget_detail(g, bu) for bu in budgets_q]
        budgets.sort(key=lambda x: x['amount'], reverse=True)

        groups.append({
            'key': label,
            'totalAmount': total,
            'totalAmountStr': fmt_won(total),
            'count': cnt,
            'budgets': budgets,
        })
    return groups


def extract_by_competency(g):
    """역량별 — group by competency category URI."""
    qr = run(g, """
SELECT ?cat (SUM(?amtNum) AS ?totalAmt) (COUNT(DISTINCT ?budget) AS ?cnt)
WHERE {
  ?budget a hrd:Budget ;
          hrd:fundedPrograms ?prog ;
          hrd:hasBudgetAmount ?amt .
  ?prog hrd:developsCompetencyCategory ?cat .
  BIND(xsd:decimal(STR(?amt)) AS ?amtNum)
}
GROUP BY ?cat
ORDER BY DESC(?totalAmt)
""")
    groups = []
    for row in qr:
        cat_uri = row['cat']
        total = to_float(str(row['totalAmt']))
        cnt = int(str(row['cnt']))
        label = get_ko_label(g, cat_uri)

        # budgets that have a funded program linked to this competency cat
        bq = run(g, f"""
SELECT DISTINCT ?budget WHERE {{
  ?budget a hrd:Budget ;
          hrd:fundedPrograms ?prog .
  ?prog hrd:developsCompetencyCategory <{cat_uri}> .
}}
""")
        budgets = [build_budget_detail(g, row2['budget']) for row2 in bq]
        budgets.sort(key=lambda x: x['amount'], reverse=True)

        groups.append({
            'key': label,
            'totalAmount': total,
            'totalAmountStr': fmt_won(total),
            'count': cnt,
            'budgets': budgets,
        })
    return groups


def extract_by_target(g):
    """대상별 — group by targetGroup URI."""
    qr = run(g, """
SELECT ?tg (SUM(?amtNum) AS ?totalAmt) (COUNT(DISTINCT ?budget) AS ?cnt)
WHERE {
  ?budget a hrd:Budget ;
          hrd:fundedPrograms ?prog ;
          hrd:hasBudgetAmount ?amt .
  ?prog hrd:targetGroup ?tg .
  BIND(xsd:decimal(STR(?amt)) AS ?amtNum)
}
GROUP BY ?tg
ORDER BY DESC(?totalAmt)
""")
    groups = []
    for row in qr:
        tg_uri = row['tg']
        total = to_float(str(row['totalAmt']))
        cnt = int(str(row['cnt']))
        label = tg_label(str(tg_uri))

        bq = run(g, f"""
SELECT DISTINCT ?budget WHERE {{
  ?budget a hrd:Budget ;
          hrd:fundedPrograms ?prog .
  ?prog hrd:targetGroup <{tg_uri}> .
}}
""")
        budgets = [build_budget_detail(g, row2['budget']) for row2 in bq]
        budgets.sort(key=lambda x: x['amount'], reverse=True)

        groups.append({
            'key': label,
            'totalAmount': total,
            'totalAmountStr': fmt_won(total),
            'count': cnt,
            'budgets': budgets,
        })
    return groups


def main():
    print("Loading RDF graph...", flush=True)
    g = rdflib.Graph()
    with contextlib.redirect_stderr(io.StringIO()):
        g.parse(RDF_PATH, format='xml')
    print(f"  {len(g)} triples loaded.", flush=True)

    output = {}

    for name, fn in [
        ('byOrg', extract_by_org),
        ('byPolicy', extract_by_policy),
        ('byStrategy', extract_by_strategy),
        ('byProgram', extract_by_program),
        ('byCompetency', extract_by_competency),
        ('byTarget', extract_by_target),
    ]:
        print(f"Extracting {name}...", flush=True)
        output[name] = fn(g)
        print(f"  {len(output[name])} groups", flush=True)

    out_path = Path(OUTPUT_PATH)
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(json.dumps(output, ensure_ascii=False, indent=2), encoding='utf-8')
    size_kb = out_path.stat().st_size / 1024
    print(f"\nSaved to {OUTPUT_PATH} ({size_kb:.1f} KB)", flush=True)


if __name__ == '__main__':
    main()
