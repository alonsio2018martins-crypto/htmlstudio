# Changelog

## 1.0.2 — Modal & Cache Hotfix
- Corrigido o atributo `hidden` para modais, toasts e demais elementos ocultáveis (`[hidden] { display: none !important; }`).
- Modal de exportação agora abre e fecha de forma defensiva, com `aria-hidden` sincronizado.
- Corrigido o caso em que a tela de exportação aparecia ao iniciar e parecia bloquear todos os cliques.
- Service Worker atualizado para cache `v1.0.2` e estratégia network-first, reduzindo risco de carregar versões antigas.
- CSS e módulo principal recebem parâmetro de versão para atualização imediata.
- `RUN_LOCAL.bat` abre a URL versionada da v1.0.2.

## 1.0.1 — Branding Update
- Novo ícone oficial do OpenHTML Studio integrado ao favicon e à instalação PWA.
- Novo logotipo oficial integrado ao cabeçalho responsivo.
- Adicionados ícones em múltiplas resoluções para navegador, PWA e Apple touch icon.
- Logo incluído no cache offline do Service Worker.
- README atualizado com a identidade visual oficial.

## 1.0.0 - 2026-10-08

- Editor HTML5/CSS3 sem dependências externas no núcleo.
- Highlight, linhas, auto-indentação, autocomplete e Emmet básico.
- Preview sandbox com debounce e console capturado.
- Validação local e integração opcional com W3C HTML Checker.
- Auto-save, importação, exportação, formatação e minificação.
- Temas, dispositivos, grade, compartilhamento por URL e PWA offline.
- Servidor local PowerShell para Windows.
