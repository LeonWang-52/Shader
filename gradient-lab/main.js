import {saveExport,canvasBlob,recordCanvas} from './exporter.js?v=20260918c';
import {installNoise} from './noise.js';
import { createCurveField } from './curve-field.js';
import { createColorNodes } from './color-nodes.js';
import { createMeshEditor } from './mesh-editor.js';
const canvas = document.querySelector('#canvas');
const gl = canvas.getContext('webgl2', { antialias: false, preserveDrawingBuffer: true });
const $ = (id) => document.getElementById(id);
let exporting=false;
let running = false; // Start still for direct mesh editing; play remains available.
if (new URLSearchParams(location.search).has('still')) running = false;
let customBase=false;
let elapsed = 0, previous = performance.now();
try {
  if (!gl) throw new Error('此浏览器无法运行 WebGL 2，请使用支持 WebGL 2 的浏览器。');
  const response = await fetch('./shaders/fragment.glsl?v=poster-20260920');
  if (!response.ok) throw new Error('Shader 文件加载失败');
  const fragment = await response.text();
  function compile(type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source); gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(shader));
    return shader;
  }
  const program = gl.createProgram();
  gl.attachShader(program, compile(gl.VERTEX_SHADER, await (await fetch('./shaders/vertex.glsl')).text()));
  gl.attachShader(program, compile(gl.FRAGMENT_SHADER, fragment));
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program,gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(program));
  gl.useProgram(program);
  installNoise(gl,program);
  const pauseEditing=()=>{running=false;updatePause();};
  const curveField=createCurveField(gl,program,()=>{pauseEditing();});
  const colorLayer=createColorNodes(gl,program,pauseEditing);
  const editor=createMeshEditor(gl,program,$('meshOverlay'),pauseEditing,colorLayer);
  $('addColor').onclick=()=>{
    $('editMesh').checked=true;editor.setEnabled(true);
    const n=colorLayer.points.length;
    const uv=editor.toUV([0.4+(n%3)*0.08,0.42+(Math.floor(n/3)%3)*0.08]);
    if(uv)colorLayer.add(uv);
  };
  editor.setEnabled($('editMesh').checked);
  $('editMesh').onchange=()=>editor.setEnabled($('editMesh').checked);
  $('resetMesh').onclick=()=>editor.reset();
  for(const [id,axis] of [['addMeshRow','y'],['addMeshColumn','x']]) $(id).onclick=()=>{$('editMesh').checked=true;editor.setEnabled(true);editor.insert(axis);};
  const uniforms = Object.fromEntries(['resolution','time','grain','dots','flow','feather','blendMode','blendColor','blendAmount','customBase','baseColor','engine','dotCount','dotColor','dotShape','dotSize','dotOpacity','posterPreset','ribCount','ribDepth','posterGrid','posterLevels','printGrain'].map(k=>[k,gl.getUniformLocation(program,'u_'+k)]));
  let needsRender=true,frameRequest=0,leaving=false;
  const invalidate=()=>{needsRender=true;};
  for(const event of ['input','change','click','pointerdown','pointermove','pointerup','dblclick','contextmenu','keydown']) document.addEventListener(event,invalidate,true);
  window.addEventListener('resize',invalidate);
  document.addEventListener('visibilitychange',()=>{previous=performance.now();invalidate();});
  window.addEventListener('pagehide',()=>{leaving=true;cancelAnimationFrame(frameRequest);});
  window.addEventListener('pageshow',()=>{if(leaving){leaving=false;previous=performance.now();invalidate();frameRequest=requestAnimationFrame(render);}});
  function render(now, schedule=true) {
    if(leaving)return;
    if(schedule)frameRequest=requestAnimationFrame(render);
    if(schedule&&(document.hidden||(!running&&!needsRender))){previous=now;return;}
    needsRender=false;
    if(running && !document.hidden) elapsed += Math.min((now-previous)/1000,0.1)*Number($('speed').value);
    previous=now;
    const w=Number($('canvasWidth').value)||1242,h=Number($('canvasHeight').value)||856;
    const stage=$('stage'),sw=stage.clientWidth-64,sh=stage.clientHeight-104,scale=Math.max(.01,Math.min(sw/w,sh/h));
    canvas.style.width=w*scale+'px';canvas.style.height=h*scale+'px';
    $('meshOverlay').style.width=canvas.style.width;$('meshOverlay').style.height=canvas.style.height;
    if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;gl.viewport(0,0,w,h);}
    gl.uniform2f(uniforms.resolution,w,h);
    gl.uniform1f(uniforms.time,elapsed);
    gl.uniform1f(uniforms.grain,Number($('grain').value)/100);
    gl.uniform1f(uniforms.dots,$('dots').checked?1:0);
    gl.uniform1i(uniforms.dotCount,Math.max(0,Math.min(2000,Math.round(Number($('dotCount').value)||0))));
    gl.uniform1i(uniforms.dotShape,Number($('dotShape').value));
    gl.uniform1f(uniforms.dotSize,Math.max(1,Math.min(30,Number($('dotSize').value)||1)));
    gl.uniform1f(uniforms.dotOpacity,Math.max(0,Math.min(100,Number($('dotOpacity').value)||0))/100);
    gl.uniform3f(uniforms.dotColor,...[1,3,5].map(i=>parseInt($('dotColor').value.slice(i,i+2),16)/255));
    gl.uniform1f(uniforms.flow,1);
    for(const id of ['posterPreset','ribCount','ribDepth','posterGrid','posterLevels','printGrain']) gl.uniform1f(uniforms[id],Number($(id).value));
    gl.uniform1i(uniforms.engine,Number($('renderEngine').value));
    gl.uniform1f(uniforms.feather,Number($('feather').value));
    gl.uniform1i(uniforms.blendMode,Number($('blendMode').value));
    const hex=$('blendColor').value;
    gl.uniform3f(uniforms.blendColor,...[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16)/255));
    gl.uniform1f(uniforms.blendAmount,Number($('blendAmount').value)/100);
gl.uniform1i(uniforms.customBase,customBase?1:0);
    const baseHex=$('baseColor').value;
    gl.uniform3f(uniforms.baseColor,...[1,3,5].map(i=>parseInt(baseHex.slice(i,i+2),16)/255));
    curveField.upload();
    colorLayer.upload();
    editor.render();
    curveField.stageDraw();

  }
  const updatePause=()=>$('pause').textContent=running?'暂停':'播放';
  $('pause').onclick=()=>{running=!running;updatePause();};
  $('reset').onclick=()=>{$('renderEngine').value=document.body.dataset.initialEngine||'0';updateEngineUI();customBase=false;$('baseColor').value='#f2a90e';$('baseColorStatus').textContent='当前使用参考渐变底色';colorLayer.clear();editor.reset();elapsed=0;running=false;$('speed').value='0.6';$('grain').value='13';$('dots').checked=true;$('dotCount').value='408';$('dotCountRange').value='408';$('dotColor').value='#ffedc2';$('dotShape').value='0';$('dotSize').value='5';$('dotOpacity').value='64';$('speedValue').value='0.6';$('grainValue').value='13';$('feather').value='1';$('featherValue').value='1';$('blendMode').value='0';$('blendColor').value='#f2a90e';$('blendAmount').value='100';$('blendAmountValue').value='100%';if($('renderEngine').value==='2')$('applyPoster').click();updatePause();};
  for(const id of ['speed','feather']) $(id).oninput=()=>$(id+'Value').value=$(id).value;
  $('grain').oninput=()=>{$('grainValue').value=$('grain').value;render(performance.now(),false);};
  $('grainValue').oninput=()=>{
    const value=$('grainValue').valueAsNumber;
    if(!Number.isFinite(value)) return;
    $('grain').value=String(Math.max(0,Math.min(30,value)));
    render(performance.now(),false);
  };
  $('grainValue').onchange=()=>{$('grainValue').value=$('grain').value;};
  $('featherValue').oninput=()=>{const v=$('featherValue').valueAsNumber;if(Number.isFinite(v))$('feather').value=Math.max(1,Math.min(40,v));};
  $('featherValue').onblur=()=>$('featherValue').value=$('feather').value;
  for(const id of ['canvasWidth','canvasHeight'])$(id).onchange=()=>{$(id).value=Math.max(64,Math.min(4096,Math.round(Number($(id).value)||1242)));};
  $('dotCountRange').oninput=()=>$('dotCount').value=$('dotCountRange').value;
  $('dotCount').oninput=()=>{$('dotCountRange').value=String(Math.max(0,Math.min(2000,Math.round(Number($('dotCount').value)||0))));};
  for(const id of ['dotCount','dotSize','dotOpacity'])$(id).onblur=()=>{$(id).value=String(Math.max(Number($(id).min),Math.min(Number($(id).max),Number($(id).value)||0)));if(id==='dotCount'){$(id).value=Math.round(Number($(id).value));$('dotCountRange').value=$(id).value;}};
  $('grainValue').onblur=()=>{$('grainValue').value=$('grain').value;};
  function updateEngineUI(){const poster=$('renderEngine').value==='2';$('posterSettings').hidden=!poster;
    for(const id of ['feather','featherValue','grain','grainValue','blendMode','blendAmount','blendColor','editMesh','addMeshRow','addMeshColumn','resetMesh','addColor','baseColor','restoreBase','randomCurves','resetCurves','invertCurves','curveSmooth','editX','editY','showCurves']) $(id).disabled=poster;
    $('curveX').parentElement.hidden=poster;$('curveY').parentElement.hidden=poster;
    $('curveFieldSettings').querySelector('legend').textContent=poster?'海报色带':'双曲线色带';
    $('blendHint').closest('fieldset').hidden=poster;
    const curves=$('renderEngine').value!=='0';$('curveFieldSettings').hidden=!curves;$('blendColorRow').hidden=curves;$('blendHint').textContent=curves?'混合 X 与 Y 曲线的数值，再映射到色带。':'将渐变颜色与指定混合色叠加。';curveField.draw();}
  $('renderEngine').onchange=()=>{updateEngineUI();render(performance.now(),false);};
  const posterPalettes=[
    ['#100c0c','#e51c51','#ff6332','#fff3b9','#ffda00'],
    ['#110708','#291419','#704b42','#d6a38c','#ffe8c9'],
    ['#170719','#6d086c','#bb109a','#e4f695'],
    ['#100908','#594332','#e9ddba','#fffbed','#f31521'],
    ['#190e24','#402444','#6ab6ae','#b9f0d3','#f2fff5']
  ];
  function applyPosterPalette(){
    const colors=posterPalettes[Number($('posterPreset').value)];
    const state=curveField.getState();state.colors=colors;state.positions=colors.map((_,i)=>i/(colors.length-1));curveField.setState(state);
  }
  $('posterPreset').onchange=()=>{applyPosterPalette();render(performance.now(),false);};
  $('applyPoster').onclick=()=>{
    applyPosterPalette();
    $('canvasWidth').value='900';$('canvasHeight').value='1290';$('dots').checked=false;$('showCurves').checked=false;
    $('editMesh').checked=false;editor.setEnabled(false);editor.reset();colorLayer.clear();customBase=false;elapsed=0;
    updateEngineUI();
  };
  $('renderEngine').value=document.body.dataset.initialEngine||'1';
  if($('renderEngine').value==='2')$('applyPoster').click();
  if($('renderEngine').value==='0'){$('blendMode').value='0';$('feather').value='1';$('featherValue').value='1';}
  updateEngineUI();
  $('baseColor').oninput=()=>{customBase=true;$('baseColorStatus').textContent='当前使用自定义底色 '+$('baseColor').value.toUpperCase();render(performance.now(),false);};
  $('restoreBase').onclick=()=>{customBase=false;$('baseColorStatus').textContent='当前使用参考渐变底色';render(performance.now(),false);};
  $('blendMode').onchange=()=>render(performance.now(),false);
  $('blendColor').oninput=()=>render(performance.now(),false);
  $('blendAmount').oninput=()=>{$('blendAmountValue').value=$('blendAmount').value+'%';render(performance.now(),false);};
  async function loadExportFolder(){try{const response=await fetch('/api/export-directory');if(!response.ok)throw Error();const data=await response.json();$('exportFolder').textContent=data.path;$('exportFolderStatus').textContent='图片、视频和参数文件保存到此文件夹。';}catch{$('exportFolderStatus').textContent='读取失败，请确认本地导出服务已启动。';}}
  $('saveExportFolder').onclick=async()=>{const button=$('saveExportFolder');button.disabled=true;button.textContent='正在选择…';$('exportFolderStatus').textContent='请在系统窗口中选择文件夹。';try{const response=await fetch('/api/choose-export-directory',{method:'POST'});const data=await response.json();if(!response.ok)throw Error(data.error||'无法选择文件夹');$('exportFolder').textContent=data.path;$('exportFolderStatus').textContent=data.cancelled?'已取消，导出位置未改变。':'已设为导出文件夹。';}catch(error){$('exportFolderStatus').textContent='选择失败：'+error.message;}finally{button.disabled=false;button.textContent='选择文件夹…';}};
  loadExportFolder();
  const exportStatus=$('exportStatus'),exportResult=$('exportResult');
  let exportAbort;
  $('exportFormat').onchange=()=>{const video=['MP4','WebM'].includes($('exportFormat').value);$('videoSettings').hidden=!video;$('save').textContent='导出作品';};
  $('cancelExport').onclick=()=>exportAbort?.abort();
  $('save').onclick=async()=>{
    if(exporting)return;exporting=true;const format=$('exportFormat').value.toLowerCase(),video=['mp4','webm'].includes(format),wasRunning=running,wasTime=elapsed;
    const controls=[...document.querySelectorAll('#controls input,#controls select,#controls button,.stage-toolbar button')].filter(el=>el.id!=='cancelExport');
    const states=controls.map(el=>el.disabled);controls.forEach(el=>el.disabled=true);
    $('stage').classList.add('exporting');$('controls').classList.add('exporting');exportResult.replaceChildren();
    try{
      let blob;
      if(video){
        const seconds=Math.max(1,Math.min(60,Number($('videoSeconds').value)||5)),fps=Number($('videoFps').value);$('videoSeconds').value=seconds;
        if(Number($('speed').value)===0)throw Error('流动速度为 0，请先调高速度再导出动画');
        exportAbort=new AbortController();$('cancelExport').hidden=false;running=true;previous=performance.now();updatePause();render(performance.now(),false);
        blob=await recordCanvas(canvas,{seconds,fps,signal:exportAbort.signal,onProgress:p=>exportStatus.textContent=`正在录制 ${Math.round(p*100)}% · ${seconds} 秒 / ${fps} fps`});
        $('cancelExport').hidden=true;exportStatus.textContent='正在编码保存…';
      }else{render(performance.now(),false);blob=await canvasBlob(canvas,'image/'+format);}
      await saveExport(blob,format,exportStatus,exportResult);
    }catch(error){exportStatus.textContent=error.message;}
    finally{if(video){running=wasRunning;elapsed=wasTime;previous=performance.now();updatePause();}controls.forEach((el,i)=>el.disabled=states[i]);$('stage').classList.remove('exporting');$('controls').classList.remove('exporting');$('cancelExport').hidden=true;exporting=false;invalidate();}
  };
  const stateIds=['canvasWidth','canvasHeight','renderEngine','grain','feather','blendMode','blendColor','blendAmount','baseColor','speed','dotCount','dotColor','dotShape','dotSize','dotOpacity','posterPreset','ribCount','ribDepth','posterGrid','posterLevels','printGrain'];
  $('saveState').onclick=async()=>{try{const data={version:1,field:curveField.getState(),settings:Object.fromEntries(stateIds.map(id=>[id,$(id).value])),dots:$('dots').checked,customBase};await saveExport(new Blob([JSON.stringify(data,null,2)],{type:'application/json'}),'json',$('stateStatus'),exportResult);}catch(error){$('stateStatus').textContent=error.message;}};
  $('loadState').onclick=()=>$('stateFile').click();
  $('stateFile').onchange=async()=>{try{
    const file=$('stateFile').files[0];if(!file)return;if(file.size>100000)throw Error('参数文件过大');
    const data=JSON.parse(await file.text()),f=data.field;
    if(data.version!==1||!f||!Array.isArray(f.colors)||f.colors.length<2||f.colors.length>20||f.colors.some(c=>!/^#[0-9a-f]{6}$/i.test(c))||!Array.isArray(f.positions)||f.positions.length!==f.colors.length||f.positions.some((v,i)=>!Number.isFinite(v)||v<0||v>1||(i>0&&v<=f.positions[i-1]))||!Array.isArray(f.curves)||f.curves.length!==2||f.curves.some(c=>!Array.isArray(c)||c.length<2||c.length>20||c.some((p,i)=>!Array.isArray(p)||p.length!==2||p.some(v=>!Number.isFinite(v)||v<0||v>1)||(i>0&&p[0]<=c[i-1][0]))||c[0][0]!==0||c.at(-1)[0]!==1))throw Error('参数格式不正确');
    for(const id of stateIds){const el=$(id),v=data.settings?.[id];if(v==null)continue;if(el.type==='color'){if(/^#[0-9a-f]{6}$/i.test(v))el.value=v;}else if(el.tagName==='SELECT'){if([...el.options].some(o=>o.value===String(v)))el.value=v;}else if(Number.isFinite(Number(v)))el.value=Math.max(Number(el.min),Math.min(Number(el.max),Number(v)));}
    $('dotCountRange').value=$('dotCount').value;curveField.setState(f);customBase=data.customBase===true;$('dots').checked=data.dots===true;elapsed=0;editor.reset();colorLayer.clear();
    for(const id of ['grain','feather','speed'])$(id+'Value').value=$(id).value;updateEngineUI();$('stateStatus').textContent='参数已载入';
  }catch(error){$('stateStatus').textContent='载入失败：'+error.message;}finally{$('stateFile').value='';}};
  document.addEventListener('keydown',event=>{if(exporting)return;if(/INPUT|BUTTON|SUMMARY|SELECT/.test(event.target.tagName))return;if(event.code==='Space'){event.preventDefault();$('pause').click();}if(event.key.toLowerCase()==='h') {$('controls').hidden=!$('controls').hidden;document.body.classList.toggle('panel-hidden',$('controls').hidden);}});
  canvas.addEventListener('webglcontextlost',event=>{event.preventDefault();$('error').hidden=false;$('error').textContent='图形上下文已丢失，请刷新页面恢复。';});
  updatePause();frameRequest=requestAnimationFrame(render);
} catch(error){$('error').hidden=false;$('error').textContent=error.message;console.error(error);}
