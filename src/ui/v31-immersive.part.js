  // V3.1: navegacao e camera sao apenas UI; o motor permanece a unica autoridade.
  let immersiveOpen=null,v31ClassicMode=false,v31CameraCity=null,v31Camera={zoom:1,x:0,y:0};
  let v31ReturnFocus=null,v31LastRevision=null;
  const v31CameraStore='cidade-v31-camera-ui-v1';
  function v31CameraLoad(cityId){
    if(v31CameraCity===cityId)return;
    v31CameraCity=cityId;
    try{const c=JSON.parse(sessionStorage.getItem(v31CameraStore)||'{}')[cityId];
      v31Camera=c&&[c.zoom,c.x,c.y].every(Number.isFinite)?
        {zoom:Math.min(2.4,Math.max(1,c.zoom)),x:Math.max(0,c.x),y:Math.max(0,c.y)}:{zoom:1,x:0,y:0};
    }catch(_){v31Camera={zoom:1,x:0,y:0};}
  }
  function v31CameraSave(){
    try{const all=JSON.parse(sessionStorage.getItem(v31CameraStore)||'{}');
      all[v31CameraCity]=v31Camera;sessionStorage.setItem(v31CameraStore,JSON.stringify(all));
    }catch(_){} // Ambiente pode bloquear preferencias de interface.
  }
  function v31CameraApply(){
    const canvas=$('map-canvas'),svg=canvas?.querySelector('svg');if(!svg)return;
    svg.style.transformOrigin='left top';svg.style.transform='scale('+v31Camera.zoom+')';
    canvas.scrollLeft=v31Camera.x;canvas.scrollTop=v31Camera.y;
    setText('v31-camera-label',Math.round(v31Camera.zoom*100)+'%');
  }
  function v31CameraChange(delta){
    const old=v31Camera.zoom;
    v31Camera.zoom=Math.min(2.4,Math.max(1,Math.round((old+delta)*100)/100));
    if(v31Camera.zoom===1){v31Camera.x=0;v31Camera.y=0;}
    v31CameraApply();v31CameraSave();
  }
  function v31ClosePanel(){
    if(!immersiveOpen)return;
    immersiveOpen=null;goto('cidade');
    const focus=v31ReturnFocus;v31ReturnFocus=null;
    if(focus?.isConnected)focus.focus();
    else $('v31-dock')?.querySelector('button')?.focus();
  }
  function v31OpenPanel(root,section=null,source=null){
    if(!state)return;
    if(v31ClassicMode){goto(root,section);return;}
    if(!['empresa','mercado','administrativo','sistema'].includes(root))return;
    if(!immersiveOpen)v31ReturnFocus=source||document.activeElement;
    immersiveOpen=root;goto(root,section);
    const surface=document.querySelector('.view[data-view="'+root+'"]');
    if(surface){surface.setAttribute('role','region');surface.setAttribute('aria-label','Painel imersivo: '+root);}
    $('v31-overlay-close').focus();
  }
  function v31Render(){
    if(!state?.player?.cityId)return;
    const immersive=!v31ClassicMode&&(tab==='cidade'||!!immersiveOpen);
    document.body.classList.toggle('v31-immersive',immersive);
    document.body.classList.toggle('v31-overlay-open',immersive&&!!immersiveOpen);
    document.body.classList.toggle('v31-classic-mode',v31ClassicMode);
    $('v31-dock').hidden=!immersive;
    $('v31-overlay-close').hidden=!immersiveOpen||v31ClassicMode;
    $('v31-classic-switch').textContent=v31ClassicMode?'Ativar interface imersiva':'Interface clássica';
    v31CameraLoad(viewCityId);v31CameraApply();
    const city=CidadeV31ReadModel.readCity(state,{cityId:viewCityId,selectedLot});
    const owner=city.lots.find(x=>x.lot===selectedLot)?.unit;
    setText('v31-lot-context',!inspectorOpen?'Selecione um lote para abrir as ações.':
      owner?('Lote '+selectedLot+' · '+owner.sectorName+' · sua empresa'):
      ('Lote '+selectedLot+' · sem empresa da sua rede'));
    $('v31-lot-quick').hidden=!inspectorOpen;
    for(const button of $('v31-lot-quick').querySelectorAll('[data-v31-open]'))button.disabled=!owner;
    $('v31-lot-manage').textContent=owner?'Gerenciar empresa':'Abrir empresa';
    setText('v31-hud-pause',timer?'Ⅱ Pausar':'▶ Jogar');
    $('v31-hud-speed').value=String(speed);
    const key=String(state.worldId)+'/'+state.revision+'/'+viewCityId;
    if(v31LastRevision!==key){
      v31LastRevision=key;
      const recent=CidadeV31ReadModel.readEvents(state,{mode:'recent',limit:4});
      const list=$('v31-alert-list');
      list.replaceChildren(...recent.events.map(event=>{
        const li=document.createElement('li');li.textContent=event.date+' · '+event.text;return li;
      }));
      if(!recent.events.length){const li=document.createElement('li');li.textContent='Sem eventos confirmados.';list.appendChild(li);}
      setText('v31-alert-count',recent.events.length+' eventos recentes');
    }
  }
  function v31Bind(){
    document.querySelectorAll('[data-v31-open]').forEach(button=>{
      button.addEventListener('click',()=>{
        const [root,section]=button.dataset.v31Open.split(':');
        const plot=CidadeV31ReadModel.readCity(state,{cityId:viewCityId,selectedLot}).lots.find(x=>x.lot===selectedLot);
        if(button.closest('#v31-lot-quick')&&plot?.unit&&business()?.id!==plot.unit.id){
          commit('EMPRESA.ATIVAR',{businessId:plot.unit.id}).then(ok=>{if(ok)v31OpenPanel(root,section,button);});return;
        }
        v31OpenPanel(root,section,button);
      });
    });
    $('v31-overlay-close').addEventListener('click',v31ClosePanel);
    document.addEventListener('keydown',event=>{
      if(event.key==='Escape'&&immersiveOpen){event.preventDefault();v31ClosePanel();}
    });
    $('v31-classic-switch').addEventListener('click',()=>{
      v31ClassicMode=!v31ClassicMode;
      if(v31ClassicMode){immersiveOpen=null;goto('empresa');}
      else goto('cidade');
    });
    $('v31-lot-manage').addEventListener('click',()=>$('map-open-company').click());
    $('v31-hud-pause').addEventListener('click',()=>{
      $('pause-btn').click();setText('v31-hud-pause',timer?'Ⅱ Pausar':'▶ Jogar');
    });
    $('v31-hud-speed').addEventListener('change',e=>{
      $('speed-select').value=e.target.value;$('speed-select').dispatchEvent(new Event('change'));
    });
    $('v31-camera-plus').addEventListener('click',()=>v31CameraChange(.25));
    $('v31-camera-minus').addEventListener('click',()=>v31CameraChange(-.25));
    $('v31-camera-home').addEventListener('click',()=>{
      v31Camera={zoom:1,x:0,y:0};v31CameraApply();v31CameraSave();
    });
    const canvas=$('map-canvas');
    canvas.addEventListener('scroll',()=>{
      if(!document.body.classList.contains('v31-immersive'))return;
      v31Camera.x=canvas.scrollLeft;v31Camera.y=canvas.scrollTop;v31CameraSave();
    },{passive:true});
    let drag=null;
    canvas.addEventListener('pointerdown',event=>{
      if(event.pointerType==='touch'||event.button!==0||event.target.closest('[data-lot]'))return;
      drag={x:event.clientX,y:event.clientY,left:canvas.scrollLeft,top:canvas.scrollTop};
    });
    canvas.addEventListener('pointermove',event=>{
      if(!drag)return;
      const dx=event.clientX-drag.x,dy=event.clientY-drag.y;
      if(Math.abs(dx)+Math.abs(dy)>5){canvas.scrollLeft=drag.left-dx;canvas.scrollTop=drag.top-dy;}
    });
    for(const type of ['pointerup','pointercancel','pointerleave'])
      canvas.addEventListener(type,()=>{drag=null;});
  }
