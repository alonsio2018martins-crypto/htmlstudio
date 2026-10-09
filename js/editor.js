// Editor leve, sem dependências externas. Mantém textarea e camada de destaque sincronizadas.

const HTML_TAGS = [
  'html','head','body','main','section','article','aside','header','footer','nav','div','span','p','h1','h2','h3','h4','h5','h6',
  'a','img','picture','source','figure','figcaption','ul','ol','li','dl','dt','dd','table','thead','tbody','tfoot','tr','th','td',
  'form','label','input','textarea','button','select','option','fieldset','legend','details','summary','dialog','template','canvas',
  'video','audio','track','iframe','blockquote','pre','code','strong','em','small','mark','time','progress','meter','br','hr','meta','link','title'
];

const CSS_PROPS = [
  'display','position','top','right','bottom','left','z-index','width','height','min-width','min-height','max-width','max-height',
  'margin','margin-top','margin-right','margin-bottom','margin-left','padding','padding-top','padding-right','padding-bottom','padding-left',
  'color','background','background-color','background-image','border','border-radius','box-shadow','opacity','overflow','overflow-x','overflow-y',
  'font','font-family','font-size','font-weight','line-height','letter-spacing','text-align','text-decoration','text-transform','white-space',
  'flex','flex-direction','flex-wrap','justify-content','align-items','align-content','gap','grid','grid-template-columns','grid-template-rows',
  'place-items','transform','transition','animation','cursor','object-fit','aspect-ratio','filter','backdrop-filter','visibility','content'
];

const HTML_SNIPPETS = {
  '!': '<!doctype html>\n<html lang="pt-BR">\n<head>\n  <meta charset="utf-8">\n  <meta name="viewport" content="width=device-width, initial-scale=1">\n  <title>Documento</title>\n</head>\n<body>\n  \n</body>\n</html>',
  'a': '<a href="#"></a>',
  'img': '<img src="" alt="">',
  'input': '<input type="text" name="" id="">',
  'btn': '<button type="button"></button>',
  'button': '<button type="button"></button>',
  'link:css': '<link rel="stylesheet" href="styles.css">',
  'meta:vp': '<meta name="viewport" content="width=device-width, initial-scale=1">',
  'lorem': 'Lorem ipsum dolor sit amet, consectetur adipisicing elit.'
};

function escapeHtml(value) {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function highlightHtml(source) {
  const tokens = source.match(/<!--[\s\S]*?-->|<![^>]*>|<\/?[A-Za-z][^>]*>|[^<]+|</g) || [];

  return tokens.map(token => {
    if (token.startsWith('<!--')) return `<span class="tok-comment">${escapeHtml(token)}</span>`;
    if (/^<!doctype/i.test(token)) return `<span class="tok-keyword">${escapeHtml(token)}</span>`;
    if (!token.startsWith('<')) return escapeHtml(token);

    const match = token.match(/^(<\/?)([A-Za-z][\w:-]*)([\s\S]*?)(\/?>)$/);
    if (!match) return escapeHtml(token);
    const [, open, tag, attrs, close] = match;
    let highlightedAttrs = '';
    let cursor = 0;
    const attrRe = /(\s+)([^\s=/>]+)(?:\s*=\s*("[^"]*"|'[^']*'|[^\s>]+))?/g;
    let attrMatch;
    while ((attrMatch = attrRe.exec(attrs))) {
      highlightedAttrs += escapeHtml(attrs.slice(cursor, attrMatch.index));
      highlightedAttrs += escapeHtml(attrMatch[1]);
      highlightedAttrs += `<span class="tok-attr">${escapeHtml(attrMatch[2])}</span>`;
      if (attrMatch[3] !== undefined) {
        highlightedAttrs += `<span class="tok-punct">=</span><span class="tok-string">${escapeHtml(attrMatch[3])}</span>`;
      }
      cursor = attrRe.lastIndex;
    }
    highlightedAttrs += escapeHtml(attrs.slice(cursor));
    return `${escapeHtml(open)}<span class="tok-tag">${escapeHtml(tag)}</span>${highlightedAttrs}${escapeHtml(close)}`;
  }).join('');
}

function highlightCss(source) {
  const chunks = source.split(/(\/\*[\s\S]*?\*\/)/g);
  let depth = 0;
  return chunks.map(chunk => {
    if (chunk.startsWith('/*')) return `<span class="tok-comment">${escapeHtml(chunk)}</span>`;

    const parts = chunk.split(/([{}])/g);
    return parts.map(part => {
      if (part === '{') { depth++; return '<span class="tok-punct">{</span>'; }
      if (part === '}') { depth = Math.max(0, depth - 1); return '<span class="tok-punct">}</span>'; }
      if (!part) return '';

      if (depth === 0) {
        const trimmed = part.trim();
        if (!trimmed) return escapeHtml(part);
        if (trimmed.startsWith('@')) {
          return escapeHtml(part).replace(/(@[\w-]+)/, '<span class="tok-keyword">$1</span>');
        }
        const leading = part.match(/^\s*/)?.[0] || '';
        const trailing = part.match(/\s*$/)?.[0] || '';
        return `${escapeHtml(leading)}<span class="tok-selector">${escapeHtml(part.trim())}</span>${escapeHtml(trailing)}`;
      }

      let output = '';
      let cursor = 0;
      const declRe = /(^|;)(\s*)(--?[\w-]+|[A-Za-z][\w-]*)(\s*:\s*)([^;]*)(?=;|$)/g;
      let match;
      while ((match = declRe.exec(part))) {
        output += escapeHtml(part.slice(cursor, match.index));
        output += escapeHtml(match[1] || '');
        output += escapeHtml(match[2] || '');
        output += `<span class="tok-prop">${escapeHtml(match[3])}</span>`;
        output += `<span class="tok-punct">${escapeHtml(match[4])}</span>`;
        output += `<span class="tok-value">${escapeHtml(match[5])}</span>`;
        cursor = declRe.lastIndex;
      }
      output += escapeHtml(part.slice(cursor));
      return output;
    }).join('');
  }).join('');
}

function currentLineInfo(textarea) {
  const value = textarea.value;
  const pos = textarea.selectionStart;
  const start = value.lastIndexOf('\n', pos - 1) + 1;
  const endIndex = value.indexOf('\n', pos);
  const end = endIndex === -1 ? value.length : endIndex;
  return { start, end, text: value.slice(start, end), beforeCursor: value.slice(start, pos) };
}

function indentationOf(line) {
  return (line.match(/^\s*/) || [''])[0];
}

function replaceSelection(textarea, replacement, selectionOffset = replacement.length) {
  const { selectionStart: start, selectionEnd: end, value } = textarea;
  textarea.value = value.slice(0, start) + replacement + value.slice(end);
  const next = start + selectionOffset;
  textarea.setSelectionRange(next, next);
  textarea.dispatchEvent(new Event('input', { bubbles: true }));
}

function parseSimpleEmmet(abbr) {
  if (!abbr || abbr.length > 80) return null;
  if (HTML_SNIPPETS[abbr]) return HTML_SNIPPETS[abbr];

  // Suporte leve: tag, .classe, #id, tag.classe#id, filho > e multiplicação *N.
  const makeNode = token => {
    const mult = token.match(/\*(\d+)$/);
    let count = mult ? Math.min(Number(mult[1]), 20) : 1;
    if (mult) token = token.slice(0, mult.index);

    const tagMatch = token.match(/^[a-zA-Z][\w-]*/);
    const tag = tagMatch ? tagMatch[0] : 'div';
    const idMatch = token.match(/#([\w-]+)/);
    const classMatches = [...token.matchAll(/\.([\w-]+)/g)].map(m => m[1]);
    const attrs = `${idMatch ? ` id="${idMatch[1]}"` : ''}${classMatches.length ? ` class="${classMatches.join(' ')}"` : ''}`;
    const voidTag = ['img','input','br','hr','meta','link','source','area','base','embed','param','track','wbr'].includes(tag);
    const unit = voidTag ? `<${tag}${attrs}>` : `<${tag}${attrs}></${tag}>`;
    return Array.from({ length: count }, () => unit).join('\n');
  };

  if (abbr.includes('>')) {
    const [parentToken, childToken] = abbr.split('>', 2);
    if (!parentToken || !childToken) return null;
    const parent = makeNode(parentToken);
    const child = makeNode(childToken);
    if (!parent || !child || !parent.includes(`</`)) return null;
    return parent.replace(/<\/([\w-]+)>$/, `\n  ${child.replace(/\n/g, '\n  ')}\n</$1>`);
  }

  if (/^[.#a-zA-Z][\w.#*-]*$/.test(abbr)) return makeNode(abbr);
  return null;
}

export class CodeEditor {
  constructor({ textarea, highlightLayer, lineNumbers, autocomplete, onChange }) {
    this.textarea = textarea;
    this.highlightCode = highlightLayer.querySelector('code');
    this.highlightLayer = highlightLayer;
    this.lineNumbers = lineNumbers;
    this.autocomplete = autocomplete;
    this.onChange = onChange;
    this.language = 'html';
    this.items = [];
    this.activeIndex = 0;
    this.bind();
  }

  bind() {
    this.textarea.addEventListener('input', () => {
      this.render();
      this.onChange?.(this.getValue());
      this.maybeSuggest();
    });
    this.textarea.addEventListener('scroll', () => this.syncScroll());
    this.textarea.addEventListener('keydown', event => this.handleKeydown(event));
    this.textarea.addEventListener('click', () => this.hideAutocomplete());
    window.addEventListener('resize', () => this.syncScroll());
  }

  setLanguage(language) {
    this.language = language;
    this.textarea.setAttribute('aria-label', language === 'html' ? 'Editor HTML' : 'Editor CSS');
    this.render();
    this.hideAutocomplete();
  }

  setValue(value, { silent = false } = {}) {
    this.textarea.value = value ?? '';
    this.render();
    if (!silent) this.onChange?.(this.getValue());
  }

  getValue() { return this.textarea.value; }
  focus() { this.textarea.focus(); }

  render() {
    const value = this.getValue();
    this.highlightCode.innerHTML = this.language === 'html' ? highlightHtml(value) : highlightCss(value);
    const lines = Math.max(1, value.split('\n').length);
    this.lineNumbers.textContent = Array.from({ length: lines }, (_, i) => i + 1).join('\n');
    this.syncScroll();
  }

  syncScroll() {
    this.highlightLayer.scrollTop = this.textarea.scrollTop;
    this.highlightLayer.scrollLeft = this.textarea.scrollLeft;
    this.lineNumbers.scrollTop = this.textarea.scrollTop;
  }

  handleKeydown(event) {
    if (this.autocomplete.hidden === false) {
      if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
        event.preventDefault();
        this.moveAutocomplete(event.key === 'ArrowDown' ? 1 : -1);
        return;
      }
      if (event.key === 'Enter') {
        event.preventDefault();
        this.acceptAutocomplete();
        return;
      }
      if (event.key === 'Escape') {
        event.preventDefault();
        this.hideAutocomplete();
        return;
      }
    }

    if (event.ctrlKey && event.key === ' ') {
      event.preventDefault();
      this.showAutocomplete(true);
      return;
    }

    if (event.ctrlKey && event.key === '/') {
      event.preventDefault();
      this.toggleComment();
      return;
    }

    if (event.key === 'Tab') {
      event.preventDefault();
      if (this.language === 'html' && this.tryEmmet()) return;
      replaceSelection(this.textarea, '  ');
      return;
    }

    if (event.key === 'Enter') {
      const { text, beforeCursor } = currentLineInfo(this.textarea);
      const base = indentationOf(text);
      const opensHtml = this.language === 'html' && /<([a-z][\w-]*)(?:\s[^>]*)?>[^<]*$/i.test(beforeCursor) && !/<(?:br|hr|img|input|meta|link|source|area|base|embed|param|track|wbr)\b/i.test(beforeCursor);
      const opensCss = this.language === 'css' && /\{[^}]*$/.test(beforeCursor);
      if (opensHtml || opensCss) {
        event.preventDefault();
        replaceSelection(this.textarea, `\n${base}  `);
      }
    }
  }

  tryEmmet() {
    const pos = this.textarea.selectionStart;
    const before = this.textarea.value.slice(0, pos);
    const match = before.match(/([^\s<>]+)$/);
    if (!match) return false;
    const abbr = match[1];
    const expanded = parseSimpleEmmet(abbr);
    if (!expanded) return false;
    const start = pos - abbr.length;
    const value = this.textarea.value;
    const lineStart = value.lastIndexOf('\n', start - 1) + 1;
    const base = indentationOf(value.slice(lineStart, start));
    const indented = expanded.split('\n').map((line, i) => i ? base + line : line).join('\n');
    this.textarea.setSelectionRange(start, pos);
    replaceSelection(this.textarea, indented);
    return true;
  }

  toggleComment() {
    const ta = this.textarea;
    const value = ta.value;
    let start = value.lastIndexOf('\n', Math.max(0, ta.selectionStart - 1)) + 1;
    let endIndex = value.indexOf('\n', ta.selectionEnd);
    let end = endIndex === -1 ? value.length : endIndex;
    const block = value.slice(start, end);
    let replacement;

    if (this.language === 'html') {
      const trimmed = block.trim();
      if (trimmed.startsWith('<!--') && trimmed.endsWith('-->')) {
        replacement = block.replace('<!--', '').replace(/-->\s*$/, '');
      } else {
        replacement = `<!-- ${block} -->`;
      }
    } else {
      const trimmed = block.trim();
      if (trimmed.startsWith('/*') && trimmed.endsWith('*/')) {
        replacement = block.replace('/*', '').replace(/\*\/\s*$/, '');
      } else {
        replacement = `/* ${block} */`;
      }
    }

    ta.setSelectionRange(start, end);
    replaceSelection(ta, replacement);
    ta.setSelectionRange(start, start + replacement.length);
  }

  maybeSuggest() {
    const { beforeCursor } = currentLineInfo(this.textarea);
    const match = beforeCursor.match(/[\w-]{2,}$/);
    if (!match) return this.hideAutocomplete();
    this.showAutocomplete(false);
  }

  showAutocomplete(explicit) {
    const pos = this.textarea.selectionStart;
    const before = this.textarea.value.slice(0, pos);
    const match = before.match(/[\w-]*$/);
    const query = (match?.[0] || '').toLowerCase();
    const source = this.language === 'html' ? HTML_TAGS : CSS_PROPS;
    const items = source.filter(item => explicit || item.startsWith(query)).filter(item => item !== query).slice(0, 12);
    if (!items.length) return this.hideAutocomplete();
    this.items = items;
    this.activeIndex = 0;
    this.autocomplete.innerHTML = '';
    items.forEach((item, index) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = `autocomplete-item${index === 0 ? ' is-active' : ''}`;
      button.setAttribute('role', 'option');
      button.innerHTML = `<span>${item}</span><small>${this.language.toUpperCase()}</small>`;
      button.addEventListener('mousedown', e => e.preventDefault());
      button.addEventListener('click', () => { this.activeIndex = index; this.acceptAutocomplete(); });
      this.autocomplete.appendChild(button);
    });
    this.autocomplete.hidden = false;
  }

  moveAutocomplete(delta) {
    this.activeIndex = (this.activeIndex + delta + this.items.length) % this.items.length;
    [...this.autocomplete.children].forEach((node, i) => node.classList.toggle('is-active', i === this.activeIndex));
    this.autocomplete.children[this.activeIndex]?.scrollIntoView({ block: 'nearest' });
  }

  acceptAutocomplete() {
    const item = this.items[this.activeIndex];
    if (!item) return;
    const pos = this.textarea.selectionStart;
    const before = this.textarea.value.slice(0, pos);
    const match = before.match(/[\w-]*$/);
    const start = pos - (match?.[0].length || 0);
    this.textarea.setSelectionRange(start, pos);
    replaceSelection(this.textarea, item);
    this.hideAutocomplete();
  }

  hideAutocomplete() {
    this.autocomplete.hidden = true;
    this.items = [];
  }
}
