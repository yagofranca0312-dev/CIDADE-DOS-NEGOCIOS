  // V3.1: navegacao e camera sao apenas UI; o motor permanece a unica autoridade.
  let immersiveOpen=null,v31CameraCity=null,v31Camera={zoom:1,x:0,y:0};
  let v31ReturnFocus=null,v31LastRevision=null,v31CameraCenterPending=false;
  const v31CameraStore='cidade-v31-camera-ui-v1';
  function v31CameraLoad(cityId){
    if(v31CameraCity===cityId)return;
    v31CameraCity=cityId;v31CameraCenterPending=false;
    try{
      const c=JSON.parse(sessionStorage.getItem(v31CameraStore)||'{}')[cityId];
      if(c&&[c.zoom,c.x,c.y].every(Number.isFinite)){
        v31Camera={zoom:Math.min(2.4,Math.max(1,c.zoom)),x:Math.max(0,c.x),y:Math.max(0,c.y)};
      }else{v31Camera={zoom:1,x:0,y:0};v31CameraCenterPending=true;}
    }catch(_){v31Camera={zoom:1,x:0,y:0};v31CameraCenterPending=true;}
  }
  function v31CameraSave(){
    try{const all=JSON.parse(sessionStorage.getItem(v31CameraStore)||'{}');
      all[v31CameraCity]=v31Camera;sessionStorage.setItem(v31CameraStore,JSON.stringify(all));
    }catch(_){} // Ambiente pode bloquear preferencias de interface.
  }
  function v31CameraApply(){
    const canvas=$('map-canvas'),svg=canvas?.querySelector('svg');
    if(!svg)return;
    svg.style.transformOrigin='left top';
    svg.style.transform='scale('+v31Camera.zoom+')';
    if(v31CameraCenterPending){
      v31Camera.x=Math.max(0,(canvas.scrollWidth-canvas.clientWidth)/2);
      v31Camera.y=Math.max(0,(canvas.scrollHeight-canvas.clientHeight)/2);
      v31CameraCenterPending=false;v31CameraSave();
    }
    canvas.scrollLeft=v31Camera.x;canvas.scrollTop=v31Camera.y;
    setText('v31-camera-label',Math.round(v31Camera.zoom*100)+'%');
  }
  function v31CameraChange(delta){
    const canvas=$('map-canvas'),old=v31Camera.zoom;
    const next=Math.min(2.4,Math.max(1,Math.round((old+delta)*100)/100));
    if(next===old)return;
    const x=(canvas.scrollLeft+canvas.clientWidth/2)/old;
    const y=(canvas.scrollTop+canvas.clientHeight/2)/old;
    v31Camera.zoom=next;
    v31Camera.x=Math.max(0,x*next-canvas.clientWidth/2);
    v31Camera.y=Math.max(0,y*next-canvas.clientHeight/2);
    v31CameraApply();
    v31Camera.x=canvas.scrollLeft;v31Camera.y=canvas.scrollTop;
    v31CameraSave();
  }
  function v31ClosePanel(){
    if(!immersiveOpen)return;
    const old=document.querySelector('.view[data-view="'+immersiveOpen+'"]');
    old?.removeAttribute('aria-modal');old?.removeAttribute('role');
    immersiveOpen=null;$('v31-backdrop').hidden=true;
    goto('cidade');
    const focus=v31ReturnFocus;v31ReturnFocus=null;
    if(focus?.isConnected)focus.focus();
    else $('v31-dock')?.querySelector('button')?.focus();
  }
  function v31OpenPanel(root,section=null,source=null){
    if(!state)return;
    if(!['empresa','mercado','administrativo','sistema'].includes(root))return;
    if(!immersiveOpen)v31ReturnFocus=source||document.activeElement;
    immersiveOpen=root;goto(root,section);
    const surface=document.querySelector('.view[data-view="'+root+'"]');
    if(surface){
      surface.setAttribute('role','dialog');
      surface.setAttribute('aria-modal','true');
      surface.setAttribute('aria-label','Janela '+root+' sobre a cidade');
      surface.prepend($('v31-overlay-close'));
    }
    $('v31-backdrop').hidden=false;
    $('v31-overlay-close').focus();
  }
  function v31Render(){
    if(!state?.player?.cityId)return;
    const immersive=true;
    document.body.classList.toggle('v31-immersive',immersive);
    document.body.classList.toggle('v31-overlay-open',immersive&&!!immersiveOpen);
    $('v31-dock').hidden=!immersive;
    $('v31-backdrop').hidden=!immersiveOpen;
    $('v31-overlay-close').hidden=!immersiveOpen;
    document.body.classList.toggle('v31-lot-selected',!!inspectorOpen);
    setText('v31-hud-cash',$('v221-hud-cash').textContent);
    setText('v31-hud-date',$('v221-date-label').textContent);
    v31CameraLoad(viewCityId);v31CameraApply();
    const city=CidadeV31ReadModel.readCity(state,{cityId:viewCityId,selectedLot});
    const owner=city.lots.find(x=>x.lot===selectedLot)?.unit;
    setText('v31-lot-context',!inspectorOpen?'Selecione um lote para abrir as ações.':
      owner?('Lote '+selectedLot+' · '+owner.sectorName+' · sua empresa'):
      ('Lote '+selectedLot+' · sem empresa da sua rede'));
    $('v31-lot-quick').hidden=!inspectorOpen;
    document.querySelectorAll('#v31-dock [data-v31-open]').forEach(b=>b.setAttribute('aria-pressed',String(immersiveOpen===b.dataset.v31Open.split(':')[0])));
    for(const button of $('v31-lot-quick').querySelectorAll('[data-v31-open]'))button.disabled=!owner;
    $('v31-lot-manage').textContent=owner?'Gerenciar empresa':'Abrir empresa';
    setText('v31-hud-pause',timer?'Ⅱ Pausar':'▶ Jogar');
    $('v31-hud-speed').value=String(speed);
    v31RenderCommandPanel();
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
  function v31RenderCommandPanel(){
    if(!immersiveOpen)return;
    const root=immersiveOpen;
    const surface=document.querySelector('.view[data-view="'+root+'"]');
    if(!surface)return;
    const info=Core.overview(state), units=Core.businesses(state),current=business();
    const cash=Core.money(info.cash),revenue=Core.money(info.revenue),profit=Core.money(info.profit);
    const stock=String(info.stock),unitStock=String(current?.stockUnits??0);
    let title,sub,metrics;
    if(root==='empresa'){
      title='Empresas';sub='Sua rede e seus estabelecimentos';
      metrics=[['CAIXA ÚNICO',cash],['FATURAMENTO',revenue],['UNIDADES',units.length+'/5'],['RESULTADO',profit]];
    }else if(root==='mercado'){
      title='Mercado';sub='Compras, vendas e abastecimento';
      metrics=[['ESTOQUE DO GRUPO',stock],['ESTOQUE DA UNIDADE',unitStock],['FATURAMENTO',revenue],['CAIXA PARA COMPRAS',cash]];
    }else if(root==='administrativo'){
      const sections={
        financas:['Finanças','Tesouraria e compromissos'],
        logistica:['Logística','Abastecimento e transferências'],
        'rh-dp':['Pessoas e RH','Equipe, vínculos e folha'],
        contabilidade:['Relatórios','DRE, balanço e visão patrimonial'],
        fiscal:['Fiscal','Obrigações e cenários tributários simulados'],
        paralegal:['Paralegal','Registros e documentação']
      };
      [title,sub]=sections[activeSection.administrativo]||['Administração','Gestão dos departamentos'];
      metrics=[['CAIXA ÚNICO',cash],['FATURAMENTO',revenue],['RESULTADO',profit],['ESTOQUE TOTAL',stock]];
    }else{
      title='Configurações e Saves';sub='Proteja e recupere sua carreira local';
      metrics=[['VERSÃO',Core.VERSION],['SCHEMA',String(state.schemaVersion)],['REVISÃO',String(state.revision)],['UNIDADES',String(units.length)]];
    }
    setText('v31-modal-title-'+root,title);
    setText('v31-modal-subtitle-'+root,sub);
    for(let i=0;i<metrics.length;i++){
      const tile=surface.querySelector('[data-v31-kpi="'+root+'-'+i+'"]');
      tile.querySelector('small').textContent=metrics[i][0];
      tile.querySelector('strong').textContent=metrics[i][1];
      tile.classList.toggle('v31-low-stock',root==='mercado'&&i===1&&current?.stockUnits===0);
    }
    // Status gerados pela UI original são apenas realçados; conteúdo e valor não mudam.
    const status={pendente:'pending',apurado:'done','em trânsito':'transit',recebido:'done',
      pago:'done',quitado:'done',ativo:'done',concluído:'done',cancelado:'quiet',
      aguardando:'pending'};
    for(const cell of [...surface.querySelectorAll('.catalog-table tbody td')].slice(0,180)){
      if(cell.children.length)continue;
      const value=cell.textContent.trim(),kind=status[value.toLocaleLowerCase('pt-BR')];
      if(!kind)continue;
      const badge=document.createElement('span');
      badge.className='v31-status-badge v31-status-'+kind;
      badge.textContent=value;cell.replaceChildren(badge);
    }
  }
  function v31Bind(){
    $('v221-inspector').appendChild($('v31-lot-quick'));
    // Abas do departamento sempre aparecem imediatamente abaixo da faixa de KPIs.
    for(const root of ['empresa','mercado','administrativo']){
      const surface=document.querySelector('.view[data-view="'+root+'"]');
      const header=surface.querySelector('[data-v31-header]');
      const tabs=surface.querySelector(':scope > .v23-subnav');
      if(header&&tabs)header.after(tabs);
    }
    for(const button of document.querySelectorAll('[data-v31-open]')){
      button.addEventListener('click',()=>{
        const [root,section]=button.dataset.v31Open.split(':');
        const plot=CidadeV31ReadModel.readCity(state,{cityId:viewCityId,selectedLot}).lots.find(x=>x.lot===selectedLot);
        if(button.closest('#v31-lot-quick')&&plot?.unit&&business()?.id!==plot.unit.id){
          commit('EMPRESA.ATIVAR',{businessId:plot.unit.id}).then(ok=>{if(ok)v31OpenPanel(root,section,button);});
          return;
        }
        v31OpenPanel(root,section,button);
      });
    }
    $('v31-overlay-close').addEventListener('click',v31ClosePanel);
    $('v31-backdrop').addEventListener('click',v31ClosePanel);
    document.addEventListener('keydown',event=>{
      if(event.key==='Escape'&&immersiveOpen){event.preventDefault();v31ClosePanel();return;}
      if(event.key==='Tab'&&immersiveOpen){
        const dialog=document.querySelector('.view[data-view="'+immersiveOpen+'"]');
        const nodes=[...dialog.querySelectorAll('button:not([disabled]),[href],input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])')]
          .filter(n=>n.getClientRects().length>0);
        if(!nodes.length)return;
        const first=nodes[0],last=nodes[nodes.length-1];
        if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}
        else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}
      }
    });
    $('v31-lot-manage').addEventListener('click',()=>$('map-open-company').click());
    $('v31-next-day').addEventListener('click',()=>$('next-day').click());
    $('v31-hud-turns').addEventListener('click',()=>{
      const menu=$('v221-time-menu');menu.hidden=!menu.hidden;
      $('v31-hud-turns').setAttribute('aria-expanded',String(!menu.hidden));
    });
    $('v31-hud-pause').addEventListener('click',()=>{
      $('pause-btn').click();setText('v31-hud-pause',timer?'Ⅱ Pausar':'▶ Jogar');
    });
    $('v31-hud-speed').addEventListener('change',event=>{
      $('speed-select').value=event.target.value;
      $('speed-select').dispatchEvent(new Event('change'));
    });
    $('v31-hud-alerts').addEventListener('click',()=>{
      const details=$('v31-alert-panel');
      details.open=!details.open;
      $('v31-hud-alerts').setAttribute('aria-expanded',String(details.open));
    });
    $('v31-camera-plus').addEventListener('click',()=>v31CameraChange(.25));
    $('v31-camera-minus').addEventListener('click',()=>v31CameraChange(-.25));
    $('v31-camera-home').addEventListener('click',()=>{
      v31Camera={zoom:1,x:0,y:0};v31CameraCenterPending=true;
      v31CameraApply();v31CameraSave();
    });
    const canvas=$('map-canvas');
    canvas.setAttribute('tabindex','0');
    canvas.setAttribute('aria-label','Cidade: arraste para explorar, teclas de seta para deslocar, mais e menos para aproximar; Tab para lotes');
    canvas.addEventListener('keydown',event=>{
      if(event.target!==canvas)return;
      const distance=70;
      const direction={ArrowLeft:[-distance,0],ArrowRight:[distance,0],ArrowUp:[0,-distance],ArrowDown:[0,distance]}[event.key];
      if(direction){
        event.preventDefault();canvas.scrollLeft+=direction[0];canvas.scrollTop+=direction[1];
        v31Camera.x=canvas.scrollLeft;v31Camera.y=canvas.scrollTop;v31CameraSave();
      }else if(event.key==='+'){event.preventDefault();v31CameraChange(.25);}
      else if(event.key==='-'){event.preventDefault();v31CameraChange(-.25);}
    });
    canvas.addEventListener('scroll',()=>{
      if(!document.body.classList.contains('v31-immersive'))return;
      v31Camera.x=canvas.scrollLeft;v31Camera.y=canvas.scrollTop;v31CameraSave();
    },{passive:true});
    let drag=null,suppressClick=false;
    canvas.addEventListener('click',event=>{
      if(!suppressClick)return;
      event.preventDefault();event.stopImmediatePropagation();suppressClick=false;
    },true);
    canvas.addEventListener('pointerdown',event=>{
      if(event.pointerType==='touch'||event.button!==0||!document.body.classList.contains('v31-immersive'))return;
      drag={id:event.pointerId,x:event.clientX,y:event.clientY,left:canvas.scrollLeft,top:canvas.scrollTop,moved:false};
    });
    canvas.addEventListener('pointermove',event=>{
      if(!drag||drag.id!==event.pointerId)return;
      const dx=event.clientX-drag.x,dy=event.clientY-drag.y;
      if(Math.abs(dx)+Math.abs(dy)>7)drag.moved=true;
      if(drag.moved){event.preventDefault();canvas.scrollLeft=drag.left-dx;canvas.scrollTop=drag.top-dy;}
    });
    function endDrag(event){
      if(!drag||event.pointerId!==drag.id)return;
      suppressClick=drag.moved;drag=null;
      if(suppressClick)setTimeout(()=>{suppressClick=false;},80);
      v31Camera.x=canvas.scrollLeft;v31Camera.y=canvas.scrollTop;v31CameraSave();
    }
    canvas.addEventListener('pointerup',endDrag);
    canvas.addEventListener('pointercancel',endDrag);
  }
