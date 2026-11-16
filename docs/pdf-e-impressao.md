# Laudo A4: PDF e impressão

[Documentação](README.md) / PDF

## Uma única ação oficial

Abra **Exportar laudo** e selecione **Gerar PDF / Imprimir**. A aplicação usa o HTML/CSS de impressão em A4; o navegador oferece **Salvar como PDF** ou uma impressora física. Não existem dois motores de PDF nem opção PNG na versão atual.

## Conteúdo selecionável

| Bloco | Regra |
| --- | --- |
| Identificação do veículo | **Sempre incluída** |
| Observações gerais | **Sempre incluídas**, inclusive quando não preenchidas |
| Croqui de avarias | Opcional |
| Checklist | Opcional: selecionar categorias e, se desejado, somente itens verificados |
| Fotografias/evidências | Opcionais |
| Assinaturas | Opcionais |

As preferências de impressão não excluem dados da vistoria nem modificam o histórico.

## Recomendações para exportar

1. Preencha e revise a vistoria. Confira imagens, vistas, descrições e assinaturas.
2. Escolha apenas o conteúdo necessário no modal.
3. No diálogo de impressão do Chrome/Edge, utilize papel **A4**, orientação **retrato**, uma página por folha e, quando necessário, **gráficos em segundo plano**.
4. Desative os cabeçalhos e rodapés do navegador se aparecerem no laudo.
5. Confira todas as páginas — especialmente croqui, fotografias e quebras de checklist — antes de salvar ou imprimir.

O número de páginas depende do conteúdo incluído e do mecanismo de impressão do navegador. PDF salvo via diálogo do navegador não é compartilhado automaticamente pelo aplicativo: anexe manualmente o arquivo no destino.

## Garantias de layout que devem ser preservadas

- Não dividir itens individuais do checklist ou cortar assinaturas/fotos.
- Não inserir navegação, botões, ferramentas ou controles do PWA no relatório.
- Mostrar o croqui com as **imagens atuais**, não com o desenho antigo de exemplo.
- Resumo por vista com contadores discretos, sem pill nem rótulo `ponto(s)`.
- Zoom e posição temporária da interface não devem mudar o desenho impresso.

Para critérios técnicos, veja [AGENTS.md](../AGENTS.md) e [arquitetura](arquitetura.md).
