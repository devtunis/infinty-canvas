const container = document.querySelector(".container");
const Layer1 = document.querySelector("#Layer1");
const ctx = Layer1.getContext("2d");

const zoom = document.querySelector("#zoom");
const restZoom = document.querySelector("#restZoom");

let GlobalState = {
  draw: false,
  points: [],
  oldx: 0,
  oldy: 0,
  sizeLine: 8,
  colorline: "#f81788",
  timer: null,
  alpha: 0.2,
  dx: 0,
  dy: 0,
  allPoints: [],
  cursormode: false,
};

const Camera = {
  x: 0,
  y: 0,
  zoom: 1,
};

const rc = rough.canvas(Layer1);

let SaveOldest = { x: 0, y: 0 };

function drawpoint(ctx, x, y) {
  ctx.beginPath();
  ctx.arc(x, y, 2, 0, Math.PI * 2);
  ctx.fill();
}

function UpdateBoundries() {
  const refBound = container.getBoundingClientRect();
  const ratio = window.devicePixelRatio || 1;

  Layer1.width = refBound.width * ratio;
  Layer1.height = refBound.height * ratio;

  ctx.setTransform(
    Camera.zoom,
    0,
    0,
    Camera.zoom,
    Camera.x,
    Camera.y
  );
}

function buildPath(points) {
  if (points.length === 0) return "";

  if (points.length === 1) {
    return `M ${points[0].x} ${points[0].y}`;
  }

  if (points.length === 2) {
    return `M ${points[0].x} ${points[0].y}
            L ${points[1].x} ${points[1].y}`;
  }

  if (points.length === 3) {
    return `M ${points[0].x} ${points[0].y}
            Q ${points[1].x} ${points[1].y}
            ${points[2].x} ${points[2].y}`;
  }

  if (points.length >= 4) {
    let d = `M${points[0].x} ${points[0].y}`;

    for (let j = 1; j < points.length; j++) {
      let prev = points[j - 1];
      let curr = points[j];

      d += `Q${(prev.x + curr.x) / 2} ${(prev.y + curr.y) / 2} ${curr.x} ${curr.y}`;
    }

    return d;
  }
}

function drawlines(xRaw, yRaw) {
  const x =
    GlobalState.oldx +
    (xRaw - GlobalState.oldx) * GlobalState.alpha;

  const y =
    GlobalState.oldy +
    (yRaw - GlobalState.oldy) * GlobalState.alpha;

  ctx.beginPath();

  ctx.moveTo(GlobalState.oldx, GlobalState.oldy);

  ctx.quadraticCurveTo(
    (GlobalState.oldx + x) / 2,
    (GlobalState.oldy + y) / 2,
    x,
    y
  );

  ctx.strokeStyle = GlobalState.colorline;
  ctx.lineWidth = GlobalState.sizeLine;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  ctx.stroke();

  GlobalState.points.push({ x, y });

  GlobalState.oldx = x;
  GlobalState.oldy = y;
}

function RedrawEachLine(item) {
  for (let i = 1; i < item.length; i++) {
    const prev = item[i - 1];
    const curr = item[i];

    ctx.beginPath();

    ctx.moveTo(prev.x, prev.y);

    ctx.quadraticCurveTo(
      (prev.x + curr.x) / 2,
      (prev.y + curr.y) / 2,
      curr.x,
      curr.y
    );

    ctx.strokeStyle = GlobalState.colorline;
    ctx.lineWidth = GlobalState.sizeLine;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    ctx.stroke();
  }
}

function redraw() {
  ctx.save();

  ctx.setTransform(1, 0, 0, 1, 0, 0);

  ctx.clearRect(0, 0, Layer1.width, Layer1.height);

  ctx.restore();

  for (let item of GlobalState.allPoints) {
    RedrawEachLine(item);
  }
}

container.addEventListener("mousemove", (e) => {
  const { clientX, clientY } = e;

  const contSize = e.currentTarget.getBoundingClientRect();

  if (GlobalState.draw) {
    const xRaw =
      ((clientX - contSize.left) - Camera.x) / Camera.zoom;

    const yRaw =
      ((clientY - contSize.top) - Camera.y) / Camera.zoom;

    drawlines(xRaw, yRaw);
  } else if (GlobalState.cursormode) {
    container.style.cursor = "grabbing";

    const x = clientX - contSize.left;
    const y = clientY - contSize.top;

    let newDx = x - SaveOldest.x;
    let newDy = y - SaveOldest.y;

    Camera.x += newDx;
    Camera.y += newDy;

    ctx.setTransform(
      Camera.zoom,
      0,
      0,
      Camera.zoom,
      Camera.x,
      Camera.y
    );

    redraw();

    SaveOldest.x = x;
    SaveOldest.y = y;
  }
});

const observer = new ResizeObserver(() => {
  UpdateBoundries();
  redraw();
});

container.addEventListener("mousedown", (e) => {
  const { clientX, clientY } = e;

  if (e.button == 0) {
    const contSize = e.currentTarget.getBoundingClientRect();

    const x =
      ((clientX - contSize.left) - Camera.x) / Camera.zoom;

    const y =
      ((clientY - contSize.top) - Camera.y) / Camera.zoom;

    GlobalState.points.push({ x, y });

    GlobalState.oldx = x;
    GlobalState.oldy = y;

    GlobalState.draw = true;
  } else {
    const contSize = e.currentTarget.getBoundingClientRect();

    const x = clientX - contSize.left;
    const y = clientY - contSize.top;

    GlobalState.cursormode = true;

    SaveOldest.x = x;
    SaveOldest.y = y;

    GlobalState.oldx = x;
    GlobalState.oldy = y;
  }
});

container.addEventListener("mouseup", () => {
  GlobalState.draw = false;
  GlobalState.cursormode = false;

  GlobalState.allPoints.push(GlobalState.points);

  GlobalState.points = [];

  container.style.cursor = "default";
});

observer.observe(container);

zoom.addEventListener("click", () => {
  Camera.zoom += 0.1;

  ctx.save();

  ctx.setTransform(1, 0, 0, 1, 0, 0);

  ctx.clearRect(0, 0, Layer1.width, Layer1.height);

  ctx.restore();

  ctx.setTransform(
    Camera.zoom,
    0,
    0,
    Camera.zoom,
    Camera.x,
    Camera.y
  );

  for (let item of GlobalState.allPoints) {
    RedrawEachLine(item);
  }
});

restZoom.addEventListener("click", () => {
  Camera.zoom -= 0.1;

  ctx.save();

  ctx.setTransform(1, 0, 0, 1, 0, 0);

  ctx.clearRect(0, 0, Layer1.width, Layer1.height);

  ctx.restore();

  ctx.setTransform(
    Camera.zoom,
    0,
    0,
    Camera.zoom,
    Camera.x,
    Camera.y
  );

  for (let item of GlobalState.allPoints) {
    RedrawEachLine(item);
  }
});

container.addEventListener("contextmenu", (e) => {
  e.preventDefault();
});
