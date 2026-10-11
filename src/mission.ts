import { resultsFor, type SearchSite } from './search.ts';
export type Page = 'desktop' | 'search' | 'results' | 'fake' | 'official';
export class BrowserMission {
  page: Page = 'desktop';
  query = '';
  ads: string[] = [];
  verified = false;
  popupClicks = 0;
  recordPopupClick() { this.popupClicks++; }
  get achievement() { return this.complete && this.popupClicks === 0 ? '万花丛中过，片叶不沾身' : null; }
  opened = false;
  searched = false;
  wave = 0;
  resultsPage = 1;
  selectedSite: SearchSite | null = null;
  get searchResults() { return resultsFor(this.query); }
  dangerElapsed = 0;
  dangerActive = false;
  back() { const attacked = this.dangerActive; this.dangerActive = false; this.dangerElapsed = 0; this.ads = this.ads.filter(id => !id.startsWith('attack-')); if (attacked) this.ads = [...new Set([...this.ads, 'installed'])]; this.page = this.searched ? 'results' : 'search'; }
  visitResult(id: string) {
    const site = this.searchResults.find(site => site.id === id);
    if (!site || site.page !== this.resultsPage) return false;
    this.selectedSite = site; this.verified = false;
    this.page = site.kind === 'official' ? 'official' : 'fake';
    this.dangerActive = site.kind === 'phishing' || site.kind === 'malware';
    this.dangerElapsed = 0;
    if (this.dangerActive) {
      this.installed = true;
      this.ads = [...new Set([...this.ads, 'attack-install', 'attack-account', 'attack-warning', 'attack-download'])];
    }
    if (site.kind === 'official') this.ads = [...new Set([...this.ads, 'exit'])];
    return this.dangerActive;
  }
  tickDanger(delta: number) {
    if (!this.dangerActive) return 0;
    this.dangerElapsed += Math.max(0, delta);
    const hits = Math.floor(this.dangerElapsed / 650);
    this.dangerElapsed %= 650;
    return hits;
  }
  bundleChecked = true;
  installed = false;
  cancelPending = false;
  downloadElapsed = 0;
  pluginsDownloaded = false;
  plugins = new Set(['navigation', 'toolbar', 'assistant']);
  reset() { this.popupClicks = 0; this.page = 'desktop'; this.query = ''; this.ads = []; this.verified = false; this.opened = false; this.searched = false; this.wave = 0; this.bundleChecked = true; this.installed = false; this.cancelPending = false; this.downloadElapsed = 0; this.pluginsDownloaded = false; this.plugins = new Set(['navigation', 'toolbar', 'assistant']); this.resultsPage = 1; this.selectedSite = null; this.dangerActive = false; this.dangerElapsed = 0; }
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
