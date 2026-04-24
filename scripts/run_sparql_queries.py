"""
Run all SPARQL queries from HRD_SPARQL_Queries_v5.sparql against the RDF ontology
and save results as JSON for use in the static platform.
"""
import json
import re
import sys
import io
import contextlib
import threading
from pathlib import Path

import rdflib

_SCRIPTS_DIR = Path(__file__).parent
_REPO_ROOT = _SCRIPTS_DIR.parent
RDF_PATH = str(_REPO_ROOT / "src" / "HRD_Governance_Extended_v3.rdf")
SPARQL_PATH = str(_REPO_ROOT / "src" / "HRD_SPARQL_Queries_v5.sparql")
OUTPUT_PATH = str(_REPO_ROOT / "data" / "sparql_results.json")

MAX_ROWS = 500   # cap per query to limit file size
QUERY_TIMEOUT = 30  # seconds per query

CATEGORY_LABELS = {
    'A': {'ko': '기본 조회', 'en': 'Basic Query'},
    'B': {'ko': '인재 분석', 'en': 'Talent Analysis'},
    'C': {'ko': '역량 분석', 'en': 'Competency Analysis'},
    'D': {'ko': '역량 격차·평가', 'en': 'Competency Gap & Assessment'},
    'E': {'ko': '교육프로그램 분석', 'en': 'Education Program Analysis'},
    'F': {'ko': '추천 시스템', 'en': 'Recommendation System'},
    'G': {'ko': '정책 분석', 'en': 'Policy Analysis'},
    'H': {'ko': '성과 분석', 'en': 'Outcome Analysis'},
    'I': {'ko': '예산 분석', 'en': 'Budget Analysis'},
    'J': {'ko': '거버넌스 체인', 'en': 'Governance Chain'},
    'K': {'ko': '통계·집계', 'en': 'Statistics & Aggregation'},
    'L': {'ko': '고급 패턴', 'en': 'Advanced Patterns'},
}

PREFIXES = """PREFIX hrd:  <http://www.human-resource.go.kr/ontology/hrd#>
PREFIX rdf:  <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
PREFIX owl:  <http://www.w3.org/2002/07/owl#>
PREFIX xsd:  <http://www.w3.org/2001/XMLSchema#>
"""


def parse_sparql_file(path):
    """Parse the SPARQL file and extract individual queries with metadata."""
    # Try multiple encodings
    text = None
    for enc in ('utf-8', 'utf-8-sig', 'cp949', 'euc-kr'):
        try:
            text = Path(path).read_text(encoding=enc)
            break
        except Exception:
            continue
    if text is None:
        raise RuntimeError(f"Cannot read {path}")

    queries = []
    pattern = re.compile(
        r'#\s*[─\-─]+\s*([A-L]\d+)\.\s*(.+?)\s*[─\-─]+\s*\n(.*?)(?=#\s*[─\-─]+\s*[A-L]\d+\.|#\s*[═=]{4,}|\Z)',
        re.DOTALL
    )

    for m in pattern.finditer(text):
        qid = m.group(1).strip()
        title = m.group(2).strip()
        body = m.group(3).strip()

        body_lines = [l for l in body.split('\n') if not l.strip().startswith('#')]
        body = '\n'.join(body_lines).strip()

        if not body:
            continue

        cat = qid[0]
        queries.append({
            'id': qid,
            'category': cat,
            'title': title,
            'sparql': PREFIXES + '\n' + body,
        })

    return queries


def val_to_str(val):
    if val is None:
        return None
    if isinstance(val, rdflib.term.URIRef):
        s = str(val)
        s = s.replace('http://www.human-resource.go.kr/ontology/hrd#', 'hrd:')
        return s
    if isinstance(val, rdflib.term.Literal):
        return str(val)
    return str(val)


def _execute_query(g, sparql_text, result_holder):
    """Run in a thread; stores result in result_holder[0]."""
    try:
        stderr_buf = io.StringIO()
        with contextlib.redirect_stderr(stderr_buf):
            qres = g.query(sparql_text)
        cols = [str(v) for v in qres.vars]
        rows = []
        for row in qres:
            if len(rows) >= MAX_ROWS:
                break
            cells = []
            for v in qres.vars:
                try:
                    cells.append(val_to_str(row[v]))
                except Exception:
                    cells.append(None)
            rows.append(cells)
        result_holder[0] = {'columns': cols, 'rows': rows, 'error': None,
                            'truncated': len(rows) == MAX_ROWS}
    except Exception as e:
        result_holder[0] = {'columns': [], 'rows': [], 'error': str(e), 'truncated': False}


def run_query(g, sparql_text):
    result_holder = [None]
    t = threading.Thread(target=_execute_query, args=(g, sparql_text, result_holder), daemon=True)
    t.start()
    t.join(timeout=QUERY_TIMEOUT)
    if t.is_alive():
        return {'columns': [], 'rows': [], 'error': f'Timeout ({QUERY_TIMEOUT}s)', 'truncated': False}
    if result_holder[0] is None:
        return {'columns': [], 'rows': [], 'error': 'No result', 'truncated': False}
    return result_holder[0]


# Fixed SPARQL for queries that had errors or returned 0 rows.
# Keys match query IDs; values replace the parsed body from the .sparql file.
QUERY_OVERRIDES = {
    # B6: wrong URI PERSON_1 → use PERSON_01; restructured as full resume via UNION
    'B6': PREFIXES + """
SELECT ?section ?predicate ?value
WHERE {
  {
    BIND("1. 경력" AS ?section)
    hrd:PERSON_01 hrd:hasCareerHistory ?career .
    ?career ?predProp ?value .
    BIND(REPLACE(STR(?predProp), ".*#", "") AS ?predicate)
    FILTER(isLiteral(?value))
  } UNION {
    BIND("2. 역량" AS ?section)
    hrd:PERSON_01 hrd:hasCompetencyRecord ?crec .
    ?crec ?predProp ?value .
    BIND(REPLACE(STR(?predProp), ".*#", "") AS ?predicate)
    FILTER(isLiteral(?value))
  } UNION {
    BIND("3. 역량평가" AS ?section)
    hrd:PERSON_01 hrd:hasCompetencyAssessment ?asmnt .
    ?asmnt ?predProp ?value .
    BIND(REPLACE(STR(?predProp), ".*#", "") AS ?predicate)
    FILTER(isLiteral(?value))
  } UNION {
    BIND("4. 추천" AS ?section)
    hrd:PERSON_01 hrd:receivesRecommendation ?rec .
    ?rec ?predProp ?value .
    BIND(REPLACE(STR(?predProp), ".*#", "") AS ?predicate)
    FILTER(isLiteral(?value))
  } UNION {
    BIND("5. 성과" AS ?section)
    hrd:PERSON_01 hrd:achievesOutcome ?out .
    ?out ?predProp ?value .
    BIND(REPLACE(STR(?predProp), ".*#", "") AS ?predicate)
    FILTER(isLiteral(?value))
  }
}
ORDER BY ?section ?predicate
""",

    # G6: benefitAmount stored as untyped string Literal → coerce with xsd:decimal
    'G6': PREFIXES + """
SELECT ?policyName ?benefitType (SUM(?amtNum) AS ?totalBenefit) (COUNT(?benefit) AS ?cnt)
WHERE {
  ?policy a hrd:Policy ;
          rdfs:label ?policyName ;
          hrd:providesBenefit ?benefit .
  ?benefit hrd:benefitType ?benefitType ;
           hrd:benefitAmount ?amount .
  BIND(xsd:decimal(STR(?amount)) AS ?amtNum)
}
GROUP BY ?policyName ?benefitType
ORDER BY DESC(?totalBenefit)
""",

    # I2: totalAmount / executedAmount are untyped string Literals → coerce
    'I2': PREFIXES + """
SELECT ?budgetID ?policyName (SUM(?totalNum) AS ?sumTotal) (SUM(?execNum) AS ?sumExecuted)
WHERE {
  ?budget a hrd:Budget ;
          rdfs:label ?budgetID ;
          hrd:totalAmount ?total ;
          hrd:executedAmount ?executed .
  OPTIONAL { ?policy hrd:allocatesBudget ?budget ; rdfs:label ?policyName . }
  BIND(xsd:decimal(STR(?total)) AS ?totalNum)
  BIND(xsd:decimal(STR(?executed)) AS ?execNum)
}
GROUP BY ?budgetID ?policyName
ORDER BY DESC(?sumTotal)
""",

    # I4: same untyped literal issue
    'I4': PREFIXES + """
SELECT ?category (SUM(?totalNum) AS ?totalBudget) (AVG(?totalNum) AS ?avgBudget) (COUNT(?budget) AS ?cnt)
WHERE {
  ?budget a hrd:Budget ;
          hrd:totalAmount ?total .
  OPTIONAL { ?budget hrd:budgetCategory ?category . }
  BIND(xsd:decimal(STR(?total)) AS ?totalNum)
}
GROUP BY ?category
ORDER BY DESC(?totalBudget)
""",

    # I5: same untyped literal issue
    'I5': PREFIXES + """
SELECT ?budgetID ?policyName ?totalNum ?execNum
       (IF(?totalNum > 0, ROUND((?execNum / ?totalNum) * 100 * 10) / 10, 0) AS ?execRate)
WHERE {
  {
    SELECT ?budget ?budgetID ?policyName ?totalNum ?execNum WHERE {
      ?budget a hrd:Budget ;
              rdfs:label ?budgetID ;
              hrd:totalAmount ?total ;
              hrd:executedAmount ?executed .
      OPTIONAL { ?policy hrd:allocatesBudget ?budget ; rdfs:label ?policyName . }
      BIND(xsd:decimal(STR(?total)) AS ?totalNum)
      BIND(xsd:decimal(STR(?executed)) AS ?execNum)
    }
  }
}
ORDER BY DESC(?execRate)
""",

    # K4: correct properties: gapForPerson, gapCompetency, gapSeverity (gapScore doesn't exist)
    'K4': PREFIXES + """
SELECT ?catLabel (COUNT(DISTINCT ?person) AS ?personCount) (AVG(?gapSeverity) AS ?avgSeverity)
WHERE {
  ?gap a hrd:CompetencyGap ;
       hrd:gapForPerson ?person ;
       hrd:gapCompetency ?cat ;
       hrd:gapSeverity ?gapSeverity .
  ?cat rdfs:label ?catLabel .
}
GROUP BY ?catLabel
ORDER BY DESC(?avgSeverity)
""",

    # K6: outcomeValue has malformed xsd datatype → coerce via STR
    'K6': PREFIXES + """
SELECT ?outcomeType (COUNT(?outcome) AS ?cnt) (SUM(?valNum) AS ?total) (AVG(?valNum) AS ?avg)
WHERE {
  ?outcome a hrd:Outcome ;
           hrd:outcomeType ?outcomeType ;
           hrd:outcomeValue ?val .
  BIND(xsd:decimal(STR(?val)) AS ?valNum)
}
GROUP BY ?outcomeType
ORDER BY DESC(?total)
""",

    # L2: recommendsPerson doesn't exist; correct prop is recommendedToPerson.
    #     Also filter for non-completed enrollments (in_progress/enrolled)
    'L2': PREFIXES + """
SELECT ?personName ?programName
WHERE {
  ?rec a hrd:Recommendation ;
       hrd:recommendedToPerson ?person ;
       hrd:recommendsProgram ?prog .
  ?person rdfs:label ?personName .
  ?prog rdfs:label ?programName .
  FILTER NOT EXISTS {
    ?enroll hrd:enrolledPerson ?person ;
            hrd:enrolledProgram ?prog ;
            hrd:completionStatus ?cs .
    FILTER(?cs IN ("수료완료", "completed"))
  }
}
ORDER BY ?personName
LIMIT 100
""",

    # L5: wrong property names; correct: participationOfPerson, participationInPolicy
    'L5': PREFIXES + """
SELECT ?personName (COUNT(DISTINCT ?policy) AS ?policyCount) (GROUP_CONCAT(DISTINCT ?policyName; separator=", ") AS ?policies)
WHERE {
  ?participation a hrd:PolicyParticipation ;
                 hrd:participationOfPerson ?person ;
                 hrd:participationInPolicy ?policy .
  ?person rdfs:label ?personName .
  ?policy rdfs:label ?policyName .
}
GROUP BY ?personName ?person
HAVING (COUNT(DISTINCT ?policy) >= 1)
ORDER BY DESC(?policyCount)
LIMIT 100
""",

    # L7: completionStatus "완료" doesn't match; actual values are "수료완료", "completed"
    'L7': PREFIXES + """
SELECT ?personName ?programName ?completionStatus ?enrollDate
WHERE {
  ?enroll a hrd:ProgramEnrollment ;
          hrd:enrolledPerson ?person ;
          hrd:enrolledProgram ?prog ;
          hrd:completionStatus ?completionStatus .
  FILTER(?completionStatus IN ("수료완료", "completed"))
  ?person rdfs:label ?personName .
  ?prog rdfs:label ?programName .
  OPTIONAL { ?enroll hrd:enrollmentDate ?enrollDate . }
}
ORDER BY ?personName
LIMIT 100
""",

    # L8: class is NationalStrategy (not Strategy); link is isAlignedWithProgram from strategy to program
    'L8': PREFIXES + """
SELECT ?strategyName ?programName ?strategyPriority
WHERE {
  ?strategy a hrd:NationalStrategy ;
            rdfs:label ?strategyName ;
            hrd:strategyPriority ?strategyPriority ;
            hrd:isAlignedWithProgram ?prog .
  FILTER(xsd:integer(STR(?strategyPriority)) <= 3)
  ?prog rdfs:label ?programName .
}
ORDER BY xsd:integer(STR(?strategyPriority)) ?strategyName
""",
}


def main():
    print("Loading RDF graph...", flush=True)
    g = rdflib.Graph()
    with contextlib.redirect_stderr(io.StringIO()):
        g.parse(RDF_PATH, format='xml')
    print(f"  {len(g)} triples loaded.", flush=True)

    print("Parsing SPARQL queries...", flush=True)
    queries = parse_sparql_file(SPARQL_PATH)
    print(f"  {len(queries)} queries found.", flush=True)

    output = {
        'categories': [],
        'queries': {},
    }
    cat_map = {}

    for q in queries:
        cat = q['category']
        if cat not in cat_map:
            cat_map[cat] = {
                'id': cat,
                'label': CATEGORY_LABELS.get(cat, {}).get('ko', cat),
                'labelEn': CATEGORY_LABELS.get(cat, {}).get('en', cat),
                'queries': [],
            }
            output['categories'].append(cat_map[cat])
        cat_map[cat]['queries'].append({'id': q['id'], 'title': q['title']})

        try:
            print(f"  Running {q['id']}: {q['title'][:40]}...", end=' ', flush=True)
        except Exception:
            print(f"  Running {q['id']}...", end=' ', flush=True)

        sparql_text = QUERY_OVERRIDES.get(q['id'], q['sparql'])
        res = run_query(g, sparql_text)

        if res['error']:
            print(f"ERROR: {res['error'][:60]}", flush=True)
        else:
            trunc = ' (truncated)' if res.get('truncated') else ''
            print(f"OK ({len(res['rows'])} rows){trunc}", flush=True)

        output['queries'][q['id']] = {
            'id': q['id'],
            'category': q['category'],
            'title': q['title'],
            'sparql': sparql_text,
            'result': res,
        }

    out_path = Path(OUTPUT_PATH)
    out_path.parent.mkdir(parents=True, exist_ok=True)

    def default_serial(obj):
        return str(obj) if obj is not None else None

    json_text = json.dumps(output, ensure_ascii=False, indent=2, default=default_serial)
    out_path.write_text(json_text, encoding='utf-8')
    size_kb = out_path.stat().st_size / 1024
    print(f"\nSaved to {OUTPUT_PATH} ({size_kb:.1f} KB)", flush=True)


if __name__ == '__main__':
    main()
