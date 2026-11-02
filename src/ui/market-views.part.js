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
  }

  let toastTimer;
  const nextId=()=>`ui:${Date.now()}:${++sequence}`;
