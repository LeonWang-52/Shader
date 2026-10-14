// Drag only the header: inputs, scroll gestures and canvas editing stay independent.
const panel=document.getElementById('controls');
const handle=panel.querySelector('summary');
let drag=null,suppressClick=false;
function place(x,y){
 const margin=12,maxX=Math.max(margin,innerWidth-panel.offsetWidth-margin);
 const maxY=Math.max(margin,innerHeight-panel.offsetHeight-margin);
 panel.style.left=Math.max(margin,Math.min(maxX,x))+'px';
 panel.style.top=Math.max(margin,Math.min(maxY,y))+'px';
}
handle.addEventListener('pointerdown',event=>{
 if(event.button!==0)return;
 const rect=panel.getBoundingClientRect();
 drag={id:event.pointerId,x:event.clientX,y:event.clientY,left:rect.left,top:rect.top,moved:false};
 handle.setPointerCapture(event.pointerId);
});
handle.addEventListener('pointermove',event=>{
 if(!drag||event.pointerId!==drag.id)return;
 const dx=event.clientX-drag.x,dy=event.clientY-drag.y;
 if(Math.hypot(dx,dy)>4)drag.moved=true;
 if(drag.moved){panel.classList.add('dragging');place(drag.left+dx,drag.top+dy);}
});
function finish(){if(!drag)return;suppressClick=drag.moved;drag=null;panel.classList.remove('dragging');}
handle.addEventListener('pointerup',finish);
handle.addEventListener('pointercancel',()=>{finish();suppressClick=false;});
handle.addEventListener('click',event=>{if(suppressClick){event.preventDefault();suppressClick=false;}});
function fit(){const rect=panel.getBoundingClientRect();place(rect.left,rect.top);}
panel.addEventListener('toggle',fit);
window.addEventListener('resize',fit);
