# Overlay Engine

将静态 stream overlay 底图变成带动画效果的实时网页。
用户把 URL 粘贴到 OBS Browser Source 就能用。

## 工作原理

```
用户的底图 URL + 动效类型  →  这个服务器  →  一个带动画的 HTML 页面
                                              ↓
                               OBS Browser Source 加载这个页面
                                              ↓
                               动画实时运行在直播画面上
```

## 本地运行

```bash
npm install
npm start
```

然后打开浏览器访问：
```
http://localhost:3000/overlay?imageUrl=你的底图URL&effect=neon-breathe
```

## 可用动效

| 参数值 | 效果 |
|--------|------|
| `neon-breathe` | 霓虹呼吸光晕 |
| `particle-storm` | 粒子上升 + 散景光斑 |
| `cyber-glitch` | RGB 故障 + 扫描线 |
| `color-wave` | 色相循环 + 光束扫过 |

## API

### GET /overlay

| 参数 | 必填 | 说明 |
|------|------|------|
| imageUrl | 是 | 底图 URL |
| effect | 是 | 动效类型 |
| watermark | 否 | 水印文字（不填则无水印）|

### GET /effects

返回所有可用动效的 JSON 列表。

## 三种用法（同一个端点）

**首页展示：** 用你精选的底图 URL，不加水印
```
/overlay?imageUrl=你的展示底图URL&effect=neon-breathe
```

**用户预览：** 用户生成的底图，加水印
```
/overlay?imageUrl=用户底图URL&effect=particle-storm&watermark=Aismentor.com
```

**正式交付：** 用户付费后，去掉水印
```
/overlay?imageUrl=用户底图URL&effect=particle-storm
```

## Bubble.io 对接

1. 在 Bubble 页面中添加 HTML 元素
2. 内容写 iframe 代码，src 指向你的 overlay URL
3. 底图 URL 和动效类型用 Bubble 动态数据填入

iframe 示例：
```html
<iframe src="https://你的railway域名/overlay?imageUrl=底图URL&effect=动效类型&watermark=Aismentor.com" 
        width="100%" height="500" style="border:none" 
        allow="autoplay"></iframe>
```

## 部署到 Railway

1. 把这个项目推到 GitHub
2. 去 railway.app 注册并连接 GitHub
3. 选择这个 repo → 自动部署
4. 拿到公网 URL（类似 https://overlay-engine-xxx.up.railway.app）

## 项目结构

```
overlay-engine/
├── server.js       ← Express 服务器（30 行核心代码）
├── templates.js    ← 4 种动效模板
├── package.json
├── railway.json    ← Railway 部署配置
└── README.md
```
