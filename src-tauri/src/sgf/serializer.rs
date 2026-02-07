use crate::sgf::types::{SgfCollection, SgfNode, SgfProperty};

pub fn serialize_sgf_collection(collection: &SgfCollection) -> String {
    collection
        .games
        .iter()
        .map(|g| serialize_tree(&g.root))
        .collect::<Vec<_>>()
        .join("")
}

fn serialize_tree(root: &SgfNode) -> String {
    let mut out = String::from("(");
    serialize_sequence_and_variations(root, &mut out);
    out.push(')');
    out
}

fn serialize_sequence_and_variations(node: &SgfNode, out: &mut String) {
    out.push(';');
    serialize_properties(&node.properties, out);

    if node.children.is_empty() {
        return;
    }

    if node.children.len() == 1 {
        serialize_sequence_and_variations(&node.children[0], out);
        return;
    }

    for variation in &node.children {
        out.push('(');
        serialize_sequence_and_variations(variation, out);
        out.push(')');
    }
}

fn serialize_properties(props: &[SgfProperty], out: &mut String) {
    for prop in props {
        out.push_str(&prop.ident);
        for value in &prop.values {
            out.push('[');
            out.push_str(&escape_value(value));
            out.push(']');
        }
    }
}

fn escape_value(value: &str) -> String {
    let mut out = String::with_capacity(value.len());
    for c in value.chars() {
        match c {
            '\\' => out.push_str("\\\\"),
            ']' => out.push_str("\\]"),
            _ => out.push(c),
        }
    }
    out
}

#[cfg(test)]
mod tests {
    use crate::sgf::parser::parse_sgf_collection;
    use crate::sgf::serializer::serialize_sgf_collection;

    #[test]
    fn roundtrip_smoke() {
        let sgf = "(;GM[1]FF[4]SZ[19];B[pd](;W[dd])(;W[qp]))";
        let parsed1 = parse_sgf_collection(sgf).expect("parse #1");
        let out = serialize_sgf_collection(&parsed1);
        let parsed2 = parse_sgf_collection(&out).expect("parse #2");
        assert_eq!(parsed1, parsed2);
    }
}
