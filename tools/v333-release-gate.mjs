// V3.3.3-E — verificação de prontidão documental; jamais publica ou homologa.
// Sem rede, escrita no save, tag, release, merge ou alteração no projeto.
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {resolve} from 'node:path';

export function evaluateV333ReleaseGate({root=process.cwd(),requireGit=true}={}){
 const load=p=>readFileSync(resolve(root,p),'utf8');
 const manifest=JSON.parse(load('docs/V333_RELEASE_READINESS.json'));
 const pkg=JSON.parse(load('package.json'));
 const errors=[],blockers=[];
 if(manifest.schemaVersion!==1||manifest.contract!=='CDN-V333-E-RELEASE-READINESS'||
    manifest.targetVersion!=='3.3.3'||manifest.publishedVersion!=='3.3.2')
   errors.push('CONTRACT_INVALID');
 const required=['A','B','C','D','E'];
 for(const key of required){
  if(!manifest.automatedEvidence?.[key]||!['PASS','PENDING','FAIL'].includes(manifest.automatedEvidence[key].state))
   errors.push('AUTOMATION_STATUS_INVALID_'+key);
  else if(manifest.automatedEvidence[key].state!=='PASS')
   blockers.push('AUTOMATION_NOT_PASSED_'+key);
 }
 const protectedPaths=Object.keys(manifest.protectedGitBlobs||{});
 if(protectedPaths.length!==7)errors.push('PROTECTED_MANIFEST_INCOMPLETE');
 for(const path of protectedPaths){
  const expected=manifest.protectedGitBlobs[path];
  if(!/^[a-f0-9]{40}$/.test(expected))errors.push('INVALID_HASH_'+path);
  else if(requireGit){
   try{
    const sha=execFileSync('git',['rev-parse','HEAD:'+path],
      {cwd:root,encoding:'utf8'}).trim();
    if(sha!==expected)errors.push('PROTECTED_FILE_CHANGED_'+path);
   }catch{errors.push('PROTECTED_FILE_UNVERIFIABLE_'+path);}
  }
 }
 if(pkg.version!==manifest.targetVersion)blockers.push('RELEASE_VERSION_NOT_PROMOTED');
 if(pkg.version!=='3.3.2'&&pkg.version!==manifest.targetVersion)errors.push('UNEXPECTED_VERSION');
 const source=load('src/core/game.js');
 if(!/const VERSION = '3\.3\.2'/.test(source))errors.push('CORE_VERSION_CHANGED');
 if(!/SCHEMA_VERSION\s*=\s*10/.test(source))errors.push('SCHEMA_CHANGED');
 if(!load('src/ui/v31-immersive.part.js')
   .includes("dataset.severity=visible.length?visible[0].severity:'normal'"))
   errors.push('EMPTY_FILTER_GUARD_ABSENT');
 const owner=manifest.ownerApproval;
 if(owner?.state!=='APPROVED'||typeof owner?.evidence!=='string'||!owner.evidence.trim())
   blockers.push('OWNER_GO_NOT_DOCUMENTED');
 if(!manifest.publication?.authorized)blockers.push('PUBLICATION_NOT_AUTHORIZED');
 const qa=manifest.functionalQA||{};
 const realPassed=qa.physicalWindows==='PASS'&&qa.physicalMobile==='PASS'&&qa.personalSave==='PASS';
 const exception=owner?.acceptsHostedOnly===true&&
   typeof qa.exceptionEvidence==='string'&&!!qa.exceptionEvidence.trim();
 if(!realPassed&&!exception)blockers.push('FUNCTIONAL_ACCEPTANCE_OR_EXPLICIT_EXCEPTION_MISSING');
 if(!manifest.publication?.releaseCommit)blockers.push('RELEASE_COMMIT_NOT_PREPARED');
 if(manifest.publication?.mainMerged)errors.push('MAIN_MERGED_BEFORE_GATED_RELEASE');
 if(manifest.publication?.tagCreated)errors.push('RELEASE_TAG_CREATED_BEFORE_GATED_RELEASE');
 const ready=errors.length===0&&blockers.length===0;
 return {
  contract:manifest.contract,decision:ready?'ELIGIBLE_FOR_HUMAN_CONTROLLED_RELEASE':'NO_GO',
  candidateVersion:pkg.version,targetVersion:manifest.targetVersion,
  stableMainBaseline:manifest.publishedMainSha,protectedChecked:protectedPaths.length,
  errors,blockers,notAHomologation:true,
  note:'NO_GO esperado até GO expresso, aceitação funcional ou exceção consciente e novo commit de release. Nenhuma ação de publicação executada.'
 };
}
const invoked=process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url);
if(invoked){
 const result=evaluateV333ReleaseGate();
 console.log('V333_RELEASE_READINESS '+JSON.stringify(result));
 if(result.errors.length||(process.argv.includes('--require-go')&&result.decision!=='ELIGIBLE_FOR_HUMAN_CONTROLLED_RELEASE')){
  console.error('RELEASE_BLOCKED: sem autorização para merge, tag, publicação ou homologação.');
  process.exitCode=2;
 }
}
