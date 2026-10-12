import type { GameSession } from './game';
import type { LevelRecord, RunSummary } from './run-record';

export const PLAY_URL = 'https://tyrantqiao.github.io/canYouCloseThat/';
const PLAY_ADDRESS = PLAY_URL.replace('https://', '');
export interface ResultCard {
  won: boolean; level: number; name: string; era: string; headline: string;
  story: string; elapsed: string; total: string; mistakes: number;
  deaths: number; retries: number; mode: string; achievement: string;
  entries?: readonly LevelRecord[];
}
export function createRunCard(run: RunSummary): ResultCard {
  return Object.freeze({
    won: true, level: 0, name: run.complete ? '连续六关通关' : '本轮分段挑战',
    era: `本轮完成 ${run.entries.length} / 6 关`,
    headline: run.complete ? '上网生存，毕业了。' : '这一轮，我闯过了。',
    story: run.complete ? '从找官网到卸载软件，六件小事都办成了。' : '记录这次连续挑战；未包含的关卡不计入总成绩。',
    elapsed: (run.time / 1000).toFixed(1) + 's', total: (run.time / 1000).toFixed(1) + 's',
    mistakes: run.mistakes, deaths: run.deaths, retries: run.retries,
    mode: run.assisted ? '使用辅助' : '未使用辅助', achievement: '', entries: run.entries,
  });
}
const stories: Record<number, string> = {
  20: '我只是想找个官网，差点收获一电脑弹窗。',
  1: '买一卷胶片之前，先在一堆同名群里找到真人。',
  4: '游戏还没开始，安装 Steam 已经是一场冒险。',
  10: '我只想下载一份 PDF，桌面却摆满了网盘。',
  30: '朋友还在等我开黑，我先和默认勾选打了一架。',
  40: '我只是想打印准考证，先打赢了卸载向导。',
};
export function createResultCard(game: GameSession, won: boolean, achievement = ''): ResultCard {
  return Object.freeze({
    won, level: game.levelIndex + 1, name: game.level.name, era: game.level.tag,
    headline: won ? game.mistakes === 0 ? '没给弹窗机会。' : '踩过坑，也过了关。' : '我的耐心先卸载了。',
    story: won ? stories[game.level.id] : '普通上网小事，怎么就把我难住了？你来试试。',
    elapsed: (game.elapsed / 1000).toFixed(1) + 's', total: (game.total / 1000).toFixed(1) + 's',
    mistakes: game.mistakes, deaths: game.deaths, retries: game.retries,
    mode: game.assisted ? '使用辅助' : '未使用辅助', achievement: won ? achievement : '',
  });
}
function escape(value: string) { return value.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!)); }
export function renderResultCard(card: ResultCard) {
  return `<article class="share-card ${card.won ? 'share-won' : 'share-lost'}" aria-label="可分享的战绩卡">
    <header><b>× 你能关掉吗？</b><span>${card.entries ? '本轮总战绩' : '上网生存战绩'}</span></header>
    <div class="share-card-body"><div class="share-card-badges"><span>${card.won ? '任务完成' : '本次挑战失败'}</span><span>${card.mode}</span></div>
    <h3>${escape(card.headline)}</h3><p class="share-story">${escape(card.story)}</p>
    <div class="share-level">${card.entries ? escape(card.name) : `第 ${String(card.level).padStart(2, '0')} 关 · ${escape(card.name)}`}<small>${escape(card.era)}</small></div>
    <div class="share-metrics"><div><strong>${card.elapsed}</strong><span>${card.entries ? '本轮总用时（含重试）' : card.won ? '本次通关用时' : '本次尝试用时'}</span></div><div><strong>${card.mistakes}</strong><span>本轮累计误点</span></div></div>
    <p class="share-history">本轮总用时 ${card.total} · 失败 ${card.deaths} 次 · 主动重试 ${card.retries} 次</p>
    ${card.achievement ? `<p class="share-achievement">获得称号 · ${escape(card.achievement)}</p>` : ''}
    ${card.entries ? `<div class="share-run-list" aria-label="本轮逐关成绩"><div><b>关卡</b><b>用时 / 误点</b></div>${card.entries.map(entry => `<div><span>${String(entry.level).padStart(2, '0')} ${escape(entry.name)}</span><span>${(entry.time / 1000).toFixed(1)}s / ${entry.mistakes} 次</span></div>`).join('')}<small>逐关用时包含该关失败与重试；辅助标记沿整轮继承。</small></div>` : ''}
    <div class="share-challenge">六件普通上网小事，三格耐心。<b>换你来，能少踩几个坑？</b></div></div>
    <footer><span>浏览器打开就能玩 · 无需安装</span><span>${PLAY_ADDRESS}</span></footer>
  </article>`;
}

/** Draw from a frozen result, independent of DOM size, animation or external assets. */
export function drawResultCard(canvas: HTMLCanvasElement, card: ResultCard) {
  const extra = card.entries ? 430 : 0;
  canvas.width = 1080; canvas.height = 1350 + extra;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('当前浏览器无法生成图片，请截图保存战绩。');
  const ink = '#20302b', accent = card.won ? '#286748' : '#a34436';
  const font = '"Microsoft YaHei", "PingFang SC", "Segoe UI", sans-serif';
  function text(value: string, x: number, y: number, size: number, color = ink, bold = false) {
    ctx!.fillStyle = color; ctx!.font = `${bold ? '700' : '400'} ${size}px ${font}`; ctx!.fillText(value, x, y);
  }
  function lines(value: string, x: number, y: number, width: number, size: number, color = ink, bold = false, gap = 1.5) {
    ctx!.font = `${bold ? '700' : '400'} ${size}px ${font}`;
    let line = '';
    for (const char of value) {
      if (ctx!.measureText(line + char).width > width && line) { text(line, x, y, size, color, bold); y += size * gap; line = ''; }
      line += char;
    }
    if (line) { text(line, x, y, size, color, bold); y += size * gap; }
    return y;
  }
  ctx.fillStyle = '#edf0e7'; ctx.fillRect(0, 0, 1080, canvas.height);
  ctx.fillStyle = '#fffdf5'; ctx.fillRect(42, 42, 996, 1266 + extra);
  ctx.strokeStyle = '#b6c2ae'; ctx.lineWidth = 2; ctx.strokeRect(42, 42, 996, 1266 + extra);
  ctx.fillStyle = ink; ctx.fillRect(42, 42, 996, 112);
  text('×  你能关掉吗？', 86, 114, 38, '#e1ef9b', true);
  text(card.entries ? '本轮总战绩' : '上网生存战绩', 748, 112, 25, '#e6eade');
  text(card.won ? '任务完成' : '本次挑战失败', 86, 230, 28, accent, true);
  text(card.mode, 775, 230, 25, '#667464');
  lines(card.headline, 86, 330, 908, 61, ink, true, 1.25);
  lines(card.story, 86, 417, 890, 30, '#62705c');
  ctx.fillStyle = '#f0f2e9'; ctx.fillRect(86, 523, 908, 120);
  text(card.entries ? card.name : `第 ${String(card.level).padStart(2, '0')} 关 · ${card.name}`, 112, 575, 32, ink, true);
  text(card.era, 112, 617, 24, '#667464');
  text(card.elapsed, 94, 762, 76, accent, true);
  text(String(card.mistakes), 620, 762, 76, accent, true);
  text(card.entries ? '本轮总用时（含重试）' : card.won ? '本次通关用时' : '本次尝试用时', 94, 815, 25, '#667464');
  text('本轮累计误点', 620, 815, 25, '#667464');
  text(`本轮总用时 ${card.total} · 失败 ${card.deaths} 次 · 主动重试 ${card.retries} 次`, 94, 880, 23, '#667464');
  if (card.achievement) lines(`获得称号 · ${card.achievement}`, 94, 939, 890, 27, accent, true);
  if (card.entries) {
    text('逐关成绩', 94, 950, 28, ink, true);
    card.entries.forEach((entry, i) => {
      const y = 1008 + i * 57;
      text(`${String(entry.level).padStart(2, '0')}  ${entry.name}`, 94, y, 27);
      text(`${(entry.time / 1000).toFixed(1)}s / ${entry.mistakes} 次误点`, 670, y, 25, accent);
    });
    text('逐关用时包含失败与重试；未完成关卡不计入。', 94, 1380, 23, '#667464');
  }
  ctx.save(); ctx.translate(0, extra);
  ctx.fillStyle = card.won ? '#dce9c2' : '#f5ddd2'; ctx.fillRect(86, 1006, 908, 134);
  text('六件普通上网小事，三格耐心。', 115, 1057, 27, ink);
  text('换你来，能少踩几个坑？', 115, 1106, 36, ink, true);
  text('浏览器打开就能玩 · 无需安装', 86, 1205, 25, '#667464');
  text(PLAY_ADDRESS, 86, 1258, 28, ink, true);
  ctx.restore();
}
export async function resultCardBlob(card: ResultCard): Promise<Blob> {
  const canvas = document.createElement('canvas');
  drawResultCard(canvas, card);
  return new Promise((resolve, reject) => canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('图片生成失败，请重试或截图保存。')), 'image/png'));
}
export function resultCardFilename(card: ResultCard) { return card.entries ? `你能关掉吗-${card.entries.length === 6 ? '连续六关' : '分段挑战'}总战绩.png` : `你能关掉吗-第${card.level}关-${card.won ? '通关' : '挑战失败'}战绩.png`; }
