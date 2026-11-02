/* Cidade dos Negócios 1 — núcleo puro, sem DOM e sem rede. v1.6.0-rc.1 */
const CidadeCore = (() => {
  'use strict';
  const VERSION = '1.6.0-rc.1';
  const SCHEMA_VERSION = 7;
  const START_DATE = '2026-11-01';
  const MAX_SAVE_CHARS = 25_000_000;
  const CITIES_SOURCE = [
    ['AC','Rio Branco'],['AL','Maceió'],['AP','Macapá'],['AM','Manaus'],
    ['BA','Salvador'],['CE','Fortaleza'],['DF','Brasília'],['ES','Vitória'],
    ['GO','Goiânia'],['MA','São Luís'],['MT','Cuiabá'],['MS','Campo Grande'],
    ['MG','Belo Horizonte'],['PA','Belém'],['PB','João Pessoa'],['PR','Curitiba'],
    ['PE','Recife'],['PI','Teresina'],['RJ','Rio de Janeiro'],['RN','Natal'],
    ['RS','Porto Alegre'],['RO','Porto Velho'],['RR','Boa Vista'],['SC','Florianópolis'],
    ['SP','São Paulo'],['SE','Aracaju'],['TO','Palmas'],
    ['CE','Tianguá'],['CE','Sobral'],['CE','Ubajara']
  ];
  // Recorte offline verificável: IBGE, estimativas de população municipal em 1º/07/2026,
  // arquivo POP2026_20261029.pdf (atualizado em 29/10/2026). IDs municipais oficiais completos.
  // O mapeamento está em MESMA ordem de CITIES_SOURCE, acompanhado de testes de cobertura.
  const POPULATION_SOURCE=Object.freeze({
    id:'IBGE-POP2026-20261029',year:2026,referenceDate:'2026-07-01',publishedFile:'POP2026_20261029.pdf',
    url:'https://ftp.ibge.gov.br/Estimativas_de_Populacao/Estimativas_2026/POP2026_20261029.pdf'
  });
  const MUNICIPAL_POPULATION=Object.freeze([
    ['1200401',390058], ['2704302',995134], ['1600303',491987], ['1302603',2327101],
    ['2927408',2559945],['2304400',2582360],['5300108',3009996],['3205309',343935],
    ['5208707',1511709],['2111300',1090229],['5103403',698917],['5002704',970843],
    ['3106200',2415451],['1501402',1396157],['2507507',906093],['4106902',1832183],
    ['2611606',1588983],['2211001',908012],['3304557',6731133],['2408102',783196],
    ['4314902',1388791],['1100205',520379],['1400100',500965],['4205407',598370],
    ['3550308',11911337],['2800308',623328],['1721000',333154],['2313401',87757],
    ['2312908',217690],['2313609',34531]
  ]);
  if(MUNICIPAL_POPULATION.length!==CITIES_SOURCE.length)throw Error('Tabela municipal desatualizada');
  // Faixas do JOGO, não classificações oficiais do IBGE/REGIC.
  const sizeTier=pop=>pop<100000?'local':pop<500000?'regional':pop<1500000?'grande':'metropole';
  const TIER_LABELS=Object.freeze({local:'Mercado local',regional:'Centro regional simulado',grande:'Centro urbano de maior porte',metropole:'Metrópole simulada'});
  const COMPETITOR_FACTOR=Object.freeze({local:102,regional:100,grande:98,metropole:96});
  const PRICE_ELASTICITY=Object.freeze({local:1.25,regional:1.4,grande:1.55,metropole:1.7});
  const CITIES=Object.freeze(CITIES_SOURCE.map(([uf,name],index)=>{
    const [ibgeCode,population2026]=MUNICIPAL_POPULATION[index],tier=sizeTier(population2026);
    const factor=Math.max(80,Math.min(130,Math.round(100+14*Math.log10(population2026/150000))));
    return Object.freeze({
      id:`${uf}-${name.normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z\d]+/gi,'-').toUpperCase()}`,
      uf,name,capital:index<27,ibgeCode,population2026,populationYear:2026,populationReferenceDate:'2026-07-01',
      factor,sizeTier:tier,modelLabel:TIER_LABELS[tier],competitionFactor:COMPETITOR_FACTOR[tier],priceElasticity:PRICE_ELASTICITY[tier]
    });
  }));
  // PIB municipal 2023 e REGIC 2018 são bases externas oficiais, mas NÃO possuem
  // valores individualmente integrados/verificados neste pacote. Não inventar números.
  const ECONOMIC_REFERENCES=Object.freeze({
    population:POPULATION_SOURCE,
    gdp:Object.freeze({year:2023,available:false,url:'https://www.ibge.gov.br/estatisticas/economicas/contas-nacionais/9088-produto-interno-bruto-dos-municipios.html'}),
    regic:Object.freeze({year:2018,available:false,url:'https://www.ibge.gov.br/geociencias/organizacao-do-territorio/redes-e-fluxos-geograficos/15798-regioes-de-influencia-das-cidades.html'})
  });
  function regionalProfile(cityId){
    const city=CITIES.find(c=>c.id===cityId);
    if(!city)return null;
    return {cityId:city.id,name:city.name,uf:city.uf,ibgeCode:city.ibgeCode,population:city.population2026,
      populationYear:2026,referenceDate:POPULATION_SOURCE.referenceDate,source:POPULATION_SOURCE.url,
      tier:city.sizeTier,tierLabel:city.modelLabel,demandFactor:city.factor,competitionFactor:city.competitionFactor,
      priceElasticity:city.priceElasticity,gdp2023:null,regic2018:null,
      note:'Dados populacionais oficiais. Perfil, concorrência e potencial comercial: parâmetros simulados do jogo, não indicadores do IBGE.'};
  }
  function competitorReference(state,p,city){return p.referenceCents*state.world.competitor.priceIndex/100*city.competitionFactor/100;}
  function demandElasticity(price,reference,city){return clamp(1.32-(price/reference-1)*city.priceElasticity,.08,1.85);}

  const SECTORS = Object.freeze({
    mercado: Object.freeze({name:'Mercado de bairro', product:'Cesta de produtos', cost:3200, recommended:4900, openCost:750000, dailyCost:13500, demand:13, glyph:'🛒'}),
    padaria: Object.freeze({name:'Padaria', product:'Pão artesanal', cost:540, recommended:960, openCost:900000, dailyCost:15900, demand:22, glyph:'🥖'}),
    roupas: Object.freeze({name:'Loja de roupas', product:'Peça de vestuário', cost:4800, recommended:8500, openCost:1100000, dailyCost:11900, demand:8, glyph:'👕'})
  });
  const clone = value => JSON.parse(JSON.stringify(value));
  // Catálogo fictício de cada ramo. Valores em centavos para não gerar erro de ponto flutuante.
  const EXTRA_PRODUCTS=Object.freeze({
    mercado:[['Arroz 5 kg',2200,3400,7],['Óleo de cozinha',700,1100,7]],
    padaria:[['Bolo caseiro',900,1700,8],['Café coado',250,600,12]],
    roupas:[['Camiseta',2500,4900,6],['Calça jeans',6000,10500,4]]
  });
  // Condições fictícias de logística: unidade da capacidade é por SKU, por fornecedor, por dia.
  const SUPPLIERS=Object.freeze([
    Object.freeze({id:'regional',name:'Distribuidora Regional (fictícia)',leadDays:1,priceFactor:100,maxDailyPerSku:200}),
    Object.freeze({id:'atacado',name:'Atacado Comercial (fictício)',leadDays:3,priceFactor:94,maxDailyPerSku:500})
  ]);
  function initialProducts(sector,baseStock=0,basePrice=null) {
    const s=SECTORS[sector];
    const base=(id,name,costCents,priceCents,referenceCents,demand,stockUnits)=>({id,name,costCents,priceCents,referenceCents,demand,stockUnits,
      stockValueCents:stockUnits*costCents,reorderPoint:Math.max(5,demand*3),targetStock:Math.max(20,demand*10)});
    return [base('base',s.product,s.cost,basePrice??s.recommended,s.recommended,s.demand,baseStock),
      ...EXTRA_PRODUCTS[sector].map(([name,costCents,priceCents,demand],i)=>base(`extra-${i+1}`,name,costCents,priceCents,priceCents,demand,0))];
  }
  // Migração aditiva e auditável: inventário anterior fica no valor original;
  // ordens recebidas antes da V1.3 não geram novos créditos/debitos.
  function upgradedState(original) {
    if(original.schemaVersion===7)return clone(original);
    assert([2,3,4,5,6].includes(original.schemaVersion),'Schema de save não suportado');
    const state=clone(original);
    if(state.schemaVersion===2){
      state.schemaVersion=3;
      if(state.world.business){const b=state.world.business;
        b.products=initialProducts(b.sector,b.stockUnits,b.unitPrice);
        b.productSeq=0;b.saleSeq=0;b.orderSeq=0;b.sales=[];b.purchaseOrders=[];
      }
    }
    if(state.schemaVersion<4){
      state.schemaVersion=4;
      if(state.world.business){const b=state.world.business;
        b.products.forEach(p=>{p.stockValueCents=p.stockUnits*p.costCents;p.reorderPoint=Math.max(5,p.demand*3);p.targetStock=Math.max(20,p.demand*10);});
        b.purchaseOrders.forEach(o=>{o.status='RECEIVED';o.dueDate=o.date;o.receivedAt=o.date;});
      }
    }
    if(state.schemaVersion<5){
      state.schemaVersion=5;
      if(state.world.business){const b=state.world.business;
        if(!b.promotions)b.promotions={};
      }
    }
    if(state.schemaVersion<6){
      state.world.branches=[];
      state.world.branchSeq=state.world.business?1:0;
      state.world.activeBusinessId=state.world.business?.id??null;
      if(state.world.business)state.world.business.cityId=state.player.cityId;
      state.schemaVersion=6;
    }
    // Metadados de origem, não uma reescrita dos lançamentos históricos.
    state.world.regional={datasetId:POPULATION_SOURCE.id,modelId:'REGIONAL-V1',effectiveFrom:state.calendar.date};
    state.schemaVersion=7;
    return state;
  }
  function businesses(state){
    if(!state?.world)return [];
    return [state.world.business,...(state.world.branches||[])].filter(Boolean);
  }
  function activeBusiness(state){
    if(!state?.world)return null;
    if(state.schemaVersion<6)return state.world.business||null;
    return businesses(state).find(b=>b.id===state.world.activeBusinessId)||null;
  }
  function businessById(state,id){return businesses(state).find(b=>b.id===id)||null;}
  // Journals antigos pertencem à matriz, exceto aporte inicial, que pertence ao grupo.
  function journalBusinessId(state,j){
    if(j.businessId)return j.businessId;
    return j.memo==='Capital inicial do empreendedor'?null:state.world.business?.id??null;
  }
  function product(b,id) {const p=b.products.find(x=>x.id===(id??'base'));assert(p,'Produto não cadastrado');return p;}
  function promotionDiscount(b,p,date){
    const promotion=b.promotions?.[p.id];
    return promotion&&date<=promotion.until?promotion.percent:0;
  }
  function effectivePrice(b,p,date){
    return Math.round(p.priceCents*(100-promotionDiscount(b,p,date))/100);
  }
  function syncTotals(b) {b.stockUnits=b.products.reduce((n,p)=>n+p.stockUnits,0);b.unitPrice=product(b,'base').priceCents;}
  function addDays(iso,days){let result=iso;for(let i=0;i<days;i++)result=dateNext(result);return result;}
  const supplierById=id=>SUPPLIERS.find(s=>s.id===id);
  const pendingQuantity=(b,id)=>b.purchaseOrders.filter(o=>o.status==='PENDING').reduce((n,o)=>
    n+o.items.reduce((sum,line)=>sum+(line.productId===id?line.quantity:0),0),0);
  function registerPurchase(draft,b,supplierId,items){
    const supplier=supplierById(supplierId);
    assert(supplier,'Fornecedor não cadastrado');
    assert(Array.isArray(items)&&items.length>=1&&items.length<=40,'Informe de 1 a 40 itens');
    const used=new Set();let total=0,qtyTotal=0;
    const lines=items.map(line=>{
      assert(plain(line),'Item de compra inválido');
      const p=product(b,line.productId),quantity=Number(line.quantity);
      assert(!used.has(p.id),'Produto repetido na mesma compra');used.add(p.id);
      assert(Number.isInteger(quantity)&&quantity>=1&&quantity<=2000,'Quantidade inválida (1–2000)');
      const boughtToday=b.purchaseOrders.filter(o=>o.date===draft.calendar.date&&o.supplierId===supplier.id)
        .reduce((n,o)=>n+o.items.reduce((sum,x)=>sum+(x.productId===p.id?x.quantity:0),0),0);
      assert(quantity+boughtToday<=supplier.maxDailyPerSku,`Capacidade diária de ${supplier.name}: ${supplier.maxDailyPerSku} unidades por produto`);
      assert(p.stockUnits+pendingQuantity(b,p.id)+quantity<=100000,'Capacidade máxima do produto excedida');
      const unitCost=Math.round(p.costCents*supplier.priceFactor/100),cost=quantity*unitCost;
      total+=cost;qtyTotal+=quantity;
      return {productId:p.id,name:p.name,quantity,unitCost,total:cost};
    });
    const allPending=b.purchaseOrders.filter(o=>o.status==='PENDING')
      .reduce((n,o)=>n+o.items.reduce((sum,x)=>sum+x.quantity,0),0);
    assert(b.stockUnits+allPending+qtyTotal<=100000,'Capacidade total do depósito (incluindo trânsito) excedida');
    assert(Number.isSafeInteger(total)&&balance(draft,'CASH')>=total,`Caixa insuficiente para encomenda: ${money(total)}`);
    assert(b.purchaseOrders.length<20000,'Histórico de compras cheio');
    const id=`pc-${++b.orderSeq}`,dueDate=addDays(draft.calendar.date,supplier.leadDays);
    b.purchaseOrders.push({id,date:draft.calendar.date,supplierId,items:lines,total,status:'PENDING',dueDate,receivedAt:null});
    journal(draft,`Encomenda ${id}: mercadorias em trânsito`,[
      {account:'IN_TRANSIT',debit:total,credit:0},{account:'CASH',debit:0,credit:total}],b.id);
    event(draft,'COMPRA.ENCOMENDADA',`Pedido ${id} pago (${money(total)}); previsão ${dueDate} (${supplier.leadDays} dia(s)).`,{id,total,dueDate,supplierId},b.id);
  }
  function receiveDueOrders(draft,b){
    if(!b)return;
    for(const order of b.purchaseOrders){
      if(order.status!=='PENDING'||order.dueDate>draft.calendar.date)continue;
      for(const line of order.items){const p=product(b,line.productId);
        p.stockUnits+=line.quantity;p.stockValueCents+=line.total;
      }
      syncTotals(b);
      order.status='RECEIVED';order.receivedAt=draft.calendar.date;
      journal(draft,`Recebimento ${order.id} em estoque`,[
        {account:'INVENTORY',debit:order.total,credit:0},{account:'IN_TRANSIT',debit:0,credit:order.total}],b.id);
      event(draft,'COMPRA.RECEBIDA',`Pedido ${order.id} recebido: ${order.items.reduce((n,l)=>n+l.quantity,0)} unidades.`,{id:order.id,total:order.total},b.id);
    }
  }
  function inventoryReport(state){
    const b=activeBusiness(state);if(!b)return [];
    const events=state.audit.events.filter(e=>e.type==='DEMANDA.SIMULADA'&&(e.businessId===b.id||(!e.businessId&&b.id===state.world.business?.id))).slice(-7);
    return b.products.map(p=>{
      const series=events.map(e=>e.data?.items?.find(x=>x.productId===p.id)?.estimated).filter(Number.isInteger);
      const observedDaily=series.length?Math.round(series.reduce((n,v)=>n+v,0)/series.length*10)/10:null;
      const fallback=Math.max(1,Math.round(p.demand*cityById(b.cityId||state.player.cityId).factor/100));
      const daily=observedDaily??fallback,inTransit=pendingQuantity(b,p.id),available=p.stockUnits+inTransit;
      return {id:p.id,name:p.name,stock:p.stockUnits,inTransit,reorderPoint:p.reorderPoint,targetStock:p.targetStock,
        observedDaily,forecastDaily:daily,sampleDays:series.length,coverageDays:Math.round(available/daily*10)/10,
        recommended:Math.max(0,p.targetStock-available),alert:available<=p.reorderPoint};
    });
  }
  function registerSale(draft,b,items,kind='SIMULACAO_DIARIA') {
    assert(kind==='SIMULACAO_DIARIA','A venda só pode ser gerada pela simulação de demanda');
    assert(Array.isArray(items)&&items.length>=1&&items.length<=40,'Carrinho vazio ou inválido');
    const used=new Set();let total=0,cost=0,qtyTotal=0;
    const lines=items.map(line=>{assert(plain(line),'Item de venda inválido');const p=product(b,line.productId),quantity=Number(line.quantity);
      assert(!used.has(p.id),'Produto repetido na mesma venda');used.add(p.id);
      assert(Number.isInteger(quantity)&&quantity>=1&&quantity<=2000,'Quantidade de venda inválida (1–2000)');
      assert(p.stockUnits>=quantity,`Estoque insuficiente para ${p.name}`);
      const unitPrice=effectivePrice(b,p,draft.calendar.date);
      const revenue=quantity*unitPrice,cogs=quantity===p.stockUnits?p.stockValueCents:Math.round(p.stockValueCents*quantity/p.stockUnits);
      total+=revenue;cost+=cogs;qtyTotal+=quantity;
      return {productId:p.id,name:p.name,quantity,unitPrice,unitCost:p.costCents,revenue,cogs};});
    assert(Number.isSafeInteger(total)&&Number.isSafeInteger(cost),'Valor da venda excede limite');
    assert(b.sales.length<20000,'Limite de histórico de vendas atingido');
    for(const line of lines){const p=product(b,line.productId);p.stockUnits-=line.quantity;p.stockValueCents-=line.cogs;}
    b.totalSold+=qtyTotal;syncTotals(b);const id=`vd-${++b.saleSeq}`;
    b.sales.push({id,date:draft.calendar.date,kind,items:lines,total,cogs:cost});
    journal(draft,`Venda ${id} (${kind}): ${lines.map(x=>`${x.quantity} ${x.name}`).join(', ')}`,[
      {account:'CASH',debit:total,credit:0},{account:'REVENUE',debit:0,credit:total},
      {account:'COGS',debit:cost,credit:0},{account:'INVENTORY',debit:0,credit:cost}],b.id);
    event(draft,'VENDA.CONCLUIDA',`Vendas simuladas do dia ${id}: ${qtyTotal} unidades por ${money(total)}.`,{id,total,cost,qtyTotal},b.id);
  }
  function productPerformance(state) {
    const b=activeBusiness(state);if(!b)return [];
    return b.products.map(p=>{const lines=b.sales.flatMap(s=>s.items).filter(x=>x.productId===p.id);
      return {id:p.id,name:p.name,stockUnits:p.stockUnits,stockValue:p.stockValueCents,
        sold:lines.reduce((n,l)=>n+l.quantity,0),revenue:lines.reduce((n,l)=>n+l.revenue,0),
        cogs:lines.reduce((n,l)=>n+l.cogs,0),priceCents:p.priceCents,costCents:p.stockUnits?Math.round(p.stockValueCents/p.stockUnits):p.costCents};});
  }

  const plain = x => !!x && typeof x === 'object' && !Array.isArray(x);
  const int = x => Number.isSafeInteger(x) && x>=0;
  const money = cents => new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(cents/100);
  const cityById = id => CITIES.find(x=>x.id===id);
  const clamp = (x,min,max)=>Math.max(min,Math.min(max,x));
  const fingerprint = cmd => JSON.stringify({type:cmd.type,payload:cmd.payload??{}});
  function hash(input) { let h=0x811c9dc5;for(let i=0;i<input.length;i++){h^=input.charCodeAt(i);h=Math.imul(h,0x01000193)}return (h>>>0).toString(16).padStart(8,'0'); }
  function assert(test,message) { if(!test) throw Error(message); }
  function dateNext(iso) { const d=new Date(`${iso}T12:00:00Z`);assert(!Number.isNaN(d.getTime()),'Data inválida');d.setUTCDate(d.getUTCDate()+1);return d.toISOString().slice(0,10); }
  function random(draft) { draft.rng.seed=(Math.imul(draft.rng.seed,1664525)+1013904223)>>>0;return draft.rng.seed/4294967296; }
  function event(draft,type,text,data={},businessId=null) {
    const id=`evt-${++draft.audit.eventSeq}`;
    draft.audit.events.push({id,type,date:draft.calendar.date,text,data,...(businessId?{businessId}:{})});
  }
  function journal(draft,memo,entries,businessId=null) {
    const debit=entries.reduce((n,x)=>n+x.debit,0),credit=entries.reduce((n,x)=>n+x.credit,0);
    assert(debit===credit && debit>0,'Lançamento desequilibrado');
    assert(entries.every(x=>typeof x.account==='string'&&int(x.debit)&&int(x.credit)&&!(x.debit&&x.credit)),'Linha financeira inválida');
    draft.economy.ledger.push({id:`jnl-${++draft.economy.journalSeq}`,date:draft.calendar.date,memo,entries,...(businessId?{businessId}:{})});
  }
  function balance(draft,account) {let total=0;for(const j of draft.economy.ledger)for(const e of j.entries)if(e.account===account)total+=(['CAPITAL','REVENUE','PAYABLE'].includes(account)?e.credit-e.debit:e.debit-e.credit);return total;}
  function overview(draft) {
    if(!draft)return null;
    const revenue=balance(draft,'REVENUE'),cogs=balance(draft,'COGS'),expenses=balance(draft,'EXPENSE');
    return {cash:balance(draft,'CASH'),inventoryValue:balance(draft,'INVENTORY'),inTransit:balance(draft,'IN_TRANSIT'),receivables:balance(draft,'RECEIVABLE'),payable:balance(draft,'PAYABLE'),revenue,cogs,expenses,profit:revenue-cogs-expenses,stock:businesses(draft).reduce((n,b)=>n+b.stockUnits,0),unitPrice:activeBusiness(draft)?.unitPrice??null,units:businesses(draft).length,tick:draft.calendar.tick,city:cityById(activeBusiness(draft)?.cityId||draft.player.cityId)?.name??'—'};
  }
  function emptyLegacy(seed) {return {
    schemaVersion:7,worldId:`legacy-${seed}`,revision:0,
    meta:{title:'Cidade dos Negócios',version:VERSION,origin:'MIGRATED_EMPTY_CP000',mode:'DEMONSTRACAO_ECONOMICA'},
    calendar:{date:START_DATE,tick:0},rng:{seed},
    player:{name:'',companyName:'',cityId:null},world:{cities:CITIES.map(x=>x.id),business:null,branches:[],branchSeq:0,activeBusinessId:null,regional:{datasetId:POPULATION_SOURCE.id,modelId:'REGIONAL-V1',effectiveFrom:START_DATE},competitor:{priceIndex:100}},
    economy:{journalSeq:0,ledger:[]},fiscal:{mode:'DEMONSTRACAO_ECONOMICA',coverageStatus:'NOT_COVERED',rulePackId:null},
    audit:{eventSeq:0,events:[],commands:{}}
  };}
  function init(payload,commandId) {
    assert(plain(payload),'Dados da carreira inválidos');
    const city=cityById(payload.cityId);assert(city,'Cidade não cadastrada');
    const name=String(payload.name??'').trim().slice(0,60),companyName=String(payload.companyName??'').trim().slice(0,70);
    assert(name.length>=2 && companyName.length>=3,'Informe nome e empresa válidos');
    const seed=(Number(payload.seed)>>>0)||20261101;
    const state=emptyLegacy(seed);
    state.worldId=`carreira-${seed}-${city.id}`;
    state.player={name,companyName,cityId:city.id};
    state.meta.origin='NEW_CAREER';
    journal(state,'Capital inicial do empreendedor',[{account:'CASH',debit:3000000,credit:0},{account:'CAPITAL',debit:0,credit:3000000}]);
    event(state,'CARREIRA.CRIADA',`Carreira iniciada em ${city.name} (${city.uf}).`);
    state.revision=1;
    state.audit.commands[commandId]=fingerprint({type:'CARREIRA.CRIAR',payload});
    validate(state);
    return state;
  }
  function handler(draft,type,payload) {
    const b=activeBusiness(draft);
    if(type==='EMPRESA.ATIVAR') {
      assert(businessById(draft,payload.businessId),'Unidade não encontrada');
      draft.world.activeBusinessId=payload.businessId;return;
    }
    if(type==='EMPRESA.ABRIR') {
      assert(businesses(draft).length<5,'Limite de cinco estabelecimentos atingido');
      const cityId=payload.cityId||draft.player.cityId;
      assert(cityById(cityId),'Cidade inválida para a nova unidade');
      const s=SECTORS[payload.sector],lot=Number(payload.lot);
      assert(s,'Atividade comercial desconhecida');assert(Number.isInteger(lot)&&lot>=1&&lot<=18,'Selecione um lote válido (1 a 18)');
      assert(!businesses(draft).some(x=>x.cityId===cityId&&x.lot===lot),'Lote já ocupado por uma unidade do grupo');
      assert(balance(draft,'CASH')>=s.openCost,'Caixa compartilhado insuficiente para abrir esta unidade');
      const id=`est-${++draft.world.branchSeq}`;
      const newUnit={id,cityId,sector:payload.sector,lot,stockUnits:0,unitPrice:s.recommended,openedAt:draft.calendar.date,totalSold:0,products:initialProducts(payload.sector),productSeq:0,saleSeq:0,orderSeq:0,sales:[],purchaseOrders:[],promotions:{}};
      if(!draft.world.business)draft.world.business=newUnit;
      else draft.world.branches.push(newUnit);
      draft.world.activeBusinessId=id;
      journal(draft,`Abertura: ${s.name} (${id})`,[{account:'EXPENSE',debit:s.openCost,credit:0},{account:'CASH',debit:0,credit:s.openCost}],id);
      event(draft,'EMPRESA.ABERTA',`${s.name} inaugurado em ${cityById(cityId).name}, lote ${lot}.`,{lot,sector:payload.sector,cityId},id);
      return;
    }
    if(type==='PRODUTO.CADASTRAR') {
      assert(b,'Abra uma empresa antes de cadastrar produtos');
      assert(b.products.length<40,'Limite de 40 produtos atingido');
      const name=String(payload.name??'').trim().slice(0,70);
      const costCents=Number(payload.costCents),priceCents=Number(payload.priceCents);
      assert(name.length>=3&&name.length<=70,'Nome do produto inválido');
      assert(int(costCents)&&costCents>=100&&costCents<=1000000,'Custo do produto inválido');
      assert(int(priceCents)&&priceCents>=100&&priceCents<=1000000,'Preço do produto inválido');
      assert(!b.products.some(p=>p.name.toLowerCase()===name.toLowerCase()),'Já existe produto com este nome');
      const id=`custom-${++b.productSeq}`;
      b.products.push({id,name,costCents,priceCents,referenceCents:priceCents,demand:6,stockUnits:0,stockValueCents:0,reorderPoint:18,targetStock:60});
      event(draft,'PRODUTO.CADASTRADO',`Novo produto: ${name}.`,{id},b.id);return;
    }
    if(type==='ESTOQUE.POLITICA_DEFINIR') {
      assert(b,'Abra uma empresa antes de definir reposição');
      const p=product(b,payload.productId),reorderPoint=Number(payload.reorderPoint),targetStock=Number(payload.targetStock);
      assert(Number.isInteger(reorderPoint)&&reorderPoint>=0&&reorderPoint<=100000,'Estoque mínimo inválido');
      assert(Number.isInteger(targetStock)&&targetStock>=1&&targetStock<=100000&&targetStock>=reorderPoint,'Meta de estoque deve ser maior ou igual ao mínimo');
      p.reorderPoint=reorderPoint;p.targetStock=targetStock;
      event(draft,'ESTOQUE.POLITICA',`Reposição de ${p.name}: mínimo ${reorderPoint}, meta ${targetStock}.`,{productId:p.id,reorderPoint,targetStock},b.id);return;
    }
    if(type==='ESTOQUE.COMPRAR') {
      assert(b,'Abra uma empresa antes de comprar');
      registerPurchase(draft,b,payload.supplierId||'regional',[{productId:payload.productId||'base',quantity:payload.quantity}]);return;
    }
    if(type==='COMPRAS.REGISTRAR') {
      assert(b,'Abra uma empresa antes de comprar');
      registerPurchase(draft,b,payload.supplierId,payload.items);return;
    }
    if(type==='VENDA.REGISTRAR') {
      // Comando legado desativado: compras reais são simuladas exclusivamente pelo motor diário.
      // Recibos BALCAO antigos permanecem no save para auditoria, sem nova mutação do ledger.
      throw Error('Venda manual desativada na V1.2.1: avance o dia para simular a demanda e as vendas.');
    }
    if(type==='PROMO.DEFINIR') {
      assert(b,'Abra uma empresa antes de configurar promoções');
      const p=product(b,payload.productId);
      const percent=Number(payload.percent),days=Number(payload.days);
      assert([0,5,10,15].includes(percent),'Desconto promocional inválido');
      assert(Number.isInteger(days)&&days>=0&&days<=30,'Prazo de promoção inválido');
      assert((percent===0&&days===0)||(percent>0&&days>=1),'Defina desconto e duração válidos');
      if(percent===0){delete b.promotions[p.id];event(draft,'PROMO.ENCERRADA',`Promoção de ${p.name} encerrada.`,{productId:p.id},b.id);}
      else {const until=addDays(draft.calendar.date,days-1);b.promotions[p.id]={percent,until};event(draft,'PROMO.DEFINIDA',`${p.name}: desconto de ${percent}% até ${until}.`,{productId:p.id,percent,until},b.id);}
      return;
    }
    if(type==='PRECO.DEFINIR') {
      assert(b,'Abra uma empresa antes de definir preços');
      const cents=Number(payload.cents);assert(int(cents)&&cents>=100&&cents<=1000000,'Preço deve estar entre R$ 1 e R$ 10.000');
      const p=product(b,payload.productId||'base');const old=p.priceCents;p.priceCents=cents;syncTotals(b);
      event(draft,'PRECO.ALTERADO',`${p.name}: preço de ${money(old)} para ${money(cents)}.`,{old,cents,productId:p.id,productName:p.name},b.id);return;
    }
    if(type==='IA.AJUSTAR_PRECO') {
      assert(Number.isInteger(payload.priceIndex)&&payload.priceIndex>=70&&payload.priceIndex<=140,'Estratégia IA inválida');
      draft.world.competitor.priceIndex=payload.priceIndex;
      event(draft,'IA.REACAO',`Concorrência ajustou a política de preços (índice ${payload.priceIndex}).`);return;
    }
    if(type==='TEMPO.AVANCAR_DIA'||type==='TEMPO.AVANCAR_LOTE') {
      const days=type==='TEMPO.AVANCAR_DIA'?1:Number(payload.days);
      assert(Number.isInteger(days)&&days>=1&&days<=30,'Avanço permitido: 1 a 30 dias');
      for(let i=0;i<days;i++) day(draft);
      return;
    }
    throw Error(`Comando não implementado: ${type}`);
  }
  function day(draft) {
    const units=businesses(draft);
    const season=1+0.13*Math.sin((draft.calendar.tick%365)/365*Math.PI*2);
    for(const b of units){
      const s=SECTORS[b.sector],city=cityById(b.cityId||draft.player.cityId);
      // O mercado endereçável de uma cidade/ramo é compartilhado pelas lojas do jogador.
      const rivals=units.filter(x=>x.cityId===b.cityId&&x.sector===b.sector).length;
      const share=1/rivals;
      const items=[],demandLines=[];
      let estimated=0,fulfilled=0,unmet=0,withoutStock=0;
      for(const p of b.products){
        const competitorPrice=competitorReference(draft,p,city);
        const price=effectivePrice(b,p,draft.calendar.date);
        const elasticity=demandElasticity(price,competitorPrice,city);
        const base=p.demand*(city.factor/100)*elasticity*season*share;
        const demand=Math.max(0,Math.floor(base*(0.75+random(draft)*0.55)));
        const sold=Math.min(p.stockUnits,demand),lost=demand-sold;
        estimated+=demand;fulfilled+=sold;unmet+=lost;
        if(!p.stockUnits)withoutStock++;
        demandLines.push({productId:p.id,name:p.name,stockBefore:p.stockUnits,estimated:demand,fulfilled:sold,unmet:lost,lostPotentialCents:lost*price});
        if(sold>0)items.push({productId:p.id,quantity:sold});
      }
      if(items.length)registerSale(draft,b,items,'SIMULACAO_DIARIA');
      event(draft,'DEMANDA.SIMULADA',`${b.id} · ${city.name}: ${estimated} un. procuradas, ${fulfilled} vendidas, ${unmet} não atendidas.`,
        {estimated,fulfilled,unmet,withoutStock,lostPotentialCents:demandLines.reduce((n,x)=>n+x.lostPotentialCents,0),items:demandLines,marketShare:share,regionalFactor:city.factor,regionalDataset:POPULATION_SOURCE.id},b.id);
      const cash=balance(draft,'CASH'),expense=s.dailyCost;
      journal(draft,`Despesa operacional diária · ${b.id}`,[
        {account:'EXPENSE',debit:expense,credit:0},
        {account:cash>=expense?'CASH':'PAYABLE',debit:0,credit:expense}],b.id);
      if(cash<expense)event(draft,'CONTAS.A_PAGAR',`${b.id}: despesa de ${money(expense)} registrada a pagar.`,{},b.id);
    }
    if(units.length&&(draft.calendar.tick+1)%7===0){
      const change=Math.floor(random(draft)*17)-8;
      handler(draft,'IA.AJUSTAR_PRECO',{priceIndex:clamp(draft.world.competitor.priceIndex+change,75,125)});
    }
    const finished=draft.calendar.date;
    event(draft,'DIA.ENCERRADO',`Dia ${finished} concluído.`,{finished});
    draft.calendar.tick++;
    draft.calendar.date=dateNext(draft.calendar.date);
    for(const b of units)receiveDueOrders(draft,b);
  }
  function dispatch(current,cmd) {
    try{
      assert(plain(cmd)&&typeof cmd.type==='string'&&typeof cmd.id==='string'&&/^[a-zA-Z\d._:-]{2,100}$/.test(cmd.id),'Comando sem ID válido');
      const payload=plain(cmd.payload)?cmd.payload:{};
      if(current){ validate(current);const prev=current.audit.commands[cmd.id];if(prev!==undefined){
        assert(prev===fingerprint({type:cmd.type,payload}),'Conflito: ID reutilizado com conteúdo diferente');
        return {ok:true,status:'DUPLICATE',state:clone(current),message:'Comando já confirmado; nenhuma operação duplicada.'};
      }}
      if(cmd.type==='CARREIRA.CRIAR') {
        assert(!current || !current.player.cityId,'Já existe uma carreira ativa');
        return {ok:true,status:'APPLIED',state:init(payload,cmd.id),message:'Carreira criada.'};
      }
      assert(current && current.player.cityId,'Crie uma carreira antes de jogar');
      const draft=upgradedState(current);
      assert(Object.keys(draft.audit.commands).length<100000,'Limite de histórico de comandos atingido; exporte a carreira');
      handler(draft,cmd.type,payload);
      draft.revision++;
      draft.audit.commands[cmd.id]=fingerprint({type:cmd.type,payload});
      validate(draft);
      return {ok:true,status:'APPLIED',state:draft,message:'Operação confirmada.'};
    }catch(error){return {ok:false,status:'REJECTED',state:current?clone(current):null,error:error.message};}
  }
  function validate(state) {
    assert(plain(state)&&[2,3,4,5,6,7].includes(state.schemaVersion),'Save com schema incompatível');
    assert(Number.isSafeInteger(state.revision)&&state.revision>=0,'Revisão inválida');
    assert(plain(state.player)&&plain(state.calendar)&&int(state.calendar.tick),'Jogador/calendário inválidos');
    assert(/^\d{4}-\d{2}-\d{2}$/.test(state.calendar.date)&&!Number.isNaN(Date.parse(state.calendar.date+'T12:00:00Z')),'Data inválida');
    assert(plain(state.rng)&&int(state.rng.seed)&&state.rng.seed<=4294967295,'Semente inválida');
    assert(plain(state.world)&&Array.isArray(state.world.cities)&&state.world.cities.length===30&&new Set(state.world.cities).size===30,'Mapa nacional inconsistente');
    assert(state.world.cities.every(id=>!!cityById(id)),'Cidade inválida');
    assert(state.player.cityId===null||!!cityById(state.player.cityId),'Cidade de carreira inválida');
    assert(plain(state.world.competitor)&&int(state.world.competitor.priceIndex),'Concorrente inválido');
    if(state.schemaVersion>=7){
      const regional=state.world.regional;
      assert(plain(regional)&&regional.datasetId===POPULATION_SOURCE.id&&regional.modelId==='REGIONAL-V1'&&isoDate(regional.effectiveFrom)&&regional.effectiveFrom>=START_DATE&&regional.effectiveFrom<=state.calendar.date,'Versão econômica regional ou data de ativação inválida');
    }
    assert(plain(state.economy)&&Array.isArray(state.economy.ledger)&&state.economy.ledger.length<=150000,'Ledger inválido');
    assert(plain(state.audit)&&Array.isArray(state.audit.events)&&plain(state.audit.commands),'Auditoria inválida');
    assert(state.audit.events.length<=250000&&new Set(state.audit.events.map(x=>x.id)).size===state.audit.events.length,'Eventos duplicados ou excesso');
    assert(Object.keys(state.audit.commands).length<=100000,'Registro de comandos inválido');
    assert(plain(state.fiscal)&&state.fiscal.coverageStatus==='NOT_COVERED'&&state.fiscal.rulePackId===null,'Regra fiscal da V1 inválida');
    const journalIds=new Set();
    for(const j of state.economy.ledger){
      assert(typeof j.id==='string'&&!journalIds.has(j.id)&&Array.isArray(j.entries)&&j.entries.length>1,'Lançamento duplicado/inválido');journalIds.add(j.id);
      let d=0,c=0;
      for(const e of j.entries){assert(typeof e.account==='string'&&int(e.debit)&&int(e.credit)&&!(e.debit&&e.credit),'Linha financeira inválida');d+=e.debit;c+=e.credit;}
      assert(d===c&&d>0,'Lançamento financeiro desequilibrado');
    }
    const cash=balance(state,'CASH'),inventory=balance(state,'INVENTORY');
    assert(int(cash)&&int(inventory)&&int(balance(state,'PAYABLE')),'Saldos financeiros inválidos');
    if(state.schemaVersion>=6){
      assert(Array.isArray(state.world.branches)&&state.world.branches.length<=4,'Número de filiais inválido');
      const units=businesses(state);
      assert(units.length<=5&&int(state.world.branchSeq)&&state.world.branchSeq<=100000,'Limite de estabelecimentos inválido');
      const ids=new Set(),locations=new Set();let physical=0,goods=0,pending=0;
      for(const b of units){
        assert(plain(b)&&typeof b.id==='string'&&!ids.has(b.id)&&cityById(b.cityId),'Unidade duplicada ou cidade inválida');ids.add(b.id);
        assert(SECTORS[b.sector]&&Number.isInteger(b.lot)&&b.lot>=1&&b.lot<=18,'Atividade ou lote inválido');
        const loc=`${b.cityId}:${b.lot}`;assert(!locations.has(loc),'Duas unidades ocupam o mesmo lote');locations.add(loc);
        assert(Array.isArray(b.products)&&b.products.length>=3&&b.products.length<=40&&int(b.stockUnits)&&int(b.totalSold),'Estoque comercial inválido');
        assert(Array.isArray(b.sales)&&b.sales.length<=20000&&Array.isArray(b.purchaseOrders)&&b.purchaseOrders.length<=20000,'Histórico comercial inválido');
        assert(int(b.productSeq)&&int(b.orderSeq)&&int(b.saleSeq)&&plain(b.promotions),'Sequências ou promoções inválidas');
        const pids=new Set();let unitStock=0,unitGoods=0;
        for(const p of b.products){
          assert(plain(p)&&typeof p.id==='string'&&!pids.has(p.id)&&typeof p.name==='string'&&p.name.trim().length>=3,'Produto inválido');pids.add(p.id);
          assert(int(p.stockUnits)&&p.stockUnits<=100000&&int(p.stockValueCents)&&p.stockValueCents<=100000000000,'Estoque físico/contábil inválido');
          assert(int(p.costCents)&&p.costCents>=100&&p.costCents<=1000000&&int(p.priceCents)&&p.priceCents>=100&&p.priceCents<=1000000,'Custo ou preço inválido');
          assert(int(p.referenceCents)&&p.referenceCents>=100&&int(p.demand)&&p.demand<=40,'Demanda inválida');
          assert(int(p.reorderPoint)&&p.reorderPoint<=100000&&int(p.targetStock)&&p.targetStock>=p.reorderPoint&&p.targetStock<=100000,'Política de estoque inválida');
          unitStock+=p.stockUnits;unitGoods+=p.stockValueCents;
        }
        assert(unitStock===b.stockUnits&&unitStock<=100000&&b.unitPrice===product(b,'base').priceCents,'Saldos da unidade inválidos');
        assert(Object.keys(b.promotions).length<=40,'Excesso de promoções');
        for(const [id,pr] of Object.entries(b.promotions))assert(pids.has(id)&&plain(pr)&&[5,10,15].includes(pr.percent)&&isoDate(pr.until),'Promoção inválida');
        let unitTransit=0;
        for(const o of b.purchaseOrders){
          assert(o&&['PENDING','RECEIVED'].includes(o.status)&&isoDate(o.date)&&isoDate(o.dueDate)&&o.dueDate>=o.date,'Pedido ou prazo inválido');
          assert(Array.isArray(o.items)&&int(o.total)&&o.items.reduce((n,l)=>n+l.total,0)===o.total,'Itens de compra inválidos');
          if(o.status==='PENDING'){assert(o.receivedAt===null,'Pedido pendente marcado como recebido');unitTransit+=o.total;}
          else assert(isoDate(o.receivedAt),'Pedido sem confirmação de recebimento');
        }
        assert(b.sales.every(x=>x&&typeof x.id==='string'&&Array.isArray(x.items)&&int(x.total)&&int(x.cogs)),'Venda inválida');
        physical+=unitStock;goods+=unitGoods;pending+=unitTransit;
        const journals=state.economy.ledger.filter(j=>journalBusinessId(state,j)===b.id);
        const acc=accountName=>journals.reduce((total,j)=>total+j.entries.reduce((n,e)=>n+(e.account===accountName?e.debit-e.credit:0),0),0);
        assert(acc('INVENTORY')===unitGoods&&acc('IN_TRANSIT')===unitTransit,'Contabilidade da filial não concilia estoque/trânsito');
      }
      assert(!units.length?state.world.activeBusinessId===null:ids.has(state.world.activeBusinessId),'Unidade ativa inválida');
      assert(physical===units.reduce((n,x)=>n+x.stockUnits,0)&&goods===inventory&&pending===balance(state,'IN_TRANSIT'),'Estoque consolidado não conciliado');
      for(const j of state.economy.ledger)if(j.businessId)assert(ids.has(j.businessId),'Lançamento aponta para unidade inexistente');
      for(const e of state.audit.events)if(e.businessId)assert(ids.has(e.businessId),'Evento aponta para unidade inexistente');
      return true;
    }
    const b=state.world.business;
    if(b){assert(SECTORS[b.sector]&&Number.isInteger(b.lot)&&b.lot>=1&&b.lot<=18&&int(b.stockUnits)&&int(b.totalSold)&&int(b.unitPrice),'Empresa inválida');
      if(state.schemaVersion===2){assert(inventory===b.stockUnits*SECTORS[b.sector].cost,'Estoque físico e contábil divergentes');}
      else {
        assert(Array.isArray(b.products)&&b.products.length>=3&&b.products.length<=40,'Catálogo inválido');
        assert(Array.isArray(b.sales)&&b.sales.length<=20000&&Array.isArray(b.purchaseOrders)&&b.purchaseOrders.length<=20000,'Histórico comercial inválido');
        assert(int(b.productSeq)&&int(b.orderSeq)&&int(b.saleSeq),'Sequências comerciais inválidas');
        const ids=new Set();let stockSum=0,stockValue=0;
        for(const p of b.products){
          assert(plain(p)&&typeof p.id==='string'&&!ids.has(p.id)&&typeof p.name==='string'&&p.name.trim().length>=3,'Produto inválido');ids.add(p.id);
          assert(int(p.stockUnits)&&p.stockUnits<=100000&&int(p.costCents)&&p.costCents>=100&&p.costCents<=1000000,'Estoque ou custo inválido');
          assert(int(p.priceCents)&&p.priceCents>=100&&p.priceCents<=1000000&&int(p.referenceCents)&&p.referenceCents>=100&&int(p.demand)&&p.demand<=40,'Preço ou demanda inválida');
          stockSum+=p.stockUnits;stockValue+=state.schemaVersion>=4?p.stockValueCents:p.stockUnits*p.costCents;
        }
        assert(stockSum===b.stockUnits&&stockValue===inventory&&stockSum<=100000,'Estoque físico e contábil divergentes');
        if(state.schemaVersion>=4){
          const transit=b.purchaseOrders.filter(o=>o.status==='PENDING').reduce((n,o)=>n+o.total,0);
          assert(transit===balance(state,'IN_TRANSIT'),'Mercadorias em trânsito não conciliadas');
          for(const p of b.products)assert(int(p.stockValueCents)&&p.stockValueCents<=100000000000&&
            int(p.reorderPoint)&&p.reorderPoint<=100000&&int(p.targetStock)&&p.targetStock<=100000&&p.targetStock>=p.reorderPoint,
            'Custo médio e política de reposição inválidos');
          for(const o of b.purchaseOrders){
            assert(['PENDING','RECEIVED'].includes(o.status)&&isoDate(o.dueDate)&&o.dueDate>=o.date&&
              (o.status==='PENDING'?o.receivedAt===null:isoDate(o.receivedAt)), 'Pedido ou prazo inválido');
            assert(o.items.reduce((n,x)=>n+x.total,0)===o.total,'Total de compra divergente');
          }
        }
        if(state.schemaVersion===5){
          assert(plain(b.promotions)&&Object.keys(b.promotions).length<=40,'Promoções inválidas');
          for(const [id,promo] of Object.entries(b.promotions)){
            assert(ids.has(id)&&plain(promo)&&[5,10,15].includes(promo.percent)&&isoDate(promo.until),'Promoção inválida no save');
          }
        }
        assert(b.unitPrice===product(b,'base').priceCents,'Preço base inconsistente');
        assert(b.sales.every(s=>s&&typeof s.id==='string'&&Array.isArray(s.items)&&int(s.total)&&int(s.cogs)),'Vendas inválidas');
        assert(b.purchaseOrders.every(o=>o&&typeof o.id==='string'&&Array.isArray(o.items)&&int(o.total)),'Compras inválidas');
      }
    }
    else assert(inventory===0,'Estoque sem empresa');
    return true;
  }
  // Data civil ISO estrita (inclui fevereiro e ano bissexto); nenhum parsing ambíguo.
  function isoDate(value) {
    if(typeof value!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(value))return false;
    const d=new Date(value+'T12:00:00Z');
    return !Number.isNaN(d.getTime())&&d.toISOString().slice(0,10)===value;
  }
  // Reportes por data/competência derivados exclusivamente do ledger já confirmado.
  // Saldo no fim do período é acumulado; receitas, CMV e despesas são fluxos do recorte.
  function financialReport(state,period='all',referenceDate=state.calendar.date,range=null,businessId='all') {
    assert(state&&plain(state.economy)&&Array.isArray(state.economy.ledger),'Carreira inválida para relatório');
    assert(['all','day','month','quarter','semester','year','range'].includes(period),'Período financeiro desconhecido');
    assert(isoDate(referenceDate),'Data de referência inválida');
    assert(referenceDate<=state.calendar.date,'Data futura não permitida');
    const yy=Number(referenceDate.slice(0,4)),mm=Number(referenceDate.slice(5,7));
    assert(mm>=1&&mm<=12&&yy>=2000,'Competência inválida');
    const firstMonth=String(mm).padStart(2,'0'),quarter=Math.floor((mm-1)/3);
    let from=START_DATE,to=referenceDate,label='Toda a carreira';
    if(period==='day'){from=to=referenceDate;label=`Dia ${referenceDate.split('-').reverse().join('/')}`;}
    if(period==='month'){from=`${yy}-${firstMonth}-01`;to=`${yy}-${firstMonth}-${String(new Date(Date.UTC(yy,mm,0)).getUTCDate()).padStart(2,'0')}`;label=`Competência ${firstMonth}/${yy}`;}
    if(period==='quarter'){
      const begin=quarter*3+1,end=begin+2;
      from=`${yy}-${String(begin).padStart(2,'0')}-01`;
      to=`${yy}-${String(end).padStart(2,'0')}-${String(new Date(Date.UTC(yy,end,0)).getUTCDate()).padStart(2,'0')}`;
      label=`${quarter+1}º trimestre de ${yy}`;
    }
    if(period==='semester'){
      const begin=mm<=6?1:7,end=begin+5;
      from=`${yy}-${String(begin).padStart(2,'0')}-01`;
      to=`${yy}-${String(end).padStart(2,'0')}-${String(new Date(Date.UTC(yy,end,0)).getUTCDate()).padStart(2,'0')}`;
      label=`${begin===1?1:2}º semestre de ${yy}`;
    }
    if(period==='year'){from=`${yy}-01-01`;to=`${yy}-12-31`;label=`Ano ${yy}`;}
    if(period==='range'){
      assert(plain(range)&&isoDate(range.from)&&isoDate(range.to),'Informe datas inicial e final válidas');
      assert(range.from<=range.to,'A data inicial não pode ser posterior à final');
      assert(range.from<=state.calendar.date&&range.to<=state.calendar.date,'Intervalo futuro não permitido');
      from=range.from;to=range.to;
      label=`Intervalo ${from.split('-').reverse().join('/')} a ${to.split('-').reverse().join('/')}`;
    }
    const effectiveEnd=to<state.calendar.date?to:state.calendar.date;
    assert(businessId==='all'||!!businessById(state,businessId),'Filtro de estabelecimento inválido');
    const inScope=j=>businessId==='all'||journalBusinessId(state,j)===businessId;
    const entries=state.economy.ledger.filter(x=>x.date>=from&&x.date<=effectiveEnd&&inScope(x));
    const until=state.economy.ledger.filter(x=>x.date<=effectiveEnd&&inScope(x));
    const account=(journals,name)=>journals.reduce((sum,j)=>sum+j.entries.reduce((n,e)=>e.account===name?n+(['CAPITAL','REVENUE','PAYABLE'].includes(name)?e.credit-e.debit:e.debit-e.credit):n,0),0);
    const revenue=account(entries,'REVENUE'),cogs=account(entries,'COGS'),expenses=account(entries,'EXPENSE');
    return {
      period,referenceDate,from,to,effectiveEnd,label,entries,businessId,
      revenue,cogs,expenses,grossProfit:revenue-cogs,profit:revenue-cogs-expenses,
      grossMarginPercent:revenue?Math.round((revenue-cogs)*10000/revenue)/100:null,
      closingCash:businessId==='all'?account(until,'CASH'):null,closingInventory:account(until,'INVENTORY'),
      closingPayable:account(until,'PAYABLE'),closingInTransit:account(until,'IN_TRANSIT'),capital:account(entries,'CAPITAL')
    };
  }
  // Avaliação determinística da estratégia: consulta pura, sem alterar RNG, save ou contabilidade.
  function strategyReport(state,horizonDays=30){
    assert(state&&[7,30,90].includes(horizonDays),'Horizonte estratégico inválido');
    const b=activeBusiness(state);
    if(!b)return null;
    const sector=SECTORS[b.sector],city=cityById(b.cityId),current=overview(state);
    const lastDate=new Date(state.calendar.date+'T12:00:00Z');lastDate.setUTCDate(lastDate.getUTCDate()-1);
    const endDate=lastDate.toISOString().slice(0,10);
    const firstDate=new Date(lastDate);firstDate.setUTCDate(firstDate.getUTCDate()-29);
    const beginning=firstDate.toISOString().slice(0,10);
    const recent=state.economy.ledger.filter(j=>j.date>=beginning&&j.date<=endDate&&journalBusinessId(state,j)===b.id);
    const valueOf=(entry,account)=>entry.entries.reduce((n,e)=>n+(e.account===account?(account==='REVENUE'?e.credit-e.debit:e.debit-e.credit):0),0);
    const recentRevenue=recent.reduce((n,j)=>n+valueOf(j,'REVENUE'),0);
    const recentCogs=recent.reduce((n,j)=>n+valueOf(j,'COGS'),0);
    const recentFixed=recent.filter(j=>j.memo.startsWith('Despesa operacional diária')).reduce((n,j)=>n+valueOf(j,'EXPENSE'),0);
    const recentOneOff=recent.filter(j=>!j.memo.startsWith('Despesa operacional diária')).reduce((n,j)=>n+valueOf(j,'EXPENSE'),0);
    const workingCapital=current.cash+current.inventoryValue+current.inTransit+current.receivables-current.payable;
    const fixedDaily=sector.dailyCost;
    let weightedContribution=0,weightedDemand=0;
    const products=b.products.map(p=>({p,stock:p.stockUnits,value:p.stockValueCents}));
    for(const row of products){
      const p=row.p,unitPrice=effectivePrice(b,p,state.calendar.date),unitCost=p.stockUnits?Math.round(p.stockValueCents/p.stockUnits):p.costCents;
      const reference=competitorReference(state,p,city);
      const demand=Math.max(0,Math.round(p.demand*city.factor/100/businesses(state).filter(x=>x.cityId===b.cityId&&x.sector===b.sector).length*demandElasticity(unitPrice,reference,city)));
      weightedDemand+=demand;weightedContribution+=demand*(unitPrice-unitCost);
    }
    const contributionPerUnit=weightedDemand?weightedContribution/weightedDemand:0;
    const breakEvenUnits=contributionPerUnit>0?Math.ceil(fixedDaily/contributionPerUnit):null;
    let cash=current.cash,creditors=current.payable,projectedRevenue=0,projectedCogs=0,unitsSold=0,missed=0,lowestCash=cash;
    let date=state.calendar.date;
    for(let d=0;d<horizonDays;d++){
      // Encomendas anteriores já estão pagas; entrega futura não provoca segunda saída de caixa.
      for(const order of b.purchaseOrders){if(order.status!=='PENDING'||order.dueDate!==date)continue;
        for(const line of order.items){const row=products.find(x=>x.p.id===line.productId);row.stock+=line.quantity;row.value+=line.total;}
      }
      const season=1+0.13*Math.sin(((state.calendar.tick+d)%365)/365*Math.PI*2);
      for(const row of products){const p=row.p,price=effectivePrice(b,p,date),ref=competitorReference(state,p,city);
        const elasticity=demandElasticity(price,ref,city);
        const demand=Math.max(0,Math.floor(p.demand*city.factor/100/businesses(state).filter(x=>x.cityId===b.cityId&&x.sector===b.sector).length*elasticity*season*1.025));
        const sold=Math.min(demand,row.stock);missed+=demand-sold;unitsSold+=sold;
        const cost=sold===row.stock?row.value:row.stock?Math.round(row.value*sold/row.stock):0;
        row.stock-=sold;row.value-=cost;projectedRevenue+=sold*price;projectedCogs+=cost;cash+=sold*price;
      }
      if(cash>=fixedDaily)cash-=fixedDaily;
      else creditors+=fixedDaily;
      lowestCash=Math.min(lowestCash,cash);
      date=dateNext(date);
    }
    const profit=projectedRevenue-projectedCogs-fixedDaily*horizonDays;
    return {horizonDays,projectedRevenue,projectedCogs,projectedFixed:fixedDaily*horizonDays,
      projectedProfit:profit,projectedCash:cash,projectedPayable:creditors,lowestCash,estimatedLostUnits:missed,estimatedSoldUnits:unitsSold,
      workingCapital,cashCoverageDays:fixedDaily?Math.floor(current.cash/fixedDaily):null,
      dailyFixed:fixedDaily,breakEvenUnits,contributionPerUnit,projectionEnd:date,
      recent:{from:beginning,to:endDate,revenue:recentRevenue,cogs:recentCogs,fixed:recentFixed,oneOff:recentOneOff,
        grossProfit:recentRevenue-recentCogs,operatingResult:recentRevenue-recentCogs-recentFixed-recentOneOff}};
  }
  // O histórico persiste nos eventos existentes da V1; nenhum campo novo é adicionado ao save.
  function priceHistory(state) {
    if(!activeBusiness(state))return [];
    return state.audit.events.filter(e=>e.type==='PRECO.ALTERADO'&&(e.businessId===activeBusiness(state).id||(!e.businessId&&activeBusiness(state).id===state.world.business?.id)))
      .filter(e=>Number.isSafeInteger(e.data?.old)&&Number.isSafeInteger(e.data?.cents))
      .map(e=>({id:e.id,date:e.date,old:e.data.old,cents:e.data.cents,productId:e.data.productId||'base',productName:e.data.productName||SECTORS[activeBusiness(state).sector].product}));
  }
  // Retorna indicadores da empresa e de cada unidade; apenas fluxos estão atribuídos a filiais.
  function groupReport(state){
    const units=businesses(state);
    const result=units.map(b=>{
      const docs=state.economy.ledger.filter(j=>journalBusinessId(state,j)===b.id);
      const sum=account=>docs.reduce((n,j)=>n+j.entries.reduce((v,e)=>v+(e.account===account?(account==='REVENUE'?e.credit-e.debit:e.debit-e.credit):0),0),0);
      const revenue=sum('REVENUE'),cogs=sum('COGS'),expenses=sum('EXPENSE');
      return {id:b.id,cityId:b.cityId,city:cityById(b.cityId).name,lot:b.lot,sector:b.sector,stock:b.stockUnits,
        stockValue:b.products.reduce((n,p)=>n+p.stockValueCents,0),inTransit:b.purchaseOrders.filter(o=>o.status==='PENDING').reduce((n,o)=>n+o.total,0),
        revenue,cogs,expenses,profit:revenue-cogs-expenses};
    });
    const total=overview(state);
    return {units:result,count:units.length,group:{cash:total.cash,revenue:total.revenue,cogs:total.cogs,expenses:total.expenses,
      profit:total.profit,stock:total.stock,inventoryValue:total.inventoryValue,inTransit:total.inTransit,payable:total.payable}};
  }
  function exportSave(state) {
    validate(state);const payload=clone(state),raw=JSON.stringify(payload);
    assert(raw.length<MAX_SAVE_CHARS,'Carreira excede limite de exportação');
    return JSON.stringify({saveFormatVersion:1,app:'Cidade dos Negócios',checksumAlgorithm:'FNV1A32',checksum:hash(raw),payload},null,2);
  }
  function importSave(raw) {
    assert(typeof raw==='string'&&raw.length<MAX_SAVE_CHARS,'Arquivo muito grande ou inválido');
    const data=JSON.parse(raw);
    if(plain(data)&&data.schemaVersion===1) {
      assert(plain(data.meta)&&data.meta.title==='Cidade dos Negócios'&&int(data.meta.seed)&&data.meta.seed<=4294967295,'Save legado inválido');
      assert(plain(data.world)&&Array.isArray(data.world.entities)&&data.world.entities.length===0&&plain(data.player)&&Object.keys(data.player).length===0&&plain(data.calendar)&&data.calendar.tick===0&&Array.isArray(data.history)&&data.history.length===0,'Save legado com atividade não suportada: preserve o original');
      const state=emptyLegacy(data.meta.seed);validate(state);
      return {state,migrated:true,message:'Fundação vazia CP-000 migrada; escolha nova carreira. Nenhum histórico criado.'};
    }
    assert(plain(data)&&data.saveFormatVersion===1&&data.app==='Cidade dos Negócios'&&data.checksumAlgorithm==='FNV1A32'&&typeof data.checksum==='string'&&plain(data.payload),'Envelope de save incompatível');
    assert(hash(JSON.stringify(data.payload))===data.checksum,'Checksum diverge: arquivo alterado ou corrompido');
    validate(data.payload);
    const migrated=data.payload.schemaVersion!==7,state=upgradedState(data.payload);validate(state);
    return {state,migrated,message:migrated?'Carreira migrada para V1.6: histórico preservado e novos fatores regionais aplicados somente daqui em diante.':'Carreira restaurada com integridade validada.'};
  }
  function diagnostics(state) { if(!state) return {ok:true,message:'Nenhuma carreira ativa; aguardando criação.',cities:CITIES.length,ufs:new Set(CITIES.map(x=>x.uf)).size};validate(state);return {ok:true,revision:state.revision,events:state.audit.events.length,journals:state.economy.ledger.length,tick:state.calendar.tick,cities:CITIES.length,ufs:new Set(CITIES.map(x=>x.uf)).size,checksum:hash(JSON.stringify(state)),status:'PASS (integridade estrutural e contábil)'}; }
  const API=Object.freeze({VERSION,SCHEMA_VERSION,START_DATE,ECONOMIC_REFERENCES,regionalProfile,competitorReference,demandElasticity,CITIES,SECTORS,SUPPLIERS,businesses,activeBusiness,businessById,groupReport,inventoryReport,effectivePrice,strategyReport,dispatch,validate,overview,exportSave,importSave,diagnostics,financialReport,priceHistory,productPerformance,cityById,money,hash,dateNext});
  return API;
})();
