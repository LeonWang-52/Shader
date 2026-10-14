// Shared tangents make adjacent bicubic Bezier patches C1-continuous.
import {createGrid,controls as gridControls,point,sample,insertGrid} from './bezier-grid.js';
const STEPS=20;
const add=(a,b,s=1)=>[a[0]+s*b[0],a[1]+s*b[1]];

export function createMeshEditor(gl,program,overlay,onEdit,colorLayer){
  const ctx=overlay.getContext('2d');
  let grid, nodes, selected=5, dragging=null, enabled=true, dirty=true;
  const buffer=gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER,buffer);
  for(const [name,offset] of [['a_position',0],['a_uv',8]]){
    const loc=gl.getAttribLocation(program,name);gl.enableVertexAttribArray(loc);gl.vertexAttribPointer(loc,2,gl.FLOAT,false,16,offset);
  }
  function syncSize(){
    document.getElementById('meshSize').textContent=`${grid.ys.length} 行 × ${grid.xs.length} 列 · ${nodes.length} 节点`;
    document.getElementById('addMeshRow').disabled=grid.ys.length>=8;
    document.getElementById('addMeshColumn').disabled=grid.xs.length>=8;
  }
  function reset(){grid=createGrid();nodes=grid.nodes;selected=5;dirty=true;syncSize();}
  reset();
  const controls=(x,y)=>gridControls(grid,x,y);
  function handle(n,axis,sign){
    const col=selected%grid.xs.length,row=Math.floor(selected/grid.xs.length);
    const knots=axis==='h'?grid.xs:grid.ys,i=axis==='h'?col:row;
    const j=Math.max(0,Math.min(knots.length-2,sign<0?i-1:i));
    const scale=(knots[j+1]-knots[j])/3;
    return n[axis==='h'?'du':'dv'].map(v=>v*scale);
  }
  function insert(axis){
    const nx=grid.xs.length,col=selected%nx,row=Math.floor(selected/nx),index=axis==='x'?col:row;
    const next=insertGrid(grid,axis,index);if(next===grid)return;
    grid=next;nodes=grid.nodes;
    selected=axis==='x'?row*grid.xs.length+Math.min(col+1,grid.xs.length-2):Math.min(row+1,grid.ys.length-2)*grid.xs.length+col;
    dirty=true;dragging=null;onEdit();syncSize();draw();
  }
  let count=0,vertices=[];
  function upload(){
    const data=[];
    for(let y=0;y<grid.ys.length-1;y++)for(let x=0;x<grid.xs.length-1;x++){
      const c=controls(x,y);
      const emit=(i,j)=>{const u=i/STEPS,v=j/STEPS,p=point(c,u,v);data.push(...p,grid.xs[x]+u*(grid.xs[x+1]-grid.xs[x]),grid.ys[y]+v*(grid.ys[y+1]-grid.ys[y]));};
      for(let j=0;j<STEPS;j++)for(let i=0;i<STEPS;i++){emit(i,j);emit(i+1,j);emit(i,j+1);emit(i,j+1);emit(i+1,j);emit(i+1,j+1);}
    }
    vertices=data;count=data.length/4;gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(data),gl.DYNAMIC_DRAW);dirty=false;
  }
  function meshPosition(uv){
    return sample(grid,uv).p;
  }
  function toUV(p){
    if(dirty)upload();
    // Invert the actual rendered triangles, so picking stays aligned after edits.
    for(let i=0;i<vertices.length;i+=12){
      const ax=vertices[i],ay=vertices[i+1],bx=vertices[i+4],by=vertices[i+5],cx=vertices[i+8],cy=vertices[i+9];
      const det=(by-cy)*(ax-cx)+(cx-bx)*(ay-cy);
      if(Math.abs(det)<1e-12)continue;
      const a=((by-cy)*(p[0]-cx)+(cx-bx)*(p[1]-cy))/det;
      const b=((cy-ay)*(p[0]-cx)+(ax-cx)*(p[1]-cy))/det,c=1-a-b;
      if(a>=-1e-5&&b>=-1e-5&&c>=-1e-5)return [0,1].map(k=>Math.max(0,Math.min(1,a*vertices[i+2+k]+b*vertices[i+6+k]+c*vertices[i+10+k])));
    }
    return null;
  }
  function screen(p){return[p[0]*overlay.clientWidth,p[1]*overlay.clientHeight];}
  function dot(p,r,fill){const q=screen(p);ctx.beginPath();ctx.arc(...q,r,0,Math.PI*2);ctx.fillStyle=fill;ctx.fill();ctx.strokeStyle='#fff6df';ctx.lineWidth=1.5;ctx.stroke();}
  function draw(){
    const dpr=Math.min(devicePixelRatio,2),w=overlay.clientWidth,h=overlay.clientHeight;
    if(overlay.width!==Math.round(w*dpr)||overlay.height!==Math.round(h*dpr)){overlay.width=Math.round(w*dpr);overlay.height=Math.round(h*dpr);}
    ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,w,h);
    if(!enabled)return;
    ctx.lineWidth=1;ctx.strokeStyle='#fff5df9c';
    for(let y=0;y<grid.ys.length-1;y++)for(let x=0;x<grid.xs.length-1;x++){
      const c=controls(x,y);
      for(const side of [0,1,2,3]){ctx.beginPath();for(let i=0;i<=32;i++){const t=i/32,p=point(c,side<2?t:side-2,side<2?side:t),q=screen(p);if(i===0)ctx.moveTo(...q);else ctx.lineTo(...q);}ctx.stroke();}
    }
    const n=nodes[selected];
    for(const axis of ['h','v'])for(const sign of [-1,1]){
      const end=add(n.p,handle(n,axis,sign),sign);ctx.beginPath();ctx.moveTo(...screen(n.p));ctx.lineTo(...screen(end));ctx.strokeStyle='#4c332bd9';ctx.lineWidth=1.5;ctx.stroke();dot(end,5,'#fff4d9');
    }
    nodes.forEach((n,i)=>dot(n.p,i===selected?7:5,i===selected?'#4c332b':'#ed763e'));
    colorLayer.points.forEach((n,i)=>{
      const p=meshPosition(n.uv),q=screen(p);
      dot(p,i===colorLayer.selected?13:10,n.color);
      ctx.fillStyle='#fff';ctx.strokeStyle='#4c332b';ctx.lineWidth=3;ctx.font='bold 11px system-ui';ctx.textAlign='center';ctx.textBaseline='middle';ctx.strokeText(String(i+1),...q);ctx.fillText(String(i+1),...q);
    });
  }
  overlay.onpointerdown=e=>{
    if(!enabled)return;
    const rect=overlay.getBoundingClientRect(),mouse=[e.clientX-rect.left,e.clientY-rect.top];
    const near=p=>{const q=screen(p);return Math.hypot(q[0]-mouse[0],q[1]-mouse[1])<15;};
    const colorIndex=colorLayer.points.findLastIndex(n=>near(meshPosition(n.uv)));
    if(colorIndex>=0){colorLayer.select(colorIndex);dragging={colorIndex};overlay.setPointerCapture(e.pointerId);onEdit();draw();return;}
    const n=nodes[selected];
    dragging=null;
    for(const axis of ['h','v'])for(const sign of [-1,1])if(near(add(n.p,handle(n,axis,sign),sign)))dragging={axis,sign};
    if(!dragging){const i=nodes.findIndex(n=>near(n.p));if(i<0)return;selected=i;dragging={axis:'p'};}
    overlay.setPointerCapture(e.pointerId);onEdit();draw();
  };
  overlay.onpointermove=e=>{
    if(!dragging)return;
    const rect=overlay.getBoundingClientRect(),p=[(e.clientX-rect.left)/rect.width,(e.clientY-rect.top)/rect.height],n=nodes[selected],row=Math.floor(selected/grid.xs.length),col=selected%grid.xs.length;
    if(dragging.colorIndex!==undefined){const uv=toUV(p.map(v=>Math.max(0,Math.min(1,v))));if(uv)colorLayer.move(dragging.colorIndex,uv);draw();return;}
    const field=dragging.axis==='p'?'p':dragging.axis==='h'?'du':'dv';
    const before=[...n[field]];
    if(dragging.axis==='p'){
      // Keep the outer boundary fixed, and preserve node ordering.
      n.p=[col===0?0:col===grid.xs.length-1?1:Math.max(0.001,Math.min(0.999,p[0])),row===0?0:row===grid.ys.length-1?1:Math.max(0.001,Math.min(0.999,p[1]))];
    }else{
      const knots=dragging.axis==='h'?grid.xs:grid.ys,i=dragging.axis==='h'?col:row;
      const j=Math.max(0,Math.min(knots.length-2,dragging.sign<0?i-1:i));
      const scale=(knots[j+1]-knots[j])/3;
      const v=[(p[0]-n.p[0])*dragging.sign/scale,(p[1]-n.p[1])*dragging.sign/scale];
      const length=Math.hypot(...v),limit=Math.min(1,2.2/Math.max(length,0.0001));
      n[field]=v.map(a=>a*limit);
      if(field==='du'&&(row===0||row===grid.ys.length-1))n.du[1]=0;
      if(field==='dv'&&(col===0||col===grid.xs.length-1))n.dv[0]=0;
    }
    // Reject local folds so edited patches keep a positive Jacobian.
    let valid=true;
    for(let y=0;y<grid.ys.length-1&&valid;y++)for(let x=0;x<grid.xs.length-1&&valid;x++){
      const c=controls(x,y);
      for(let j=0;j<=8&&valid;j++)for(let i=0;i<=8;i++){
        const u=i/8,v=j/8,eps=0.001,p0=point(c,u,v),pu=point(c,u+eps,v),pv=point(c,u,v+eps);
        if((pu[0]-p0[0])*(pv[1]-p0[1])-(pu[1]-p0[1])*(pv[0]-p0[0])<1e-10){valid=false;break;}
      }
    }
    if(!valid)n[field]=before;
    dirty=true;draw();
  };
  overlay.ondblclick=e=>{
    if(!enabled)return;
    const rect=overlay.getBoundingClientRect(),uv=toUV([(e.clientX-rect.left)/rect.width,(e.clientY-rect.top)/rect.height]);
    if(uv)colorLayer.add(uv);
  };
  overlay.onpointerup=overlay.onpointercancel=()=>{dragging=null;};
  return {
    render(){if(dirty)upload();gl.clearColor(0.949,0.663,0.055,1);gl.clear(gl.COLOR_BUFFER_BIT);gl.drawArrays(gl.TRIANGLES,0,count);draw();},
    reset,toUV,insert,
    setEnabled(value){enabled=value;overlay.style.pointerEvents=value?'auto':'none';draw();}
  };
}
