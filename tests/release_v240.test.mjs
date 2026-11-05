import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext,Script} from 'node:vm';
const source=readFileSync('src/core/game.js','utf8');
const core=runInNewContext(source+'\nCidadeCore',{});
test('V2.5.0-alpha.1: identifica versão estável, mantém schema 9 e três departamentos ativos',()=>{
  assert.equal(core.VERSION,'2.5.0-alpha.1');
  assert.equal(core.SCHEMA_VERSION,9);
  assert.equal(typeof core.paralegalReport,'function');
  assert.equal(typeof core.rhReport,'function');
  assert.equal(typeof core.fiscalOperationsReport,'function');
  assert.equal(typeof core.dispatch,'function');
  assert.equal(typeof core.exportSave,'function');
  assert.equal(typeof core.importSave,'function');
  assert.equal(Object.keys(core.RH_ROLES).length,3);
  assert.equal(core.FISCAL_OP_TASKS.length,3);
});
test('V2.5.0-alpha.1: HTML único offline contém os três departamentos e versão no cabeçalho, início e rodapé',()=>{
  const html=readFileSync('index.html','utf8');
  const template=readFileSync('src/shell/index.template.html','utf8');
  const pkg=JSON.parse(readFileSync('package.json','utf8'));
  assert.equal(pkg.version,'2.5.0-alpha.1');
  assert.match(template,/<title>Cidade dos Negócios 1 · v2\.5\.0-alpha\.1<\/title>/);
  for(const id of ['intro-version','build-version','footer-version'])
    assert.ok(template.includes('id="'+id+'">v2.5.0-alpha.1<'),id);
  for(const id of ['paralegal-unit-list','rh-hire-form','fiscal-op-unit-list'])
    assert.ok(html.includes('id="'+id+'"'),id);
  assert.match(html,/const VERSION = '2\.5\.0-alpha\.1'/);
  assert.equal((html.match(/<script\b/g)||[]).length,1);
  const scripts=[...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)];
  assert.equal(scripts.length,1);
  assert.doesNotThrow(()=>new Script(scripts[0][1]));
  assert.doesNotMatch(html,/2\.4\.0-alpha\.3/);
});
test('V2.5.0-alpha.1: módulos do jogo não criam registros retroativos ao carregar saves novos',()=>{
  let r=core.dispatch(null,{id:'release-create',type:'CARREIRA.CRIAR',payload:{
    name:'Usuário Teste',companyName:'Comércio Teste',cityId:'CE-TIANGUA',seed:20261104}});
  assert.equal(r.ok,true,r.error);
  r=core.dispatch(r.state,{id:'release-open',type:'EMPRESA.ABRIR',payload:{
    sector:'mercado',cityId:'CE-TIANGUA',lot:1}});
  assert.equal(r.ok,true,r.error);
  const state=r.state,before=core.exportSave(state);
  assert.equal(core.paralegalReport(state).length,1);
  assert.equal(core.rhReport(state).totalActive,0);
  assert.equal(core.fiscalOperationsReport(state).openPeriods,0);
  assert.equal(core.exportSave(state),before);
  assert.equal(core.importSave(before).state.schemaVersion,9);
});
