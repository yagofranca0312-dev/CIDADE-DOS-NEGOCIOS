#!/usr/bin/env node
// Auditoria POS-HOMOLOGACAO. Confere contratos no repositorio e informa a
// fronteira entre CI sintetica e ensaios pessoais. Nao concede certificacao.
import {readFileSync,existsSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
const read=p=>readFileSync(p,'utf8');
const failures=[];
const insist=(test,message)=>{if(!test)failures.push(message);};
const manifest=JSON.parse(read('docs/V300_READINESS_EVIDENCE.json'));
const exception=JSON.parse(read('docs/V300_OWNER_EXCEPTION.json'));
const pkg=JSON.parse(read('package.json'));
const core=read('src/core/game.js');
const ci=read('.github/workflows/ci.yml');
const windows=read('.github/workflows/qa-windows-v300.yml');
const ids=manifest.requirements.map(x=>x.id);
const statuses=Object.fromEntries(manifest.requirements.map(x=>[x.id,x.status]));
const waived=[...exception.waivedRequirements].sort();
const unresolved=manifest.requirements.filter(x=>x.status!=='VERIFIED').map(x=>x.id);
const manualUnproven=['RG-08','RG-09','RG-10','RG-11','RG-13','RG-14','RG-15','RG-16'];
const automatedScenarios=[
  ['BAT/PS1 sinteticos','tools/qa-windows-bat-updater-v300.ps1'],
  ['Chrome e Edge por file://','tools/qa-windows-browser-v300.mjs'],
  ['Fluxos empresariais integrados','tools/qa-windows-integrated-v300.mjs'],
  ['Migracao e rollback sinteticos IndexedDB','tools/qa-windows-indexeddb-v300.mjs'],
  ['Mobile emulado (nao fisico)','tools/qa-windows-mobile-emulado-v300.mjs'],
  ['Carreira longa sintetica (nao organica)','tools/qa-windows-longrun-v300.mjs']
];
insist(ids.length===18&&new Set(ids).size===18,'Manifesto deve conter 18 requisitos unicos');
insist(manifest.assessment==='V300-08','Manifesto historico inesperado');
insist(manifest.checkpointStatus.length===8,'Oito checkpoints originais devem permanecer');
insist(statuses['RG-11']==='NOT_EXECUTED'&&statuses['RG-14']==='NOT_EXECUTED',
  'QA privado e mobile fisico nao podem ser convertidos em PASS');
insist(statuses['RG-17']==='NOT_CREATED'&&statuses['RG-18']==='NOT_GRANTED',
  'Gate ordinario historico nao pode ser reescrito apos liberacao excepcional');
insist(manifest.requirements.filter(x=>x.status==='VERIFIED').length===5,
  'O manifesto ordinario historico deve continuar em 5/18');
insist(exception.contract==='V300_OWNER_EXCEPTION_V1'&&
  exception.status==='OWNER_AUTHORIZED'&&
  exception.waiverEffect==='ASSUMED_RISK_NOT_TESTED_NOT_VERIFIED',
  'Autorizacao excepcional ou qualificacao de risco ausente');
insist(JSON.stringify(waived)===JSON.stringify(unresolved.filter(x=>!['RG-17','RG-18'].includes(x)).sort()),
  'Dispensas nao coincidem com pendencias tecnicas originais');
insist(['3.0.0','3.1.0','3.2.0'].includes(pkg.version)&&core.includes("const VERSION = '"+pkg.version+"';")&&
  core.includes('const SCHEMA_VERSION = '+(pkg.version==='3.2.0'?10:9)+';'),
  'Baseline 3.0.0/schema 9 foi alterada sem novo contrato');
insist(manifest.stableBaseline.sha==='082faa4626cf5cb0fc54c9ef092bddd86ffce54c',
  'Ponto de recuperacao V2.9 divergente');
insist(existsSync('src/contracts/v31-read-model.mjs')&&
  existsSync('docs/V300_CONTRATO_UI_V31.md'),
  'Contrato de leitura que sustenta V3.1 esta ausente');
insist(ci.includes('npm run check')&&ci.includes('npm run audit:release:exception')&&
  ci.includes('npm run audit:postrelease'),
  'Workflow Linux deve executar testes e matriz excepcional');
insist(windows.includes('node tools/v300-postrelease-audit.mjs')&&
  windows.includes('tools/verify-html-byte-identical-v300.mjs'),
  'Workflow Windows deve produzir auditoria apos QA e validar HTML');
for(const [name,path] of automatedScenarios){
  insist(existsSync(path),'Falta suite de '+name);
  insist(windows.includes(path),'Suite sem execucao prevista no Windows: '+name);
}
insist(existsSync('docs/HOMOLOGACAO_V300_EXCEPCIONAL.md'),
  'Termo de homologacao excepcional deve ser preservado');
const result={
  contract:'V300_POSTRELEASE_EVIDENCE_V1',
  version:'3.0.0',
  baseline:'7f18cb97c69ced792afd186c450b0206a2e6e1b9',
  approval:'OWNER_HOMOLOGATED_EXCEPTION_EXISTING',
  ordinaryHistoricalGate:'NO_GO_5_OF_18_VERIFIED',
  auditScope:'REPOSITORY_CONTRACTS_ONLY',
  executedByThisCommand:'STATIC_CONSISTENCY_AUDIT',
  windowsAutomatedCasesDeclared:automatedScenarios.map(x=>x[0]),
  windowsAutomatedResults:'VERIFY_IN_ACTIONS_RUN_FOR_THIS_SHA',
  historicalWaivers:waived,
  manualEvidenceStillMissing:manualUnproven,
  privateSaveTestedByThisAudit:false,
  physicalMobileTestedByThisAudit:false,
  personalWindowsTestedByThisAudit:false,
  gameplaySubjectiveApprovedByThisAudit:false,
  noEngineChanges:true,
  safeToClaimOrdinary18Of18:false,
  readyForV31DevelopmentOnly:failures.length===0,
  status:failures.length?'FAIL':'PASS_REPOSITORY_CONTRACTS',
  failures
};
const output=JSON.stringify(result,null,2)+'\n';
const outIndex=process.argv.indexOf('--out');
if(outIndex!==-1){
  const target=process.argv[outIndex+1];
  if(!target)throw Error('--out necessita caminho');
  writeFileSync(resolve(target),output,'utf8');
}
console.log('V300_POSTRELEASE_AUDIT '+JSON.stringify(result));
if(failures.length)process.exitCode=1;
