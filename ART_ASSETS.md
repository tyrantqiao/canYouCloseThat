# 美术资源资产索引

更新：2026-10-11。只记录实际存在的资产；剧情截图不是发布素材。

## 第四关 Windows 桌面

第四关默认 Windows 7 Aero，可切换 Windows XP Luna。两套外观使用同一份应用与任务状态；主题切换不改变资料流程。开始菜单可启动网盘，窗口可最小化、从任务栏恢复、最大化/还原与关闭。

| 资产 | 文件或入口 | 用途与复用边界 |
| --- | --- | --- |
| 网盘快捷方式图标 | src/assets/desktop/cloud-drive.svg | 原创 64×64 矢量云盘；桌面、任务栏、标题栏与开始菜单共用。假应用通过 CSS 色相变体表现近似图标；身份仍依赖名称、发布者和地址。 |
| 蓝色光带壁纸 | src/assets/desktop/wallpaper-7.svg | 原创 1200×800 SVG，适配 cover；用于 Win7 外观，未复制微软壁纸或标识。 |
| 草坡天空壁纸 | src/assets/desktop/wallpaper-xp.svg | 原创 1200×800 SVG，适配 cover；参考 XP 的蓝天草坡配色，非 Bliss 照片。 |
| 系统外壳 | src/desktop.css | Aero/Luna 标题栏、窗口按钮、开始菜单、固定任务栏、系统托盘与便笺。选择器限 drive 场景；第六关使用独立外壳与同一 Win7 壁纸。 |
| 外壳渲染与状态 | src/scenarios.ts：renderDrive / DriveMission / driveApps | 共用一套窗口语义；不是通用 Windows 组件。跨关复用需显式接入，不能复制任务答案或假应用身份。 |
| 应用内容 | src/scenarios.ts：renderDriveContent / driveShares / driveFiles | 分享、提取、资料目录与下载。美术层不独立维护第二份目录。 |

桌面上的名称、发布者和窗口服务地址是剧情识别线索，不要为美观删除。手机端桌面可滚动，任务栏固定可见；应用正文在窗口内滚动。托盘的时钟与状态是装饰，未呈现为可点击按钮。

## 其他现有资产

| 类型 | 入口 | 说明 |
| --- | --- | --- |
| 经典浏览器、搜索与广告窗口 | src/retro.css，src/mission.ts，src/gaming.ts | 第一关与第三、第五关具有不同状态入口；共享 CSS 不代表共享所有操作语义。 |
| 某熊聊天桌面、联系人与会话 | src/scenarios.css，src/scenarios.ts：renderChat | CSS、字符/emoji 与 HTML 共同构成资产。聊天窗口状态只归 ChatMission。 |
| 年代回忆便签 | src/memory.css，src/memory.ts | 按关卡编号提供场景文案。 |
| 第六关卸载桌面 | src/uninstall.css，src/uninstall.ts：renderUninstall / UninstallMission | 复用 wallpaper-7.svg；独立系统工具、卸载向导、软件目录与广告，不复制网盘渲染；无 XP 切换与最大化，手机端单列可滚动。 |
| 通用游戏外壳与结算 | src/style.css，src/viewport.css，src/results.css | 大厅、侧栏、暂停、反馈与结算。 |
| 本地某熊消息音 | src/assets/audio/qq-system-cough.mp3 | 第三方音频；许可与来源见同目录 qq-system-cough.LICENSE.md，保持原记录。 |
| 合成提示音 | src/sound.ts | Web Audio 原生生成，无远程请求。 |

## 来源、许可与维护

新增桌面 SVG 与 desktop.css 由本项目此次开发原创，创建日期 2026-10-11，按仓库 Apache-2.0 许可管理。Windows/XP/7 名称仅描述设计参考；未引入操作系统截图、微软官方图标、默认壁纸或远程字体。既有第三方音频按自己的许可记录管理。

修改 SVG 优先保留 viewBox 和矢量结构；图标颜色变体在 desktop.css 定义，不复制七份图标。资产文件通过 Vite 的相对资源处理打包；不要加入远程素材请求。浏览器验收截图属于验证材料，不放入发布资产目录。

## 战绩卡美术资产（2026-10-12）

src/share-card.ts 与 src/share-card.css 提供原创战绩版式与六关文案，沿用项目深绿、米白、浅绿配色；失败卡采用暖红。屏幕卡与导出图读取同一份冻结数据；导出图由 Canvas 原生绘制，尺寸 1080×1350，不依赖屏幕大小或动画帧。未新增图片、字体或第三方库，按仓库 Apache-2.0 许可管理。验证图片 artifacts/share-card-*.png 已忽略 Git，属于验收材料，不加入发布资源。

总战绩复用 share-card.ts / share-card.css 的配色、排版和 Canvas 导出，增加逐关成绩列表。总图为 1080×1780，不新增外部素材或库；统计源为 run-record.ts。
