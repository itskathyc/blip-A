/* blip — 기본 브라우저 셸
 *  Browser       : 제스처 파이프라인 (드래그/롱프레스/캡처) + 컴포넌트 조율
 *  PieMenu       : 좌클릭 롱프레스 시 등장하는 6등분 파이메뉴
 *  CaptureService: 실제 화면 캡처 (getDisplayMedia → 프레임 grab)
 */
window.Blip = window.Blip || {};
(function (Blip) {
  'use strict';

  // =====================================================
  //  PieMenu
  // =====================================================
  const SVGNS = 'http://www.w3.org/2000/svg';
  class PieMenu {
    constructor(el, onSelect) {
      this.el = el;
      this.svg = el.querySelector('.pie__svg');
      this.onSelect = onSelect || function () { };
      this.labels = ['Freeze', 'HUD', 'Search', 'Save', 'Share', 'Delete'];
      this._build();
      document.addEventListener('mousedown', (e) => {
        if (this.isOpen && !this.el.contains(e.target)) this.close();
      }, true);
    }
    get isOpen() { return this.el.classList.contains('is-open'); }

    _polar(r, deg) {
      const a = (deg - 90) * Math.PI / 180;
      return { x: r * Math.cos(a), y: r * Math.sin(a) };
    }
    _build() {
      const R = 95, IR = 26, LR = 62;
      const frag = document.createDocumentFragment();
      for (let i = 0; i < 6; i++) {
        const a0 = i * 60, a1 = a0 + 60;
        const oS = this._polar(R, a0), oE = this._polar(R, a1);
        const iS = this._polar(IR, a0), iE = this._polar(IR, a1);
        const path = document.createElementNS(SVGNS, 'path');
        path.setAttribute('class', 'pie__seg');
        path.setAttribute('d', [
          `M ${iS.x} ${iS.y}`, `L ${oS.x} ${oS.y}`,
          `A ${R} ${R} 0 0 1 ${oE.x} ${oE.y}`,
          `L ${iE.x} ${iE.y}`, `A ${IR} ${IR} 0 0 0 ${iS.x} ${iS.y}`, 'Z',
        ].join(' '));
        path.addEventListener('click', () => {
          this.close();
          this.onSelect(this.labels[i], i);
        });
        frag.appendChild(path);

        const lp = this._polar(LR, a0 + 30);
        const t = document.createElementNS(SVGNS, 'text');
        t.setAttribute('class', 'pie__label');
        t.setAttribute('x', lp.x); t.setAttribute('y', lp.y);
        t.textContent = this.labels[i];
        frag.appendChild(t);
      }
      const hub = document.createElementNS(SVGNS, 'circle');
      hub.setAttribute('class', 'pie__hub');
      hub.setAttribute('r', IR - 3);
      frag.appendChild(hub);
      this.svg.appendChild(frag);
    }
    open(x, y) {
      this.el.style.left = x + 'px';
      this.el.style.top = y + 'px';
      this.el.classList.add('is-open');
      this.el.setAttribute('aria-hidden', 'false');
    }
    close() {
      this.el.classList.remove('is-open');
      this.el.setAttribute('aria-hidden', 'true');
    }
  }

  // =====================================================
  //  CaptureService — 실제 화면 한 프레임을 dataURL 로
  // =====================================================
  class CaptureService {
    constructor() {
      this.stream = null;
      this.video = null;
      this.canvas = document.createElement('canvas');
      this.maxW = 640;   // 썸네일 최대 폭 (메모리 절약)
    }
    async _ensure() {
      if (this.stream && this.stream.active) return true;
      const md = navigator.mediaDevices;
      if (!md || !md.getDisplayMedia) return false;
      try {
        this.stream = await md.getDisplayMedia({
          video: { frameRate: 30 },
          audio: false,
          preferCurrentTab: true,         // 가능하면 현재 탭을 기본 선택
        });
      } catch (e) {
        return false;                     // 권한 거부/미지원
      }
      this.video = document.createElement('video');
      this.video.muted = true;
      this.video.srcObject = this.stream;
      try { await this.video.play(); } catch (e) { }
      return true;
    }
    /** @returns {Promise<string|null>} dataURL 또는 null(실패) */
    async grab() {
      const ok = await this._ensure();
      if (!ok || !this.video || !this.video.videoWidth) return null;
      const vw = this.video.videoWidth, vh = this.video.videoHeight;
      const scale = Math.min(1, this.maxW / vw);
      const w = Math.round(vw * scale), h = Math.round(vh * scale);
      this.canvas.width = w; this.canvas.height = h;
      const ctx = this.canvas.getContext('2d');
      ctx.drawImage(this.video, 0, 0, w, h);
      try { return this.canvas.toDataURL('image/png'); }
      catch (e) { return null; }          // 보안 정책 등으로 tainted 시
    }

    /** 화면의 특정 영역(CSS 뷰포트 px)만 잘라서 캡처 */
    async grabRect(rect) {
      const ok = await this._ensure();
      if (!ok || !this.video || !this.video.videoWidth) return null;
      const vw = this.video.videoWidth, vh = this.video.videoHeight;
      const sx = vw / window.innerWidth;          // CSS px → video px
      const sy = vh / window.innerHeight;
      const cx = Math.max(0, rect.left * sx);
      const cy = Math.max(0, rect.top * sy);
      const cw = Math.min(vw - cx, rect.width * sx);
      const ch = Math.min(vh - cy, rect.height * sy);
      if (cw <= 1 || ch <= 1) return null;
      const scale = Math.min(1, this.maxW / cw);
      const ow = Math.round(cw * scale), oh = Math.round(ch * scale);
      this.canvas.width = ow; this.canvas.height = oh;
      const ctx = this.canvas.getContext('2d');
      ctx.drawImage(this.video, cx, cy, cw, ch, 0, 0, ow, oh);
      try { return this.canvas.toDataURL('image/png'); }
      catch (e) { return null; }
    }
  }

  // =====================================================
  //  Browser — 제스처 파이프라인
  // =====================================================
  const GHOST = {
    right: '→  Atoms',
    left: '←  Close Atoms',
    up: '↑  Editor',
    down: '↓  Close Editor',
  };

  class Browser {
    constructor(opts) {
      this.stage = opts.stage;
      this.atoms = opts.atomShelf;
      this.editor = opts.editor;
      this.ghost = opts.ghostEl;
      this.captureEl = opts.captureEl;
      this.capture = new CaptureService();

      this.freeze = new Blip.FreezeMode({
        root: document.getElementById('yt'),
        atomShelf: this.atoms,
        editor: this.editor,
        capture: this.capture,
        iframe: document.getElementById('ytPlayer'),
      });

      this.hud = new Blip.Hud(document.getElementById('ytRecos'));

      this.pie = new PieMenu(opts.pieEl, (label) => {
        if (label === 'Freeze') this.freeze.enter();
        else if (label === 'HUD') this.hud.toggle();
      });

      this.MOVE_CANCEL = 12;
      this.COMMIT = 70;
      this.LONGPRESS = 700;

      this.rightDown = false;
      this._resetGesture();
      this._bind();
    }

    _resetGesture() {
      this.leftDown = this.moved = this.consumed = false;
      clearTimeout(this.pressTimer);
      this.pressTimer = null;
      this._hideGhost();
    }
    _showGhost(x, y, dir) {
      this.ghost.style.left = x + 'px';
      this.ghost.style.top = y + 'px';
      this.ghost.textContent = GHOST[dir];
      this.ghost.classList.add('is-on');
    }
    _hideGhost() { this.ghost.classList.remove('is-on'); }

    _bind() {
      window.addEventListener('contextmenu', (e) => e.preventDefault());

      this.stage.addEventListener('mousedown', (e) => {
        // 좌+우 동시 → 캡처
        if (e.buttons === 3 ||
          (this.leftDown && e.button === 2) ||
          (this.rightDown && e.button === 0)) {
          e.preventDefault();
          this.consumed = true;
          clearTimeout(this.pressTimer);
          this._hideGhost();
          if (e.button === 2) this.rightDown = true;
          if (e.button === 0) this.leftDown = true;
          this.doCapture();
          return;
        }
        if (e.button === 2) { this.rightDown = true; return; }
        if (e.button !== 0) return;

        this.leftDown = true;
        this.moved = this.consumed = false;
        this.startX = e.clientX;
        this.startY = e.clientY;

        this.pressTimer = setTimeout(() => {
          if (this.leftDown && !this.moved && !this.consumed) {
            this.consumed = true;
            this._hideGhost();
            this.pie.open(this.startX, this.startY);
          }
        }, this.LONGPRESS);
      });

      window.addEventListener('mousemove', (e) => {
        if (!this.leftDown || this.consumed) return;
        const dx = e.clientX - this.startX;
        const dy = e.clientY - this.startY;
        if (!this.moved && Math.hypot(dx, dy) > this.MOVE_CANCEL) {
          this.moved = true;
          clearTimeout(this.pressTimer);
        }
        if (!this.moved) return;
        const horizontal = Math.abs(dx) > Math.abs(dy);
        if (horizontal) this._showGhost(e.clientX, e.clientY, dx > 0 ? 'right' : 'left');
        else this._showGhost(e.clientX, e.clientY, dy < 0 ? 'up' : 'down');
      });

      window.addEventListener('mouseup', (e) => {
        if (e.button === 2) { this.rightDown = false; return; }
        if (e.button !== 0) return;
        if (this.leftDown && this.moved && !this.consumed) {
          const dx = e.clientX - this.startX;
          const dy = e.clientY - this.startY;
          const horizontal = Math.abs(dx) > Math.abs(dy);
          if (horizontal && dx > this.COMMIT) this.atoms.open();
          else if (horizontal && dx < -this.COMMIT) this.atoms.close();
          else if (!horizontal && dy < -window.innerHeight * 0.6) this.editor.openFull();  // 위로 쭉 → 전체화면
          else if (!horizontal && dy < -this.COMMIT) this.editor.open();
          else if (!horizontal && dy > this.COMMIT) this.editor.close();
        }
        this._resetGesture();
      });

      window.addEventListener('blur', () => { this._resetGesture(); this.rightDown = false; });
    }

    async doCapture() {
      // 검은 프레임이 들어오기 전에 먼저 실제 화면을 잡는다
      const image = await this.capture.grab();
      this.captureEl.classList.add('is-shooting');
      setTimeout(() => this.captureEl.classList.remove('is-shooting'), 150);
      const atom = new Blip.Atom({ image });
      this.atoms.addCapture(atom, false);        // 패널은 자동으로 열지 않음
      // 캡처 순간 미니맵 위에 메모 입력창 (입력 즉시 저장 · 3초 무입력 시 메모 없음)
      if (this.editor && this.editor.captureNote) this.editor.captureNote(atom);
    }
  }

  Blip.PieMenu = PieMenu;
  Blip.CaptureService = CaptureService;
  Blip.Browser = Browser;
})(window.Blip);
