# Dados, histórico, backup e privacidade

[Documentação](README.md) / Dados

## Onde os dados são armazenados

A aplicação é local-first: IndexedDB (`vistoria_veicular_offline`) guarda dados mais volumosos, como fotos e histórico, quando disponível. O `localStorage` apoia a recuperação do rascunho e a compatibilidade de versões antigas.

Chaves existentes no código:

- `vistoria_veicular_pwa_v3`: estado atual/recuperação;
- `vistoria_veicular_pwa_v2`: migração do formato antigo;
- `vistoria_veicular_history_v1`: histórico legado;
- `vistoria_veicular_ui_layout_v1`: preferência de disposição.

O aplicativo não possui backend obrigatório nem sincronização automática. Cada origem (`file://`, `localhost` e domínio HTTPS) mantém uma área isolada.

## Histórico

- Cada salvamento arquivado pode receber um `meta.archiveId` próprio, mesmo quando o protocolo (`meta.id`) é idêntico.
- Excluir registros requer confirmação e deve afetar apenas o arquivo escolhido.
- Fotos, assinaturas e observações devem permanecer associadas ao registro correto.

## Backup e restauração

1. Abra o histórico e exporte o **JSON** de cada vistoria importante.
2. Guarde as cópias em dispositivo/local seguro e protegido por acesso.
3. Antes de importar, salve o rascunho atual ou exporte uma cópia: a restauração pode substituir a vistoria aberta.
4. Após importar, confira os dados de identificação, croqui, checklist, fotos e assinaturas.

O JSON não é criptografado automaticamente. Não envie backups contendo dados pessoais, fotos ou assinaturas para serviços públicos sem autorização.

## Riscos conhecidos

Limpar dados do navegador, usar navegação anônima, mudar origem, reinstalar navegador ou atingir limites de armazenamento pode comprometer rascunhos e históricos. Assinatura desenhada não equivale, por si só, a certificado de assinatura eletrônica qualificada/ICP-Brasil.

A aplicação somente solicita localização se a função específica for acionada e o navegador conceder permissão, conforme comportamento descrito no projeto.
