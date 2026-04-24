# HRD Governance Platform — Phase 0 완료 보고서

> 작성일: 2026-04-24 · 브랜치: phase-0 → main 머지 완료  
> 저장소: https://github.com/doogiesdj/hrd-governance-platform-v3  
> 배포 URL: https://doogiesdj.github.io/hrd-governance-platform-v3/

---

## 개요

Phase 0의 목표는 **기반 정비(Baseline Stabilization)**였다.  
기존 v2 플랫폼을 분석하고, 온톨로지 품질을 개선하며, 코드 구조를 Phase 1 개발이 가능한 수준으로 정리하는 것이 전부였다.  
기능 추가는 Phase 0 범위 밖이다.

---

## 1. Phase 0 작업 항목 및 완료 현황

| # | 작업 | 상태 | 결과물 |
|---|------|------|--------|
| 0-1 | 현황 문서화 | ✅ 완료 | `docs/현황문서_baseline.md` |
| 0-2 | CI/CD 파이프라인 구축 | ✅ 완료 | `.github/workflows/ci.yml` |
| 0-3 | RDF 온톨로지 품질 검증 및 수정 | ✅ 완료 | `src/HRD_Governance_Extended_v3.rdf` |
| 0-4 | 전문가 평가 보고서 작성 | ✅ 완료 | `docs/hrd-platform-analysis-report.html` |
| 0-5 | 개선 로드맵 수립 | ✅ 완료 | `docs/hrd-platform-improvement-roadmap.html` |
| 0-6 | app.js 리팩토링 (뷰 모듈 분리) | ✅ 완료 | `js/views/` 디렉토리 (10개 파일) |
| 0-7 | GitHub Pages 배포 설정 | ✅ 완료 | `main` 브랜치 → GitHub Pages |

---

## 2. 세부 작업 내용

### 2-1. 현황 문서화 (Baseline)

Phase 0 착수 시점의 플랫폼 현황을 문서로 고정했다.

**주요 내용:**
- 파일 구조 및 JS 모듈 의존성 다이어그램
- RDF 온톨로지 통계 (클래스 171개, 트리플 64,343개)
- 구현 기능 목록 및 미구현 항목 분류
- 코드 품질 현황 (`app.js` 2,684줄 → 리팩토링 대상으로 식별)

---

### 2-2. CI/CD 파이프라인

`.github/workflows/ci.yml` — `main`, `phase-*` 브랜치 push/PR 시 자동 실행.

**검증 단계:**

| 단계 | 내용 |
|------|------|
| JSON 유효성 | `data/*.json` 파싱 오류 감지 |
| RDF 온톨로지 로드 | rdflib으로 v3.rdf 파싱, 클래스 수(>100) / 트리플 수(>10,000) 하한선 확인 |
| 시크릿 스캔 | `ghp_`, `sk-ant-`, `AIza`, `AKIA` 패턴 감지 → 하드코딩 차단 |
| JS 파일 크기 | 800줄 초과 경고, 1,600줄 초과 오류 |

---

### 2-3. RDF 온톨로지 v2 → v3

**버전 분리 전략:**
- `src/HRD_Governance_Extended_v2.rdf` — 수정 전 원본 보존 (히스토리 참조용)
- `src/HRD_Governance_Extended_v3.rdf` — Phase 0 수정본 (현재 마스터)

**v3에서 수정된 항목:**

| 분류 | 내용 |
|------|------|
| URI 일관성 | 말형성 URI(`{http:/...}` 경고) 정리 |
| 익명 클래스 | Blank Node Class 2개 제거 |
| Domain/Range | 8개 ObjectProperty에 Domain 추가, 4개에 Range 추가 |
| 구조 정합성 | Phase 0 RDF quality fixes 적용 |

**v3 최종 통계:**

| 항목 | 수치 |
|------|------|
| OWL Class | 171개 |
| Object Property | 202개 |
| Datatype Property | 93개 |
| Named Individual | 5,896개 |
| 총 트리플 | 64,343개 |

**잔여 이슈 (Phase 1 대상):**
- Domain 누락 속성 8개 (`collaboratesWith`, `relatedToCompetency` 등)
- Range 누락 속성 4개
- 시간 속성 `hasStartDate` / `hasEndDate` 미정의
- OWL DL 일관성 검증 — HermiT/Pellet Reasoner 실행 필요

---

### 2-4. app.js 리팩토링 — 핵심 작업

Phase 0의 가장 큰 기술 작업. `app.js` 단일 파일(2,684줄)을 10개 모듈로 분리했다.

#### 분리 전 / 후 비교

| 항목 | 분리 전 | 분리 후 |
|------|--------|--------|
| app.js | 2,684줄 ⚠️ | **108줄** ✅ |
| 파일 수 | 1개 | 11개 (app.js + 10개 뷰) |
| CI 상태 | 오류 (1,600줄 초과) | **전체 통과** ✅ |

#### 생성된 뷰 모듈 목록

| 파일 | 줄 수 | 담당 기능 |
|------|-------|----------|
| `js/views/helpers.js` | 73 | 공통 유틸 (formatNumber, renderEmptyState 등) |
| `js/views/detail-panel.js` | 68 | 우측 상세 패널 초기화 및 열기/닫기 |
| `js/views/sparql.js` | 122 | SPARQL 탐색기 뷰 |
| `js/views/shared-detail.js` | 498 | 전략/정책/조직/프로그램/역량 공용 상세 패널 |
| `js/views/strategy.js` | 58 | 전략 뷰 (`_renderStrategy`) |
| `js/views/policy.js` | 161 | 정책 뷰 + 차트 + 그룹 팝업 |
| `js/views/budget.js` | 359 | 예산 뷰 + D3 차트 + 상세 패널 |
| `js/views/program.js` | 279 | 프로그램 뷰 + 필터 + 상세 패널 |
| `js/views/talent.js` | 574 | 인재 뷰 + 레이더 차트 + 조직/대상 상세 |
| `js/views/competency.js` | 365 | 역량 뷰 + 도넛 차트 + L2/L3 그룹 |

#### 아키텍처 원칙 (ES 모듈 없는 정적 SPA)

```
[스크립트 로드 순서 — index.html]

데이터 레이어:  ontology_data.js → budget_data.js → data.js
코어:           app.js           (const App = {} 정의)
뷰 확장:        views/helpers.js
                views/detail-panel.js
                views/sparql.js
                views/shared-detail.js
                views/strategy.js
                views/policy.js
                views/budget.js    ← program.js가 _pushBudgetDetail 호출
                views/program.js
                views/talent.js
                views/competency.js
그래프:         graph.js → ontograf.js → protegraf.js → nlq.js → coderef.js

[패턴]
- app.js가 const App = {} 선언 (반드시 첫 번째)
- 각 뷰 파일: Object.assign(App, { ... }) 로 메서드 확장
- DOMContentLoaded는 app.js 마지막 줄에서 1회만 등록
- init()은 모든 스크립트 파싱 완료 후 실행 → 모든 Object.assign 반영됨
```

---

### 2-5. GitHub 저장소 구조

| 저장소 | 용도 |
|--------|------|
| `doogiesdj/hrd-governance-platform` | v2 원본 보존 (변경 없음) |
| `doogiesdj/hrd-governance-platform-v3` | **현재 작업 저장소** |

**브랜치 전략:**

```
main          ← GitHub Pages 배포 기준 (Phase 0 완료 상태)
phase-0       ← Phase 0 작업 브랜치 (main에 머지 완료)
phase-1       ← Phase 1 작업 시 신규 생성 예정
```

---

## 3. 파일 구조 최종 현황

```
platform/
├── index.html                          # SPA 진입점 (스크립트 로드 순서 업데이트됨)
├── css/
│   └── style.css                       # 전체 스타일 (Phase 1에서 분리 예정)
├── js/
│   ├── app.js                          # 코어 108줄 (init, nav, clock)
│   ├── views/                          # Phase 0 신규 생성
│   │   ├── helpers.js                  # 73줄
│   │   ├── detail-panel.js             # 68줄
│   │   ├── sparql.js                   # 122줄
│   │   ├── shared-detail.js            # 498줄
│   │   ├── strategy.js                 # 58줄
│   │   ├── policy.js                   # 161줄
│   │   ├── budget.js                   # 359줄
│   │   ├── program.js                  # 279줄
│   │   ├── talent.js                   # 574줄
│   │   └── competency.js               # 365줄
│   ├── ontology_data.js                # RDF 파싱 빌드 산출물
│   ├── budget_data.js                  # 예산 데이터 빌드 산출물
│   ├── data.js                         # 공통 데이터 유틸
│   ├── graph.js                        # D3 공통 유틸
│   ├── ontograf.js                     # 온톨로지 포스 그래프
│   ├── protegraf.js                    # 프로테제 스타일 그래프
│   ├── nlq.js                          # 자연어 질의 (Claude/Gemini)
│   └── coderef.js                      # 코드 참조 뷰어
├── data/
│   ├── ontology.json
│   ├── budget_analysis.json
│   ├── code_reference.json
│   └── sparql_results.json
├── docs/
│   ├── 현황문서_baseline.md             # Phase 0 착수 시점 스냅샷
│   ├── 온톨로지 품질검증_ontology-quality-report.md
│   ├── phase-0-complete.md             # ← 이 문서
│   ├── hrd-platform-analysis-report.html
│   └── hrd-platform-improvement-roadmap.html
├── scripts/
│   ├── parse_full_ontology.py
│   ├── extract_budget_analysis.py
│   ├── extract_code_reference.py
│   ├── run_sparql_queries.py
│   └── requirements.txt
├── src/
│   ├── HRD_Governance_Extended_v2.rdf  # 원본 보존
│   ├── HRD_Governance_Extended_v3.rdf  # 현재 마스터
│   ├── HRD_CodeMapping_v2.xlsx
│   └── HRD_SPARQL_Queries_v5.sparql
├── .env.example
├── .gitignore
└── .github/
    └── workflows/
        ├── ci.yml                      # Phase 0 신규
        └── build-data.yml
```

---

## 4. Phase 1 진입 조건 체크리스트

Phase 0 완료 기준으로 Phase 1을 시작할 수 있는 상태인지 확인한다.

| 항목 | 상태 |
|------|------|
| CI 파이프라인 통과 | ✅ |
| app.js 800줄 이하 | ✅ (108줄) |
| 모든 뷰 모듈 파일 800줄 이하 | ✅ (최대 574줄) |
| RDF v3 파일 존재 및 검증 통과 | ✅ |
| GitHub Pages 배포 확인 | ✅ (Settings에서 활성화 후) |
| 현황 문서 고정 | ✅ |
| 시크릿 하드코딩 없음 | ✅ |

---

## 5. Phase 1 예정 작업 (참고)

Phase 1의 구체적인 태스크는 별도 phase-1 브랜치 착수 시 계획한다.

| 우선순위 | 작업 | 분류 |
|---------|------|------|
| 높음 | 역량 갭 히트맵 (기관 × 역량 매트릭스) | 시각화 |
| 높음 | Sankey 다이어그램 (예산→정책→프로그램→역량 흐름) | 시각화 |
| 중간 | RDF Domain/Range 잔여 누락 8건 보완 | 온톨로지 |
| 중간 | style.css 뷰별 분리 (`css/views/`) | 리팩토링 |
| 중간 | ontograf.js / protegraf.js 800줄 이하로 분리 | 리팩토링 |
| 낮음 | 온톨로지 정합도 점수 대시보드 | 분석 |
| 낮음 | 정책-프로그램 워크플로우 다이어그램 | 시각화 |

---

*문서 끝 — Phase 0 완료 2026-04-24*
