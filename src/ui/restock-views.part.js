/* V2.3-B — Assistente de reposição: interface, não motor econômico. */
function restockSupplierLimit(unit,row,supplier,date){
  const ordered=unit.purchaseOrders.filter(o=>o.date===date&&o.supplierId===supplier.id)
    .reduce((n,o)=>n+o.items.filter(x=>x.productId===row.id).reduce((s,x)=>s+x.quantity,0),0);
  return Math.max(0,Math.min(2000,supplier.maxDailyPerSku-ordered,100000-row.stock-row.inTransit));
}
function restockRoom(unit){
  const pending=unit.purchaseOrders.filter(o=>o.status==='PENDING').reduce((n,o)=>n+o.items.reduce((s,x)=>s+x.quantity,0),0);
  return Math.max(0,100000-unit.stockUnits-pending);
}
function prepareRestockPlan(unit,rows,supplier,mode,date,revision){
  let room=restockRoom(unit);
  const ranking=rows.slice().sort((a,b)=>a.coverageDays-b.coverageDays||a.id.localeCompare(b.id));
  const amounts=new Map();
  for(const row of ranking){
    const needed=mode==='criticos'&&!row.alert?0:row.recommended;
    const quantity=Math.max(0,Math.min(needed,restockSupplierLimit(unit,row,supplier,date),room));
    amounts.set(row.id,quantity);room-=quantity;
  }
  return {businessId:unit.id,revision,mode,supplierId:supplier.id,
    lines:rows.map(row=>({productId:row.id,selected:(amounts.get(row.id)||0)>0,quantity:amounts.get(row.id)||0}))};
}
function reviewRestockPlan(draft,unit,rows,supplier,cash,date,revision){
  const errors=[],inventory=new Map(rows.map(x=>[x.id,x])),products=new Map(unit?.products.map(x=>[x.id,x])||[]);
  if(!draft||!unit||!supplier||draft.businessId!==unit.id||draft.revision!==revision||draft.supplierId!==supplier.id)
    errors.push('Proposta desatualizada. Prepare novamente antes de comprar.');
  const items=[];let total=0,units=0;
  for(const line of draft?.lines||[]){
    if(!line.selected)continue;
    const row=inventory.get(line.productId),product=products.get(line.productId),q=Number(line.quantity);
    if(!row||!product){errors.push('Produto da proposta não localizado.');continue;}
    if(!Number.isInteger(q)||q<1||q>2000){errors.push('Quantidade inválida para '+row.name+' (1 a 2000).');continue;}
    const cap=restockSupplierLimit(unit,row,supplier,date);
    if(q>cap)errors.push('Limite do fornecedor ou capacidade individual excedidos: '+row.name+' (máximo '+cap+').');
    const price=Math.round(product.costCents*supplier.priceFactor/100);
    total+=q*price;units+=q;
    items.push({productId:row.id,name:row.name,quantity:q,unitCost:price,total:q*price});
  }
  if(!items.length)errors.push('Selecione ao menos um produto com quantidade positiva.');
  if(items.length>40)errors.push('Máximo de 40 produtos por pedido.');
  if(unit&&units>restockRoom(unit))errors.push('Capacidade total do depósito excedida.');
  if(unit&&unit.purchaseOrders.length>=20000)errors.push('Histórico de compras cheio.');
  if(!Number.isSafeInteger(total)||total>cash)errors.push('Caixa insuficiente para pagamento integral hoje.');
  return {valid:errors.length===0,errors,items,total,units,cash,remaining:cash-total};
}
function adjustRestockToBudget(draft,unit,rows,supplier,cash,date){
  const byId=new Map(rows.map(x=>[x.id,x])),products=new Map(unit.products.map(x=>[x.id,x]));
  let available=cash,room=restockRoom(unit);
  const ranking=draft.lines.filter(x=>x.selected).slice().sort((a,b)=>
    (byId.get(a.productId)?.coverageDays??Infinity)-(byId.get(b.productId)?.coverageDays??Infinity)||a.productId.localeCompare(b.productId));
  const allocations=new Map();
  for(const line of ranking){
    const row=byId.get(line.productId),product=products.get(line.productId);
    if(!row||!product)continue;
    const price=Math.round(product.costCents*supplier.priceFactor/100);
    const quantity=Math.max(0,Math.min(Number.isInteger(line.quantity)?line.quantity:0,restockSupplierLimit(unit,row,supplier,date),room,Math.floor(available/price)));
    allocations.set(line.productId,quantity);available-=quantity*price;room-=quantity;
  }
  for(const line of draft.lines){if(!line.selected)continue;line.quantity=allocations.get(line.productId)||0;line.selected=line.quantity>0;}
  return draft;
}
function renderRestockSummary(){
  const unit=business(),supplier=Core.SUPPLIERS.find(x=>x.id===restockDraft?.supplierId);
  const rows=unit?Core.inventoryReport(state):[];
  const review=reviewRestockPlan(restockDraft,unit,rows,supplier,unit?Core.overview(state).cash:0,state?.calendar?.date,state?.revision);
  $('restock-adjust-budget').disabled=!restockDraft||!review.items.length||review.total<=review.cash;
  $('restock-confirm').disabled=!restockDraft||!review.valid;
  $('restock-cancel').disabled=!restockDraft;
  if(!restockDraft){setText('restock-preview','Prepare o pedido para conferir quantidades, custo, caixa e prazo. Nenhuma compra foi realizada.');return;}
  setText('restock-preview',review.items.length+' produto(s) · '+review.units+' unidade(s) · total '+Core.money(review.total)+' · caixa '+Core.money(review.cash)+' · saldo após compra '+Core.money(review.remaining)+(review.errors.length?' · ATENÇÃO: '+review.errors.join(' '):' · Pronto para confirmação.'));
  for(const line of restockDraft.lines){
    const product=unit?.products.find(x=>x.id===line.productId);
    const el=document.querySelector('[data-restock-line-total="'+line.productId+'"]');
    if(el&&product&&supplier){
      const q=Number(line.quantity),price=Math.round(product.costCents*supplier.priceFactor/100);
      el.textContent=Core.money(line.selected&&Number.isInteger(q)&&q>=0?q*price:0);
    }
  }
}
function renderRestock(){
  const unit=business(),rows=unit?Core.inventoryReport(state):[],select=$('restock-supplier'),old=select.value;
  select.replaceChildren(...Core.SUPPLIERS.map(s=>{const o=document.createElement('option');o.value=s.id;o.textContent=s.name;return o;}));
  if(Core.SUPPLIERS.some(s=>s.id===old))select.value=old;
  const supplier=Core.SUPPLIERS.find(s=>s.id===select.value);
  $('restock-prepare').disabled=!unit;$('restock-fastest').disabled=!unit;$('restock-cheapest').disabled=!unit;
  const critical=rows.filter(x=>x.alert&&x.recommended>0).length,needed=rows.filter(x=>x.recommended>0).length;
  setText('restock-alerts',unit?critical+' produto(s) críticos · '+needed+' com necessidade de reposição. Mercadorias em trânsito consideradas.':'Abra uma empresa para planejar o abastecimento.');
  setText('restock-compare',Core.SUPPLIERS.map(s=>s.name+': custo '+s.priceFactor+'% da referência · '+s.leadDays+' dia(s) · máximo '+s.maxDailyPerSku+' un. por produto/dia.').join(' | '));
  setText('restock-terms',supplier?'Fornecedor: '+supplier.name+' · entrega em '+supplier.leadDays+' dia(s). Pagamento imediato com caixa do grupo.':'Selecione um fornecedor.');
  if(restockDraft&&(restockDraft.businessId!==unit?.id||restockDraft.revision!==state?.revision||restockDraft.supplierId!==supplier?.id))restockDraft=null;
  const table=$('restock-order-rows');
  if(!restockDraft)table.innerHTML='<tr><td colspan="8">Selecione um modo e prepare a proposta. A compra não é automática.</td></tr>';
  else{
    const byId=new Map(rows.map(x=>[x.id,x]));
    table.innerHTML=restockDraft.lines.map(line=>{
      const row=byId.get(line.productId),product=unit.products.find(x=>x.id===line.productId);
      const cap=restockSupplierLimit(unit,row,supplier,state.calendar.date),price=Math.round(product.costCents*supplier.priceFactor/100);
      return '<tr><td><label class="restock-check"><input type="checkbox" data-restock-check="'+escape(row.id)+'" '+(line.selected?'checked':'')+' aria-label="Incluir '+escape(row.name)+'"> '+escape(row.name)+'</label></td><td>'+row.stock+'</td><td>'+row.inTransit+'</td><td>'+row.coverageDays+' dias</td><td>'+row.recommended+'</td><td><input type="number" min="0" max="'+cap+'" step="1" value="'+line.quantity+'" data-restock-quantity="'+escape(row.id)+'" aria-label="Quantidade de '+escape(row.name)+'"></td><td>'+escape(Core.money(price))+'</td><td data-restock-line-total="'+escape(row.id)+'">'+escape(Core.money(line.selected?line.quantity*price:0))+'</td></tr>';
    }).join('');
  }
  renderRestockSummary();
}
