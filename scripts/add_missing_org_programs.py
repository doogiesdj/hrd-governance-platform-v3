#!/usr/bin/env python3
"""Add programs for the 25 organizations that currently have no program data."""
import re, sys
sys.stdout.reconfigure(encoding='utf-8')

BASE = 'http://www.human-resource.go.kr/ontology/hrd#'
RDF_PATH = 'src/HRD_Governance_Extended_v3.rdf'

# Each entry: (prog_id, ko_name, en_name, org_id, strategy, hours, type, comp_ids)
# comp_ids are the targetCompetency IDs → become relatedCompetencyIds in the heatmap
PROGRAMS = [
    # ─── 중소벤처기업부 (ORG_MINISTRY_10) ──────────────────────────────
    ('SME_01', '창업생태계조성실무',    'Startup Ecosystem Management',    'ORG_MINISTRY_10', '인공지능주권',      24, 'WorkshopSeminar',   ['COMP_35','COMP_25','COMP_40']),
    ('SME_02', '벤처기업역량강화',      'Venture Business Capacity Building','ORG_MINISTRY_10','전략기술주권',     16, 'WorkshopSeminar',   ['COMP_69','COMP_26','COMP_31']),
    ('SME_03', '소상공인경영개선',      'Small Business Management',        'ORG_MINISTRY_10', '공정경제민주화',   20, 'OnlineModule',      ['COMP_60','COMP_27','COMP_22']),

    # ─── 환경부 (ORG_MINISTRY_12) ──────────────────────────────────────
    ('ENV_01', '탄소중립정책실무',      'Carbon Neutral Policy Practice',   'ORG_MINISTRY_12', '탄소중립·재생에너지', 16,'WorkshopSeminar', ['COMP_Green','COMP_52','COMP_54']),
    ('ENV_02', '환경영향평가실무',      'Environmental Impact Assessment',  'ORG_MINISTRY_12', '탄소중립·재생에너지', 20,'WorkshopSeminar', ['COMP_AdminLaw','COMP_27','COMP_50']),
    ('ENV_03', '자원순환정책교육',      'Resource Circulation Policy',      'ORG_MINISTRY_12', '탄소중립·재생에너지', 8, 'OnlineModule',    ['COMP_52','COMP_26','COMP_Green']),

    # ─── 국토교통부 (ORG_MINISTRY_13) ─────────────────────────────────
    ('MOLIT_01','스마트시티기획',       'Smart City Planning',              'ORG_MINISTRY_13', '디지털플랫폼정부',  24, 'WorkshopSeminar',  ['COMP_40','COMP_38','COMP_35']),
    ('MOLIT_02','도시계획실무',         'Urban Planning Practice',          'ORG_MINISTRY_13', '지역균형발전',      20, 'WorkshopSeminar',  ['COMP_AdminLaw','COMP_25','COMP_36']),
    ('MOLIT_03','건설안전관리',         'Construction Safety Management',   'ORG_MINISTRY_13', '전략기술주권',      16, 'OnlineModule',     ['COMP_AdminLaw','COMP_44','COMP_27']),

    # ─── 농림축산식품부 (ORG_MINISTRY_14) ─────────────────────────────
    ('MAFRA_01','스마트팜기술교육',     'Smart Farm Technology',            'ORG_MINISTRY_14', '전략기술주권',      24, 'K_DigitalTraining',['COMP_38','COMP_40','COMP_34']),
    ('MAFRA_02','식품안전관리실무',     'Food Safety Management',           'ORG_MINISTRY_14', '포용적복지국가',    16, 'WorkshopSeminar',  ['COMP_AdminLaw','COMP_52','COMP_27']),
    ('MAFRA_03','농업혁신정책교육',     'Agricultural Innovation Policy',   'ORG_MINISTRY_14', '지역균형발전',      12, 'OnlineModule',     ['COMP_50','COMP_35','COMP_26']),

    # ─── 해양수산부 (ORG_MINISTRY_15) ─────────────────────────────────
    ('MOF_SEA_01','해양안전교육',       'Marine Safety Education',          'ORG_MINISTRY_15', '전략기술주권',      20, 'WorkshopSeminar',  ['COMP_AdminLaw','COMP_44','COMP_43']),
    ('MOF_SEA_02','수산자원관리실무',   'Fisheries Resource Management',    'ORG_MINISTRY_15', '탄소중립·재생에너지',16,'WorkshopSeminar', ['COMP_AdminLaw','COMP_52','COMP_35']),
    ('MOF_SEA_03','해운물류디지털화',   'Shipping Logistics Digitalization','ORG_MINISTRY_15', '인공지능주권',      16, 'K_DigitalTraining',['COMP_38','COMP_35','COMP_27']),

    # ─── 여성가족부 (ORG_MINISTRY_16) ─────────────────────────────────
    ('MOGEF_01','성평등정책교육',       'Gender Equality Policy Education', 'ORG_MINISTRY_16', '포용적복지국가',    12, 'OnlineModule',     ['COMP_52','COMP_22','COMP_51']),
    ('MOGEF_02','가족지원역량강화',     'Family Support Capacity Building', 'ORG_MINISTRY_16', '저출생극복',        16, 'WorkshopSeminar',  ['COMP_51','COMP_19','COMP_30']),
    ('MOGEF_03','청소년역량개발과정',   'Youth Competency Development',     'ORG_MINISTRY_16', '저출생극복',        20, 'WorkshopSeminar',  ['COMP_31','COMP_45','COMP_21']),

    # ─── 외교부 (ORG_MINISTRY_17) ─────────────────────────────────────
    ('MOFA_01','국제협상실무',          'International Negotiation Practice','ORG_MINISTRY_17','전략기술주권',      24, 'WorkshopSeminar',  ['COMP_18','COMP_22','COMP_72']),
    ('MOFA_02','다자외교역량과정',      'Multilateral Diplomacy',           'ORG_MINISTRY_17', '인공지능주권',      20, 'WorkshopSeminar',  ['COMP_72','COMP_73','COMP_51']),
    ('MOFA_03','외교문서작성실무',      'Diplomatic Writing Practice',      'ORG_MINISTRY_17', '전략기술주권',      16, 'OnlineModule',     ['COMP_55','COMP_58','COMP_35']),

    # ─── 법무부 (ORG_MINISTRY_18) ─────────────────────────────────────
    ('MOJ_01','법무행정교육',           'Legal Administration Education',   'ORG_MINISTRY_18', '디지털플랫폼정부',  20, 'WorkshopSeminar',  ['COMP_AdminLaw','COMP_35','COMP_44']),
    ('MOJ_02','교정정책실무',           'Correctional Policy Practice',     'ORG_MINISTRY_18', '포용적복지국가',    16, 'WorkshopSeminar',  ['COMP_AdminLaw','COMP_52','COMP_43']),
    ('MOJ_03','출입국관리실무',         'Immigration Management Practice',  'ORG_MINISTRY_18', '포용적복지국가',    12, 'OnlineModule',     ['COMP_AdminLaw','COMP_22','COMP_27']),

    # ─── 금융위원회 (ORG_MINISTRY_19) ─────────────────────────────────
    ('FSC_01','금융규제실무',           'Financial Regulation Practice',    'ORG_MINISTRY_19', '공정경제민주화',    24, 'WorkshopSeminar',  ['COMP_AdminLaw','COMP_35','COMP_27']),
    ('FSC_02','핀테크정책교육',         'FinTech Policy Education',         'ORG_MINISTRY_19', '인공지능주권',      20, 'K_DigitalTraining',['COMP_40','COMP_38','COMP_AI_01']),
    ('FSC_03','자본시장교육',           'Capital Market Education',         'ORG_MINISTRY_19', '공정경제민주화',    16, 'WorkshopSeminar',  ['COMP_36','COMP_69','COMP_DataAnalysis']),

    # ─── 한국산업인력공단 (ORG_INSTITUTE_01) ──────────────────────────
    ('HRD_01','NCS기반훈련설계',        'NCS-based Training Design',        'ORG_INSTITUTE_01','전략기술주권',      24, 'WorkshopSeminar',  ['COMP_35','COMP_Semiconductor','COMP_27']),
    ('HRD_02','직업훈련교사연수',       'Vocational Training Instructor',   'ORG_INSTITUTE_01','전략기술주권',      40, 'WorkshopSeminar',  ['COMP_65','COMP_31','COMP_34']),
    ('HRD_03','국가기술자격교육',       'National Technical Qualification', 'ORG_INSTITUTE_01','전략기술주권',      30, 'K_DigitalTraining',['COMP_Semiconductor','COMP_Shipbuilding','COMP_Mobility']),

    # ─── 한국직업능력연구원 (ORG_INSTITUTE_02) ────────────────────────
    ('KRIVET_01','직업능력개발연구방법론','Vocational HRD Research Methods','ORG_INSTITUTE_02','전략기술주권',      16, 'WorkshopSeminar',  ['COMP_26','COMP_27','COMP_32']),
    ('KRIVET_02','자격제도정책연구',    'Qualification Policy Research',    'ORG_INSTITUTE_02','인공지능주권',      12, 'WorkshopSeminar',  ['COMP_35','COMP_25','COMP_28']),
    ('KRIVET_03','NCS개발방법론',       'NCS Development Methodology',      'ORG_INSTITUTE_02','전략기술주권',      20, 'WorkshopSeminar',  ['COMP_27','COMP_55','COMP_30']),

    # ─── 국가평생교육진흥원 (ORG_INSTITUTE_03) ────────────────────────
    ('NILE_01','K_MOOC학습설계',        'K-MOOC Learning Design',           'ORG_INSTITUTE_03','인공지능주권',      20, 'K_DigitalTraining',['COMP_55','COMP_57','COMP_30']),
    ('NILE_02','평생학습도시운영',      'Lifelong Learning City Operations','ORG_INSTITUTE_03','포용적복지국가',    16, 'WorkshopSeminar',  ['COMP_52','COMP_30','COMP_51']),
    ('NILE_03','디지털학습환경구축',    'Digital Learning Environment',     'ORG_INSTITUTE_03','디지털플랫폼정부',  24, 'K_DigitalTraining',['COMP_38','COMP_CloudSec','COMP_DataAnalysis']),

    # ─── 한국고용정보원 (ORG_INSTITUTE_04) ───────────────────────────
    ('KEIS_01','취업역량강화과정',      'Employment Competency Enhancement','ORG_INSTITUTE_04','전국민기본소득',    16, 'WorkshopSeminar',  ['COMP_31','COMP_45','COMP_22']),
    ('KEIS_02','직업진로탐색교육',      'Career Exploration Education',     'ORG_INSTITUTE_04','전국민기본소득',    12, 'OnlineModule',     ['COMP_30','COMP_25','COMP_47']),
    ('KEIS_03','고용정보시스템실무',    'Employment Information Systems',   'ORG_INSTITUTE_04','디지털플랫폼정부',  20, 'K_DigitalTraining',['COMP_38','COMP_DataAnalysis','COMP_39']),

    # ─── 정보통신산업진흥원 (ORG_INSTITUTE_05) ────────────────────────
    ('NIPA_01','SW인력양성과정',        'SW Workforce Development',         'ORG_INSTITUTE_05','인공지능주권',      40, 'K_DigitalTraining',['COMP_40','COMP_SW_01','COMP_AI_01']),
    ('NIPA_02','클라우드실무교육',      'Cloud Computing Practice',         'ORG_INSTITUTE_05','인공지능주권',      24, 'K_DigitalTraining',['COMP_CloudSec','COMP_38','COMP_40']),
    ('NIPA_03','ICT융합기술교육',       'ICT Convergence Technology',       'ORG_INSTITUTE_05','전략기술주권',      20, 'K_DigitalTraining',['COMP_40','COMP_38','COMP_25']),

    # ─── 한국과학창의재단 (ORG_INSTITUTE_06) ─────────────────────────
    ('KOFAC_01','STEAM교육과정',        'STEAM Education Program',          'ORG_INSTITUTE_06','인공지능주권',      20, 'WorkshopSeminar',  ['COMP_55','COMP_25','COMP_28']),
    ('KOFAC_02','과학교사연수',         'Science Teacher Training',         'ORG_INSTITUTE_06','인공지능주권',      30, 'WorkshopSeminar',  ['COMP_55','COMP_57','COMP_65']),
    ('KOFAC_03','AI교육콘텐츠개발',     'AI Education Content Development', 'ORG_INSTITUTE_06','인공지능주권',      24, 'K_DigitalTraining',['COMP_AI_01','COMP_40','COMP_26']),

    # ─── 한국교육개발원 (ORG_INSTITUTE_07) ───────────────────────────
    ('KEDI_01','교육정책연구실무',      'Education Policy Research',        'ORG_INSTITUTE_07','인공지능주권',      16, 'WorkshopSeminar',  ['COMP_27','COMP_28','COMP_35']),
    ('KEDI_02','교원역량개발과정',      'Teacher Competency Development',   'ORG_INSTITUTE_07','인공지능주권',      24, 'WorkshopSeminar',  ['COMP_65','COMP_31','COMP_55']),
    ('KEDI_03','교육통계분석교육',      'Education Statistics Analysis',    'ORG_INSTITUTE_07','디지털플랫폼정부',  20, 'K_DigitalTraining',['COMP_DataAnalysis','COMP_27','COMP_38']),

    # ─── 한국노동연구원 (ORG_INSTITUTE_08) ───────────────────────────
    ('KLI_01','노동시장분석방법',       'Labour Market Analysis Methods',   'ORG_INSTITUTE_08','전국민기본소득',    16, 'WorkshopSeminar',  ['COMP_27','COMP_DataAnalysis','COMP_28']),
    ('KLI_02','노사관계교육',           'Labour-Management Relations',      'ORG_INSTITUTE_08','공정경제민주화',    20, 'WorkshopSeminar',  ['COMP_19','COMP_22','COMP_18']),
    ('KLI_03','고용정책연구방법',       'Employment Policy Research Methods','ORG_INSTITUTE_08','전국민기본소득',   12, 'OnlineModule',     ['COMP_26','COMP_32','COMP_35']),

    # ─── 국가공무원인재개발원 (ORG_INSTITUTE_09) ──────────────────────
    ('NHRDI_01','고위공무원과정',       'Senior Civil Servant Programme',   'ORG_INSTITUTE_09','디지털플랫폼정부',  40, 'WorkshopSeminar',  ['COMP_62','COMP_61','COMP_17']),
    ('NHRDI_02','신임관리자연수',       'New Manager Training',             'ORG_INSTITUTE_09','디지털플랫폼정부',  24, 'WorkshopSeminar',  ['COMP_60','COMP_63','COMP_31']),
    ('NHRDI_03','디지털행정교육',       'Digital Government Education',     'ORG_INSTITUTE_09','디지털플랫폼정부',  20, 'K_DigitalTraining',['COMP_38','COMP_CloudSec','COMP_DataAnalysis']),

    # ─── 한국생산성본부 (ORG_INSTITUTE_10) ───────────────────────────
    ('KPC_01','경영혁신실무',           'Business Innovation Practice',     'ORG_INSTITUTE_10','전략기술주권',      20, 'WorkshopSeminar',  ['COMP_69','COMP_50','COMP_25']),
    ('KPC_02','스마트팩토리실무',       'Smart Factory Practice',           'ORG_INSTITUTE_10','전략기술주권',      24, 'K_DigitalTraining',['COMP_Semiconductor','COMP_38','COMP_40']),
    ('KPC_03','생산성향상과정',         'Productivity Improvement',         'ORG_INSTITUTE_10','인공지능주권',      16, 'WorkshopSeminar',  ['COMP_35','COMP_27','COMP_45']),

    # ─── 한국기술교육대학교 (ORG_INSTITUTE_11) ────────────────────────
    ('KOTECH_01','직업훈련교원연수',    'Vocational Training Faculty Dev',  'ORG_INSTITUTE_11','전략기술주권',      40, 'WorkshopSeminar',  ['COMP_65','COMP_55','COMP_34']),
    ('KOTECH_02','스마트기술교육',      'Smart Technology Education',       'ORG_INSTITUTE_11','전략기술주권',      24, 'K_DigitalTraining',['COMP_40','COMP_Semiconductor','COMP_Shipbuilding']),
    ('KOTECH_03','현장실습교육방법론',  'Field Practice Education Methods', 'ORG_INSTITUTE_11','전략기술주권',      20, 'WorkshopSeminar',  ['COMP_25','COMP_34','COMP_27']),

    # ─── 한국인터넷진흥원 (ORG_INSTITUTE_12) ─────────────────────────
    ('KISA_01','정보보호전문교육',      'Information Security Education',   'ORG_INSTITUTE_12','인공지능주권',      40, 'K_DigitalTraining',['COMP_CloudSec','COMP_40','COMP_38']),
    ('KISA_02','사이버보안실무',        'Cyber Security Practice',          'ORG_INSTITUTE_12','인공지능주권',      24, 'K_DigitalTraining',['COMP_CloudSec','COMP_AI_01','COMP_SW_01']),
    ('KISA_03','개인정보보호과정',      'Personal Data Protection',         'ORG_INSTITUTE_12','디지털플랫폼정부',  16, 'OnlineModule',     ['COMP_CloudSec','COMP_AdminLaw','COMP_52']),

    # ─── 한국장학재단 (ORG_INSTITUTE_13) ─────────────────────────────
    ('KOSAF_01','학생리더십개발과정',   'Student Leadership Development',   'ORG_INSTITUTE_13','저출생극복',        20, 'WorkshopSeminar',  ['COMP_61','COMP_62','COMP_22']),
    ('KOSAF_02','멘토링프로그램',       'Mentoring Program',                'ORG_INSTITUTE_13','저출생극복',        16, 'WorkshopSeminar',  ['COMP_82','COMP_83','COMP_65']),
    ('KOSAF_03','취업사회진출역량',     'Career Readiness Programme',       'ORG_INSTITUTE_13','전국민기본소득',    20, 'WorkshopSeminar',  ['COMP_30','COMP_45','COMP_55']),

    # ─── 한국행정연구원 (ORG_INSTITUTE_14) ───────────────────────────
    ('KIPA_01','행정혁신과정',          'Administrative Innovation',        'ORG_INSTITUTE_14','디지털플랫폼정부',  20, 'WorkshopSeminar',  ['COMP_50','COMP_35','COMP_69']),
    ('KIPA_02','정책분석실무',          'Policy Analysis Practice',         'ORG_INSTITUTE_14','디지털플랫폼정부',  16, 'WorkshopSeminar',  ['COMP_27','COMP_28','COMP_32']),
    ('KIPA_03','공공리더십교육',        'Public Sector Leadership',         'ORG_INSTITUTE_14','디지털플랫폼정부',  24, 'WorkshopSeminar',  ['COMP_61','COMP_62','COMP_22']),

    # ─── 한국여성정책연구원 (ORG_INSTITUTE_15) ────────────────────────
    ('KWDI_01','여성경력개발과정',      'Women Career Development',         'ORG_INSTITUTE_15','포용적복지국가',    20, 'WorkshopSeminar',  ['COMP_31','COMP_45','COMP_22']),
    ('KWDI_02','성평등정책연구',        'Gender Equality Policy Research',  'ORG_INSTITUTE_15','포용적복지국가',    16, 'WorkshopSeminar',  ['COMP_52','COMP_27','COMP_50']),
    ('KWDI_03','일가정양립지원교육',    'Work-Family Balance Support',      'ORG_INSTITUTE_15','저출생극복',        12, 'OnlineModule',     ['COMP_47','COMP_41','COMP_51']),

    # ─── 한국에너지공단 (ORG_INSTITUTE_16) ───────────────────────────
    ('KEA_01','신재생에너지기술교육',   'Renewable Energy Technology',      'ORG_INSTITUTE_16','탄소중립·재생에너지', 30,'K_DigitalTraining',['COMP_Green','COMP_34','COMP_38']),
    ('KEA_02','에너지효율관리실무',     'Energy Efficiency Management',     'ORG_INSTITUTE_16','에너지고속도로',    20, 'WorkshopSeminar',  ['COMP_Green','COMP_27','COMP_35']),
    ('KEA_03','탄소중립실천교육',       'Carbon Neutral Practice',          'ORG_INSTITUTE_16','탄소중립·재생에너지', 12,'OnlineModule',    ['COMP_Green','COMP_52','COMP_54']),
]


def make_individual(prog_id, ko_name, en_name, org_id, strategy, hours, prog_type, comp_ids):
    comps_xml = '\n'.join(
        f'    <hrd:targetCompetency rdf:resource="{BASE}{cid}" />'
        for cid in comp_ids
    )
    return f'''  <owl:NamedIndividual rdf:about="{BASE}{prog_id}">
    <rdf:type rdf:resource="{BASE}{prog_type}" />
    <rdfs:label xml:lang="ko">{ko_name}</rdfs:label>
    <rdfs:label xml:lang="en">{en_name}</rdfs:label>
    <hrd:alignedWithStrategy rdf:resource="{BASE}{strategy}" />
    <hrd:trainingHours rdf:datatype="http://www.w3.org/2001/XMLSchema#integer">{hours}</hrd:trainingHours>
    <hrd:targetGroup rdf:resource="{BASE}TGROUP_Expert" />
    <hrd:operatedBy rdf:resource="{BASE}{org_id}" />
{comps_xml}
  </owl:NamedIndividual>'''


def main():
    with open(RDF_PATH, encoding='utf-8') as f:
        content = f.read()

    # Check which program IDs already exist
    existing_ids = set(re.findall(r'rdf:about="%s([^"]+)"' % re.escape(BASE), content))
    new_blocks = []
    added = []
    skipped = []
    for row in PROGRAMS:
        pid = row[0]
        if pid in existing_ids:
            skipped.append(pid)
            continue
        new_blocks.append(make_individual(*row))
        added.append(pid)

    if not new_blocks:
        print('No new programs to add — all already exist.')
        return

    insertion = '\n\n  <!-- === Auto-added programs for missing organizations === -->\n' + '\n\n'.join(new_blocks) + '\n'
    new_content = content.replace('</rdf:RDF>', insertion + '</rdf:RDF>')

    with open(RDF_PATH, 'w', encoding='utf-8') as f:
        f.write(new_content)

    print(f'Added {len(added)} programs: {added}')
    if skipped:
        print(f'Skipped (already exist): {skipped}')


if __name__ == '__main__':
    main()
