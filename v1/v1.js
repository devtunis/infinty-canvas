//::code Reuse

 
const container = document.querySelector(".container")
const Layer1 = document.querySelector("#Layer1")
const ctx = Layer1.getContext("2d")
const left = document.getElementById("left")
const right = document.getElementById("right")
const rest = document.getElementById("rest")
const TOP = document.getElementById("top")
const DOWN = document.getElementById("down")
const cursormode = document.getElementById("cursormode")
 
let draw =  false
let  points = []
let oldx 
let oldy 
let sizeLine  = 13 
let colorline = "#031413"
let timer 
let modeCursor = false
const alpha = 0.2
let dx = 0 
let dy = 0



container.addEventListener("mouseover",()=>{
  clearTimeout(timer)
})

function drawpoint(ctx,x,y){
    ctx.beginPath();
    ctx.arc(x, y, 2, 0, Math.PI*2);
    ctx.fill();

}

function UpdateBoundries() {
  const refBound = container.getBoundingClientRect();
  const ratio = window.devicePixelRatio || 1;
  let DEFAULT_WIDTH = refBound.width;
  let DEFAULT_HEIGHT = refBound.height;
  Layer1.width = DEFAULT_WIDTH * ratio;
  Layer1.height = DEFAULT_HEIGHT * ratio;
 
  
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
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
  if(points.length ===4){
      let d = `M${points[0].x} ${points[0].y}`;
      for (let j = 1; j < points.length; j++) {
        let prev = points[j - 1];
        let curr = points[j];
        d =
          d +
          `Q${(prev.x + curr.x) / 2} ${(prev.y + curr.y) / 2} ${curr.x} ${curr.y}`;
      }
      return d
  }

  // Catmull-Rom for 4+
 // Catmull-Rom for 4+
const pts = [
  points[0],
  ...points,
  points[points.length - 1]
];
 


let d = `M ${pts[1].x} ${pts[1].y}`;

for (let i = 0; i < pts.length - 3; i++) {

  let p0 = pts[i];
  let p1 = pts[i+1];
  let p2 = pts[i+2];
  let p3 = pts[i+3];

  let cp1x = p1.x + (p2.x - p0.x) / 6;
  let cp1y = p1.y + (p2.y - p0.y) / 6;

  let cp2x = p2.x - (p3.x - p1.x) / 6;
  let cp2y = p2.y - (p3.y - p1.y) / 6;

  d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
}

return d;

 
}



function drawlines(xRaw,yRaw){
    const x = oldx + (xRaw  -oldx) * alpha
    const y = oldy + (yRaw -oldy) *  alpha
   

    ctx.beginPath();
    ctx.moveTo(oldx, oldy);
    ctx.quadraticCurveTo((oldx+x)/2, (oldy+y)/2, x, y)
  
    ctx.strokeStyle= colorline;
    ctx.lineWidth = sizeLine;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.stroke();
    
    points.push({x,y})
   
    oldx = x
    oldy = y
}

 let newx = 0
 let newy = 0
container.addEventListener("mousemove",(e)=>{
   if(modeCursor){
  const {clientX,clientY} = e 
    const contSize = e.currentTarget.getBoundingClientRect();
    const xRaw  = clientX-contSize.left
    const yRaw =  clientY-contSize.top
    
      let dx =   xRaw -  oldx 
      let   dy = yRaw - oldy 
      
   
 
     updatePosition(dx ,dy)
     oldx = xRaw
     oldy = yRaw

   }




    if(!draw) return 
    const {clientX,clientY} = e 
    const contSize = e.currentTarget.getBoundingClientRect();
    const xRaw  = clientX-contSize.left
    const yRaw =  clientY-contSize.top
    
    drawlines(xRaw,yRaw)
    
})

const observer = new ResizeObserver(() => {
 
 UpdateBoundries()
});
container.addEventListener("mousedown",(e)=>{
    const {clientX,clientY} = e 
    const contSize = e.currentTarget.getBoundingClientRect();
    const x  = clientX-contSize.left
    const y =  clientY-contSize.top
    points.push({x,y})
    
    oldx = x 
    oldy = y 
    draw = true
})
container.addEventListener("mouseup",(e)=>{
    
     draw = false
     modeCursor = false
     UpdateBoundries()
     const d = buildPath(points);
     DrawPoints(d,colorline,sizeLine);  
     points = []

})
observer.observe(container)

 function DrawPoints(path, color = "black", size = 11, x = 0, y = 0) {

  const svg = document.querySelector("svg");

  // Create group
  const group = document.createElementNS("http://www.w3.org/2000/svg", "g");
  group.setAttribute("transform", `translate(${x}, ${y})`);

  // Create path
  const path1 = document.createElementNS("http://www.w3.org/2000/svg", "path");
  path1.setAttribute("d", path);
  path1.setAttribute("stroke", color);
  path1.setAttribute("stroke-width", size);
  path1.setAttribute("fill", "none");
  path1.setAttribute("stroke-linecap", "round");
  path1.setAttribute("stroke-linejoin", "round");
  path1.setAttribute("vector-effect", "non-scaling-stroke");

  path1.style.pointerEvents = "stroke";

 
  group.appendChild(path1);
  svg.appendChild(group);
}


const StorePlacment = new Map()


function updatePosition(dx ,dy){
 
 

    const getAllElement = document.querySelectorAll("g")
    
    getAllElement.forEach((nodes)=>{
      
    if (StorePlacment.has(nodes)){
      let current  = StorePlacment.get(nodes).x+dx 
      let yyyyyyyyy = StorePlacment.get(nodes).y+dy
      nodes.style.transition = "all 0.035s ease"
      nodes.style.transform = `translate(${current}px,${yyyyyyyyy}px)`
      StorePlacment.set(nodes,{x:current , y : yyyyyyyyy})
    }else{
      
      nodes.style.transition = "all 0.035s ease"
      nodes.style.transform = `translate(${dx}px,${dy}px)`
      StorePlacment.set(nodes, {x:dx , y : dy})
    }
 
   })
   

   
}
 

  

 right.addEventListener("pointerdown",()=>{
   timer = setInterval(()=>{
 
    dx+=50
   
    updatePosition(dx ,dy)
   
   },110)
 })
 right.addEventListener("pointerup",()=>{
  clearInterval(timer)
   console.log(StorePlacment)
   dx = 0
  
 })
 left.addEventListener("pointerup",()=>{
  clearInterval(timer)
   
   dx = 0
  
 })
  left.addEventListener("pointerdown",(e)=>{
   timer = setInterval(()=>{
    
    dx-=50
    updatePosition(dx ,dy)
   
   },110)
 })
  rest.addEventListener("click",(e)=>{
       const getAllElement = document.querySelectorAll("g")
       dx = 0 
       dy = 0
      getAllElement.forEach((nodes)=>{
 
   
      nodes.style.transition = "all 0.2s ease"
      nodes.style.transform = `translate(0px,0px)`
      StorePlacment.clear()
     console.log("intailzie")
  
   })
 })
TOP.addEventListener("pointerdown",()=>{
   timer = setInterval(()=>{
 
    dy-=50
    updatePosition(dx ,dy)
   
   },110)
 })
TOP.addEventListener("pointerup",()=>{
    clearInterval(timer)
   
    dy = 0
 })
DOWN.addEventListener("pointerdown",()=>{
   timer = setInterval(()=>{
 
    dy+=50
    updatePosition(dx ,dy)
   
   },110)
 })
DOWN.addEventListener("pointerup",()=>{
    clearInterval(timer)
   
    dy = 0
 })

container.addEventListener("contextmenu",(e)=>{
  e.preventDefault()
  draw = false
  modeCursor = true
  console.log("i'm open ")
})
