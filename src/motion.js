let orbitDispose=()=>{};
function initMotion(){
  orbitDispose();
  const reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let frame=0,observer=null,visible=true,resizeObserver=null;
  const abort=new AbortController(),signal=abort.signal;
  orbitDispose=()=>{cancelAnimationFrame(frame);observer?.disconnect();resizeObserver?.disconnect();abort.abort();};
  if('IntersectionObserver' in window&&!reduced){
    observer=new IntersectionObserver(entries=>{for(const entry of entries)if(entry.isIntersecting){entry.target.classList.add('is-visible');observer.unobserve(entry.target);}},{threshold:.06});
    document.querySelectorAll('.launch-card,.dashboard-main>.stats,.overview-documents,.library-card,.test-card,.metric-card').forEach((el,i)=>{el.classList.add('scroll-reveal');el.style.transitionDelay=(i%3)*65+'ms';observer.observe(el);});
  }
  const stage=document.getElementById('orbit-stage'),canvas=document.getElementById('orbit-canvas');
  if(!stage||!canvas)return;
  const ctx=canvas.getContext('2d');if(!ctx)return;
  const nodes=[...stage.querySelectorAll('.orbit-node')];
  let nodeSizes=[];
  let width=0,height=0,dpr=1,hover=false,px=0,py=0,targetX=0,targetY=0,lastDraw=0,lastTime=0,orbitTime=0;
  const resize=()=>{const rect=stage.getBoundingClientRect();width=rect.width;height=rect.height;dpr=Math.min(window.devicePixelRatio||1,1.5);canvas.width=Math.round(width*dpr);canvas.height=Math.round(height*dpr);nodeSizes=nodes.map(node=>({w:node.offsetWidth,h:node.offsetHeight}));};
  resize();if('ResizeObserver' in window){resizeObserver=new ResizeObserver(resize);resizeObserver.observe(stage);}
  stage.addEventListener('pointermove',event=>{const rect=stage.getBoundingClientRect();targetX=((event.clientX-rect.left)/rect.width-.5)*14;targetY=((event.clientY-rect.top)/rect.height-.5)*12;},{signal});
  stage.addEventListener('pointerenter',()=>hover=true,{signal});stage.addEventListener('pointerleave',()=>{hover=false;targetX=0;targetY=0;},{signal});
  stage.addEventListener('focusin',()=>hover=true,{signal});stage.addEventListener('focusout',()=>hover=false,{signal});
  const stars=Array.from({length:58},(_,i)=>({x:((i*67+23)%211)/211,y:((i*43+47)%197)/197,r:i%13===0?1.6:.65,a:.12+(i%5)*.055}));
  function project(theta,r,tilt,rotation,cx,cy){const x=Math.cos(theta)*r,y=Math.sin(theta)*r*Math.cos(tilt),z=Math.sin(theta)*Math.sin(tilt);return {x:cx+x*Math.cos(rotation)-y*Math.sin(rotation),y:cy+x*Math.sin(rotation)+y*Math.cos(rotation),z};}
  function ring(r,tilt,rotation,cx,cy,front,color){ctx.beginPath();let pen=false;for(let i=0;i<=180;i++){const p=project(i/180*Math.PI*2,r,tilt,rotation,cx,cy);if((p.z>=0)===front){if(pen)ctx.lineTo(p.x,p.y);else ctx.moveTo(p.x,p.y);pen=true;}else pen=false;}ctx.strokeStyle=color;ctx.lineWidth=front?1.05:.65;ctx.stroke();}
  function draw(now){
    if(!canvas.isConnected)return;
    if(!reduced)frame=requestAnimationFrame(draw);
    if(now-lastDraw<32&&!reduced)return;
    const dt=Math.min(.06,(now-(lastTime||now))/1000);lastTime=now;lastDraw=now;
    if(document.hidden||!visible)return;
    if(!hover&&!reduced)orbitTime+=dt;
    px+=(targetX-px)*.06;py+=(targetY-py)*.06;
    const time=reduced?0:now/1000,cx=width*.5+px,cy=height*.5+py,radius=Math.min(width*.215,height*.235,110),ringRadius=Math.min(width*.35,height*.41),rotation=-.43+Math.sin(time*.13)*.035;
    ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,width,height);
    for(const star of stars){ctx.globalAlpha=star.a*(.75+.25*Math.sin(time*.65+star.x*10));ctx.fillStyle='#dac1ef';ctx.beginPath();ctx.arc(star.x*width,star.y*height,star.r,0,Math.PI*2);ctx.fill();if(star.r>1){ctx.strokeStyle='#c7a7e0';ctx.lineWidth=.5;ctx.beginPath();ctx.moveTo(star.x*width-4,star.y*height);ctx.lineTo(star.x*width+4,star.y*height);ctx.moveTo(star.x*width,star.y*height-4);ctx.lineTo(star.x*width,star.y*height+4);ctx.stroke();}}
    ctx.globalAlpha=1;
    const halo=ctx.createRadialGradient(cx,cy,radius*.3,cx,cy,radius*2.05);halo.addColorStop(0,'#d299d52b');halo.addColorStop(.48,'#b772ca17');halo.addColorStop(1,'#a769c700');ctx.fillStyle=halo;ctx.fillRect(cx-radius*2.1,cy-radius*2.1,radius*4.2,radius*4.2);
    ring(ringRadius,1.07,rotation,cx,cy,false,'#d1a9dc34');ring(ringRadius*.97,1.19,.75,cx,cy,false,'#f5c6a234');
    const globe=ctx.createRadialGradient(cx-radius*.42,cy-radius*.48,radius*.02,cx+radius*.37,cy+radius*.32,radius*1.62);globe.addColorStop(0,'#ffe7bd');globe.addColorStop(.2,'#f1c6b3');globe.addColorStop(.43,'#d09ba9');globe.addColorStop(.69,'#9c6caa');globe.addColorStop(.89,'#563978');globe.addColorStop(1,'#22182f');
    ctx.fillStyle=globe;ctx.beginPath();ctx.arc(cx,cy,radius,0,Math.PI*2);ctx.fill();
    ctx.save();ctx.beginPath();ctx.arc(cx,cy,radius-.4,0,Math.PI*2);ctx.clip();
    ctx.strokeStyle='#fff1d52e';ctx.lineWidth=.65;
    const spherePoint=(lat,lon)=>{const x=Math.cos(lat)*Math.cos(lon+time*.075)*radius,y=Math.sin(lat)*radius,z=Math.cos(lat)*Math.sin(lon+time*.075)*radius;const yy=y*Math.cos(.25)-z*Math.sin(.25),zz=y*Math.sin(.25)+z*Math.cos(.25);return {x:cx+x*Math.cos(-.27)-yy*Math.sin(-.27),y:cy+x*Math.sin(-.27)+yy*Math.cos(-.27),z:zz};};
    for(let j=-3;j<=3;j++){ctx.beginPath();let pen=false;for(let k=0;k<=100;k++){const p=spherePoint(j*.34,k/100*Math.PI*2);if(p.z>0){if(pen)ctx.lineTo(p.x,p.y);else ctx.moveTo(p.x,p.y);pen=true;}else pen=false;}ctx.stroke();}
    for(let j=0;j<16;j++){ctx.beginPath();let pen=false;for(let k=0;k<=70;k++){const p=spherePoint(-Math.PI/2+k/70*Math.PI,j/16*Math.PI*2);if(p.z>0){if(pen)ctx.lineTo(p.x,p.y);else ctx.moveTo(p.x,p.y);pen=true;}else pen=false;}ctx.stroke();}
    const shine=ctx.createRadialGradient(cx-radius*.48,cy-radius*.52,0,cx-radius*.4,cy-radius*.5,radius*.9);shine.addColorStop(0,'#fff1cb35');shine.addColorStop(1,'#fff1cb00');ctx.fillStyle=shine;ctx.fillRect(cx-radius,cy-radius,radius*2,radius*2);ctx.restore();
    ctx.strokeStyle='#e8bfd938';ctx.lineWidth=.7;ctx.beginPath();ctx.arc(cx,cy,radius,0,Math.PI*2);ctx.stroke();
    ring(ringRadius,1.07,rotation,cx,cy,true,'#e4b5cf70');ring(ringRadius*.97,1.19,.75,cx,cy,true,'#efc39d63');
    for(let i=0;i<nodes.length;i++){const theta=orbitTime*.095+i/nodes.length*Math.PI*2+.58,p=project(theta,ringRadius*.93,1.07,rotation,cx,cy);const nodeX=Math.max(nodeSizes[i].w/2+10,Math.min(width-nodeSizes[i].w/2-10,p.x));nodes[i].style.transform=`translate(calc(-50% + ${nodeX-width/2}px),calc(-50% + ${p.y-height/2}px))`;const q=project(theta+.48,ringRadius*.97,1.19,.75,cx,cy);ctx.fillStyle=i%2?'#edbd9c':'#c4a8ec';ctx.shadowColor=ctx.fillStyle;ctx.shadowBlur=13;ctx.beginPath();ctx.arc(q.x,q.y,3.4,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0;}
    const core=stage.querySelector('.orbit-core');if(core)core.style.translate=`${px}px ${py}px`;
  }
  if('IntersectionObserver' in window){const stageObserver=new IntersectionObserver(entries=>visible=entries[0].isIntersecting);stageObserver.observe(stage);const prior=orbitDispose;orbitDispose=()=>{stageObserver.disconnect();prior();};}
  draw(performance.now());
  document.fonts?.ready.then(()=>{if(canvas.isConnected){resize();if(reduced)draw(performance.now());}});
}
document.addEventListener('pointermove',event=>{const card=event.target.closest('.launch-card,.library-card');if(!card)return;const rect=card.getBoundingClientRect();card.style.setProperty('--spot-x',`${event.clientX-rect.left}px`);card.style.setProperty('--spot-y',`${event.clientY-rect.top}px`);},{passive:true});
