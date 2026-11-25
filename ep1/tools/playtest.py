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
    pg.route('**/fonts.googleapis.com/**', lambda r: r.fulfill(body='', content_type='text/css'))
    pg.route('**/fonts.gstatic.com/**', lambda r: r.abort())
    pg.add_init_script("localStorage.setItem('bestseat-unlock-all','1')")
    pg.goto(f'http://127.0.0.1:{PORT}/ep1/index.html')
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

    # 1. 책상 위 편지
    goto(-1.9, 1.4); aim(-2.58, 0.79, 1.25)
    use('letter1', '03_letter1')
    # 2. 시계
    aim(-2.97, 1.95, 1.4)
    use('clock', '04_clock')
    # 3. 서랍: 틀린 번호 → 맞는 번호
    aim(-2.28, 0.66, 1.4)
    use('drawer', close=False)
    dial('111'); check(not state('drawerOpen'), '틀린 번호로는 서랍이 안 열림')
    pg.keyboard.press('Escape'); pg.wait_for_timeout(300); pg.evaluate('window.__game.player.locked = true')
    use('drawer', close=False)
    dial('340')
    pg.wait_for_timeout(600)
    pg.screenshot(path=f'{OUT}/05_letter2.png')
    check(state('drawerOpen') and 'darkroomKey' in state('inv'), '서랍 열림, 암실 열쇠 획득')
    pg.keyboard.press('Escape'); pg.wait_for_timeout(300); pg.evaluate('window.__game.player.locked = true')
    # 4. 거꾸로 걸린 사진
    goto(-1.15, 1.6); aim(-1.15, 1.75, 2.47)
    use('portraitGrandpa', '06_portrait')
    pg.screenshot(path=f'{OUT}/06b_wall_south.png')
    # 5. 배경천 → 퓨즈함
    goto(1.45, -1.3); aim(1.45, 1.4, -2.2)
    use('backdrop')
    pg.wait_for_timeout(800)
    aim(1.45, 1.45, -2.4)
    pg.screenshot(path=f'{OUT}/07_fusebox_seen.png')
    # 6. 암실
    goto(-1.9, -1.6); aim(-1.9, 1.2, -2.5)
    use('darkroomDoor')
    pg.wait_for_timeout(900)
    check(state('darkroomOpen'), '암실 문 열림')
    goto(-1.9, -3.2); aim(-2.0, 1.55, -4.49)
    pg.screenshot(path=f'{OUT}/08_darkroom.png')
    use('chart', '09_chart')
    aim(-2.85, 1.65, -3.6)
    use('bottles', '10_bottles')
    goto(-1.9, -3.6); aim(-1.6, 1.94, -3.75)
    use('photo', '11_photo')
    goto(-2.1, -3.9); aim(-2.67, 0.92, -4.2)
    use('letter3', '12_letter3')
    goto(-2.3, -4.0); aim(-2.91, 0.94, -4.42)
    use('canister', '12b_canister')
    goto(-2.1, -3.9); aim(-2.55, 0.93, -3.95)
    use('screwdriver')
    check('screwdriver' in state('inv'), '드라이버 획득')
    # 7. 퓨즈함 열기
    goto(1.45, -1.4); aim(1.45, 1.45, -2.4)
    use('fusebox', close=False)
    for k in '3142': pg.keyboard.press(k)
    pg.keyboard.press('Enter')
    pg.wait_for_timeout(900)
    pg.wait_for_timeout(500)
    check(state('fuseboxOpen'), '퓨즈함 열림')
    pg.screenshot(path=f'{OUT}/13_fusebox_open.png')
    pg.keyboard.press('Escape'); pg.wait_for_timeout(300); pg.evaluate('window.__game.player.locked = true')
    # 8. 창문 마개
    goto(-2.2, -0.3); aim(-2.93, 1.55, -0.3)
    use('window', close=False)
    check(pg.evaluate("document.getElementById('vcursor').classList.contains('show')"), '조사 창에서 가상 커서 표시')
    pg.evaluate('''(() => {
        const r = document.querySelector('#panel-buttons button').getBoundingClientRect();
        const c = window.__game.ui.cursor; c.x = r.x + r.width / 2; c.y = r.y + r.height / 2; c.place(); c.click();
    })()''')
    pg.wait_for_timeout(700)
    pg.evaluate('window.__game.player.locked = true')
    check(not state('capOn'), '마개 열림')
    goto(0.5, -0.3); aim(3, 1.5, -0.3)
    pg.wait_for_timeout(500)
    pg.screenshot(path=f'{OUT}/14_wall_lit_capoff.png')
    # 9. 퓨즈 뽑기
    goto(1.45, -1.4); aim(1.45, 1.45, -2.4)
    use('fusebox', close=False)
    pg.keyboard.press('Enter')
    pg.wait_for_timeout(800)
    pg.evaluate('window.__game.player.locked = true')
    check(not state('fuseIn'), '퓨즈 뽑힘')
    aim(1.45, 1.45, -2.4)
    pg.wait_for_timeout(400)
    pg.screenshot(path=f'{OUT}/15_dark.png')
    # 10. 의자에 앉기
    goto(0.6, -0.3); aim(1.4, 0.5, -0.3)
    use('chair')
    pg.wait_for_timeout(4500)
    pg.screenshot(path=f'{OUT}/16_projection_seat.png')
    check(state('k.k_projection') == True, '벽에 맺힌 상을 봄')
    pg.keyboard.press('KeyE'); pg.wait_for_timeout(700)
    goto(-1.5, 1.4); aim(3, 1.4, -0.6)
    pg.wait_for_timeout(500)
    pg.screenshot(path=f'{OUT}/17_projection_room.png')
    # 11. 문 번호
    goto(1.5, 1.9); aim(1.58, 1.3, 2.48)
    use('keypad', close=False)
    for k in '6180': pg.keyboard.press(k)
    pg.keyboard.press('Enter'); pg.wait_for_timeout(500)
    check(not state('doorOpen'), '뒤집힌 모양대로 읽은 6180은 오답')
    for k in '0819': pg.keyboard.press(k)
    pg.keyboard.press('Enter')
    pg.wait_for_timeout(1500)
    check(state('doorOpen'), '0819로 문이 열림')
    pg.wait_for_timeout(4000)
    pg.screenshot(path=f'{OUT}/18_ending_a.png')
    pg.wait_for_timeout(16000)
    pg.screenshot(path=f'{OUT}/19_ending_b.png', full_page=True)
    check(1 in pg.evaluate("JSON.parse(localStorage.getItem('bestseat-cleared') || '[]')"), '엔딩 후 1편 완료 기록')
    b.close()

httpd.shutdown()
real = [e for e in errors if 'fonts' not in e and 'ERR_FAILED' not in e]
check(not real, '콘솔 에러 없음' + (': ' + ' | '.join(real[:5]) if real else ''))
print(f'\n실패 {len(fails)}건' if fails else '\n자동 플레이 전부 통과')
