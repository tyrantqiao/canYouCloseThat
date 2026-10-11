export type GamingMode = 'install' | 'purchase';
type Page = 'desktop' | 'browser' | 'error' | 'search' | 'site' | 'download' | 'installer' | 'checkout';
type BrowserEntry = { page: Page; query: string; selected: string; address: string };
export class GamingMission {
  mode: GamingMode;
  page: Page = 'search'; query = ''; selected = ''; target: 'steam' | 'accelerator' = 'steam';
  packageReady = false; installed = false; purchased = false; accelerated = false;
  packageTarget: 'steam' | 'accelerator' | null = null;
  bundled = true; progress = 0; running: 'download' | 'install' | null = null;
  message = ''; testedFake = false;
  address = 'about:blank';
  private history: BrowserEntry[] = [];
  private historyIndex = -1;
  get canBack() { return this.mode === 'install' && this.historyIndex > 0; }
  get canForward() { return this.mode === 'install' && this.historyIndex < this.history.length - 1; }
  private remember() {
    this.history = this.history.slice(0, this.historyIndex + 1);
    this.history.push({ page: this.page, query: this.query, selected: this.selected, address: this.address });
    this.historyIndex = this.history.length - 1;
  }
  private restore(index: number) {
    const entry = this.history[index];
    if (!entry) return;
    this.historyIndex = index; this.page = entry.page; this.query = entry.query;
    this.selected = entry.selected; this.address = entry.address; this.message = '';
  }
  constructor(mode: GamingMode) { this.mode = mode; this.reset(); }
  reset() { this.packageTarget = null; this.address = 'about:blank'; this.history = []; this.historyIndex = -1; this.page = this.mode === 'install' ? 'desktop' : 'search'; this.query = ''; this.selected = ''; this.target = 'steam'; this.packageReady = false; this.installed = this.mode === 'purchase'; this.purchased = false; this.accelerated = false; this.bundled = true; this.progress = 0; this.running = null; this.message = ''; this.testedFake = false; }
  get complete() { return this.mode === 'install' ? this.installed : this.purchased && this.accelerated; }
  get catalog() {
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
  get results() {
    const q = this.query.toLowerCase().trim();
    return q && (this.target === 'steam' ? /steam|白神话|悟空|绝地|求死|游戏平台/.test(q) : /加速|疾风/.test(q)) ? this.catalog : [];
  }
  get domain() { return this.catalog.find(r => r.id === this.selected)?.domain || ''; }
  get packageInfo() { return this.packageTarget === 'accelerator'
    ? { file: 'JifengSetup.exe', domain: 'jifeng.example', publisher: '疾风网络' }
    : { file: 'SteamSetup.exe', domain: 'store.steampowered.com', publisher: 'Valve' }; }
  openBrowser() { if (this.page === 'desktop') { this.page = 'browser'; this.address = 'about:blank'; this.remember(); } }
  closeBrowser() {
    if (this.mode !== 'install' || this.running) return;
    this.page = 'desktop'; this.query = ''; this.selected = ''; this.address = 'about:blank';
    this.history = []; this.historyIndex = -1; this.message = '';
  }
  navigateAddress(value: string) {
    if (this.mode !== 'install' || this.page === 'desktop' || this.running || ['download', 'installer'].includes(this.page)) return;
    const trimmed = value.trim();
    if (!trimmed) return;
    if (trimmed.toLowerCase() === 'about:blank') {
      this.page = 'browser'; this.address = 'about:blank'; this.query = ''; this.selected = ''; this.message = ''; this.remember(); return;
    }
    try {
      const url = new URL(/^[a-z][a-z\d+.-]*:/i.test(trimmed) ? trimmed : 'https://' + trimmed);
      if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password || url.port) throw new Error('unsupported');
      this.address = url.href;
      if (['xdu.com', 'www.xdu.com'].includes(url.hostname) && url.pathname === '/') {
        this.page = 'search'; this.query = ''; this.selected = ''; this.message = ''; this.remember(); return;
      }
      if (['xdu.com', 'www.xdu.com'].includes(url.hostname) && url.pathname === '/s') {
        this.page = 'search'; this.query = (url.searchParams.get('wd') || '').trim().slice(0,80);
        this.selected = ''; this.message = ''; this.remember(); return;
      }
      const site = this.catalog.find(result => {
        const known = new URL('https://' + result.domain);
        return known.hostname === url.hostname && (known.pathname === '/' || url.pathname.startsWith(known.pathname));
      });
      if (site) { this.selected = site.id; this.page = 'site'; this.message = ''; this.remember(); return; }
    } catch { this.address = trimmed.slice(0, 200); }
    this.page = 'error'; this.message = '无法打开此网页，请检查地址栏中的网址。'; this.remember();
  }
  search(query: string) {
    const trimmed = query.trim();
    if (!trimmed || this.running || !['search', 'site'].includes(this.page)) return;
    this.query = trimmed.slice(0,80); this.selected = ''; this.page = 'search'; this.message = '';
    this.address = 'https://xdu.com/s?wd=' + encodeURIComponent(this.query);
    if (this.mode === 'install') this.remember();
  }
  visit(id: string) {
    if (this.page !== 'search' || this.running || !this.results.some(r => r.id === id)) return;
    this.selected = id; this.page = 'site'; this.message = '';
    this.address = 'https://' + this.domain + (this.target === 'steam' ? '/about' : '/download');
    if (this.mode === 'install') this.remember();
  }
  back() {
    if (this.page === 'installer') { this.running = null; this.progress = 1500; this.page = 'download'; this.message = '安装已取消，安装包仍保留。'; return; }
    if (this.page === 'download') { if (this.running) { this.progress = 0; this.packageReady = false; this.packageTarget = null; } this.running = null; this.page = 'site'; this.message = ''; return; }
    if (this.mode === 'install') {
      if (this.canBack) this.restore(this.historyIndex - 1);
      return;
    }
    this.page = 'search'; this.message = '';
  }
  forward() { if (this.canForward && !this.running && !['download', 'installer'].includes(this.page)) this.restore(this.historyIndex + 1); }
  findAccelerator() { if (!this.purchased) return; this.back(); this.target = 'accelerator'; this.query = ''; this.selected = ''; }
  download(fast: boolean) {
    if (this.page !== 'site' || this.running) return false;
    if (fast || this.selected !== 'real') { this.message = '下载到的是高速下载助手或来源不明的安装包，请返回搜索核对来源。'; return true; }
    this.packageTarget = this.target; this.page = 'download'; this.progress = 0; this.packageReady = false; this.running = 'download'; this.message = ''; return false;
  }
  openInstaller() { if (!['download', 'site'].includes(this.page) || !this.packageReady || !this.packageTarget || this.running) return; this.page = 'installer'; this.bundled = this.packageTarget === 'accelerator'; this.message = ''; }
  install() {
    if (this.page !== 'installer' || !this.packageTarget || !this.packageReady || this.running) return false;
    if (this.packageTarget === 'accelerator' && this.bundled) { this.message = '推荐工具栏与主页修改仍被勾选。已停止安装，可取消推荐组件后重试。'; return true; }
    this.running = 'install'; this.progress = 0; this.message = ''; return false;
  }
  tick(delta: number) {
    if (!this.running) return false;
    this.progress = Math.min(1500, this.progress + Math.max(0,delta));
    if (this.progress < 1500) return false;
    if (this.running === 'download') { this.packageReady = true; this.message = '下载完成，请检查文件名与发布者，再打开安装程序。'; }
    else { if (this.packageTarget === 'steam') this.installed = true; else this.accelerated = true; this.message = this.packageTarget === 'steam' ? 'Steam 安装成功！可以准备你的游戏库了。' : '疾风加速器安装成功，绝地求死线路已就绪。'; }
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
  const note = `<aside class="task-note"><b>${m.mode === 'install' ? '今晚想玩白神话悟空' : '朋友约你玩绝地求死'}</b><p>${m.mode === 'install' ? '从桌面打开冲浪浏览器，在地址栏输入 xdu.com 并回车，再在 X 度搜索 Steam，再下载并安装客户端。安装完成就可以交差，不需要下载游戏。' : 'Steam 已安装。用浏览器找到 Steam 商店，购买「绝地求死」，再安装疾风游戏加速器。'}</p><p>Steam 域名：<b>store.steampowered.com</b><br>发布者：<b>Valve</b></p>${m.mode === 'purchase' ? '<p>疾风官网：<b>jifeng.example</b><br>发布者：疾风网络<br>关卡钱包 ¥200；游戏售价 ¥98。支付口令：<b>play2026</b></p><p>目标进度：'+(m.purchased ? '✓' : '○')+' 游戏入库 / '+(m.accelerated ? '✓' : '○')+' 加速器安装</p>' : ''}</aside>`;
  let body = m.mode === 'install' || ['download', 'installer'].includes(m.page) ? '' : '<button data-action="gaming-back">← 返回搜索</button>';
  if (m.page === 'desktop') body = `<div class="old-desktop gaming-desktop"><button class="desktop-icon" data-action="gaming-open-browser"><span>🌐</span>冲浪浏览器</button><div class="desktop-note"><b>室友的装机便签</b><p>今晚想玩白神话悟空。先打开浏览器，在地址栏输入 xdu.com，再从 X 度搜一下 Steam，把客户端装好。</p><small>点一下桌面图标就能打开。</small></div><div class="taskbar">▦ 开始 <span>本地连接已就绪</span><span>2024 / 08 / 20</span></div></div>`;
  if (m.page === 'browser') body = '<div class="gaming-blank" aria-label="空白网页"></div>';
  if (m.page === 'error') body = '<div class="gaming-error"><h2>无法打开此网页</h2><p>请检查网址是否输入正确，再按回车重试。</p></div>';
  if (m.page === 'search') body = renderGamingSearch(m);
  if (m.page === 'site') body += `<div class="shop-address">https://${m.domain}/${m.target === 'steam' ? 'about' : 'download'}</div><div class="product-card"><h2>${m.target === 'steam' ? 'STEAM · 游戏与好友的世界' : '疾风游戏加速器'}</h2><p>${m.target === 'steam' ? (m.mode === 'install' ? '发现游戏，管理游戏库，与好友一起玩。今晚宿舍群都在聊悟空，室友提醒：先把客户端装好，再谈游戏库。' : '发现游戏，管理游戏库，与好友一起玩。朋友已经进了语音频道，先确认游戏买进自己的游戏库。') : '为绝地求死提供游戏线路，客户端下载后可选择服务器。开黑便签：先准备线路，再进语音；推荐导航和工具栏与加速任务无关。'}</p></div>${m.mode === 'purchase' && m.target === 'steam' ? `<h3>绝地求死 · 标准版</h3><p>多人战术生存 · ¥98 · 加入自己的游戏库</p><p class="archive-note">开黑留言 / 20:30：别买成共享账号！等你的游戏库有了这款游戏，再一起选线路。价格为剧情设定。</p><button data-action="gaming-checkout">购买游戏</button>` : `<p>Windows 安装包 · 发布者：${m.selected === 'real' ? m.target === 'steam' ? 'Valve' : '疾风网络' : '极速软件服务'}</p><div class="download-options">${m.selected === 'real' && m.target === 'steam' ? '' : '<article><h3>高速下载</h3><p>需先运行极速下载助手，附带推荐工具。</p><button data-action="gaming-fast">高速下载</button></article>'}<article><h3>${m.target === 'steam' ? '安装 Steam' : '下载安装包'}</h3><p>${m.selected === 'real' ? '直接下载安装程序，无需下载助手。' : '获取软件安装助手，自动为你安装。'}</p><button data-action="gaming-download">普通下载</button></article></div>`}`;
  if (m.page === 'site' && m.selected === 'real' && m.packageReady && m.packageTarget === m.target) body += `<button data-action="gaming-open-installer">打开已下载的 ${m.packageInfo.file}</button>`;
  if (m.page === 'download' || m.page === 'installer') body += `<h2>${m.page === 'download' ? '文件下载' : '安装向导'}</h2><div class="product-card"><h3>${m.packageInfo.file}</h3><p>来源：${m.packageInfo.domain}<br>发布者：${m.packageInfo.publisher}</p><progress id="gaming-progress" max="1500" value="${m.progress}"></progress><p id="gaming-progress-label">${m.running ? (m.running === 'download' ? '下载中' : '安装中') + ' '+Math.floor(m.progress/15)+'%' : m.packageReady ? '安装包已准备好' : ''}</p></div>${m.page === 'download' ? m.packageReady ? '<button data-action="gaming-open-installer">打开安装程序</button>' : '' : `<p>安装路径：C:\\Games\\${m.packageTarget === 'steam' ? 'Steam' : 'Jifeng'}</p>${m.packageTarget === 'accelerator' ? `<label class="bundle-option"><input type="checkbox" id="gaming-bundle" ${m.bundled ? 'checked' : ''} ${m.running ? 'disabled' : ''}> 推荐：安装游戏工具栏，并将主页设为疾风导航</label>` : '<p>将安装 Steam 客户端，不包含第三方推荐组件。完成后创建桌面快捷方式；室友说“安装包不是游戏，下载完还得安装”。</p>'}<button data-action="gaming-install" ${m.running ? 'disabled' : ''}>开始安装</button>`}<button data-action="gaming-back">${m.page === 'installer' ? '取消安装' : m.packageReady ? '关闭下载窗口' : '取消下载并返回网页'}</button>`;
  if (m.page === 'checkout') body += `<div class="shop-address">https://${m.domain}/checkout</div><h2>绝地求死 · 订单确认</h2><p>收款方：${m.selected === 'real' ? 'Steam / Valve' : '极速游戏代购'} · 标准版 ¥98</p>${m.purchased ? '<p>✓ 游戏已加入你的游戏库。</p>' : `<form data-task="gaming-pay">${m.selected === 'real' ? '<label>验证码 <b class="captcha">6392</b><input name="code" required maxlength="10" autocomplete="off"></label>' : ''}<label>支付口令<input type="password" name="password" required maxlength="40" autocomplete="off"></label><button>确认支付 ¥98</button></form>`}`;
  if (m.mode === 'purchase' && m.purchased && !m.accelerated && m.target === 'steam') body += '<button data-action="gaming-accelerator">下一步：查找游戏加速器</button>';
  if (m.mode === 'install' && m.page !== 'desktop') {
    body = `<div class="gaming-browser-tools"><button data-action="gaming-back" aria-label="后退" ${!m.canBack || m.running || ['download','installer'].includes(m.page) ? 'disabled' : ''}>◀</button><button data-action="gaming-forward" aria-label="前进" ${!m.canForward || m.running || ['download','installer'].includes(m.page) ? 'disabled' : ''}>▶</button><span>文件(F)　编辑(E)　查看(V)　收藏(A)　工具(T)</span><button data-action="gaming-close-browser" ${m.running ? 'disabled' : ''}>关闭浏览器</button></div>` + body;
  }
  return `<div class="scenario-app gaming-app">${note}<main>${body}<p class="task-message" role="status">${escapeText(m.message)}</p></main></div>`;
}
function escapeText(value: string) { return value.replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!)); }

export function renderGamingAddress(m: GamingMission) {
  if (m.page === 'desktop') return '我的电脑';
  return `<form class="gaming-address-form" data-task="gaming-address"><label class="gaming-address-label" for="gaming-address">地址</label><input id="gaming-address" name="url" aria-label="浏览器地址栏" value="${escapeText(m.address)}" autocomplete="off" autocapitalize="none" spellcheck="false" maxlength="200" ${m.running || ['download','installer'].includes(m.page) ? 'disabled' : ''}><button aria-label="转到地址" ${m.running || ['download','installer'].includes(m.page) ? 'disabled' : ''}>转到</button></form>`;
}

function renderGamingSearch(m: GamingMission) {
  const form = `<form data-task="gaming-search"><label>搜索关键词<input name="query" value="${escapeText(m.query)}" placeholder="${m.mode === 'install' ? '请输入搜索关键词' : m.target === 'steam' ? 'Steam' : '疾风加速器'}" required maxlength="80"></label><button>${m.mode === 'install' ? 'X 度一下' : '搜索网页'}</button></form>`;
  {
    const results = !m.query ? '' : `<div class="result-count">X 度为您找到相关网页</div><div class="search-results">${m.results.map(r => `<div class="search-result"><button data-action="gaming-visit" data-id="${r.id}">${r.title}</button><p>${r.note.replace('推广 · ', '')}</p><span class="result-domain">${r.domain}</span> <small ${r.id === 'fast' ? 'class="group-promotion" aria-label="推广结果"' : ''}>${r.id === 'fast' ? '推' : '网页快照'}</small></div>`).join('') || '<p>没有找到相关网页，换个关键词试试。</p>'}</div>`;
    return `<div class="search-page gaming-xdu ${m.query ? 'has-results' : ''}"><div class="search-logo"><span>X</span><b>度</b><small>有事没事，X 度一下</small></div><div class="search-tabs">网页　图片　视频　资讯　贴吧　更多 »</div>${form}${results}</div>`;
  }
}
