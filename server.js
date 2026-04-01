const express = require('express');
const templates = require('./templates');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const PRESETS_FILE = path.join(__dirname, 'presets.json');

function loadPresets() {
  try {
    const raw = fs.readFileSync(PRESETS_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch (e) {
    return { presets: [] };
  }
}

function savePresets(data) {
  fs.writeFileSync(PRESETS_FILE, JSON.stringify(data, null, 2), 'utf-8');
}

// 允许所有来源的 iframe 嵌入和跨域请求
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.removeHeader('X-Frame-Options');
  res.setHeader('Content-Security-Policy', "frame-ancestors *");
  next();
});

// URL 参数解析中间件
app.use(express.json());

/**
 * GET /effects
 * 返回预设列表（供 Bubble 调用）
 */
app.get('/effects', (req, res) => {
  const data = loadPresets();
  res.json({
    presets: (data.presets || []).map(p => ({
      id: p.id,
      name: p.name,
      description: p.description,
      tags: p.tags || [],
      thumbnail: p.thumbnail || null
    }))
  });
});

/**
 * GET /overlay
 *
 * 参数：
 *   imageUrl   - 底图 URL（必填）
 *   effect     - 动效类型（必填）
 *   watermark  - 水印文字（可选）
 *   *           - 其他参数会透传给预设（speed, intensity, color 等）
 */
app.get('/overlay', (req, res) => {
  const { imageUrl, effect, watermark } = req.query;

  if (!imageUrl) {
    return res.status(400).json({
      error: '缺少 imageUrl 参数',
      example: '/overlay?imageUrl=https://example.com/image.png&effect=neon-breathe'
    });
  }

  if (!effect || !templates[effect]) {
    return res.status(400).json({
      error: `未知动效: ${effect || '(空)'}`,
      available: Object.keys(templates).filter(k => k !== 'getPresets'),
      example: '/overlay?imageUrl=https://example.com/image.png&effect=neon-breathe'
    });
  }

  // 提取透传参数（除了 imageUrl/effect/watermark）
  const { imageUrl: _iu, effect: _ef, watermark: _wm, ...overrideParams } = req.query;

  // 预设参数名映射（URL参数名 → 模板期望的参数名）
  const paramMap = {
    'neon-breathe':  {},
    'particle-storm': { speed: 'particleSpeed', particleCount: 'particleCount', glowIntensity: 'glowIntensity', colors: 'colors' },
    'cyber-glitch':  { glitchFrequency: 'glitchFrequency', scanlineOpacity: 'scanlineOpacity', rgbOffset: 'rgbOffset', glowIntensity: 'glowIntensity' },
    'color-wave':    { hueCycleSpeed: 'hueCycleSpeed', sweepSpeed: 'sweepSpeed', bokehCount: 'bokehCount', glowIntensity: 'glowIntensity' },
    'flying-sheep':  { sheepCount: 'sheepCount', sheepSpeed: 'sheepSpeed', cloudOpacity: 'cloudOpacity', warmGlow: 'warmGlow', colors: 'colors' },
    'kawaii-sparkles': { sparkleCount: 'sparkleCount', heartCount: 'heartCount', sparkleSpeed: 'sparkleSpeed', sparkleOpacity: 'sparkleOpacity', colors: 'colors' },
    'firefly-night': { fireflyCount: 'fireflyCount', fireflySpeed: 'fireflySpeed', glowIntensity: 'glowIntensity', colors: 'colors' },
    'bunny-parade':  { bunnyCount: 'bunnyCount', jumpSpeed: 'jumpSpeed', size: 'size', color: 'color', glowOpacity: 'glowOpacity' }
  };

  // 转换参数名
  const mapped = {};
  const mapping = paramMap[effect] || {};
  for (const [k, v] of Object.entries(overrideParams)) {
    const mappedKey = mapping[k] || k;
    try { mapped[mappedKey] = JSON.parse(v); } catch { mapped[mappedKey] = v; }
  }

  // 读取该预设的默认参数
  const presetData = loadPresets();
  const preset = (presetData.presets || []).find(p => p.id === effect);
  const presetDefaults = preset?.params || {};

  // 合并：预设默认 → URL覆盖（URL覆盖优先）
  const opts = {
    watermark: watermark || null,
    ...presetDefaults,
    ...mapped
  };

  const html = templates[effect](imageUrl, opts);
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send(html);
});

/**
 * GET /admin
 * 预设管理面板（管理员调试用）
 */
app.get('/admin', (req, res) => {
  const data = loadPresets();
  const demoImage = req.query.imageUrl || 'https://picsum.photos/seed/demo/960/540';

  const presetCards = (data.presets || []).map(p => `
    <div class="card">
      <div class="preview">
        <iframe src="/overlay?imageUrl=${encodeURIComponent(demoImage)}&effect=${p.id}&size=thumb" loading="lazy"></iframe>
      </div>
      <div class="info">
        <h3>${p.name}</h3>
        <p class="desc">${p.description}</p>
        <p class="tags">${(p.tags || []).map(t => `<span>${t}</span>`).join(' ')}</p>
        <details>
          <summary>参数配置</summary>
          <pre>${JSON.stringify(p.params, null, 2)}</pre>
        </details>
        <div class="actions">
          <a href="/?add=${p.id}" target="_blank">调试</a>
          <a href="/admin/delete/${p.id}" onclick="return confirm('确认删除 ${p.name}？')">删除</a>
        </div>
      </div>
    </div>
  `).join('');

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send(`<!DOCTYPE html>
<html lang="zh">
<head>
<meta charset="utf-8">
<title>Overlay Admin</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:system-ui,sans-serif;background:#0a0a12;color:#e0e0e0;min-height:100vh;padding:24px}
h1{font-size:20px;margin-bottom:20px;color:#fff}
.bar{display:flex;gap:12px;align-items:center;margin-bottom:24px;flex-wrap:wrap}
input,button{background:#1a1a2e;border:1px solid #333;color:#e0e0e0;padding:8px 14px;border-radius:6px;font-size:14px}
input{width:320px}
button{cursor:pointer;background:#7c4dff}
button:hover{background:#9e7bff}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:20px}
.card{background:#1a1a2e;border-radius:12px;overflow:hidden;border:1px solid #2a2a3e}
.preview{height:160px;background:#000;overflow:hidden}
.preview iframe{width:100%;height:100%;border:none;transform:scale(0.5);transform-origin:top left;width:200%;height:200%}
.info{padding:16px}
.info h3{font-size:16px;margin-bottom:4px;color:#fff}
.desc{font-size:13px;color:#888;margin-bottom:8px}
.tags{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:10px}
.tags span{background:#2a2a4e;color:#a78bfa;font-size:11px;padding:2px 8px;border-radius:4px}
details{margin-bottom:10px}
details pre{background:#0a0a12;padding:10px;border-radius:6px;font-size:12px;color:#aaa;overflow:auto;margin-top:6px;max-height:150px}
.actions{display:flex;gap:8px}
.actions a{padding:6px 12px;border-radius:6px;font-size:13px;text-decoration:none;text-align:center;flex:1}
.actions a:first-child{background:#1e3a5f;color:#60a5fa}
.actions a:last-child{background:#3a1a1a;color:#f87171}
.msg{background:#1a2e1a;border:1px solid #2a5f2a;color:#4ade80;padding:12px 16px;border-radius:8px;margin-bottom:20px;font-size:14px}
.demo-link{color:#60a5fa;font-size:13px}
</style>
</head>
<body>
<h1>🎛 Overlay Admin — 预设管理面板</h1>

<form class="bar" action="/admin/add" method="GET">
  <input name="id" placeholder="预设 ID（如 neon-breathe-2）" required>
  <input name="name" placeholder="预设名称（如 霓虹呼吸 2）" required>
  <input name="description" placeholder="描述（可选）">
  <button type="submit">+ 新增预设</button>
  <span style="margin-left:8px;font-size:13px;color:#666">|</span>
  <a href="/admin" style="color:#888;font-size:13px;text-decoration:none;padding:8px">刷新</a>
</form>

<p style="margin-bottom:16px;font-size:13px;color:#666">
  调试：把底图 URL 参数加到 ?imageUrl= 后面 → <a href="?imageUrl=https://picsum.photos/seed/test/960/540" class="demo-link">使用演示图</a>
</p>

<div class="grid">${presetCards || '<p style="color:#666;font-size:14px">暂无预设</p>'}</div>

<script>
// 页面加载后自动刷新 iframe 预览（使用同一张底图）
document.querySelectorAll('iframe').forEach(iframe => {
  iframe.src = iframe.src.replace(/imageUrl=[^&]*/, 'imageUrl=${encodeURIComponent(demoImage)}');
});
</script>
</body>
</html>`);
});

/**
 * GET /admin/add?id=xxx&name=xxx&description=xxx
 * 快速新增预设（复制现有预设结构）
 */
app.get('/admin/add', (req, res) => {
  const { id, name, description } = req.query;

  if (!id || !name) {
    return res.redirect('/admin?err=缺少参数');
  }

  const data = loadPresets();

  // 检查 ID 是否已存在
  if ((data.presets || []).some(p => p.id === id)) {
    return res.redirect('/admin?err=ID已存在');
  }

  // 默认复制第一个预设的参数结构作为模板
  const template = data.presets?.[0]?.params || { speed: 1.0, intensity: 1.0 };

  data.presets = data.presets || [];
  data.presets.push({
    id,
    name,
    description: description || '',
    tags: [],
    params: { ...template }
  });

  savePresets(data);
  res.redirect('/admin');
});

/**
 * GET /admin/delete/:id
 * 删除预设
 */
app.get('/admin/delete/:id', (req, res) => {
  const data = loadPresets();
  data.presets = (data.presets || []).filter(p => p.id !== req.params.id);
  savePresets(data);
  res.redirect('/admin');
});

/**
 * GET /admin/edit/:id
 * 查看/调试单个预设（带参数覆盖表单）
 */
app.get('/admin/edit/:id', (req, res) => {
  const data = loadPresets();
  const preset = (data.presets || []).find(p => p.id === req.params.id);

  if (!preset) {
    return res.redirect('/admin?err=预设不存在');
  }

  const demoImage = req.query.imageUrl || 'https://picsum.photos/seed/demo/960/540';
  const paramFields = Object.entries(preset.params).map(([k, v]) => {
    const type = Array.isArray(v) ? 'array' : typeof v;
    if (type === 'array') {
      return `<label>${k}<textarea name="${k}" rows="2" placeholder='["#fff","#000"]'>${JSON.stringify(v)}</textarea></label>`;
    }
    return `<label>${k}<input name="${k}" value="${v}" type="${type === 'number' ? 'number' : 'text'}"></label>`;
  }).join('');

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send(`<!DOCTYPE html>
<html lang="zh">
<head>
<meta charset="utf-8">
<title>调试 ${preset.name}</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:system-ui,sans-serif;background:#0a0a12;color:#e0e0e0;min-height:100vh;padding:24px}
h2{font-size:20px;margin-bottom:16px;color:#fff}
.split{display:grid;grid-template-columns:1fr 340px;gap:24px;height:calc(100vh - 100px)}
.pane{background:#1a1a2e;border-radius:12px;overflow:hidden}
iframe{width:100%;height:100%;border:none;background:#000}
form{padding:20px}
label{display:block;margin-bottom:14px;font-size:14px;color:#aaa}
label input,label textarea{width:100%;margin-top:4px;background:#0a0a12;border:1px solid #333;color:#e0e0e0;padding:8px;border-radius:6px;font-size:14px;font-family:monospace}
label textarea{resize:vertical}
.btns{display:flex;gap:10px;margin-top:20px}
button{flex:1;padding:10px;border-radius:8px;border:none;cursor:pointer;font-size:14px}
button:first-child{background:#7c4dff;color:#fff}
button:last-child{background:#2a2a3e;color:#aaa}
button:hover{opacity:0.9}
.desc{font-size:13px;color:#666;margin-top:16px}
</style>
</head>
<body>
<a href="/admin" style="color:#888;font-size:13px;text-decoration:none">← 返回管理面板</a>
<h2>调试：${preset.name} <span style="font-size:14px;color:#666">（${preset.id}）</span></h2>

<div class="split">
  <div class="pane"><iframe id="preview" src="/overlay?imageUrl=${encodeURIComponent(demoImage)}&effect=${preset.id}" allow="autoplay"></iframe></div>
  <div class="pane">
    <form id="paramForm">
      <p style="font-size:14px;color:#888;margin-bottom:16px">修改参数后点击"应用"预览效果</p>
      ${paramFields}
      <input type="hidden" name="effectId" value="${preset.id}">
      <div class="btns">
        <button type="submit">应用</button>
        <button type="button" onclick="saveParams()">保存到预设</button>
      </div>
    </form>
    <p class="desc">
      调试 URL 分享：<br>
      <code style="font-size:12px;word-break:break-all;color:#60a5fa">${req.protocol}://${req.get('host')}/overlay?imageUrl=${encodeURIComponent(demoImage)}&effect=${preset.id}&speed=0.8</code>
    </p>
  </div>
</div>

<script>
const form = document.getElementById('paramForm');
const preview = document.getElementById('preview');
const params = ${JSON.stringify(preset.params)};
let currentParams = {...params};

function buildUrl(overrides) {
  const merged = {...params, ...overrides};
  const qs = Object.entries(merged).map(([k,v]) => k + '=' + encodeURIComponent(typeof v === 'object' ? JSON.stringify(v) : v)).join('&');
  return '/overlay?imageUrl=${encodeURIComponent(demoImage)}&effect=${preset.id}&' + qs;
}

form.addEventListener('submit', e => {
  e.preventDefault();
  const fd = new FormData(form);
  const overrides = {};
  for (const [k, v] of fd) {
    try { overrides[k] = JSON.parse(v); } catch { overrides[k] = v; }
  }
  currentParams = {...params, ...overrides};
  preview.src = buildUrl(overrides);
});

function saveParams() {
  fetch('/admin/api/save', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({ id: '${preset.id}', params: currentParams })
  }).then(r => r.json()).then(r => {
    alert(r.success ? '已保存！' : '保存失败: ' + r.error);
  });
}
</script>
</body>
</html>`);
});

/**
 * POST /admin/api/save
 * 保存预设参数（AJAX）
 */
app.post('/admin/api/save', (req, res) => {
  const { id, params: newParams } = req.body;
  if (!id || !newParams) return res.json({ success: false, error: '缺少参数' });

  const data = loadPresets();
  const preset = (data.presets || []).find(p => p.id === id);
  if (!preset) return res.json({ success: false, error: '预设不存在' });

  preset.params = { ...preset.params, ...newParams };
  savePresets(data);
  res.json({ success: true });
});

/**
 * GET /health
 */
app.get('/health', (req, res) => {
  const data = loadPresets();
  res.json({ status: 'ok', presetCount: (data.presets || []).length });
});

/**
 * GET /
 */
app.get('/', (req, res) => {
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send(`<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>Overlay Engine</title>
<style>
body{font-family:system-ui,sans-serif;max-width:700px;margin:40px auto;padding:0 20px;color:#333;line-height:1.8}
h1{font-size:24px;margin-bottom:4px}
code{background:#f0f0f0;padding:2px 8px;border-radius:4px;font-size:14px}
.endpoint{background:#f8f8f8;padding:16px;border-radius:8px;margin:12px 0;border-left:3px solid #7c4dff}
a{color:#7c4dff}
</style></head><body>
<h1>Overlay Engine</h1>
<p>Animated stream overlay generator. Returns HTML pages with real-time animations.</p>
<p><a href="/admin">→ 管理面板 / Admin</a></p>
<div class="endpoint">
<strong>GET /overlay</strong><br>
<code>?imageUrl=IMAGE_URL&effect=EFFECT_NAME&watermark=OPTIONAL_TEXT</code><br><br>
Effects: <code>neon-breathe</code> <code>particle-storm</code> <code>cyber-glitch</code> <code>color-wave</code>
</div>
<div class="endpoint">
<strong>GET /effects</strong> — List all available effects as JSON (for Bubble)
</div>
<div class="endpoint">
<strong>GET /admin</strong> — Preset management panel
</div>
</body></html>`);
});

app.listen(PORT, () => {
  const data = loadPresets();
  console.log(`\n✅ Overlay Engine running on port ${PORT}`);
  console.log(`📋 ${(data.presets || []).length} presets loaded`);
  console.log(`\n   GET /overlay?imageUrl=...&effect=...&watermark=...`);
  console.log(`   GET /effects  — Bubble 调用`);
  console.log(`   GET /admin    — 管理面板\n`);
});
