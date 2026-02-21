import type { SgfCollection, SgfNode, SgfProperty } from "../types/sgf";

const ROOT_ALLOWED_IDENTS = new Set([
  "FF",
  "GM",
  "SZ",
  "EV",
  "DT",
  "KM",
  "RE",
  "PB",
  "BR",
  "PW",
  "WR",
  "AB",
  "AW",
  "AE",
  "C"
]);

const NODE_ALLOWED_IDENTS = new Set(["B", "W", "AB", "AW", "AE", "C"]);

const APP_PROPERTY: SgfProperty = { ident: "AP", values: ["Go Kifu Viewer"] };

const keepAllowedProperties = (properties: SgfProperty[], allowed: Set<string>): SgfProperty[] => {
  return properties
    .filter((prop) => allowed.has(prop.ident))
    .map((prop) => ({ ident: prop.ident, values: [...prop.values] }));
};

const normalizeRootProperties = (properties: SgfProperty[]): SgfProperty[] => {
  const kept = keepAllowedProperties(properties, ROOT_ALLOWED_IDENTS).filter((prop) => prop.ident !== "AP");
  return [...kept, { ident: APP_PROPERTY.ident, values: [...APP_PROPERTY.values] }];
};

const normalizeNode = (node: SgfNode, isRoot: boolean): SgfNode => {
  return {
    properties: isRoot ? normalizeRootProperties(node.properties) : keepAllowedProperties(node.properties, NODE_ALLOWED_IDENTS),
    children: node.children.map((child) => normalizeNode(child, false))
  };
};

export const normalizeCollectionForSave = (collection: SgfCollection): SgfCollection => {
  return {
    games: collection.games.map((game) => ({
      root: normalizeNode(game.root, true)
    }))
  };
};
