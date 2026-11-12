import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';

const ui=readFileSync('src/ui/v31-immersive.part.js','utf8');
const html=readFileSync('src/shell/index.template.html','utf8');
const css=readFileSync('src/shell/v31.css','utf8');
const Core=runInNewContext(readFileSync('src/core/game.js','utf8')+'\nCidadeCore',{});
const begin=ui.indexOf('function v332AdviceCandidates(current){');
const end=ui.indexOf('function v332AdviceUpdate(){',begin);
assert.ok(begin>0&&end>begin,'Motor deterministico da Central nao localizado');
const pure=ui.slice(begin,end).trim();
const makeEngine=core=>runInNewContext('('+pure+')',{Core:core});
const rec=makeEngine(Core);
let seq=0;
function send(s,type,payload={}){
 const r=Core.dispatch(s,{id:'advisor-'+(++seq),type,payload});
 assert.equal(r.ok,true,type+': '+r.error);return r.state;
}
const start=()=>send(null,'CARREIRA.CRIAR',{name:'QA equipe privada',companyName:'Teste Principal',cityId:'CE-TIANGUA',seed:332310});
const open=s=>send(s,'EMPRESA.ABRIR',{sector:'mercado',cityId:'CE-TIANGUA',lot:3});
const normalized=x=>JSON.parse(JSON.stringify(x));

test('REC-04: sem empresa e sem pendencias nao gera urgencias falsas',()=>{
 const s=start(),before=JSON.stringify(s),r=rec(s);
 assert.equal(r.length,0);
 assert.equal(JSON.stringify(s),before,'Leitura alterou save');
});

test('REC-01: estoque zerado, transito e reposicao respeitam a fonte',()=>{
 const base={
  player:{cityId:'CE-TIANGUA'},calendar:{date:'2026-12-12'},
  fiscal:{assessments:[]},units:[{id:'u1'}],active:{id:'u1'},
  inventory:[{id:'base',name:'Arroz',stock:0,inTransit:20,reorderPoint:12,alert:false}],
  payables:{units:[]},fiscalOp:{units:[]}
 };
 const fake=makeEngine({
  businesses:s=>s.units,activeBusiness:s=>s.active,inventoryReport:s=>s.inventory,
  operatingPayablesReport:s=>s.payables,fiscalOperationsReport:s=>s.fiscalOp,
  money:n=>'R$ '+(n/100).toFixed(2)
 });
 const a=fake(base);
 assert.equal(a.length,1);assert.equal(a[0].rule,'SUP-02');
 assert.equal(a[0].severity,'atenção');
 assert.match(a[0].message,/20 unidade\(s\) em trânsito/);
 assert.equal(a[0].route,'mercado:compras');
 assert.ok(!a[0].message.includes('compre agora'));
 const noTransit={...base,inventory:[{...base.inventory[0],inTransit:0,alert:true}]};
 const b=fake(noTransit);assert.equal(b[0].severity,'urgente');
 const low={...base,inventory:[{...base.inventory[0],stock:8,inTransit:1,alert:true}]};
 const c=fake(low);assert.equal(c.length,1);assert.equal(c[0].rule,'SUP-01');
 assert.match(c[0].message,/ponto de reposição 12/);
 const fixed={...base,inventory:[{...base.inventory[0],stock:40,inTransit:0,alert:false}]};
 assert.equal(fake(fixed).length,0,'Condição corrigida continua emitindo alerta');
});

test('REC-03: FIN-01 usa passivo operacional sem inventar vencimento',()=>{
 const s=open(start()),before=JSON.stringify(s);
 const fakeCore={
  businesses:()=>[{id:'u1'}],activeBusiness:()=>null,inventoryReport:()=>[],
  operatingPayablesReport:()=>({units:[{businessId:'u1',outstanding:48500}],total:48500}),
  fiscalOperationsReport:()=>({units:[]}),money:Core.money
 };
 const fake=makeEngine(fakeCore),out=fake(s);
 assert.equal(out.length,1);assert.equal(out[0].rule,'FIN-01');
 assert.equal(out[0].evidence.amountCents,48500);
 assert.match(out[0].message,/não informa vencimento/);
 assert.doesNotMatch(out[0].message,/vence em \d|em 3 dias/);
 assert.equal(JSON.stringify(s),before);
});

test('REC-02: guia aberta aparece e desaparece depois de quitada',()=>{
 const s=open(start()),fake=makeEngine({
  businesses:()=>[{id:'u1'}],activeBusiness:()=>null,
  inventoryReport:()=>[],operatingPayablesReport:()=>({units:[],total:0}),
  fiscalOperationsReport:()=>({units:[]}),money:Core.money
 });
 const tax={id:'TAX-2026-11',period:'2026-11',status:'OVERDUE',
   amount:12000,paid:0,dueDate:'2026-12-20'};
 const a=fake({...s,calendar:{...s.calendar,date:'2026-12-22'},
   fiscal:{...s.fiscal,assessments:[tax]}});
 const match=a.find(x=>x.rule==='FIS-01');
 assert.ok(match);assert.equal(match.severity,'urgente');
 assert.match(match.message,/R\$\s?120,00/);
 assert.equal(match.evidence.dueDate,'2026-12-20');
 const paid=fake({...s,calendar:{...s.calendar,date:'2026-12-22'},
   fiscal:{...s.fiscal,assessments:[{...tax,paid:12000,status:'SETTLED'}]}});
 assert.equal(paid.some(x=>x.rule==='FIS-01'),false);
});

test('FIS-02: checklist agrupado por competencia, sem interpretar como lei real',()=>{
 const s=open(start()),fake=makeEngine({
  businesses:()=>[{id:'est-1'}],activeBusiness:()=>null,inventoryReport:()=>[],
  operatingPayablesReport:()=>({units:[],total:0}),
  fiscalOperationsReport:()=>({units:[{businessId:'est-1',periods:[
   {period:'2026-11',closed:false,tasks:[
    {id:'vendas',status:'ATRASADA'},{id:'estoque',status:'ATRASADA'},
    {id:'razao',status:'CONCLUIDA'}]},
   {period:'2026-10',closed:true,tasks:[{id:'vendas',status:'ATRASADA'}]}
  ]}]}),money:Core.money
 });
 const a=fake({...s,calendar:{...s.calendar,date:'2026-12-22'}});
 assert.equal(a.length,1);assert.equal(a[0].rule,'FIS-02');
 assert.equal(a[0].severity,'urgente');
 assert.equal(a[0].evidence.pending.length,2);
 assert.equal(a[0].id,'FIS-02|est-1|2026-11');
});

test('REC-05: ids e evidencias estaveis, deduplicacao e ordem independente',()=>{
 let state=open(start());
 const before=JSON.stringify(state);
 const a=normalized(rec(state)),b=normalized(rec(state));
 assert.deepEqual(a,b);
 assert.equal(new Set(a.map(x=>x.id)).size,a.length);
 const rank={urgente:0,'atenção':1,informativa:2};
 for(let i=1;i<a.length;i++)assert.ok(rank[a[i-1].severity]<=rank[a[i].severity]);
 for(const alert of a){
  assert.ok(['SUP-01','SUP-02','FIN-01','FIS-01','FIS-02'].includes(alert.rule));
  assert.ok(alert.signature.length>1);
  assert.ok(alert.role&&alert.title&&alert.message&&alert.route&&alert.dateReference);
 }
 assert.equal(JSON.stringify(state),before,'Geracao de alertas alterou save');
});

test('COM-01 bloqueado sem comparabilidade auditada; nenhuma regra aleatoria',()=>{
 const s=open(start()),r=rec(s);
 assert.ok(r.every(x=>x.rule!=='COM-01'));
 assert.doesNotMatch(pure,/Math\.random|fetch\(|Core\.dispatch\(|commit\(|localStorage\./);
 assert.match(ui,/COM-01 NAO ativado/);
});

test('REC-05: ativa para resolvida e historico limpo em outra carreira',()=>{
 const core={
  businesses:s=>s.units,activeBusiness:s=>s.active,inventoryReport:s=>s.inventory,
  operatingPayablesReport:s=>s.payables,fiscalOperationsReport:s=>s.fiscalOp,
  money:n=>'R$ '+(n/100).toFixed(2)
 };
 const from=ui.indexOf('let v332AdviceWorld=null');
 const to=ui.indexOf('function v332AdviceEntry(item,history=false){',from);
 assert.ok(from>0&&to>from,'Gerenciador de historico nao localizado');
 const helpers=ui.slice(from,to);
 const vmText='var state;\n'+helpers+'\n'+
   'function step(next){state=next;const active=v332AdviceUpdate();return JSON.parse(JSON.stringify({active,history:v332AdviceHistory}));}\n'+
   'function dismiss(id){const item=v332AdviceCache.find(x=>x.id===id);v332AdviceDismissed.set(id,item.signature);}\n'+
   '({step,dismiss})';
 const probe=runInNewContext(vmText,{Core:core});
 const base={worldId:'w1',revision:1,player:{cityId:'CE-TIANGUA'},
  calendar:{date:'2026-12-12'},units:[{id:'u1'}],active:{id:'u1'},
  inventory:[{id:'p1',name:'Arroz',stock:0,inTransit:0,reorderPoint:10,alert:true}],
  payables:{units:[]},fiscalOp:{units:[]},fiscal:{assessments:[]}};
 const first=probe.step(base);
 assert.equal(first.active.length,1);
 const same=probe.step(base);assert.equal(same.active.length,1);assert.equal(same.history.length,0);
 probe.dismiss(first.active[0].id);
 assert.equal(probe.step(base).active.length,0);
 const updated={...base,revision:2,inventory:[{...base.inventory[0],stock:40,alert:false}]};
 const resolved=probe.step(updated);
 assert.equal(resolved.active.length,0);
 assert.equal(resolved.history.length,1);
 assert.equal(resolved.history[0].status,'resolvida');
 assert.equal(probe.step(updated).history.length,1,'render duplicou resolucao');
 const newWorld=probe.step({...base,worldId:'w2',revision:1});
 assert.equal(newWorld.active.length,1);
 assert.equal(newWorld.history.length,0,'historico visual vazou para outra carreira');
});

test('UI C: painel, historico, dispensar, KPI e rotas sem comando automatico',()=>{
 for(const id of ['v332-advisor-panel','v332-advisor-toggle','v332-advisor-drawer',
  'v332-advisor-active-list','v332-advisor-history-list','v332-advisor-preview-text',
  'v332-hud-advice-trigger','v332-advisor-close']){
  assert.equal((html.match(new RegExp('id="'+id+'"','g'))||[]).length,1,'ID duplicado '+id);
 }
 assert.match(html,/Gerente|Central de Gestão/);
 assert.match(css,/V3\.3\.2-C — Central de Gestao/);
 assert.match(css,/--v332-map-bottom:217px/);
 assert.doesNotMatch(css.slice(css.lastIndexOf('V3.3.2-C — Central de Gestao')),/object-fit:cover|object-fit:fill/);
 assert.match(ui,/v332AdviceDismissed\.set/);
 assert.match(ui,/status:'resolvida'/);
 assert.match(ui,/status:'dispensada'/);
 assert.match(ui,/v332RenderAdvisor\(\)/);
 assert.equal(Core.SCHEMA_VERSION,10);
 assert.equal(JSON.parse(readFileSync('package.json','utf8')).version,'3.3.2');
});
