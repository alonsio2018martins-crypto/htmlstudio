# Contribuindo

Obrigado por contribuir com o OpenHTML Studio.

## Princípios

- Preserve o funcionamento sem backend.
- Evite dependências externas quando uma solução simples local for suficiente.
- Mantenha acessibilidade por teclado e ARIA.
- Comente em português apenas decisões importantes; prefira nomes de funções claros.
- Não introduza telemetria, rastreamento ou chamadas de rede obrigatórias.

## Fluxo sugerido

1. Crie um fork e uma branch por alteração.
2. Execute o projeto com `RUN_LOCAL.bat`.
3. Teste HTML, CSS, preview, importação, exportação e modo offline.
4. Rode `node --check js/*.js` e `node --check sw.js` se tiver Node.js instalado.
5. Abra um Pull Request explicando problema, solução e como testou.
