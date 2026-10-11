type ProgramId = 'main' | 'message' | 'quiet' | 'search' | 'calendar';
type View = 'desktop' | 'tasks' | 'control' | 'category' | 'programs' | 'wizard' | 'downloads' | 'document';
type ProcessId = 'guard' | 'ad';
type Dialog = 'guard' | 'ad' | 'system' | 'repair' | null;
interface Program { id: ProgramId; name: string; installed: boolean; residual: boolean; source: string; date: string; }
interface Job { id: ProgramId; phase: 'download' | 'package' | 'install'; elapsed: number; source: string; }
interface Wizard { id: ProgramId; step: number; repair: boolean; keep: boolean; bundle: boolean; settings: boolean; full: boolean; noReminder: boolean; }

export class UninstallMission {
  programs!: Program[];
  jobs: Job[] = [];
  guard = true;
  ad = true;
  ads = [1, 2];
  adOption = true;
  view: View = 'desktop';
  previous: View = 'desktop';
  minimized = false;
  startMenu = false;
  toolsMenu = false;
  selected: ProgramId = 'main';
  process: ProcessId = 'guard';
  dialog: Dialog = null;
  wizard: Wizard | null = null;
  removing: { id: ProgramId; elapsed: number; keep: boolean } | null = null;
  restored = '';
  message = '先观察，再动手。';
  mistakes = 0;
  previewed = false;
  private adClock = 0;
  private restart = 0;
  private recovery = 0;
  private nextAd = 3;
  private gate = 0;
  private clock = 0;
  private refreshClock = 0;
  recoverOption = true;
  constructor() { this.reset(); }
  reset() {
    this.programs = [
      { id: 'main', name: '2346 桌面助手', installed: true, residual: false, source: '家人打开文件时安装', date: '2016/10/10' },
      { id: 'message', name: '2346 消息组件', installed: false, residual: false, source: '', date: '' },
      { id: 'quiet', name: '2346 清静版', installed: false, residual: false, source: '', date: '' },
      { id: 'search', name: '速搜浏览器', installed: false, residual: false, source: '', date: '' },
      { id: 'calendar', name: '桌面日历', installed: false, residual: false, source: '', date: '' },
    ];
    this.jobs = []; this.guard = true; this.ad = true; this.ads = [1, 2]; this.adOption = true;
    this.view = 'desktop'; this.previous = 'desktop'; this.minimized = false; this.startMenu = false; this.toolsMenu = false;
    this.selected = 'main'; this.process = 'guard'; this.dialog = null; this.wizard = null; this.removing = null;
    this.restored = ''; this.message = '先观察，再动手。'; this.mistakes = 0; this.previewed = false;
    this.adClock = 0; this.restart = 0; this.recovery = 0; this.nextAd = 3; this.gate = 0; this.clock = 0; this.refreshClock = 0; this.recoverOption = true;
  }
  program(id: string) { return this.programs.find(p => p.id === id); }
  get clean() { return !this.programs.some(p => p.installed) && !this.guard && !this.ad && !this.ads.length && !this.jobs.length && !this.restart && !this.recovery && !this.removing; }
  get complete() { return this.clean && this.previewed; }
  get achievement() { return this.mistakes === 0 ? '卸得干干净净' : ''; }
  get blocked() { return this.clock < this.gate; }
  open(view: View) { this.view = view; this.minimized = false; this.startMenu = false; this.toolsMenu = false; }
  private modal(dialog: Dialog) { this.dialog = dialog; this.gate = this.clock + 350; }
  private trap(reason: string) { this.mistakes++; this.message = reason + ' 耐心 −1。'; return this.message; }
  private download(id: ProgramId, source: string) {
    if (this.program(id)!.installed || this.jobs.some(j => j.id === id)) return false;
    this.jobs.push({ id, source, phase: 'download', elapsed: 0 });
    return true;
  }
  private newWizard(id: ProgramId): Wizard { return { id, step: 0, repair: true, keep: true, bundle: true, settings: false, full: false, noReminder: false }; }
  setOption(name: string, value: boolean) {
    if (this.dialog && name !== 'recover') return;
    if (name === 'adOption' && !this.dialog) this.adOption = value;
    if (name === 'recover' && this.dialog === 'ad') this.recoverOption = value;
    if (!this.dialog && this.view === 'wizard' && this.wizard && !this.removing && ['repair','keep','bundle','settings','full','noReminder'].includes(name)) {
      const w = this.wizard;
      if (name === 'repair') w.repair = value;
      if (name === 'keep') w.keep = value;
      if (name === 'bundle') w.bundle = value;
      if (name === 'settings') w.settings = value;
      if (name === 'full') w.full = value;
      if (name === 'noReminder') w.noReminder = value;
    }
  }
  act(action: string, id = ''): string | null {
    if (this.blocked) return null;
    if (this.dialog && !['dismiss','guard-continue','ad-continue','system-confirm','repair-confirm'].includes(action)) return null;
    if (action === 'dismiss') { this.dialog = null; this.gate = this.clock + 350; return null; }
    if (action === 'start') this.startMenu = !this.startMenu;
    if (action === 'tools') { this.toolsMenu = true; }
    if (action === 'tasks') this.open('tasks');
    if (action === 'control') this.open('control');
    if (action === 'category') this.open('category');
    if (action === 'programs' || action === 'refresh') { this.open('programs'); if (!this.program(this.selected)?.installed) this.selected = this.programs.find(p => p.installed)?.id || 'main'; }
    if (action === 'downloads') this.open('downloads');
    if (action === 'document') this.open('document');
    if (action === 'desktop') { this.view = 'desktop'; this.minimized = false; }
    if (action === 'minimize') { this.previous = this.view; this.minimized = true; }
    if (action === 'restore') { this.view = this.previous; this.minimized = false; }
    if (action === 'ad-close' && this.ads.includes(Number(id))) { this.ads = this.ads.filter(a => a !== Number(id)); this.gate = this.clock + 350; }
    if ((action === 'ad-quiet' || (action === 'ad-apply' && this.adOption)) && this.ads.includes(Number(id))) {
      this.ads = this.ads.filter(a => a !== Number(id));
      if (this.download('quiet', '广告免打扰设置')) return this.trap('免打扰设置启动了清静版下载。');
    }
    if (action === 'ad-apply' && !this.adOption) this.ads = this.ads.filter(a => a !== Number(id));
    if (action === 'select-process' && (id === 'guard' || id === 'ad')) this.process = id;
    if (action === 'end' && this.view === 'tasks' && (this.process === 'guard' ? this.guard : this.ad)) {
      if (this.process === 'ad') this.recoverOption = true;
      this.modal(this.process);
    }
    if (action === 'guard-continue' && this.dialog === 'guard') this.modal('system');
    if (action === 'ad-continue' && this.dialog === 'ad') this.modal('system');
    if (action === 'system-confirm' && this.dialog === 'system') {
      this.dialog = null;
      if (this.process === 'guard') { this.guard = false; this.restart = 0; this.message = '守护服务已结束，程序仍在安装列表中。'; }
      else {
        const keep = this.recoverOption;
        this.ad = false; this.adClock = 0; this.recovery = keep ? 2000 : 0; this.restart = this.guard ? 2000 : 0;
        this.message = '消息服务已结束；结束进程不会卸载软件。';
        if (keep) return this.trap('保留自动恢复，消息服务将在 2 秒后重新启动。');
      }
    }
    if (action === 'select-program' && this.program(id)?.installed) this.selected = id as ProgramId;
    if (action === 'uninstall' && this.view === 'programs' && this.program(this.selected)?.installed) {
      const w = this.wizard;
      if (this.removing && this.removing.id !== this.selected) { this.message = '另一个程序正在卸载，请等待完成。'; return null; }
      if (!w || w.id !== this.selected || w.step === 4) this.wizard = this.newWizard(this.selected);
      this.open('wizard');
    }
    const w = this.wizard;
    if (action === 'wizard-back' && this.view === 'wizard' && w && !this.removing) w.step = Math.max(0, w.step - 1);
    if (action === 'wizard-next' && this.view === 'wizard' && w && w.id === 'main' && !this.removing) {
      if (w.step === 0) { if (w.repair) this.modal('repair'); else w.step = 1; }
      else if (w.step === 1) w.step = 2;
    }
    if (action === 'repair-confirm' && this.dialog === 'repair' && this.program('main')!.installed) { this.guard = true; this.ad = true; this.dialog = null; this.open('programs'); return this.trap('修复恢复了守护服务与推荐消息。'); }
    if (action === 'execute' && this.view === 'wizard' && w && !this.removing && this.program(w.id)?.installed && (w.id !== 'main' || w.step === 2)) {
      if ((w.id === 'main' && (this.guard || this.ad)) || (w.id === 'message' && this.ad)) { this.message = `程序被 ${this.guard ? '2346Guard.exe' : '2346Ad.exe'} 占用，请在任务管理器结束后重试。`; return null; }
      if (w.id === 'search' && !w.full) { this.message = '快捷方式已移除，浏览器及后台更新服务仍在程序列表中。'; this.wizard = null; this.open('programs'); return null; }
      this.removing = { id: w.id, elapsed: 0, keep: w.id === 'main' ? w.keep : w.id === 'calendar' && !w.noReminder };
      w.step = 3;
      let dangerous = false;
      if (w.id === 'main') { dangerous = w.keep; if (w.bundle) dangerous = this.download('quiet', '2346 卸载时选择轻装替代') || dangerous; }
      if (w.id === 'quiet' && w.bundle) dangerous = this.download('calendar', '清静版卸载推荐');
      if (dangerous) return this.trap(w.id === 'quiet' ? '继续卸载提交了桌面日历的下载与自动安装。' : [w.keep ? '保留消息服务' : '', w.bundle && this.jobs.some(j => j.id === 'quiet') ? '启动轻装版下载与自动安装' : ''].filter(Boolean).join('，') + '。');
    }
    if (action === 'finish' && this.view === 'wizard' && w?.step === 4) {
      this.open('programs');
      if (w.id === 'main' && w.bundle && this.download('search', '2346 卸载结果页推荐')) return this.trap('完成按钮提交了速搜浏览器的下载与自动安装。');
    }
    if (action === 'cancel-job') { this.jobs = this.jobs.filter(j => j.id !== id); this.message = '下载或安装已取消；完整安装包会保留，可在下载窗口移除。'; }
    // 已完成下载的安装包取消安装后保留，移除包才清空任务。
    if (action === 'cancel-install') { const j = this.jobs.find(j => j.id === id); if (j?.phase === 'install') { j.phase = 'package'; j.elapsed = 0; } }
    if (action === 'install-package') { const j = this.jobs.find(j => j.id === id); if (j?.phase === 'package') { j.phase = 'install'; j.elapsed = 0; } }
    if (action === 'preview' && this.view === 'document') {
      if (this.clean) { this.previewed = true; this.message = '2346 和本次新增程序已清理，打印工具可用。'; }
      else this.message = '尚有残留：' + [...this.programs.filter(p => p.installed).map(p => p.name + '（程序和功能）'), ...(this.guard || this.ad ? ['2346 后台进程（任务管理器）'] : []), ...(this.ads.length ? ['推荐窗口（桌面）'] : []), ...(this.jobs.length ? ['下载或安装包（下载窗口）'] : []), ...(this.restart || this.recovery ? ['自动恢复任务（结束消息服务时取消保留）'] : []), ...(this.removing ? ['卸载尚未完成'] : [])].join('、');
    }
    return null;
  }
  tick(delta: number) {
    this.clock += delta;
    let changed = false;
    if (this.restart > 0) { this.restart = Math.max(0, this.restart - delta); if (!this.restart && this.guard) { this.ad = true; this.restored = '由守护服务重新启动'; changed = true; } }
    if (this.recovery > 0) { this.recovery = Math.max(0, this.recovery - delta); if (!this.recovery && (this.program('main')!.installed || this.program('message')!.installed)) { this.ad = true; this.restored = '由保留的自动恢复任务重新启动'; changed = true; } }
    if (this.ad && !this.dialog) {
      this.adClock += delta;
      if (this.adClock >= 10000) { this.adClock %= 10000; if (this.ads.length < 2) { if (this.ads.some(id => id % 2 === this.nextAd % 2)) this.nextAd++; this.ads.push(this.nextAd++); changed = true; } }
    }
    for (const j of [...this.jobs]) {
      if (j.phase === 'package') continue;
      j.elapsed += delta;
      if (j.elapsed >= 2000) {
        if (j.phase === 'download') { j.phase = 'install'; j.elapsed = 0; }
        else { const p = this.program(j.id)!; p.installed = true; p.residual = false; p.source = j.source; p.date = '2016/10/11'; this.jobs = this.jobs.filter(item => item !== j); this.selected = j.id; this.message = `${p.name} 已安装，可在程序和功能中卸载。`; }
        changed = true;
      }
    }
    if (this.removing) {
      this.removing.elapsed += delta;
      if (this.removing.elapsed >= 1200) {
        const r = this.removing; const p = this.program(r.id)!;
        p.installed = r.id === 'calendar' && r.keep; p.residual = p.installed;
        if (r.id === 'main') {
          this.guard = false; this.restart = 0; this.recovery = 0;
          const component = this.program('message')!; component.installed = r.keep; component.source = '2346 卸载时保留'; component.date = '2016/10/11'; this.ad = r.keep;
        }
        if (r.id === 'message') { this.ad = false; this.restart = 0; this.recovery = 0; }
        if (this.wizard?.id === r.id) { this.wizard.step = 4; this.wizard.bundle = r.id === 'main'; }
        this.removing = null; this.message = p.installed ? '每日提醒组件仍保留，可再次卸载。' : `${p.name} 已移除，请复核程序列表。`; changed = true;
      }
    }
    this.refreshClock += delta;
    if ((this.jobs.some(j => j.phase !== 'package') || this.removing) && this.refreshClock >= 250) { this.refreshClock = 0; changed = true; }
    return changed;
  }
}

const b = (action: string, text: string, id = '', disabled = false) => `<button data-action="uninstall-${action}" data-id="${id}" ${disabled ? 'disabled' : ''}>${text}</button>`;
const option = (name: string, text: string, checked: boolean) => `<label><input type="checkbox" data-uninstall-option="${name}" ${checked ? 'checked' : ''}> ${text}</label>`;
const choice = (name: string, text: string, checked: boolean, value: boolean) => `<label><input type="radio" name="uninstall-${name}" data-uninstall-option="${name}" value="${value}" ${checked ? 'checked' : ''}> ${text}</label>`;
export function renderUninstall(m: UninstallMission) {
  const w = m.wizard;
  let body = '';
  const names: Record<View, string> = { desktop: '桌面', tasks: '任务管理器', control: '控制面板', category: '程序', programs: '程序和功能', wizard: '2346 · 软件卸载', downloads: '下载与安装', document: '准考证.pdf' };
  if (m.view === 'tasks') body = `<h2>进程</h2><p>名称 · 描述 · 发布者 · 状态</p><div class="uninstall-list">${(['guard','ad'] as const).map(id => b('select-process', `<strong>2346${id === 'guard' ? 'Guard' : 'Ad'}.exe</strong><span>${id === 'guard' ? '守护服务：检测到广告服务退出后，将重新启动该服务' : '消息服务：展示桌面推荐窗口'}<br>发布者：2346 软件 · ${m[id] ? '运行中' : '已停止'} ${id === 'ad' ? m.restored : ''}</span>`, id)).join('')}<div class="uninstall-protected"><strong>PrintHelper.exe</strong><p>打印工具 · 校务打印工具组 · 正在保留打印任务，结束操作不可用</p></div></div><p>选中：2346${m.process === 'guard' ? 'Guard' : 'Ad'}.exe</p>${b('end','结束进程','',!m[m.process])}`;
  if (m.view === 'control') body = `<h2>调整计算机的设置</h2>${b('category','程序')}<p>卸载程序、查看已安装的软件。</p>`;
  if (m.view === 'category') body = `${b('control','← 控制面板')}<h2>程序</h2>${b('programs','程序和功能 · 卸载程序')}`;
  if (m.view === 'programs') body = `${b('category','← 程序')}${b('refresh','刷新')}<h2>卸载或更改程序</h2><div class="uninstall-list">${m.programs.filter(p => p.installed).map(p => b('select-program', `<strong>${p.name}${p.residual ? ' · 提醒组件' : ''}</strong><span>发布者：${p.id === 'main' || p.id === 'message' || p.id === 'quiet' ? '2346 软件' : p.id === 'search' ? '速搜软件' : '日历工具组'} · ${p.date} · ${p.id === 'message' ? '3.2' : '28.6'} MB<br>来源详情：${p.source}</span>`,p.id)).join('')}<div class="uninstall-protected">打印工具 · 校务打印工具组 · 2016/09/01 · 8.0 MB<br>照片查看器 · 系统组件 · 2016/09/01 · 12.0 MB<br>任务所需，保留这两项</div></div><p>选中：${m.program(m.selected)?.installed ? m.program(m.selected)!.name : '无'}</p>${b('uninstall','卸载/更改','',!m.program(m.selected)?.installed)}`;
  if (m.view === 'wizard' && w) {
    const p = m.program(w.id)!;
    body = `<h2>${p.name}${w.step === 4 ? '已移除' : ' · 维护向导'}</h2><p>发布者：${w.id === 'main' || w.id === 'quiet' || w.id === 'message' ? '2346 软件' : p.name}</p>`;
    if (w.step === 3) body += `<p>正在卸载……关闭窗口后仍继续，可从程序列表重新打开。</p><progress max="1200" value="${m.removing?.elapsed || 0}"></progress>`;
    else if (w.step === 4) body += `${p.residual ? '<p>每日提醒组件仍保留。</p>' : '<p>请返回系统列表确认其他组件。</p>'}${w.id === 'main' ? option('bundle','安装速搜浏览器并设为默认浏览器',w.bundle) + '<p>点击完成后开始下载及自动安装。</p>' : ''}${b('finish','完成')}${b('programs','返回程序列表')}`;
    else if (w.id === 'main') {
      if (w.step === 0) body += `${choice('repair','修复并继续使用',w.repair,true)}${choice('repair','卸载 2346 桌面助手',!w.repair,false)}<p>修复将恢复守护服务及推荐消息。</p>${b('wizard-next','下一步')}`;
      if (w.step === 1) body += `<h3>是否放弃卸载，继续使用？</h3><p>放弃卸载将保留当前程序。</p>${b('programs','放弃卸载')}${b('wizard-next','继续卸载')}`;
      if (w.step === 2) body += `${option('keep','保留消息服务，主程序移除后仍接收推荐',w.keep)}${option('bundle','安装轻装版，替代被卸载的桌面助手',w.bundle)}<p>轻装版与清静版为同一产品，提交后下载并自动安装。</p>${option('settings','保留个人设置（不运行程序）',w.settings)}${b('execute','执行卸载')}${b('wizard-back','上一步')}`;
      body += b('programs','取消');
    } else {
      if (w.id === 'quiet') body += `<h3>是否取消卸载？</h3>${option('bundle','卸载后下载并自动安装桌面日历',w.bundle)}${b('programs','取消卸载')}`;
      if (w.id === 'search') body += `${choice('full','仅移除快捷方式',!w.full,false)}${choice('full','移除浏览器及后台更新服务',w.full,true)}<p>仅移除快捷方式不会卸载程序。</p>`;
      if (w.id === 'calendar') body += `${option('noReminder','不保留每日提醒',w.noReminder)}<p>未勾选时保留提醒组件。</p>`;
      if (w.id === 'message') body += '<p>请先在任务管理器结束消息服务，再卸载组件。</p>';
      body += b('execute',w.id === 'quiet' ? '继续卸载' : '执行卸载') + b('programs','返回程序列表');
    }
  }
  if (m.view === 'downloads') body = `<h2>下载与安装</h2>${m.jobs.map(j => `<section><h3>${m.program(j.id)!.name}</h3><p>来源：${j.source} · ${j.phase === 'download' ? '下载中（完成后自动安装）' : j.phase === 'install' ? '安装中' : '安装已取消，完整安装包已保留'}</p><progress max="2000" value="${j.elapsed}"></progress>${j.phase === 'install' ? b('cancel-install','取消安装，保留包',j.id) : ''}${j.phase === 'package' ? b('install-package','重新打开安装程序',j.id) : ''}${b('cancel-job',j.phase === 'download' ? '取消下载' : '移除安装包及任务',j.id)}</section>`).join('') || '<p>没有下载任务或安装包。</p>'}`;
  if (m.view === 'document') body = `<h2>准考证</h2><p>姓名：小林　考试时间：明天上午 9:00</p><p>A4 纸，黑白打印；打印工具已就绪。</p>${b('preview','打印预览 · 检查电脑清理结果')}${m.complete ? '<p>✓ 打印预览已打开，打印工具可用。</p>' : ''}`;
  let dialog = '';
  if (m.dialog === 'guard') dialog = `<h2>2346 · 守护服务</h2><p>是否取消结束守护服务？取消结束后，服务将继续运行。</p>${b('dismiss','取消结束')}${b('guard-continue','继续结束')}`;
  if (m.dialog === 'ad') dialog = `<h2>2346 · 消息服务</h2><p>退出后是否保留自动恢复？保留后，2 秒后重新启动消息服务。</p>${option('recover','保留自动恢复',m.recoverOption)}${b('ad-continue','确认退出')}${b('dismiss','返回')}`;
  if (m.dialog === 'system') dialog = `<h2>任务管理器</h2><p>是否结束选中的 2346${m.process === 'guard' ? 'Guard' : 'Ad'}.exe 进程？未保存的程序数据可能丢失。</p>${b('system-confirm','结束进程')}${b('dismiss','取消')}`;
  if (m.dialog === 'repair') dialog = `<h2>2346 · 修复确认</h2><p>修复将恢复守护服务及推荐消息，是否继续？</p>${b('repair-confirm','确认修复')}${b('dismiss','返回')}`;
  return `<div class="uninstall-scene"><div class="uninstall-workspace" ${m.dialog ? 'inert' : ''}><div class="uninstall-desktop"><div class="uninstall-shortcuts">${b('document','▤<br>准考证.pdf')}${b('control','▣<br>计算机')}${b('document','▧<br>打印工具')}</div><aside class="uninstall-note"><strong>家里的留言 · 2016/10/11</strong><p>明天打印准考证，把 2346 卸干净，别把打印工具删了。广告关过好几次，任务栏小图标还在。又装进去别的，也一起清掉。</p></aside></div>${body && !m.minimized ? `<section class="uninstall-window"><header><strong>${names[m.view]}</strong><div>${b('minimize','−')}${b('desktop','×')}</div></header><div class="uninstall-body">${body}<p class="uninstall-message" role="status">${m.message}</p></div></section>` : ''}<div class="uninstall-ads">${m.ads.map(id => `<section class="uninstall-ad"><header>2346 · ${id % 2 === 0 ? '推荐设置' : '今日推荐'}${b('ad-close','×',String(id))}</header>${id % 2 === 0 ? `<p>不再接收此类推荐</p>${option('adOption','安装清静版，代替当前助手',m.adOption)}<p>应用后下载并自动安装。</p>${b('ad-apply','应用设置',String(id))}${b('ad-close','仅关闭',String(id))}` : `<p>关闭本次推荐后，不再显示本条内容。其他推荐仍可能出现。</p>${b('ad-close','关闭本条',String(id))}${b('ad-quiet','开启免打扰',String(id))}<p>免打扰：下载并自动安装 2346 清静版。</p>`}<small>由 ${m.program('message')!.installed ? '2346 消息组件' : '2346 桌面助手'}提供</small></section>`).join('')}</div></div><nav class="uninstall-taskbar" aria-label="任务栏" ${m.dialog ? 'inert' : ''}>${b('start','▦ 开始')}${b('restore','恢复窗口','',!m.minimized)}${b('downloads',`下载 (${m.jobs.length})`)}<span>${m.ad || m.guard ? '2346 ●' : '2346 已停止'}</span></nav>${m.startMenu ? `<nav class="uninstall-start" ${m.dialog ? 'inert' : ''}>${b('tools','系统工具')}${m.toolsMenu ? b('tasks','任务管理器') : ''}${b('control','控制面板')}</nav>` : ''}${dialog ? `<div class="uninstall-modal"><section role="dialog" aria-modal="true" aria-label="${m.dialog === 'system' ? '结束进程确认' : '2346 操作确认'}"><header>${b('dismiss','×')}</header>${dialog}</section></div>` : ''}</div>`;
}
