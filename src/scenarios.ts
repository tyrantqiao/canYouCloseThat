export const hobbyGroups = [
  { id: 'fast', name: '胶片摄景交流社', number: '73021608', approval: false, members: ['➕123888领相机', '日赚800找我', '群主·阿光'] },
  { id: 'real', name: '胶片摄影交流社', number: '73021680', approval: true, members: ['阿光｜群主', '周末拍照的林林', '暗房小陈'] },
  { id: 'copy', name: '胶片摄影交流社', number: '73021688', approval: true, members: ['➕123666领取补贴', '充值返十倍', '群主·阿光'] },
  ...Array.from({ length: 8 }, (_, i) => ({ id: 'lookalike-' + i, name: ['胶片摄影交流社①群', '胶片摄影交流社官方', '胶片摄影交流社福利群', '胶片摄影交友社', '胶片摄影交流群', '胶片摄影交流社新群', '胶片摄影交流社购片群', '胶片摄影交流社②群'][i], number: String(73021681 + i * 10), approval: i % 3 === 0, members: ['➕123' + (8000 + i) + '领取胶片', '付款返现找我', '群主·阿光'] })),
  { id: 'vip', name: '胶片摄影交流社VIP', number: '73021689', approval: false, members: ['免审核秒到账', '➕123999领福利', '群主·阿光'] },
];
export class ChatMission {
  query = ''; selected = ''; joined = new Set<string>(); page: 'groups' | 'question' | 'chat' | 'shop' = 'groups';
  chatting = false; checkout = false; testedFake = false; complete = false; message = '';
  get group() { return hobbyGroups.find(group => group.id === this.selected); }
  get results() { const query = this.query.trim(); return query ? hobbyGroups.filter(group => group.name.includes(query) || group.number.includes(query)) : []; }
  reset() { this.query = ''; this.selected = ''; this.joined.clear(); this.page = 'groups'; this.chatting = false; this.checkout = false; this.testedFake = false; this.complete = false; this.message = ''; }
  join(id: string) { const group = hobbyGroups.find(group => group.id === id); if (!group) return; this.selected = id; this.chatting = false; this.checkout = false; this.message = ''; this.page = group.approval && !this.joined.has(id) ? 'question' : 'chat'; if (!group.approval) this.joined.add(id); }
  answer(value: string) { if (value.trim() !== '银盐') { this.message = '回答不正确，请查阅朋友留下的群公告。'; return; } this.joined.add(this.selected); this.page = 'chat'; this.message = '入群申请已通过。'; }
  talk() { if (!this.joined.has(this.selected)) return; this.chatting = true; this.message = ''; }
  openShop() { if (!this.chatting) return; this.page = 'shop'; this.checkout = false; this.message = ''; }
  pay(password: string, code: string) {
    if (this.page !== 'shop' || !this.checkout || !password) { this.message = '请先查看商品并填写支付口令。'; return false; }
    if (this.selected !== 'real') { this.testedFake ||= password !== 'film2006'; this.message = '支付成功！订单已受理。'; return true; }
    if (code !== '4826') { this.message = '验证码不正确，支付未提交。'; return false; }
    if (password !== 'film2006') { this.message = '支付口令不正确，付款失败。'; return false; }
    this.complete = true; this.message = '付款成功！阿光已收到订单，胶片将于明天寄出。'; return false;
  }
}
export class DriveMission {
  page: 'search' | 'share' | 'files' | 'download' = 'search'; query = ''; selected = ''; unlocked = false; file = ''; complete = false; message = '';
  reset() { this.page = 'search'; this.query = ''; this.selected = ''; this.unlocked = false; this.file = ''; this.complete = false; this.message = ''; }
  open(id: string) { this.selected = id; this.page = 'share'; this.unlocked = false; this.message = ''; }
  unlock(code: string) { if (code !== 'xj06') { this.message = '提取码不正确。'; return; } this.unlocked = true; this.page = 'files'; this.message = ''; }
  choose(file: string) { if (!this.unlocked) return; this.file = file; this.page = 'download'; this.message = ''; }
  download() { if (this.page !== 'download') return false; if (this.selected !== 'real' || this.file !== 'pdf') { this.message = '下载的是安装程序，资料还没有拿到。可以返回重新选择。'; return true; } this.complete = true; this.message = '摄影入门讲义.pdf 已保存，资料任务完成！'; return false; }
}
export function renderChat(m: ChatMission) {
  const nav = '<button data-action="chat-home">← 查找群</button>';
  const note = '<aside class="task-note"><b>朋友的熊消息</b><p>搜索「胶片摄影」，找「胶片摄影交流社」，群号 <strong>73021680</strong>。入群问题答案在公告里：传统胶片的感光材料是<strong>银盐</strong>。找群主阿光购买一卷晨光 200 胶片。</p><p>阿光的店铺：<b>film-club.example</b>。熊钱包支付口令：<b>film2006</b>。</p></aside>';
  let body = '';
  if (m.page === 'groups') body = `<h2>🐻 某熊 · 查找兴趣群</h2><form data-task="chat-search"><label>关键词或群号<input name="query" value="${escapeText(m.query)}" placeholder="输入兴趣关键词" required maxlength="60"></label><button>查找</button></form><div class="task-results">${m.results.map(g => `<article><h3>${g.name}</h3><p>群号：${g.number} · ${g.approval ? '回答问题后审核' : '开放加入'}</p><button data-action="chat-join" data-id="${g.id}">加入群</button></article>`).join('') || '<p>输入关键词，查找与你兴趣相同的人。</p>'}</div>`;
  if (m.page === 'question') body = `${nav}<h2>${m.group!.name} · 入群申请</h2><p>群号 ${m.group!.number}</p><p>群公告：传统胶片靠银盐感光，请尊重原创，交流拍摄心得。</p><form data-task="chat-answer"><label>传统胶片的感光材料是什么？<input name="answer" required maxlength="30"></label><button>提交申请</button></form>`;
  if (m.page === 'chat') body = `${nav}<h2>${m.group!.name}</h2><p>群号 ${m.group!.number}</p><div class="chat-columns"><aside><b>群成员</b>${m.group!.members.map(name => `<p>${name}</p>`).join('')}</aside><section><div class="chat-message"><b>阿光｜群主</b><p>欢迎进群，有需要可以私聊我。</p></div><button data-action="chat-talk">私聊群主：想买一卷晨光 200</button>${m.chatting ? m.selected === 'real' ? '<div class="chat-message"><b>阿光</b><p>有现货，¥38。一卷起售，在我的店铺看详情，再用熊钱包付款即可。</p><button data-action="chat-shop">打开 film-club.example</button></div>' : '<div class="chat-message"><b>阿光</b><p>先把银行卡号和密码发我，直接帮你扣款。也可以到我的同款店铺自助支付。</p><button data-action="chat-secret">发送银行卡和密码</button><button data-action="chat-shop">打开 film-c1ub.example</button></div>' : ''}</section></div>`;
  if (m.page === 'shop') body = `<button data-action="chat-back">← 返回聊天</button><div class="shop-address">https://${m.selected === 'real' ? 'film-club' : 'film-c1ub'}.example/checkout</div><h2>阿光的胶片小店</h2><div class="product-card"><span>🎞️</span><h3>晨光 200 彩色负片</h3><p>36 张 · ISO 200 · 保存期限 2028 年</p><p>一卷 ¥38 · 普通邮寄 · 次日发货</p></div>${m.checkout ? `<form data-task="chat-pay"><h3>熊钱包 · 订单金额 ¥38</h3>${m.selected === 'real' ? '<label>验证码 <b class="captcha">4826</b><input name="code" autocomplete="off" maxlength="10" required></label>' : ''}<label>支付口令<input name="password" type="password" autocomplete="off" required maxlength="40"></label><button>确认付款</button></form>` : '<button data-action="chat-checkout">购买一卷 · 去付款</button>'}${m.testedFake ? '<button data-action="chat-report">举报这个收款页面并返回查找</button>' : ''}`;
  return `<div class="scenario-app">${note}<main>${body}<p class="task-message" role="status">${escapeText(m.message)}</p></main></div>`;
}
export function renderDrive(m: DriveMission) {
  const note = '<aside class="task-note"><b>林林的留言</b><p>帮我从云朵网盘找「周末摄影课」资料，分享者是<strong>暗房小陈</strong>，分享号 <strong>XC2006</strong>，提取码 <strong>xj06</strong>。</p><p>需要的是「摄影入门讲义.pdf」，2.4 MB。只拿讲义，晚上上课用。</p></aside>';
  let body = '<button data-action="drive-home">← 找分享</button>';
  if (m.page === 'search') body = `<h2>☁ 云朵网盘 · 找资料</h2><form data-task="drive-search"><label>资料关键词<input name="query" value="${escapeText(m.query)}" required maxlength="60"></label><button>查找分享</button></form>${m.query ? (['周末摄影课', '摄影', 'XC2006'].some(q => m.query.includes(q)) ? `<div class="task-results">${[['fake','周末摄影课·全套资源','资料搬运助手','XC2008'],['real','周末摄影课','暗房小陈','XC2006'],['vip','周末摄影课','高速下载客服','XC2060']].map(([id,title,owner,number]) => `<article><h3>${title}</h3><p>分享者：${owner} · 分享号 ${number}</p><button data-action="drive-open" data-id="${id}">查看分享</button></article>`).join('')}</div>` : '<p>没有找到相关分享，换一个关键词试试。</p>') : '<p>查找朋友分享的课程资料。</p>'}`;
  if (m.page === 'share') body += `<h2>周末摄影课</h2><p>分享者：${m.selected === 'real' ? '暗房小陈 · XC2006' : m.selected === 'fake' ? '资料搬运助手 · XC2008' : '高速下载客服 · XC2060'}</p><form data-task="drive-code"><label>请输入提取码<input name="code" required maxlength="20"></label><button>提取文件</button></form>`;
  if (m.page === 'files') body += `<h2>分享文件</h2><div class="task-results">${[['exe','摄影入门讲义.pdf.exe','应用程序 · 2.4 MB'],['pdf','摄影入门讲义.pdf','PDF 文档 · 2.4 MB'],['zip','摄影入门讲义_高速下载.zip','压缩文件 · 680 KB']].map(([id,name,type]) => `<article><h3>${name}</h3><p>${type}</p><button data-action="drive-file" data-id="${id}">选择文件</button></article>`).join('')}</div>`;
  if (m.page === 'download') body += `<button data-action="drive-files">← 返回文件列表</button><h2>${m.file === 'pdf' ? '摄影入门讲义.pdf' : m.file === 'exe' ? '摄影入门讲义.pdf.exe' : '摄影入门讲义_高速下载.zip'}</h2><p>选择下载方式</p><div class="download-options"><article><h3>高速下载</h3><p>使用云朵加速器，需下载并安装客户端；默认添加桌面导航。</p><button data-action="drive-fast">立即高速下载</button></article><article><h3>普通下载</h3><p>${m.selected === 'real' ? '直接保存所选文件，无需客户端。' : '先下载资源助手_setup.exe，运行后获取资料。'}</p><button data-action="drive-save">普通下载</button></article></div>`;
  return `<div class="scenario-app">${note}<main>${body}<p class="task-message" role="status">${escapeText(m.message)}</p></main></div>`;
}
function escapeText(value: string) { return value.replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]!)); }
