/* blip — Garden 객체 (나만의 통합 플랫폼 대시보드)
 *  좌→우 드래그로 등장. Apple Freeform 처럼 무엇이든 끌어서 어디에나 배치.
 *  - 상단 좌: 폰/데스크탑 미리보기 토글 (iPhone 15 focus / 브라우저 preview)
 *  - 상단 우: Publish 버튼
 *  - 툴박스: 그리드 / 판매창 / 이미지 / 글  (캔버스로 드래그해 생성)
 *  - 오른쪽 가장자리 더블클릭 → fullpage, fullpage 시 가운데 ‹ 버튼으로 축소
 *  - 디자인은 공원/정원 느낌 X, Notion 같은 깔끔함 유지
 */
window.Blip = window.Blip || {};
(function (Blip) {
  'use strict';

  let _seq = 0;
  const uid = () => 'gi' + (++_seq);
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

  // ---- 인라인 아이콘 ----
  const I_SKETCH = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><rect x="4" y="5" width="16" height="16" rx="2"/><path d="M8 3v4M12 3v4M16 3v4"/><path d="M8 15l3-3 2.5 2.5L17 11"/></svg>`;
  const I_PHONE =`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><rect x="7" y="2.5" width="10" height="19" rx="2.5"/><path d="M10.5 18.5h3"/></svg>`;
  const I_DESK = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><rect x="3" y="4" width="18" height="12" rx="1.6"/><path d="M9 20h6M12 16v4"/></svg>`;
  const I_GRID = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><rect x="3.5" y="3.5" width="6" height="6" rx="1"/><rect x="14.5" y="3.5" width="6" height="6" rx="1"/><rect x="3.5" y="14.5" width="6" height="6" rx="1"/><rect x="14.5" y="14.5" width="6" height="6" rx="1"/></svg>`;
  const I_SALES = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M4 8h16l-1 11.5H5L4 8z"/><path d="M8.5 8V6a3.5 3.5 0 0 1 7 0v2"/></svg>`;
  const I_IMG = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><rect x="3.5" y="4.5" width="17" height="15" rx="2"/><circle cx="8.5" cy="9.5" r="1.6"/><path d="M4 17l5-4.5 4 3 3-2.5 4 3.5"/></svg>`;
  const I_TEXT = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M5 6h14M5 6V4.5M19 6V4.5M12 6v14M9.5 19.5h5"/></svg>`;
  // Safari 툴바 아이콘
  const I_SIDEBAR = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="3.5" y="5" width="17" height="14" rx="2.2"/><path d="M9.5 5v14"/></svg>`;
  const I_BACK = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14.5 6l-6 6 6 6"/></svg>`;
  const I_FWD = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9.5 6l6 6-6 6"/></svg>`;
  const I_LOCK = `<svg class="gd-chrome__lock" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg>`;
  const I_RELOAD = `<svg class="gd-chrome__reload" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M19 5v5h-5"/><path d="M19 10a7.5 7.5 0 1 0 .5 4"/></svg>`;
  const I_SHARE = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M12 15V4M8.5 7.5L12 4l3.5 3.5"/><path d="M6 12v6a1.5 1.5 0 0 0 1.5 1.5h9A1.5 1.5 0 0 0 18 18v-6"/></svg>`;
  const I_TABS = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="4" y="4" width="11" height="11" rx="2"/><path d="M9 20h9a2 2 0 0 0 2-2V9"/></svg>`;

  const I_FOLDER = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M3.5 7.5a2 2 0 0 1 2-2h3.4l2 2.2H18.5a2 2 0 0 1 2 2V17a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2V7.5z"/></svg>`;

  const TOOLS = [
    { type: 'grid',   icon: I_GRID,   label: '그리드' },
    { type: 'sales',  icon: I_SALES,  label: '판매창' },
    { type: 'image',  icon: I_IMG,    label: '이미지' },
    { type: 'text',   icon: I_TEXT,   label: '글' },
    { type: 'folder', icon: I_FOLDER, label: '폴더' },
  ];

  // 실제 캡처가 없을 때 보여줄 데모 캡처 썸네일
  const SAMPLE_CAPS = [
    'linear-gradient(135deg,#1e5f4a,#0b1c16)',
    'linear-gradient(135deg,#5f1e1e,#1c0b0b)',
    'linear-gradient(135deg,#1e3a5f,#0b1622)',
    'linear-gradient(135deg,#5b1e3a,#1a0b16)',
    'linear-gradient(135deg,#3a1e5f,#160b1c)',
    'linear-gradient(135deg,#5f4a1e,#1c160b)',
  ].map((css) => ({ css }));

  class Garden {
    constructor(rootEl, opts = {}) {
      this.root = rootEl;
      this.atoms = opts.atomShelf || null;   // 캡처 소스
      this.device = 'design';          // 'design' | 'phone' | 'desktop'
      this.full = false;
      this.move = null;                // 기존 아이템 이동 상태
      this.resize = null;              // 아이템 리사이즈 상태
      this.tool = null;                // 툴박스 → 캔버스 생성 드래그 상태
      this.draw = null;                // 캔버스 위 영역 그리기 상태
      this._cascade = 0;               // 클릭 자동 배치 위치 카운터
      this.published = {};             // device 별 게시 여부
      this.snapshots = {};             // device 별 고정된 좌표 스냅샷
      this._modal = null;

      this._build();
      this._bind();
      this._seed();
    }

    // ---------------- 표시/숨김 ----------------
    open()  { this.root.classList.add('is-open');  document.body.classList.add('garden-open'); this._scheduleMap && this._scheduleMap(); }
    close() { this.root.classList.remove('is-open'); document.body.classList.remove('garden-open'); }
    get isOpen() { return this.root.classList.contains('is-open'); }
    toggle() { this.isOpen ? this.close() : this.open(); }

    // ---------------- 골격 ----------------
    _build() {
      this.root.innerHTML = `
        <header class="gd-bar">
          <div class="gd-devices">
            <button class="gd-dev is-on" data-device="design" title="프리폼 (자유 배치)">${I_SKETCH}</button>
            <button class="gd-dev" data-device="phone" title="모바일 미리보기 (iPhone 15)">${I_PHONE}</button>
            <button class="gd-dev" data-device="desktop" title="데스크탑 미리보기">${I_DESK}</button>
          </div>
          <div class="gd-name">Garden<span>나만의 통합 플랫폼</span></div>
          <div class="gd-actions">
            <button class="gd-publish">Publish</button>
            <button class="gd-x" title="닫기">×</button>
          </div>
        </header>

        <div class="gd-toolbox">
          <span class="gd-toolbox__label">요소</span>
          ${TOOLS.map(t => `
            <button class="gd-tool" data-type="${t.type}">
              <span class="gd-tool__ic">${t.icon}</span><span>${t.label}</span>
            </button>`).join('')}
          <span class="gd-toolbox__hint">캔버스로 끌어다 놓으세요</span>
        </div>

        <div class="gd-stage is-design">
          <div class="gd-frame">
            <div class="gd-chrome">
              <div class="gd-chrome__bar1">
                <div class="gd-chrome__lights"><span></span><span></span><span></span></div>
                <div class="gd-chrome__nav">
                  <button title="사이드바">${I_SIDEBAR}</button>
                  <button title="뒤로">${I_BACK}</button>
                  <button title="앞으로" class="is-dim">${I_FWD}</button>
                </div>
                <div class="gd-chrome__addr">
                  ${I_LOCK}<span class="gd-chrome__url">blip.garden/me</span>${I_RELOAD}
                </div>
                <div class="gd-chrome__tools">
                  <button title="공유">${I_SHARE}</button>
                  <button title="새 탭">＋</button>
                  <button title="탭 개요">${I_TABS}</button>
                </div>
              </div>
              <div class="gd-chrome__tabs">
                <div class="gd-chrome__tab is-on">합정다락 · 통합 플랫폼<span class="gd-chrome__tabx">×</span></div>
                <div class="gd-chrome__tab">새 탭</div>
              </div>
            </div>
            <div class="gd-scroll">
              <div class="gd-surface" id="gdSurface"></div>
            </div>
          </div>
        </div>

        <div class="gd-flash"></div>
        <div class="gd-edge" title="오른쪽으로 끌면 전체화면 · 더블클릭도 가능"></div>
        <button class="gd-collapse" title="축소">‹</button>

        <div class="gd-map" id="gdMap">
          <div class="gd-map__head">MAP<small>빨강=현재 · 점선=Frame</small></div>
          <div class="gd-map__canvas" id="gdMapCanvas"></div>
        </div>
      `;

      this.stage   = this.root.querySelector('.gd-stage');
      this.surface = this.root.querySelector('#gdSurface');
      this.edge    = this.root.querySelector('.gd-edge');
      this.flash   = this.root.querySelector('.gd-flash');
      this.mapCanvas = this.root.querySelector('#gdMapCanvas');
      this.frames = [];               // 퍼블리시(=frame)한 영역들 (미니맵용)
      this.frameRects = {};           // 캔버스 위 dotted 표시 (device별)
      this.zoom = 1;                  // 화이트보드 줌 (Cmd+드래그)
    }

    // ---------------- 이벤트 ----------------
    _bind() {
      const bar = this.root.querySelector('.gd-bar');
      // 패널 클릭이 stage(제스처)로 새지 않도록
      this.root.addEventListener('mousedown', (e) => e.stopPropagation());

      // 디바이스 버튼: 한 번 누르면 미리보기 전환, 두 번 누르면 freeze/publish
      this.root.querySelectorAll('.gd-dev').forEach((b) => {
        let timer = null;
        b.addEventListener('click', () => {
          const d = b.dataset.device;
          if (timer) {                       // 두 번째 클릭 → 더블클릭
            clearTimeout(timer); timer = null;
            if (d === 'phone' || d === 'desktop') this._freezePublish(d);
            else this.setDevice(d);
            return;
          }
          timer = setTimeout(() => { timer = null; this.setDevice(d); }, 240);
        });
      });
      this.root.querySelector('.gd-publish').addEventListener('click', () => this._publish());
      this.root.querySelector('.gd-x').addEventListener('click', () => this.close());

      // 오른쪽 가장자리: 오른쪽으로 끌면 전체화면 / 왼쪽으로 끌면 축소 (더블클릭도 지원)
      this.edge.addEventListener('dblclick', () => this.setFull(true));
      this.edge.addEventListener('mousedown', (e) => this._edgeStart(e));
      this.root.querySelector('.gd-collapse').addEventListener('click', () => this.setFull(false));

      // 툴박스 → 캔버스 드래그 생성
      this.root.querySelectorAll('.gd-tool').forEach((b) => {
        b.addEventListener('mousedown', (e) => this._toolStart(e, b.dataset.type));
      });

      // 캔버스 빈 곳에서 드래그 → 영역 그리기(채우기 선택)
      this.surface.addEventListener('mousedown', (e) => this._drawStart(e));

      // 스크롤 → 미니맵 현재 위치 갱신
      this.surface.parentElement.addEventListener('scroll', () => this._scheduleMap());
      this.surface.addEventListener('scroll', () => this._scheduleMap());

      // URL 붙여넣기 → 링크/영상 카드 (그린 영역이 있으면 거기에)
      document.addEventListener('paste', (e) => { if (this.isOpen) this._onPaste(e); });

      // 미니맵 클릭 → 그 위치로 이동
      this.mapCanvas.addEventListener('mousedown', (e) => this._mapJump(e));

      // 전역 포인터 (이동/리사이즈/툴드롭/영역그리기/엣지드래그)
      window.addEventListener('mousemove', (e) => this._onMove(e));
      window.addEventListener('mouseup',   (e) => this._onUp(e));

      requestAnimationFrame(() => this._scheduleMap());
    }

    // ---------------- 엣지 드래그 → 전체화면/축소 ----------------
    _edgeStart(e) {
      e.preventDefault(); e.stopPropagation();
      this.edgeDrag = { x: e.clientX, moved: false };
    }

    // ---------------- 디바이스 미리보기 ----------------
    setDevice(d) {
      this.device = (this.device === d) ? 'design' : d;
      this.stage.classList.toggle('is-design',  this.device === 'design');
      this.stage.classList.toggle('is-phone',   this.device === 'phone');
      this.stage.classList.toggle('is-desktop', this.device === 'desktop');
      this.root.querySelectorAll('.gd-dev').forEach((b) =>
        b.classList.toggle('is-on', b.dataset.device === this.device));
      // 게시된 디바이스로 들어오면 그때 고정한 좌표(default)로 복원
      if (this.snapshots[this.device]) this._restore(this.device);
    }

    // ---- 더블클릭: 캡처 모션 → frozen! 모달 → publish ----
    _freezePublish(device) {
      if (this.device !== device) this.setDevice(device);   // 해당 화면으로 전환
      this._flash();
      this._showFreezeModal(device);
    }
    _flash() {
      this.flash.classList.remove('is-on');
      void this.flash.offsetWidth;            // 애니메이션 재시작
      this.flash.classList.add('is-on');
      setTimeout(() => this.flash.classList.remove('is-on'), 420);
    }
    _showFreezeModal(device) {
      this._closeModal();
      const ko = device === 'phone' ? '모바일' : '데스크탑';
      const m = document.createElement('div');
      m.className = 'gd-modal';
      m.innerHTML = `
        <div class="gd-modal__card">
          <div class="gd-modal__title">frozen!</div>
          <div class="gd-modal__sub">${ko} 화면을 캡처했어요</div>
          <button class="gd-modal__publish">publish?</button>
        </div>`;
      this.root.appendChild(m);
      this._modal = m;
      requestAnimationFrame(() => m.classList.add('is-on'));
      m.addEventListener('click', (e) => { if (e.target === m) this._closeModal(); });
      m.querySelector('.gd-modal__publish').addEventListener('click', () => {
        this.published[device] = true;
        this.snapshots[device] = this._snapshot();    // 현재 좌표를 default 로 고정
        // 퍼블리시한 영역을 Frame 으로 기록 → 미니맵 + 캔버스에 dotted 표시
        const bbox = this._itemsBBox();
        if (bbox) {
          const label = device === 'phone' ? '모바일' : '데스크탑';
          this.frames = this.frames.filter((f) => f.device !== device);
          this.frames.push({ device, label, ...bbox });
          this._drawFrameRect(device, label, bbox);
          this._scheduleMap();
        }
        const dev = this.root.querySelector(`.gd-dev[data-device="${device}"]`);
        if (dev) dev.classList.add('is-published');
        const card = m.querySelector('.gd-modal__card');
        card.classList.add('is-done');
        card.innerHTML = `<div class="gd-modal__check">✓</div><div class="gd-modal__title">Published</div>`;
        setTimeout(() => this._closeModal(), 1100);
      });
    }
    _closeModal() {
      if (this._modal) { this._modal.remove(); this._modal = null; }
    }
    _snapshot() {
      return [...this.surface.querySelectorAll('.g-item')].map((it) => ({
        el: it, left: it.style.left, top: it.style.top, width: it.style.width, height: it.style.height,
      }));
    }
    _restore(device) {
      const snap = this.snapshots[device];
      if (!snap) return;
      snap.forEach((s) => {
        if (!s.el.isConnected) return;
        s.el.style.left = s.left; s.el.style.top = s.top;
        if (s.width)  s.el.style.width  = s.width;
        if (s.height) s.el.style.height = s.height;
      });
    }

    // ---------------- 전체화면 ----------------
    setFull(on) {
      this.full = on;
      this.root.classList.toggle('is-full', on);
    }

    _publish() {
      const btn = this.root.querySelector('.gd-publish');
      btn.classList.add('is-done');
      btn.textContent = '게시됨 ✓';
      setTimeout(() => { btn.classList.remove('is-done'); btn.textContent = 'Publish'; }, 1600);
    }

    // ===================================================
    //  아이템 생성
    // ===================================================
    _addItem(type, x, y, opts = {}) {
      const item = document.createElement('div');
      item.className = 'g-item g-item--' + type;
      item.dataset.type = type;
      item.dataset.id = uid();
      const w = opts.w, h = opts.h;
      item.style.left = Math.round(x) + 'px';
      item.style.top  = Math.round(y) + 'px';
      if (w) item.style.width  = w + 'px';
      if (h) item.style.height = h + 'px';

      const checkable = (type === 'text' || type === 'grid');
      if (checkable) item.classList.add('is-checkable');
      item.innerHTML = `
        <div class="g-item__handle">
          <span class="g-item__grip">⋮⋮</span>
          <span class="g-item__kind">${this._kindLabel(type)}</span>
          <button class="g-item__del" title="삭제">×</button>
        </div>
        ${checkable ? `<button class="g-item__done" title="완료 — 콘텐츠만 보기">✓</button>` : ''}
        <div class="g-item__body"></div>
        <span class="g-item__resize" title="크기 조절"></span>`;

      const body = item.querySelector('.g-item__body');
      this._fillBody(type, body, opts);

      // 핸들 = 이동 / del = 삭제 / resize = 크기
      item.querySelector('.g-item__handle').addEventListener('mousedown', (e) => {
        if (e.target.closest('.g-item__del')) return;
        this._moveStart(e, item);
      });
      item.querySelector('.g-item__del').addEventListener('click', () => { item.remove(); this._scheduleMap(); });
      item.querySelector('.g-item__resize').addEventListener('mousedown', (e) => this._resizeStart(e, item));

      // 체크 → 편집 칩 숨기고 콘텐츠만 (다시 누르면 편집 모드)
      const done = item.querySelector('.g-item__done');
      if (done) done.addEventListener('click', (e) => {
        e.stopPropagation();
        const on = item.classList.toggle('is-clean');
        done.classList.toggle('is-on', on);
      });

      this.surface.appendChild(item);
      this._scheduleMap();
      return item;
    }

    _kindLabel(type) {
      return { grid: '그리드', sales: '판매창', image: '이미지', text: '글',
        folder: '폴더', link: '링크', card: '수집' }[type] || '';
    }

    _fillBody(type, body, opts) {
      if (type === 'text')   return this._buildText(body, opts);
      if (type === 'image')  return this._buildImage(body, opts);
      if (type === 'grid')   return this._buildGrid(body, opts);
      if (type === 'sales')  return this._buildSales(body, opts);
      if (type === 'folder') return this._buildFolder(body, opts);
      if (type === 'link')   return this._buildLink(body, opts);
      if (type === 'card')   return this._buildCard(body, opts);
    }

    // ---- 글 ----
    _buildText(body, opts) {
      const ed = document.createElement('div');
      ed.className = 'g-text';
      ed.contentEditable = 'true';
      ed.dataset.ph = '글을 입력하세요…';
      if (opts.text) ed.textContent = opts.text;
      body.appendChild(ed);
    }

    // ---- 이미지 ----
    _buildImage(body, opts) {
      const box = document.createElement('label');
      box.className = 'g-img';
      box.innerHTML = `
        <input type="file" accept="image/*" hidden>
        <div class="g-img__ph">${I_IMG}<span>이미지 업로드</span></div>`;
      const input = box.querySelector('input');
      input.addEventListener('change', () => this._loadImg(input, box));
      body.appendChild(box);
      if (opts.src) this._setImg(box, opts.src);
    }
    _loadImg(input, box) {
      const f = input.files && input.files[0];
      if (!f) return;
      const r = new FileReader();
      r.onload = () => this._setImg(box, r.result);
      r.readAsDataURL(f);
    }
    _setImg(box, src) {
      box.classList.add('has-img');
      box.style.backgroundImage = `url("${src}")`;
    }

    // ---- 그리드 (기본 인스타그램식 3×n) ----
    _buildGrid(body, opts) {
      const state = { cols: opts.cols || 3, rows: opts.rows || 3 };
      body.innerHTML = `
        <div class="g-grid__ctrl">
          <span class="g-grid__step" data-axis="cols">
            <button data-d="-1">−</button><b>${state.cols}</b><button data-d="1">+</button>
          </span>
          <span class="g-grid__x">열 × 행</span>
          <span class="g-grid__step" data-axis="rows">
            <button data-d="-1">−</button><b>${state.rows}</b><button data-d="1">+</button>
          </span>
          <span class="g-grid__hint">인스타식 3×n 제안</span>
        </div>
        <div class="g-grid__cells"></div>`;
      const cells = body.querySelector('.g-grid__cells');
      const render = () => {
        cells.style.gridTemplateColumns = `repeat(${state.cols}, 1fr)`;
        const need = state.cols * state.rows;
        cells.innerHTML = '';
        for (let i = 0; i < need; i++) {
          const c = document.createElement('div');
          c.className = 'g-grid__cell';
          c.innerHTML = `<input type="file" accept="image/*" hidden><span>+</span>`;
          const inp = c.querySelector('input');
          inp.addEventListener('change', () => {
            const f = inp.files && inp.files[0]; if (!f) return;
            const r = new FileReader();
            r.onload = () => this._setCell(c, `url("${r.result}")`);
            r.readAsDataURL(f);
          });
          // 칸 클릭 → 캡처/이미지 선택 팝오버
          c.addEventListener('click', (e) => {
            if (e.target === inp) return;
            this._openPicker(c, (css) => this._setCell(c, css));
          });
          cells.appendChild(c);
        }
      };
      body.querySelectorAll('.g-grid__step').forEach((s) => {
        const axis = s.dataset.axis;
        s.querySelectorAll('button').forEach((btn) => {
          btn.addEventListener('click', () => {
            state[axis] = clamp(state[axis] + Number(btn.dataset.d), 1, 8);
            s.querySelector('b').textContent = state[axis];
            render();
          });
        });
      });
      render();
    }

    // 그리드 칸 채우기 (캡처/이미지)
    _setCell(cell, cssBg) {
      cell.classList.add('has-img');
      cell.style.backgroundImage = cssBg;
    }
    _captures() {
      const out = [];
      if (this.atoms && this.atoms.rolls) {
        this.atoms.rolls.forEach((r) => r.atoms.forEach((a) => out.push({ css: a.thumbCss })));
      }
      return out.length ? out : SAMPLE_CAPS;     // 없으면 데모 샘플
    }
    //  anchor 근처에 캡처/업로드 선택 팝오버를 띄우고, 고른 결과(css 배경)를 onPick 으로 전달
    _openPicker(anchor, onPick) {
      this._closePicker();
      const caps = this._captures();
      const real = !!(this.atoms && this.atoms.rolls && this.atoms.rolls.some((r) => r.atoms.length));
      const pop = document.createElement('div');
      pop.className = 'gd-pop';
      pop.innerHTML = `
        <button class="gd-pop__up">${I_IMG}<span>이미지 업로드</span></button>
        <div class="gd-pop__label">내 캡처${real ? '' : ' · 샘플'}</div>
        <div class="gd-pop__caps">
          ${caps.map((c, i) => `<button class="gd-pop__cap" data-i="${i}" style="background-image:${c.css}"></button>`).join('')}
        </div>`;
      (document.getElementById("osWinBody")||document.body).appendChild(pop);
      this._pop = pop;
      const r = anchor.getBoundingClientRect();
      pop.style.left = Math.min(r.left, window.innerWidth - 246) + 'px';
      pop.style.top  = Math.min(r.bottom + 6, window.innerHeight - 220) + 'px';

      // 업로드용 임시 파일 input
      pop.querySelector('.gd-pop__up').addEventListener('click', () => {
        const tin = document.createElement('input');
        tin.type = 'file'; tin.accept = 'image/*';
        tin.addEventListener('change', () => {
          const f = tin.files && tin.files[0]; if (!f) return;
          const rd = new FileReader();
          rd.onload = () => onPick(`url("${rd.result}")`);
          rd.readAsDataURL(f);
        });
        tin.click();
        this._closePicker();
      });
      pop.querySelectorAll('.gd-pop__cap').forEach((b) => b.addEventListener('click', () => {
        onPick(caps[Number(b.dataset.i)].css);
        this._closePicker();
      }));
      setTimeout(() => document.addEventListener('mousedown', this._popAway = (ev) => {
        if (!pop.contains(ev.target)) this._closePicker();
      }), 0);
    }
    _closePicker() {
      if (this._pop) { this._pop.remove(); this._pop = null; }
      if (this._popAway) { document.removeEventListener('mousedown', this._popAway); this._popAway = null; }
    }

    // ---- 폴더 (한 depth · 캡처/이미지를 넣어 분류) ----
    _buildFolder(body, opts) {
      body.innerHTML = `
        <div class="g-folder">
          <div class="g-folder__head">
            <span class="g-folder__ic">${I_FOLDER}</span>
            <input class="g-folder__name" value="${opts.name || '새 폴더'}" />
            <span class="g-folder__count">0</span>
          </div>
          <div class="g-folder__preview"></div>
          <button class="g-folder__open" title="펼치기/접기">열기</button>
          <div class="g-folder__contents">
            <div class="g-folder__grid"></div>
            <button class="g-folder__add">＋ 캡처·이미지 추가</button>
          </div>
        </div>`;
      const folder  = body.querySelector('.g-folder');
      const grid    = folder.querySelector('.g-folder__grid');
      const preview = folder.querySelector('.g-folder__preview');
      const countEl = folder.querySelector('.g-folder__count');
      const items = [];
      const refresh = () => {
        countEl.textContent = items.length;
        preview.innerHTML = items.length
          ? items.slice(0, 3).map((css, i) => `<span class="g-folder__pv" style="background-image:${css};--i:${i}"></span>`).join('')
          : `<span class="g-folder__empty">비어 있음 — 캡처·이미지를 넣어 분류</span>`;
      };
      const addThumb = (css) => {
        items.push(css);
        const t = document.createElement('div');
        t.className = 'g-folder__thumb';
        t.style.backgroundImage = css;
        const rm = document.createElement('button');
        rm.className = 'g-folder__rm'; rm.textContent = '×';
        rm.addEventListener('click', (e) => {
          e.stopPropagation();
          const i = items.indexOf(css); if (i >= 0) items.splice(i, 1);
          t.remove(); refresh();
        });
        t.appendChild(rm);
        grid.appendChild(t);
        refresh();
      };
      folder.querySelector('.g-folder__open').addEventListener('click', (e) => {
        e.stopPropagation(); folder.classList.toggle('is-open');
      });
      folder.querySelector('.g-folder__add').addEventListener('click', (e) => {
        e.stopPropagation();
        this._openPicker(folder.querySelector('.g-folder__add'), (css) => addThumb(css));
      });
      folder.querySelector('.g-folder__name').addEventListener('mousedown', (e) => e.stopPropagation());
      (opts.items || []).forEach(addThumb);
      refresh();
    }

    // ---- 링크 카드 (URL 붙여넣기 → 정보 표시 / 영상이면 썸네일·제목·생산자) ----
    _buildLink(body, opts) {
      const url = opts.url || '';
      body.innerHTML = `
        <div class="g-link is-loading">
          <div class="g-link__thumb"></div>
          <div class="g-link__meta">
            <div class="g-link__title">불러오는 중…</div>
            <div class="g-link__by">${this._domain(url)}</div>
            <a class="g-link__url" href="${url}" target="_blank" rel="noopener">${url}</a>
          </div>
        </div>`;
      const el = body.querySelector('.g-link');
      el.querySelector('.g-link__url').addEventListener('mousedown', (e) => e.stopPropagation());
      if (url) this._hydrateLink(el, url);
      else {
        el.classList.remove('is-loading');
        el.querySelector('.g-link__title').textContent = 'URL 붙여넣기';
        el.querySelector('.g-link__by').textContent = '';
      }
    }
    _hydrateLink(el, url) {
      const titleEl = el.querySelector('.g-link__title');
      const byEl    = el.querySelector('.g-link__by');
      const yt = this._youtubeId(url);
      if (yt) {                                    // 영상 → 썸네일 + 제목 + 생산자
        this._setLinkThumb(el, `https://img.youtube.com/vi/${yt}/hqdefault.jpg`);
        titleEl.textContent = 'YouTube 영상';
        byEl.textContent = 'YouTube';
        el.classList.add('is-video');
        fetch(`https://www.youtube.com/oembed?format=json&url=${encodeURIComponent('https://www.youtube.com/watch?v=' + yt)}`)
          .then((r) => (r.ok ? r.json() : null))
          .then((d) => {
            if (d) {
              if (d.title) titleEl.textContent = d.title;
              if (d.author_name) byEl.textContent = d.author_name;   // 영상 생산자
              if (d.thumbnail_url) this._setLinkThumb(el, d.thumbnail_url);
            }
            el.classList.remove('is-loading');
          })
          .catch(() => el.classList.remove('is-loading'));
        return;
      }
      const dom = this._domain(url);              // 일반 URL → 도메인 + 파비콘
      titleEl.textContent = dom || url;
      byEl.textContent = '링크';
      this._setLinkThumb(el, `url("https://www.google.com/s2/favicons?domain=${dom}&sz=128")`, true);
      el.classList.remove('is-loading');
    }
    _setLinkThumb(el, src, isCss) {
      const t = el.querySelector('.g-link__thumb');
      t.style.backgroundImage = isCss ? src : `url("${src}")`;
      t.classList.toggle('is-favicon', !!isCss);
      el.classList.add('has-thumb');
    }
    _youtubeId(url) {
      const m = String(url).match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([\w-]{11})/);
      return m ? m[1] : null;
    }
    _domain(url) {
      try { return new URL(url).hostname.replace(/^www\./, ''); } catch (e) { return ''; }
    }
    _extractUrl(text) {
      const m = String(text || '').match(/https?:\/\/[^\s]+/);
      return m ? m[0] : null;
    }

    // ---- 판매창 (좌우로 긴 칸 + 상품 등록 / 칸 추가·삭제) ----
    _buildSales(body, opts) {
      body.innerHTML = `
        <div class="g-sales__head">판매창</div>
        <div class="g-sales__row"></div>`;
      const row = body.querySelector('.g-sales__row');
      const addCell = () => {
        const cell = document.createElement('div');
        cell.className = 'g-sales__cell';
        cell.innerHTML = `
          <button class="g-sales__rm" title="칸 삭제">×</button>
          <button class="g-sales__add">+<small>판매할 상품 등록하기</small></button>`;
        cell.querySelector('.g-sales__rm').addEventListener('click', () => cell.remove());
        cell.querySelector('.g-sales__add').addEventListener('click', () => this._salesForm(cell));
        row.insertBefore(cell, row.querySelector('.g-sales__more'));
      };
      const more = document.createElement('button');
      more.className = 'g-sales__more';
      more.innerHTML = `＋<small>칸 추가</small>`;
      more.addEventListener('click', addCell);
      row.appendChild(more);
      const n = opts.cells || 3;
      for (let i = 0; i < n; i++) addCell();
    }
    _salesForm(cell) {
      cell.classList.add('is-form');
      cell.innerHTML = `
        <button class="g-sales__rm" title="칸 삭제">×</button>
        <label class="g-sales__thumb"><input type="file" accept="image/*" hidden><span>사진</span></label>
        <input class="g-sales__name" placeholder="상품명">
        <input class="g-sales__price" placeholder="가격 (원)" inputmode="numeric">
        <button class="g-sales__save">등록</button>`;
      cell.querySelector('.g-sales__rm').addEventListener('click', () => cell.remove());
      const thumb = cell.querySelector('.g-sales__thumb');
      const tin = thumb.querySelector('input');
      tin.addEventListener('change', () => {
        const f = tin.files && tin.files[0]; if (!f) return;
        const r = new FileReader();
        r.onload = () => { thumb.classList.add('has-img'); thumb.style.backgroundImage = `url("${r.result}")`; };
        r.readAsDataURL(f);
      });
      cell.querySelector('.g-sales__save').addEventListener('click', () => {
        const name = cell.querySelector('.g-sales__name').value.trim() || '상품';
        const price = cell.querySelector('.g-sales__price').value.trim();
        const bg = thumb.style.backgroundImage || '';
        cell.classList.remove('is-form');
        cell.classList.add('is-product');
        cell.innerHTML = `
          <button class="g-sales__rm" title="칸 삭제">×</button>
          <div class="g-sales__pthumb"${bg ? ` style="background-image:${bg}"` : ''}></div>
          <div class="g-sales__pname">${name}</div>
          <div class="g-sales__pprice">${price ? Number(price).toLocaleString() + '원' : '가격 미정'}</div>
          <button class="g-sales__buy">구매</button>`;
        cell.querySelector('.g-sales__rm').addEventListener('click', () => cell.remove());
      });
    }

    // ---- 수집 카드 (cluster 구성용 · 캡처 atom) ----
    //  더블클릭 → 오른쪽으로 뒤집히며 뒷면에 저장 시 남긴 '의도'(메모)
    _buildCard(body, opts) {
      const thumb = opts.thumb || 'linear-gradient(135deg,#2a3550,#11151d)';
      body.innerHTML = `
        <div class="g-card">
          <div class="g-card__inner">
            <div class="g-card__front">
              <div class="g-card__thumb" style="background-image:${thumb}"></div>
              <div class="g-card__title">${opts.title || '수집한 항목'}</div>
              <div class="g-card__meta">${opts.meta || ''}</div>
              <div class="g-card__flip" title="더블클릭 → 의도 보기">⤿</div>
            </div>
            <div class="g-card__back">
              <div class="g-card__backhead">의도</div>
              <div class="g-card__note"></div>
            </div>
          </div>
        </div>`;
      const card = body.querySelector('.g-card');
      const noteEl = card.querySelector('.g-card__note');
      const atom = opts.atom || null;
      const setNote = () => {
        const t = ((atom ? atom.note : opts.note) || '').trim();
        noteEl.textContent = t || '저장할 때 남긴 메모가 없어요';
        noteEl.classList.toggle('is-empty', !t);
      };
      setNote();
      card.addEventListener('dblclick', (e) => {
        e.stopPropagation();
        setNote();                              // 최신 메모 반영(캡처 메모는 나중에 입력됨)
        card.classList.toggle('is-flipped');
      });
    }

    /** 캡처한 atom 을 garden 캔버스에 카드로 추가 */
    addCapture(atom) {
      const def = this._defaults('card');
      const n = (this._capN = (this._capN || 0) + 1);
      const x = 40 + (n % 6) * 30 + this.surface.scrollLeft;
      const y = 40 + (n % 6) * 30 + this.surface.scrollTop;
      const it = this._addItem('card', x, y, {
        w: def.w, h: def.h,
        thumb: atom.thumbCss,
        title: 'capture #' + atom.id,
        meta: '캡처 · ' + atom.time,
        atom,                          // 뒷면 '의도'(메모) 라이브 참조
      });
      it.style.zIndex = String(++_seq + 200);   // 최신 캡처가 위로
      it.classList.add('g-item--pop');
      setTimeout(() => it.classList.remove('g-item--pop'), 400);
      return it;
    }

    // ===================================================
    //  드래그: 툴 생성 / 아이템 이동 / 리사이즈
    // ===================================================
    _toolStart(e, type) {
      e.preventDefault();
      const ghost = document.createElement('div');
      ghost.className = 'gd-toolghost';
      ghost.textContent = this._kindLabel(type);
      (document.getElementById("osWinBody")||document.body).appendChild(ghost);
      this.tool = { type, ghost, x: e.clientX, y: e.clientY, moved: false };
      this._ghostAt(e.clientX, e.clientY);
    }
    _ghostAt(x, y) {
      if (!this.tool) return;
      this.tool.ghost.style.left = x + 'px';
      this.tool.ghost.style.top  = y + 'px';
      const over = this._overSurface(x, y);
      this.tool.ghost.classList.toggle('is-ok', over);
    }
    _overSurface(x, y) {
      const r = this.surface.getBoundingClientRect();
      return x >= r.left && x <= r.right && y >= r.top && y <= r.bottom;
    }
    _toSurface(x, y) {
      const r = this.surface.getBoundingClientRect();
      return { x: x - r.left + this.surface.scrollLeft, y: y - r.top + this.surface.scrollTop };
    }

    _moveStart(e, item) {
      e.preventDefault();
      const r = item.getBoundingClientRect();
      this.move = { item, dx: e.clientX - r.left, dy: e.clientY - r.top };
      item.classList.add('is-dragging');
      item.style.zIndex = String(++_seq + 100);
    }
    _resizeStart(e, item) {
      e.preventDefault(); e.stopPropagation();
      const r = item.getBoundingClientRect();
      this.resize = { item, w: r.width, h: r.height, x: e.clientX, y: e.clientY };
    }

    // ---------------- 화이트보드 줌 (Cmd+드래그) ----------------
    _zoomStart(e) {
      e.preventDefault();
      this.zoomDrag = { y0: e.clientY, z0: this.zoom };
      this.surface.style.transformOrigin = '0 0';
    }
    _applyZoom() {
      this.surface.style.zoom = this.zoom;             // 레이아웃/스크롤까지 반영 (webkit)
      let badge = this.root.querySelector('.gd-zoom');
      if (!badge) {
        badge = document.createElement('div');
        badge.className = 'gd-zoom';
        this.root.appendChild(badge);
      }
      badge.textContent = Math.round(this.zoom * 100) + '%';
      badge.classList.add('is-on');
      clearTimeout(this._zoomHide);
      this._zoomHide = setTimeout(() => badge.classList.remove('is-on'), 900);
      this._scheduleMap();
    }

    _onMove(e) {
      if (this.zoomDrag) {
        const dz = (this.zoomDrag.y0 - e.clientY) / 220;   // 위로 끌면 확대, 아래로 축소
        this.zoom = clamp(this.zoomDrag.z0 + dz, 0.35, 3);
        this._applyZoom();
        return;
      }
      if (this.edgeDrag) {
        const dx = e.clientX - this.edgeDrag.x;
        if (Math.abs(dx) > 6) this.edgeDrag.moved = true;
        if (dx > 70) this.setFull(true);
        else if (dx < -70) this.setFull(false);
        return;
      }
      if (this.draw) {
        const p = this._toSurface(e.clientX, e.clientY);
        const x = Math.min(p.x, this.draw.x0), y = Math.min(p.y, this.draw.y0);
        const w = Math.abs(p.x - this.draw.x0), h = Math.abs(p.y - this.draw.y0);
        Object.assign(this.draw.el.style, { left: x + 'px', top: y + 'px', width: w + 'px', height: h + 'px' });
        this.draw.cur = { x, y, w, h };
        return;
      }
      if (this.tool) {
        if (!this.tool.moved && Math.hypot(e.clientX - this.tool.x, e.clientY - this.tool.y) > 6) this.tool.moved = true;
        this._ghostAt(e.clientX, e.clientY);
        return;
      }
      if (this.move) {
        const r = this.surface.getBoundingClientRect();
        const x = clamp(e.clientX - r.left + this.surface.scrollLeft - this.move.dx, 0, 4000);
        const y = clamp(e.clientY - r.top  + this.surface.scrollTop  - this.move.dy, 0, 6000);
        this.move.item.style.left = Math.round(x) + 'px';
        this.move.item.style.top  = Math.round(y) + 'px';
        this._scheduleMap();
        return;
      }
      if (this.resize) {
        const w = clamp(this.resize.w + (e.clientX - this.resize.x), 120, 2000);
        const h = clamp(this.resize.h + (e.clientY - this.resize.y), 80, 2000);
        this.resize.item.style.width  = Math.round(w) + 'px';
        this.resize.item.style.height = Math.round(h) + 'px';
        this._scheduleMap();
      }
    }

    _onUp(e) {
      if (this.zoomDrag) { this.zoomDrag = null; return; }
      if (this.edgeDrag) { this.edgeDrag = null; return; }
      if (this.draw) {
        const d = this.draw; this.draw = null;
        const r = d.cur || { w: 0, h: 0 };
        if (r.w < 48 || r.h < 40) { d.el.remove(); return; }   // 너무 작으면 취소
        this._makeChooser(d.el, r);
        return;
      }
      if (this.tool) {
        const t = this.tool; this.tool = null;
        t.ghost.remove();
        if (t.moved && this._overSurface(e.clientX, e.clientY)) {
          // 드래그&드롭 → 그 자리에 생성
          const p = this._toSurface(e.clientX, e.clientY);
          const def = this._defaults(t.type);
          this._addItem(t.type, p.x - def.w / 2, p.y - 14, def);
        } else {
          // 그냥 클릭 → 화면 안에 자동 배치
          this._autoPlace(t.type);
        }
        return;
      }
      if (this.move)   { this.move.item.classList.remove('is-dragging'); this.move = null; }
      if (this.resize) { this.resize = null; }
    }

    // 버튼 클릭 시 자동 배치 (조금씩 어긋나게)
    _autoPlace(type) {
      const def = this._defaults(type);
      const n = this._cascade++ % 8;
      const x = 48 + n * 26 + this.surface.scrollLeft;
      const y = 56 + n * 26 + this.surface.scrollTop;
      this._addItem(type, x, y, def);
    }

    // ---- 캔버스 위 영역 그리기 → <fill with> 선택 ----
    _drawStart(e) {
      if (e.button !== 0) return;
      // Cmd(또는 Ctrl) + 드래그 → 화이트보드 줌 인/아웃
      if (e.metaKey || e.ctrlKey) { this._zoomStart(e); return; }
      if (e.target.closest('.g-item') || e.target.closest('.gd-marquee')) return;
      this._clearChooser();
      e.preventDefault();
      const p = this._toSurface(e.clientX, e.clientY);
      const el = document.createElement('div');
      el.className = 'gd-marquee';
      el.style.left = p.x + 'px';
      el.style.top  = p.y + 'px';
      this.surface.appendChild(el);
      this.draw = { x0: p.x, y0: p.y, el, cur: { x: p.x, y: p.y, w: 0, h: 0 } };
    }
    _clearChooser() {
      this.surface.querySelectorAll('.gd-marquee').forEach((m) => m.remove());
      this._chooserEl = null; this._chooserRect = null;
    }
    _makeChooser(el, rect) {
      el.classList.add('is-chooser');
      this._chooserEl = el; this._chooserRect = rect;     // URL 붙여넣기 대상 영역
      el.innerHTML = `
        <div class="gd-chooser">
          <button class="gd-chooser__x" title="취소">×</button>
          <div class="gd-chooser__label">&lt; fill with &gt;</div>
          <div class="gd-chooser__hint">또는 URL 붙여넣기 (⌘V)</div>
          <div class="gd-chooser__btns">
            ${TOOLS.map((t) => `<button data-type="${t.type}"><span>${t.icon}</span>${t.label}</button>`).join('')}
          </div>
        </div>`;
      el.querySelectorAll('.gd-chooser__btns button').forEach((b) => {
        b.addEventListener('click', () => { this._fillRegion(b.dataset.type, rect); el.remove(); this._chooserEl = null; this._chooserRect = null; });
      });
      el.querySelector('.gd-chooser__x').addEventListener('click', () => { el.remove(); this._chooserEl = null; this._chooserRect = null; });
    }

    // ---- URL 붙여넣기 → 링크/영상 카드 ----
    _onPaste(e) {
      const text = (e.clipboardData || window.clipboardData).getData('text');
      const url = this._extractUrl(text);
      if (!url) return;
      e.preventDefault();
      let rect;
      if (this._chooserEl && this._chooserEl.isConnected && this._chooserRect) {
        rect = this._chooserRect;                         // 그려둔 영역에 채움
        this._chooserEl.remove(); this._chooserEl = null; this._chooserRect = null;
      } else {
        const def = this._defaults('link');
        rect = { x: 60 + this.surface.scrollLeft, y: 60 + this.surface.scrollTop, w: def.w, h: def.h };
      }
      const it = this._addItem('link', rect.x, rect.y, {
        w: Math.max(260, Math.round(rect.w)), h: Math.max(150, Math.round(rect.h)), url,
      });
      it.classList.add('g-item--pop');
      setTimeout(() => it.classList.remove('g-item--pop'), 400);
    }

    // ===================================================
    //  미니맵 (limitless 캔버스 개관 · 현재 위치/Frame)
    // ===================================================
    _scheduleMap() {
      if (this._mapRaf) return;
      this._mapRaf = requestAnimationFrame(() => { this._mapRaf = null; this._renderMap(); });
    }
    _renderMap() {
      if (!this.mapCanvas) return;
      const scroller = this.surface.parentElement;        // .gd-scroll
      const worldW = Math.max(this.surface.scrollWidth, scroller.clientWidth, 1200);
      const worldH = Math.max(this.surface.scrollHeight, scroller.clientHeight, 900);
      const mw = this.mapCanvas.clientWidth || 168;
      const mh = this.mapCanvas.clientHeight || 120;
      const z = this.zoom || 1;
      const sx = mw / worldW, sy = mh / worldH;
      const px = (v) => Math.round(v * z * sx), py = (v) => Math.round(v * z * sy);

      let html = '';
      // 아이템들
      this.surface.querySelectorAll('.g-item').forEach((it) => {
        const l = parseFloat(it.style.left) || 0, t = parseFloat(it.style.top) || 0;
        const w = it.offsetWidth, h = it.offsetHeight;
        html += `<span class="gd-map__dot" style="left:${px(l)}px;top:${py(t)}px;width:${Math.max(3, px(w))}px;height:${Math.max(3, py(h))}px"></span>`;
      });
      // Frame(퍼블리시 영역) — 검정 점선
      this.frames.forEach((f) => {
        html += `<span class="gd-map__frame" style="left:${px(f.x)}px;top:${py(f.y)}px;width:${px(f.w)}px;height:${py(f.h)}px"><i>${f.label || ''}</i></span>`;
      });
      // 현재 보고 있는 뷰포트 — 빨강
      const vx = scroller.scrollLeft, vy = scroller.scrollTop;
      html += `<span class="gd-map__view" style="left:${px(vx)}px;top:${py(vy)}px;width:${px(scroller.clientWidth)}px;height:${py(scroller.clientHeight)}px"></span>`;
      this.mapCanvas.innerHTML = html;
    }
    _mapJump(e) {
      e.stopPropagation();
      const scroller = this.surface.parentElement;
      const worldW = Math.max(this.surface.scrollWidth, scroller.clientWidth, 1200);
      const worldH = Math.max(this.surface.scrollHeight, scroller.clientHeight, 900);
      const r = this.mapCanvas.getBoundingClientRect();
      const fx = (e.clientX - r.left) / r.width, fy = (e.clientY - r.top) / r.height;
      scroller.scrollLeft = fx * worldW - scroller.clientWidth / 2;
      scroller.scrollTop  = fy * worldH - scroller.clientHeight / 2;
      this._scheduleMap();
    }
    // 퍼블리시한 영역을 캔버스 위에 dotted 테두리로 표시 (device별 1개)
    _drawFrameRect(device, label, b) {
      let rect = this.frameRects[device];
      if (!rect) {
        rect = document.createElement('div');
        rect.className = 'gd-framerect';
        rect.innerHTML = `<span class="gd-framerect__tag"></span>`;
        this.surface.appendChild(rect);
        this.frameRects[device] = rect;
      }
      rect.querySelector('.gd-framerect__tag').textContent = `${label} · published`;
      rect.style.left = b.x + 'px';
      rect.style.top = b.y + 'px';
      rect.style.width = b.w + 'px';
      rect.style.height = b.h + 'px';
    }

    _itemsBBox() {
      const items = [...this.surface.querySelectorAll('.g-item')];
      if (!items.length) return null;
      let x1 = Infinity, y1 = Infinity, x2 = -Infinity, y2 = -Infinity;
      items.forEach((it) => {
        const l = parseFloat(it.style.left) || 0, t = parseFloat(it.style.top) || 0;
        x1 = Math.min(x1, l); y1 = Math.min(y1, t);
        x2 = Math.max(x2, l + it.offsetWidth); y2 = Math.max(y2, t + it.offsetHeight);
      });
      return { x: x1 - 16, y: y1 - 16, w: (x2 - x1) + 32, h: (y2 - y1) + 32 };
    }
    _fillRegion(type, rect) {
      const def = this._defaults(type);
      this._addItem(type, rect.x, rect.y, { ...def, w: Math.round(rect.w), h: Math.round(rect.h) });
    }

    _defaults(type) {
      return {
        grid:   { w: 320, h: 360 },
        sales:  { w: 520, h: 230 },
        image:  { w: 260, h: 200 },
        text:   { w: 300, h: 120 },
        folder: { w: 210, h: 188 },
        link:   { w: 320, h: 248 },
        card:   { w: 180, h: 168 },
      }[type] || { w: 260, h: 180 };
    }

    // ===================================================
    //  초기 cluster (수집물) 시드
    // ===================================================
    _seed() {
      // cluster 라벨
      const labels = [
        { text: '소니 a7m4 세팅', x: 60,  y: 28 },
        { text: '색보정 · LUT',   x: 470, y: 250 },
      ];
      labels.forEach((l) => {
        const tag = document.createElement('div');
        tag.className = 'gd-cluster';
        tag.textContent = l.text;
        tag.style.left = l.x + 'px';
        tag.style.top  = l.y + 'px';
        this.surface.appendChild(tag);
      });

      const cards = [
        { title: '노출 삼각형 정리', meta: '캡처 · 사진학개론', thumb: 'linear-gradient(135deg,#1e5f4a,#0b1c16)', x: 60,  y: 64,
          note: '조리개·셔터·ISO 관계를 한 장으로. 야간 촬영 세팅 잡을 때 다시 보려고 저장.' },
        { title: '픽처프로파일 S-Log3', meta: '캡처 · GradeMaster', thumb: 'linear-gradient(135deg,#5f1e1e,#1c0b0b)', x: 252, y: 96,
          note: '색보정 여지를 남기려고. 시네마틱 톤 테스트할 때 적용해볼 것.' },
        { title: 'AF 세팅 메모', meta: '메모', thumb: 'linear-gradient(135deg,#1e3a5f,#0b1622)', x: 150, y: 250,
          note: '인물 눈 AF를 자꾸 놓쳐서 추적 감도 값을 메모해둠.' },
        { title: '색보정 LUT 추천', meta: '캡처 · ColorGrade', thumb: 'linear-gradient(135deg,#5b1e3a,#1a0b16)', x: 470, y: 286,
          note: '합정다락 영상 톤과 비슷해서 저장. 다음 편집에 써보기.' },
        { title: '시네마틱 톤 레퍼런스', meta: '이미지', thumb: 'linear-gradient(135deg,#3a1e5f,#160b1c)', x: 662, y: 320,
          note: '다음 브이로그 색감 레퍼런스로 남김.' },
      ];
      cards.forEach((c) => this._addItem('card', c.x, c.y, { w: 180, h: 168, ...c }));
    }
  }

  Blip.Garden = Garden;
})(window.Blip);
