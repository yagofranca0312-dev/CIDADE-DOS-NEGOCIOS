import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext,Script} from 'node:vm';

const Core=runInNewContext(readFileSync('src/core/game.js','utf8')+'\nCidadeCore',{});
let seq=0;
const next=(s,type,payload={})=>{
  const result=Core.dispatch(s,{id:'journey-'+(++seq),type,payload});
  assert.equal(result.ok,true,result.error||type);return result.state;
};
function career(){
  let s=next(null,'CARREIRA.CRIAR',{name:'Jogador fictício',companyName:'Rede fictícia',cityId:'CE-TIANGUA',seed:20261105});
  return next(s,'EMPRESA.ABRIR',{sector:'mercado',lot:1});
}
const advance=(s,days)=>{while(days>0){const count=Math.min(30,days);s=next(s,'TEMPO.AVANCAR_LOTE',{days:count});days-=count;}return s;};

test('V2.5: preparação sem carreira e 12 missões únicas após abertura',()=>{
  assert.equal(Core.VERSION,'2.5.0-alpha.1');
  assert.equal(Core.SCHEMA_VERSION,9);
  assert.equal(Core.progressionReport(null).level.id,'preparacao');
  const s=career(),p=Core.progressionReport(s);
  assert.equal(p.level.id,'negocio-local');
  assert.equal(p.goals.length,12);
  assert.equal(new Set(p.goals.map(x=>x.id)).size,12);
  assert.equal(p.goals.find(x=>x.id==='primeira-empresa').completed,true);
  assert.equal(p.goals.find(x=>x.id==='primeira-venda').completed,false);
  assert.equal(p.goals.find(x=>x.id==='margem-30dias').completed,false);
  assert.equal(p.achievements.filter(x=>x.completed).length,0);
});
test('V2.5: leitura repetida não cria lançamentos, selos ou mutações',()=>{
  const s=career(),before=JSON.stringify(s),seed=s.rng.seed,revision=s.revision;
  const first=JSON.stringify(Core.progressionReport(s)),second=JSON.stringify(Core.progressionReport(s));
  assert.equal(first,second);
  assert.equal(JSON.stringify(s),before);
  assert.equal(s.rng.seed,seed);
  assert.equal(s.revision,revision);
  assert.equal(s.economy.ledger.filter(x=>x.kind==='PROGRESSION_REWARD').length,0);
});
test('V2.5: primeira venda é confirmada somente com lançamento SALE, não compra',()=>{
  let s=career();s=next(s,'ESTOQUE.COMPRAR',{supplierId:'regional',productId:'base',quantity:100});
  assert.equal(Core.progressionReport(s).goals.find(x=>x.id==='primeira-venda').completed,false);
  s=advance(s,2);
  const p=Core.progressionReport(s);
  assert.equal(p.goals.find(x=>x.id==='primeira-venda').completed,true);
  assert.equal(p.achievements.find(x=>x.id==='primeira-venda').completed,true);
  const realRevenue=s.economy.ledger.flatMap(x=>x.entries).filter(e=>e.account==='REVENUE').reduce((n,e)=>n+e.credit-e.debit,0);
  assert.equal(p.metrics.revenueCents,realRevenue);
  assert.equal(p.level.id,'negocio-local');
});
test('V2.5: o tempo sozinho não concede rede regional nem margem positiva',()=>{
  let s=advance(career(),90);
  const p=Core.progressionReport(s);
  assert.equal(p.metrics.days,90);
  assert.equal(p.level.id,'negocio-local');
  assert.equal(p.goals.find(x=>x.id==='rede-regional').completed,false);
  assert.equal(p.goals.find(x=>x.id==='margem-30dias').completed,false);
  assert.equal(p.goals.find(x=>x.id==='reserva-30dias').completed,false);
  assert.ok(p.goals.every(g=>g.progressPct>=0&&g.progressPct<=100));
});
test('V2.5: o relatório é idêntico após exportar/importar schema 9',()=>{
  let s=career();s=advance(s,30);
  const raw=Core.exportSave(s),restored=Core.importSave(raw).state;
  assert.equal(restored.schemaVersion,9);
  assert.equal(JSON.stringify(Core.progressionReport(s)),JSON.stringify(Core.progressionReport(restored)));
  assert.equal(JSON.stringify(s),JSON.stringify(restored));
});
test('V2.5: interface da jornada é única e compilada sem novo menu ou script',()=>{
  const tpl=readFileSync('src/shell/index.template.html','utf8');
  const app=readFileSync('src/ui/app.js','utf8');
  const html=readFileSync('index.html','utf8');
  const pkg=JSON.parse(readFileSync('package.json','utf8'));
  assert.equal(pkg.version,'2.5.0-alpha.1');
  for(const id of ['progression-panel','progression-goals','progression-level','progression-achievements'])
    assert.equal([...tpl.matchAll(new RegExp('id="'+id+'"','g'))].length,1);
  assert.match(app,/function renderProgression\(\)/);
  assert.match(html,/const VERSION = '2\.5\.0-alpha\.1'/);
  assert.equal((html.match(/<script\b/g)||[]).length,1);
  const script=[...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)];
  assert.equal(script.length,1);assert.doesNotThrow(()=>new Script(script[0][1]));
});
