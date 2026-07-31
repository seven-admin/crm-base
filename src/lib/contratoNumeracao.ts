// Numeração automática de cláusulas e seleção de blocos opcionais no contrato.
//
// Fluxo na geração (ver NexaContratoNovo): o HTML do modelo passa por
//   aplicarSelecaoBlocos → renumerarClausulas → resolveVariaveis
// Assim, incluir/remover um bloco renumera as cláusulas automaticamente, porque
// a numeração é calculada por último, sobre o HTML final.
//
// Tokens usados no editor (delimitador [[ ]] para não colidir com as variáveis {{ }}):
//   [[clausula]] → 1, 2, 3… (reinicia a contagem de itens)
//   [[item]]     → N.M dentro da cláusula atual (1.1, 1.2, 2.1…)

function escapeAttr(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/** Envolve o HTML de um bloco num marcador que sobrevive ao editor (nó blocoContrato). */
export function wrapBloco(nome: string, html: string): string {
  return `<div data-bloco-nome="${escapeAttr(nome)}">${html}</div>`;
}

export interface BlocoDetectado {
  index: number;
  nome: string;
}

/** Lista os blocos marcados no HTML, na ordem do documento. */
export function extrairBlocos(html: string): BlocoDetectado[] {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  return Array.from(doc.querySelectorAll('[data-bloco-nome]')).map((el, index) => ({
    index,
    nome: el.getAttribute('data-bloco-nome') || `Bloco ${index + 1}`,
  }));
}

/** Remove do HTML os blocos cujos índices estão em `excluidos`. */
export function aplicarSelecaoBlocos(html: string, excluidos: Set<number>): string {
  if (excluidos.size === 0) return html;
  const doc = new DOMParser().parseFromString(html, 'text/html');
  const blocos = Array.from(doc.querySelectorAll('[data-bloco-nome]'));
  blocos.forEach((el, i) => { if (excluidos.has(i)) el.remove(); });
  return doc.body.innerHTML;
}

/** Substitui os tokens [[clausula]] / [[item]] por números sequenciais. */
export function renumerarClausulas(html: string): string {
  let clausula = 0;
  let item = 0;
  return html.replace(/\[\[(clausula|item)\]\]/g, (_, tok: string) => {
    if (tok === 'clausula') {
      clausula++;
      item = 0;
      return String(clausula);
    }
    item++;
    return `${clausula || 1}.${item}`;
  });
}

/** Pipeline de blocos + numeração (a resolução de variáveis fica a cargo do chamador). */
export function prepararConteudo(html: string, excluidos: Set<number>): string {
  return renumerarClausulas(aplicarSelecaoBlocos(html, excluidos));
}

// ponytail: self-check — roda com `node --loader tsx` ou via import em teste manual.
export function _demo() {
  const html =
    '<h3>CLÁUSULA [[clausula]]ª</h3><p>[[item]] a</p><p>[[item]] b</p>' +
    '<div data-bloco-nome="Opcional"><h3>CLÁUSULA [[clausula]]ª</h3><p>[[item]] x</p></div>' +
    '<h3>CLÁUSULA [[clausula]]ª</h3>';

  const todos = renumerarClausulas(html);
  console.assert(todos.includes('CLÁUSULA 1ª') && todos.includes('1.1') && todos.includes('1.2'), 'clausula 1 + itens');
  console.assert(todos.includes('CLÁUSULA 2ª') && todos.includes('2.1'), 'clausula 2 dentro do bloco');
  console.assert(todos.includes('CLÁUSULA 3ª'), 'clausula 3');

  // Excluindo o bloco opcional (índice 0), a 3ª cláusula vira a 2ª.
  const semBloco = prepararConteudo(html, new Set([0]));
  console.assert(!semBloco.includes('CLÁUSULA 3ª'), 'renumerou ao remover bloco');
  console.assert(semBloco.includes('CLÁUSULA 2ª') && !semBloco.includes('2.1'), 'bloco removido não aparece');

  console.assert(extrairBlocos(html).length === 1, 'extrai 1 bloco');
  return 'ok';
}
