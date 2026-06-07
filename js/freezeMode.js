/* blip — FreezeMode (파이메뉴 'Freeze' 진입)
 *  freeze 한 화면 위에서 DOM 컴포넌트를 탐색/캡처/수정한다.
 *
 *  - 좌 1클릭   : drill down (세부)
 *  - 좌 더블클릭: (텍스트인 경우) 인라인 편집 → Enter 로 저장(세션 한정)
 *  - 좌 3클릭   : 해당 영역 삭제
 *  - 좌+우 동시 : 현재 영역을 atom 으로 캡처
 *  - 우클릭(휠X): '변경하기' 컨텍스트 메뉴 (yt-chip 은 제시 버튼 추가)
 *  - 우클릭+휠  : 단위 이동(drill up/down)
 *  - 드래그     : freeze 중에도 패널 호출 (우→아톰, 위→에디터)
 *  - Esc        : freeze 종료(unfreeze)
 */
window.Blip = window.Blip || {};
(function (Blip) {
  'use strict';

  const CLICK_WINDOW = 280;   // ms, 단일/더블/트리플 구분
  const MOVE_CANCEL = 8;     // px, 이 이상 움직이면 클릭으로 안 침
  const COMMIT = 70;    // px, 패널 호출 드래그 임계값

  class FreezeMode {
    constructor(opts) {
      this.root = opts.root;          // freeze 대상 루트 (#yt)
      this.atoms = opts.atomShelf;
      this.editor = opts.editor;
      this.capture = opts.capture;       // CaptureService
      this.iframe = opts.iframe;        // 배경 영상 (freeze 시 일시정지)

      this.active = false;
      this.depth = 0;
      this.curChain = null;
      this.selected = null;

      // 포인터 상태
      this.leftDown = false;
      this.rightDown = false;
      this.rightActed = false;           // 우클릭 동안 휠/캡처가 일어남(=메뉴 안 띄움)
      this.moved = false;
      this.captureCombo = false;
      this.downX = 0; this.downY = 0;
      this.lastX = 0; this.lastY = 0;
      this.clickCount = 0;
      this.clickTimer = null;
      this.rightClicks = 0;          // 우클릭 횟수(1=메뉴, 2=뒤로가기)
      this.rightTimer = null;

      this.history = [];             // 편집 되돌리기 스택

      // 텍스트 편집 상태
      this.editingText = false;
      this.textEl = null;
      this.textOriginal = '';

      // 컨텍스트 메뉴 대상
      this.menuTarget = null;
      this.menuChip = null;

      this._buildUI();
      this._bind();
      this._bindReaction();
    }

    // ---------------- UI ----------------
    _buildUI() {
      const layer = document.createElement('div');
      layer.className = 'freeze';
      layer.innerHTML = `
        <div class="freeze__overlay"></div>
        <div class="freeze__box"><span class="freeze__tag"></span></div>
        <div class="freeze__help">
          <b>FREEZE</b>
          <span>1클릭 세부 · 2클릭 텍스트 · 3클릭 삭제 · 좌+우 캡처 · 우클릭 변경하기 · 드래그로 패널 · Esc 종료</span>
        </div>`;
      document.body.appendChild(layer);
      this.layer = layer;
      this.overlay = layer.querySelector('.freeze__overlay');
      this.box = layer.querySelector('.freeze__box');
      this.tag = layer.querySelector('.freeze__tag');

      this.menu = document.createElement('div');
      this.menu.className = 'freeze-menu';
      this.menu.style.display = 'none';
      document.body.appendChild(this.menu);
    }

    // ---------------- enter / exit ----------------
    enter() {
      if (this.active) return;
      this.active = true;
      this.depth = 0;
      this.selected = null;
      this.curChain = null;
      this.clickCount = 0;
      this.leftDown = this.rightDown = this.moved = this.captureCombo = this.rightActed = false;
      this._closeMenu();
      document.body.classList.add('frozen');
      this.layer.classList.add('is-on');
      this._postPlayer('pauseVideo');
    }

    exit() {
      if (!this.active) return;
      this._finishTextEdit(true);
      this._closeMenu();
      this.active = false;
      document.body.classList.remove('frozen');
      this.layer.classList.remove('is-on', 'is-textediting');
      this._hideBox();
      this._postPlayer('playVideo');
    }

    // ---------------- 영상 제어 ----------------
    _postPlayer(func) {
      try {
        this.iframe && this.iframe.contentWindow &&
          this.iframe.contentWindow.postMessage(
            JSON.stringify({ event: 'command', func, args: [] }), '*');
      } catch (e) { }
    }

    // ---------------- 히트 테스트 ----------------
    _elAt(x, y) {
      const po = this.overlay.style.pointerEvents;
      this.overlay.style.pointerEvents = 'none';
      const el = document.elementFromPoint(x, y);
      this.overlay.style.pointerEvents = po;
      return el;
    }
    _chainAt(x, y) {
      let el = this._elAt(x, y);
      if (!el || !this.root.contains(el)) return null;
      const chain = [];
      while (el && el !== this.root) { chain.unshift(el); el = el.parentElement; }
      return chain.length ? chain : null;
    }

    _pick(x, y) {
      const chain = this._chainAt(x, y);
      // #yt 밖(에디터/패널 위)으로 가도 마지막 선택은 유지 (Reaction 버튼이 쓰도록)
      if (!chain) { this.curChain = null; this._hideBox(); return; }
      this.curChain = chain;
      const i = Math.min(this.depth, chain.length - 1);
      this.selected = chain[i];
      this._drawBox(this.selected);
    }

    _refresh() {
      if (!this.curChain) { this._hideBox(); return; }
      const i = Math.min(Math.max(this.depth, 0), this.curChain.length - 1);
      this.selected = this.curChain[i];
      this._drawBox(this.selected);
    }

    _drawBox(el) {
      if (!el) { this._hideBox(); return; }
      const r = el.getBoundingClientRect();
      const b = this.box.style;
      b.display = 'block';
      b.left = r.left + 'px';
      b.top = r.top + 'px';
      b.width = r.width + 'px';
      b.height = r.height + 'px';
      const cls = el.className && typeof el.className === 'string'
        ? '.' + el.className.trim().split(/\s+/)[0] : '';
      this.tag.textContent = el.tagName.toLowerCase() + (el.id ? '#' + el.id : cls);
    }
    _hideBox() { this.box.style.display = 'none'; }

    // ---------------- drill ----------------
    _drillDown() {
      if (!this.curChain) return;
      this.depth = Math.min(this.depth + 1, this.curChain.length - 1);
      this._refresh();
    }
    _drillUp() {
      this.depth = Math.max(0, this.depth - 1);
      this._refresh();
    }

    // ---------------- 액션 ----------------
    async _captureRegion() {
      if (!this.selected) return;
      const rect = this.selected.getBoundingClientRect();
      this._flashBox();
      const img = await this.capture.grabRect(rect);
      this.atoms.addCapture(new Blip.Atom({ image: img }));
    }
    _deleteRegion() {
      if (!this.selected) return;
      // 화면 편집이므로 reflow 없이 자리는 빈 공간으로 (제거 X)
      const el = this.selected;
      const prev = el.style.visibility;
      el.style.visibility = 'hidden';
      this.history.push(() => { el.style.visibility = prev; });
      this._refresh();
    }

    // 뒤로가기: 마지막 편집(삭제/텍스트/이모지) 되돌리기
    _undo() {
      const fn = this.history.pop();
      if (fn) fn();
      this._refresh();
    }
    // 칩 내용 교체 + 되돌리기 등록
    _setChip(chip, emoji) {
      const prev = chip.innerHTML;
      chip.textContent = emoji;
      this.history.push(() => { chip.innerHTML = prev; });
    }
    _flashBox() {
      this.box.classList.remove('is-flash');
      void this.box.offsetWidth;
      this.box.classList.add('is-flash');
    }

    // freeze 중 드래그로 패널 호출
    _directional() {
      const dx = this.lastX - this.downX, dy = this.lastY - this.downY;
      const horizontal = Math.abs(dx) > Math.abs(dy);
      if (horizontal && dx > COMMIT) this.atoms.open();
      else if (horizontal && dx < -COMMIT) this.atoms.close();
      else if (!horizontal && dy < -window.innerHeight * 0.6) this.editor.openFull();
      else if (!horizontal && dy < -COMMIT) this.editor.open();
      else if (!horizontal && dy > COMMIT) this.editor.close();
    }

    // ---------------- 텍스트 편집 ----------------
    _isTextEditable(el) {
      if (!el) return false;
      const t = el.tagName;
      if (t === 'INPUT' || t === 'TEXTAREA') return true;
      return el.children.length === 0 && el.textContent.trim().length > 0;
    }
    _startTextEdit(el) {
      if (!this._isTextEditable(el)) return;
      this.editingText = true;
      this.textEl = el;
      this.layer.classList.add('is-textediting');
      if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
        this.textOriginal = el.value;
        el.readOnly = false;
        el.focus(); el.select();
      } else {
        this.textOriginal = el.innerHTML;
        el.setAttribute('contenteditable', 'true');
        el.focus();
        this._selectAll(el);
      }
    }
    _finishTextEdit(save) {
      if (!this.editingText) return;
      const el = this.textEl;
      const orig = this.textOriginal;
      if (el) {
        const isInput = el.tagName === 'INPUT' || el.tagName === 'TEXTAREA';
        if (isInput) {
          if (!save) el.value = orig;
          else if (el.value !== orig) this.history.push(() => { el.value = orig; });
          el.readOnly = true;
        } else {
          if (!save) el.innerHTML = orig;
          else if (el.innerHTML !== orig) this.history.push(() => { el.innerHTML = orig; });
          el.removeAttribute('contenteditable');
        }
        el.blur();
      }
      this.editingText = false;
      this.textEl = null;
      this.layer.classList.remove('is-textediting');
      this._refresh();
    }
    _selectAll(el) {
      const sel = window.getSelection();
      const range = document.createRange();
      range.selectNodeContents(el);
      sel.removeAllRanges();
      sel.addRange(range);
    }

    // ---------------- 컨텍스트 메뉴 ----------------
    _showMenu(x, y) {
      const target = this._elAt(x, y);
      if (!target || !this.root.contains(target)) return;   // yt 영역만
      const chip = target.closest('.yt-chip');
      this.menuChip = chip;
      this.menuTarget = chip || this.selected || target;

      let html = `<button class="freeze-menu__item" data-act="change">변경하기</button>`;
      if (chip) {
        html += `
          <div class="freeze-menu__label">제시</div>
          <div class="freeze-menu__suggest">
            <button class="freeze-menu__sg" data-act="expect">🥹 기대하기</button>
            <button class="freeze-menu__sg" data-act="pro">📷 전문성</button>
          </div>`;
      }
      this.menu.innerHTML = html;
      this.menu.style.display = 'block';
      const mw = this.menu.offsetWidth, mh = this.menu.offsetHeight;
      this.menu.style.left = Math.min(x, window.innerWidth - mw - 8) + 'px';
      this.menu.style.top = Math.min(y, window.innerHeight - mh - 8) + 'px';
      this.menu.querySelectorAll('button').forEach((b) => {
        b.onclick = (ev) => { ev.stopPropagation(); this._menuAction(b.dataset.act); };
      });
    }
    _menuAction(act) {
      if (act === 'change') { if (this.menuTarget) this._startTextEdit(this.menuTarget); }
      else if (act === 'expect' && this.menuChip) this._setChip(this.menuChip, '🥹');
      else if (act === 'pro'    && this.menuChip) this._setChip(this.menuChip, '📷');
      this._closeMenu();
      this._refresh();
    }
    _closeMenu() { if (this.menu) this.menu.style.display = 'none'; }
    get _menuOpen() { return this.menu && this.menu.style.display === 'block'; }

    // ---------------- 에디터 Reaction 패널 ----------------
    _bindReaction() {
      const el = document.getElementById('reaction');
      if (!el) return;
      el.querySelectorAll('.reaction__btn').forEach((b) => {
        b.addEventListener('click', (ev) => {
          ev.stopPropagation();
          this._reaction(b.dataset.act, b);
        });
      });
    }
    _reaction(act, btn) {
      // 현재 freeze 로 선택(하이라이트)된 영역의 칩에 적용
      const chip = this.selected && this.selected.closest
        ? this.selected.closest('.yt-chip') : null;
      if (act === 'expect' && chip) this._setChip(chip, '🥹');
      else if (act === 'pro' && chip) this._setChip(chip, '📷');
      btn.classList.toggle('is-active');
      this._refresh();
    }

    // ---------------- 클릭 처리 ----------------
    _applyClicks() {
      const n = this.clickCount;
      this.clickCount = 0;
      if (n === 1) this._drillDown();
      else if (n === 2) this._startTextEdit(this.selected);
      else if (n >= 3) this._deleteRegion();
    }

    // ---------------- 이벤트 ----------------
    _bind() {
      this.overlay.addEventListener('mousedown', (e) => {
        if (!this.active) return;
        this.lastX = e.clientX; this.lastY = e.clientY;

        // 메뉴 열려 있으면 바깥 클릭 → 닫기
        if (this._menuOpen) { this._closeMenu(); return; }

        // 좌+우 동시 → 캡처
        if (e.buttons === 3 ||
          (this.leftDown && e.button === 2) ||
          (this.rightDown && e.button === 0)) {
          e.preventDefault();
          clearTimeout(this.clickTimer);
          this.clickCount = 0;
          this.captureCombo = true;
          this.rightActed = true;
          if (e.button === 2) this.rightDown = true;
          if (e.button === 0) this.leftDown = true;
          this._captureRegion();
          return;
        }

        if (e.button === 2) { this.rightDown = true; this.rightActed = false; return; }
        if (e.button !== 0) return;
        if (this.editingText) return;
        e.preventDefault();
        this.leftDown = true;
        this.moved = false;
        this.downX = e.clientX; this.downY = e.clientY;
      });

      window.addEventListener('mousemove', (e) => {
        if (!this.active) return;
        this.lastX = e.clientX; this.lastY = e.clientY;
        if (this.editingText) return;
        if (this.leftDown) {
          if (!this.moved && Math.hypot(e.clientX - this.downX, e.clientY - this.downY) > MOVE_CANCEL) {
            this.moved = true;
          }
          return;
        }
        this._pick(e.clientX, e.clientY);
      });

      window.addEventListener('mouseup', (e) => {
        if (!this.active) return;

        if (e.button === 2) {
          const acted = this.rightActed;
          this.rightDown = false;
          this.rightActed = false;
          if (acted) return;                            // 휠/캡처가 있었으면 무시
          this.rightClicks += 1;
          clearTimeout(this.rightTimer);
          this.rightTimer = setTimeout(() => {
            const n = this.rightClicks; this.rightClicks = 0;
            if (n >= 2) this._undo();                   // 우클릭 2번 → 뒤로가기
            else this._showMenu(this.lastX, this.lastY); // 1번 → 변경하기 메뉴
          }, CLICK_WINDOW);
          return;
        }
        if (e.button !== 0) return;
        if (!this.leftDown && !this.captureCombo) return;        // 패널/메뉴에서 시작한 클릭 무시
        this.leftDown = false;
        if (this.captureCombo) { this.captureCombo = false; return; }
        if (this.moved) { this.moved = false; this._directional(); return; }

        this.clickCount += 1;
        clearTimeout(this.clickTimer);
        this.clickTimer = setTimeout(() => this._applyClicks(), CLICK_WINDOW);
      });

      this.overlay.addEventListener('wheel', (e) => {
        if (!this.active || !this.rightDown) return;
        e.preventDefault();
        this.rightActed = true;
        if (e.deltaY > 0) this._drillUp();
        else this._drillDown();
      }, { passive: false });

      window.addEventListener('keydown', (e) => {
        if (!this.active) return;
        if (this.editingText) {
          if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); this._finishTextEdit(true); }
          else if (e.key === 'Escape') { e.preventDefault(); this._finishTextEdit(false); }
          return;
        }
        if (this._menuOpen) {
          if (e.key === 'Escape') { e.preventDefault(); this._closeMenu(); }
          return;
        }
        if (e.key === 'Escape') { e.preventDefault(); this.exit(); }
      });
    }
  }

  Blip.FreezeMode = FreezeMode;
})(window.Blip);
