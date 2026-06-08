/* blip — HUD (게임 헤드업 디스플레이 스코어 오버레이)
 *  파이메뉴에서 HUD 를 켜면 우측 알고리즘 추천 콘텐츠(.yt-reco)마다
 *  게임 HUD 처럼 연두색 점수가 뜬다.
 *    · 중앙(가장 큰 글자) : 목적달성률  랜덤%
 *    · 좌측 상단          : 웃음 아이콘(라인) + 랜덤%
 *    · 중앙 상단          : intelligence 랜덤%
 *    · 우측 상단          : comments(말풍선 아이콘) + 랜덤 숫자
 *  점수와 별개로, 카드를 클릭하면 해당 콘텐츠를 재생/페이지로 이동한다.
 */
window.Blip = window.Blip || {};
(function (Blip) {
  'use strict';

  // 라인(아웃라인)만 딴 아이콘들
  const SMILE = `<svg class="hud__ic" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="9"/>
      <path d="M8 14.5c1 1.4 2.4 2.1 4 2.1s3-.7 4-2.1"/>
      <path d="M9 9.5h.01"/><path d="M15 9.5h.01"/></svg>`;
  const CHAT = `<svg class="hud__ic" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <path d="M21 11.5a8.4 8 0 0 1-11.6 7.4L3 21l2.1-6.3A8 8 0 1 1 21 11.5z"/></svg>`;

  const ri = (lo, hi) => lo + Math.floor(Math.random() * (hi - lo + 1));
  const fmtNum = (n) => (n >= 1000 ? (n / 1000).toFixed(1).replace(/\.0$/, '') + '천' : String(n));

  class Hud {
    constructor(recosEl) {
      this.recos = recosEl;          // #ytRecos — 우측 추천 묶음(bulk)
      this.on = false;
    }

    toggle() { this.on ? this.disable() : this.enable(); }

    enable() {
      if (!this.recos) return;
      this.on = true;
      document.body.classList.add('hud-on');
      this.recos.querySelectorAll('.yt-reco').forEach((reco) => {
        reco.classList.add('has-hud');
        let card = reco.querySelector('.hud');
        if (!card) {
          card = document.createElement('div');
          card.className = 'hud';
          // 점수와 별개로: 클릭 → 해당 콘텐츠 재생/페이지 이동
          //  (제스처 파이프라인이 가로채지 않도록 이벤트 전파 차단)
          card.addEventListener('mousedown', (e) => e.stopPropagation());
          card.addEventListener('mouseup', (e) => e.stopPropagation());
          card.addEventListener('click', (e) => { e.stopPropagation(); this._go(reco); });
          reco.appendChild(card);
        }
        card.innerHTML = this._html();
      });
    }

    disable() {
      this.on = false;
      document.body.classList.remove('hud-on');
      if (!this.recos) return;
      this.recos.querySelectorAll('.yt-reco.has-hud').forEach((reco) => {
        reco.classList.remove('has-hud');
        const card = reco.querySelector('.hud');
        if (card) card.remove();
      });
    }

    _html() {
      const goal = ri(1, 99), smile = ri(1, 99), intel = ri(1, 99), comments = ri(12, 4800);
      return `
        <div class="hud__top hud__top--l">${SMILE}<span>${smile}%</span></div>
        <div class="hud__top hud__top--c"><small>INTELLIGENCE</small><span>${intel}%</span></div>
        <div class="hud__top hud__top--r">${CHAT}<span>${fmtNum(comments)}</span></div>
        <div class="hud__main"><b>${goal}%</b><small>목적달성률</small></div>`;
    }

    _go(reco) {
      const t = reco.querySelector('.yt-reco__title');
      const title = (t ? t.textContent : '').trim();
      const url = 'https://www.youtube.com/results?search_query=' + encodeURIComponent(title);
      window.open(url, '_blank', 'noopener');
    }
  }

  Blip.Hud = Hud;
})(window.Blip);
