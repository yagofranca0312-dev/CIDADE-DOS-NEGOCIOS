/* Cidade dos Negócios 1 — núcleo puro, sem DOM e sem rede. v2.8.0-alpha.1 */
const CidadeCore = (() => {
  'use strict';
  const VERSION = '2.8.0-alpha.1';
  const SCHEMA_VERSION = 9;
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

  // IBGE SIDRA 5938, variável 37, período 2023, unidade R$ mil; valores oficiais.
  // Fonte imutável para uso offline; mesma ordem e códigos do recorte populacional.
  const GDP_SOURCE=Object.freeze({id:'IBGE-SIDRA5938-V37-2023',year:2023,unit:'R$ mil',
    url:'https://apisidra.ibge.gov.br/values/t/5938/n6/all/v/37/p/2023'});
  const MUNICIPAL_GDP_2023=Object.freeze([
    12960966, 33749576, 18470858, 127649795, 76698777,
    86939832, 365669108, 28257606, 75780846, 42389051,
    39050753, 42269768, 130197671, 40536062, 28442131,
    120065276, 66351305, 29449063, 418462360, 31162043,
    104743272, 25402193, 18234169, 31190132, 1066825105,
    22291877, 14168469, 2265253, 6588929, 839887
  ]);
  if(MUNICIPAL_GDP_2023.length!==CITIES_SOURCE.length)throw Error('Base de PIB municipal incompleta');
  // Índice de gameplay: bonificação/penalização em pontos percentuais, limitada a ±8,
  // associada ao porte do PIB TOTAL. NÃO é renda, PIB per capita ou consumo observado.
  const gdpModelDelta=gdpThousands=>Math.max(-8,Math.min(8,Math.round(4*Math.log10(gdpThousands/20000000))));
  if(MUNICIPAL_POPULATION.length!==CITIES_SOURCE.length)throw Error('Tabela municipal desatualizada');
  // Faixas do JOGO, não classificações oficiais do IBGE/REGIC.
  const sizeTier=pop=>pop<100000?'local':pop<500000?'regional':pop<1500000?'grande':'metropole';
  const TIER_LABELS=Object.freeze({local:'Mercado local',regional:'Centro regional simulado',grande:'Centro urbano de maior porte',metropole:'Metrópole simulada'});
  const COMPETITOR_FACTOR=Object.freeze({local:102,regional:100,grande:98,metropole:96});
  const PRICE_ELASTICITY=Object.freeze({local:1.25,regional:1.4,grande:1.55,metropole:1.7});
  const CITIES=Object.freeze(CITIES_SOURCE.map(([uf,name],index)=>{
    const [ibgeCode,population2026]=MUNICIPAL_POPULATION[index],tier=sizeTier(population2026);
    const gdp2023Thousand=MUNICIPAL_GDP_2023[index];
    const populationFactor=Math.max(80,Math.min(130,Math.round(100+14*Math.log10(population2026/150000))));
    const gdpAdjustment=gdpModelDelta(gdp2023Thousand),factor=Math.max(80,Math.min(130,populationFactor+gdpAdjustment));
    return Object.freeze({
      id:`${uf}-${name.normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z\d]+/gi,'-').toUpperCase()}`,
      uf,name,capital:index<27,ibgeCode,population2026,populationYear:2026,populationReferenceDate:'2026-07-01',
      gdp2023Thousand,gdpYear:2023,gdpAdjustment,populationFactor,
      factor,sizeTier:tier,modelLabel:TIER_LABELS[tier],competitionFactor:COMPETITOR_FACTOR[tier],priceElasticity:PRICE_ELASTICITY[tier]
    });
  }));
  // REGIC 2018: sem classificações tabulares verificadas por município nesta versão.
  // Não inferir centralidade da população nem de PIB, nem atribuir falsos fluxos intermunicipais.
  const ECONOMIC_REFERENCES=Object.freeze({
    population:POPULATION_SOURCE,
    gdp:Object.freeze({...GDP_SOURCE,available:true}),
    regic:Object.freeze({year:2018,available:false,url:'https://geoftp.ibge.gov.br/organizacao_do_territorio/divisao_regional/regioes_de_influencia_das_cidades/Regioes_de_influencia_das_cidades_2018_Resultados_definitivos/base_tabular/REGIC2018_Municipios_Hierarquia_e_regiao.xlsx'})
  });
  function regionalProfile(cityId){
    const city=CITIES.find(c=>c.id===cityId);
    if(!city)return null;
    return {cityId:city.id,name:city.name,uf:city.uf,ibgeCode:city.ibgeCode,population:city.population2026,
      populationYear:2026,referenceDate:POPULATION_SOURCE.referenceDate,source:POPULATION_SOURCE.url,
      tier:city.sizeTier,tierLabel:city.modelLabel,demandFactor:city.factor,competitionFactor:city.competitionFactor,
      priceElasticity:city.priceElasticity,populationFactor:city.populationFactor,gdpAdjustment:city.gdpAdjustment,
      gdp2023Thousand:city.gdp2023Thousand,gdpYear:2023,
      gdpSource:`https://apisidra.ibge.gov.br/values/t/5938/n6/${city.ibgeCode}/v/37/p/2023`,
      regic2018:null,
      note:'População IBGE 2026 e PIB total IBGE 2023 oficiais; fator econômico e índice comercial são hipóteses fictícias. PIB per capita e REGIC sem classificação municipal integrada.'};
  }
  // Comparação somente de indicadores observados e modelo; não altera carreira.
  function regionalComparison(cityIds){
    assert(Array.isArray(cityIds)&&cityIds.length>=1&&cityIds.length<=30,'Comparação regional inválida');
    return cityIds.map(id=>{
      const c=cityById(id);assert(c,'Cidade desconhecida na comparação');
      return {cityId:c.id,name:c.name,uf:c.uf,ibgeCode:c.ibgeCode,population2026:c.population2026,
        gdp2023Thousand:c.gdp2023Thousand,populationFactor:c.populationFactor,
        gdpAdjustment:c.gdpAdjustment,simulatedDemandFactor:c.factor,competitionFactor:c.competitionFactor,
        note:'Índice comercial simulado; PIB em R$ mil; não representa lucro ou renda domiciliar.'};
    });
  }
  function competitorReference(state,p,city,sectorId=activeBusiness(state)?.sector){
    const rival=state.world.rivalEconomy?.rivals.find(r=>r.cityId===city.id&&r.sector===sectorId);
    return rival?p.referenceCents*rival.priceIndex/100:
      p.referenceCents*state.world.competitor.priceIndex/100*city.competitionFactor/100;
  }
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
  // V2.4-A: processos administrativos fictícios, sem relação com obrigações legais reais.
  const PARALEGAL_SERVICES=Object.freeze({
    cadastro:Object.freeze({label:'Cadastro administrativo fictício',feeCents:12000,processingDays:2,validDays:null}),
    licenca:Object.freeze({label:'Licença operacional fictícia',feeCents:36000,processingDays:4,validDays:365})
  });
  function paralegalReport(state){
    if(!state)return [];
    return businesses(state).map(b=>{
      const processes=Object.entries(PARALEGAL_SERVICES).map(([service,config])=>{
        const history=state.audit.events.filter(e=>e.businessId===b.id&&
          (e.type==='PARALEGAL.PROTOCOLADO'||e.type==='PARALEGAL.CONCLUIDO')&&e.data?.service===service);
        const latest=history.at(-1)||null;
        let status='PENDENTE',dueDate=null,expiresAt=null;
        if(latest?.type==='PARALEGAL.PROTOCOLADO'){status='EM_ANALISE';dueDate=latest.data.dueDate;}
        if(latest?.type==='PARALEGAL.CONCLUIDO'){
          expiresAt=latest.data.expiresAt||null;
          status=expiresAt&&expiresAt<state.calendar.date?'VENCIDA':'CONCLUIDO';
        }
        return {service,label:config.label,feeCents:config.feeCents,status,dueDate,expiresAt,historyCount:history.length};
      });
      return {businessId:b.id,cityId:b.cityId,city:cityById(b.cityId)?.name||'—',
        sector:b.sector,processes};
    });
  }
  function processParalegalDue(draft){
    for(const unit of paralegalReport(draft)){
      for(const p of unit.processes){
        if(p.status!=='EM_ANALISE'||p.dueDate>draft.calendar.date)continue;
        const service=PARALEGAL_SERVICES[p.service];
        const expiresAt=service.validDays?addDays(draft.calendar.date,service.validDays):null;
        event(draft,'PARALEGAL.CONCLUIDO',`${service.label} concluído para ${unit.businessId} (simulação).`,
          {service:p.service,expiresAt},unit.businessId);
      }
    }
  }

  // V2.4-B: RH e folha do jogo, armazenados somente em eventos auditados (schema 9).
  const RH_ROLES=Object.freeze({
    atendimento:Object.freeze({label:'Atendimento',salaryCents:150000,productivityPercent:6}),
    logistica:Object.freeze({label:'Logística',salaryCents:190000,productivityPercent:8}),
    gestao:Object.freeze({label:'Gestão',salaryCents:300000,productivityPercent:4})
  });
  function rhEmployees(state,asOf=state?.calendar?.date){
    if(!state)return [];
    const rows=new Map();
    for(const e of state.audit.events){
      if(e.date>asOf)continue;
      if(e.type==='RH.CONTRATADO'&&e.data&&RH_ROLES[e.data.role]&&!rows.has(e.data.employeeId)){
        rows.set(e.data.employeeId,{id:e.data.employeeId,businessId:e.businessId,name:e.data.employeeName,
          role:e.data.role,hiredAt:e.date,dismissedAt:null,salaryCents:RH_ROLES[e.data.role].salaryCents});
      }else if(e.type==='RH.DESLIGADO'&&e.data){
        const employee=rows.get(e.data.employeeId);
        if(employee)employee.dismissedAt=e.date;
      }
    }
    return [...rows.values()];
  }
  function rhProductivity(state,businessId,asOf=state.calendar.date){
    return Math.min(25,rhEmployees(state,asOf).filter(x=>x.businessId===businessId&&!x.dismissedAt)
      .reduce((n,x)=>n+RH_ROLES[x.role].productivityPercent,0));
  }
  function rhReport(state){
    if(!state)return {units:[],totalActive:0,pendingCents:0};
    const employees=rhEmployees(state);
    const payrollEvents=state.audit.events.filter(e=>e.type==='RH.FOLHA_APURADA');
    const payments=state.audit.events.filter(e=>e.type==='RH.FOLHA_PAGA');
    const units=businesses(state).map(b=>{
      const staff=employees.filter(x=>x.businessId===b.id);
      const active=staff.filter(x=>!x.dismissedAt);
      const payrolls=payrollEvents.filter(e=>e.businessId===b.id).map(e=>{
        const paid=payments.some(p=>p.businessId===b.id&&p.data?.period===e.data.period);
        return {period:e.data.period,amount:e.data.amount,employees:e.data.employees,status:paid?'PAID':'OPEN'};
      });
      return {businessId:b.id,city:cityById(b.cityId)?.name||'—',sector:b.sector,
        employees:staff,payrolls,activeCount:active.length,monthlyCents:active.reduce((n,x)=>n+x.salaryCents,0),
        bonusPercent:Math.min(25,active.reduce((n,x)=>n+RH_ROLES[x.role].productivityPercent,0)),
        pendingCents:payrolls.filter(p=>p.status==='OPEN').reduce((n,p)=>n+p.amount,0)};
    });
    return {units,totalActive:units.reduce((n,u)=>n+u.activeCount,0),
      pendingCents:units.reduce((n,u)=>n+u.pendingCents,0)};
  }
  // V2.4.1: baixa de passivos OPERACIONAIS por unidade, sem reapuração de despesas.
  // Folhas RH e TAX_PAYABLE mantêm rotinas independentes; históricos sem origem certa não são liquidados aqui.
  function operatingPayablesReport(state){
    if(!state)return {units:[],total:0,unclassified:0};
    const units=businesses(state).map(b=>({businessId:b.id,city:cityById(b.cityId)?.name||'—',
      recognized:0,paid:0,outstanding:0}));
    const byId=new Map(units.map(u=>[u.businessId,u]));
    for(const j of state.economy.ledger){
      const row=byId.get(journalBusinessId(state,j));if(!row)continue;
      const kind=transactionKind(j);
      if(kind==='DAILY_EXPENSE')for(const e of j.entries)
        if(e.account==='PAYABLE')row.recognized+=e.credit-e.debit;
      if(kind==='OPERATING_SETTLEMENT')for(const e of j.entries)
        if(e.account==='PAYABLE')row.paid+=e.debit-e.credit;
    }
    for(const u of units)u.outstanding=u.recognized-u.paid;
    const total=units.reduce((n,u)=>n+u.outstanding,0);
    const payroll=rhReport(state).pendingCents;
    return {units,total,unclassified:balance(state,'PAYABLE')-total-payroll,
      note:'Somente despesas diárias identificadas no razão podem ser quitadas nesta rotina. A folha possui baixa independente.'};
  }
  // Estimativa de folha futura da unidade ativa: mesmo critério pró-rata do reconhecimento mensal.
  // Nenhuma consulta gera folha no livro; cenário presume equipe inalterada.
  function estimatedPayrollMonth(state,businessId,period){
    const start=period+'-01';
    const end=new Date(Date.UTC(Number(period.slice(0,4)),Number(period.slice(5,7)),0)).toISOString().slice(0,10);
    return rhEmployees(state).filter(x=>x.businessId===businessId&&x.hiredAt<=end&&(!x.dismissedAt||x.dismissedAt>=start))
      .reduce((sum,x)=>{
        const from=x.hiredAt>start?x.hiredAt:start,to=x.dismissedAt&&x.dismissedAt<end?x.dismissedAt:end;
        const days=Math.min(30,Math.round((Date.parse(to+'T12:00:00Z')-Date.parse(from+'T12:00:00Z'))/86400000)+1);
        return sum+Math.round(x.salaryCents*days/30);
      },0);
  }
  function accruePayrollMonth(draft,period){
    const start=period+'-01';
    const end=new Date(Date.UTC(Number(period.slice(0,4)),Number(period.slice(5,7)),0)).toISOString().slice(0,10);
    const staff=rhEmployees(draft);
    for(const b of businesses(draft)){
      if(draft.audit.events.some(e=>e.type==='RH.FOLHA_APURADA'&&e.businessId===b.id&&e.data?.period===period))continue;
      const eligible=staff.filter(x=>x.businessId===b.id&&x.hiredAt<=end&&(!x.dismissedAt||x.dismissedAt>=start));
      const amount=eligible.reduce((sum,x)=>{
        const from=x.hiredAt>start?x.hiredAt:start,to=x.dismissedAt&&x.dismissedAt<end?x.dismissedAt:end;
        const days=Math.min(30,Math.round((Date.parse(to+'T12:00:00Z')-Date.parse(from+'T12:00:00Z'))/86400000)+1);
        return sum+Math.round(x.salaryCents*days/30);
      },0);
      if(!amount)continue;
      journal(draft,'RH/DP · folha simulada '+period+' · '+b.id,[
        {account:'EXPENSE',debit:amount,credit:0},{account:'PAYABLE',debit:0,credit:amount}],b.id,'PAYROLL_ACCRUAL');
      event(draft,'RH.FOLHA_APURADA','Folha fictícia '+period+' registrada como obrigação: '+money(amount)+'.',
        {period,amount,employees:eligible.length},b.id);
    }
  }
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
    if(original.schemaVersion===9)return clone(original);
    assert([2,3,4,5,6,7,8].includes(original.schemaVersion),'Schema de save não suportado');
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
    // Migrações preservam o registro de introdução da V1.6; V1.7 só afeta dias futuros.
    if(state.schemaVersion<7){
      state.world.regional={datasetId:POPULATION_SOURCE.id,modelId:'REGIONAL-V1',effectiveFrom:state.calendar.date};
      state.schemaVersion=7;
    }
    if(state.schemaVersion<8){
      state.world.regional={...state.world.regional,modelId:'REGIONAL-V2-PIB',gdpDatasetId:GDP_SOURCE.id,gdpEffectiveFrom:state.calendar.date};
      state.schemaVersion=8;
    }
    if(state.schemaVersion<9){
      state.fiscal=initialFiscal(); // Mera inclusão de esquema; nenhum imposto retroativo.
      state.schemaVersion=9;
    }
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
    return j.memo==='Capital inicial do empreendedor'||['LOAN_DRAW','LOAN_INTEREST','LOAN_LATE_FEE','LOAN_PAYMENT','LOGISTICS_CD_OPEN','LOGISTICS_CD_DAILY','LOGISTICS_CD_PURCHASE','LOGISTICS_CD_VENDOR_RECEIPT','LOGISTICS_CD_DISPATCH','LOGISTICS_CD_CLEAR','LOGISTICS_CD_RECEIVE','LOGISTICS_CD_FEE','LOGISTICS_CD_WASTE','LOGISTICS_CD_SETTLEMENT'].includes(transactionKind(j))?null:state.world.business?.id??null;
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
  function registerPurchase(draft,b,supplierId,items,contract=null){
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
      assert(!contract||(contract.productId===p.id&&contract.quantity===quantity&&contract.supplierId===supplier.id),'Pedido não corresponde ao contrato de fornecimento');
      const unitCost=contract?contract.unitCostCents:Math.round(p.costCents*supplier.priceFactor/100),cost=quantity*unitCost;
      total+=cost;qtyTotal+=quantity;
      return {productId:p.id,name:p.name,quantity,unitCost,total:cost};
    });
    const allPending=b.purchaseOrders.filter(o=>o.status==='PENDING')
      .reduce((n,o)=>n+o.items.reduce((sum,x)=>sum+x.quantity,0),0);
    const incomingInternal=logisticsRead(draft).transfers.filter(t=>t.status==='PENDING'&&t.toId===b.id)
      .reduce((n,t)=>n+t.quantity,0);
    assert(b.stockUnits+allPending+incomingInternal+qtyTotal<=100000,
      'Capacidade total da unidade, incluindo transferências em trânsito, excedida');
    assert(Number.isSafeInteger(total)&&balance(draft,'CASH')>=total,`Caixa insuficiente para encomenda: ${money(total)}`);
    assert(b.purchaseOrders.length<20000,'Histórico de compras cheio');
    const id=`pc-${++b.orderSeq}`,dueDate=addDays(draft.calendar.date,supplier.leadDays);
    b.purchaseOrders.push({id,date:draft.calendar.date,supplierId,items:lines,total,status:'PENDING',dueDate,receivedAt:null,...(contract?{contractId:contract.id}:{})});
    journal(draft,`Encomenda ${id}: mercadorias em trânsito`,[
      {account:'IN_TRANSIT',debit:total,credit:0},{account:'CASH',debit:0,credit:total}],b.id,'PURCHASE');
    event(draft,'COMPRA.ENCOMENDADA',`Pedido ${id} pago (${money(total)}); previsão ${dueDate} (${supplier.leadDays} dia(s)).`,{id,total,dueDate,supplierId,...(contract?{contractId:contract.id}:{})},b.id);
  }
  function receiveDueOrders(draft,b){
    if(!b)return;
    for(const order of b.purchaseOrders){
      if(order.status!=='PENDING'||order.dueDate>draft.calendar.date)continue;
      for(const line of order.items){const p=product(b,line.productId);
        p.stockUnits+=line.quantity;p.stockValueCents+=line.total;
      }
      syncTotals(b);
      if(draft.economy.logistics)for(const line of order.items)logisticsAddLot(draft,b.id,b.sector,line.productId,line.quantity,draft.calendar.date);
      order.status='RECEIVED';order.receivedAt=draft.calendar.date;
      journal(draft,`Recebimento ${order.id} em estoque`,[
        {account:'INVENTORY',debit:order.total,credit:0},{account:'IN_TRANSIT',debit:0,credit:order.total}],b.id,'RECEIPT');
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
    logisticsConsumeSale(draft,b,lines);
    b.totalSold+=qtyTotal;syncTotals(b);const id=`vd-${++b.saleSeq}`;
    b.sales.push({id,date:draft.calendar.date,kind,items:lines,total,cogs:cost});
    journal(draft,`Venda ${id} (${kind}): ${lines.map(x=>`${x.quantity} ${x.name}`).join(', ')}`,[
      {account:'CASH',debit:total,credit:0},{account:'REVENUE',debit:0,credit:total},
      {account:'COGS',debit:cost,credit:0},{account:'INVENTORY',debit:0,credit:cost}],b.id,'SALE');
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
  // Classificação contábil/financeira, sem alterar nem supor a classificação dos journals legados.
  // Para records antigos o reconhecimento exige prefixos efetivamente produzidos pelo jogo.
  const ACCOUNT_CATALOG=Object.freeze({
    CASH:Object.freeze({name:'Caixa do grupo',group:'ASSET',normal:'DEBIT'}),
    INVENTORY:Object.freeze({name:'Mercadorias em estoque',group:'ASSET',normal:'DEBIT'}),
    IN_TRANSIT:Object.freeze({name:'Mercadorias em trânsito',group:'ASSET',normal:'DEBIT'}),
    RECEIVABLE:Object.freeze({name:'Contas a receber',group:'ASSET',normal:'DEBIT'}),
    PAYABLE:Object.freeze({name:'Contas a pagar',group:'LIABILITY',normal:'CREDIT'}),
    CAPITAL:Object.freeze({name:'Capital aportado',group:'EQUITY',normal:'CREDIT'}),
    REVENUE:Object.freeze({name:'Receita de vendas',group:'REVENUE',normal:'CREDIT'}),
    COGS:Object.freeze({name:'Custo das mercadorias vendidas',group:'COST',normal:'DEBIT'}),
    EXPENSE:Object.freeze({name:'Despesas operacionais e de abertura',group:'EXPENSE',normal:'DEBIT'}),
    TAX_EXPENSE:Object.freeze({name:'Tributo simulado por competência',group:'EXPENSE',normal:'DEBIT'}),
    TAX_PAYABLE:Object.freeze({name:'Tributo simulado a pagar',group:'LIABILITY',normal:'CREDIT'}),
    LOAN_PAYABLE:Object.freeze({name:'Principal de financiamento',group:'LIABILITY',normal:'CREDIT'}),
    INTEREST_PAYABLE:Object.freeze({name:'Juros de financiamento a pagar',group:'LIABILITY',normal:'CREDIT'}),
    LOAN_FEES_PAYABLE:Object.freeze({name:'Multas fictícias de financiamento',group:'LIABILITY',normal:'CREDIT'}),
    CONTRACT_PAYABLE:Object.freeze({name:'Multas de contratos de fornecimento',group:'LIABILITY',normal:'CREDIT'}),
    INTERNAL_CLEARING:Object.freeze({name:'Compensação interna de estoques',group:'ASSET',normal:'DEBIT'})
  });
  const TRANSACTION_KINDS=Object.freeze(['CAPITAL','OPENING','SALE','PURCHASE','RECEIPT','DAILY_EXPENSE','TAX_ASSESSMENT','TAX_PAYMENT','PARALEGAL_FEE','PAYROLL_ACCRUAL','PAYROLL_PAYMENT','OPERATING_SETTLEMENT','LOAN_DRAW','LOAN_INTEREST','LOAN_LATE_FEE','LOAN_PAYMENT','CONTRACT_PENALTY','CONTRACT_PAYMENT','LOGISTICS_DISPATCH','LOGISTICS_CLEAR','LOGISTICS_RECEIVE','LOGISTICS_SHIP_FEE','LOGISTICS_WASTE','LOGISTICS_PRODUCTION','LOGISTICS_CD_OPEN','LOGISTICS_CD_DAILY','LOGISTICS_CD_PURCHASE','LOGISTICS_CD_VENDOR_RECEIPT','LOGISTICS_CD_DISPATCH','LOGISTICS_CD_CLEAR','LOGISTICS_CD_RECEIVE','LOGISTICS_CD_FEE','LOGISTICS_CD_WASTE','LOGISTICS_CD_SETTLEMENT','UNCLASSIFIED']);
  function transactionKind(j){
    if(TRANSACTION_KINDS.includes(j.kind))return j.kind;
    if(j.memo==='Capital inicial do empreendedor')return 'CAPITAL';
    if(/^Abertura: /.test(j.memo))return 'OPENING';
    if(/^Venda vd-/.test(j.memo))return 'SALE';
    if(/^Encomenda pc-/.test(j.memo))return 'PURCHASE';
    if(/^Recebimento pc-/.test(j.memo))return 'RECEIPT';
    if(/^Despesa operacional diária/.test(j.memo))return 'DAILY_EXPENSE';
    return 'UNCLASSIFIED';
  }
  function journal(draft,memo,entries,businessId=null,kind=null) {
    const debit=entries.reduce((n,x)=>n+x.debit,0),credit=entries.reduce((n,x)=>n+x.credit,0);
    assert(debit===credit && debit>0,'Lançamento desequilibrado');
    assert(entries.every(x=>typeof x.account==='string'&&ACCOUNT_CATALOG[x.account]&&int(x.debit)&&int(x.credit)&&!(x.debit&&x.credit)),'Linha financeira inválida');
    const record={id:`jnl-${++draft.economy.journalSeq}`,date:draft.calendar.date,memo,entries,...(businessId?{businessId}:{})};
    const label=kind||transactionKind(record);
    assert(TRANSACTION_KINDS.includes(label),'Classe de transação inválida');
    // Novo metadado opcional. Schema 8 e registros históricos permanecem intocados.
    record.kind=label;
    draft.economy.ledger.push(record);
  }
  function balance(draft,account) {let total=0;for(const j of draft.economy.ledger)for(const e of j.entries)if(e.account===account)total+=(['CAPITAL','REVENUE','PAYABLE','TAX_PAYABLE','LOAN_PAYABLE','INTEREST_PAYABLE','LOAN_FEES_PAYABLE','CONTRACT_PAYABLE'].includes(account)?e.credit-e.debit:e.debit-e.credit);return total;}

  // V1.9: FISCAL é uma simulação didática, não software de apuração. Fonte por competência.
  const FISCAL_RULE_PACKS=Object.freeze({
    simples2026:Object.freeze({id:'SN-ANEXO-I-2026-EDU-1',regime:'SIMPLES_COMERCIO_HIPOTETICO',effectiveFrom:'2026-01-01',effectiveTo:'2026-12-31',
      sourceUrls:Object.freeze(['https://www.planalto.gov.br/ccivil_03/leis/lcp/lcp123.htm','https://normas.receita.fazenda.gov.br/sijut2consulta/link.action?idAto=92278']),
      coverage:'SIMULATED_PARTIAL',scope:'Hipótese de comércio Anexo I puro, sem receitas segregadas, ST, monofasia, benefícios ou ICMS específico',
      brackets:Object.freeze([[18000000,400,0],[36000000,730,594000],[72000000,950,1386000],[180000000,1070,2250000],[360000000,1430,8730000],[480000000,1900,37800000]])}),
    transition:Object.freeze({id:'RTC-2026-2033-EDU-1',coverage:'EDUCATIONAL_ONLY',startYear:2026,endYear:2033,
      sourceUrls:Object.freeze(['https://www.gov.br/receitafederal/pt-br/acesso-a-informacao/acoes-e-programas/reforma-tributaria-do-consumo/entenda',
        'https://www.gov.br/receitafederal/pt-br/assuntos/noticias/2026/setembro/simples-nacional-2027-entenda-os-novos-prazos-e-faca-sua-escolha-com-consciencia-e-tranquilidade/']),
      note:'Destaque do ano-teste 2026 não é obrigação de pagar. Fora dele, regras completas e alíquotas não cobertas.'})
  });
  function initialFiscal(){return {mode:'DEMONSTRACAO_ECONOMICA',coverageStatus:'NOT_COVERED',rulePackId:null,activatedAt:null,effectiveFrom:null,assessments:[]};}
  function taxMonthNext(period){const [y,m]=period.split('-').map(Number);return m===12?`${y+1}-01`:`${y}-${String(m+1).padStart(2,'0')}`;}
  const periodKey=date=>date.slice(0,7);

  // V2.4-C: fluxo administrativo fiscal do JOGO. Não gera obrigações brasileiras reais.
  // Datas e tarefas são puramente lúdicas. Não cria valores fiscais nem altera o ledger.
  const FISCAL_OP_TASKS=Object.freeze([
    Object.freeze({id:'vendas',label:'Conferir vendas registradas',dueDay:5}),
    Object.freeze({id:'estoque',label:'Conferir estoque e trânsito',dueDay:8}),
    Object.freeze({id:'razao',label:'Conferir razão e demonstrativos',dueDay:12})
  ]);
  const previousMonth=period=>{
    const y=Number(period.slice(0,4)),m=Number(period.slice(5,7));
    return m===1?`${y-1}-12`:`${y}-${String(m-1).padStart(2,'0')}`;
  };
  function fiscalOperationsReport(state){
    if(!state)return {units:[],openPeriods:0,overdueTasks:0,closedPeriods:0};
    const activated=new Map(),completed=new Set(),closed=new Set();
    for(const e of state.audit.events){
      if(e.type==='FISCAL_OP.ATIVADO'&&e.businessId&&!activated.has(e.businessId))
        activated.set(e.businessId,e);
      if(e.type==='FISCAL_OP.TAREFA_CONCLUIDA'&&e.businessId)
        completed.add(e.businessId+'|'+e.data.period+'|'+e.data.task);
      if(e.type==='FISCAL_OP.FECHADO'&&e.businessId)
        closed.add(e.businessId+'|'+e.data.period);
    }
    const latestPeriod=previousMonth(periodKey(state.calendar.date));
    const units=businesses(state).map(b=>{
      const activation=activated.get(b.id),periods=[];
      if(activation){
        let period=periodKey(activation.date);
        while(period<=latestPeriod){
          const next=taxMonthNext(period),tasks=FISCAL_OP_TASKS.map(def=>{
            const done=completed.has(b.id+'|'+period+'|'+def.id);
            const dueDate=next+'-'+String(def.dueDay).padStart(2,'0');
            return {id:def.id,label:def.label,dueDate,status:done?'CONCLUIDA':dueDate<state.calendar.date?'ATRASADA':'PENDENTE'};
          });
          const isClosed=closed.has(b.id+'|'+period),dueDate=next+'-15';
          periods.push({period,dueDate,tasks,closed:isClosed,
            status:isClosed?'FECHADO':dueDate<state.calendar.date?'ATRASADO':'EM_ANDAMENTO',
            canClose:!isClosed&&tasks.every(t=>t.status==='CONCLUIDA')});
          period=next;
        }
      }
      return {businessId:b.id,city:cityById(b.cityId)?.name||'—',sector:b.sector,
        activatedAt:activation?.date||null,periods};
    });
    return {units,
      openPeriods:units.reduce((n,u)=>n+u.periods.filter(p=>!p.closed).length,0),
      overdueTasks:units.reduce((n,u)=>n+u.periods.reduce((m,p)=>m+(p.closed?0:p.tasks.filter(t=>t.status==='ATRASADA').length),0),0),
      closedPeriods:units.reduce((n,u)=>n+u.periods.filter(p=>p.closed).length,0)};
  }
  function revenuesInMonth(state,month){return state.economy.ledger.filter(j=>periodKey(j.date)===month).reduce((sum,j)=>sum+j.entries.reduce((n,e)=>n+(e.account==='REVENUE'?e.credit-e.debit:0),0),0);}
  function rbt12Annualized(state,period,currentRevenue){
    // Hipótese de início de atividade: mês inicial receita × 12; meses seguintes média de meses anteriores × 12.
    const start=START_DATE.slice(0,7),elapsed=(+period.slice(0,4)-+start.slice(0,4))*12+(+period.slice(5,7)-+start.slice(5,7));
    const months=Math.min(12,Math.max(0,elapsed));let sum=0;
    const d=new Date(`${period}-01T12:00:00Z`);
    for(let n=0;n<months;n++){d.setUTCMonth(d.getUTCMonth()-1);sum+=revenuesInMonth(state,d.toISOString().slice(0,7));}
    return months===0?currentRevenue*12:months<12?Math.round(sum/months*12):sum;
  }
  function taxEligibility(state,period){
    if(period<'2026-11'||period>'2026-12')return {supported:false,reason:'Somente competências de 2026 possuem pacote de tributação contabilizável. Reforma posterior: EDUCATIONAL_ONLY/UNSUPPORTED.'};
    const units=businesses(state);
    if(!units.length||units.some(b=>!['mercado','roupas'].includes(b.sector)))return {supported:false,reason:'Hipótese de comércio puro não cobre ausência de loja ou padaria/produção própria.'};
    if(new Set(units.map(b=>cityById(b.cityId).uf)).size!==1)return {supported:false,reason:'Rede em múltiplas UFs: particularidades estaduais e segregações não cobertas.'};
    return {supported:true,reason:'Cenário hipotético restrito: comércio Anexo I, sem benefícios, ST, monofasia e segregações de operações.'};
  }
  function taxEstimate(state,period){
    assert(typeof period==='string'&&/^\d{4}-(0[1-9]|1[0-2])$/.test(period),'Competência fiscal inválida');
    const revenue=revenuesInMonth(state,period),eligibility=taxEligibility(state,period);
    if(!eligibility.supported)return {period,coverageStatus:'UNSUPPORTED',reason:eligibility.reason,revenue,rbt12:null,rateBasisPoints:null,amount:null,bracket:null,packId:null};
    const pack=FISCAL_RULE_PACKS.simples2026,rbt12=rbt12Annualized(state,period,revenue);
    if(rbt12>480000000)return {period,coverageStatus:'UNSUPPORTED',reason:'RBT12 anualizada excede limite simplificado de R$ 4,8 milhões.',revenue,rbt12,rateBasisPoints:null,amount:null,bracket:null,packId:pack.id};
    const bracket=pack.brackets.findIndex(([limit])=>rbt12<=limit);
    const [limit,nominal,deduction]=pack.brackets[bracket];
    // Alíquota em pontos-base; cálculo intermediário não é documento fiscal. Arredondamento em centavos.
    const effectiveNumerator=rbt12*nominal-deduction*10000;
    const rateBasisPoints=rbt12===0?nominal:Math.max(0,Math.round(effectiveNumerator/rbt12*100)/100);
    // Valor final arredondado uma única vez, sem truncar a alíquota efetiva previamente.
    const amount=rbt12===0?0:Math.round(revenue*Math.max(0,effectiveNumerator)/rbt12/10000);
    return {period,coverageStatus:'SIMULATED_PARTIAL',reason:eligibility.reason,revenue,rbt12,rateBasisPoints,amount,bracket:bracket+1,packId:pack.id};
  }
  function transitionReport(state){
    const year=Number(state.calendar.date.slice(0,4)),y=Math.min(2033,Math.max(2026,year));
    const period=periodKey(state.calendar.date),revenue=revenuesInMonth(state,period);
    const phase=year===2026?'ANO_TESTE':year<=2028?'CBS_IBS_TRANSICAO':year<=2032?'TRANSICAO_ICMS_ISS':'MODELO_2033_OU_POSTERIOR';
    return {year,phase,coverageStatus:'EDUCATIONAL_ONLY',source:FISCAL_RULE_PACKS.transition.sourceUrls[0],
      revenueCurrentMonth:revenue,ibsTestCents:year===2026?Math.round(revenue*.001):null,
      cbsTestCents:year===2026?Math.round(revenue*.009):null,postingToLedger:false,
      note:year===2026?'IBS/CBS 2026: parâmetros informativos do ano-teste; obrigações acessórias e condições de recolhimento não são apuradas. Não gera caixa nem passivo.':'Reforma 2027+: cronologia educativa sem cálculo de IBS/CBS exigível; alíquotas, créditos e opções não são simulados.'};
  }
  function taxReport(state){
    const f=state.fiscal,period=periodKey(state.calendar.date),estimate=taxEstimate(state,period),total=balance(state,'TAX_PAYABLE');
    return {mode:f.mode,coverageStatus:f.coverageStatus,currentPeriodCoverage:estimate.coverageStatus,rulePackId:f.rulePackId,activatedAt:f.activatedAt,effectiveFrom:f.effectiveFrom,
      currentPeriod:period,estimate,assessments:clone(f.assessments),taxPayable:total,
      transition:transitionReport(state),
      note:f.rulePackId?'Cálculo SIMULADO para decisão no jogo; não equivale ao PGDAS-D/DAS real.':'Sem apuração ativa: nenhum tributo contabilizado.'};
  }
  function closeTaxMonth(state,period){
    const f=state.fiscal;
    if(f.mode!=='SIMULACAO_SIMPLES_COMERCIO'||period<f.effectiveFrom)return;
    assert(!f.assessments.some(a=>a.period===period),'Período já apurado');
    const estimate=taxEstimate(state,period);
    if(estimate.coverageStatus!=='SIMULATED_PARTIAL'){
      f.assessments.push({period,status:'UNSUPPORTED',reason:estimate.reason,amount:0,paid:0,rulePackId:null});
      event(state,'FISCAL.NAO_COBERTO',`${period}: regra tributária indisponível — nenhuma cobrança criada.`,{period,reason:estimate.reason});
      return;
    }
    const amount=estimate.amount;
    if(amount>0)journal(state,`Tributo simulado Simples Anexo I · ${period}`,[
      {account:'TAX_EXPENSE',debit:amount,credit:0},{account:'TAX_PAYABLE',debit:0,credit:amount}],null,'TAX_ASSESSMENT');
    f.assessments.push({period,status:amount?'OPEN':'ZERO_SIMULATED',amount,paid:0,rulePackId:estimate.packId,
      revenue:estimate.revenue,rbt12:estimate.rbt12,rateBasisPoints:estimate.rateBasisPoints,bracket:estimate.bracket});
    event(state,'FISCAL.APURADO',`Competência ${period}: tributo educativo contabilizado ${money(amount)}.`,{period,amount,packId:estimate.packId});
  }

  function overview(draft) {
    if(!draft)return null;
    const revenue=balance(draft,'REVENUE'),cogs=balance(draft,'COGS'),expenses=balance(draft,'EXPENSE');
    const taxExpense=balance(draft,'TAX_EXPENSE'),taxPayable=balance(draft,'TAX_PAYABLE');
    return {cash:balance(draft,'CASH'),inventoryValue:balance(draft,'INVENTORY'),inTransit:balance(draft,'IN_TRANSIT'),receivables:balance(draft,'RECEIVABLE'),payable:balance(draft,'PAYABLE'),...(draft.economy.financing?{loanPayable:balance(draft,'LOAN_PAYABLE'),interestPayable:balance(draft,'INTEREST_PAYABLE'),loanFeesPayable:balance(draft,'LOAN_FEES_PAYABLE'),contractPayable:balance(draft,'CONTRACT_PAYABLE')}:{}),taxPayable,taxExpense,revenue,cogs,expenses,profit:revenue-cogs-expenses-taxExpense,stock:businesses(draft).reduce((n,b)=>n+b.stockUnits,0)+(draft.economy.logistics?.depot?.stock.reduce((n,p)=>n+p.stockUnits,0)||0),unitPrice:activeBusiness(draft)?.unitPrice??null,units:businesses(draft).length,tick:draft.calendar.tick,city:cityById(activeBusiness(draft)?.cityId||draft.player.cityId)?.name??'—'};
  }
  function emptyLegacy(seed) {return {
    schemaVersion:9,worldId:`legacy-${seed}`,revision:0,
    meta:{title:'Cidade dos Negócios',version:VERSION,origin:'MIGRATED_EMPTY_CP000',mode:'DEMONSTRACAO_ECONOMICA'},
    calendar:{date:START_DATE,tick:0},rng:{seed},
    player:{name:'',companyName:'',cityId:null},world:{cities:CITIES.map(x=>x.id),business:null,branches:[],branchSeq:0,activeBusinessId:null,regional:{datasetId:POPULATION_SOURCE.id,modelId:'REGIONAL-V2-PIB',effectiveFrom:START_DATE,gdpDatasetId:GDP_SOURCE.id,gdpEffectiveFrom:START_DATE},competitor:{priceIndex:100}},
    economy:{journalSeq:0,ledger:[]},fiscal:initialFiscal(),
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
    journal(state,'Capital inicial do empreendedor',[{account:'CASH',debit:3000000,credit:0},{account:'CAPITAL',debit:0,credit:3000000}],null,'CAPITAL');
    event(state,'CARREIRA.CRIADA',`Carreira iniciada em ${city.name} (${city.uf}).`);
    state.revision=1;
    state.audit.commands[commandId]=fingerprint({type:'CARREIRA.CRIAR',payload});
    validate(state);
    return state;
  }
  function handler(draft,type,payload) {
    const b=activeBusiness(draft);


    if(type.startsWith('LOGISTICA.')){handleLogisticsCommand(draft,type,payload);return;}
    if(type==='FISCAL_OP.ATIVAR'){
      const target=businessById(draft,String(payload.businessId||''));
      assert(target,'Estabelecimento não encontrado para rotinas fiscais');
      assert(!draft.audit.events.some(e=>e.type==='FISCAL_OP.ATIVADO'&&e.businessId===target.id),
        'Rotinas fiscais do jogo já ativadas nesta unidade');
      assert(payload.acceptSimulation===true,'Confirme que são tarefas inteiramente fictícias, sem efeitos legais');
      event(draft,'FISCAL_OP.ATIVADO',
        'Checklist fiscal fictício ativado para '+target.id+' a partir da competência '+periodKey(draft.calendar.date)+'.',
        {firstPeriod:periodKey(draft.calendar.date)},target.id);
      return;
    }
    if(type==='FISCAL_OP.CONCLUIR_TAREFA'){
      const target=businessById(draft,String(payload.businessId||''));
      const period=String(payload.period||''),task=String(payload.task||'');
      assert(target,'Estabelecimento não encontrado para checklist fiscal');
      assert(FISCAL_OP_TASKS.some(x=>x.id===task),'Tarefa fiscal fictícia desconhecida');
      const periodRow=fiscalOperationsReport(draft).units.find(u=>u.businessId===target.id)?.periods
        .find(p=>p.period===period);
      assert(periodRow&&!periodRow.closed,'Competência não habilitada, ainda em curso ou já fechada');
      assert(periodRow.tasks.some(t=>t.id===task&&t.status!=='CONCLUIDA'),'Tarefa já concluída');
      event(draft,'FISCAL_OP.TAREFA_CONCLUIDA',
        'Revisão interna '+task+' da competência '+period+' concluída (simulação).',
        {period,task},target.id);
      return;
    }
    if(type==='FISCAL_OP.FECHAR'){
      const target=businessById(draft,String(payload.businessId||''));
      const period=String(payload.period||'');
      assert(target,'Estabelecimento não encontrado para fechamento fiscal');
      const row=fiscalOperationsReport(draft).units.find(u=>u.businessId===target.id)?.periods
        .find(p=>p.period===period);
      assert(row&&!row.closed,'Competência não habilitada, não encerrada no calendário ou já fechada');
      assert(row.canClose,'Conclua todas as três conferências antes de fechar');
      const integrity=reconciliationReport(draft);
      assert(integrity.ok,'Conciliação contábil do grupo inconsistente; fechamento bloqueado');
      const summary=monthlyClose(draft,period,target.id);
      event(draft,'FISCAL_OP.FECHADO',
        'Fechamento administrativo fictício de '+period+' concluído para '+target.id+'.',
        {period,operatingResult:summary.operatingResult,netCash:summary.netCash},target.id);
      return;
    }
    if(type==='PAYABLES.PAGAR_OPERACIONAL'){
      const unit=businessById(draft,String(payload.businessId||''));
      const amount=Number(payload.amountCents);
      assert(unit,'Unidade não encontrada para liquidação operacional');
      assert(Number.isSafeInteger(amount)&&amount>0,'Valor de pagamento operacional inválido');
      const row=operatingPayablesReport(draft).units.find(x=>x.businessId===unit.id);
      assert(row&&row.outstanding>=amount,'Pagamento excede despesas operacionais em aberto da unidade');
      assert(balance(draft,'PAYABLE')>=amount,'Passivo operacional insuficiente no razão');
      assert(balance(draft,'CASH')>=amount,'Caixa compartilhado insuficiente para liquidar a obrigação');
      journal(draft,'Quitação de despesa operacional já reconhecida · '+unit.id,[
        {account:'PAYABLE',debit:amount,credit:0},{account:'CASH',debit:0,credit:amount}
      ],unit.id,'OPERATING_SETTLEMENT');
      event(draft,'PAYABLES.OPERACIONAL_PAGO',
        'Obrigação operacional quitada: '+money(amount)+' · '+unit.id+'.',
        {amountCents:amount},unit.id);
      return;
    }
    if(type==='RH.CONTRATAR'){
      const target=businessById(draft,String(payload.businessId||''));
      const role=String(payload.role||''),definition=RH_ROLES[role];
      const name=String(payload.name||'').trim().replace(/\s+/g,' ');
      assert(target,'Unidade não encontrada para contratação');
      assert(definition,'Cargo simulado desconhecido');
      assert(name.length>=2&&name.length<=50,'Nome fictício deve ter entre 2 e 50 caracteres');
      assert(rhEmployees(draft).filter(x=>x.businessId===target.id&&!x.dismissedAt).length<4,
        'Limite de quatro funcionários ativos por unidade');
      const employeeId='emp-'+(draft.audit.eventSeq+1);
      event(draft,'RH.CONTRATADO',name+' contratado para '+definition.label+' (simulação).',
        {employeeId,employeeName:name,role},target.id);
      return;
    }
    if(type==='RH.DESLIGAR'){
      const employee=rhEmployees(draft).find(x=>x.id===String(payload.employeeId||'')&&!x.dismissedAt);
      assert(employee,'Funcionário ativo não encontrado');
      event(draft,'RH.DESLIGADO',employee.name+' desligado do quadro fictício.',
        {employeeId:employee.id},employee.businessId);
      return;
    }
    if(type==='RH.PAGAR_FOLHA'){
      const unit=businessById(draft,String(payload.businessId||''));
      const period=String(payload.period||'');
      assert(unit,'Unidade inexistente para pagamento');
      const sheet=rhReport(draft).units.find(x=>x.businessId===unit.id)?.payrolls
        .find(x=>x.period===period&&x.status==='OPEN');
      assert(sheet&&sheet.amount>0,'Folha não apurada ou já quitada');
      assert(balance(draft,'CASH')>=sheet.amount,'Caixa compartilhado insuficiente para quitar a folha');
      assert(balance(draft,'PAYABLE')>=sheet.amount,'Obrigações contábeis insuficientes para quitar a folha');
      journal(draft,'RH/DP · pagamento simulado '+period+' · '+unit.id,[
        {account:'PAYABLE',debit:sheet.amount,credit:0},{account:'CASH',debit:0,credit:sheet.amount}],
        unit.id,'PAYROLL_PAYMENT');
      event(draft,'RH.FOLHA_PAGA','Folha fictícia '+period+' paga: '+money(sheet.amount)+'.',
        {period,amount:sheet.amount},unit.id);
      return;
    }
    if(type==='PARALEGAL.PROTOCOLAR'){
      const target=businessById(draft,String(payload.businessId||''));
      const serviceId=String(payload.service||''),service=PARALEGAL_SERVICES[serviceId];
      assert(target,'Estabelecimento não encontrado');
      assert(service,'Processo paralegal desconhecido');
      const current=paralegalReport(draft).find(x=>x.businessId===target.id);
      const task=current.processes.find(x=>x.service===serviceId);
      assert(['PENDENTE','VENCIDA'].includes(task.status),'Processo em andamento ou já vigente');
      if(serviceId==='licenca')assert(current.processes.find(x=>x.service==='cadastro').status==='CONCLUIDO',
        'Conclua o cadastro fictício antes de solicitar a licença');
      assert(balance(draft,'CASH')>=service.feeCents,'Caixa do grupo insuficiente para a taxa simulada');
      const dueDate=addDays(draft.calendar.date,service.processingDays);
      journal(draft,`Paralegal simulado · ${service.label} · ${target.id}`,[
        {account:'EXPENSE',debit:service.feeCents,credit:0},
        {account:'CASH',debit:0,credit:service.feeCents}],target.id,'PARALEGAL_FEE');
      event(draft,'PARALEGAL.PROTOCOLADO',`${service.label} protocolado para ${target.id}; conclusão prevista ${dueDate}.`,
        {service:serviceId,dueDate,feeCents:service.feeCents},target.id);
      return;
    }
    if(type==='FISCAL.ATIVAR_CENARIO'){
      assert(draft.fiscal.mode==='DEMONSTRACAO_ECONOMICA','Cenário fiscal já ativado');
      assert(payload.acceptSimplifications===true,'Confirme que o cenário é didático e não representa apuração fiscal real');
      const today=periodKey(draft.calendar.date),effectiveFrom=taxMonthNext(today);
      const eligibility=taxEligibility(draft,today);
      assert(eligibility.supported,'Cenário de comércio não elegível: '+eligibility.reason);
      draft.fiscal={mode:'SIMULACAO_SIMPLES_COMERCIO',coverageStatus:'SIMULATED_PARTIAL',rulePackId:FISCAL_RULE_PACKS.simples2026.id,
        activatedAt:draft.calendar.date,effectiveFrom,assessments:[]};
      event(draft,'FISCAL.CENARIO_ATIVADO',`Simples comércio didático: início em ${effectiveFrom}; nenhum mês anterior será apurado.`,{effectiveFrom});
      return;
    }
    if(type==='FISCAL.PAGAR_SIMULADO'){
      const period=String(payload.period||'');
      assert(draft.fiscal.mode==='SIMULACAO_SIMPLES_COMERCIO','Cenário fiscal ainda não ativado');
      const assessment=draft.fiscal.assessments.find(x=>x.period===period&&x.status==='OPEN');
      assert(assessment&&assessment.amount>assessment.paid,'Não há tributo simulado em aberto nesta competência');
      const payment=assessment.amount-assessment.paid;
      assert(balance(draft,'CASH')>=payment,'Caixa centralizado insuficiente para pagar tributo simulado');
      assert(balance(draft,'TAX_PAYABLE')>=payment,'Saldo de tributos simulados divergente');
      journal(draft,`Pagamento simulado · ${period}`,[{account:'TAX_PAYABLE',debit:payment,credit:0},
        {account:'CASH',debit:0,credit:payment}],null,'TAX_PAYMENT');
      assessment.paid+=payment;assessment.status='PAID';
      event(draft,'FISCAL.PAGO',`Tributo simulado ${period} quitado: ${money(payment)}.`,{period,payment});
      return;
    }
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
      journal(draft,`Abertura: ${s.name} (${id})`,[{account:'EXPENSE',debit:s.openCost,credit:0},{account:'CASH',debit:0,credit:s.openCost}],id,'OPENING');
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
    if(type.startsWith('CREDITO.')||type.startsWith('CONTRATO.FORNECEDOR.')){
      handleFinanceCommand(draft,type,payload);return;
    }
    if(type==='DILEMA.ESCOLHER') {
      chooseDilemma(draft,payload);return;
    }
    if(type==='MUNDO.CONCORRENCIA_ATIVAR') {
      initializeRivalEconomy(draft);return;
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


  // V2.5 concluída dentro da V2.6: seis dilemas vinculados a ações reais,
  // conquistas não financeiras, reputação com efeitos limitados e tutorial derivado.
  const DILEMMA_DEFINITIONS=Object.freeze([
    {id:'caixa-estoque',title:'Caixa x estoque',choices:[['abastecer','Comprar 30 unidades'],['reservar','Proteger o caixa']]},
    {id:'preco-volume',title:'Preço x volume',choices:[['promover','Promoção de 10% por 7 dias'],['margem','Preservar margem sem desconto']]},
    {id:'equipe-liquidez',title:'Equipe x liquidez',choices:[['contratar','Contratar atendimento'],['adiar','Adiar despesa com equipe']]},
    {id:'expansao-reserva',title:'Expansão x robustez',choices:[['expandir','Abrir unidade no próximo lote'],['guardar','Manter reserva para despesas']]},
    {id:'fornecedor-prazo',title:'Fornecedor x prazo',choices:[['rapido','Fornecedor regional em 1 dia'],['barato','Atacado em 3 dias']]},
    {id:'passivo-operacao',title:'Quitar passivo x operar',choices:[['quitar','Quitar obrigação existente'],['operar','Comprar estoque essencial']]}
  ]);
  function dilemmaReport(state){
    if(!state)return [];
    const b=activeBusiness(state),recent=state.audit.events.filter(e=>e.type==='DILEMA.DECIDIDO');
    return DILEMMA_DEFINITIONS.map(def=>{
      const last=recent.filter(e=>e.data.dilemmaId===def.id).at(-1);
      const daysSince=last?state.calendar.tick-last.data.tick:999;
      const options=def.choices.map(([id,label])=>{
        let reason='';
        if(!b)reason='Abra uma empresa.';
        else if(!state.world.rivalEconomy)reason='Ative a economia viva.';
        else if(daysSince<7)reason='Decisão anterior em avaliação por 7 dias.';
        else if(def.id==='equipe-liquidez'&&id==='contratar'&&
          rhEmployees(state).filter(e=>e.businessId===b.id&&!e.dismissedAt).length>=4)
          reason='Equipe no limite.';
        else if(def.id==='expansao-reserva'&&id==='expandir'&&businesses(state).length>=5)
          reason='Limite de cinco estabelecimentos.';
        else if(def.id==='expansao-reserva'&&id==='expandir'&&
          balance(state,'CASH')<SECTORS[b.sector].openCost)reason='Caixa insuficiente para expansão.';
        else if(def.id==='passivo-operacao'&&id==='quitar'&&
          !(operatingPayablesReport(state).units.find(x=>x.businessId===b.id)?.outstanding>0))
          reason='Nenhuma obrigação operacional em aberto.';
        return {id,label,available:!reason,reason};
      });
      return {id:def.id,title:def.title,choices:options,
        lastChoice:last?.data.choice||null,lastDate:last?.date||null,
        cooldownDays:Math.max(0,7-daysSince)};
    });
  }
  function chooseDilemma(draft,payload){
    const definition=DILEMMA_DEFINITIONS.find(x=>x.id===payload.dilemmaId);
    const choice=String(payload.choice||'');
    assert(definition&&definition.choices.some(x=>x[0]===choice),'Dilema ou alternativa inválida');
    const b=activeBusiness(draft);assert(b,'Abra uma empresa para decidir.');
    assert(draft.world.rivalEconomy,'Ative a economia viva para decisões contextuais.');
    const row=dilemmaReport(draft).find(x=>x.id===definition.id);
    const option=row.choices.find(x=>x.id===choice);
    assert(option.available,option.reason||'Escolha indisponível');
    let consequence='Decisão estratégica registrada sem gasto imediato.';
    if(definition.id==='caixa-estoque'&&choice==='abastecer'){
      handler(draft,'ESTOQUE.COMPRAR',{supplierId:'regional',productId:'base',quantity:30});
      consequence='Pedido de 30 unidades com custo e entrega real.';
    } else if(definition.id==='preco-volume'){
      handler(draft,'PROMO.DEFINIR',{productId:'base',
        percent:choice==='promover'?10:0,days:choice==='promover'?7:0});
      consequence=choice==='promover'?'Preço efetivo reduzido por sete dias.':'Promoção encerrada ou mantida em 0%.';
    } else if(definition.id==='equipe-liquidez'&&choice==='contratar'){
      handler(draft,'RH.CONTRATAR',{businessId:b.id,role:'atendimento',name:'Apoio fictício '+draft.calendar.tick});
      consequence='Novo funcionário e despesa futura de folha.';
    } else if(definition.id==='expansao-reserva'&&choice==='expandir'){
      const cityId=String(payload.cityId||b.cityId);
      assert(cityById(cityId),'Cidade inválida para expansão.');
      const occupied=new Set(businesses(draft).filter(x=>x.cityId===cityId).map(x=>x.lot));
      const lot=Array.from({length:18},(_,i)=>i+1).find(n=>!occupied.has(n));
      assert(lot,'Sem lote disponível.');
      handler(draft,'EMPRESA.ABRIR',{cityId,sector:b.sector,lot});
      consequence='Filial aberta com custo real do grupo.';
    } else if(definition.id==='fornecedor-prazo'){
      handler(draft,'ESTOQUE.COMPRAR',{supplierId:choice==='rapido'?'regional':'atacado',
        productId:'base',quantity:30});
      consequence='Pedido contabilizado, com preço e prazo do fornecedor escolhido.';
    } else if(definition.id==='passivo-operacao'){
      if(choice==='quitar'){
        const outstanding=operatingPayablesReport(draft).units.find(x=>x.businessId===b.id)?.outstanding||0;
        assert(outstanding>0,'Nenhuma obrigação disponível.');
        handler(draft,'PAYABLES.PAGAR_OPERACIONAL',{businessId:b.id,amountCents:Math.min(outstanding,balance(draft,'CASH'))});
        consequence='Passivo reduzido e caixa pago, sem lançar nova despesa.';
      }else{
        handler(draft,'ESTOQUE.COMPRAR',{supplierId:'regional',productId:'base',quantity:20});
        consequence='Estoque comprado enquanto passivo permanece aberto.';
      }
    }
    event(draft,'DILEMA.DECIDIDO',definition.title+': '+definition.choices.find(x=>x[0]===choice)[1]+'. '+consequence,
      {dilemmaId:definition.id,choice,tick:draft.calendar.tick,consequence},b.id);
  }
  function reputationReport(state,cityId=state?.player?.cityId){
    if(!state||!cityId||!cityById(cityId))return {status:'SEM_DADOS',units:[]};
    const r=state.world.rivalEconomy,units=businesses(state).filter(b=>b.cityId===cityId);
    const samples=state.audit.events.filter(e=>e.type==='DEMANDA.SIMULADA'&&
      e.date<state.calendar.date&&units.some(b=>b.id===e.businessId));
    const sectors=[...new Set(units.map(x=>x.sector))];
    const findings=sectors.map(sector=>{
      const key=cityId+'|'+sector,quality=r?.playerReputation[key]??50;
      const n=samples.filter(e=>businessById(state,e.businessId)?.sector===sector).length;
      return {sector,samples:n,score:n>=7?quality:null,
        status:n<7?'AMOSTRA_INSUFICIENTE':quality>=70?'BOA':quality>=40?'REGULAR':'ATENCAO',
        impactPct:n>=7?Math.round(((.75+quality/200)-1)*100):0,
        note:'Efeito restrito ao peso competitivo na divisão de demanda; sem gerar caixa.'};
    });
    return {status:r?'ATIVA':'SEM_SIMULACAO',cityId,units:findings};
  }
  function journeyGuide(state){
    if(!state)return {stage:'iniciar',title:'Crie uma carreira',next:'Escolha uma cidade e abra a carreira.'};
    const units=businesses(state),p=progressionReport(state);
    if(!units.length)return {stage:'abrir',title:'Abra o primeiro negócio',next:'Selecione um lote na cidade e escolha seu ramo.'};
    if(!units.some(x=>x.purchaseOrders.length>0))
      return {stage:'comprar',title:'Compre seu primeiro estoque',next:'Acesse Mercado → Compras e peça mercadorias.'};
    if(p.goals.find(g=>g.id==='primeira-venda')?.completed!==true)
      return {stage:'vender',title:'Aguarde a entrega e realize vendas',next:'Avance os dias para receber estoque e gerar vendas automáticas.'};
    if(!state.world.rivalEconomy)return {stage:'concorrencia',title:'Ative a concorrência',next:'No painel de Mercado, ative a economia viva com backup JSON.'};
    if(p.metrics.days<30)return {stage:'estabilizar',title:'Mantenha caixa e abastecimento',next:'Compare margem, estoque e rivais enquanto completa 30 dias.'};
    if(units.length<2)return {stage:'expandir',title:'Planeje a primeira filial',next:'Compare caixa, passivos e estratégia antes de abrir unidade.'};
    return {stage:'evoluir',title:'Construa sua rede',next:'Acompanhe objetivos, reputação e dilemas para escolher o próximo risco.'};
  }

  // V2.6 — mundo concorrencial fictício. Não usa rede, saldo do jogador ou dados privados.
  const RIVAL_EVENT_TYPES=Object.freeze([
    {id:'FESTA',label:'Festa regional',effectPct:16},
    {id:'OBRAS',label:'Obras e interrupções',effectPct:-12},
    {id:'LOGISTICA',label:'Atrasos de abastecimento',effectPct:-10},
    {id:'FEIRA',label:'Feira comercial',effectPct:12},
    {id:'CRISE',label:'Retração local temporária',effectPct:-15},
    {id:'FERIADO',label:'Movimento sazonal',effectPct:9}
  ]);
  const RIVAL_SECTORS=Object.freeze(['mercado','padaria','roupas']);
  function rivalHash(value) {
    let h=2166136261;
    for(let i=0;i<value.length;i++)h=Math.imul(h^value.charCodeAt(i),16777619)>>>0;
    return h>>>0;
  }
  const rivalNoise=(seed,tick,key)=>rivalHash(String(seed)+'|'+tick+'|'+key)/4294967296;
  function initializeRivalEconomy(draft) {
    assert(!draft.world.rivalEconomy,'Economia concorrencial já ativada');
    const seed=rivalHash(draft.worldId+'|V260-RIVAIS-1');
    const rivals=[];
    for(const city of CITIES)for(const sector of RIVAL_SECTORS){
      const index=rivalHash(city.id+'|'+sector+'|'+seed);
      rivals.push({id:'rival-'+city.id+'-'+sector,cityId:city.id,sector,
        name:'Rede '+SECTORS[sector].name+' · '+city.name,
        strategy:['preco','equilibrio','servico'][index%3],
        cashCents:1100000+index%1200000,stockUnits:110+index%90,
        capacityUnits:25+index%18,priceIndex:90+index%22,reputation:50,
        soldUnits:0,restockedUnits:0,expansions:0,lastDecisionTick:draft.calendar.tick});
    }
    draft.world.rivalEconomy={modelVersion:1,seed,activatedAt:draft.calendar.date,
      activatedTick:draft.calendar.tick,rivals,events:[],playerReputation:{},lastMarket:null};
    event(draft,'MUNDO.CONCORRENCIA_ATIVADA','Economia viva fictícia ativada; 90 rivais auditáveis, sem efeitos retroativos.',
      {modelVersion:1,seed,rivals:rivals.length});
  }
  function rivalStartEvents(draft){
    const econ=draft.world.rivalEconomy,tick=draft.calendar.tick;
    for(let i=0;i<CITIES.length;i++){
      const city=CITIES[i];
      if((tick+i*11)%47!==0)continue;
      const kind=RIVAL_EVENT_TYPES[Math.floor(rivalNoise(econ.seed,tick,city.id)*RIVAL_EVENT_TYPES.length)];
      const duration=3+Math.floor(rivalNoise(econ.seed,tick,'duracao-'+city.id)*6);
      const id='local-'+city.id+'-'+tick;
      econ.events.push({id,cityId:city.id,type:kind.id,label:kind.label,
        startTick:tick,endTick:tick+duration,startDate:draft.calendar.date,
        endDate:addDays(draft.calendar.date,duration-1),effectPct:kind.effectPct});
      if(businesses(draft).some(b=>b.cityId===city.id))
        event(draft,'MUNDO.EVENTO_INICIADO',city.name+': '+kind.label+' ('+kind.effectPct+'% na demanda).',
          {eventId:id,cityId:city.id,until:addDays(draft.calendar.date,duration-1),effectPct:kind.effectPct});
    }
  }
  function rivalCurrentEvent(econ,cityId,tick){
    for(let i=econ.events.length-1;i>=0;i--){
      const e=econ.events[i];
      if(e.cityId===cityId&&e.startTick<=tick&&e.endTick>tick)return e;
    }
    return null;
  }
  function rivalAllocation(draft,units,season){
    const econ=draft.world.rivalEconomy,tick=draft.calendar.tick;
    const byGroup=new Map(),quotas=new Map(),requestedRival=new Map();
    for(const b of units)for(const p of b.products){
      const key=b.cityId+'|'+b.sector+'|'+p.id;
      if(!byGroup.has(key))byGroup.set(key,[]);
      byGroup.get(key).push({b,p});
    }
    for(const [key,participants] of byGroup){
      const [cityId,sector,productId]=key.split('|');
      const city=cityById(cityId),rival=econ.rivals.find(r=>r.cityId===cityId&&r.sector===sector);
      const active=rivalCurrentEvent(econ,cityId,tick),effect=active?active.effectPct:0;
      const base=participants[0].p.demand*city.factor/100*season*(1+effect/100);
      const total=Math.max(0,Math.round(base*1.72*(0.90+0.20*rivalNoise(econ.seed,tick,key))));
      const priceRef=participants[0].p.referenceCents;
      const rivalPrice=Math.max(1,priceRef*rival.priceIndex/100);
      const rivalWeight=Math.max(.15,Math.min(2.4,demandElasticity(rivalPrice,priceRef,city)*(0.75+rival.reputation/200)));
      const weights=participants.map(({b,p})=>{
        const quality=econ.playerReputation[cityId+'|'+sector]??50;
        const weight=demandElasticity(effectivePrice(b,p,draft.calendar.date),rivalPrice,city)*(0.75+quality/200);
        return {id:b.id,weight:Math.max(.1,weight)};
      });
      weights.push({id:rival.id,weight:rivalWeight});
      const sum=weights.reduce((n,x)=>n+x.weight,0);
      const shares=weights.map((x,i)=>({id:x.id,exact:total*x.weight/sum,index:i}));
      const counts=shares.map(x=>Math.floor(x.exact));
      let remainder=total-counts.reduce((a,b)=>a+b,0);
      const order=shares.map((x,i)=>({i,frac:x.exact-counts[i]})).sort((a,b)=>b.frac-a.frac||a.i-b.i);
      for(let j=0;j<remainder;j++)counts[order[j].i]++;
      const rivalQuota=counts[counts.length-1];
      requestedRival.set(rival.id,(requestedRival.get(rival.id)||0)+rivalQuota);
      participants.forEach(({b,p},i)=>{
        quotas.set(b.id+'|'+p.id,{demand:counts[i],marketTotal:total,rivalQuota,
          eventEffectPct:effect,eventId:active?.id||null,marketKey:key});
      });
    }
    return {quotas,requestedRival};
  }
  function rivalCompleteDay(draft,plan,season){
    const econ=draft.world.rivalEconomy,tick=draft.calendar.tick;
    let competitorSales=0,competitorPurchases=0;
    for(const rival of econ.rivals){
      const city=cityById(rival.cityId),sector=SECTORS[rival.sector];
      const active=rivalCurrentEvent(econ,rival.cityId,tick);
      const factor=1+(active?.effectPct||0)/100;
      const fallback=Math.round(sector.demand*city.factor/100*season*factor*
        (0.9+0.2*rivalNoise(econ.seed,tick,rival.id)));
      const requested=plan.requestedRival.get(rival.id)??fallback;
      const sold=Math.max(0,Math.min(requested,rival.capacityUnits,rival.stockUnits));
      const price=Math.max(1,Math.round(sector.recommended*rival.priceIndex/100));
      const overhead=Math.max(200,Math.round(sector.dailyCost*.18));
      rival.stockUnits-=sold;
      rival.soldUnits+=sold;
      rival.cashCents+=sold*price;
      rival.cashCents=Math.max(0,rival.cashCents-Math.min(rival.cashCents,overhead));
      competitorSales+=sold;
      rival.reputation=clamp(Math.round(rival.reputation*.92+(requested?100*sold/requested:50)*.08),10,90);
      if((tick+rivalHash(rival.id))%4===0){
        const cost=Math.max(1,Math.round(sector.cost*.97));
        const target=Math.min(300,Math.max(100,rival.capacityUnits*5));
        const qty=Math.max(0,Math.min(target-rival.stockUnits,Math.floor(rival.cashCents/cost)));
        rival.cashCents-=qty*cost;rival.stockUnits+=qty;rival.restockedUnits+=qty;
        competitorPurchases+=qty;
      }
      if((tick+rivalHash(rival.id))%7===0){
        const before=rival.priceIndex;
        const change=rival.strategy==='preco'?-2:rival.strategy==='servico'?1:0;
        const correction=rival.stockUnits<rival.capacityUnits?2:0;
        rival.priceIndex=clamp(rival.priceIndex+change+correction,78,130);
        rival.lastDecisionTick=tick;
        if(before!==rival.priceIndex&&businesses(draft).some(b=>b.cityId===rival.cityId))
          event(draft,'RIVAL.PRECO',rival.name+': alterou preço de '+before+'% para '+rival.priceIndex+'% da referência.',
            {rivalId:rival.id,cityId:rival.cityId,before,after:rival.priceIndex});
      }
      if(tick>0&&(tick+rivalHash(rival.id))%120===0&&rival.expansions<2&&rival.cashCents>1300000){
        rival.cashCents-=500000;rival.capacityUnits+=8;rival.expansions++;
        if(businesses(draft).some(b=>b.cityId===rival.cityId))
          event(draft,'RIVAL.EXPANSAO',rival.name+': investiu em capacidade logística e operação.',
            {rivalId:rival.id,cityId:rival.cityId,capacityUnits:rival.capacityUnits,expansions:rival.expansions});
      }
      assert(Number.isSafeInteger(rival.cashCents)&&rival.cashCents>=0,'Caixa de rival inválido');
    }
    const daily=Array.from(plan.quotas.values());
    econ.lastMarket={tick,date:draft.calendar.date,playerAllocated:daily.reduce((n,q)=>n+q.demand,0),
      rivalAllocated:[...plan.requestedRival.values()].reduce((n,x)=>n+x,0),
      competitorSales,competitorPurchases};
    const ownCities=new Set(businesses(draft).map(b=>b.cityId));
    for(const e of econ.events){
      if(e.endTick===tick+1&&ownCities.has(e.cityId))
        event(draft,'MUNDO.EVENTO_ENCERRADO',cityById(e.cityId).name+': '+e.label+' encerrado.',
          {eventId:e.id,cityId:e.cityId});
    }
  }
  function rivalMarketReport(state,cityId=state?.player?.cityId){
    if(!state||!cityId||!cityById(cityId))return {enabled:false,rivals:[],events:[],alerts:[]};
    const econ=state.world.rivalEconomy;
    if(!econ)return {enabled:false,cityId,cityName:cityById(cityId).name,rivals:[],events:[],
      alerts:['Ative a economia viva para competir com empresas persistentes nesta carreira.']};
    const rivals=econ.rivals.filter(r=>r.cityId===cityId).map(r=>({...r}));
    const events=econ.events.filter(e=>e.cityId===cityId).slice(-8).map(e=>({...e,
      active:e.startTick<=state.calendar.tick&&e.endTick>state.calendar.tick}));
    const active=events.filter(e=>e.active);
    const units=businesses(state).filter(b=>b.cityId===cityId);
    const demandEvents=state.audit.events.filter(e=>e.type==='DEMANDA.SIMULADA'&&e.date<state.calendar.date&&
      units.some(b=>b.id===e.businessId)).slice(-8);
    const actions=state.audit.events.filter(e=>['RIVAL.PRECO','RIVAL.EXPANSAO'].includes(e.type)&&
      e.data?.cityId===cityId).slice(-12).map(e=>({id:e.id,date:e.date,type:e.type,text:e.text}));
    const alerts=[];
    for(const e of active)alerts.push(e.label+': efeito de '+e.effectPct+'% sobre o mercado até '+e.endDate+'.');
    for(const e of actions.slice(-2))alerts.push(e.text);
    for(const r of rivals)if(r.stockUnits<r.capacityUnits)alerts.push(r.name+': estoque apertado; oportunidade de atender demanda.');
    for(const e of demandEvents.slice(-3))if(e.data.unmet>0)alerts.push(e.businessId+': '+e.data.unmet+' pedidos não atendidos; revisar reposição.');
    if(!alerts.length)alerts.push('Mercado estável: compare preços, estoque e margem antes de expandir.');
    return {enabled:true,modelVersion:econ.modelVersion,cityId,cityName:cityById(cityId).name,
      rivals,events,actions,alerts:alerts.slice(0,7),lastMarket:econ.lastMarket?{...econ.lastMarket}:null,
      note:'Rivais e eventos são simulados; não usam informações privilegiadas nem dados econômicos reais.'};
  }
  function validateRivalEconomy(state){
    const x=state.world.rivalEconomy;
    if(x===undefined||x===null)return;
    assert(plain(x)&&x.modelVersion===1&&int(x.seed)&&Array.isArray(x.rivals)&&x.rivals.length===90&&
      Array.isArray(x.events)&&x.events.length<=25000&&plain(x.playerReputation),
      'Contrato do mundo concorrencial inválido');
    assert(isoDate(x.activatedAt)&&x.activatedAt<=state.calendar.date&&int(x.activatedTick)&&
      x.activatedTick<=state.calendar.tick,'Data de ativação de rivais inválida');
    const ids=new Set();
    for(const r of x.rivals){
      assert(plain(r)&&!ids.has(r.id)&&r.id==='rival-'+r.cityId+'-'+r.sector&&
        cityById(r.cityId)&&RIVAL_SECTORS.includes(r.sector),'Identidade de rival inválida');
      ids.add(r.id);
      assert(['preco','equilibrio','servico'].includes(r.strategy)&&int(r.cashCents)&&
        Number.isSafeInteger(r.cashCents)&&int(r.stockUnits)&&int(r.capacityUnits)&&
        r.capacityUnits>=1&&r.capacityUnits<=100&&r.stockUnits<=500&&
        int(r.priceIndex)&&r.priceIndex>=78&&r.priceIndex<=130&&
        int(r.reputation)&&r.reputation>=10&&r.reputation<=90&&
        int(r.soldUnits)&&int(r.restockedUnits)&&int(r.expansions)&&r.expansions<=2,
        'Recursos ou estratégia de rival inválidos');
    }
    const eventIds=new Set();
    for(const e of x.events){
      assert(!eventIds.has(e.id)&&cityById(e.cityId)&&
        RIVAL_EVENT_TYPES.some(t=>t.id===e.type&&t.effectPct===e.effectPct)&&
        int(e.startTick)&&int(e.endTick)&&e.startTick>=x.activatedTick&&
        e.endTick>e.startTick&&e.startTick<=state.calendar.tick&&
        isoDate(e.startDate)&&isoDate(e.endDate),'Evento local inválido');
      eventIds.add(e.id);
    }
  }

  function day(draft) {
    logisticsExpireSites(draft);
    logisticsChargeDepot(draft);
    const units=businesses(draft);
    const season=1+0.13*Math.sin((draft.calendar.tick%365)/365*Math.PI*2);
    const staff=rhEmployees(draft);
    if(draft.world.rivalEconomy)rivalStartEvents(draft);
    const rivalPlan=draft.world.rivalEconomy?rivalAllocation(draft,units,season):null;
    for(const b of units){
      const s=SECTORS[b.sector],city=cityById(b.cityId||draft.player.cityId);
      // O mercado endereçável de uma cidade/ramo é compartilhado pelas lojas do jogador.
      const rivals=units.filter(x=>x.cityId===b.cityId&&x.sector===b.sector).length;
      const share=1/rivals;
      const bonusPercent=Math.min(25,staff.filter(x=>x.businessId===b.id&&!x.dismissedAt).reduce((n,x)=>n+RH_ROLES[x.role].productivityPercent,0));
      const items=[],demandLines=[];
      let estimated=0,fulfilled=0,unmet=0,withoutStock=0;
      for(const p of b.products){
        const competitorPrice=competitorReference(draft,p,city);
        const price=effectivePrice(b,p,draft.calendar.date);
        const elasticity=demandElasticity(price,competitorPrice,city);
        const base=p.demand*(city.factor/100)*elasticity*season*share*(1+bonusPercent/100);
        const quota=rivalPlan?.quotas.get(b.id+'|'+p.id);
        const demand=quota?quota.demand:Math.max(0,Math.floor(base*(0.75+random(draft)*0.55)));
        const sold=Math.min(p.stockUnits,demand),lost=demand-sold;
        estimated+=demand;fulfilled+=sold;unmet+=lost;
        if(!p.stockUnits)withoutStock++;
        demandLines.push({productId:p.id,name:p.name,stockBefore:p.stockUnits,estimated:demand,fulfilled:sold,unmet:lost,lostPotentialCents:lost*price,
          ...(quota?{marketTotal:quota.marketTotal,rivalQuota:quota.rivalQuota,eventEffectPct:quota.eventEffectPct,eventId:quota.eventId}:{} )});
        if(sold>0)items.push({productId:p.id,quantity:sold});
      }
      if(items.length)registerSale(draft,b,items,'SIMULACAO_DIARIA');
      event(draft,'DEMANDA.SIMULADA',`${b.id} · ${city.name}: ${estimated} un. procuradas, ${fulfilled} vendidas, ${unmet} não atendidas.`,
        {estimated,fulfilled,unmet,withoutStock,lostPotentialCents:demandLines.reduce((n,x)=>n+x.lostPotentialCents,0),items:demandLines,...(bonusPercent?{staffBonusPercent:bonusPercent}:{}),marketShare:share,regionalFactor:city.factor,regionalDataset:POPULATION_SOURCE.id,regionalGdpDataset:GDP_SOURCE.id,regionalModelId:'REGIONAL-V2-PIB'},b.id);
      const cash=balance(draft,'CASH'),expense=s.dailyCost;
      journal(draft,`Despesa operacional diária · ${b.id}`,[
        {account:'EXPENSE',debit:expense,credit:0},
        {account:cash>=expense?'CASH':'PAYABLE',debit:0,credit:expense}],b.id,'DAILY_EXPENSE');
      if(cash<expense)event(draft,'CONTAS.A_PAGAR',`${b.id}: despesa de ${money(expense)} registrada a pagar.`,{},b.id);
    }
    if(rivalPlan){
      rivalCompleteDay(draft,rivalPlan,season);
      for(const b of units){
        const e=draft.audit.events.findLast(x=>x.type==='DEMANDA.SIMULADA'&&x.businessId===b.id&&x.date===draft.calendar.date);
        if(!e)continue;
        const key=b.cityId+'|'+b.sector,old=draft.world.rivalEconomy.playerReputation[key]??50;
        draft.world.rivalEconomy.playerReputation[key]=clamp(Math.round(old*.9+(e.data.estimated?100*e.data.fulfilled/e.data.estimated:50)*.1),10,90);
      }
    }
    if(!rivalPlan&&units.length&&(draft.calendar.tick+1)%7===0){
      const change=Math.floor(random(draft)*17)-8;
      handler(draft,'IA.AJUSTAR_PRECO',{priceIndex:clamp(draft.world.competitor.priceIndex+change,75,125)});
    }
    const finished=draft.calendar.date;
    if(dateNext(finished).slice(0,7)!==finished.slice(0,7)){
      accruePayrollMonth(draft,finished.slice(0,7));
      closeTaxMonth(draft,finished.slice(0,7));
    }
    event(draft,'DIA.ENCERRADO',`Dia ${finished} concluído.`,{finished});
    draft.calendar.tick++;
    draft.calendar.date=dateNext(draft.calendar.date);
    for(const b of units)receiveDueOrders(draft,b);
    logisticsDue(draft);
    processParalegalDue(draft);
    processFinancingDay(draft);
  }

  // V2.7: Crédito e contratos são ficções econômicas. Toda obrigação reconhecida
  // é escriturada no razão do grupo; intenções futuras só aparecem em projeções.
  const FINANCE_RATE_BP=180, FINANCE_TERM_DAYS=30, FINANCE_MAX_PRINCIPAL=3000000;
  const FINANCE_TERMS=Object.freeze([3,6,12,24]);
  const CONTRACT_PERIODS=Object.freeze([7,14,30]);
  function financeState(draft){
    if(!draft.economy.financing)draft.economy.financing={modelVersion:1,loanSeq:0,contractSeq:0,loans:[],contracts:[]};
    return draft.economy.financing;
  }
  function financeRead(state){
    return state?.economy?.financing||{modelVersion:1,loanSeq:0,contractSeq:0,loans:[],contracts:[]};
  }
  function creditEligibility(state){
    const loans=financeRead(state).loans,units=businesses(state),days=Math.min(30,Math.max(1,state.calendar.tick));
    const windowStart=new Date(state.calendar.date+'T12:00:00Z');
    windowStart.setUTCDate(windowStart.getUTCDate()-29);
    const from=windowStart.toISOString().slice(0,10);
    const sales=state.economy.ledger.filter(j=>j.date>=from&&j.date<=state.calendar.date)
      .reduce((sum,j)=>sum+j.entries.reduce((n,e)=>n+(e.account==='REVENUE'?e.credit-e.debit:0),0),0);
    const projected30=Math.round(sales*30/days);
    const authorized=units.length>0&&state.calendar.tick>=7&&sales>=10000;
    const ceiling=authorized?Math.min(FINANCE_MAX_PRINCIPAL,Math.max(0,Math.floor(projected30*3/4))):0;
    const outstanding=loans.reduce((n,l)=>n+l.remainingCents,0);
    const blocked=loans.some(l=>l.status==='DELINQUENT'||l.duePrincipalCents>0||l.interestDueCents+l.feesDueCents>0)||loans.length>=30;
    const available=Math.max(0,ceiling-outstanding);
    return {eligible:authorized&&!blocked&&available>=50000,
      reason:!units.length?'Inaugure uma unidade.':state.calendar.tick<7?'Opere pelo menos sete dias.':sales<10000?'É necessário histórico positivo de vendas.':blocked?'Regularize parcelas, encargos vencidos ou limite histórico.':available<50000?'Limite disponível inferior ao empréstimo mínimo de R$ 500.':'Elegível para crédito fictício.',
      salesLast30Cents:sales,projected30Cents:projected30,creditLimitCents:ceiling,
      outstandingPrincipalCents:outstanding,availableCents:available,
      monthlyRateBasisPoints:FINANCE_RATE_BP,terms:FINANCE_TERMS.slice()};
  }
  function scheduleDue(state,limitDays=90){
    const until=addDays(state.calendar.date,limitDays),fin=financeRead(state),rows=[];
    for(const l of fin.loans.filter(x=>x.status!=='PAID')){
      if(l.interestDueCents+l.feesDueCents+l.duePrincipalCents>0)
        rows.push({date:state.calendar.date,kind:'LOAN_DUE',id:l.id,amountCents:l.interestDueCents+l.feesDueCents+l.duePrincipalCents,certainty:'RECOGNIZED'});
      let next=l.nextDueDate,remaining=l.remainingCents;
      for(let i=0;i<Math.min(l.termMonths,24)&&next<=until&&remaining>0;i++){
        const principal=Math.min(remaining,l.installmentPrincipalCents);
        const interest=Math.round(remaining*l.rateBp/10000);
        rows.push({date:next,kind:'LOAN_SCHEDULE',id:l.id,amountCents:principal+interest,principalCents:principal,interestCents:interest,certainty:'PROJECTED'});
        remaining-=principal;next=addDays(next,FINANCE_TERM_DAYS);
      }
    }
    for(const c of fin.contracts.filter(x=>x.status==='ACTIVE')){
      let next=c.nextOrderDate;
      for(let i=0;i<c.cycles-c.processed&&next<=until;i++){
        rows.push({date:next,kind:'SUPPLIER_COMMITMENT',id:c.id,
          amountCents:c.quantity*c.unitCostCents,certainty:'CONTRACTED_UNPOSTED'});
        next=addDays(next,c.periodDays);
      }
    }
    // Os juros e multas já aparecem dentro da parcela vencida: não repetir no agregado.
    const pending=balance(state,'PAYABLE')+balance(state,'TAX_PAYABLE')+balance(state,'CONTRACT_PAYABLE');
    if(pending>0)rows.push({date:state.calendar.date,kind:'RECOGNIZED_PAYABLES',id:'group',amountCents:pending,certainty:'RECOGNIZED'});
    const payroll=rhReport(state).pendingCents;
    if(payroll>0)rows.push({date:state.calendar.date,kind:'PAYROLL_KNOWN',id:'payroll',amountCents:payroll,certainty:'ALREADY_INCLUDED_IN_PAYABLE'});
    return rows.sort((a,b)=>a.date.localeCompare(b.date)||a.kind.localeCompare(b.kind));
  }
  function creditReport(state){
    if(!state)return {loans:[],contracts:[],eligibility:{eligible:false,availableCents:0},principalOutstanding:0,interestOutstanding:0,feesOutstanding:0,contractFeesOutstanding:0};
    const fin=financeRead(state),eligibility=creditEligibility(state);
    return {loans:clone(fin.loans),contracts:clone(fin.contracts),eligibility,
      principalOutstanding:balance(state,'LOAN_PAYABLE'),
      interestOutstanding:balance(state,'INTEREST_PAYABLE'),feesOutstanding:balance(state,'LOAN_FEES_PAYABLE'),
      contractFeesOutstanding:balance(state,'CONTRACT_PAYABLE'),
      note:'Contratação aumenta caixa e passivo, nunca receita; taxas e juros são despesas reconhecidas. Todas as cifras são fictícias.'};
  }
  function financialCommitmentsReport(state,days=90){
    assert(state&&[30,90,180].includes(days),'Horizonte contratual inválido');
    const events=scheduleDue(state,days),cash=balance(state,'CASH');
    const expectedSupplier=events.filter(x=>x.kind==='SUPPLIER_COMMITMENT').reduce((n,x)=>n+x.amountCents,0);
    const loanSchedules=events.filter(x=>x.kind==='LOAN_SCHEDULE');
    const expectedLoan=loanSchedules.reduce((n,x)=>n+x.amountCents,0);
    const expectedUnrecognizedLoanInterest=loanSchedules.reduce((n,x)=>n+x.interestCents,0);
    const recognized=balance(state,'PAYABLE')+balance(state,'TAX_PAYABLE')+
      balance(state,'CONTRACT_PAYABLE')+balance(state,'LOAN_PAYABLE')+
      balance(state,'INTEREST_PAYABLE')+balance(state,'LOAN_FEES_PAYABLE');
    const dailyFixed=businesses(state).reduce((n,b)=>n+SECTORS[b.sector].dailyCost,0);
    return {days,from:state.calendar.date,to:addDays(state.calendar.date,days),
      cash,recognizedLiabilities:recognized,expectedSupplierCents:expectedSupplier,
      expectedLoanCents:expectedLoan,expectedUnrecognizedLoanInterestCents:expectedUnrecognizedLoanInterest,
      fixedOperatingScenarioCents:dailyFixed*days,cashAfterRecognizedIfPaid:cash-recognized,
      stressCashNoSales:cash-recognized-expectedSupplier-expectedUnrecognizedLoanInterest-dailyFixed*days,
      events,warning:'Estresse sem novas vendas: principal já reconhecido é descontado uma única vez; apenas juros futuros são adicionados. Compras e custos projetados não geram lançamento; folha futura não foi projetada neste painel.'};
  }
  function financeJournal(draft,memo,entries,kind,unit=null){
    journal(draft,memo,entries,unit,kind);
  }
  function financeAddPenalty(draft,account,cents,label,kind,businessId=null){
    if(cents<=0)return;
    financeJournal(draft,label,[
      {account:'EXPENSE',debit:cents,credit:0},
      {account,debit:0,credit:cents}
    ],kind,businessId);
  }
  function financeLoanById(state,id){
    const loan=financeRead(state).loans.find(l=>l.id===id);
    assert(loan,'Contrato de financiamento inexistente');
    return loan;
  }
  function financeContractById(state,id){
    const c=financeRead(state).contracts.find(x=>x.id===id);
    assert(c,'Contrato com fornecedor não encontrado');
    return c;
  }
  function financeAccrueInterest(draft,l){
    const elapsed=Math.max(0,Math.round((Date.parse(draft.calendar.date+'T12:00:00Z')-Date.parse(l.lastAccruedAt+'T12:00:00Z'))/86400000));
    if(!elapsed)return 0;
    const interest=Math.round(l.remainingCents*l.rateBp*elapsed/(10000*FINANCE_TERM_DAYS));
    if(interest>0){
      financeAddPenalty(draft,'INTEREST_PAYABLE',interest,'Juros fictícios proporcionais '+l.id,'LOAN_INTEREST');
      l.interestDueCents+=interest;
    }
    l.lastAccruedAt=draft.calendar.date;
    return interest;
  }
  function loanDue(draft,loan){
    if(loan.remainingCents<=0)return;
    const late=loan.duePrincipalCents>0;
    if(late){
      const room=Math.max(0,Math.floor(loan.principalCents*.20)-loan.assessedFeesCents);
      const fee=Math.min(room,Math.round(loan.duePrincipalCents*.02));
      if(fee>0){
        financeAddPenalty(draft,'LOAN_FEES_PAYABLE',fee,'Multa fictícia do financiamento '+loan.id,'LOAN_LATE_FEE');
        loan.feesDueCents+=fee;loan.assessedFeesCents+=fee;
      }
    }
    const interest=financeAccrueInterest(draft,loan);
    loan.maturities+=1;
    const principalDue=loan.maturities>=loan.termMonths?loan.remainingCents:
      Math.min(loan.remainingCents,loan.duePrincipalCents+loan.installmentPrincipalCents);
    loan.duePrincipalCents=principalDue;
    loan.lastDueDate=loan.nextDueDate;
    loan.nextDueDate=addDays(loan.nextDueDate,FINANCE_TERM_DAYS);
    loan.status=late?'DELINQUENT':'DUE';
    event(draft,'CREDITO.PARCELA_VENCEU','Financiamento '+loan.id+' · principal em vencimento '+money(principalDue)+', juros lançados '+money(interest)+'.',
      {loanId:loan.id,principalDueCents:principalDue,interestCents:interest,feeCents:late?loan.feesDueCents:0});
  }
  function financeContractCycle(draft,c){
    const unit=businessById(draft,c.businessId);
    const due=c.nextOrderDate;
    c.processed++;
    c.nextOrderDate=addDays(c.nextOrderDate,c.periodDays);
    try{
      assert(unit,'Unidade do contrato ausente');
      registerPurchase(draft,unit,c.supplierId,[{productId:c.productId,quantity:c.quantity}],c);
      c.fulfilled++;
      event(draft,'CONTRATO.FORNECEDOR.CUMPRIDO','Entrega contratada '+c.id+' gerou pedido pago e em trânsito.',
        {contractId:c.id,cycle:c.processed,orderDate:due,amountCents:c.quantity*c.unitCostCents},c.businessId);
    }catch(err){
      c.missed++;
      const fee=Math.max(1,Math.round(c.quantity*c.unitCostCents*.02));
      financeAddPenalty(draft,'CONTRACT_PAYABLE',fee,'Multa fictícia por descumprimento '+c.id,'CONTRACT_PENALTY',c.businessId);
      c.penaltyDueCents+=fee;
      event(draft,'CONTRATO.FORNECEDOR.DESCUMPRIDO','Pedido contratado '+c.id+' não executado: '+String(err.message)+'. Multa fictícia '+money(fee)+'.',
        {contractId:c.id,cycle:c.processed,penaltyCents:fee,reason:String(err.message)},c.businessId);
    }
    if(c.processed>=c.cycles)c.status='COMPLETED';
  }
  function processFinancingDay(draft){
    const fin=draft.economy.financing;
    if(!fin)return;
    for(const loan of fin.loans){
      if(loan.status==='PAID')continue;
      while(loan.remainingCents>0&&loan.nextDueDate<=draft.calendar.date)loanDue(draft,loan);
      if(loan.duePrincipalCents>0&&loan.lastDueDate<draft.calendar.date)loan.status='DELINQUENT';
    }
    for(const c of fin.contracts){
      while(c.status==='ACTIVE'&&c.nextOrderDate<=draft.calendar.date)financeContractCycle(draft,c);
    }
  }
  function handleFinanceCommand(draft,type,payload){
    const fin=financeState(draft);
    if(type==='CREDITO.CONTRATAR'){
      const eligibility=creditEligibility(draft),principal=Number(payload.principalCents),months=Number(payload.termMonths);
      assert(FINANCE_TERMS.includes(months),'Escolha prazo de 3, 6, 12 ou 24 parcelas de 30 dias.');
      assert(Number.isSafeInteger(principal)&&principal>=50000&&principal<=FINANCE_MAX_PRINCIPAL,'Principal fictício fora do intervalo R$ 500–30.000.');
      assert(eligibility.eligible&&principal<=eligibility.availableCents,eligibility.reason||'Limite insuficiente.');
      assert(fin.loans.length<30,'Limite histórico de financiamentos atingido.');
      const id='cr-'+(++fin.loanSeq);
      fin.loans.push({id,principalCents:principal,remainingCents:principal,
        rateBp:FINANCE_RATE_BP,termMonths:months,installmentPrincipalCents:Math.ceil(principal/months),
        signedAt:draft.calendar.date,lastAccruedAt:draft.calendar.date,nextDueDate:addDays(draft.calendar.date,FINANCE_TERM_DAYS),
        lastDueDate:null,duePrincipalCents:0,interestDueCents:0,feesDueCents:0,
        assessedFeesCents:0,maturities:0,renegotiations:0,paidTotalCents:0,status:'OPEN'});
      financeJournal(draft,'Crédito empresarial fictício '+id,[
        {account:'CASH',debit:principal,credit:0},{account:'LOAN_PAYABLE',debit:0,credit:principal}
      ],'LOAN_DRAW');
      event(draft,'CREDITO.CONTRATADO','Financiamento '+id+' · '+money(principal)+'; '+months+' parcelas fictícias. Não é receita.',
        {loanId:id,principalCents:principal,termMonths:months,rateBp:FINANCE_RATE_BP});
      return;
    }
    if(type==='CREDITO.PAGAR'){
      const l=financeLoanById(draft,String(payload.loanId||'')),amount=Number(payload.amountCents);
      financeAccrueInterest(draft,l); // quitação antecipada reconhece juros proporcionais, sem arbitragem gratuita
      const due=l.remainingCents+l.interestDueCents+l.feesDueCents;
      assert(l.status!=='PAID'&&due>0,'Financiamento já encerrado');
      assert(Number.isSafeInteger(amount)&&amount>0&&amount<=due,'Pagamento de crédito excede o saldo exigível ou total contratado.');
      assert(balance(draft,'CASH')>=amount,'Caixa insuficiente para pagamento.');
      let left=amount;
      const fee=Math.min(left,l.feesDueCents);left-=fee;
      const interest=Math.min(left,l.interestDueCents);left-=interest;
      const principal=Math.min(left,l.remainingCents);
      l.feesDueCents-=fee;l.interestDueCents-=interest;l.remainingCents-=principal;
      l.duePrincipalCents=Math.min(l.remainingCents,Math.max(0,l.duePrincipalCents-principal));
      l.paidTotalCents+=amount;
      const entries=[];
      if(fee)entries.push({account:'LOAN_FEES_PAYABLE',debit:fee,credit:0});
      if(interest)entries.push({account:'INTEREST_PAYABLE',debit:interest,credit:0});
      if(principal)entries.push({account:'LOAN_PAYABLE',debit:principal,credit:0});
      entries.push({account:'CASH',debit:0,credit:amount});
      financeJournal(draft,'Pagamento de financiamento '+l.id,entries,'LOAN_PAYMENT');
      if(l.remainingCents+l.interestDueCents+l.feesDueCents===0)l.status='PAID';
      else if(l.duePrincipalCents>0)l.status=l.lastDueDate<draft.calendar.date?'DELINQUENT':'DUE';
      else l.status='OPEN';
      event(draft,'CREDITO.PAGO','Pagamento '+l.id+': principal '+money(principal)+', juros '+money(interest)+', multa '+money(fee)+'.',
        {loanId:l.id,amountCents:amount,principalCents:principal,interestCents:interest,feeCents:fee});
      return;
    }
    if(type==='CREDITO.RENEGOCIAR'){
      const l=financeLoanById(draft,String(payload.loanId||'')),months=Number(payload.termMonths);
      assert(FINANCE_TERMS.includes(months),'Prazo de renegociação inválido.');
      assert(l.status==='DELINQUENT'&&l.remainingCents>0,'Renegociação disponível somente para financiamento em atraso.');
      assert(l.renegotiations<2,'Limite de duas renegociações atingido.');
      l.termMonths=months;l.maturities=0;l.installmentPrincipalCents=Math.ceil(l.remainingCents/months);
      l.duePrincipalCents=0;l.nextDueDate=addDays(draft.calendar.date,FINANCE_TERM_DAYS);
      l.lastDueDate=null;l.renegotiations++;l.status='RESTRUCTURED';
      event(draft,'CREDITO.RENEGOCIADO','Financiamento '+l.id+' renegociado em '+months+' períodos. Juros e multas já reconhecidos continuam devidos.',
        {loanId:l.id,termMonths:months,remainingPrincipalCents:l.remainingCents,interestDueCents:l.interestDueCents,feesDueCents:l.feesDueCents});
      return;
    }
    if(type==='CONTRATO.FORNECEDOR.ASSINAR'){
      const b=businessById(draft,String(payload.businessId||'')),supplier=supplierById(String(payload.supplierId||''));
      const quantity=Number(payload.quantity),periodDays=Number(payload.periodDays),cycles=Number(payload.cycles);
      assert(b&&supplier,'Escolha unidade e fornecedor fictício válidos.');
      assert(CONTRACT_PERIODS.includes(periodDays),'Frequência permitida: 7, 14 ou 30 dias.');
      assert(Number.isSafeInteger(cycles)&&cycles>=2&&cycles<=12,'Prazo contratual de 2 a 12 ciclos.');
      assert(Number.isSafeInteger(quantity)&&quantity>=1&&quantity<=Math.min(100,supplier.maxDailyPerSku),'Volume contratado inválido.');
      const p=product(b,String(payload.productId||'base'));
      assert(fin.contracts.filter(x=>x.status==='ACTIVE').length<6,'Limite de seis contratos ativos atingido.');
      const unitCost=Math.round(p.costCents*supplier.priceFactor/100);
      assert(quantity*unitCost>0&&Number.isSafeInteger(quantity*unitCost*cycles),'Comprometimento contratual excede capacidade de registro.');
      const id='cf-'+(++fin.contractSeq);
      fin.contracts.push({id,businessId:b.id,supplierId:supplier.id,productId:p.id,productName:p.name,
        quantity,unitCostCents:unitCost,leadDays:supplier.leadDays,periodDays,cycles,
        processed:0,fulfilled:0,missed:0,penaltyDueCents:0,
        signedAt:draft.calendar.date,nextOrderDate:addDays(draft.calendar.date,periodDays),status:'ACTIVE'});
      event(draft,'CONTRATO.FORNECEDOR.ASSINADO','Contrato '+id+' · '+cycles+' pedidos futuros de '+quantity+' un. de '+p.name+'.',
        {contractId:id,unitCostCents:unitCost,cycles,periodDays,commitmentCents:quantity*unitCost*cycles},b.id);
      return;
    }
    if(type==='CONTRATO.FORNECEDOR.RESCINDIR'){
      const c=financeContractById(draft,String(payload.contractId||''));
      assert(c.status==='ACTIVE','Somente contratos ativos podem ser rescindidos.');
      const future=(c.cycles-c.processed)*c.quantity*c.unitCostCents,fee=Math.round(future*.05);
      if(fee)financeAddPenalty(draft,'CONTRACT_PAYABLE',fee,'Rescisão fictícia de fornecimento '+c.id,'CONTRACT_PENALTY',c.businessId);
      c.penaltyDueCents+=fee;c.status='TERMINATED';
      event(draft,'CONTRATO.FORNECEDOR.RESCINDIDO','Contrato '+c.id+' rescindido. Compromissos futuros cancelados; multa fictícia '+money(fee)+'.',
        {contractId:c.id,penaltyCents:fee,cancelledCommitmentCents:future},c.businessId);
      return;
    }
    if(type==='CONTRATO.FORNECEDOR.PAGAR_PENALIDADE'){
      const c=financeContractById(draft,String(payload.contractId||'')),amount=Number(payload.amountCents);
      assert(Number.isSafeInteger(amount)&&amount>0&&amount<=c.penaltyDueCents,'Valor de multa contratual inválido.');
      assert(balance(draft,'CASH')>=amount,'Caixa insuficiente para quitar multa.');
      c.penaltyDueCents-=amount;
      financeJournal(draft,'Pagamento multa contratual '+c.id,[
        {account:'CONTRACT_PAYABLE',debit:amount,credit:0},{account:'CASH',debit:0,credit:amount}
      ],'CONTRACT_PAYMENT',c.businessId);
      event(draft,'CONTRATO.FORNECEDOR.MULTA_PAGA','Multa fictícia do contrato '+c.id+' paga: '+money(amount)+'.',
        {contractId:c.id,amountCents:amount},c.businessId);
      return;
    }
    throw Error('Ação financeira desconhecida: '+type);
  }
  function validateFinancing(state){
    const fin=state.economy.financing;
    if(fin===undefined||fin===null){
      assert(balance(state,'LOAN_PAYABLE')===0&&balance(state,'INTEREST_PAYABLE')===0&&
        balance(state,'LOAN_FEES_PAYABLE')===0&&balance(state,'CONTRACT_PAYABLE')===0,'Obrigações financeiras sem contrato válido.');
      return;
    }
    assert(plain(fin)&&fin.modelVersion===1&&int(fin.loanSeq)&&int(fin.contractSeq)&&
      Array.isArray(fin.loans)&&fin.loans.length<=30&&Array.isArray(fin.contracts)&&fin.contracts.length<=100,
      'Modelo de financiamento inválido.');
    const loanIds=new Set(),contractIds=new Set();
    let principal=0,interest=0,fees=0,contractFees=0;
    for(const l of fin.loans){
      assert(plain(l)&&typeof l.id==='string'&&!loanIds.has(l.id)&&/^cr-\d+$/.test(l.id),'Financiamento duplicado ou inválido.');loanIds.add(l.id);
      assert(int(l.principalCents)&&l.principalCents>=50000&&l.principalCents<=FINANCE_MAX_PRINCIPAL&&
        int(l.remainingCents)&&l.remainingCents<=l.principalCents&&
        int(l.rateBp)&&l.rateBp===FINANCE_RATE_BP&&FINANCE_TERMS.includes(l.termMonths)&&
        int(l.installmentPrincipalCents)&&l.installmentPrincipalCents>0&&
        int(l.duePrincipalCents)&&l.duePrincipalCents<=l.remainingCents&&
        int(l.interestDueCents)&&int(l.feesDueCents)&&int(l.assessedFeesCents)&&
        l.assessedFeesCents<=Math.floor(l.principalCents*.2)&&
        int(l.maturities)&&int(l.renegotiations)&&l.renegotiations<=2&&int(l.paidTotalCents)&&
        isoDate(l.signedAt)&&isoDate(l.lastAccruedAt)&&l.lastAccruedAt>=l.signedAt&&l.lastAccruedAt<=state.calendar.date&&isoDate(l.nextDueDate)&&
        (l.lastDueDate===null||isoDate(l.lastDueDate))&&
        ['OPEN','DUE','DELINQUENT','RESTRUCTURED','PAID'].includes(l.status),
        'Contrato de crédito inconsistente.');
      assert(l.status!=='PAID'||l.remainingCents+l.interestDueCents+l.feesDueCents===0,'Crédito encerrado com dívida.');
      principal+=l.remainingCents;interest+=l.interestDueCents;fees+=l.feesDueCents;
    }
    for(const c of fin.contracts){
      assert(plain(c)&&typeof c.id==='string'&&!contractIds.has(c.id)&&/^cf-\d+$/.test(c.id),'Contrato de fornecimento inválido.');contractIds.add(c.id);
      assert(businessById(state,c.businessId)&&supplierById(c.supplierId)&&
        Number.isSafeInteger(c.quantity)&&c.quantity>=1&&c.quantity<=100&&
        int(c.unitCostCents)&&c.unitCostCents>0&&CONTRACT_PERIODS.includes(c.periodDays)&&
        Number.isSafeInteger(c.cycles)&&c.cycles>=2&&c.cycles<=12&&
        int(c.processed)&&c.processed<=c.cycles&&int(c.fulfilled)&&int(c.missed)&&
        c.fulfilled+c.missed===c.processed&&int(c.penaltyDueCents)&&
        isoDate(c.signedAt)&&isoDate(c.nextOrderDate)&&
        ['ACTIVE','COMPLETED','TERMINATED'].includes(c.status),
        'Calendário ou obrigações de fornecedor inconsistentes.');
      assert(c.status!=='COMPLETED'||c.processed===c.cycles,'Contrato concluído antes do fim do prazo.');
      assert(c.status!=='ACTIVE'||c.processed<c.cycles,'Contrato ativo sem ciclos futuros.');
      contractFees+=c.penaltyDueCents;
    }
    assert(principal===balance(state,'LOAN_PAYABLE')&&interest===balance(state,'INTEREST_PAYABLE')&&
      fees===balance(state,'LOAN_FEES_PAYABLE')&&contractFees===balance(state,'CONTRACT_PAYABLE'),
      'Financiamento diverge dos saldos reconhecidos no razão.');
  }


  // V2.8 — Operações físicas do grupo. Distância é índice simulado, NÃO quilometragem.
  // Os serviços são opt-in por comando. Saves V2.7 ou anteriores permanecem intactos.
  const LOGISTICS_DEPOT_ID='CD-1', LOGISTICS_DEPOT_CAPACITY=2000;
  const LOGISTICS_DEPOT_OPEN_CENTS=80000, LOGISTICS_DEPOT_DAILY_CENTS=850;
  const LOGISTICS_BAKERY_INPUT='raw-farinha', LOGISTICS_PRODUCTION_MAX=25;
  const LOGISTICS_SHELF_DAYS=Object.freeze({base:3,'extra-1':5});
  function logisticsRead(state){
    return state?.economy?.logistics||{modelVersion:1,seq:0,depot:null,transfers:[],depotPurchases:[],batches:[],production:{},metrics:{fees:0,waste:0,produced:0}};
  }
  function logisticsState(draft){
    if(!draft.economy.logistics)draft.economy.logistics={
      modelVersion:1,seq:0,depot:null,transfers:[],depotPurchases:[],batches:[],production:{},
      metrics:{fees:0,waste:0,produced:0}
    };
    return draft.economy.logistics;
  }
  function logisticsSite(state,id){
    const lg=logisticsRead(state);
    if(id===LOGISTICS_DEPOT_ID&&lg.depot)return {id,cityId:lg.depot.cityId,depot:true,location:lg.depot};
    const b=businessById(state,id);
    return b?{id,cityId:b.cityId,depot:false,location:b}:null;
  }
  function logisticsRouteQuote(state,fromId,toId,quantity=1){
    const from=logisticsSite(state,fromId),to=logisticsSite(state,toId);
    assert(from&&to&&from.id!==to.id,'Rota exige duas instalações distintas.');
    assert(Number.isSafeInteger(quantity)&&quantity>=1&&quantity<=250,'Volume por viagem deve ser de 1 a 250 unidades.');
    const a=cityById(from.cityId),b=cityById(to.cityId);
    const ia=CITIES.findIndex(c=>c.id===a.id),ib=CITIES.findIndex(c=>c.id===b.id);
    // Índice abstrato: NÃO corresponde a km, tempo de viagem nem frete rodoviário real.
    const distanceUnits=a.id===b.id?0:a.uf===b.uf?8+Math.abs(ia-ib)%12:20+Math.abs(ia-ib)%28;
    const baseDays=distanceUnits===0?1:Math.min(5,1+Math.floor(distanceUnits/12));
    const days=Math.max(1,baseDays-((from.depot||to.depot)?1:0));
    const standardCents=650+distanceUnits*85+quantity*22;
    const feeCents=(from.depot||to.depot)?Math.round(standardCents*.75):standardCents;
    return {fromId,toId,originCity:a.name,destinationCity:b.name,
      distanceUnits,days,quantity,baseFeeCents:standardCents,feeCents,
      discountCents:standardCents-feeCents,
      distanceType:'SIMULATED_INDEX_NOT_KM',
      note:'Índice logístico, custo e prazo exclusivamente simulados; não são distância geográfica ou cotação de frete real.'};
  }
  function logisticsProductLocation(draft,site,sector,productId,name,create=false){
    if(!site.depot){
      assert(site.location.sector===sector,'Transferência entre setores incompatíveis.');
      const p=product(site.location,productId);
      assert(p.name===name,'Produtos distintos não podem ser remanejados pelo mesmo identificador.');
      return p;
    }
    let p=site.location.stock.find(x=>x.sector===sector&&x.productId===productId);
    if(p)assert(p.name===name,'O CD não aceita misturar produtos distintos com o mesmo código.');
    if(!p&&create){
      p={sector,productId,name,stockUnits:0,stockValueCents:0};
      site.location.stock.push(p);
    }
    return p;
  }
  function logisticsAddStock(draft,site,sector,productId,name,quantity,valueCents){
    const p=logisticsProductLocation(draft,site,sector,productId,name,true);
    assert(p,'Produto de destino inexistente.');
    assert(p.stockUnits+quantity<=100000,'Capacidade do produto de destino excedida.');
    p.stockUnits+=quantity;p.stockValueCents+=valueCents;
    if(!site.depot)syncTotals(site.location);
  }
  function logisticsRemoveStock(draft,site,sector,productId,name,quantity){
    const p=logisticsProductLocation(draft,site,sector,productId,name);
    assert(p&&p.stockUnits>=quantity,'Estoque da instalação de origem insuficiente.');
    const valueCents=quantity===p.stockUnits?p.stockValueCents:Math.round(p.stockValueCents*quantity/p.stockUnits);
    assert(Number.isSafeInteger(valueCents)&&valueCents>=0,'Valor de estoque de origem inválido.');
    p.stockUnits-=quantity;p.stockValueCents-=valueCents;
    if(!site.depot)syncTotals(site.location);
    return valueCents;
  }
  function logisticsSiteCapacity(state,site){
    if(!site.depot){
      const inbound=logisticsRead(state).transfers.filter(t=>t.status==='PENDING'&&t.toId===site.id).reduce((n,t)=>n+t.quantity,0);
      const supplierPending=site.location.purchaseOrders.filter(o=>o.status==='PENDING').reduce((n,o)=>n+o.items.reduce((x,l)=>x+l.quantity,0),0);
      return {used:site.location.stockUnits+inbound+supplierPending,capacity:100000};
    }
    const lg=logisticsRead(state);
    const inboundTransfers=lg.transfers.filter(t=>t.status==='PENDING'&&t.toId===LOGISTICS_DEPOT_ID).reduce((n,t)=>n+t.quantity,0);
    const pendingOrders=lg.depotPurchases.filter(o=>o.status==='PENDING').reduce((n,o)=>n+o.quantity,0);
    return {used:lg.depot.stock.reduce((n,p)=>n+p.stockUnits,0)+inboundTransfers+pendingOrders,
      capacity:LOGISTICS_DEPOT_CAPACITY};
  }
  function logisticsShelfLife(sector,productId){
    return sector==='padaria'?(LOGISTICS_SHELF_DAYS[productId]||0):0;
  }
  function logisticsAddLot(draft,locationId,sector,productId,quantity,receivedAt,expiresAt=null){
    if(!quantity)return;
    const days=logisticsShelfLife(sector,productId);
    if(!days&&!expiresAt)return;
    const lg=logisticsState(draft);
    assert(lg.batches.length<30000,'Limite de lotes rastreáveis atingido.');
    lg.batches.push({id:'lote-'+(++lg.seq),locationId,sector,productId,quantity,
      receivedAt,expiresAt:expiresAt||addDays(receivedAt,days)});
  }
  function logisticsTakeLots(draft,locationId,sector,productId,quantity){
    const lg=draft.economy.logistics;if(!lg)return [];
    const sorted=lg.batches.filter(b=>b.locationId===locationId&&b.sector===sector&&b.productId===productId&&b.quantity>0)
      .sort((a,b)=>a.expiresAt.localeCompare(b.expiresAt)||a.id.localeCompare(b.id));
    let remaining=quantity;const pieces=[];
    for(const lot of sorted){
      const q=Math.min(remaining,lot.quantity);
      if(q){lot.quantity-=q;pieces.push({quantity:q,expiresAt:lot.expiresAt});remaining-=q;}
      if(!remaining)break;
    }
    lg.batches=lg.batches.filter(x=>x.quantity>0);
    return pieces;
  }
  function logisticsConsumeSale(draft,b,lines){
    if(!draft.economy.logistics)return;
    for(const line of lines)logisticsTakeLots(draft,b.id,b.sector,line.productId,line.quantity);
  }
  function logisticsWaste(draft,site,sector,productId,name,quantity,label){
    if(!quantity)return 0;
    const valueCents=logisticsRemoveStock(draft,site,sector,productId,name,quantity);
    if(valueCents){
      journal(draft,'Perda física / validade '+label,[
        {account:'EXPENSE',debit:valueCents,credit:0},{account:'INVENTORY',debit:0,credit:valueCents}],
        site.depot?null:site.id,site.depot?'LOGISTICS_CD_WASTE':'LOGISTICS_WASTE');
      logisticsState(draft).metrics.waste+=valueCents;
    }
    event(draft,'LOGISTICA.DESPERDICIO',quantity+' unidade(s) vencidas em '+site.id+'; custo baixado '+money(valueCents)+'.',
      {siteId:site.id,sector,productId,quantity,valueCents},site.depot?null:site.id);
    return valueCents;
  }
  function logisticsExpireSites(draft){
    const lg=draft.economy.logistics;if(!lg)return;
    const due=lg.batches.filter(b=>b.expiresAt<=draft.calendar.date);
    for(const lot of due){
      const site=logisticsSite(draft,lot.locationId);
      assert(site,'Lote perecível aponta para instalação inexistente.');
      const source=logisticsProductLocation(draft,site,lot.sector,lot.productId,
        site.depot?site.location.stock.find(p=>p.sector===lot.sector&&p.productId===lot.productId)?.name:
          product(site.location,lot.productId).name);
      assert(source&&source.stockUnits>=lot.quantity,'Lote vencido sem estoque físico suficiente.');
      logisticsWaste(draft,site,lot.sector,lot.productId,source.name,lot.quantity,lot.id);
    }
    lg.batches=lg.batches.filter(b=>b.expiresAt>draft.calendar.date);
  }
  function logisticsChargeDepot(draft){
    const depot=draft.economy.logistics?.depot;
    if(!depot||depot.lastChargedDate===draft.calendar.date)return;
    const cash=balance(draft,'CASH'),account=cash>=LOGISTICS_DEPOT_DAILY_CENTS?'CASH':'PAYABLE';
    journal(draft,'Custo diário do CD fictício',[
      {account:'EXPENSE',debit:LOGISTICS_DEPOT_DAILY_CENTS,credit:0},
      {account,debit:0,credit:LOGISTICS_DEPOT_DAILY_CENTS}],null,'LOGISTICS_CD_DAILY');
    depot.lastChargedDate=draft.calendar.date;
  }
  function logisticsReceiveTransfer(draft,t){
    const from=logisticsSite(draft,t.fromId),to=logisticsSite(draft,t.toId);
    assert(from&&to&&t.status==='PENDING','Viagem inválida para entrega.');
    const expiredPieces=t.lotPieces.filter(x=>x.expiresAt<=draft.calendar.date);
    const loss=expiredPieces.reduce((n,x)=>n+x.quantity,0);
    let remainingValue=t.valueCents;
    if(loss){
      const waste=loss===t.quantity?t.valueCents:Math.min(t.valueCents-1,Math.round(t.valueCents*loss/t.quantity));
      if(waste){
        journal(draft,'Perda perecível durante transporte '+t.id,[
          {account:'EXPENSE',debit:waste,credit:0},{account:'IN_TRANSIT',debit:0,credit:waste}],
          from.depot?null:from.id,from.depot?'LOGISTICS_CD_WASTE':'LOGISTICS_WASTE');
        logisticsState(draft).metrics.waste+=waste;
      }
      remainingValue-=waste;
      event(draft,'LOGISTICA.PERDA_EM_TRANSITO','Viagem '+t.id+': '+loss+' unidade(s) vencidas em trânsito.',
        {tripId:t.id,loss,lossCents:waste},from.depot?null:from.id);
    }
    const delivered=t.quantity-loss;
    if(delivered){
      // A compensação INTERNA é zerada entre os dois centros, sem venda e sem CMV.
      journal(draft,'Baixa de trânsito interno '+t.id,[
        {account:'INTERNAL_CLEARING',debit:remainingValue,credit:0},
        {account:'IN_TRANSIT',debit:0,credit:remainingValue}],
        from.depot?null:from.id,from.depot?'LOGISTICS_CD_CLEAR':'LOGISTICS_CLEAR');
      logisticsAddStock(draft,to,t.sector,t.productId,t.productName,delivered,remainingValue);
      journal(draft,'Entrada física entre instalações '+t.id,[
        {account:'INVENTORY',debit:remainingValue,credit:0},
        {account:'INTERNAL_CLEARING',debit:0,credit:remainingValue}],
        to.depot?null:to.id,to.depot?'LOGISTICS_CD_RECEIVE':'LOGISTICS_RECEIVE');
      for(const lot of t.lotPieces.filter(x=>x.expiresAt>draft.calendar.date)){
        logisticsAddLot(draft,to.id,t.sector,t.productId,lot.quantity,draft.calendar.date,lot.expiresAt);
      }
    }
    t.status='RECEIVED';t.receivedAt=draft.calendar.date;t.deliveredQuantity=delivered;
    t.lostQuantity=loss;t.deliveredValueCents=remainingValue;
    event(draft,'LOGISTICA.TRANSFERENCIA_RECEBIDA','Remanejamento '+t.id+': '+delivered+' unidade(s) recebidas, '+loss+' perdidas.',
      {tripId:t.id,delivered,loss,remainingValue},to.depot?null:to.id);
  }
  function logisticsReceiveDepotPurchase(draft,o){
    assert(o.status==='PENDING','Pedido do CD já recebido.');
    const site=logisticsSite(draft,LOGISTICS_DEPOT_ID);
    assert(site,'Centro de distribuição indisponível.');
    logisticsAddStock(draft,site,o.sector,o.productId,o.productName,o.quantity,o.total);
    journal(draft,'Entrada em estoque do CD '+o.id,[
      {account:'INVENTORY',debit:o.total,credit:0},{account:'IN_TRANSIT',debit:0,credit:o.total}],
      null,'LOGISTICS_CD_VENDOR_RECEIPT');
    logisticsAddLot(draft,LOGISTICS_DEPOT_ID,o.sector,o.productId,o.quantity,draft.calendar.date);
    o.status='RECEIVED';o.receivedAt=draft.calendar.date;
    event(draft,'LOGISTICA.CD_PEDIDO_RECEBIDO','Recebimento do CD '+o.id+' com '+o.quantity+' unidade(s).',
      {orderId:o.id,valueCents:o.total});
  }
  function logisticsDue(draft){
    const lg=draft.economy.logistics;if(!lg)return;
    for(const o of lg.depotPurchases){
      if(o.status==='PENDING'&&o.dueDate<=draft.calendar.date)logisticsReceiveDepotPurchase(draft,o);
    }
    for(const t of lg.transfers){
      if(t.status==='PENDING'&&t.dueDate<=draft.calendar.date)logisticsReceiveTransfer(draft,t);
    }
  }
  function logisticsDepotPayable(state){
    if(!state?.economy?.logistics?.depot)return 0;
    return state.economy.ledger.filter(j=>j.kind==='LOGISTICS_CD_DAILY'||j.kind==='LOGISTICS_CD_SETTLEMENT')
      .reduce((sum,j)=>sum+j.entries.reduce((n,e)=>n+(e.account==='PAYABLE'?e.credit-e.debit:0),0),0);
  }
  function logisticsReport(state){
    if(!state)return {enabled:false,depot:null,transfers:[],depotPurchases:[],batches:[],metrics:{}};
    const lg=logisticsRead(state);
    return {enabled:!!state.economy.logistics,depot:clone(lg.depot),transfers:clone(lg.transfers),
      depotPurchases:clone(lg.depotPurchases),batches:clone(lg.batches),metrics:clone(lg.metrics),
      totalPhysicalUnits:businesses(state).reduce((n,b)=>n+b.stockUnits,0)+(lg.depot?.stock.reduce((n,p)=>n+p.stockUnits,0)||0),
      depotCapacity:LOGISTICS_DEPOT_CAPACITY,depotOpeningCents:LOGISTICS_DEPOT_OPEN_CENTS,
      depotDailyCents:LOGISTICS_DEPOT_DAILY_CENTS,depotPayableCents:logisticsDepotPayable(state),productionLimit:LOGISTICS_PRODUCTION_MAX,
      note:'Todas as distâncias, entregas, prazos e custos logísticos são índices de jogo fictícios.'};
  }
  function logisticsSuggestions(state){
    if(!state)return [];
    const lg=logisticsRead(state),rows=[];
    for(const dest of businesses(state)){
      for(const p of dest.products){
        if(p.id===LOGISTICS_BAKERY_INPUT)continue;
        const inbound=lg.transfers.filter(t=>t.status==='PENDING'&&t.toId===dest.id&&t.productId===p.id&&t.sector===dest.sector)
          .reduce((n,t)=>n+t.quantity,0);
        const available=p.stockUnits+pendingQuantity(dest,p.id)+inbound;
        if(available>p.reorderPoint)continue;
        const need=Math.max(0,Math.min(100,p.targetStock-available));if(!need)continue;
        const donors=businesses(state).filter(b=>b.id!==dest.id&&b.sector===dest.sector)
          .map(b=>({fromId:b.id,stock:b.products.find(x=>x.id===p.id&&x.name===p.name)?.stockUnits||0}))
          .filter(x=>x.stock>p.reorderPoint);
        const depotProduct=lg.depot?.stock.find(x=>x.sector===dest.sector&&x.productId===p.id&&x.name===p.name);
        if(depotProduct?.stockUnits){
          const quantity=Math.min(need,depotProduct.stockUnits);
          rows.push({kind:'TRANSFER',fromId:LOGISTICS_DEPOT_ID,toId:dest.id,productId:p.id,
            sector:dest.sector,quantity,route:logisticsRouteQuote(state,LOGISTICS_DEPOT_ID,dest.id,quantity)});
        }else if(donors.length){
          const donor=donors.sort((a,b)=>b.stock-a.stock)[0],quantity=Math.min(need,Math.max(1,donor.stock-p.reorderPoint));
          rows.push({kind:'TRANSFER',fromId:donor.fromId,toId:dest.id,productId:p.id,
            sector:dest.sector,quantity,route:logisticsRouteQuote(state,donor.fromId,dest.id,quantity)});
        }else{
          rows.push({kind:'SUPPLIER',toId:dest.id,productId:p.id,sector:dest.sector,quantity:need,
            approximateValueCents:need*p.costCents,note:'Proposta de compra normal; exige confirmação manual.'});
        }
      }
    }
    return rows.slice(0,60);
  }
  function handleLogisticsCommand(draft,type,payload){
    const lg=logisticsState(draft);
    if(type==='LOGISTICA.CD.PAGAR_DESPESAS'){
      assert(lg.depot,'Nenhum CD ativo para liquidar custos.');
      const amount=Number(payload.amountCents),owed=logisticsDepotPayable(draft);
      assert(Number.isSafeInteger(amount)&&amount>0&&amount<=owed,
        'Valor de pagamento excede as despesas do CD já reconhecidas.');
      assert(balance(draft,'CASH')>=amount,'Caixa compartilhado insuficiente para liquidar o CD.');
      journal(draft,'Pagamento de despesas do CD já reconhecidas',[
        {account:'PAYABLE',debit:amount,credit:0},{account:'CASH',debit:0,credit:amount}],
        null,'LOGISTICS_CD_SETTLEMENT');
      event(draft,'LOGISTICA.CD_DESPESA_PAGA','Despesa já reconhecida do CD quitada: '+money(amount)+'.',
        {amountCents:amount});
      return;
    }
    if(type==='LOGISTICA.CD.ABRIR'){
      assert(!lg.depot,'Já existe centro de distribuição no grupo.');
      assert(businesses(draft).length>=2,'Abra duas unidades antes de instalar um centro de distribuição.');
      const cityId=String(payload.cityId||'');
      assert(cityById(cityId),'Cidade inválida para CD fictício.');
      assert(balance(draft,'CASH')>=LOGISTICS_DEPOT_OPEN_CENTS,'Caixa insuficiente para implantação do CD.');
      lg.depot={id:LOGISTICS_DEPOT_ID,cityId,stock:[],openedAt:draft.calendar.date,lastChargedDate:null};
      journal(draft,'Implantação do CD fictício',[
        {account:'EXPENSE',debit:LOGISTICS_DEPOT_OPEN_CENTS,credit:0},
        {account:'CASH',debit:0,credit:LOGISTICS_DEPOT_OPEN_CENTS}],null,'LOGISTICS_CD_OPEN');
      event(draft,'LOGISTICA.CD_ABERTO','Centro de distribuição fictício em '+cityById(cityId).name+' (2.000 unidades de capacidade).',
        {cityId,capacity:LOGISTICS_DEPOT_CAPACITY,openingCents:LOGISTICS_DEPOT_OPEN_CENTS});
      return;
    }
    if(type==='LOGISTICA.CD.COMPRAR'){
      const depot=logisticsSite(draft,LOGISTICS_DEPOT_ID);
      assert(depot,'Abra um CD antes de consolidar compras.');
      const origin=businessById(draft,String(payload.businessId||''));
      const supplier=supplierById(String(payload.supplierId||'regional'));
      const productId=String(payload.productId||'base'),quantity=Number(payload.quantity);
      assert(origin&&supplier,'Unidade de referência ou fornecedor inexistente.');
      assert(Number.isSafeInteger(quantity)&&quantity>=1&&quantity<=Math.min(250,supplier.maxDailyPerSku),
        'Volume excede a capacidade simulada do fornecedor.');
      const p=product(origin,productId);
      const used=lg.depotPurchases.filter(o=>o.status==='PENDING'&&o.date===draft.calendar.date&&o.supplierId===supplier.id&&o.sector===origin.sector&&o.productId===p.id)
        .reduce((n,o)=>n+o.quantity,0);
      assert(quantity+used<=supplier.maxDailyPerSku,'Capacidade diária consolidada do fornecedor excedida.');
      const cap=logisticsSiteCapacity(draft,depot);
      assert(cap.used+quantity<=cap.capacity,'Capacidade do CD, incluindo trânsito, excedida.');
      const unitCost=Math.round(p.costCents*supplier.priceFactor/100),total=quantity*unitCost;
      assert(Number.isSafeInteger(total)&&balance(draft,'CASH')>=total,'Caixa insuficiente para encomenda ao CD.');
      assert(lg.depotPurchases.length<10000,'Limite de compras do CD atingido.');
      const id='cdp-'+(++lg.seq),dueDate=addDays(draft.calendar.date,supplier.leadDays);
      lg.depotPurchases.push({id,businessId:origin.id,sector:origin.sector,productId:p.id,productName:p.name,
        supplierId:supplier.id,quantity,unitCost,total,date:draft.calendar.date,dueDate,
        receivedAt:null,status:'PENDING'});
      journal(draft,'Compra consolidada de mercadorias no CD '+id,[
        {account:'IN_TRANSIT',debit:total,credit:0},{account:'CASH',debit:0,credit:total}],
        null,'LOGISTICS_CD_PURCHASE');
      event(draft,'LOGISTICA.CD_PEDIDO','Compra do CD '+id+' paga; '+quantity+' unidade(s) em trânsito.',
        {orderId:id,total,quantity,dueDate});
      return;
    }
    if(type==='LOGISTICA.TRANSFERIR'){
      const from=logisticsSite(draft,String(payload.fromId||'')),to=logisticsSite(draft,String(payload.toId||''));
      const quantity=Number(payload.quantity),productId=String(payload.productId||'base');
      assert(from&&to&&from.id!==to.id,'Selecione origem e destino diferentes e válidos.');
      const sector=from.depot?String(payload.sector||''):from.location.sector;
      assert(SECTORS[sector],'Setor de mercadoria inválido.');
      const fromP=from.depot?from.location.stock.find(p=>p.sector===sector&&p.productId===productId):
        product(from.location,productId);
      assert(fromP&&fromP.stockUnits>=quantity,'Origem não possui estoque suficiente para transferência.');
      const toProduct=to.depot?null:product(to.location,productId);
      assert(to.depot||(to.location.sector===sector&&toProduct.name===fromP.name),
        'Destino sem produto equivalente; transferências não transformam mercadorias.');
      const quote=logisticsRouteQuote(draft,from.id,to.id,quantity);
      assert(balance(draft,'CASH')>=quote.feeCents,'Caixa insuficiente para o frete simulado.');
      const capacity=logisticsSiteCapacity(draft,to);
      assert(capacity.used+quantity<=capacity.capacity,'Destino sem espaço para carga e mercadorias em trânsito.');
      assert(lg.transfers.length<10000,'Limite histórico de transferências atingido.');
      const lots=logisticsTakeLots(draft,from.id,sector,productId,quantity);
      const valueCents=logisticsRemoveStock(draft,from,sector,productId,fromP.name,quantity);
      assert(valueCents>0,'Transferência não permite mercadoria sem valor contábil.');
      const id='tr-'+(++lg.seq),dueDate=addDays(draft.calendar.date,quote.days);
      lg.transfers.push({id,fromId:from.id,toId:to.id,sector,productId,productName:fromP.name,
        quantity,valueCents,lotPieces:lots,date:draft.calendar.date,dueDate,
        feeCents:quote.feeCents,distanceUnits:quote.distanceUnits,
        receivedAt:null,deliveredQuantity:0,lostQuantity:0,deliveredValueCents:0,status:'PENDING'});
      journal(draft,'Expedição de estoque interfilial '+id,[
        {account:'IN_TRANSIT',debit:valueCents,credit:0},
        {account:'INVENTORY',debit:0,credit:valueCents}],
        from.depot?null:from.id,from.depot?'LOGISTICS_CD_DISPATCH':'LOGISTICS_DISPATCH');
      journal(draft,'Frete simulado de remanejamento '+id,[
        {account:'EXPENSE',debit:quote.feeCents,credit:0},
        {account:'CASH',debit:0,credit:quote.feeCents}],
        from.depot?null:from.id,from.depot?'LOGISTICS_CD_FEE':'LOGISTICS_SHIP_FEE');
      lg.metrics.fees+=quote.feeCents;
      event(draft,'LOGISTICA.EXPEDIDA','Transferência '+id+' '+from.id+' → '+to.id+'; '+quantity+' unidade(s). Sem faturamento interno.',
        {tripId:id,fromId:from.id,toId:to.id,quantity,valueCents,feeCents:quote.feeCents,dueDate,
          distanceUnits:quote.distanceUnits,distanceType:'SIMULATED_INDEX_NOT_KM'},from.depot?null:from.id);
      return;
    }
    if(type==='LOGISTICA.INSUMO.COMPRAR'){
      const unit=businessById(draft,String(payload.businessId||''));
      assert(unit&&unit.sector==='padaria'&&unit.products.some(p=>p.id===LOGISTICS_BAKERY_INPUT),
        'Habilite o insumo antes da compra.');
      registerPurchase(draft,unit,String(payload.supplierId||'regional'),[
        {productId:LOGISTICS_BAKERY_INPUT,quantity:Number(payload.quantity)}]);
      return;
    }
    if(type==='LOGISTICA.REABASTECER'){
      const unit=businessById(draft,String(payload.businessId||''));
      assert(unit,'Unidade de reposição inexistente.');
      registerPurchase(draft,unit,String(payload.supplierId||'regional'),[
        {productId:String(payload.productId||'base'),quantity:Number(payload.quantity)}]);
      return;
    }
    if(type==='LOGISTICA.PRODUCAO.HABILITAR'){
      const unit=businessById(draft,String(payload.businessId||''));
      assert(unit&&unit.sector==='padaria','Produção piloto disponível apenas para padarias.');
      assert(!unit.products.some(p=>p.id===LOGISTICS_BAKERY_INPUT),'Insumos já habilitados nesta padaria.');
      assert(unit.products.length<40,'Catálogo da padaria sem espaço para insumo.');
      unit.products.push({id:LOGISTICS_BAKERY_INPUT,name:'Farinha (insumo de produção)',
        costCents:300,priceCents:400,referenceCents:400,demand:0,stockUnits:0,stockValueCents:0,
        reorderPoint:15,targetStock:100});
      event(draft,'LOGISTICA.PRODUCAO_HABILITADA','Padaria '+unit.id+' habilitou farinha como insumo não comercial.',
        {businessId:unit.id},unit.id);
      return;
    }
    if(type==='LOGISTICA.PRODUZIR'){
      const unit=businessById(draft,String(payload.businessId||''));
      const quantity=Number(payload.inputQuantity);
      assert(unit&&unit.sector==='padaria','Produção restrita à padaria.');
      assert(Number.isSafeInteger(quantity)&&quantity>=1&&quantity<=LOGISTICS_PRODUCTION_MAX,
        'Lote de produção entre 1 e 25 unidades de insumo.');
      const raw=product(unit,LOGISTICS_BAKERY_INPUT),finished=product(unit,'base');
      const usage=lg.production[unit.id],current=usage?.date===draft.calendar.date?usage.used:0;
      assert(current+quantity<=LOGISTICS_PRODUCTION_MAX,'Capacidade produtiva diária de 25 insumos atingida.');
      const output=quantity*3,labour=quantity*120;
      assert(finished.stockUnits+output<=100000,'Estoque final da padaria excede capacidade.');
      assert(balance(draft,'CASH')>=labour,'Caixa insuficiente para custo de produção.');
      const material=logisticsRemoveStock(draft,logisticsSite(draft,unit.id),unit.sector,raw.id,raw.name,quantity);
      logisticsAddStock(draft,logisticsSite(draft,unit.id),unit.sector,'base',finished.name,output,material+labour);
      // Transformação: custo sai do estoque de insumo e entra no acabado. Mão de obra CAPITALIZADA no lote.
      journal(draft,'Transformação produtiva padaria '+unit.id,[
        {account:'INVENTORY',debit:material+labour,credit:0},
        {account:'INVENTORY',debit:0,credit:material},
        {account:'CASH',debit:0,credit:labour}],unit.id,'LOGISTICS_PRODUCTION');
      logisticsAddLot(draft,unit.id,unit.sector,'base',output,draft.calendar.date);
      lg.production[unit.id]={date:draft.calendar.date,used:current+quantity};
      lg.metrics.produced+=output;
      event(draft,'LOGISTICA.PRODUZIDA',quantity+' farinha(s) transformadas em '+output+' pães na '+unit.id+'.',
        {businessId:unit.id,inputQuantity:quantity,outputQuantity:output,materialCents:material,
          labourCents:labour,finishedValueCents:material+labour,expiryDays:LOGISTICS_SHELF_DAYS.base},unit.id);
      return;
    }
    throw Error('Comando logístico desconhecido: '+type);
  }
  function validateLogistics(state){
    const lg=state.economy.logistics;
    if(lg===undefined||lg===null){
      assert(balance(state,'INTERNAL_CLEARING')===0,'Compensação interfilial sem módulo logístico.');
      return;
    }
    assert(plain(lg)&&lg.modelVersion===1&&int(lg.seq)&&
      Array.isArray(lg.transfers)&&lg.transfers.length<=10000&&
      Array.isArray(lg.depotPurchases)&&lg.depotPurchases.length<=10000&&
      Array.isArray(lg.batches)&&lg.batches.length<=30000&&plain(lg.production)&&
      plain(lg.metrics)&&int(lg.metrics.fees)&&int(lg.metrics.waste)&&int(lg.metrics.produced),
      'Estrutura logística inválida.');
    if(lg.depot){
      assert(lg.depot.id===LOGISTICS_DEPOT_ID&&cityById(lg.depot.cityId)&&
        isoDate(lg.depot.openedAt)&&
        (lg.depot.lastChargedDate===null||isoDate(lg.depot.lastChargedDate))&&
        Array.isArray(lg.depot.stock)&&lg.depot.stock.length<=200,
        'Centro de distribuição inconsistente.');
      const seen=new Set();
      for(const p of lg.depot.stock){
        const id=p.sector+'|'+p.productId;
        assert(SECTORS[p.sector]&&typeof p.productId==='string'&&typeof p.name==='string'&&
          !seen.has(id)&&int(p.stockUnits)&&int(p.stockValueCents),'Estoque de CD inválido.');
        seen.add(id);
      }
      assert(lg.depot.stock.reduce((n,p)=>n+p.stockUnits,0)<=LOGISTICS_DEPOT_CAPACITY,'CD excedeu capacidade.');
    }
    const seenTrips=new Set();
    for(const t of lg.transfers){
      assert(plain(t)&&typeof t.id==='string'&&!seenTrips.has(t.id)&&
        logisticsSite(state,t.fromId)&&logisticsSite(state,t.toId)&&t.fromId!==t.toId&&
        SECTORS[t.sector]&&typeof t.productId==='string'&&
        Number.isSafeInteger(t.quantity)&&t.quantity>=1&&t.quantity<=250&&
        int(t.valueCents)&&t.valueCents>0&&int(t.feeCents)&&
        isoDate(t.date)&&isoDate(t.dueDate)&&t.dueDate>=t.date&&
        ['PENDING','RECEIVED'].includes(t.status)&&Array.isArray(t.lotPieces)&&
        t.lotPieces.every(p=>int(p.quantity)&&isoDate(p.expiresAt))&&
        t.lotPieces.reduce((n,x)=>n+x.quantity,0)<=t.quantity,
        'Transferência logística sem rastreio adequado.');
      seenTrips.add(t.id);
      assert(t.status==='PENDING'?t.receivedAt===null:
        isoDate(t.receivedAt)&&int(t.deliveredQuantity)&&int(t.lostQuantity)&&
        t.deliveredQuantity+t.lostQuantity===t.quantity&&int(t.deliveredValueCents),
        'Baixa logística ou recebimento inconsistente.');
    }
    const seenOrders=new Set();
    for(const o of lg.depotPurchases){
      assert(plain(o)&&typeof o.id==='string'&&!seenOrders.has(o.id)&&
        businessById(state,o.businessId)&&SECTORS[o.sector]&&
        Number.isSafeInteger(o.quantity)&&o.quantity>=1&&o.quantity<=250&&
        int(o.unitCost)&&o.total===o.unitCost*o.quantity&&
        isoDate(o.date)&&isoDate(o.dueDate)&&['PENDING','RECEIVED'].includes(o.status)&&
        (o.status==='PENDING'?o.receivedAt===null:isoDate(o.receivedAt)),
        'Pedido consolidado inválido.');
      seenOrders.add(o.id);
    }
    const quantities={};
    for(const lot of lg.batches){
      const site=logisticsSite(state,lot.locationId);
      assert(plain(lot)&&site&&SECTORS[lot.sector]&&
        int(lot.quantity)&&lot.quantity>0&&isoDate(lot.receivedAt)&&isoDate(lot.expiresAt),
        'Lote perecível inválido.');
      const p=site.depot?site.location.stock.find(x=>x.sector===lot.sector&&x.productId===lot.productId):
        site.location.products.find(x=>x.id===lot.productId&&site.location.sector===lot.sector);
      assert(p,'Produto de lote inexistente.');
      const k=lot.locationId+'|'+lot.sector+'|'+lot.productId;
      quantities[k]=(quantities[k]||0)+lot.quantity;
      assert(quantities[k]<=p.stockUnits,'Quantidade perecível maior que estoque físico.');
    }
    for(const [businessId,p] of Object.entries(lg.production))
      assert(businessById(state,businessId)?.sector==='padaria'&&
        plain(p)&&isoDate(p.date)&&int(p.used)&&p.used<=LOGISTICS_PRODUCTION_MAX,
        'Apuração de produção diária inválida.');
    assert(logisticsDepotPayable(state)>=0,'Despesa do CD paga além do passivo reconhecido.');
    assert(balance(state,'INTERNAL_CLEARING')===0,'Compensação de movimentações internas não está zerada.');
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
    assert(plain(state)&&[2,3,4,5,6,7,8,9].includes(state.schemaVersion),'Save com schema incompatível');
    assert(Number.isSafeInteger(state.revision)&&state.revision>=0,'Revisão inválida');
    assert(plain(state.player)&&plain(state.calendar)&&int(state.calendar.tick),'Jogador/calendário inválidos');
    assert(/^\d{4}-\d{2}-\d{2}$/.test(state.calendar.date)&&!Number.isNaN(Date.parse(state.calendar.date+'T12:00:00Z')),'Data inválida');
    assert(plain(state.rng)&&int(state.rng.seed)&&state.rng.seed<=4294967295,'Semente inválida');
    assert(plain(state.world)&&Array.isArray(state.world.cities)&&state.world.cities.length===30&&new Set(state.world.cities).size===30,'Mapa nacional inconsistente');
    assert(state.world.cities.every(id=>!!cityById(id)),'Cidade inválida');
    assert(state.player.cityId===null||!!cityById(state.player.cityId),'Cidade de carreira inválida');
    assert(plain(state.world.competitor)&&int(state.world.competitor.priceIndex),'Concorrente inválido');
    validateRivalEconomy(state);
    validateFinancing(state);
    validateLogistics(state);
    if(state.schemaVersion>=7){
      const regional=state.world.regional;
      assert(plain(regional)&&regional.datasetId===POPULATION_SOURCE.id&&
        (state.schemaVersion===7?regional.modelId==='REGIONAL-V1':regional.modelId==='REGIONAL-V2-PIB')&&
        isoDate(regional.effectiveFrom)&&regional.effectiveFrom>=START_DATE&&regional.effectiveFrom<=state.calendar.date,
        'Versão econômica regional ou data de ativação inválida');
      if(state.schemaVersion>=8)assert(regional.gdpDatasetId===GDP_SOURCE.id&&isoDate(regional.gdpEffectiveFrom)&&
        regional.gdpEffectiveFrom>=regional.effectiveFrom&&regional.gdpEffectiveFrom<=state.calendar.date,
        'Base PIB ou data de início da V1.7 inválida');
    }
    assert(plain(state.economy)&&Array.isArray(state.economy.ledger)&&state.economy.ledger.length<=150000,'Ledger inválido');
    assert(plain(state.audit)&&Array.isArray(state.audit.events)&&plain(state.audit.commands),'Auditoria inválida');
    assert(state.audit.events.length<=250000&&new Set(state.audit.events.map(x=>x.id)).size===state.audit.events.length,'Eventos duplicados ou excesso');
    assert(Object.keys(state.audit.commands).length<=100000,'Registro de comandos inválido');
    assert(plain(state.fiscal),'Estado fiscal inválido');
    if(state.schemaVersion<9)assert(state.fiscal.coverageStatus==='NOT_COVERED'&&state.fiscal.rulePackId===null,'Regra fiscal legada inválida');
    else {
      const f=state.fiscal;
      assert(['NOT_COVERED','SIMULATED_PARTIAL'].includes(f.coverageStatus)&&
        ['DEMONSTRACAO_ECONOMICA','SIMULACAO_SIMPLES_COMERCIO'].includes(f.mode)&&Array.isArray(f.assessments)&&f.assessments.length<=10000,'Cobertura fiscal inválida');
      assert(f.mode==='DEMONSTRACAO_ECONOMICA'?f.coverageStatus==='NOT_COVERED'&&f.rulePackId===null&&f.effectiveFrom===null&&f.assessments.length===0:
        f.coverageStatus==='SIMULATED_PARTIAL'&&f.rulePackId===FISCAL_RULE_PACKS.simples2026.id&&isoDate(f.effectiveFrom+'-01')&&
          isoDate(f.activatedAt)&&f.effectiveFrom>f.activatedAt.slice(0,7), 'Pacote fiscal, data ou cobertura incompatível');
      const seen=new Set();let outstanding=0,expense=0;
      for(const a of f.assessments){
        assert(/^\d{4}-(0[1-9]|1[0-2])$/.test(a.period)&&!seen.has(a.period)&&a.period>=f.effectiveFrom&&a.period<periodKey(state.calendar.date),'Competência fiscal duplicada ou não encerrada');seen.add(a.period);
        assert(['OPEN','PAID','ZERO_SIMULATED','UNSUPPORTED'].includes(a.status)&&int(a.amount)&&int(a.paid)&&a.paid<=a.amount,'Apuração fiscal inválida');
        assert(a.status==='PAID'?a.paid===a.amount:a.status==='OPEN'?a.amount>a.paid:a.amount===0&&a.paid===0,'Situação de apuração contraditória');
        outstanding+=a.amount-a.paid;expense+=a.amount;
      }
      assert(outstanding===balance(state,'TAX_PAYABLE')&&expense===balance(state,'TAX_EXPENSE'),'Obrigações simuladas divergem do ledger');
    }
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
        let unitTransit=logisticsRead(state).transfers.filter(t=>t.status==='PENDING'&&t.fromId===b.id)
          .reduce((n,t)=>n+t.valueCents,0);
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
      const lg=logisticsRead(state),depotGoods=lg.depot?.stock.reduce((n,p)=>n+p.stockValueCents,0)||0;
      const depotTransit=lg.depotPurchases.filter(o=>o.status==='PENDING').reduce((n,o)=>n+o.total,0)+
        lg.transfers.filter(t=>t.status==='PENDING'&&t.fromId===LOGISTICS_DEPOT_ID).reduce((n,t)=>n+t.valueCents,0);
      assert(physical===units.reduce((n,x)=>n+x.stockUnits,0)&&goods+depotGoods===inventory&&
        pending+depotTransit===balance(state,'IN_TRANSIT'),'Estoque consolidado não conciliado');
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
    const account=(journals,name)=>journals.reduce((sum,j)=>sum+j.entries.reduce((n,e)=>e.account===name?n+(['CAPITAL','REVENUE','PAYABLE','TAX_PAYABLE','LOAN_PAYABLE','INTEREST_PAYABLE','LOAN_FEES_PAYABLE','CONTRACT_PAYABLE'].includes(name)?e.credit-e.debit:e.debit-e.credit):n,0),0);
    const revenue=account(entries,'REVENUE'),cogs=account(entries,'COGS'),expenses=account(entries,'EXPENSE'),taxExpense=account(entries,'TAX_EXPENSE');
    return {
      period,referenceDate,from,to,effectiveEnd,label,entries,businessId,
      revenue,cogs,expenses,taxExpense,grossProfit:revenue-cogs,profit:revenue-cogs-expenses-taxExpense,
      grossMarginPercent:revenue?Math.round((revenue-cogs)*10000/revenue)/100:null,
      closingCash:businessId==='all'?account(until,'CASH'):null,closingInventory:account(until,'INVENTORY'),
      closingPayable:account(until,'PAYABLE'),closingTaxPayable:account(until,'TAX_PAYABLE'),closingInTransit:account(until,'IN_TRANSIT'),capital:account(entries,'CAPITAL')
    };
  }
  // Demonstrações da V1.8: leituras puras do mesmo ledger que alimenta a V1.7.
  // Contas corporativas não são artificialmente atribuídas a filiais.
  function signedAccount(entries,name){
    const normal=ACCOUNT_CATALOG[name]?.normal;
    const amount=entries.reduce((sum,j)=>sum+j.entries.reduce((n,e)=>n+(e.account===name?e.debit-e.credit:0),0),0);
    const result=normal==='CREDIT'?-amount:amount;
    // Não criar -0 para novos passivos: preserva a forma de snapshots legados nas outras contas.
    return result===0&&['LOAN_PAYABLE','INTEREST_PAYABLE','LOAN_FEES_PAYABLE','CONTRACT_PAYABLE'].includes(name)?0:result;
  }
  function incomeStatement(state,period='all',referenceDate=state.calendar.date,range=null,businessId='all'){
    const base=financialReport(state,period,referenceDate,range,businessId);
    const expenses=base.entries.filter(j=>j.entries.some(e=>e.account==='EXPENSE'));
    const expenseOf=j=>j.entries.reduce((n,e)=>n+(e.account==='EXPENSE'?e.debit-e.credit:0),0);
    const fixed=expenses.filter(j=>transactionKind(j)==='DAILY_EXPENSE').reduce((n,j)=>n+expenseOf(j),0);
    const opening=expenses.filter(j=>transactionKind(j)==='OPENING').reduce((n,j)=>n+expenseOf(j),0);
    const payroll=expenses.filter(j=>transactionKind(j)==='PAYROLL_ACCRUAL').reduce((n,j)=>n+expenseOf(j),0);
    const other=base.expenses-fixed-opening-payroll;
    const corporateResult=base.businessId==='all'?state.economy.ledger.filter(j=>j.date>=base.from&&j.date<=base.effectiveEnd&&
      journalBusinessId(state,j)===null).reduce((n,j)=>n+signedAccount([j],'REVENUE')-signedAccount([j],'COGS')-signedAccount([j],'EXPENSE')-signedAccount([j],'TAX_EXPENSE'),0):0;
    return {period:base.period,from:base.from,to:base.to,effectiveEnd:base.effectiveEnd,label:base.label,
      businessId:base.businessId,revenue:base.revenue,cogs:base.cogs,grossProfit:base.grossProfit,
      fixedExpenses:fixed,openingExpenses:opening,...(payroll?{payrollExpenses:payroll}:{}),unclassifiedExpenses:other,
      expenses:base.expenses,operatingResult:base.revenue-base.cogs-base.expenses,taxExpense:base.taxExpense,
      resultAfterSimulatedTax:base.profit,corporateResult,
      marginPercent:base.grossMarginPercent,fiscalCoverage:state.fiscal.coverageStatus};
  }
  function balanceSheet(state,asOf=state.calendar.date){
    assert(state&&plain(state.economy),'Carreira inválida');
    assert(isoDate(asOf)&&asOf>=START_DATE&&asOf<=state.calendar.date,'Data de balanço inválida');
    const journals=state.economy.ledger.filter(j=>j.date<=asOf);
    const financeAccounts=['LOAN_PAYABLE','INTEREST_PAYABLE','LOAN_FEES_PAYABLE','CONTRACT_PAYABLE'];
    const amounts=Object.fromEntries(Object.keys(ACCOUNT_CATALOG)
      .filter(code=>(state.economy.financing||!financeAccounts.includes(code))&&
        (state.economy.logistics||code!=='INTERNAL_CLEARING'))
      .map(code=>[code,signedAccount(journals,code)]));
    const unknown=Object.keys(ACCOUNT_CATALOG).length===0?[]:[...new Set(journals.flatMap(j=>j.entries.map(e=>e.account)))].filter(a=>!ACCOUNT_CATALOG[a]);
    const assets=amounts.CASH+amounts.INVENTORY+amounts.IN_TRANSIT+amounts.RECEIVABLE+(amounts.INTERNAL_CLEARING||0);
    const liabilities=amounts.PAYABLE+amounts.TAX_PAYABLE+(amounts.LOAN_PAYABLE||0)+(amounts.INTEREST_PAYABLE||0)+(amounts.LOAN_FEES_PAYABLE||0)+(amounts.CONTRACT_PAYABLE||0),retainedEarnings=amounts.REVENUE-amounts.COGS-amounts.EXPENSE-amounts.TAX_EXPENSE;
    const equity=amounts.CAPITAL+retainedEarnings,difference=assets-liabilities-equity;
    return {asOf,accounts:amounts,assets,liabilities,paidInCapital:amounts.CAPITAL,
      retainedEarnings,equity,difference,balanced:difference===0&&unknown.length===0,
      unknownAccounts:unknown,fiscalCoverage:state.fiscal.coverageStatus,
      scope:'GROUP',warning:'Caixa e balanço pertencem ao grupo; filiais são centros de resultado, não bancos independentes.'};
  }
  function cashFlowStatement(state,period='all',referenceDate=state.calendar.date,range=null,businessId='all'){
    const base=financialReport(state,period,referenceDate,range,businessId);
    const rows={sales:0,suppliers:0,operating:0,opening:0,taxPayments:0,capital:0,unclassifiedIn:0,unclassifiedOut:0};
    let inflows=0,outflows=0;
    for(const j of base.entries){
      const debit=j.entries.reduce((n,e)=>n+(e.account==='CASH'?e.debit:0),0);
      const credit=j.entries.reduce((n,e)=>n+(e.account==='CASH'?e.credit:0),0);
      const net=debit-credit;
      if(net===0)continue;
      if(net>0)inflows+=net;else outflows+=-net;
      const kind=transactionKind(j);
      if(kind==='SALE'&&net>0)rows.sales+=net;
      else if(kind==='CAPITAL'&&net>0)rows.capital+=net;
      else if(kind==='PURCHASE'&&net<0)rows.suppliers+=-net;
      else if(kind==='DAILY_EXPENSE'&&net<0)rows.operating+=-net;
      else if(kind==='OPENING'&&net<0)rows.opening+=-net;
      else if(kind==='TAX_PAYMENT'&&net<0)rows.taxPayments+=-net;
      else if(kind==='PAYROLL_PAYMENT'&&net<0)rows.payroll=(rows.payroll||0)-net;
      else if(kind==='OPERATING_SETTLEMENT'&&net<0)rows.operatingSettlements=(rows.operatingSettlements||0)-net;
      else if(kind==='LOAN_DRAW'&&net>0)rows.loanDraws=(rows.loanDraws||0)+net;
      else if(kind==='LOAN_PAYMENT'&&net<0)rows.loanPayments=(rows.loanPayments||0)-net;
      else if(kind==='CONTRACT_PAYMENT'&&net<0)rows.contractPenalties=(rows.contractPenalties||0)-net;
      else if(net>0)rows.unclassifiedIn+=net;
      else rows.unclassifiedOut+=-net;
    }
    const netCash=inflows-outflows;
    // Para filial há apenas fluxos atribuíveis, nunca 'saldo bancário da filial'.
    const openingCash=businessId==='all'?signedAccount(state.economy.ledger.filter(j=>j.date<base.from),'CASH'):null;
    const closingCash=businessId==='all'?signedAccount(state.economy.ledger.filter(j=>j.date<=base.effectiveEnd),'CASH'):null;
    return {period:base.period,from:base.from,to:base.to,effectiveEnd:base.effectiveEnd,label:base.label,
      businessId,inflows,outflows,netCash,openingCash,closingCash,
      reconciled:businessId==='all'?openingCash+netCash===closingCash:null,
      categories:rows,scope:businessId==='all'?'GROUP':'UNIT_CONTRIBUTION',
      warning:businessId==='all'?'Fluxo de caixa realizado, não projeção.':'Contribuição da unidade para o caixa compartilhado; não existe saldo de caixa individual.'};
  }
  function reconciliationReport(state,asOf=state.calendar.date){
    const sheet=balanceSheet(state,asOf),journals=state.economy.ledger.filter(j=>j.date<=asOf);
    const errors=[],unitRows=[];
    if(!sheet.balanced)errors.push('O balanço não fecha ou contém contas desconhecidas.');
    for(const j of journals){
      const debit=j.entries.reduce((n,e)=>n+e.debit,0),credit=j.entries.reduce((n,e)=>n+e.credit,0);
      if(debit!==credit||debit<=0)errors.push(`Lançamento ${j.id} desequilibrado`);
    }
    const snapshotAvailable=asOf===state.calendar.date;
    if(snapshotAvailable){
      let physical=0,transit=0;
      for(const b of businesses(state)){
        const inventory=b.products.reduce((n,p)=>n+p.stockValueCents,0);
        const inTransit=b.purchaseOrders.filter(o=>o.status==='PENDING').reduce((n,o)=>n+o.total,0)+
          logisticsRead(state).transfers.filter(t=>t.status==='PENDING'&&t.fromId===b.id)
            .reduce((n,t)=>n+t.valueCents,0);
        const local=journals.filter(j=>journalBusinessId(state,j)===b.id);
        const ledgerInventory=signedAccount(local,'INVENTORY'),ledgerTransit=signedAccount(local,'IN_TRANSIT');
        const ok=inventory===ledgerInventory&&inTransit===ledgerTransit;
        if(!ok)errors.push(`Unidade ${b.id} possui estoque/trânsito divergente do ledger`);
        unitRows.push({id:b.id,inventory,inTransit,ledgerInventory,ledgerTransit,ok});
        physical+=inventory;transit+=inTransit;
      }
      const lg=logisticsRead(state),depotGoods=lg.depot?.stock.reduce((n,p)=>n+p.stockValueCents,0)||0;
      const depotTransit=lg.depotPurchases.filter(o=>o.status==='PENDING').reduce((n,o)=>n+o.total,0)+
        lg.transfers.filter(t=>t.status==='PENDING'&&t.fromId===LOGISTICS_DEPOT_ID).reduce((n,t)=>n+t.valueCents,0);
      if(physical+depotGoods!==sheet.accounts.INVENTORY||transit+depotTransit!==sheet.accounts.IN_TRANSIT||
        (sheet.accounts.INTERNAL_CLEARING||0)!==0)errors.push('Estoque consolidado, trânsito ou compensação interfilial diverge do razão contábil');
      if(lg.depot)unitRows.push({id:LOGISTICS_DEPOT_ID,inventory:depotGoods,inTransit:depotTransit,
        ledgerInventory:signedAccount(journals.filter(j=>journalBusinessId(state,j)===null),'INVENTORY'),
        ledgerTransit:signedAccount(journals.filter(j=>journalBusinessId(state,j)===null),'IN_TRANSIT'),
        ok:depotGoods===signedAccount(journals.filter(j=>journalBusinessId(state,j)===null),'INVENTORY')&&
          depotTransit===signedAccount(journals.filter(j=>journalBusinessId(state,j)===null),'IN_TRANSIT')});
    }
    return {asOf,balanced:sheet.balanced,statementDifference:sheet.difference,
      snapshotAvailable,unitRows,unknownAccounts:sheet.unknownAccounts,errors,ok:errors.length===0,
      note:snapshotAvailable?'Conciliação do estoque físico atual e pedidos em trânsito com o ledger.':'Data histórica: apenas lançamentos contábeis são conferidos; não há inventário físico retroativo.'};
  }
  function monthlyClose(state,month,businessId='all'){
    assert(typeof month==='string'&&/^\d{4}-(0[1-9]|1[0-2])$/.test(month),'Competência mensal inválida');
    assert(month<=state.calendar.date.slice(0,7),'Competência futura não permitida');
    const referenceDate=month+'-01';
    const dre=incomeStatement(state,'month',referenceDate,null,businessId);
    const cash=cashFlowStatement(state,'month',referenceDate,null,businessId);
    const balance=balanceSheet(state,dre.effectiveEnd);
    return {month,from:dre.from,to:dre.effectiveEnd,businessId,operatingResult:dre.operatingResult,
      netCash:cash.netCash,globalBalance:balance.balanced,
      taxExpense:dre.taxExpense,resultAfterSimulatedTax:dre.resultAfterSimulatedTax,
      status:'GERENCIAL_CONSULTA',fiscalCoverage:state.fiscal.coverageStatus,
      note:'Fechamento gerencial somente leitura. Não gera lançamentos, tributos ou bloqueio de competência.'};
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
      const forecastPlan=state.world.rivalEconomy?rivalAllocation(state,businesses(state),
        1+.13*Math.sin((state.calendar.tick%365)/365*Math.PI*2)):null;
      const quota=forecastPlan?.quotas.get(b.id+'|'+p.id);
      const demand=quota?quota.demand:Math.max(0,Math.round(p.demand*city.factor/100/
        businesses(state).filter(x=>x.cityId===b.cityId&&x.sector===b.sector).length*
        demandElasticity(unitPrice,reference,city)));
      weightedDemand+=demand;weightedContribution+=demand*(unitPrice-unitCost);
    }
    const contributionPerUnit=weightedDemand?weightedContribution/weightedDemand:0;
    const breakEvenUnits=contributionPerUnit>0?Math.ceil(fixedDaily/contributionPerUnit):null;
    const operatingDebts=operatingPayablesReport(state),payrollDebts=rhReport(state);
    const knownObligations={operational:operatingDebts.total,payroll:payrollDebts.pendingCents,
      tax:balance(state,'TAX_PAYABLE'),unclassified:operatingDebts.unclassified};
    let cash=current.cash,creditors=current.payable,projectedRevenue=0,projectedCogs=0,unitsSold=0,missed=0,lowestCash=cash,projectedPayrollAccrual=0;
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
      if(dateNext(date).slice(0,7)!==date.slice(0,7)){
        const payroll=estimatedPayrollMonth(state,b.id,periodKey(date));
        projectedPayrollAccrual+=payroll;
        creditors+=payroll; // folha a pagar: sem pagamento automático nem saída de caixa duplicada
      }
      lowestCash=Math.min(lowestCash,cash);
      date=dateNext(date);
    }
    const profit=projectedRevenue-projectedCogs-fixedDaily*horizonDays-projectedPayrollAccrual;
    return {horizonDays,projectedRevenue,projectedCogs,projectedFixed:fixedDaily*horizonDays,
      projectedProfit:profit,projectedCash:cash,projectedPayable:creditors,lowestCash,estimatedLostUnits:missed,estimatedSoldUnits:unitsSold,
      projectedPayrollAccrual,knownObligations,
      cashAfterKnownDebtsIfPaid:cash-knownObligations.operational-knownObligations.payroll-knownObligations.tax-Math.max(0,knownObligations.unclassified),
      forecastCoverage:'SIMULACAO_UNIDADE_ATIVA_SEM_LIQUIDACAO_AUTOMATICA',
      forecastNote:'Projeta vendas e despesas fixas da unidade ativa; inclui folha futura estimada como passivo. Não inclui vendas e custos das demais unidades, pagamentos futuros, novos tributos ou novas contratações. Dívidas atuais NÃO são liquidadas automaticamente.',
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
      taxExpense:total.taxExpense,taxPayable:total.taxPayable,profit:total.profit,stock:total.stock,inventoryValue:total.inventoryValue,inTransit:total.inTransit,payable:total.payable}};
  }
  // V2.5-alpha.1: objetivos e patamares derivam de evidências do próprio jogo.
  // Consulta pura: nenhum crédito, XP, comando, evento, RNG ou campo novo no save.
  function progressionReport(state){
    if(!state)return {level:{id:'preparacao',label:'Em preparação'},goals:[],achievements:[],completed:0,total:0};
    const units=businesses(state),cityCount=new Set(units.map(b=>b.cityId)).size;
    const days=state.calendar.tick,dailyFixed=units.reduce((n,b)=>n+SECTORS[b.sector].dailyCost,0);
    const last=new Date(state.calendar.date+'T12:00:00Z');last.setUTCDate(last.getUTCDate()-1);
    const first=new Date(last);first.setUTCDate(first.getUTCDate()-29);
    const from=first.toISOString().slice(0,10),to=last.toISOString().slice(0,10);
    let revenue=0,revenue30=0,cogs30=0,expense30=0,firstSales=0,settlements=0;
    for(const j of state.economy.ledger){
      const kind=transactionKind(j);
      if(kind==='SALE')firstSales++;
      if(kind==='OPERATING_SETTLEMENT')settlements++;
      const recent=j.date>=from&&j.date<=to;
      for(const e of j.entries){
        if(e.account==='REVENUE'){
          const amount=e.credit-e.debit;
          revenue+=amount;if(recent)revenue30+=amount;
        }else if(recent&&e.account==='COGS')cogs30+=e.debit-e.credit;
        else if(recent&&e.account==='EXPENSE')expense30+=e.debit-e.credit;
      }
    }
    const cash=balance(state,'CASH');
    const recentResult=revenue30-cogs30-expense30;
    const margin30=revenue30>0?Math.round(recentResult*10000/revenue30)/100:0;
    const regionalRequirements=[{actual:units.length,target:3},{actual:cityCount,target:2},
      {actual:days,target:90},{actual:revenue,target:10000000}];
    const conglomerateRequirements=[{actual:units.length,target:5},{actual:cityCount,target:3},
      {actual:days,target:365},{actual:revenue,target:75000000}];
    const qualified=items=>items.every(x=>x.actual>=x.target);
    const level=qualified(conglomerateRequirements)?
      {id:'conglomerado',label:'Conglomerado empresarial',order:3}:
      qualified(regionalRequirements)?{id:'rede-regional',label:'Rede regional',order:2}:
      units.length?{id:'negocio-local',label:'Negócio local',order:1}:
      {id:'preparacao',label:'Em preparação',order:0};
    // Missões compostas só fecham quando TODOS os requisitos têm evidência.
    const create=(id,label,details,requirements,evidence)=>{
      const progressPct=Math.round(Math.min(...requirements.map(x=>Math.min(1,Math.max(0,x.actual/x.target))))*100);
      return {id,label,details,evidence,requirements,progressPct,completed:requirements.every(x=>x.actual>=x.target)};
    };
    const goals=[
      create('primeira-empresa','Inaugurar a primeira empresa','Abrir uma unidade em lote disponível.',
        [{actual:units.length,target:1}],units.length+' de 1 unidade'),
      create('primeira-venda','Realizar a primeira venda','Vendas automáticas confirmadas no livro, nunca faturamento potencial.',
        [{actual:firstSales,target:1}],firstSales+' registro(s) SALE'),
      create('semana-operando','Completar sete dias de operação','Avançar o calendário da carreira.',
        [{actual:days,target:7}],days+' de 7 dias'),
      create('primeiro-mes','Completar 30 dias','Observar um mês de decisões e consequências.',
        [{actual:days,target:30}],days+' de 30 dias'),
      create('receita-20k','Realizar R$ 20 mil em vendas','Aportes e compra de estoque não contam como receita.',
        [{actual:revenue,target:2000000}],money(revenue)+' de R$ 20.000'),
      create('primeira-filial','Abrir a primeira filial','Expandir para duas unidades sem capital fictício por filial.',
        [{actual:units.length,target:2}],units.length+' de 2 unidades'),
      create('duas-cidades','Operar em duas cidades','Ter unidades efetivamente abertas em duas cidades diferentes.',
        [{actual:cityCount,target:2}],cityCount+' de 2 cidades'),
      create('margem-30dias','Atingir margem operacional de 10% em 30 dias','Exige 30 dias, receita recente de R$ 10 mil e margem depois de CMV e despesas.',
        [{actual:days,target:30},{actual:revenue30,target:1000000},{actual:margin30,target:10}],
        'Margem '+margin30.toFixed(2)+'% · receita 30d '+money(revenue30)),
      create('reserva-30dias','Manter caixa para 30 dias de despesas fixas','Exige ao menos 30 dias jogados e reserva do grupo para lojas atuais.',
        [{actual:units.length,target:1},{actual:days,target:30},{actual:cash,target:Math.max(1,dailyFixed*30)}],
        'Caixa '+money(cash)+' · reserva '+money(dailyFixed*30)),
      create('faturamento-90','Operar 90 dias e vender R$ 100 mil','Exige simultaneamente tempo e vendas realizadas.',
        [{actual:days,target:90},{actual:revenue,target:10000000}],
        days+' dias · '+money(revenue)+' em vendas'),
      create('rede-regional','Construir rede regional','Três unidades, duas cidades, 90 dias e R$ 100 mil vendidos.',
        regionalRequirements,units.length+' lojas · '+cityCount+' cidades · '+days+' dias · '+money(revenue)),
      create('conglomerado','Constituir conglomerado','Cinco unidades, três cidades, 365 dias e R$ 750 mil vendidos.',
        conglomerateRequirements,units.length+' lojas · '+cityCount+' cidades · '+days+' dias · '+money(revenue))
    ];
    const achievements=[
      {id:'primeira-venda',label:'Primeira venda',completed:firstSales>0,source:'Lançamento SALE confirmado'},
      {id:'primeira-filial',label:'Primeira filial',completed:units.length>=2,source:'Pelo menos duas unidades abertas'},
      {id:'primeiro-saneamento',label:'Primeiro passivo quitado',completed:settlements>0,source:'Liquidação OPERATING_SETTLEMENT'}
    ];
    // Conquistas e desbloqueios: reconhecimento derivado, sem bônus de moedas.
    const hasDecision=id=>state.audit.events.some(e=>e.type==='DILEMA.DECIDIDO'&&e.data.dilemmaId===id);
    const unlocks=[
      {id:'observatorio',label:'Observatório de mercado',unlocked:days>=7,reason:'Sete dias operados'},
      {id:'dilemas',label:'Escolhas estratégicas',unlocked:!!state.world.rivalEconomy,reason:'Economia viva ativada'},
      {id:'expansao',label:'Rotas de expansão',unlocked:units.length>=2,reason:'Primeira filial confirmada'}
    ];
    achievements.push(
      {id:'primeira-reposicao',label:'Primeira reposição',completed:state.economy.ledger.some(j=>transactionKind(j)==='PURCHASE'),
        source:'Compra registrada no livro contábil'},
      {id:'mes-operado',label:'Um mês de empreendedorismo',completed:days>=30,source:'Calendário operacional'},
      {id:'estrategista',label:'Primeira decisão estratégica',completed:hasDecision('caixa-estoque')||
        state.audit.events.some(e=>e.type==='DILEMA.DECIDIDO'),source:'Dilema resolvido no motor'},
      {id:'rede-regional',label:'Rede regional',completed:level.order>=2,source:'Todos os critérios simultâneos confirmados'},
      {id:'conglomerado',label:'Conglomerado',completed:level.order>=3,source:'Patamar máximo verificado'}
    );
    const completed=goals.filter(g=>g.completed).length;
    return {level,goals,achievements,unlocks,completed,total:goals.length,
      metrics:{days,units:units.length,cities:cityCount,revenueCents:revenue,cashCents:cash,
        recentRevenueCents:revenue30,recentResultCents:recentResult,margin30,dailyFixedCents:dailyFixed},
      note:'Missões e selos são leituras do histórico confirmado. Não concedem dinheiro, pontos arbitrários ou bônus econômicos.'};
  }
  function exportSave(state) {
    validate(state);const payload=clone(state),raw=JSON.stringify(payload);
    assert(raw.length<MAX_SAVE_CHARS,'Carreira excede limite de exportação');
    const envelope={saveFormatVersion:1,app:'Cidade dos Negócios',checksumAlgorithm:'FNV1A32',checksum:hash(raw),payload};
    // Saves grandes preservam o conteúdo, mas eliminam espaços da formatação JSON.
    // Arquivos menores mantêm byte a byte o formato anterior.
    const readable=JSON.stringify(envelope,null,2);
    const output=readable.length<MAX_SAVE_CHARS?readable:JSON.stringify(envelope);
    assert(output.length<MAX_SAVE_CHARS,'Carreira excede limite seguro de exportação');
    return output;
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
    const migrated=data.payload.schemaVersion!==9,state=upgradedState(data.payload);validate(state);
    return {state,migrated,message:migrated?'Carreira migrada para V1.9: histórico preservado; cenário tributário desativado até confirmação explícita.':'Carreira restaurada com integridade validada.'};
  }
  function diagnostics(state) { if(!state) return {ok:true,message:'Nenhuma carreira ativa; aguardando criação.',cities:CITIES.length,ufs:new Set(CITIES.map(x=>x.uf)).size};validate(state);return {ok:true,revision:state.revision,events:state.audit.events.length,journals:state.economy.ledger.length,tick:state.calendar.tick,cities:CITIES.length,ufs:new Set(CITIES.map(x=>x.uf)).size,checksum:hash(JSON.stringify(state)),status:'PASS (integridade estrutural e contábil)'}; }
  const API=Object.freeze({logisticsReport,logisticsRouteQuote,logisticsSuggestions,creditReport,financialCommitmentsReport,journeyGuide,reputationReport,dilemmaReport,DILEMMA_DEFINITIONS,rivalMarketReport,RIVAL_EVENT_TYPES,progressionReport,operatingPayablesReport,estimatedPayrollMonth,FISCAL_OP_TASKS,fiscalOperationsReport,RH_ROLES,rhEmployees,rhProductivity,rhReport,PARALEGAL_SERVICES,paralegalReport,FISCAL_RULE_PACKS,taxReport,taxEstimate,transitionReport,VERSION,SCHEMA_VERSION,START_DATE,ACCOUNT_CATALOG,transactionKind,incomeStatement,balanceSheet,cashFlowStatement,reconciliationReport,monthlyClose,ECONOMIC_REFERENCES,regionalProfile,regionalComparison,competitorReference,demandElasticity,CITIES,SECTORS,SUPPLIERS,businesses,activeBusiness,businessById,groupReport,inventoryReport,effectivePrice,strategyReport,dispatch,validate,overview,exportSave,importSave,diagnostics,financialReport,priceHistory,productPerformance,cityById,money,hash,dateNext});
  return API;
})();
