# HRD 온톨로지 품질 검증 보고서

> Phase 0-3 결과물 · 작성일: 2026-04-24 · 분석 대상: src/HRD_Governance_Extended_v3.rdf

---

## 요약

| 항목 | 현황 |
|------|------|
| OWL DL 일관성 | 자동 분석 통과 (Protégé Desktop에서 HermiT/Pellet 실행 권장) |
| Domain 누락 ObjectProperty | **8개** ⚠️ |
| Range 누락 ObjectProperty | **4개** ⚠️ |
| 익명 클래스 (Blank Node) | **2개** 발견 ⚠️ |
| 시간 속성 (hasStartDate/hasEndDate) | **미정의** — 추가 검토 필요 |
| URI 말형성 | rdflib 로드 시 `{http:/...}` 경고 확인됨 ⚠️ |

---

## 1. Domain/Range 누락 속성

### 1-1. Domain 누락 (8개)

이 속성들은 어떤 클래스의 주어에 사용되는지 명시되지 않아, 추론 엔진이 자동 분류를 수행할 수 없습니다.

| 속성명 | 추천 Domain | 비고 |
|--------|------------|------|
| `collaboratesWith` | Organization | 기관 간 협업 관계 |
| `isCompetencyReflectedIn` | Competency | 역량이 반영된 대상 |
| `isFundedByOrganization` | Budget 또는 EducationProgram | 재원 출처 |
| `relatedToCompetency` | Policy 또는 EducationProgram | 역량 연관 관계 |
| `requiresCertification` | Occupation 또는 HumanResource | 자격 요건 |
| `requiresCompetency` | Occupation 또는 EducationProgram | 필요 역량 |
| `seeksCompetency` | HumanResource | 구직자 희망 역량 |
| `targets` | Policy 또는 EducationProgram | 대상 지정 |

### 1-2. Range 누락 (4개)

| 속성명 | 추천 Range | 비고 |
|--------|-----------|------|
| `isCompetencyReflectedIn` | Policy 또는 EducationProgram | |
| `isFundedByOrganization` | Organization | |
| `relatedToCompetency` | Competency | |
| `targets` | HumanResource 또는 Organization | |

### 수정 방법 (RDF/XML)

```xml
<!-- 예시: requiresCompetency 속성에 Domain/Range 추가 -->
<owl:ObjectProperty rdf:about="http://www.human-resource.go.kr/ontology/hrd#requiresCompetency">
  <rdfs:domain rdf:resource="http://www.human-resource.go.kr/ontology/hrd#Occupation"/>
  <rdfs:range rdf:resource="http://www.human-resource.go.kr/ontology/hrd#Competency"/>
</owl:ObjectProperty>
```

---

## 2. 익명 클래스 (Blank Node Class)

파싱 중 이름 없는 클래스 2개가 발견되었습니다. 이는 보통 OWL 제약 조건 표현(`owl:Restriction`, `owl:unionOf` 등)에서 발생하지만, 독립 클래스로 등록되면 오류입니다.

| Blank Node ID | 확인 방법 |
|--------------|---------|
| `N1d7b490875b14be29727482de0159342` | Protégé에서 "Unnamed classes" 검색 |
| `Ne26f36e8ebe6481397b304a935538a28` | SPARQL: `SELECT ?c WHERE { ?c a owl:Class . FILTER(isBlank(?c)) }` |

### 조치 방법
- Protégé Desktop → Classes 탭 → 익명 클래스 확인 후 명명 또는 삭제
- `owl:Restriction`의 일부라면 정상이므로 무시 가능

---

## 3. 시간 속성 누락

현재 RDF에 `hasStartDate`, `hasEndDate` Datatype Property가 정의되어 있지 않습니다.

**영향**: 정책, 예산, 프로그램의 유효 기간 표현 불가 → 시간 기반 추론, 갱신 감지 불가

### 추가 권장 속성

```xml
<owl:DatatypeProperty rdf:about="http://www.human-resource.go.kr/ontology/hrd#hasStartDate">
  <rdfs:domain>
    <owl:Class>
      <owl:unionOf rdf:parseType="Collection">
        <owl:Class rdf:about="http://www.human-resource.go.kr/ontology/hrd#Policy"/>
        <owl:Class rdf:about="http://www.human-resource.go.kr/ontology/hrd#Budget"/>
        <owl:Class rdf:about="http://www.human-resource.go.kr/ontology/hrd#EducationProgram"/>
      </owl:unionOf>
    </owl:Class>
  </rdfs:domain>
  <rdfs:range rdf:resource="http://www.w3.org/2001/XMLSchema#date"/>
</owl:DatatypeProperty>

<owl:DatatypeProperty rdf:about="http://www.human-resource.go.kr/ontology/hrd#hasEndDate">
  <!-- 동일한 domain 정의 -->
  <rdfs:range rdf:resource="http://www.w3.org/2001/XMLSchema#date"/>
</owl:DatatypeProperty>
```

---

## 4. URI 경고 (rdflib)

rdflib 파싱 시 `{http:/www.w3.org/2001/XMLSchema#}long` 형태의 경고가 발생합니다.

**원인**: XSD 네임스페이스 `http://www.w3.org/2001/XMLSchema#` 대신 `{http:/www.w3.org/2001/XMLSchema#}` 형태가 RDF 파일 내 일부 위치에 잘못 인코딩됨.

### 확인 방법
```bash
grep -n "{http:/" src/HRD_Governance_Extended_v3.rdf | head -20
```

### 수정 방법
```bash
# 잘못된 패턴을 올바른 URI로 교체
sed -i 's/{http:\/www.w3.org\/2001\/XMLSchema#}/http:\/\/www.w3.org\/2001\/XMLSchema#/g' \
  src/HRD_Governance_Extended_v3.rdf
```

> ⚠️ 수정 전 반드시 백업: `cp src/HRD_Governance_Extended_v3.rdf src/HRD_Governance_Extended_v3.rdf.bak`

---

## 5. OWL DL 일관성 검사 (수동 작업 필요)

다음 항목은 Protégé Desktop에서 직접 확인해야 합니다.

### 체크리스트

- [ ] Protégé 5.x에서 `src/HRD_Governance_Extended_v3.rdf` 열기
- [ ] Reasoner → HermiT (또는 Pellet) 선택 → Start reasoner
- [ ] 빨간 표시 클래스 없음 확인 (inconsistent class = 논리 모순)
- [ ] Reasoner → Explain inconsistency 로 원인 파악
- [ ] Classes 탭에서 "Unnamed classes" 항목 확인

### 자주 발생하는 OWL DL 위반

| 위반 유형 | 원인 | 해결 |
|----------|------|------|
| 순환 subClassOf | A subClassOf B, B subClassOf A | 한쪽 관계 제거 |
| 함수 속성 다중값 | `owl:FunctionalProperty`에 값 2개 | 인스턴스 데이터 수정 |
| Range 위반 | 속성 값이 range 클래스에 속하지 않음 | 인스턴스 타입 또는 range 수정 |

---

## 6. 우선순위 작업 목록

| 우선순위 | 작업 | 예상 소요 |
|---------|------|---------|
| 🔴 높음 | Domain/Range 누락 8개 속성 보완 | 2-3시간 |
| 🔴 높음 | URI 경고 원인 파악 및 수정 | 1시간 |
| 🟡 중간 | hasStartDate/hasEndDate 추가 | 30분 |
| 🟡 중간 | 익명 클래스 확인 및 처리 | 1시간 |
| 🟢 낮음 | Protégé HermiT 일관성 검사 | 30분 |
| 🟢 낮음 | SHACL 제약 조건 초안 작성 | 4-8시간 |

---

## 7. 향후 SHACL 제약 조건 예시

Phase 2 이전에 데이터 품질을 강제하기 위한 SHACL 규칙 초안:

```turtle
@prefix sh: <http://www.w3.org/ns/shacl#> .
@prefix hrd: <http://www.human-resource.go.kr/ontology/hrd#> .

hrd:PolicyShape a sh:NodeShape ;
  sh:targetClass hrd:Policy ;
  sh:property [
    sh:path hrd:hasAllocatedBudget ;
    sh:minCount 1 ;
    sh:message "Policy must have at least one allocated budget." ;
  ] ;
  sh:property [
    sh:path hrd:hasStartDate ;
    sh:minCount 1 ;
    sh:datatype xsd:date ;
    sh:message "Policy must have a start date." ;
  ] .
```
