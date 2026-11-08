/* P0-04 · armazenamento transacional offline: IndexedDB (primário), localStorage
 * somente quando IndexedDB NÃO existe. Não requer rede, npm nem servidor.
 * Sem prometer persistência se a escrita/leitura/commit falhar. */
const CidadeDurableStore=(()=>{
  'use strict';
  const DATABASE='cidade-dos-negocios-v300-durable';
  const TABLE='saves';
  const LEGACY_KEY='cidade-dos-negocios-save-v1';
  const LEGACY_SAFETY='cidade-dos-negocios-prior-save-v241';
  const VERSION=1;
  const hasIdb=()=>typeof indexedDB!=='undefined'&&indexedDB!==null;
  let connection=null,opening=null;
  const errorText=e=>e?.message||String(e||'erro de armazenamento');
  const open=()=>{
    if(!hasIdb())return Promise.resolve(null);
    if(connection)return Promise.resolve(connection);
    if(opening)return opening;
    opening=new Promise((resolve,reject)=>{
      let request;
      try{request=indexedDB.open(DATABASE,VERSION);}catch(e){reject(e);return;}
      request.onupgradeneeded=()=>{
        const db=request.result;
        if(!db.objectStoreNames.contains(TABLE))db.createObjectStore(TABLE);
      };
      request.onerror=()=>reject(request.error||Error('Não foi possível abrir IndexedDB'));
      request.onblocked=()=>reject(Error('IndexedDB bloqueado por outra aba; feche as outras janelas do jogo'));
      request.onsuccess=()=>{
        const db=request.result;
        db.onversionchange=()=>{db.close();connection=null;opening=null;};
        connection=db;resolve(db);
      };
    }).catch(e=>{opening=null;throw e;});
    return opening;
  };
  const transact=async(mode,work)=>{
    const db=await open();
    if(!db)throw Error('IndexedDB não disponível');
    return new Promise((resolve,reject)=>{
      let tx,request,result,completed=false;
      try{
        tx=db.transaction(TABLE,mode);
        request=work(tx.objectStore(TABLE));
      }catch(e){reject(e);return;}
      tx.oncomplete=()=>{completed=true;resolve(result);};
      tx.onabort=()=>reject(tx.error||request?.error||Error('Transação IndexedDB abortada'));
      tx.onerror=()=>{}; // abort oferece a causa, sem dupla resolução.
      if(request){
        request.onsuccess=()=>{result=request.result;};
        request.onerror=()=>{}; // erro aborta a transação automaticamente.
      }
    });
  };
  const read=async(key)=>{
    if(!hasIdb()){
      try{return localStorage.getItem(key==='current'?LEGACY_KEY:LEGACY_SAFETY);}
      catch(e){throw Error('Leitura local negada: '+errorText(e));}
    }
    return (await transact('readonly',store=>store.get(key)))??null;
  };
  const write=async(key,raw)=>{
    if(typeof raw!=='string'||!raw)throw Error('Backup vazio ou inválido');
    if(!hasIdb()){
      const k=key==='current'?LEGACY_KEY:LEGACY_SAFETY;
      const old=localStorage.getItem(k);
      try{
        localStorage.setItem(k,raw);
        if(localStorage.getItem(k)!==raw)throw Error('Falha de leitura de retorno');
      }catch(e){
        try{if(old===null)localStorage.removeItem(k);else localStorage.setItem(k,old);}catch(_){}
        throw e;
      }
      return;
    }
    const previous=await read(key);
    await transact('readwrite',store=>store.put(raw,key));
    let verified=false;
    try{verified=(await read(key))===raw;}catch(_){}
    if(verified){
      if(key==='current'){
        // O legado continua acessível APENAS até a nova gravação ser confirmada.
        // Se a remoção falhar, IndexedDB sempre terá prioridade na leitura.
        try{localStorage.removeItem(LEGACY_KEY);}catch(_){}
      }
      return;
    }
    // Readback falhou: restaurar snapshot anterior e verificar. Nunca confirmar
    // uma operação cujo resultado persistente não pôde ser atestado.
    try{
      await transact('readwrite',store=>previous===null?store.delete(key):store.put(previous,key));
      if(await read(key)!==previous)throw Error('Rollback divergente');
    }catch(e){
      throw Error('Leitura de retorno falhou; rollback NÃO confirmado: '+errorText(e));
    }
    throw Error('Falha de leitura de retorno; snapshot anterior preservado');
  };
  const remove=async(key)=>{
    if(!hasIdb()){
      const k=key==='current'?LEGACY_KEY:LEGACY_SAFETY;
      const old=localStorage.getItem(k);
      try{localStorage.removeItem(k);if(localStorage.getItem(k)!==null)throw Error('Remoção não confirmada');}
      catch(e){try{if(old!==null)localStorage.setItem(k,old);}catch(_){}throw e;}
      return;
    }
    const previous=await read(key);
    await transact('readwrite',store=>store.delete(key));
    if(await read(key)===null){
      if(key==='current'){try{localStorage.removeItem(LEGACY_KEY);}catch(_){}}
      return;
    }
    if(previous!==null)await transact('readwrite',store=>store.put(previous,key));
    throw Error('Remoção não verificada no armazenamento');
  };
  const readCurrent=async(core)=>{
    if(!hasIdb())return read('current');
    // Um erro ao abrir IDB NÃO vira fallback para chave local potencialmente velha.
    const stored=await read('current');
    if(stored!==null)return stored;
    let legacy=null;
    try{legacy=localStorage.getItem(LEGACY_KEY);}catch(e){
      throw Error('Sem save IndexedDB e leitura do legado negada: '+errorText(e));
    }
    if(legacy===null)return null;
    // Primeiro importa e valida o save antigo. Depois migra para IDB.
    // Só retira a origem legada após concluir a transação e readback da cópia.
    const loaded=core.importSave(legacy);
    await write('current',core.exportSaveCompact(loaded.state));
    return await read('current');
  };
  const readBackup=async()=>{
    const value=await read('safety');
    if(value!==null)return value;
    // Cópia antiga (V2) é reconhecida, mas o upload/import não a modifica.
    try{return localStorage.getItem(LEGACY_SAFETY);}
    catch(e){throw Error('Backup antigo inacessível: '+errorText(e));}
  };
  const writeBackup=async(raw)=>{
    await write('safety',raw);
    try{localStorage.removeItem(LEGACY_SAFETY);}catch(_){}
  };
  return Object.freeze({
    mode:()=>hasIdb()?'indexeddb':'legacy-localstorage',
    readCurrent,writeCurrent:raw=>write('current',raw),clearCurrent:()=>remove('current'),
    readBackup,writeBackup
  });
})();
