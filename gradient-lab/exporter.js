// Save through the local server; keep a visible fallback link on static hosting.
export async function saveExport(blob,extension,status,result){
 if(!blob?.size)throw Error('编码没有产生有效文件');
 result.replaceChildren();
 status.textContent='正在保存到本地…';
 const response=await fetch('/api/export/'+extension,{method:'POST',headers:{'Content-Type':blob.type||'application/octet-stream'},body:blob});
 if(!response.ok){
  if(response.status===501||response.status===404){
   const link=document.createElement('a');link.href=URL.createObjectURL(blob);link.download='gradient.'+(extension==='mp4'&&blob.type.includes('webm')?'webm':extension);link.textContent='点击下载生成的文件';result.append(link);
   throw Error('当前是静态预览服务。请用 python3 server.py 启动以直接保存本地文件。');
  }
  let message='保存失败';try{message=(await response.json()).error||message;}catch{}
  throw Error(message);
 }
 const data=await response.json();
 const link=document.createElement('a');link.href=data.url+'?download=1';link.download=data.url.split('/').pop();link.textContent='下载 '+extension.toUpperCase()+' 文件';
 const preview=document.createElement('a');preview.href=data.url;preview.target='_blank';preview.rel='noopener';preview.textContent='预览';preview.style.marginLeft='16px';
 result.append(link,preview);status.textContent=`作品已生成 · ${extension.toUpperCase()} · ${(data.bytes/1024/1024).toFixed(2)} MB`;
 link.click();
 return data;
}
export function canvasBlob(canvas,mime){return new Promise((resolve,reject)=>canvas.toBlob(blob=>blob?resolve(blob):reject(Error('图片编码失败')),mime,.98));}

export function recordCanvas(canvas,{seconds,fps,onProgress,signal}){
 return new Promise((resolve,reject)=>{
  if(!canvas.captureStream||typeof MediaRecorder==='undefined')return reject(Error('当前浏览器不支持视频录制，请使用最新版 Chrome 或 Edge'));
  const mime=['video/webm;codecs=vp9','video/webm;codecs=vp8','video/webm','video/mp4'].find(type=>MediaRecorder.isTypeSupported(type));
  if(!mime)return reject(Error('此浏览器没有可用的视频编码器'));
  let stream,recorder,timer,finished=false;const chunks=[];
  const cleanup=()=>{clearInterval(timer);stream?.getTracks().forEach(t=>t.stop());signal.removeEventListener('abort',cancel);};
  const fail=error=>{if(finished)return;finished=true;cleanup();reject(error);};
  const cancel=()=>{if(recorder?.state==='recording')recorder.stop();fail(Error('已取消导出'));};
  try{
   stream=canvas.captureStream(fps);recorder=new MediaRecorder(stream,{mimeType:mime,videoBitsPerSecond:16000000});
   recorder.ondataavailable=e=>{if(e.data.size)chunks.push(e.data);};
   recorder.onerror=e=>fail(e.error||Error('视频编码失败'));
   recorder.onstop=()=>{if(finished)return;finished=true;cleanup();const blob=new Blob(chunks,{type:recorder.mimeType});blob.size?resolve(blob):reject(Error('录制为空，请保持页面在前台再试'));};
   signal.addEventListener('abort',cancel,{once:true});
   recorder.start(250);const start=performance.now();
   timer=setInterval(()=>{const progress=Math.min(1,(performance.now()-start)/(seconds*1000));onProgress(progress);if(progress>=1&&recorder.state==='recording')recorder.stop();},100);
  }catch(error){fail(error);}
 });
}
