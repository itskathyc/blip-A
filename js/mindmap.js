/* blip — Mindmap (Editor 본문)
 *  - browser / reaction 큰 버블 + reaction 하위 작은 버블들
 *  - 휠 줌인/아웃, 배경 드래그 팬
 *  - 큰 버블 클릭 → 그쪽으로 줌
 *  - 버블 클릭(선택) → 에디터 4등분(좌 1/4 마인드맵, 우 3/4 항목)
 *  - 버블 A 드래그 → B 에서 떼면 edge 생성
 *  - edge 우클릭 → 연결끊기
 */
window.Blip = window.Blip || {};
(function (Blip) {
  'use strict';

  const SVGNS = 'http://www.w3.org/2000/svg';
  const el = (n, a) => {
    const e = document.createElementNS(SVGNS, n);
    for (const k in a) e.setAttribute(k, a[k]);
    return e;
  };
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

  class Mindmap {
    constructor(canvasEl, detailEl, wrapEl) {
      this.canvas = canvasEl;
      this.detail = detailEl;
      this.wrap   = wrapEl;

      this.s = 1; this.tx = 0; this.ty = 0;
      this.selected = null;
      this.link = null;     // 드래그-연결 상태
      this.pan = null;      // 배경 팬 상태

      this._initData();
      this._build();
      this._bind();
    }

    _initData() {
      const reactions = ['기대하기', '전문성', '자극도', '거짓뉴스확률', '20대', '남성'];
      this.nodes = [
        { id: 'browser',  label: 'browser',  x: -210, y: 0,  r: 70, big: true },
        { id: 'reaction', label: 'reaction', x: 160,  y: 0,  r: 62, big: true },
      ];
      const rx = 160, ry = 0, R = 185;
      reactions.forEach((label, i) => {
        const a = (-90 + i * (180 / (reactions.length - 1))) * Math.PI / 180;
        this.nodes.push({
          id: 'r' + i, label,
          x: rx + R * Math.cos(a), y: ry + R * Math.sin(a),
          r: 36, big: false,
        });
      });
      this.edges = [{ a: 'browser', b: 'reaction' }];
      reactions.forEach((_, i) => this.edges.push({ a: 'reaction', b: 'r' + i }));
    }

    _node(id) { return this.nodes.find((n) => n.id === id); }

    // ---------------- DOM ----------------
    _build() {
      this.svg = el('svg', { class: 'mm__svg' });
      this.view = el('g', { class: 'mm__view' });
      this.gEdges = el('g', { class: 'mm__edges' });
      this.gNodes = el('g', { class: 'mm__nodes' });
      this.view.appendChild(this.gEdges);
      this.view.appendChild(this.gNodes);
      this.svg.appendChild(this.view);
      this.canvas.appendChild(this.svg);

      this._buildNodes();
      this._buildEdges();

      // edge 컨텍스트 메뉴
      this.menu = document.createElement('div');
      this.menu.className = 'mm-menu';
      this.menu.style.display = 'none';
      document.body.appendChild(this.menu);
    }

    _buildNodes() {
      this.gNodes.innerHTML = '';
      this.nodes.forEach((n) => {
        const g = el('g', { class: 'mm__node' + (n.big ? ' is-big' : ''), 'data-id': n.id });
        g.appendChild(el('circle', { cx: n.x, cy: n.y, r: n.r }));
        const t = el('text', { x: n.x, y: n.y, 'font-size': n.big ? 15 : 10 });
        t.textContent = n.label;
        g.appendChild(t);
        n.g = g;
        this.gNodes.appendChild(g);
      });
    }

    _buildEdges() {
      this.gEdges.innerHTML = '';
      this.edges.forEach((e, i) => {
        const a = this._node(e.a), b = this._node(e.b);
        if (!a || !b) return;
        const line = el('line', {
          class: 'mm__edge', x1: a.x, y1: a.y, x2: b.x, y2: b.y,
          'stroke-width': (a.big && b.big) ? 18 : 11, 'data-i': i,
        });
        e.line = line;
        this.gEdges.appendChild(line);
      });
    }

    _applyView(animate) {
      this.view.style.transition = animate ? 'transform .35s cubic-bezier(.2,.8,.2,1)' : 'none';
      this.view.setAttribute('transform', `translate(${this.tx} ${this.ty}) scale(${this.s})`);
    }

    // ---------------- view helpers ----------------
    _rect() { return this.svg.getBoundingClientRect(); }
    _toLocal(e) { const r = this._rect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; }
    _toWorld(sx, sy) { return { x: (sx - this.tx) / this.s, y: (sy - this.ty) / this.s }; }

    fit() {
      const r = this._rect();
      const W = r.width || 600, H = r.height || 300;
      let minx = Infinity, miny = Infinity, maxx = -Infinity, maxy = -Infinity;
      this.nodes.forEach((n) => {
        minx = Math.min(minx, n.x - n.r); maxx = Math.max(maxx, n.x + n.r);
        miny = Math.min(miny, n.y - n.r); maxy = Math.max(maxy, n.y + n.r);
      });
      const gw = maxx - minx, gh = maxy - miny;
      this.s = clamp(Math.min(W / (gw + 80), H / (gh + 80)), 0.3, 1.6);
      this.tx = W / 2 - ((minx + maxx) / 2) * this.s;
      this.ty = H / 2 - ((miny + maxy) / 2) * this.s;
      this._applyView();
    }

    _zoomAt(factor, sx, sy) {
      const w = this._toWorld(sx, sy);
      this.s = clamp(this.s * factor, 0.3, 4);
      this.tx = sx - w.x * this.s;
      this.ty = sy - w.y * this.s;
      this._applyView();
    }

    _zoomToNode(n) {
      const r = this._rect();
      this.s = clamp(this.s < 1.6 ? 1.9 : this.s, 0.3, 4);
      this.tx = r.width / 2 - n.x * this.s;
      this.ty = r.height / 2 - n.y * this.s;
      this._applyView(true);
    }

    // ---------------- 선택 / 분할 ----------------
    selectNode(n) {
      this.selected = n;
      this.wrap.classList.add('is-split');
      this._renderDetail();
      // 분할로 캔버스 크기가 바뀌므로 다음 프레임에 줌 보정
      requestAnimationFrame(() => {
        if (n.big) this._zoomToNode(n);
        else this.fit();
      });
    }

    _renderDetail() {
      const n = this.selected;
      const neigh = this.edges
        .filter((e) => e.a === n.id || e.b === n.id)
        .map((e) => this._node(e.a === n.id ? e.b : e.a))
        .filter(Boolean);
      this.detail.innerHTML = `
        <div class="mm-detail__head">
          <b>${n.label}</b>
          <button class="mm-detail__close" title="닫기">✕</button>
        </div>
        <div class="mm-detail__sub">${n.big ? '큰 버블' : 'reaction'} · 연결 ${neigh.length}개</div>
        <ul class="mm-detail__list">
          ${neigh.map((x) => `<li>${x.label}</li>`).join('') || '<li class="mm-detail__empty">연결된 항목 없음</li>'}
        </ul>`;
      this.detail.querySelector('.mm-detail__close').onclick = () => this.unselect();
    }

    unselect() {
      this.selected = null;
      this.wrap.classList.remove('is-split');
      requestAnimationFrame(() => this.fit());
    }

    // ---------------- edge 메뉴 ----------------
    _showEdgeMenu(x, y, edge) {
      this.menu.innerHTML = `<button class="mm-menu__item">연결끊기</button>`;
      this.menu.style.display = 'block';
      this.menu.style.left = x + 'px';
      this.menu.style.top = y + 'px';
      this.menu.querySelector('button').onclick = (ev) => {
        ev.stopPropagation();
        this.edges = this.edges.filter((e) => e !== edge);
        this._buildEdges();
        this._closeMenu();
      };
    }
    _closeMenu() { this.menu.style.display = 'none'; }

    addEdge(aId, bId) {
      if (aId === bId) return;
      if (this.edges.some((e) => (e.a === aId && e.b === bId) || (e.a === bId && e.b === aId))) return;
      this.edges.push({ a: aId, b: bId });
      this._buildEdges();
    }

    // ---------------- events ----------------
    _bind() {
      // 휠 줌
      this.svg.addEventListener('wheel', (e) => {
        e.preventDefault();
        const p = this._toLocal(e);
        this._zoomAt(e.deltaY < 0 ? 1.12 : 0.89, p.x, p.y);
      }, { passive: false });

      this.svg.addEventListener('mousedown', (e) => {
        if (this.menu.style.display === 'block') this._closeMenu();
        const nodeG = e.target.closest('.mm__node');
        const edgeL = e.target.closest('.mm__edge');

        if (edgeL && e.button === 2) {       // edge 우클릭 → 연결끊기
          e.preventDefault();
          const edge = this.edges[+edgeL.dataset.i];
          this._showEdgeMenu(e.clientX, e.clientY, edge);
          return;
        }
        if (nodeG && e.button === 0) {        // 노드: 클릭=선택/줌, 드래그=연결
          e.preventDefault();
          this.link = { node: this._node(nodeG.dataset.id), sx: e.clientX, sy: e.clientY, moved: false, temp: null };
          return;
        }
        if (e.button === 0) {                 // 배경 팬
          this.pan = { x: e.clientX, y: e.clientY };
        }
      });

      window.addEventListener('mousemove', (e) => {
        if (this.link) {
          const d = Math.hypot(e.clientX - this.link.sx, e.clientY - this.link.sy);
          if (d > 5) this.link.moved = true;
          if (this.link.moved) {
            const a = this.link.node;
            const p = this._toLocal(e); const w = this._toWorld(p.x, p.y);
            if (!this.link.temp) {
              this.link.temp = el('line', { class: 'mm__templine' });
              this.gEdges.appendChild(this.link.temp);
            }
            this.link.temp.setAttribute('x1', a.x); this.link.temp.setAttribute('y1', a.y);
            this.link.temp.setAttribute('x2', w.x); this.link.temp.setAttribute('y2', w.y);
          }
          return;
        }
        if (this.pan) {
          this.tx += e.clientX - this.pan.x;
          this.ty += e.clientY - this.pan.y;
          this.pan = { x: e.clientX, y: e.clientY };
          this._applyView();
        }
      });

      window.addEventListener('mouseup', (e) => {
        if (this.link) {
          const lk = this.link; this.link = null;
          if (lk.temp) lk.temp.remove();
          if (lk.moved) {
            const t = document.elementFromPoint(e.clientX, e.clientY);
            const ng = t && t.closest ? t.closest('.mm__node') : null;
            if (ng && ng.dataset.id !== lk.node.id) this.addEdge(lk.node.id, ng.dataset.id);
          } else {
            this.selectNode(lk.node);          // 클릭: 선택(+큰 버블이면 줌)
          }
          return;
        }
        this.pan = null;
      });

      document.addEventListener('mousedown', (e) => {
        if (this.menu.style.display === 'block' && !this.menu.contains(e.target)) this._closeMenu();
      }, true);
    }
  }

  Blip.Mindmap = Mindmap;
})(window.Blip);
