# Croqui de avarias — nove vistas

[Documentação](README.md) / Croqui

## Vistas disponíveis

| ID armazenado | Nome exibido | Arquivo |
| --- | --- | --- |
| `front` | Frontal (0°) | `assets/croqui/front.webp` |
| `front-left` | Dianteira esquerda (45°) | `front-left.webp` |
| `left` | Lateral esquerda (90°) | `left.webp` |
| `rear-left` | Traseira esquerda (135°) | `rear-left.webp` |
| `rear` | Traseira (180°) | `rear.webp` |
| `rear-right` | Traseira direita (225°) | `rear-right.webp` |
| `right` | Lateral direita (270°) | `right.webp` |
| `front-right` | Dianteira direita (315°) | `front-right.webp` |
| `top` | Superior (zênite) | `top.webp` |

A navegação representa **imagens fixas**, não um modelo tridimensional com rotação contínua. A vista superior não faz parte da sequência angular horizontal.

## Marcação e navegação

- Selecione o tipo: **Amassado** (vermelho), **Risco** (azul), **Quebrado** (laranja), **Faltando** (roxo).
- Toque curto sobre a imagem para marcar, inclusive com zoom ativo.
- Pinça com dois dedos amplia/reduz (100%–300%). Com zoom ativo, arrastar move a imagem; com 100%, arrastar lateralmente troca de vista.
- O ícone de tela cheia amplia a área de trabalho; o comportamento do navegador depende do suporte à Fullscreen API.
- Arraste e pinça não devem adicionar pontos. Cada ponto pode ter descrição, região sugerida e fotografia.
- O número diferencia pontos; **a cor identifica a natureza da avaria**, não a ordem de inclusão.

## Dados antigos e orientação física

Os pontos ficam vinculados a `view`, coordenadas percentuais e demais informações. Após substituir imagens, confira visualmente os pontos de laudos antigos; sua posição relativa pode não representar exatamente a mesma peça.

**Ponto crítico:** existem dúvidas históricas sobre a nomenclatura esquerda/direita de algumas imagens. A direção correta é a **do veículo**, não a perspectiva do observador. Não renomeie imagens nem faça migrações automáticas sem confirmação das vistas e teste de regressão — isso pode associar uma avaria ao lado errado.

## No PDF

As vistas e respectivas marcações aparecem no laudo quando a seção Croqui é incluída. A impressão não deve herdar o zoom/pan da interface. O resumo por vista utiliza contagem **numérica discreta**.
