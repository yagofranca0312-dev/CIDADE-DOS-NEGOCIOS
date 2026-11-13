  // V3.1: navegacao e camera sao apenas UI; o motor permanece a unica autoridade.
  let immersiveOpen=null,v31CameraCity=null,v31Camera={zoom:1,x:0,y:0};
  let v31ReturnFocus=null,v31LastRevision=null,v31CameraCenterPending=false;
  const v31LastPaneKey=Object.create(null);
  const v31CameraStore='cidade-v31-camera-ui-v1';
  function v31CameraLoad(cityId){
    if(v31CameraCity===cityId)return;
    // Sempre inicia em 100% na praça central; zoom de outra sessão não é restaurado.
    v31CameraCity=cityId;
    v31Camera={zoom:1,x:0,y:0};
    v31CameraCenterPending=true;
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
    $('v221-city-pick').hidden=true;
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
  // Patch V3.3.2-A: leitura exclusivamente derivada. Nao altera estado nem save.
  function v332HudSnapshot(current){
    if(!current?.player?.cityId)return null;
    const units=Core.businesses(current);
    const info=Core.overview(current);
    const today=current.calendar.date;
    const day=units.length?Core.financialReport(current,'day',today):null;
    const active=Core.activeBusiness(current);
    const items=active?Core.inventoryReport(current):null;
    const critical=items?items.filter(item=>item.alert).length:null;
    // Somente compromissos com data, e com tipo discriminado; jamais supor
    // que todo PAYABLE operacional vence em tres dias.
    const calendar=Core.financialCommitmentsReport(current,30);
    const limit=new Date(Date.parse(today+'T12:00:00Z')+3*86400000).toISOString().slice(0,10);
    const dated=calendar.events.filter(item=>
      (item.kind==='LOAN_SCHEDULE'||item.kind==='SUPPLIER_COMMITMENT')&&
      /^\d{4}-\d{2}-\d{2}$/.test(item.date));
    const upcoming=dated.filter(item=>item.date>=today&&item.date<=limit);
    const immediatelyDue=calendar.events.filter(item=>item.kind==='LOAN_DUE'&&item.amountCents>0);
    const undated=Core.operatingPayablesReport(current).total>0;
    const dueValue=!units.length?'—':immediatelyDue.length?
      immediatelyDue.length+' vencida(s)':dated.length?upcoming.length+' em 3 dias':'—';
    const dueNote=!units.length?'Abra uma empresa':immediatelyDue.length?
      'Parcelas exigíveis':dated.length?'Crédito/contratos com prazo':
      undated?'Passivos sem prazo definido':'Nenhum prazo confirmado';
    const taxAssessments=(current.fiscal?.assessments||[]).filter(row=>
      (row.status==='OPEN'||row.status==='OVERDUE')&&row.amount>row.paid);
    const tasks=units.length?Core.fiscalOperationsReport(current):null;
    const openTasks=tasks?.openPeriods||0;
    const taxValue=!units.length?'—':taxAssessments.length?
      taxAssessments.length+' guia(s)':openTasks?
      openTasks+' checklist(s)':'0 pendências';
    const taxNote=!units.length?'Sem empresa':taxAssessments.length?
      'Guias simuladas em aberto':openTasks?'Checklists operacionais':'Simulação educativa';
    return {
      cash:Core.money(info.cash),date:today.split('-').reverse().join('/'),
      sales:day?Core.money(day.revenue):'—',
      result:units.length?Core.money(info.profit):'—',
      stock:critical===null?'—':critical+' item(ns)',
      due:dueValue,dueNote,tax:taxValue,taxNote,
      salesTitle:day?'Vendas efetivas em '+today.split('-').reverse().join('/'):'Sem unidade: vendas indisponíveis',
      resultTitle:'Resultado acumulado da carreira depois das despesas e tributos simulados',
      stockTitle:active?
        'Unidade '+active.id+': '+critical+' produto(s) abaixo do ponto de reposição, considerando trânsito':
        'Sem unidade ativa; não há estoque para avaliar'
    };
  }
  function v332RenderHud(){
    const metrics=v332HudSnapshot(state);if(!metrics)return;
    for(const [id,value] of [
      ['v31-hud-cash',metrics.cash],['v31-hud-date',metrics.date],
      ['v332-hud-sales',metrics.sales],['v332-hud-result',metrics.result],
      ['v332-hud-stock',metrics.stock],['v332-hud-due',metrics.due],
      ['v332-hud-due-note',metrics.dueNote],['v332-hud-tax',metrics.tax],
      ['v332-hud-tax-note',metrics.taxNote]])setText(id,value);
    $('v332-hud-sales').closest('.v332-kpi').title=metrics.salesTitle;
    $('v332-hud-result').closest('.v332-kpi').title=metrics.resultTitle;
    $('v332-hud-stock').closest('.v332-kpi').title=metrics.stockTitle;
    // Contador de recomendações nao existe antes do Patch C.
    setText('v332-hud-advisory','—');
  }

  // V3.3.3-B: Agenda Executiva e Central consomem a identidade V333-A.
  // A dispensa visual de aviso não cancela compromisso datado.
  // D: filtros e abas pertencem exclusivamente à apresentação (jamais ao save).
  let v333HubWorld=null,v333HubBusiness='all',v333HubSeverity='all',v333HubDue='all';
  let v333HubOptionsKey=null;
  function v333HubProject(){
    const snapshot=v333DecisionTracker.inspect(state);
    return CidadeV333OperationsView.project(state,snapshot,{
      businessId:v333HubBusiness,severity:v333HubSeverity,due:v333HubDue
    });
  }
  function v333SyncHubTabs(){
    const selected=v332AdviceExpanded?'equipe':
      !$('v332-agenda-list').hidden?'agenda':'acoes';
    for(const button of document.querySelectorAll('[data-v333-hub-tab]')){
      button.setAttribute('aria-pressed',String(button.dataset.v333HubTab===selected));
    }
  }
  function v333RenderHub(){
    if(!state?.player?.cityId)return;
    const world=String(state.worldId);
    if(v333HubWorld!==world){
      v333HubWorld=world;v333HubBusiness='all';v333HubSeverity='all';v333HubDue='all';
      v333HubOptionsKey=null;
    }
    const units=Core.businesses(state);
    if(v333HubBusiness!=='all'&&!units.some(x=>x.id===v333HubBusiness))v333HubBusiness='all';
    const chooser=$('v333-hub-unit');
    const optionKey=units.map(u=>u.id+'|'+u.cityId).join(';');
    if(optionKey!==v333HubOptionsKey){
      v333HubOptionsKey=optionKey;chooser.replaceChildren();
      const all=document.createElement('option');all.value='all';all.textContent='Todas';
      chooser.appendChild(all);
      for(const unit of units){
        const option=document.createElement('option');option.value=unit.id;
        option.textContent=unit.id+' · '+(unit.cityId||'cidade');
        chooser.appendChild(option);
      }
    }
    chooser.value=v333HubBusiness;
    $('v333-hub-severity').value=v333HubSeverity;
    $('v333-hub-due').value=v333HubDue;
    const summary=v333HubProject().summary;
    setText('v333-hub-summary',
      BRDate(summary.date)+' · '+summary.units+' empresa(s) · '+
      summary.activeTotal+' aviso(s), '+summary.urgentTotal+' urgente(s) · '+
      summary.overdueTotal+' compromisso(s) vencido(s)');
    $('v333-command-hub').dataset.filtered=String(
      v333HubBusiness!=='all'||v333HubSeverity!=='all'||v333HubDue!=='all');
    v333SyncHubTabs();
  }
  function v333OpenHub(tab){
    if(tab==='equipe'){
      if(!$('v332-agenda-list').hidden){
        $('v332-agenda-list').hidden=true;
        $('v332-agenda-toggle').setAttribute('aria-expanded','false');
      }
      if(!v332AdviceExpanded)v332AdvisorExpand();
      else $('v332-advisor-close').focus({preventScroll:true});
    }else if(tab==='agenda'){
      if(v332AdviceExpanded){v332AdviceExpanded=false;v332RenderAdvisor();}
      if($('v332-agenda-list').hidden)$('v332-agenda-toggle').click();
      $('v332-agenda-toggle').focus({preventScroll:true});
    }else if(tab==='acoes'){
      if(v332AdviceExpanded){v332AdviceExpanded=false;v332RenderAdvisor();}
      if(!$('v332-agenda-list').hidden){
        $('v332-agenda-list').hidden=true;
        $('v332-agenda-toggle').setAttribute('aria-expanded','false');
      }
      $('v333-quick-actions').querySelector('button')?.focus({preventScroll:true});
    }
    v333SyncHubTabs();
  }
  function v332AgendaItems(current){
    if(!current?.player?.cityId)return [];
    const occurrences=v333DecisionTracker.inspect(current).all;
    return CidadeV333DecisionEngine.agenda(current,{limit:3,occurrences});
  }

  function v332RenderAgenda(){
    const list=$('v332-agenda-list');if(!list)return;
    const items=v333HubProject().agenda;
    list.replaceChildren();
    if(!items.length){
      const li=document.createElement('li');
      li.textContent='Nenhum compromisso datado corresponde aos filtros.';
      list.appendChild(li);
    }else for(const item of items){
      const li=document.createElement('li');
      const button=document.createElement('button');button.type='button';
      button.dataset.v332Route=item.route;button.dataset.v332Focus=item.focus;
      if(item.scope?.businessId)button.dataset.v332BusinessId=item.scope.businessId;
      if(item.occurrenceId)button.dataset.v333OccurrenceId=item.occurrenceId;
      button.textContent=(item.status==='vencido'?'Vencido · ':
        item.status==='hoje'?'Hoje · ':'Previsto · ')+
        item.date.split('-').reverse().join('/')+' · '+item.label;
      button.title='Abrir '+item.route.replace(':',' / ');
      li.appendChild(button);list.appendChild(li);
    }
    const count=items.length;
    $('v332-agenda-toggle').textContent='Agenda'+(count?' ('+count+')':'')+' ▾';
  }
  function v332MoreClose(){
    $('v332-more-menu').hidden=true;
    $('v332-more-toggle').setAttribute('aria-expanded','false');
  }
  // V3.3.3-C: navegação contextual com identidade comprovada e fail-closed.
  // A única escrita possível é EMPRESA.ATIVAR, sem efeitos econômicos,
  // por meio do commit durável já existente. Nenhuma compra/baixa/preço é enviada.
  async function v332ShortcutOpen(button){
    if(!state)return;
    const fromTeam=!!button.closest('#v332-advisor-panel');
    const source=fromTeam?$('v332-advisor-toggle'):button;
    const plan=CidadeV333DecisionEngine.planQuickAction(state,{
      route:button.dataset.v332Route,focus:button.dataset.v332Focus,
      requiresUnit:button.dataset.v332Requires==='unit',
      occurrenceId:button.dataset.v333OccurrenceId
    });
    if(plan.status==='STALE_OCCURRENCE'){
      notify('Este aviso não está mais ativo. Atualize a Central antes de navegar.');
      v332RenderAdvisor();v332RenderAgenda();return;
    }
    if(plan.status==='NEEDS_UNIT'){
      setText('v332-action-hint','Abra ou selecione uma empresa antes de usar este atalho.');
      notify('É necessário abrir ou selecionar uma empresa. Escolha um lote para começar.');
      v31OpenPanel('empresa','dashboard',source);return;
    }
    if(plan.status!=='READY'){
      notify('O destino deste item não está mais disponível. Nenhuma operação realizada.',true);
      return;
    }
    // Um aviso de outra empresa ativa a unidade somente após gravação+readback.
    // Se o armazenamento falhar, a rota NÃO é aberta na empresa errada.
    if(plan.switchBusinessId){
      const changed=await commit('EMPRESA.ATIVAR',{businessId:plan.switchBusinessId});
      if(!changed){
        setText('v332-action-hint','Troca de unidade não confirmada. Nenhuma ação executada.');
        return;
      }
      if(Core.activeBusiness(state)?.id!==plan.switchBusinessId){
        notify('Não foi possível confirmar a unidade alvo. Operação interrompida.',true);
        return;
      }
    }
    v332MoreClose();
    if(fromTeam){v332AdviceExpanded=false;v332RenderAdvisor();}
    const [root,section]=plan.route.split(':');
    v31OpenPanel(root,section||null,source);

    // Seleção apenas de formulário. Não preparar pedido, definir preço ou quitar.
    if(plan.productId){
      const product=Core.activeBusiness(state)?.products?.find(p=>p.id===plan.productId);
      const chooser=$('buy-product');
      if(product&&chooser&&[...chooser.options].some(x=>x.value===product.id)){
        chooser.value=product.id;
        chooser.dispatchEvent(new Event('change',{bubbles:true}));
      }
    }
    if(plan.businessId&&plan.route==='administrativo:financas'){
      const chooser=$('payable-operating-unit');
      if(chooser&&[...chooser.options].some(x=>x.value===plan.businessId)){
        chooser.value=plan.businessId;
        chooser.dispatchEvent(new Event('change',{bubbles:true}));
      }
    }
    const focusId=plan.productId&&plan.route==='mercado:compras'?
      'buy-product':plan.focus;
    if(focusId){
      const target=$(focusId);
      const pane=document.querySelector('[data-section-pane="'+root+':'+section+'"]');
      if(target&&target.getClientRects().length&&(!pane||pane.contains(target)||target===pane)){
        const focusable=target.matches('input,select,button,textarea')?target:
          target.querySelector('input:not([disabled]),select:not([disabled]),button:not([disabled]),textarea:not([disabled])');
        const selected=focusable||target;
        if(!focusable)selected.setAttribute('tabindex','-1');
        selected.scrollIntoView({block:'start',behavior:'instant'});
        selected.focus({preventScroll:true});
      }
    }
    const unit=plan.businessId?' · unidade '+plan.businessId:'';
    const product=plan.productId?' · produto '+plan.productId:'';
    setText('v332-action-hint','Destino para revisão'+unit+product+
      '. Nenhuma compra, pagamento ou alteração foi executada.');
    if(plan.switchBusinessId||plan.productId)
      notify('Contexto selecionado'+unit+product+'. Revise e confirme qualquer operação manualmente.');
  }


  // V3.3.3-A — todas as unidades no mesmo motor; identidade e histórico estáveis.
  // Estado visual efêmero; não escreve no save e não executa operações de negócio.
  const v333DecisionTracker=CidadeV333DecisionEngine.createTracker();
  let v332AdviceWorld=null,v332AdviceCache=[],v332AdviceHistory=[];
  let v332AdviceExpanded=false,v332AdviceTab='ativas',v332AdviceDetails=new Set();
  let v332AdvisorReturnFocus=null;

  function v332AdviceUpdate(){
    const world=String(state?.worldId||'sem-carreira');
    if(v332AdviceWorld!==world){
      v332AdviceWorld=world;v332AdviceExpanded=false;v332AdviceTab='ativas';
      v332AdviceDetails=new Set();v332AdvisorReturnFocus=null;
    }
    const snapshot=v333DecisionTracker.inspect(state);
    v332AdviceCache=snapshot.all;v332AdviceHistory=snapshot.history;
    for(const id of v332AdviceDetails){
      if(!snapshot.all.some(item=>item.id===id))v332AdviceDetails.delete(id);
    }
    return snapshot.active;
  }

  function v332AdviceEntry(item,history=false){
    const li=document.createElement('li');
    li.className='v332-advisor-item v332-severity-'+item.severity;
    const title=document.createElement('div');title.className='v332-advisor-item-head';
    const role=document.createElement('strong');role.textContent=item.role;
    const level=document.createElement('span');level.textContent=history?
      (item.status==='dispensada'?'Dispensada':
       item.status==='agravada'?'Agravada':
       item.status==='melhorada'?'Melhorada':'Resolvida'):
      (item.severity==='urgente'?'Urgente':item.severity==='atenção'?'Atenção':'Informativa');
    title.append(role,level);li.appendChild(title);
    const heading=document.createElement('p');heading.className='v332-advisor-item-title';
    heading.textContent=item.title;li.appendChild(heading);
    const message=document.createElement('p');message.className='v332-advisor-item-message';
    message.textContent=item.message;li.appendChild(message);
    const controls=document.createElement('div');controls.className='v332-advisor-item-actions';
    if(!history){
      const open=document.createElement('button');open.type='button';
      open.dataset.v332Route=item.route;open.dataset.v332Focus=item.focus;
      if(item.requiresUnit)open.dataset.v332Requires='unit';
      if(item.scope?.businessId)open.dataset.v332BusinessId=item.scope.businessId;
      open.dataset.v333OccurrenceId=item.id;
      open.textContent='Ir à ação';open.title='Abrir a tela correspondente, sem executar a operação';
      controls.appendChild(open);
      const details=document.createElement('button');details.type='button';
      details.dataset.v332AdvisorDetail=item.id;details.textContent='Detalhes';
      details.setAttribute('aria-expanded',String(v332AdviceDetails.has(item.id)));
      const detailId='v332-advisor-evidence-'+item.id.replace(/[^a-zA-Z0-9_-]/g,'_');
      details.setAttribute('aria-controls',detailId);
      controls.appendChild(details);
      const dismiss=document.createElement('button');dismiss.type='button';
      dismiss.dataset.v332AdvisorDismiss=item.id;dismiss.textContent='Dispensar';
      dismiss.title='Ocultar apenas este aviso; não quita obrigações';
      controls.appendChild(dismiss);
      const proof=document.createElement('p');proof.className='v332-advisor-proof';
      proof.id=detailId;proof.textContent='Regra '+item.rule+' · data do jogo '+item.dateReference+
        ' · evidência '+JSON.stringify(item.evidence);
      proof.hidden=!v332AdviceDetails.has(item.id);li.appendChild(proof);
    }else{
      const note=document.createElement('small');
      note.textContent=(item.status==='dispensada'?'Dispensado visualmente em ':
        item.status==='agravada'?'Agravado em ':
        item.status==='melhorada'?'Melhorado em ':'Resolvido em ')+
        (item.resolutionDate||item.dateReference);
      controls.appendChild(note);
    }
    li.appendChild(controls);return li;
  }

  function v332RenderAdvisor(){
    if(!state?.player?.cityId)return;
    const allVisible=v332AdviceUpdate(),visible=v333HubProject().team,count=allVisible.length;
    setText('v332-hud-advisory',String(count));
    setText('v332-hud-advice-note',count?'Recomendações pendentes':'Nenhuma prioridade atual');
    $('v332-hud-advice-trigger').classList.toggle('v332-kpi-has-alerts',count>0);
    $('v332-hud-advice-trigger').setAttribute('aria-label',
      count+' recomendação(ões) atuais na Central de Gestão; abrir equipe');
    $('v332-hud-advice-trigger').setAttribute('aria-expanded',String(v332AdviceExpanded));
    const preview=visible.length?visible[0].role+': '+visible[0].title:
      count?'Nenhum aviso corresponde aos filtros.':
      'Nenhuma ação prioritária identificada neste momento.';
    // Evitar anúncios repetidos por leitores de tela em cada render do jogo.
    const previewNode=$('v332-advisor-preview-text');
    if(previewNode.textContent!==preview)previewNode.textContent=preview;
    $('v332-advisor-panel').dataset.severity=visible.length?visible[0].severity:'normal';
    const drawer=$('v332-advisor-drawer');drawer.hidden=!v332AdviceExpanded;
    $('v332-advisor-toggle').setAttribute('aria-expanded',String(v332AdviceExpanded));
    $('v332-advisor-toggle').textContent=v332AdviceExpanded?'Recolher ▾':'Ver equipe ▴';
    // Quando fechada, a lista de cards não precisa ser recriada a cada turno.
    if(!v332AdviceExpanded)return;
    const isHistory=v332AdviceTab==='historico';
    $('v332-advisor-active-tab').setAttribute('aria-pressed',String(!isHistory));
    $('v332-advisor-history-tab').setAttribute('aria-pressed',String(isHistory));
    $('v332-advisor-active-list').hidden=isHistory;
    $('v332-advisor-history-list').hidden=!isHistory;
    const activeList=$('v332-advisor-active-list');activeList.replaceChildren();
    if(visible.length)for(const item of visible.slice(0,50))activeList.append(v332AdviceEntry(item));
    else{
      const li=document.createElement('li');li.className='v332-advisor-empty';
      li.textContent=count?'Nenhuma recomendação para os filtros selecionados.':
        'Nenhuma ação prioritária identificada neste momento.';activeList.append(li);
    }
    const historyList=$('v332-advisor-history-list');historyList.replaceChildren();
    const filteredHistory=v333HubProject().history;
    if(filteredHistory.length)for(const item of filteredHistory)historyList.append(v332AdviceEntry(item,true));
    else{
      const li=document.createElement('li');li.className='v332-advisor-empty';
      li.textContent='Nenhum aviso resolvido ou dispensado nesta sessão.';historyList.append(li);
    }
  }

  function v332AdvisorCollapse(){
    v332AdviceExpanded=false;v332RenderAdvisor();v333SyncHubTabs();
    const target=v332AdvisorReturnFocus?.isConnected?v332AdvisorReturnFocus:
      $('v332-advisor-toggle');
    v332AdvisorReturnFocus=null;target.focus({preventScroll:true});
  }
  function v332AdvisorExpand(){
    if(!v332AdviceExpanded)v332AdvisorReturnFocus=document.activeElement;
    v332AdviceExpanded=!v332AdviceExpanded;
    if(v332AdviceExpanded)v332MoreClose();
    v332RenderAdvisor();v333SyncHubTabs();
    if(v332AdviceExpanded)$('v332-advisor-close').focus({preventScroll:true});
    else v332AdvisorCollapse();
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
    v332RenderHud();
    v333RenderHub();
    v332RenderAgenda();
    v332RenderAdvisor();
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
    setText('v31-hud-pause',timer?'❚❚':'▶');
    $('v31-hud-pause').setAttribute('aria-label',timer?'Pausar simulação':'Iniciar simulação');
    $('v31-hud-pause').title=timer?'Pausar simulação':'Iniciar simulação';
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
      setText('v31-alert-count',String(recent.events.length));
      $('v31-hud-alerts').setAttribute('aria-label',recent.events.length+' eventos recentes');
      $('v31-hud-alerts').title=recent.events.length+' eventos recentes';
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
      profit:['RESULTADO ACUMULADO',profit],taxPayable:['TRIBUTOS A PAGAR',Core.money(info.taxPayable)],stock:['ESTOQUE DA REDE',stock],
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
        fiscal:['taxPayable','cash','revenue','profit'],
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
    // Recursos municipais deixam de ocupar o mapa; ficam dentro dos departamentos.
    const reports=$('v23-pane-empresa-analises');
    reports.appendChild($('v221-observatory'));
    const saves=$('v23-pane-sistema-saves');
    const cityAction=document.createElement('button');
    cityAction.type='button';cityAction.id='v31-city-manager';
    cityAction.className='btn btn-outline v31-city-manager';
    cityAction.textContent='🌐 Explorar municípios';
    cityAction.setAttribute('aria-controls','v221-city-pick');
    cityAction.addEventListener('click',()=>{
      const pick=$('v221-city-pick');pick.hidden=!pick.hidden;
      if(!pick.hidden)$('v221-city-selector').focus();
    });
    saves.prepend($('v221-city-pick'));
    saves.prepend(cityAction);

    // D: abas integradas e filtros read-only, antes dos listeners legados.
    for(const button of document.querySelectorAll('[data-v333-hub-tab]')){
      button.addEventListener('click',()=>v333OpenHub(button.dataset.v333HubTab));
    }
    $('v333-command-hub').addEventListener('keydown',event=>{
      const current=event.target.closest('[data-v333-hub-tab]');
      if(!current||!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;
      const tabs=[...$('v333-command-hub').querySelectorAll('[data-v333-hub-tab]')];
      const pos=tabs.indexOf(current);
      const next=event.key==='Home'?0:event.key==='End'?tabs.length-1:
        (pos+(event.key==='ArrowRight'?1:-1)+tabs.length)%tabs.length;
      event.preventDefault();tabs[next].focus({preventScroll:true});
    });
    for(const [id,field] of [
      ['v333-hub-unit','v333HubBusiness'],
      ['v333-hub-severity','v333HubSeverity'],
      ['v333-hub-due','v333HubDue']
    ]){
      $(id).addEventListener('change',()=>{
        if(field==='v333HubBusiness')v333HubBusiness=$(id).value;
        if(field==='v333HubSeverity')v333HubSeverity=$(id).value;
        if(field==='v333HubDue')v333HubDue=$(id).value;
        v333RenderHub();v332RenderAgenda();v332RenderAdvisor();
      });
    }
    // Central de Gestao: so muda estado visual; nunca executa comandos economicos.
    $('v332-advisor-toggle').addEventListener('click',v332AdvisorExpand);
    $('v332-hud-advice-trigger').addEventListener('click',v332AdvisorExpand);
    $('v332-advisor-close').addEventListener('click',v332AdvisorCollapse);
    $('v332-advisor-panel').addEventListener('click',event=>{
      const tab=event.target.closest('[data-v332-advisor-tab]');
      if(tab){v332AdviceTab=tab.dataset.v332AdvisorTab==='historico'?'historico':'ativas';
        v332RenderAdvisor();return;}
      const detail=event.target.closest('[data-v332-advisor-detail]');
      if(detail){
        const id=detail.dataset.v332AdvisorDetail;
        if(v332AdviceDetails.has(id))v332AdviceDetails.delete(id);else v332AdviceDetails.add(id);
        v332RenderAdvisor();
        // O render recria o card; devolver o foco ao mesmo botao de detalhes.
        const next=[...$('v332-advisor-active-list').querySelectorAll('[data-v332-advisor-detail]')]
          .find(node=>node.dataset.v332AdvisorDetail===id);
        next?.focus({preventScroll:true});
        return;
      }
      const dismiss=event.target.closest('[data-v332-advisor-dismiss]');
      if(dismiss){
        const item=v332AdviceCache.find(x=>x.id===dismiss.dataset.v332AdvisorDismiss);
        if(!item)return;
        if(!v333DecisionTracker.dismiss(item.id,state))return;
        v332RenderAdvisor();
        // O aviso foi dispensado; manter o teclado dentro da lista, sem foco perdido.
        const next=$('v332-advisor-active-list').querySelector('[data-v332-route]');
        (next||$('v332-advisor-active-tab')).focus({preventScroll:true});
        return;
      }
    });
    document.addEventListener('keydown',event=>{
      if(event.key==='Escape'&&v332AdviceExpanded&&!immersiveOpen){
        event.preventDefault();v332AdvisorCollapse();
      }
    });
    // Ações Rápidas apenas navegam; aviso de outra unidade pode ativá-la
    // exclusivamente pelo comando de seleção e salvamento confirmado.
    $('v332-bottom-zone').addEventListener('click',event=>{
      const route=event.target.closest('[data-v332-route]');
      if(route){event.preventDefault();v332ShortcutOpen(route);}
    });
    $('v332-more-toggle').addEventListener('click',()=>{
      if(v332AdviceExpanded){v332AdviceExpanded=false;v332RenderAdvisor();}
      const menu=$('v332-more-menu');
      menu.hidden=!menu.hidden;
      $('v332-more-toggle').setAttribute('aria-expanded',String(!menu.hidden));
      if(!menu.hidden)menu.querySelector('button')?.focus();
    });
    $('v332-agenda-toggle').addEventListener('click',()=>{
      if(v332AdviceExpanded){v332AdviceExpanded=false;v332RenderAdvisor();}
      const list=$('v332-agenda-list');list.hidden=!list.hidden;
      $('v332-agenda-toggle').setAttribute('aria-expanded',String(!list.hidden));
      v333SyncHubTabs();
    });
    document.addEventListener('keydown',event=>{
      if(event.key==='Escape'&&!$('v332-more-menu').hidden){
        event.preventDefault();v332MoreClose();$('v332-more-toggle').focus();
      }
    });
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
      $('pause-btn').click();
      setText('v31-hud-pause',timer?'❚❚':'▶');
      $('v31-hud-pause').setAttribute('aria-label',timer?'Pausar simulação':'Iniciar simulação');
      $('v31-hud-pause').title=timer?'Pausar simulação':'Iniciar simulação';
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
