# 빛나 사진관 시리즈

같은 동네를 무대로 한 1인칭 3D 방탈출 시리즈입니다. PC 브라우저 전용입니다. 순서대로 하는 것을 권합니다.

## 플레이 주소
- 1편 · 제일 좋은 자리 (THE BEST SEAT): https://rak-kr.github.io/best-seat/
- 2편 · 늘 하던 대로 (AS USUAL): https://rak-kr.github.io/best-seat/ep2/

저장소: https://github.com/RAK-KR/best-seat

## 조작 (공통)
- WASD: 이동 / 마우스: 시점
- E 또는 클릭: 살펴보기
- Tab: 수첩 (읽은 편지 다시 보기)
- H: 힌트
- Q: 손에 든 것 쓰기 (2편)
- Esc: 일시정지

## 파일 구조 (1편은 루트, 2편은 `ep2/` 폴더에 같은 구조)
- `index.html` — 화면 뼈대
- `css/style.css` — UI 스타일
- `js/content.js` — 편지, 단서, 정답 데이터
- `js/puzzle.js` — 퍼즐 진행 로직 (화면과 분리)
- `js/room.js` — 3D 방 구성
- `js/textures.js`, `js/closeups.js` — 재질과 조사 화면 그림
- `js/player.js` — 이동과 시점
- `js/ui.js`, `js/audio.js`, `js/main.js` — UI, 소리, 게임 진행
- `tools/verify.mjs` — 퍼즐 검증 (`node tools/verify.mjs`)
- `tools/playtest.py` — 헤드리스 자동 플레이 테스트

`tools/` 폴더와 `js/content.js`에는 정답이 들어 있으니, 직접 플레이하기 전에는 열어 보지 않는 것을 권합니다.
