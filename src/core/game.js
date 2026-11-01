/* Cidade dos Negócios 1 — núcleo puro, sem DOM e sem rede. v1.0.0-rc.1 */
const CidadeCore = (() => {
  'use strict';
  const VERSION = '1.0.0-rc.1';
  const SCHEMA_VERSION = 2;
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
  const CITIES = Object.freeze(CITIES_SOURCE.map(([uf,name], index) => Object.freeze({
    id:`${uf}-${name.normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z\d]+/gi,'-').toUpperCase()}`,
    uf, name, capital:index<27, factor:[85,100,115,95,110][index%5]  // Apenas parâmetros inventados para gameplay, NÃO indicadores oficiais.
  })));
  const SECTORS = Object.freeze({
    mercado: Object.freeze({name:'Mercado de bairro', product:'Cesta de produtos', cost:3200, recommended:4900, openCost:750000, dailyCost:13500, demand:13, glyph:'🛒'}),
    padaria: Object.freeze({name:'Padaria', product:'Pão artesanal', cost:540, recommended:960, openCost:900000, dailyCost:15900, demand:22, glyph:'🥖'}),
    roupas: Object.freeze({name:'Loja de roupas', product:'Peça de vestuário', cost:4800, recommended:8500, openCost:1100000, dailyCost:11900, demand:8, glyph:'👕'})
  });
  const clone = value => JSON.parse(JSON.stringify(value));
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
  function event(draft,type,text,data={}) { const id=`evt-${++draft.audit.eventSeq}`;draft.audit.events.push({id,type,date:draft.calendar.date,text,data}); }
  function journal(draft,memo,entries) {
    const debit=entries.reduce((n,x)=>n+x.debit,0),credit=entries.reduce((n,x)=>n+x.credit,0);
    assert(debit===credit && debit>0,'Lançamento desequilibrado');
    assert(entries.every(x=>typeof x.account==='string'&&int(x.debit)&&int(x.credit)&&!(x.debit&&x.credit)),'Linha financeira inválida');
    draft.economy.ledger.push({id:`jnl-${++draft.economy.journalSeq}`,date:draft.calendar.date,memo,entries});
  }
  function balance(draft,account) {let total=0;for(const j of draft.economy.ledger)for(const e of j.entries)if(e.account===account)total+=(['CAPITAL','REVENUE','PAYABLE'].includes(account)?e.credit-e.debit:e.debit-e.credit);return total;}
  function overview(draft) {
    if(!draft)return null;
    const revenue=balance(draft,'REVENUE'),cogs=balance(draft,'COGS'),expenses=balance(draft,'EXPENSE');
    return {cash:balance(draft,'CASH'),inventoryValue:balance(draft,'INVENTORY'),receivables:balance(draft,'RECEIVABLE'),payable:balance(draft,'PAYABLE'),revenue,cogs,expenses,profit:revenue-cogs-expenses,stock:draft.world.business?.stockUnits??0,unitPrice:draft.world.business?.unitPrice??null,tick:draft.calendar.tick,city:cityById(draft.player.cityId)?.name??'—'};
  }
  function emptyLegacy(seed) {return {
    schemaVersion:2,worldId:`legacy-${seed}`,revision:0,
    meta:{title:'Cidade dos Negócios',version:VERSION,origin:'MIGRATED_EMPTY_CP000',mode:'DEMONSTRACAO_ECONOMICA'},
    calendar:{date:START_DATE,tick:0},rng:{seed},
    player:{name:'',companyName:'',cityId:null},world:{cities:CITIES.map(x=>x.id),business:null,competitor:{priceIndex:100}},
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
    const b=draft.world.business;
    if(type==='EMPRESA.ABRIR') {
      assert(!b,'Uma empresa já está aberta nesta carreira');
      const s=SECTORS[payload.sector],lot=Number(payload.lot);
      assert(s,'Atividade comercial desconhecida');assert(Number.isInteger(lot)&&lot>=1&&lot<=18,'Selecione um lote válido (1 a 18)');
      assert(balance(draft,'CASH')>=s.openCost,'Caixa insuficiente para abrir esta empresa');
      draft.world.business={id:'est-1',sector:payload.sector,lot,stockUnits:0,unitPrice:s.recommended,openedAt:draft.calendar.date,totalSold:0};
      journal(draft,`Abertura: ${s.name}`,[{account:'EXPENSE',debit:s.openCost,credit:0},{account:'CASH',debit:0,credit:s.openCost}]);
      event(draft,'EMPRESA.ABERTA',`${s.name} inaugurado no lote ${lot}.`,{lot,sector:payload.sector});
      return;
    }
    if(type==='ESTOQUE.COMPRAR') {
      assert(b,'Abra uma empresa antes de comprar');
      const qty=Number(payload.quantity),s=SECTORS[b.sector];
      assert(Number.isInteger(qty)&&qty>=1&&qty<=2000,'Quantidade de compra inválida (1–2000)');
      assert(b.stockUnits+qty<=100000,'Capacidade máxima de estoque excedida');
      const cost=qty*s.cost;assert(balance(draft,'CASH')>=cost,`Caixa insuficiente para comprar: ${money(cost)}`);
      b.stockUnits+=qty;
      journal(draft,`Compra de ${qty} un. de ${s.product}`,[{account:'INVENTORY',debit:cost,credit:0},{account:'CASH',debit:0,credit:cost}]);
      event(draft,'ESTOQUE.COMPRADO',`${qty} unidades recebidas por ${money(cost)}.`,{qty,cost});
      return;
    }
    if(type==='PRECO.DEFINIR') {
      assert(b,'Abra uma empresa antes de definir preços');
      const cents=Number(payload.cents);assert(int(cents)&&cents>=100&&cents<=1000000,'Preço deve estar entre R$ 1 e R$ 10.000');
      const old=b.unitPrice;b.unitPrice=cents;
      event(draft,'PRECO.ALTERADO',`Preço de ${money(old)} para ${money(cents)}.`,{old,cents});return;
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
    const b=draft.world.business;
    if(b){
      const s=SECTORS[b.sector],city=cityById(draft.player.cityId);
      const competitorPrice=s.recommended*(draft.world.competitor.priceIndex/100);
      const ratio=b.unitPrice/competitorPrice;
      const elasticity=clamp(1.32-(ratio-1)*1.4,0.08,1.85);
      const season=1+0.13*Math.sin((draft.calendar.tick%365)/365*Math.PI*2);
      const demand=Math.max(0,Math.floor(s.demand*(city.factor/100)*elasticity*season*(0.75+random(draft)*0.55)));
      const sold=Math.min(b.stockUnits,demand);
      if(sold>0){
        const total=sold*b.unitPrice,cost=sold*s.cost;
        b.stockUnits-=sold;b.totalSold+=sold;
        journal(draft,`${s.product} — ${sold} vendas`,[
          {account:'CASH',debit:total,credit:0},{account:'REVENUE',debit:0,credit:total},
          {account:'COGS',debit:cost,credit:0},{account:'INVENTORY',debit:0,credit:cost}
        ]);
        event(draft,'VENDA.CONCLUIDA',`${sold} unidades vendidas: ${money(total)}.`,{sold,total,cost});
      }
      const cash=balance(draft,'CASH'),expense=s.dailyCost;
      // Despesa não desaparece quando não há caixa: vira obrigação a pagar.
      journal(draft,'Despesa operacional diária',[
        {account:'EXPENSE',debit:expense,credit:0},
        {account:cash>=expense?'CASH':'PAYABLE',debit:0,credit:expense}
      ]);
      if(cash<expense) event(draft,'CONTAS.A_PAGAR',`Despesa de ${money(expense)} registrada como obrigação pendente.`);
      // A IA é uma intenção interna processada pelo mesmo handler e confirmada no mesmo tick.
      if((draft.calendar.tick+1)%7===0){
        const change=Math.floor(random(draft)*17)-8;
        handler(draft,'IA.AJUSTAR_PRECO',{priceIndex:clamp(draft.world.competitor.priceIndex+change,75,125)});
      }
    }
    const finished=draft.calendar.date;
    event(draft,'DIA.ENCERRADO',`Dia ${finished} concluído.`,{finished});
    draft.calendar.tick++;
    draft.calendar.date=dateNext(draft.calendar.date);
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
      const draft=clone(current);
      assert(Object.keys(draft.audit.commands).length<100000,'Limite de histórico de comandos atingido; exporte a carreira');
      handler(draft,cmd.type,payload);
      draft.revision++;
      draft.audit.commands[cmd.id]=fingerprint({type:cmd.type,payload});
      validate(draft);
      return {ok:true,status:'APPLIED',state:draft,message:'Operação confirmada.'};
    }catch(error){return {ok:false,status:'REJECTED',state:current?clone(current):null,error:error.message};}
  }
  function validate(state) {
    assert(plain(state)&&state.schemaVersion===2,'Save com schema incompatível');
    assert(Number.isSafeInteger(state.revision)&&state.revision>=0,'Revisão inválida');
    assert(plain(state.player)&&plain(state.calendar)&&int(state.calendar.tick),'Jogador/calendário inválidos');
    assert(/^\d{4}-\d{2}-\d{2}$/.test(state.calendar.date)&&!Number.isNaN(Date.parse(state.calendar.date+'T12:00:00Z')),'Data inválida');
    assert(plain(state.rng)&&int(state.rng.seed)&&state.rng.seed<=4294967295,'Semente inválida');
    assert(plain(state.world)&&Array.isArray(state.world.cities)&&state.world.cities.length===30&&new Set(state.world.cities).size===30,'Mapa nacional inconsistente');
    assert(state.world.cities.every(id=>!!cityById(id)),'Cidade inválida');
    assert(state.player.cityId===null||!!cityById(state.player.cityId),'Cidade de carreira inválida');
    assert(plain(state.world.competitor)&&int(state.world.competitor.priceIndex),'Concorrente inválido');
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
    const b=state.world.business;
    if(b){assert(SECTORS[b.sector]&&Number.isInteger(b.lot)&&b.lot>=1&&b.lot<=18&&int(b.stockUnits)&&int(b.totalSold)&&int(b.unitPrice),'Empresa inválida');assert(inventory===b.stockUnits*SECTORS[b.sector].cost,'Estoque físico e contábil divergentes');}
    else assert(inventory===0,'Estoque sem empresa');
    return true;
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
    return {state:clone(data.payload),migrated:false,message:'Carreira restaurada com integridade validada.'};
  }
  function diagnostics(state) { if(!state) return {ok:true,message:'Nenhuma carreira ativa; aguardando criação.',cities:CITIES.length,ufs:new Set(CITIES.map(x=>x.uf)).size};validate(state);return {ok:true,revision:state.revision,events:state.audit.events.length,journals:state.economy.ledger.length,tick:state.calendar.tick,cities:CITIES.length,ufs:new Set(CITIES.map(x=>x.uf)).size,checksum:hash(JSON.stringify(state)),status:'PASS (integridade estrutural e contábil)'}; }
  const API=Object.freeze({VERSION,SCHEMA_VERSION,START_DATE,CITIES,SECTORS,dispatch,validate,overview,exportSave,importSave,diagnostics,cityById,money,hash,dateNext});
  return API;
})();
