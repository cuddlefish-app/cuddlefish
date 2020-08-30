/// Calling Hasura endpoints.
use crate::BlameLine;
use crate::CFResult;
use failure::bail;
use graphql_client::GraphQLQuery;
use serde_json::json;

// This name comes from GraphQL/Hasura, so it's not camel case.
// #[allow(non_camel_case_types)]
// type uuid = String;

#[allow(non_snake_case)]
async fn ADMIN_hasura_request<B: serde::ser::Serialize + ?Sized, T: serde::de::DeserializeOwned>(
  json_body: &B,
) -> CFResult<T> {
  // TODO: don't hardcode URL, header.
  let response = reqwest::Client::new()
    .post("https://cuddlefish-hasura.herokuapp.com/v1/graphql")
    .header(
      "x-hasura-admin-secret",
      &*crate::HASURA_GRAPHQL_ADMIN_SECRET,
    )
    .json(&json_body)
    .send()
    .await?;
  let response_parsed: graphql_client::Response<T> = response.json().await?;

  // The order of these branches is significant.
  match (response_parsed.data, response_parsed.errors) {
    (_, Some(errs)) => bail!("GraphQL response includes errors: {:?}", errs),
    (Some(x), _) => Ok(x),
    _ => bail!("expected either `data` or `response` fields to be present"),
  }
}

// See https://github.com/rust-lang/rust/issues/75798 as to why we can't have nice things. We definitely want these to
// happen in a single transaction which means we need to write the GraphQL ourselves.
pub async fn insert_blamelines(
  commit: &str,
  file_path: &str,
  blamelines: Vec<BlameLine>,
) -> CFResult<()> {
  // Having a non-empty update_columns is necessary unfortunately.
  // See https://github.com/hasura/graphql-engine/issues/1911.
  // Also be careful! Line numbers are always 1-indexed.
  let objects = blamelines
    .iter()
    .enumerate()
    .map(|(i, bl)| {
      format!(
        r#"{{
          original_line: {{
            data: {{ commit: "{}", file_path: "{}", line_number: {} }}
            on_conflict: {{ constraint: lines_pkey, update_columns: [commit] }}
          }}
          x_commit: "{}"
          x_file_path: "{}"
          x_line_number: {}
        }}"#,
        bl.original_commit,
        bl.original_file_path,
        bl.original_line_number,
        commit,
        file_path,
        i + 1
      )
    })
    .collect::<Vec<_>>()
    .join("\n");

  let gql = format!(
    r#"mutation {{
      insert_blamelines(
        objects: [
          {}
        ]
        on_conflict: {{ constraint: blamelines_pkey, update_columns: [] }}
      ) {{
        affected_rows
      }}
    }}"#,
    objects
  );

  let _: serde_json::Value = ADMIN_hasura_request(&json!({
    "query": gql,
    "variables":{}
  }))
  .await?;
  Ok(())
}

#[derive(graphql_client::GraphQLQuery)]
#[graphql(
  schema_path = "gql/hasura/schema.json",
  query_path = "gql/hasura/queries.graphql",
  response_derives = "Debug"
)]
pub struct LookupExistingBlamelines;

pub async fn lookup_existing_blamelines(commit: &str, file_path: &str) -> CFResult<bool> {
  let res: lookup_existing_blamelines::ResponseData = ADMIN_hasura_request(
    &LookupExistingBlamelines::build_query(lookup_existing_blamelines::Variables {
      commit: commit.into(),
      file_path: file_path.into(),
    }),
  )
  .await?;
  Ok(res.blamelines_by_pk.is_some())
}
