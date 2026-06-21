/* blip — 조립 (Atom / Browser / Editor 객체를 연결) */
window.addEventListener('DOMContentLoaded', () => {
  const Blip = window.Blip;

  // 컴포넌트 인스턴스
  const atomShelf = new Blip.AtomShelf(document.getElementById('atomsPanel'));
  const editor    = new Blip.Editor(document.getElementById('editorPanel'));
  const garden    = new Blip.Garden(document.getElementById('gardenPanel'), { atomShelf });
  const browser   = new Blip.Browser({
    stage:     document.getElementById('stage'),
    atomShelf, editor, garden,
    pieEl:     document.getElementById('pieMenu'),
    captureEl: document.getElementById('captureFrame'),
    ghostEl:   document.getElementById('dragGhost'),
  });

  // 패널 닫기 버튼
  document.querySelectorAll('[data-close]').forEach((btn) => {
    btn.addEventListener('mousedown', (e) => e.stopPropagation());
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (btn.dataset.close === 'atomsPanel') atomShelf.close();
      else if (btn.dataset.close === 'editorPanel') editor.close();
    });
  });

  // 에디터 전체화면 버튼
  document.querySelectorAll('[data-full]').forEach((btn) => {
    btn.addEventListener('mousedown', (e) => e.stopPropagation());
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (btn.dataset.full === 'editorPanel') editor.toggleFull();
    });
  });

  // ── 에디터가 열리면 위로 밀지 않고, 배경 하단에 에디터 높이만큼
  //    스크롤 여유(padding)를 줘서 가려질 콘텐츠를 끌어올릴 수 있게 ──
  const yt = document.getElementById('yt');
  const stage = document.getElementById('stage');

  function applyEditorSpace() {
    const h = editor.currentHeight();           // 닫혀 있으면 0
    if (h === 0) {
      yt.style.paddingBottom = '';
      yt.scrollTop = 0;
      return;
    }
    yt.style.paddingBottom = h + 'px';          // 아래 스크롤 여유 추가
    const maxS = yt.scrollHeight - yt.clientHeight;
    if (yt.scrollTop > maxS) yt.scrollTop = maxS;
  }

  // 에디터 마인드맵
  const mindmap = new Blip.Mindmap(
    document.getElementById('mindmap'),
    document.getElementById('mmDetail'),
    document.getElementById('mmWrap'),
  );

  // 미니맵 노드 선택 → 작은 미니맵이면 펼쳐서 보기
  mindmap.onSelect = () => { if (editor.isMinimap) editor.open(); };

  editor.onChange = () => {
    applyEditorSpace();
    requestAnimationFrame(() => mindmap.fit());   // 미니맵/펼침/전체화면 모두 맞춤
  };
  window.addEventListener('resize', () => { applyEditorSpace(); mindmap.fit(); });
  requestAnimationFrame(() => mindmap.fit());      // 최초 로드 시 미니맵에 맞춤

  // 에디터 열린 동안 배경 위에서 휠 → 실제 스크롤(가려진 하단 끌어올리기)
  stage.addEventListener('wheel', (e) => {
    if (!editor.isOpen) return;
    e.preventDefault();
    yt.scrollTop += e.deltaY;                    // 브라우저가 0~max 로 클램프
  }, { passive: false });

  // 스타트페이지(좌측 하단 My/Cheddar) → blip 가든 등장
  document.addEventListener('blip:openGarden', () => garden.open());

  // 히스토리 카드 → "내 Blip으로 수집" → 내 Garden에 저장내역으로 등장
  let _collectN = 0;
  document.addEventListener('blip:collect', (e) => {
    const d = e.detail || {};
    garden.addCapture({
      id: ++_collectN,
      thumbCss: d.thumb || 'linear-gradient(135deg,#2a3550,#11151d)',
      time: `${d.time || '방금'} · ${d.kind || ''} · ${d.from || ''}`.trim(),
      note: '',
    });
  });

  // 배경 YouTube 추천 영상 채우기 (장식)
  buildRecos();
  // 배경 Instagram 프로필(합정다락) 채우기
  buildInstagram();

  // 페이지 전환은 클릭 스위처가 아니라 제스처(플립/홈)로만 — 프로그램용 헬퍼
  const pages = {
    start: document.getElementById('start'),
    yt: document.getElementById('yt'),
    ig: document.getElementById('ig'),
  };
  window.Blip = window.Blip || {};
  const urlEl = document.getElementById('osUrl');
  const PAGE_URL = {
    start: 'blip://cheddar/서재',
    yt: 'https://www.youtube.com/watch?v=pDzT63SCIHY',
    ig: 'https://www.instagram.com/hapjeong_darak',
  };
  window.Blip.showPage = (which) => {
    for (const k in pages) { if (pages[k]) pages[k].hidden = (k !== which); }
    if (urlEl && PAGE_URL[which]) urlEl.value = PAGE_URL[which];   // 주소창 갱신
  };

  // ── blip 브라우저 창 컨트롤 (신호등 · 독 · 새로고침 · 뒤/앞) ──
  (function osWindow() {
    const desktop = document.getElementById('desktop');
    const win = document.getElementById('osWin');
    const dock = document.getElementById('osDock');
    const app  = document.getElementById('osApp');
    if (!desktop || !win) return;

    const launch = () => {                 // 블립 앱(창) 실행/복귀
      win.classList.remove('is-min', 'is-closed');
      if (dock) dock.hidden = true;
      if (app) app.hidden = true;
    };
    document.querySelectorAll('.oswin__light').forEach((b) => {
      b.addEventListener('click', () => {
        const a = b.dataset.win;
        if (a === 'max') desktop.classList.toggle('is-max');
        else if (a === 'min') { win.classList.add('is-min'); if (dock) dock.hidden = false; }
        else if (a === 'close') { win.classList.add('is-closed'); if (app) app.hidden = false; }  // 닫으면 데스크톱에 B 아이콘
      });
    });
    if (dock) dock.addEventListener('click', launch);            // 독: 한 번 클릭 복귀
    if (app)  app.addEventListener('dblclick', launch);          // 앱 아이콘: 더블클릭 실행
    const reload = document.querySelector('.oswin__reload');
    if (reload) reload.addEventListener('click', () => location.reload());
    const back = document.querySelector('.oswin__navbtn[data-nav="back"]');
    const fwd  = document.querySelector('.oswin__navbtn[data-nav="fwd"]');
    if (back) back.addEventListener('click', () => window.Blip.showPage('start'));
    if (fwd)  fwd.addEventListener('click', () => window.Blip.showPage('yt'));
  })();

  function buildRecos() {
    const box = document.getElementById('ytRecos');
    if (!box) return;
    const recos = [
      ['소니 A7M4 vs A7C2 비교 리뷰', '카메라연구소', '9.8만회 · 3주 전', 'linear-gradient(135deg,#1e3a5f,#0b1622)'],
      ['시네마틱 영상 색보정 LUT 추천', 'ColorGrade Kim', '15만회 · 2개월 전', 'linear-gradient(135deg,#5b1e3a,#1a0b16)'],
      ['입문자를 위한 노출 삼각형 완전정복', '사진학개론', '32만회 · 1년 전', 'linear-gradient(135deg,#1e5f4a,#0b1c16)'],
      ['풀프레임 입문 렌즈 BEST 5', '렌즈덕후', '21만회 · 5개월 전', 'linear-gradient(135deg,#5f4a1e,#1c160b)'],
      ['브이로그 오토포커스 세팅법', '탁호준의 로케트펀치', '7.2만회 · 1주 전', 'linear-gradient(135deg,#3a1e5f,#160b1c)'],
      ['짐벌 없이 손각대 안정화 꿀팁', '무빙샷', '4.5만회 · 4일 전', 'linear-gradient(135deg,#1e5f5f,#0b1c1c)'],
      ['픽처프로파일 S-Log3 입문', 'GradeMaster', '11만회 · 8개월 전', 'linear-gradient(135deg,#5f1e1e,#1c0b0b)'],
      ['카메라 가방 추천 2025', '여행하는사진가', '6.1만회 · 2주 전', 'linear-gradient(135deg,#2e2e5f,#0b0b1c)'],
    ];
    const frag = document.createDocumentFragment();
    for (const [title, ch, sub, bg] of recos) {
      const el = document.createElement('div');
      el.className = 'yt-reco';
      el.innerHTML = `
        <div class="yt-reco__thumb" style="background-image:${bg}"></div>
        <div class="yt-reco__txt">
          <div class="yt-reco__title">${title}</div>
          <div class="yt-reco__sub">${ch}<br>${sub}</div>
        </div>`;
      frag.appendChild(el);
    }
    box.appendChild(frag);
  }

  // ── Instagram (합정다락) 프로필 배경 ──
  function buildInstagram() {
    const hlBox = document.getElementById('igHighlights');
    if (hlBox) {
      const hls = [
        ['공간', 'linear-gradient(135deg,#caa472,#7c5436)'],
        ['메뉴', 'linear-gradient(135deg,#8a5a3b,#3a2415)'],
        ['책방', 'linear-gradient(135deg,#6b7b5a,#2f3a25)'],
        ['모임', 'linear-gradient(135deg,#9a6b8a,#3a1f33)'],
        ['소식', 'linear-gradient(135deg,#5a6b8a,#1f2a3a)'],
      ];
      const f = document.createDocumentFragment();
      for (const [name, bg] of hls) {
        const el = document.createElement('div');
        el.className = 'ig-hl';
        el.innerHTML = `<div class="ig-hl__ring" style="background-image:${bg}"></div><div class="ig-hl__name">${name}</div>`;
        f.appendChild(el);
      }
      hlBox.appendChild(f);
    }

    const grid = document.getElementById('igGrid');
    if (grid) {
      const posts = [
        ['창가 자리의 오후 햇살 ☀️', 'linear-gradient(135deg,#e8cfa8,#a87b4e)'],
        ['이번 주 신간 입고 📚', 'linear-gradient(135deg,#b89b78,#5c4225)'],
        ['핸드드립 한 잔 ☕️', 'linear-gradient(135deg,#7a5236,#2c1a0e)'],
        ['다락 책모임 모집', 'linear-gradient(135deg,#8a7fa0,#34294a)'],
        ['비 오는 날의 다락', 'linear-gradient(135deg,#6b7785,#2a3340)'],
        ['오늘의 디저트 🍰', 'linear-gradient(135deg,#d8a0a8,#7a3f4a)'],
        ['골목 끝 작은 간판', 'linear-gradient(135deg,#9aa17a,#454d2e)'],
        ['따뜻한 조명 아래', 'linear-gradient(135deg,#caa05a,#6e4a18)'],
        ['주말 라이브 음악 🎶', 'linear-gradient(135deg,#7a6ba0,#2e2348)'],
        ['다락의 아침', 'linear-gradient(135deg,#cdbba0,#7d6a4a)'],
        ['손님이 남긴 메모', 'linear-gradient(135deg,#a8b0a0,#4a544a)'],
        ['겨울 시즌 메뉴', 'linear-gradient(135deg,#8a9bb0,#2f3e52)'],
      ];
      const f = document.createDocumentFragment();
      for (const [cap, bg] of posts) {
        const el = document.createElement('div');
        el.className = 'ig-cell';
        el.style.backgroundImage = bg;
        el.innerHTML = `<div class="ig-cell__cap">${cap}</div>`;
        f.appendChild(el);
      }
      grid.appendChild(f);
    }
  }
});
