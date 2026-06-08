/* blip — AtomShelf 객체 (아톰 영역)
 *  상단 : 필름롤 캐러셀 (Blip A~J, 한 번에 3개)
 *  하단 : 좌 3/5 필름 스트립(atom 프레임) · 우 2/5 아톰 노트
 */
window.Blip = window.Blip || {};
(function (Blip) {
  'use strict';

  const FILMROLL_IMG = 'public/filmroll.png';

  class AtomShelf {
    constructor(panelEl) {
      this.panel = panelEl;
      this.carousel = panelEl.querySelector('#rollCarousel');
      this.track = panelEl.querySelector('#rollTrack');
      this.strip = panelEl.querySelector('#filmstrip');
      this.notes = panelEl.querySelector('#atomNotes');

      // Blip A ~ Blip J
      this.rolls = [];
      for (let i = 0; i < 10; i++) {
        this.rolls.push(new Blip.FilmRoll('Blip ' + String.fromCharCode(65 + i)));
      }

      this.center = 0;     // 정수 → 한 롤이 정중앙(좌우로 1개씩 = 3개 표시)
      this.activeIndex = 0;     // 캡처/스트립 대상 롤
      this.selectedAtom = null;  // 노트 편집 대상 atom
      this.SPACING = 110;   // 인접 롤 x 간격(px)

      this.drag = null;          // 아톰 드래그 상태

      this._buildRolls();
      this._bindCarousel();
      this._bindAtomDrag();
      this.layout();
      this.renderStrip();
      this.renderNotes();
    }

    open() {
      this.panel.classList.add('is-open');
      this.renderStrip();        // 열 때 최신 캡처/메모를 반영
      this.renderNotes();
    }
    close() { this.panel.classList.remove('is-open'); }
    get isOpen() { return this.panel.classList.contains('is-open'); }

    // ---------- 캐러셀 ----------
    _buildRolls() {
      const frag = document.createDocumentFragment();
      this.rolls.forEach((roll, i) => {
        const el = document.createElement('div');
        el.className = 'roll';
        el.innerHTML = `
          <img class="roll__img" src="${FILMROLL_IMG}" alt="" draggable="false">
          <div class="roll__name">${roll.name}</div>`;
        el.addEventListener('click', () => {
          if (el.classList.contains('is-clickable')) this.select(i);
        });
        roll.el = el;
        frag.appendChild(el);
      });
      this.track.appendChild(frag);
    }

    /** 회전목마 루프용 wrap 거리 (-n/2 .. n/2) */
    _dist(i) {
      const n = this.rolls.length;
      let d = ((i - this.center) % n + n) % n;
      if (d > n / 2) d -= n;
      return d;
    }

    layout() {
      this.rolls.forEach((roll, i) => {
        const d = this._dist(i);
        const ad = Math.abs(d);
        const el = roll.el;

        if (ad > 1.5) {                          // 화면 밖 (3개만 노출)
          el.style.opacity = '0';
          el.style.pointerEvents = 'none';
          el.classList.remove('is-center', 'is-clickable');
          el.style.transform =
            `translate(-50%,-50%) translateX(${d * this.SPACING}px) scale(.45)`;
          return;
        }
        const scale = Math.max(.62, 1 - ad * 0.34);
        el.style.transform =
          `translate(-50%,-50%) translateX(${d * this.SPACING}px) scale(${scale})`;
        el.style.opacity = String(Math.max(.5, 1 - ad * 0.35));
        el.style.zIndex = String(100 - Math.round(ad * 10));
        el.style.pointerEvents = '';

        el.classList.toggle('is-center', ad < 0.5);   // 정중앙 1개
        el.classList.add('is-clickable');             // 보이는 3개 모두 클릭 가능
        el.classList.toggle('is-active', i === this.activeIndex);
      });
    }

    /** +면 오른→왼(다음), -면 반대. 정수로 스냅 */
    rotate(steps) {
      this.center = Math.round(this.center - steps);
      this.layout();
    }

    /** 롤 선택: 중앙으로 회전시키고 활성 롤로 */
    select(i) {
      this.center = i;
      this.activeIndex = i;
      this.selectedAtom = this.rolls[i].atoms[0] || null;
      this.layout();
      this.renderStrip();
      this.renderNotes();
    }

    _bindCarousel() {
      let dragging = false, lastX = 0, accum = 0;

      this.carousel.addEventListener('mousedown', (e) => {
        e.preventDefault();
        dragging = true; lastX = e.clientX; accum = 0;
        this.carousel.classList.add('is-grabbing');
      });
      window.addEventListener('mousemove', (e) => {
        if (!dragging) return;
        accum += e.clientX - lastX;
        lastX = e.clientX;
        if (Math.abs(accum) >= this.SPACING * 0.5) {   // 오른→왼(dx<0) → center 증가
          this.center += (accum < 0 ? 1 : -1);
          accum = 0;
          this.layout();
        }
      });
      window.addEventListener('mouseup', () => {
        if (!dragging) return;
        dragging = false;
        this.carousel.classList.remove('is-grabbing');
        this.center = Math.round(this.center);
        this.layout();
      });

      // 휠: 위로(deltaY<0) → 오른→왼(+), 아래 → 반대(-)
      this.carousel.addEventListener('wheel', (e) => {
        e.preventDefault();
        this.rotate(e.deltaY < 0 ? 1 : -1);
      }, { passive: false });
    }

    // ---------- 필름 스트립 ----------
    addCapture(atom, open = true) {
      this.rolls[this.activeIndex].add(atom);
      this.selectedAtom = atom;                 // 새 캡처 자동 선택
      this.renderStrip(true);
      this.renderNotes();
      if (open) this.open();                     // open=false → 나중에 atom 영역 열 때 등장
    }

    selectAtom(atom) {
      this.selectedAtom = atom;
      this._highlightSelected();
      this.renderNotes();
    }

    _highlightSelected() {
      const id = this.selectedAtom ? this.selectedAtom.id : null;
      this.strip.querySelectorAll('.atom-frame').forEach((f) => {
        f.classList.toggle('is-selected', Number(f.dataset.id) === id);
      });
    }

    renderStrip(animateTop) {
      const roll = this.rolls[this.activeIndex];
      this.strip.innerHTML = `
        <div class="filmstrip__head">${roll.name} · ${roll.count}</div>
        <div class="filmstrip__inner"></div>`;
      const inner = this.strip.querySelector('.filmstrip__inner');

      if (roll.count === 0) {
        inner.innerHTML =
          `<div class="filmstrip__empty">캡처된 atom 없음<small>좌+우 동시 클릭</small></div>`;
        return;
      }

      roll.atoms.forEach((atom, idx) => {
        const f = document.createElement('div');
        f.className = 'atom-frame' + (animateTop && idx === 0 ? ' is-new' : '');
        f.dataset.id = atom.id;
        f.style.backgroundImage = atom.thumbCss;
        f.innerHTML =
          `<span class="atom-frame__no">#${atom.id}</span>
           <span class="atom-frame__time">${atom.time}</span>`;
        // 클릭=선택 / 스트립 밖으로 드래그=제거
        f.addEventListener('mousedown', (e) => {
          if (e.button !== 0) return;
          e.preventDefault();
          this.drag = { atom, frameEl: f, startX: e.clientX, startY: e.clientY, active: false, ghost: null };
        });
        inner.appendChild(f);
      });
      this._highlightSelected();
    }

    // ---------- 아톰 드래그(스트립 밖으로 빼면 제거) ----------
    _bindAtomDrag() {
      window.addEventListener('mousemove', (e) => {
        const d = this.drag;
        if (!d) return;
        if (!d.active) {
          if (Math.hypot(e.clientX - d.startX, e.clientY - d.startY) < 6) return;
          d.active = true;
          d.frameEl.classList.add('is-dragging');
          d.ghost = document.createElement('div');
          d.ghost.className = 'atom-ghost';
          d.ghost.style.backgroundImage = d.atom.thumbCss;
          document.body.appendChild(d.ghost);
        }
        d.ghost.style.left = e.clientX + 'px';
        d.ghost.style.top = e.clientY + 'px';
        d.ghost.classList.toggle('is-remove', this._outsideStrip(e.clientX, e.clientY));
      });

      window.addEventListener('mouseup', (e) => {
        const d = this.drag;
        if (!d) return;
        this.drag = null;
        if (!d.active) { this.selectAtom(d.atom); return; }   // 이동 없으면 그냥 선택
        d.frameEl.classList.remove('is-dragging');
        if (d.ghost) d.ghost.remove();
        if (this._outsideStrip(e.clientX, e.clientY)) this._removeAtom(d.atom);
      });
    }

    _outsideStrip(x, y) {
      const r = this.strip.getBoundingClientRect();
      return x < r.left || x > r.right || y < r.top || y > r.bottom;
    }

    _removeAtom(atom) {
      const roll = this.rolls[this.activeIndex];
      roll.remove(atom);
      if (this.selectedAtom === atom) this.selectedAtom = roll.atoms[0] || null;
      this.renderStrip();
      this.renderNotes();
    }

    // ---------- 아톰 노트 ----------
    renderNotes() {
      const atom = this.selectedAtom;
      if (!atom) {
        this.notes.innerHTML =
          `<div class="atom-notes__empty">프레임을 선택하면<br>여기에 메모를 적을 수 있어요</div>`;
        return;
      }
      this.notes.innerHTML = `
        <div class="atom-notes__head">📝 #${atom.id} · ${atom.time}</div>
        <textarea class="atom-notes__area" placeholder="memo"></textarea>`;
      const area = this.notes.querySelector('.atom-notes__area');
      area.value = atom.note;
      area.addEventListener('input', () => { atom.note = area.value; });
    }
  }

  Blip.AtomShelf = AtomShelf;
})(window.Blip);
