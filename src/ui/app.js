/* Cidade dos Negócios 1 — interface. Sem regras econômicas e sem RNG. */
(() => {
  'use strict';
  const Core=CidadeCore;
  const $=id=>document.getElementById(id);
  const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const BRDate=iso=>iso.split('-').reverse().join('/');
  const KEY='cidade-dos-negocios-save-v1';
  let state=null,viewCityId=null,selectedLot=1,tab='cidade',timer=null,speed=1,sequence=0,autosaveStatus='Backup JSON recomendado';
  let inspectorOpen=false; // interface somente, nunca persistido
  let restockDraft=null; // proposta de compra efêmera (não entra em saves)
  const activeSection={empresa:'dashboard',mercado:'compras',administrativo:'financas'}; // somente UI, fora do save
  let mapZoomed=false; // visão ampliada opcional; não altera o save
  let financeQuery=null,strategyHorizon=30,financeScope='all',statementView='summary'; // preferências de interface, independentes do GameState
  const business=()=>state?Core.activeBusiness(state):null;
  function chooseProduct(id){const b=business();return b?.products?.find(p=>p.id===$(id)?.value)||b?.products?.[0]||null;}
  function refillSelect(id,products){
    const select=$(id),previous=select.value;
    select.replaceChildren(...products.map(p=>{const option=document.createElement('option');option.value=p.id;option.textContent=p.name;return option;}));
    if(products.some(p=>p.id===previous))select.value=previous;
  }
  /* CDN_COMPANY_VIEWS */
  /* CDN_RESTOCK_VIEWS */
  /* CDN_MARKET_VIEWS */
  const setText=(id,value)=>{const el=$(id);if(el)el.textContent=String(value)};
  function notify(message,isError=false){
    const n=$('toast');n.textContent=message;n.classList.toggle('error',isError);n.classList.add('visible');
    clearTimeout(toastTimer);toastTimer=setTimeout(()=>n.classList.remove('visible'),4500);
    setText('start-message',message);
  }
  function saveLocal(){
    if(!state)return;
    try{
      const contents=Core.exportSave(state);
      localStorage.setItem(KEY,contents);
      if(localStorage.getItem(KEY)!==contents)throw Error('Falha de leitura de retorno');
      autosaveStatus='Cópia local verificada neste navegador; mantenha backup JSON externo.';
    }catch(e){autosaveStatus=`Salvamento local indisponível (${e.message}); exporte o JSON.`;notify(autosaveStatus,true);}
    setText('autosave-label',autosaveStatus);
    setText('footer-state',autosaveStatus.startsWith('Cópia')?'Cópia local verificada · backup JSON recomendado':'Salvamento local sem garantia');
  }
  function lastAvailableDate(){
    if(!state)return Core.START_DATE;
    if(!state.calendar.tick)return state.calendar.date;
    const d=new Date(state.calendar.date+'T12:00:00Z');d.setUTCDate(d.getUTCDate()-1);
    return d.toISOString().slice(0,10);
  }
  function renderGroup(){
    const group=Core.groupReport(state),active=business();
    const select=$('unit-switch'),previous=active?.id||'';
    select.replaceChildren(...group.units.map(u=>{const option=document.createElement('option');option.value=u.id;option.textContent=`${u.id} · ${u.city} · ${Core.SECTORS[u.sector].name}`;return option;}));
    select.disabled=!group.count;select.value=previous;
    $('unit-switch-container').hidden=!group.count;
    const finance=$('finance-scope'),scope=financeScope;
    finance.replaceChildren(...[{id:'all',name:'Grupo consolidado'},...group.units.map(u=>({id:u.id,name:`${u.id} · ${u.city}`}))].map(x=>{
      const opt=document.createElement('option');opt.value=x.id;opt.textContent=x.name;return opt;
    }));
    if(![...finance.options].some(o=>o.value===scope))financeScope='all';finance.value=financeScope;
    setText('group-count',`${group.count}/5 estabelecimentos`);
    setText('v23a-dashboard-count',`${group.count}/5 estabelecimentos`);
    setText('group-available-cash',Core.money(group.group.cash));
    setText('group-operating-result',Core.money(group.group.profit));
    const rows=group.units.map(u=>`<tr><td><strong>${escape(u.id)}</strong> · ${escape(Core.SECTORS[u.sector].name)}<br><small>${escape(u.city)} · lote ${u.lot}</small></td><td>${escape(Core.money(u.revenue))}</td><td>${escape(Core.money(u.profit))}</td><td>${u.stock}</td><td><button type="button" class="btn btn-outline" data-unit-activate="${escape(u.id)}" ${u.id===active?.id?'disabled':''}>${u.id===active?.id?'Ativa':'Gerenciar'}</button></td></tr>`).join('');
    $('unit-rows').innerHTML=rows||'<tr><td colspan="5">Inaugure sua primeira unidade.</td></tr>';
    setText('group-scope-note','Receitas, CMV e despesas atribuídos a cada unidade; caixa pertence ao grupo. Nenhum capital é criado ao abrir filial.');
  }
  function renderPriceHistory(){
    const items=Core.priceHistory(state),container=$('price-history');
    setText('price-history-count',`${items.length} alteração(ões)`);
    container.innerHTML=items.length?items.slice(-12).reverse().map(item=>`<div class="price-history-row"><small>${escape(BRDate(item.date))} · ${escape(item.productName||'Produto base')} · ${escape(item.id)}</small><strong>${escape(Core.money(item.old))} → ${escape(Core.money(item.cents))}</strong></div>`).join(''):'<p class="muted">Nenhuma alteração registrada nesta carreira.</p>';
  }
  function initialFinanceQuery(){
    const date=lastAvailableDate(),year=Number(date.slice(0,4)),month=Number(date.slice(5,7));
    return {period:'all',asOf:date,day:date,month:date.slice(0,7),
      quarter:String(Math.floor((month-1)/3)+1),quarterYear:year,
      semester:String(Math.floor((month-1)/6)+1),semesterYear:year,
      year,from:Core.START_DATE,to:date};
  }
  function ensureFinanceQuery(){if(!financeQuery)financeQuery=initialFinanceQuery();return financeQuery;}
  function financeQueryDate(q){
    const year=n=>String(n).padStart(4,'0');
    if(q.period==='all')return {date:q.asOf};
    if(q.period==='day')return {date:q.day};
    if(q.period==='month')return {date:q.month+'-01'};
    if(q.period==='quarter')return {date:year(q.quarterYear)+'-'+String((Number(q.quarter)-1)*3+1).padStart(2,'0')+'-01'};
    if(q.period==='semester')return {date:year(q.semesterYear)+'-'+(q.semester==='1'?'01':'07')+'-01'};
    if(q.period==='year')return {date:year(q.year)+'-01-01'};
    return {date:q.to,range:{from:q.from,to:q.to}};
  }
  function renderStrategy(){
    if(!business()){$('strategy-metrics').innerHTML='<p class="muted">Abra uma empresa para consultar as projeções.</p>';$('strategy-cost-rows').innerHTML='';$('strategy-risks').innerHTML='';return;}
    const report=Core.strategyReport(state,strategyHorizon);
    $('strategy-horizon').value=String(strategyHorizon);
    const value=(v)=>v===null?'Não atingível':Core.money(v);
    const data=[
      ['Capital de giro (saldo atual)',Core.money(report.workingCapital)],
      ['Caixa atual cobre despesas fixas por',`${report.cashCoverageDays} dias (sem vendas)`],
      ['Despesa operacional fixa por dia',Core.money(report.dailyFixed)],
      ['Ponto de equilíbrio do mix',report.breakEvenUnits===null?'Sem margem positiva':`${report.breakEvenUnits} un./dia (estimado)`],
      ['Caixa no fim do cenário',Core.money(report.projectedCash)],
      ['Obrigações no fim do cenário',Core.money(report.projectedPayable)],
      ['Resultado operacional projetado',Core.money(report.projectedProfit)],
      ['Unidades potencialmente não atendidas',String(report.estimatedLostUnits)],
      ['Vendas projetadas',String(report.estimatedSoldUnits)+' unidades']
    ];
    $('strategy-metrics').innerHTML=data.map(([k,v])=>`<div class="strategy-metric"><small>${escape(k)}</small><strong>${escape(v)}</strong></div>`).join('');
    const rows=[
      ['Receita de vendas',report.recent.revenue,report.projectedRevenue],
      ['(-) CMV / custo variável das mercadorias',report.recent.cogs,report.projectedCogs],
      ['(-) Despesa operacional fixa',report.recent.fixed,report.projectedFixed],
      ['(-) Despesas de abertura / não recorrentes',report.recent.oneOff,null],
      ['Resultado operacional antes dos tributos',report.recent.operatingResult,report.projectedProfit]
    ];
    $('strategy-cost-rows').innerHTML=rows.map(([label,actual,projected])=>`<tr><td>${escape(label)}</td><td>${escape(Core.money(actual))}</td><td>${projected===null?'Não projetado':escape(Core.money(projected))}</td></tr>`).join('');
    const risks=[];
    if(report.breakEvenUnits===null)risks.push('⚠ O mix de produtos não tem margem de contribuição positiva nas condições atuais.');
    if(report.projectedPayable>Core.overview(state).payable)risks.push('⚠ O cenário prevê novas contas a pagar por caixa insuficiente para despesas fixas.');
    if(report.estimatedLostUnits>0)risks.push(`⚠ Projeção de ${report.estimatedLostUnits} unidades não atendidas: avalie reposição e prazos de entrega.`);
    if(report.recent.oneOff>0)risks.push('Abertura e outras despesas eventuais constam do realizado, mas não foram repetidas na projeção.');
    $('strategy-risks').innerHTML=risks.length?risks.map(x=>`<p>${escape(x)}</p>`).join(''):'<p>Sem alertas adicionais nos parâmetros desta projeção hipotética.</p>';
  }
  /* CDN_FINANCE_VIEWS */
  function resetTimer(){if(timer){clearInterval(timer);timer=null;}setText('pause-btn','▶ Jogar');}
  function commit(type,payload={}){
    if(type==='CARREIRA.CRIAR'){resetTimer();financeQuery=null;financeScope='all';statementView='summary';}
    const result=Core.dispatch(state,{type,id:nextId(),payload});
    if(!result.ok){notify(result.error,true);return false;}
    if(result.status==='APPLIED'){restockDraft=null;state=result.state;const chosen=business();if((type==='EMPRESA.ABRIR'||type==='EMPRESA.ATIVAR')&&chosen){viewCityId=chosen.cityId;selectedLot=chosen.lot;inspectorOpen=false;}else viewCityId=viewCityId??state.player.cityId;saveLocal();render();}
    notify(result.message);
    return true;
  }
  // Rotas anteriores de Finanças e Fiscal permanecem compatíveis.
  function goto(name,requestedSection=null){
    const aliases={financas:['administrativo','financas'],fiscal:['administrativo','fiscal']};
    const [root,section]=aliases[name]||[name,requestedSection];
    if(!['cidade','empresa','mercado','administrativo','sistema'].includes(root))return;
    if(section&&Object.prototype.hasOwnProperty.call(activeSection,root)&&document.querySelector('[data-section-pane="'+root+':'+section+'"]'))activeSection[root]=section;
    tab=root;
    document.body.classList.toggle('v221-city-mode',!!state?.player?.cityId&&root==='cidade');
    document.querySelectorAll('.view[data-view]').forEach(el=>{const chosen=el.dataset.view===root;el.hidden=!chosen;el.classList.toggle('active',chosen);});
    document.querySelectorAll('.nav-primary [data-tab]').forEach(el=>{const chosen=el.dataset.tab===root;el.classList.toggle('active',chosen);if(chosen)el.setAttribute('aria-current','page');else el.removeAttribute('aria-current');});
    document.querySelectorAll('[data-section-pane]').forEach(el=>{const [area,sub]=el.dataset.sectionPane.split(':');el.hidden=!(area===root&&activeSection[area]===sub);});
    document.querySelectorAll('[data-section-tab]').forEach(el=>{const [area,sub]=el.dataset.sectionTab.split(':');const chosen=activeSection[area]===sub;el.classList.toggle('active',chosen);el.setAttribute('aria-selected',String(chosen));el.tabIndex=chosen?0:-1;});
    const labels={cidade:['CENTRAL DE OPERAÇÕES','A sua cidade, as suas decisões.','Explore lotes comerciais e acompanhe os acontecimentos.'],empresa:['GESTÃO EMPRESARIAL','Sua rede em um só lugar.','Dashboard, estabelecimentos e análises da carreira.'],mercado:['CENTRAL OPERACIONAL','Compre, abasteça e venda.','Compras, estoque, vendas e ferramentas comerciais.'],administrativo:['GESTÃO ADMINISTRATIVA','Os departamentos da sua rede.','Finanças, RH/DP, Contabilidade, Fiscal e Paralegal.'],sistema:['PERSISTÊNCIA E QA','Seu progresso, sua segurança.','Faça backups e confira o estado da simulação.']};
    const info=labels[root];setText('page-kicker',info[0]);setText('page-title-text',info[1]);setText('page-subtitle',info[2]);
    if(state)render();
    window.scrollTo({top:0,behavior:'instant'});
  }
  function cityOptions(){
    const items=Core.CITIES.slice().sort((a,b)=>a.name.localeCompare(b.name,'pt-BR'));
    for(const selectId of ['start-city','explore-city','v221-city-selector']){
      $(selectId).innerHTML='';
      const group=document.createDocumentFragment();
      for(const city of items){const opt=document.createElement('option');opt.value=city.id;opt.textContent=`${city.name} · ${city.uf}${city.capital?' (capital)':''}`;group.appendChild(opt);}
      $(selectId).appendChild(group);
    }
    const tiangua=Core.CITIES.find(c=>c.name==='Tianguá');$('start-city').value=tiangua.id;
  }
  function renderRegional(city){
    const p=Core.regionalProfile(city.id);
    if(!p)return;
    setText('regional-population',new Intl.NumberFormat('pt-BR').format(p.population));
    setText('regional-code',p.ibgeCode);
    setText('regional-date','01/07/'+p.populationYear);
    setText('regional-urban-size',p.tierLabel);
    setText('regional-demand-factor',`${p.demandFactor}%`);
    setText('regional-competition-factor',`${p.competitionFactor}%`);
    setText('regional-gdp',`R$ ${new Intl.NumberFormat('pt-BR').format(p.gdp2023Thousand * 1000)} · IBGE 2023`);
    setText('regional-regic','Classificação municipal não integrada · REGIC 2018');
    setText('regional-gdp-effect',`${p.gdpAdjustment>0?'+':''}${p.gdpAdjustment} p.p. (hipótese)`);
    setText('regional-model-status','População (2026) e PIB total (2023) oficiais. Ajuste comercial é uma regra fictícia limitada; não equivale a PIB per capita, renda das famílias ou fluxo intermunicipal.');
    $('regional-gdp-source').href=p.gdpSource;
    const comparisonCity=Core.cityById($('regional-compare-city').value);
    if(comparisonCity){
      const [a,b]=Core.regionalComparison([city.id,comparisonCity.id]);
      setText('regional-compare-result',`${a.name}: índice ${a.simulatedDemandFactor}% · ${b.name}: índice ${b.simulatedDemandFactor}%. Comparação de fatores simulados, não previsão de faturamento.`);
    }
    $('regional-source').href=p.source;
    $('map-canvas').dataset.urbanSize=p.tier;
  }
  function eventsHTML(events){if(!events.length)return '<p class="muted">Nenhum evento registrado ainda.</p>';return events.map(e=>`<div class="event-item"><i class="event-dot"></i><div><p>${escape(e.text)}</p><small>${escape(e.date)} · ${escape(e.type)}</small></div></div>`).join('');}
  function render(){
    const started=!!state?.player?.cityId;
    document.body.classList.toggle('v221-city-mode',started&&tab==='cidade');
    $('onboarding').hidden=started;$('game-shell').hidden=!started;
    if(!started)return;
    const b=business(),units=Core.businesses(state),info=Core.overview(state),ownCity=Core.cityById(b?.cityId||state.player.cityId);
    const visibleCity=Core.cityById(viewCityId)||ownCity;
    viewCityId=visibleCity.id;
    document.body.classList.toggle('v221-tiangua-scene',visibleCity.id==='CE-TIANGUA');
    $('v221-city-selector').value=visibleCity.id;
    setText('top-city',`${visibleCity.name} · ${visibleCity.uf}`);
    setText('v221-map-city-title',`${visibleCity.name.toUpperCase()} · ${visibleCity.uf}`);
    $('explore-city').value=visibleCity.id;
    setText('date-label',BRDate(state.calendar.date));
    setText('v221-date-label',BRDate(state.calendar.date));
    setText('kpi-cash',Core.money(info.cash));setText('kpi-revenue',Core.money(info.revenue));setText('kpi-profit',Core.money(info.profit));setText('kpi-stock',info.stock);
    setText('v221-hud-cash',Core.money(info.cash));setText('v221-hud-profit',Core.money(info.profit));setText('v221-hud-count',`${units.length}/5`);
    setText('kpi-stock-label',b?`${b.products.length} produtos cadastrados · unidades totais`:'Sem estoque');
    $('other-city-warning').hidden=units.some(x=>x.cityId===visibleCity.id);
    setText('other-city-warning','Cidade sem unidade da sua rede. Você pode inaugurar uma unidade num lote disponível.');
    setText('map-title',`Distrito comercial de ${visibleCity.name}`);setText('map-uf',visibleCity.uf);
    const cityUnits=units.filter(x=>x.cityId===visibleCity.id);
    setText('v221-legend-free',`${18-cityUnits.length} disponíveis`);
    setText('v221-legend-owned',`${cityUnits.length} ${cityUnits.length===1?'empresa':'empresas'}`);
    setText('v221-legend-selection',inspectorOpen?`Lote ${String(selectedLot).padStart(2,'0')} selecionado`:'Nenhuma seleção');
    document.body.classList.toggle('v221-map-zoomed',mapZoomed&&visibleCity.id==='CE-TIANGUA');
    const zoomButton=$('v221-map-zoom');
    zoomButton.hidden=visibleCity.id!=='CE-TIANGUA';
    zoomButton.setAttribute('aria-pressed',String(mapZoomed));
    zoomButton.textContent=mapZoomed?'⊖ Mostrar mapa inteiro':'⊕ Ampliar mapa';
    $('map-canvas').innerHTML=visibleCity.id==='CE-TIANGUA'
      ? CidadeTianguaCena.svgMap(visibleCity,units.filter(x=>x.cityId===visibleCity.id),inspectorOpen?selectedLot:null)
      : CidadeVisual.svgMap(visibleCity,units.filter(x=>x.cityId===visibleCity.id).map(x=>x.lot),inspectorOpen?selectedLot:null);
    $('v221-inspector').hidden=!inspectorOpen;
    $('map-lot-picker').value=String(selectedLot);
    renderRegional(visibleCity);
    setText('selected-lot',`Lote ${String(selectedLot).padStart(2,'0')} de 18`);updateOpenPreview();
    const lotOwner=units.find(x=>x.cityId===visibleCity.id&&x.lot===selectedLot);
    $('map-open-company').disabled=!lotOwner&&units.length>=5;
    setText('map-open-company',lotOwner?'Gerenciar este estabelecimento':'Abrir unidade neste lote');
    setText('map-lot-status',lotOwner?`Sua unidade ${lotOwner.id} está neste lote.`:(units.length>=5?'Limite de 5 estabelecimentos atingido.':'Terreno disponível para uma nova unidade.'));
    setText('city-events','');$('city-events').innerHTML=eventsHTML(state.audit.events.slice(-6).reverse());
    $('company-empty').hidden=units.length>=5;$('company-active').hidden=!b;
    renderGroup();
    renderCompanyPanels();
    setText('company-status',b?'EM OPERAÇÃO':'NÃO INAUGURADA');
    $('buy-form').querySelector('button').disabled=!b;$('price-form').querySelector('button').disabled=!b;
    if(b){const s=Core.SECTORS[b.sector];setText('company-glyph',s.glyph);setText('company-title',`${state.player.companyName} · ${b.id} · ${s.name}`);setText('company-product',`${b.products.length} produto(s) cadastrados`);setText('company-location',`${Core.cityById(b.cityId).name} / ${Core.cityById(b.cityId).uf} · lote ${String(b.lot).padStart(2,'0')}`);setText('company-sold',b.totalSold);setText('company-price',Core.money(b.unitPrice));setText('company-payable',Core.money(info.payable));
      setText('market-product','Escolha o produto e o fornecedor. Custos unitários são simulados.');
      setText('your-current-price',Core.money(b.unitPrice));
      setText('competitor-price',Core.money(Math.round(Core.competitorReference(state,{referenceCents:s.recommended},ownCity))));
      if(document.activeElement!==$('price-value'))$('price-value').value=(b.unitPrice/100).toFixed(2);
      updateBuyPreview();
    }else{setText('market-product','Abra uma empresa antes de comprar mercadorias.');setText('your-current-price','—');setText('competitor-price','—');setText('buy-total','—');}
    renderCommerce();renderPriceHistory();
    if((tab==='administrativo'&&activeSection.administrativo==='financas')||financeQuery)renderFinances();
    renderFiscal();
    const report=Core.diagnostics(state);
    $('diagnostic-details').innerHTML=[['Versão do jogo',Core.VERSION],['Schema',String(state.schemaVersion)],['Revisão',String(state.revision)],['Unidade ativa',b?.id||'Nenhuma'],['Cidade ativa',ownCity.name],['Estabelecimentos',String(units.length)],['Cidades / UFs',`${report.cities} / ${report.ufs}`],['Dias concluídos',String(report.tick)],['Eventos confirmados',String(report.events)],['Checksum local',report.checksum],['Cobertura fiscal',state.fiscal.coverageStatus]].map(x=>`<dt>${escape(x[0])}</dt><dd>${escape(x[1])}</dd>`).join('');
    setText('turn-message',!b?'Abra sua primeira empresa.':b.stockUnits===0?'Seu estoque está vazio. Reabasteça.':`Sua empresa está operando há ${state.calendar.tick} dia(s).`);
    setText('turn-subtext',!b?'Clique em um lote para iniciar.':`${b.products.length} produtos · Estoque total ${b.stockUnits} un. · próximo dia ${BRDate(state.calendar.date)}.`);
    setText('autosave-label',autosaveStatus);
    setText('footer-state',autosaveStatus.startsWith('Cópia')?'Cópia local verificada · backup JSON recomendado':'Backup JSON recomendado');
  }
  function updateBuyPreview(){
    if(!business())return;
    const qty=Number($('buy-quantity').value),p=chooseProduct('buy-product');
    const supplier=Core.SUPPLIERS.find(s=>s.id===$('buy-supplier').value);
    const unit=p&&supplier?Math.round(p.costCents*supplier.priceFactor/100):0;
    setText('buy-total',p&&supplier&&Number.isInteger(qty)&&qty>0?`Encomenda: ${Core.money(unit)} por unidade · total pago hoje: ${Core.money(qty*unit)} · entrega em ${supplier.leadDays} dia(s) · caixa: ${Core.money(Core.overview(state).cash)}`:'Informe quantidade e fornecedor.');
  }
  function exportFile(){
    if(!state){notify('Crie uma carreira antes de exportar.',true);return;}
    try{
      const data=Core.exportSave(state),blob=new Blob([data],{type:'application/json;charset=utf-8'}),url=URL.createObjectURL(blob),a=document.createElement('a');
      a.href=url;a.download=`cidade-dos-negocios-${state.player.cityId}-${state.calendar.date}.json`;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),10000);
      notify('Download do backup solicitado. Confira se o arquivo JSON foi salvo no computador.');
    }catch(e){notify(e.message,true);}
  }
  async function importFile(file){
    if(!file)return;
    if(file.size>25_000_000){notify('Save excede 25 MB.',true);return;}
    if(state?.player.cityId&&!confirm('Substituir a carreira atual pelo save importado? Recomendamos exportar antes.'))return;
    try{const incoming=Core.importSave(await file.text());resetTimer();state=incoming.state;restockDraft=null;viewCityId=business()?.cityId||state.player.cityId;selectedLot=1;financeQuery=null;financeScope='all';statementView='summary';saveLocal();render();notify(incoming.message);}
    catch(e){notify(`Importação rejeitada: ${e.message}. A carreira anterior foi preservada.`,true);}
  }
  function launchAuto(){
    if(timer){resetTimer();return;}
    if(!state)return;
    timer=setInterval(()=>{if(!commit('TEMPO.AVANCAR_DIA'))resetTimer();},Math.round(1900/speed));setText('pause-btn','Ⅱ Pausar');
  }
  function bind(){
    // Somente estado de apresentação; não grava em save nem executa comandos econômicos.
    const hudToggle=$('stats-more-toggle');
    hudToggle.addEventListener('click',()=>{
      const expanded=hudToggle.getAttribute('aria-expanded')!=='true';
      $('stats-bar').classList.toggle('is-expanded',expanded);
      hudToggle.setAttribute('aria-expanded',String(expanded));
      hudToggle.firstChild.textContent=expanded?'Mostrar apenas os principais ':'Mostrar resultado e estoque ';
    });
    $('career-form').addEventListener('submit',e=>{e.preventDefault();const name=$('player-name').value,companyName=$('company-name').value,cityId=$('start-city').value;commit('CARREIRA.CRIAR',{name,companyName,cityId,seed:(Date.now()>>>0)});});
    for(const button of document.querySelectorAll('[data-tab]'))button.addEventListener('click',()=>goto(button.dataset.tab));
    for(const button of document.querySelectorAll('[data-go]'))button.addEventListener('click',()=>goto(button.dataset.go));
    for(const button of document.querySelectorAll('[data-section-tab]')){
      button.addEventListener('click',()=>goto(...button.dataset.sectionTab.split(':')));
      button.addEventListener('keydown',e=>{
        if(!['ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;
        const list=[...button.parentElement.querySelectorAll('[data-section-tab]')],ix=list.indexOf(button),step=e.key==='ArrowRight'?1:e.key==='ArrowLeft'?-1:0;
        const next=e.key==='Home'?list[0]:e.key==='End'?list.at(-1):list[(ix+step+list.length)%list.length];
        if(next){e.preventDefault();next.focus();next.click();}
      });
    }
    for(const button of document.querySelectorAll('[data-section-go]'))button.addEventListener('click',()=>goto(...button.dataset.sectionGo.split(':')));
    $('unit-switch').addEventListener('change',e=>{if(e.target.value)commit('EMPRESA.ATIVAR',{businessId:e.target.value});});
    $('finance-scope').addEventListener('change',e=>{financeScope=e.target.value;renderFinances();});
    $('fiscal-acknowledge').addEventListener('change',()=>{$('fiscal-activate').disabled=!$('fiscal-acknowledge').checked;});
    $('fiscal-activate').addEventListener('click',()=>{if(!$('fiscal-acknowledge').checked)return;
      if(confirm('Ativar hipótese tributária DIDÁTICA de Simples Anexo I, a partir do mês seguinte? Sem efeitos retroativos nem valor fiscal real.'))commit('FISCAL.ATIVAR_CENARIO',{acceptSimplifications:true});});
    $('fiscal-assessments').addEventListener('click',e=>{const btn=e.target.closest('[data-tax-pay]');if(!btn)return;
      const period=btn.dataset.taxPay;
      if(confirm(`Confirmar pagamento apenas SIMULADO da competência ${period}? Ele diminuirá o caixa do jogo.`))commit('FISCAL.PAGAR_SIMULADO',{period});});

    $('unit-rows').addEventListener('click',e=>{const btn=e.target.closest('[data-unit-activate]');if(btn)commit('EMPRESA.ATIVAR',{businessId:btn.dataset.unitActivate});});
    for(const id of ['company-unit-city','company-unit-sector','company-analysis-scope','company-analysis-period','company-analysis-from','company-analysis-to','company-compare-dimension','company-compare-city','company-compare-sector','company-compare-period','company-compare-from','company-compare-to','company-compare-sort']){
      $(id).addEventListener('change',()=>renderCompanyPanels());
    }
    $('company-unit-search').addEventListener('input',companyRenderUnitList);
    $('explore-city').addEventListener('change',e=>{viewCityId=e.target.value;inspectorOpen=false;render();updateOpenPreview();});
    $('v221-city-selector').addEventListener('change',e=>{viewCityId=e.target.value;inspectorOpen=false;$('v221-city-pick').hidden=true;render();});
    $('map-canvas').addEventListener('click',e=>{const target=e.target.closest('[data-lot]');if(target){selectedLot=Number(target.dataset.lot);inspectorOpen=true;render();updateOpenPreview();}});
    $('map-canvas').addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){const target=e.target.closest('[data-lot]');if(target){e.preventDefault();selectedLot=Number(target.dataset.lot);inspectorOpen=true;render();$('map-canvas').querySelector(`[data-lot="${selectedLot}"]`)?.focus();}}});
  $('map-lot-picker').addEventListener('change',e=>{const next=Number(e.target.value);if(Number.isInteger(next)&&next>=1&&next<=18){selectedLot=next;inspectorOpen=true;render();$('map-lot-picker').focus();}});
    $('v221-map-zoom').addEventListener('click',()=>{
      mapZoomed=!mapZoomed;
      render();
      // No modo ampliado, a faixa do mapa pode ser deslocada horizontalmente.
      if(mapZoomed){const el=$('map-canvas');el.scrollLeft=Math.max(0,(el.scrollWidth-el.clientWidth)/2);}
    });
    $('v221-inspector-close').addEventListener('click',()=>{inspectorOpen=false;render();$('v221-hud-units').focus();});
    $('v221-hud-units').addEventListener('click',()=>goto('empresa'));
    $('v221-config-open').addEventListener('click',()=>goto('sistema'));
    $('v221-help-open').addEventListener('click',()=>{$('v221-help-panel').hidden=!$('v221-help-panel').hidden;});
    $('v221-help-close').addEventListener('click',()=>{$('v221-help-panel').hidden=true;});
    $('v221-city-switch-trigger').addEventListener('click',()=>{$('v221-city-pick').hidden=!$('v221-city-pick').hidden;});
    $('v221-city-pick-close').addEventListener('click',()=>{$('v221-city-pick').hidden=true;});
    $('v221-city-info-trigger').addEventListener('click',()=>{$('v221-observatory').open=!$('v221-observatory').open;$('v221-activity').open=false;});
    $('v221-event-open').addEventListener('click',()=>{$('v221-activity').open=!$('v221-activity').open;$('v221-observatory').open=false;});
    $('v221-hud-time').addEventListener('click',()=>{const el=$('v221-time-menu');el.hidden=!el.hidden;$('v221-hud-time').setAttribute('aria-expanded',String(!el.hidden));$('v221-time-speed').value=$('speed-select').value;});
    $('v221-time-speed').addEventListener('change',e=>{$('speed-select').value=e.target.value;$('speed-select').dispatchEvent(new Event('change'));});
    for(const button of document.querySelectorAll('[data-v221-time]'))button.addEventListener('click',()=>{
      const t=button.dataset.v221Time;const target=t==='play'?'pause-btn':t==='1'?'next-day':t==='7'?'next-week':'next-month';
      $(target).click();$('v221-time-menu').hidden=true;$('v221-hud-time').setAttribute('aria-expanded','false');
    });
    $('map-open-company').addEventListener('click',()=>{const owner=Core.businesses(state).find(x=>x.cityId===viewCityId&&x.lot===selectedLot);if(owner&&business()?.id!==owner.id)commit('EMPRESA.ATIVAR',{businessId:owner.id});goto('empresa','minhas-empresas');if(!owner)$('sector-select').focus();});
    $('sector-select').addEventListener('change',updateOpenPreview);
    $('open-form').addEventListener('submit',e=>{e.preventDefault();if(!state)return;if(commit('EMPRESA.ABRIR',{sector:$('sector-select').value,cityId:viewCityId,lot:selectedLot}))goto('cidade');});
    $('buy-quantity').addEventListener('input',updateBuyPreview);
    $('buy-product').addEventListener('change',updateBuyPreview);
    $('buy-supplier').addEventListener('change',()=>{renderCommerce();updateBuyPreview();});
    $('policy-product').addEventListener('change',()=>{const p=chooseProduct('policy-product');if(p){$('policy-reorder').value=p.reorderPoint;$('policy-target').value=p.targetStock;}});
    $('stock-policy-form').addEventListener('submit',e=>{e.preventDefault();const productId=$('policy-product').value;commit('ESTOQUE.POLITICA_DEFINIR',{productId,reorderPoint:Number($('policy-reorder').value),targetStock:Number($('policy-target').value)});});
    $('price-product').addEventListener('change',()=>{const p=chooseProduct('price-product');if(p)$('price-value').value=(p.priceCents/100).toFixed(2);renderCommerce();});
    $('promo-product').addEventListener('change',renderCommerce);
    $('promo-form').addEventListener('submit',e=>{e.preventDefault();const productId=$('promo-product').value,percent=Number($('promo-percent').value),days=percent?Number($('promo-days').value):0;if(commit('PROMO.DEFINIR',{productId,percent,days}))notify(percent?`Campanha de ${percent}% confirmada por ${days} dia(s) de jogo.`:'Campanha encerrada.');});
    $('strategy-horizon').addEventListener('change',e=>{strategyHorizon=Number(e.target.value);renderStrategy();});
    $('product-form').addEventListener('submit',e=>{e.preventDefault();
      const name=$('new-product-name').value,costCents=Math.round(Number($('new-product-cost').value)*100),priceCents=Math.round(Number($('new-product-price').value)*100);
      if(commit('PRODUTO.CADASTRAR',{name,costCents,priceCents})){$('product-form').reset();notify('Produto cadastrado. Agora configure estoque mínimo e encomende mercadorias.');}
    });
    for(const b of document.querySelectorAll('[data-buy-preset]'))b.addEventListener('click',()=>{$('buy-quantity').value=b.dataset.buyPreset;updateBuyPreview();$('buy-quantity').focus();});
    for(const button of document.querySelectorAll('[data-statement-view]'))button.addEventListener('click',()=>{statementView=button.dataset.statementView;renderFinances();});
    $('finance-period').addEventListener('change',e=>{ensureFinanceQuery().period=e.target.value;renderFinances();});
    const controls=[['finance-date','asOf'],['finance-day','day'],['finance-month','month'],
      ['finance-quarter','quarter'],['finance-quarter-year','quarterYear'],
      ['finance-semester','semester'],['finance-semester-year','semesterYear'],
      ['finance-year','year'],['finance-range-from','from'],['finance-range-to','to']];
    for(const [id,field] of controls)$(id).addEventListener('change',e=>{
      ensureFinanceQuery()[field]=field.endsWith('Year')||field==='year'?Number(e.target.value):e.target.value;
      renderFinances();
    });
    $('finance-current-date').addEventListener('click',()=>{
      const q=ensureFinanceQuery(),current=lastAvailableDate(),year=Number(current.slice(0,4)),month=Number(current.slice(5,7));
      if(q.period==='all')q.asOf=current;
      else if(q.period==='day')q.day=current;
      else if(q.period==='month')q.month=current.slice(0,7);
      else if(q.period==='quarter'){q.quarter=String(Math.floor((month-1)/3)+1);q.quarterYear=year;}
      else if(q.period==='semester'){q.semester=String(Math.floor((month-1)/6)+1);q.semesterYear=year;}
      else if(q.period==='year')q.year=year;
      else {q.to=current;}
      renderFinances();
    });
    $('regional-compare-city').addEventListener('change',()=>renderRegional(Core.cityById(viewCityId)||Core.CITIES[0]));
    bindRestock();
    $('buy-form').addEventListener('submit',e=>{e.preventDefault();commit('ESTOQUE.COMPRAR',{productId:$('buy-product').value,supplierId:$('buy-supplier').value,quantity:Number($('buy-quantity').value)});});
    $('price-form').addEventListener('submit',e=>{e.preventDefault();const p=chooseProduct('price-product'),value=$('price-value').value,cents=Math.round(Number(value)*100),before=p?.priceCents;if(commit('PRECO.DEFINIR',{productId:p?.id,cents})){const after=business().products.find(x=>x.id===p.id).priceCents;const message=`Preço de ${p.name} atualizado: ${Core.money(before)} → ${Core.money(after)}.`;setText('price-change-feedback',message);notify(message);}});
    $('next-day').addEventListener('click',()=>commit('TEMPO.AVANCAR_DIA'));
    $('next-week').addEventListener('click',()=>commit('TEMPO.AVANCAR_LOTE',{days:7}));
    $('next-month').addEventListener('click',()=>commit('TEMPO.AVANCAR_LOTE',{days:30}));
    $('speed-select').addEventListener('change',e=>{speed=Number(e.target.value);if(timer){resetTimer();launchAuto();}});
    $('pause-btn').addEventListener('click',launchAuto);
    $('export-btn').addEventListener('click',exportFile);
    $('import-btn').addEventListener('click',()=>$('import-file').click());
    $('start-import').addEventListener('click',()=>$('import-file').click());
    $('import-file').addEventListener('change',async e=>{const f=e.target.files?.[0];try{await importFile(f);}finally{e.target.value='';}});
    $('run-diagnostic').addEventListener('click',()=>{try{const before=JSON.stringify(state),out=Core.diagnostics(state);if(before!==JSON.stringify(state))throw Error('Diagnóstico alterou o estado');setText('diagnostic-result',out.status+' · revisão '+out.revision);notify('Verificação estrutural e contábil aprovada.');}catch(e){setText('diagnostic-result',e.message);notify(e.message,true);}});
    $('new-career-btn').addEventListener('click',()=>{if(!confirm('Deseja abandonar a carreira atual? Exporte um backup JSON antes de começar outra.'))return;resetTimer();setText('price-change-feedback','Alterações de preços serão confirmadas aqui.');try{localStorage.removeItem(KEY);}catch(e){notify('Não foi possível limpar a cópia do navegador; confira seu backup.',true);}state=null;viewCityId=null;financeQuery=null;financeScope='all';statementView='summary';render();notify('Nova carreira: preencha os dados iniciais. Exporte um backup para preservar a carreira anterior.');});
  }
  function updateOpenPreview(){const s=Core.SECTORS[$('sector-select').value],city=Core.cityById(viewCityId);if(s)setText('open-preview',`Abertura em ${city?.name||'cidade selecionada'} · lote ${String(selectedLot).padStart(2,'0')} · investimento ${Core.money(s.openCost)} do caixa compartilhado · ramo: ${s.name}.`);}
  function start(){
    // Fonte única de versão: nunca depender de textos desatualizados no rodapé ou no topo.
    for(const id of ['intro-version','build-version','footer-version'])setText(id,`v${Core.VERSION}`);
    document.title=`Cidade dos Negócios 1 · v${Core.VERSION}`;
    const comparer=$('regional-compare-city');
    comparer.replaceChildren(...Core.CITIES.slice().sort((a,b)=>a.name.localeCompare(b.name,'pt-BR')).map(c=>{
      const o=document.createElement('option');o.value=c.id;o.textContent=`${c.name} · ${c.uf}`;return o;
    }));
    comparer.value=Core.CITIES.find(c=>c.name==='Sobral').id;
    cityOptions();bind();updateOpenPreview();
    try{const raw=localStorage.getItem(KEY);if(raw){const loaded=Core.importSave(raw);state=loaded.state;viewCityId=business()?.cityId||state.player.cityId;autosaveStatus='Cópia local verificada neste navegador; mantenha backup JSON externo.';}}
    catch(e){autosaveStatus='Não foi possível recuperar o salvamento local; importe backup JSON.';notify(autosaveStatus+' '+e.message,true);}
    render();goto('cidade');
  }
  start();
})();