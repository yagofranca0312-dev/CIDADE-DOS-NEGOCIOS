import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {spawnSync,execFileSync} from 'node:child_process';
import {runInNewContext} from 'node:vm';
import {createV333DecisionEngine} from '../src/contracts/v333-decision-engine.mjs';
import {createV333OperationsView} from '../src/contracts/v333-operations-view.mjs';
import {evaluateV333ReleaseGate} from '../tools/v333-release-gate.mjs';

const Core=runInNewContext(readFileSync('src/core/game.js','utf8')+'\nCidadeCore',{});
const Engine=createV333DecisionEngine(Core),View=createV333OperationsView(Core,Engine);
const manifest=JSON.parse(readFileSync('docs/V333_RELEASE_READINESS.json','utf8'));
let seq=0;
const send=(s,type,payload={})=>{
 const r=Core.dispatch(s,{type,payload,id:'v333e-'+(++seq)});
 assert.equal(r.ok,true,String(r.error));return r.state;
};
function career(){
 let s=send(null,'CARREIRA.CRIAR',{
  name:'Auditoria Global',companyName:'Rede Homologação',cityId:'CE-TIANGUA',seed:333050
 });
 s=send(s,'EMPRESA.ABRIR',{sector:'mercado',cityId:'CE-TIANGUA',lot:3});
 s=send(s,'EMPRESA.ABRIR',{sector:'mercado',cityId:'CE-TIANGUA',lot:4});
 return s;
}
const view=(s,t=Engine.createTracker(),filters={})=>
 View.project(s,t.inspect(s),filters);
const plain=v=>JSON.parse(JSON.stringify(v));

test('E-01: fontes estáveis imutáveis na revisão E e versão principal ainda 3.3.2',()=>{
 for(const [path,expected] of Object.entries(manifest.protectedGitBlobs)){
  const actual=execFileSync('git',['rev-parse','HEAD:'+path],{encoding:'utf8'}).trim();
  assert.equal(actual,expected,'Fonte protegida modificada: '+path);
 }
 assert.equal(JSON.parse(readFileSync('package.json','utf8')).version,'3.3.2');
 assert.equal(Core.VERSION,'3.3.2');
 assert.equal(Core.SCHEMA_VERSION,10);
});

test('E-02: contexto multiunidade completo em único tracker e projeção',()=>{
 const s=career(),tracker=Engine.createTracker(),snapshot=tracker.inspect(s);
 const p=View.project(s,snapshot);
 assert.equal(p.summary.units,2);
 assert.equal(p.summary.activeTotal,snapshot.active.length);
 assert.equal(p.summary.datedTotal,Engine.agenda(s,{limit:100,occurrences:snapshot.all}).length);
 assert.ok(snapshot.active.some(x=>x.scope.businessId===Core.businesses(s)[0].id));
 assert.ok(snapshot.active.some(x=>x.scope.businessId===Core.businesses(s)[1].id));
 assert.deepEqual(plain(p.team.map(x=>x.id)),plain(snapshot.active.map(x=>x.id).slice(0,50)));
});

test('E-03: filtro sem resultados não apaga avisos globais nem cria gravidade',()=>{
 const s=career(),t=Engine.createTracker();
 const first=view(s,t),empty=view(s,t,{severity:'informativa'});
 assert.ok(first.summary.activeTotal>0);
 assert.equal(empty.summary.activeTotal,first.summary.activeTotal);
 assert.equal(empty.team.length,0);assert.equal(empty.summary.shownTeam,0);
 assert.ok(empty.agenda.every(x=>x.severity==='informativa'));
 assert.deepEqual(plain(empty.filters),{businessId:'all',severity:'informativa',due:'all'});
});

test('E-04: troca entre unidades no filtro não dispara resolução nem muta estado',()=>{
 const s=career(),before=JSON.stringify(s),t=Engine.createTracker(),u=Core.businesses(s);
 const original=t.inspect(s);
 const a=view(s,t,{businessId:u[0].id});
 const b=view(s,t,{businessId:u[1].id});
 assert.ok(a.team.every(x=>x.scope.businessId===u[0].id));
 assert.ok(b.team.every(x=>x.scope.businessId===u[1].id));
 assert.equal(t.inspect(s).history.length,0);
 assert.deepEqual(plain(t.inspect(s).active.map(x=>x.id)),plain(original.active.map(x=>x.id)));
 assert.equal(JSON.stringify(s),before);
});

test('E-05: dispensa efêmera não muda save nem elimina ocorrência original',()=>{
 const s=career(),original=JSON.stringify(s),t=Engine.createTracker();
 const first=t.inspect(s).active.find(x=>x.category==='SUP');
 assert.ok(first);assert.equal(t.dismiss(first.id,s),true);
 const next=t.inspect(s);
 assert.ok(next.all.some(x=>x.id===first.id));
 assert.equal(next.active.some(x=>x.id===first.id),false);
 assert.ok(next.history.some(x=>x.id===first.id&&x.status==='dispensada'));
 assert.equal(JSON.stringify(s),original);
});

test('E-06: novo mundo reinicia dispensa/histórico e conserva identidade por empresa',()=>{
 const a=career(),t=Engine.createTracker(),first=t.inspect(a).active[0];
 assert.equal(t.dismiss(first.id,a),true);
 const b=send(null,'CARREIRA.CRIAR',{name:'Carreira Alternativa',
  companyName:'Firma Simulada',cityId:'CE-TIANGUA',seed:333051});
 const c=send(b,'EMPRESA.ABRIR',{sector:'mercado',cityId:'CE-TIANGUA',lot:3});
 assert.notEqual(a.worldId,c.worldId);
 const next=t.inspect(c);
 assert.equal(next.history.length,0);
 assert.equal(next.hidden,0);
 assert.ok(next.active.length>0);
});

test('E-07: ocorrência stale falha antes de selecionar empresa ou produto',()=>{
 const s=career(),items=Engine.candidates(s),unit=Core.businesses(s)[0];
 const fakeId='SUP|'+unit.id+'|produto-inexistente';
 assert.equal(Engine.planQuickAction(s,{occurrenceId:fakeId,route:'mercado:compras'}).status,'STALE_OCCURRENCE');
 const valid=items.find(x=>x.category==='SUP'&&x.scope.businessId!==Core.activeBusiness(s).id);
 assert.ok(valid);
 const selected=Engine.planQuickAction(s,{occurrenceId:valid.id,route:'sistema:saves'});
 assert.equal(selected.status,'READY');
 assert.equal(selected.businessId,valid.scope.businessId);
 assert.equal(selected.route,valid.route);
 assert.equal(selected.productId,valid.scope.productId);
});

test('E-08: somente ativação explícita muda unidade; nenhuma mutação econômica',()=>{
 const s=career(),t=Engine.createTracker(),other=Core.businesses(s)
  .find(x=>x.id!==Core.activeBusiness(s).id);
 const notice=t.inspect(s).active.find(x=>x.scope.businessId===other.id);
 assert.ok(notice);
 const plan=Engine.planQuickAction(s,{occurrenceId:notice.id});
 assert.equal(plan.switchBusinessId,other.id);
 const before={
  cash:Core.overview(s).cash,ledger:JSON.stringify(s.economy.ledger),
  fiscal:JSON.stringify(s.fiscal),worldId:s.worldId
 };
 const changed=send(s,'EMPRESA.ATIVAR',{businessId:other.id});
 assert.equal(Core.activeBusiness(changed).id,other.id);
 assert.equal(Core.overview(changed).cash,before.cash);
 assert.equal(JSON.stringify(changed.economy.ledger),before.ledger);
 assert.equal(JSON.stringify(changed.fiscal),before.fiscal);
 assert.equal(changed.worldId,before.worldId);
 assert.equal(Engine.planQuickAction(changed,{occurrenceId:notice.id}).switchBusinessId,null);
});

test('E-09: compromissos da Agenda preservam origem e datas canônicas',()=>{
 const s=career(),t=Engine.createTracker(),snap=t.inspect(s);
 const expected=Engine.agenda(s,{limit:100,occurrences:snap.all});
 const shown=View.project(s,snap).agenda;
 assert.deepEqual(plain(shown),plain(expected.slice(0,3)));
 for(const item of shown){
  assert.match(item.date,/^\d{4}-\d{2}-\d{2}$/);
  if(item.occurrenceId){
   const source=snap.all.find(x=>x.id===item.occurrenceId);
   assert.ok(source);assert.equal(source.route,item.route);
  }
 }
 assert.ok(shown.every(x=>x.id&&!x.id.startsWith('FIN-01|')));
});

test('E-10: estado + ocorrências reagem de modo idêntico após export/import',()=>{
 const s=career(),raw=Core.exportSave(s),imported=Core.importSave(raw).state;
 assert.equal(imported.worldId,s.worldId);
 assert.equal(imported.world.activeBusinessId,s.world.activeBusinessId);
 assert.deepEqual(plain(Engine.candidates(imported).map(x=>x.id)),
                  plain(Engine.candidates(s).map(x=>x.id)));
 const a=View.project(s,Engine.createTracker().inspect(s));
 const b=View.project(imported,Engine.createTracker().inspect(imported));
 assert.deepEqual(plain(a.summary),plain(b.summary));
});

test('E-11: correção de filtros vazios protege render e não oculta total global',()=>{
 const ui=readFileSync('src/ui/v31-immersive.part.js','utf8');
 assert.match(ui,/dataset\.severity=visible\.length\?visible\[0\]\.severity:'normal'/);
 assert.match(ui,/visible=v333HubProject\(\)\.team,count=allVisible\.length/);
 assert.match(ui,/Nenhum aviso corresponde aos filtros/);
 const h=readFileSync('src/shell/index.template.html','utf8');
 for(const id of ['v333-hub-unit','v333-hub-severity','v333-hub-due','v333-command-hub'])
  assert.equal((h.match(new RegExp('id="'+id+'"','g'))||[]).length,1);
});

test('E-12: gate é NO_GO por falta de GO humano e não cria arquivos',()=>{
 const before=readFileSync('docs/V333_RELEASE_READINESS.json','utf8');
 const result=evaluateV333ReleaseGate();
 assert.deepEqual(result.errors,[]);
 assert.equal(result.decision,'NO_GO');
 assert.equal(result.notAHomologation,true);
 assert.ok(result.blockers.includes('OWNER_GO_NOT_DOCUMENTED'));
 assert.ok(result.blockers.includes('AUTOMATION_NOT_PASSED_E'));
 assert.equal(readFileSync('docs/V333_RELEASE_READINESS.json','utf8'),before);
});

test('E-13: --require-go bloqueia promoção e execução padrão é apenas informativa',()=>{
 const ok=spawnSync(process.execPath,['tools/v333-release-gate.mjs'],{encoding:'utf8'});
 assert.equal(ok.status,0,ok.stderr);
 assert.match(ok.stdout,/V333_RELEASE_READINESS/);
 assert.match(ok.stdout,/"decision":"NO_GO"/);
 const gated=spawnSync(process.execPath,['tools/v333-release-gate.mjs','--require-go'],{encoding:'utf8'});
 assert.equal(gated.status,2,gated.stdout+' '+gated.stderr);
 assert.match(gated.stderr,/RELEASE_BLOCKED/);
});

test('E-14: contrato de QA global exige C/D/E no Windows, sem publicação automática',()=>{
 const win=readFileSync('.github/workflows/qa-windows-v300.yml','utf8');
 const linux=readFileSync('.github/workflows/ci.yml','utf8');
 const build=readFileSync('.github/workflows/v310-build-branch.yml','utf8');
 for(const name of ['qa-windows-v333c.mjs','qa-windows-v333d.mjs','qa-windows-v333e.mjs'])
  assert.match(win,new RegExp(name.replaceAll('.','\\.')));
 assert.match(win,/feat\/v3\.3\.3-e-qualidade-prehomologacao/);
 assert.match(linux,/node tools\/v333-release-gate\.mjs/);
 assert.match(build,/feat\/v3\.3\.3-e-qualidade-prehomologacao/);
 for(const doc of ['docs/V333_PATCH_A_CONFIABILIDADE.md',
  'docs/V333_PATCH_B_AGENDA_INTEGRADA.md',
  'docs/V333_PATCH_C_ACOES_CONTEXTUAIS.md',
  'docs/V333_PATCH_D_POLIMENTO_EXPERIENCIA.md',
  'docs/V333_PATCH_E_PREHOMOLOGACAO.md'])
  assert.ok(readFileSync(doc,'utf8').length>500,doc);
});
