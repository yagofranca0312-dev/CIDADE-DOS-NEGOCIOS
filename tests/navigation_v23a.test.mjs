import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {Script,runInNewContext} from 'node:vm';

const template=readFileSync('src/shell/index.template.html','utf8');
const app=readFileSync('src/ui/app.js','utf8');
const built=readFileSync('index.html','utf8');

test('V2.3-A possui quatro abas principais e Configurações independente',()=>{
  const nav=template.match(/<nav class="nav-items nav-primary"[\s\S]*?<\/nav>/)?.[0];assert.ok(nav);
  assert.deepEqual([...nav.matchAll(/data-tab="([^"]+)"/g)].map(x=>x[1]),['cidade','empresa','mercado','administrativo']);
  assert.match(template,/data-tab="sistema"/);
});

test('V2.3-A possui 13 subáreas, identificadores únicos e vínculos ARIA válidos',()=>{
  const map={empresa:['dashboard','minhas-empresas','analises','comparativos'],mercado:['compras','estoque','vendas','outros'],administrativo:['financas','rh-dp','contabilidade','fiscal','paralegal']};
  const ids=[...template.matchAll(/\bid="([^"]+)"/g)].map(x=>x[1]),unique=new Set(ids);
  assert.equal(ids.length,unique.size,'ID duplicado');
  for(const [root,subs] of Object.entries(map))for(const sub of subs){
    assert.ok(template.includes('data-section-tab="'+root+':'+sub+'"'));
    assert.ok(template.includes('data-section-pane="'+root+':'+sub+'"'));
    assert.ok(unique.has('v23-tab-'+root+'-'+sub));
    assert.ok(unique.has('v23-pane-'+root+'-'+sub));
  }
  for(const x of template.matchAll(/aria-controls="([^"]+)"/g))for(const id of x[1].split(/\s+/))assert.ok(unique.has(id),'aria-controls sem alvo '+id);
});

test('V2.3-A preserva os formulários e relatórios existentes sem duplicação',()=>{
  const names=['career-form','open-form','buy-form','price-form','product-form','promo-form','stock-policy-form','finance-scope','finance-period','finance-summary','fiscal-summary','fiscal-assessments','fiscal-activate','run-diagnostic','export-btn','import-btn'];
  for(const id of names)assert.equal([...template.matchAll(new RegExp('id="'+id+'"','g'))].length,1,id);
  assert.match(template,/Matriz e filiais são unidades gerenciais/);
  assert.match(template,/Não coberto não significa alíquota zero/);
  assert.match(template,/data-section-go="administrativo:financas"/);
});

test('V2.4-B ativa RH/DP e preserva Paralegal simulado',()=>{
  assert.match(template,/id="rh-hire-form"/);assert.match(template,/id="rh-unit-list"/);
  assert.match(template,/id="paralegal-unit-list"/);assert.match(template,/não há emissão de CNPJ/);
  assert.match(template,/data-section-pane="administrativo:contabilidade"/);
  assert.match(template,/DRE gerencial, balanço consolidado, conciliação e razão/);
});

test('V2.3-A executa o roteamento legado e subáreas sem alterar estado econômico',()=>{
  const part=app.split('function goto(name,requestedSection=null)')[1]?.split('function cityOptions()')[0];
  assert.ok(part);
  const code='function goto(name,requestedSection=null)'+part;
  assert.doesNotMatch(code,/Core\.dispatch|commit\(/);
  const roots=['cidade','empresa','mercado','administrativo','sistema'];
  const panels=['empresa:dashboard','empresa:minhas-empresas','empresa:analises','empresa:comparativos','mercado:compras','mercado:estoque','mercado:vendas','mercado:outros','administrativo:financas','administrativo:rh-dp','administrativo:contabilidade','administrativo:fiscal','administrativo:paralegal'];
  const noop=()=>{};
  const cls=()=>({toggle:noop});
  const rootElems=roots.map(v=>({dataset:{view:v},classList:cls(),hidden:true}));
  const nav=roots.slice(0,4).map(v=>({dataset:{tab:v},classList:cls(),setAttribute:noop,removeAttribute:noop}));
  const panes=panels.map(v=>({dataset:{sectionPane:v},hidden:true}));
  const tabs=panels.map(v=>({dataset:{sectionTab:v},classList:cls(),setAttribute:noop,tabIndex:0}));
  const data={player:{cityId:'CE-TIANGUA'},economy:{ledger:[{value:7}]},revision:12};
  let renderCount=0;
  const context={state:data,tab:'cidade',activeSection:{empresa:'dashboard',mercado:'compras',administrativo:'financas'},
    document:{body:{classList:cls()},querySelector:s=>panes.find(x=>s==='[data-section-pane="'+x.dataset.sectionPane+'"]')||null,
      querySelectorAll:s=>s==='.view[data-view]'?rootElems:s==='.nav-primary [data-tab]'?nav:s==='[data-section-pane]'?panes:s==='[data-section-tab]'?tabs:[]},
    window:{scrollTo:noop},setText:noop,render:()=>{renderCount++;}};
  const before=JSON.stringify(data);
  runInNewContext(code+'\n goto("fiscal");',context);
  assert.equal(context.tab,'administrativo');assert.equal(context.activeSection.administrativo,'fiscal');
  assert.equal(panes.find(x=>x.dataset.sectionPane==='administrativo:fiscal').hidden,false);
  assert.equal(nav.find(x=>x.dataset.tab==='administrativo').tabIndex,undefined);
  runInNewContext('goto("financas");goto("mercado","estoque");goto("empresa","minhas-empresas");',context);
  assert.equal(context.activeSection.administrativo,'financas');assert.equal(context.activeSection.mercado,'estoque');
  assert.equal(context.activeSection.empresa,'minhas-empresas');assert.equal(context.tab,'empresa');
  assert.ok(renderCount>=4);assert.equal(JSON.stringify(data),before);
});

test('V2.3-A build offline contém script compilável e módulo fiscal',()=>{
  const scripts=[...built.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)];
  assert.equal(scripts.length,1);assert.doesNotThrow(()=>new Script(scripts[0][1]));
  assert.match(built,/data-section-pane="administrativo:fiscal"/);
  assert.match(built,/const VERSION = '2\.4\.1-rc\.1'/);
});

test('V2.3-A: Gerenciar do mapa abre diretamente Minhas Empresas',()=>{
 assert.match(app,/\$\('map-open-company'\)\.addEventListener\('click',[\s\S]*?goto\('empresa','minhas-empresas'\)/);
});
