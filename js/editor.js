/* blip — Editor 객체 (좌측 하단 마인드맵 미니맵)
 *  - 기본 상태(is-minimap) : 게임 미니맵처럼 좌측 하단에 항상 떠 있는 작은 창
 *  - 윗 border(헤더 바)를 잡아 위로 끌면 → 끈 범위까지 확대(is-expanded)
 *      · 거의 끝까지 끌면 전체화면(is-fullscreen), 거의 안 끌면 다시 미니맵
 *  - 확대 버튼 : 미니맵 ↔ 전체화면 토글
 *  - captureNote(atom) : 캡처 순간 미니맵 위에 메모 입력창을 띄우고
 *      입력과 동시에 atom.note 에 저장. 3초간 무입력이면 메모 없이 닫힘.
 */
window.Blip = window.Blip || {};
(function (Blip) {
  'use strict';

  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  const MIN_W = 320, MIN_H = 220;     // 미니맵 기본 크기 (styles.css 와 일치)

  class Editor {
    constructor(panelEl) {
      this.panel   = panelEl;
      this.bar     = panelEl.querySelector('.panel__bar');
      this.brlWrap = panelEl.querySelector('#brlWrap');
      this.capNote = document.getElementById('captureNote');
      this.onChange = null;        // 크기/상태 변할 때 호출 (마인드맵 fit 용)
      this._noteCleanup = null;    // 진행 중인 캡처 메모 정리 함수

      this.minimize(true);         // 시작 = 미니맵
      this._bindDrag();
      this._bindBrl();
    }

    /** 배경이 양보해야 할 높이 — 전체화면일 때만 의미 있음 */
    currentHeight() { return this.isFull ? window.innerHeight : 0; }
    _emit() { if (this.onChange) this.onChange(this.currentHeight()); }

    // URL ↔ 맥락 히스토리 토글
    _bindBrl() {
      const toggle = this.panel.querySelector('#brlToggle');
      if (!toggle) return;
      toggle.addEventListener('mousedown', (e) => e.stopPropagation());
      toggle.addEventListener('click', (e) => {
        e.stopPropagation();
        const on = this.brlWrap.classList.toggle('is-history');
        toggle.setAttribute('aria-checked', on ? 'true' : 'false');
      });
    }

    // ---------------- 상태 전환 ----------------
    minimize(silent) {
      this.panel.classList.add('is-minimap');
      this.panel.classList.remove('is-expanded', 'is-fullscreen');
      this.panel.style.width = '';
      this.panel.style.height = '';
      if (!silent) this._emit();
    }
    open() {                       // 중간 크기로 펼치기
      this.panel.classList.add('is-expanded');
      this.panel.classList.remove('is-minimap', 'is-fullscreen');
      this.panel.style.width  = Math.round(window.innerWidth  * 0.6) + 'px';
      this.panel.style.height = Math.round(window.innerHeight * 0.6) + 'px';
      this._emit();
    }
    openFull() {
      this.panel.classList.add('is-fullscreen');
      this.panel.classList.remove('is-minimap', 'is-expanded');
      this.panel.style.width = '';
      this.panel.style.height = '';
      this._emit();
    }
    close() { this.minimize(); }   // 닫기 = 미니맵으로 접기 (항상 떠 있으므로)
    toggleFull() { if (this.isFull) this.minimize(); else this.openFull(); }

    get isMinimap()  { return this.panel.classList.contains('is-minimap'); }
    get isExpanded() { return this.panel.classList.contains('is-expanded'); }
    get isFull()     { return this.panel.classList.contains('is-fullscreen'); }
    get isOpen()     { return this.isExpanded || this.isFull; }

    // ---------------- 윗 border 드래그 ----------------
    _bindDrag() {
      let dragging = false;

      this.bar.addEventListener('mousedown', (e) => {
        if (e.button !== 0) return;
        if (e.target.closest('button, .brl')) return;   // 버튼·URL바 조작은 제외
        e.preventDefault();
        dragging = true;
        this.panel.style.transition = 'none';
        document.body.classList.add('editor-dragging');
      });

      window.addEventListener('mousemove', (e) => {
        if (!dragging) return;
        const fullH = window.innerHeight, fullW = window.innerWidth;
        const h = clamp(fullH - e.clientY, 0, fullH);            // 좌하단 기준 높이
        const prog = clamp((h - MIN_H) / (fullH - MIN_H), 0, 1); // 위로 끈 정도
        const w = MIN_W + (fullW - MIN_W) * prog;                // 끌수록 우측으로도 확장
        this.panel.classList.add('is-expanded');
        this.panel.classList.remove('is-minimap', 'is-fullscreen');
        this.panel.style.height = h + 'px';
        this.panel.style.width  = w + 'px';
        this._emit();
      });

      window.addEventListener('mouseup', () => {
        if (!dragging) return;
        dragging = false;
        this.panel.style.transition = '';
        document.body.classList.remove('editor-dragging');
        const ratio = this.panel.offsetHeight / window.innerHeight;
        if (ratio > 0.85)      this.openFull();    // 끝까지 → 전체화면
        else if (ratio < 0.30) this.minimize();    // 거의 안 끌면 → 미니맵
        else                   this._emit();       // 드래그한 범위 그대로 유지
      });
    }

    // ---------------- 캡처 메모 ----------------
    captureNote(atom) {
      const box = this.capNote;
      if (!box) return;
      if (this._noteCleanup) this._noteCleanup();   // 이전 메모창 정리

      const area = box.querySelector('.capnote__area');
      const timerEl = box.querySelector('.capnote__timer');
      area.value = atom.note || '';

      box.classList.add('is-open');
      box.setAttribute('aria-hidden', 'false');
      requestAnimationFrame(() => area.focus());

      let count = 3;
      if (timerEl) timerEl.textContent = count + 's';
      const interval = setInterval(() => {
        count -= 1;
        if (timerEl) timerEl.textContent = Math.max(0, count) + 's';
      }, 1000);
      const timeout = setTimeout(() => {
        if (!area.value.trim()) { atom.note = ''; hide(); }   // 3초간 무입력 → 메모 없음
      }, 3000);

      const stopTimers = () => {
        clearTimeout(timeout);
        clearInterval(interval);
        if (timerEl) timerEl.textContent = '';
      };

      const onInput = () => {
        atom.note = area.value;     // 입력과 동시에 저장
        stopTimers();               // 입력 시작 → 자동 사라짐 취소
      };
      const onKey = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); commit(); }
        else if (e.key === 'Escape') { e.preventDefault(); atom.note = ''; hide(); }
      };
      const onBlur = () => commit();

      const self = this;
      function commit() { atom.note = area.value.trim(); hide(); }
      function hide() {
        stopTimers();
        box.classList.remove('is-open');
        box.setAttribute('aria-hidden', 'true');
        area.removeEventListener('input', onInput);
        area.removeEventListener('keydown', onKey);
        area.removeEventListener('blur', onBlur);
        self._noteCleanup = null;
      }

      area.addEventListener('input', onInput);
      area.addEventListener('keydown', onKey);
      area.addEventListener('blur', onBlur);
      this._noteCleanup = hide;
    }
  }

  Blip.Editor = Editor;
})(window.Blip);
