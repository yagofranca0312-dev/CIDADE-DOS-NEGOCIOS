/* V2.0: fragmento de visualização, incorporado à mesma closure pelo build. */
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
    renderRestock();
  }

  let toastTimer;
  const nextId=()=>`ui:${Date.now()}:${++sequence}`;


// Patch A V3.0: a proposta é consulta pura e a ordem depende de clique, confirmação
// e validação novamente no core. Nunca comprar ao mudar o select ou ao renderizar.
let balanceQuote=null;
function renderBalancePlan(){
  const unit=business(),summary=$('v300a-summary'),lines=$('v300a-lines');
  if(!unit){
    balanceQuote=null;
    summary.innerHTML='<dt>Plano</dt><dd>Abra sua primeira unidade.</dd>';
    lines.innerHTML='<tr><td colspan="6">Nenhuma unidade aberta.</td></tr>';
    $('v300a-price-scenarios').innerHTML='<tr><td colspan="4">Sem produto principal.</td></tr>';
    $('v300a-apply').disabled=true;
    setText('v300a-flags','Sem unidade para analisar.');
    return;
  }
  try{
    const quote=Core.operationalBalanceReport(state,$('v300a-mode').value);
    balanceQuote=quote;
    const fields=[
      ['Estratégia',quote.modeLabel+' · fornecedor '+quote.supplierId+' ('+quote.supplierLeadDays+' dia(s))'],
      ['Caixa efetivo',Core.money(quote.cashCents)],
      ['Passivos reconhecidos',Core.money(quote.recognizedLiabilitiesCents)+' (não abatidos automaticamente)'],
      ['Custo fixo diário do grupo',Core.money(quote.fixedDailyCents)],
      ['Reserva operacional sugerida',quote.reserveDays+' dias · '+Core.money(quote.reservedCents)],
      ['Orçamento após reserva',Core.money(quote.availableBudgetCents)],
      ['Compra planejada agora',Core.money(quote.spendCents)],
      ['Caixa após eventual compra',Core.money(quote.postPurchaseCashCents)]
    ];
    summary.innerHTML=fields.map(x=>'<dt>'+escape(x[0])+'</dt><dd>'+escape(x[1])+'</dd>').join('');
    lines.innerHTML=quote.products.map(p=>'<tr><td>'+escape(p.name)+'</td><td>'+
      escape(String(p.demandDaily))+(p.sampleDays?' (observada)':' (inicial)')+'</td><td>'+
      (p.stockUnits+p.incomingQty)+'</td><td>'+p.recommendedQty+'</td><td>'+
      p.quantity+'</td><td>'+escape(Core.money(p.spendCents))+'</td></tr>').join('');
    const primary=quote.products.find(p=>p.productId==='base')||quote.products[0];
    $('v300a-price-scenarios').innerHTML=primary.priceScenarios.map(x=>
      '<tr><td>'+escape(x.label)+'</td><td>'+escape(Core.money(x.priceCents))+
      '</td><td>'+x.potentialDailyUnits+'</td><td>'+
      escape(Core.money(x.potentialGrossContributionCents))+'</td></tr>').join('');
    $('v300a-apply').disabled=!quote.lines.length||quote.spendCents<=0;
    setText('v300a-flags',quote.flags.length?
      quote.flags.map(x=>x.id+': '+x.label).join(' | '):
      'Sem alertas quantitativos deste plano. Isso não garante lucro futuro.');
    setText('v300a-status','Cotação '+quote.quoteId+' · revisão '+quote.revision+
      '. Preço e estoque continuam inalterados até uma compra ser confirmada.');
  }catch(error){
    balanceQuote=null;$('v300a-apply').disabled=true;
    setText('v300a-status','Proposta indisponível: '+error.message);
  }
}
function bindBalancePlan(){
  $('v300a-mode').addEventListener('change',()=>{balanceQuote=null;renderBalancePlan();});
  $('v300a-apply').addEventListener('click',()=>{
    if(!state?.player?.cityId||!business())return;
    resetTimer();
    const previous=balanceQuote,quote=Core.operationalBalanceReport(state,$('v300a-mode').value);
    if(!previous||quote.quoteId!==previous.quoteId||
       quote.revision!==previous.revision||quote.businessId!==previous.businessId){
      balanceQuote=null;renderBalancePlan();
      notify('O estado ou os valores do plano mudaram. Confira novamente antes de comprar.',true);
      return;
    }
    if(!quote.lines.length){notify('Nenhuma compra viável neste perfil.',true);return;}
    const message='CONFIRMAR COMPRA DO JOGO?\n'+
      'Unidade: '+quote.businessId+'\nEstratégia: '+quote.modeLabel+
      '\nFornecedor: '+quote.supplierId+' · entrega '+quote.supplierLeadDays+' dia(s)'+
      '\nPedido: '+quote.lines.map(x=>x.productId+' '+x.quantity+' un.').join(', ')+
      '\nPagamento imediato: '+Core.money(quote.spendCents)+
      '\nReserva de '+quote.reserveDays+' dia(s): '+Core.money(quote.reservedCents)+
      '\nCaixa após a compra: '+Core.money(quote.postPurchaseCashCents)+
      '\nNão haverá compra sem esta confirmação. O saldo é fictício.';
    if(!confirm(message))return;
    if(state.revision!==quote.revision||business()?.id!==quote.businessId){
      balanceQuote=null;renderBalancePlan();notify('Carreira mudou; cotação cancelada.',true);return;
    }
    commit('ECONOMIA.COMPRAR_PLANO',{businessId:quote.businessId,mode:quote.mode,
      revision:quote.revision,quoteId:quote.quoteId});
  });
}
