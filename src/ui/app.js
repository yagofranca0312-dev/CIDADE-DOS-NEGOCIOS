/* Cidade dos Negócios 1 — interface. Sem regras econômicas e sem RNG. */
(() => {
  'use strict';
  const Core=CidadeCore;
  const $=id=>document.getElementById(id);
  const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const BRDate=iso=>iso.split('-').reverse().join('/');
  const KEY='cidade-dos-negocios-save-v1';
  let state=null,viewCityId=null,selectedLot=1,tab='cidade',timer=null,speed=1,sequence=0,autosaveStatus='Backup JSON recomendado';
  let financeQuery=null,strategyHorizon=30,financeScope='all'; // preferências de interface, independentes do GameState
  const business=()=>state?Core.activeBusiness(state):null;
  function chooseProduct(id){const b=business();return b?.products?.find(p=>p.id===$(id)?.value)||b?.products?.[0]||null;}
  function refillSelect(id,products){
    const select=$(id),previous=select.value;
    select.replaceChildren(...products.map(p=>{const option=document.createElement('option');option.value=p.id;option.textContent=p.name;return option;}));
    if(products.some(p=>p.id===previous))select.value=previous;
  }
  function renderSalesMonitor(){
    const b=business(),sales=b?.sales||[];
    const checks=state?.audit?.events?.filter(e=>e.type==='DEMANDA.SIMULADA'&&b&&(e.businessId===b.id||(!e.businessId&&b.id===state.world.business?.id)))||[];
    const latest=checks.at(-1);
    setText('demand-date',latest?BRDate(latest.date):'Aguardando primeiro dia simulado');
    setText('demand-estimated',latest?String(latest.data.estimated):'—');
    setText('demand-fulfilled',latest?String(latest.data.fulfilled):'—');
    setText('demand-unmet',latest?String(latest.data.unmet):'—');
    setText('demand-without-stock',latest?String(latest.data.withoutStock):'—');
    setText('demand-lost-potential',latest&&Number.isSafeInteger(latest.data.lostPotentialCents)?Core.money(latest.data.lostPotentialCents):'—');
    const rows=latest?.data?.items||[];
    $('demand-rows').innerHTML=rows.length?rows.map(p=>`<tr><td>${escape(p.name)}</td><td>${p.estimated===null?'Sem estimativa':p.estimated}</td><td>${p.fulfilled}</td><td>${p.unmet===null?'—':p.unmet}</td></tr>`).join(''):'<tr><td colspan="4">Avance pelo menos um dia com uma empresa aberta para visualizar a demanda simulada.</td></tr>';
    const daily=latest?sales.filter(s=>s.date===latest.date&&s.kind==='SIMULACAO_DIARIA'):[];
    const revenue=daily.reduce((n,s)=>n+s.total,0),cost=daily.reduce((n,s)=>n+s.cogs,0);
    setText('demand-day-revenue',latest?Core.money(revenue):'—');
    setText('demand-day-cogs',latest?Core.money(cost):'—');
    $('recent-sales').innerHTML=sales.length?sales.slice(-12).reverse().map(o=>{
      const name=o.kind==='SIMULACAO_DIARIA'?'Vendas automáticas':o.kind==='BALCAO'?'Venda manual histórica (V1.2)':'Venda registrada';
      const detail=o.items.map(x=>`<li>${escape(x.name)}: ${x.quantity} un. · receita ${escape(Core.money(x.revenue))} · CMV ${escape(Core.money(x.cogs))}</li>`).join('');
      return `<details class="commerce-receipt"><summary>${escape(BRDate(o.date))} · ${escape(o.id)} · ${escape(name)} · ${escape(Core.money(o.total))}</summary><ul>${detail}</ul><p>CMV: ${escape(Core.money(o.cogs))} · Lucro bruto: ${escape(Core.money(o.total-o.cogs))}</p></details>`;
    }).join(''):'<p class="muted">Nenhuma venda registrada. Abasteça o estoque e avance um dia.</p>';
  }
  function renderInventoryPlanner(){
    const b=business(),rows=b?Core.inventoryReport(state):[];
    $('inventory-planner-rows').innerHTML=rows.length?rows.map(p=>`<tr><td class="${p.alert?'stock-alert':'stock-ok'}">${escape(p.name)}${p.alert?' ⚠':''}</td><td>${p.stock}</td><td>${p.inTransit}</td><td>${p.forecastDaily} ${p.sampleDays?'(observada)':'(base)'}</td><td>${p.coverageDays} dias</td><td>${p.reorderPoint}</td><td>${p.targetStock}</td><td>${p.recommended}</td></tr>`).join(''):'<tr><td colspan="8">Abra a empresa para configurar a reposição.</td></tr>';
    refillSelect('policy-product',b?.products||[]);
    const selected=chooseProduct('policy-product');
    if(selected&&document.activeElement!==$('policy-reorder'))$('policy-reorder').value=selected.reorderPoint;
    if(selected&&document.activeElement!==$('policy-target'))$('policy-target').value=selected.targetStock;
    $('stock-policy-form').querySelector('button').disabled=!b;
  }
  function renderCommerce(){
    const b=business(),products=b?.products||[];
    for(const id of ['buy-product','price-product','promo-product'])refillSelect(id,products);
    const suppliers=Core.SUPPLIERS,$supplier=$('buy-supplier'),previous=$supplier.value;
    $supplier.replaceChildren(...suppliers.map(s=>{const opt=document.createElement('option');opt.value=s.id;opt.textContent=s.name;return opt;}));
    if(suppliers.some(x=>x.id===previous))$supplier.value=previous;
    const supplier=suppliers.find(x=>x.id===$supplier.value);
    setText('supplier-terms',supplier?`Entrega em ${supplier.leadDays} dia(s) · custo ${supplier.priceFactor}% da referência · capacidade de ${supplier.maxDailyPerSku} un. por produto/dia.`:'Escolha um fornecedor.');
    const chosenPrice=chooseProduct('price-product');
    setText('product-count',`${products.length} produto(s)`);
    const stats=b?Core.productPerformance(state):[];
    $('catalog-rows').innerHTML=stats.length?stats.map(p=>`<tr><td>${escape(p.name)}</td><td>${p.stockUnits}</td><td>${escape(Core.money(p.costCents))}</td><td>${escape(Core.money(p.priceCents))}</td><td>${p.sold}</td><td>${escape(Core.money(p.revenue))}</td><td>${escape(Core.money(p.cogs))}</td></tr>`).join(''):'<tr><td colspan="7">Abra uma empresa para ver o catálogo.</td></tr>';
    const orders=b?.purchaseOrders||[];
    $('recent-purchases').innerHTML=orders.length?orders.slice(-8).reverse().map(o=>`<div class="commerce-history-row"><strong>${escape(o.status==='PENDING'?'🚚 EM TRÂNSITO':'✓ RECEBIDO')}</strong> · ${escape(BRDate(o.date))} → ${escape(BRDate(o.dueDate||o.date))} · ${escape(o.id)} · ${escape(o.items.map(x=>x.quantity+'× '+x.name).join(', '))} · ${escape(Core.money(o.total))}</div>`).join(''):'<p class="muted">Nenhum pedido realizado nesta edição.</p>';
    renderSalesMonitor();renderInventoryPlanner();
    const promoProduct=chooseProduct('promo-product');
    const promo=promoProduct&&b?.promotions?.[promoProduct.id];
    const active=promo&&state.calendar.date<=promo.until;
    setText('promo-status',promoProduct?(active?`Campanha vigente: ${promo.percent}% até ${BRDate(promo.until)} · preço efetivo ${Core.money(Core.effectivePrice(b,promoProduct,state.calendar.date))}.`:'Sem campanha ativa para este produto.'):'Abra sua empresa para configurar campanhas.');
    $('promo-form').querySelector('button').disabled=!b;
    if(promoProduct&&document.activeElement!==$('promo-percent'))$('promo-percent').value=active?String(promo.percent):'0';
        setText('your-current-price',chosenPrice?Core.money(Core.effectivePrice(b,chosenPrice,state.calendar.date)):'—');
    setText('competitor-price',chosenPrice?Core.money(Math.round(Core.competitorReference(state,chosenPrice,Core.cityById(b.cityId)))):'—');
    if(chosenPrice&&document.activeElement!==$('price-value'))$('price-value').value=(chosenPrice.priceCents/100).toFixed(2);
    updateBuyPreview();
  }

  let toastTimer;
  const nextId=()=>`ui:${Date.now()}:${++sequence}`;
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
  function renderFinances(){
    if(!state)return;
    const q=ensureFinanceQuery();
    $('finance-period').value=q.period;
    for(const group of document.querySelectorAll('[data-finance-field]'))group.hidden=group.dataset.financeField!==q.period;
    const fields={'finance-date':q.asOf,'finance-day':q.day,'finance-month':q.month,
      'finance-quarter':q.quarter,'finance-quarter-year':q.quarterYear,
      'finance-semester':q.semester,'finance-semester-year':q.semesterYear,
      'finance-year':q.year,'finance-range-from':q.from,'finance-range-to':q.to};
    for(const [id,value] of Object.entries(fields)){const el=$(id);if(document.activeElement!==el)el.value=String(value);}
    for(const id of ['finance-date','finance-day','finance-range-from','finance-range-to'])$(id).max=state.calendar.date;
    $('finance-month').max=state.calendar.date.slice(0,7);
    for(const id of ['finance-year','finance-quarter-year','finance-semester-year'])$(id).max=state.calendar.date.slice(0,4);
    let report;
    try {
      const params=financeQueryDate(q);
      report=Core.financialReport(state,q.period,params.date,params.range,financeScope);
      $('finance-validation').hidden=true;setText('finance-validation','');
    }catch(e){
      $('finance-validation').hidden=false;setText('finance-validation',e.message);
      setText('finance-period-label','Corrija o período selecionado para consultar o demonstrativo.');
      $('finance-summary').innerHTML='';setText('journal-count','—');
      $('journal-events').innerHTML='<p class="muted">Período inválido. Nenhum dado foi alterado.</p>';
      return;
    }
    setText('finance-period-label',`${report.label} · ${financeScope==='all'?'GRUPO CONSOLIDADO':`UNIDADE ${financeScope}`} · lançamentos até ${BRDate(report.effectiveEnd)}. Consulta fixa até você alterar os filtros.`);
    const rows=[
      ['Receita de vendas (período)',report.revenue],
      ['(-) Custo das mercadorias vendidas',report.cogs],
      ['Lucro bruto (período)',report.grossProfit],
      ['(-) Despesas operacionais',report.expenses],
      ['Resultado antes dos tributos',report.profit],
      ['Caixa centralizado do grupo',financeScope==='all'?report.closingCash:null],
      ['Estoque contabilizado no encerramento',report.closingInventory],
      ['Obrigações acumuladas a pagar',report.closingPayable],
      ['Mercadorias pagas em trânsito (ativo)',report.closingInTransit]
    ];
    $('finance-summary').innerHTML=rows.map((x,i)=>`<dt class="${i===4?'emphasis':''}">${escape(x[0])}</dt><dd class="${i===4?'emphasis':''}">${x[1]===null?'Compartilhado (ver grupo)':escape(Core.money(x[1]))}</dd>`).join('');
    setText('journal-count',`${report.entries.length} registros`);
    $('journal-events').innerHTML=report.entries.length?report.entries.slice(-8).reverse().map(j=>`<div class="event-item"><i class="event-dot"></i><div><p>${escape(j.memo)}</p><small>${escape(BRDate(j.date))} · ${escape(j.id)}</small></div></div>`).join(''):'<p class="muted">Nenhum lançamento neste período.</p>';
    renderStrategy();
  }
  function resetTimer(){if(timer){clearInterval(timer);timer=null;}setText('pause-btn','▶ Jogar');}
  function commit(type,payload={}){
    if(type==='CARREIRA.CRIAR'){resetTimer();financeQuery=null;financeScope='all';}
    const result=Core.dispatch(state,{type,id:nextId(),payload});
    if(!result.ok){notify(result.error,true);return false;}
    if(result.status==='APPLIED'){state=result.state;const chosen=business();if((type==='EMPRESA.ABRIR'||type==='EMPRESA.ATIVAR')&&chosen){viewCityId=chosen.cityId;selectedLot=chosen.lot;}else viewCityId=viewCityId??state.player.cityId;saveLocal();render();}
    notify(result.message);
    return true;
  }
  function goto(name){tab=name;document.querySelectorAll('[data-view]').forEach(el=>{const chosen=el.getAttribute('data-view')===name;el.hidden=!chosen;el.classList.toggle('active',chosen);});document.querySelectorAll('.nav-item').forEach(el=>el.classList.toggle('active',el.dataset.tab===name));
    const labels={cidade:['CENTRAL DE OPERAÇÕES','A sua cidade, as suas decisões.','Explore lotes comerciais e acompanhe os acontecimentos.'],empresa:['GESTÃO EMPRESARIAL','Cada escolha constrói um negócio.','Abra sua empresa e tome decisões de administração.'],mercado:['VENDAS E SUPRIMENTOS','Preço, demanda e estoque.','Compre mercadorias e encontre sua estratégia de preço.'],financas:['INDICADORES CONTÁBEIS','Os números contam sua história.','Acompanhe lançamentos e resultados rastreáveis.'],fiscal:['REGRAS E COBERTURA','Transparência sobre os limites.','Nenhum cálculo tributário fictício será apresentado como legal.'],sistema:['PERSISTÊNCIA E QA','Seu progresso, sua segurança.','Faça backups e confira o estado da simulação.']};
    const info=labels[name]||labels.cidade;setText('page-kicker',info[0]);setText('page-title-text',info[1]);setText('page-subtitle',info[2]);
    if(state)render();
  }
  function cityOptions(){
    const items=Core.CITIES.slice().sort((a,b)=>a.name.localeCompare(b.name,'pt-BR'));
    for(const selectId of ['start-city','explore-city']){
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
    setText('regional-gdp','Não integrado (referência 2023)');
    setText('regional-regic','Não integrado (referência 2018)');
    setText('regional-model-status','Modelo simulado, baseado apenas no porte populacional. Não representa renda familiar, poder de compra nem competição real.');
    $('regional-source').href=p.source;
    $('map-canvas').dataset.urbanSize=p.tier;
  }
  function svgMap(city,ownedLots,lot){
    // SVG estilizado original: cada grupo tem identificação de lote, sem dependências externas.
    const seed=city.name.length+city.id.length;
    const urbanSize={local:0,regional:1,grande:2,metropole:3}[city.sizeTier]??0;
    const fragments=[`<svg viewBox="180 10 600 360" xmlns="http://www.w3.org/2000/svg" aria-label="Mapa isométrico fictício de ${escape(city.name)}">`,
      `<defs><linearGradient id="sea" x1="0" x2="1" y1="0" y2="1"><stop stop-color="#1e5270"/><stop offset="1" stop-color="#0b2639"/></linearGradient><filter id="glow"><feGaussianBlur stdDeviation="4"/></filter></defs>`,
      `<path d="M0 325 Q180 310 280 370 T800 340 L870 410H0Z" fill="#16516e" opacity=".42"/>`,
      `<path d="M145 155 L436 19 L813 196 L519 366Z" fill="#102d3b" opacity=".9"/>`];
    // Horizonte ilustrativo: escala visual relativa, sem geografia ou números oficiais.
    for(let i=0;i<3+urbanSize*5;i++){
      const cx=210+i*26, h=16+((i*19+seed)%24)+urbanSize*9;
      fragments.push(`<rect x="${cx}" y="${125-h}" width="13" height="${h}" rx="2" fill="#6da0a9" opacity=".24" pointer-events="none"/>`);
    }
    for(let row=0;row<3;row++)for(let col=0;col<6;col++){
      const num=row*6+col+1,x=392+(col-row)*57,y=91+(col+row)*26;
      const isOwn=ownedLots.includes(num),isSelected=lot===num;
      const ground=isOwn?'#9e8144':isSelected?'#3f8bb2':'#42665f';
      const roofs=['#487d8c','#316275','#607387','#597c80','#425a6b'];
      const roof=isOwn?'#e8b55f':roofs[(num+seed)%roofs.length];
      const height=isOwn?42:14+((num*7+seed)%4)*9+urbanSize*7;
      const xx=x,yy=y,wide=49,tall=23;
      fragments.push(`<g data-lot="${num}" tabindex="0" role="button" aria-label="Selecionar lote ${num}"><title>Lote ${String(num).padStart(2,'0')} · clique para selecionar</title>`);
      if(isSelected)fragments.push(`<ellipse cx="${xx}" cy="${yy+12}" rx="65" ry="37" fill="#6dc9ff" opacity=".16" filter="url(#glow)"/>`);
      fragments.push(`<polygon points="${xx},${yy-tall} ${xx+wide},${yy} ${xx},${yy+tall} ${xx-wide},${yy}" fill="${ground}" stroke="${isSelected?'#9bdbff':'#416773'}" stroke-width="${isSelected?3:1.7}"/>`);
      if((urbanSize>=2?num%11===0:num%5===0)&&!isOwn){
        fragments.push(`<path d="M${xx-7} ${yy+5}l-6-18h12l-6 18" fill="#42745c" stroke="#8fc09c" stroke-width="2"/><circle cx="${xx-6}" cy="${yy-10}" r="11" fill="#2d8d66"/><circle cx="${xx+7}" cy="${yy-12}" r="9" fill="#419672"/>`);
      }else{
        const cx=xx,cy=yy-3;
        fragments.push(`<polygon points="${cx-17},${cy-height} ${cx},${cy-height-8} ${cx+19},${cy-height} ${cx+2},${cy-height+10}" fill="${roof}" stroke="#9cc1cb" stroke-width=".7"/>`);
        fragments.push(`<polygon points="${cx-17},${cy-height} ${cx+2},${cy-height+10} ${cx+2},${cy+13} ${cx-17},${cy+2}" fill="${isOwn?'#bb873c':'#345569'}"/>`);
        fragments.push(`<polygon points="${cx+2},${cy-height+10} ${cx+19},${cy-height} ${cx+19},${cy+2} ${cx+2},${cy+13}" fill="${isOwn?'#e2a450':'#27485e'}"/>`);
        fragments.push(`<path d="M${cx-10} ${cy-height+14}v5 M${cx-3} ${cy-height+18}v5 M${cx+8} ${cy-height+17}v6" stroke="${isOwn?'#f7d99e':'#7ba9bf'}" stroke-width="2"/>`);
      }
      fragments.push(`</g>`);
    }
    const r=Math.floor((lot-1)/6),c=(lot-1)%6;
    const px=392+(c-r)*57,py=91+(c+r)*26;
    // Destaque sobreposto por último: lote legível sem 18 números concorrendo no mapa.
    fragments.push(`<g class="selected-lot-marker" pointer-events="none" aria-hidden="true"><path d="M${px} ${py-4}L${px} ${py-39}" stroke="#f4d49a" stroke-width="2"/><rect x="${px-55}" y="${py-69}" width="110" height="30" rx="8" fill="#0c2238" stroke="#f4d49a" stroke-width="1.6"/><text x="${px}" y="${py-49}" fill="#ffe1a1" text-anchor="middle" font-size="14" font-weight="800">LOTE ${String(lot).padStart(2,'0')}</text></g>`);
    fragments.push(`<text x="208" y="40" fill="#9fbfd2" font-size="15" font-weight="700" letter-spacing="3">${escape(city.name.toUpperCase())} · ${escape(city.uf)}</text><text x="208" y="60" fill="#7eabc0" font-size="10">DISTRITO COMERCIAL FICTÍCIO · PORTE ${escape(city.sizeTier.toUpperCase())}</text></svg>`);
    return fragments.join('');
  }
  function eventsHTML(events){if(!events.length)return '<p class="muted">Nenhum evento registrado ainda.</p>';return events.map(e=>`<div class="event-item"><i class="event-dot"></i><div><p>${escape(e.text)}</p><small>${escape(e.date)} · ${escape(e.type)}</small></div></div>`).join('');}
  function render(){
    const started=!!state?.player?.cityId;
    $('onboarding').hidden=started;$('game-shell').hidden=!started;
    if(!started)return;
    const b=business(),units=Core.businesses(state),info=Core.overview(state),ownCity=Core.cityById(b?.cityId||state.player.cityId);
    const visibleCity=Core.cityById(viewCityId)||ownCity;
    viewCityId=visibleCity.id;
    setText('top-city',`${visibleCity.name} · ${visibleCity.uf}`);
    $('explore-city').value=visibleCity.id;
    setText('date-label',BRDate(state.calendar.date));
    setText('kpi-cash',Core.money(info.cash));setText('kpi-revenue',Core.money(info.revenue));setText('kpi-profit',Core.money(info.profit));setText('kpi-stock',info.stock);
    setText('kpi-stock-label',b?`${b.products.length} produtos cadastrados · unidades totais`:'Sem estoque');
    $('other-city-warning').hidden=units.some(x=>x.cityId===visibleCity.id);
    setText('other-city-warning','Cidade sem unidade da sua rede. Você pode inaugurar uma unidade num lote disponível.');
    setText('map-title',`Distrito comercial de ${visibleCity.name}`);setText('map-uf',visibleCity.uf);
    $('map-canvas').innerHTML=svgMap(visibleCity,units.filter(x=>x.cityId===visibleCity.id).map(x=>x.lot),selectedLot);
    renderRegional(visibleCity);
    setText('selected-lot',`Lote ${String(selectedLot).padStart(2,'0')} de 18`);updateOpenPreview();
    $('map-open-company').disabled=units.length>=5||units.some(x=>x.cityId===visibleCity.id&&x.lot===selectedLot);
    setText('city-events','');$('city-events').innerHTML=eventsHTML(state.audit.events.slice(-6).reverse());
    $('company-empty').hidden=units.length>=5;$('company-active').hidden=!b;
    renderGroup();
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
    if(tab==='financas'||financeQuery)renderFinances();
    const report=Core.diagnostics(state);
    $('diagnostic-details').innerHTML=[['Versão do jogo',Core.VERSION],['Schema',String(state.schemaVersion)],['Revisão',String(state.revision)],['Unidade ativa',b?.id||'Nenhuma'],['Cidade ativa',ownCity.name],['Estabelecimentos',String(units.length)],['Cidades / UFs',`${report.cities} / ${report.ufs}`],['Dias concluídos',String(report.tick)],['Eventos confirmados',String(report.events)],['Checksum local',report.checksum],['Cobertura fiscal','NOT_COVERED']].map(x=>`<dt>${escape(x[0])}</dt><dd>${escape(x[1])}</dd>`).join('');
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
    try{const incoming=Core.importSave(await file.text());resetTimer();state=incoming.state;viewCityId=business()?.cityId||state.player.cityId;selectedLot=1;financeQuery=null;financeScope='all';saveLocal();render();notify(incoming.message);}
    catch(e){notify(`Importação rejeitada: ${e.message}. A carreira anterior foi preservada.`,true);}
  }
  function launchAuto(){
    if(timer){resetTimer();return;}
    if(!state)return;
    timer=setInterval(()=>{if(!commit('TEMPO.AVANCAR_DIA'))resetTimer();},Math.round(1900/speed));setText('pause-btn','Ⅱ Pausar');
  }
  function bind(){
    $('career-form').addEventListener('submit',e=>{e.preventDefault();const name=$('player-name').value,companyName=$('company-name').value,cityId=$('start-city').value;commit('CARREIRA.CRIAR',{name,companyName,cityId,seed:(Date.now()>>>0)});});
    for(const button of document.querySelectorAll('[data-tab]'))button.addEventListener('click',()=>goto(button.dataset.tab));
    for(const button of document.querySelectorAll('[data-go]'))button.addEventListener('click',()=>goto(button.dataset.go));
    $('unit-switch').addEventListener('change',e=>{if(e.target.value)commit('EMPRESA.ATIVAR',{businessId:e.target.value});});
    $('finance-scope').addEventListener('change',e=>{financeScope=e.target.value;renderFinances();});
    $('unit-rows').addEventListener('click',e=>{const btn=e.target.closest('[data-unit-activate]');if(btn)commit('EMPRESA.ATIVAR',{businessId:btn.dataset.unitActivate});});
    $('explore-city').addEventListener('change',e=>{viewCityId=e.target.value;render();updateOpenPreview();});
    $('map-canvas').addEventListener('click',e=>{const target=e.target.closest('[data-lot]');if(target){selectedLot=Number(target.dataset.lot);render();updateOpenPreview();}});
    $('map-canvas').addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){const target=e.target.closest('[data-lot]');if(target){e.preventDefault();selectedLot=Number(target.dataset.lot);render();}}});
    $('map-open-company').addEventListener('click',()=>{goto('empresa');$('sector-select').focus();});
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
    $('new-career-btn').addEventListener('click',()=>{if(!confirm('Deseja abandonar a carreira atual? Exporte um backup JSON antes de começar outra.'))return;resetTimer();setText('price-change-feedback','Alterações de preços serão confirmadas aqui.');try{localStorage.removeItem(KEY);}catch(e){notify('Não foi possível limpar a cópia do navegador; confira seu backup.',true);}state=null;viewCityId=null;financeQuery=null;financeScope='all';render();notify('Nova carreira: preencha os dados iniciais. Exporte um backup para preservar a carreira anterior.');});
  }
  function updateOpenPreview(){const s=Core.SECTORS[$('sector-select').value],city=Core.cityById(viewCityId);if(s)setText('open-preview',`Abertura em ${city?.name||'cidade selecionada'} · lote ${String(selectedLot).padStart(2,'0')} · investimento ${Core.money(s.openCost)} do caixa compartilhado · ramo: ${s.name}.`);}
  function start(){
    cityOptions();bind();updateOpenPreview();
    try{const raw=localStorage.getItem(KEY);if(raw){const loaded=Core.importSave(raw);state=loaded.state;viewCityId=business()?.cityId||state.player.cityId;autosaveStatus='Cópia local verificada neste navegador; mantenha backup JSON externo.';}}
    catch(e){autosaveStatus='Não foi possível recuperar o salvamento local; importe backup JSON.';notify(autosaveStatus+' '+e.message,true);}
    render();goto('cidade');
  }
  start();
})();
