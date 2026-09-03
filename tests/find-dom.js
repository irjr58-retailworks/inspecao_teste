function findAll(node, pred, out = []) {
  if (!node) return out;
  if (pred(node)) out.push(node);
  (node.children || []).forEach((c) => findAll(c, pred, out));
  return out;
}
module.exports = { findAll };
