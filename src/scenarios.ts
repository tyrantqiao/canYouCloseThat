export const hobbyGroups = [
  { id: 'fast', promoted: true, name: '胶片摄景交流社', number: '73021608', approval: false, members: ['➕123888领相机', '日赚800找我', '群主·阿光'] },
  { id: 'real', promoted: false, name: '胶片摄影交流社', number: '73021680', approval: true, members: ['阿光｜群主', '周末拍照的林林', '暗房小陈'] },
  { id: 'copy', promoted: true, name: '胶片摄影交流社', number: '73021688', approval: true, members: ['➕123666领取补贴', '充值返十倍', '群主·阿光'] },
  ...Array.from({ length: 8 }, (_, i) => ({ id: 'lookalike-' + i, promoted: i < 2, name: ['胶片摄影交流社①群', '胶片摄影交流社官方', '胶片摄影交流社福利群', '胶片摄影交友社', '胶片摄影交流群', '胶片摄影交流社新群', '胶片摄影交流社购片群', '胶片摄影交流社②群'][i], number: String(73021681 + i * 10), approval: i % 3 === 0, members: ['➕123' + (8000 + i) + '领取胶片', '付款返现找我', '群主·阿光'] })),
  { id: 'vip', promoted: true, name: '胶片摄影交流社VIP', number: '73021689', approval: false, members: ['免审核秒到账', '➕123999领福利', '群主·阿光'] },
];
export class ChatMission {
  friendId = 'lin';
  get friend() { return bearFriends.find(f => f.id === this.friendId) || bearFriends[0]; }
  opened = false; minimized = false; contacts = true; unread = true; friendChat = false;
  private transcripts = new Map<string, string[]>();
  get sentMessages() {
    const key = this.friendChat ? 'friend:' + this.friendId : (this.chatting ? 'private:' : 'group:') + this.selected;
    if (!this.transcripts.has(key)) this.transcripts.set(key, []);
    return this.transcripts.get(key)!;
  }
  close() { this.opened = false; this.minimized = false; this.contacts = true; this.friendChat = false; }
  showFriend(id: string) {
    if (!bearFriends.some(f => f.id === id)) return;
    this.friendId = id; this.friendChat = true; this.contacts = false; this.page = 'groups';
    if (id === 'lin') this.unread = false;
    this.message = '';
  }
  open() { this.opened = true; this.minimized = false; }
  query = ''; selected = ''; joined = new Set<string>(); page: 'groups' | 'question' | 'chat' | 'shop' = 'groups';
  chatting = false; checkout = false; testedFake = false; complete = false; message = '';
  get group() { return hobbyGroups.find(group => group.id === this.selected); }
  get results() {
    const query = this.query.trim();
    if (!query) return [];
    // 竞价推广排在自然结果前；正确群靠后，精确群号仍只返回匹配项。
    return hobbyGroups.filter(group => group.name.includes(query) || group.number.includes(query))
      .sort((a, b) => Number(b.promoted) - Number(a.promoted) || Number(a.id === 'real') - Number(b.id === 'real'));
  }
  reset() { this.friendId = 'lin'; this.opened = false; this.minimized = false; this.contacts = true; this.unread = true; this.friendChat = false; this.transcripts.clear(); this.query = ''; this.selected = ''; this.joined.clear(); this.page = 'groups'; this.chatting = false; this.checkout = false; this.testedFake = false; this.complete = false; this.message = ''; }
  join(id: string) { const group = hobbyGroups.find(group => group.id === id); if (!group) return; this.open(); this.contacts = false; this.friendChat = false; this.selected = id; this.chatting = false; this.checkout = false; this.message = ''; this.page = group.approval && !this.joined.has(id) ? 'question' : 'chat'; if (!group.approval) this.joined.add(id); }
  answer(value: string) { if (this.page !== 'question' || !this.group) return; if (value.trim() !== '银盐') { this.message = '回答不正确，请查阅朋友留下的群公告。'; return; } this.joined.add(this.selected); this.page = 'chat'; this.message = '入群申请已通过。'; }
  talk() { if (this.page !== 'chat' || !this.joined.has(this.selected)) return; this.friendChat = false; this.chatting = true; this.message = ''; }
  openShop() { if (!this.chatting) return; this.page = 'shop'; this.checkout = false; this.message = ''; }
  pay(password: string, code: string) {
    if (this.page !== 'shop' || !this.checkout || !password) { this.message = '请先查看商品并填写支付口令。'; return false; }
    if (this.selected !== 'real') { this.testedFake ||= password !== 'film2006'; this.message = '支付成功！订单已受理。'; return true; }
    if (code !== '4826') { this.message = '验证码不正确，支付未提交。'; return false; }
    if (password !== 'film2006') { this.message = '支付口令不正确，付款失败。'; return false; }
    this.complete = true; this.message = '付款成功！阿光已收到订单，胶片将于明天寄出。'; return false;
  }
}
export const driveShares = [
  ['fake', '周末摄影课·全套资源', '资料搬运助手', 'XC2008'],
  ['real', '周末摄影课', '暗房小陈', 'XC2006'],
  ['vip', '周末摄影课', '高速下载客服', 'XC2060'],
];
export const driveFiles = [
  ['exe', '摄影入门讲义.pdf.exe', '应用程序 · 2.4 MB'],
  ['pdf', '摄影入门讲义.pdf', 'PDF 文档 · 2.4 MB'],
  ['zip', '摄影入门讲义_高速下载.zip', '压缩文件 · 680 KB'],
];
export const driveApps = [
  ['speed', '云朵网盘极速版', '极速网络', 'yun-duo.example'],
  ['cloud', '云端网盘', '云端资源中心', 'cloud-drive.example'],
  ['real', '云朵网盘', '云朵软件', 'drive.yunduo.example'],
  ['vip', '云朵网盘 VIP', '畅享下载', 'yunduo-vip.example'],
  ['box', '云朵资料盒', '资料盒网络', 'yunduo-box.example'],
  ['disk', '云朵云盘', '云盘分享中心', 'yunpan.example'],
  ['helper', '云朵下载助手', '资源加速中心', 'yunduo-helper.example'],
];
export class DriveMission {
  activeApp = ''; minimized = false; theme: 'win7' | 'xp' = 'win7'; maximized = false; startMenu = false;
  launch(id: string) { if (!driveApps.some(([key]) => key === id)) return; this.activeApp = id; this.minimized = false; this.startMenu = false; this.message = ''; }
  closeApp() { this.activeApp = ''; this.minimized = false; this.message = ''; }
  commitApp() { if (!this.activeApp || this.activeApp === 'real' || this.minimized) return false; this.message = '安装的是推荐组件，讲义还没有保存。关闭窗口后可以重新寻找网盘。'; return true; }

  page: 'search' | 'share' | 'files' | 'download' = 'search'; query = ''; selected = ''; unlocked = false; file = ''; complete = false; message = '';
  reset() { this.theme = 'win7'; this.maximized = false; this.startMenu = false; this.activeApp = ''; this.minimized = false; this.page = 'search'; this.query = ''; this.selected = ''; this.unlocked = false; this.file = ''; this.complete = false; this.message = ''; }
  get results() {
    const query = this.query.trim();
    if (!query) return [];
    return driveShares.filter(([, title, , number]) => query.toUpperCase().startsWith('XC') ? number === query.toUpperCase() : title.includes(query));
  }
  open(id: string) { if (this.activeApp !== 'real' || this.minimized) return; if (!driveShares.some(([key]) => key === id)) return; this.selected = id; this.page = 'share'; this.unlocked = false; this.file = ''; this.message = ''; }
  unlock(code: string) { if (this.activeApp !== 'real' || this.minimized) return; if (this.page !== 'share' || !this.selected) return; if (code !== 'xj06') { this.message = '提取码不正确。'; return; } this.unlocked = true; this.page = 'files'; this.message = ''; }
  choose(file: string) { if (this.activeApp !== 'real' || this.minimized) return; if (!this.unlocked || !['files', 'download'].includes(this.page) || !driveFiles.some(([key]) => key === file)) return; this.file = file; this.page = 'download'; this.message = ''; }
  download() { if (this.activeApp !== 'real' || this.minimized) return false; if (this.page !== 'download') return false; if (this.selected !== 'real' || this.file !== 'pdf') { this.message = '下载的是安装程序，资料还没有拿到。可以返回重新选择。'; return true; } this.complete = true; this.message = '摄影入门讲义.pdf 已保存，资料任务完成！'; return false; }
}
function renderChatContent(m: ChatMission) {
  const nav = '<button data-action="chat-home">← 查找群</button>';
  const note = '<aside class="task-note"><b>朋友的熊消息</b><p>搜索「胶片摄影」，找「胶片摄影交流社」，群号 <strong>73021680</strong>。入群问题答案在公告里：传统胶片的感光材料是<strong>银盐</strong>。找群主阿光购买一卷晨光 200 胶片。</p><p>阿光的店铺：<b>film-club.example</b>。熊钱包支付口令：<b>film2006</b>。</p></aside>';
  let body = '';
  if (m.page === 'groups') body = `<h2>🐻‍❄️ 某熊 · 查找兴趣群</h2><form data-task="chat-search"><label>关键词或群号<input name="query" value="${escapeText(m.query)}" placeholder="输入兴趣关键词" required maxlength="60"></label><button>查找</button></form><div class="task-results">${m.results.map(g => `<article class="${g.promoted ? 'group-promoted' : ''}">${g.promoted ? '<span class="group-promotion" aria-label="推广">推</span>' : ''}<h3>${g.name}</h3><p>群号：${g.number} · ${g.approval ? '回答问题后审核' : '开放加入'}</p><button data-action="chat-join" data-id="${g.id}">加入群</button></article>`).join('') || '<p>输入关键词，查找与你兴趣相同的人。</p>'}</div>`;
  if (m.page === 'question') body = `${nav}<h2>${m.group!.name} · 入群申请</h2><p>群号 ${m.group!.number}</p><p>群公告：传统胶片靠银盐感光，请尊重原创，交流拍摄心得。周六 14:00 老邮局门口扫街，带相机和片筒；照片压到 800 像素再传群相册。</p><form data-task="chat-answer"><label>传统胶片的感光材料是什么？<input name="answer" required maxlength="30"></label><button>提交申请</button></form>`;
  if (m.page === 'chat') body = renderConversation(m);
  if (m.page === 'shop') body = `<button data-action="chat-back">← 返回聊天</button><div class="shop-address">https://${m.selected === 'real' ? 'film-club' : 'film-c1ub'}.example/checkout</div><h2>阿光的胶片小店</h2><div class="product-card"><span>🎞️</span><h3>晨光 200 彩色负片</h3><p>135 彩色负片 · 36 张 · ISO 200 · 保存期限 2008 年</p><p>一卷 ¥38 · 普通邮寄 · 次日发货</p><p>柜台备忘：避热保存，拍完留好片筒。冲洗和扫描另计，不必把相机寄给店主。</p></div>${m.checkout ? `<form data-task="chat-pay"><h3>熊钱包 · 订单金额 ¥38</h3>${m.selected === 'real' ? '<label>验证码 <b class="captcha">4826</b><input name="code" autocomplete="off" maxlength="10" required></label>' : ''}<label>支付口令<input name="password" type="password" autocomplete="off" required maxlength="40"></label><button>确认付款</button></form>` : '<button data-action="chat-checkout">购买一卷 · 去付款</button>'}${m.testedFake ? '<button data-action="chat-report">举报这个收款页面并返回查找</button>' : ''}`;
  return `<div class="scenario-app">${note}<main>${body}<p class="task-message" role="status">${escapeText(m.message)}</p></main></div>`;
}
function renderDriveContent(m: DriveMission) {
  const note = '<aside class="task-note"><b>林林的留言</b><p>帮我从云朵网盘找「周末摄影课」资料，分享者是<strong>暗房小陈</strong>，分享号 <strong>XC2006</strong>，提取码 <strong>xj06</strong>。</p><p>需要的是「摄影入门讲义.pdf」，2.4 MB。只拿讲义，晚上上课用。</p></aside>';
  let body = '<button data-action="drive-home">← 找分享</button>';
  if (m.page === 'search') body = `<h2>☁ 云朵网盘 · 找资料</h2><p class="archive-note">班级 BBS / 资源共享区：邮件附件放不下，改传网盘。只需要讲义，别把下载器当成课程资料。</p><form data-task="drive-search"><label>资料关键词<input name="query" value="${escapeText(m.query)}" required maxlength="60"></label><button>查找分享</button></form>${m.query ? (m.results.length ? `<div class="task-results">${m.results.map(([id,title,owner,number]) => `<article><h3>${title}</h3><p>分享者：${owner} · 分享号 ${number}</p><button data-action="drive-open" data-id="${id}">查看分享</button></article>`).join('')}</div>` : '<p>没有找到相关分享，换一个关键词试试。</p>') : '<p>查找朋友分享的课程资料。</p>'}`;
  if (m.page === 'share') body += `<h2>周末摄影课</h2><p>分享者：${m.selected === 'real' ? '暗房小陈 · XC2006' : m.selected === 'fake' ? '资料搬运助手 · XC2008' : '高速下载客服 · XC2060'}</p><form data-task="drive-code"><label>请输入提取码<input name="code" required maxlength="20"></label><button>提取文件</button></form>`;
  if (m.page === 'files') body += `<h2>分享文件</h2><p class="archive-note">上传备注 / 2012-10-11：从课代表的 U 盘整理，24 页黑白讲义，含接触印样和曝光记录表。打印选 A4 双面，文件名里带 XC2006 是社团编号。</p><div class="task-results">${driveFiles.map(([id,name,type]) => `<article><h3>${name}</h3><p>${type}</p><button data-action="drive-file" data-id="${id}">选择文件</button></article>`).join('')}</div>`;
  if (m.page === 'download') body += `<button data-action="drive-files">← 返回文件列表</button><h2>${m.file === 'pdf' ? '摄影入门讲义.pdf' : m.file === 'exe' ? '摄影入门讲义.pdf.exe' : '摄影入门讲义_高速下载.zip'}</h2><p>选择下载方式</p><div class="download-options"><article><h3>高速下载</h3><p>使用云朵加速器，需下载并安装客户端；默认添加桌面导航。</p><button data-action="drive-fast">立即高速下载</button></article><article><h3>普通下载</h3><p>${m.selected === 'real' ? '直接保存所选文件，无需客户端。保存到“我的文档 / 周末摄影课”；以完整扩展名和文件类型为准。' : '先下载资源助手_setup.exe，运行后获取资料。'}</p><button data-action="drive-save">普通下载</button></article></div>`;
  return `<div class="scenario-app">${note}<main>${body}<p class="task-message" role="status">${escapeText(m.message)}</p></main></div>`;
}
function escapeText(value: string) { return value.replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]!)); }
export function renderChat(m: ChatMission) {
  const taskbar = `<div class="bear-taskbar"><span class="bear-start">▦ 开始</span><button data-action="chat-open" class="${m.unread ? 'bear-unread' : ''}">🐻‍❄️ 某熊${m.unread ? ' · 新消息' : ''}</button><span class="bear-tray">🔊　🐻‍❄️　20:06</span></div>`;
  const desktop = '<div class="bear-wallpaper"><button class="bear-desktop-icon" data-action="chat-open"><span>🐻‍❄️</span>某熊聊天</button><div class="bear-desktop-caption">有事没事，熊一下。<small>我的电脑　／　回收站</small></div></div>';
  if (!m.opened || m.minimized) return `<div class="scenario-app bear-scene"><aside class="task-note"><b>朋友的熊消息</b><p>搜索「胶片摄影」，找「胶片摄影交流社」，群号 <strong>73021680</strong>。回答公告中的入群问题，找阿光购买晨光 200 胶片。</p><p>店铺：film-club.example<br>支付口令：film2006</p></aside><main>${desktop}${taskbar}</main></div>`;
  const content = renderChatContent(m);
  const start = content.indexOf('<main>') + 6;
  const end = content.lastIndexOf('</main>');
  let chatBody = m.contacts ? renderBearContacts(m) : content.slice(start,end);
  if (m.friendChat) chatBody = renderConversation(m);
  return `<div class="scenario-app bear-scene">${content.slice(content.indexOf('<aside'),content.indexOf('</aside>')+8)}<main>${desktop}<section class="bear-window ${m.contacts ? 'bear-contacts-window' : ''}"><header class="bear-title"><b>🐻‍❄️ 某熊 ${m.contacts ? '' : '· '+(m.friendChat ? '与'+m.friend.name+'聊天' : m.page==='groups' ? '查找群' : m.page==='chat' ? m.chatting ? '与阿光聊天' : '群聊天' : m.page==='question' ? '加入群' : '店铺浏览器')}</b><div><button data-action="chat-minimize" aria-label="最小化某熊">_</button><button data-action="chat-close" aria-label="关闭某熊窗口">×</button></div></header>${!m.contacts ? '<nav class="bear-window-nav"><button data-action="chat-contacts">联系人</button><button data-action="chat-find">查找群</button></nav>' : ''}<div class="bear-window-body">${chatBody}</div></section>${taskbar}</main></div>`;
}
function renderConversation(m: ChatMission) {
  const friend = m.friendChat;
  const privateChat = friend || m.chatting;
  const name = friend ? m.friend.name : privateChat ? '阿光' : m.group!.name;
  const line = (who: string, text: string, mine = false) => `<div class="qq-record ${mine ? 'qq-record-mine' : ''}"><div class="qq-record-meta">${who}<time>20:06:18</time></div><div class="qq-record-text">${text}</div></div>`;
  let history = friend ? line('林林', '胶片群找到了！群号 73021680，找群主阿光买一卷晨光 200。入群题读群公告就知道啦。') + line('林林', '阿光店铺是 film-club.example，别认错了。网吧快到下机时间，我把群号写在消息记录里了，别只凭群头像认人。') : privateChat ? line('聽風づ北極星', '你好，想买一卷晨光 200，还有现货吗？', true) + (m.selected === 'real' ? line('阿光', '有现货，¥38。周六去老邮局扫街的话，明天就能寄出；冲洗扫描另计。一卷起售，在我的店铺看详情，再用熊钱包付款即可。') + line('阿光', '<button class="qq-message-link" data-action="chat-shop">https://film-club.example</button>') : line('阿光', '先把银行卡号和密码发我，直接帮你扣款。也可以到我的同款店铺自助支付。') + line('阿光', '<button class="qq-message-link" data-action="chat-shop">https://film-c1ub.example</button>')) : '<div class="qq-system-line">你已加入群聊，和大家打个招呼吧。</div>' + line('阿光（群主）', '欢迎进群，请先看群公告。有胶片购买需求可以私聊我。');
  if (friend && m.friendId !== 'lin') history = line(name, escapeText(m.friend.greeting));
  history += m.sentMessages.map(text=>line('聽風づ北極星',escapeText(text),true)).join('');
  const side = privateChat ? `<div class="qq-contact-card"><span>${friend ? m.friend.avatar : '🎞️'}</span><b>${name}</b><small>${friend && !m.friend.online ? '○ 离线' : '● 在线'}</small>${friend ? '<div class="bear-level">'+m.friend.level+'</div>'+diamondIcons(m.friend.diamonds) : ''}<p>${friend ? escapeText(m.friend.signature) : '拍胶片，慢慢来。'}</p></div>` : `<div class="qq-group-notice"><b>群公告</b><p>传统胶片靠银盐感光。周六 14:00 老邮局门口扫街；照片压到 800 像素再传群相册。请尊重原创。</p><b>群成员（${m.group!.members.length}）</b></div><div class="qq-members">${m.group!.members.map(member=>`<div><span>${member.includes('群主')?'👑':'👤'}</span>${member}${member.includes('群主')?'<button data-action="chat-talk">私聊</button>':''}</div>`).join('')}</div>`;
  return `<div class="qq-conversation"><header class="qq-conversation-head"><span>${privateChat ? '💬' : '👥'}</span><div><h2>${name}</h2><small>${privateChat ? friend && !m.friend.online ? '离线 · 可以留言' : '在线 · 与好友聊天' : '群号 '+m.group!.number}</small></div><span class="qq-head-tools">语音　视频</span></header><div class="qq-conversation-grid"><section class="qq-chat-main"><div class="qq-history" role="log" aria-label="聊天记录">${history}</div><form data-task="chat-send" class="qq-compose"><div class="qq-edit-tools"><span>𝑨</span><span>☺</span><span>✂</span><span>▧</span><span>▱</span><span class="qq-history-label">◷ 消息记录</span></div><label class="qq-compose-label" for="bear-chat-input">输入消息</label><textarea id="bear-chat-input" name="message" aria-label="输入消息" maxlength="300" placeholder="${privateChat ? '输入消息…' : '想买胶片？点击群主旁的私聊。'}"></textarea><div class="qq-sendbar">${friend ? '<button type="button" data-action="chat-find">查找群</button>' : !privateChat ? '<button type="button" data-action="chat-talk">私聊群主</button>' : m.selected !== 'real' ? '<button type="button" data-action="chat-secret">发送银行卡和密码</button>' : ''}<button type="button" data-action="chat-contacts">关闭(C)</button><button type="submit" class="qq-send-button">发送(S)</button></div></form></section><aside class="qq-chat-side">${side}</aside></div></div>`;
}
export const bearFriends = [
  { id:'lin', name:'聽風の林林', avatar:'📷', group:'同窗旧梦', online:true, signature:'把青春裝進相機裡。', level:'☀ ☾ ★', diamonds:['yellow','red'], greeting:'胶片群找到了，来看看！' },
  { id:'rain', name:'聽雨づ落花', avatar:'🌧️', group:'同窗旧梦', online:true, signature:'下雨的時候，想起那個夏天。', level:'☾ ☾ ★', diamonds:['blue'], greeting:'在嗎？今晚空間更新了新照片，記得踩一下~' },
  { id:'star', name:'尐星星、卟哭', avatar:'🌟', group:'同窗旧梦', online:false, signature:'莪的世界，伱曾來過。', level:'☾ ★ ★', diamonds:['pink'], greeting:'我去写作业啦，晚点回来。' },
  { id:'wind', name:'聽風者ゞ無痕', avatar:'🍃', group:'網絡情緣', online:true, signature:'風過無痕，心有回音。', level:'☀ ☀ ★', diamonds:['green','blue'], greeting:'刚换了空间背景音乐，好听吧？' },
  { id:'snow', name:'葬愛メ浅雪', avatar:'❄️', group:'網絡情緣', online:false, signature:'不是每一場雪，都有人等。', level:'☀ ☾', diamonds:['purple','red'], greeting:'自动回复：本人不在，有事留言。' },
  { id:'night', name:'℡夜、未央', avatar:'🌙', group:'網絡情緣', online:true, signature:'熬最晚的夜，聽最老的歌。', level:'☀ ☾ ★ ★', diamonds:['green'], greeting:'来听歌吗？我正在循环那首老歌。' },
  { id:'frame', name:'光影の旅人', avatar:'🎞️', group:'攝影同好', online:true, signature:'一卷膠片，三十六個故事。', level:'☾ ☾ ☾', diamonds:['yellow'], greeting:'周末扫街？记得带相机，胶片群里的阿光有现货。' },
  { id:'sea', name:'看海の小熊', avatar:'🌊', group:'攝影同好', online:false, signature:'下一站，去看海。', level:'☾ ★', diamonds:[], greeting:'自动回复：正在外拍，回来再聊。' },
];
function diamondIcons(colors: string[]) {
  const labels: Record<string,string> = {yellow:'黄钻',red:'红钻',blue:'蓝钻',green:'绿钻',pink:'粉钻',purple:'紫钻'};
  return `<span class="bear-diamonds">${colors.map(color=>`<span class="bear-diamond diamond-${color}" role="img" aria-label="${labels[color]}" title="${labels[color]}">◆</span>`).join('')}</span>`;
}
function renderBearContacts(m: ChatMission) {
  return `<div class="bear-profile"><span>🐻‍❄️</span><div><b>聽風づ北極星</b><p>● 我在线上　⌄</p><small>把回憶，寫進風裡。</small><div class="bear-profile-honors"><span class="bear-level" title="等级 23" aria-label="等级 23：一个太阳、一个月亮、三颗星">☀ ☾ ★ ★ ★</span><b class="bear-vip">VIP 6</b>${diamondIcons(['yellow','red','blue','green'])}</div></div></div><nav class="bear-tabs"><b>联系人</b><span>群 / 讨论组</span></nav><div class="bear-contact-list">${['同窗旧梦','網絡情緣','攝影同好'].map(group=>{const friends=bearFriends.filter(f=>f.group===group);return `<details class="bear-friend-group" ${group==='同窗旧梦'?'open':''}><summary>${group} <small>(${friends.filter(f=>f.online).length}/${friends.length})</small></summary>${friends.map(f=>`<button data-action="chat-friend" data-id="${f.id}" class="${f.online?'':'bear-offline'}"><span class="bear-friend-avatar">${f.avatar}<i class="bear-presence"></i></span><div class="bear-friend-info"><b>${f.name}</b>${diamondIcons(f.diamonds)}<small>${f.id==='lin'&&m.unread?'新消息：胶片群找到了！':f.signature}</small></div>${f.id==='lin'&&m.unread?'<i class="bear-unread-count">1</i>':''}</button>`).join('')}</details>`;}).join('')}<details class="bear-friend-group"><summary>陌生人 <small>(0/0)</small></summary><p>暂时没有陌生人</p></details><details class="bear-friend-group" open><summary>我的群 <small>(${m.joined.size})</small></summary>${[...m.joined].map(id=>`<button data-action="chat-join" data-id="${id}">👥 ${hobbyGroups.find(g=>g.id===id)?.name}</button>`).join('')||'<p>还没有加入的群</p>'}</details></div><div class="bear-toolbar"><button data-action="chat-find">🔎 查找 / 加群</button><span>⚙　☰　♪</span></div>`;
}

export function renderDrive(m: DriveMission) {
  const icons = driveApps.map(([id,name,owner]) => `<button class="drive-shortcut" data-action="drive-launch" data-id="${id}"><span class="drive-app-icon drive-icon-${id}" aria-hidden="true"></span><b>${name}</b><small>${owner}</small></button>`).join('');
  const bar = `<div class="drive-taskbar"><button class="drive-start" data-action="drive-start" aria-label="开始菜单" aria-expanded="${m.startMenu}"><span class="drive-start-mark" aria-hidden="true">▦</span><span>开始</span></button><div class="drive-task-buttons">${driveApps.filter(([id]) => ['speed','vip','helper',m.activeApp].includes(id)).map(([id,name]) => `<button data-action="drive-launch" data-id="${id}" aria-pressed="${id === m.activeApp && !m.minimized}"><span class="drive-app-icon drive-icon-${id}" aria-hidden="true"></span><span>${name}</span></button>`).join('')}</div><div class="drive-tray"><span aria-label="网络已连接">▥</span><span aria-label="音量">♪</span><time>18:40<small>2012/10/11</small></time></div></div>`;
  const app = driveApps.find(([id]) => id === m.activeApp);
  let window = '';
  if (app && !m.minimized) {
    const content = renderDriveContent(m);
    const body = m.activeApp === 'real' ? content.slice(content.indexOf('<main>')+6, content.lastIndexOf('</main>')) : `<h2>${app[1]} · 资料中心</h2><p>周末摄影课 · 全套讲义已收录</p><p>安装资源推荐组件后获取资料。组件会添加桌面导航，并更改默认搜索。</p><button data-action="drive-app-install">安装组件并获取资料</button><p class="task-message" role="status">${escapeText(m.message)}</p>`;
    window = `<section class="bear-window drive-window ${m.maximized ? 'drive-maximized' : ''}" aria-label="${app[1]}"><header class="bear-title"><b><span class="drive-app-icon drive-icon-${app[0]}" aria-hidden="true"></span>${app[1]}</b><div><button data-action="drive-minimize" aria-label="最小化网盘">−</button><button data-action="drive-maximize" aria-label="${m.maximized ? '还原网盘窗口' : '最大化网盘'}">□</button><button data-action="drive-close" aria-label="关闭网盘">×</button></div></header><div class="drive-identity">发布者：${app[2]} · 服务地址：${app[3]}</div><div class="bear-window-body">${body}</div></section>`;
  }
  return `<div class="scenario-app drive-scene drive-theme-${m.theme}"><main><div class="drive-desktop"><div class="drive-shortcuts">${icons}</div><aside class="drive-memo"><div class="drive-memo-title">便笺</div><b>林林的 BBS 留言 · 2012-10-11</b><p>机房装了好多下载工具。用我们一直用的云朵网盘，发布者云朵软件，服务地址 drive.yunduo.example。</p><p>找暗房小陈的「周末摄影课」，分享号 XC2006，提取码 xj06。只要 2.4 MB 的摄影入门讲义.pdf，晚上打印 A4 双面。</p></aside><div class="drive-personalize" aria-label="桌面外观"><span>桌面外观</span><button data-action="drive-theme" data-theme="win7" aria-pressed="${m.theme === 'win7'}">Windows 7</button><button data-action="drive-theme" data-theme="xp" aria-pressed="${m.theme === 'xp'}">Windows XP</button></div></div>${window}${m.startMenu ? `<nav class="drive-start-menu" aria-label="开始菜单"><header>机房同学</header>${driveApps.map(([id,name]) => `<button data-action="drive-launch" data-id="${id}"><span class="drive-app-icon drive-icon-${id}" aria-hidden="true"></span>${name}</button>`).join('')}<footer>所有程序 · 网盘工具</footer></nav>` : ''}${bar}</main></div>`;
}
