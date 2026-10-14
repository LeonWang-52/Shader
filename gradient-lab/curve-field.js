import {paletteLut,curveValue} from './palette.js';
export function createCurveField(gl,program,onEdit){
 const $=id=>document.getElementById(id);
 const presets={vibrant:['#ff595e','#ffca3a','#8ac926','#1982c4','#6a4c93'],warm:['#e7470c','#f2c671','#e96850','#f2e8a0','#e03e24','#f2a90e','#fcac80','#e3a24b','#e3a24b']};
 const initial=[[[0,.686],[.25,.615],[.5,.499],[.75,.10],[1,.603]],[[0,.98],[.25,.412],[.5,.631],[.75,.635],[1,.222]]];
 let curves=structuredClone(initial),colors=[...presets.warm],positions=presets.warm.map((_,i)=>i/8),selected=0,dirty=true;
 const textures=[gl.createTexture(),gl.createTexture()];
 for(let i=0;i<2;i++){gl.activeTexture(gl.TEXTURE0+i);gl.bindTexture(gl.TEXTURE_2D,textures[i]);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,i===0?gl.NEAREST:gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,i===0?gl.NEAREST:gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);}
 gl.uniform1i(gl.getUniformLocation(program,'u_curveLut'),0);gl.uniform1i(gl.getUniformLocation(program,'u_paletteLut'),1);
 function changed(){dirty=true;onEdit();draw();}
 function selectStop(i){selected=i;$('stopHex').value=colors[i];$('stopPosition').value=+(positions[i]*100).toFixed(1);for(const [j,c] of [...$('paletteColors').children].entries())c.setAttribute('aria-current',String(i===j));}
 function track(){
  $('stopTrack').style.background=`linear-gradient(to right,${colors.map((c,i)=>`${c} ${positions[i]*100}%`).join(',')})`;
  $('stopTrack').replaceChildren();
  colors.forEach((c,i)=>{const handle=document.createElement('button');handle.style.left=positions[i]*100+'%';handle.style.background=c;handle.setAttribute('aria-label',`色标 ${i+1}`);
   handle.onpointerdown=e=>{selectStop(i);handle.setPointerCapture(e.pointerId);};
   handle.onpointermove=e=>{if(!handle.hasPointerCapture(e.pointerId))return;const r=$('stopTrack').getBoundingClientRect();positions[i]=Math.max(i?positions[i-1]+.001:0,Math.min(i<colors.length-1?positions[i+1]-.001:1,(e.clientX-r.left)/r.width));handle.style.left=positions[i]*100+'%';$('stopPosition').value=+(positions[i]*100).toFixed(1);dirty=true;draw();};
   handle.onpointerup=()=>{track();changed();};$('stopTrack').append(handle);
  });
 }
 function chips(){
  $('paletteColors').replaceChildren();colors.forEach((hex,i)=>{const input=document.createElement('input');input.type='color';input.value=hex;input.setAttribute('aria-label',`色带颜色 ${i+1}`);input.onclick=()=>selectStop(i);input.oninput=()=>{colors[i]=input.value;selectStop(i);track();changed();};$('paletteColors').append(input);});$('paletteCount').value=colors.length;selected=Math.min(selected,colors.length-1);selectStop(selected);track();
 }
 const even=()=>{positions=colors.map((_,i)=>i/(colors.length-1));};
 function randomPalette(){
  const name=$('palettePreset').value,n=colors.length,h=Math.random()*360;
  if(presets[name])colors=Array.from({length:n},(_,i)=>presets[name][i%presets[name].length]);
  else colors=Array.from({length:n},(_,i)=>{let hue=name==='cool'?170+Math.random()*110:name==='monochromatic'?h:name==='analogous'?h+i*12:name==='complementary'?h+(i%2)*180:name==='triadic'?h+(i%3)*120:Math.random()*360;let light=name==='dark'?18+Math.random()*20:name==='light'?75+Math.random()*15:45+Math.random()*25;const c=document.createElement('canvas').getContext('2d');c.fillStyle=`hsl(${hue} 80% ${light}%)`;c.fillRect(0,0,1,1);return '#'+[...c.getImageData(0,0,1,1).data].slice(0,3).map(v=>v.toString(16).padStart(2,'0')).join('');});
  even();chips();changed();
 }
 $('palettePreset').onchange=randomPalette;$('randomPalette').onclick=randomPalette;
 $('paletteCount').onchange=()=>{const n=Math.max(2,Math.min(20,Math.round(Number($('paletteCount').value)||5)));const lut=paletteLut(colors,256,positions);colors=Array.from({length:n},(_,i)=>{const j=Math.round(i/(n-1)*255)*4;return '#'+[...lut.slice(j,j+3)].map(v=>v.toString(16).padStart(2,'0')).join('');});even();chips();changed();};
 $('stopHex').onchange=()=>{if(/^#[0-9a-f]{6}$/i.test($('stopHex').value)){colors[selected]=$('stopHex').value;chips();changed();}else selectStop(selected);};
 $('stopPosition').onchange=()=>{const v=Number($('stopPosition').value)/100;if(Number.isFinite(v))positions[selected]=Math.max(selected?positions[selected-1]+.001:0,Math.min(selected<colors.length-1?positions[selected+1]-.001:1,v));chips();changed();};
 $('invertPalette').onclick=()=>{colors.reverse();positions=positions.map(v=>1-v).reverse();chips();changed();};
 $('distributePalette').onclick=()=>{even();chips();changed();};
 $('shufflePalette').onclick=()=>{for(let i=colors.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[colors[i],colors[j]]=[colors[j],colors[i]];}chips();changed();};
 $('deleteStop').onclick=()=>{if(colors.length<=2)return;colors.splice(selected,1);positions.splice(selected,1);chips();changed();};
 $('invertCurves').onclick=()=>{curves=curves.map(c=>c.map(([t,v])=>[t,1-v]));changed();};
 $('curveSmooth').onchange=changed;
 $('resetCurves').onclick=()=>{curves=structuredClone(initial);changed();};
 $('randomCurves').onclick=()=>{curves=curves.map(c=>c.map(p=>[p[0],.05+Math.random()*.9]));changed();};
 for(let axis=0;axis<2;axis++){
  const canvas=$(axis===0?'curveX':'curveY');let dragging=-1;
  function position(e){const r=canvas.getBoundingClientRect();return [Math.max(0,Math.min(1,(e.clientX-r.left-10)/(r.width-20))),Math.max(0,Math.min(1,1-(e.clientY-r.top-10)/(r.height-20)))];}
  canvas.onpointerdown=e=>{if(e.button!==0)return;const p=position(e),points=curves[axis];dragging=points.findIndex(v=>Math.hypot((v[0]-p[0])*canvas.clientWidth,(v[1]-p[1])*canvas.clientHeight)<16);if(dragging<0){const same=points.findIndex(v=>Math.abs(v[0]-p[0])<.01);if(same>=0){dragging=same;points[same][1]=p[1];}}if(dragging<0&&points.length<20){points.push(p);points.sort((a,b)=>a[0]-b[0]);dragging=points.indexOf(p);}if(dragging>=0){canvas.setPointerCapture(e.pointerId);changed();}};
  canvas.onpointermove=e=>{if(dragging<0)return;const p=position(e),c=curves[axis];p[0]=dragging===0?0:dragging===c.length-1?1:Math.max(c[dragging-1][0]+.005,Math.min(c[dragging+1][0]-.005,p[0]));c[dragging]=p;changed();};
  canvas.onpointerup=canvas.onpointercancel=()=>{dragging=-1;};
  canvas.oncontextmenu=e=>{e.preventDefault();const p=position(e),c=curves[axis],i=c.findIndex(v=>Math.hypot((v[0]-p[0])*canvas.clientWidth,(v[1]-p[1])*canvas.clientHeight)<16);if(i>0&&i<c.length-1){c.splice(i,1);changed();}};
 }
 function draw(){for(let axis=0;axis<2;axis++){const canvas=$(axis===0?'curveX':'curveY'),ctx=canvas.getContext('2d'),w=canvas.clientWidth,h=canvas.clientHeight;if(w===0)continue;canvas.width=w*2;canvas.height=h*2;ctx.scale(2,2);ctx.fillStyle='#202020';ctx.fillRect(0,0,w,h);ctx.strokeStyle='#ffffff18';ctx.lineWidth=1;for(let i=1;i<4;i++){ctx.beginPath();ctx.moveTo(10+(w-20)*i/4,10);ctx.lineTo(10+(w-20)*i/4,h-10);ctx.moveTo(10,10+(h-20)*i/4);ctx.lineTo(w-10,10+(h-20)*i/4);ctx.stroke();}ctx.strokeStyle=axis===0?'#f2c671':'#fcac80';ctx.lineWidth=2;ctx.beginPath();for(let i=0;i<=200;i++){const t=i/200,x=10+t*(w-20),y=10+(1-curveValue(curves[axis],t,$('curveSmooth').checked))*(h-20);if(i===0)ctx.moveTo(x,y);else ctx.lineTo(x,y);}ctx.stroke();for(const [t,v] of curves[axis]){ctx.beginPath();ctx.arc(10+t*(w-20),10+(1-v)*(h-20),5,0,Math.PI*2);ctx.fillStyle='#fff';ctx.fill();ctx.stroke();}}}
 // The stage overlay edits the same scalar curves as the small inspectors.
 const overlay=document.createElement('canvas');overlay.id='fieldOverlay';overlay.setAttribute('aria-label','画布曲线编辑器');$('stage').append(overlay);
 let activeAxis=0,activePoint=-1;
 $('editX').onclick=()=>{activeAxis=0;};$('editY').onclick=()=>{activeAxis=1;};
 const cursor=e=>{const r=overlay.getBoundingClientRect();return [Math.max(0,Math.min(1,(e.clientX-r.left)/r.width)),Math.max(0,Math.min(1,(e.clientY-r.top)/r.height))];};
 overlay.onpointerdown=e=>{if(e.button!==0)return;const [x,y]=cursor(e);activePoint=curves[activeAxis].findIndex(([t,v])=>Math.hypot(((activeAxis===0?t:v)-x)*overlay.clientWidth,((activeAxis===0?1-v:t)-y)*overlay.clientHeight)<16);if(activePoint>=0)overlay.setPointerCapture(e.pointerId);};
 overlay.onpointermove=e=>{if(activePoint<0)return;const [x,y]=cursor(e),c=curves[activeAxis],i=activePoint,t=activeAxis===0?x:y,v=activeAxis===0?1-y:x;c[i]=[i===0?0:i===c.length-1?1:Math.max(c[i-1][0]+.005,Math.min(c[i+1][0]-.005,t)),v];changed();};
 overlay.onpointerup=overlay.onpointercancel=()=>activePoint=-1;
 overlay.ondblclick=e=>{const [x,y]=cursor(e),c=curves[activeAxis],t=activeAxis===0?x:y;if(c.length<20&&c.every(p=>Math.abs(p[0]-t)>.005)){c.push([t,activeAxis===0?1-y:x]);c.sort((a,b)=>a[0]-b[0]);changed();}};
 overlay.oncontextmenu=e=>{e.preventDefault();const [x,y]=cursor(e),c=curves[activeAxis],i=c.findIndex(([t,v])=>Math.hypot(((activeAxis===0?t:v)-x)*overlay.clientWidth,((activeAxis===0?1-v:t)-y)*overlay.clientHeight)<16);if(i>0&&i<c.length-1){c.splice(i,1);changed();}};
 function stageDraw(){
  const visible=$('showCurves').checked&&!$('editMesh').checked&&$('renderEngine').value==='1';overlay.hidden=!visible;if(!visible)return;
  const canvas=$('canvas'),w=canvas.clientWidth,h=canvas.clientHeight;overlay.style.width=w+'px';overlay.style.height=h+'px';
  const dpr=Math.min(devicePixelRatio,2);if(overlay.width!==Math.round(w*dpr)||overlay.height!==Math.round(h*dpr)){overlay.width=Math.round(w*dpr);overlay.height=Math.round(h*dpr);}
  const ctx=overlay.getContext('2d');ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,w,h);
  for(let axis=0;axis<2;axis++){ctx.strokeStyle=axis===activeAxis?'#ffffff':'#ffffff77';ctx.lineWidth=axis===activeAxis?2.5:1.5;ctx.setLineDash(axis===activeAxis?[]:[5,7]);ctx.beginPath();for(let i=0;i<=400;i++){const t=i/400,v=curveValue(curves[axis],t,$('curveSmooth').checked),x=(axis===0?t:v)*w,y=(axis===0?1-v:t)*h;i?ctx.lineTo(x,y):ctx.moveTo(x,y);}ctx.stroke();ctx.setLineDash([]);for(const [t,v] of curves[axis]){ctx.beginPath();ctx.arc((axis===0?t:v)*w,(axis===0?1-v:t)*h,axis===activeAxis?6:4,0,Math.PI*2);ctx.fillStyle=axis===activeAxis?'#fff5cd':'#ffffff77';ctx.fill();}}
  $('editX').setAttribute('aria-pressed',String(activeAxis===0));$('editY').setAttribute('aria-pressed',String(activeAxis===1));
 }
 chips();new ResizeObserver(draw).observe($('curveFieldSettings'));draw();
 return {stageDraw,getState:()=>({curves,colors,positions,smooth:$('curveSmooth').checked}),setState(state){curves=structuredClone(state.curves);colors=[...state.colors];positions=[...state.positions];$('curveSmooth').checked=state.smooth;chips();changed();},upload(){if(!dirty)return;const data=new Float32Array(1024*2);for(let i=0;i<1024;i++){data[i*2]=curveValue(curves[0],i/1023,$('curveSmooth').checked);data[i*2+1]=curveValue(curves[1],i/1023,$('curveSmooth').checked);}gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,textures[0]);gl.texImage2D(gl.TEXTURE_2D,0,gl.RG32F,1024,1,0,gl.RG,gl.FLOAT,data);gl.activeTexture(gl.TEXTURE1);gl.bindTexture(gl.TEXTURE_2D,textures[1]);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,4096,1,0,gl.RGBA,gl.UNSIGNED_BYTE,paletteLut(colors,4096,positions));dirty=false;},draw};
}
