/**
 * 动画模板库
 * 每个模板接收 imageUrl、opts（含预设参数）和 presetConfig（预设配置对象）
 * body 固定 1920x1080，background: transparent
 */

const fs = require('fs');
const path = require('path');

// 加载预设配置
let presets = {};
try {
  const raw = fs.readFileSync(path.join(__dirname, 'presets.json'), 'utf-8');
  presets = JSON.parse(raw);
} catch (e) {
  console.warn('[templates] 加载 presets.json 失败:', e.message);
}

function watermarkHtml(text) {
  if (!text) return '';
  return `<div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%) rotate(-15deg);font-size:64px;font-weight:800;color:rgba(255,255,255,0.08);letter-spacing:12px;z-index:999;pointer-events:none;font-family:sans-serif;text-transform:uppercase;white-space:nowrap;text-shadow:0 0 30px rgba(255,255,255,0.05)">${text}</div>`;
}

function baseHead() {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>*{margin:0;padding:0;box-sizing:border-box}body{width:1920px;height:1080px;overflow:hidden;background:transparent}</style></head><body>`;
}

function baseTail() {
  return `</body></html>`;
}

// ==================== 1. 霓虹呼吸 ====================
function neonBreathe(imageUrl, opts = {}) {
  const p = { speed: 1.0, intensity: 1.0, color: '#b44dff', glowSize: 8, ...opts };
  const dur1 = (3 / p.speed).toFixed(1);
  const dur2 = (4.5 / p.speed).toFixed(1);
  const op1 = Math.min(0.35 * p.intensity, 0.9).toFixed(2);
  const op2 = Math.min(0.15 * p.intensity, 0.6).toFixed(2);
  const op1b = Math.min(0.75 * p.intensity, 1.0).toFixed(2);
  const op2b = Math.min(0.45 * p.intensity, 1.0).toFixed(2);
  return `${baseHead()}
<style>
.base{width:1920px;height:1080px;object-fit:contain;display:block;position:relative;z-index:1}
.g{position:absolute;top:0;left:0;width:1920px;height:1080px;background:url('${imageUrl}') center/contain no-repeat;mix-blend-mode:screen;pointer-events:none}
.g1{animation:b1 ${dur1}s ease-in-out infinite;filter:blur(${p.glowSize}px) brightness(1.5) saturate(1.8)}
.g2{animation:b2 ${dur2}s ease-in-out infinite;filter:blur(${p.glowSize * 2.75}px) brightness(2) saturate(2.2)}
@keyframes b1{0%,100%{opacity:${op1}}50%{opacity:${op1b}}}
@keyframes b2{0%,100%{opacity:${op2}}50%{opacity:${op2b}}}
</style>
<img class="base" src="${imageUrl}" crossorigin="anonymous">
<div class="g g1"></div>
<div class="g g2"></div>
${watermarkHtml(opts.watermark)}
${baseTail()}`;
}

// ==================== 2. 粒子风暴 ====================
function particleStorm(imageUrl, opts = {}) {
  const p = { particleCount: 120, particleSpeed: 1.0, glowIntensity: 0.35, colors: ['#b44dff','#8b2fc9','#d580ff','#6a1b9a','#e040fb','#7c4dff','#aa00ff'], ...opts };
  const count = Math.round(p.particleCount);
  const speed = p.particleSpeed;
  const colorsJson = JSON.stringify(p.colors);
  const glowOp = Math.min(p.glowIntensity, 1).toFixed(2);
  const pulseOp1 = (p.glowIntensity * 0.7).toFixed(2);
  const pulseOp2 = (p.glowIntensity * 1.4).toFixed(2);
  return `${baseHead()}
<style>
.base{width:1920px;height:1080px;object-fit:contain;display:block;position:relative;z-index:1}
canvas{position:absolute;top:0;left:0;z-index:3;pointer-events:none}
.glow{position:absolute;top:0;left:0;width:1920px;height:1080px;background:url('${imageUrl}') center/contain no-repeat;mix-blend-mode:screen;animation:pulse 4s ease-in-out infinite;filter:blur(6px) brightness(1.4) saturate(1.6);opacity:${glowOp};z-index:2;pointer-events:none}
@keyframes pulse{0%,100%{opacity:${pulseOp1}}50%{opacity:${pulseOp2}}}
</style>
<div class="glow"></div>
<img class="base" src="${imageUrl}" crossorigin="anonymous">
<canvas id="cv" width="1920" height="1080"></canvas>
${watermarkHtml(opts.watermark)}
<script>
const cv=document.getElementById('cv'),ctx=cv.getContext('2d');
const W=1920,H=1080;
const colors=${colorsJson};
const pts=[];
class P{
  constructor(){this.reset();this.y=Math.random()*H}
  reset(){this.x=Math.random()*W;this.y=H+10+Math.random()*100;this.sz=Math.random()*3+1;this.vy=-((Math.random()*1.5+0.3)*${speed});this.op=Math.random()*0.7+0.3;this.c=colors[Math.floor(Math.random()*colors.length)];this.life=1;this.decay=Math.random()*0.003+0.001;this.t=0;this.wo=Math.random()*Math.PI*2}
  update(){this.t++;this.y+=this.vy;this.x+=Math.sin(this.t*0.015+this.wo)*0.5;this.life-=this.decay;if(this.life<=0||this.y<-20)this.reset()}
  draw(){ctx.save();ctx.globalAlpha=this.op*this.life;ctx.fillStyle=this.c;ctx.shadowColor=this.c;ctx.shadowBlur=this.sz*4;ctx.beginPath();ctx.arc(this.x,this.y,this.sz,0,Math.PI*2);ctx.fill();ctx.restore()}
}
for(let i=0;i<${count};i++)pts.push(new P());
const orbs=[];
for(let i=0;i<8;i++)orbs.push({x:Math.random()*W,y:Math.random()*H,sz:Math.random()*50+20,vx:(Math.random()-0.5)*0.3,vy:(Math.random()-0.5)*0.2,op:Math.random()*0.1+0.03,c:colors[Math.floor(Math.random()*colors.length)]});
function animate(){
  ctx.clearRect(0,0,W,H);
  orbs.forEach(o=>{o.x+=o.vx;o.y+=o.vy;if(o.x<-60||o.x>W+60)o.vx*=-1;if(o.y<-60||o.y>H+60)o.vy*=-1;ctx.save();ctx.globalAlpha=o.op;ctx.fillStyle=o.c;ctx.shadowColor=o.c;ctx.shadowBlur=o.sz;ctx.beginPath();ctx.arc(o.x,o.y,o.sz,0,Math.PI*2);ctx.fill();ctx.restore()});
  pts.forEach(p=>{p.update();p.draw()});
  requestAnimationFrame(animate);
}
animate();
</script>
${baseTail()}`;
}

// ==================== 3. 赛博故障 ====================
function cyberGlitch(imageUrl, opts = {}) {
  const p = { glitchFrequency: 1.0, scanlineOpacity: 0.08, rgbOffset: 5, glowIntensity: 0.3, ...opts };
  const scanOp = Math.min(p.scanlineOpacity, 0.3).toFixed(3);
  const glowOp = Math.min(p.glowIntensity, 0.8).toFixed(2);
  const glowOp2 = (p.glowIntensity * 1.33).toFixed(2);
  const freq = Math.max(800 / p.glitchFrequency, 200);
  const freq2 = Math.max(3000 / p.glitchFrequency, 500);
  const offset = p.rgbOffset;
  return `${baseHead()}
<style>
.base{width:1920px;height:1080px;object-fit:contain;display:block;position:relative;z-index:1}
.scan{position:absolute;top:0;left:0;width:1920px;height:1080px;z-index:4;pointer-events:none;background:repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(0,0,0,${scanOp}) 2px,rgba(0,0,0,${scanOp}) 4px);animation:scanroll 8s linear infinite}
@keyframes scanroll{0%{background-position:0 0}100%{background-position:0 1080px}}
.rgb{position:absolute;top:0;left:0;width:1920px;height:1080px;background:url('${imageUrl}') center/contain no-repeat;pointer-events:none;z-index:2;opacity:0;mix-blend-mode:screen}
.bar{position:absolute;left:0;width:1920px;height:0;background:rgba(180,77,255,0.15);z-index:5;pointer-events:none;opacity:0}
.glow{position:absolute;top:0;left:0;width:1920px;height:1080px;background:url('${imageUrl}') center/contain no-repeat;mix-blend-mode:screen;filter:blur(6px) brightness(1.3) saturate(1.5);opacity:${glowOp};z-index:0;animation:gp 3s ease-in-out infinite;pointer-events:none}
@keyframes gp{0%,100%{opacity:${glowOp}}50%{opacity:${glowOp2}}}
</style>
<div class="glow"></div>
<img class="base" id="base" src="${imageUrl}" crossorigin="anonymous">
<div class="rgb" id="rgbR"></div>
<div class="rgb" id="rgbB"></div>
<div class="scan"></div>
<div class="bar" id="b1"></div><div class="bar" id="b2"></div>
${watermarkHtml(opts.watermark)}
<script>
const rgbR=document.getElementById('rgbR'),rgbB=document.getElementById('rgbB');
const bars=[document.getElementById('b1'),document.getElementById('b2')];
const base=document.getElementById('base');
function glitch(){
  const dur=60+Math.random()*150,int=Math.random();
  rgbR.style.opacity=0.5+int*0.3;rgbR.style.filter='hue-rotate(-60deg) saturate(2)';rgbR.style.transform='translateX('+(2+int*${offset})+')';
  rgbB.style.opacity=0.4+int*0.2;rgbB.style.filter='hue-rotate(60deg) saturate(2)';rgbB.style.transform='translateX(-'+(2+int*${offset})+')';
  bars.forEach(b=>{b.style.top=Math.random()*1080+'px';b.style.height=(5+Math.random()*30)+'px';b.style.opacity=0.3+Math.random()*0.5;b.style.transform='translateX('+(Math.random()-0.5)*20+'px)'});
  base.style.transform='translateX('+(Math.random()-0.5)*4+'px)';
  setTimeout(()=>{rgbR.style.opacity=0;rgbB.style.opacity=0;rgbR.style.transform='';rgbB.style.transform='';bars.forEach(b=>{b.style.opacity=0});base.style.transform=''},dur);
  setTimeout(glitch,${freq}+Math.random()*${freq2});
}
function micro(){if(Math.random()<0.3){base.style.transform='translateX('+(Math.random()-0.5)*2+'px)';setTimeout(()=>{base.style.transform=''},50)}setTimeout(micro,200+Math.random()*500)}
glitch();micro();
</script>
${baseTail()}`;
}

// ==================== 4. 色彩波浪 ====================
function colorWave(imageUrl, opts = {}) {
  const p = { hueCycleSpeed: 1.0, sweepSpeed: 1.0, bokehCount: 15, glowIntensity: 0.4, ...opts };
  const cycleDur = (12 / p.hueCycleSpeed).toFixed(1);
  const sweepDur = (5 / p.sweepSpeed).toFixed(1);
  const bokehCount = Math.round(p.bokehCount);
  const glowOp = Math.min(p.glowIntensity, 1).toFixed(2);
  const glowOp2 = (p.glowIntensity * 1.5).toFixed(2);
  return `${baseHead()}
<style>
.base{width:1920px;height:1080px;object-fit:contain;display:block;position:relative;z-index:1;animation:hue ${cycleDur}s linear infinite}
@keyframes hue{0%{filter:hue-rotate(0deg)}100%{filter:hue-rotate(360deg)}}
.glow{position:absolute;top:0;left:0;width:1920px;height:1080px;background:url('${imageUrl}') center/contain no-repeat;mix-blend-mode:screen;z-index:2;pointer-events:none;animation:gw ${cycleDur}s linear infinite,breathe 3s ease-in-out infinite;filter:blur(10px) brightness(1.8) saturate(2);opacity:${glowOp}}
@keyframes gw{0%{filter:blur(10px) brightness(1.8) saturate(2) hue-rotate(0deg)}100%{filter:blur(10px) brightness(1.8) saturate(2) hue-rotate(360deg)}}
@keyframes breathe{0%,100%{opacity:${glowOp}}50%{opacity:${glowOp2}}}
.sweep{position:absolute;top:0;left:0;width:1920px;height:1080px;z-index:3;pointer-events:none;background:linear-gradient(90deg,transparent 0%,rgba(180,77,255,0.08) 25%,rgba(0,200,255,0.08) 50%,rgba(180,77,255,0.08) 75%,transparent 100%);background-size:200% 100%;animation:sw ${sweepDur}s ease-in-out infinite}
@keyframes sw{0%{background-position:200% 0}100%{background-position:-200% 0}}
canvas{position:absolute;top:0;left:0;z-index:4;pointer-events:none}
</style>
<img class="base" src="${imageUrl}" crossorigin="anonymous">
<div class="glow"></div>
<div class="sweep"></div>
<canvas id="cv" width="1920" height="1080"></canvas>
${watermarkHtml(opts.watermark)}
<script>
const cv=document.getElementById('cv'),ctx=cv.getContext('2d');
const bokeh=[];
for(let i=0;i<${bokehCount};i++)bokeh.push({x:Math.random()*1920,y:Math.random()*1080,sz:Math.random()*50+15,vx:(Math.random()-0.5)*0.4,vy:(Math.random()-0.5)*0.3,hue:Math.random()*60+260,op:Math.random()*0.1+0.03,ph:Math.random()*Math.PI*2});
let t=0;
function animate(){
  t+=0.01;ctx.clearRect(0,0,1920,1080);
  bokeh.forEach(b=>{b.x+=b.vx;b.y+=b.vy;if(b.x<-80)b.x=2000;if(b.x>2000)b.x=-80;if(b.y<-80)b.y=1160;if(b.y>1160)b.y=-80;
  const op=b.op*(0.7+0.3*Math.sin(t*2+b.ph)),h=(b.hue+t*30)%360;
  ctx.save();ctx.globalAlpha=op;ctx.fillStyle='hsl('+h+',80%,60%)';ctx.shadowColor='hsl('+h+',90%,50%)';ctx.shadowBlur=b.sz*1.5;ctx.beginPath();ctx.arc(b.x,b.y,b.sz,0,Math.PI*2);ctx.fill();ctx.restore()});
  requestAnimationFrame(animate);
}
animate();
</script>
${baseTail()}`;
}

// 预设配置（供 server.js 读取）
const presetConfigs = presets.presets || [];

// 导出
module.exports = {
  'neon-breathe': neonBreathe,
  'particle-storm': particleStorm,
  'cyber-glitch': cyberGlitch,
  'color-wave': colorWave,
  // 预设元数据
  getPresets: () => presetConfigs
};
