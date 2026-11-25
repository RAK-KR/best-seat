// 4편 "두 번째 상영" — 상호작용과 진행
import * as THREE from 'three';
import { run } from '../../shared/engine.js';
import { createState, doAction } from './puzzle.js';
import { buildRoom } from './room.js';
import { DOCS, CODES, REELS, FOOTAGE, INTRO, ENDING, ENDING_LAST } from './content.js';
import { makeCanvas, drawFootage, drawRow7, drawCans, drawStubs, drawNegative } from './draw.js';
import { drawPortrait } from '../../shared/draw.js';

const anim = { door: 0, bdoor: 0, lever: 0, foot: 0 };
let frameAcc = 0, frame = 0, drawAcc = 0;

const game = {
  epLabel: '4편',
  exposure: 1.15,
  createState, doAction,
  docs: DOCS,
  intro: INTRO, ending: ENDING, endingLast: ENDING_LAST,
  endingImage: () => { const c = makeCanvas(560, 320); drawNegative(c); return c; },
  nextLink: { label: '5편: 8월 19일', href: '../ep5/' },
  startPos: { x: -4.12, z: 3.85, yaw: 0 },
  itemNames: { boothKey: '영사실 열쇠', reel: '필름 릴', can: '하루 깡통' },
  labels: {
    entrance: '출입문', screen: '스크린', row7: '7열 표지', seat8: '7열 8번', seat9: '7열 9번', seat10: '7열 10번',
    notice: '영사실 문 쪽지', boothDoor: '영사실 문', power: '전원 스위치', log: '영사 일지', tickets: '표 상자',
    cans: '필름 통 선반', projector: '영사기', porthole: '영사창', rewind: '되감기대', portrait: '사진',
  },
  buildRoom,
  titleCamera(camera, t) {
    camera.position.set(Math.sin(t * 0.08) * 1.5, 1.8, 4.0);
    camera.rotation.set(-0.02, Math.sin(t * 0.06) * 0.2, 0, 'YXZ');
  },
  hoverFilter(id, ctx) {
    if (id === 'boothDoor' && ctx.S.boothOpen) return null;
    return id;
  },

  handlers(ctx) {
    const { S, say, act, has, img, openPanel, showDoc, ui, sfx, sfx2 } = ctx;
    function footagePanel() {
      act('view_footage');
      const c = makeCanvas(1024, 448); drawFootage(c, frame, performance.now() / 1000);
      openPanel({
        title: '스크린', content: img(c, 640), wide: true,
        text: '흑백 필름. 높은 곳, 영사창에서 내려다본 객석이다. 날짜 자막이 바뀌어 간다.<br>1986년, 1992년, 2001년… 2022년. 금요일마다 <b>7열 9번</b>에 같은 여자가 앉아 있다. 머리가 점점 하얘진다.<br>바로 옆 10번은 한 번도 채워지지 않는다.<br>마지막 장면: 7열 <b>8번</b> 의자 밑에 깡통 하나. 그리고 손글씨 자막. "하루야, 여기."',
      });
    }
    function canPanel() {
      ctx.dial(4, CODES.can, () => {
        if (!act('open_can')) return false;
        setTimeout(() => {
          const c = makeCanvas(560, 300); drawStubs(c);
          openPanel({
            title: '하루 깡통', content: img(c, 420),
            text: '깡통이 열렸다. 표 두 장, 잘라 낸 필름 한 컷, 접힌 편지.<br>표는 둘 다 8월 19일, 7열 8번. 한 장은 1시, 한 장은 3시.',
            buttons: [
              { label: '필름을 빛에 비춰 본다', onClick: () => { ui.close(); setTimeout(showNegative, 60); } },
              { label: '편지를 읽는다', onClick: () => { ui.close(); setTimeout(() => showDoc('letter'), 60); } },
            ],
          });
        }, 300);
        return true;
      }, '하루 깡통', '필름 깡통. 뚜껑에 네 자리 번호 자물쇠. 라벨: <b>"하루 — 상영 시각"</b>');
    }
    function showNegative() {
      const c = makeCanvas(560, 320); drawNegative(c);
      openPanel({
        title: '필름 한 컷', content: img(c, 420),
        text: '스크린 빛 앞, 객석에 나란히 앉은 작은 아이와 노인의 뒷모습.<br>가장자리에 마커로 쓴 글씨 ":4"가 반쯤 잘려 있다.',
        buttons: [{ label: '편지를 읽는다', onClick: () => { ui.close(); setTimeout(() => showDoc('letter'), 60); } }],
      });
    }
    return {
      entrance() {
        if (S.canOpen) { act('leave'); ctx.finish(); return; }
        say('아직 "하루 깡통"을 못 찾았다.');
      },
      screen() {
        if (S.running) { footagePanel(); return; }
        act('look_screen'); say('커다란 흰 스크린. 양옆 붉은 커튼이 반쯤 걷혀 있다.');
      },
      porthole() {
        if (S.running) { footagePanel(); return; }
        say('영사창. 작은 구멍 너머로 객석과 스크린이 내려다보인다. 7열이 한눈에 들어온다.');
      },
      row7() {
        act('look_row7');
        const c = makeCanvas(720, 400); drawRow7(c);
        openPanel({ title: '7열', content: img(c, 560), text: '7열 8·9·10번만 유난히 다르다.' });
      },
      seat8() {
        if (!S.k.k_footage) { say('7열 8번. 평범하게 닳은 의자. 의자 밑은 어두워서 잘 안 보인다.'); return; }
        if (!has('can')) { act('take_can'); sfx.key(); ctx.refs.can.visible = false; say('필름 속 그 자리. 의자 밑을 더듬자 차가운 깡통이 손에 잡혔다.'); }
        if (!S.canOpen) setTimeout(canPanel, 300);
      },
      seat9() { act('look_seat9'); say('7열 9번. 가죽이 반들반들 닳았다. 누군가 오래, 자주 앉았던 자리.'); },
      seat10() {
        if (has('boothKey') || S.boothOpen) { say('7열 10번. 비닐도 안 뜯은 새 의자.'); return; }
        act('take_boothKey'); sfx.key();
        say('7열 10번. 비닐도 안 뜯은 새 의자다. 한 번도 아무도 안 앉았다. 비닐과 방석 사이에 열쇠 하나. "영사실".', 6000);
      },
      notice() { act('read_notice'); showDoc('notice'); },
      boothDoor() {
        if (S.boothOpen) return;
        if (has('boothKey')) { act('open_booth'); sfx.unlock(); setTimeout(() => sfx.door(), 200); say('영사실 문을 열었다.'); }
        else say('영사실 문. 잠겨 있다.');
      },
      power() {
        act('toggle_power'); sfx.dial(); sfx.unlock();
        if (!S.power) sfx2.projector(false);
        say(S.power ? '전원을 올렸다. 영사기 램프 쪽에서 웅 소리가 난다.' : '전원을 내렸다.');
      },
      log() { act('read_log'); showDoc('log'); },
      tickets() { act('look_tickets'); showDoc('tickets'); },
      cans() {
        act('look_cans');
        const c = makeCanvas(640, 520); drawCans(c, REELS);
        openPanel({
          title: '필름 통 선반', content: img(c, 440), text: '어느 릴을 꺼낼까.',
          buttons: REELS.map((r, i) => ({
            label: `${i + 1}번`, onClick: () => {
              sfx.dial();
              if (r.id !== 'friday') { ui.setText(`"${r.label}". 이건 아니다. 다시 꽂아 두었다.`); return; }
              if (has('reel') || S.mounted) { ui.setText('금요일 릴은 이미 꺼냈다.'); return; }
              act('take_reel'); sfx.key();
              ui.setText('"금요일 — 영사창에서". 덕배 아저씨가 직접 찍은 필름이다. <b>필름 릴</b>을 챙겼다.');
            },
          })),
        });
      },
      projector() {
        const st = () => (S.running ? '영사기가 돌고 있다. 빛줄기가 영사창을 지나 스크린으로 뻗는다.'
          : S.mounted ? '릴을 걸었다. 이제 돌리면 된다.' : has('reel') ? '빈 영사기. 들고 온 릴을 걸 수 있다.' : '빈 영사기. 필름 릴을 걸어야 한다.');
        const buttons = [];
        if (has('reel') && !S.mounted) buttons.push({ label: '릴 걸기', onClick: () => { act('mount_reel'); sfx.drawer(); ui.setText(st()); } });
        buttons.push({
          label: S.running ? '멈추기' : '돌리기', onClick: () => {
            if (S.running) { act('stop_projector'); sfx2.projector(false); ui.setText(st()); return; }
            if (!S.mounted) { ui.setText('걸린 릴이 없다.'); return; }
            if (!S.power) { ui.setText('스위치를 올려도 램프가 안 켜진다. 전원이 안 들어온다.'); return; }
            act('run_projector'); sfx2.projector(true); ui.close();
            say('영사기가 돌기 시작했다. 영사창 너머 스크린에 빛이 맺힌다.', 5000);
          },
        });
        openPanel({ title: '영사기', text: st(), buttons });
      },
      rewind() { say('되감기 작업대. 끊어진 필름 조각과 접착 테이프가 굴러다닌다.'); },
      portrait() {
        const c = makeCanvas(256, 320); drawPortrait(c, 'man', 51);
        openPanel({ title: '사진', content: img(c, 220), text: '영사기 앞에 선 덕배 아저씨. 구석에 "빛나 사진관" 도장.' });
      },
    };
  },

  hintText(S) {
    const k = S.k, has = (i) => S.inv.includes(i);
    if (!S.boothOpen) {
      if (!k.k_notice) return '객석 뒤 영사실 문에 쪽지가 붙어 있습니다.';
      if (!has('boothKey')) return k.k_row7 ? '"늘 비워 둔 자리"는 한 번도 아무도 앉지 않은 자리입니다. 7열을 다시 보세요.' : '7열을 살펴보세요. 통로 쪽에 줄 번호 표가 있습니다.';
      return '영사실 문을 여세요.';
    }
    if (!S.power) return '영사실 문 옆 벽의 전원 스위치를 올리세요.';
    if (!S.mounted && !has('reel')) return '필름 통 선반에서 덕배 아저씨가 직접 찍은 릴을 찾으세요.';
    if (!S.mounted) return '영사기에 릴을 거세요.';
    if (!k.k_footage) return S.running ? '스크린을 보세요. 객석으로 내려가거나 영사창으로 내다볼 수 있습니다.' : '영사기를 돌리세요.';
    if (!has('can')) return '필름 마지막 장면이 가리킨 자리, 7열 8번 의자 밑을 보세요.';
    if (!S.canOpen) return k.k_log ? '깡통 라벨은 "상영 시각". 일지의 8월 19일 두 시각을 이어 보세요.' : '영사 일지에 8월 19일 기록이 있습니다.';
    return '이제 극장을 나가면 됩니다.';
  },

  update(ctx, dt, t) {
    const { S, refs, camera } = ctx;
    if (!refs) return;
    const e = (k, target, sp = 4) => { anim[k] += (target - anim[k]) * Math.min(1, dt * sp); return anim[k]; };
    refs.boothDoor.rotation.y = -e('bdoor', S.boothOpen ? 1 : 0) * 1.6;
    refs.lever.position.y = S.power ? 0.05 : -0.05;
    refs.lampGlow.emissiveIntensity = S.power ? 2.5 : 0;
    refs.reelB.visible = S.mounted;
    const f = e('foot', S.running ? 1 : 0, 1.2);
    refs.foot.material.opacity = f;
    refs.beamMat.opacity = f * 0.05;
    refs.sconces.forEach((l) => { l.intensity = 1.2 * (1 - f * 0.6); });
    refs.hallLight.intensity = 2.0 * (1 - f * 0.8);
    if (S.running) {
      refs.reelA.rotation.x += dt * 4; refs.reelB.rotation.x += dt * 4;
      frameAcc += dt; drawAcc += dt;
      if (frameAcc > 1.8) { frameAcc = 0; frame = (frame + 1) % FOOTAGE.length; }
      if (drawAcc > 0.08) { drawAcc = 0; drawFootage(refs.footC, frame, t); refs.footTex.needsUpdate = true; }
      if (!S.k.k_footage && f > 0.6) {
        const d = new THREE.Vector3(); camera.getWorldDirection(d);
        if (d.z < -0.75) {
          ctx.act('view_footage');
          ctx.sfx.reveal();
          ctx.say('스크린에 흑백 필름이 돈다. 높은 데서 내려다본 객석… 7열. 9번에 누가 앉아 있다.', 6500);
        }
      }
    }
  },
};

run(game);
