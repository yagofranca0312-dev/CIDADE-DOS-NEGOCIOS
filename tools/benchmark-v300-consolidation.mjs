// V3.0 etapa 5 — performance de carreira, save e renderizadores reais sob DOM simulado.
// NÃO valida layout, pintura/frames, quotas de localStorage, Windows ou mobile.
// Não altera motor, HTML, regras econômicas ou arquivos do jogador.
import {readFileSync} from 'node:fs';
import {performance} from 'node:perf_hooks';
import {runInNewContext} from 'node:vm';
const read=path=>readFileSync(path,'utf8');
const Core=runInNewContext(read('src/core/game.js')+'\nCidadeCore',{});
const MB=1048576;
let seq=0;
function command(s,type,payload={}){
  const r=Core.dispatch(s,{id:'stage5:'+ ++seq,type,payload});
  if(!r.ok)throw Error(type+': '+r.error);
  return r.state;
}
function fixture(units){
  let s=command(null,'CARREIRA.CRIAR',{name:'Auditoria V3',companyName:'Rede Fictícia de Performance',cityId:'CE-TIANGUA',seed:300507});
  if(units===5){
    // Aporte artificial EXISTE APENAS NA FIXTURE de laboratório.
    const amount=3000000;
    s.economy.ledger.push({id:'jnl-'+(++s.economy.journalSeq),date:s.calendar.date,
      memo:'Aporte de fixture (NÃO É GAMEPLAY)',kind:'CAPITAL',entries:[
      {account:'CASH',debit:amount,credit:0},{account:'CAPITAL',debit:0,credit:amount}]});
    Core.validate(s);
  }
  for(let i=0;i<units;i++){
    s=command(s,'EMPRESA.ABRIR',{cityId:'CE-TIANGUA',lot:i+1,
      sector:['mercado','padaria','roupas'][i%3]});
    s=command(s,'FISCAL_OP.ATIVAR',{businessId:Core.activeBusiness(s).id,acceptSimulation:true});
  }
  s=command(s,'RH.CONTRATAR',{businessId:Core.businesses(s)[0].id,role:'atendimento',name:'Funcionário Fictício'});
  return s;
}
function advance(s,days){
  const t=performance.now();const heap=process.memoryUsage().heapUsed;
  while(days>0){
    const count=Math.min(30,days);
    s=command(s,'TEMPO.AVANCAR_LOTE',{days:count});days-=count;
  }
  return {s,ms:performance.now()-t,heapIncreaseMB:(process.memoryUsage().heapUsed-heap)/MB};
}
function panelHarness(state){
  const nodes=new Map(),stats={htmlWrites:0,htmlChars:0,maxHtmlChars:0,attributes:0,optionUpdates:0};
  const classList={toggle(){},add(){},remove(){}};
  function element(id=''){
    if(nodes.has(id))return nodes.get(id);
    let html='',options=[],value='';
    const e={
      id,dataset:{},classList,hidden:false,disabled:false,checked:false,
      textContent:'',min:'',max:'',
      get innerHTML(){return html;},
      set innerHTML(v){html=String(v);stats.htmlWrites++;stats.htmlChars+=html.length;
        stats.maxHtmlChars=Math.max(stats.maxHtmlChars,html.length);},
      get options(){return options;},
      get value(){return value;},
      set value(v){value=String(v);},
      replaceChildren(...children){options=children;stats.optionUpdates++;},
      querySelector(){return element('nested:'+id);},
      setAttribute(){stats.attributes++;},
      getAttribute(){return null;},
      addEventListener(){},focus(){},remove(){},closest(){return null;}
    };
    nodes.set(id,e);return e;
  }
  const defaults={
    'company-analysis-period':'all','company-compare-period':'all',
    'company-analysis-scope':'all','company-unit-city':'all','company-unit-sector':'all',
    'company-compare-city':'all','company-compare-sector':'all',
    'company-compare-dimension':'unit','company-compare-sort':'revenue',
    'v300a-mode':'equilibrado','finance-period':'all','qa-horizon':'30',
    'credit-calendar-horizon':'90','restock-mode':'manual','restock-supplier':'regional'
  };
  for(const [id,v] of Object.entries(defaults))element(id).value=v;
  const document={
    getElementById:id=>element(id),querySelectorAll:()=>[],querySelector:()=>element('query'),
    createElement:tag=>element('created:'+tag+':'+nodes.size),
    createDocumentFragment:()=>({appendChild(){}}),
    body:{classList},activeElement:null,title:''
  };
  const cssPanel=read('src/ui/app.js')
    .replace('/* CDN_COMPANY_VIEWS */',read('src/ui/company-views.part.js'))
    .replace('/* CDN_RESTOCK_VIEWS */',read('src/ui/restock-views.part.js'))
    .replace('/* CDN_MARKET_VIEWS */',read('src/ui/market-views.part.js'))
    .replace('/* CDN_FINANCE_VIEWS */',read('src/ui/finance-views.part.js'))
    .replace('/* CDN_LOGISTICS_VIEWS */',read('src/ui/logistics-views.part.js'));
  // Apenas no benchmark, substitui chamada start() por uma porta controlada. O
  // mesmo código fonte dos renderizadores é executado; sem simular clique real.
  const needle='  start();\n})();';
  if(!cssPanel.includes(needle))throw Error('Bootstrap UI mudou; auditar harness antes de medir');
  const code=cssPanel.replace(needle,
    '  globalThis.__benchUI={setState(v){state=v;viewCityId=v.player.cityId;},\n'+
    '    setTab(t,section){tab=t;if(section&&t===\'administrativo\')activeSection.administrativo=section;},'+
    '    render};\n})();');
  const ctx={CidadeCore:Core, CidadeVisual:{svgMap:()=>'<svg></svg>'},
    CidadeTianguaCena:{svgMap:()=>'<svg></svg>'},document,window:{scrollTo(){}},
    immersiveOpen:null,v31ClassicMode:false,
    v31Render(){}, // Benchmark V3.0 mede paineis antigos isolados; UI V3.1 tem QA Playwright separado.
    console,setTimeout(){return 1},clearTimeout(){},setInterval(){return 1},clearInterval(){},URL};
  const runtime=runInNewContext(code+'\nglobalThis.__benchUI',ctx);
  runtime.setState(state);
  const testPanels=[
    {root:'cidade',label:'cidade'},
    {root:'empresa',label:'empresa'},
    {root:'mercado',label:'mercado'},
    {root:'administrativo',section:'financas',label:'financas'},
    {root:'administrativo',section:'contabilidade',label:'contabilidade'},
    {root:'administrativo',section:'logistica',label:'logistica'},
    {root:'administrativo',section:'fiscal',label:'fiscal'},
    {root:'sistema',label:'sistema'}
  ];
  const results=[];
  for(const panel of testPanels){
    runtime.setTab(panel.root,panel.section);
    const sample=[];
    for(let i=0;i<3;i++){
      const t=performance.now();
      runtime.render();
      sample.push(performance.now()-t);
    }
    results.push({panel:panel.label,avgMs:+(sample.reduce((a,b)=>a+b,0)/sample.length).toFixed(2),
      maxMs:+Math.max(...sample).toFixed(2)});
  }
  return {results,stats};
}
function benchmark(days,units){
  const s0=fixture(units),t0=performance.now(),{s,ms,heapIncreaseMB}=advance(s0,days);
  const before=JSON.stringify(s),integrity=Core.reconciliationReport(s);
  if(!integrity.ok||!Core.balanceSheet(s).balanced)throw Error('Conciliação falhou no cenário '+days+'/'+units);
  const metrics={};
  for(const [label,fn] of [
    ['finance',()=>Core.financialReport(s,'all',s.calendar.date)],
    ['group',()=>Core.groupReport(s)],
    ['quality',()=>Core.qualityReport(s,90)],
    ['rh',()=>Core.rhReport(s)],
    ['fiscal',()=>Core.fiscalOperationsReport(s)],
    ['credit',()=>Core.creditReport(s)],
    ['logistics',()=>Core.logisticsReport(s)],
    ['patchA',()=>Core.operationalBalanceReport(s,'equilibrado')]
  ]){
    const start=performance.now();fn();metrics[label]=+(performance.now()-start).toFixed(2);
  }
  const exportT=performance.now(),standard=Core.exportSave(s),standardMs=performance.now()-exportT;
  const compactT=performance.now(),compact=Core.exportSaveCompact(s),compactMs=performance.now()-compactT;
  const importT=performance.now(),restored=Core.importSave(compact).state,importMs=performance.now()-importT;
  if(JSON.stringify(restored)!==before||JSON.stringify(s)!==before)
    throw Error('Snapshot alterado por benchmark/exportação');
  const health=Core.saveHealthReport(s);
  if(standard.length>=25000000||compact.length>=25000000||health.compactChars!==compact.length)
    throw Error('Save excedeu orçamento de segurança');
  const uiT=performance.now(),panel=panelHarness(s),uiMs=performance.now()-uiT;
  if(JSON.stringify(s)!==before)throw Error('Render dos painéis alterou a carreira');
  if(panel.results.some(x=>!Number.isFinite(x.maxMs)||x.maxMs>12000))
    throw Error('Um painel excedeu 12 s sob VM/DOM simulado — investigar latência');
  const result={
    days,units,simulationMs:+ms.toFixed(1),simulationWallMs:+(performance.now()-t0).toFixed(1),
    msPerDay:+(ms/days).toFixed(2),heapDeltaMB:+heapIncreaseMB.toFixed(1),
    saveTraditionalBytes:Buffer.byteLength(standard),saveCompactBytes:Buffer.byteLength(compact),
    saveTraditionalChars:standard.length,saveCompactChars:compact.length,
    htmlArtifactBytes:Buffer.byteLength(read('index.html')),
    saveTraditionalPctOfLimit:health.standardPercent,saveCompactPctOfLimit:health.compactPercent,
    standardNearLimit:health.standardNearLimit,compactNearLimit:health.compactNearLimit,
    saveReductionPct:health.savedPercent,saveStandardAvailable:health.standardAvailable,
    exportMs:+standardMs.toFixed(2),compactMs:+compactMs.toFixed(2),importMs:+importMs.toFixed(2),
    reportsMs:metrics,panelHarnessTotalMs:+uiMs.toFixed(1),panelSamples:panel.results,
    htmlWrites:panel.stats.htmlWrites,maxPanelHtmlChars:panel.stats.maxHtmlChars,
    journal:s.economy.ledger.length,events:s.audit.events.length,integrity:'PASS'};
  console.log('BENCH_V3005 '+JSON.stringify(result));
}
benchmark(30,1);
benchmark(365,5);
benchmark(1825,5);
console.log('BENCH_V3005_SUMMARY '+JSON.stringify({
  scope:'Node24 Linux CI com DOM simulado e SVG stub, NAO teste Chrome/Windows/mobile',
  contracts:'sem mutação de estado, save V1/V2, integridade, métricas por painel, ciclo longo',
  status:'PASS'}));
