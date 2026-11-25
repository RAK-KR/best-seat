"""선택 화면과 순서 잠금 테스트: python3 hub/test.py <출력 폴더>"""
import sys, os, threading, http.server, socketserver, functools, json
from playwright.sync_api import sync_playwright
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = sys.argv[1]; os.makedirs(OUT, exist_ok=True)
H = functools.partial(http.server.SimpleHTTPRequestHandler, directory=ROOT); H.log_message = lambda *a: None
socketserver.TCPServer.allow_reuse_address = True
srv = socketserver.TCPServer(('127.0.0.1', 0), H); threading.Thread(target=srv.serve_forever, daemon=True).start()
base = f'http://127.0.0.1:{srv.server_address[1]}'
fails = []
def check(c, m):
    print(('PASS  ' if c else 'FAIL  ') + m)
    if not c: fails.append(m)
with sync_playwright() as p:
    b = p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'])
    pg = b.new_page(viewport={'width': 1280, 'height': 900})
    errs = []
    pg.on('pageerror', lambda e: errs.append(str(e)))
    pg.route('**/fonts.googleapis.com/**', lambda r: r.fulfill(body='', content_type='text/css'))
    pg.route('**/fonts.gstatic.com/**', lambda r: r.abort())
    pg.route('**/unpkg.com/**', lambda r: r.abort())
    pg.goto(base + '/'); pg.wait_for_timeout(500)
    links = pg.evaluate("[...document.querySelectorAll('#episodes a.ep')].map(a => a.getAttribute('href'))")
    check(links == ['ep1/'], f'처음엔 1편만 열림 {links}')
    pg.screenshot(path=f'{OUT}/hub_fresh.png', full_page=True)
    pg.goto(base + '/ep3/index.html'); pg.wait_for_timeout(500)
    check(pg.evaluate("document.getElementById('start').disabled"), '잠긴 3편 주소로 바로 들어오면 시작 버튼이 막힘')
    pg.evaluate("localStorage.setItem('bestseat-cleared', JSON.stringify([1,2]))")
    pg.goto(base + '/'); pg.wait_for_timeout(300)
    links = pg.evaluate("[...document.querySelectorAll('#episodes a.ep')].map(a => a.getAttribute('href'))")
    check(links == ['ep1/', 'ep2/', 'ep3/'], f'1·2편을 끝내면 3편까지 열림 {links}')
    check(pg.evaluate("document.querySelector('.ep.next .title').textContent") == '커피 두 잔', '"이어서 하기"가 3편')
    pg.screenshot(path=f'{OUT}/hub_progress.png', full_page=True)
    pg.goto(base + '/ep3/index.html'); pg.wait_for_timeout(500)
    check(not pg.evaluate("document.getElementById('start').disabled"), '열린 3편은 시작 가능')
    pg.goto(base + '/'); pg.click('#unlock'); pg.wait_for_timeout(200)
    check(pg.evaluate("document.querySelectorAll('#episodes a.ep').length") == 5, '모든 편 열기')
    check(not errs, f'페이지 에러 없음 {errs[:3]}')
    b.close()
srv.shutdown()
print(f'\n실패 {len(fails)}건' if fails else '\n선택 화면 테스트 통과')
