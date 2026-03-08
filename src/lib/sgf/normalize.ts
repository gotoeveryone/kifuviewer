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

const normalizeRootPropertiesForLoad = (properties: SgfProperty[]): SgfProperty[] => {
  const normalized: SgfProperty[] = [];
  let firstDtValue = "";
  let firstRdValue = "";

  for (const prop of properties) {
    if (prop.ident === "RD") {
      if (firstRdValue === "") {
        firstRdValue = prop.values[0] ?? "";
      }
      continue;
    }

    normalized.push({ ident: prop.ident, values: [...prop.values] });

    if (prop.ident === "DT" && firstDtValue === "") {
      firstDtValue = prop.values[0] ?? "";
    }
  }

  if (firstDtValue === "" && firstRdValue !== "") {
    normalized.push({ ident: "DT", values: [firstRdValue] });
  }

  return normalized;
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

export const normalizeCollectionForLoad = (collection: SgfCollection): SgfCollection => {
  return {
    games: collection.games.map((game) => ({
      root: {
        properties: normalizeRootPropertiesForLoad(game.root.properties),
        children: game.root.children
      }
    }))
  };
};
