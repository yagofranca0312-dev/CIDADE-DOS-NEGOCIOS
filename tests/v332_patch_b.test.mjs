import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
const template=readFileSync('src/shell/index.template.html','utf8');
const css=readFileSync('src/shell/v31.css','utf8');
const ui=readFileSync('src/ui/v31-immersive.part.js','utf8');
const Core=runInNewContext(readFileSync('src/core/game.js','utf8')+'\nCidadeCore',{});
const extract=(from,to)=>ui.slice(ui.indexOf(from),ui.indexOf(to,ui.indexOf(from))).trim();
const f=extract('function v332AgendaItems(current){','function v332RenderAgenda(){');
assert.ok(f.startsWith('function v332AgendaItems'));
const agenda=runInNewContext('('+f+')',{Core});
let serial=0;
function dispatch(state,type,payload={}){
 const r=Core.dispatch(state,{type,payload,id:'v332b-'+(++serial)});
 assert.equal(r.ok,true,type+': '+r.error);return r.state;
}
const fresh=()=>dispatch(null,'CARREIRA.CRIAR',{name:'Teste Rotas',companyName:'Mercado de Testes',cityId:'CE-TIANGUA',seed:3322001});
const company=s=>dispatch(s,'EMPRESA.ABRIR',{sector:'mercado',cityId:'CE-TIANGUA',lot:3});

test('B-01: doc e campos de atalhos existem, rotas ancoradas em abas reais',()=>{
  assert.ok(template.includes('id="v332-bottom-zone"'));
  assert.ok(template.includes('id="v332-agenda-toggle"'));
  assert.ok(template.includes('id="v332-agenda-list"'));
  assert.ok(template.includes('id="v332-more-toggle"'));
  assert.ok(template.includes('id="v332-more-menu"'));
  const routes=[...template.matchAll(/data-v332-route="([^"]+)"/g)].map(x=>x[1]);
  assert.ok(routes.length>=10,'atalhos insuficientes');
  for(const route of routes){
    const [root,section]=route.split(':');
    assert.ok(['empresa','mercado','administrativo','sistema'].includes(root));
    assert.ok(template.includes('data-section-pane="'+root+':'+section+'"'),'secao ausente '+route);
  }
  for(const focus of [...template.matchAll(/data-v332-focus="([^"]+)"/g)].map(x=>x[1])){
    assert.ok(template.includes('id="'+focus+'"'),'foco sem destino '+focus);
  }
  assert.ok(template.includes('data-v332-route="mercado:outros" data-v332-focus="price-form"'));
  assert.ok(template.includes('data-v332-route="mercado:compras" data-v332-focus="restock-assistant"'));
});

test('B-02: menu mobile acessivel, dock principal preservado e botoes reais',()=>{
  const dock=template.slice(template.indexOf('<nav class="v31-dock" data-v332-dock="true"'),
    template.indexOf('</nav>',template.indexOf('<nav class="v31-dock" data-v332-dock="true"'))+6);
  for(const old of ['empresa:dashboard','mercado:compras','administrativo:rh-dp','administrativo:contabilidade','sistema']){
    assert.ok(dock.includes('data-v31-open="'+old+'"'),'rota de regressao ausente '+old);
  }
  for(const item of ['Compras','Estoque','Financeiro','Fiscal','Preços','Mais'])assert.ok(dock.includes(item));
  assert.match(css,/body\.v31-immersive #v31-dock\[data-v332-dock\]\{/);
  assert.match(css,/\.v332-dock-extra\{display:none!important\}/);
  assert.match(css,/--v332-map-bottom:174px/);
  assert.match(css,/--v332-map-bottom:157px/);
  assert.match(css,/object-fit:contain!important/);
  assert.doesNotMatch(css.slice(css.lastIndexOf('V3.3.2-B — dock')),/object-fit:cover|object-fit:fill|transform:scale\(/);
});

test('B-03: agenda nao inventa vencimentos, sem alteracao do save',()=>{
 const s=fresh(),before=JSON.stringify(s),rows=agenda(s);
 assert.deepEqual(Array.from(rows),[]);
 assert.equal(JSON.stringify(s),before);
 const s2=company(s);
 const now=Core.financialCommitmentsReport(s2,30).events;
 const b=agenda(s2);
 assert.ok(Array.isArray(b));assert.ok(b.length<=3);
 for(const row of b){
   assert.match(row.date,/^\d{4}-\d{2}-\d{2}$/);
   assert.ok(row.route.startsWith('administrativo:'));
   assert.ok(now.some(v=>v.date===row.date)||s2.fiscal.assessments.some(a=>a.dueDate===row.date));
 }
});

test('B-04: obrigações fiscais aparecem só após apuracao real',()=>{
 let s=company(fresh());
 s=dispatch(s,'ESTOQUE.COMPRAR',{productId:'base',supplierId:'regional',quantity:50});
 s=dispatch(s,'TEMPO.AVANCAR_LOTE',{days:30});
 s=dispatch(s,'TEMPO.AVANCAR_LOTE',{days:5});
 const before=JSON.stringify(s),rows=agenda(s);
 for(const row of rows){
   assert.match(row.id,/^(TAX|FIS-OP|LOAN|SUPPLIER)/);
   assert.ok(row.date<='9999-12-31');
 }
 assert.equal(JSON.stringify(s),before,'agenda nao pode gravar no save');
});

test('B-05: navegação de atalhos nao executa comando economico',()=>{
 const block=extract('function v332ShortcutOpen(button){','function v31Render(){');
 assert.ok(block.includes('v31OpenPanel('));
 assert.ok(block.includes("button.dataset.v332Requires==='unit'"));
 assert.ok(block.includes('v332MoreClose()'));
 assert.ok(block.includes('focus.scrollIntoView'));
 assert.doesNotMatch(block,/Core\.dispatch\(|commit\(|persistDurable\(|localStorage\.|sessionStorage\./);
 assert.match(ui,/v332-bottom-zone'\)\.addEventListener\('click'/);
 assert.match(ui,/v332-agenda-toggle'\)\.addEventListener\('click'/);
 assert.match(ui,/v332-more-toggle'\)\.addEventListener\('click'/);
 assert.equal(Core.SCHEMA_VERSION,10);
 assert.equal(JSON.parse(readFileSync('package.json','utf8')).version,'3.3.2',
  'release final V3.3.2 aprovado pelo titular');
});
