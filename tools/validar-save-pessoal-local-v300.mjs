// Validador local, SOMENTE LEITURA, para salvar evidencia privada de compatibilidade.
// Uso: node tools/validar-save-pessoal-local-v300.mjs "C:\caminho\copia.json"
// Nao abre rede, nao modifica o arquivo, nao cria logs e NAO envia ao GitHub.
import {readFileSync,statSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
import {createHash} from 'node:crypto';

const file=process.argv[2];
if(!file||file.startsWith('--')){
  console.error('USO: node tools/validar-save-pessoal-local-v300.mjs "CAMINHO_PARA_COPIA_DE_SAVE.json"');
  process.exitCode=64;
}else{
  const safeErr=()=>console.error('V300_PERSONAL_SAVE_CHECK '+JSON.stringify({
    status:'FAIL',privacy:'FILE_LOCAL_ONLY',notModified:true,
    reason:'Arquivo inacessível, excede limite ou não passou na verificação de formato/integridade; preserve o original.'
  }));
  try{
    const size=statSync(file).size;
    if(size<=0||size>25_000_000)throw Error('Arquivo fora do limite aceito');
    const rawBytes=readFileSync(file);
    const raw=rawBytes.toString('utf8');
    const sha256=createHash('sha256').update(rawBytes).digest('hex');
    const current=runInNewContext(readFileSync('src/core/game.js','utf8')+'\nCidadeCore');
    const old=runInNewContext(readFileSync('tests/fixtures/core_v2_9_0_homologada.js','utf8')+'\nCidadeCore');
    const imported=current.importSave(raw);
    const snap=JSON.stringify(imported.state);
    const roundtrip=current.importSave(current.exportSave(imported.state));
    if(JSON.stringify(roundtrip.state)!==snap)throw Error('Round-trip divergente');
    const state=imported.state;
    const oldRaw=current.exportSave(state);
    let rollback={status:'NOT_VERIFIED',supported:false};
    try{
      const oldImported=old.importSave(oldRaw);
      const o=oldImported.state;
      const matches=o.schemaVersion===state.schemaVersion&&
        o.calendar.tick===state.calendar.tick&&
        o.revision===state.revision&&
        o.audit.events.length===state.audit.events.length&&
        o.economy.ledger.length===state.economy.ledger.length;
      rollback={status:matches?'SYNTHETIC_COMPATIBILITY_CHECK_PASS':'INVARIANTS_DIVERGED',
        supported:matches};
    }catch{
      rollback={status:'UNSUPPORTED_OR_NEEDS_HUMAN_REVIEW',supported:false};
    }
    // Somente metadata tecnica e checksum; não imprimir nomes, valores, empresas, historico ou caminhos.
    console.log('V300_PERSONAL_SAVE_CHECK '+JSON.stringify({
      status:'PASS_LOCAL_INTEGRITY',privacy:'FILE_LOCAL_ONLY',
      bytes:size,sha256,schemaVersion:state.schemaVersion,
      formatAccepted:true,currentRoundtrip:true,rollbackV29:rollback,
      notModified:true,notUploaded:true,
      note:'Verificação de motor offline não confirma UX, importação gráfica, persistência nem rollback real no Windows. Fazer em uma CÓPIA.'
    }));
  }catch{
    safeErr();
    process.exitCode=2;
  }
}
