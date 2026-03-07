// Tween이 직접 조작하는 속성들을 가진 데이터 클래스
// 모든 숫자 속성은 애니메이션 대상

export class Digit {
  text: string;
  x: number;
  y: number;
  scale = 0;
  opacity = 0;
  color: string;
  fontSize: number;

  constructor(
    text: string,
    x: number,
    y: number,
    fontSize: number,
    color = "#222222",
  ) {
    this.text = text;
    this.x = x;
    this.y = y;
    this.fontSize = fontSize;
    this.color = color;
  }
}

export class Highlight {
  x: number;
  y: number;
  width: number;
  height: number;
  opacity = 0;
  color: string;

  constructor(
    x: number,
    y: number,
    width: number,
    height: number,
    color = "rgba(66,133,244,0.15)",
  ) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.color = color;
  }
}

export class RuleLine {
  x1: number;
  y: number;
  x2: number;
  opacity = 0;
  color: string;
  lineWidth: number;

  constructor(
    x1: number,
    y: number,
    x2: number,
    color = "#333333",
    lineWidth = 2,
  ) {
    this.x1 = x1;
    this.y = y;
    this.x2 = x2;
    this.color = color;
    this.lineWidth = lineWidth;
  }
}

export class MiniboxBg {
  x: number;
  y: number;
  width: number;
  height: number;
  opacity = 0;
  color: string;
  radius: number;

  constructor(
    x: number,
    y: number,
    width: number,
    height: number,
    color = "rgba(245,245,245,0.95)",
    radius = 8,
  ) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.color = color;
    this.radius = radius;
  }
}
