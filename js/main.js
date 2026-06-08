/* blip — 조립 (Atom / Browser / Editor 객체를 연결) */
window.addEventListener('DOMContentLoaded', () => {
  const Blip = window.Blip;

  // 컴포넌트 인스턴스
  const atomShelf = new Blip.AtomShelf(document.getElementById('atomsPanel'));
  const editor    = new Blip.Editor(document.getElementById('editorPanel'));
  const browser   = new Blip.Browser({
    stage:     document.getElementById('stage'),
    atomShelf, editor,
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

  // 배경 YouTube 추천 영상 채우기 (장식)
  buildRecos();

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
});
