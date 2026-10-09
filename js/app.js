import { CodeEditor } from './editor.js';
import { PreviewController } from './preview.js';
import { loadProject, saveProject, loadSettings, saveSettings } from './storage.js';
import { validateHtmlLocal, validateCssLocal, validateHtmlW3C } from './validator.js';
import { debounce, downloadText, buildStandaloneHtml, ensureExternalStylesheet, minifyCss, formatCss, formatHtml, encodeProject, decodeProject } from './utils.js';

const DEFAULT_PROJECT = {
  html: `<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Meu projeto</title>
</head>
<body>
  <main class="hero">
    <p class="eyebrow">OpenHTML Studio</p>
    <h1>Edite HTML5 e CSS3 em tempo real.</h1>
    <p>Escreva no editor e veja o resultado instantaneamente ao lado.</p>
    <button type="button">Começar</button>
  </main>
</body>
</html>`,
  css: `:root {
  font-family: system-ui, sans-serif;
  color: #172033;
  background: #f5f7fb;
}

body {
  margin: 0;
  min-height: 100vh;
  display: grid;
  place-items: center;
}

.hero {
  width: min(720px, calc(100% - 40px));
  padding: 48px;
  border-radius: 24px;
  background: white;
  box-shadow: 0 24px 80px rgba(23, 32, 51, .14);
}

.eyebrow {
  color: #7c3aed;
  font-weight: 800;
  letter-spacing: .08em;
  text-transform: uppercase;
}

h1 {
  font-size: clamp(2rem, 7vw, 4rem);
  line-height: 1;
}

button {
  border: 0;
  border-radius: 12px;
  padding: 12px 18px;
  background: #7c3aed;
  color: white;
  font-weight: 700;
}`
};

const state = {
  project: loadFromHash() || loadProject() || structuredClone(DEFAULT_PROJECT),
  activeLanguage: 'html',
  theme: loadSettings().theme || 'dark',
  device: loadSettings().device || 'desktop',
  dirty: false,
  installPrompt: null
};

const $ = selector => document.querySelector(selector);
const $$ = selector => [...document.querySelectorAll(selector)];

const elements = {
  textarea: $('#codeEditor'), highlight: $('#highlightLayer'), lines: $('#lineNumbers'), autocomplete: $('#autocomplete'),
  frame: $('#previewFrame'), saveStatus: $('#saveStatus'), toast: $('#toast'), runtimeConsole: $('#runtimeConsole'), validationConsole: $('#validationConsole'),
  modal: $('#exportModal'), fileInput: $('#fileInput'), deviceFrame: $('#deviceFrame'), previewSize: $('#previewSize'), grid: $('#gridOverlay')
};

let toastTimer;
function showToast(message) {
  clearTimeout(toastTimer);
  elements.toast.textContent = message;
  elements.toast.hidden = false;
  toastTimer = setTimeout(() => elements.toast.hidden = true, 2400);
}

function setStatus(message, type = '') {
  elements.saveStatus.textContent = message;
  elements.saveStatus.className = `status-pill${type ? ` is-${type}` : ''}`;
}

function appendConsole(level, message, target = elements.runtimeConsole) {
  if (target.querySelector('.console-empty')) target.innerHTML = '';
  const line = document.createElement('div');
  line.className = `console-line ${level}`;
  const label = document.createElement('span');
  label.className = 'level';
  label.textContent = level;
  const text = document.createElement('span');
  text.className = 'message';
  text.textContent = message;
  line.append(label, text);
  target.appendChild(line);
  target.scrollTop = target.scrollHeight;
}

function resetConsole(target, message) {
  target.innerHTML = `<div class="console-empty">${message}</div>`;
}

resetConsole(elements.runtimeConsole, 'Console pronto. Erros e mensagens do preview aparecerão aqui.');
resetConsole(elements.validationConsole, 'Execute a validação para analisar HTML e CSS.');

const preview = new PreviewController(elements.frame, (level, message) => appendConsole(level, message));
const autosave = debounce(() => persist(false), 700);
const previewDebounced = debounce(() => renderPreview(), 340);

const editor = new CodeEditor({
  textarea: elements.textarea,
  highlightLayer: elements.highlight,
  lineNumbers: elements.lines,
  autocomplete: elements.autocomplete,
  onChange(value) {
    state.project[state.activeLanguage] = value;
    state.dirty = true;
    setStatus('Editando…', 'busy');
    autosave();
    previewDebounced();
  }
});

function loadFromHash() {
  const hash = location.hash;
  const marker = '#project=';
  if (!hash.startsWith(marker)) return null;
  try {
    const decoded = decodeProject(hash.slice(marker.length));
    if (typeof decoded.html !== 'string' || typeof decoded.css !== 'string') return null;
    return decoded;
  } catch (error) {
    console.warn('Hash de projeto inválido.', error);
    return null;
  }
}

function switchLanguage(language) {
  state.activeLanguage = language;
  editor.setLanguage(language);
  editor.setValue(state.project[language], { silent: true });
  $$('.file-tab').forEach(btn => {
    const active = btn.dataset.language === language;
    btn.classList.toggle('is-active', active);
    btn.setAttribute('aria-selected', active);
  });
  $('#languageBadge').textContent = language === 'html' ? 'HTML5' : 'CSS3';
  editor.focus();
}

function renderPreview() {
  preview.render(state.project.html, state.project.css);
  setStatus(state.dirty ? 'Auto-salvo' : 'Atualizado', 'success');
  setTimeout(() => setStatus('Pronto'), 1200);
}

function persist(feedback = true) {
  const ok = saveProject(state.project);
  state.dirty = !ok;
  if (ok) {
    setStatus('Salvo', 'success');
    if (feedback) showToast('Projeto salvo neste navegador.');
  } else {
    setStatus('Falha ao salvar');
    if (feedback) showToast('Não foi possível salvar no armazenamento local.');
  }
}

function applyTheme(theme) {
  state.theme = theme;
  document.body.dataset.theme = theme;
  $('#themeBtn').textContent = theme === 'dark' ? '☀' : '☾';
  $('#themeBtn').title = theme === 'dark' ? 'Ativar tema claro' : 'Ativar tema escuro';
  saveSettings({ ...loadSettings(), theme });
  editor.render();
}

function applyDevice(device) {
  state.device = device;
  elements.deviceFrame.className = `device-frame device-${device}`;
  elements.previewSize.textContent = device === 'mobile' ? '390px' : device === 'tablet' ? '768px' : 'Desktop';
  $$('.device-btn').forEach(btn => btn.classList.toggle('is-active', btn.dataset.device === device));
  saveSettings({ ...loadSettings(), device });
}

function showPanel(panel) {
  if (matchMedia('(min-width: 961px)').matches) return;
  const map = { editor: '#editorRegion', preview: '#previewRegion', console: '#consoleRegion' };
  $$('.pane').forEach(p => p.classList.remove('is-visible'));
  $(map[panel]).classList.add('is-visible');
  $$('.panel-tab').forEach(btn => {
    const active = btn.dataset.panel === panel;
    btn.classList.toggle('is-active', active);
    btn.setAttribute('aria-selected', active);
  });
}

function setExportModal(open) {
  elements.modal.hidden = !open;
  elements.modal.setAttribute('aria-hidden', String(!open));
  document.body.classList.toggle('modal-open', open);

  if (open) {
    requestAnimationFrame(() => $('#exportSingleBtn')?.focus());
  } else {
    $('#exportBtn')?.focus();
  }
}

function openExportModal() { setExportModal(true); }
function closeExportModal() { setExportModal(false); }

function runValidation(localOnly = true) {
  resetConsole(elements.validationConsole, '');
  elements.validationConsole.innerHTML = '';
  const htmlIssues = validateHtmlLocal(state.project.html);
  const cssIssues = validateCssLocal(state.project.css);
  appendConsole('info', 'HTML — validação local', elements.validationConsole);
  htmlIssues.forEach(i => appendConsole(i.level, i.message, elements.validationConsole));
  appendConsole('info', 'CSS — validação local', elements.validationConsole);
  cssIssues.forEach(i => appendConsole(i.level, i.message, elements.validationConsole));
  selectConsoleTab('validation');
  if (localOnly) showToast('Validação local concluída.');
}

async function runW3CValidation() {
  runValidation(false);
  appendConsole('info', 'Consultando W3C HTML Checker…', elements.validationConsole);
  try {
    const issues = await validateHtmlW3C(state.project.html);
    appendConsole('info', 'W3C — HTML', elements.validationConsole);
    issues.forEach(i => appendConsole(i.level, i.message, elements.validationConsole));
    showToast('Validação W3C concluída.');
  } catch (error) {
    appendConsole('warn', `W3C indisponível: ${error.message}. A validação local continua disponível offline.`, elements.validationConsole);
    showToast('Não foi possível acessar o W3C.');
  }
}

function selectConsoleTab(tab) {
  const validation = tab === 'validation';
  elements.runtimeConsole.hidden = validation;
  elements.validationConsole.hidden = !validation;
  $$('.console-tab').forEach(btn => {
    const active = btn.dataset.consoleTab === tab;
    btn.classList.toggle('is-active', active);
    btn.setAttribute('aria-selected', active);
  });
}

function updateActiveEditor() {
  editor.setValue(state.project[state.activeLanguage], { silent: true });
  renderPreview();
}

function importFiles(files) {
  [...files].forEach(file => {
    const reader = new FileReader();
    reader.onerror = () => showToast(`Falha ao importar ${file.name}.`);
    reader.onload = () => {
      const text = String(reader.result || '');
      if (/\.css$/i.test(file.name) || file.type === 'text/css') state.project.css = text;
      else if (/\.html?$/i.test(file.name) || file.type === 'text/html') state.project.html = text;
      else return;
      updateActiveEditor();
      persist(false);
      showToast(`${file.name} importado.`);
    };
    reader.readAsText(file, 'utf-8');
  });
}

function shareProject() {
  const encoded = encodeProject(state.project);
  const url = `${location.origin}${location.pathname}#project=${encoded}`;
  if (url.length > 12000) {
    showToast('Projeto grande demais para compartilhamento confortável por URL. Exporte os arquivos.');
    return;
  }
  history.replaceState(null, '', `#project=${encoded}`);
  navigator.clipboard?.writeText(location.href).then(() => showToast('Link do projeto copiado.')).catch(() => showToast('Link criado na barra de endereço.'));
}

function registerEvents() {
  $$('.file-tab').forEach(btn => btn.addEventListener('click', () => switchLanguage(btn.dataset.language)));
  $$('.panel-tab').forEach(btn => btn.addEventListener('click', () => showPanel(btn.dataset.panel)));
  $$('.device-btn').forEach(btn => btn.addEventListener('click', () => applyDevice(btn.dataset.device)));
  $$('.console-tab').forEach(btn => btn.addEventListener('click', () => selectConsoleTab(btn.dataset.consoleTab)));

  $('#saveBtn').addEventListener('click', () => persist(true));
  $('#refreshBtn').addEventListener('click', renderPreview);
  $('#themeBtn').addEventListener('click', () => applyTheme(state.theme === 'dark' ? 'light' : 'dark'));
  $('#gridToggle').addEventListener('change', event => elements.grid.hidden = !event.target.checked);
  $('#clearConsoleBtn').addEventListener('click', () => resetConsole(elements.runtimeConsole, 'Console limpo.'));
  $('#validateBtn').addEventListener('click', () => runValidation(true));
  $('#w3cBtn').addEventListener('click', runW3CValidation);

  $('#newProjectBtn').addEventListener('click', () => {
    if (!confirm('Criar um novo projeto? O conteúdo atual continuará salvo localmente se já tiver sido auto-salvo.')) return;
    state.project = structuredClone(DEFAULT_PROJECT);
    history.replaceState(null, '', location.pathname + location.search);
    updateActiveEditor();
    persist(false);
    showToast('Novo projeto criado.');
  });

  $('#importBtn').addEventListener('click', () => elements.fileInput.click());
  elements.fileInput.addEventListener('change', () => { importFiles(elements.fileInput.files); elements.fileInput.value = ''; });

  $('#exportBtn').addEventListener('click', openExportModal);
  elements.modal.addEventListener('click', event => { if (event.target === elements.modal || event.target.closest('[data-close-modal]')) closeExportModal(); });
  $('#exportSingleBtn').addEventListener('click', () => {
    downloadText('index.html', buildStandaloneHtml(state.project.html, state.project.css), 'text/html;charset=utf-8');
    closeExportModal();
  });
  $('#exportSeparateBtn').addEventListener('click', () => {
    downloadText('index.html', ensureExternalStylesheet(state.project.html), 'text/html;charset=utf-8');
    setTimeout(() => downloadText('styles.css', state.project.css, 'text/css;charset=utf-8'), 120);
    closeExportModal();
  });

  $('#formatBtn').addEventListener('click', () => {
    state.project[state.activeLanguage] = state.activeLanguage === 'html' ? formatHtml(state.project.html) : formatCss(state.project.css);
    updateActiveEditor();
    persist(false);
    showToast(`${state.activeLanguage.toUpperCase()} formatado.`);
  });
  $('#minifyBtn').addEventListener('click', () => {
    state.project.css = minifyCss(state.project.css);
    if (state.activeLanguage === 'css') editor.setValue(state.project.css, { silent: true });
    renderPreview(); persist(false); showToast('CSS minificado.');
  });
  $('#shareBtn').addEventListener('click', shareProject);

  document.addEventListener('keydown', event => {
    if (event.ctrlKey && event.key.toLowerCase() === 's') { event.preventDefault(); persist(true); }
    if (event.ctrlKey && event.key === 'Enter') { event.preventDefault(); renderPreview(); }
    if (event.key === 'Escape' && !elements.modal.hidden) closeExportModal();
  });

  window.addEventListener('beforeunload', () => saveProject(state.project));
  window.addEventListener('resize', () => {
    if (matchMedia('(min-width: 961px)').matches) $$('.pane').forEach(p => p.classList.add('is-visible'));
    else showPanel($('.panel-tab.is-active')?.dataset.panel || 'editor');
  });

  window.addEventListener('beforeinstallprompt', event => {
    event.preventDefault();
    state.installPrompt = event;
    $('#installBtn').hidden = false;
  });
  $('#installBtn').addEventListener('click', async () => {
    if (!state.installPrompt) return;
    state.installPrompt.prompt();
    await state.installPrompt.userChoice;
    state.installPrompt = null;
    $('#installBtn').hidden = true;
  });
}

async function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) return;
  if (location.protocol !== 'https:' && location.hostname !== 'localhost' && location.hostname !== '127.0.0.1') return;
  try { await navigator.serviceWorker.register('./sw.js'); }
  catch (error) { console.warn('Service Worker não registrado.', error); }
}

function init() {
  // Estado defensivo: o modal de exportação deve iniciar sempre fechado.
  setExportModal(false);
  applyTheme(state.theme);
  applyDevice(state.device);
  switchLanguage('html');
  registerEvents();
  renderPreview();
  registerServiceWorker();
  if (location.hash.startsWith('#project=')) showToast('Projeto carregado a partir da URL.');
}

init();
