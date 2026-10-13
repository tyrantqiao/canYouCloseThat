import { resultsFor, type SearchSite } from './search.ts';
export type Page = 'desktop' | 'search' | 'results' | 'fake' | 'official';
export class BrowserMission {
  page: Page = 'desktop';
  query = '';
  ads: string[] = [];
  verified = false;
  popupClicks = 0;
  trapCount = 0;
  recordPopupClick() { this.popupClicks++; }
  recordTrap() { this.trapCount++; }
  get achievement() {
    if (!this.complete || this.trapCount) return null;
    return this.popupClicks === 0 ? '万花丛中过，片叶不沾身' : '看清再点，安全上网';
  }
  opened = false;
  searched = false;
  wave = 0;
  resultsPage = 1;
  selectedSite: SearchSite | null = null;
  get searchResults() { return resultsFor(this.query); }
  get articleText() {
    if (this.selectedSite?.kind !== 'article') return '';
    if (this.selectedSite.id === 'review') return '楼主的使用记录：下载站让我装了导航工具栏。后来在星河实验室的版本日志找到 1.0，网址是 xinghe.example；他们刚修好了收藏夹中文乱码。';
    if (this.selectedSite.id === 'news') return '本地新闻存档：星河实验室发布浏览器 1.0。发布说明提到修复收藏夹中文乱码，官网底部建议使用 1024 × 768 分辨率。';
    return '帖子里有人聊拨号费用，也有人推荐重装。讨论已经歪楼，先记住自己要找的软件，再回结果页看看。';
  }
  dangerElapsed = 0;
  dangerActive = false;
  back() { this.dangerActive = false; this.dangerElapsed = 0; this.ads = this.ads.filter(id => !id.startsWith('attack-')); this.page = this.searched ? 'results' : 'search'; }
  visitResult(id: string) {
    const site = this.searchResults.find(site => site.id === id);
    if (!site || site.page !== this.resultsPage) return false;
    this.selectedSite = site; this.verified = false;
    this.page = site.kind === 'official' ? 'official' : 'fake';
    this.dangerActive = site.kind === 'phishing' || site.kind === 'malware';
    this.dangerElapsed = 0;
    if (site.kind === 'official') this.ads = [...new Set([...this.ads, 'exit'])];
    return this.dangerActive;
  }
  tickDanger(delta: number) {
    // 浏览可疑页面只提供线索；扣分由明确的下载/支付动作触发。
    void delta;
    return 0;
  }
  bundleChecked = true;
  installed = false;
  cancelPending = false;
  downloadElapsed = 0;
  pluginsDownloaded = false;
  plugins = new Set(['navigation', 'toolbar', 'assistant']);
  reset() { this.trapCount = 0; this.popupClicks = 0; this.page = 'desktop'; this.query = ''; this.ads = []; this.verified = false; this.opened = false; this.searched = false; this.wave = 0; this.bundleChecked = true; this.installed = false; this.cancelPending = false; this.downloadElapsed = 0; this.pluginsDownloaded = false; this.plugins = new Set(['navigation', 'toolbar', 'assistant']); this.resultsPage = 1; this.selectedSite = null; this.dangerActive = false; this.dangerElapsed = 0; }
  cancelInstaller() {
    if (!this.visibleAds.includes('toolbar') && !this.visibleAds.includes('setup')) return;
    this.cancelPending = true;
  }
  resolveCancel(keepCancellation: boolean) {
    if (!this.cancelPending) return false;
    if (this.ads.includes('setup')) {
      if (!keepCancellation) return this.finishSetup(true);
      return this.finishSetup(false);
    }
    if (!keepCancellation) return this.installInBackground();
    this.cancelPending = false;
    this.ads = this.ads.filter(ad => ad !== 'toolbar');
    return false;
  }
  installInBackground() {
    if (!this.ads.includes('toolbar')) return false;
    this.cancelPending = false;
    this.ads = this.ads.filter(ad => ad !== 'toolbar');
    this.downloadElapsed = 0;
    this.ads = [...new Set([...this.ads, 'download'])];
    return true;
  }
  tickDownload(delta: number) {
    if (!this.ads.includes('download')) return false;
    this.downloadElapsed = Math.min(2400, this.downloadElapsed + Math.max(0, delta));
    if (this.downloadElapsed < 2400) return false;
    this.ads = this.ads.filter(ad => ad !== 'download');
    this.ads.push('setup');
    return true;
  }
  finishSetup(installSoftware: boolean) {
    if (!this.ads.includes('setup')) return false;
    this.cancelPending = false;
    this.installed = installSoftware;
    this.pluginsDownloaded = this.plugins.size > 0;
    this.ads = this.ads.filter(ad => ad !== 'setup');
    const trapped = this.installed || this.pluginsDownloaded;
    if (trapped) this.ads.push('installed');
    return trapped;
  }
  open() { this.opened = true; this.page = 'search'; this.ads = ['prize', 'toolbar']; }
  search(query: string) {
    const trimmed = query.trim();
    if (!trimmed) return false;
    this.query = trimmed.slice(0, 120);
    this.back(); this.resultsPage = 1;
    this.searched = true; this.page = 'results'; this.ads = [...new Set([...this.ads, 'rpg', 'chat', 'security'])]; return true;
  }
  visit(official: boolean) {
    this.page = official ? 'official' : 'fake'; this.verified = false;
    this.ads = [...new Set([...this.ads, ...(official ? ['exit'] : ['security', 'rpg'])])];
  }
  close(id: string) {
    if (['toolbar', 'setup', 'download', 'cancel-confirm', 'setup-confirm'].includes(id) || !this.visibleAds.includes(id)) return;
    this.ads = this.ads.filter(ad => ad !== id);
    if (id === 'installed') this.installed = false;
  }
  get visibleAds() {
    return this.ads.flatMap(id => id === 'toolbar'
      ? this.ads.includes('prize') ? [] : [this.cancelPending ? 'cancel-confirm' : id]
      : id === 'setup' && this.cancelPending ? ['setup-confirm'] : [id]);
  }
  addTrap() { const id = 'bonus-' + ++this.wave; this.ads.push(id); }
  get complete() { return this.page === 'official' && this.verified && !this.dangerActive; }
}
