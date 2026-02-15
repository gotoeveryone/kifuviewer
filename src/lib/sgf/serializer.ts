import type { SgfCollection, SgfNode, SgfProperty } from "../types/sgf";

const escapeValue = (value: string): string => {
  return value.replace(/\\/g, "\\\\").replace(/\]/g, "\\]");
};

const serializeProperties = (properties: SgfProperty[]): string => {
  return properties
    .map((prop) => `${prop.ident}${prop.values.map((value) => `[${escapeValue(value)}]`).join("")}`)
    .join("");
};

const serializeSequenceAndVariations = (node: SgfNode): string => {
  const here = `;${serializeProperties(node.properties)}`;
  if (node.children.length === 0) {
    return here;
  }

  if (node.children.length === 1) {
    return `${here}${serializeSequenceAndVariations(node.children[0])}`;
  }

  return `${here}${node.children.map((child) => `(${serializeSequenceAndVariations(child)})`).join("")}`;
};

const serializeTree = (root: SgfNode): string => {
  return `(${serializeSequenceAndVariations(root)})`;
};

export const serializeSgfCollection = (collection: SgfCollection): string => {
  return collection.games.map((game) => serializeTree(game.root)).join("");
};
