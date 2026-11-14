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
  // V3.3.3: compare-and-swap do snapshot completo, na MESMA transação
  // que grava current e sua cópia anterior. Revisão/worldId isolados não
  // distinguem duas ramificações com a mesma revisão.
  const conflict=()=>Object.assign(Error('Outra aba alterou a carreira. Exporte esta aba se necessário e recarregue antes de continuar.'),{code:'SAVE_CONFLICT'});
  const atomicCurrent=async(raw,{expected,backupRaw})=>{
    const db=await open();
    return new Promise((resolve,reject)=>{
      let tx,previous=null,previousBackup=null,failure=null;
      try{
        tx=db.transaction(TABLE,'readwrite');
        const store=tx.objectStore(TABLE),request=store.get('current');
        request.onsuccess=()=>{
          previous=request.result??null;
          if(previous!==expected){failure=conflict();tx.abort();return;}
          const apply=()=>{
            if(backupRaw!==undefined){if(backupRaw===null)store.delete('safety');else store.put(backupRaw,'safety');}
            if(raw===null)store.delete('current');else store.put(raw,'current');
          };
          if(backupRaw!==undefined){
            const safety=store.get('safety');
            safety.onsuccess=()=>{previousBackup=safety.result??null;apply();};
          }else apply();
        };
        tx.oncomplete=()=>resolve({previous,previousBackup});
        tx.onabort=()=>reject(failure||tx.error||Error('Transação IndexedDB abortada'));
        tx.onerror=()=>{};
      }catch(e){if(tx)tx.abort();reject(e);}
    });
  };
  const guardedCurrent=async(raw,options)=>{
    if(raw!==null&&(typeof raw!=='string'||!raw))throw Error('Save vazio ou inválido');
    if(!hasIdb()){
      // localStorage não tem CAS transacional. Só permitir escritores sob
      // Web Locks entre abas; sem suporte, leitura/exportação permanecem disponíveis.
      if(typeof navigator==='undefined'||!navigator.locks?.request)
        throw Error('Gravação segura indisponível: use navegador com IndexedDB ou Web Locks.');
      return navigator.locks.request(DATABASE+'-current',async()=>{
        const previous=localStorage.getItem(LEGACY_KEY),previousBackup=localStorage.getItem(LEGACY_SAFETY);
        if(previous!==options.expected)throw conflict();
        try{
          if(options.backupRaw!==undefined){if(options.backupRaw===null)localStorage.removeItem(LEGACY_SAFETY);else localStorage.setItem(LEGACY_SAFETY,options.backupRaw);}
          if(raw===null)localStorage.removeItem(LEGACY_KEY);else localStorage.setItem(LEGACY_KEY,raw);
          if(localStorage.getItem(LEGACY_KEY)!==raw||
             (options.backupRaw!==undefined&&localStorage.getItem(LEGACY_SAFETY)!==options.backupRaw))throw Error('Falha de leitura de retorno');
        }catch(e){
          if(previous===null)localStorage.removeItem(LEGACY_KEY);else localStorage.setItem(LEGACY_KEY,previous);
          if(options.backupRaw!==undefined){if(previousBackup===null)localStorage.removeItem(LEGACY_SAFETY);else localStorage.setItem(LEGACY_SAFETY,previousBackup);}
          throw e;
        }
      });
    }
    const saved=await atomicCurrent(raw,options);
    let actual;
    try{actual=await read('current');}
    catch(e){
      // Só reverter nossa escrita. Nunca restaurar por cima de outra aba.
      await atomicCurrent(saved.previous,{expected:raw,backupRaw:options.backupRaw===undefined?undefined:saved.previousBackup});
      if(await read('current')!==saved.previous)throw conflict();
      throw Error('Leitura de retorno falhou; snapshot anterior preservado: '+errorText(e));
    }
    if(actual!==raw)throw conflict();
    try{localStorage.removeItem(LEGACY_KEY);}catch(_){}
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
    try{await guardedCurrent(core.exportSaveCompact(loaded.state),{expected:null});}
    catch(e){if(e.code!=='SAVE_CONFLICT')throw e;} // outra aba já migrou/gravou: reler, nunca sobrescrever
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
    readCurrent,
    writeCurrent:(raw,options)=>options&&Object.hasOwn(options,'expected')?guardedCurrent(raw,options):write('current',raw),
    clearCurrent:options=>options&&Object.hasOwn(options,'expected')?guardedCurrent(null,options):remove('current'),
    readBackup,writeBackup
  });
})();
