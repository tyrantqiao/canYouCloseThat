export type GamingMode = 'install' | 'purchase';
type Page = 'search' | 'site' | 'download' | 'installer' | 'checkout';
export class GamingMission {
  mode: GamingMode;
  page: Page = 'search'; query = ''; selected = ''; target: 'steam' | 'accelerator' = 'steam';
  packageReady = false; installed = false; purchased = false; accelerated = false;
  bundled = true; progress = 0; running: 'download' | 'install' | null = null;
  message = ''; testedFake = false;
  constructor(mode: GamingMode) { this.mode = mode; this.reset(); }
  reset() { this.page = 'search'; this.query = ''; this.selected = ''; this.target = 'steam'; this.packageReady = false; this.installed = this.mode === 'purchase'; this.purchased = false; this.accelerated = false; this.bundled = true; this.progress = 0; this.running = null; this.message = ''; this.testedFake = false; }
  get complete() { return this.mode === 'install' ? this.installed : this.purchased && this.accelerated; }
  get results() {
    const q = this.query.toLowerCase().trim();
    if (!q || !(this.target === 'steam' ? /steam|白神话|悟空|绝地|求死|游戏平台/.test(q) : /加速|疾风/.test(q))) return [];
    return this.target === 'steam' ? [
      { id:'fast', title:'Steam 中文版 · 高速下载', domain:'steam-download.example', note:'推广 · 游戏下载助手，一键极速安装' },
      { id:'fake', title:'Steam 游戏平台 · 官方入口', domain:'store.steamp0wered.example', note:'极速登录，热门游戏特惠' },
      { id:'real', title:'Steam · 欢迎来到 Steam', domain:'store.steampowered.com', note:'Valve · 商店、社区与安装 Steam' },
      { id:'mirror', title:'Steam 安装包 · 中文软件下载站', domain:'soft-center.example/steam', note:'下载中心 · 推荐使用高速下载器' },
      { id:'gift', title:'白神话悟空 / 绝地求死 · 免费领', domain:'steam-gift.example', note:'分享账号，代购充值免验证' },
    ] : [
      { id:'fast', title:'疾风游戏加速器 · 高速下载', domain:'jifeng-download.example', note:'推广 · 下载助手，自动优化主页' },
      { id:'fake', title:'疾风加速器 · 官方下载', domain:'jlfeng.example', note:'全球线路，输入游戏账号即可开通' },
      { id:'real', title:'疾风加速器 · 下载客户端', domain:'jifeng.example', note:'疾风网络 · 普通安装包与线路服务' },
      { id:'mirror', title:'疾风加速器绿色版', domain:'soft-center.example/jifeng', note:'推荐高速安装，附赠游戏工具栏' },
    ];
  }
  get domain() { return this.results.find(r => r.id === this.selected)?.domain || (this.target === 'steam' ? 'store.steampowered.com' : 'jifeng.example'); }
  search(query: string) { if (this.running) return; this.query = query.slice(0,80); this.page = 'search'; this.message = ''; }
  visit(id: string) { if (this.running || !this.results.some(r => r.id === id)) return; this.selected = id; this.page = 'site'; this.message = ''; }
  back() { this.running = null; this.progress = 0; this.packageReady = false; this.page = 'search'; this.message = ''; }
  findAccelerator() { if (!this.purchased) return; this.back(); this.target = 'accelerator'; this.query = ''; this.selected = ''; }
  download(fast: boolean) {
    if (this.page !== 'site' || this.running) return false;
    if (fast || this.selected !== 'real') { this.message = '下载到的是高速下载助手或来源不明的安装包，请返回搜索核对来源。'; return true; }
    this.page = 'download'; this.progress = 0; this.packageReady = false; this.running = 'download'; this.message = ''; return false;
  }
  openInstaller() { if (this.page !== 'download' || !this.packageReady || this.running) return; this.page = 'installer'; this.bundled = this.target === 'accelerator'; this.message = ''; }
  install() {
    if (this.page !== 'installer' || this.selected !== 'real' || !this.packageReady || this.running) return false;
    if (this.target === 'accelerator' && this.bundled) { this.message = '推荐工具栏与主页修改仍被勾选。已停止安装，可取消推荐组件后重试。'; return true; }
    this.running = 'install'; this.progress = 0; this.message = ''; return false;
  }
  tick(delta: number) {
    if (!this.running) return false;
    this.progress = Math.min(1500, this.progress + Math.max(0,delta));
    if (this.progress < 1500) return false;
    if (this.running === 'download') { this.packageReady = true; this.message = '下载完成，请检查文件名与发布者，再打开安装程序。'; }
    else { if (this.target === 'steam') this.installed = true; else this.accelerated = true; this.message = this.target === 'steam' ? 'Steam 安装成功！可以准备你的游戏库了。' : '疾风加速器安装成功，绝地求死线路已就绪。'; }
    this.running = null; return true;
  }
  checkout() { if (this.mode !== 'purchase' || this.target !== 'steam' || this.page !== 'site') return; this.page = 'checkout'; this.message = ''; }
  pay(password: string, code: string) {
    if (this.page !== 'checkout' || this.mode !== 'purchase' || !password) return false;
    if (this.selected !== 'real') { this.testedFake ||= password !== 'play2026'; this.message = '付款成功！游戏已经到账。'; return password === 'play2026'; }
    if (code !== '6392') { this.message = '验证码错误，订单未提交。'; return false; }
    if (password !== 'play2026') { this.message = '支付口令错误，订单未付款。'; return false; }
    this.purchased = true; this.message = '订单支付成功，绝地求死已加入游戏库。下一步准备游戏加速器。'; return false;
  }
}
export function renderGaming(m: GamingMission) {
  const note = `<aside class="task-note"><b>${m.mode === 'install' ? '今晚想玩白神话悟空' : '朋友约你玩绝地求死'}</b><p>${m.mode === 'install' ? '先在浏览器检索 Steam，下载并安装客户端。安装完成就可以交差，不需要下载游戏。' : 'Steam 已安装。用浏览器找到 Steam 商店，购买「绝地求死」，再安装疾风游戏加速器。'}</p><p>Steam 域名：<b>store.steampowered.com</b><br>发布者：<b>Valve</b></p>${m.mode === 'purchase' ? '<p>疾风官网：<b>jifeng.example</b><br>发布者：疾风网络<br>关卡钱包 ¥200；游戏售价 ¥98。支付口令：<b>play2026</b></p><p>目标进度：'+(m.purchased ? '✓' : '○')+' 游戏入库 / '+(m.accelerated ? '✓' : '○')+' 加速器安装</p>' : ''}</aside>`;
  let body = '<button data-action="gaming-back">← 返回搜索</button>';
  if (m.page === 'search') body = `<h2>浏览器 · ${m.target === 'steam' ? '寻找 Steam' : '寻找游戏加速器'}</h2><form data-task="gaming-search"><label>搜索关键词<input name="query" value="${escapeText(m.query)}" placeholder="${m.target === 'steam' ? 'Steam' : '疾风加速器'}" required maxlength="80"></label><button>搜索网页</button></form><div class="task-results">${m.results.map(r => `<article><h3>${r.title}</h3><p>${r.note}</p><div class="shop-address">${r.domain}</div><button data-action="gaming-visit" data-id="${r.id}">打开网页</button></article>`).join('') || '<p>输入关键词查找相关网页。</p>'}</div>`;
  if (m.page === 'site') body += `<div class="shop-address">https://${m.domain}/${m.target === 'steam' ? 'about' : 'download'}</div><div class="product-card"><h2>${m.target === 'steam' ? 'STEAM · 游戏与好友的世界' : '疾风游戏加速器'}</h2><p>${m.target === 'steam' ? '发现游戏，管理游戏库，与好友一起玩。' : '为绝地求死提供游戏线路，客户端下载后可选择服务器。'}</p></div>${m.mode === 'purchase' && m.target === 'steam' ? `<h3>绝地求死 · 标准版</h3><p>多人战术生存 · ¥98 · 加入自己的游戏库</p><button data-action="gaming-checkout">购买游戏</button>` : `<p>Windows 安装包 · 发布者：${m.selected === 'real' ? m.target === 'steam' ? 'Valve' : '疾风网络' : '极速软件服务'}</p><div class="download-options"><article><h3>高速下载</h3><p>需先运行极速下载助手，附带推荐工具。</p><button data-action="gaming-fast">高速下载</button></article><article><h3>${m.target === 'steam' ? '安装 Steam' : '下载安装包'}</h3><p>${m.selected === 'real' ? '直接下载安装程序，无需下载助手。' : '获取软件安装助手，自动为你安装。'}</p><button data-action="gaming-download">普通下载</button></article></div>`}`;
  if (m.page === 'download' || m.page === 'installer') body += `<h2>${m.page === 'download' ? '文件下载' : '安装向导'}</h2><div class="product-card"><h3>${m.target === 'steam' ? 'SteamSetup.exe' : 'JifengSetup.exe'}</h3><p>来源：${m.domain}<br>发布者：${m.target === 'steam' ? 'Valve' : '疾风网络'}</p><progress id="gaming-progress" max="1500" value="${m.progress}"></progress><p id="gaming-progress-label">${m.running ? (m.running === 'download' ? '下载中' : '安装中') + ' '+Math.floor(m.progress/15)+'%' : m.packageReady ? '安装包已准备好' : ''}</p></div>${m.page === 'download' ? m.packageReady ? '<button data-action="gaming-open-installer">打开安装程序</button>' : '' : `<p>安装路径：C:\\Games\\${m.target === 'steam' ? 'Steam' : 'Jifeng'}</p>${m.target === 'accelerator' ? `<label class="bundle-option"><input type="checkbox" id="gaming-bundle" ${m.bundled ? 'checked' : ''} ${m.running ? 'disabled' : ''}> 推荐：安装游戏工具栏，并将主页设为疾风导航</label>` : '<p>将安装 Steam 客户端，不包含第三方推荐组件。</p>'}<button data-action="gaming-install" ${m.running ? 'disabled' : ''}>开始安装</button>`}<button data-action="gaming-back">取消并返回搜索</button>`;
  if (m.page === 'checkout') body += `<div class="shop-address">https://${m.domain}/checkout</div><h2>绝地求死 · 订单确认</h2><p>收款方：${m.selected === 'real' ? 'Steam / Valve' : '极速游戏代购'} · 标准版 ¥98</p>${m.purchased ? '<p>✓ 游戏已加入你的游戏库。</p>' : `<form data-task="gaming-pay">${m.selected === 'real' ? '<label>验证码 <b class="captcha">6392</b><input name="code" required maxlength="10" autocomplete="off"></label>' : ''}<label>支付口令<input type="password" name="password" required maxlength="40" autocomplete="off"></label><button>确认支付 ¥98</button></form>`}`;
  if (m.mode === 'purchase' && m.purchased && !m.accelerated && m.target === 'steam') body += '<button data-action="gaming-accelerator">下一步：查找游戏加速器</button>';
  return `<div class="scenario-app gaming-app">${note}<main>${body}<p class="task-message" role="status">${escapeText(m.message)}</p></main></div>`;
}
function escapeText(value: string) { return value.replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!)); }
