const PROJECT_KEY = 'openhtml-studio:project:v1';
const SETTINGS_KEY = 'openhtml-studio:settings:v1';

export function loadProject() {
  try {
    const raw = localStorage.getItem(PROJECT_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (error) {
    console.warn('Não foi possível ler o projeto salvo.', error);
    return null;
  }
}

export function saveProject(project) {
  try {
    localStorage.setItem(PROJECT_KEY, JSON.stringify({ ...project, savedAt: new Date().toISOString() }));
    return true;
  } catch (error) {
    console.warn('Não foi possível salvar no localStorage.', error);
    return false;
  }
}

export function loadSettings() {
  try {
    return JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}');
  } catch {
    return {};
  }
}

export function saveSettings(settings) {
  try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings)); } catch { /* sem ação */ }
}
