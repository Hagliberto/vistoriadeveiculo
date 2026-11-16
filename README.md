# Vistoria Veicular — Checklist Digital

[![Versão](https://img.shields.io/badge/vers%C3%A3o-1.5.10-00549a)](CHANGELOG.md) [![PWA](https://img.shields.io/badge/PWA-offline--first-148566)](docs/instalacao.md) [![Tecnologia](https://img.shields.io/badge/stack-HTML%20%7C%20CSS%20%7C%20JavaScript-334155)](docs/arquitetura.md) [![Licença](https://img.shields.io/badge/licen%C3%A7a-n%C3%A3o%20declarada-64748b)](#licenciamento)

**Aplicativo de vistoria veicular para desktop e celular**, com checklist, registro de avarias em nove vistas, fotografias, assinaturas, histórico local, backups e laudo A4 configurável.

**[Abrir aplicativo](https://vistoriadeveiculo.pages.dev/)** · **[Guia de uso](docs/guia-de-uso.md)** · **[Instalação](docs/instalacao.md)** · **[Documentação completa](docs/README.md)** · **[Histórico de versões](CHANGELOG.md)**

> **Versão estável documentada:** `v1.5.10` · **Plataforma:** aplicação web estática / PWA · **Desenvolvimento:** Hagliberto Alves de Oliveira. O armazenamento é local ao navegador; o aplicativo não é um sistema de sincronização em nuvem.

## Visão geral

| Recurso | Descrição |
| --- | --- |
| Identificação | Dados do veículo, vistoriador, motorista, tipo e data da inspeção |
| Checklist | **47 verificações em 6 categorias**; Conforme, Avaria e N/A; comentários e evidências |
| Croqui | **9 vistas** técnicas, avarias por tipo com cores próprias, zoom, pinça, arraste e tela cheia |
| Assinaturas | Registro de assinatura de vistoriador e motorista |
| Histórico e backups | Arquivamento de vistorias e importação/exportação de JSON |
| Laudo | **Gerar PDF / Imprimir**, usando impressão nativa A4 e inclusão seletiva de seções |
| PWA | Interface utilizável offline após pré-carregamento em HTTPS/localhost |

## Comece em poucos passos

1. Acesse **[vistoriadeveiculo.pages.dev](https://vistoriadeveiculo.pages.dev/)** ou [execute o projeto localmente](docs/instalacao.md).
2. Abra **Dados** e identifique o veículo; preencha o **Checklist** com os resultados da inspeção.
3. No **Croqui**, escolha um tipo de avaria, selecione a vista e toque no local. Anexe fotos, detalhes e assinaturas quando necessário.
4. Arquive a vistoria no **Histórico** e, para cópia externa, exporte seu **JSON**.
5. Use **Exportar → Gerar PDF / Imprimir**. Identificação e observações são obrigatórias; croqui, checklist, fotos e assinaturas podem ser selecionados.

> **Atenção à privacidade:** fotos, dados pessoais, assinaturas e histórico ficam no perfil do navegador. Faça backups externos protegidos. O PDF é um documento de vistoria, não um certificado de assinatura digital ICP-Brasil.

## Como funciona

```text
index.html ── Interface
assets/app.js ── Estado, checklist, croqui, histórico e persistência
assets/export.js ── Seleção das seções a imprimir
assets/app.css + assets/print-and-custom.css ── Layout e A4
assets/croqui/*.webp ── Nove imagens do veículo
service-worker.js + manifest.webmanifest + version.json ── PWA
```

Sem backend obrigatório, build ou dependências externas em tempo de execução. A persistência usa **IndexedDB**, com apoio de **localStorage**. O Service Worker não substitui backup de dados.

## Documentação

| Documento | Conteúdo |
| --- | --- |
| [Índice da documentação](docs/README.md) | Navegação central e perfis de leitura |
| [Guia de uso](docs/guia-de-uso.md) | Fluxos de inspeção e navegação |
| [Instalação e publicação](docs/instalacao.md) | Execução local, PWA e Cloudflare Pages |
| [Croqui e avarias](docs/croqui.md) | Nove vistas, marcações, gestos e orientações |
| [PDF e impressão](docs/pdf-e-impressao.md) | Exportação seletiva e conferência do laudo |
| [Dados, backups e privacidade](docs/dados-e-privacidade.md) | Armazenamento, histórico, segurança e migração |
| [Arquitetura](docs/arquitetura.md) | Organização técnica, dependências e regras críticas |
| [Testes e homologação](docs/testes.md) | Testes automatizados e cenários manuais |
| [Contribuição e releases](docs/contribuicao.md) | Padrão Git, versionamento e critérios de entrega |
| [Solução de problemas](docs/solucao-de-problemas.md) | Cache, PDF, dados e erros frequentes |
| [Histórico de versões](CHANGELOG.md) | Evolução por release |
| [AGENTS.md](AGENTS.md) | Instruções para agentes e mantenedores |

## Testar

Requisitos opcionais: **Node.js** (arquivos `.mjs`) e **Python 3**.

```powershell
node --check assets/app.js
node --check assets/export.js
node --check service-worker.js
node tests/test_state.mjs
node tests/test_history.mjs
node tests/test_mobile_layout_1510.mjs
node tests/test_updates.mjs
python tests/test_static.py
```

Veja [testes e homologação](docs/testes.md) para executar a suíte completa. Testes unitários não substituem a validação no navegador, principalmente impressão A4 e gestos móveis.

## Limitações e uso responsável

- Não há sincronização automática entre computadores ou entre `file://`, `localhost` e o domínio publicado.
- O acesso offline depende do pré-carregamento e das políticas do navegador.
- A correspondência entre nomes de algumas vistas do croqui e o lado físico do veículo exige **conferência humana** antes do uso oficial; não renomeie IDs de vistas sem migração e validação dos pontos existentes.
- O histórico e JSON exportado podem conter informações pessoais, fotos e assinaturas: trate-os como arquivos sensíveis.

## Licenciamento

**Nenhuma licença de software foi declarada nos arquivos desta entrega.** A publicação do código no GitHub, por si só, não concede uma licença de reutilização. O responsável pelo repositório pode adicionar um arquivo `LICENSE` quando definir os termos.
