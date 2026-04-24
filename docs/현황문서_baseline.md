# HRD Governance Platform — Baseline Documentation

> Phase 0-1 결과물 · 작성일: 2026-04-24 · 브랜치: phase-0

---

## 1. 파일 구조

```
platform/
├── index.html              # 단일 HTML 진입점 (SPA 쉘)
├── css/
│   └── style.css           # 전체 스타일 (3,157줄)
├── js/
│   ├── ontology_data.js    # RDF 파싱 결과 정적 JS 객체 (빌드 산출물)
│   ├── budget_data.js      # 예산 데이터 정적 JS 객체
│   ├── data.js             # 공통 데이터 유틸리티 (96줄)
│   ├── graph.js            # D3 그래프 공통 유틸리티 (380줄)
│   ├── app.js              # 메인 앱 컨트롤러 ⚠️ (2,684줄)
│   ├── ontograf.js         # 온톨로지 포스 그래프 (917줄)
│   ├── protegraf.js        # 프로테제 스타일 그래프 (823줄)
│   ├── nlq.js              # 자연어 질의 (Claude/Gemini) (382줄)
│   └── coderef.js          # 코드 참조 뷰어 (163줄)
├── data/
│   ├── ontology.json       # 온톨로지 구조 (scripts/parse_full_ontology.py 생성)
│   ├── budget_analysis.json # 예산 분석 (scripts/extract_budget_analysis.py 생성)
│   ├── code_reference.json # 코드 참조 (scripts/extract_code_reference.py 생성)
│   └── sparql_results.json # SPARQL 쿼리 결과 (scripts/run_sparql_queries.py 생성)
├── docs/
│   ├── baseline.md                       # ← 이 문서
│   ├── ontology-quality-report.md        # Phase 0-3 산출물
│   ├── hrd-platform-analysis-report.html # 전문가 평가 보고서
│   └── hrd-platform-improvement-roadmap.html # 개선 로드맵
├── scripts/
│   ├── parse_full_ontology.py    # RDF → ontology.json 변환
│   ├── extract_budget_analysis.py # RDF → budget_analysis.json 변환
│   ├── extract_code_reference.py # Excel → code_reference.json 변환
│   ├── run_sparql_queries.py     # SPARQL 실행 → sparql_results.json 변환
│   └── requirements.txt          # Python 의존성 (rdflib>=6.0.0, openpyxl>=3.0.0)
└── src/
    ├── HRD_Governance_Extended_v2.rdf  # 마스터 온톨로지
    ├── HRD_CodeMapping_v2.xlsx         # 코드 매핑 원본 Excel
    └── HRD_SPARQL_Queries_v5.sparql    # SPARQL 쿼리 모음
```

---

## 2. JS 모듈 의존성 다이어그램

```
index.html (SPA shell)
│
├── [전역 스크립트 로드 순서]
│   ①  ontology_data.js  → window.ONTOLOGY_DATA (빌드 산출물)
│   ②  budget_data.js    → window.BUDGET_DATA
│   ③  data.js           → window.DataUtils
│   ④  graph.js          → window.GraphUtils   ← ontograf.js, protegraf.js 의존
│   ⑤  app.js            → window.App          ← 모든 뷰 렌더링 담당
│   ⑥  ontograf.js       → window.OntoGraf     ← app.js에서 호출
│   ⑦  protegraf.js      → window.ProteGraf    ← app.js에서 호출
│   ⑧  nlq.js            → window.NLQ          ← app.js에서 호출
│   └── coderef.js       → window.CodeRef      ← app.js에서 호출
│
└── [외부 CDN 의존성]
    ├── D3.js v7 (포스 그래프, 차트)
    ├── marked.js (마크다운 렌더링)
    └── (없음: jQuery, React, Vue 미사용)

⚠️ 주의: ES 모듈(import/export) 미사용 — 전체 전역 네임스페이스 오염 위험
⚠️ 주의: 번들러 없음 — 스크립트 로드 순서가 곧 의존성 순서
```

---

## 3. RDF 온톨로지 통계

| 항목 | 수치 |
|------|------|
| 클래스 (OWL Class) | 171 |
| 오브젝트 속성 (Object Property) | 202 |
| 데이터 속성 (Datatype Property) | 93 |
| 개체 (Named Individual) | 5,896 |
| 총 트리플 | 64,343 |
| 최상위 클래스 (subClassOf 없음) | 28 |

### 주요 최상위 클래스

| 클래스명 | 설명 |
|----------|------|
| Organization | 기관 (부처, 위원회 등) |
| Policy | 정책 |
| Budget | 예산 |
| EducationProgram | 교육 훈련 프로그램 |
| HumanResource | 인적 자원 |
| Competency | 역량 |
| NationalStrategy | 국가 전략 |
| StrategicGoal | 전략 목표 |
| Occupation | 직종 |
| Certification | 자격증 |
| Outcome | 성과 |
| Region | 지역 |
| Event | 이벤트 |

### 정적 JSON ↔ 생성 스크립트 매핑

| JSON 파일 | 생성 스크립트 | 소스 파일 |
|-----------|--------------|-----------|
| data/ontology.json | scripts/parse_full_ontology.py | src/HRD_Governance_Extended_v2.rdf |
| data/budget_analysis.json | scripts/extract_budget_analysis.py | src/HRD_Governance_Extended_v2.rdf |
| data/code_reference.json | scripts/extract_code_reference.py | src/HRD_CodeMapping_v2.xlsx |
| data/sparql_results.json | scripts/run_sparql_queries.py | src/HRD_SPARQL_Queries_v5.sparql |
| js/ontology_data.js | scripts/parse_full_ontology.py | src/HRD_Governance_Extended_v2.rdf |
| js/budget_data.js | scripts/extract_budget_analysis.py | src/HRD_Governance_Extended_v2.rdf |

> **빌드 명령어**: `cd scripts && pip install -r requirements.txt && python parse_full_ontology.py`

---

## 4. 기능 목록 (구현 현황)

### ✅ 구현됨

| 뷰 | 기능 | 파일 |
|----|------|------|
| 전략 (strategy) | 국가 HRD 전략 목록, 필터, 상세 패널 | app.js |
| 정책 (policy) | 정책 목록, 다중 필터, 그룹핑, 상세 패널 | app.js |
| 예산 (budget) | 예산 분석, D3 차트, 기관별/전략별 필터 | app.js |
| 프로그램 (program) | 교육 프로그램 목록, 필터, 연계 표시 | app.js |
| 인재 (talent) | 인력 현황, 역량 갭 연계 | app.js |
| 역량 (competency) | 역량 갭 목록 (1,248개), 기관별/분류별 필터 | app.js |
| 온톨로지 (ontology) | 클래스 계층 트리, 속성 목록, 통계 | app.js |
| SPARQL | 쿼리 실행 (정적 결과), NLQ 연동 | app.js |
| 온토그래프 (ontograf) | D3 포스 그래프, 좌측 클래스 패널 | ontograf.js |
| 프로테그래프 (protegraf) | 프로테제 스타일 그래프, 좌측 트리 패널 | protegraf.js |
| 코드 참조 (coderef) | NCS/KSC/O*NET 코드 검색, 탭 분류 | coderef.js |
| NLQ | 자연어 질의 (Claude/Gemini API) | nlq.js |

### ⚠️ 부분 구현

| 기능 | 현황 | 미구현 부분 |
|------|------|------------|
| SPARQL 실행 | 정적 JSON 반환 | 실시간 SPARQL 엔드포인트 없음 |
| NLQ | API 직접 호출 (CORS 이슈 가능) | 서버사이드 프록시 없음 |
| 역량 갭 시각화 | 목록만 표시 | 히트맵, Sankey 다이어그램 미구현 |
| 정책 워크플로우 | 정적 텍스트 | 인과관계 다이어그램 미구현 |

### ❌ 미구현

| 기능 | Phase 계획 |
|------|-----------|
| 역량 갭 히트맵 (기관 × 역량) | Phase 1-1 |
| Sankey 다이어그램 (예산→정책→프로그램→역량) | Phase 1-2 |
| 온톨로지 정합도 점수 | Phase 1-3 |
| 정책-프로그램 워크플로우 뷰 | Phase 1-4 |
| 실시간 SPARQL (Apache Jena Fuseki) | Phase 2-1 |
| SWRL 추론 규칙 | Phase 2-2 |
| Text2SPARQL (LLM 기반) | Phase 2-3 |
| 이벤트 드리븐 파이프라인 | Phase 2-4 |
| 학습 로드맵 자동 생성 | Phase 3-1 |
| 정책 시뮬레이션 | Phase 3-2 |
| 설명 가능 AI (XAI) | Phase 3-3 |
| 역할 기반 뷰 | Phase 3-4 |

---

## 5. GitHub Pages 배포 파이프라인

```
[로컬 개발]
  │
  ├── RDF 수정 (src/HRD_Governance_Extended_v2.rdf)
  │   └── python scripts/parse_full_ontology.py → js/ontology_data.js 갱신
  │
  ├── JS/CSS 수정 (platform/js/*.js, platform/css/*.css)
  │
  └── git push origin main
        │
        └── GitHub Pages (자동 배포)
              └── https://doogiesdj.github.io/hrd-governance-platform/

⚠️ 현재 이슈:
- 빌드 파이프라인 없음: RDF 수정 후 스크립트 수동 실행 필요
- CI/CD 없음: push 후 자동 검증 없음 (Phase 0-2에서 추가 예정)
- 환경 변수 없음: API 키를 localStorage에 직접 저장
```

---

## 6. 코드 품질 현황

| 파일 | 줄 수 | 상태 |
|------|-------|------|
| app.js | 2,684 | ⚠️ 리팩토링 필요 (800줄 초과) |
| style.css | 3,157 | ⚠️ 분리 권장 |
| ontograf.js | 917 | ⚠️ 800줄 초과 |
| protegraf.js | 823 | 경계 수준 |
| nlq.js | 382 | ✅ 양호 |
| graph.js | 380 | ✅ 양호 |
| coderef.js | 163 | ✅ 양호 |
| data.js | 96 | ✅ 양호 |

> **최우선 리팩토링 대상**: `app.js` (2,684줄) — 각 뷰별 파일로 분리 필요
> Phase 1 작업 전에 `js/views/` 디렉토리로 분리 권장
