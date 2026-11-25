# 빛나 사진관 시리즈

같은 동네를 무대로 한 1인칭 3D 방탈출 시리즈입니다. PC 브라우저 전용입니다. 순서대로 하는 것을 권합니다.

## 플레이 주소
https://rak-kr.github.io/best-seat/

들어가면 편 선택 화면이 나옵니다. 앞 편을 끝내면 다음 편이 열리고, 진행 기록은 브라우저에 저장됩니다.

1. 제일 좋은 자리 (THE BEST SEAT) — 빛나 사진관 2층
2. 늘 하던 대로 (AS USUAL) — 명수 이발소
3. 커피 두 잔 (TWO CUPS) — 청춘다방
4. 두 번째 상영 (SECOND SHOWING) — 중앙극장
5. 8월 19일 (AUGUST 19) — 새마을 정미소, 마지막 편

저장소: https://github.com/RAK-KR/best-seat

## 조작 (공통)
- WASD: 이동 / 마우스: 시점
- E 또는 클릭: 살펴보기
- Tab: 수첩 (읽은 편지 다시 보기)
- H: 힌트
- Q: 손에 든 것 쓰기 (2편)
- Esc: 일시정지

## 파일 구조
- `index.html`, `hub/` — 편 선택 화면, `shared/progress.js` — 진행 기록 (모든 편 공통)
- 1편은 `ep1/`, 2편은 `ep2/` 폴더 (각자 독립된 구조)
- 3~5편은 `ep3/`, `ep4/`, `ep5/` 폴더에 편마다 다른 것만 두고, 공통 엔진은 `shared/` 폴더에 있습니다.
  - `shared/engine.js` 렌더링·입력·조사 창·수첩·힌트·엔딩, `shared/build.js` 방 짓는 도구, `shared/puzzle-core.js` 퍼즐 상태, `shared/verify-core.mjs` 검증
  - 편 폴더: `content.js`(대사·단서), `puzzle.js`(진행), `room.js`(3D 공간), `draw.js`(그림), `game.js`(상호작용), `tools/`(검증·자동 플레이)

### 1·2편 폴더 안의 파일
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

각 편의 `tools/` 폴더와 `content.js`에는 정답과 스토리가 들어 있으니, 직접 플레이하기 전에는 열어 보지 않는 것을 권합니다.
