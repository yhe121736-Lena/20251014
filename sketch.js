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

// *** 計分與遊戲狀態變數 (新增/修改) ***
let score = 0; 
let gameState = 'PLAYING'; // 'PLAYING', 'GAMEOVER'
const gameDuration = 30; // 遊戲總時長 (秒)
let timerStart; // 記錄遊戲開始的時間戳 (millis())

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
    this.alpha -= 1.4; // 粒子壽命：約 3 秒
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

// 小圓粒子類別
class CircleParticle {
  constructor(x, y, color) {
    this.x = x;
    this.y = y;
    let angle = random(TWO_PI);
    let speed = random(22, 44);
    this.vx = cos(angle) * speed;
    this.vy = sin(angle) * speed;
    this.size = random(48, 88);
    this.color = [
      min(255, color[0] + 30),
      min(255, color[1] + 30),
      min(255, color[2] + 30)
    ];
    this.alpha = 255;
    this.decayRate = 1.4; // 粒子壽命：約 3 秒
  }
  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.vx *= 0.91;
    this.vy *= 0.91;
    this.alpha -= this.decayRate; 
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
    this.alpha -= 1.4; // 粒子壽命：約 3 秒
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

// 小方塊旋轉噴濺粒子類別
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
    this.alpha -= 1.4; // 粒子壽命：約 3 秒
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

// 爆炸閃光粒子特效類別
class FlashParticle {
  constructor(x, y, color) {
    this.x = x;
    this.y = y;
    this.size = random(120, 260);
    this.color = color;
    this.alpha = 180;
    this.decay = 1.0; 
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

// 破掉特效類別
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
    this.alpha -= 1.4; // 粒子壽命：約 3 秒
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

// 超級明顯的爆破粒子特效
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
    this.grow = random(1.005, 1.015);
    this.shrink = random(0.985, 0.995);
    this.life = 0;
    this.maxLife = random(180, 200); 
  }
  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.vx *= this.shrink;
    this.vy *= this.shrink;
    // 調整：在整個生命週期中緩慢地改變大小
    if (this.life < this.maxLife / 4) {
      this.size *= this.grow;
    } else if (this.life > this.maxLife * 0.75) {
      this.size *= this.shrink;
    }
    this.alpha -= 1.4; // 粒子壽命：約 3 秒
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
let circleParticles = []; 
let burstCircles = [];   
let burstBoxParticles = []; 
let flashParticles = []; 
let shardParticles = []; 
let megaBlastParticles = []; 
let circles = [];

// 載入音效
function preload() {
  popSound = loadSound('balloon-pop-ni-sound-1-00-01.mp3');
}

// 產生氣球的專用函式
function setupCircles() {
  colorMode(HSB, 360, 100, 100, 255); // 夢幻色彩
  for (let i = 0; i < 100; i++) {
    let x = random(width);
    let y = random(height);
    let d = random(40, 200);
    let alpha = random(180, 255); 
    // 夢幻色調
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

// 重新開始遊戲，初始化所有參數
function resetGame() {
    score = 0;
    circles = [];
    particles = [];
    circleParticles = [];
    burstCircles = [];
    burstBoxParticles = [];
    flashParticles = [];
    shardParticles = [];
    megaBlastParticles = [];
    
    // 重新產生氣球
    setupCircles(); 
    
    gameState = 'PLAYING';
    timerStart = millis(); // 重設計時器開始時間
}


function setup() { //setup函式只會執行一次
  createCanvas(windowWidth, windowHeight);//建立一個全螢幕的畫布
  resetGame(); // 遊戲開始時進行初始化
}


function draw() {  //draw函式會一直重複執行，形成動畫效果
  background('#b8dbd9');//設定背景顏色為藍色

  // 畫布震動效果
  if (canvasShake > 0) {
    translate(random(-canvasShake, canvasShake), random(-canvasShake, canvasShake));
    canvasShake--;
  }

  if (gameState === 'PLAYING') {
    // 1. 處理所有粒子特效 (即使遊戲結束也繼續顯示直到消失)
    drawParticles();

    // 2. 處理衝擊波和閃光
    drawEffects();
    
    // 3. 繪製並移動氣球
    drawCircles();

    // 4. 繪製浮水印、計時器和分數
    drawTimerAndScore();
  } else if (gameState === 'GAMEOVER') {
    // 遊戲結束時：繼續繪製粒子特效，顯示結束畫面
    drawParticles();
    drawGameOver();
  }
}


// 繪製氣球
function drawCircles() {
  noStroke(); 
  for (let i = 0; i < circles.length; i++) {
    let c = circles[i];
    // 移動氣球
    let speed = map(c.d, 20, 120, 0.5, 5);
    c.y -= speed;
    if (c.y < -c.d/2) {
      c.y = height + c.d/2;
    }
    // 繪製氣球
    fill(c.r, c.g, c.b, c.alpha);
    ellipse(c.x, c.y, c.d, c.d);
    
    // 繪製方塊
    let boxOffset = c.d * 0.25;
    let boxSize = c.d * 0.2;
    let bx = c.x - boxOffset - boxSize/2;
    let by = c.y - boxOffset - boxSize/2;
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
}

// 繪製衝擊波和閃光
function drawEffects() {
  // 衝擊波圓環
  if (shockwave) {
    noFill();
    stroke(255,255,200, shockwave.alpha);
    strokeWeight(16 * shockwave.alpha/255);
    ellipse(shockwave.x, shockwave.y, shockwave.r, shockwave.r);
    shockwave.r += 32;
    shockwave.alpha -= 1.4; 
    if (shockwave.alpha <= 0) shockwave = null;
    noStroke();
  }

  // 全螢幕閃光
  if (flashFrame > 0) {
    fill(255,255,255, 120 * (flashFrame/flashMax));
    rect(0,0,width,height);
    flashFrame--;
  }
}

// 繪製和更新粒子 (獨立出來確保粒子總是在氣球之上)
function drawParticles() {
  let allParticles = [particles, circleParticles, burstCircles, burstBoxParticles, flashParticles, shardParticles, megaBlastParticles];

  for (let list of allParticles) {
    for (let i = list.length - 1; i >= 0; i--) {
      list[i].update();
      list[i].show();
      if (list[i].isDead()) {
        list.splice(i, 1);
      }
    }
  }
}

// 繪製計時器和分數
function drawTimerAndScore() {
  let margin = 15;
  
  // 計算剩餘時間
  let elapsedTime = (millis() - timerStart) / 1000;
  let timeLeft = max(0, gameDuration - elapsedTime);
  
  // 檢查遊戲是否結束
  if (timeLeft <= 0) {
    gameState = 'GAMEOVER';
  }

  // *** 1. 繪製左上角數字 (浮水印) ***
  push();
    fill(100, 100, 100, 180); // 浮水印顏色
    textSize(24);
    textAlign(LEFT, TOP); 
    text("414730191", margin, margin); 
  pop();

  // *** 2. 繪製右上角分數 ***
  push();
    fill(50); // 深灰色
    textSize(32); 
    textAlign(RIGHT, TOP); 
    text("Score: " + score, width - margin, margin); 
  pop();

  // *** 3. 繪製計時器 (上方中央) ***
  push();
    fill(50); // 深灰色
    textSize(48); // 放大計時器
    textAlign(CENTER, TOP);
    // 將時間格式化為秒 (取整數)
    let timerText = nf(ceil(timeLeft), 2); // nf(number, digits) 確保至少兩位數
    
    // 剩餘 5 秒以下變紅色警告
    if (timeLeft < 5) {
      fill(255, 0, 0); 
    }
    
    text(timerText, width / 2, margin);
  pop();
}

// 遊戲結束畫面
function drawGameOver() {
    // 遮罩效果
    fill(0, 0, 0, 150); // 半透明黑色
    rect(0, 0, width, height);
    
    push();
        // 標題
        fill(255, 255, 255);
        textSize(80);
        textAlign(CENTER, CENTER);
        text("GAME OVER", width / 2, height * 0.35);

        // 最終成績
        fill(255, 215, 0); // 金色
        textSize(64);
        text("FINAL SCORE: " + score, width / 2, height * 0.55);
        
        // 提示重玩
        fill(200, 200, 200);
        textSize(24);
        text("Click anywhere to restart", width / 2, height * 0.75);
    pop();
}


function mousePressed() {
  if (gameState === 'GAMEOVER') {
    // 遊戲結束時，點擊重新開始
    resetGame();
  } else if (gameState === 'PLAYING') {
    // 遊戲進行中，檢查是否點擊到某個氣球
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
}

// 播放爆破音效
function playPopSound() {
  if (popSound && popSound.isLoaded()) {
    popSound.play();
  }
}

// 爆破觸發函式
function triggerBalloonExplosion(idx) {
  let c = circles[idx];
  
  // *** 增加分數 ***
  score++; 

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

  // 產生各種粒子... (保持不變)
  let baseAngle = random(TWO_PI);
  for (let i = 0; i < 320; i++) { 
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
  for (let i = 0; i < 80; i++) {
    let colorArr = [255, 255, random(180,255)];
    let p = new Particle(c.x, c.y, colorArr);
    p.isSpark = true;
    particles.push(p);
  }
  for (let i = 0; i < 120; i++) {
    let color = [random(180,220), random(180,220), random(180,220)];
    let p = new Particle(c.x, c.y, color);
    p.isSmoke = true;
    particles.push(p);
  }
  for (let i = 0; i < 96; i++) {
    let colorArr = [c.r, c.g, c.b];
    let cp = new CircleParticle(c.x, c.y, colorArr);
    circleParticles.push(cp);
  }
  let burstCount = 36;
  for (let i = 0; i < burstCount; i++) {
    let angle = map(i, 0, burstCount, 0, TWO_PI);
    let speed = random(64, 120);
    let color = [c.r, c.g, c.b];
    burstBoxParticles.push(new BurstBoxParticle(c.x, c.y, color, angle, speed));
  }
  let burstCircleCount = 36;
  for (let i = 0; i < burstCircleCount; i++) {
    let angle = map(i, 0, burstCircleCount, 0, TWO_PI);
    let speed = random(64, 120);
    let color = [c.r, c.g, c.b];
    burstCircles.push(new BurstCircleParticle(c.x, c.y, color, angle, speed));
  }
  for (let i = 0; i < 3; i++) {
    let colorArr = [255, 255, 220];
    flashParticles.push(new FlashParticle(c.x, c.y, colorArr));
  }
  for (let i = 0; i < 2; i++) {
    let colorArr = [c.r, c.g, c.b];
    flashParticles.push(new FlashParticle(c.x, c.y, colorArr));
  }
  for (let i = 0; i < 24; i++) {
    shardParticles.push(new ShardParticle(c.x, c.y, [c.r, c.g, c.b]));
  }
  for (let i = 0; i < 12; i++) {
    megaBlastParticles.push(new MegaBlastParticle(c.x, c.y, [c.r, c.g, c.b]));
  }

  // 爆破後移除該圓
  circles.splice(idx, 1);
}