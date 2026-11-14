# Histórico de versões

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
