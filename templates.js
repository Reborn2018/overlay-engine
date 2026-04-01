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

// ==================== 5. 飞绵羊 ====================
function flyingSheep(imageUrl, opts = {}) {
  const p = {
    sheepCount: 5, sheepSpeed: 0.8, cloudOpacity: 0.15,
    warmGlow: 0.2,
    colors: ['#ffb3c6', '#ffd6e0', '#fff0f5', '#c9f0ff', '#e8d5ff'], ...opts
  };
  const colorsJson = JSON.stringify(p.colors);
  const cloudOp = Math.min(p.cloudOpacity, 0.4).toFixed(2);
  const glowOp = Math.min(p.warmGlow, 0.6).toFixed(2);
  return `${baseHead()}
<style>
.base{width:1920px;height:1080px;object-fit:contain;display:block;position:relative;z-index:1}
canvas{position:absolute;top:0;left:0;z-index:3;pointer-events:none}
.warm{position:absolute;top:0;left:0;width:1920px;height:1080px;background:url('${imageUrl}') center/contain no-repeat;mix-blend-mode:screen;opacity:${glowOp};filter:blur(8px) brightness(1.3);z-index:2;pointer-events:none;animation:wg 6s ease-in-out infinite}
@keyframes wg{0%,100%{opacity:${glowOp}}50%{opacity:${(p.warmGlow*1.5).toFixed(2)}}}
.cloud{position:absolute;top:0;left:0;width:1920px;height:1080px;background:url('${imageUrl}') center/contain no-repeat;mix-blend-mode:screen;opacity:${cloudOp};filter:blur(20px) brightness(1.1);z-index:1;pointer-events:none}
</style>
<div class="warm"></div>
<div class="cloud"></div>
<img class="base" src="${imageUrl}" crossorigin="anonymous">
<canvas id="cv" width="1920" height="1080"></canvas>
${watermarkHtml(opts.watermark)}
<script>
const cv=document.getElementById('cv'),ctx=cv.getContext('2d');
const W=1920,H=1080;
const colors=${colorsJson};
const speed=${p.sheepSpeed};

// 绘制棉花糖绵羊
function drawSheep(x,y,sz,phase,col){
  ctx.save();
  ctx.translate(x,y);
  // 身体（棉花糖效果）
  const bodyX=0,bodyY=0;
  for(let i=0;i<8;i++){
    ctx.save();
    ctx.globalAlpha=0.6+i*0.04;
    ctx.fillStyle=col;
    ctx.beginPath();
    ctx.arc(bodyX+Math.cos(i*0.8)*sz*0.4,bodyY+Math.sin(i*0.8)*sz*0.3,sz*(0.55+i*0.04),0,Math.PI*2);
    ctx.fill();
    ctx.restore();
  }
  ctx.globalAlpha=1;
  ctx.fillStyle=col;
  ctx.beginPath();ctx.arc(bodyX,bodyY,sz*0.6,0,Math.PI*2);ctx.fill();
  // 头
  ctx.fillStyle='#ffe8f0';
  ctx.beginPath();ctx.arc(sz*0.5,-sz*0.2,sz*0.28,0,Math.PI*2);ctx.fill();
  // 眼睛
  ctx.fillStyle='#333';
  ctx.beginPath();ctx.arc(sz*0.58,-sz*0.25,sz*0.06,0,Math.PI*2);ctx.fill();
  // 腮红
  ctx.fillStyle='rgba(255,150,180,0.4)';
  ctx.beginPath();ctx.arc(sz*0.65,-sz*0.1,sz*0.1,0,Math.PI*2);ctx.fill();
  // 耳朵
  ctx.fillStyle='#ffd6e0';
  ctx.beginPath();ctx.ellipse(sz*0.35,-sz*0.45,sz*0.12,sz*0.08,Math.PI*0.3,0,Math.PI*2);ctx.fill();
  ctx.beginPath();ctx.ellipse(sz*0.6,-sz*0.45,sz*0.12,sz*0.08,-Math.PI*0.3,0,Math.PI*2);ctx.fill();
  // 腿
  ctx.fillStyle='#ffe8f0';
  const legY=sz*0.45;
  [[-sz*0.25,-1],[sz*0.1,-1],[sz*0.25,1],[sz*0.45,1]].forEach(([lx,dir])=>{
    ctx.beginPath();
    ctx.ellipse(lx,legY+Math.sin(phase+dir)*sz*0.1,sz*0.08,sz*0.18,0,0,Math.PI*2);
    ctx.fill();
  });
  // 小尾巴
  ctx.fillStyle=col;
  ctx.beginPath();ctx.arc(-sz*0.5,sz*0.1,sz*0.2,0,Math.PI*2);ctx.fill();
  ctx.restore();
}

class Sheep{
  constructor(){this.reset()}
  reset(){
    this.x=-120;this.y=100+Math.random()*(H-300);
    this.sz=35+Math.random()*30;this.speed=(0.5+Math.random()*0.8)*${speed};
    this.bounce=Math.random()*Math.PI*2;this.bounceSpd=0.03+Math.random()*0.02;
    this.color=colors[Math.floor(Math.random()*colors.length)];
    this.wobble=Math.random()*Math.PI*2;this.wobbleSpd=0.015;
    this.trail=[];this.op=0.5+Math.random()*0.5;
  }
  update(){
    this.x+=this.speed;this.bounce+=this.bounceSpd;this.wobble+=this.wobbleSpd;
    this.trail.push({x:this.x-this.sz*0.3,y:this.y+this.sz*0.1,sz:this.sz*0.3,op:0.5});
    if(this.trail.length>12)this.trail.shift();
    this.trail.forEach(t=>t.op*=0.88);
    if(this.x>W+150)this.reset();
  }
  draw(){
    const sz=this.sz;
    // 棉花云轨迹
    this.trail.forEach(t=>{
      ctx.save();
      ctx.globalAlpha=t.op*0.4*this.op;
      ctx.fillStyle=this.color;
      ctx.beginPath();ctx.arc(t.x,t.y,t.sz,0,Math.PI*2);ctx.fill();
      ctx.restore();
    });
    // 羊羊本体
    drawSheep(this.x,this.y+Math.sin(this.bounce)*8,sz,this.bounce,this.color);
  }
}

const sheep=[];
for(let i=0;i<${Math.round(p.sheepCount)};i++){
  const s=new Sheep();
  s.x=-120-Math.random()*600;
  sheep.push(s);
}

let t=0;
function animate(){
  t++;
  ctx.clearRect(0,0,W,H);
  sheep.forEach(s=>{s.update();s.draw()});
  requestAnimationFrame(animate);
}
animate();
</script>
${baseTail()}`;
}

// ==================== 6. 梦幻星光 ====================
function kawaiiSparkles(imageUrl, opts = {}) {
  const p = {
    sparkleCount: 40, heartCount: 12, sparkleSpeed: 1.0, sparkleOpacity: 0.8,
    colors: ['#ff9eb5', '#ffb347', '#c9a0ff', '#87e8de', '#ffd700'], ...opts
  };
  const colorsJson = JSON.stringify(p.colors);
  const op = Math.min(p.sparkleOpacity, 1).toFixed(2);
  return `${baseHead()}
<style>
.base{width:1920px;height:1080px;object-fit:contain;display:block;position:relative;z-index:1}
canvas{position:absolute;top:0;left:0;z-index:3;pointer-events:none}
.soft{position:absolute;top:0;left:0;width:1920px;height:1080px;background:url('${imageUrl}') center/contain no-repeat;mix-blend-mode:screen;opacity:0.15;filter:blur(12px) brightness(1.2);z-index:2;pointer-events:none}
</style>
<div class="soft"></div>
<img class="base" src="${imageUrl}" crossorigin="anonymous">
<canvas id="cv" width="1920" height="1080"></canvas>
${watermarkHtml(opts.watermark)}
<script>
const cv=document.getElementById('cv'),ctx=cv.getContext('2d');
const W=1920,H=1080;
const colors=${colorsJson};
const spd=${p.sparkleSpeed};

// 绘制爱心
function heart(x,y,sz,col,alpha,rotation){
  ctx.save();
  ctx.translate(x,y);ctx.rotate(rotation);ctx.globalAlpha=alpha;
  ctx.fillStyle=col;ctx.shadowColor=col;ctx.shadowBlur=sz*0.5;
  ctx.beginPath();
  ctx.moveTo(0,sz*0.3);
  ctx.bezierCurveTo(-sz*0.5,-sz*0.1,-sz,-sz*0.6,0,-sz*0.9);
  ctx.bezierCurveTo(sz,-sz*0.6,sz*0.5,-sz*0.1,0,sz*0.3);
  ctx.fill();ctx.restore();
}

// 绘制星星
function star(x,y,sz,col,alpha,rot,points){
  ctx.save();ctx.translate(x,y);ctx.rotate(rot);ctx.globalAlpha=alpha;
  ctx.fillStyle=col;ctx.shadowColor=col;ctx.shadowBlur=sz*0.8;
  ctx.beginPath();
  for(let i=0;i<points*2;i++){
    const r=i%2===0?sz:sz*0.4;
    const a=(i*Math.PI/points)-Math.PI/2;
    i===0?ctx.moveTo(Math.cos(a)*r,Math.sin(a)*r):ctx.lineTo(Math.cos(a)*r,Math.sin(a)*r);
  }
  ctx.closePath();ctx.fill();ctx.restore();
}

// 绘制小闪粉
function dot(x,y,sz,col,alpha){
  ctx.save();ctx.translate(x,y);ctx.globalAlpha=alpha;
  ctx.fillStyle=col;ctx.shadowColor=col;ctx.shadowBlur=sz*2;
  ctx.fillRect(-sz/2,-sz/2,sz,sz);ctx.restore();
}

class Sparkle{
  constructor(type){this.reset(type)}
  reset(type){
    this.type=type||['dot','star','heart'][Math.floor(Math.random()*3)];
    this.x=Math.random()*W;this.y=H+20+Math.random()*100;
    this.sz=Math.random()*12+4;this.vy=-(0.3+Math.random()*0.8)*spd;
    this.vx=(Math.random()-0.5)*0.5*spd;this.t=Math.random()*Math.PI*2;
    this.tSpd=0.02+Math.random()*0.03;this.c=colors[Math.floor(Math.random()*colors.length)];
    this.op=0.4+Math.random()*0.6;this.rot=Math.random()*Math.PI*2;this.rotSpd=(Math.random()-0.5)*0.03;
    this.life=1;this.decay=0.0008+Math.random()*0.001;
  }
  update(){
    this.t+=this.tSpd;this.x+=this.vx+Math.sin(this.t)*0.3;this.y+=this.vy;
    this.rot+=this.rotSpd;this.life-=this.decay;
    if(this.life<=0||this.y<-50)this.reset();
  }
  draw(){
    const alpha=this.op*this.life;
    if(this.type==='dot')dot(this.x,this.y,this.sz,this.c,alpha*${op});
    else if(this.type==='heart')heart(this.x,this.y,this.sz,this.c,alpha*${op},this.rot);
    else star(this.x,this.y,this.sz,this.c,alpha*${op},this.rot,5);
  }
}

const items=[];
for(let i=0;i<${Math.round(p.sparkleCount)};i++)items.push(new Sparkle('dot'));
for(let i=0;i<${Math.round(p.heartCount)};i++)items.push(new Sparkle('heart'));
for(let i=0;i<${Math.round(p.sparkleCount/4)};i++)items.push(new Sparkle('star'));

function animate(){
  ctx.clearRect(0,0,W,H);
  items.forEach(s=>{s.update();s.draw()});
  requestAnimationFrame(animate);
}
animate();
</script>
${baseTail()}`;
}

// ==================== 7. 萤火虫之夜 ====================
function fireflyNight(imageUrl, opts = {}) {
  const p = {
    fireflyCount: 60, fireflySpeed: 0.6, glowIntensity: 0.6,
    colors: ['#ffe066', '#ffcc00', '#fff3b0', '#ffc8dd', '#ffb3c6'], ...opts
  };
  const colorsJson = JSON.stringify(p.colors);
  const glowOp = Math.min(p.glowIntensity, 1).toFixed(2);
  return `${baseHead()}
<style>
.base{width:1920px;height:1080px;object-fit:contain;display:block;position:relative;z-index:1}
canvas{position:absolute;top:0;left:0;z-index:3;pointer-events:none}
.warm{position:absolute;top:0;left:0;width:1920px;height:1080px;background:url('${imageUrl}') center/contain no-repeat;mix-blend-mode:screen;opacity:${glowOp};filter:blur(15px) brightness(1.1);z-index:2;pointer-events:none;animation:ww 5s ease-in-out infinite}
@keyframes ww{0%,100%{opacity:${glowOp}}50%{opacity:${(p.glowIntensity*1.4).toFixed(2)}}}
</style>
<div class="warm"></div>
<img class="base" src="${imageUrl}" crossorigin="anonymous">
<canvas id="cv" width="1920" height="1080"></canvas>
${watermarkHtml(opts.watermark)}
<script>
const cv=document.getElementById('cv'),ctx=cv.getContext('2d');
const W=1920,H=1080;
const colors=${colorsJson};
const spd=${p.fireflySpeed};

class F{
  constructor(){this.reset()}
  reset(){
    this.x=Math.random()*W;this.y=Math.random()*H;
    this.sz=2+Math.random()*4;this.t=Math.random()*Math.PI*2;
    this.tSpd=0.01+Math.random()*0.02;this.baseT=Math.random()*Math.PI*2;
    this.vx=(Math.random()-0.5)*0.4*spd;this.vy=(Math.random()-0.5)*0.4*spd;
    this.c=colors[Math.floor(Math.random()*colors.length)];
    this.glow=(Math.random()*0.5+0.5)*${glowOp};
  }
  update(){
    this.t+=this.tSpd;
    this.x+=this.vx+Math.sin(this.t)*0.3*spd;
    this.y+=this.vy+Math.cos(this.t*0.7)*0.2*spd;
    if(this.x<-20)this.x=W+20;if(this.x>W+20)this.x=-20;
    if(this.y<-20)this.y=H+20;if(this.y>H+20)this.y=-20;
  }
  draw(){
    const pulse=0.5+0.5*Math.sin(this.t*3+this.baseT);
    const alpha=this.glow*pulse;
    // 外发光
    ctx.save();
    const grd=ctx.createRadialGradient(this.x,this.y,0,this.x,this.y,this.sz*8);
    grd.addColorStop(0,'rgba(255,240,150,'+(alpha*0.4)+')');
    grd.addColorStop(1,'rgba(255,240,150,0)');
    ctx.fillStyle=grd;
    ctx.beginPath();ctx.arc(this.x,this.y,this.sz*8,0,Math.PI*2);ctx.fill();
    // 核心
    ctx.globalAlpha=alpha*0.9;
    ctx.fillStyle=this.c;ctx.shadowColor=this.c;ctx.shadowBlur=this.sz*6;
    ctx.beginPath();ctx.arc(this.x,this.y,this.sz,0,Math.PI*2);ctx.fill();
    ctx.restore();
  }
}

const ff=[];
for(let i=0;i<${Math.round(p.fireflyCount)};i++)ff.push(new F());

function animate(){
  ctx.clearRect(0,0,W,H);
  ff.forEach(f=>{f.update();f.draw()});
  requestAnimationFrame(animate);
}
animate();
</script>
${baseTail()}`;
}

// ==================== 8. 兔子游行 ====================
function bunnyParade(imageUrl, opts = {}) {
  const p = {
    bunnyCount: 4, jumpSpeed: 1.0, size: 1.0,
    color: '#fff0f5', glowOpacity: 0.2, ...opts
  };
  const glowOp = Math.min(p.glowOpacity, 0.6).toFixed(2);
  const bunnyColor = p.color || '#fff0f5';
  return `${baseHead()}
<style>
.base{width:1920px;height:1080px;object-fit:contain;display:block;position:relative;z-index:1}
canvas{position:absolute;top:0;left:0;z-index:3;pointer-events:none}
.soft{position:absolute;top:0;left:0;width:1920px;height:1080px;background:url('${imageUrl}') center/contain no-repeat;mix-blend-mode:screen;opacity:${glowOp};filter:blur(15px) brightness(1.2);z-index:2;pointer-events:none}
</style>
<div class="soft"></div>
<img class="base" src="${imageUrl}" crossorigin="anonymous">
<canvas id="cv" width="1920" height="1080"></canvas>
${watermarkHtml(opts.watermark)}
<script>
const cv=document.getElementById('cv'),ctx=cv.getContext('2d');
const W=1920,H=1080;
const baseSpd=${p.jumpSpeed};
const sz=${p.size};

function drawBunny(x,y,bSz,phase,col,tint){
  ctx.save();
  ctx.translate(x,y);
  const bounce=Math.abs(Math.sin(phase))*bSz;
  const squash=0.9+Math.abs(Math.sin(phase))*0.15;
  // 身体
  ctx.save();ctx.scale(1/squash,squash);
  ctx.fillStyle=col;ctx.shadowColor='rgba(255,180,200,0.5)';ctx.shadowBlur=bSz*0.3;
  ctx.beginPath();ctx.ellipse(0,bounce+bSz*0.3,0,bSz*0.5,bSz*0.5,0,Math.PI*2);ctx.fill();ctx.restore();
  // 头
  ctx.fillStyle=col;
  ctx.beginPath();ctx.arc(0,-bSz*0.4+bounce,0,bSz*0.35,bSz*0.35,0,Math.PI*2);ctx.fill();
  // 长耳朵
  const earT=Math.sin(phase*2)*0.15;
  ctx.fillStyle=col;
  ctx.beginPath();ctx.ellipse(-bSz*0.2,-bSz*1.0+bounce,0,bSz*0.1,bSz*0.28,earT-0.3,earT-0.3+Math.PI*2);ctx.fill();
  ctx.beginPath();ctx.ellipse(bSz*0.2,-bSz*1.0+bounce,0,bSz*0.1,bSz*0.28,-earT-0.3,-earT-0.3+Math.PI*2);ctx.fill();
  // 耳廓（粉色）
  ctx.fillStyle='#ffc8dd';
  ctx.beginPath();ctx.ellipse(-bSz*0.2,-bSz*1.0+bounce,0,bSz*0.05,bSz*0.15,0,Math.PI*2);ctx.fill();
  ctx.beginPath();ctx.ellipse(bSz*0.2,-bSz*1.0+bounce,0,bSz*0.05,bSz*0.15,0,Math.PI*2);ctx.fill();
  // 眼睛
  ctx.fillStyle='#333';
  ctx.beginPath();ctx.arc(-bSz*0.12,-bSz*0.42+bounce,0,bSz*0.06,bSz*0.06,0,Math.PI*2);ctx.fill();
  ctx.beginPath();ctx.arc(bSz*0.12,-bSz*0.42+bounce,0,bSz*0.06,bSz*0.06,0,Math.PI*2);ctx.fill();
  // 高光
  ctx.fillStyle='rgba(255,255,255,0.8)';
  ctx.beginPath();ctx.arc(-bSz*0.1,-bSz*0.44+bounce,0,bSz*0.025,bSz*0.025,0,Math.PI*2);ctx.fill();
  ctx.beginPath();ctx.arc(bSz*0.14,-bSz*0.44+bounce,0,bSz*0.025,bSz*0.025,0,Math.PI*2);ctx.fill();
  // 鼻子
  ctx.fillStyle='#ff9eb5';
  ctx.beginPath();ctx.arc(0,-bSz*0.3+bounce,0,bSz*0.05,bSz*0.05,0,Math.PI*2);ctx.fill();
  // 腮红
  ctx.fillStyle='rgba(255,150,180,0.3)';
  ctx.beginPath();ctx.arc(-bSz*0.2,-bSz*0.3+bounce,0,bSz*0.08,bSz*0.08,0,Math.PI*2);ctx.fill();
  ctx.beginPath();ctx.arc(bSz*0.2,-bSz*0.3+bounce,0,bSz*0.08,bSz*0.08,0,Math.PI*2);ctx.fill();
  // 前脚（跳起时收起来）
  ctx.fillStyle=col;
  if(Math.sin(phase)<0.2){
    ctx.beginPath();ctx.ellipse(-bSz*0.2,bSz*0.7+bounce*0.5,0,bSz*0.1,bSz*0.06,0,0,Math.PI*2);ctx.fill();
    ctx.beginPath();ctx.ellipse(bSz*0.2,bSz*0.7+bounce*0.5,0,bSz*0.1,bSz*0.06,0,0,Math.PI*2);ctx.fill();
  }
  // 后脚
  ctx.beginPath();ctx.ellipse(-bSz*0.35,bSz*0.5+bounce*0.3,0,bSz*0.15,bSz*0.08,Math.PI*0.3,Math.PI*0.3+Math.PI*2);ctx.fill();
  ctx.beginPath();ctx.ellipse(bSz*0.35,bSz*0.5+bounce*0.3,0,bSz*0.15,bSz*0.08,-Math.PI*0.3,-Math.PI*0.3+Math.PI*2);ctx.fill();
  // 小尾巴
  ctx.fillStyle=col;ctx.shadowColor='rgba(255,180,200,0.3)';ctx.shadowBlur=bSz*0.2;
  ctx.beginPath();ctx.arc(0,bSz*0.7,0,bSz*0.18,bSz*0.18,0,Math.PI*2);ctx.fill();
  ctx.restore();
}

class Bunny{
  constructor(){
    this.reset();
  }
  reset(){
    this.x=-80-Math.random()*400;this.y=200+Math.random()*(H-400);
    this.baseSpd=(0.8+Math.random()*0.8)*baseSpd;
    this.sz=(30+Math.random()*20)*sz;this.phase=Math.random()*Math.PI*2;
    this.phaseSpd=0.06+Math.random()*0.03;this.col='${bunnyColor}';
  }
  update(){
    this.x+=this.baseSpd;this.phase+=this.phaseSpd;
    if(this.x>W+100)this.reset();
  }
  draw(){
    drawBunny(this.x,this.y,this.sz,this.phase,this.col);
  }
}

const bunnies=[];
for(let i=0;i<${Math.round(p.bunnyCount)};i++){
  const b=new Bunny();
  b.x+=i*200;
  bunnies.push(b);
}

function animate(){
  ctx.clearRect(0,0,W,H);
  bunnies.forEach(b=>{b.update();b.draw()});
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
  'flying-sheep': flyingSheep,
  'kawaii-sparkles': kawaiiSparkles,
  'firefly-night': fireflyNight,
  'bunny-parade': bunnyParade,
  getPresets: () => presetConfigs
};
