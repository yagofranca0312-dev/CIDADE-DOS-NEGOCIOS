  // Módulo V2.8: logística é leitura + comandos confirmados; jamais executa sugestões automaticamente.
  function logisticsSiteOptions(){
    const rows=Core.businesses(state).map(b=>[b.id,b.id+' · '+Core.cityById(b.cityId).name+' · '+Core.SECTORS[b.sector].name]);
    if(Core.logisticsReport(state).depot)rows.push(['CD-1','CD-1 · centro de distribuição']);
    return rows;
  }
  function logisticsLocationProducts(siteId){
    const depot=Core.logisticsReport(state).depot;
    if(siteId==='CD-1')return (depot?.stock||[]).filter(p=>p.stockUnits>0).map(p=>({
      key:p.sector+'::'+p.productId,name:p.name,sector:p.sector,productId:p.productId,stock:p.stockUnits
    }));
    const b=Core.businessById(state,siteId);
    return (b?.products||[]).filter(p=>p.stockUnits>0).map(p=>({
      key:b.sector+'::'+p.id,name:p.name,sector:b.sector,productId:p.id,stock:p.stockUnits
    }));
  }
  function logisticsRoutePreview(){
    const fromId=$('logistics-transfer-from').value,toId=$('logistics-transfer-to').value,
      quantity=Number($('logistics-transfer-quantity').value);
    const key=$('logistics-transfer-product').value,available=logisticsLocationProducts(fromId).find(p=>p.key===key)?.stock||0;
    try{
      const q=Core.logisticsRouteQuote(state,fromId,toId,quantity);
      $('logistics-transfer-submit').disabled=!key||quantity>available;
      setText('logistics-route-preview','Distância: índice abstrato '+q.distanceUnits+' (NÃO km) · Prazo fictício '+q.days+
        ' dia(s) · frete '+Core.money(q.feeCents)+' · desconto CD '+Core.money(q.discountCents)+
        ' · origem '+available+' un.');
    }catch(e){
      $('logistics-transfer-submit').disabled=true;
      setText('logistics-route-preview','Rota indisponível: '+e.message);
    }
  }
  function logisticsRefreshTransferProducts(){
    const rows=logisticsLocationProducts($('logistics-transfer-from').value)
      .map(p=>[p.key,p.name+' · '+Core.SECTORS[p.sector].name+' · '+p.stock+' un.']);
    setCreditOptions('logistics-transfer-product',rows);
    logisticsRoutePreview();
  }
  function logisticsRefillProducts(unitId,productId){
    const b=Core.businessById(state,$(unitId).value);
    setCreditOptions(productId,(b?.products||[]).map(p=>[p.id,p.name+' · '+p.stockUnits+' un.']));
  }
  function renderLogistics(){
    if(!state?.player?.cityId)return;
    const report=Core.logisticsReport(state),units=Core.businesses(state),places=logisticsSiteOptions(),
      suggestions=Core.logisticsSuggestions(state);
    const transit=report.transfers.filter(t=>t.status==='PENDING').reduce((n,t)=>n+t.quantity,0);
    const overview=[
      ['Estoque físico (lojas + CD)',report.totalPhysicalUnits+' un.'],
      ['Viagens em trânsito',report.transfers.filter(t=>t.status==='PENDING').length+' · '+transit+' un.'],
      ['Fretes acumulados',Core.money(report.metrics.fees||0)],
      ['Perdas contabilizadas',Core.money(report.metrics.waste||0)],
      ['Unidades produzidas',String(report.metrics.produced||0)],
      ['Caixa consolidado',Core.money(Core.overview(state).cash)]
    ];
    $('logistics-summary').innerHTML=overview.map(x=>'<dt>'+escape(x[0])+'</dt><dd>'+escape(x[1])+'</dd>').join('');
    const data=units.map(b=>({id:b.id,cityId:b.cityId,stock:b.stockUnits,
      value:b.products.reduce((n,p)=>n+p.stockValueCents,0)}));
    if(report.depot)data.push({id:'CD-1',cityId:report.depot.cityId,
      stock:report.depot.stock.reduce((n,p)=>n+p.stockUnits,0),
      value:report.depot.stock.reduce((n,p)=>n+p.stockValueCents,0)});
    $('logistics-sites').innerHTML=data.map(d=>'<tr><td>'+escape(d.id)+'</td><td>'+
      escape(Core.cityById(d.cityId).name)+'</td><td>'+d.stock+'</td><td>'+
      escape(Core.money(d.value))+'</td></tr>').join('')||
      '<tr><td colspan="4">Abra ao menos uma unidade.</td></tr>';
    setCreditOptions('logistics-transfer-from',places);
    setCreditOptions('logistics-transfer-to',places.filter(p=>p[0]!==$('logistics-transfer-from').value));
    logisticsRefreshTransferProducts();
    setCreditOptions('logistics-depot-city',Core.CITIES.map(c=>[c.id,c.name+' / '+c.uf]));
    $('logistics-depot-open-form').hidden=!!report.depot;
    $('logistics-depot-buy-form').hidden=!report.depot;
    setText('logistics-depot-status',report.depot?
      'CD em '+Core.cityById(report.depot.cityId).name+' · '+report.depot.stock.reduce((n,p)=>n+p.stockUnits,0)+
        '/2.000 un. · despesa diária '+Core.money(report.depotDailyCents):
      'Nenhum CD ativo. Exige duas lojas, custo de abertura e manutenção fictícios.');
    $('logistics-depot-open').disabled=units.length<2||!!report.depot;
    setCreditOptions('logistics-depot-unit',units.map(b=>[b.id,b.id+' · '+Core.SECTORS[b.sector].name]));
    logisticsRefillProducts('logistics-depot-unit','logistics-depot-product');
    $('logistics-depot-buy').disabled=!report.depot||!units.length;
    $('logistics-depot-stock').innerHTML=(report.depot?.stock||[]).filter(p=>p.stockUnits>0).map(p=>
      '<tr><td>'+escape(p.name+' · '+p.sector)+'</td><td>'+p.stockUnits+'</td><td>'+
      escape(Core.money(p.stockValueCents))+'</td></tr>').join('')||
      '<tr><td colspan="3">CD sem estoque.</td></tr>';
    $('logistics-depot-orders').innerHTML=report.depotPurchases.slice(-8).reverse().map(o=>
      '<div class="event-item"><div><strong>'+escape(o.id+' · '+o.productName)+'</strong><p>'+
      o.quantity+' un. · '+escape(Core.money(o.total))+' · '+escape(o.status)+'</p><small>'+
      escape(o.dueDate)+'</small></div></div>').join('')||'<p class="muted">Sem pedidos do CD.</p>';
    $('logistics-trip-rows').innerHTML=report.transfers.slice(-20).reverse().map(t=>
      '<tr><td>'+escape(t.id)+'</td><td>'+escape(t.fromId+' → '+t.toId)+'</td><td>'+
      escape(t.productName)+' · '+t.quantity+' un.</td><td>'+escape(t.dueDate)+'</td><td>'+
      escape(Core.money(t.valueCents))+' / '+escape(Core.money(t.feeCents))+'</td><td>'+
      escape(t.status==='PENDING'?'Em trânsito':t.lostQuantity?'Com perda':'Recebida')+'</td></tr>').join('')||
      '<tr><td colspan="6">Nenhuma transferência.</td></tr>';
    const bakeries=units.filter(b=>b.sector==='padaria');
    setCreditOptions('logistics-bakery-unit',bakeries.map(b=>[b.id,b.id+' · '+Core.cityById(b.cityId).name]));
    const bakery=Core.businessById(state,$('logistics-bakery-unit').value);
    const flour=bakery?.products.find(p=>p.id==='raw-farinha');
    $('logistics-enable-production').disabled=!bakery||!!flour;
    $('logistics-input-buy').disabled=!flour;
    $('logistics-produce').disabled=!flour||flour.stockUnits===0;
    setText('logistics-production-status',!bakery?'Abra uma padaria para iniciar.':
      !flour?'Habilite farinha como insumo. Sem retroagir sobre estoque antigo.':
      'Farinha disponível '+flour.stockUnits+' un. · pães '+bakery.products.find(p=>p.id==='base').stockUnits+
      ' un. · até 25 insumos por dia.');
    $('logistics-lot-rows').innerHTML=report.batches.slice(0,40).map(l=>
      '<tr><td>'+escape(l.locationId)+'</td><td>'+escape(l.sector+' · '+l.productId)+'</td><td>'+
      l.quantity+'</td><td>'+escape(l.expiresAt)+'</td></tr>').join('')||
      '<tr><td colspan="4">Nenhum lote novo rastreável.</td></tr>';
    $('logistics-proposal-rows').innerHTML=suggestions.slice(0,30).map((p,i)=>
      '<tr><td>'+escape(p.toId)+'</td><td>'+escape(p.sector+' · '+p.productId)+'</td><td>'+
      escape(p.kind==='TRANSFER'?'Transferir '+p.quantity+' un. de '+p.fromId+' · frete '+Core.money(p.route.feeCents):
        'Comprar '+p.quantity+' un. · estimativa '+Core.money(p.approximateValueCents))+
      '</td><td><button type="button" class="btn btn-outline" data-logistics-suggestion="'+i+
      '">Preparar</button></td></tr>').join('')||
      '<tr><td colspan="4">Sem alerta de reposição.</td></tr>';
    setCreditOptions('logistics-restock-unit',units.map(b=>[b.id,b.id+' · '+Core.SECTORS[b.sector].name]));
    logisticsRefillProducts('logistics-restock-unit','logistics-restock-product');
    const integrity=Core.reconciliationReport(state);
    setText('logistics-integrity',integrity.ok?
      'Conciliação atual: estoque, trânsito, CD, compensação e razão consistentes.':
      'Atenção — divergências: '+integrity.errors.join('; '));
  }
  function bindLogistics(){
    $('logistics-transfer-from').addEventListener('change',renderLogistics);
    $('logistics-transfer-to').addEventListener('change',logisticsRoutePreview);
    $('logistics-transfer-product').addEventListener('change',logisticsRoutePreview);
    $('logistics-transfer-quantity').addEventListener('input',logisticsRoutePreview);
    $('logistics-transfer-form').addEventListener('submit',e=>{
      e.preventDefault();
      const values=$('logistics-transfer-product').value.split('::');
      const payload={fromId:$('logistics-transfer-from').value,toId:$('logistics-transfer-to').value,
        sector:values[0],productId:values[1],quantity:Number($('logistics-transfer-quantity').value)};
      try{
        const quote=Core.logisticsRouteQuote(state,payload.fromId,payload.toId,payload.quantity);
        if(confirm('Transferir '+payload.quantity+' unidade(s)? Frete fictício '+Core.money(quote.feeCents)+
          ', '+quote.days+' dia(s) simulados. NÃO cria receita nem CMV.'))
          commit('LOGISTICA.TRANSFERIR',payload);
      }catch(err){notify(err.message,true);}
    });
    $('logistics-depot-open-form').addEventListener('submit',e=>{
      e.preventDefault();const cityId=$('logistics-depot-city').value;
      if(confirm('Instalar CD em '+Core.cityById(cityId).name+
        '? R$ 800 de implantação e R$ 8,50 por dia, somente no jogo.'))
        commit('LOGISTICA.CD.ABRIR',{cityId});
    });
    $('logistics-depot-unit').addEventListener('change',()=>logisticsRefillProducts('logistics-depot-unit','logistics-depot-product'));
    $('logistics-depot-buy-form').addEventListener('submit',e=>{
      e.preventDefault();
      const payload={businessId:$('logistics-depot-unit').value,productId:$('logistics-depot-product').value,
        supplierId:$('logistics-depot-supplier').value,quantity:Number($('logistics-depot-quantity').value)};
      if(confirm('Comprar '+payload.quantity+' unidades para o CD? Caixa será debitado e estoque ficará em trânsito.'))
        commit('LOGISTICA.CD.COMPRAR',payload);
    });
    $('logistics-bakery-unit').addEventListener('change',renderLogistics);
    $('logistics-enable-production').addEventListener('click',()=>{
      const businessId=$('logistics-bakery-unit').value;
      if(confirm('Habilitar farinha como insumo não comercial da padaria '+businessId+'?'))
        commit('LOGISTICA.PRODUCAO.HABILITAR',{businessId});
    });
    $('logistics-input-buy-form').addEventListener('submit',e=>{
      e.preventDefault();
      const payload={businessId:$('logistics-bakery-unit').value,
        supplierId:$('logistics-input-supplier').value,quantity:Number($('logistics-input-quantity').value)};
      if(confirm('Comprar '+payload.quantity+' unidades de farinha e pagar com caixa da rede?'))
        commit('LOGISTICA.INSUMO.COMPRAR',payload);
    });
    $('logistics-produce-form').addEventListener('submit',e=>{
      e.preventDefault();
      const payload={businessId:$('logistics-bakery-unit').value,inputQuantity:Number($('logistics-input-use').value)};
      if(confirm('Consumir '+payload.inputQuantity+' insumos e produzir '+(payload.inputQuantity*3)+
        ' pães perecíveis? Custo fabril adicional em caixa: '+Core.money(payload.inputQuantity*120)+'.'))
        commit('LOGISTICA.PRODUZIR',payload);
    });
    $('logistics-restock-unit').addEventListener('change',()=>logisticsRefillProducts('logistics-restock-unit','logistics-restock-product'));
    $('logistics-restock-form').addEventListener('submit',e=>{
      e.preventDefault();
      const payload={businessId:$('logistics-restock-unit').value,productId:$('logistics-restock-product').value,
        supplierId:$('logistics-restock-supplier').value,quantity:Number($('logistics-restock-quantity').value)};
      if(confirm('Confirmar compra direta de '+payload.quantity+' unidades? O caixa será debitado.'))
        commit('LOGISTICA.REABASTECER',payload);
    });
    $('logistics-proposal-rows').addEventListener('click',e=>{
      const btn=e.target.closest('button[data-logistics-suggestion]');if(!btn)return;
      const proposal=Core.logisticsSuggestions(state)[Number(btn.dataset.logisticsSuggestion)];
      if(!proposal)return;
      if(proposal.kind==='TRANSFER'){
        $('logistics-transfer-from').value=proposal.fromId;
        setCreditOptions('logistics-transfer-to',logisticsSiteOptions().filter(x=>x[0]!==proposal.fromId));
        $('logistics-transfer-to').value=proposal.toId;
        logisticsRefreshTransferProducts();
        $('logistics-transfer-product').value=proposal.sector+'::'+proposal.productId;
        $('logistics-transfer-quantity').value=proposal.quantity;
        logisticsRoutePreview();$('logistics-transfer-quantity').focus();
      }else{
        $('logistics-restock-unit').value=proposal.toId;
        logisticsRefillProducts('logistics-restock-unit','logistics-restock-product');
        $('logistics-restock-product').value=proposal.productId;
        $('logistics-restock-quantity').value=proposal.quantity;
        $('logistics-restock-quantity').focus();
      }
      notify('Proposta carregada para revisão. Nenhuma operação foi executada.');
    });
  }
