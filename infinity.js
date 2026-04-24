// =====================
// DOM ELEMENTS
// =====================
const container = document.querySelector(".container");
const canvas = document.querySelector("#Layer1");
const ctx = canvas.getContext("2d");

const leftBtn = document.getElementById("left");
const rightBtn = document.getElementById("right");
const upBtn = document.getElementById("top");
const downBtn = document.getElementById("down");
const resetBtn = document.getElementById("rest");

// =====================
// STATE
// =====================
let isDrawing = false;
let points = [];
let lastX = 0;
let lastY = 0;

let lineWidth = 9;
let lineColor = "green";

let moveTimer = null;
let offsetX = 0;
let offsetY = 0;

const smoothing = 0.2;
const placementStore = new Map();

// =====================
// CANVAS SETUP
// =====================
function resizeCanvas() {
  const rect = container.getBoundingClientRect();
  const ratio = window.devicePixelRatio || 1;

  canvas.width = rect.width * ratio;
  canvas.height = rect.height * ratio;

  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
}

new ResizeObserver(resizeCanvas).observe(container);

// =====================
// DRAW HELPERS
// =====================
function drawPoint(x, y) {
  ctx.beginPath();
  ctx.arc(x, y, 2, 0, Math.PI * 2);
  ctx.fill();
}

function drawSmoothLine(xRaw, yRaw) {
  const x = lastX + (xRaw - lastX) * smoothing;
  const y = lastY + (yRaw - lastY) * smoothing;

  ctx.beginPath();
  ctx.moveTo(lastX, lastY);
  ctx.quadraticCurveTo((lastX + x) / 2, (lastY + y) / 2, x, y);

  ctx.strokeStyle = lineColor;
  ctx.lineWidth = lineWidth;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.stroke();

  points.push({ x, y });

  lastX = x;
  lastY = y;
}

// =====================
// PATH BUILDER (SVG)
// =====================
function buildPath(points) {
  if (!points.length) return "";

  if (points.length === 1) {
    return `M ${points[0].x} ${points[0].y}`;
  }

  if (points.length === 2) {
    return `M ${points[0].x} ${points[0].y} L ${points[1].x} ${points[1].y}`;
  }

  const pts = [points[0], ...points, points[points.length - 1]];
  let d = `M ${pts[1].x} ${pts[1].y}`;

  for (let i = 0; i < pts.length - 3; i++) {
    const p0 = pts[i];
    const p1 = pts[i + 1];
    const p2 = pts[i + 2];
    const p3 = pts[i + 3];

    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;

    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;

    d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
  }

  return d;
}

// =====================
// SVG RENDERING
// =====================
function drawSVG(path, color, size) {
  const svg = document.querySelector("svg");

  const group = document.createElementNS("http://www.w3.org/2000/svg", "g");

  const pathEl = document.createElementNS(
    "http://www.w3.org/2000/svg",
    "path"
  );

  pathEl.setAttribute("d", path);
  pathEl.setAttribute("stroke", color);
  pathEl.setAttribute("stroke-width", size);
  pathEl.setAttribute("fill", "none");
  pathEl.setAttribute("stroke-linecap", "round");
  pathEl.setAttribute("stroke-linejoin", "round");
  pathEl.setAttribute("vector-effect", "non-scaling-stroke");

  group.appendChild(pathEl);
  svg.appendChild(group);
}

// =====================
// POINTER DRAWING
// =====================
container.addEventListener("mousedown", (e) => {
  const rect = container.getBoundingClientRect();

  lastX = e.clientX - rect.left;
  lastY = e.clientY - rect.top;

  points = [{ x: lastX, y: lastY }];
  isDrawing = true;
});

container.addEventListener("mousemove", (e) => {
  if (!isDrawing) return;

  const rect = container.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;

  drawSmoothLine(x, y);
});

container.addEventListener("mouseup", () => {
  isDrawing = false;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const path = buildPath(points);
  drawSVG(path, lineColor, lineWidth);

  points = [];
});

// =====================
// SVG MOVE SYSTEM
// =====================
function updatePosition(dx, dy) {
  document.querySelectorAll("g").forEach((el) => {
    const prev = placementStore.get(el) || { x: 0, y: 0 };

    const nextX = prev.x + dx;
    const nextY = prev.y + dy;

    el.style.transition = "transform 0.2s ease";
    el.style.transform = `translate(${nextX}px, ${nextY}px)`;

    placementStore.set(el, { x: nextX, y: nextY });
  });
}

// =====================
// CONTROLS
// =====================
function startMove(dx, dy) {
  moveTimer = setInterval(() => {
    offsetX += dx;
    offsetY += dy;
    updatePosition(dx, dy);
  }, 110);
}

function stopMove() {
  clearInterval(moveTimer);
  moveTimer = null;
  offsetX = 0;
  offsetY = 0;
}

// left/right/up/down
rightBtn.addEventListener("pointerdown", () => startMove(50, 0));
leftBtn.addEventListener("pointerdown", () => startMove(-50, 0));
upBtn.addEventListener("pointerdown", () => startMove(0, -50));
downBtn.addEventListener("pointerdown", () => startMove(0, 50));

rightBtn.addEventListener("pointerup", stopMove);
leftBtn.addEventListener("pointerup", stopMove);
upBtn.addEventListener("pointerup", stopMove);
downBtn.addEventListener("pointerup", stopMove);

// reset
resetBtn.addEventListener("click", () => {
  document.querySelectorAll("g").forEach((el) => {
    el.style.transform = "translate(0px, 0px)";
  });

  placementStore.clear();
  offsetX = 0;
  offsetY = 0;
});
