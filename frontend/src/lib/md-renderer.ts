import { marked } from 'marked'

export const renderer = new marked.Renderer();

renderer.link = function({ href, title, text }) {
  const target = 'target="_blank" rel="noopener noreferrer"';
  const titleAttr = title ? `title="${title}"` : '';
  return `<a href="${href}" ${titleAttr} ${target}>${text}</a>`;
};

const tableRenderer = renderer.table
renderer.table = function(table) {
  const output = tableRenderer.call(this, table)
  return `<div class="table-wrapper scroller">${output}</div>`
};

renderer.image = function({ href, title, text }) {
  const target = 'target="_blank" rel="noopener noreferrer"';
  const titleAttr = title ? `title="${title}"` : '';
  return `<a href="${href}" ${titleAttr} ${target}>${text}</a>`;
};
