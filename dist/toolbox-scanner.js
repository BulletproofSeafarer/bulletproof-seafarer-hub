(()=>{'use strict';
const $=(s,r=document)=>r.querySelector(s);
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
let active=false;
function inject(){const root=$('#docPhotoSlots');if(!root)return;root.querySelectorAll('.doc-side-card').forEach(card=>{if(card.querySelector('.tbscan-open'))return;const side=card.querySelector('[data-photo-side]')?.dataset.photoSide;if(!side)return;const b=document.createElement('button');b.type='button';b.className='tbscan-open';b.dataset.scanSide=side;b.textContent='Crop / Rotate / Enhance image';card.append(b)})}
let queued=false;new MutationObserver(()=>{if(!queued){queued=true;queueMicrotask(()=>{queued=false;inject()})}}).observe(document.body,{subtree:true,childList:true});inject();
function make(tag,cls,txt){const el=document.createElement(tag);if(cls)el.className=cls;if(txt)el.textContent=txt;return el}
async function openEditor(side){if(active)return;const record=$('[data-save-doc]')?.dataset.saveDoc;if(!record)return;
let blob=(typeof pendingDocPhotos!=='undefined'?pendingDocPhotos[side]:null);if(!(blob instanceof Blob)&&record!=='new'&&typeof window.photoOperation==='function'){
try{blob=await window.photoOperation(record+'::'+side,'read');if(!blob&&side==='page')blob=await window.photoOperation(record,'read')}catch(e){}}
if(!(blob instanceof Blob)){alert('Choose or take a document photo first, then tap Crop / Rotate / Enhance.');return}
if(!blob.type.startsWith('image/')){alert('This editor supports photos (JPG, PNG and WebP), not PDF files.');return}
active=true;let url=URL.createObjectURL(blob),bitmap;
try{bitmap=await createImageBitmap(blob)}catch(e){URL.revokeObjectURL(url);active=false;alert('Unable to open this image. Try a JPG or PNG photo.');return}
const dlg=make('dialog','tbscan-dialog'),shell=make('div','tbscan-shell'),head=make('div','tbscan-head');head.append(make('h2','',`Edit ${side==='page'?'document':side+' side'}`));const x=make('button','tbscan-x','×');x.type='button';x.setAttribute('aria-label','Close editor');head.append(x);shell.append(head);
const wrap=make('div','tbscan-canvas-wrap'),canvas=make('canvas','tbscan-canvas');wrap.append(canvas);shell.append(wrap);
const controls=make('div','tbscan-controls');const fields={};for(const [key,title,min,max,value] of [['zoom','Crop / zoom',100,250,100],['bright','Brightness',60,160,100],['contrast','Contrast',60,180,100]]){const label=make('label','',title),input=make('input');input.type='range';input.min=min;input.max=max;input.value=value;input.step=5;fields[key]=input;label.append(input);controls.append(label)}
const actions=make('div','tbscan-row');const left=make('button','','Rotate left'),right=make('button','','Rotate right'),reset=make('button','','Reset');[left,right,reset].forEach(b=>{b.type='button';actions.append(b)});controls.append(actions);
const status=make('p','tbscan-status');status.setAttribute('role','alert');controls.append(status);
const foot=make('div','tbscan-row'),cancel=make('button','','Cancel'),apply=make('button','tbscan-apply','Use edited photo');cancel.type=apply.type='button';foot.append(cancel,apply);controls.append(foot);shell.append(controls);shell.append(make('p','tbscan-note','Drag the photo to reposition the crop. Changes are applied only after you save the document.'));dlg.append(shell);document.body.append(dlg);
let angle=0,dx=0,dy=0;const sourceW=bitmap.width,sourceH=bitmap.height;
function dimensions(){const turned=Math.abs(angle%180)===90;return [turned?sourceH:sourceW,turned?sourceW:sourceH]}
function draw(output=false){const [w,h]=dimensions(),max=output?2400:700,scale=Math.min(1,max/Math.max(w,h)),cw=Math.max(1,Math.round(w*scale)),ch=Math.max(1,Math.round(h*scale));const target=output?document.createElement('canvas'):canvas;target.width=cw;target.height=ch;const ctx=target.getContext('2d');if(!ctx)return target;ctx.fillStyle='#fff';ctx.fillRect(0,0,cw,ch);ctx.save();ctx.translate(cw/2,ch/2);ctx.beginPath();ctx.rect(-cw/2,-ch/2,cw,ch);ctx.clip();ctx.filter=`brightness(${fields.bright.value}%) contrast(${fields.contrast.value}%)`;const zoom=+fields.zoom.value/100;ctx.translate(dx*cw,dy*ch);ctx.scale(zoom,zoom);ctx.rotate(angle*Math.PI/180);ctx.drawImage(bitmap,-sourceW*scale/2,-sourceH*scale/2,sourceW*scale,sourceH*scale);ctx.restore();return target}
let drag=null;canvas.addEventListener('pointerdown',e=>{drag={x:e.clientX,y:e.clientY,dx,dy};canvas.setPointerCapture(e.pointerId)});canvas.addEventListener('pointermove',e=>{if(!drag)return;dx=clamp(drag.dx+(e.clientX-drag.x)/canvas.clientWidth,-.8,.8);dy=clamp(drag.dy+(e.clientY-drag.y)/canvas.clientHeight,-.8,.8);draw()});canvas.addEventListener('pointerup',()=>drag=null);canvas.addEventListener('pointercancel',()=>drag=null);
Object.values(fields).forEach(el=>el.addEventListener('input',()=>draw()));left.onclick=()=>{angle=(angle+270)%360;dx=dy=0;draw()};right.onclick=()=>{angle=(angle+90)%360;dx=dy=0;draw()};reset.onclick=()=>{angle=dx=dy=0;fields.zoom.value=fields.bright.value=fields.contrast.value=100;draw()};
function close(){dlg.close()};x.onclick=cancel.onclick=close;dlg.addEventListener('close',()=>{bitmap.close?.();URL.revokeObjectURL(url);dlg.remove();active=false},{once:true});
apply.onclick=async()=>{apply.disabled=true;status.textContent='Processing photo…';try{const result=draw(true);const out=await new Promise(resolve=>result.toBlob(resolve,'image/jpeg',.88));if(!out)throw Error('Could not create edited image');if(typeof pendingDocPhotos==='undefined')throw Error('Document editor is unavailable');pendingDocPhotos[side]=new File([out],`toolbox-${side}-edited.jpg`,{type:'image/jpeg'});if(typeof updateDocSlots==='function')updateDocSlots();close()}catch(e){status.textContent='Unable to apply photo changes. Please try again.';apply.disabled=false}};
try{dlg.showModal();draw()}catch(e){dlg.remove();bitmap.close?.();URL.revokeObjectURL(url);active=false}
}
document.addEventListener('click',e=>{const btn=e.target.closest('[data-scan-side]');if(btn){e.preventDefault();openEditor(btn.dataset.scanSide)}});
})();
