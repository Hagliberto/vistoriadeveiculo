## v1.4.2 — Croqui após dados e navegação lateral
- Croqui de avarias reposicionado imediatamente depois dos dados, antes das categorias de checklist, também no dock e na sidebar.
- Sidebar refinada com grupos, detalhes contextuais, estado ativo sincronizado e foco acessível; permanece recolhida no desktop.
- Nenhuma mudança nos dados persistidos ou nos campos da vistoria.

## v1.4.1 — Ajustes de apresentação
- Retirado o pill de crédito da navbar inferior; o desenvolvedor continua identificado no painel Configurações.
- Ocultado o card introdutório "Uma vistoria completa" em telas de até 599px; permanece no desktop.
- Incrementado o versionamento do PWA e preservada a correção de navegação Cloudflare Pages no Service Worker.

## v1.4.0 — Atualização sob demanda
- Verificação de `version.json` no servidor, com consulta sem cache e comparação semântica de versão.
- Banner com botão **Atualizar** aparece apenas quando a versão publicada é mais recente.
- Atualização opcional com salvamento do rascunho antes da troca do service worker.
- Botão de verificação manual em Configurações; checagem ao abrir, ao reconectar, ao retornar à aba e periodicamente.
- Service worker deixa versões futuras aguardando confirmação (não força reload) e não guarda `version.json` no cache.
- Hospedagem HTTPS ou localhost necessária para atualização automática; modo `file://` continua disponível sem atualização remota.

# Histórico de versões

## 1.2.0 — 14/11/2026

### Evolução da interface
- Checklist desktop em duas colunas ou lista, com alternância persistida; maior aproveitamento da largura e expanders independentes.
- Navegação lateral recolhida por padrão, com abertura opcional; navbar inferior por ícones em desktop e mobile.
- Central de configurações com **Versão 1.2.0** e identificação do desenvolvedor **Hagliberto Alves de Oliveira** em pill.
- Seis ações **Tudo conforme**, uma por categoria, com proteção para status de avaria/N/A; observações e fotografias preservadas.
- Ações globais (expandir, recolher, histórico, todos conformes, limpar, gerar PDF) movidas do minicard para a appbar.

### Correções e estabilidade
- Corrigida a sobreposição de modais: confirmações ficam acima do histórico, modal inferior fica inativo e o foco retorna ao controle correto.
- Correção do histórico que sobrescrevia entradas com o mesmo protocolo: cada arquivamento gera um ID próprio e horário de registro; múltiplas versões coexistem.
- Operações de gravação e exclusão de histórico enfileiradas para evitar perda por corrida assíncrona.
- Histórico exibe contagem e data/hora de cada registro; exclusão identifica o arquivo, não somente o índice visual.
- Ícones SVG novos empacotados para funcionar sem conexão; cache PWA atualizado.
- Impressão A4 preservada em fluxo linear, sem elementos da appbar, dock, sidebar ou ações por categoria.
- Teste adicional de regressão: cinco salvamentos da mesma vistoria, exclusão pontual, migração e ação individual de checklist.

### Homologação
- Testes automatizados de sintaxe, regras de negócio e integridade estática foram executados.
- Validação visual em navegadores e prévia real de PDF devem ser conferidas no equipamento de destino: neste ambiente o navegador bloqueou o acesso a `file://` e `localhost`.


## 1.0.0 — 14/11/2026

### Consolidação
- Base mais completa dos dois `index.html`, com 47 verificações, fotos, croqui, assinaturas, histórico e laudo A4.
- Regras do `AGENTS.md` adotadas para estrutura, identidade visual, nove expansores fechados, ergonomia e apresentação do laudo.

### Evolução técnica
- Estilos Tailwind e ícones SVG empacotados: interface sem CDN nem carregamento externo.
- Arquitetura estática com `manifest.webmanifest` e `service-worker.js` para uso PWA e cache offline (em HTTPS/localhost).
- Separação de `index.html`, `assets/app.css`, `assets/print-and-custom.css`, `assets/icons.js` e `assets/app.js`.
- Compatibilidade dos dados v2/v3 e histórico, com armazenamento IndexedDB para dados completos e recuperação via localStorage.
- Normalização defensiva de backups JSON e proteção contra injeção HTML na listagem de laudos e pontos.
- Correção na restauração visual das assinaturas e na reinicialização dos formulários sem duplicar os listeners da tela estática.
- Exportação de backup JSON, rascunho salvo automaticamente, status de gravação e tratamento de falhas ao arquivar registros.
- Melhorias em acessibilidade: rótulos, modais com foco, tecla Esc, anúncio de alertas, foco visível e navegação por teclado no croqui.
- Assinaturas exportadas como imagem, quadro estático de dados e fotos incluídas no anexo do PDF quando existentes.
- Testes unitários e estruturais básicos incluídos no pacote.

### Observações
- A liberação final deve passar por inspeção visual manual em navegador e no pré-visualizador do PDF, especialmente com imagens e documentos grandes.
- Nenhuma alteração foi aplicada diretamente no Git remoto.

## v1.3.0 — Navegação e controle por categoria
- Ícones coloridos na sidebar e navbar, preservando indicadores de seleção.
- Apenas um expander aberto por vez (inclusive na grade desktop).
- Ações reunidas no dock do celular; PDF não se repete na appbar.
- Botão por categoria alterna Conforme ↔ Não verificado, mantendo observações e fotos.
- Cache offline atualizado para v1.3.0.
