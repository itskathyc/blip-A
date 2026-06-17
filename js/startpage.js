/* blip — Startpage (나의 책장 · 홈)
 *  레퍼런스: 비비드 아트북 책장(색감) + Readowl 디지털 서재(레이아웃)를 섞음.
 *  - 좌측 사이드바: 로고 / 내비 / (하단) "My" + 사용자명 "Cheddar"
 *  - 우측 나무 책장: 내가 "팔로잉"하는 사람들의 SNS 화면이 책처럼 꽂힘
 *      (유튜브 · 인스타 · X · 틱톡 · 스레드 · 블로그 · 비핸스 · 핀터레스트 · 트위치 · 브런치)
 *
 *  액션
 *  - 좌측 하단(My/Cheddar) 클릭 → blip Garden 등장  (CustomEvent 'blip:openGarden')
 *  - 좌→우 드래그(flip) → 스타트페이지가 zoom-out 으로 벌어지며 뒤의 브라우저(YouTube)가 드러남
 */
(function () {
  'use strict';

  // 페이지 전환(클릭 스위처 제거됨 → 미러볼에서만 호출)
  const showPage = (w) => { if (window.Blip && window.Blip.showPage) window.Blip.showPage(w); };

  // 내 Frame들 (퍼블리시한 blip 가든 미리보기) — 좌하단 "My"
  const MY_FRAMES = [
    { name: '체다의 카메라설정', date: '2026.06.16', c: 'linear-gradient(150deg,#ff9e6b,#d7587f)' },
    { name: 'Blip 구상',       date: '2026.06.16', c: 'linear-gradient(150deg,#7b8cff,#3a2bb8)' },
  ];

  // ─────────────────────────────────────────────────────────
  //  플랫폼 메타 (아이콘 · 커버 색)
  // ─────────────────────────────────────────────────────────
  const P = {
    youtube:   { label: 'YouTube',   c1: '#ff5b5b', c2: '#c4102b', ink: '#fff', icon: '▶' },
    instagram: { label: 'Instagram', c1: '#fa7e1e', c2: '#d62976', ink: '#fff', icon: '◉' },
    x:         { label: 'X',         c1: '#2b2b2f', c2: '#0a0a0c', ink: '#fff', icon: '𝕏' },
    tiktok:    { label: 'TikTok',    c1: '#25f4ee', c2: '#fe2c55', ink: '#0a0a0c', icon: '♪' },
    threads:   { label: 'Threads',   c1: '#3a3a3d', c2: '#101012', ink: '#fff', icon: '@' },
    blog:      { label: 'blog',      c1: '#5fd17a', c2: '#1f9d4e', ink: '#0a2415', icon: 'b' },
    behance:   { label: 'Behance',   c1: '#3d7bff', c2: '#1140d6', ink: '#fff', icon: 'Bē' },
    pinterest: { label: 'Pinterest', c1: '#ff5566', c2: '#c8232c', ink: '#fff', icon: 'P' },
    twitch:    { label: 'Twitch',    c1: '#a574ff', c2: '#6441a5', ink: '#fff', icon: '▰' },
    brunch:    { label: 'brunch',    c1: '#f2e7d3', c2: '#d8c4a0', ink: '#3a2f25', icon: 'b' },
  };

  // ─────────────────────────────────────────────────────────
  //  내가 팔로잉하는 사람들 (책장 단별)
  //   h = 책 높이(px). 서로 다르게 줘서 진짜 책장처럼.
  //   link = 'yt' | 'ig' 이면 클릭 시 해당 배경 화면으로 연결.
  // ─────────────────────────────────────────────────────────
  const SHELVES = [
    {
      title: '지금 보는 중',
      books: [
        { p: 'youtube',   name: '탁호준의 로케트펀치', handle: '@rocketpunch', sub: '구독자 12.3만', h: 250, link: 'yt' },
        { p: 'instagram', name: '합정다락',           handle: '@hapjeong_darak', sub: '게시물 487', h: 232, link: 'ig',
          garden: [
            { t: '합정다락 ☕️📚', c: 'linear-gradient(150deg,#caa472,#7c5436)', big: true },
            { t: '창가 햇살', c: 'linear-gradient(150deg,#e8cfa8,#a87b4e)' },
            { t: '이번 주 신간', c: 'linear-gradient(150deg,#b89b78,#5c4225)' },
            { t: '핸드드립', c: 'linear-gradient(150deg,#7a5236,#2c1a0e)' },
            { t: '책모임 모집', c: 'linear-gradient(150deg,#8a7fa0,#34294a)' },
            { t: '오늘의 디저트', c: 'linear-gradient(150deg,#d8a0a8,#7a3f4a)' },
            { t: '영업 13–21시', c: 'linear-gradient(150deg,#9aa17a,#454d2e)' },
          ] },
        { p: 'youtube',   name: '카메라연구소',        handle: '@cam_lab',     sub: '구독자 9.8만',  h: 244,
          c1: '#7b8cff', c2: '#2c3bb8' },
      ],
    },
    {
      title: '팔로잉',
      more: true,
      books: [
        { p: 'x',         name: 'Design Daily',  handle: '@design_daily', sub: '오늘의 디자인', h: 236 },
        { p: 'tiktok',    name: 'seoul.cafe',    handle: '@seoul.cafe',   sub: '카페 브이로그', h: 256 },
        { p: 'threads',   name: '문작가',         handle: '@writer_moon',  sub: '매일 한 문장',  h: 224 },
        { p: 'blog',      name: '여행하는사진가',  handle: 'blog.naver/jjj', sub: '여행 · 사진',  h: 246 },
        { p: 'instagram', name: 'kelly interior', handle: '@kelly.interior', sub: '게시물 1.2천', h: 234,
          c1: '#ffb36b', c2: '#e0567a' },
        { p: 'youtube',   name: 'ColorGrade Kim', handle: '@colorgrade',   sub: '색보정 LUT',   h: 250,
          c1: '#5fd1c4', c2: '#137a6e' },
      ],
    },
    {
      title: '둘러보기',
      more: true,
      books: [
        { p: 'behance',   name: 'Studio Onground', handle: 'be.net/onground', sub: '브랜딩 스튜디오', h: 248 },
        { p: 'pinterest', name: 'mood board',      handle: '@mood.board',    sub: '인테리어 무드',   h: 238 },
        { p: 'twitch',    name: '겜방김씨',         handle: '@gamekim',       sub: 'LIVE · 1.4천명',  h: 256, live: true },
        { p: 'brunch',    name: '느린오후',         handle: 'brunch.co.kr/@slow', sub: '에세이',      h: 228 },
        { p: 'instagram', name: 'plant.diary',     handle: '@plant.diary',   sub: '게시물 320',      h: 244,
          c1: '#7bd17a', c2: '#2e8f4e' },
      ],
    },
  ];

  // ─────────────────────────────────────────────────────────
  //  플랫폼별 미니 미리보기 (책 커버 안에 SNS 화면 느낌)
  // ─────────────────────────────────────────────────────────
  function preview(b) {
    switch (b.p) {
      case 'youtube':
        return `<div class="spp spp--yt">
          <div class="spp-yt__thumb"><span>▶</span></div>
          <div class="spp-line"></div><div class="spp-line w70"></div>
        </div>`;
      case 'instagram':
        return `<div class="spp spp--ig">${'<i></i>'.repeat(9)}</div>`;
      case 'x':
        return `<div class="spp spp--x">
          <div class="spp-x__row"><span class="spp-dot"></span><b>${b.name}</b></div>
          <div class="spp-line"></div><div class="spp-line"></div><div class="spp-line w50"></div>
          <div class="spp-x__bar"><span>♡</span><span>↺</span><span>↥</span></div>
        </div>`;
      case 'tiktok':
        return `<div class="spp spp--tt">
          <div class="spp-tt__video"><span>♪</span></div>
          <div class="spp-tt__side"><i>♡</i><i>💬</i><i>↗</i></div>
        </div>`;
      case 'threads':
        return `<div class="spp spp--th">
          <div class="spp-x__row"><span class="spp-dot"></span><b>${b.handle}</b></div>
          <div class="spp-line"></div><div class="spp-line w70"></div>
          <div class="spp-th__thread"></div>
        </div>`;
      case 'blog':
        return `<div class="spp spp--blog">
          <span class="spp-blog__tag">blog</span>
          <div class="spp-line lg"></div>
          <div class="spp-line"></div><div class="spp-line"></div><div class="spp-line w50"></div>
        </div>`;
      case 'behance':
        return `<div class="spp spp--be">
          <div class="spp-be__hero"></div>
          <div class="spp-be__row"><i></i><i></i><i></i></div>
        </div>`;
      case 'pinterest':
        return `<div class="spp spp--pin">
          <i class="t"></i><i class="s"></i><i class="s"></i><i class="t"></i>
        </div>`;
      case 'twitch':
        return `<div class="spp spp--tw">
          <div class="spp-tw__screen"><span class="spp-tw__live">LIVE</span></div>
          <div class="spp-line w70"></div>
        </div>`;
      case 'brunch':
        return `<div class="spp spp--br">
          <div class="spp-br__title">${b.name}</div>
          <div class="spp-line"></div><div class="spp-line"></div>
          <div class="spp-line"></div><div class="spp-line w70"></div>
        </div>`;
      default:
        return '';
    }
  }

  function bookEl(b) {
    const meta = P[b.p] || P.x;
    const c1 = b.c1 || meta.c1, c2 = b.c2 || meta.c2;
    const el = document.createElement('button');
    el.className = 'sp-book';
    el._data = b;                       // 클릭 시 '캡처된 가든' 표시에 사용
    el.style.setProperty('--h', b.h + 'px');
    el.style.setProperty('--c1', c1);
    el.style.setProperty('--c2', c2);
    el.style.setProperty('--ink', meta.ink);
    if (b.link) el.dataset.link = b.link;
    el.dataset.search = (b.name + ' ' + b.handle + ' ' + meta.label).toLowerCase();
    el.innerHTML = `
      <span class="sp-book__badge" title="${meta.label}">${meta.icon}</span>
      ${b.live ? '<span class="sp-book__livedot"></span>' : ''}
      <span class="sp-book__pv">${preview(b)}</span>
      <span class="sp-book__foot">
        <span class="sp-book__name">${b.name}</span>
        <span class="sp-book__handle">${b.handle}</span>
        <span class="sp-book__sub">${b.sub}</span>
      </span>
      <span class="sp-book__edge"></span>`;
    return el;
  }

  // ─────────────────────────────────────────────────────────
  //  골격 구축
  // ─────────────────────────────────────────────────────────
  function build(root) {
    root.innerHTML = `
      <div class="sp">
        <aside class="sp-side">
          <!-- 미러볼 (모든 화면 공통 · 좌→우로 돌리면 브라우저, 우→좌로 돌리면 서재) -->
          <div class="sp-side__ballslot"></div>
          <div class="sp-side__bottom">
            <span class="sp-my__label">My</span>
            ${MY_FRAMES.map((f, i) => `
              <button class="sp-frame" data-i="${i}" title="${f.name} — 내 blip 가든 열기">
                <span class="sp-frame__preview" style="background-image:${f.c}">
                  <span class="sp-frame__tag">Frame</span>
                </span>
                <span class="sp-frame__name">${f.name}</span>
                <span class="sp-frame__date">발행일 ${f.date}</span>
              </button>`).join('')}
          </div>
        </aside>

        <main class="sp-main">
          <header class="sp-top">
            <div class="sp-tabs">
              <button class="sp-tab is-on">책장</button>
              <button class="sp-tab">전체</button>
            </div>
            <label class="sp-search">
              <span>🔍</span>
              <input type="text" placeholder="내 팔로잉 검색" />
            </label>
            <div class="sp-flip-hint">미러볼을 좌→우로 돌리면 브라우저 ⇢</div>
          </header>

          <div class="sp-shelves"></div>
        </main>
      </div>`;

    const shelves = root.querySelector('.sp-shelves');
    SHELVES.forEach((s) => {
      const sec = document.createElement('section');
      sec.className = 'sp-shelf';
      sec.innerHTML = `
        <div class="sp-shelf__head">
          <h3>${s.title}</h3>
          ${s.more ? '<a class="sp-shelf__more">전체 보기 →</a>' : ''}
        </div>
        <div class="sp-shelf__stage">
          <div class="sp-shelf__books"></div>
          <div class="sp-shelf__ledge"></div>
        </div>`;
      const wrap = sec.querySelector('.sp-shelf__books');
      s.books.forEach((b) => wrap.appendChild(bookEl(b)));
      shelves.appendChild(sec);
    });

    return root;
  }

  // ─────────────────────────────────────────────────────────
  //  상호작용
  // ─────────────────────────────────────────────────────────
  function wire(root) {
    const sp = root.querySelector('.sp');

    // 검색 필터
    const input = root.querySelector('.sp-search input');
    input.addEventListener('input', () => {
      const q = input.value.trim().toLowerCase();
      root.querySelectorAll('.sp-shelf').forEach((shelf) => {
        let any = false;
        shelf.querySelectorAll('.sp-book').forEach((bk) => {
          const hit = !q || bk.dataset.search.includes(q);
          bk.style.display = hit ? '' : 'none';
          if (hit) any = true;
        });
        shelf.style.display = any ? '' : 'none';
      });
    });

    // 좌측 하단 Frame(체다의 카메라설정 / Blip 구상) 클릭 → 내 blip 가든 등장
    root.querySelectorAll('.sp-frame').forEach((b) => {
      b.addEventListener('click', (e) => {
        e.stopPropagation();
        document.dispatchEvent(new CustomEvent('blip:openGarden'));
      });
    });

    // 책 클릭(=선택) → 그 사람의 "캡처된 가든"을 확대해서 보여줌 (페이지 이동 아님)
    root.querySelectorAll('.sp-book').forEach((bk) => {
      bk.addEventListener('click', () => {
        if (sp.dataset.dragged === '1') return;       // 드래그였으면 클릭 무시
        openBookGarden(bk, bk._data);
      });
    });

    // 책 클릭 vs 드래그 구분용 (좌→우 드래그는 stage 로 흘려 Garden 이 열림)
    let down = null;
    sp.addEventListener('mousedown', (e) => { down = { x: e.clientX, y: e.clientY }; sp.dataset.dragged = '0'; });
    window.addEventListener('mousemove', (e) => {
      if (down && Math.hypot(e.clientX - down.x, e.clientY - down.y) > 8) sp.dataset.dragged = '1';
    });
    window.addEventListener('mouseup', () => { down = null; });

    // ── 미러볼: 모든 화면 공통 전환 컨트롤 (좌→우 브라우저 / 우→좌 서재) ──
    mirrorball(root, sp);
  }

  // 미러볼 — 좌측 Nav 최상단(그리고 모든 화면)에 떠 있는 회전 컨트롤.
  //  좌→우로 돌리면 화면 전체가 zoom-out 되며 뒤의 일반 브라우저가 등장,
  //  우→좌로 돌리면 서재(책장)가 다시 자라난다. 회전량이 전환 진행도(--p)를 구동.
  function mirrorball(root, sp) {
    const W = () => root.clientWidth || window.innerWidth;
    const yt = document.getElementById('yt');
    const start = root;

    const ball = document.createElement('button');
    ball.id = 'blipBall';
    ball.title = '미러볼 — 좌→우로 돌리면 브라우저, 우→좌로 돌리면 서재';
    ball.innerHTML = `<span class="ball__sphere"><span class="ball__shine"></span></span>`;
    document.body.appendChild(ball);

    let rot = 0;            // 누적 회전각 (Y축 — 회전목마처럼 앞→뒷면으로)
    let dragging = false;
    const sphere = ball.querySelector('.ball__sphere');
    const setRot = (deg) => { sphere.style.transform = `rotateY(${deg}deg)`; };
    // 평소엔 천천히 회전목마처럼 돌고, 드래그 중엔 손가락을 따라감
    const spin = () => { if (!dragging) { rot = (rot + 0.35) % 360; setRot(rot); } requestAnimationFrame(spin); };
    requestAnimationFrame(spin);

    // 미러볼을 180° 뒤집는 모션 (회전목마처럼 Y축으로) — 시각 효과 전용
    const flipBall = () => {
      dragging = true;                  // 그동안 idle 회전 멈춤
      const from = rot, to = rot + 180, dur = 460; let st = null;
      const step = (ts) => {
        if (st === null) st = ts;
        const k = Math.min(1, (ts - st) / dur);
        const e = 1 - Math.pow(1 - k, 3);
        rot = from + (to - from) * e; setRot(rot);
        if (k < 1) requestAnimationFrame(step);
        else dragging = false;
      };
      requestAnimationFrame(step);
    };

    // 그냥 버튼 — 누르면 즉시 현재의 반대 화면으로 전환
    const toggle = () => {
      flipBall();
      showPage(start.hidden ? 'start' : 'yt');   // 브라우저면 서재로, 서재면 YouTube로
    };

    ball.addEventListener('mousedown', (e) => { e.stopPropagation(); });
    ball.addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); toggle(); });
  }

  // ─────────────────────────────────────────────────────────
  //  책 선택 → 그 사람의 "캡처된 가든"을 확대 표시 (클릭한 책에서 확대)
  // ─────────────────────────────────────────────────────────
  function defaultGarden(b) {
    const meta = P[b.p] || P.x;
    const c1 = b.c1 || meta.c1, c2 = b.c2 || meta.c2;
    const g = (a) => `linear-gradient(150deg, ${a})`;
    return [
      { t: '대표 게시물', c: g(`${c1}, ${c2}`), big: true },
      { t: '', c: g('#e8cfa8,#a87b4e') },
      { t: '', c: g('#b89b78,#5c4225') },
      { t: '컬렉션', c: g('#7a6ba0,#2e2348') },
      { t: '', c: g('#9aa17a,#454d2e') },
      { t: '소개', c: g('#5a6b8a,#1f2a3a') },
    ];
  }

  function openBookGarden(bk, b) {
    if (!b) return;
    const meta = P[b.p] || P.x;
    const tiles = b.garden || defaultGarden(b);
    const ov = document.createElement('div');
    ov.className = 'sp-zoom';
    const r = bk.getBoundingClientRect();
    ov.style.setProperty('--ox', (r.left + r.width / 2) + 'px');
    ov.style.setProperty('--oy', (r.top + r.height / 2) + 'px');
    ov.innerHTML = `
      <div class="sp-zoom__sheet" style="--c1:${b.c1 || meta.c1};--c2:${b.c2 || meta.c2};--ink:${meta.ink}">
        <header class="sp-zoom__bar">
          <span class="sp-zoom__badge">${meta.icon}</span>
          <span class="sp-zoom__id"><b>${b.name}</b><small>${b.handle} · ${meta.label} · 캡처된 가든</small></span>
          <button class="sp-zoom__x" title="닫기">×</button>
        </header>
        <div class="sp-zoom__board">
          ${tiles.map((t) => `<div class="sp-tile${t.big ? ' is-big' : ''}" style="background-image:${t.c}"><span>${t.t || ''}</span></div>`).join('')}
        </div>
      </div>`;
    document.body.appendChild(ov);
    requestAnimationFrame(() => ov.classList.add('is-on'));
    const close = () => { ov.classList.remove('is-on'); setTimeout(() => ov.remove(), 280); };
    ov.addEventListener('mousedown', (e) => { e.stopPropagation(); if (e.target === ov) close(); });
    ov.querySelector('.sp-zoom__x').addEventListener('click', close);
    const esc = (e) => { if (e.key === 'Escape') { close(); document.removeEventListener('keydown', esc); } };
    document.addEventListener('keydown', esc);

    // 요소(타일) 우클릭 → Stripe Press 식 상세 (관련 정보가 위·아래로 펼쳐짐)
    ov.querySelectorAll('.sp-tile').forEach((tl, i) => {
      tl.addEventListener('contextmenu', (e) => {
        e.preventDefault(); e.stopPropagation();
        openElementDetail(b, tiles[i], i, tiles);
      });
    });
  }

  // press.stripe.com 처럼: 요소를 가운데 두고 관련 정보를 위(맥락)·아래(상세)로 쌓아 보여줌
  function openElementDetail(b, tile, idx, siblings) {
    const meta = P[b.p] || P.x;
    const title = tile.t || '수집 요소';
    const ov = document.createElement('div');
    ov.className = 'sp-detail';
    ov.innerHTML = `
      <button class="sp-detail__x" title="닫기">×</button>
      <div class="sp-detail__col">
        <div class="sp-detail__above">
          <span class="sp-detail__crumb">${b.name} · 캡처된 가든</span>
          <span class="sp-detail__idx">element ${idx + 1} / ${siblings.length}</span>
        </div>
        <div class="sp-detail__hero" style="background-image:${tile.c}"></div>
        <div class="sp-detail__below">
          <h2 class="sp-detail__title">${title}</h2>
          <div class="sp-detail__sub">${meta.label} · 캡처 · 2026.06.16</div>
          <p class="sp-detail__desc">${b.name}의 가든에서 수집한 요소입니다. 우클릭으로 펼친 상세 — 관련 정보가 위·아래로 이어집니다.</p>
          <div class="sp-detail__rows">
            <div class="sp-detail__row"><span>유형</span><b>이미지 · 캡처</b></div>
            <div class="sp-detail__row"><span>출처</span><b>${b.handle}</b></div>
            <div class="sp-detail__row"><span>플랫폼</span><b>${meta.label}</b></div>
            <div class="sp-detail__row"><span>수집일</span><b>2026.06.16</b></div>
          </div>
          <div class="sp-detail__relhead">같은 가든의 다른 요소</div>
          <div class="sp-detail__rel">
            ${siblings.filter((_, i) => i !== idx).slice(0, 4)
              .map((s) => `<span class="sp-detail__relx" style="background-image:${s.c}" title="${s.t || ''}"></span>`).join('')}
          </div>
        </div>
      </div>`;
    document.body.appendChild(ov);
    requestAnimationFrame(() => ov.classList.add('is-on'));
    const close = () => { ov.classList.remove('is-on'); setTimeout(() => ov.remove(), 280); };
    ov.addEventListener('mousedown', (e) => { e.stopPropagation(); if (e.target === ov) close(); });
    ov.querySelector('.sp-detail__x').addEventListener('click', close);
    const esc = (e) => { if (e.key === 'Escape') { close(); document.removeEventListener('keydown', esc); } };
    document.addEventListener('keydown', esc);
  }

  // ─────────────────────────────────────────────────────────
  window.addEventListener('DOMContentLoaded', () => {
    const root = document.getElementById('start');
    if (!root) return;
    build(root);
    wire(root);
  });
})();
