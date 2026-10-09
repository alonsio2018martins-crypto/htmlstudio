// Validação local rápida. Não substitui uma validação normativa completa do W3C.

const VOID_TAGS = new Set(['area','base','br','col','embed','hr','img','input','link','meta','param','source','track','wbr']);

export function validateHtmlLocal(html) {
  const issues = [];
  const doc = new DOMParser().parseFromString(html, 'text/html');
  const parserError = doc.querySelector('parsererror');
  if (parserError) issues.push({ level: 'error', message: parserError.textContent.trim() });

  const doctype = /^\s*<!doctype\s+html>/i.test(html);
  if (!doctype) issues.push({ level: 'warn', message: 'Recomendado: adicione <!doctype html> no início do documento.' });

  // Checagem estrutural simples de abertura/fechamento, ignorando comentários e scripts/styles.
  const cleaned = html
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<script\b[\s\S]*?<\/script>/gi, '')
    .replace(/<style\b[\s\S]*?<\/style>/gi, '');
  const stack = [];
  const re = /<\/?([a-zA-Z][\w:-]*)(?:\s[^<>]*?)?>/g;
  let match;
  while ((match = re.exec(cleaned))) {
    const raw = match[0];
    const tag = match[1].toLowerCase();
    if (VOID_TAGS.has(tag) || raw.endsWith('/>')) continue;
    if (!raw.startsWith('</')) stack.push({ tag, index: match.index });
    else {
      const top = stack[stack.length - 1];
      if (!top) issues.push({ level: 'error', message: `Tag de fechamento </${tag}> sem abertura correspondente.` });
      else if (top.tag === tag) stack.pop();
      else {
        const found = stack.map(x => x.tag).lastIndexOf(tag);
        if (found === -1) issues.push({ level: 'error', message: `Tag </${tag}> não corresponde à tag aberta <${top.tag}>.` });
        else stack.splice(found, 1);
      }
    }
  }
  stack.slice(-10).forEach(item => issues.push({ level: 'error', message: `Tag <${item.tag}> parece não ter fechamento.` }));

  doc.querySelectorAll('img').forEach((img, i) => {
    if (!img.hasAttribute('alt')) issues.push({ level: 'warn', message: `Imagem ${i + 1}: atributo alt ausente.` });
  });
  doc.querySelectorAll('html').forEach(node => {
    if (!node.getAttribute('lang')) issues.push({ level: 'warn', message: 'A tag <html> deveria declarar o atributo lang.' });
  });
  doc.querySelectorAll('input').forEach((input, i) => {
    const type = (input.getAttribute('type') || 'text').toLowerCase();
    if (!['hidden','submit','button','reset','image'].includes(type) && !input.getAttribute('aria-label') && !input.id) {
      issues.push({ level: 'warn', message: `Input ${i + 1}: considere associar um <label> ou aria-label.` });
    }
  });

  if (!issues.length) issues.push({ level: 'success', message: 'Nenhum problema estrutural evidente encontrado no HTML.' });
  return issues;
}

export function validateCssLocal(css) {
  const issues = [];
  let braces = 0;
  let inComment = false;
  for (let i = 0; i < css.length; i++) {
    const pair = css.slice(i, i + 2);
    if (!inComment && pair === '/*') { inComment = true; i++; continue; }
    if (inComment && pair === '*/') { inComment = false; i++; continue; }
    if (inComment) continue;
    if (css[i] === '{') braces++;
    if (css[i] === '}') braces--;
    if (braces < 0) { issues.push({ level: 'error', message: 'Há uma chave } sem abertura correspondente.' }); braces = 0; }
  }
  if (inComment) issues.push({ level: 'error', message: 'Comentário CSS não foi fechado com */.' });
  if (braces > 0) issues.push({ level: 'error', message: `Faltam ${braces} chave(s) } no CSS.` });

  // Valida declarações utilizando CSSStyleDeclaration do próprio navegador.
  const blocks = [...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)];
  blocks.forEach((block, blockIndex) => {
    const declarations = block[2].split(';').map(s => s.trim()).filter(Boolean);
    declarations.forEach(decl => {
      const colon = decl.indexOf(':');
      if (colon === -1) {
        issues.push({ level: 'error', message: `Bloco ${blockIndex + 1}: declaração sem ":" → ${decl}` });
        return;
      }
      const prop = decl.slice(0, colon).trim();
      const value = decl.slice(colon + 1).trim();
      if (!prop.startsWith('--')) {
        const test = document.createElement('div').style;
        test.setProperty(prop, value);
        if (!test.getPropertyValue(prop) && value && !prop.startsWith('-')) {
          issues.push({ level: 'warn', message: `CSS possivelmente inválido ou não suportado: ${prop}: ${value}` });
        }
      }
    });
  });

  if (!issues.length) issues.push({ level: 'success', message: 'Nenhum problema estrutural evidente encontrado no CSS.' });
  return issues;
}

export async function validateHtmlW3C(html) {
  const response = await fetch('https://validator.w3.org/nu/?out=json', {
    method: 'POST',
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
    body: html
  });
  if (!response.ok) throw new Error(`W3C respondeu com HTTP ${response.status}.`);
  const data = await response.json();
  const messages = (data.messages || []).map(item => ({
    level: item.type === 'error' ? 'error' : 'warn',
    message: `${item.message}${item.lastLine ? ` (linha ${item.lastLine})` : ''}`
  }));
  return messages.length ? messages : [{ level: 'success', message: 'W3C: HTML válido, sem mensagens.' }];
}
