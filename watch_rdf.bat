@echo off
chcp 65001 > nul
echo.
echo  RDF 자동 감시 시작
echo  ─────────────────────────────────────────
echo  HRD_Governance_Extended_v3.rdf 파일을 저장하면
echo  자동으로 데이터 파싱, git commit, push 됩니다.
echo  ─────────────────────────────────────────
echo.

cd /d "%~dp0"

:: watchdog가 없으면 자동 설치
python -c "import watchdog" 2>nul || (
    echo [설치] watchdog 라이브러리 설치 중...
    pip install watchdog>=3.0.0
)

python scripts\rdf_watch.py
pause
