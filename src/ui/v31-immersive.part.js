  // V3.1: navegacao e camera sao apenas UI; o motor permanece a unica autoridade.
  let immersiveOpen=null,v31CameraCity=null,v31Camera={zoom:1,x:0,y:0};
  let v31ReturnFocus=null,v31LastRevision=null,v31CameraCenterPending=false;
  const v31LastPaneKey=Object.create(null);
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
    const info=Core.overview(state),units=Core.businesses(state),current=business();
    const cash=Core.money(info.cash),revenue=Core.money(info.revenue),profit=Core.money(info.profit);
    const stock=String(info.stock),unitStock=String(current?.stockUnits??0),count=String(units.length);
    const empty=String(units.filter(unit=>unit.stockUnits===0).length);
    // Todos os valores provêm do Core. Não inferimos aliquota, lucro projetado ou ponto de equilíbrio.
    const keys={
      cash:['CAIXA ÚNICO',cash],revenue:['RECEITA ACUMULADA',revenue],
      profit:['RESULTADO ACUMULADO',profit],stock:['ESTOQUE DA REDE',stock],
      unitStock:['ESTOQUE DA UNIDADE',unitStock],count:['UNIDADES ATIVAS',count],
      empty:['UNIDADES SEM ESTOQUE',empty],days:['DIAS SIMULADOS',String(state.calendar.tick)],
      revision:['REVISÃO DO SAVE',String(state.revision)],
      version:['VERSÃO DO JOGO',Core.VERSION],schema:['SCHEMA DO SAVE',String(state.schemaVersion)]
    };
    const choices={
      empresa:{
        dashboard:['cash','revenue','profit','count'],
        'minhas-empresas':['count','cash','stock','empty'],
        analises:['revenue','profit','stock','cash'],
        comparativos:['count','revenue','profit','stock']
      },
      mercado:{
        compras:['cash','unitStock','stock','empty'],
        estoque:['stock','unitStock','empty','count'],
        vendas:['revenue','profit','cash','stock'],
        outros:['stock','revenue','cash','count']
      },
      administrativo:{
        financas:['cash','revenue','profit','count'],
        logistica:['stock','unitStock','empty','count'],
        'rh-dp':['count','cash','revenue','days'],
        contabilidade:['revenue','profit','cash','stock'],
        fiscal:['revenue','cash','profit','days'],
        paralegal:['count','revision','days','schema']
      },
      sistema:{saves:['version','schema','revision','count'],diagnostico:['count','cash','days','revision'],integridade:['schema','revision','days','version']}
    };
    const active=activeSection[root];
    const selected=choices[root]?.[active]||['cash','revenue','profit','stock'];
    const metrics=selected.map(key=>keys[key]);
    const sectionNames={
      empresa:{dashboard:['Empresas','Visão geral da rede'],'minhas-empresas':['Unidades','Estabelecimentos da carreira'],
        analises:['Análises','Indicadores confirmados'],comparativos:['Comparar','Evolução da rede']},
      mercado:{compras:['Compras','Pedidos e fornecedores'],estoque:['Estoque','Produtos da rede'],
        vendas:['Vendas','Comercial e faturamento'],outros:['Estratégia','Mercado e concorrência']},
      administrativo:{financas:['Finanças','Tesouraria e compromissos'],logistica:['Logística','Abastecimento e transferências'],
        'rh-dp':['Equipe e RH','Pessoas e folha'],contabilidade:['Relatórios','DRE, balanço e patrimônio'],
        fiscal:['Fiscal','Obrigações tributárias simuladas'],paralegal:['Documentos','Registros e contratos']},
      sistema:{saves:['Configurações e Saves','Backup e recuperação local'],diagnostico:['Diagnóstico','Integridade e análise da carreira'],integridade:['Saúde do save','Compatibilidade e portabilidade']}
    };
    const [title,sub]=sectionNames[root]?.[active]||[root,'Centro de comando'];
    setText('v31-modal-title-'+root,title);
    setText('v31-modal-subtitle-'+root,sub);
    for(let i=0;i<metrics.length;i++){
      const tile=surface.querySelector('[data-v31-kpi="'+root+'-'+i+'"]');
      tile.querySelector('small').textContent=metrics[i][0];
      tile.querySelector('strong').textContent=metrics[i][1];
      tile.classList.toggle('v31-low-stock',metrics[i][0].includes('ESTOQUE')&&
        (metrics[i][0]==='UNIDADES SEM ESTOQUE'?Number(empty)>0:
          Number(metrics[i][1])===0));
    }
    // Cada mudança de aba começa no topo do próprio painel; o cabeçalho não é scroller.
    if(root==='administrativo'){
      const shared=$('admin-shared-filters');
      const target=surface.querySelector('[data-section-pane="administrativo:'+activeSection.administrativo+'"]');
      if(shared&&target&&['financas','contabilidade'].includes(activeSection.administrativo)&&shared.parentElement!==target)
        target.prepend(shared);
    }
    const visiblePane=surface.querySelector(':scope > .v23-subpane:not([hidden])');
    const paneKey=visiblePane?.getAttribute('data-section-pane')||root;
    if(visiblePane&&v31LastPaneKey[root]!==paneKey){visiblePane.scrollTop=0;v31LastPaneKey[root]=paneKey;}
    const nav=surface.querySelector('.v31-command-tabs');
    if(nav){
      const activeTab=nav.querySelector('[aria-selected="true"]');
      activeTab?.scrollIntoView({block:'nearest',inline:'nearest'});
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
    // Trilho integrado ao título, com um ícone e rótulo curto por aba.
    const tabDesign={"empresa:dashboard":["◈","Visão geral"],"empresa:minhas-empresas":["🏬","Unidades"],"empresa:analises":["📈","Análises"],"empresa:comparativos":["⚖","Comparar"],"mercado:compras":["🛒","Compras"],"mercado:estoque":["📦","Estoque"],"mercado:vendas":["💳","Vendas"],"mercado:outros":["⚙","Estratégia"],"administrativo:financas":["💰","Caixa"],"administrativo:logistica":["🚚","Logística"],"administrativo:rh-dp":["👥","Equipe"],"administrativo:contabilidade":["📊","Relatórios"],"administrativo:fiscal":["🧾","Fiscal"],"administrativo:paralegal":["📜","Documentos"]};
    Object.assign(tabDesign,{'sistema:saves':['💾','Saves'],'sistema:diagnostico':['🔍','Diagnóstico'],
      'sistema:integridade':['🛡','Integridade']});
    for(const root of ['empresa','mercado','administrativo','sistema']){
      const surface=document.querySelector('.view[data-view="'+root+'"]');
      const header=surface.querySelector('[data-v31-header]');
      if(!surface||!header)continue;
      const tabs=surface.querySelector(':scope > .v23-subnav');
      const chrome=document.createElement('div');
      chrome.className='v31-command-chrome';
      surface.prepend(chrome);
      chrome.append(header);
      if(tabs){
        tabs.classList.add('v31-command-tabs');
        tabs.setAttribute('aria-label','Departamentos de '+root);
        for(const button of tabs.querySelectorAll('[data-section-tab]')){
          const original=button.textContent.trim();
          const design=tabDesign[button.dataset.sectionTab]||['◈',original];
          button.textContent='';
          const icon=document.createElement('span');
          icon.className='v31-tab-icon';
          icon.setAttribute('aria-hidden','true');
          icon.textContent=design[0];
          const name=document.createElement('span');
          name.className='v31-tab-label';
          name.textContent=design[1];
          button.append(icon,name);
          button.setAttribute('title',original);
          button.setAttribute('aria-label',original);
        }
        chrome.append(tabs);
      }
      const kpis=header.querySelector('.v31-command-kpis');
      if(kpis){kpis.classList.add('v31-command-metrics');chrome.after(kpis);}
    }
    // Repartição estática: apenas o painel ativo pode rolar, nunca a moldura modal.
    for(const root of ['empresa','mercado','administrativo','sistema']){
      const surface=document.querySelector('.view[data-view="'+root+'"]');
      const panes=[...surface.querySelectorAll(':scope > .v23-subpane')];
      const excluded=node=>node.classList.contains('v31-command-chrome')||
        node.classList.contains('v31-command-metrics')||
        node.classList.contains('v23-subpane')||node.id==='v31-overlay-close';
      const loose=[...surface.children].filter(node=>!excluded(node));
      if(root==='sistema'){
        const saves=surface.querySelector('[data-section-pane="sistema:saves"]');
        const diagnostics=surface.querySelector('[data-section-pane="sistema:diagnostico"]');
        const integrity=surface.querySelector('[data-section-pane="sistema:integridade"]');
        if(!saves||!diagnostics||!integrity)throw new Error('Abas da Central do Jogo ausentes');
        const grid=saves.querySelector(':scope > .dashboard-grid');
        const diagnosticCard=grid?.children[1];
        if(diagnosticCard)diagnostics.append(diagnosticCard);
        const quality=saves.querySelector('[aria-labelledby="qa-v290-title"]');
        if(quality)diagnostics.append(quality);
        const health=saves.querySelector('[aria-labelledby="qa-v290-backup-title"]');
        if(health)integrity.append(health);
        if(loose.length)saves.prepend(...loose);
      }else{
        const home=root==='mercado'?'mercado:outros':
          root==='administrativo'?'administrativo:financas':root+':dashboard';
        const pane=panes.find(el=>el.dataset.sectionPane===home)||panes[0];
        if(!pane)throw new Error('Painel de departamento ausente: '+root);
        // Rivais e ferramentas de apoio permanecem acessíveis na seção apropriada.
        pane.prepend(...loose);
      }
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
