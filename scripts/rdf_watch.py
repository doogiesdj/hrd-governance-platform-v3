"""
RDF 파일 변경 감지 → 자동 파싱 → git commit & push (origin + v3)

사용법:
  python scripts/rdf_watch.py

종료: Ctrl+C
"""
import subprocess
import sys
import time
import datetime
import os
import re
from pathlib import Path

try:
    from watchdog.observers import Observer
    from watchdog.events import FileSystemEventHandler
except ImportError:
    print("[rdf_watch] watchdog가 설치되지 않았습니다. 다음 명령으로 설치하세요:")
    print("  pip install watchdog>=3.0.0")
    sys.exit(1)

REPO_ROOT = Path(__file__).resolve().parent.parent
RDF_PATH = REPO_ROOT / "src" / "HRD_Governance_Extended_v3.rdf"

PARSE_SCRIPTS = [
    "scripts/parse_full_ontology.py",
    "scripts/extract_code_reference.py",
    "scripts/run_sparql_queries.py",
    "scripts/extract_budget_analysis.py",
]

GENERATED_PATHS = [
    "data/",
    "js/ontology_data.js",
    "index.html",
]

DEBOUNCE_SEC = 5


def log(msg):
    ts = datetime.datetime.now().strftime("%H:%M:%S")
    print(f"[{ts}] {msg}", flush=True)


def run(cmd, cwd=None):
    result = subprocess.run(
        cmd, cwd=cwd or REPO_ROOT, capture_output=True, text=True, encoding="utf-8", errors="replace"
    )
    return result


def bump_cache_version():
    """index.html의 ?v=YYYYMMDD 버전 문자열을 현재 날짜로 갱신."""
    index_path = REPO_ROOT / "index.html"
    ver = datetime.datetime.now().strftime("%Y%m%d%H%M")
    content = index_path.read_text(encoding="utf-8")
    updated = re.sub(r"\?v=\d{8,12}", f"?v={ver}", content)
    if updated != content:
        index_path.write_text(updated, encoding="utf-8")
        log(f"index.html 캐시 버전 갱신 → {ver}")
    return updated != content


def build_and_push():
    log("=" * 50)
    log("RDF 변경 감지 → 빌드 시작")

    # 1. parse scripts
    for script in PARSE_SCRIPTS:
        log(f"  실행 중: {script}")
        r = run([sys.executable, script])
        if r.returncode != 0:
            log(f"  [오류] {script} 실패:\n{r.stderr[:500]}")
            return

    # 2. cache-busting version bump
    bump_cache_version()

    # 3. git add
    log("  git add 중...")
    run(["git", "add"] + GENERATED_PATHS)

    # 4. check if anything changed
    diff = run(["git", "diff", "--staged", "--quiet"])
    if diff.returncode == 0:
        log("  변경된 데이터 없음 — 커밋 건너뜀")
        return

    # 5. commit
    ts = datetime.datetime.now().strftime("%Y-%m-%d %H:%M")
    msg = f"chore: auto-update data from RDF [{ts}]"
    r = run(["git", "commit", "-m", msg])
    if r.returncode != 0:
        log(f"  [오류] commit 실패:\n{r.stderr[:300]}")
        return
    log(f"  커밋 완료: {msg}")

    # 6. push origin
    log("  origin에 push 중...")
    r = run(["git", "push", "origin", "main"])
    if r.returncode != 0:
        log(f"  [경고] origin push 실패:\n{r.stderr[:300]}")
    else:
        log("  origin push 완료")

    # 7. push v3 (pull first to avoid non-fast-forward)
    log("  v3 원격 확인 중...")
    r_remote = run(["git", "remote"])
    if "v3" in r_remote.stdout:
        run(["git", "pull", "v3", "main", "--no-rebase", "-X", "ours", "-q"])
        r = run(["git", "push", "v3", "main"])
        if r.returncode != 0:
            log(f"  [경고] v3 push 실패:\n{r.stderr[:300]}")
        else:
            log("  v3 push 완료")

    log("빌드 & 배포 완료!")
    log("=" * 50)


class RDFHandler(FileSystemEventHandler):
    def __init__(self):
        self._last_triggered = 0

    def on_modified(self, event):
        if Path(event.src_path).resolve() != RDF_PATH:
            return
        now = time.time()
        if now - self._last_triggered < DEBOUNCE_SEC:
            return
        self._last_triggered = now
        log(f"RDF 파일 변경 감지: {RDF_PATH.name}")
        build_and_push()

    on_created = on_modified


def main():
    if not RDF_PATH.exists():
        log(f"[오류] RDF 파일을 찾을 수 없습니다: {RDF_PATH}")
        sys.exit(1)

    observer = Observer()
    handler = RDFHandler()
    observer.schedule(handler, str(RDF_PATH.parent), recursive=False)
    observer.start()

    log(f"감시 시작: {RDF_PATH}")
    log(f"RDF 파일을 저장하면 자동으로 파싱 → git commit → push 됩니다.")
    log("종료하려면 Ctrl+C 를 누르세요.")

    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        observer.stop()
        log("감시 중지됨.")
    observer.join()


if __name__ == "__main__":
    main()
