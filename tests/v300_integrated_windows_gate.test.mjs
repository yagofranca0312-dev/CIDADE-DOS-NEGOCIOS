import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const read=p=>readFileSync(p,'utf8');
const evidence=JSON.parse(read('docs/V300_READINESS_EVIDENCE.json'));
const browserScript=read('tools/qa-windows-integrated-v300.mjs');
const workflow=read('.github/workflows/qa-windows-v300.yml');
const report=read('docs/V300_QA_INTEGRADO_WINDOWS_HOSTED.md');

test('V3.0 E2E: proveniência de 66 verificações Windows Chrome/Edge em file://',()=>{
  const e=evidence.windowsIntegratedQA;
  assert.equal(e.status,'PASS_WINDOWS_HOSTED_BROWSER_UI');
  assert.equal(e.assertions,66);
  assert.equal(e.assertionsPerBrowser,33);
  assert.equal(e.stepsPerBrowser,13);
  assert.equal(e.gameDaysPerBrowser,38);
  assert.equal(e.unitsPerBrowser,2);
  assert.equal(e.coreDispatchInvokedFromQA,false);
  assert.equal(e.persistedAndReloaded,true);
  assert.match(e.ciUrl,/42437328042/);
  assert.match(e.sha,/^[a-f\d]{40}$/);
  assert.deepEqual(e.browsers,[
    'Chrome 156 headless Windows hosted','Edge 156 headless Windows hosted'
  ]);
});

test('V3.0 E2E: interface executa formulários e comandos apenas pela UI',()=>{
  assert.match(browserScript,/launchPersistentContext/);
  assert.match(browserScript,/pathToFileURL\(resolve\('index\.html'\)\)/);
  assert.match(browserScript,/\.locator\('#open-form button\[type="submit"\]'\)\.click\(\)/);
  assert.match(browserScript,/\.locator\('#buy-form button\[type=submit\]'\)\.click\(\)/);
  assert.match(browserScript,/\.locator\('#rh-hire-submit'\)\.click\(\)/);
  assert.match(browserScript,/\.locator\('#logistics-transfer-submit'\)\.click\(\)/);
  assert.match(browserScript,/\.locator\('#credit-contract-submit'\)\.click\(\)/);
  assert.match(browserScript,/\.locator\('#v300a-apply'\)\.click\(\)/);
  assert.match(browserScript,/\.locator\('#rh-unit-list \[data-rh-pay\]'\)/);
  assert.match(browserScript,/\.reload\(\{waitUntil:'load'\}\)/);
  assert.doesNotMatch(browserScript,/CidadeCore\.dispatch\s*\(/);
  assert.doesNotMatch(browserScript,/localStorage\.setItem\s*\(/);
  const stages=(browserScript.match(/await stage\('/g)||[]).length;
  assert.equal(stages,13);
  assert.match(workflow,/node tools\/qa-windows-integrated-v300\.mjs/);
});

test('V3.0 E2E: apenas parciais em RG13/RG16, sem fabricar teste pessoal',()=>{
  const e=evidence.windowsIntegratedQA;
  assert.equal(e.realUserSaveTested,false);
  assert.equal(e.actualPersonalWindowsInstallation,false);
  assert.equal(e.physicalMobileTested,false);
  assert.equal(e.visualHumanReviewCompleted,false);
  assert.equal(e.longBrowserCareerTested,false);
  for(const id of ['RG-13','RG-16']){
    const r=evidence.requirements.find(x=>x.id===id);
    assert.equal(r.status,'PARTIAL');
    assert.match(r.evidence,/42437328042/);
  }
  const longrun=evidence.requirements.find(x=>x.id==='RG-15');
  assert.equal(longrun.status,'PARTIAL');
  assert.match(longrun.evidence,/42485124066/);
  for(const id of ['RG-11','RG-14']){
    assert.equal(evidence.requirements.find(x=>x.id===id).status,'NOT_EXECUTED');
  }
  assert.equal(evidence.checkpointStatus.find(x=>x.id==='3.0.0-03').status,'PARTIAL');
  assert.equal(evidence.checkpointStatus.find(x=>x.id==='3.0.0-08').status,'BLOCKED');
  assert.equal(evidence.requirements.filter(x=>x.status==='VERIFIED').length,5);
});

test('V3.0 E2E: relatório separa automação Chrome/Edge de aceite humano e NO-GO',()=>{
  assert.match(report,/66 verificações PASS/);
  assert.match(report,/headless/);
  assert.match(report,/38 dias/);
  assert.match(report,/RG-13 PARTIAL/);
  assert.match(report,/RG-16 PARTIAL/);
  assert.match(report,/RG-14 NOT_EXECUTED/);
  assert.match(report,/NO-GO/);
  assert.match(report,/PR #39/);
});
