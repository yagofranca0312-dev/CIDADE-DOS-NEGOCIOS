import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext,Script} from 'node:vm';
const Core=runInNewContext(readFileSync('src/core/game.js','utf8')+'\nCidadeCore',{});
let seq=0;
const command=(s,type,payload={})=>{
 const result=Core.dispatch(s,{id:'v260-'+(++seq),type,payload});
 assert.equal(result.ok,true,result.error||type);return result.state;
};
const create=(seed=26,cityId='CE-TIANGUA')=>command(null,'CARREIRA.CRIAR',
 {name:'Empreendedor',companyName:'Empresa de teste',cityId,seed});
const activate=s=>command(s,'MUNDO.CONCORRENCIA_ATIVAR');
const advance=(s,days)=>{for(let n=days;n>0;){const d=Math.min(n,30);s=command(s,'TEMPO.AVANCAR_LOTE',{days:d});n-=d;}return s;};

test('V2.6: saves existentes não recebem rivais, lançamentos ou novos eventos retroativos',()=>{
 const old=create(811),snapshot=JSON.stringify(old);
 assert.equal(Core.rivalMarketReport(old).enabled,false);
 const restored=Core.importSave(Core.exportSave(old));
 assert.equal(restored.migrated,false);assert.equal(JSON.stringify(restored.state),snapshot);
 assert.equal(old.world.rivalEconomy,undefined);
});
test('V2.6: 90 empresas rivais, por 30 cidades e 3 ramos, surgem só na ativação',()=>{
 let state=create(812);
 state=activate(state);
 const x=state.world.rivalEconomy;
 assert.equal(x.modelVersion,1);assert.equal(x.rivals.length,90);
 assert.equal(new Set(x.rivals.map(r=>r.id)).size,90);
 assert.equal(x.rivals.filter(r=>r.cityId==='CE-TIANGUA').length,3);
 assert.ok(x.rivals.every(r=>r.cashCents>=0&&r.capacityUnits<100&&r.stockUnits>=0));
 assert.equal(Core.overview(state).revenue,0);Core.validate(state);
 const duplicate=Core.dispatch(state,{id:'v260-duplicate',type:'MUNDO.CONCORRENCIA_ATIVAR'});
 assert.equal(duplicate.ok,false);assert.match(duplicate.error,/já ativada/);
});
test('V2.6: repartição de mercado por SKU não duplica clientes de lojas do jogador',()=>{
 let s=activate(create(813));
 s=command(s,'EMPRESA.ABRIR',{sector:'mercado',cityId:'CE-TIANGUA',lot:1});
 s=command(s,'EMPRESA.ABRIR',{sector:'mercado',cityId:'CE-TIANGUA',lot:2});
 s=advance(s,1);
 const records=s.audit.events.filter(e=>e.type==='DEMANDA.SIMULADA'&&e.date==='2026-11-01');
 assert.equal(records.length,2);
 for(const id of ['base','extra-1','extra-2']){
   const rows=records.map(e=>e.data.items.find(p=>p.productId===id));
   assert.ok(rows.every(Boolean));
   assert.equal(rows[0].marketTotal,rows[1].marketTotal);
   assert.equal(rows[0].rivalQuota,rows[1].rivalQuota);
   assert.equal(rows.reduce((n,p)=>n+p.estimated,0)+rows[0].rivalQuota,rows[0].marketTotal);
   assert.ok(rows.every(p=>p.fulfilled<=p.estimated));
 }
 assert.equal(Core.overview(s).revenue,0);Core.validate(s);
});
test('V2.6: mesmo seed e comandos produzem rivais, economia e eventos idênticos',()=>{
 const scenario=()=>{
   let s=activate(create(814));
   s=command(s,'EMPRESA.ABRIR',{sector:'padaria',lot:1});
   s=command(s,'ESTOQUE.COMPRAR',{supplierId:'regional',productId:'base',quantity:120});
   return advance(s,38);
 };
 const a=scenario(),b=scenario();
 assert.equal(JSON.stringify(a.world.rivalEconomy),JSON.stringify(b.world.rivalEconomy));
 assert.equal(JSON.stringify(a.economy.ledger),JSON.stringify(b.economy.ledger));
 assert.equal(a.rng.seed,b.rng.seed);
 assert.equal(JSON.stringify(a.audit.events),JSON.stringify(b.audit.events));
});
test('V2.6: rivais não usam o livro contábil do jogador e respeitam caixa, estoque e preços',()=>{
 let s=activate(create(815));s=command(s,'EMPRESA.ABRIR',{sector:'roupas',lot:1});
 s=advance(s,100);
 const rivalRecords=s.world.rivalEconomy.rivals;
 assert.ok(rivalRecords.some(r=>r.soldUnits>0));
 assert.ok(rivalRecords.every(r=>r.cashCents>=0&&r.stockUnits>=0&&r.stockUnits<=500));
 assert.ok(rivalRecords.every(r=>r.priceIndex>=78&&r.priceIndex<=130&&r.expansions<=2));
 assert.equal(Core.overview(s).revenue,0);
 assert.ok(s.economy.ledger.every(j=>!String(j.memo).includes('Rede Loja de roupas')));
});
test('V2.6: eventos locais têm duração, fim, impacto limitado e histórico verificável',()=>{
 let s=activate(create(816));s=command(s,'EMPRESA.ABRIR',{sector:'mercado',lot:1});
 s=advance(s,365);
 const events=s.world.rivalEconomy.events;
 assert.ok(events.length>100);
 assert.ok(events.every(e=>e.endTick>e.startTick&&e.endTick-e.startTick<=8));
 assert.ok(events.some(e=>e.effectPct>0)&&events.some(e=>e.effectPct<0));
 assert.ok(events.every(e=>e.effectPct>=-15&&e.effectPct<=16));
 const report=Core.rivalMarketReport(s,'CE-TIANGUA');
 assert.equal(report.enabled,true);assert.equal(report.rivals.length,3);
 assert.ok(report.alerts.length>=1);
 assert.ok(s.audit.events.some(e=>e.type==='MUNDO.EVENTO_INICIADO'));
 assert.ok(s.audit.events.some(e=>e.type==='MUNDO.EVENTO_ENCERRADO'));
});
test('V2.6: relatório e consulta repetida são somente leitura',()=>{
 let s=activate(create(817));s=advance(s,14);
 const before=JSON.stringify(s),one=JSON.stringify(Core.rivalMarketReport(s));
 assert.equal(JSON.stringify(Core.rivalMarketReport(s)),one);
 assert.equal(JSON.stringify(s),before);
});
test('V2.6: save com rivais passa no roundtrip, rejeita adulteração e preserva idempotência',()=>{
 let s=activate(create(818));s=advance(s,9);
 const raw=Core.exportSave(s),imported=Core.importSave(raw);
 assert.equal(imported.migrated,false);assert.equal(JSON.stringify(imported.state),JSON.stringify(s));
 const tampered=JSON.parse(raw);tampered.payload.world.rivalEconomy.rivals[0].cashCents=-99;
 assert.throws(()=>Core.importSave(JSON.stringify(tampered)),/Checksum/);
 const id='v260-idempotente',first=Core.dispatch(s,{id,type:'TEMPO.AVANCAR_DIA'});
 assert.equal(first.ok,true,first.error);
 const again=Core.dispatch(first.state,{id,type:'TEMPO.AVANCAR_DIA'});
 assert.equal(again.status,'DUPLICATE');
 assert.equal(JSON.stringify(again.state),JSON.stringify(first.state));
});
test('V2.6: 365 dias em três mercados e estilos mantêm integridade sem concorrentes invencíveis por regra',()=>{
 const cases=[
  {city:'CE-TIANGUA',sector:'mercado',seed:819},
  {city:'CE-FORTALEZA',sector:'padaria',seed:820},
  {city:'SP-SAO-PAULO',sector:'roupas',seed:821}
 ];
 for(const c of cases){
   let s=activate(create(c.seed,c.city));
   s=command(s,'EMPRESA.ABRIR',{sector:c.sector,lot:1});
   if(c.sector!=='roupas')s=command(s,'ESTOQUE.COMPRAR',{supplierId:'regional',productId:'base',quantity:150});
   s=advance(s,365);
   Core.validate(s);
   assert.equal(s.calendar.tick,365);
   assert.equal(Core.diagnostics(s).status,'PASS (integridade estrutural e contábil)');
   assert.ok(s.world.rivalEconomy.rivals.every(r=>r.capacityUnits<=100&&r.expansions<=2&&r.priceIndex<=130));
   assert.ok(Core.exportSave(s).length<25_000_000);
 }
});
test('V2.6: painel está no HTML único e não cria navegação principal extra',()=>{
 const tpl=readFileSync('src/shell/index.template.html','utf8');
 const ui=readFileSync('src/ui/app.js','utf8'),html=readFileSync('index.html','utf8');
 for(const id of ['rival-panel','rival-enable','rival-rows','rival-alerts','rival-events'])
   assert.equal((tpl.match(new RegExp('id="'+id+'"','g'))||[]).length,1);
 assert.match(ui,/function renderRivals\(\)/);
 assert.match(html,/MUNDO.CONCORRENCIA_ATIVAR/);
 assert.equal((html.match(/<script\b/g)||[]).length,1);
 assert.doesNotThrow(()=>new Script([...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)][0][1]));
});
