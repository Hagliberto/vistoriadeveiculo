# AGENTS.md — Orientações de manutenção

> Referência para agentes de código e contribuidores. **Versão documentada: 1.5.10.** Para a explicação completa, consulte [docs/arquitetura.md](docs/arquitetura.md), [docs/testes.md](docs/testes.md) e [docs/contribuicao.md](docs/contribuicao.md).

## Princípios inegociáveis

1. **Preservar dados existentes.** Não romper as chaves de `localStorage`/IndexedDB, `meta.id`, `meta.archiveId`, `pins`, `checklist`, assinaturas, fotos e protocolos. Qualquer migração deve ter testes.
2. **Manter HTML, CSS e JavaScript executáveis estaticamente.** Não introduzir serviços externos obrigatórios, build remoto ou CDN necessária à operação. Todas as nove imagens do croqui devem permanecer locais.
3. **Um único PDF oficial.** A ação **Gerar PDF / Imprimir** deve usar a composição A4 do navegador. Não voltar a oferecer PNG, compartilhamento PDF duplicado ou gerador rasterizado diferente da impressão.
4. **Exportação seletiva sem mutação do estado.** Identificação e observações gerais sempre incluídas; croqui, checklist, fotos e assinaturas opcionais; categorias e itens verificados filtráveis.
5. **Avarias:** as cores representam **tipo**, não posição: Amassado (vermelho), Risco (azul), Quebrado (laranja), Faltando (roxo). Manter ID e tipo estáveis ao excluir/renumerar.
6. **Gestos do croqui:** toque breve marca mesmo ampliado; arraste/pinça não marca; com zoom ativo, arraste reposiciona; em 100%, arraste horizontal troca a vista. Manter modo tela cheia, nove vistas e imagem original em WebP.
7. **Não alterar a orientação das vistas por suposição.** Confirmar perspectiva física de cada imagem antes de renomear ou trocar os recursos. IDs persistidos precisam de migração explícita e testes.
8. **Responsividade e acessibilidade:** expanders no celular não podem truncar títulos/descrições; pills e ações devem ter espaço. Controles com ícones devem ter `aria-label`; alvos de toque adequados e foco perceptível.
9. **Histórico e diálogos:** salvamentos repetidos com mesmo protocolo geram `archiveId` diferente; exclusões exigem confirmação; o modal superior deve receber o foco e ficar acima do anterior.
10. **Atualização PWA sob demanda:** sincronizar `APP_VERSION`, `version.json`, `CACHE_NAME`, interface e documentação; só ativar atualização após ação confirmada e estado salvo.

## Arquivos a observar

- `index.html`: composição semântica da interface e relatório.
- `assets/app.js`: `CHECKLIST_SCHEMA`, `appState`, dados, histórico, marcações e gestos.
- `assets/export.js`: seleção do conteúdo impresso.
- `assets/print-and-custom.css`: mídia `screen` e regras `@media print` A4 (separar cuidadosamente).
- `service-worker.js`, `manifest.webmanifest`, `version.json`: instalação, cache e atualização.
- `tests/`: regressões JavaScript e auditoria Python.
- `docs/`: guias atuais; `CHANGELOG.md`: histórico de alterações.

## Processo obrigatório de mudança

1. Ler documentação pertinente e inspecionar os módulos afetados.
2. Criar branch (`feature/`, `fix/` ou `docs/`) com a `main` atualizada e árvore limpa.
3. Implementar mudança mínima sem alterar dados armazenados nem PDF fora do escopo.
4. Rodar `git diff --check`, `node --check` nos scripts tocados, testes da área e `python tests/test_static.py`.
5. Homologar manualmente desktop, mobile, offline, histórico, croqui e impressão quando houver mudança de interface ou estado.
6. Atualizar README, `docs/`, `CHANGELOG.md` e versão **somente se houver release nova**; mudança apenas documental pode permanecer na versão estável atual.
7. Publicar branch e realizar merge/tag somente após revisão e homologação — não afirmar que houve deploy sem evidência.

## Regras específicas de impressão

- A4 retrato, sem elementos da UI e com separação cuidadosa de páginas.
- Evitar títulos órfãos, seções extensas inquebráveis e corte de assinaturas, imagens ou itens.
- Resumo das vistas: contagens numéricas discretas, não pills com `ponto(s)`.
- Garantir conversão/renderização de assinaturas antes de `window.print()`.
- O zoom na tela **não** deve alterar escala e posição do laudo.

**Não copie regras antigas de versão do README histórico:** recursos retirados (PNG, múltiplos botões de PDF e cores por índice) não fazem parte do contrato atual.
