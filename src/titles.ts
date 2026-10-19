import type { GameSession } from './game.ts';
import type { BrowserMission } from './mission.ts';
import type { ChatMission, DriveMission } from './scenarios.ts';
import type { GamingMission } from './gaming.ts';
import type { UninstallMission } from './uninstall.ts';

export interface TitleStep { id: string; title: string; story: string; evidence: string; }
type Persona = readonly [title: string, story: string];
interface TitleDesign { start: Persona; stages: readonly TitleStep[]; clean: Persona; recovered: Persona; special?: { step: string; persona: Persona }; }
const step = (id: string, title: string, story: string, evidence: string): TitleStep => ({ id, title, story: `你是一个${story}的人。`, evidence });

/** Titles describe observed business states; they never unlock mission completion. */
export const titleDesigns: Record<number, TitleDesign> = {
  20: {
    start: ['桌面观望派', '你是一个准备上网办事，先看看局面的人。'],
    stages: [
      step('browser', '弹窗初见杀体验员', '刚打开浏览器，就被互联网夹道欢迎', '已打开浏览器'),
      step('search', '搜索区淘金客', '在一屏热闹里，还记得自己来找什么', '已提交搜索'),
      step('page2', '第二页原住民', '愿意再翻一页，不把第一名当标准答案', '已浏览第二页结果'),
      step('official', '域名认亲专家', '终于在一堆长得像的页面里，找到正主', '已打开真实官网'),
      step('verified', '发布者验明官', '让域名和发布者一起对上号才交差', '已通过官网验收'),
    ],
    clean: ['弹窗绝缘体', '你是一个办成了事，还让套路扑了空的人。'],
    recovered: ['弹窗围城突围者', '你是一个被弹窗围过，还能找到官网出口的人。'],
  },
  1: {
    start: ['胶片寻人启事', '你是一个想买卷胶片，先得找到阿光的人。'],
    stages: [
      step('search', '同名群海选官', '买胶片之前，先给一堆同名群做海选', '已搜索兴趣群'),
      step('group', '群号防伪水印', '不靠群名眼熟，靠真群号找到组织', '已加入正确摄影群'),
      step('private', '阿光本光鉴定师', '进了群还不算，得找到真正群主', '已与正确群主私聊'),
      step('shop', '胶片小店验址员', '聊得再熟，也要到对的店里下单', '已打开真实胶片店'),
      step('paid', '一卷胶片保卫者', '把钱花在胶片上，把周末留给拍照', '已完成真实胶片订单'),
    ],
    clean: ['冒牌群照妖镜', '你是一个能从一群“阿光”里认出真人的人。'],
    recovered: ['假阿光退场导演', '你是一个认错过阿光，最后仍买到真胶片的人。'],
    special: { step: 'fake-test', persona: ['假付款页面测谎仪', '你是一个拿假口令试出假成功，还找到真店的人。'] },
  },
  4: {
    start: ['开玩前的装机人', '你是一个游戏还没开，先接到装机任务的人。'],
    stages: [
      step('browser', '空白页起跑员', '从空白页起步，也没忘记自己要去哪', '已从桌面打开浏览器'),
      step('search', '地址栏掌舵人', '先走进搜索站，再找游戏平台', '已进入 X 度搜索站'),
      step('official', '正版入口守门员', '在下载区花海里，认出了 Valve 的门牌', '已打开 Steam 真实官网'),
      step('package', '安装包验货员', '拿到正确安装包，才肯进入下一步', '正版 Steam 安装包已下载完成'),
      step('installer', '下一步冷静派', '下载完还记得亲手打开安装程序', '已打开正版 Steam 安装程序'),
      step('installed', '今晚开玩的前置任务王', '还没开游戏，就先通关了安装这一关', 'Steam 已安装完成'),
    ],
    clean: ['下载区清醒大脑', '你是一个装个 Steam，也能让下载套路白忙的人。'],
    recovered: ['下载助手甩锅侠', '你是一个拿错过下载助手，最后装对 Steam 的人。'],
  },
  10: {
    start: ['讲义寻宝预备役', '你是一个只想拿份讲义，准备穿过网盘迷宫的人。'],
    stages: [
      step('app', '网盘真身鉴定师', '曾在一桌子近亲里，找到过网盘本尊', '已打开真正的云朵网盘'),
      step('share', '分享号对暗号专家', '资源标题可以撞脸，分享来源得对得上', '已打开暗房小陈的正确分享'),
      step('unlock', '四位码开门人', '找到对的门，还拿对了钥匙', '正确分享已提取'),
      step('preview', '二十四页验货官', '讲义还没下载，就先翻过内容', '已预览真实 PDF 讲义'),
      step('file', '后缀查到最后一位', '选文件时，看到了文件名真正的结尾', '已选择正确分享中的 PDF 文档'),
      step('saved', '普通下载实干家', '不靠极速特权，也把真讲义带走', '正确 PDF 已普通下载保存'),
    ],
    clean: ['文件后缀显微镜', '你是一个连文件名最后三位都不放过的人。'],
    recovered: ['下载器迷宫逃生员', '你是一个绕过下载器弯路，终于把讲义带走的人。'],
    special: { step: 'preview', persona: ['先验货再收货大师', '你是一个先核验过真讲义，再放心保存的人。'] },
  },
  30: {
    start: ['语音房在等的那个人', '你是一个朋友已经就位，自己还在准备开黑的人。'],
    stages: [
      step('paid', '真入库付款人', '不信页面一句到账，先把游戏买进自己账号', '已在真实商店完成游戏购买'),
      step('library', '游戏库查账员', '付款以后，还会回自己的游戏库对账', '已打开游戏库确认入库'),
      step('accelerated', '默认勾选拆弹手', '安装加速器时，把附送的麻烦挡在门外', '已取消推荐组件并装好疾风'),
      step('route', '低延迟祛魅者', '找得到队友，比数字看着漂亮更重要', '东亚多人联机测试通过'),
      step('voice', '全队终于等到你', '带着自己的游戏和能用的连接，走进语音', '已加入语音并满足开黑条件'),
    ],
    clean: ['默认勾选终结者', '你是一个朋友等着开黑，还记得看勾选框的人。'],
    recovered: ['开黑前排雷队长', '你是一个准备时踩过雷，最后仍成功进队的人。'],
    special: { step: 'fake-test', persona: ['假到账拆台专家', '你是一个用假口令拆穿假到账，最后真进队的人。'] },
  },
  40: {
    start: ['家里电脑接盘侠', '你是一个只想打印准考证，却接手全家电脑的人。'],
    stages: [
      step('guard', '后台靠山拆除队', '让守护服务下班，开始拆掉弹窗的靠山', '守护服务已停止'),
      step('sources', '广告断粮办主任', '让消息服务也停下，不给弹窗续杯', '广告来源及恢复来源均已停止'),
      step('main', '挽留文案冷脸王', '面对软件反复挽留，还是办完了卸载', '2346 主程序已卸载且未保留残留'),
      step('clean', '桌面清场负责人', '把程序、进程、广告和待办清得明明白白', '电脑清理条件已全部满足'),
      step('print', '准考证救援成功', '电脑清净了，也没忘记最初要打印的东西', '清理后已打开打印预览'),
    ],
    clean: ['软件送终大师', '你是一个软件敢装进来，就能送它出去的人。'],
    recovered: ['全家桶反向配送员', '你是一个被软件绕过，还能把电脑清干净的人。'],
  },
};

export interface TitleMissions { browser: BrowserMission; chat: ChatMission; drive: DriveMission; steam: GamingMission; gaming: GamingMission; uninstall: UninstallMission; }
export interface TitleSnapshot { headline: string; story: string; progress: string; steps: readonly TitleStep[]; }

function evidence(level: number, m: TitleMissions): Record<string, boolean> {
  const { browser: b, chat: c, drive: d, steam: s, gaming: g, uninstall: u } = m;
  switch (level) {
    case 20: return { browser: b.opened, search: b.searched, page2: b.searched && b.resultsPage === 2, official: b.page === 'official', verified: b.complete };
    case 1: return { search: !!c.query.trim(), group: c.joined.has('real'), private: c.selected === 'real' && c.chatting, shop: c.selected === 'real' && c.page === 'shop', paid: c.complete, 'fake-test': c.testedFake };
    case 4: return { browser: s.page !== 'desktop', search: s.page === 'search', official: s.selected === 'real' && s.page === 'site', package: s.packageReady && s.packageTarget === 'steam', installer: s.page === 'installer' && s.packageReady && s.packageTarget === 'steam', installed: s.complete };
    case 10: return { app: d.activeApp === 'real', share: d.activeApp === 'real' && d.selected === 'real', unlock: d.selected === 'real' && d.unlocked, preview: d.selected === 'real' && d.unlocked && d.previewFile === 'pdf', file: d.selected === 'real' && d.unlocked && d.file === 'pdf', saved: d.complete };
    case 30: return { paid: g.purchased, library: g.purchased && g.libraryChecked, accelerated: g.accelerated, route: g.routeReady, voice: g.complete, 'fake-test': g.testedFake };
    case 40: return { guard: !u.guard, sources: u.sourcesStopped, main: !u.program('main')!.installed && !u.program('main')!.residual, clean: u.clean, print: u.complete };
    default: return {};
  }
}

/** Per-attempt observations survive Back/Close, but are cleared on retry. */
export class TitleTrail {
  private reached = new Set<string>();
  private levelMistakes = 0;
  private cached?: { key: string; value: TitleSnapshot };
  start(game: GameSession) { this.levelMistakes = game.mistakes; this.retry(); }
  retry() { this.reached.clear(); this.cached = undefined; }
  observe(game: GameSession, missions: TitleMissions) {
    if (!['playing', 'clearing', 'won', 'lost'].includes(game.status)) return;
    for (const [id, met] of Object.entries(evidence(game.level.id, missions))) if (met) this.reached.add(id);
  }
  snapshot(game: GameSession, won = game.status === 'won'): TitleSnapshot {
    const key = `${game.level.id}:${won}:${game.mistakes}:${this.reached.size}`;
    if (this.cached?.key === key) return this.cached.value;
    const design = titleDesigns[game.level.id];
    const steps = Object.freeze(design.stages.filter(s => this.reached.has(s.id)).map(s => Object.freeze({ ...s })));
    const latest = steps.at(-1);
    const recovered = game.mistakes > this.levelMistakes;
    const special = design.special && this.reached.has(design.special.step) ? design.special.persona : null;
    const persona: Persona = won ? recovered ? design.recovered : special ?? design.clean : latest ? [latest.title, latest.story] : design.start;
    const value = Object.freeze({ headline: persona[0], story: persona[1], steps,
      progress: won ? `任务完成 · ${recovered ? '踩坑后恢复' : '本关零误点'} · 已记录 ${steps.length} 个关键步骤` : `任务未完成 · ${latest ? `已到达：${latest.evidence}` : '尚未完成关键步骤'}`,
    });
    this.cached = { key, value }; return value;
  }
}
