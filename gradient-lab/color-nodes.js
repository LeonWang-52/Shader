// Additional color stops are stored in the Bezier mesh's undeformed UV domain.
export function createColorNodes(gl,program,onEdit){
  const $=id=>document.getElementById(id),max=16;
  let points=[],selected=-1,serial=0;
  const loc=Object.fromEntries(['colorCount','colorStops[0]','stopColors[0]'].map(n=>[n,gl.getUniformLocation(program,'u_'+n)]));
  const palette=['#f2e8a0','#e7470c','#fcac80','#e96850','#f2a90e','#e3a24b'];
  function refresh(){
    $('colorCount').textContent=`${points.length} / ${max}`;
    $('addColor').disabled=points.length>=max;
    $('colorList').replaceChildren();
    points.forEach((p,i)=>{const b=document.createElement('button');b.type='button';b.className='color-chip';b.textContent=String(i+1);b.style.backgroundColor=p.color;b.setAttribute('aria-label',`选择颜色 ${i+1}`);b.setAttribute('aria-pressed',String(i===selected));b.onclick=()=>select(i);$('colorList').append(b);});
    $('colorSettings').hidden=selected<0;
    if(selected>=0){$('nodeColor').value=points[selected].color;$('colorRadius').value=points[selected].radius*100;$('colorRadiusValue').value=Math.round(points[selected].radius*100)+'%';$('selectedColor').textContent=`颜色 ${selected+1}`;}
  }
  function select(i){selected=i;refresh();}
  function add(uv=[0.5,0.5]){
    if(points.length>=max)return;
    points.push({uv,color:palette[serial++%palette.length],radius:0.24});selected=points.length-1;
    onEdit();refresh();
  }
  $('nodeColor').oninput=()=>{if(selected>=0){points[selected].color=$('nodeColor').value;onEdit();refresh();}};
  $('colorRadius').oninput=()=>{if(selected>=0){points[selected].radius=Number($('colorRadius').value)/100;$('colorRadiusValue').value=$('colorRadius').value+'%';onEdit();}};
  $('removeColor').onclick=()=>{if(selected>=0){points.splice(selected,1);selected=Math.min(selected,points.length-1);onEdit();refresh();}};
  refresh();
  return {
    add,select,
    get points(){return points;},get selected(){return selected;},
    move(i,uv){if(points[i]){points[i].uv=uv;onEdit();}},
    clear(){points=[];selected=-1;serial=0;refresh();},
    upload(){
      const positions=new Float32Array(max*4),colors=new Float32Array(max*3);
      points.forEach((p,i)=>{positions.set([...p.uv,p.radius,1],i*4);colors.set([1,3,5].map(j=>parseInt(p.color.slice(j,j+2),16)/255),i*3);});
      gl.uniform1i(loc.colorCount,points.length);gl.uniform4fv(loc['colorStops[0]'],positions);gl.uniform3fv(loc['stopColors[0]'],colors);
    }
  };
}
