import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';

const ui=readFileSync('src/ui/v31-immersive.part.js','utf8');
const css=readFileSync('src/shell/v31.css','utf8');
const html=readFileSync('src/shell/index.template.html','utf8');
const Core=runInNewContext(readFileSync('src/core/game.js','utf8')+'\nCidadeCore',{});
const from=ui.indexOf('function v332HudSnapshot(current){');
const to=ui.indexOf('function v332RenderHud(){',from);
assert.ok(from>0&&to>from,'Snapshot da etapa A deve existir');
const snapshot=runInNewContext('('+ui.slice(from,to).trim()+')',{Core});
let seq=0;
function send(state,type,payload={}){
  const result=Core.dispatch(state,{id:'v332-a-'+(++seq),type,payload});
  assert.equal(result.ok,true,type+': '+result.error);return result.state;
}
const make=()=>send(null,'CARREIRA.CRIAR',{
  name:'Teste HUD',companyName:'Loja Indicadores',cityId:'CE-TIANGUA',seed:332001
});
const open=s=>send(s,'EMPRESA.ABRIR',{sector:'mercado',cityId:'CE-TIANGUA',lot:3});

test('V3.3.2-A+C: oito indicadores mantidos com Central ativada',()=>{
  const a=html.indexOf('class="v31-top-controls v332-hud"');
  const b=html.indexOf('class="v221-trust-ribbon"',a);
  assert.ok(a>0&&b>a);
  const hud=html.slice(a,b);
  for(const id of ['v31-hud-cash','v31-hud-date','v332-hud-sales','v332-hud-result',
    'v332-hud-stock','v332-hud-due','v332-hud-tax','v332-hud-advisory']){
    assert.equal((html.match(new RegExp('id="'+id+'"','g'))||[]).length,1,id);
    assert.ok(hud.includes('id="'+id+'"'),id+' fora da barra');
  }
  for(const id of ['v31-hud-pause','v31-next-day','v31-hud-turns','v31-hud-speed',
    'v31-camera-minus','v31-camera-label','v31-camera-plus','v31-camera-home'])assert.ok(hud.includes('id="'+id+'"'));
  assert.ok(hud.includes('id="v332-hud-advice-trigger"')); // Patch C ativa o indicador
  assert.ok(!hud.includes('2 em 3 dias'));
  assert.ok(!hud.includes('R$ 4.320,00'));
});

test('V3.3.2-A: sem unidade, valores não apuráveis ficam indisponíveis',()=>{
  const state=make(),before=JSON.stringify(state),a=snapshot(state);
  assert.equal(a.cash,Core.money(Core.overview(state).cash));
  assert.equal(a.sales,'—');assert.equal(a.result,'—');assert.equal(a.stock,'—');
  assert.equal(a.due,'—');assert.equal(a.tax,'—');
  assert.equal(JSON.stringify(state),before,'leitura alterou carreira');
});

test('V3.3.2-A: vendas do dia e resultado acumulado conferem com relatório canônico',()=>{
  let state=open(make());
  state=send(state,'ESTOQUE.COMPRAR',{productId:'base',supplierId:'regional',quantity:150});
  state=send(state,'TEMPO.AVANCAR_DIA');
  const before=JSON.stringify(state),a=snapshot(state);
  assert.equal(a.sales,Core.money(Core.financialReport(state,'day',state.calendar.date).revenue));
  assert.equal(a.result,Core.money(Core.overview(state).profit));
  assert.equal(a.cash,Core.money(Core.overview(state).cash));
  assert.equal(a.stock,Core.inventoryReport(state).filter(x=>x.alert).length+' item(ns)');
  assert.equal(a.due,'—','não inferir prazo de passivos operacionais');
  assert.equal(JSON.stringify(state),before,'leitura registrou mutação');
});

test('V3.3.2-A: obrigações fiscais exibem apenas pendências calculadas',()=>{
  let state=open(make());state=send(state,'TEMPO.AVANCAR_LOTE',{days:30});state=send(state,'TEMPO.AVANCAR_LOTE',{days:5});
  const a=snapshot(state),assessments=state.fiscal.assessments.filter(x=>
    ['OPEN','OVERDUE'].includes(x.status)&&x.amount>x.paid);
  if(assessments.length)assert.equal(a.tax,assessments.length+' guia(s)');
  else assert.ok(a.tax==='0 pendências'||/checklist/.test(a.tax));
  assert.ok(!a.tax.includes('1 pendente'),'não herdar número ilustrativo');
});

test('V3.3.2-A: mapa permanece proporcional e só desloca área útil',()=>{
  const patch=css.slice(css.lastIndexOf('V3.3.2-A — topo'));
  assert.match(patch,/--v332-map-top:122px/);
  assert.match(patch,/--v332-map-bottom:82px/);
  assert.match(patch,/object-fit:contain!important/);
  assert.doesNotMatch(patch,/object-fit:cover|object-fit:fill/);
  assert.match(patch,/aspect-ratio:1536\/664!important/);
  assert.match(patch,/aspect-ratio:640\/405!important/);
  assert.match(patch,/\.v332-kpi-strip\{/);
  assert.match(patch,/overflow-x:auto/);
  assert.equal(Core.SCHEMA_VERSION,10);
  assert.equal(JSON.parse(readFileSync('package.json','utf8')).version,'3.3.1','etapa candidata não publica nova versão sem GO');
});

test('V3.3.2-A: somente leitura, sem fluxos da Central de Gestão nem atalhos novos',()=>{
  assert.ok(ui.includes('function v332HudSnapshot'));
  assert.ok(ui.includes('function v332RenderHud'));
  const block=ui.slice(from,to);
  assert.doesNotMatch(block,/Core\.dispatch\(|commit\(|persistDurable\(|localStorage\.|sessionStorage\./);
  assert.ok(html.includes('id="v332-advisor-panel"')); // Central passou a existir no Patch C
});
