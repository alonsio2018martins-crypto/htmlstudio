// Preview isolado em iframe sandbox. O bridge captura console e erros do documento executado.

const BRIDGE = `
<script>
(() => {
  const SOURCE = 'openhtml-studio-preview';
  const send = (level, args) => {
    try {
      const values = Array.from(args || []).map(value => {
        if (typeof value === 'string') return value;
        if (value instanceof Error) return value.stack || value.message;
        try { return JSON.stringify(value, null, 2); } catch { return String(value); }
      });
      parent.postMessage({ source: SOURCE, level, message: values.join(' ') }, '*');
    } catch {}
  };
  ['log','info','warn','error'].forEach(level => {
    const original = console[level]?.bind(console);
    console[level] = (...args) => { send(level, args); original?.(...args); };
  });
  addEventListener('error', event => send('error', [event.message + (event.lineno ? ' (linha ' + event.lineno + ')' : '')]));
  addEventListener('unhandledrejection', event => send('error', ['Promise rejeitada:', event.reason]));
  send('info', ['Preview atualizado.']);
})();
</script>`;

function injectIntoDocument(html, css) {
  const style = `<style id="openhtml-studio-css">${css.replace(/<\/style/gi, '<\\/style')}</style>`;
  const headPayload = `<meta name="viewport" content="width=device-width,initial-scale=1">\n<base target="_blank">\n${style}`;

  if (/<!doctype|<html[\s>]/i.test(html)) {
    let output = html;
    if (/<head[\s>]/i.test(output)) {
      output = output.replace(/<head([^>]*)>/i, `<head$1>${headPayload}`);
    } else {
      output = output.replace(/<html([^>]*)>/i, `<html$1><head>${headPayload}</head>`);
    }
    if (/<\/body>/i.test(output)) output = output.replace(/<\/body>/i, `${BRIDGE}</body>`);
    else output += BRIDGE;
    return output;
  }

  return `<!doctype html><html lang="pt-BR"><head>${headPayload}</head><body>${html}${BRIDGE}</body></html>`;
}

export class PreviewController {
  constructor(frame, onConsole) {
    this.frame = frame;
    this.onConsole = onConsole;
    this.timer = null;
    window.addEventListener('message', event => {
      if (event.source !== this.frame.contentWindow) return;
      if (event.data?.source !== 'openhtml-studio-preview') return;
      this.onConsole?.(event.data.level || 'log', event.data.message || '');
    });
  }

  schedule(html, css, delay = 320) {
    clearTimeout(this.timer);
    this.timer = setTimeout(() => this.render(html, css), delay);
  }

  render(html, css) {
    clearTimeout(this.timer);
    this.frame.srcdoc = injectIntoDocument(html, css);
  }
}
