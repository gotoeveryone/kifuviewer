use crate::sgf::types::{SgfCollection, SgfGame, SgfNode, SgfProperty};
use thiserror::Error;

#[derive(Debug, Error)]
pub enum ParseError {
    #[error("unexpected end of input")]
    Eof,
    #[error("expected '{expected}' at byte {at}")]
    Expected { expected: char, at: usize },
    #[error("expected property identifier at byte {at}")]
    ExpectedIdent { at: usize },
    #[error("invalid SGF: {0}")]
    Invalid(String),
}

pub fn parse_sgf_collection(input: &str) -> Result<SgfCollection, ParseError> {
    let mut p = Parser::new(input);
    let mut games = Vec::new();

    p.skip_ws();
    while !p.is_eof() {
        games.push(p.parse_game_tree()?);
        p.skip_ws();
    }

    if games.is_empty() {
        return Err(ParseError::Invalid("no game trees found".to_string()));
    }

    Ok(SgfCollection { games })
}

struct Parser {
    chars: Vec<char>,
    idx: usize,
}

impl Parser {
    fn new(src: &str) -> Self {
        Self {
            chars: src.chars().collect(),
            idx: 0,
        }
    }

    fn is_eof(&self) -> bool {
        self.idx >= self.chars.len()
    }

    fn peek(&self) -> Option<char> {
        self.chars.get(self.idx).copied()
    }

    fn next(&mut self) -> Option<char> {
        let c = self.peek()?;
        self.idx += 1;
        Some(c)
    }

    fn skip_ws(&mut self) {
        while matches!(self.peek(), Some(c) if c.is_whitespace()) {
            self.idx += 1;
        }
    }

    fn expect(&mut self, expected: char) -> Result<(), ParseError> {
        match self.next() {
            Some(c) if c == expected => Ok(()),
            Some(_) => Err(ParseError::Expected {
                expected,
                at: self.idx.saturating_sub(1),
            }),
            None => Err(ParseError::Eof),
        }
    }

    fn parse_game_tree(&mut self) -> Result<SgfGame, ParseError> {
        self.skip_ws();
        self.expect('(')?;
        self.skip_ws();

        let nodes = self.parse_node_sequence()?;
        let mut variations = Vec::new();
        self.skip_ws();

        while matches!(self.peek(), Some('(')) {
            let variation = self.parse_game_tree()?;
            variations.push(variation.root);
            self.skip_ws();
        }

        self.expect(')')?;
        let root = build_chain(nodes, variations)?;
        Ok(SgfGame { root })
    }

    fn parse_node_sequence(&mut self) -> Result<Vec<SgfNode>, ParseError> {
        let mut nodes = Vec::new();
        self.skip_ws();
        while matches!(self.peek(), Some(';')) {
            nodes.push(self.parse_node()?);
            self.skip_ws();
        }

        if nodes.is_empty() {
            return Err(ParseError::Invalid(
                "expected at least one node in sequence".to_string(),
            ));
        }
        Ok(nodes)
    }

    fn parse_node(&mut self) -> Result<SgfNode, ParseError> {
        self.expect(';')?;
        self.skip_ws();

        let mut node = SgfNode::empty();
        while let Some(c) = self.peek() {
            if c == ';' || c == '(' || c == ')' {
                break;
            }
            if c.is_whitespace() {
                self.skip_ws();
                continue;
            }
            let ident = self.parse_ident()?;
            let values = self.parse_values()?;
            node.properties.push(SgfProperty { ident, values });
            self.skip_ws();
        }

        Ok(node)
    }

    fn parse_ident(&mut self) -> Result<String, ParseError> {
        let start = self.idx;
        let mut ident = String::new();
        while let Some(c) = self.peek() {
            if c.is_ascii_uppercase() {
                ident.push(c);
                self.idx += 1;
            } else {
                break;
            }
        }
        if ident.is_empty() {
            return Err(ParseError::ExpectedIdent { at: start });
        }
        Ok(ident)
    }

    fn parse_values(&mut self) -> Result<Vec<String>, ParseError> {
        let mut values = Vec::new();
        self.skip_ws();
        while matches!(self.peek(), Some('[')) {
            values.push(self.parse_value()?);
            self.skip_ws();
        }
        if values.is_empty() {
            return Err(ParseError::Invalid(
                "property must contain at least one value".to_string(),
            ));
        }
        Ok(values)
    }

    fn parse_value(&mut self) -> Result<String, ParseError> {
        self.expect('[')?;
        let mut out = String::new();
        while let Some(c) = self.next() {
            match c {
                ']' => return Ok(out),
                '\\' => {
                    let escaped = self.next().ok_or(ParseError::Eof)?;
                    out.push(escaped);
                }
                _ => out.push(c),
            }
        }
        Err(ParseError::Eof)
    }
}

fn build_chain(nodes: Vec<SgfNode>, variations: Vec<SgfNode>) -> Result<SgfNode, ParseError> {
    let mut iter = nodes.into_iter();
    let mut root = iter
        .next()
        .ok_or_else(|| ParseError::Invalid("empty sequence".to_string()))?;
    let mut current = &mut root;
    for node in iter {
        current.children.push(node);
        let last = current.children.len() - 1;
        current = &mut current.children[last];
    }
    current.children.extend(variations);
    Ok(root)
}

#[cfg(test)]
mod tests {
    use super::parse_sgf_collection;

    #[test]
    fn parse_basic_game() {
        let sgf = "(;GM[1]FF[4]SZ[19];B[pd];W[dd])";
        let parsed = parse_sgf_collection(sgf).expect("parse should succeed");
        assert_eq!(parsed.games.len(), 1);
        assert_eq!(parsed.games[0].root.properties[0].ident, "GM");
        assert_eq!(parsed.games[0].root.children.len(), 1);
    }

    #[test]
    fn parse_variation() {
        let sgf = "(;B[pd](;W[dd])(;W[qp]))";
        let parsed = parse_sgf_collection(sgf).expect("parse should succeed");
        let root = &parsed.games[0].root;
        assert_eq!(root.properties[0].ident, "B");
        assert_eq!(root.children.len(), 2);
    }
}
