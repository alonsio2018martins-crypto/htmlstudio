export function debounce(fn, wait = 250) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), wait);
  };
}

export function downloadText(filename, content, type = 'text/plain;charset=utf-8') {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function buildStandaloneHtml(html, css) {
  const style = `<style>\n${css}\n</style>`;
  if (/<\/head>/i.test(html)) return html.replace(/<\/head>/i, `${style}\n</head>`);
  if (/<head[\s>]/i.test(html)) return html.replace(/<head([^>]*)>/i, `<head$1>\n${style}`);
  if (/<!doctype|<html[\s>]/i.test(html)) return html.replace(/<html([^>]*)>/i, `<html$1>\n<head>${style}</head>`);
  return `<!doctype html>\n<html lang="pt-BR">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1">\n${style}\n</head>\n<body>\n${html}\n</body>\n</html>`;
}

export function ensureExternalStylesheet(html, filename = 'styles.css') {
  const tag = `<link rel="stylesheet" href="${filename}">`;
  if (/rel=["']stylesheet["']/i.test(html)) return html;
  if (/<\/head>/i.test(html)) return html.replace(/<\/head>/i, `  ${tag}\n</head>`);
  if (/<head[\s>]/i.test(html)) return html.replace(/<head([^>]*)>/i, `<head$1>\n  ${tag}`);
  return `<!doctype html>\n<html lang="pt-BR">\n<head>\n  <meta charset="utf-8">\n  <meta name="viewport" content="width=device-width, initial-scale=1">\n  ${tag}\n</head>\n<body>\n${html}\n</body>\n</html>`;
}

export function minifyCss(css) {
  return css
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\s+/g, ' ')
    .replace(/\s*([{}:;,>+~])\s*/g, '$1')
    .replace(/;}/g, '}')
    .trim();
}

export function formatCss(css) {
  let depth = 0;
  let output = '';
  const indent = () => '  '.repeat(Math.max(0, depth));
  const cleaned = css.replace(/\s+/g, ' ').trim();
  for (let i = 0; i < cleaned.length; i++) {
    const ch = cleaned[i];
    if (ch === '{') {
      output = output.trimEnd() + ' {\n';
      depth++;
      output += indent();
    } else if (ch === ';') {
      output = output.trimEnd() + ';\n' + indent();
    } else if (ch === '}') {
      depth--;
      output = output.trimEnd() + '\n' + indent() + '}\n' + indent();
    } else output += ch;
  }
  return output.trim();
}

export function formatHtml(html) {
  const normalized = html.replace(/>\s*</g, '><').trim();
  const tokens = normalized.match(/<!--[\s\S]*?-->|<![^>]+>|<[^>]+>|[^<]+/g) || [];
  const voidTags = new Set(['area','base','br','col','embed','hr','img','input','link','meta','param','source','track','wbr']);
  let depth = 0;
  const lines = [];
  for (const token of tokens) {
    const trimmed = token.trim();
    if (!trimmed) continue;
    const close = trimmed.match(/^<\/([\w:-]+)/);
    const open = trimmed.match(/^<([\w:-]+)/);
    if (close) depth = Math.max(0, depth - 1);
    lines.push('  '.repeat(depth) + trimmed);
    if (open && !trimmed.startsWith('</') && !trimmed.startsWith('<!') && !trimmed.endsWith('/>') && !voidTags.has(open[1].toLowerCase())) depth++;
  }
  return lines.join('\n');
}

export function encodeProject(project) {
  const json = JSON.stringify(project);
  const bytes = new TextEncoder().encode(json);
  let binary = '';
  bytes.forEach(b => binary += String.fromCharCode(b));
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function decodeProject(encoded) {
  const padded = encoded.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((encoded.length + 3) % 4);
  const binary = atob(padded);
  const bytes = Uint8Array.from(binary, c => c.charCodeAt(0));
  return JSON.parse(new TextDecoder().decode(bytes));
}
