//兩個除號 // 代表註解
//這行程式碼不會被執行

let circles = [];
function setup() { //setup函式只會執行一次
  //createCanvas(400, 400);//建立一個400x400的畫布
  createCanvas(windowWidth, windowHeight);//建立一個全螢幕的畫布
  // 產生 50 個圓，每個圓顏色都不一樣且鮮艷
  for (let i = 0; i < 50; i++) {
    let x = random(width);
    let y = random(height);
  let d = random(40, 200);
    let alpha = random(180, 255); // 提高透明度下限
    // 產生鮮艷顏色（隨機一個分量較大，其他較小）
    let colorType = floor(random(3));
    let r, g, b;
    if (colorType === 0) {
      r = random(200, 255);
      g = random(0, 180);
      b = random(0, 180);
    } else if (colorType === 1) {
      r = random(0, 180);
      g = random(200, 255);
      b = random(0, 180);
    } else {
      r = random(0, 180);
      g = random(0, 180);
      b = random(200, 255);
    }
    circles.push({x, y, d, alpha, r, g, b});
  }
}

function draw() {  //draw函式會一直重複執行，形成動畫效果
  // ...existing code...

  //background('b8dbd9'); //設定背景顏色為灰色
  //把背景顏色改為b8dbd9
  background('#b8dbd9');//設定背景顏色為藍色
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
    fill(c.r, c.g, c.b, c.alpha);
    ellipse(c.x, c.y, c.d, c.d);
  }

}
