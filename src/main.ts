import './style.css';
import './retro.css';
import './viewport.css';
import './results.css';
import { ringPopupBell } from './sound';
import { GameSession, levels, parseSave } from './game';
import { BrowserMission } from './mission';
import { ChatMission, DriveMission, renderChat, renderDrive } from './scenarios';
import './scenarios.css';
import { GamingMission, renderGaming } from './gaming';
const mission = new BrowserMission();
const chat = new ChatMission();
const drive = new DriveMission();
const steam = new GamingMission('install');
const gaming = new GamingMission('purchase');

const app = document.querySelector<HTMLDivElement>('#app')!;
const key = 'can-you-close-that:v1';
let save = parseSave(null);
try { save = parseSave(localStorage.getItem(key)); } catch { /* Storage may be disabled. */ }
let game: GameSession | null = null;
let toastTimer: ReturnType<typeof setTimeout>;
let lastTime = performance.now();
let recorded = false;
let practice = false;
let escapeSide = false;
let drag: { element: HTMLElement; x: number; y: number; left: number; top: number; scale: number } | null = null;
let storageWarning = false;
let hudCollapsed = window.matchMedia("(max-width: 600px)").matches;
let popupSound = true;
const announcedAds = new Set<string>();

function persist() {
  try { localStorage.setItem(key, JSON.stringify(save)); }
  catch { storageWarning = true; }
}
function format(ms: number) { return (ms / 1000).toFixed(1) + 's'; }
function applySettings() { document.documentElement.classList.toggle('reduced-motion', save.reducedMotion); }
applySettings();
function shell(body: string) {
  app.innerHTML = `<header class="topbar"><button class="brand" data-action="home"><span class="brand-icon">×</span> 你能关掉吗<span class="brand-question">？</span></button><span class="edition">2006 / 上网求生</span></header>${body}<div id="toast" class="toast" role="status" aria-live="polite"></div><footer>关闭一个弹窗，找回一点清净。</footer>`;
}
function home() {
  game = null;
  document.body.classList.remove('in-game');
  shell(`<main class="home level-lobby"><section class="level-section"><div class="section-heading"><div><div class="eyebrow">你能关掉吗？ / 互联网弹窗求生</div><h1>选择关卡</h1></div><span>点击关卡，开始游戏</span></div><div class="level-grid">${levels.map((level, index) => `<button class="level-card" data-action="start" data-index="${index}"><div class="card-top"><span class="level-number">${String(index + 1).padStart(2, '0')}</span><span class="tag">${level.id === 20 ? '上网任务' : level.id === 1 ? '聊天购物' : level.id === 10 ? '网盘下载' : level.id === 4 ? '平台安装' : '游戏购买'}</span></div><h3>${level.name}</h3><p>${level.time ? level.time + ' 秒限时' : '不限时'}</p><div class="card-bottom"><span>${save.best[level.id] ? '个人最快 ' + format(save.best[level.id]) : save.completed.includes(level.id) ? '已辅助通关' : '尚未通关'}</span><b>开始 →</b></div></button>`).join('')}</div></section><details class="lobby-settings"><summary>游戏设置</summary><div class="settings"><label><input id="practice" type="checkbox" ${practice ? 'checked' : ''}> 练习模式（关闭倒计时）</label><label><input id="motion" type="checkbox" ${save.reducedMotion ? 'checked' : ''}> 减少动态效果</label><span>纪录保存在当前浏览器。</span></div></details></main>`);
}
function popup(id: string, title: string, content: string, extra = '') {
  return `<section class="popup ${extra}" data-popup="${id}"><div class="popup-title" data-drag><span>${title}</span><button class="close-button" data-action="close" data-id="${id}" aria-label="关闭${id}窗口">×</button></div>${content}</section>`;
}
function drawWindows() {
  requestAnimationFrame(fitPopupWindows);
  const layer = document.querySelector<HTMLDivElement>('#windows')!;
  if (!game) return;
  if ([1, 4, 10, 30].includes(game.level.id)) { layer.innerHTML = ''; drawScenario(); return; }
  if (game.level.id === 20) { drawMissionAds(); return; }
  if (game.level.id === 4) {
    layer.innerHTML = game.closed.has('main') ? '' : popup('main', '贴心服务 · 关闭键有点社恐', `<div class="popup-body shy"><div class="shy-face">（•﹏•）</div><h2>别追我，我有点紧张。</h2><p>移动中：接近关闭键，它就换个位置。<br><b>拖动标题栏一次，让关闭键安心停下来。</b></p><button class="button outline" data-action="fix">固定窗口（也可拖动标题栏）</button><small id="shy-status">状态：移动中 / 键盘操作可直接关闭</small><button class="button coral" data-action="trap">开通社交会员，让它不再害羞</button></div>`, 'shy-window');
  }
}
function play(index: number) {
  game = new GameSession(index, practice); recorded = false; lastTime = performance.now();
  announcedAds.clear();
  document.body.classList.add('in-game');
  mission.reset(); chat.reset(); drive.reset(); steam.reset(); gaming.reset();
  shell(`<main class="game-layout${hudCollapsed ? ' hud-collapsed' : ''}"><nav class="game-nav"><button data-action="home">← 返回大厅</button><span>CHALLENGE ${String(game.level.id).padStart(2, '0')} / ${game.level.tag}</span><div><button data-action="hint">◎ 提示</button><button data-action="retry">↻ 重试</button><button data-action="pause">Ⅱ 暂停</button></div></nav><aside class="game-sidebar"><button class="hud-toggle" data-action="toggle-hud" aria-controls="game-details" aria-expanded="${!hudCollapsed}" aria-label="${hudCollapsed ? '展开关卡信息' : '收起关卡信息'}"><span class="hud-toggle-label">关卡信息</span><span class="hud-toggle-icon" aria-hidden="true">${hudCollapsed ? '›' : '‹'}</span></button><div id="game-details" ${hudCollapsed ? 'hidden' : ''}><div class="hud"><div><span class="eyebrow">当前关卡</span><h1>${game.level.name}</h1></div><div class="hud-stat"><span>耐心值</span><strong id="patience">♥ ♥ ♥</strong></div><div class="hud-stat"><span>${game.level.time && !practice ? '倒计时' : '用时'}</span><strong id="timer">0.0s</strong></div><div class="hud-stat"><span>剩余目标</span><strong id="remaining">${game.remaining}</strong></div></div></div></aside><div class="stage" id="stage"><div class="browser-bar"><div class="browser-dots"><i></i><i></i><i></i></div><div class="address">▣ surfing.example / a-quiet-internet</div><span>冲浪浏览器</span></div><div class="website"><div class="site-logo">冲浪导航<span> SURFING DAILY</span></div><div class="site-categories">发现好文　 ·　 数字生活　 ·　 今日推荐</div><article><span class="article-tag">数字生活 / 3 分钟阅读</span><h2>如何拥有<br>清净的互联网。</h2><p>给忙碌的自己留一块安静的地方，<br>从关掉不必要的打扰开始。</p><div class="article-lines"><b></b><b></b><b></b></div><div id="clean-message">第一步：关闭所有弹窗。</div></article><div class="site-aside">今日宜<br><strong>清净</strong><span>不宜：立即领取</span></div></div><div id="windows"></div><div id="overlay"></div></div><div class="game-bottom"><span id="feedback" role="status">先观察，再动手。</span><span id="stats">误点 0 · 死亡 0 · 重试 0</span></div></main>`);
  if (game.level.id === 20) drawMissionPage();
  const soundButton = document.createElement('button');
  soundButton.dataset.action = 'toggle-sound';
  soundButton.setAttribute('aria-label', '弹窗铃声');
  soundButton.setAttribute('aria-pressed', String(popupSound));
  soundButton.textContent = popupSound ? '♪ 铃声开' : '♪ 铃声关';
  document.querySelector('.game-nav>div')!.append(soundButton);
  const stage = document.querySelector('#stage')!;
  const brief = document.createElement('div');
  brief.className = 'task-brief';
  brief.textContent = game.level.id === 20 ? '任务：搜索「星河浏览器」，找到 xinghe.example · 发布者：星河实验室' : game.level.intro;
  document.querySelector('#game-details')!.append(brief);
  drawWindows(); overlay('ready'); updateHUD();
}
function resultEffect(won: boolean) {
  const mark = won ? '<path class="result-mark" d="m22 39 11 11 23-25" />' : '<path class="result-mark" d="m27 27 24 24 m0-24-24 24" />';
  return `<div class="result-emblem" aria-hidden="true"><svg viewBox="0 0 78 78"><circle class="result-ring" cx="39" cy="39" r="34" />${mark}</svg></div><div class="result-label">${won ? '挑战成功！' : '挑战失败'}</div>`;
}
function confetti() {
  const colors = ['#39a56a', '#eab547', '#ef8274', '#6c9ed8', '#ab85cf'];
  return `<div class="result-confetti" aria-hidden="true">${Array.from({ length: 48 }, (_, i) => {
    const side = i % 2;
    return `<i style="--origin:${side ? '96%' : '4%'};--travel:${(side ? -1 : 1) * (35 + (i * 17 % 65))}cqw;--rise:${-30 - (i * 13 % 50)}cqh;--spin:${(i % 2 ? -1 : 1) * (360 + i * 23)}deg;--delay:${i % 8 * 0.045}s;--color:${colors[i % colors.length]}"></i>`;
  }).join('')}</div>`;
}
function overlay(type: string) {
  const el = document.querySelector('#overlay')!;
  if (!game) return;
  let content = '';
  if (type === 'ready') content = `<span class="eyebrow">准备好找回清净了吗？</span><h2>${game.level.name}</h2><p>${game.level.intro}</p><p class="modal-note">${game.level.time && !practice ? `本关限时 ${game.level.time} 秒 · ` : ''}每关 3 格耐心 · 提示与暂停标记为辅助</p><button class="button dark" data-action="begin">开始这一关 →</button>`;
  if (type === 'paused') content = `<span class="eyebrow">喘口气，广告也暂停了。</span><h2>暂停中</h2><p>计时和游戏操作已冻结。成绩已标记为辅助。</p><button class="button dark" data-action="resume">继续挑战 →</button>`;
  if (type === 'lost') content = `<span class="eyebrow">耐心下线，快乐还在。</span><h2>又被广告留住了。</h2><p>${game.reason}</p><p class="modal-note">死亡 ${game.deaths} 次 · 本次 ${format(game.elapsed)}</p><button class="button dark" data-action="retry">马上重试 ↻</button><button class="button outline" data-action="hint">看看提示</button>`;
  if (type === 'won') content = `<span class="eyebrow">CLEAN INTERNET, FINALLY.</span><h2>${game.level.id === 20 ? '验收通过！' : game.level.id === 1 ? '胶片买到了！' : game.level.id === 10 ? '讲义下载完成！' : game.level.id === 4 ? 'Steam 安装成功！' : game.level.id === 30 ? '游戏准备就绪！' : game.levelIndex === levels.length - 1 ? '弹窗毕业生！' : '终于，清净了。'}</h2><p>${game.level.id === 20 ? (mission.achievement ? '恭喜获得称号：' + mission.achievement + '。全程未点击任何弹窗，官网验收成功！' : '域名和发布者都对了，验收通过！') : game.level.id === 4 ? '客户端安装完成，白神话悟空的第一步准备好了。' : game.level.id === 30 ? '绝地求死已入库，加速器已安装。可以约朋友开局了！' : game.level.id === 10 ? '正确的讲义已保存，晚上上课有着落了。' : chat.testedFake ? '假口令识破假收款页！已在阿光的店铺完成胶片订单。' : '加对群、找对人，胶片订单已完成。'}</p><div class="result-stats"><div><strong>${format(game.elapsed)}</strong><span>本关成功用时</span></div><div><strong>${game.mistakes}</strong><span>累计误点</span></div><div><strong>${format(game.total)}</strong><span>本轮总时间</span></div></div><p class="modal-note">${game.assisted ? '辅助通关 · 不计入无辅助最快纪录' : '无辅助通关 · 已更新本地个人纪录'}${storageWarning ? ' · 浏览器禁用了存储，本次纪录仅在内存中保留' : ''}</p><button class="button dark" data-action="next">${game.levelIndex === levels.length - 1 ? '回大厅，再玩一轮' : '下一关 →'}</button><button class="button outline" data-action="retry">再挑战一次</button>`;
  const result = type === 'won' || type === 'lost';
  el.innerHTML = content ? `<div class="veil ${result ? 'result-veil result-' + type : ''}">${type === 'won' ? confetti() : ''}<section class="modal" role="dialog" aria-modal="true" aria-label="${type === 'ready' ? '开始关卡' : type === 'paused' ? '暂停' : type === 'lost' ? '挑战失败' : '通关结算'}">${result ? resultEffect(type === 'won') : ''}${content}</section></div>` : '';
  document.querySelector<HTMLElement>('#windows')!.inert = !!content;
  document.querySelector<HTMLElement>('.website')!.inert = !!content;
  el.querySelector<HTMLButtonElement>('.button')?.focus();
}
function toast(message: string) {
  const el = document.querySelector('#toast')!;
  el.textContent = message; el.classList.add('visible');
  clearTimeout(toastTimer); toastTimer = setTimeout(() => el.classList.remove('visible'), 5000);
}
function updateHUD() {
  if (!game) return;
  document.querySelector('#stage')!.setAttribute('data-health', String(game.patience));
  document.querySelector('#patience')!.textContent = '♥ '.repeat(game.patience) + '♡ '.repeat(3 - game.patience);
  document.querySelector('#timer')!.textContent = format(game.level.time && !practice ? Math.max(0, game.level.time * 1000 - game.elapsed) : game.elapsed);
  document.querySelector('#remaining')!.textContent = String(game.level.id === 20 ? Number(!mission.complete) : game.remaining);
  document.querySelector('#stats')!.textContent = `误点 ${game.mistakes} · 死亡 ${game.deaths} · 重试 ${game.retries}`;
}
function feedback(message: string) { document.querySelector('#feedback')!.textContent = message; }
function fixWindow() {
  if (!game || game.status !== 'playing') return;
  game.fixed = true;
  const close = document.querySelector<HTMLElement>('.shy-window .close-button');
  if (close) { close.style.transform = ''; close.classList.add('fixed'); }
  const status = document.querySelector('#shy-status');
  if (status) status.textContent = '状态：已固定 / 现在可以安心点叉了';
  feedback('关闭键安心了。现在去关掉它吧！');
}
app.addEventListener('click', event => {
  const clicked = event.target as HTMLElement;
  if (game?.status === 'playing' && game.level.id === 20 && clicked.closest('.retro-popup')) mission.recordPopupClick();
  const target = clicked.closest<HTMLElement>('[data-action]');
  if (!target) return;
  const action = target.dataset.action;
  if (action === 'home') { home(); return; }
  if (action === 'start') { play(Number(target.dataset.index)); return; }
  if (!game) return;
  if (action === 'toggle-sound') {
    popupSound = !popupSound;
    target.setAttribute('aria-pressed', String(popupSound));
    target.textContent = popupSound ? '♪ 铃声开' : '♪ 铃声关';
    return;
  }
  if (action === 'retry') announcedAds.clear();
  if (action === 'toggle-hud') {
    hudCollapsed = !hudCollapsed;
    document.querySelector('.game-layout')!.classList.toggle('hud-collapsed', hudCollapsed);
    document.querySelector<HTMLElement>('#game-details')!.hidden = hudCollapsed;
    target.setAttribute('aria-expanded', String(!hudCollapsed));
    target.setAttribute('aria-label', hudCollapsed ? '展开关卡信息' : '收起关卡信息');
    target.querySelector('.hud-toggle-icon')!.textContent = hudCollapsed ? '›' : '‹';
    requestAnimationFrame(fitPopupWindows);
    return;
  }
  const mistakesBefore = game.mistakes;
  if (action === 'begin') { game.start(); lastTime = performance.now(); overlay(''); announceMissionAds(); }
  if (action === 'pause') { game.pause(); if (game.status === 'paused') overlay('paused'); }
  if (action === 'resume') { game.resume(); lastTime = performance.now(); overlay(''); }
  if (action === 'hint') { toast(game.hint()); }
  if (action === 'retry') { clearTimeout(toastTimer); document.querySelector('#toast')!.classList.remove('visible'); document.querySelector('#stage')!.classList.remove('damage-hit', 'mistake'); game.retry(game.status !== 'lost'); recorded = false; drag = null; mission.reset(); chat.reset(); drive.reset(); steam.reset(); gaming.reset(); if (game.level.id === 20) drawMissionPage(); drawWindows(); overlay(''); lastTime = performance.now(); feedback('再来一次，这次看准了。'); }
  if (action === 'next') {
    if (game.levelIndex === levels.length - 1) { home(); return; }
    const previous = game;
    play(previous.levelIndex + 1);
    game!.total = previous.total; game!.mistakes = previous.mistakes; game!.deaths = previous.deaths;
    game!.retries = previous.retries; game!.assisted = previous.assisted; updateHUD();
  }
  if (game?.status === 'playing') {
    if ([1, 4, 10, 30].includes(game.level.id) && (action?.startsWith('chat-') || action?.startsWith('drive-') || action?.startsWith('gaming-'))) handleScenarioAction(action!, target);
    if (game.level.id === 20 && ['open-browser', 'ad-close', 'installer-cancel', 'installer-background', 'setup-next', 'setup-back', 'cancel-keep', 'cancel-abandon', 'result', 'results-page', 'site-download', 'site-pay', 'browser-back', 'verify', 'ad-trap'].includes(action!)) {
      game.clicks++;
      if (action === 'open-browser') mission.open();
      if (action === 'ad-close') mission.close(target.dataset.id!);
      if (action === 'installer-cancel') {
        mission.cancelInstaller(); feedback('先读清楚：取消“取消安装”，究竟是安装还是退出？');
      }
      if (action === 'installer-background' || action === 'cancel-abandon') {
        const trapped = action === 'installer-background' ? (mission.ads.includes('setup') ? mission.finishSetup(true) : mission.installInBackground()) : mission.resolveCancel(false);
        if (trapped) { game.trap(action === 'installer-background' ? '点击了“后台安装”：后台流程启动了！耐心 −1。' : '你取消了“取消安装”，后台流程继续了！耐心 −1。'); feedback(game.reason); }
      }
      if (action === 'setup-next' && mission.finishSetup(true)) { game.trap('不选插件也不代表不安装软件：“下一步”安装了主程序！耐心 −1。'); feedback(game.reason); }
      if (action === 'cancel-keep') {
        if (mission.resolveCancel(true)) { game.trap('主程序取消了，但勾选的推荐插件仍被下载！耐心 −1。'); feedback(game.reason); }
        else feedback('已真正退出，没有下载插件，也没有安装软件。');
      }
      if (action === 'setup-back') mission.cancelPending = false;
      if (action === 'browser-back') mission.back();
      if (action === 'results-page') { mission.resultsPage = Number(target.dataset.page) === 2 ? 2 : 1; mission.page = 'results'; }
      if (action === 'site-download' || action === 'site-pay') { game.trap(action === 'site-pay' ? '付款服务已开通！耐心 −1。' : '软件下载已启动！耐心 −1。'); feedback(game.reason); if (action === 'site-download') { mission.ads = [...new Set([...mission.ads, 'toolbar'])]; mission.installInBackground(); } }
      if (action === 'verify') {
        if (mission.page === 'official') { mission.verified = true; feedback('发布者与官方域名一致，验收通过！'); }
        else { game.trap('这家站点的发布者是下载代理，并不是星河实验室。耐心 −1。'); feedback(game.reason); }
      }
      if (action === 'result') {
        if (mission.visitResult(target.dataset.site!)) {
          game.trap('恶意网页启动了自动安装！立即后退离开，耐心会持续流失。'); feedback(game.reason);
        } else feedback('先核对域名与发布者；不下载、不付款，可以直接返回。');
      }
      if (action === 'ad-trap') { game.trap('点了广告里的假按钮，又订阅了一份弹窗。耐心 −1。'); mission.addTrap(); feedback(game.reason); }
      drawMissionPage(); drawMissionAds(); checkMission();
    }
    if (action === 'fix') fixWindow();
    if (action === 'trap') {
      game.clicks++; game.trap('奖励到账：更多弹窗的诱惑。耐心 −1。');
      feedback(game.reason); toast(game.reason);
      document.querySelector('#stage')!.classList.remove('mistake');
      requestAnimationFrame(() => document.querySelector('#stage')?.classList.add('mistake'));
    }
    if (action === 'close') {
      game.clicks++; const oldMistakes = game.mistakes; game.close(target.dataset.id!); drawWindows();
      feedback(game.mistakes > oldMistakes ? game.reason : game.remaining ? '关掉一个。看看剩下的窗口说了什么。' : '页面恢复清净，正在确认没有遗留弹窗……');
    }
  }
  updateHUD();
  if (game && game.mistakes > mistakesBefore) damageFeedback();
  if (game?.status === 'lost') overlay('lost');
});
app.addEventListener('change', event => {
  const input = event.target as HTMLInputElement;
  if (input.dataset.plugin && game?.status === 'playing' && mission.ads.includes('setup')) {
    if (input.checked) mission.plugins.add(input.dataset.plugin); else mission.plugins.delete(input.dataset.plugin);
  }
  if (input.id === 'bundle-check' && game?.status === 'playing') mission.bundleChecked = input.checked;
  if (input.id === 'practice') practice = input.checked;
  if (input.id === 'motion') { save.reducedMotion = input.checked; applySettings(); persist(); }
});
app.addEventListener('pointerover', event => {
  if (!game || game.level.id !== 4 || game.fixed || game.status !== 'playing') return;
  const target = event.target as HTMLElement;
  if (target.matches('.shy-window .close-button') && event.pointerType === 'mouse') {
    escapeSide = !escapeSide;
    target.style.transform = escapeSide ? 'translateX(-180px)' : '';
    feedback('叉正在躲你：拖动标题栏，或点击“固定窗口”。');
  }
});
app.addEventListener('pointerdown', event => {
  if (!game || game.status !== 'playing' || event.button !== 0) return;
  const target = event.target as HTMLElement;
  if (target.closest('button')) return;
  const header = target.closest<HTMLElement>('[data-drag]');
  if (!header) return;
  const element = header.closest<HTMLElement>('.popup, .retro-popup')!;
  const layer = document.querySelector('#windows')!.getBoundingClientRect();
  const rect = element.getBoundingClientRect();
  const scale = parseFloat(element.style.zoom) || 1;
  drag = { element, x: event.clientX, y: event.clientY, left: (rect.left - layer.left) / scale, top: (rect.top - layer.top) / scale, scale };
  element.style.left = drag.left + 'px'; element.style.top = drag.top + 'px'; element.style.transform = 'none';
  header.setPointerCapture(event.pointerId);
});
app.addEventListener('pointermove', event => {
  if (!drag || !game || game.status !== 'playing') return;
  const bounds = document.querySelector('#windows')!.getBoundingClientRect();
  const dx = (event.clientX - drag.x) / drag.scale, dy = (event.clientY - drag.y) / drag.scale;
  if (Math.hypot(dx, dy) > 6 && game.level.id === 4) fixWindow();
  drag.element.style.left = Math.max(0, Math.min(bounds.width / drag.scale - drag.element.offsetWidth, drag.left + dx)) + 'px';
  drag.element.style.top = Math.max(0, Math.min(bounds.height / drag.scale - drag.element.offsetHeight, drag.top + dy)) + 'px';
});
app.addEventListener('pointerup', () => { drag = null; });
app.addEventListener('pointercancel', () => { drag = null; });
window.addEventListener('resize', () => {
  if (!game) return;
  drawWindows(); if (game.fixed) fixWindow(); drag = null;
});
document.addEventListener('visibilitychange', () => {
  if (document.hidden && game && ['playing', 'clearing'].includes(game.status)) { game.pause(); drag = null; overlay('paused'); }
  lastTime = performance.now();
});
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && game && ['playing', 'clearing'].includes(game.status)) { game.pause(); overlay('paused'); }
});
function loop(now: number) {
  const delta = now - lastTime; lastTime = now;
  if (game) {
    const before = game.status; game.tick(delta); updateHUD();
    if ([4, 30].includes(game.level.id) && game.status === 'playing') {
      const current = game.level.id === 4 ? steam : gaming;
      if (current.tick(delta)) { drawScenario(); finishScenario(); }
      const progress = document.querySelector<HTMLProgressElement>('#gaming-progress');
      if (progress) progress.value = current.progress;
      const label = document.querySelector('#gaming-progress-label');
      if (label && current.running) label.textContent = (current.running === 'download' ? '下载中 ' : '安装中 ') + Math.floor(current.progress / 15) + '%';
    }
    if (game.level.id === 20 && game.status === 'playing') {
      const hits = mission.tickDanger(delta);
      for (let i = 0; i < hits && game.status === 'playing'; i++) {
        game.trap('恶意组件持续安装，耐心 −1。立即后退离开此页！');
        feedback(game.reason); damageFeedback();
      }
      if (game.patience === 0) overlay('lost');
      if (mission.tickDownload(delta)) { drawMissionAds(); feedback('下载完成，安装程序已弹出。注意默认勾选的推荐组件。'); }
      const progress = document.querySelector<HTMLProgressElement>('#installer-download');
      if (progress) progress.value = mission.downloadElapsed;
      const percent = document.querySelector('#download-percent');
      if (percent) percent.textContent = Math.floor(mission.downloadElapsed / 2400 * 100) + '%';
    }
    if (game.status === 'lost' && before !== 'lost') overlay('lost');
    if (game.status === 'won' && !recorded) {
      recorded = true;
      if (!save.completed.includes(game.level.id)) save.completed.push(game.level.id);
      if (!game.assisted && (!save.best[game.level.id] || game.elapsed < save.best[game.level.id])) save.best[game.level.id] = game.elapsed;
      persist(); overlay('won');
    }
  }
  requestAnimationFrame(loop);
}
home(); requestAnimationFrame(loop);

function checkMission() {
  if (game?.status === 'playing' && mission.complete) { game.close('main'); feedback('官网验收成功，任务完成！'); }
}
function drawMissionPage() {
  const stage = document.querySelector('#stage')!;
  stage.classList.add('retro-stage');
  const website = document.querySelector<HTMLElement>('.website')!;
  const address = document.querySelector('.address')!;
  const locations = { desktop: '我的电脑', search: 'http://www.xdu.example/', results: 'http://www.xdu.example/s?wd=${encodeURIComponent(mission.query)}', fake: 'http://xinghe-download.example/', official: 'http://xinghe.example/' };
  address.textContent = mission.page === 'fake' && mission.selectedSite ? 'http://' + mission.selectedSite.domain + '/' : locations[mission.page] + (mission.page === 'results' ? '&page=' + mission.resultsPage : '');
  let body = '';
  if (mission.page === 'desktop') body = `<div class="old-desktop"><button class="desktop-icon" data-action="open-browser"><span>🌐</span>冲浪浏览器</button><div class="desktop-note"><b>小纸条 / 今天的任务</b><p>帮我找一下「星河浏览器」的官方网站。<br>别去那些乱七八糟的下载站！</p><p>官方域名：<strong>xinghe.example</strong><br>发布者：星河实验室</p><small>双击太麻烦，点一下图标就能打开。</small></div><div class="taskbar">▦ 开始 <span>冲浪导航　｜　拨号连接已就绪</span><span>2006 / 10 / 11</span></div></div>`;
  else if (mission.page === 'search' || mission.page === 'results') body = `<div class="old-browser-tools"><button data-action="browser-back">◀ 后退</button><span>文件(F)　编辑(E)　查看(V)　收藏(A)　工具(T)　帮助(H)</span></div><div class="search-page ${mission.page === 'results' ? 'has-results' : ''}"><div class="search-logo"><span>X</span><b>度</b><small>有事没事，X 度一下</small></div><div class="search-tabs">网页　图片　贴吧　知道　MP3　更多 »</div><form id="search-form"><input id="search-query" aria-label="X度搜索关键词" autocomplete="off" placeholder="请输入搜索关键词"><button type="submit">X 度一下</button></form>${mission.page === 'results' ? `<div class="result-count">X 度为您找到相关结果约 9,999,999 个　用时 0.001 秒</div>${renderSearchResults()}` : `<p class="search-slogan">全球中文搜索体验 · 让知识触手可及</p><div class="old-links">设为首页　｜　加入收藏　｜　关于 X 度</div>`}</div>`;
  else if (mission.page === 'fake') body = renderVisitedSite();
  else body = `<div class="old-browser-tools"><button data-action="browser-back">◀ 返回搜索结果</button><span>文件(F)　编辑(E)　查看(V)　收藏(A)</span></div><div class="official-site"><header>✧ 星河实验室 <span>首页　产品　开发日志　关于我们</span></header><div class="official-hero"><small>XINGHE BROWSER / VERSION 1.0</small><h2>让上网，回归浏览。</h2><p>星河浏览器 · 一个清净的开始。</p><div class="official-seal">官方网站 <b>xinghe.example</b><span>软件发布者：星河实验室</span></div><button data-action="verify" class="button dark">${mission.verified ? '✓ 已核对发布者' : '验收：确认官网与发布者'}</button></div><div class="official-footer">© 2006 星河实验室</div></div>`;
  website.innerHTML = `<div class="mission-strip"><b>任务：找到「星河浏览器」官网</b><span>${mission.opened ? '✓' : '○'} 打开浏览器 → ${mission.searched ? '✓' : '○'} 搜索 → ${mission.verified ? '✓' : '○'} 核对官网</span></div>${body}`;
  const input = document.querySelector<HTMLInputElement>('#search-query');
  if (input) input.value = mission.query;
}
function escapeHTML(value: string) {
  return value.replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]!));
}
function renderSearchResults() {
  return `<div class="search-results">${mission.searchResults.filter(site => site.page === mission.resultsPage).map(site => `<div class="search-result ${site.kind === 'promotion' ? 'promoted' : ''}"><button data-action="result" data-site="${site.id}">${escapeHTML(site.title)}</button><p>${escapeHTML(site.description)}</p><span class="result-domain">${escapeHTML(site.domain)}</span> <small>${site.kind === 'promotion' ? '推广' : '网页快照'}</small></div>`).join('')}<nav class="search-pagination" aria-label="搜索结果分页"><button data-action="results-page" data-page="1" ${mission.resultsPage === 1 ? 'disabled aria-current="page"' : ''}>1</button><button data-action="results-page" data-page="2" ${mission.resultsPage === 2 ? 'disabled aria-current="page"' : ''}>2</button><button data-action="results-page" data-page="${mission.resultsPage === 1 ? 2 : 1}">${mission.resultsPage === 1 ? '下一页 ›' : '‹ 上一页'}</button></nav></div>`;
}
function renderVisitedSite() {
  const site = mission.selectedSite;
  if (!site) return '<button data-action="browser-back">返回搜索</button>';
  const dangerous = site.kind === 'phishing' || site.kind === 'malware';
  return `<div class="old-browser-tools"><button data-action="browser-back">◀ 返回搜索结果</button><span>文件(F)　编辑(E)　查看(V)　收藏(A)</span></div><div class="fake-site"><div class="fake-site-head">${escapeHTML(site.title)}<small>${escapeHTML(site.publisher)}</small></div><h2>${site.kind === 'game' ? '全新一区 · 今晚开服' : site.kind === 'article' ? '软件使用记录' : '欢迎访问'}</h2><p>${escapeHTML(site.description)}</p><p>发布者：${escapeHTML(site.publisher)} · 域名：${escapeHTML(site.domain)}</p>${dangerous ? '<p class="danger-status">正在安装网页组件……</p><button data-action="browser-back">立即离开此页</button>' : site.kind === 'article' ? '' : '<button data-action="site-download" class="old-download">'+(site.kind === 'game' ? '下载游戏客户端' : '立即高速下载（推荐）')+'</button><button data-action="site-pay">开通付费服务</button>'}<button data-action="verify">核对发布者，提交任务</button><button data-action="browser-back">返回搜索结果</button></div>`;
}
function drawMissionAds() {
  const layer = document.querySelector('#windows')!;
  const contents: Record<string, [string, string, string]> = {
    'attack-install': ['组件安装程序', '<div class="retro-installer"><b>正在安装网页组件……</b><div class="install-progress"><i></i></div><button data-action="browser-back">中止并离开网页</button></div>', 'attack-ad attack-1'],
    'attack-account': ['账户验证提醒', '<div class="retro-security"><strong>账户需要立即验证！</strong><p>认证组件已启动。</p><button data-action="browser-back">离开网页</button></div>', 'attack-ad attack-2'],
    'attack-warning': ['系统组件警告', '<div class="retro-security"><strong>发现异常，正在加载修复程序！</strong><button data-action="browser-back">停止加载并返回</button></div>', 'attack-ad attack-3'],
    'attack-download': ['高速组件下载', '<div class="retro-installer"><b>下载完成，安装中……</b><p>桌面助手　导航栏　账户助手</p><button data-action="browser-back">终止并返回</button></div>', 'attack-ad attack-4'],
    download: ['文件下载 - 冲浪助手', `<div class="retro-installer"><span>▣</span><b>正在下载安装程序……</b><p>冲浪助手_setup.exe</p><progress id="installer-download" max="2400" value="${mission.downloadElapsed}" style="width:100%"></progress><p id="download-percent">${Math.floor(mission.downloadElapsed / 24)}%</p><small>下载完成后自动打开安装程序。</small></div>`, 'toolbar-ad installer-stack'],
    setup: ['冲浪助手安装程序 - 组件选择', `<div class="retro-installer"><span>▣</span><b>选择推荐组件</b><p>默认一起下载以下组件。<br>取消主程序安装时，已选组件仍将下载。</p>${[['navigation','网址导航插件'],['toolbar','浏览器工具栏'],['assistant','开机推荐助手']].map(([id,name]) => `<label><input type="checkbox" data-plugin="${id}" ${mission.plugins.has(id) ? 'checked' : ''}> ${name}（推荐）</label>`).join('')}<small>下一步：安装主程序并下载已选组件。<br>取消：确认退出，保留已选组件的下载。</small><div><button data-action="setup-next">下一步(N) &gt;</button><button data-action="installer-cancel">取消</button></div></div>`, 'toolbar-ad installer-stack'],
    'setup-confirm': ['确认退出安装程序', `<div class="retro-cancel-confirm"><span class="cancel-question">?</span><b>是否取消“取消安装”？</b><p>“是”：撤销取消，安装主程序。<br>“否”：退出主程序安装，但仍下载已选插件。</p><p class="cancel-explanation">已选插件：${mission.plugins.size} 项。${mission.plugins.size ? '若不想下载插件，请返回取消勾选。' : '没有选中插件，确认退出后不会安装任何内容。'}</p><div><button data-action="cancel-abandon">是，取消“取消”</button><button data-action="cancel-keep">否，保留取消</button><button data-action="setup-back">返回组件选择</button></div></div>`, 'toolbar-ad installer-stack'],
    'cancel-confirm': ['确认取消 - 冲浪助手', `<div class="retro-cancel-confirm"><span class="cancel-question">?</span><b>是否取消“取消安装”？</b><p>您刚刚选择了取消安装。<br>现在要撤销这个决定吗？</p><p class="cancel-explanation">“是”会取消刚才的取消，继续安装。<br>“否”会保留取消，退出安装向导。</p><div><button data-action="cancel-abandon">是，取消“取消”</button><button data-action="cancel-keep">否，保留取消</button></div></div>`, 'toolbar-ad installer-stack'],
    prize: ['幸运用户提示', `<div class="retro-prize"><div class="blink">恭喜您！您是第 999999 位访客</div><strong>一等奖<br><em>数码手机一部</em></strong><div class="pixel-phone">▥<br>▦</div><button data-action="ad-trap">立即领取大奖</button><small>领奖只差最后一步！</small></div>`, 'prize-ad installer-stack'],
    toolbar: ['冲浪助手安装向导', `<div class="retro-installer"><span>▣</span><b>让您的上网速度提高 200%！</b><p>免费赠送网址导航、桌面工具栏、贴心搜索助手。</p><label><input id="bundle-check" type="checkbox" ${mission.bundleChecked ? 'checked' : ''}> 同时安装精选全家桶</label><div><button data-action="installer-background">下一步(N) &gt;</button><button data-action="installer-cancel">取消</button></div></div>`, 'toolbar-ad installer-stack'],
    installed: ['冲浪助手 - 正在安装', `<div class="retro-installer installed-bundle"><span>▣</span><b>安装流程结果</b><p>主程序：${mission.installed ? '已安装' : '未安装'}<br>推荐插件：${mission.pluginsDownloaded ? '已下载' : '未下载'}</p><div class="install-progress"><i></i></div><button data-action="ad-close" data-id="installed">清理已安装内容，关闭窗口</button></div>`, 'toolbar-ad'],
    rpg: ['屠龙霸业 - 兄弟等你上线', `<div class="retro-rpg"><span>全新一区 · 今晚开服</span><div class="rpg-sword">⚔</div><strong>一刀 999<br><em>装备全靠关</em></strong><button data-action="ad-trap">进入游戏</button><button class="fake-cross" data-action="ad-trap" aria-label="关闭宣传图（推广）">× <small>推广</small></button></div>`, 'rpg-ad'],
    chat: ['来自附近的陌生消息', `<div class="retro-chat"><div class="chat-avatar">☺</div><b>小窗助手：在吗？</b><p>你找的官网我知道！<br>先帮我点一下这个链接吧～</p><button data-action="ad-trap">查看消息</button></div>`, 'chat-ad'],
    security: ['网页安全提醒 - 广告', `<div class="retro-security"><strong>⚠ 检测到 999 个问题！</strong><p>您的电脑可能已经落后于时代！<br>建议立即购买全能安全服务。</p><button data-action="ad-trap">立即修复</button><button data-action="ad-close" data-id="security">忽略本次广告</button></div>`, 'security-ad'],
    exit: ['最后一次挽留', `<div class="retro-exit"><b>真的要结束上网吗？</b><p>再看一个广告，才能体现对互联网的热爱。</p><button data-action="ad-trap">我热爱互联网</button><button data-action="ad-close" data-id="exit">不了，我只是来找官网</button></div>`, 'exit-ad'],
  };
  layer.innerHTML = mission.visibleAds.map(id => {
    const [title, content, skin] = contents[id] || ['更多精彩推荐', `<div class="retro-security"><b>你对这个广告感兴趣！</b><p>特别赠送：又一个广告。</p><button data-action="ad-close" data-id="${id}">不感兴趣，关闭</button></div>`, 'security-ad'];
    const installer = ['toolbar', 'cancel-confirm', 'setup', 'setup-confirm'].includes(id);
    return `<section class="retro-popup ${skin}" data-popup="${id}"><div class="retro-title" data-drag><span>▣ ${title}</span><button data-action="${installer ? 'installer-background' : 'ad-close'}" data-id="${id}" aria-label="${installer ? '后台安装' : '关闭' + title}">×${installer ? '<small>后台安装</small>' : ''}</button></div>${content}</section>`;
  }).join('');
  fitPopupWindows();
  announceMissionAds();
}
function announceMissionAds() {
  if (game?.level.id !== 20 || game.status !== 'playing') return;
  let appeared = false;
  for (const popup of document.querySelectorAll<HTMLElement>('.retro-popup')) {
    const id = popup.dataset.popup!;
    if (announcedAds.has(id)) continue;
    announcedAds.add(id);
    popup.classList.add('retro-arrival');
    popup.addEventListener('animationend', () => popup.classList.remove('retro-arrival'), { once: true });
    appeared = true;
  }
  if (appeared && popupSound) ringPopupBell();
}
app.addEventListener('submit', event => {
  if (!(event.target instanceof HTMLFormElement) || event.target.id !== 'search-form') return;
  event.preventDefault();
  if (game?.status !== 'playing') return;
  if (!mission.search(document.querySelector<HTMLInputElement>('#search-query')!.value)) { feedback('先输入一个关键词，再点搜索。'); return; }
  game.clicks++; drawMissionPage(); drawMissionAds(); updateHUD(); feedback('结果出来了。先看看标题、推广标记和实际域名。');
});

function damageFeedback() {
  const stage = document.querySelector<HTMLElement>('#stage');
  if (!stage) return;
  stage.classList.remove('damage-hit');
  void stage.offsetWidth;
  stage.classList.add('damage-hit');
  toast(game!.reason);
}

function fitPopupWindows() {
  const layer = document.querySelector<HTMLElement>('#windows');
  if (!layer) return;
  for (const popup of layer.querySelectorAll<HTMLElement>('.retro-popup, .popup:not(.domino-window)')) {
    popup.style.zoom = '';
    const scale = Math.min(1, (layer.clientHeight - 18) / popup.offsetHeight, (layer.clientWidth - 18) / popup.offsetWidth);
    popup.style.zoom = String(Math.max(.1, scale));
  }
}
const stageObserver = new ResizeObserver(() => fitPopupWindows());
new MutationObserver(() => {
  const stage = document.querySelector('#stage');
  stageObserver.disconnect();
  if (stage) stageObserver.observe(stage);
}).observe(app, { childList: true });



function drawScenario() {
  if (!game) return;
  document.querySelector('#stage')!.classList.add('scenario-stage');
  document.querySelector('.address')!.textContent = game.level.id === 1 ? '某熊 / 兴趣群与聊天' : game.level.id === 10 ? '云朵网盘 / 分享资料' : '浏览器 / 游戏准备';
  document.querySelector('.website')!.innerHTML = game.level.id === 1 ? renderChat(chat) : game.level.id === 10 ? renderDrive(drive) : renderGaming(game.level.id === 4 ? steam : gaming);
}
function finishScenario() {
  if (game?.status === 'playing' && (game.level.id === 1 ? chat.complete : game.level.id === 10 ? drive.complete : game.level.id === 4 ? steam.complete : gaming.complete)) {
    game.close('main'); feedback(game.level.id === 1 ? '胶片订单完成！' : game.level.id === 10 ? '资料下载完成！' : game.level.id === 4 ? 'Steam 安装成功！' : '游戏购买与加速器安装完成！');
  }
}
function scenarioTrap(message: string) { game!.trap(message); feedback(message); damageFeedback(); }
function handleScenarioAction(action: string, target: HTMLElement) {
  if (action.startsWith('gaming-')) handleGamingAction(action, target);
  game!.clicks++;
  if (action === 'chat-home') { chat.page = 'groups'; chat.message = ''; }
  if (action === 'chat-join') chat.join(target.dataset.id!);
  if (action === 'chat-talk') chat.talk();
  if (action === 'chat-shop') chat.openShop();
  if (action === 'chat-back') { chat.page = 'chat'; chat.message = ''; }
  if (action === 'chat-checkout') chat.checkout = true;
  if (action === 'chat-secret') { chat.message = '对方索要银行卡和密码，交易已中止。可返回查找正确的群。'; scenarioTrap('把银行卡和密码交给陌生人，耐心 −1。'); }
  if (action === 'chat-report') { chat.page = 'groups'; chat.message = '已举报：错误口令也显示成功，收款页面不可信。'; }
  if (action === 'drive-home') { drive.page = 'search'; drive.message = ''; }
  if (action === 'drive-open') drive.open(target.dataset.id!);
  if (action === 'drive-file') drive.choose(target.dataset.id!);
  if (action === 'drive-files') { drive.page = 'files'; drive.message = ''; }
  if (action === 'drive-fast') { drive.message = '下载了加速器安装包，讲义还没有保存。可改用普通下载。'; scenarioTrap('高速按钮下载的是客户端，还附带桌面导航。耐心 −1。'); }
  if (action === 'drive-save' && drive.download()) scenarioTrap('下载的是安装程序，核对分享来源和完整文件类型。耐心 −1。');
  drawScenario(); finishScenario();
}
app.addEventListener('submit', event => {
  const form = event.target;
  if (!(form instanceof HTMLFormElement) || !form.dataset.task) return;
  event.preventDefault();
  if (game?.status !== 'playing' || ![1, 4, 10, 30].includes(game.level.id)) return;
  const data = new FormData(form);
  const value = (name: string) => String(data.get(name) || '').trim();
  game.clicks++;
  if (form.dataset.task === 'gaming-search') (game.level.id === 4 ? steam : gaming).search(value('query'));
  if (form.dataset.task === 'gaming-pay' && gaming.pay(value('password'), value('code'))) scenarioTrap('向假商店交出了支付口令。核对收款方和网址，耐心 −1。');
  if (form.dataset.task === 'chat-search') { chat.query = value('query'); chat.message = chat.results.length ? '' : '没有找到匹配的群，换个关键词试试。'; }
  if (form.dataset.task === 'chat-answer') chat.answer(value('answer'));
  if (form.dataset.task === 'chat-pay') {
    const password = value('password');
    if (chat.pay(password, value('code')) && password === 'film2006') scenarioTrap('向假收款页提交了支付口令。它连错误口令也会提示成功，耐心 −1。');
  }
  if (form.dataset.task === 'drive-search') drive.query = value('query');
  if (form.dataset.task === 'drive-code') drive.unlock(value('code'));
  drawScenario(); finishScenario(); updateHUD();
  if (game.patience === 0) overlay('lost');
});
function handleGamingAction(action: string, target: HTMLElement) {
  if (!game || ![4, 30].includes(game.level.id)) return;
  const m = game.level.id === 4 ? steam : gaming;
  if (action === 'gaming-back') m.back();
  if (action === 'gaming-visit') m.visit(target.dataset.id!);
  if (action === 'gaming-download' || action === 'gaming-fast') {
    if (m.download(action === 'gaming-fast')) scenarioTrap('下载来源不正确，得到的是下载助手或不明程序。耐心 −1。');
  }
  if (action === 'gaming-open-installer') m.openInstaller();
  if (action === 'gaming-install' && m.install()) scenarioTrap('推荐组件会安装工具栏并修改主页。耐心 −1，取消勾选后可重试。');
  if (action === 'gaming-checkout') m.checkout();
  if (action === 'gaming-accelerator') m.findAccelerator();
}
app.addEventListener('change', event => {
  const input = event.target as HTMLInputElement;
  if (input.id !== 'gaming-bundle' || game?.status !== 'playing' || ![4,30].includes(game.level.id)) return;
  const m = game.level.id === 4 ? steam : gaming;
  if (m.page === 'installer' && !m.running) m.bundled = input.checked;
});
