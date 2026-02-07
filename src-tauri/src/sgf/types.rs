use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct SgfCollection {
    pub games: Vec<SgfGame>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct SgfGame {
    pub root: SgfNode,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct SgfNode {
    pub properties: Vec<SgfProperty>,
    pub children: Vec<SgfNode>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct SgfProperty {
    pub ident: String,
    pub values: Vec<String>,
}

impl SgfNode {
    pub fn empty() -> Self {
        Self {
            properties: Vec::new(),
            children: Vec::new(),
        }
    }
}
