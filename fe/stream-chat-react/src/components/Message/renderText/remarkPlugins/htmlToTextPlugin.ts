import { visit, Visitor } from 'unist-util-visit';

import type { Nodes } from 'hast';

const visitor: Visitor = (node) => {
  if (node.type !== 'html') return;

  node.type = 'text';
};
const transform = (tree: Nodes) => {
  visit(tree, visitor);
};

export const htmlToTextPlugin = () => transform;
