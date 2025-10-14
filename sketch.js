let flashFrame = 0;
let flashMax = 8;
let shockwave = null;
let canvasShake = 0;
// 爆破前抖動資訊
let shaking = false;
let shakeCircleIdx = -1;
let shakeFrame = 0;
let shakeMaxFrame = 14; // 抖動幀數
let shakeOffsets = [];
// 音效變數
let popSound;

// 爆破粒子類別
// 強化爆破粒子特效：增加數量、亮度、尺寸、慢速消失
class Particle {
  constructor(x, y, color) {
    this.x = x;
    this.y = y;
    let angle = random(TWO_PI);
    let speed = random(36, 72); // 更快更遠
    this.vx = cos(angle) * speed;
    this.vy = sin(angle) * speed;
    this.alpha = 255;
    // 讓顏色更亮
    this.color = [
      min(255, color[0] + 80),
      min(255, color[1] + 80),
      min(255, color[2] + 80)
    ];
    this.size = random(80, 160); // 更大
  }
  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.vx *= 0.91;
    this.vy *= 0.91;
    this.alpha -= 7; // 慢慢消失
  }
  show() {
    fill(this.color[0], this.color[1], this.color[2], this.alpha);
    noStroke();
    ellipse(this.x, this.y, this.size, this.size);
    // 強化亮光暈
    if (this.isSpark) {
      fill(255, 255, 255, this.alpha * 0.25);
      ellipse(this.x, this.y, this.size * 1.7, this.size * 1.7);
    }
    if (this.isSmoke) {
      fill(this.color[0], this.color[1], this.color[2], this.alpha * 0.7);
      ellipse(this.x, this.y, this.size * 1.2, this.size * 0.7);
    }
  }
  isDead() {
    return this.alpha <= 0;
  }
}

// 小圓粒子類別（取代小方塊）
class CircleParticle {
  constructor(x, y, color) {
    this.x = x;
    this.y = y;
    let angle = random(TWO_PI);
    let speed = random(22, 44);
    this.vx = cos(angle) * speed;
    this.vy = sin(angle) * speed;
    // 讓粒子更大
    this.size = random(48, 88);
    this.color = [
      min(255, color[0] + 30),
      min(255, color[1] + 30),
      min(255, color[2] + 30)
    ];
    this.alpha = 255;
  }
  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.vx *= 0.91;
    this.vy *= 0.91;
    // 讓粒子停留更久，減緩透明度衰減
    if (this.alpha > 60) {
      this.alpha -= 5;
      if (this.alpha < 60) this.alpha = 60;
    }
  }
  show() {
    noStroke();
    fill(this.color[0], this.color[1], this.color[2], this.alpha);
    ellipse(this.x, this.y, this.size, this.size);
    // 外圈描邊讓粒子更明顯
    stroke(40, 40, 40, this.alpha * 0.7);
    strokeWeight(2);
    noFill();
    ellipse(this.x, this.y, this.size + 2, this.size + 2);
    noStroke();
  }
  isDead() {
    return this.alpha <= 0;
  }
}

// 小圓噴濺粒子類別
class BurstCircleParticle {
  constructor(x, y, color, angle, speed) {
    this.x = x;
    this.y = y;
    this.vx = cos(angle) * speed;
    this.vy = sin(angle) * speed;
    // 更大更亮
    this.size = random(72, 120);
    this.color = [
      min(255, color[0] + 60),
      min(255, color[1] + 60),
      min(255, color[2] + 60)
    ];
    this.alpha = 255;
  }
  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.vx *= 0.93;
    this.vy *= 0.93;
    this.alpha -= 2; // 更慢消失
  }
  show() {
    noStroke();
    fill(this.color[0], this.color[1], this.color[2], this.alpha);
    ellipse(this.x, this.y, this.size, this.size);
    // 外圈亮暈
    fill(255, 255, 255, this.alpha * 0.18);
    ellipse(this.x, this.y, this.size * 1.5, this.size * 1.5);
  }
  isDead() {
    return this.alpha <= 0;
  }
}

// 新增：小方塊旋轉噴濺粒子類別
class BurstBoxParticle {
  constructor(x, y, color, angle, speed) {
    this.x = x;
    this.y = y;
    this.vx = cos(angle) * speed;
    this.vy = sin(angle) * speed;
    this.size = random(56, 96);
    this.color = [
      min(255, color[0] + 60),
      min(255, color[1] + 60),
      min(255, color[2] + 60)
    ];
    this.alpha = 255;
    this.rotation = random(TWO_PI);
    this.rotationSpeed = random(-0.7, 0.7);
  }
  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.vx *= 0.92;
    this.vy *= 0.92;
    this.alpha -= 6;
    this.rotation += this.rotationSpeed;
  }
  show() {
    push();
    translate(this.x, this.y);
    rotate(this.rotation);
    stroke(255, 255, 255, this.alpha * 0.7);
    strokeWeight(4);
    fill(this.color[0], this.color[1], this.color[2], this.alpha);
    rectMode(CENTER);
    rect(0, 0, this.size, this.size, 10);
    pop();
  }
  isDead() {
    return this.alpha <= 0;
  }
}

// 新增：爆炸閃光粒子特效類別
class FlashParticle {
  constructor(x, y, color) {
    this.x = x;
    this.y = y;
    this.size = random(120, 260);
    this.color = color;
    this.alpha = 180;
    this.decay = random(6, 12);
    this.angle = random(TWO_PI);
    this.rays = floor(random(8, 16));
  }
  update() {
    this.alpha -= this.decay;
  }
  show() {
    push();
    translate(this.x, this.y);
    // 中心閃光
    noStroke();
    fill(this.color[0], this.color[1], this.color[2], this.alpha * 0.7);
    ellipse(0, 0, this.size, this.size);
    // 放射光芒
    stroke(this.color[0], this.color[1], this.color[2], this.alpha);
    strokeWeight(4);
    for (let i = 0; i < this.rays; i++) {
      let a = this.angle + i * TWO_PI / this.rays;
      let len = this.size * random(0.7, 1.2);
      line(0, 0, cos(a) * len, sin(a) * len);
    }
    pop();
  }
  isDead() {
    return this.alpha <= 0;
  }
}

// 新增：破掉特效類別
class ShardParticle {
  constructor(x, y, color) {
    this.x = x;
    this.y = y;
    let angle = random(TWO_PI);
    let speed = random(60, 140);
    this.vx = cos(angle) * speed;
    this.vy = sin(angle) * speed;
    this.size = random(32, 80);
    this.color = [
      min(255, color[0] + 100),
      min(255, color[1] + 100),
      min(255, color[2] + 100)
    ];
    this.alpha = 255;
    this.rotation = random(TWO_PI);
    this.rotationSpeed = random(-0.5, 0.5);
    this.shapeType = random() < 0.5 ? 'triangle' : 'arc';
  }
  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.vx *= 0.92;
    this.vy *= 0.92;
    this.alpha -= 7;
    this.rotation += this.rotationSpeed;
  }
  show() {
    push();
    translate(this.x, this.y);
    rotate(this.rotation);
    noStroke();
    fill(this.color[0], this.color[1], this.color[2], this.alpha);
    if (this.shapeType === 'triangle') {
      triangle(
        0, -this.size * 0.5,
        -this.size * 0.3, this.size * 0.5,
        this.size * 0.3, this.size * 0.5
      );
    } else {
      arc(0, 0, this.size, this.size, PI + QUARTER_PI, TWO_PI, PIE);
    }
    pop();
  }
  isDead() {
    return this.alpha <= 0;
  }
}

// 新增：超級明顯的爆破粒子特效
class MegaBlastParticle {
  constructor(x, y, color) {
    this.x = x;
    this.y = y;
    let angle = random(TWO_PI);
    let speed = random(120, 260);
    this.vx = cos(angle) * speed;
    this.vy = sin(angle) * speed;
    this.size = random(180, 320);
    this.color = [
      min(255, color[0] + 120),
      min(255, color[1] + 120),
      min(255, color[2] + 120)
    ];
    this.alpha = 255;
    this.grow = random(1.02, 1.06);
    this.shrink = random(0.96, 0.99);
    this.life = 0;
    this.maxLife = random(18, 32);
  }
  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.vx *= this.shrink;
    this.vy *= this.shrink;
    if (this.life < this.maxLife / 2) {
      this.size *= this.grow;
    } else {
      this.size *= this.shrink;
    }
    this.alpha -= 8;
    this.life++;
  }
  show() {
    push();
    blendMode(ADD);
    noStroke();
    fill(255, 255, 255, this.alpha * 0.7);
    ellipse(this.x, this.y, this.size * 1.2, this.size * 1.2);
    fill(this.color[0], this.color[1], this.color[2], this.alpha);
    ellipse(this.x, this.y, this.size, this.size);
    pop();
  }
  isDead() {
    return this.alpha <= 0;
  }
}

let particles = [];
let circleParticles = []; // 華麗彩色粒子
let burstCircles = [];   // 新增：噴濺小圓粒子
let burstBoxParticles = []; // 新增：儲存小方塊旋轉粒子
let flashParticles = []; // 新增：爆炸閃光粒子陣列
let shardParticles = []; // 破掉特效陣列
let megaBlastParticles = []; // 超級明顯粒子特效陣列
let explosionTimer = 0;
let explosionInterval = 60; // 每60幀嘗試爆破一次
let circles = [];

// 載入音效
function preload() {
  popSound = loadSound('balloon-pop-ni-sound-1-00-01.mp3');
}

function setup() { //setup函式只會執行一次
  createCanvas(windowWidth, windowHeight);//建立一個全螢幕的畫布
  colorMode(HSB, 360, 100, 100, 255); // 夢幻色彩
  // 產生 100 個圓，每個圓顏色都不一樣且鮮艷
  for (let i = 0; i < 100; i++) {
    let x = random(width);
    let y = random(height);
    let d = random(40, 200);
    let alpha = random(180, 255); // 提高透明度下限
    // 夢幻色調：隨機漸層、亮色、柔和
    let baseHue = random(0, 360);
    let r = color(baseHue, random(60, 100), random(80, 100), alpha);
    let g = color((baseHue + random(20, 60)) % 360, random(40, 80), random(80, 100), alpha);
    let b = color((baseHue + random(60, 120)) % 360, random(40, 80), random(80, 100), alpha);
    // 取平均色調
    let rgb = lerpColor(r, g, 0.5);
    rgb = lerpColor(rgb, b, 0.5);
    let cRGB = rgb.levels;
    circles.push({x, y, d, alpha, r: cRGB[0], g: cRGB[1], b: cRGB[2], baseHue});
  }
  colorMode(RGB, 255, 255, 255, 255); // 還原
}

function draw() {  //draw函式會一直重複執行，形成動畫效果
  // 1. 繪製背景 (只做一次)
  background('#b8dbd9');//設定背景顏色為藍色

  // 2. 畫布震動效果 (需要在背景之前，因為它影響整個畫布的 translate)
  if (canvasShake > 0) {
    translate(random(-canvasShake, canvasShake), random(-canvasShake, canvasShake));
    canvasShake--;
  }

  // 3. 衝擊波圓環
  if (shockwave) {
    noFill();
    stroke(255,255,200, shockwave.alpha);
    strokeWeight(16 * shockwave.alpha/255);
    ellipse(shockwave.x, shockwave.y, shockwave.r, shockwave.r);
    shockwave.r += 32;
    shockwave.alpha -= 18;
    if (shockwave.alpha <= 0) shockwave = null;
    noStroke();
  }

  // 4. 全螢幕閃光
  if (flashFrame > 0) {
    fill(255,255,255, 120 * (flashFrame/flashMax));
    rect(0,0,width,height);
    flashFrame--;
  }

  // 5. 更新與顯示所有粒子 (在氣球和背景之上繪製，確保粒子不被覆蓋)
  
  // 更新與顯示所有粒子
  for (let i = particles.length - 1; i >= 0; i--) {
    particles[i].update();
    particles[i].show();
    if (particles[i].isDead()) {
      particles.splice(i, 1);
    }
  }

  // 更新與顯示所有小圓粒子
  for (let i = circleParticles.length - 1; i >= 0; i--) {
    circleParticles[i].update();
    circleParticles[i].show();
    if (circleParticles[i].isDead()) {
      circleParticles.splice(i, 1);
    }
  }

  // 更新與顯示所有小圓噴濺粒子
  for (let i = burstCircles.length - 1; i >= 0; i--) {
    burstCircles[i].update();
    burstCircles[i].show();
    if (burstCircles[i].isDead()) {
      burstCircles.splice(i, 1);
    }
  }

  // 更新與顯示所有小方塊旋轉噴濺粒子
  for (let i = burstBoxParticles.length - 1; i >= 0; i--) {
    burstBoxParticles[i].update();
    burstBoxParticles[i].show();
    if (burstBoxParticles[i].isDead()) {
      burstBoxParticles.splice(i, 1);
    }
  }

  // 更新與顯示所有爆炸閃光粒子
  for (let i = flashParticles.length - 1; i >= 0; i--) {
    flashParticles[i].update();
    flashParticles[i].show();
    if (flashParticles[i].isDead()) {
      flashParticles.splice(i, 1);
    }
  }

  // 更新與顯示所有破掉特效粒子
  for (let i = shardParticles.length - 1; i >= 0; i--) {
    shardParticles[i].update();
    shardParticles[i].show();
    if (shardParticles[i].isDead()) {
      shardParticles.splice(i, 1);
    }
  }

  // 更新與顯示所有超級明顯的爆破粒子 (確保它們在最上層)
  for (let i = megaBlastParticles.length - 1; i >= 0; i--) {
    megaBlastParticles[i].update();
    megaBlastParticles[i].show();
    if (megaBlastParticles[i].isDead()) {
      megaBlastParticles.splice(i, 1);
    }
  }
  
  // 6. 繪製氣球
  noStroke(); // 取消外框線
  // 讓每個圓由下往上飄，越大越快，越小越慢，移出畫面頂端後從底部重新出現
  for (let i = 0; i < circles.length; i++) {
    let c = circles[i];
    // 速度與圓的大小成正比，最小速度 0.5，最大速度 5
    let speed = map(c.d, 20, 120, 0.5, 5);
    c.y -= speed;
    if (c.y < -c.d/2) {
      c.y = height + c.d/2;
    }
    // 夢幻色彩
    fill(c.r, c.g, c.b, c.alpha);
    ellipse(c.x, c.y, c.d, c.d);
    // 在圓的左上方(圓內)加上一個星星圖案（在方塊右側，不擋住方塊）
    let boxOffset = c.d * 0.25;
    let boxSize = c.d * 0.2;
    let bx = c.x - boxOffset - boxSize/2;
    let by = c.y - boxOffset - boxSize/2;

    // 保留原本的立體方塊
    // 陰影
    noStroke();
    fill(30, 30, 30, c.alpha * 0.7);
    rect(bx + boxSize*0.12, by + boxSize*0.12, boxSize, boxSize, 3);
    // 主體
    fill(70, 70, 70, c.alpha);
    rect(bx, by, boxSize, boxSize, 3);
    // 高光
    fill(200, 200, 200, c.alpha * 0.5);
    rect(bx + boxSize*0.08, by + boxSize*0.08, boxSize*0.5, boxSize*0.18, 2);
  }

  // 7. 繪製左上角數字 (在所有氣球之後，確保數字在氣球之上)
  push();
    // 數字顏色
    fill(50); // 深灰色
    // 數字大小
    textSize(24);
    // 文字對齊方式：靠左對齊 (LEFT) 和 靠上對齊 (TOP)
    textAlign(LEFT, TOP); 
    // 繪製文字
    let displayText = "414730191";
    let margin = 15; // 距離邊緣 15 像素
    // 繪製座標：(margin, margin) 即可將文字頂部和左側內縮 margin 距離
    text(displayText, margin, margin); 
  pop();

  // 繪製星星的輔助函式
  function drawStar(x, y, radius1, radius2, npoints, alpha) {
    let angle = TWO_PI / npoints;
    let halfAngle = angle / 2.0;
    fill(255, 215, 0, alpha); // 金黃色
    noStroke();
    beginShape();
    for (let a = 0; a < TWO_PI; a += angle) {
      let sx = x + cos(a) * radius1;
      let sy = y + sin(a) * radius1;
      vertex(sx, sy);
      sx = x + cos(a + halfAngle) * radius2;
      sy = y + sin(a + halfAngle) * radius2;
      vertex(sx, sy);
    }
    endShape(CLOSE);
  }
}

// 播放爆破音效
function playPopSound() {
  if (popSound && popSound.isLoaded()) {
    popSound.play();
  }
}

function mousePressed() {
  // 檢查是否點擊到某個氣球
  for (let i = 0; i < circles.length; i++) {
    let c = circles[i];
    let dx = mouseX - c.x;
    let dy = mouseY - c.y;
    let d = sqrt(dx * dx + dy * dy);
    if (d < c.d / 2) {
      // 觸發爆破
      triggerBalloonExplosion(i);
      break;
    }
  }
}

// 新增：爆破觸發函式
function triggerBalloonExplosion(idx) {
  let c = circles[idx];
  // 爆破音效
  playPopSound();
  // 畫布震動
  canvasShake = 16;
  // 全螢幕閃光
  flashFrame = flashMax;
  // 衝擊波圓環
  shockwave = {x: c.x, y: c.y, r: c.d * 1.2, alpha: 255};

  // 華麗光暈
  push();
  blendMode(ADD);
  for (let i = 0; i < 4; i++) {
    let glowAlpha = 120 - i * 28;
    fill(255, 255, 200, glowAlpha);
    ellipse(c.x, c.y, c.d * (3.2 + i * 0.7), c.d * (3.2 + i * 0.7));
  }
  pop();

  // 星芒特效
  push();
  blendMode(ADD);
  for (let i = 0; i < 8; i++) {
    let angle = i * PI / 4;
    stroke(255, 255, 200, 180);
    strokeWeight(4);
    let len = c.d * 2.2;
    line(
      c.x,
      c.y,
      c.x + cos(angle) * len,
      c.y + sin(angle) * len
    );
  }
  pop();

  // 強化爆破特效：增加數量
  let baseAngle = random(TWO_PI);
  for (let i = 0; i < 320; i++) { // 增加火花數量
    let angle = baseAngle + random(-PI/2, PI/2);
    let speed = random(72, 140);
    let colorArr = [c.r, c.g, c.b];
    let p = new Particle(c.x, c.y, colorArr);
    p.isSpark = true;
    p.vx = cos(angle) * speed;
    p.vy = sin(angle) * speed;
    p.size = random(100, 180);
    particles.push(p);
  }
  // 產生亮色火花粒子
  for (let i = 0; i < 80; i++) {
    let colorArr = [255, 255, random(180,255)];
    let p = new Particle(c.x, c.y, colorArr);
    p.isSpark = true;
    particles.push(p);
  }
  // 產生煙霧粒子
  for (let i = 0; i < 120; i++) {
    let color = [random(180,220), random(180,220), random(180,220)];
    let p = new Particle(c.x, c.y, color);
    p.isSmoke = true;
    particles.push(p);
  }
  // 產生同顏色小圓粒子（華麗漸層/彩虹）
  for (let i = 0; i < 96; i++) {
    let colorArr = [c.r, c.g, c.b];
    let cp = new CircleParticle(c.x, c.y, colorArr);
    circleParticles.push(cp);
  }

  // 產生同顏色小方塊旋轉噴濺粒子
  let burstCount = 36;
  for (let i = 0; i < burstCount; i++) {
    let angle = map(i, 0, burstCount, 0, TWO_PI);
    let speed = random(64, 120);
    let color = [c.r, c.g, c.b];
    burstBoxParticles.push(new BurstBoxParticle(c.x, c.y, color, angle, speed));
  }

  // 產生同顏色小圓噴濺粒子
  let burstCircleCount = 36;
  for (let i = 0; i < burstCircleCount; i++) {
    let angle = map(i, 0, burstCircleCount, 0, TWO_PI);
    let speed = random(64, 120);
    let color = [c.r, c.g, c.b];
    burstCircles.push(new BurstCircleParticle(c.x, c.y, color, angle, speed));
  }

  // 新增：產生爆炸閃光粒子特效
  for (let i = 0; i < 3; i++) {
    let colorArr = [255, 255, 220];
    flashParticles.push(new FlashParticle(c.x, c.y, colorArr));
  }
  for (let i = 0; i < 2; i++) {
    let colorArr = [c.r, c.g, c.b];
    flashParticles.push(new FlashParticle(c.x, c.y, colorArr));
  }

  // 新增：產生破掉特效粒子
  for (let i = 0; i < 24; i++) {
    shardParticles.push(new ShardParticle(c.x, c.y, [c.r, c.g, c.b]));
  }

  // 新增：產生超級明顯的爆破粒子特效
  for (let i = 0; i < 12; i++) {
    megaBlastParticles.push(new MegaBlastParticle(c.x, c.y, [c.r, c.g, c.b]));
  }

  // 爆破後移除該圓
  circles.splice(idx, 1);
}