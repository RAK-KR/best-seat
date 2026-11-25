"""헤드리스 크롬으로 처음부터 탈출까지 자동 진행하며 스크린샷을 남긴다.
사용법: python3 tools/playtest.py <three.module.js 경로> <출력 폴더>
조준 판정(레이캐스트)이 실제로 해당 물건에 맞는지까지 확인한다."""
import sys, os, math, threading, http.server, socketserver, functools
from playwright.sync_api import sync_playwright

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))  # 저장소 루트
THREE = sys.argv[1]
OUT = sys.argv[2]
os.makedirs(OUT, exist_ok=True)

Handler = functools.partial(http.server.SimpleHTTPRequestHandler, directory=ROOT)
Handler.log_message = lambda *a: None
socketserver.TCPServer.allow_reuse_address = True
httpd = socketserver.TCPServer(('127.0.0.1', 0), Handler)
PORT = httpd.server_address[1]
threading.Thread(target=httpd.serve_forever, daemon=True).start()

errors = []
fails = []

def check(cond, msg):
    print(('PASS  ' if cond else 'FAIL  ') + msg)
    if not cond:
        fails.append(msg)

with sync_playwright() as p:
    b = p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--autoplay-policy=no-user-gesture-required'])
    pg = b.new_page(viewport={'width': 1280, 'height': 720})
    pg.on('console', lambda m: errors.append(m.text) if m.type == 'error' else None)
    pg.on('pageerror', lambda e: errors.append(str(e)))
    pg.route('**/unpkg.com/three@0.160.0/build/three.module.js', lambda r: r.fulfill(path=THREE, content_type='application/javascript'))
    JSM = os.path.join(os.path.dirname(os.path.dirname(THREE)), 'examples', 'jsm')
    pg.route('**/unpkg.com/three@0.160.0/examples/jsm/**', lambda r: r.fulfill(path=os.path.join(JSM, r.request.url.split('/examples/jsm/')[1]), content_type='application/javascript'))
    pg.route('**/fonts.googleapis.com/**', lambda r: r.fulfill(body='', content_type='text/css'))
    pg.route('**/fonts.gstatic.com/**', lambda r: r.abort())
    pg.goto(f'http://127.0.0.1:{PORT}/ep2/index.html')
    pg.wait_for_function('window.__game', timeout=30000)
    pg.wait_for_timeout(800)
    pg.screenshot(path=f'{OUT}/00_title.png')
    pg.click('#start')
    pg.wait_for_timeout(2200)
    vis = pg.evaluate("[...document.querySelectorAll('#intro-lines p')].map(p => +getComputedStyle(p).opacity)")
    check(all(v > 0.95 for v in vis), f'인트로 문장이 한 번에 모두 표시됨 {vis}')
    pg.screenshot(path=f'{OUT}/01_intro.png')
    pg.evaluate('window.__skipIntro()')
    pg.evaluate('window.__game.player.locked = true')
    pg.wait_for_timeout(600)
    pg.screenshot(path=f'{OUT}/02_start.png')

    def goto(x, z):
        pg.evaluate(f'(() => {{ const P = window.__game.player; P.pos.x = {x}; P.pos.z = {z}; }})()')

    def aim(tx, ty, tz):
        pg.evaluate(f'''(() => {{
            const g = window.__game, c = g.camera, P = g.player;
            const dx = {tx} - P.pos.x, dy = {ty} - (P.sitting ? 1.12 : 1.6), dz = {tz} - P.pos.z;
            P.yaw = Math.atan2(-dx, -dz);
            P.pitch = Math.atan2(dy, Math.hypot(dx, dz));
        }})()''')
        pg.wait_for_timeout(250)

    def use(expected, shot=None, close=True):
        h = pg.evaluate('window.__game.hovered')
        check(h == expected, f'조준 → {expected} (실제: {h})')
        pg.keyboard.press('KeyE')
        pg.wait_for_timeout(700)
        if shot:
            pg.screenshot(path=f'{OUT}/{shot}.png')
        if close and pg.evaluate('window.__game.ui.open'):
            pg.keyboard.press('Escape')
            pg.wait_for_timeout(300)
            pg.evaluate('window.__game.player.locked = true')

    def dial(code):
        # 열린 다이얼 자물쇠에 키보드로 번호를 넣고 Enter
        for k in code: pg.keyboard.press(k)
        pg.keyboard.press('Enter')
        pg.wait_for_timeout(900)

    def state(expr):
        return pg.evaluate(f'window.__game.S.{expr}')

    def btn(i):
        pg.evaluate(f"document.querySelectorAll('#panel-buttons button')[{i}].click()")
        pg.wait_for_timeout(500)

    def esc():
        if pg.evaluate('window.__game.ui.open'):
            pg.keyboard.press('Escape'); pg.wait_for_timeout(300)
        pg.evaluate('window.__game.player.locked = true')

    # 쪽지, 장부, 벽 글씨 등
    goto(0.8, -0.3); aim(0.12, 1.19, -2.46); use('card', '03_card')
    aim(0.8, 2.05, -2.46); use('note')
    goto(-2.6, 0.95); aim(-3.2, 0.93, 0.95); use('ledger', '04_ledger')
    goto(2.2, 1.2); aim(2.25, 1.85, 2.49); use('wallText', '05_walltext')
    goto(-1.7, 1.5); aim(-1.68, 1.25, 2.49); use('marks')
    goto(2.4, -1.3); aim(2.5, 2.2, -2.46); use('clock', '06_clock')
    # 1. 간판 → 2. 온장고 → 김 서림
    goto(-1.3, 1.7); aim(-1.3, 1.3, 2.48); use('poleSwitch')
    check(state('power'), '간판 켜짐')
    goto(2.0, -1.4); aim(2.0, 1.05, -2.2); use('warmer')
    check(state('warmer'), '온장고 켜짐')
    goto(0.8, -0.1); aim(0.8, 1.55, -2.47)
    for _ in range(60):
        if pg.evaluate('window.__game.fog') > 0.75: break
        pg.wait_for_timeout(1000)
    pg.wait_for_timeout(1500)
    pg.screenshot(path=f'{OUT}/07_fog.png')
    check(state('k.k_fog') == True, f"김 서린 거울 글씨 확인 (김 {pg.evaluate('window.__game.fog'):.2f})")
    esc()
    # 정자 자리
    goto(-1.8, -0.35); aim(-1.8, 0.8, -1.25); use('coveredChair')
    pg.wait_for_timeout(800)
    aim(-1.8, 0.55, -1.25); use('coveredChair', close=False)
    btn(0); check('backKey' in state('inv'), '뒷방 열쇠 획득'); esc()
    pg.screenshot(path=f'{OUT}/08_shop.png')
    # 뒷방
    goto(2.9, -1.3); aim(3.5, 1.2, -1.3); use('backDoor')
    pg.wait_for_timeout(800)
    check(state('backOpen'), '뒷방 열림')
    goto(4.3, -0.5); aim(4.8, 0.39, -1.2); use('diary', '09_diary')
    goto(4.9, -0.7); aim(4.9, 1.6, -2.48); use('wifePhoto')
    pg.screenshot(path=f'{OUT}/10_backroom.png')
    # 컵장: 거꾸로 읽은 825는 오답, 528이 정답
    goto(-2.7, -1.05); aim(-3.3, 1.5, -1.05); use('cabinet', close=False)
    for k in '825': pg.keyboard.press(k)
    pg.keyboard.press('Enter'); pg.wait_for_timeout(500)
    check(not state('cabinetOpen'), '뒤집힌 숫자를 모양대로 읽은 825는 오답')
    for k in '528': pg.keyboard.press(k)
    pg.keyboard.press('Enter'); pg.wait_for_timeout(1200)
    check(state('cabinetOpen'), '528로 컵장 열림')
    pg.screenshot(path=f'{OUT}/11_mugs.png')
    btn(4); check('mugKey' not in state('inv'), '이름 없는 새 컵에는 열쇠 없음')
    btn(2); check('mugKey' in state('inv'), '홈 파인 윤 씨 컵에서 열쇠 획득')
    esc()
    # 장롱
    goto(5.3, -1.8); aim(6.07, 1.0, -1.8); use('wardrobe')
    pg.wait_for_timeout(800)
    check(state('wardrobeOpen'), '장롱 열림')
    use('wardrobe', close=False); btn(0); btn(1)
    check('handMirror' in state('inv'), '손거울 획득')
    pg.screenshot(path=f'{OUT}/12_wardrobe.png')
    esc()
    # 의자: 높이 4 → 앉기 → 손거울
    goto(1.7, -0.6); aim(0.8, 0.6, -1.25); use('mainChair', close=False)
    btn(0); btn(0); btn(0)
    check(state('chair') == 4, '의자 4칸')
    btn(2); pg.wait_for_timeout(1500)
    pg.evaluate('window.__game.player.locked = true')
    pg.screenshot(path=f'{OUT}/13_seated_mirror.png')
    pg.keyboard.press('KeyQ'); pg.wait_for_timeout(800)
    check(state('k.k_envSeen') == True, '손거울로 봉투 발견')
    pg.screenshot(path=f'{OUT}/14_handmirror.png')
    esc()
    pg.keyboard.press('KeyE'); pg.wait_for_timeout(700)
    check(not state('seated'), '일어남')
    # 봉투
    goto(-2.4, 1.85); aim(-2.32, 2.57, 2.43); use('envelope', '15_envelope', close=False)
    btn(0); pg.wait_for_timeout(300); pg.screenshot(path=f'{OUT}/16_negative.png')
    btn(0); pg.wait_for_timeout(300); pg.screenshot(path=f'{OUT}/17_letter.png')
    esc()
    check('envelope' in state('inv'), '봉투 획득')
    aim(-2.4, 1.2, 2.47); use('entrance')
    pg.wait_for_timeout(5000)
    check(state('done'), '가게를 나섬')
    pg.screenshot(path=f'{OUT}/18_ending.png')
    pg.mouse.click(640, 360); pg.wait_for_timeout(800)
    pg.screenshot(path=f'{OUT}/19_ending_all.png', full_page=True)
    b.close()

httpd.shutdown()
real = [e for e in errors if 'fonts' not in e and 'ERR_FAILED' not in e]
check(not real, '콘솔 에러 없음' + (': ' + ' | '.join(real[:5]) if real else ''))
print(f'\n실패 {len(fails)}건' if fails else '\n자동 플레이 전부 통과')
