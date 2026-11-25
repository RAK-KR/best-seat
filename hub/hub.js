// 시리즈 선택 화면
const EPISODES = [
  { n: 1, title: '제일 좋은 자리', en: 'THE BEST SEAT', place: '빛나 사진관 2층' },
  { n: 2, title: '늘 하던 대로', en: 'AS USUAL', place: '명수 이발소' },
  { n: 3, title: '커피 두 잔', en: 'TWO CUPS', place: '청춘다방' },
  { n: 4, title: '두 번째 상영', en: 'SECOND SHOWING', place: '중앙극장' },
  { n: 5, title: '8월 19일', en: 'AUGUST 19', place: '새마을 정미소 · 마지막 편' },
];

function render() {
  const list = document.getElementById('episodes');
  const cleared = BSP.cleared();
  list.innerHTML = '';
  let nextMarked = false;
  EPISODES.forEach((ep) => {
    const done = cleared.includes(ep.n);
    const open = BSP.canPlay(ep.n);
    const isNext = open && !done && !nextMarked;
    if (isNext) nextMarked = true;
    const li = document.createElement('li');
    const el = document.createElement(open ? 'a' : 'div');
    el.className = `ep${done ? ' done' : ''}${isNext ? ' next' : ''}${open ? '' : ' locked'}`;
    if (open) el.href = `ep${ep.n}/`;
    el.innerHTML = `
      <div class="num">${ep.n}</div>
      <div class="body">
        <div class="title">${ep.title}</div>
        <div class="en">${ep.en}</div>
        <div class="place">${ep.place}</div>
      </div>
      <div class="state">${done ? '완료 · 다시 하기' : isNext ? '이어서 하기' : open ? '열림' : '잠김'}</div>`;
    li.appendChild(el);
    list.appendChild(li);
  });
}

document.getElementById('unlock').onclick = () => { BSP.unlockAll(); render(); };
document.getElementById('reset').onclick = () => {
  if (confirm('진행 기록을 지울까요? 1편부터 다시 열립니다.')) { BSP.reset(); render(); }
};
render();
