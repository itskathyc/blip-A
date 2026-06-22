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

    // 스페이스바 + B → 화면 중앙 검색바 (Spotlight 식)
    commandBar();

    // 좌측 하단 Frame(체다의 카메라설정 / Blip 구상) 클릭 → 내 blip 가든 등장
    root.querySelectorAll('.sp-frame').forEach((b) => {
      b.addEventListener('click', (e) => {
        e.stopPropagation();
        document.dispatchEvent(new CustomEvent('blip:openGarden'));
      });
      // 내 Frame 우클릭 → '반응 확인' 버튼
      b.addEventListener('contextmenu', (e) => {
        e.preventDefault(); e.stopPropagation();
        const name = b.querySelector('.sp-frame__name')?.textContent || 'Frame';
        openFrameMenu(name, e.clientX, e.clientY);
      });
    });

    // 책 클릭(=선택) → 그 사람의 "캡처된 가든"을 확대해서 보여줌 (페이지 이동 아님)
    root.querySelectorAll('.sp-book').forEach((bk) => {
      bk.addEventListener('click', () => {
        if (sp.dataset.dragged === '1') return;       // 드래그였으면 클릭 무시
        openBookGarden(bk._data);
      });
    });

    // 책 클릭 vs 드래그 구분용 (좌→우 드래그는 stage 로 흘려 Garden 이 열림)
    let down = null;
    sp.addEventListener('mousedown', (e) => { down = { x: e.clientX, y: e.clientY }; sp.dataset.dragged = '0'; });
    window.addEventListener('mousemove', (e) => {
      if (down && Math.hypot(e.clientX - down.x, e.clientY - down.y) > 8) sp.dataset.dragged = '1';
    });
    window.addEventListener('mouseup', () => { down = null; });

    // ── 미러볼: 모든 화면 공통 전환 버튼 (누르면 서재 ⟷ 브라우저) ──
    mirrorball(root);
  }

  // 미러볼 — 좌측 Nav 최상단(그리고 모든 화면)에 떠 있는 전환 버튼.
  //  평소엔 가만히 고정. 누르면 180° 뒤집히며 서재 ⟷ 일반 브라우저 전환.
  function mirrorball(root) {
    const start = root;

    const ball = document.createElement('button');
    ball.id = 'blipBall';
    ball.title = '미러볼 — 누르면 서재 ⟷ 브라우저 전환';
    ball.innerHTML = `<span class="ball__sphere"><span class="ball__shine"></span></span>`;
    (document.getElementById("osWinBody")||document.body).appendChild(ball);

    let rot = 0;            // 누적 회전각 (Y축 — 회전목마처럼 앞→뒷면으로)
    let flipping = false;
    const sphere = ball.querySelector('.ball__sphere');
    const setRot = (deg) => { sphere.style.transform = `rotateY(${deg}deg)`; };
    setRot(0);             // 입력이 없을 땐 가만히 고정 (idle 회전 없음)

    // 미러볼을 180° 뒤집는 모션 (클릭 시에만 회전목마처럼 Y축으로)
    const flipBall = () => {
      if (flipping) return;
      flipping = true;
      const from = rot, to = rot + 180, dur = 460; let st = null;
      const step = (ts) => {
        if (st === null) st = ts;
        const k = Math.min(1, (ts - st) / dur);
        const e = 1 - Math.pow(1 - k, 3);
        rot = from + (to - from) * e; setRot(rot);
        if (k < 1) requestAnimationFrame(step);
        else { rot = to % 360; setRot(rot); flipping = false; }
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

  // 스페이스바 + B → 화면 중앙 검색바 (Spotlight 식). 어떤 책이든 검색해 바로 연다.
  function commandBar() {
    const mount = () => document.getElementById('osWinBody') || document.body;
    const allBooks = SHELVES.flatMap((s) => s.books);
    let spaceDown = false, open = null;

    const typing = () => {
      const t = document.activeElement;
      return t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable);
    };

    const close = () => {
      if (!open) return;
      open.classList.remove('is-on');
      const el = open; open = null;
      setTimeout(() => el.remove(), 180);
    };
    const openCmd = () => {
      if (open) return;
      const ov = document.createElement('div');
      ov.className = 'sp-cmd';
      ov.innerHTML = `
        <div class="sp-cmd__panel">
          <div class="sp-cmd__bar">
            <span class="sp-cmd__ic">🔍</span>
            <input class="sp-cmd__in" type="text" placeholder="블립 검색 — 팔로잉, 플랫폼…" spellcheck="false" />
            <span class="sp-cmd__kbd">space + B</span>
          </div>
          <div class="sp-cmd__results"></div>
        </div>`;
      mount().appendChild(ov);
      open = ov;
      requestAnimationFrame(() => ov.classList.add('is-on'));
      const input = ov.querySelector('.sp-cmd__in');
      const results = ov.querySelector('.sp-cmd__results');
      const render = () => {
        const q = input.value.trim().toLowerCase();
        const hits = allBooks.filter((b) => {
          const meta = P[b.p] || P.x;
          return !q || (b.name + ' ' + b.handle + ' ' + meta.label).toLowerCase().includes(q);
        });
        results.innerHTML = hits.map((b) => {
          const meta = P[b.p] || P.x;
          return `<button class="sp-cmd__row" data-name="${b.name}">
            <span class="sp-cmd__badge" style="background:linear-gradient(135deg,${b.c1 || meta.c1},${b.c2 || meta.c2})">${meta.icon}</span>
            <span class="sp-cmd__meta"><b>${b.name}</b><small>${b.handle} · ${meta.label}</small></span>
          </button>`;
        }).join('') || `<div class="sp-cmd__empty">결과 없음</div>`;
        results.querySelectorAll('.sp-cmd__row').forEach((row) => {
          row.addEventListener('click', () => {
            const b = allBooks.find((x) => x.name === row.dataset.name);
            if (b) openBookGarden(b);
            close();
          });
        });
      };
      input.addEventListener('input', render);
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') { e.preventDefault(); close(); }
        else if (e.key === 'Enter') {
          const first = results.querySelector('.sp-cmd__row');
          if (first) first.click();
        }
      });
      ov.addEventListener('mousedown', (e) => { e.stopPropagation(); if (e.target === ov) close(); });
      render();
      requestAnimationFrame(() => input.focus());
    };

    window.addEventListener('keydown', (e) => {
      if (e.code === 'Space' && !typing()) spaceDown = true;
      if (e.code === 'KeyB' && spaceDown && !typing()) { e.preventDefault(); openCmd(); }
    });
    window.addEventListener('keyup', (e) => { if (e.code === 'Space') spaceDown = false; });
    window.addEventListener('blur', () => { spaceDown = false; });
  }

  // 책을 고르면 그 사람의 "캡처된 가든"이 떠다니는 창으로 열린다.
  //  - 헤더를 잡고 화면 위에서 자유롭게 이동
  //  - 여러 개를 동시에 띄울 수 있음 (모달 아님)
  let _winN = 0, _winZ = 60;
  function openBookGarden(b) {
    if (!b) return;
    const meta = P[b.p] || P.x;
    const tiles = b.garden || defaultGarden(b);
    const mount = document.getElementById('osWinBody') || document.body;
    const win = document.createElement('div');
    win.className = 'sp-win';
    const n = _winN++;
    win.style.left = (70 + (n % 6) * 34) + 'px';
    win.style.top  = (60 + (n % 6) * 34) + 'px';
    win.style.zIndex = String(++_winZ);
    win.innerHTML = `
      <header class="sp-win__bar" style="--c1:${b.c1 || meta.c1};--c2:${b.c2 || meta.c2};--ink:${meta.ink}">
        <span class="sp-win__badge">${meta.icon}</span>
        <span class="sp-win__id"><b>${b.name}</b><small>${b.handle} · ${meta.label} · 캡처된 가든</small></span>
        <button class="sp-win__x" title="닫기">×</button>
      </header>
      <div class="sp-win__board"></div>
      <span class="sp-win__resize" title="크기 조절"></span>`;
    mount.appendChild(win);
    requestAnimationFrame(() => win.classList.add('is-on'));

    const close = () => { win.classList.remove('is-on'); setTimeout(() => win.remove(), 200); };
    win.querySelector('.sp-win__x').addEventListener('click', (e) => { e.stopPropagation(); close(); });
    // 클릭하면 맨 앞으로
    win.addEventListener('mousedown', (e) => { e.stopPropagation(); win.style.zIndex = String(++_winZ); });

    // 헤더 드래그 → 창 이동
    const bar = win.querySelector('.sp-win__bar');
    bar.addEventListener('mousedown', (e) => {
      if (e.target.closest('.sp-win__x')) return;
      e.preventDefault();
      const r = win.getBoundingClientRect();
      const m = mount.getBoundingClientRect();
      const offX = e.clientX - r.left, offY = e.clientY - r.top;
      const onMove = (ev) => {
        const x = Math.max(0, Math.min(ev.clientX - m.left - offX, m.width - 80));
        const y = Math.max(0, Math.min(ev.clientY - m.top - offY, m.height - 30));
        win.style.left = x + 'px'; win.style.top = y + 'px';
      };
      const onUp = () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
      window.addEventListener('mousemove', onMove); window.addEventListener('mouseup', onUp);
    });

    // 우측 하단 핸들 드래그 → 창 크기 조절
    const grip = win.querySelector('.sp-win__resize');
    grip.addEventListener('mousedown', (e) => {
      e.preventDefault(); e.stopPropagation();
      const r = win.getBoundingClientRect();
      const sw = r.width, sh = r.height, sx = e.clientX, sy = e.clientY;
      win.style.maxHeight = 'none';                 // 리사이즈하면 자유 높이
      const onMove = (ev) => {
        win.style.width  = Math.max(280, Math.min(sw + (ev.clientX - sx), 900)) + 'px';
        win.style.height = Math.max(220, Math.min(sh + (ev.clientY - sy), 760)) + 'px';
      };
      const onUp = () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
      window.addEventListener('mousemove', onMove); window.addEventListener('mouseup', onUp);
    });

    // 콘텐츠(타일) — 창 안에서 위치·크기 조절 가능한 자유 배치
    const board = win.querySelector('.sp-win__board');
    let _tz = 1;
    const PAD = 16, TW = 118, TH = 104, GAP = 12, COLS = 3;
    tiles.forEach((t, i) => {
      const col = i % COLS, row = Math.floor(i / COLS);
      const tl = document.createElement('div');
      tl.className = 'sp-tile sp-tile--free';
      tl.style.backgroundImage = t.c;
      tl.style.left = (PAD + col * (TW + GAP)) + 'px';
      tl.style.top  = (PAD + row * (TH + GAP)) + 'px';
      // 처음 보여질 땐 균일 그리드 → 콘텐츠끼리 절대 겹치지 않음 (이후 자유 리사이즈)
      tl.style.width  = TW + 'px';
      tl.style.height = TH + 'px';
      tl.style.zIndex = String(++_tz);
      tl.innerHTML = `<span>${t.t || ''}</span><span class="sp-tile__rz" title="크기 조절"></span>`;
      board.appendChild(tl);

      // 이동 (좌 드래그)
      tl.addEventListener('mousedown', (e) => {
        if (e.button !== 0 || e.target.closest('.sp-tile__rz')) return;
        e.preventDefault(); e.stopPropagation();
        win.style.zIndex = String(++_winZ);
        tl.style.zIndex = String(++_tz);
        const br = board.getBoundingClientRect();
        const r0 = tl.getBoundingClientRect();
        const offX = e.clientX - r0.left, offY = e.clientY - r0.top;
        const onMove = (ev) => {
          const x = Math.max(0, ev.clientX - br.left + board.scrollLeft - offX);
          const y = Math.max(0, ev.clientY - br.top + board.scrollTop - offY);
          tl.style.left = x + 'px'; tl.style.top = y + 'px';
        };
        const onUp = () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
        window.addEventListener('mousemove', onMove); window.addEventListener('mouseup', onUp);
      });
      // 크기 조절 (우측 하단 핸들)
      tl.querySelector('.sp-tile__rz').addEventListener('mousedown', (e) => {
        e.preventDefault(); e.stopPropagation();
        const sw = tl.offsetWidth, sh = tl.offsetHeight, sx = e.clientX, sy = e.clientY;
        const onMove = (ev) => {
          tl.style.width  = Math.max(76, Math.min(sw + (ev.clientX - sx), 520)) + 'px';
          tl.style.height = Math.max(64, Math.min(sh + (ev.clientY - sy), 460)) + 'px';
        };
        const onUp = () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
        window.addEventListener('mousemove', onMove); window.addEventListener('mouseup', onUp);
      });
      // 우클릭 → 히스토리
      tl.addEventListener('contextmenu', (e) => {
        e.preventDefault(); e.stopPropagation();
        openHistory(b, tiles[i], e.clientX, e.clientY);
      });
    });
    const rows = Math.ceil(tiles.length / COLS);
    board.style.minHeight = (PAD * 2 + rows * (TH + GAP)) + 'px';
  }

  // 작은 토스트
  function spToast(msg) {
    const mount = document.getElementById('osWinBody') || document.body;
    const t = document.createElement('div');
    t.className = 'sp-toast'; t.textContent = msg;
    mount.appendChild(t);
    requestAnimationFrame(() => t.classList.add('is-on'));
    setTimeout(() => { t.classList.remove('is-on'); setTimeout(() => t.remove(), 250); }, 1600);
  }

  // 내 Frame 우클릭 → '반응 확인' 버튼
  function openFrameMenu(name, x, y) {
    document.querySelectorAll('.sp-actmenu').forEach((m) => m.remove());
    const mount = document.getElementById('osWinBody') || document.body;
    const m = document.createElement('div');
    m.className = 'sp-actmenu';
    m.innerHTML = `<button class="sp-actmenu__act" data-act="react"><span>📊</span> 반응 확인</button>`;
    mount.appendChild(m);
    const r = mount.getBoundingClientRect();
    m.style.left = Math.max(8, Math.min(x - r.left, r.width - 200)) + 'px';
    m.style.top  = Math.max(8, Math.min(y - r.top, r.height - 70)) + 'px';
    requestAnimationFrame(() => m.classList.add('is-on'));
    const close = () => { m.remove(); document.removeEventListener('mousedown', away); document.removeEventListener('keydown', esc); };
    const away = (ev) => { if (!m.contains(ev.target)) close(); };
    const esc = (ev) => { if (ev.key === 'Escape') close(); };
    setTimeout(() => { document.addEventListener('mousedown', away); document.addEventListener('keydown', esc); }, 0);
    m.querySelector('[data-act="react"]').addEventListener('click', () => { close(); openReactions(name); });
  }

  // 발행한 Frame의 반응 — "반응은 소비한 뒤에 나타난다"
  function openReactions(name) {
    document.querySelectorAll('.sp-react').forEach((m) => m.remove());
    const mount = document.getElementById('osWinBody') || document.body;
    const reacts = [
      { who: '@user_kim',  txt: '이 세팅으로 첫 영상 찍었어요 🙏', time: '어제',   kind: '수집' },
      { who: '@photo_lee', txt: '노출 삼각형 부분에서 막혔는데 풀렸어요', time: '3일 전', kind: '댓글' },
      { who: '@minji.v',   txt: '픽처프로파일 그대로 따라함', time: '5일 전', kind: '수집' },
      { who: '@docu_oh',   txt: '내 가든에도 담아둘게요', time: '1주 전', kind: '수집' },
    ];
    const ov = document.createElement('div');
    ov.className = 'sp-react';
    ov.innerHTML = `
      <div class="sp-react__panel">
        <header class="sp-react__bar">
          <span class="sp-react__id"><b>반응 · ${name}</b><small>소비한 뒤에 남은 반응</small></span>
          <button class="sp-react__x" title="닫기">×</button>
        </header>
        <div class="sp-react__stats">
          <span>👀 소비 <b>1,284</b></span><span>💬 반응 <b>${reacts.length}</b></span><span>📥 수집 <b>37</b></span>
        </div>
        <div class="sp-react__list">
          ${reacts.map((r) => `
            <div class="sp-react__row">
              <span class="sp-react__av">${r.who[1].toUpperCase()}</span>
              <span class="sp-react__body"><b>${r.who}</b><span>${r.txt}</span></span>
              <span class="sp-react__meta">${r.kind} · ${r.time}</span>
            </div>`).join('')}
        </div>
      </div>`;
    mount.appendChild(ov);
    requestAnimationFrame(() => ov.classList.add('is-on'));
    const close = () => { ov.classList.remove('is-on'); setTimeout(() => ov.remove(), 220); };
    ov.addEventListener('mousedown', (e) => { e.stopPropagation(); if (e.target === ov) close(); });
    ov.querySelector('.sp-react__x').addEventListener('click', close);
    const esc = (e) => { if (e.key === 'Escape') { close(); document.removeEventListener('keydown', esc); } };
    document.addEventListener('keydown', esc);
  }

  // 콘텐츠 1개의 "히스토리" 맥락 카드들 (위=최근, 아래=과거)
  function historyOf(b, tile) {
    const meta = P[b.p] || P.x;
    const base = tile.c || `linear-gradient(150deg, ${(b.c1 || meta.c1)}, ${(b.c2 || meta.c2)})`;
    return [
      { t: '지금 이 화면에서 봄',   time: '지금',     c: base, kind: '비의도적' },
      { t: `${b.name} 피드에서 발견`, time: '어제',    c: 'linear-gradient(150deg,#cfe0ff,#9db4ff)', kind: '비의도적' },
      { t: '친구가 공유함',          time: '지난주',   c: 'linear-gradient(150deg,#ffd6a8,#e89a52)', kind: '비의도적' },
      { t: '검색하다 저장',          time: '3주 전',   c: 'linear-gradient(150deg,#bdeccd,#7bd17a)', kind: '의도적' },
      { t: '처음 캡처',              time: '2개월 전', c: 'linear-gradient(150deg,#e7a6c4,#d62976)', kind: '의도적' },
    ];
  }

  // 콘텐츠 우클릭 → 히스토리 스택 (네모 카드 5개 · 휠로 위아래 · 아래=과거)
  function openHistory(b, tile, x, y) {
    document.querySelectorAll('.sp-hist, .sp-actmenu').forEach((m) => m.remove());
    const mount = document.getElementById('osWinBody') || document.body;
    const items = historyOf(b, tile);
    const hist = document.createElement('div');
    hist.className = 'sp-hist';
    hist.innerHTML = `
      <div class="sp-hist__head">히스토리<small>${tile.t || '콘텐츠'}</small></div>
      <div class="sp-hist__scroll">
        ${items.map((h) => `
          <div class="sp-hist__card">
            <span class="sp-hist__thumb" style="background-image:${h.c}"></span>
            <span class="sp-hist__meta">
              <b>${h.t}</b>
              <small>${h.time} · ${h.kind} 수집</small>
            </span>
          </div>`).join('')}
      </div>
      <div class="sp-hist__axis"><span>↑ 최근</span><span>과거 ↓</span></div>`;
    mount.appendChild(hist);

    const r = mount.getBoundingClientRect();
    const w = 264, h = hist.offsetHeight || 320;
    let left = Math.max(8, Math.min(x - r.left, r.width - w - 8));
    let top = Math.max(8, Math.min(y - r.top, r.height - h - 8));
    hist.style.left = left + 'px'; hist.style.top = top + 'px';
    requestAnimationFrame(() => hist.classList.add('is-on'));

    const close = () => { hist.remove(); document.removeEventListener('mousedown', away); document.removeEventListener('keydown', esc); };
    const away = (ev) => { if (!hist.contains(ev.target) && !ev.target.closest('.sp-actmenu')) close(); };
    const esc = (ev) => { if (ev.key === 'Escape') close(); };
    setTimeout(() => { document.addEventListener('mousedown', away); document.addEventListener('keydown', esc); }, 0);

    // 히스토리 카드 우클릭 → 수집 / 댓글
    hist.querySelectorAll('.sp-hist__card').forEach((card, i) => {
      card.addEventListener('contextmenu', (e) => {
        e.preventDefault(); e.stopPropagation();
        openHistActions(b, tile, items[i], e.clientX, e.clientY);
      });
    });
  }

  // 히스토리 카드 우클릭 → 내 Blip으로 수집 / 댓글
  function openHistActions(b, tile, h, x, y) {
    document.querySelectorAll('.sp-actmenu').forEach((m) => m.remove());
    const mount = document.getElementById('osWinBody') || document.body;
    const m = document.createElement('div');
    m.className = 'sp-actmenu';
    m.innerHTML = `
      <button class="sp-actmenu__act" data-act="collect"><span>📥</span> 내 Blip으로 수집</button>
      <button class="sp-actmenu__act" data-act="comment"><span>💬</span> 댓글</button>`;
    mount.appendChild(m);
    const r = mount.getBoundingClientRect();
    let left = Math.max(8, Math.min(x - r.left, r.width - 200));
    let top = Math.max(8, Math.min(y - r.top, r.height - 110));
    m.style.left = left + 'px'; m.style.top = top + 'px';
    requestAnimationFrame(() => m.classList.add('is-on'));

    const close = () => { m.remove(); document.removeEventListener('mousedown', away); document.removeEventListener('keydown', esc); };
    const away = (ev) => { if (!m.contains(ev.target)) close(); };
    const esc = (ev) => { if (ev.key === 'Escape') close(); };
    setTimeout(() => { document.addEventListener('mousedown', away); document.addEventListener('keydown', esc); }, 0);

    m.querySelector('[data-act="collect"]').addEventListener('click', () => {
      close();
      // 내 Garden(blip)에 수집 → 저장내역으로 등장
      document.dispatchEvent(new CustomEvent('blip:collect', {
        detail: { thumb: h.c || tile.c, time: h.time, title: tile.t || '수집 요소', kind: h.kind, from: b.name },
      }));
      spToast(`내 Blip(가든)에 수집됨 · ${h.kind} ✓`);
    });
    m.querySelector('[data-act="comment"]').addEventListener('click', () => {
      m.innerHTML = `
        <textarea class="sp-actmenu__cmt" placeholder="이 콘텐츠에 댓글…"></textarea>
        <button class="sp-actmenu__save">저장</button>`;
      const ta = m.querySelector('.sp-actmenu__cmt'); ta.focus();
      m.querySelector('.sp-actmenu__save').addEventListener('click', () => {
        const v = ta.value.trim(); close(); spToast(v ? '댓글 저장됨 ✓' : '댓글 없이 닫힘');
      });
    });
  }

  // ─────────────────────────────────────────────────────────
  window.addEventListener('DOMContentLoaded', () => {
    const root = document.getElementById('start');
    if (!root) return;
    build(root);
    wire(root);
  });
})();
