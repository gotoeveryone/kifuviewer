export type SgfProperty = {
  ident: string;
  values: string[];
};

export type SgfNode = {
  properties: SgfProperty[];
  children: SgfNode[];
};

export type SgfGame = {
  root: SgfNode;
};

export type SgfCollection = {
  games: SgfGame[];
};
