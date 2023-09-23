'use strict';

var View = /* @__PURE__ */ ((View2) => {
  View2["Game"] = ".view.game";
  View2["Menu"] = ".view.menu";
  View2["GameOver"] = ".view.gameover";
  return View2;
})(View || {});
class ViewHelper {
  static activateView(view) {
    const newView = document.querySelector(view);
    const oldView = document.querySelector(".view.active");
    oldView.classList.remove("active");
    newView.classList.add("active");
  }
}

function buildShaderProgram(gl, shaderInfo) {
  const program = gl.createProgram();
  shaderInfo.forEach((desc) => {
    const shader = compileShader(gl, desc.id, desc.type);
    if (shader) {
      gl.attachShader(program, shader);
    }
  });
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.log("Error linking shader program:");
    console.log(gl.getProgramInfoLog(program));
  }
  return program;
}
function compileShader(gl, id, type) {
  const code = document.getElementById(id).firstChild.nodeValue;
  const shader = gl.createShader(type);
  gl.shaderSource(shader, code);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.log(
      `Error compiling ${type === gl.VERTEX_SHADER ? "vertex" : "fragment"} shader:`
    );
    console.log(gl.getShaderInfoLog(shader));
  }
  return shader;
}
let shaderProgram$1;
class ShaderHelper {
  static setupShaders() {
    const gl = CanvasHelper.getContext();
    const shaderSet = [
      {
        type: gl.VERTEX_SHADER,
        id: "vertex-shader"
      },
      {
        type: gl.FRAGMENT_SHADER,
        id: "fragment-shader"
      }
    ];
    shaderProgram$1 = buildShaderProgram(gl, shaderSet);
  }
  static getShaderProgram() {
    return shaderProgram$1;
  }
}

const glCanvas = document.querySelector(".tetris-canvas");
const gl$1 = glCanvas.getContext("webgl");
let fieldHeight;
let fieldWidth;
let blockHeight;
let blockwidth;
let blockHeightPixels;
let blockwidthPixels;
let vertexBuffer;
let uBlockColor;
let uCenterCoord;
let uSizePixels;
let uSize;
let uTransform;
let aVertexPosition;
class CanvasHelper {
  static setupCanvas() {
    glCanvas.width = glCanvas.clientWidth;
    glCanvas.height = glCanvas.clientHeight;
    vertexBuffer = gl$1.createBuffer();
    gl$1.bindBuffer(gl$1.ARRAY_BUFFER, vertexBuffer);
  }
  static initGame(stack) {
    fieldHeight = stack.height;
    fieldWidth = stack.width;
    blockHeight = 2 / stack.height;
    blockwidth = 2 / stack.width;
    blockHeightPixels = glCanvas.clientHeight / stack.height;
    blockwidthPixels = glCanvas.clientWidth / stack.width;
  }
  static getContext() {
    return gl$1;
  }
  static newFrame() {
    gl$1.viewport(0, 0, glCanvas.width, glCanvas.height);
    gl$1.clear(gl$1.COLOR_BUFFER_BIT);
  }
  static fetchUniforms(shaderProgram) {
    if (!uBlockColor) {
      uBlockColor = gl$1.getUniformLocation(shaderProgram, "uBlockColor");
      uCenterCoord = gl$1.getUniformLocation(shaderProgram, "uCenterCoord");
      uSizePixels = gl$1.getUniformLocation(shaderProgram, "uSizePixels");
      uSize = gl$1.getUniformLocation(shaderProgram, "uSize");
      uTransform = gl$1.getUniformLocation(shaderProgram, "uTransform");
      aVertexPosition = gl$1.getAttribLocation(shaderProgram, "aVertexPosition");
    }
    gl$1.uniform2fv(uSizePixels, [blockwidthPixels, blockHeightPixels]);
    gl$1.uniform2fv(uSize, [blockwidth, blockHeight]);
  }
  static drawShape(shape) {
    const shaderProgram = ShaderHelper.getShaderProgram();
    CanvasHelper.fetchUniforms(shaderProgram);
    let left = shape.position.x / fieldWidth * 2 - 1;
    let top = shape.position.y / fieldHeight * -2 + 1;
    let right = left + blockwidth;
    let bottom = top - blockHeight;
    let centerX = shape.position.x * blockwidthPixels + blockwidthPixels / 2;
    let centerY = (fieldHeight - shape.position.y) * blockHeightPixels - blockHeightPixels / 2;
    gl$1.uniform3fv(uTransform, [shape.animate.x, shape.animate.y, 0]);
    for (const row of shape.blocks) {
      for (const block of row) {
        if (block) {
          gl$1.uniform2fv(uCenterCoord, [centerX, centerY]);
          gl$1.uniform3fv(uBlockColor, [shape.color.r, shape.color.g, shape.color.b]);
          const vertexArray = new Float32Array([
            left,
            top,
            right,
            top,
            right,
            bottom,
            left,
            top,
            right,
            bottom,
            left,
            bottom
          ]);
          const vertexNumComponents = 2;
          gl$1.bufferData(gl$1.ARRAY_BUFFER, vertexArray, gl$1.DYNAMIC_DRAW);
          gl$1.bindBuffer(gl$1.ARRAY_BUFFER, vertexBuffer);
          const vertexCount = vertexArray.length / vertexNumComponents;
          gl$1.enableVertexAttribArray(aVertexPosition);
          gl$1.vertexAttribPointer(
            aVertexPosition,
            vertexNumComponents,
            gl$1.FLOAT,
            false,
            0,
            0
          );
          gl$1.drawArrays(gl$1.TRIANGLES, 0, vertexCount);
        }
        left += blockwidth;
        right += blockwidth;
        centerX += blockwidthPixels;
      }
      left = shape.position.x / fieldWidth * 2 - 1;
      right = left + blockwidth;
      top -= blockHeight;
      bottom -= blockHeight;
      centerX = shape.position.x * blockwidthPixels + blockwidthPixels / 2;
      centerY -= blockHeightPixels;
    }
  }
  static drawStack(stack) {
    const shaderProgram = ShaderHelper.getShaderProgram();
    CanvasHelper.fetchUniforms(shaderProgram);
    gl$1.uniform3fv(uTransform, [0, 0, 0]);
    let left = -1;
    let top = 1;
    let right = left + blockwidth;
    let bottom = top - blockHeight;
    let centerX = blockwidthPixels / 2;
    let centerY = fieldHeight * blockHeightPixels - blockHeightPixels / 2;
    for (const row of stack.blocks) {
      for (const block of row) {
        if (block) {
          gl$1.uniform2fv(uCenterCoord, [centerX, centerY]);
          gl$1.uniform3fv(uBlockColor, [block.color.r, block.color.g, block.color.b]);
          const vertexArray = new Float32Array([
            left,
            top,
            right,
            top,
            right,
            bottom,
            left,
            top,
            right,
            bottom,
            left,
            bottom
          ]);
          const vertexNumComponents = 2;
          gl$1.bufferData(gl$1.ARRAY_BUFFER, vertexArray, gl$1.DYNAMIC_DRAW);
          gl$1.bindBuffer(gl$1.ARRAY_BUFFER, vertexBuffer);
          const vertexCount = vertexArray.length / vertexNumComponents;
          gl$1.enableVertexAttribArray(aVertexPosition);
          gl$1.vertexAttribPointer(
            aVertexPosition,
            vertexNumComponents,
            gl$1.FLOAT,
            false,
            0,
            0
          );
          gl$1.drawArrays(gl$1.TRIANGLES, 0, vertexCount);
        }
        left += blockwidth;
        right += blockwidth;
        centerX += blockwidthPixels;
      }
      left = -1;
      right = left + blockwidth;
      top -= blockHeight;
      bottom -= blockHeight;
      centerX = blockwidthPixels / 2;
      centerY -= blockHeightPixels;
    }
  }
}

class Shape {
  constructor(blocks, position, color) {
    this.blocks = blocks;
    this.position = position;
    this.color = color;
  }
  animate = { x: 0, y: 0 };
  get height() {
    return this.blocks.length;
  }
  get width() {
    return this.blocks[0].length;
  }
  rotate() {
    const newBlocks = [];
    for (let rowId = this.height - 1; rowId >= 0; rowId--) {
      const row = this.blocks[rowId];
      for (let blockId = 0; blockId < row.length; blockId++) {
        if (!newBlocks[blockId]) {
          newBlocks[blockId] = [];
        }
        newBlocks[blockId][this.height - rowId - 1] = row[blockId];
      }
    }
    this.blocks = newBlocks;
  }
  static clone(shape) {
    const data = JSON.parse(JSON.stringify(shape));
    return new Shape(data.blocks, data.position, data.color);
  }
}

class Stack {
  constructor(width, height) {
    this.width = width;
    this.height = height;
    for (let rowId = 0; rowId < this.height; rowId++) {
      const row = [];
      this.blocks.push(row);
      for (let cellId = 0; cellId < this.width; cellId++) {
        row.push(null);
      }
    }
  }
  blocks = [];
  checkCollision(shape) {
    const result = {
      hits: false,
      hitsRight: shape.position.x + shape.width >= this.width,
      hitsLeft: shape.position.x <= 0,
      hitsBelow: shape.position.y + shape.height >= this.height
    };
    const colsHad = new Array(this.width);
    for (let shapeRowId = shape.height - 1; shapeRowId >= 0; shapeRowId--) {
      const shapeRow = shape.blocks[shapeRowId];
      let leftCheckDone = false;
      for (let shapeCellId = 0; shapeCellId < shapeRow.length; shapeCellId++) {
        const shapeCell = shapeRow[shapeCellId];
        if (!shapeCell)
          continue;
        if (!result.hitsBelow && !colsHad[shapeCellId] && colsHad.includes(void 0)) {
          if (this.blocks[shape.position.y + shapeRowId + 1][shape.position.x + shapeCellId]) {
            result.hitsBelow = true;
          }
          colsHad[shapeCellId] = 1;
        }
        if (!result.hitsLeft && !leftCheckDone) {
          if (this.blocks[shape.position.y + shapeRowId][shape.position.x + shapeCellId - 1]) {
            result.hitsLeft = true;
          }
          leftCheckDone = true;
        }
        if (!result.hitsRight) {
          if (this.blocks[shape.position.y + shapeRowId][shape.position.x + shapeCellId + 1]) {
            result.hitsRight = true;
          }
        }
      }
    }
    return result;
  }
  addShape(shape) {
    for (let shapeRowId = 0; shapeRowId < shape.height; shapeRowId++) {
      const shapeRow = shape.blocks[shapeRowId];
      for (let shapeCellId = 0; shapeCellId < shapeRow.length; shapeCellId++) {
        const shapeCell = shapeRow[shapeCellId];
        if (!shapeCell)
          continue;
        this.blocks[shape.position.y + shapeRowId][shape.position.x + shapeCellId] = { color: shape.color };
      }
    }
    this.clearFullRows();
  }
  clearFullRows() {
    this.blocks = this.blocks.filter((row) => row.some((block) => !block));
    while (this.blocks.length < this.height) {
      const row = [];
      this.blocks = [row, ...this.blocks];
      for (let cellId = 0; cellId < this.width; cellId++) {
        row.push(null);
      }
    }
  }
}

CanvasHelper.setupCanvas();
ShaderHelper.setupShaders();
const gl = CanvasHelper.getContext();
const shaderProgram = ShaderHelper.getShaderProgram();
gl.useProgram(shaderProgram);
function rgbFromHue(h) {
  const s = 0.8;
  const l = 0.45;
  const k = (n) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  return {
    r: f(0),
    g: f(8),
    b: f(4)
  };
}
class Game {
  activeShape;
  previousTick = 0;
  stack;
  possibleShapes = [
    new Shape(
      [[true, true, true, true]],
      { x: 4, y: 0 },
      rgbFromHue(190)
      //turqoise
    ),
    new Shape(
      [
        [true, false],
        [true, false],
        [true, true]
      ],
      { x: 5, y: 0 },
      rgbFromHue(25)
      //orange
    ),
    new Shape(
      [
        [false, true],
        [false, true],
        [true, true]
      ],
      { x: 5, y: 0 },
      rgbFromHue(240)
      // blue
    ),
    new Shape(
      [
        [true, true],
        [true, true]
      ],
      { x: 4, y: 0 },
      rgbFromHue(55)
      //yellow
    ),
    new Shape(
      [
        [true, false],
        [true, true],
        [false, true]
      ],
      { x: 5, y: 0 },
      rgbFromHue(120)
      //green
    ),
    new Shape(
      [
        [false, true],
        [true, true],
        [true, false]
      ],
      { x: 5, y: 0 },
      rgbFromHue(0)
      //red
    ),
    new Shape(
      [
        [true, true, true],
        [false, true, false]
      ],
      { x: 4, y: 0 },
      rgbFromHue(270)
      //purple
    )
  ];
  previousinteractionTick = 0;
  interactionHappened = false;
  constructor() {
    this.drawFrame = this.drawFrame.bind(this);
    this.onKeyDown = this.onKeyDown.bind(this);
    window.addEventListener("keydown", this.onKeyDown);
  }
  start() {
    this.stack = new Stack(10, 20);
    CanvasHelper.initGame(this.stack);
    this.newShape();
    this.previousTick = 0;
    CanvasHelper.newFrame();
    requestAnimationFrame(this.drawFrame);
  }
  onKeyDown(event) {
    this.interactionHappened = true;
    if (event.keyCode == 37 && !this.stack.checkCollision(this.activeShape).hitsLeft) {
      this.activeShape.position.x--;
    }
    if (event.keyCode == 39 && !this.stack.checkCollision(this.activeShape).hitsRight) {
      this.activeShape.position.x++;
    }
    if (event.keyCode == 38) {
      this.activeShape.rotate();
    }
    if (event.keyCode == 40) {
      while (!this.stack.checkCollision(this.activeShape).hitsBelow) {
        this.activeShape.position.y += 1;
      }
      this.stack.addShape(this.activeShape);
      this.newShape();
    }
  }
  drawFrame(currentTime) {
    if (!this.previousTick) {
      this.previousTick = currentTime;
      requestAnimationFrame(this.drawFrame);
      return;
    }
    if (this.interactionHappened) {
      this.previousinteractionTick = currentTime;
      this.interactionHappened = false;
    }
    const delta = currentTime - this.previousTick;
    if (this.activeShape.animate.y < 0) {
      this.activeShape.animate.y = -(1 / 200 * (200 - delta));
      if (this.activeShape.animate.y > 0) {
        this.activeShape.animate.y = 0;
      }
    }
    const interactionDelta = currentTime - this.previousinteractionTick;
    if (delta > 200) {
      this.previousTick = currentTime;
      const hitsBelow = this.stack.checkCollision(
        this.activeShape
      ).hitsBelow;
      if (hitsBelow && interactionDelta > 200) {
        this.stack.addShape(this.activeShape);
        this.newShape();
      } else if (!hitsBelow) {
        this.activeShape.position.y += 1;
        this.activeShape.animate.y = -1;
        if (interactionDelta > 200 && this.stack.checkCollision(this.activeShape).hitsBelow && this.activeShape.animate.y < -1) {
          this.stack.addShape(this.activeShape);
          this.newShape();
        }
      }
    }
    CanvasHelper.newFrame();
    CanvasHelper.drawStack(this.stack);
    if (this.activeShape) {
      CanvasHelper.drawShape(this.activeShape);
    }
    if (this.stack.blocks[0].every((block) => !block)) {
      requestAnimationFrame(this.drawFrame);
    } else {
      this.stop();
    }
  }
  newShape() {
    const index = Math.round(
      (this.possibleShapes.length - 1) * Math.random()
    );
    this.activeShape = Shape.clone(this.possibleShapes[index]);
  }
  stop() {
    window.removeEventListener("keydown", this.onKeyDown);
    ViewHelper.activateView(View.GameOver);
  }
}

const startButton = document.querySelector(".start-button");
startButton.addEventListener("click", () => {
  ViewHelper.activateView(View.Game);
  const game = new Game();
  game.start();
});

const restartButton = document.querySelector(".restart-button");
restartButton.addEventListener("click", () => {
  ViewHelper.activateView(View.Game);
  const game = new Game();
  game.start();
});
