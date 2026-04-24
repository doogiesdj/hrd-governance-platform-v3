// Stack entries: { html: string, rebind: fn|null }
Object.assign(App, {
  _detailStack: [],
  _currentRebind: null,

  _initDetailPanel() {
    const overlay = document.getElementById('detailOverlay');
    const closeBtn = document.getElementById('detailClose');
    const backBtn = document.getElementById('detailBack');
    if (overlay) overlay.addEventListener('click', e => { if (e.target === overlay) this._closeDetail(); });
    if (closeBtn) closeBtn.addEventListener('click', () => this._closeDetail());
    if (backBtn) backBtn.addEventListener('click', () => this._popDetail());
    document.addEventListener('keydown', e => { if (e.key === 'Escape') this._closeDetail(); });
  },

  _openDetail(html) {
    const overlay = document.getElementById('detailOverlay');
    const body = document.getElementById('detailBody');
    if (!overlay || !body) return;
    this._detailStack = [];
    this._currentRebind = null;
    body.innerHTML = html;
    overlay.classList.add('active');
    this._updateBackBtn();
  },

  _pushDetail(html) {
    const body = document.getElementById('detailBody');
    if (!body) return;
    this._detailStack.push({ html: body.innerHTML, rebind: this._currentRebind });
    this._currentRebind = null;
    body.innerHTML = html;
    body.scrollTop = 0;
    this._updateBackBtn();
  },

  _pushDetailWith(savedHtml, renderFn) {
    this._detailStack.push({ html: savedHtml, rebind: this._currentRebind });
    this._currentRebind = null;
    renderFn();
    this._updateBackBtn();
  },

  _popDetail() {
    if (!this._detailStack.length) return;
    const body = document.getElementById('detailBody');
    if (!body) return;
    const { html, rebind } = this._detailStack.pop();
    body.innerHTML = html;
    body.scrollTop = 0;
    this._currentRebind = rebind;
    if (rebind) rebind();
    this._updateBackBtn();
  },

  _updateBackBtn() {
    const btn = document.getElementById('detailBack');
    if (btn) btn.style.display = this._detailStack.length ? 'inline-flex' : 'none';
  },

  _closeDetail() {
    const overlay = document.getElementById('detailOverlay');
    if (overlay) overlay.classList.remove('active');
    this._detailStack = [];
    this._currentRebind = null;
    this._updateBackBtn();
  },
});
