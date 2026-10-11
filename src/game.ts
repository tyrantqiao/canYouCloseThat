export type Status = 'ready' | 'playing' | 'paused' | 'clearing' | 'won' | 'lost';
export const levels = [
  { id: 20, name: '帮我找到官网', label: '搜索 / 辨别 / 弹窗求生', tag: '2006 上网任务', time: 0,
    intro: '打开桌面浏览器，在 X 度搜索“星河浏览器”，找到真正的官方网站并核对发布者。官方域名是 xinghe.example，在官网点击验收即可完成任务，无需关闭所有弹窗。',
    hints: ['搜索结果最上面不一定是官网，看看推广标记和实际域名。', '输入“星河浏览器”，找到域名 xinghe.example 的结果，在官网核对发布者并点击验收，弹窗可以不处理。'] },
  { id: 1, name: '熊友，买卷胶片', label: '找群 / 聊天 / 安全购买', tag: '2006 / 某熊聊天', time: 0,
    intro: '在某熊搜索胶片摄影群，核对群号，回答入群问题，找阿光购买一卷胶片。',
    hints: ['群名相同也可能是假群，结合群号、入群问题和成员昵称判断。', '找群号 73021680，答案银盐。店铺域名 film-club.example；可以用假口令试探，真正付款用 film2006 和验证码 4826。'] },
  { id: 4, name: '先把 Steam 装好', label: '搜索 / 安装 / 来源核验', tag: '2024 / 宿舍装机', time: 0,
    intro: '想玩白神话悟空，先打开桌面浏览器，在地址栏输入 xdu.com 进入 X 度，再搜索 Steam，从正确来源下载安装客户端。',
    hints: ['核对网址与发布者，下载器不等于游戏平台。', '打开浏览器，输入 xdu.com 并回车进入 X 度，搜索 Steam，找 store.steampowered.com，普通下载 SteamSetup.exe，核对 Valve 后开始安装。'] },
  { id: 10, name: '讲义在哪个盘', label: '网盘 / 资料辨别 / 下载', tag: '2012 / 班级网盘', time: 0,
    intro: '先从桌面和任务栏辨认并打开真正的云朵网盘，再找到暗房小陈分享的周末摄影课，提取正确的 PDF 讲义并下载。',
    hints: ['先核对分享者和分享号，再查看完整文件名及文件类型。', '选暗房小陈 XC2006，提取码 xj06；选 PDF 文档，使用无需客户端的普通下载。'] },
  { id: 30, name: '买到游戏，再加速', label: '网页购买 / 加速器 / 防骗', tag: '2026 / 好友开黑', time: 0,
    intro: 'Steam 已装好。在浏览器找到 Steam 商店，购买绝地求死，再从官网安装疾风游戏加速器。',
    hints: ['商店与加速器都要核对域名；假网站可能对任何支付口令都显示成功。', 'Steam 域名 store.steampowered.com，支付口令 play2026、验证码 6392；疾风官网 jifeng.example，普通下载并取消勾选推荐工具栏。'] },
  { id: 40, name: '请它出去', label: '结束进程 / 卸载 / 文字判断', tag: '2016 / 家用电脑', time: 0,
    intro: '把家里电脑上的 2346 卸干净：关闭广告，停止后台来源，到控制面板卸载程序。误装的其他软件也要清掉，最后打开准考证打印预览。',
    hints: ['窗口、进程和程序列表，记的是三件不同的事。', '查看守护进程的描述，再检查卸载向导中保留和替代的选项。系统工具里可以打开任务管理器。'] },
] as const;

export class GameSession {
  levelIndex: number;
  status: Status = 'ready';
  patience = 3;
  mistakes = 0;
  deaths = 0;
  retries = 0;
  clicks = 0;
  elapsed = 0;
  total = 0;
  hintCount = 0;
  assisted = false;
  fixed = false;
  closed = new Set<string>();
  clearElapsed = 0;
  reason = '';
  practice: boolean;

  constructor(levelIndex = 0, practice = false) { this.levelIndex = levelIndex; this.practice = practice; this.assisted = practice; }
  get level() { return levels[this.levelIndex]; }
  get remaining() { return 1 - this.closed.size; }
  start() { if (this.status === 'ready') this.status = 'playing'; }
  tick(delta: number) {
    if (this.status !== 'playing' && this.status !== 'clearing') return;
    this.elapsed += delta;
    this.total += delta;
    if (this.level.time && !this.practice && this.elapsed >= this.level.time * 1000) {
      this.fail('倒计时结束了，广告联盟又多留了你一会儿。'); return;
    }
    if (this.status === 'clearing') {
      this.clearElapsed += delta;
      if (this.clearElapsed >= 800) this.status = 'won';
    }
  }
  trap(reason: string) {
    if (this.status !== 'playing') return;
    this.mistakes++; this.patience--; this.reason = reason;
    if (!this.patience) this.fail(reason);
  }
  close(id: string) {
    if (this.status !== 'playing' || this.closed.has(id)) return;
    this.closed.add(id);
    if (this.remaining === 0) { this.status = 'clearing'; this.clearElapsed = 0; }
  }
  fail(reason: string) { this.status = 'lost'; this.reason = reason; this.deaths++; }
  pause() { if (this.status === 'playing' || this.status === 'clearing') { this.resumeStatus = this.status; this.status = 'paused'; this.assisted = true; } }
  private resumeStatus: Status = 'playing';
  resume() { if (this.status === 'paused') this.status = this.resumeStatus; }
  hint() { this.hintCount = Math.min(2, this.hintCount + 1); this.assisted = true; return this.level.hints[this.hintCount - 1]; }
  retry(manual = true) {
    if (manual) this.retries++;
    this.status = 'playing'; this.patience = 3; this.closed.clear(); this.elapsed = 0;
    this.fixed = false; this.clearElapsed = 0; this.reason = ''; this.hintCount = 0;
  }
  next() {
    if (this.levelIndex >= levels.length - 1) return false;
    this.levelIndex++; this.status = 'ready'; this.elapsed = 0; this.patience = 3;
    this.closed.clear(); this.fixed = false; this.hintCount = 0; this.clearElapsed = 0; return true;
  }
}

export interface Save { version: 1; best: Record<string, number>; completed: number[]; reducedMotion: boolean; }
export function parseSave(raw: string | null): Save {
  const blank: Save = { version: 1, best: {}, completed: [], reducedMotion: false };
  try {
    const data = JSON.parse(raw || 'null');
    if (!data || data.version !== 1) return blank;
    for (const { id } of levels) {
      const value = data.best?.[id];
      if (typeof value === 'number' && Number.isFinite(value) && value > 0) blank.best[id] = value;
    }
    blank.completed = Array.isArray(data.completed) ? [...new Set<number>(data.completed.filter((id: unknown) => levels.some(level => level.id === id)))] : [];
    blank.reducedMotion = data.reducedMotion === true;
    return blank;
  } catch { return blank; }
}
