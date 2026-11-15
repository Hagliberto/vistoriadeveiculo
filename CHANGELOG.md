## v1.5.3 — Croqui técnico e navegação limpa

- Substituição do desenho por traçado técnico vetorial em preto e branco com vidros, painéis e rodas detalhados.
- Remoção dos cartões redundantes de zoom, legenda e navegação; barra compacta única.
- Correção do texto sobreposto dos indicadores de visão.
- Mantidas cinco vistas, navegação por setas e deslizamento, marcas coloridas, PDF A4 e dados locais.

## v1.5.2 — Visualizador de cinco vistas com carro redesenhado

- Croqui com **uma vista ativa por vez**; setas, pontos e gesto horizontal trocam a vista.
- Ilustrações SVG mais detalhadas: carroceria, iluminação, vidros, frisos, rodas e profundidade.
- Controles de rotação e zoom mais legíveis no desktop e mobile; sem sobreposição.
- Todas as cinco vistas continuam disponíveis na impressão/PDF A4.
- Metatag mobile-web-app-capable adicionada.

## v1.5.1 — Croqui 360°, zoom discreto e visual refinado do veículo

- Navegação **360°** por visões com setas discretas e pontos de seleção.
- **Zoom do croqui** com ícones compactos e interface menos poluída.
- Removida a seleção manual superior de região/peça; agora a **região é sugerida automaticamente** conforme o ponto clicado na visão ativa.
- Lista de avarias ficou mais limpa, exibindo a **região detectada** de forma direta.
- Ajustes visuais no croqui para um **veículo com aparência mais refinada**.
- PDF continua com resumo por visão e compatibilidade com o fluxo de impressão oficial.

## v1.5.0 — Croqui profissional com região da peça, zoom e resumo por visão no PDF

- Seleção guiada de **região / peça** conforme a visão ativa do veículo.
- Novo **zoom do croqui** (ampliar, reduzir e resetar) para facilitar marcações mais precisas.
- **Legenda das visões** diretamente na interface para leitura mais rápida.
- Cada ponto agora pode guardar, além do tipo e descrição, a **região do veículo**.
- Lista de avarias mostra **tipo + visão + região** e permite editar a região posteriormente.
- PDF/impressão com **resumo do croqui por visão**, facilitando auditoria e conferência.
- PWA atualizado para **v1.5.0** com teste específico do croqui profissional.

## v1.4.9 — Croqui em múltiplas visões e desenho aprimorado

- Croqui redesenhado com cinco visões do veículo: **superior, lateral esquerda, lateral direita, frontal e traseira**.
- Cada marcação passa a ser registrada na visão correspondente, facilitando a localização exata da avaria.
- Lista de avarias agora exibe, além da cor e da numeração, a **visão** em que o dano foi lançado.
- Contadores por visão ajudam a identificar rapidamente onde há pontos registrados.
- Impressão/PDF oficial preserva o novo croqui multiângulo.
- PWA atualizado para v1.4.9 com teste específico de regressão para múltiplas visões.

## v1.4.8 — Marcadores coloridos no croqui

- Cada ponto usa uma cor distinta conforme sua posição na lista (12 tons contrastantes, com variação cromática para pontos adicionais).
- Número no croqui, número e tipo da avaria na lista e borda lateral compartilham a mesma identidade cromática.
- Ao excluir um ponto, os demais são renumerados e suas cores são recalculadas sem alterar descrições, fotos ou IDs persistidos.
- Impressão A4 preserva as cores dos marcadores e da lista.
- PWA atualizado para v1.4.9; teste de regressão específico para cores e renumeração.

## v1.4.7 — Simplificação da central de exportação

- Removida a ação redundante **Compartilhar PDF oficial**, idêntica a **Salvar como PDF**.
- Central com três opções: **Salvar como PDF**, **Baixar em PNG** e **Imprimir**.
- PDF oficial continua usando o layout A4 da impressão; após salvar, o arquivo pode ser enviado por WhatsApp/e-mail.
- Atualizados versão do PWA e testes de regressão.

## v1.4.6 — PDF oficial único para salvar, imprimir e compartilhar

- Salvar como PDF, Imprimir e Compartilhar PDF oficial utilizam o **mesmo laudo HTML/CSS A4** via impressão do navegador.
- Removido o segundo gerador PDF rasterizado, que produzia cabeçalho, croqui e paginação diferentes do laudo aprovado.
- Compartilhar PDF abre o diálogo do navegador; escolha **Salvar como PDF** e depois anexe o arquivo gerado no WhatsApp/e-mail. O navegador não disponibiliza ao JavaScript o PDF emitido por sua impressora virtual.
- Baixar PNG permanece como opção independente de imagem, explicitamente não equivalente ao PDF de impressão.
- Versão e cache atualizados, mantendo histórico, salvamento e dados locais.

## v1.4.5 — PDF visualmente idêntico ao laudo impresso

- O comando Salvar como PDF reutiliza a renderização de impressão A4, sem redesenhar o laudo em canvas.
- O navegador permite escolher Salvar como PDF e preserva a tipografia e a paginação da impressão.
- Compartilhar continua priorizando o PDF rasterizado compatível com a Web Share API; sua apresentação pode divergir.
- Versão e cache offline atualizados para 1.4.5.

## v1.4.4 — Compartilhamento PDF e imagens nítidas

- Compartilhar prioriza PDF A4; utiliza PNG se o dispositivo não aceitar PDF; se não houver compartilhamento, baixa PDF.
- PDF gerado diretamente, offline, com páginas em alta resolução e quebras preferenciais entre itens.
- PNG com escala de renderização de até 2x e limite preventivo de memória.
- Cancelamento do compartilhamento não provoca download involuntário; impressão nativa preservada.
- Cache do PWA e versão atualizados para 1.4.4.

## v1.4.3 — Central de exportação e compartilhamento
- Appbar simplificada: retirados Abrir primeira seção, Fechar todas e Histórico. Histórico permanece no dock e sidebar.
- Novo ícone Exportar com modal acessível: PDF (Salvar como PDF no navegador), PNG (imagem completa do relatório), compartilhamento nativo de arquivo e impressão A4.
- Botão PDF do dock e ação de exportação da sidebar centralizados no modal; preservada validação do laudo e segurança de dados offline.
- PNG contém identificação, checklist, croqui com pontos, observações, assinaturas e fotografias; erro explícito caso imagem exceda limites do navegador.
- Atualizado cache de PWA e versão para 1.4.3.

## v1.4.3 — Croqui após dados e navegação lateral
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
