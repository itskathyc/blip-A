/* blip — Editor 객체 (하단 편집창)
 *  - open()       : 기본 높이(42vh)로 열기
 *  - openFull()   : 전체화면
 *  - close()      : 닫기
 *  - 헤더 바를 드래그해서 높이 조절 → 위로 끝까지 끌면 전체화면, 아래로 내리면 닫힘
 */
window.Blip = window.Blip || {};
(function (Blip) {
  'use strict';

  class Editor {
    constructor(panelEl) {
      this.panel = panelEl;
      this.bar   = panelEl.querySelector('.panel__bar');
      this.brlWrap = panelEl.querySelector('#brlWrap');
      this.onChange = null;       // 높이/상태 변할 때 호출 (배경 밀기용)
      this._bindDrag();
      this._bindBrl();
    }

    /** 현재 차지하는 높이 (닫혀 있으면 0) */
    currentHeight() { return this.isOpen ? this.panel.offsetHeight : 0; }
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

    open() {
      this.panel.classList.add('is-open');
      this.panel.classList.remove('is-fullscreen');
      this.panel.style.height = '';
      this._emit();
    }
    openFull() {
      this.panel.classList.add('is-open', 'is-fullscreen');
      this.panel.style.height = '';
      this._emit();
    }
    close() {
      this.panel.classList.remove('is-open', 'is-fullscreen');
      this.panel.style.height = '';
      this._emit();
    }
    toggleFull() {
      if (this.panel.classList.contains('is-fullscreen')) this.open();
      else this.openFull();
    }
    get isOpen()  { return this.panel.classList.contains('is-open'); }
    get isFull()  { return this.panel.classList.contains('is-fullscreen'); }

    // 헤더 드래그로 높이 조절 (위로 쭉 끌면 전체화면)
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
        const h = Math.min(window.innerHeight, Math.max(0, window.innerHeight - e.clientY));
        this.panel.classList.add('is-open');
        this.panel.classList.remove('is-fullscreen');
        this.panel.style.height = h + 'px';
        this._emit();
      });

      window.addEventListener('mouseup', () => {
        if (!dragging) return;
        dragging = false;
        this.panel.style.transition = '';
        document.body.classList.remove('editor-dragging');
        const ratio = this.panel.offsetHeight / window.innerHeight;
        if (ratio > 0.8)       this.openFull();    // 위로 쭉 → 전체화면
        else if (ratio < 0.15) this.close();       // 아래로 쭉 → 닫힘
        else                   this.open();        // 기본 높이로 스냅
      });
    }
  }

  Blip.Editor = Editor;
})(window.Blip);
