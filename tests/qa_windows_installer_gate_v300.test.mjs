import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const read=p=>readFileSync(p,'utf8');
const evidence=JSON.parse(read('docs/V300_READINESS_EVIDENCE.json'));
const workflow=read('.github/workflows/qa-windows-v300.yml');

test('V3.0 QA BAT: execucao Windows offline 19 PASS é evidência parcial, não teste da instalação pessoal',()=>{
  const qa=evidence.batUpdaterQA;
  assert.equal(qa.status,'PASS_WINDOWS_HOSTED_OFFLINE_FIXTURE');
  assert.equal(qa.assertions,19);
  assert.equal(qa.actualWindows,true);
  assert.equal(qa.actualGitHubDownload,false);
  assert.equal(qa.actualGameInstallationTouched,false);
  assert.equal(qa.realUserSaveTested,false);
  assert.equal(qa.rollbackAfterCopyFailure,true);
  assert.equal(qa.downgradeRefused,true);
  assert.match(qa.ciUrl,/42434425027/);
  const rg=evidence.requirements.find(r=>r.id==='RG-09');
  assert.equal(rg.status,'PARTIAL');
  assert.match(rg.evidence,/42434425027/);
});

test('V3.0 QA BAT: testes de PS1 isolam download e preservam rollback',()=>{
  const source=read('tools/qa-windows-bat-updater-v300.ps1');
  assert.match(source,/function global:Invoke-RestMethod/);
  assert.match(source,/function global:Invoke-WebRequest/);
  assert.match(source,/function global:Start-Process/);
  assert.match(source,/QA_FIXTURE_ZIP/);
  assert.match(source,/Copy-Item -LiteralPath/);
  assert.match(source,/Protected-QA/);
  assert.match(source,/Run-Updater \$Broken/);
  assert.match(workflow,/runs-on: windows-latest/);
  assert.match(workflow,/powershell\.exe -NoProfile -NonInteractive -ExecutionPolicy Bypass -File tools\/qa-windows-bat-updater-v300\.ps1/);
});

test('V3.0 QA BAT: save pessoal não foi acessado e release permanece NO-GO',()=>{
  const local=evidence.privateSaveValidator;
  assert.equal(local.realUserSaveTested,false);
  assert.match(local.script,/validar-save-pessoal-local-v300/);
  assert.equal(evidence.requirements.find(r=>r.id==='RG-11').status,'NOT_EXECUTED');
  assert.equal(evidence.requirements.find(r=>r.id==='RG-18').status,'NOT_GRANTED');
  assert.equal(evidence.checkpointStatus.find(r=>r.id==='3.0.0-08').status,'BLOCKED');
  const docs=read('docs/V300_QA_BAT_SAVE_LOCAL.md');
  assert.match(docs,/19\/19/);
  assert.match(docs,/ZIP/);
  assert.match(docs,/main/);
  assert.match(docs,/NO-GO/);
});
