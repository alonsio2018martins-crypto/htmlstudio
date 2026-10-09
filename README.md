# OpenHTML Studio v1.0.2

<p align="center"><img src="assets/openhtml-studio-logo-large.png" alt="OpenHTML Studio" width="720"></p>

Editor open source de HTML5 e CSS3 que roda 100% no navegador, sem backend.

> **v1.0.2:** corrige o modal de exportação que podia permanecer visível e bloquear a interface. A versão também melhora a atualização do cache PWA para evitar carregar arquivos antigos.

## Destaques

- Abas HTML e CSS.
- Destaque de sintaxe sem dependências externas.
- Numeração de linhas, auto-indentação, autocomplete e Emmet básico.
- Preview instantâneo com debounce em `iframe sandbox`.
- Console de `console.log`, `warn`, `error`, erros de JavaScript e Promises do preview.
- Validação local HTML/CSS e validação HTML opcional pelo W3C.
- Temas claro/escuro.
- Auto-save em `localStorage`.
- Importação e exportação.
- Exportação em HTML único ou HTML + CSS separados.
- Responsivo para desktop/mobile.
- Atalhos Ctrl+S, Ctrl+Enter, Ctrl+/ e Ctrl+Espaço.
- Emulação mobile/tablet/desktop.
- Formatação, minificação CSS, grade visual e compartilhamento via URL.
- PWA offline após o primeiro carregamento via localhost/HTTPS.
- Sem frameworks e sem CDN no núcleo.

## Como executar no Windows

1. Extraia o ZIP.
2. Dê duplo clique em `RUN_LOCAL.bat`.
3. O navegador abrirá `http://localhost:8080/`.
4. Para instalar como aplicativo, use o botão **Instalar** quando o navegador disponibilizá-lo ou o menu de instalação do Chrome/Edge.
5. Depois do primeiro carregamento, os arquivos do aplicativo ficam em cache e a PWA funciona offline.

> Use `RUN_LOCAL.bat` em vez de abrir `index.html` diretamente. O projeto usa módulos ES e a PWA/Service Worker exige um contexto seguro; `http://localhost` é aceito pelos navegadores modernos para desenvolvimento e funcionamento local.

## Emmet básico

Digite uma abreviação e pressione `Tab`:

- `!`
- `div`
- `.card`
- `section.hero`
- `#app`
- `ul>li*3`
- `a`
- `img`
- `input`
- `link:css`

O Emmet incluído é intencionalmente leve, não é uma implementação completa do projeto Emmet oficial.

## Estrutura

```text
OpenHTML_Studio_v1.0.2/
├─ index.html
├─ manifest.webmanifest
├─ sw.js
├─ RUN_LOCAL.bat
├─ LICENSE
├─ README.md
├─ assets/
│  ├─ openhtml-studio-logo.png
│  ├─ openhtml-studio-logo-large.png
│  ├─ openhtml-studio-logo-source.png
│  └─ openhtml-studio-icon-source.png
├─ css/
│  └─ app.css
├─ js/
│  ├─ app.js
│  ├─ editor.js
│  ├─ preview.js
│  ├─ storage.js
│  ├─ utils.js
│  └─ validator.js
├─ icons/
│  ├─ favicon.ico
│  ├─ icon-32.png
│  ├─ icon-64.png
│  ├─ icon-180.png
│  ├─ icon-192.png
│  ├─ icon-256.png
│  └─ icon-512.png
└─ scripts/
   └─ server.ps1
```

## Segurança do preview

O preview usa `iframe` com `sandbox` e **não** habilita `allow-same-origin`. Isso reduz o acesso do conteúdo executado ao documento principal. Scripts do código HTML podem ser executados dentro do sandbox para permitir testes e captura de erros.

## Validação

A validação local é rápida e offline, mas não pretende reproduzir integralmente a especificação normativa. O botão **W3C** usa o serviço oficial HTML Checker quando houver conexão de rede.

## Licença

MIT. Veja `LICENSE`.
