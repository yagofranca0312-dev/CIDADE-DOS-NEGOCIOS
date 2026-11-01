# Contribuição e governança

1. Nunca começar uma nova mecânica sem escopo e critério de aceitação definidos.
2. Trabalhar em `feat/...`, `fix/...` ou `docs/...`; propor mudanças na `main` por pull request quando possível.
3. Antes de registrar uma mudança, executar `npm test` e descrever o resultado real.
4. Proteger o save: mudanças em `schemaVersion` exigem plano de migração e teste de importação de legado.
5. Mudanças na simulação precisam testar determinismo, unicidade dos eventos e ausência de dupla contabilização.
6. Não inserir arquivos pessoais, chaves, cookies, tokens ou saves reais no repositório.
7. Anotar cada release em `CHANGELOG.md`; não anunciar versão final sem homologação.
8. O arquivo final jogável deve continuar sendo **somente** `index.html`.
