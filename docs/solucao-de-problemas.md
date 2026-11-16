# Solução de problemas

[Documentação](README.md) / Problemas frequentes

## O aplicativo não atualiza

Confira `version.json` e o cache do navegador. Use o botão de atualização exibido quando uma versão nova for detectada. **Não limpe os dados do site sem exportar backups**; isso pode excluir o histórico local.

## O croqui aparece em branco

Confirme a existência de `assets/croqui/*.webp` e o caminho relativo. No DevTools, veja erros de rede. Em uso offline, o pacote precisa ter sido carregado antes da desconexão.

## O ponto fica na peça errada

Verifique qual vista foi utilizada, a posição do zoom e o lado físico do veículo. Imagens antigas substituídas podem exigir revisão de pontos restaurados. Não troque nomes de arquivos ou IDs armazenados como correção rápida.

## Não consigo marcar com zoom

Um toque curto deve adicionar um ponto; arraste desloca e pinça amplia. Se o dispositivo interpreta tudo como arraste, teste com outro navegador e reporte dispositivo, versão e passos reproduzíveis.

## O PDF não está igual à tela

O PDF usa a composição **A4**, não captura da tela. Verifique a seleção de seções, gráficos de segundo plano, escala, cabeçalhos/rodapés e imagens reais do croqui. Confirme o número de páginas antes de salvar.

## Histórico/fotos não aparecem em outro aparelho

Dados locais não são sincronizados. Use JSON de backup de cada vistoria. `localhost`, `file://` e domínio HTTPS têm áreas de armazenamento diferentes.

## Falha de salvamento ou pouco espaço

Faça cópia externa imediata das vistorias importantes, remova arquivos dispensáveis conforme procedimento aprovado e verifique a quota do navegador; muitas fotos podem ocupar bastante espaço.

## O que incluir ao reportar um erro

Versão do app, sistema operacional, navegador, dimensões da tela, origem da instalação, passos, comportamento esperado/observado, console (sem dados pessoais) e captura anonimizada.
