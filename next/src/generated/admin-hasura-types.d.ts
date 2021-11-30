export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: string;
  String: string;
  Boolean: boolean;
  Int: number;
  Float: number;
  timestamptz: any;
  uuid: string;
};

/** Boolean expression to compare columns of type "Int". All fields are combined with logical 'AND'. */
export type Int_Comparison_Exp = {
  _eq?: InputMaybe<Scalars['Int']>;
  _gt?: InputMaybe<Scalars['Int']>;
  _gte?: InputMaybe<Scalars['Int']>;
  _in?: InputMaybe<Array<Scalars['Int']>>;
  _is_null?: InputMaybe<Scalars['Boolean']>;
  _lt?: InputMaybe<Scalars['Int']>;
  _lte?: InputMaybe<Scalars['Int']>;
  _neq?: InputMaybe<Scalars['Int']>;
  _nin?: InputMaybe<Array<Scalars['Int']>>;
};

export type StartCuddlefishSessionResponse = {
  __typename?: 'StartCuddlefishSessionResponse';
  session_token: Scalars['String'];
};

/** Boolean expression to compare columns of type "String". All fields are combined with logical 'AND'. */
export type String_Comparison_Exp = {
  _eq?: InputMaybe<Scalars['String']>;
  _gt?: InputMaybe<Scalars['String']>;
  _gte?: InputMaybe<Scalars['String']>;
  /** does the column match the given case-insensitive pattern */
  _ilike?: InputMaybe<Scalars['String']>;
  _in?: InputMaybe<Array<Scalars['String']>>;
  /** does the column match the given POSIX regular expression, case insensitive */
  _iregex?: InputMaybe<Scalars['String']>;
  _is_null?: InputMaybe<Scalars['Boolean']>;
  /** does the column match the given pattern */
  _like?: InputMaybe<Scalars['String']>;
  _lt?: InputMaybe<Scalars['String']>;
  _lte?: InputMaybe<Scalars['String']>;
  _neq?: InputMaybe<Scalars['String']>;
  /** does the column NOT match the given case-insensitive pattern */
  _nilike?: InputMaybe<Scalars['String']>;
  _nin?: InputMaybe<Array<Scalars['String']>>;
  /** does the column NOT match the given POSIX regular expression, case insensitive */
  _niregex?: InputMaybe<Scalars['String']>;
  /** does the column NOT match the given pattern */
  _nlike?: InputMaybe<Scalars['String']>;
  /** does the column NOT match the given POSIX regular expression, case sensitive */
  _nregex?: InputMaybe<Scalars['String']>;
  /** does the column NOT match the given SQL regular expression */
  _nsimilar?: InputMaybe<Scalars['String']>;
  /** does the column match the given POSIX regular expression, case sensitive */
  _regex?: InputMaybe<Scalars['String']>;
  /** does the column match the given SQL regular expression */
  _similar?: InputMaybe<Scalars['String']>;
};

/**
 * Matches lines to their original sources via git blame information.
 *
 *
 * columns and relationships of "blamelines"
 *
 */
export type Blamelines = {
  __typename?: 'blamelines';
  original_commit_hash: Scalars['String'];
  original_file_path: Scalars['String'];
  /** An object relationship */
  original_line?: Maybe<Lines>;
  original_line_number: Scalars['Int'];
  x_commit_hash: Scalars['String'];
  x_file_path: Scalars['String'];
  x_line_number: Scalars['Int'];
};

/** aggregated selection of "blamelines" */
export type Blamelines_Aggregate = {
  __typename?: 'blamelines_aggregate';
  aggregate?: Maybe<Blamelines_Aggregate_Fields>;
  nodes: Array<Blamelines>;
};

/** aggregate fields of "blamelines" */
export type Blamelines_Aggregate_Fields = {
  __typename?: 'blamelines_aggregate_fields';
  avg?: Maybe<Blamelines_Avg_Fields>;
  count: Scalars['Int'];
  max?: Maybe<Blamelines_Max_Fields>;
  min?: Maybe<Blamelines_Min_Fields>;
  stddev?: Maybe<Blamelines_Stddev_Fields>;
  stddev_pop?: Maybe<Blamelines_Stddev_Pop_Fields>;
  stddev_samp?: Maybe<Blamelines_Stddev_Samp_Fields>;
  sum?: Maybe<Blamelines_Sum_Fields>;
  var_pop?: Maybe<Blamelines_Var_Pop_Fields>;
  var_samp?: Maybe<Blamelines_Var_Samp_Fields>;
  variance?: Maybe<Blamelines_Variance_Fields>;
};


/** aggregate fields of "blamelines" */
export type Blamelines_Aggregate_FieldsCountArgs = {
  columns?: InputMaybe<Array<Blamelines_Select_Column>>;
  distinct?: InputMaybe<Scalars['Boolean']>;
};

/** aggregate avg on columns */
export type Blamelines_Avg_Fields = {
  __typename?: 'blamelines_avg_fields';
  original_line_number?: Maybe<Scalars['Float']>;
  x_line_number?: Maybe<Scalars['Float']>;
};

/** Boolean expression to filter rows from the table "blamelines". All fields are combined with a logical 'AND'. */
export type Blamelines_Bool_Exp = {
  _and?: InputMaybe<Array<Blamelines_Bool_Exp>>;
  _not?: InputMaybe<Blamelines_Bool_Exp>;
  _or?: InputMaybe<Array<Blamelines_Bool_Exp>>;
  original_commit_hash?: InputMaybe<String_Comparison_Exp>;
  original_file_path?: InputMaybe<String_Comparison_Exp>;
  original_line?: InputMaybe<Lines_Bool_Exp>;
  original_line_number?: InputMaybe<Int_Comparison_Exp>;
  x_commit_hash?: InputMaybe<String_Comparison_Exp>;
  x_file_path?: InputMaybe<String_Comparison_Exp>;
  x_line_number?: InputMaybe<Int_Comparison_Exp>;
};

/** unique or primary key constraints on table "blamelines" */
export enum Blamelines_Constraint {
  /** unique or primary key constraint */
  BlamelinesPkey = 'blamelines_pkey'
}

/** input type for incrementing numeric columns in table "blamelines" */
export type Blamelines_Inc_Input = {
  original_line_number?: InputMaybe<Scalars['Int']>;
  x_line_number?: InputMaybe<Scalars['Int']>;
};

/** input type for inserting data into table "blamelines" */
export type Blamelines_Insert_Input = {
  original_commit_hash?: InputMaybe<Scalars['String']>;
  original_file_path?: InputMaybe<Scalars['String']>;
  original_line?: InputMaybe<Lines_Obj_Rel_Insert_Input>;
  original_line_number?: InputMaybe<Scalars['Int']>;
  x_commit_hash?: InputMaybe<Scalars['String']>;
  x_file_path?: InputMaybe<Scalars['String']>;
  x_line_number?: InputMaybe<Scalars['Int']>;
};

/** aggregate max on columns */
export type Blamelines_Max_Fields = {
  __typename?: 'blamelines_max_fields';
  original_commit_hash?: Maybe<Scalars['String']>;
  original_file_path?: Maybe<Scalars['String']>;
  original_line_number?: Maybe<Scalars['Int']>;
  x_commit_hash?: Maybe<Scalars['String']>;
  x_file_path?: Maybe<Scalars['String']>;
  x_line_number?: Maybe<Scalars['Int']>;
};

/** aggregate min on columns */
export type Blamelines_Min_Fields = {
  __typename?: 'blamelines_min_fields';
  original_commit_hash?: Maybe<Scalars['String']>;
  original_file_path?: Maybe<Scalars['String']>;
  original_line_number?: Maybe<Scalars['Int']>;
  x_commit_hash?: Maybe<Scalars['String']>;
  x_file_path?: Maybe<Scalars['String']>;
  x_line_number?: Maybe<Scalars['Int']>;
};

/** response of any mutation on the table "blamelines" */
export type Blamelines_Mutation_Response = {
  __typename?: 'blamelines_mutation_response';
  /** number of rows affected by the mutation */
  affected_rows: Scalars['Int'];
  /** data from the rows affected by the mutation */
  returning: Array<Blamelines>;
};

/** on conflict condition type for table "blamelines" */
export type Blamelines_On_Conflict = {
  constraint: Blamelines_Constraint;
  update_columns?: Array<Blamelines_Update_Column>;
  where?: InputMaybe<Blamelines_Bool_Exp>;
};

/** Ordering options when selecting data from "blamelines". */
export type Blamelines_Order_By = {
  original_commit_hash?: InputMaybe<Order_By>;
  original_file_path?: InputMaybe<Order_By>;
  original_line?: InputMaybe<Lines_Order_By>;
  original_line_number?: InputMaybe<Order_By>;
  x_commit_hash?: InputMaybe<Order_By>;
  x_file_path?: InputMaybe<Order_By>;
  x_line_number?: InputMaybe<Order_By>;
};

/** primary key columns input for table: blamelines */
export type Blamelines_Pk_Columns_Input = {
  x_commit_hash: Scalars['String'];
  x_file_path: Scalars['String'];
  x_line_number: Scalars['Int'];
};

/** select columns of table "blamelines" */
export enum Blamelines_Select_Column {
  /** column name */
  OriginalCommitHash = 'original_commit_hash',
  /** column name */
  OriginalFilePath = 'original_file_path',
  /** column name */
  OriginalLineNumber = 'original_line_number',
  /** column name */
  XCommitHash = 'x_commit_hash',
  /** column name */
  XFilePath = 'x_file_path',
  /** column name */
  XLineNumber = 'x_line_number'
}

/** input type for updating data in table "blamelines" */
export type Blamelines_Set_Input = {
  original_commit_hash?: InputMaybe<Scalars['String']>;
  original_file_path?: InputMaybe<Scalars['String']>;
  original_line_number?: InputMaybe<Scalars['Int']>;
  x_commit_hash?: InputMaybe<Scalars['String']>;
  x_file_path?: InputMaybe<Scalars['String']>;
  x_line_number?: InputMaybe<Scalars['Int']>;
};

/** aggregate stddev on columns */
export type Blamelines_Stddev_Fields = {
  __typename?: 'blamelines_stddev_fields';
  original_line_number?: Maybe<Scalars['Float']>;
  x_line_number?: Maybe<Scalars['Float']>;
};

/** aggregate stddev_pop on columns */
export type Blamelines_Stddev_Pop_Fields = {
  __typename?: 'blamelines_stddev_pop_fields';
  original_line_number?: Maybe<Scalars['Float']>;
  x_line_number?: Maybe<Scalars['Float']>;
};

/** aggregate stddev_samp on columns */
export type Blamelines_Stddev_Samp_Fields = {
  __typename?: 'blamelines_stddev_samp_fields';
  original_line_number?: Maybe<Scalars['Float']>;
  x_line_number?: Maybe<Scalars['Float']>;
};

/** aggregate sum on columns */
export type Blamelines_Sum_Fields = {
  __typename?: 'blamelines_sum_fields';
  original_line_number?: Maybe<Scalars['Int']>;
  x_line_number?: Maybe<Scalars['Int']>;
};

/** update columns of table "blamelines" */
export enum Blamelines_Update_Column {
  /** column name */
  OriginalCommitHash = 'original_commit_hash',
  /** column name */
  OriginalFilePath = 'original_file_path',
  /** column name */
  OriginalLineNumber = 'original_line_number',
  /** column name */
  XCommitHash = 'x_commit_hash',
  /** column name */
  XFilePath = 'x_file_path',
  /** column name */
  XLineNumber = 'x_line_number'
}

/** aggregate var_pop on columns */
export type Blamelines_Var_Pop_Fields = {
  __typename?: 'blamelines_var_pop_fields';
  original_line_number?: Maybe<Scalars['Float']>;
  x_line_number?: Maybe<Scalars['Float']>;
};

/** aggregate var_samp on columns */
export type Blamelines_Var_Samp_Fields = {
  __typename?: 'blamelines_var_samp_fields';
  original_line_number?: Maybe<Scalars['Float']>;
  x_line_number?: Maybe<Scalars['Float']>;
};

/** aggregate variance on columns */
export type Blamelines_Variance_Fields = {
  __typename?: 'blamelines_variance_fields';
  original_line_number?: Maybe<Scalars['Float']>;
  x_line_number?: Maybe<Scalars['Float']>;
};

/** columns and relationships of "comments" */
export type Comments = {
  __typename?: 'comments';
  author_email?: Maybe<Scalars['String']>;
  /** The GitHub node id of the user who authored this comment. May be null when author_email is instead present. */
  author_github_node_id?: Maybe<Scalars['String']>;
  body: Scalars['String'];
  created_at: Scalars['timestamptz'];
  /** An object relationship */
  github_user?: Maybe<Github_Users>;
  id: Scalars['uuid'];
  /** An object relationship */
  thread: Threads;
  thread_id: Scalars['uuid'];
};

/** aggregated selection of "comments" */
export type Comments_Aggregate = {
  __typename?: 'comments_aggregate';
  aggregate?: Maybe<Comments_Aggregate_Fields>;
  nodes: Array<Comments>;
};

/** aggregate fields of "comments" */
export type Comments_Aggregate_Fields = {
  __typename?: 'comments_aggregate_fields';
  count: Scalars['Int'];
  max?: Maybe<Comments_Max_Fields>;
  min?: Maybe<Comments_Min_Fields>;
};


/** aggregate fields of "comments" */
export type Comments_Aggregate_FieldsCountArgs = {
  columns?: InputMaybe<Array<Comments_Select_Column>>;
  distinct?: InputMaybe<Scalars['Boolean']>;
};

/** order by aggregate values of table "comments" */
export type Comments_Aggregate_Order_By = {
  count?: InputMaybe<Order_By>;
  max?: InputMaybe<Comments_Max_Order_By>;
  min?: InputMaybe<Comments_Min_Order_By>;
};

/** input type for inserting array relation for remote table "comments" */
export type Comments_Arr_Rel_Insert_Input = {
  data: Array<Comments_Insert_Input>;
  /** on conflict condition */
  on_conflict?: InputMaybe<Comments_On_Conflict>;
};

/** Boolean expression to filter rows from the table "comments". All fields are combined with a logical 'AND'. */
export type Comments_Bool_Exp = {
  _and?: InputMaybe<Array<Comments_Bool_Exp>>;
  _not?: InputMaybe<Comments_Bool_Exp>;
  _or?: InputMaybe<Array<Comments_Bool_Exp>>;
  author_email?: InputMaybe<String_Comparison_Exp>;
  author_github_node_id?: InputMaybe<String_Comparison_Exp>;
  body?: InputMaybe<String_Comparison_Exp>;
  created_at?: InputMaybe<Timestamptz_Comparison_Exp>;
  github_user?: InputMaybe<Github_Users_Bool_Exp>;
  id?: InputMaybe<Uuid_Comparison_Exp>;
  thread?: InputMaybe<Threads_Bool_Exp>;
  thread_id?: InputMaybe<Uuid_Comparison_Exp>;
};

/** unique or primary key constraints on table "comments" */
export enum Comments_Constraint {
  /** unique or primary key constraint */
  CommentsPkey = 'comments_pkey'
}

/** input type for inserting data into table "comments" */
export type Comments_Insert_Input = {
  author_email?: InputMaybe<Scalars['String']>;
  /** The GitHub node id of the user who authored this comment. May be null when author_email is instead present. */
  author_github_node_id?: InputMaybe<Scalars['String']>;
  body?: InputMaybe<Scalars['String']>;
  created_at?: InputMaybe<Scalars['timestamptz']>;
  github_user?: InputMaybe<Github_Users_Obj_Rel_Insert_Input>;
  id?: InputMaybe<Scalars['uuid']>;
  thread?: InputMaybe<Threads_Obj_Rel_Insert_Input>;
  thread_id?: InputMaybe<Scalars['uuid']>;
};

/** aggregate max on columns */
export type Comments_Max_Fields = {
  __typename?: 'comments_max_fields';
  author_email?: Maybe<Scalars['String']>;
  /** The GitHub node id of the user who authored this comment. May be null when author_email is instead present. */
  author_github_node_id?: Maybe<Scalars['String']>;
  body?: Maybe<Scalars['String']>;
  created_at?: Maybe<Scalars['timestamptz']>;
  id?: Maybe<Scalars['uuid']>;
  thread_id?: Maybe<Scalars['uuid']>;
};

/** order by max() on columns of table "comments" */
export type Comments_Max_Order_By = {
  author_email?: InputMaybe<Order_By>;
  /** The GitHub node id of the user who authored this comment. May be null when author_email is instead present. */
  author_github_node_id?: InputMaybe<Order_By>;
  body?: InputMaybe<Order_By>;
  created_at?: InputMaybe<Order_By>;
  id?: InputMaybe<Order_By>;
  thread_id?: InputMaybe<Order_By>;
};

/** aggregate min on columns */
export type Comments_Min_Fields = {
  __typename?: 'comments_min_fields';
  author_email?: Maybe<Scalars['String']>;
  /** The GitHub node id of the user who authored this comment. May be null when author_email is instead present. */
  author_github_node_id?: Maybe<Scalars['String']>;
  body?: Maybe<Scalars['String']>;
  created_at?: Maybe<Scalars['timestamptz']>;
  id?: Maybe<Scalars['uuid']>;
  thread_id?: Maybe<Scalars['uuid']>;
};

/** order by min() on columns of table "comments" */
export type Comments_Min_Order_By = {
  author_email?: InputMaybe<Order_By>;
  /** The GitHub node id of the user who authored this comment. May be null when author_email is instead present. */
  author_github_node_id?: InputMaybe<Order_By>;
  body?: InputMaybe<Order_By>;
  created_at?: InputMaybe<Order_By>;
  id?: InputMaybe<Order_By>;
  thread_id?: InputMaybe<Order_By>;
};

/** response of any mutation on the table "comments" */
export type Comments_Mutation_Response = {
  __typename?: 'comments_mutation_response';
  /** number of rows affected by the mutation */
  affected_rows: Scalars['Int'];
  /** data from the rows affected by the mutation */
  returning: Array<Comments>;
};

/** on conflict condition type for table "comments" */
export type Comments_On_Conflict = {
  constraint: Comments_Constraint;
  update_columns?: Array<Comments_Update_Column>;
  where?: InputMaybe<Comments_Bool_Exp>;
};

/** Ordering options when selecting data from "comments". */
export type Comments_Order_By = {
  author_email?: InputMaybe<Order_By>;
  author_github_node_id?: InputMaybe<Order_By>;
  body?: InputMaybe<Order_By>;
  created_at?: InputMaybe<Order_By>;
  github_user?: InputMaybe<Github_Users_Order_By>;
  id?: InputMaybe<Order_By>;
  thread?: InputMaybe<Threads_Order_By>;
  thread_id?: InputMaybe<Order_By>;
};

/** primary key columns input for table: comments */
export type Comments_Pk_Columns_Input = {
  id: Scalars['uuid'];
};

/** select columns of table "comments" */
export enum Comments_Select_Column {
  /** column name */
  AuthorEmail = 'author_email',
  /** column name */
  AuthorGithubNodeId = 'author_github_node_id',
  /** column name */
  Body = 'body',
  /** column name */
  CreatedAt = 'created_at',
  /** column name */
  Id = 'id',
  /** column name */
  ThreadId = 'thread_id'
}

/** input type for updating data in table "comments" */
export type Comments_Set_Input = {
  author_email?: InputMaybe<Scalars['String']>;
  /** The GitHub node id of the user who authored this comment. May be null when author_email is instead present. */
  author_github_node_id?: InputMaybe<Scalars['String']>;
  body?: InputMaybe<Scalars['String']>;
  created_at?: InputMaybe<Scalars['timestamptz']>;
  id?: InputMaybe<Scalars['uuid']>;
  thread_id?: InputMaybe<Scalars['uuid']>;
};

/** update columns of table "comments" */
export enum Comments_Update_Column {
  /** column name */
  AuthorEmail = 'author_email',
  /** column name */
  AuthorGithubNodeId = 'author_github_node_id',
  /** column name */
  Body = 'body',
  /** column name */
  CreatedAt = 'created_at',
  /** column name */
  Id = 'id',
  /** column name */
  ThreadId = 'thread_id'
}

/**
 * Mapping between commit hashes and the GitHub repos that contain them. Convenient for looking up commits in the GitHub API which requires specifying a parent repo.
 *
 *
 * columns and relationships of "commit_github_repo"
 *
 */
export type Commit_Github_Repo = {
  __typename?: 'commit_github_repo';
  commit_hash: Scalars['String'];
  repo_github_node_id: Scalars['String'];
};

/** aggregated selection of "commit_github_repo" */
export type Commit_Github_Repo_Aggregate = {
  __typename?: 'commit_github_repo_aggregate';
  aggregate?: Maybe<Commit_Github_Repo_Aggregate_Fields>;
  nodes: Array<Commit_Github_Repo>;
};

/** aggregate fields of "commit_github_repo" */
export type Commit_Github_Repo_Aggregate_Fields = {
  __typename?: 'commit_github_repo_aggregate_fields';
  count: Scalars['Int'];
  max?: Maybe<Commit_Github_Repo_Max_Fields>;
  min?: Maybe<Commit_Github_Repo_Min_Fields>;
};


/** aggregate fields of "commit_github_repo" */
export type Commit_Github_Repo_Aggregate_FieldsCountArgs = {
  columns?: InputMaybe<Array<Commit_Github_Repo_Select_Column>>;
  distinct?: InputMaybe<Scalars['Boolean']>;
};

/** order by aggregate values of table "commit_github_repo" */
export type Commit_Github_Repo_Aggregate_Order_By = {
  count?: InputMaybe<Order_By>;
  max?: InputMaybe<Commit_Github_Repo_Max_Order_By>;
  min?: InputMaybe<Commit_Github_Repo_Min_Order_By>;
};

/** input type for inserting array relation for remote table "commit_github_repo" */
export type Commit_Github_Repo_Arr_Rel_Insert_Input = {
  data: Array<Commit_Github_Repo_Insert_Input>;
  /** on conflict condition */
  on_conflict?: InputMaybe<Commit_Github_Repo_On_Conflict>;
};

/** Boolean expression to filter rows from the table "commit_github_repo". All fields are combined with a logical 'AND'. */
export type Commit_Github_Repo_Bool_Exp = {
  _and?: InputMaybe<Array<Commit_Github_Repo_Bool_Exp>>;
  _not?: InputMaybe<Commit_Github_Repo_Bool_Exp>;
  _or?: InputMaybe<Array<Commit_Github_Repo_Bool_Exp>>;
  commit_hash?: InputMaybe<String_Comparison_Exp>;
  repo_github_node_id?: InputMaybe<String_Comparison_Exp>;
};

/** unique or primary key constraints on table "commit_github_repo" */
export enum Commit_Github_Repo_Constraint {
  /** unique or primary key constraint */
  CommitGithubRepoPkey = 'commit_github_repo_pkey'
}

/** input type for inserting data into table "commit_github_repo" */
export type Commit_Github_Repo_Insert_Input = {
  commit_hash?: InputMaybe<Scalars['String']>;
  repo_github_node_id?: InputMaybe<Scalars['String']>;
};

/** aggregate max on columns */
export type Commit_Github_Repo_Max_Fields = {
  __typename?: 'commit_github_repo_max_fields';
  commit_hash?: Maybe<Scalars['String']>;
  repo_github_node_id?: Maybe<Scalars['String']>;
};

/** order by max() on columns of table "commit_github_repo" */
export type Commit_Github_Repo_Max_Order_By = {
  commit_hash?: InputMaybe<Order_By>;
  repo_github_node_id?: InputMaybe<Order_By>;
};

/** aggregate min on columns */
export type Commit_Github_Repo_Min_Fields = {
  __typename?: 'commit_github_repo_min_fields';
  commit_hash?: Maybe<Scalars['String']>;
  repo_github_node_id?: Maybe<Scalars['String']>;
};

/** order by min() on columns of table "commit_github_repo" */
export type Commit_Github_Repo_Min_Order_By = {
  commit_hash?: InputMaybe<Order_By>;
  repo_github_node_id?: InputMaybe<Order_By>;
};

/** response of any mutation on the table "commit_github_repo" */
export type Commit_Github_Repo_Mutation_Response = {
  __typename?: 'commit_github_repo_mutation_response';
  /** number of rows affected by the mutation */
  affected_rows: Scalars['Int'];
  /** data from the rows affected by the mutation */
  returning: Array<Commit_Github_Repo>;
};

/** input type for inserting object relation for remote table "commit_github_repo" */
export type Commit_Github_Repo_Obj_Rel_Insert_Input = {
  data: Commit_Github_Repo_Insert_Input;
  /** on conflict condition */
  on_conflict?: InputMaybe<Commit_Github_Repo_On_Conflict>;
};

/** on conflict condition type for table "commit_github_repo" */
export type Commit_Github_Repo_On_Conflict = {
  constraint: Commit_Github_Repo_Constraint;
  update_columns?: Array<Commit_Github_Repo_Update_Column>;
  where?: InputMaybe<Commit_Github_Repo_Bool_Exp>;
};

/** Ordering options when selecting data from "commit_github_repo". */
export type Commit_Github_Repo_Order_By = {
  commit_hash?: InputMaybe<Order_By>;
  repo_github_node_id?: InputMaybe<Order_By>;
};

/** primary key columns input for table: commit_github_repo */
export type Commit_Github_Repo_Pk_Columns_Input = {
  commit_hash: Scalars['String'];
  repo_github_node_id: Scalars['String'];
};

/** select columns of table "commit_github_repo" */
export enum Commit_Github_Repo_Select_Column {
  /** column name */
  CommitHash = 'commit_hash',
  /** column name */
  RepoGithubNodeId = 'repo_github_node_id'
}

/** input type for updating data in table "commit_github_repo" */
export type Commit_Github_Repo_Set_Input = {
  commit_hash?: InputMaybe<Scalars['String']>;
  repo_github_node_id?: InputMaybe<Scalars['String']>;
};

/** update columns of table "commit_github_repo" */
export enum Commit_Github_Repo_Update_Column {
  /** column name */
  CommitHash = 'commit_hash',
  /** column name */
  RepoGithubNodeId = 'repo_github_node_id'
}

/** columns and relationships of "commits" */
export type Commits = {
  __typename?: 'commits';
  author_email: Scalars['String'];
  author_name: Scalars['String'];
  commit_hash: Scalars['String'];
  committer_email: Scalars['String'];
  committer_name: Scalars['String'];
};

/** aggregated selection of "commits" */
export type Commits_Aggregate = {
  __typename?: 'commits_aggregate';
  aggregate?: Maybe<Commits_Aggregate_Fields>;
  nodes: Array<Commits>;
};

/** aggregate fields of "commits" */
export type Commits_Aggregate_Fields = {
  __typename?: 'commits_aggregate_fields';
  count: Scalars['Int'];
  max?: Maybe<Commits_Max_Fields>;
  min?: Maybe<Commits_Min_Fields>;
};


/** aggregate fields of "commits" */
export type Commits_Aggregate_FieldsCountArgs = {
  columns?: InputMaybe<Array<Commits_Select_Column>>;
  distinct?: InputMaybe<Scalars['Boolean']>;
};

/** Boolean expression to filter rows from the table "commits". All fields are combined with a logical 'AND'. */
export type Commits_Bool_Exp = {
  _and?: InputMaybe<Array<Commits_Bool_Exp>>;
  _not?: InputMaybe<Commits_Bool_Exp>;
  _or?: InputMaybe<Array<Commits_Bool_Exp>>;
  author_email?: InputMaybe<String_Comparison_Exp>;
  author_name?: InputMaybe<String_Comparison_Exp>;
  commit_hash?: InputMaybe<String_Comparison_Exp>;
  committer_email?: InputMaybe<String_Comparison_Exp>;
  committer_name?: InputMaybe<String_Comparison_Exp>;
};

/** unique or primary key constraints on table "commits" */
export enum Commits_Constraint {
  /** unique or primary key constraint */
  CommitsPkey = 'commits_pkey'
}

/** input type for inserting data into table "commits" */
export type Commits_Insert_Input = {
  author_email?: InputMaybe<Scalars['String']>;
  author_name?: InputMaybe<Scalars['String']>;
  commit_hash?: InputMaybe<Scalars['String']>;
  committer_email?: InputMaybe<Scalars['String']>;
  committer_name?: InputMaybe<Scalars['String']>;
};

/** aggregate max on columns */
export type Commits_Max_Fields = {
  __typename?: 'commits_max_fields';
  author_email?: Maybe<Scalars['String']>;
  author_name?: Maybe<Scalars['String']>;
  commit_hash?: Maybe<Scalars['String']>;
  committer_email?: Maybe<Scalars['String']>;
  committer_name?: Maybe<Scalars['String']>;
};

/** aggregate min on columns */
export type Commits_Min_Fields = {
  __typename?: 'commits_min_fields';
  author_email?: Maybe<Scalars['String']>;
  author_name?: Maybe<Scalars['String']>;
  commit_hash?: Maybe<Scalars['String']>;
  committer_email?: Maybe<Scalars['String']>;
  committer_name?: Maybe<Scalars['String']>;
};

/** response of any mutation on the table "commits" */
export type Commits_Mutation_Response = {
  __typename?: 'commits_mutation_response';
  /** number of rows affected by the mutation */
  affected_rows: Scalars['Int'];
  /** data from the rows affected by the mutation */
  returning: Array<Commits>;
};

/** on conflict condition type for table "commits" */
export type Commits_On_Conflict = {
  constraint: Commits_Constraint;
  update_columns?: Array<Commits_Update_Column>;
  where?: InputMaybe<Commits_Bool_Exp>;
};

/** Ordering options when selecting data from "commits". */
export type Commits_Order_By = {
  author_email?: InputMaybe<Order_By>;
  author_name?: InputMaybe<Order_By>;
  commit_hash?: InputMaybe<Order_By>;
  committer_email?: InputMaybe<Order_By>;
  committer_name?: InputMaybe<Order_By>;
};

/** primary key columns input for table: commits */
export type Commits_Pk_Columns_Input = {
  commit_hash: Scalars['String'];
};

/** select columns of table "commits" */
export enum Commits_Select_Column {
  /** column name */
  AuthorEmail = 'author_email',
  /** column name */
  AuthorName = 'author_name',
  /** column name */
  CommitHash = 'commit_hash',
  /** column name */
  CommitterEmail = 'committer_email',
  /** column name */
  CommitterName = 'committer_name'
}

/** input type for updating data in table "commits" */
export type Commits_Set_Input = {
  author_email?: InputMaybe<Scalars['String']>;
  author_name?: InputMaybe<Scalars['String']>;
  commit_hash?: InputMaybe<Scalars['String']>;
  committer_email?: InputMaybe<Scalars['String']>;
  committer_name?: InputMaybe<Scalars['String']>;
};

/** update columns of table "commits" */
export enum Commits_Update_Column {
  /** column name */
  AuthorEmail = 'author_email',
  /** column name */
  AuthorName = 'author_name',
  /** column name */
  CommitHash = 'commit_hash',
  /** column name */
  CommitterEmail = 'committer_email',
  /** column name */
  CommitterName = 'committer_name'
}

/**
 * Every time a user logs in these values get upserted. Users can also be created implicitly by receiving email responses from them.
 *
 *
 * columns and relationships of "github_users"
 *
 */
export type Github_Users = {
  __typename?: 'github_users';
  /** Can be null if a user emails us, but doesn't login via OAuth. */
  access_token?: Maybe<Scalars['String']>;
  created_at?: Maybe<Scalars['timestamptz']>;
  /** User's email according to their GitHub account. We assume that all GitHub accounts have an email associated with it. Note that GitHub does not enforce that emails must be unique, eg. @drshrey and @shreyasjag have the same email. */
  email: Scalars['String'];
  /** An integer id that GitHub gives every user. Use github_node_id instead whenever possible. */
  github_database_id: Scalars['Int'];
  /** User's name according to GitHub, eg. "Barack Obama". */
  github_name?: Maybe<Scalars['String']>;
  /** Eg., "MDQ6VXNlcjIyNjg3Mg==". Seems to be used in the v4 GraphQL GitHub API. */
  github_node_id: Scalars['String'];
  github_username: Scalars['String'];
  updated_at?: Maybe<Scalars['timestamptz']>;
};

/** aggregated selection of "github_users" */
export type Github_Users_Aggregate = {
  __typename?: 'github_users_aggregate';
  aggregate?: Maybe<Github_Users_Aggregate_Fields>;
  nodes: Array<Github_Users>;
};

/** aggregate fields of "github_users" */
export type Github_Users_Aggregate_Fields = {
  __typename?: 'github_users_aggregate_fields';
  avg?: Maybe<Github_Users_Avg_Fields>;
  count: Scalars['Int'];
  max?: Maybe<Github_Users_Max_Fields>;
  min?: Maybe<Github_Users_Min_Fields>;
  stddev?: Maybe<Github_Users_Stddev_Fields>;
  stddev_pop?: Maybe<Github_Users_Stddev_Pop_Fields>;
  stddev_samp?: Maybe<Github_Users_Stddev_Samp_Fields>;
  sum?: Maybe<Github_Users_Sum_Fields>;
  var_pop?: Maybe<Github_Users_Var_Pop_Fields>;
  var_samp?: Maybe<Github_Users_Var_Samp_Fields>;
  variance?: Maybe<Github_Users_Variance_Fields>;
};


/** aggregate fields of "github_users" */
export type Github_Users_Aggregate_FieldsCountArgs = {
  columns?: InputMaybe<Array<Github_Users_Select_Column>>;
  distinct?: InputMaybe<Scalars['Boolean']>;
};

/** aggregate avg on columns */
export type Github_Users_Avg_Fields = {
  __typename?: 'github_users_avg_fields';
  /** An integer id that GitHub gives every user. Use github_node_id instead whenever possible. */
  github_database_id?: Maybe<Scalars['Float']>;
};

/** Boolean expression to filter rows from the table "github_users". All fields are combined with a logical 'AND'. */
export type Github_Users_Bool_Exp = {
  _and?: InputMaybe<Array<Github_Users_Bool_Exp>>;
  _not?: InputMaybe<Github_Users_Bool_Exp>;
  _or?: InputMaybe<Array<Github_Users_Bool_Exp>>;
  access_token?: InputMaybe<String_Comparison_Exp>;
  created_at?: InputMaybe<Timestamptz_Comparison_Exp>;
  email?: InputMaybe<String_Comparison_Exp>;
  github_database_id?: InputMaybe<Int_Comparison_Exp>;
  github_name?: InputMaybe<String_Comparison_Exp>;
  github_node_id?: InputMaybe<String_Comparison_Exp>;
  github_username?: InputMaybe<String_Comparison_Exp>;
  updated_at?: InputMaybe<Timestamptz_Comparison_Exp>;
};

/** unique or primary key constraints on table "github_users" */
export enum Github_Users_Constraint {
  /** unique or primary key constraint */
  GithubUsersAccessTokenKey = 'github_users_access_token_key',
  /** unique or primary key constraint */
  UsersGithubIdKey = 'users_github_id_key',
  /** unique or primary key constraint */
  UsersGithubNodeIdKey = 'users_github_node_id_key',
  /** unique or primary key constraint */
  UsersGithubUsernameKey = 'users_github_username_key',
  /** unique or primary key constraint */
  UsersPkey = 'users_pkey'
}

/** input type for incrementing numeric columns in table "github_users" */
export type Github_Users_Inc_Input = {
  /** An integer id that GitHub gives every user. Use github_node_id instead whenever possible. */
  github_database_id?: InputMaybe<Scalars['Int']>;
};

/** input type for inserting data into table "github_users" */
export type Github_Users_Insert_Input = {
  /** Can be null if a user emails us, but doesn't login via OAuth. */
  access_token?: InputMaybe<Scalars['String']>;
  created_at?: InputMaybe<Scalars['timestamptz']>;
  /** User's email according to their GitHub account. We assume that all GitHub accounts have an email associated with it. Note that GitHub does not enforce that emails must be unique, eg. @drshrey and @shreyasjag have the same email. */
  email?: InputMaybe<Scalars['String']>;
  /** An integer id that GitHub gives every user. Use github_node_id instead whenever possible. */
  github_database_id?: InputMaybe<Scalars['Int']>;
  /** User's name according to GitHub, eg. "Barack Obama". */
  github_name?: InputMaybe<Scalars['String']>;
  /** Eg., "MDQ6VXNlcjIyNjg3Mg==". Seems to be used in the v4 GraphQL GitHub API. */
  github_node_id?: InputMaybe<Scalars['String']>;
  github_username?: InputMaybe<Scalars['String']>;
  updated_at?: InputMaybe<Scalars['timestamptz']>;
};

/** aggregate max on columns */
export type Github_Users_Max_Fields = {
  __typename?: 'github_users_max_fields';
  /** Can be null if a user emails us, but doesn't login via OAuth. */
  access_token?: Maybe<Scalars['String']>;
  created_at?: Maybe<Scalars['timestamptz']>;
  /** User's email according to their GitHub account. We assume that all GitHub accounts have an email associated with it. Note that GitHub does not enforce that emails must be unique, eg. @drshrey and @shreyasjag have the same email. */
  email?: Maybe<Scalars['String']>;
  /** An integer id that GitHub gives every user. Use github_node_id instead whenever possible. */
  github_database_id?: Maybe<Scalars['Int']>;
  /** User's name according to GitHub, eg. "Barack Obama". */
  github_name?: Maybe<Scalars['String']>;
  /** Eg., "MDQ6VXNlcjIyNjg3Mg==". Seems to be used in the v4 GraphQL GitHub API. */
  github_node_id?: Maybe<Scalars['String']>;
  github_username?: Maybe<Scalars['String']>;
  updated_at?: Maybe<Scalars['timestamptz']>;
};

/** aggregate min on columns */
export type Github_Users_Min_Fields = {
  __typename?: 'github_users_min_fields';
  /** Can be null if a user emails us, but doesn't login via OAuth. */
  access_token?: Maybe<Scalars['String']>;
  created_at?: Maybe<Scalars['timestamptz']>;
  /** User's email according to their GitHub account. We assume that all GitHub accounts have an email associated with it. Note that GitHub does not enforce that emails must be unique, eg. @drshrey and @shreyasjag have the same email. */
  email?: Maybe<Scalars['String']>;
  /** An integer id that GitHub gives every user. Use github_node_id instead whenever possible. */
  github_database_id?: Maybe<Scalars['Int']>;
  /** User's name according to GitHub, eg. "Barack Obama". */
  github_name?: Maybe<Scalars['String']>;
  /** Eg., "MDQ6VXNlcjIyNjg3Mg==". Seems to be used in the v4 GraphQL GitHub API. */
  github_node_id?: Maybe<Scalars['String']>;
  github_username?: Maybe<Scalars['String']>;
  updated_at?: Maybe<Scalars['timestamptz']>;
};

/** response of any mutation on the table "github_users" */
export type Github_Users_Mutation_Response = {
  __typename?: 'github_users_mutation_response';
  /** number of rows affected by the mutation */
  affected_rows: Scalars['Int'];
  /** data from the rows affected by the mutation */
  returning: Array<Github_Users>;
};

/** input type for inserting object relation for remote table "github_users" */
export type Github_Users_Obj_Rel_Insert_Input = {
  data: Github_Users_Insert_Input;
  /** on conflict condition */
  on_conflict?: InputMaybe<Github_Users_On_Conflict>;
};

/** on conflict condition type for table "github_users" */
export type Github_Users_On_Conflict = {
  constraint: Github_Users_Constraint;
  update_columns?: Array<Github_Users_Update_Column>;
  where?: InputMaybe<Github_Users_Bool_Exp>;
};

/** Ordering options when selecting data from "github_users". */
export type Github_Users_Order_By = {
  access_token?: InputMaybe<Order_By>;
  created_at?: InputMaybe<Order_By>;
  email?: InputMaybe<Order_By>;
  github_database_id?: InputMaybe<Order_By>;
  github_name?: InputMaybe<Order_By>;
  github_node_id?: InputMaybe<Order_By>;
  github_username?: InputMaybe<Order_By>;
  updated_at?: InputMaybe<Order_By>;
};

/** primary key columns input for table: github_users */
export type Github_Users_Pk_Columns_Input = {
  /** Eg., "MDQ6VXNlcjIyNjg3Mg==". Seems to be used in the v4 GraphQL GitHub API. */
  github_node_id: Scalars['String'];
};

/** select columns of table "github_users" */
export enum Github_Users_Select_Column {
  /** column name */
  AccessToken = 'access_token',
  /** column name */
  CreatedAt = 'created_at',
  /** column name */
  Email = 'email',
  /** column name */
  GithubDatabaseId = 'github_database_id',
  /** column name */
  GithubName = 'github_name',
  /** column name */
  GithubNodeId = 'github_node_id',
  /** column name */
  GithubUsername = 'github_username',
  /** column name */
  UpdatedAt = 'updated_at'
}

/** input type for updating data in table "github_users" */
export type Github_Users_Set_Input = {
  /** Can be null if a user emails us, but doesn't login via OAuth. */
  access_token?: InputMaybe<Scalars['String']>;
  created_at?: InputMaybe<Scalars['timestamptz']>;
  /** User's email according to their GitHub account. We assume that all GitHub accounts have an email associated with it. Note that GitHub does not enforce that emails must be unique, eg. @drshrey and @shreyasjag have the same email. */
  email?: InputMaybe<Scalars['String']>;
  /** An integer id that GitHub gives every user. Use github_node_id instead whenever possible. */
  github_database_id?: InputMaybe<Scalars['Int']>;
  /** User's name according to GitHub, eg. "Barack Obama". */
  github_name?: InputMaybe<Scalars['String']>;
  /** Eg., "MDQ6VXNlcjIyNjg3Mg==". Seems to be used in the v4 GraphQL GitHub API. */
  github_node_id?: InputMaybe<Scalars['String']>;
  github_username?: InputMaybe<Scalars['String']>;
  updated_at?: InputMaybe<Scalars['timestamptz']>;
};

/** aggregate stddev on columns */
export type Github_Users_Stddev_Fields = {
  __typename?: 'github_users_stddev_fields';
  /** An integer id that GitHub gives every user. Use github_node_id instead whenever possible. */
  github_database_id?: Maybe<Scalars['Float']>;
};

/** aggregate stddev_pop on columns */
export type Github_Users_Stddev_Pop_Fields = {
  __typename?: 'github_users_stddev_pop_fields';
  /** An integer id that GitHub gives every user. Use github_node_id instead whenever possible. */
  github_database_id?: Maybe<Scalars['Float']>;
};

/** aggregate stddev_samp on columns */
export type Github_Users_Stddev_Samp_Fields = {
  __typename?: 'github_users_stddev_samp_fields';
  /** An integer id that GitHub gives every user. Use github_node_id instead whenever possible. */
  github_database_id?: Maybe<Scalars['Float']>;
};

/** aggregate sum on columns */
export type Github_Users_Sum_Fields = {
  __typename?: 'github_users_sum_fields';
  /** An integer id that GitHub gives every user. Use github_node_id instead whenever possible. */
  github_database_id?: Maybe<Scalars['Int']>;
};

/** update columns of table "github_users" */
export enum Github_Users_Update_Column {
  /** column name */
  AccessToken = 'access_token',
  /** column name */
  CreatedAt = 'created_at',
  /** column name */
  Email = 'email',
  /** column name */
  GithubDatabaseId = 'github_database_id',
  /** column name */
  GithubName = 'github_name',
  /** column name */
  GithubNodeId = 'github_node_id',
  /** column name */
  GithubUsername = 'github_username',
  /** column name */
  UpdatedAt = 'updated_at'
}

/** aggregate var_pop on columns */
export type Github_Users_Var_Pop_Fields = {
  __typename?: 'github_users_var_pop_fields';
  /** An integer id that GitHub gives every user. Use github_node_id instead whenever possible. */
  github_database_id?: Maybe<Scalars['Float']>;
};

/** aggregate var_samp on columns */
export type Github_Users_Var_Samp_Fields = {
  __typename?: 'github_users_var_samp_fields';
  /** An integer id that GitHub gives every user. Use github_node_id instead whenever possible. */
  github_database_id?: Maybe<Scalars['Float']>;
};

/** aggregate variance on columns */
export type Github_Users_Variance_Fields = {
  __typename?: 'github_users_variance_fields';
  /** An integer id that GitHub gives every user. Use github_node_id instead whenever possible. */
  github_database_id?: Maybe<Scalars['Float']>;
};

/**
 * Uniquely identifies a line of code anywhere in the git universe.
 *
 *
 * columns and relationships of "lines"
 *
 */
export type Lines = {
  __typename?: 'lines';
  commit_hash: Scalars['String'];
  file_path: Scalars['String'];
  /** An object relationship */
  github_repos?: Maybe<Commit_Github_Repo>;
  line_number: Scalars['Int'];
  /** An array relationship */
  threads: Array<Threads>;
  /** An aggregate relationship */
  threads_aggregate: Threads_Aggregate;
};


/**
 * Uniquely identifies a line of code anywhere in the git universe.
 *
 *
 * columns and relationships of "lines"
 *
 */
export type LinesThreadsArgs = {
  distinct_on?: InputMaybe<Array<Threads_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']>;
  offset?: InputMaybe<Scalars['Int']>;
  order_by?: InputMaybe<Array<Threads_Order_By>>;
  where?: InputMaybe<Threads_Bool_Exp>;
};


/**
 * Uniquely identifies a line of code anywhere in the git universe.
 *
 *
 * columns and relationships of "lines"
 *
 */
export type LinesThreads_AggregateArgs = {
  distinct_on?: InputMaybe<Array<Threads_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']>;
  offset?: InputMaybe<Scalars['Int']>;
  order_by?: InputMaybe<Array<Threads_Order_By>>;
  where?: InputMaybe<Threads_Bool_Exp>;
};

/** aggregated selection of "lines" */
export type Lines_Aggregate = {
  __typename?: 'lines_aggregate';
  aggregate?: Maybe<Lines_Aggregate_Fields>;
  nodes: Array<Lines>;
};

/** aggregate fields of "lines" */
export type Lines_Aggregate_Fields = {
  __typename?: 'lines_aggregate_fields';
  avg?: Maybe<Lines_Avg_Fields>;
  count: Scalars['Int'];
  max?: Maybe<Lines_Max_Fields>;
  min?: Maybe<Lines_Min_Fields>;
  stddev?: Maybe<Lines_Stddev_Fields>;
  stddev_pop?: Maybe<Lines_Stddev_Pop_Fields>;
  stddev_samp?: Maybe<Lines_Stddev_Samp_Fields>;
  sum?: Maybe<Lines_Sum_Fields>;
  var_pop?: Maybe<Lines_Var_Pop_Fields>;
  var_samp?: Maybe<Lines_Var_Samp_Fields>;
  variance?: Maybe<Lines_Variance_Fields>;
};


/** aggregate fields of "lines" */
export type Lines_Aggregate_FieldsCountArgs = {
  columns?: InputMaybe<Array<Lines_Select_Column>>;
  distinct?: InputMaybe<Scalars['Boolean']>;
};

/** aggregate avg on columns */
export type Lines_Avg_Fields = {
  __typename?: 'lines_avg_fields';
  line_number?: Maybe<Scalars['Float']>;
};

/** Boolean expression to filter rows from the table "lines". All fields are combined with a logical 'AND'. */
export type Lines_Bool_Exp = {
  _and?: InputMaybe<Array<Lines_Bool_Exp>>;
  _not?: InputMaybe<Lines_Bool_Exp>;
  _or?: InputMaybe<Array<Lines_Bool_Exp>>;
  commit_hash?: InputMaybe<String_Comparison_Exp>;
  file_path?: InputMaybe<String_Comparison_Exp>;
  github_repos?: InputMaybe<Commit_Github_Repo_Bool_Exp>;
  line_number?: InputMaybe<Int_Comparison_Exp>;
  threads?: InputMaybe<Threads_Bool_Exp>;
};

/** unique or primary key constraints on table "lines" */
export enum Lines_Constraint {
  /** unique or primary key constraint */
  LinesPkey = 'lines_pkey'
}

/** input type for incrementing numeric columns in table "lines" */
export type Lines_Inc_Input = {
  line_number?: InputMaybe<Scalars['Int']>;
};

/** input type for inserting data into table "lines" */
export type Lines_Insert_Input = {
  commit_hash?: InputMaybe<Scalars['String']>;
  file_path?: InputMaybe<Scalars['String']>;
  github_repos?: InputMaybe<Commit_Github_Repo_Obj_Rel_Insert_Input>;
  line_number?: InputMaybe<Scalars['Int']>;
  threads?: InputMaybe<Threads_Arr_Rel_Insert_Input>;
};

/** aggregate max on columns */
export type Lines_Max_Fields = {
  __typename?: 'lines_max_fields';
  commit_hash?: Maybe<Scalars['String']>;
  file_path?: Maybe<Scalars['String']>;
  line_number?: Maybe<Scalars['Int']>;
};

/** aggregate min on columns */
export type Lines_Min_Fields = {
  __typename?: 'lines_min_fields';
  commit_hash?: Maybe<Scalars['String']>;
  file_path?: Maybe<Scalars['String']>;
  line_number?: Maybe<Scalars['Int']>;
};

/** response of any mutation on the table "lines" */
export type Lines_Mutation_Response = {
  __typename?: 'lines_mutation_response';
  /** number of rows affected by the mutation */
  affected_rows: Scalars['Int'];
  /** data from the rows affected by the mutation */
  returning: Array<Lines>;
};

/** input type for inserting object relation for remote table "lines" */
export type Lines_Obj_Rel_Insert_Input = {
  data: Lines_Insert_Input;
  /** on conflict condition */
  on_conflict?: InputMaybe<Lines_On_Conflict>;
};

/** on conflict condition type for table "lines" */
export type Lines_On_Conflict = {
  constraint: Lines_Constraint;
  update_columns?: Array<Lines_Update_Column>;
  where?: InputMaybe<Lines_Bool_Exp>;
};

/** Ordering options when selecting data from "lines". */
export type Lines_Order_By = {
  commit_hash?: InputMaybe<Order_By>;
  file_path?: InputMaybe<Order_By>;
  github_repos?: InputMaybe<Commit_Github_Repo_Order_By>;
  line_number?: InputMaybe<Order_By>;
  threads_aggregate?: InputMaybe<Threads_Aggregate_Order_By>;
};

/** primary key columns input for table: lines */
export type Lines_Pk_Columns_Input = {
  commit_hash: Scalars['String'];
  file_path: Scalars['String'];
  line_number: Scalars['Int'];
};

/** select columns of table "lines" */
export enum Lines_Select_Column {
  /** column name */
  CommitHash = 'commit_hash',
  /** column name */
  FilePath = 'file_path',
  /** column name */
  LineNumber = 'line_number'
}

/** input type for updating data in table "lines" */
export type Lines_Set_Input = {
  commit_hash?: InputMaybe<Scalars['String']>;
  file_path?: InputMaybe<Scalars['String']>;
  line_number?: InputMaybe<Scalars['Int']>;
};

/** aggregate stddev on columns */
export type Lines_Stddev_Fields = {
  __typename?: 'lines_stddev_fields';
  line_number?: Maybe<Scalars['Float']>;
};

/** aggregate stddev_pop on columns */
export type Lines_Stddev_Pop_Fields = {
  __typename?: 'lines_stddev_pop_fields';
  line_number?: Maybe<Scalars['Float']>;
};

/** aggregate stddev_samp on columns */
export type Lines_Stddev_Samp_Fields = {
  __typename?: 'lines_stddev_samp_fields';
  line_number?: Maybe<Scalars['Float']>;
};

/** aggregate sum on columns */
export type Lines_Sum_Fields = {
  __typename?: 'lines_sum_fields';
  line_number?: Maybe<Scalars['Int']>;
};

/** update columns of table "lines" */
export enum Lines_Update_Column {
  /** column name */
  CommitHash = 'commit_hash',
  /** column name */
  FilePath = 'file_path',
  /** column name */
  LineNumber = 'line_number'
}

/** aggregate var_pop on columns */
export type Lines_Var_Pop_Fields = {
  __typename?: 'lines_var_pop_fields';
  line_number?: Maybe<Scalars['Float']>;
};

/** aggregate var_samp on columns */
export type Lines_Var_Samp_Fields = {
  __typename?: 'lines_var_samp_fields';
  line_number?: Maybe<Scalars['Float']>;
};

/** aggregate variance on columns */
export type Lines_Variance_Fields = {
  __typename?: 'lines_variance_fields';
  line_number?: Maybe<Scalars['Float']>;
};

/** mutation root */
export type Mutation_Root = {
  __typename?: 'mutation_root';
  CalculateBlameLines: Scalars['Boolean'];
  StartCuddlefishSession: StartCuddlefishSessionResponse;
  StartThread: Scalars['String'];
  /** delete data from the table: "blamelines" */
  delete_blamelines?: Maybe<Blamelines_Mutation_Response>;
  /** delete single row from the table: "blamelines" */
  delete_blamelines_by_pk?: Maybe<Blamelines>;
  /** delete data from the table: "comments" */
  delete_comments?: Maybe<Comments_Mutation_Response>;
  /** delete single row from the table: "comments" */
  delete_comments_by_pk?: Maybe<Comments>;
  /** delete data from the table: "commit_github_repo" */
  delete_commit_github_repo?: Maybe<Commit_Github_Repo_Mutation_Response>;
  /** delete single row from the table: "commit_github_repo" */
  delete_commit_github_repo_by_pk?: Maybe<Commit_Github_Repo>;
  /** delete data from the table: "commits" */
  delete_commits?: Maybe<Commits_Mutation_Response>;
  /** delete single row from the table: "commits" */
  delete_commits_by_pk?: Maybe<Commits>;
  /** delete data from the table: "github_users" */
  delete_github_users?: Maybe<Github_Users_Mutation_Response>;
  /** delete single row from the table: "github_users" */
  delete_github_users_by_pk?: Maybe<Github_Users>;
  /** delete data from the table: "lines" */
  delete_lines?: Maybe<Lines_Mutation_Response>;
  /** delete single row from the table: "lines" */
  delete_lines_by_pk?: Maybe<Lines>;
  /** delete data from the table: "threads" */
  delete_threads?: Maybe<Threads_Mutation_Response>;
  /** delete single row from the table: "threads" */
  delete_threads_by_pk?: Maybe<Threads>;
  /** delete data from the table: "user_sessions" */
  delete_user_sessions?: Maybe<User_Sessions_Mutation_Response>;
  /** delete single row from the table: "user_sessions" */
  delete_user_sessions_by_pk?: Maybe<User_Sessions>;
  /** insert data into the table: "blamelines" */
  insert_blamelines?: Maybe<Blamelines_Mutation_Response>;
  /** insert a single row into the table: "blamelines" */
  insert_blamelines_one?: Maybe<Blamelines>;
  /** insert data into the table: "comments" */
  insert_comments?: Maybe<Comments_Mutation_Response>;
  /** insert a single row into the table: "comments" */
  insert_comments_one?: Maybe<Comments>;
  /** insert data into the table: "commit_github_repo" */
  insert_commit_github_repo?: Maybe<Commit_Github_Repo_Mutation_Response>;
  /** insert a single row into the table: "commit_github_repo" */
  insert_commit_github_repo_one?: Maybe<Commit_Github_Repo>;
  /** insert data into the table: "commits" */
  insert_commits?: Maybe<Commits_Mutation_Response>;
  /** insert a single row into the table: "commits" */
  insert_commits_one?: Maybe<Commits>;
  /** insert data into the table: "github_users" */
  insert_github_users?: Maybe<Github_Users_Mutation_Response>;
  /** insert a single row into the table: "github_users" */
  insert_github_users_one?: Maybe<Github_Users>;
  /** insert data into the table: "lines" */
  insert_lines?: Maybe<Lines_Mutation_Response>;
  /** insert a single row into the table: "lines" */
  insert_lines_one?: Maybe<Lines>;
  /** insert data into the table: "threads" */
  insert_threads?: Maybe<Threads_Mutation_Response>;
  /** insert a single row into the table: "threads" */
  insert_threads_one?: Maybe<Threads>;
  /** insert data into the table: "user_sessions" */
  insert_user_sessions?: Maybe<User_Sessions_Mutation_Response>;
  /** insert a single row into the table: "user_sessions" */
  insert_user_sessions_one?: Maybe<User_Sessions>;
  /** update data of the table: "blamelines" */
  update_blamelines?: Maybe<Blamelines_Mutation_Response>;
  /** update single row of the table: "blamelines" */
  update_blamelines_by_pk?: Maybe<Blamelines>;
  /** update data of the table: "comments" */
  update_comments?: Maybe<Comments_Mutation_Response>;
  /** update single row of the table: "comments" */
  update_comments_by_pk?: Maybe<Comments>;
  /** update data of the table: "commit_github_repo" */
  update_commit_github_repo?: Maybe<Commit_Github_Repo_Mutation_Response>;
  /** update single row of the table: "commit_github_repo" */
  update_commit_github_repo_by_pk?: Maybe<Commit_Github_Repo>;
  /** update data of the table: "commits" */
  update_commits?: Maybe<Commits_Mutation_Response>;
  /** update single row of the table: "commits" */
  update_commits_by_pk?: Maybe<Commits>;
  /** update data of the table: "github_users" */
  update_github_users?: Maybe<Github_Users_Mutation_Response>;
  /** update single row of the table: "github_users" */
  update_github_users_by_pk?: Maybe<Github_Users>;
  /** update data of the table: "lines" */
  update_lines?: Maybe<Lines_Mutation_Response>;
  /** update single row of the table: "lines" */
  update_lines_by_pk?: Maybe<Lines>;
  /** update data of the table: "threads" */
  update_threads?: Maybe<Threads_Mutation_Response>;
  /** update single row of the table: "threads" */
  update_threads_by_pk?: Maybe<Threads>;
  /** update data of the table: "user_sessions" */
  update_user_sessions?: Maybe<User_Sessions_Mutation_Response>;
  /** update single row of the table: "user_sessions" */
  update_user_sessions_by_pk?: Maybe<User_Sessions>;
};


/** mutation root */
export type Mutation_RootCalculateBlameLinesArgs = {
  filePath: Scalars['String'];
  lastCommit: Scalars['String'];
  repoId: Scalars['String'];
};


/** mutation root */
export type Mutation_RootStartCuddlefishSessionArgs = {
  github_access_token: Scalars['String'];
};


/** mutation root */
export type Mutation_RootStartThreadArgs = {
  body: Scalars['String'];
  commitHash: Scalars['String'];
  filePath: Scalars['String'];
  lineNumber: Scalars['Int'];
  repoIds: Array<Scalars['String']>;
};


/** mutation root */
export type Mutation_RootDelete_BlamelinesArgs = {
  where: Blamelines_Bool_Exp;
};


/** mutation root */
export type Mutation_RootDelete_Blamelines_By_PkArgs = {
  x_commit_hash: Scalars['String'];
  x_file_path: Scalars['String'];
  x_line_number: Scalars['Int'];
};


/** mutation root */
export type Mutation_RootDelete_CommentsArgs = {
  where: Comments_Bool_Exp;
};


/** mutation root */
export type Mutation_RootDelete_Comments_By_PkArgs = {
  id: Scalars['uuid'];
};


/** mutation root */
export type Mutation_RootDelete_Commit_Github_RepoArgs = {
  where: Commit_Github_Repo_Bool_Exp;
};


/** mutation root */
export type Mutation_RootDelete_Commit_Github_Repo_By_PkArgs = {
  commit_hash: Scalars['String'];
  repo_github_node_id: Scalars['String'];
};


/** mutation root */
export type Mutation_RootDelete_CommitsArgs = {
  where: Commits_Bool_Exp;
};


/** mutation root */
export type Mutation_RootDelete_Commits_By_PkArgs = {
  commit_hash: Scalars['String'];
};


/** mutation root */
export type Mutation_RootDelete_Github_UsersArgs = {
  where: Github_Users_Bool_Exp;
};


/** mutation root */
export type Mutation_RootDelete_Github_Users_By_PkArgs = {
  github_node_id: Scalars['String'];
};


/** mutation root */
export type Mutation_RootDelete_LinesArgs = {
  where: Lines_Bool_Exp;
};


/** mutation root */
export type Mutation_RootDelete_Lines_By_PkArgs = {
  commit_hash: Scalars['String'];
  file_path: Scalars['String'];
  line_number: Scalars['Int'];
};


/** mutation root */
export type Mutation_RootDelete_ThreadsArgs = {
  where: Threads_Bool_Exp;
};


/** mutation root */
export type Mutation_RootDelete_Threads_By_PkArgs = {
  id: Scalars['uuid'];
};


/** mutation root */
export type Mutation_RootDelete_User_SessionsArgs = {
  where: User_Sessions_Bool_Exp;
};


/** mutation root */
export type Mutation_RootDelete_User_Sessions_By_PkArgs = {
  id: Scalars['uuid'];
};


/** mutation root */
export type Mutation_RootInsert_BlamelinesArgs = {
  objects: Array<Blamelines_Insert_Input>;
  on_conflict?: InputMaybe<Blamelines_On_Conflict>;
};


/** mutation root */
export type Mutation_RootInsert_Blamelines_OneArgs = {
  object: Blamelines_Insert_Input;
  on_conflict?: InputMaybe<Blamelines_On_Conflict>;
};


/** mutation root */
export type Mutation_RootInsert_CommentsArgs = {
  objects: Array<Comments_Insert_Input>;
  on_conflict?: InputMaybe<Comments_On_Conflict>;
};


/** mutation root */
export type Mutation_RootInsert_Comments_OneArgs = {
  object: Comments_Insert_Input;
  on_conflict?: InputMaybe<Comments_On_Conflict>;
};


/** mutation root */
export type Mutation_RootInsert_Commit_Github_RepoArgs = {
  objects: Array<Commit_Github_Repo_Insert_Input>;
  on_conflict?: InputMaybe<Commit_Github_Repo_On_Conflict>;
};


/** mutation root */
export type Mutation_RootInsert_Commit_Github_Repo_OneArgs = {
  object: Commit_Github_Repo_Insert_Input;
  on_conflict?: InputMaybe<Commit_Github_Repo_On_Conflict>;
};


/** mutation root */
export type Mutation_RootInsert_CommitsArgs = {
  objects: Array<Commits_Insert_Input>;
  on_conflict?: InputMaybe<Commits_On_Conflict>;
};


/** mutation root */
export type Mutation_RootInsert_Commits_OneArgs = {
  object: Commits_Insert_Input;
  on_conflict?: InputMaybe<Commits_On_Conflict>;
};


/** mutation root */
export type Mutation_RootInsert_Github_UsersArgs = {
  objects: Array<Github_Users_Insert_Input>;
  on_conflict?: InputMaybe<Github_Users_On_Conflict>;
};


/** mutation root */
export type Mutation_RootInsert_Github_Users_OneArgs = {
  object: Github_Users_Insert_Input;
  on_conflict?: InputMaybe<Github_Users_On_Conflict>;
};


/** mutation root */
export type Mutation_RootInsert_LinesArgs = {
  objects: Array<Lines_Insert_Input>;
  on_conflict?: InputMaybe<Lines_On_Conflict>;
};


/** mutation root */
export type Mutation_RootInsert_Lines_OneArgs = {
  object: Lines_Insert_Input;
  on_conflict?: InputMaybe<Lines_On_Conflict>;
};


/** mutation root */
export type Mutation_RootInsert_ThreadsArgs = {
  objects: Array<Threads_Insert_Input>;
  on_conflict?: InputMaybe<Threads_On_Conflict>;
};


/** mutation root */
export type Mutation_RootInsert_Threads_OneArgs = {
  object: Threads_Insert_Input;
  on_conflict?: InputMaybe<Threads_On_Conflict>;
};


/** mutation root */
export type Mutation_RootInsert_User_SessionsArgs = {
  objects: Array<User_Sessions_Insert_Input>;
  on_conflict?: InputMaybe<User_Sessions_On_Conflict>;
};


/** mutation root */
export type Mutation_RootInsert_User_Sessions_OneArgs = {
  object: User_Sessions_Insert_Input;
  on_conflict?: InputMaybe<User_Sessions_On_Conflict>;
};


/** mutation root */
export type Mutation_RootUpdate_BlamelinesArgs = {
  _inc?: InputMaybe<Blamelines_Inc_Input>;
  _set?: InputMaybe<Blamelines_Set_Input>;
  where: Blamelines_Bool_Exp;
};


/** mutation root */
export type Mutation_RootUpdate_Blamelines_By_PkArgs = {
  _inc?: InputMaybe<Blamelines_Inc_Input>;
  _set?: InputMaybe<Blamelines_Set_Input>;
  pk_columns: Blamelines_Pk_Columns_Input;
};


/** mutation root */
export type Mutation_RootUpdate_CommentsArgs = {
  _set?: InputMaybe<Comments_Set_Input>;
  where: Comments_Bool_Exp;
};


/** mutation root */
export type Mutation_RootUpdate_Comments_By_PkArgs = {
  _set?: InputMaybe<Comments_Set_Input>;
  pk_columns: Comments_Pk_Columns_Input;
};


/** mutation root */
export type Mutation_RootUpdate_Commit_Github_RepoArgs = {
  _set?: InputMaybe<Commit_Github_Repo_Set_Input>;
  where: Commit_Github_Repo_Bool_Exp;
};


/** mutation root */
export type Mutation_RootUpdate_Commit_Github_Repo_By_PkArgs = {
  _set?: InputMaybe<Commit_Github_Repo_Set_Input>;
  pk_columns: Commit_Github_Repo_Pk_Columns_Input;
};


/** mutation root */
export type Mutation_RootUpdate_CommitsArgs = {
  _set?: InputMaybe<Commits_Set_Input>;
  where: Commits_Bool_Exp;
};


/** mutation root */
export type Mutation_RootUpdate_Commits_By_PkArgs = {
  _set?: InputMaybe<Commits_Set_Input>;
  pk_columns: Commits_Pk_Columns_Input;
};


/** mutation root */
export type Mutation_RootUpdate_Github_UsersArgs = {
  _inc?: InputMaybe<Github_Users_Inc_Input>;
  _set?: InputMaybe<Github_Users_Set_Input>;
  where: Github_Users_Bool_Exp;
};


/** mutation root */
export type Mutation_RootUpdate_Github_Users_By_PkArgs = {
  _inc?: InputMaybe<Github_Users_Inc_Input>;
  _set?: InputMaybe<Github_Users_Set_Input>;
  pk_columns: Github_Users_Pk_Columns_Input;
};


/** mutation root */
export type Mutation_RootUpdate_LinesArgs = {
  _inc?: InputMaybe<Lines_Inc_Input>;
  _set?: InputMaybe<Lines_Set_Input>;
  where: Lines_Bool_Exp;
};


/** mutation root */
export type Mutation_RootUpdate_Lines_By_PkArgs = {
  _inc?: InputMaybe<Lines_Inc_Input>;
  _set?: InputMaybe<Lines_Set_Input>;
  pk_columns: Lines_Pk_Columns_Input;
};


/** mutation root */
export type Mutation_RootUpdate_ThreadsArgs = {
  _inc?: InputMaybe<Threads_Inc_Input>;
  _set?: InputMaybe<Threads_Set_Input>;
  where: Threads_Bool_Exp;
};


/** mutation root */
export type Mutation_RootUpdate_Threads_By_PkArgs = {
  _inc?: InputMaybe<Threads_Inc_Input>;
  _set?: InputMaybe<Threads_Set_Input>;
  pk_columns: Threads_Pk_Columns_Input;
};


/** mutation root */
export type Mutation_RootUpdate_User_SessionsArgs = {
  _set?: InputMaybe<User_Sessions_Set_Input>;
  where: User_Sessions_Bool_Exp;
};


/** mutation root */
export type Mutation_RootUpdate_User_Sessions_By_PkArgs = {
  _set?: InputMaybe<User_Sessions_Set_Input>;
  pk_columns: User_Sessions_Pk_Columns_Input;
};

/** column ordering options */
export enum Order_By {
  /** in ascending order, nulls last */
  Asc = 'asc',
  /** in ascending order, nulls first */
  AscNullsFirst = 'asc_nulls_first',
  /** in ascending order, nulls last */
  AscNullsLast = 'asc_nulls_last',
  /** in descending order, nulls first */
  Desc = 'desc',
  /** in descending order, nulls first */
  DescNullsFirst = 'desc_nulls_first',
  /** in descending order, nulls last */
  DescNullsLast = 'desc_nulls_last'
}

export type Query_Root = {
  __typename?: 'query_root';
  /** fetch data from the table: "blamelines" */
  blamelines: Array<Blamelines>;
  /** fetch aggregated fields from the table: "blamelines" */
  blamelines_aggregate: Blamelines_Aggregate;
  /** fetch data from the table: "blamelines" using primary key columns */
  blamelines_by_pk?: Maybe<Blamelines>;
  /** An array relationship */
  comments: Array<Comments>;
  /** An aggregate relationship */
  comments_aggregate: Comments_Aggregate;
  /** fetch data from the table: "comments" using primary key columns */
  comments_by_pk?: Maybe<Comments>;
  /** fetch data from the table: "commit_github_repo" */
  commit_github_repo: Array<Commit_Github_Repo>;
  /** fetch aggregated fields from the table: "commit_github_repo" */
  commit_github_repo_aggregate: Commit_Github_Repo_Aggregate;
  /** fetch data from the table: "commit_github_repo" using primary key columns */
  commit_github_repo_by_pk?: Maybe<Commit_Github_Repo>;
  /** fetch data from the table: "commits" */
  commits: Array<Commits>;
  /** fetch aggregated fields from the table: "commits" */
  commits_aggregate: Commits_Aggregate;
  /** fetch data from the table: "commits" using primary key columns */
  commits_by_pk?: Maybe<Commits>;
  /** fetch data from the table: "github_users" */
  github_users: Array<Github_Users>;
  /** fetch aggregated fields from the table: "github_users" */
  github_users_aggregate: Github_Users_Aggregate;
  /** fetch data from the table: "github_users" using primary key columns */
  github_users_by_pk?: Maybe<Github_Users>;
  /** fetch data from the table: "lines" */
  lines: Array<Lines>;
  /** fetch aggregated fields from the table: "lines" */
  lines_aggregate: Lines_Aggregate;
  /** fetch data from the table: "lines" using primary key columns */
  lines_by_pk?: Maybe<Lines>;
  noop: Scalars['Boolean'];
  /** An array relationship */
  threads: Array<Threads>;
  /** An aggregate relationship */
  threads_aggregate: Threads_Aggregate;
  /** fetch data from the table: "threads" using primary key columns */
  threads_by_pk?: Maybe<Threads>;
  /** fetch data from the table: "user_sessions" */
  user_sessions: Array<User_Sessions>;
  /** fetch aggregated fields from the table: "user_sessions" */
  user_sessions_aggregate: User_Sessions_Aggregate;
  /** fetch data from the table: "user_sessions" using primary key columns */
  user_sessions_by_pk?: Maybe<User_Sessions>;
};


export type Query_RootBlamelinesArgs = {
  distinct_on?: InputMaybe<Array<Blamelines_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']>;
  offset?: InputMaybe<Scalars['Int']>;
  order_by?: InputMaybe<Array<Blamelines_Order_By>>;
  where?: InputMaybe<Blamelines_Bool_Exp>;
};


export type Query_RootBlamelines_AggregateArgs = {
  distinct_on?: InputMaybe<Array<Blamelines_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']>;
  offset?: InputMaybe<Scalars['Int']>;
  order_by?: InputMaybe<Array<Blamelines_Order_By>>;
  where?: InputMaybe<Blamelines_Bool_Exp>;
};


export type Query_RootBlamelines_By_PkArgs = {
  x_commit_hash: Scalars['String'];
  x_file_path: Scalars['String'];
  x_line_number: Scalars['Int'];
};


export type Query_RootCommentsArgs = {
  distinct_on?: InputMaybe<Array<Comments_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']>;
  offset?: InputMaybe<Scalars['Int']>;
  order_by?: InputMaybe<Array<Comments_Order_By>>;
  where?: InputMaybe<Comments_Bool_Exp>;
};


export type Query_RootComments_AggregateArgs = {
  distinct_on?: InputMaybe<Array<Comments_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']>;
  offset?: InputMaybe<Scalars['Int']>;
  order_by?: InputMaybe<Array<Comments_Order_By>>;
  where?: InputMaybe<Comments_Bool_Exp>;
};


export type Query_RootComments_By_PkArgs = {
  id: Scalars['uuid'];
};


export type Query_RootCommit_Github_RepoArgs = {
  distinct_on?: InputMaybe<Array<Commit_Github_Repo_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']>;
  offset?: InputMaybe<Scalars['Int']>;
  order_by?: InputMaybe<Array<Commit_Github_Repo_Order_By>>;
  where?: InputMaybe<Commit_Github_Repo_Bool_Exp>;
};


export type Query_RootCommit_Github_Repo_AggregateArgs = {
  distinct_on?: InputMaybe<Array<Commit_Github_Repo_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']>;
  offset?: InputMaybe<Scalars['Int']>;
  order_by?: InputMaybe<Array<Commit_Github_Repo_Order_By>>;
  where?: InputMaybe<Commit_Github_Repo_Bool_Exp>;
};


export type Query_RootCommit_Github_Repo_By_PkArgs = {
  commit_hash: Scalars['String'];
  repo_github_node_id: Scalars['String'];
};


export type Query_RootCommitsArgs = {
  distinct_on?: InputMaybe<Array<Commits_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']>;
  offset?: InputMaybe<Scalars['Int']>;
  order_by?: InputMaybe<Array<Commits_Order_By>>;
  where?: InputMaybe<Commits_Bool_Exp>;
};


export type Query_RootCommits_AggregateArgs = {
  distinct_on?: InputMaybe<Array<Commits_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']>;
  offset?: InputMaybe<Scalars['Int']>;
  order_by?: InputMaybe<Array<Commits_Order_By>>;
  where?: InputMaybe<Commits_Bool_Exp>;
};


export type Query_RootCommits_By_PkArgs = {
  commit_hash: Scalars['String'];
};


export type Query_RootGithub_UsersArgs = {
  distinct_on?: InputMaybe<Array<Github_Users_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']>;
  offset?: InputMaybe<Scalars['Int']>;
  order_by?: InputMaybe<Array<Github_Users_Order_By>>;
  where?: InputMaybe<Github_Users_Bool_Exp>;
};


export type Query_RootGithub_Users_AggregateArgs = {
  distinct_on?: InputMaybe<Array<Github_Users_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']>;
  offset?: InputMaybe<Scalars['Int']>;
  order_by?: InputMaybe<Array<Github_Users_Order_By>>;
  where?: InputMaybe<Github_Users_Bool_Exp>;
};


export type Query_RootGithub_Users_By_PkArgs = {
  github_node_id: Scalars['String'];
};


export type Query_RootLinesArgs = {
  distinct_on?: InputMaybe<Array<Lines_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']>;
  offset?: InputMaybe<Scalars['Int']>;
  order_by?: InputMaybe<Array<Lines_Order_By>>;
  where?: InputMaybe<Lines_Bool_Exp>;
};


export type Query_RootLines_AggregateArgs = {
  distinct_on?: InputMaybe<Array<Lines_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']>;
  offset?: InputMaybe<Scalars['Int']>;
  order_by?: InputMaybe<Array<Lines_Order_By>>;
  where?: InputMaybe<Lines_Bool_Exp>;
};


export type Query_RootLines_By_PkArgs = {
  commit_hash: Scalars['String'];
  file_path: Scalars['String'];
  line_number: Scalars['Int'];
};


export type Query_RootThreadsArgs = {
  distinct_on?: InputMaybe<Array<Threads_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']>;
  offset?: InputMaybe<Scalars['Int']>;
  order_by?: InputMaybe<Array<Threads_Order_By>>;
  where?: InputMaybe<Threads_Bool_Exp>;
};


export type Query_RootThreads_AggregateArgs = {
  distinct_on?: InputMaybe<Array<Threads_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']>;
  offset?: InputMaybe<Scalars['Int']>;
  order_by?: InputMaybe<Array<Threads_Order_By>>;
  where?: InputMaybe<Threads_Bool_Exp>;
};


export type Query_RootThreads_By_PkArgs = {
  id: Scalars['uuid'];
};


export type Query_RootUser_SessionsArgs = {
  distinct_on?: InputMaybe<Array<User_Sessions_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']>;
  offset?: InputMaybe<Scalars['Int']>;
  order_by?: InputMaybe<Array<User_Sessions_Order_By>>;
  where?: InputMaybe<User_Sessions_Bool_Exp>;
};


export type Query_RootUser_Sessions_AggregateArgs = {
  distinct_on?: InputMaybe<Array<User_Sessions_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']>;
  offset?: InputMaybe<Scalars['Int']>;
  order_by?: InputMaybe<Array<User_Sessions_Order_By>>;
  where?: InputMaybe<User_Sessions_Bool_Exp>;
};


export type Query_RootUser_Sessions_By_PkArgs = {
  id: Scalars['uuid'];
};

export type Subscription_Root = {
  __typename?: 'subscription_root';
  /** fetch data from the table: "blamelines" */
  blamelines: Array<Blamelines>;
  /** fetch aggregated fields from the table: "blamelines" */
  blamelines_aggregate: Blamelines_Aggregate;
  /** fetch data from the table: "blamelines" using primary key columns */
  blamelines_by_pk?: Maybe<Blamelines>;
  /** An array relationship */
  comments: Array<Comments>;
  /** An aggregate relationship */
  comments_aggregate: Comments_Aggregate;
  /** fetch data from the table: "comments" using primary key columns */
  comments_by_pk?: Maybe<Comments>;
  /** fetch data from the table: "commit_github_repo" */
  commit_github_repo: Array<Commit_Github_Repo>;
  /** fetch aggregated fields from the table: "commit_github_repo" */
  commit_github_repo_aggregate: Commit_Github_Repo_Aggregate;
  /** fetch data from the table: "commit_github_repo" using primary key columns */
  commit_github_repo_by_pk?: Maybe<Commit_Github_Repo>;
  /** fetch data from the table: "commits" */
  commits: Array<Commits>;
  /** fetch aggregated fields from the table: "commits" */
  commits_aggregate: Commits_Aggregate;
  /** fetch data from the table: "commits" using primary key columns */
  commits_by_pk?: Maybe<Commits>;
  /** fetch data from the table: "github_users" */
  github_users: Array<Github_Users>;
  /** fetch aggregated fields from the table: "github_users" */
  github_users_aggregate: Github_Users_Aggregate;
  /** fetch data from the table: "github_users" using primary key columns */
  github_users_by_pk?: Maybe<Github_Users>;
  /** fetch data from the table: "lines" */
  lines: Array<Lines>;
  /** fetch aggregated fields from the table: "lines" */
  lines_aggregate: Lines_Aggregate;
  /** fetch data from the table: "lines" using primary key columns */
  lines_by_pk?: Maybe<Lines>;
  /** An array relationship */
  threads: Array<Threads>;
  /** An aggregate relationship */
  threads_aggregate: Threads_Aggregate;
  /** fetch data from the table: "threads" using primary key columns */
  threads_by_pk?: Maybe<Threads>;
  /** fetch data from the table: "user_sessions" */
  user_sessions: Array<User_Sessions>;
  /** fetch aggregated fields from the table: "user_sessions" */
  user_sessions_aggregate: User_Sessions_Aggregate;
  /** fetch data from the table: "user_sessions" using primary key columns */
  user_sessions_by_pk?: Maybe<User_Sessions>;
};


export type Subscription_RootBlamelinesArgs = {
  distinct_on?: InputMaybe<Array<Blamelines_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']>;
  offset?: InputMaybe<Scalars['Int']>;
  order_by?: InputMaybe<Array<Blamelines_Order_By>>;
  where?: InputMaybe<Blamelines_Bool_Exp>;
};


export type Subscription_RootBlamelines_AggregateArgs = {
  distinct_on?: InputMaybe<Array<Blamelines_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']>;
  offset?: InputMaybe<Scalars['Int']>;
  order_by?: InputMaybe<Array<Blamelines_Order_By>>;
  where?: InputMaybe<Blamelines_Bool_Exp>;
};


export type Subscription_RootBlamelines_By_PkArgs = {
  x_commit_hash: Scalars['String'];
  x_file_path: Scalars['String'];
  x_line_number: Scalars['Int'];
};


export type Subscription_RootCommentsArgs = {
  distinct_on?: InputMaybe<Array<Comments_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']>;
  offset?: InputMaybe<Scalars['Int']>;
  order_by?: InputMaybe<Array<Comments_Order_By>>;
  where?: InputMaybe<Comments_Bool_Exp>;
};


export type Subscription_RootComments_AggregateArgs = {
  distinct_on?: InputMaybe<Array<Comments_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']>;
  offset?: InputMaybe<Scalars['Int']>;
  order_by?: InputMaybe<Array<Comments_Order_By>>;
  where?: InputMaybe<Comments_Bool_Exp>;
};


export type Subscription_RootComments_By_PkArgs = {
  id: Scalars['uuid'];
};


export type Subscription_RootCommit_Github_RepoArgs = {
  distinct_on?: InputMaybe<Array<Commit_Github_Repo_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']>;
  offset?: InputMaybe<Scalars['Int']>;
  order_by?: InputMaybe<Array<Commit_Github_Repo_Order_By>>;
  where?: InputMaybe<Commit_Github_Repo_Bool_Exp>;
};


export type Subscription_RootCommit_Github_Repo_AggregateArgs = {
  distinct_on?: InputMaybe<Array<Commit_Github_Repo_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']>;
  offset?: InputMaybe<Scalars['Int']>;
  order_by?: InputMaybe<Array<Commit_Github_Repo_Order_By>>;
  where?: InputMaybe<Commit_Github_Repo_Bool_Exp>;
};


export type Subscription_RootCommit_Github_Repo_By_PkArgs = {
  commit_hash: Scalars['String'];
  repo_github_node_id: Scalars['String'];
};


export type Subscription_RootCommitsArgs = {
  distinct_on?: InputMaybe<Array<Commits_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']>;
  offset?: InputMaybe<Scalars['Int']>;
  order_by?: InputMaybe<Array<Commits_Order_By>>;
  where?: InputMaybe<Commits_Bool_Exp>;
};


export type Subscription_RootCommits_AggregateArgs = {
  distinct_on?: InputMaybe<Array<Commits_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']>;
  offset?: InputMaybe<Scalars['Int']>;
  order_by?: InputMaybe<Array<Commits_Order_By>>;
  where?: InputMaybe<Commits_Bool_Exp>;
};


export type Subscription_RootCommits_By_PkArgs = {
  commit_hash: Scalars['String'];
};


export type Subscription_RootGithub_UsersArgs = {
  distinct_on?: InputMaybe<Array<Github_Users_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']>;
  offset?: InputMaybe<Scalars['Int']>;
  order_by?: InputMaybe<Array<Github_Users_Order_By>>;
  where?: InputMaybe<Github_Users_Bool_Exp>;
};


export type Subscription_RootGithub_Users_AggregateArgs = {
  distinct_on?: InputMaybe<Array<Github_Users_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']>;
  offset?: InputMaybe<Scalars['Int']>;
  order_by?: InputMaybe<Array<Github_Users_Order_By>>;
  where?: InputMaybe<Github_Users_Bool_Exp>;
};


export type Subscription_RootGithub_Users_By_PkArgs = {
  github_node_id: Scalars['String'];
};


export type Subscription_RootLinesArgs = {
  distinct_on?: InputMaybe<Array<Lines_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']>;
  offset?: InputMaybe<Scalars['Int']>;
  order_by?: InputMaybe<Array<Lines_Order_By>>;
  where?: InputMaybe<Lines_Bool_Exp>;
};


export type Subscription_RootLines_AggregateArgs = {
  distinct_on?: InputMaybe<Array<Lines_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']>;
  offset?: InputMaybe<Scalars['Int']>;
  order_by?: InputMaybe<Array<Lines_Order_By>>;
  where?: InputMaybe<Lines_Bool_Exp>;
};


export type Subscription_RootLines_By_PkArgs = {
  commit_hash: Scalars['String'];
  file_path: Scalars['String'];
  line_number: Scalars['Int'];
};


export type Subscription_RootThreadsArgs = {
  distinct_on?: InputMaybe<Array<Threads_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']>;
  offset?: InputMaybe<Scalars['Int']>;
  order_by?: InputMaybe<Array<Threads_Order_By>>;
  where?: InputMaybe<Threads_Bool_Exp>;
};


export type Subscription_RootThreads_AggregateArgs = {
  distinct_on?: InputMaybe<Array<Threads_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']>;
  offset?: InputMaybe<Scalars['Int']>;
  order_by?: InputMaybe<Array<Threads_Order_By>>;
  where?: InputMaybe<Threads_Bool_Exp>;
};


export type Subscription_RootThreads_By_PkArgs = {
  id: Scalars['uuid'];
};


export type Subscription_RootUser_SessionsArgs = {
  distinct_on?: InputMaybe<Array<User_Sessions_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']>;
  offset?: InputMaybe<Scalars['Int']>;
  order_by?: InputMaybe<Array<User_Sessions_Order_By>>;
  where?: InputMaybe<User_Sessions_Bool_Exp>;
};


export type Subscription_RootUser_Sessions_AggregateArgs = {
  distinct_on?: InputMaybe<Array<User_Sessions_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']>;
  offset?: InputMaybe<Scalars['Int']>;
  order_by?: InputMaybe<Array<User_Sessions_Order_By>>;
  where?: InputMaybe<User_Sessions_Bool_Exp>;
};


export type Subscription_RootUser_Sessions_By_PkArgs = {
  id: Scalars['uuid'];
};

/**
 * All threads. There's no constraint that there are comments for each thread. There is a UNIQUE constraint on  (commit, file, line). There's no constraint that (commit, file_path, line_number) be in the blamelines table. However, there is a foreign key relationship with the lines table.
 *
 *
 * columns and relationships of "threads"
 *
 */
export type Threads = {
  __typename?: 'threads';
  /** An array relationship */
  comments: Array<Comments>;
  /** An aggregate relationship */
  comments_aggregate: Comments_Aggregate;
  /** An array relationship */
  github_repos: Array<Commit_Github_Repo>;
  /** An aggregate relationship */
  github_repos_aggregate: Commit_Github_Repo_Aggregate;
  id: Scalars['uuid'];
  original_commit_hash: Scalars['String'];
  original_file_path: Scalars['String'];
  /** An object relationship */
  original_line?: Maybe<Lines>;
  original_line_number: Scalars['Int'];
};


/**
 * All threads. There's no constraint that there are comments for each thread. There is a UNIQUE constraint on  (commit, file, line). There's no constraint that (commit, file_path, line_number) be in the blamelines table. However, there is a foreign key relationship with the lines table.
 *
 *
 * columns and relationships of "threads"
 *
 */
export type ThreadsCommentsArgs = {
  distinct_on?: InputMaybe<Array<Comments_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']>;
  offset?: InputMaybe<Scalars['Int']>;
  order_by?: InputMaybe<Array<Comments_Order_By>>;
  where?: InputMaybe<Comments_Bool_Exp>;
};


/**
 * All threads. There's no constraint that there are comments for each thread. There is a UNIQUE constraint on  (commit, file, line). There's no constraint that (commit, file_path, line_number) be in the blamelines table. However, there is a foreign key relationship with the lines table.
 *
 *
 * columns and relationships of "threads"
 *
 */
export type ThreadsComments_AggregateArgs = {
  distinct_on?: InputMaybe<Array<Comments_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']>;
  offset?: InputMaybe<Scalars['Int']>;
  order_by?: InputMaybe<Array<Comments_Order_By>>;
  where?: InputMaybe<Comments_Bool_Exp>;
};


/**
 * All threads. There's no constraint that there are comments for each thread. There is a UNIQUE constraint on  (commit, file, line). There's no constraint that (commit, file_path, line_number) be in the blamelines table. However, there is a foreign key relationship with the lines table.
 *
 *
 * columns and relationships of "threads"
 *
 */
export type ThreadsGithub_ReposArgs = {
  distinct_on?: InputMaybe<Array<Commit_Github_Repo_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']>;
  offset?: InputMaybe<Scalars['Int']>;
  order_by?: InputMaybe<Array<Commit_Github_Repo_Order_By>>;
  where?: InputMaybe<Commit_Github_Repo_Bool_Exp>;
};


/**
 * All threads. There's no constraint that there are comments for each thread. There is a UNIQUE constraint on  (commit, file, line). There's no constraint that (commit, file_path, line_number) be in the blamelines table. However, there is a foreign key relationship with the lines table.
 *
 *
 * columns and relationships of "threads"
 *
 */
export type ThreadsGithub_Repos_AggregateArgs = {
  distinct_on?: InputMaybe<Array<Commit_Github_Repo_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']>;
  offset?: InputMaybe<Scalars['Int']>;
  order_by?: InputMaybe<Array<Commit_Github_Repo_Order_By>>;
  where?: InputMaybe<Commit_Github_Repo_Bool_Exp>;
};

/** aggregated selection of "threads" */
export type Threads_Aggregate = {
  __typename?: 'threads_aggregate';
  aggregate?: Maybe<Threads_Aggregate_Fields>;
  nodes: Array<Threads>;
};

/** aggregate fields of "threads" */
export type Threads_Aggregate_Fields = {
  __typename?: 'threads_aggregate_fields';
  avg?: Maybe<Threads_Avg_Fields>;
  count: Scalars['Int'];
  max?: Maybe<Threads_Max_Fields>;
  min?: Maybe<Threads_Min_Fields>;
  stddev?: Maybe<Threads_Stddev_Fields>;
  stddev_pop?: Maybe<Threads_Stddev_Pop_Fields>;
  stddev_samp?: Maybe<Threads_Stddev_Samp_Fields>;
  sum?: Maybe<Threads_Sum_Fields>;
  var_pop?: Maybe<Threads_Var_Pop_Fields>;
  var_samp?: Maybe<Threads_Var_Samp_Fields>;
  variance?: Maybe<Threads_Variance_Fields>;
};


/** aggregate fields of "threads" */
export type Threads_Aggregate_FieldsCountArgs = {
  columns?: InputMaybe<Array<Threads_Select_Column>>;
  distinct?: InputMaybe<Scalars['Boolean']>;
};

/** order by aggregate values of table "threads" */
export type Threads_Aggregate_Order_By = {
  avg?: InputMaybe<Threads_Avg_Order_By>;
  count?: InputMaybe<Order_By>;
  max?: InputMaybe<Threads_Max_Order_By>;
  min?: InputMaybe<Threads_Min_Order_By>;
  stddev?: InputMaybe<Threads_Stddev_Order_By>;
  stddev_pop?: InputMaybe<Threads_Stddev_Pop_Order_By>;
  stddev_samp?: InputMaybe<Threads_Stddev_Samp_Order_By>;
  sum?: InputMaybe<Threads_Sum_Order_By>;
  var_pop?: InputMaybe<Threads_Var_Pop_Order_By>;
  var_samp?: InputMaybe<Threads_Var_Samp_Order_By>;
  variance?: InputMaybe<Threads_Variance_Order_By>;
};

/** input type for inserting array relation for remote table "threads" */
export type Threads_Arr_Rel_Insert_Input = {
  data: Array<Threads_Insert_Input>;
  /** on conflict condition */
  on_conflict?: InputMaybe<Threads_On_Conflict>;
};

/** aggregate avg on columns */
export type Threads_Avg_Fields = {
  __typename?: 'threads_avg_fields';
  original_line_number?: Maybe<Scalars['Float']>;
};

/** order by avg() on columns of table "threads" */
export type Threads_Avg_Order_By = {
  original_line_number?: InputMaybe<Order_By>;
};

/** Boolean expression to filter rows from the table "threads". All fields are combined with a logical 'AND'. */
export type Threads_Bool_Exp = {
  _and?: InputMaybe<Array<Threads_Bool_Exp>>;
  _not?: InputMaybe<Threads_Bool_Exp>;
  _or?: InputMaybe<Array<Threads_Bool_Exp>>;
  comments?: InputMaybe<Comments_Bool_Exp>;
  github_repos?: InputMaybe<Commit_Github_Repo_Bool_Exp>;
  id?: InputMaybe<Uuid_Comparison_Exp>;
  original_commit_hash?: InputMaybe<String_Comparison_Exp>;
  original_file_path?: InputMaybe<String_Comparison_Exp>;
  original_line?: InputMaybe<Lines_Bool_Exp>;
  original_line_number?: InputMaybe<Int_Comparison_Exp>;
};

/** unique or primary key constraints on table "threads" */
export enum Threads_Constraint {
  /** unique or primary key constraint */
  ThreadsOriginalCommitOriginalFilePathOriginalLineNumber = 'threads_original_commit_original_file_path_original_line_number',
  /** unique or primary key constraint */
  ThreadsPkey = 'threads_pkey'
}

/** input type for incrementing numeric columns in table "threads" */
export type Threads_Inc_Input = {
  original_line_number?: InputMaybe<Scalars['Int']>;
};

/** input type for inserting data into table "threads" */
export type Threads_Insert_Input = {
  comments?: InputMaybe<Comments_Arr_Rel_Insert_Input>;
  github_repos?: InputMaybe<Commit_Github_Repo_Arr_Rel_Insert_Input>;
  id?: InputMaybe<Scalars['uuid']>;
  original_commit_hash?: InputMaybe<Scalars['String']>;
  original_file_path?: InputMaybe<Scalars['String']>;
  original_line?: InputMaybe<Lines_Obj_Rel_Insert_Input>;
  original_line_number?: InputMaybe<Scalars['Int']>;
};

/** aggregate max on columns */
export type Threads_Max_Fields = {
  __typename?: 'threads_max_fields';
  id?: Maybe<Scalars['uuid']>;
  original_commit_hash?: Maybe<Scalars['String']>;
  original_file_path?: Maybe<Scalars['String']>;
  original_line_number?: Maybe<Scalars['Int']>;
};

/** order by max() on columns of table "threads" */
export type Threads_Max_Order_By = {
  id?: InputMaybe<Order_By>;
  original_commit_hash?: InputMaybe<Order_By>;
  original_file_path?: InputMaybe<Order_By>;
  original_line_number?: InputMaybe<Order_By>;
};

/** aggregate min on columns */
export type Threads_Min_Fields = {
  __typename?: 'threads_min_fields';
  id?: Maybe<Scalars['uuid']>;
  original_commit_hash?: Maybe<Scalars['String']>;
  original_file_path?: Maybe<Scalars['String']>;
  original_line_number?: Maybe<Scalars['Int']>;
};

/** order by min() on columns of table "threads" */
export type Threads_Min_Order_By = {
  id?: InputMaybe<Order_By>;
  original_commit_hash?: InputMaybe<Order_By>;
  original_file_path?: InputMaybe<Order_By>;
  original_line_number?: InputMaybe<Order_By>;
};

/** response of any mutation on the table "threads" */
export type Threads_Mutation_Response = {
  __typename?: 'threads_mutation_response';
  /** number of rows affected by the mutation */
  affected_rows: Scalars['Int'];
  /** data from the rows affected by the mutation */
  returning: Array<Threads>;
};

/** input type for inserting object relation for remote table "threads" */
export type Threads_Obj_Rel_Insert_Input = {
  data: Threads_Insert_Input;
  /** on conflict condition */
  on_conflict?: InputMaybe<Threads_On_Conflict>;
};

/** on conflict condition type for table "threads" */
export type Threads_On_Conflict = {
  constraint: Threads_Constraint;
  update_columns?: Array<Threads_Update_Column>;
  where?: InputMaybe<Threads_Bool_Exp>;
};

/** Ordering options when selecting data from "threads". */
export type Threads_Order_By = {
  comments_aggregate?: InputMaybe<Comments_Aggregate_Order_By>;
  github_repos_aggregate?: InputMaybe<Commit_Github_Repo_Aggregate_Order_By>;
  id?: InputMaybe<Order_By>;
  original_commit_hash?: InputMaybe<Order_By>;
  original_file_path?: InputMaybe<Order_By>;
  original_line?: InputMaybe<Lines_Order_By>;
  original_line_number?: InputMaybe<Order_By>;
};

/** primary key columns input for table: threads */
export type Threads_Pk_Columns_Input = {
  id: Scalars['uuid'];
};

/** select columns of table "threads" */
export enum Threads_Select_Column {
  /** column name */
  Id = 'id',
  /** column name */
  OriginalCommitHash = 'original_commit_hash',
  /** column name */
  OriginalFilePath = 'original_file_path',
  /** column name */
  OriginalLineNumber = 'original_line_number'
}

/** input type for updating data in table "threads" */
export type Threads_Set_Input = {
  id?: InputMaybe<Scalars['uuid']>;
  original_commit_hash?: InputMaybe<Scalars['String']>;
  original_file_path?: InputMaybe<Scalars['String']>;
  original_line_number?: InputMaybe<Scalars['Int']>;
};

/** aggregate stddev on columns */
export type Threads_Stddev_Fields = {
  __typename?: 'threads_stddev_fields';
  original_line_number?: Maybe<Scalars['Float']>;
};

/** order by stddev() on columns of table "threads" */
export type Threads_Stddev_Order_By = {
  original_line_number?: InputMaybe<Order_By>;
};

/** aggregate stddev_pop on columns */
export type Threads_Stddev_Pop_Fields = {
  __typename?: 'threads_stddev_pop_fields';
  original_line_number?: Maybe<Scalars['Float']>;
};

/** order by stddev_pop() on columns of table "threads" */
export type Threads_Stddev_Pop_Order_By = {
  original_line_number?: InputMaybe<Order_By>;
};

/** aggregate stddev_samp on columns */
export type Threads_Stddev_Samp_Fields = {
  __typename?: 'threads_stddev_samp_fields';
  original_line_number?: Maybe<Scalars['Float']>;
};

/** order by stddev_samp() on columns of table "threads" */
export type Threads_Stddev_Samp_Order_By = {
  original_line_number?: InputMaybe<Order_By>;
};

/** aggregate sum on columns */
export type Threads_Sum_Fields = {
  __typename?: 'threads_sum_fields';
  original_line_number?: Maybe<Scalars['Int']>;
};

/** order by sum() on columns of table "threads" */
export type Threads_Sum_Order_By = {
  original_line_number?: InputMaybe<Order_By>;
};

/** update columns of table "threads" */
export enum Threads_Update_Column {
  /** column name */
  Id = 'id',
  /** column name */
  OriginalCommitHash = 'original_commit_hash',
  /** column name */
  OriginalFilePath = 'original_file_path',
  /** column name */
  OriginalLineNumber = 'original_line_number'
}

/** aggregate var_pop on columns */
export type Threads_Var_Pop_Fields = {
  __typename?: 'threads_var_pop_fields';
  original_line_number?: Maybe<Scalars['Float']>;
};

/** order by var_pop() on columns of table "threads" */
export type Threads_Var_Pop_Order_By = {
  original_line_number?: InputMaybe<Order_By>;
};

/** aggregate var_samp on columns */
export type Threads_Var_Samp_Fields = {
  __typename?: 'threads_var_samp_fields';
  original_line_number?: Maybe<Scalars['Float']>;
};

/** order by var_samp() on columns of table "threads" */
export type Threads_Var_Samp_Order_By = {
  original_line_number?: InputMaybe<Order_By>;
};

/** aggregate variance on columns */
export type Threads_Variance_Fields = {
  __typename?: 'threads_variance_fields';
  original_line_number?: Maybe<Scalars['Float']>;
};

/** order by variance() on columns of table "threads" */
export type Threads_Variance_Order_By = {
  original_line_number?: InputMaybe<Order_By>;
};

/** Boolean expression to compare columns of type "timestamptz". All fields are combined with logical 'AND'. */
export type Timestamptz_Comparison_Exp = {
  _eq?: InputMaybe<Scalars['timestamptz']>;
  _gt?: InputMaybe<Scalars['timestamptz']>;
  _gte?: InputMaybe<Scalars['timestamptz']>;
  _in?: InputMaybe<Array<Scalars['timestamptz']>>;
  _is_null?: InputMaybe<Scalars['Boolean']>;
  _lt?: InputMaybe<Scalars['timestamptz']>;
  _lte?: InputMaybe<Scalars['timestamptz']>;
  _neq?: InputMaybe<Scalars['timestamptz']>;
  _nin?: InputMaybe<Array<Scalars['timestamptz']>>;
};

/**
 * Note that every session necessarily requires logging in with GitHub, so user_github_node_id is not nullable.
 *
 *
 * columns and relationships of "user_sessions"
 *
 */
export type User_Sessions = {
  __typename?: 'user_sessions';
  created_at: Scalars['timestamptz'];
  /** An object relationship */
  github_user: Github_Users;
  /** Also used as "session token". */
  id: Scalars['uuid'];
  /** The GitHub node id of the user associated with this session. Not unique since a single user may have multiple sessions. */
  user_github_node_id: Scalars['String'];
};

/** aggregated selection of "user_sessions" */
export type User_Sessions_Aggregate = {
  __typename?: 'user_sessions_aggregate';
  aggregate?: Maybe<User_Sessions_Aggregate_Fields>;
  nodes: Array<User_Sessions>;
};

/** aggregate fields of "user_sessions" */
export type User_Sessions_Aggregate_Fields = {
  __typename?: 'user_sessions_aggregate_fields';
  count: Scalars['Int'];
  max?: Maybe<User_Sessions_Max_Fields>;
  min?: Maybe<User_Sessions_Min_Fields>;
};


/** aggregate fields of "user_sessions" */
export type User_Sessions_Aggregate_FieldsCountArgs = {
  columns?: InputMaybe<Array<User_Sessions_Select_Column>>;
  distinct?: InputMaybe<Scalars['Boolean']>;
};

/** Boolean expression to filter rows from the table "user_sessions". All fields are combined with a logical 'AND'. */
export type User_Sessions_Bool_Exp = {
  _and?: InputMaybe<Array<User_Sessions_Bool_Exp>>;
  _not?: InputMaybe<User_Sessions_Bool_Exp>;
  _or?: InputMaybe<Array<User_Sessions_Bool_Exp>>;
  created_at?: InputMaybe<Timestamptz_Comparison_Exp>;
  github_user?: InputMaybe<Github_Users_Bool_Exp>;
  id?: InputMaybe<Uuid_Comparison_Exp>;
  user_github_node_id?: InputMaybe<String_Comparison_Exp>;
};

/** unique or primary key constraints on table "user_sessions" */
export enum User_Sessions_Constraint {
  /** unique or primary key constraint */
  UserSessionsPkey = 'user_sessions_pkey'
}

/** input type for inserting data into table "user_sessions" */
export type User_Sessions_Insert_Input = {
  created_at?: InputMaybe<Scalars['timestamptz']>;
  github_user?: InputMaybe<Github_Users_Obj_Rel_Insert_Input>;
  /** Also used as "session token". */
  id?: InputMaybe<Scalars['uuid']>;
  /** The GitHub node id of the user associated with this session. Not unique since a single user may have multiple sessions. */
  user_github_node_id?: InputMaybe<Scalars['String']>;
};

/** aggregate max on columns */
export type User_Sessions_Max_Fields = {
  __typename?: 'user_sessions_max_fields';
  created_at?: Maybe<Scalars['timestamptz']>;
  /** Also used as "session token". */
  id?: Maybe<Scalars['uuid']>;
  /** The GitHub node id of the user associated with this session. Not unique since a single user may have multiple sessions. */
  user_github_node_id?: Maybe<Scalars['String']>;
};

/** aggregate min on columns */
export type User_Sessions_Min_Fields = {
  __typename?: 'user_sessions_min_fields';
  created_at?: Maybe<Scalars['timestamptz']>;
  /** Also used as "session token". */
  id?: Maybe<Scalars['uuid']>;
  /** The GitHub node id of the user associated with this session. Not unique since a single user may have multiple sessions. */
  user_github_node_id?: Maybe<Scalars['String']>;
};

/** response of any mutation on the table "user_sessions" */
export type User_Sessions_Mutation_Response = {
  __typename?: 'user_sessions_mutation_response';
  /** number of rows affected by the mutation */
  affected_rows: Scalars['Int'];
  /** data from the rows affected by the mutation */
  returning: Array<User_Sessions>;
};

/** on conflict condition type for table "user_sessions" */
export type User_Sessions_On_Conflict = {
  constraint: User_Sessions_Constraint;
  update_columns?: Array<User_Sessions_Update_Column>;
  where?: InputMaybe<User_Sessions_Bool_Exp>;
};

/** Ordering options when selecting data from "user_sessions". */
export type User_Sessions_Order_By = {
  created_at?: InputMaybe<Order_By>;
  github_user?: InputMaybe<Github_Users_Order_By>;
  id?: InputMaybe<Order_By>;
  user_github_node_id?: InputMaybe<Order_By>;
};

/** primary key columns input for table: user_sessions */
export type User_Sessions_Pk_Columns_Input = {
  /** Also used as "session token". */
  id: Scalars['uuid'];
};

/** select columns of table "user_sessions" */
export enum User_Sessions_Select_Column {
  /** column name */
  CreatedAt = 'created_at',
  /** column name */
  Id = 'id',
  /** column name */
  UserGithubNodeId = 'user_github_node_id'
}

/** input type for updating data in table "user_sessions" */
export type User_Sessions_Set_Input = {
  created_at?: InputMaybe<Scalars['timestamptz']>;
  /** Also used as "session token". */
  id?: InputMaybe<Scalars['uuid']>;
  /** The GitHub node id of the user associated with this session. Not unique since a single user may have multiple sessions. */
  user_github_node_id?: InputMaybe<Scalars['String']>;
};

/** update columns of table "user_sessions" */
export enum User_Sessions_Update_Column {
  /** column name */
  CreatedAt = 'created_at',
  /** column name */
  Id = 'id',
  /** column name */
  UserGithubNodeId = 'user_github_node_id'
}

/** Boolean expression to compare columns of type "uuid". All fields are combined with logical 'AND'. */
export type Uuid_Comparison_Exp = {
  _eq?: InputMaybe<Scalars['uuid']>;
  _gt?: InputMaybe<Scalars['uuid']>;
  _gte?: InputMaybe<Scalars['uuid']>;
  _in?: InputMaybe<Array<Scalars['uuid']>>;
  _is_null?: InputMaybe<Scalars['Boolean']>;
  _lt?: InputMaybe<Scalars['uuid']>;
  _lte?: InputMaybe<Scalars['uuid']>;
  _neq?: InputMaybe<Scalars['uuid']>;
  _nin?: InputMaybe<Array<Scalars['uuid']>>;
};

export type LookupSessionQueryVariables = Exact<{
  session_token: Scalars['uuid'];
}>;


export type LookupSessionQuery = { __typename?: 'query_root', user_sessions_by_pk?: { __typename?: 'user_sessions', user_github_node_id: string } | null | undefined };

export type Unnamed_1_QueryVariables = Exact<{ [key: string]: never; }>;


export type Unnamed_1_Query = { __typename: 'query_root' };

export type ThreadContainingCommentQueryVariables = Exact<{
  commentId: Scalars['uuid'];
}>;


export type ThreadContainingCommentQuery = { __typename?: 'query_root', comments_by_pk?: { __typename?: 'comments', thread_id: string } | null | undefined };

export type UserCommentMutationVariables = Exact<{
  threadId: Scalars['uuid'];
  body: Scalars['String'];
  author_github_node_id: Scalars['String'];
}>;


export type UserCommentMutation = { __typename?: 'mutation_root', insert_comments_one?: { __typename?: 'comments', id: string } | null | undefined };

export type EmailCommentMutationVariables = Exact<{
  threadId: Scalars['uuid'];
  body: Scalars['String'];
  authorEmail: Scalars['String'];
}>;


export type EmailCommentMutation = { __typename?: 'mutation_root', insert_comments_one?: { __typename?: 'comments', id: string } | null | undefined };

export type CommentContextQueryVariables = Exact<{
  commentId: Scalars['uuid'];
}>;


export type CommentContextQuery = { __typename?: 'query_root', comments_by_pk?: { __typename?: 'comments', github_user?: { __typename?: 'github_users', email: string, github_name?: string | null | undefined, github_username: string, access_token?: string | null | undefined } | null | undefined, thread: { __typename?: 'threads', id: string, original_commit_hash: string, original_file_path: string, original_line_number: number, github_repos: Array<{ __typename?: 'commit_github_repo', repo_github_node_id: string }>, comments: Array<{ __typename?: 'comments', id: string, created_at: any, author_email?: string | null | undefined, body: string, github_user?: { __typename?: 'github_users', email: string, github_name?: string | null | undefined, github_username: string, github_node_id: string } | null | undefined }> } } | null | undefined };

export type UpsertUserStartSessionMutationVariables = Exact<{
  githubNodeId: Scalars['String'];
  githubDatabaseId: Scalars['Int'];
  githubName?: Maybe<Scalars['String']>;
  githubUsername: Scalars['String'];
  email: Scalars['String'];
  accessToken: Scalars['String'];
}>;


export type UpsertUserStartSessionMutation = { __typename?: 'mutation_root', insert_github_users_one?: { __typename?: 'github_users', github_node_id: string } | null | undefined, insert_user_sessions_one?: { __typename?: 'user_sessions', id: string } | null | undefined };

export type LookupUsersByEmailQueryVariables = Exact<{
  email: Scalars['String'];
}>;


export type LookupUsersByEmailQuery = { __typename?: 'query_root', github_users: Array<{ __typename?: 'github_users', github_node_id: string, github_database_id: number, github_username: string }> };

export type UpsertUsersMutationVariables = Exact<{
  users: Array<Github_Users_Insert_Input> | Github_Users_Insert_Input;
}>;


export type UpsertUsersMutation = { __typename?: 'mutation_root', insert_github_users?: { __typename?: 'github_users_mutation_response', affected_rows: number } | null | undefined };
