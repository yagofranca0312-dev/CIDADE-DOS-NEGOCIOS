import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=path=>readFileSync(path,'utf8');
const app=read('src/ui/app.js');
const render=app.split('  function render(){')[1]?.split('  function updateBuyPreview(){')[0];
test('V3.0 etapa 5: abrir Sistema não recalcula hash de save inteiro automaticamente',()=>{
  assert.ok(render,'Bloco de render principal ausente');
  assert.match(render,/if\(tab==='sistema'\)/);
  assert.doesNotMatch(render,/Core\.diagnostics\(state\)|Core\.exportSave\(state\)|JSON\.stringify\(state\)/,
    'Abertura do painel não pode recalcular ou exportar integralmente o save');
  assert.match(render,/Sob demanda: execute o diagnóstico/);
});
test('V3.0 etapa 5: checksum preservado como ação explícita e verificação de estado',()=>{
  const manual=app.split("  $('run-diagnostic').addEventListener('click'")[1];
  assert.ok(manual,'Botão de diagnóstico manual ausente');
  assert.match(manual,/Core\.diagnostics\(state\)/);
  assert.match(manual,/out\.checksum/);
  assert.match(manual,/if\(before!==JSON\.stringify\(state\)\)/);
});
test('V3.0 etapa 5: benchmark reproduzível está conectado ao CI e não altera baseline de stability',()=>{
  const p=JSON.parse(read('package.json'));
  const workflow=read('.github/workflows/ci.yml');
  assert.equal(p.scripts['bench:consolidation'],'node tools/benchmark-v300-consolidation.mjs');
  assert.equal(p.scripts['bench:stability'],'node tools/benchmark-v241.mjs');
  assert.match(workflow,/run: npm run bench:stability/);
  assert.match(workflow,/run: npm run bench:consolidation/);
});
