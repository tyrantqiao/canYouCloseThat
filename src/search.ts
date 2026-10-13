export const searchResults = [
  {id:'download',page:1,kind:'promotion',title:'星河浏览器官方网站 — 高速下载中心',domain:'xinghe-download.example',description:'极速装机联盟提供软件下载、安装服务。',publisher:'极速装机联盟'},
  {id:'vip',page:1,kind:'promotion',title:'【星河浏览器官网】最新版下载',domain:'xinghe.example.soft-vip.example',description:'会员专享极速通道，软件安装服务。',publisher:'软件会员中心'},
  {id:'fish',page:1,kind:'phishing',title:'星河浏览器账户中心 — 领取正版激活码',domain:'xinghe-account.example',description:'登录账户领取激活码，验证后开放下载。',publisher:'星河账户服务中心'},
  {id:'typo',page:1,kind:'lookalike',title:'星河游览器 — 官方极速版',domain:'xinghe-youlan.example',description:'星河游览器，快捷导航与精选软件推荐。',publisher:'星河游览科技'},
  {id:'virus',page:1,kind:'malware',title:'星河浏览器绿色破解版 — 免安装',domain:'xinghe-crack.example',description:'破解补丁与高速加速包，解压即可使用。',publisher:'绿色资源联盟'},
  {id:'game',page:2,kind:'game',title:'星河传说 — 浏览器也能玩的传奇',domain:'play.xinghe-legend.example',description:'全新一区，一刀999，兄弟等你上线！',publisher:'星河传说运营组'},
  {id:'review',page:2,kind:'article',title:'星河浏览器好用吗？网友使用记录',domain:'bbs.surfing.example/thread/2006',description:'版本体验、官网域名与发布者讨论。',publisher:'冲浪论坛'},
  {id:'official',page:2,kind:'official',title:'星河浏览器 - 星河实验室',domain:'xinghe.example',description:'产品说明、版本日志与官方支持。',publisher:'星河实验室'},
  {id:'news',page:2,kind:'article',title:'星河实验室发布首款浏览器',domain:'news.surfing.example/xinghe',description:'软件发布新闻与产品介绍。',publisher:'冲浪日报'},
] as const;

export type SearchSite = {
  id: string; page: number; kind: typeof searchResults[number]['kind'];
  title: string; domain: string; description: string; publisher: string;
};

export function resultsFor(query: string): readonly SearchSite[] {
  if (/星河|星禾|星合|xinghe/i.test(query)) return searchResults;
  const topic = query.slice(0, 60);
  const theme = /你好|您好|hello|hi\b/i.test(query) ? ['你好牌电暖器 — 温暖从问候开始', '网友求助：打了你好，对方三天没回']
    : /天气|下雨|温度/.test(query) ? ['天气不好？屠龙新区全年晴天', '明天带伞吗？楼主已经晒起了被子']
    : /音乐|歌曲|mp3|周杰伦/i.test(query) ? ['MP3下载之前，先升级八个播放器', '求歌名，回复：先把电脑重启一下']
    : /游戏|传奇|攻略/.test(query) ? ['不看攻略了，直接领取屠龙宝刀', '游戏攻略：第一步，关闭老板的聊天窗口']
    : /课表|学习|作业|考试/.test(query) ? ['学习太累？来新区领取满级账号', '求课表，楼下回复了一张菜谱']
    : ['热门推荐：不管你搜什么，都送你一把屠龙刀', '网友求助：这个问题最后变成了装机讨论'];
  return [
    {id:'q-ad',page:1,kind:'promotion',title:`${topic} — 官方推荐高速服务`,domain:'recommend-download.example',description:'热门关键词专属推荐！下载助手后立即查看。',publisher:'极速推荐联盟'},
    {id:'q-shop',page:1,kind:'promotion',title:theme[0],domain:'shop.surfing.example',description:'限时优惠，开通会员享受更多推荐。',publisher:'好东西商城'},
    {id:'q-game',page:1,kind:'game',title:`${topic}没找到？兄弟先来玩传奇`,domain:'play.legend-2006.example',description:'新区开启，一刀999，所有问题都能靠装备解决。',publisher:'传奇运营组'},
    {id:'q-fish',page:1,kind:'phishing',title:`${topic}资料中心 — 登录领取完整答案`,domain:'account-answer.example',description:'账户验证后免费领取专属资料包。',publisher:'资料认证中心'},
    {id:'q-tool',page:1,kind:'lookalike',title:`${topic}专用游览器 — 极速版`,domain:'youlan-helper.example',description:'看不到结果？安装专用游览器，附赠导航助手。',publisher:'游览科技'},
    {id:'q-virus',page:1,kind:'malware',title:`${topic}绿色资源包 — 免安装破解版`,domain:'free-crack-pack.example',description:'搜索增强补丁与万能破解资源。',publisher:'绿色资源联盟'},
    {id:'q-forum',page:1,kind:'article',title:theme[1],domain:'bbs.surfing.example/help',description:`楼主问“${topic}”，楼下正在讨论晚饭吃什么。`,publisher:'冲浪论坛'},
    {id:'q-guide',page:1,kind:'article',title:`${topic}相关讨论 — 已解决（并没有）`,domain:'zhidao.surfing.example/question',description:'最佳答案：重启试试，不行再重装。',publisher:'冲浪知道'},
    {id:'q-news',page:2,kind:'article',title:'上网小常识：网页打不开不一定是电脑坏了',domain:'news.surfing.example/tips',description:'网友建议检查网址，广告却建议安装更多工具栏。',publisher:'冲浪日报'},
    {id:'q-thread',page:2,kind:'article',title:`关于${topic}，这个帖子已经歪了三十楼`,domain:'bbs.surfing.example/offtopic',description:'从搜索问题聊到了拨号费用，还没有人回答楼主。',publisher:'冲浪论坛'},
    {id:'q-vip',page:2,kind:'promotion',title:`${topic}完整解答 — 会员专享`,domain:'vip-answers.example',description:'开通会员查看；答案可能与问题没有关系。',publisher:'答案会员中心'},
  ];
}
