/* blip — Atom & FilmRoll 객체
 * Atom    : 스크린 캡처 한 장 (필름 한 프레임)
 * FilmRoll: Blip A~J, atom 들을 담는 하나의 필름롤
 */
window.Blip = window.Blip || {};
(function (Blip) {
  'use strict';

  let _seq = 0;

  class Atom {
    constructor(opts = {}) {
      this.id        = ++_seq;
      this.createdAt = opts.createdAt || new Date();
      this.image     = opts.image || null;          // 실제 캡처 dataURL (없으면 placeholder)
      this.note      = opts.note || '';             // 이 atom 에 대한 메모 (세션 한정)
    }
    get label() { return 'capture #' + this.id; }
    get time()  { return this.createdAt.toTimeString().slice(0, 8); }

    /** 프레임 배경으로 쓸 CSS background-image 값 */
    get thumbCss() {
      if (this.image) return `url("${this.image}")`;
      // 캡처 실패 시 흑백 필름 느낌 placeholder
      const a = 18 + (this.id * 47) % 55;
      const b = 55 + (this.id * 83) % 120;
      const ang = (this.id * 37) % 360;
      return `linear-gradient(${ang}deg, hsl(0 0% ${a}%), hsl(0 0% ${b}%))`;
    }
  }

  class FilmRoll {
    constructor(name) {
      this.name  = name;
      this.atoms = [];
    }
    /** 새 캡처는 롤의 '앞(스트립 최상단)'에 쌓인다 — 최신 프레임이 위로 */
    add(atom) { this.atoms.unshift(atom); return atom; }
    remove(atom) {
      const i = this.atoms.indexOf(atom);
      if (i >= 0) this.atoms.splice(i, 1);
      return i >= 0;
    }
    get count() { return this.atoms.length; }
  }

  Blip.Atom = Atom;
  Blip.FilmRoll = FilmRoll;
})(window.Blip);
