fn main() {
  // See https://doc.rust-lang.org/cargo/reference/build-scripts.html#rerun-if-changed
  println!("cargo:rerun-if-changed=gql/github/queries.graphql");
  println!("cargo:rerun-if-changed=gql/github/schema.json");
  println!("cargo:rerun-if-changed=gql/hasura/queries.graphql");
  println!("cargo:rerun-if-changed=gql/hasura/schema.json");
}
