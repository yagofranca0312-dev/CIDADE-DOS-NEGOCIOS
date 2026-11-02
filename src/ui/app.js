/* Cidade dos Negócios 1 — interface. Sem regras econômicas e sem RNG. */
(() => {
  'use strict';
  const Core=CidadeCore;
  const $=id=>document.getElementById(id);
  const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const BRDate=iso=>iso.split('-').reverse().join('/');
  const KEY='cidade-dos-negocios-save-v1';
  let state=null,viewCityId=null,selectedLot=1,tab='cidade',timer=null,speed=1,sequence=0,autosaveStatus='Backup JSON recomendado';
  let financeQuery=null; // preferência de consulta da interface, independente do GameState
  // Carrinho é estado transitório da interface; apenas a venda confirmada entra no save.
  let cart=[];
  const business=()=>state?.world?.business||null;
  function chooseProduct(id){const b=business();return b?.products?.find(p=>p.id===$(id)?.value)||b?.products?.[0]||null;}
  function refillSelect(id,products){
    const select=$(id),previous=select.value;
    select.replaceChildren(...products.map(p=>{const option=document.createElement('option');option.value=p.id;option.textContent=p.name;return option;}));
    if(products.some(p=>p.id===previous))select.value=previous;
  }
  function renderCart(){
    const b=business(),items=cart.map(entry=>({entry,p:b?.products.find(p=>p.id===entry.productId)})).filter(x=>x.p);
    const total=items.reduce((n,x)=>n+x.entry.quantity*x.p.priceCents,0);
    $('cart-items').innerHTML=items.length?items.map(({entry,p})=>`<div class="cart-row"><span>${escape(p.name)} · ${entry.quantity} × ${escape(Core.money(p.priceCents))}</span><button type="button" class="btn btn-outline" data-cart-remove="${escape(p.id)}" aria-label="Remover ${escape(p.name)}">Remover</button></div>`).join(''):'<p class="muted">Carrinho vazio.</p>';
    setText('cart-total',Core.money(total));$('cart-checkout').disabled=!items.length;
  }
  function renderCommerce(){
    const b=business(),products=b?.products||[];
    for(const id of ['buy-product','price-product','sale-product'])refillSelect(id,products);
    const suppliers=Core.SUPPLIERS,$supplier=$('buy-supplier'),previous=$supplier.value;
    $supplier.replaceChildren(...suppliers.map(s=>{const opt=document.createElement('option');opt.value=s.id;opt.textContent=s.name;return opt;}));
    if(suppliers.some(x=>x.id===previous))$supplier.value=previous;
    const chosenPrice=chooseProduct('price-product');
    setText('product-count',`${products.length} produto(s)`);
    const stats=b?Core.productPerformance(state):[];
    $('catalog-rows').innerHTML=stats.length?stats.map(p=>`<tr><td>${escape(p.name)}</td><td>${p.stockUnits}</td><td>${escape(Core.money(p.costCents))}</td><td>${escape(Core.money(p.priceCents))}</td><td>${p.sold}</td><td>${escape(Core.money(p.revenue))}</td><td>${escape(Core.money(p.cogs))}</td></tr>`).join(''):'<tr><td colspan="7">Abra uma empresa para ver o catálogo.</td></tr>';
    const orders=b?.purchaseOrders||[],sales=b?.sales||[];
    $('recent-purchases').innerHTML=orders.length?orders.slice(-6).reverse().map(o=>`<div class="commerce-history-row">${escape(BRDate(o.date))} · ${escape(o.id)} · ${escape(o.items.map(x=>x.quantity+'× '+x.name).join(', '))} · ${escape(Core.money(o.total))}</div>`).join(''):'<p class="muted">Nenhuma compra registrada nesta edição.</p>';
    $('recent-sales').innerHTML=sales.length?sales.slice(-6).reverse().map(o=>`<div class="commerce-history-row">${escape(BRDate(o.date))} · ${escape(o.id)} · ${escape(o.kind)} · ${escape(Core.money(o.total))} · CMV ${escape(Core.money(o.cogs))}</div>`).join(''):'<p class="muted">Nenhuma venda detalhada registrada nesta edição.</p>';
    setText('your-current-price',chosenPrice?Core.money(chosenPrice.priceCents):'—');
    setText('competitor-price',chosenPrice?Core.money(Math.round(chosenPrice.referenceCents*state.world.competitor.priceIndex/100)):'—');
    if(chosenPrice&&document.activeElement!==$('price-value'))$('price-value').value=(chosenPrice.priceCents/100).toFixed(2);
    updateBuyPreview();renderCart();
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
      report=Core.financialReport(state,q.period,params.date,params.range);
      $('finance-validation').hidden=true;setText('finance-validation','');
    }catch(e){
      $('finance-validation').hidden=false;setText('finance-validation',e.message);
      setText('finance-period-label','Corrija o período selecionado para consultar o demonstrativo.');
      $('finance-summary').innerHTML='';setText('journal-count','—');
      $('journal-events').innerHTML='<p class="muted">Período inválido. Nenhum dado foi alterado.</p>';
      return;
    }
    setText('finance-period-label',`${report.label} · lançamentos até ${BRDate(report.effectiveEnd)}. Saldos acumulados no encerramento. Consulta fixa até você alterar os filtros.`);
    const rows=[
      ['Receita de vendas (período)',report.revenue],
      ['(-) Custo das mercadorias vendidas',report.cogs],
      ['Lucro bruto (período)',report.grossProfit],
      ['(-) Despesas operacionais',report.expenses],
      ['Resultado antes dos tributos',report.profit],
      ['Caixa acumulado no encerramento',report.closingCash],
      ['Estoque contabilizado no encerramento',report.closingInventory],
      ['Obrigações acumuladas a pagar',report.closingPayable]
    ];
    $('finance-summary').innerHTML=rows.map((x,i)=>`<dt class="${i===4?'emphasis':''}">${escape(x[0])}</dt><dd class="${i===4?'emphasis':''}">${escape(Core.money(x[1]))}</dd>`).join('');
    setText('journal-count',`${report.entries.length} registros`);
    $('journal-events').innerHTML=report.entries.length?report.entries.slice(-8).reverse().map(j=>`<div class="event-item"><i class="event-dot"></i><div><p>${escape(j.memo)}</p><small>${escape(BRDate(j.date))} · ${escape(j.id)}</small></div></div>`).join(''):'<p class="muted">Nenhum lançamento neste período.</p>';
  }
  function resetTimer(){if(timer){clearInterval(timer);timer=null;}setText('pause-btn','▶ Jogar');}
  function commit(type,payload={}){
    if(type==='CARREIRA.CRIAR'){resetTimer();financeQuery=null;cart=[];}
    const result=Core.dispatch(state,{type,id:nextId(),payload});
    if(!result.ok){notify(result.error,true);return false;}
    if(result.status==='APPLIED'){state=result.state;viewCityId=viewCityId??state.player.cityId;saveLocal();render();}
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
  function svgMap(city,own,lot){
    // SVG estilizado original: cada grupo tem identificação de lote, sem dependências externas.
    const seed=city.name.length+city.id.length;
    const fragments=[`<svg viewBox="180 10 600 360" xmlns="http://www.w3.org/2000/svg" aria-label="Mapa isométrico fictício de ${escape(city.name)}">`,
      `<defs><linearGradient id="sea" x1="0" x2="1" y1="0" y2="1"><stop stop-color="#1e5270"/><stop offset="1" stop-color="#0b2639"/></linearGradient><filter id="glow"><feGaussianBlur stdDeviation="4"/></filter></defs>`,
      `<path d="M0 325 Q180 310 280 370 T800 340 L870 410H0Z" fill="#16516e" opacity=".42"/>`,
      `<path d="M145 155 L436 19 L813 196 L519 366Z" fill="#102d3b" opacity=".9"/>`];
    for(let row=0;row<3;row++)for(let col=0;col<6;col++){
      const num=row*6+col+1,x=392+(col-row)*57,y=91+(col+row)*26;
      const isOwn=own?.lot===num,isSelected=lot===num;
      const ground=isOwn?'#9e8144':isSelected?'#3f8bb2':'#42665f';
      const roofs=['#487d8c','#316275','#607387','#597c80','#425a6b'];
      const roof=isOwn?'#e8b55f':roofs[(num+seed)%roofs.length];
      const height=isOwn?42:14+((num*7+seed)%4)*9;
      const xx=x,yy=y,wide=49,tall=23;
      fragments.push(`<g data-lot="${num}" tabindex="0" role="button" aria-label="Selecionar lote ${num}"><title>Lote ${String(num).padStart(2,'0')} · clique para selecionar</title>`);
      if(isSelected)fragments.push(`<ellipse cx="${xx}" cy="${yy+12}" rx="65" ry="37" fill="#6dc9ff" opacity=".16" filter="url(#glow)"/>`);
      fragments.push(`<polygon points="${xx},${yy-tall} ${xx+wide},${yy} ${xx},${yy+tall} ${xx-wide},${yy}" fill="${ground}" stroke="${isSelected?'#9bdbff':'#416773'}" stroke-width="${isSelected?3:1.7}"/>`);
      if(num%5===0&&!isOwn){
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
    fragments.push(`<text x="208" y="40" fill="#9fbfd2" font-size="15" font-weight="700" letter-spacing="3">${escape(city.name.toUpperCase())} · ${escape(city.uf)}</text><text x="208" y="60" fill="#7eabc0" font-size="10">DISTRITO COMERCIAL FICTÍCIO</text></svg>`);
    return fragments.join('');
  }
  function eventsHTML(events){if(!events.length)return '<p class="muted">Nenhum evento registrado ainda.</p>';return events.map(e=>`<div class="event-item"><i class="event-dot"></i><div><p>${escape(e.text)}</p><small>${escape(e.date)} · ${escape(e.type)}</small></div></div>`).join('');}
  function render(){
    const started=!!state?.player?.cityId;
    $('onboarding').hidden=started;$('game-shell').hidden=!started;
    if(!started)return;
    const b=state.world.business,info=Core.overview(state),ownCity=Core.cityById(state.player.cityId);
    const visibleCity=Core.cityById(viewCityId)||ownCity;
    viewCityId=visibleCity.id;
    setText('top-city',`${visibleCity.name} · ${visibleCity.uf}`);
    $('explore-city').value=visibleCity.id;
    setText('date-label',BRDate(state.calendar.date));
    setText('kpi-cash',Core.money(info.cash));setText('kpi-revenue',Core.money(info.revenue));setText('kpi-profit',Core.money(info.profit));setText('kpi-stock',info.stock);
    setText('kpi-stock-label',b?`${b.products.length} produtos cadastrados · unidades totais`:'Sem estoque');
    $('other-city-warning').hidden=visibleCity.id===ownCity.id;
    setText('map-title',`Distrito comercial de ${visibleCity.name}`);setText('map-uf',visibleCity.uf);
    $('map-canvas').innerHTML=svgMap(visibleCity,visibleCity.id===ownCity.id?b:null,selectedLot);
    setText('selected-lot',`Lote ${String(selectedLot).padStart(2,'0')} de 18`);
    $('map-open-company').disabled=!!b||visibleCity.id!==ownCity.id;
    setText('city-events','');$('city-events').innerHTML=eventsHTML(state.audit.events.slice(-6).reverse());
    $('company-empty').hidden=!!b;$('company-active').hidden=!b;
    setText('company-status',b?'EM OPERAÇÃO':'NÃO INAUGURADA');
    $('buy-form').querySelector('button').disabled=!b;$('price-form').querySelector('button').disabled=!b;
    if(b){const s=Core.SECTORS[b.sector];setText('company-glyph',s.glyph);setText('company-title',`${state.player.companyName} · ${s.name}`);setText('company-product',`${b.products.length} produto(s) cadastrados`);setText('company-location',`${ownCity.name} / ${ownCity.uf} · lote ${String(b.lot).padStart(2,'0')}`);setText('company-sold',b.totalSold);setText('company-price',Core.money(b.unitPrice));setText('company-payable',Core.money(info.payable));
      setText('market-product','Escolha o produto e o fornecedor. Custos unitários são simulados.');
      setText('your-current-price',Core.money(b.unitPrice));
      setText('competitor-price',Core.money(Math.round(s.recommended*state.world.competitor.priceIndex/100)));
      if(document.activeElement!==$('price-value'))$('price-value').value=(b.unitPrice/100).toFixed(2);
      updateBuyPreview();
    }else{setText('market-product','Abra uma empresa antes de comprar mercadorias.');setText('your-current-price','—');setText('competitor-price','—');setText('buy-total','—');}
    renderCommerce();renderPriceHistory();
    if(tab==='financas'||financeQuery)renderFinances();
    const report=Core.diagnostics(state);
    $('diagnostic-details').innerHTML=[['Versão do jogo',Core.VERSION],['Schema',String(state.schemaVersion)],['Revisão',String(state.revision)],['Cidade ativa',ownCity.name],['Cidades / UFs',`${report.cities} / ${report.ufs}`],['Dias concluídos',String(report.tick)],['Eventos confirmados',String(report.events)],['Checksum local',report.checksum],['Cobertura fiscal','NOT_COVERED']].map(x=>`<dt>${escape(x[0])}</dt><dd>${escape(x[1])}</dd>`).join('');
    setText('turn-message',!b?'Abra sua primeira empresa.':b.stockUnits===0?'Seu estoque está vazio. Reabasteça.':`Sua empresa está operando há ${state.calendar.tick} dia(s).`);
    setText('turn-subtext',!b?'Clique em um lote para iniciar.':`${b.products.length} produtos · Estoque total ${b.stockUnits} un. · próximo dia ${BRDate(state.calendar.date)}.`);
    setText('autosave-label',autosaveStatus);
    setText('footer-state',autosaveStatus.startsWith('Cópia')?'Cópia local verificada · backup JSON recomendado':'Backup JSON recomendado');
  }
  function updateBuyPreview(){
    if(!state?.world.business)return;
    const qty=Number($('buy-quantity').value),p=chooseProduct('buy-product');
    setText('buy-total',p&&Number.isInteger(qty)&&qty>0?`Custo unitário: ${Core.money(p.costCents)} · total: ${Core.money(qty*p.costCents)} (caixa: ${Core.money(Core.overview(state).cash)})`:'Informe uma quantidade válida.');
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
    try{const incoming=Core.importSave(await file.text());resetTimer();state=incoming.state;viewCityId=state.player.cityId;selectedLot=1;financeQuery=null;cart=[];saveLocal();render();notify(incoming.message);}
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
    $('explore-city').addEventListener('change',e=>{viewCityId=e.target.value;render();});
    $('map-canvas').addEventListener('click',e=>{const target=e.target.closest('[data-lot]');if(target){selectedLot=Number(target.dataset.lot);render();}});
    $('map-canvas').addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){const target=e.target.closest('[data-lot]');if(target){e.preventDefault();selectedLot=Number(target.dataset.lot);render();}}});
    $('map-open-company').addEventListener('click',()=>{goto('empresa');$('sector-select').focus();});
    $('sector-select').addEventListener('change',updateOpenPreview);
    $('open-form').addEventListener('submit',e=>{e.preventDefault();if(!state||viewCityId!==state.player.cityId){notify('Volte à cidade de origem para abrir o negócio.',true);return;}if(commit('EMPRESA.ABRIR',{sector:$('sector-select').value,lot:selectedLot}))goto('cidade');});
    $('buy-quantity').addEventListener('input',updateBuyPreview);
    $('buy-product').addEventListener('change',updateBuyPreview);
    $('price-product').addEventListener('change',()=>{const p=chooseProduct('price-product');if(p)$('price-value').value=(p.priceCents/100).toFixed(2);renderCommerce();});
    $('sale-product').addEventListener('change',()=>renderCart());
    $('product-form').addEventListener('submit',e=>{e.preventDefault();
      const name=$('new-product-name').value,costCents=Math.round(Number($('new-product-cost').value)*100),priceCents=Math.round(Number($('new-product-price').value)*100);
      if(commit('PRODUTO.CADASTRAR',{name,costCents,priceCents})){$('product-form').reset();notify('Produto cadastrado. Agora você pode comprar estoque.');}
    });
    $('cart-add').addEventListener('click',()=>{
      const p=chooseProduct('sale-product'),quantity=Number($('sale-quantity').value);
      if(!p||!Number.isInteger(quantity)||quantity<1||quantity>2000){notify('Informe uma quantidade válida (1–2000).',true);return;}
      const existing=cart.find(x=>x.productId===p.id),current=existing?.quantity||0;
      if(current+quantity>p.stockUnits){notify(`Estoque insuficiente para ${p.name}.`,true);return;}
      if(existing)existing.quantity+=quantity;else cart.push({productId:p.id,quantity});renderCart();
    });
    $('cart-items').addEventListener('click',e=>{const btn=e.target.closest('[data-cart-remove]');if(btn){cart=cart.filter(x=>x.productId!==btn.dataset.cartRemove);renderCart();}});
    $('cart-clear').addEventListener('click',()=>{cart=[];renderCart();});
    $('cart-checkout').addEventListener('click',()=>{if(commit('VENDA.REGISTRAR',{items:cart.map(x=>({...x}))})){cart=[];renderCart();notify('Venda confirmada no caixa, na receita e no CMV.');}});

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
    $('price-form').addEventListener('submit',e=>{e.preventDefault();const p=chooseProduct('price-product'),value=$('price-value').value,cents=Math.round(Number(value)*100),before=p?.priceCents;if(commit('PRECO.DEFINIR',{productId:p?.id,cents})){const after=state.world.business.products.find(x=>x.id===p.id).priceCents;const message=`Preço de ${p.name} atualizado: ${Core.money(before)} → ${Core.money(after)}.`;setText('price-change-feedback',message);notify(message);}});
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
    $('new-career-btn').addEventListener('click',()=>{if(!confirm('Deseja abandonar a carreira atual? Exporte um backup JSON antes de começar outra.'))return;resetTimer();setText('price-change-feedback','Alterações de preços serão confirmadas aqui.');try{localStorage.removeItem(KEY);}catch(e){notify('Não foi possível limpar a cópia do navegador; confira seu backup.',true);}state=null;viewCityId=null;financeQuery=null;cart=[];render();notify('Nova carreira: preencha os dados iniciais. Exporte um backup para preservar a carreira anterior.');});
  }
  function updateOpenPreview(){const s=Core.SECTORS[$('sector-select').value];if(s)setText('open-preview',`Investimento inicial simulado: ${Core.money(s.openCost)} · Produto: ${s.product}`);}
  function start(){
    cityOptions();bind();updateOpenPreview();
    try{const raw=localStorage.getItem(KEY);if(raw){const loaded=Core.importSave(raw);state=loaded.state;viewCityId=state.player.cityId;autosaveStatus='Cópia local verificada neste navegador; mantenha backup JSON externo.';}}
    catch(e){autosaveStatus='Não foi possível recuperar o salvamento local; importe backup JSON.';notify(autosaveStatus+' '+e.message,true);}
    render();goto('cidade');
  }
  start();
})();
