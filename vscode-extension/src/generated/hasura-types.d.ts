export type Maybe<T> = T | null;
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
  _eq?: Maybe<Scalars['Int']>;
  _gt?: Maybe<Scalars['Int']>;
  _gte?: Maybe<Scalars['Int']>;
  _in?: Maybe<Array<Scalars['Int']>>;
  _is_null?: Maybe<Scalars['Boolean']>;
  _lt?: Maybe<Scalars['Int']>;
  _lte?: Maybe<Scalars['Int']>;
  _neq?: Maybe<Scalars['Int']>;
  _nin?: Maybe<Array<Scalars['Int']>>;
};

/** Boolean expression to compare columns of type "String". All fields are combined with logical 'AND'. */
export type String_Comparison_Exp = {
  _eq?: Maybe<Scalars['String']>;
  _gt?: Maybe<Scalars['String']>;
  _gte?: Maybe<Scalars['String']>;
  /** does the column match the given case-insensitive pattern */
  _ilike?: Maybe<Scalars['String']>;
  _in?: Maybe<Array<Scalars['String']>>;
  /** does the column match the given POSIX regular expression, case insensitive */
  _iregex?: Maybe<Scalars['String']>;
  _is_null?: Maybe<Scalars['Boolean']>;
  /** does the column match the given pattern */
  _like?: Maybe<Scalars['String']>;
  _lt?: Maybe<Scalars['String']>;
  _lte?: Maybe<Scalars['String']>;
  _neq?: Maybe<Scalars['String']>;
  /** does the column NOT match the given case-insensitive pattern */
  _nilike?: Maybe<Scalars['String']>;
  _nin?: Maybe<Array<Scalars['String']>>;
  /** does the column NOT match the given POSIX regular expression, case insensitive */
  _niregex?: Maybe<Scalars['String']>;
  /** does the column NOT match the given pattern */
  _nlike?: Maybe<Scalars['String']>;
  /** does the column NOT match the given POSIX regular expression, case sensitive */
  _nregex?: Maybe<Scalars['String']>;
  /** does the column NOT match the given SQL regular expression */
  _nsimilar?: Maybe<Scalars['String']>;
  /** does the column match the given POSIX regular expression, case sensitive */
  _regex?: Maybe<Scalars['String']>;
  /** does the column match the given SQL regular expression */
  _similar?: Maybe<Scalars['String']>;
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
  original_commit: Scalars['String'];
  original_file_path: Scalars['String'];
  /** An object relationship */
  original_line?: Maybe<Lines>;
  original_line_number: Scalars['Int'];
  x_commit: Scalars['String'];
  x_file_path: Scalars['String'];
  x_line_number: Scalars['Int'];
};

/** Boolean expression to filter rows from the table "blamelines". All fields are combined with a logical 'AND'. */
export type Blamelines_Bool_Exp = {
  _and?: Maybe<Array<Blamelines_Bool_Exp>>;
  _not?: Maybe<Blamelines_Bool_Exp>;
  _or?: Maybe<Array<Blamelines_Bool_Exp>>;
  original_commit?: Maybe<String_Comparison_Exp>;
  original_file_path?: Maybe<String_Comparison_Exp>;
  original_line?: Maybe<Lines_Bool_Exp>;
  original_line_number?: Maybe<Int_Comparison_Exp>;
  x_commit?: Maybe<String_Comparison_Exp>;
  x_file_path?: Maybe<String_Comparison_Exp>;
  x_line_number?: Maybe<Int_Comparison_Exp>;
};

/** Ordering options when selecting data from "blamelines". */
export type Blamelines_Order_By = {
  original_commit?: Maybe<Order_By>;
  original_file_path?: Maybe<Order_By>;
  original_line?: Maybe<Lines_Order_By>;
  original_line_number?: Maybe<Order_By>;
  x_commit?: Maybe<Order_By>;
  x_file_path?: Maybe<Order_By>;
  x_line_number?: Maybe<Order_By>;
};

/** select columns of table "blamelines" */
export enum Blamelines_Select_Column {
  /** column name */
  OriginalCommit = 'original_commit',
  /** column name */
  OriginalFilePath = 'original_file_path',
  /** column name */
  OriginalLineNumber = 'original_line_number',
  /** column name */
  XCommit = 'x_commit',
  /** column name */
  XFilePath = 'x_file_path',
  /** column name */
  XLineNumber = 'x_line_number'
}

/**
 * TODO: make author_github_id nullable and add author_email. Add constraint that exactly one of them is present.
 *
 *
 * columns and relationships of "comments"
 *
 */
export type Comments = {
  __typename?: 'comments';
  /** The GitHub node id of the user who authored this comment. */
  author_github_node_id: Scalars['String'];
  body: Scalars['String'];
  created_at: Scalars['timestamptz'];
  /** An object relationship */
  github_user: Github_Users;
  id: Scalars['uuid'];
  thread_id: Scalars['uuid'];
};

/** order by aggregate values of table "comments" */
export type Comments_Aggregate_Order_By = {
  count?: Maybe<Order_By>;
  max?: Maybe<Comments_Max_Order_By>;
  min?: Maybe<Comments_Min_Order_By>;
};

/** Boolean expression to filter rows from the table "comments". All fields are combined with a logical 'AND'. */
export type Comments_Bool_Exp = {
  _and?: Maybe<Array<Comments_Bool_Exp>>;
  _not?: Maybe<Comments_Bool_Exp>;
  _or?: Maybe<Array<Comments_Bool_Exp>>;
  author_github_node_id?: Maybe<String_Comparison_Exp>;
  body?: Maybe<String_Comparison_Exp>;
  created_at?: Maybe<Timestamptz_Comparison_Exp>;
  github_user?: Maybe<Github_Users_Bool_Exp>;
  id?: Maybe<Uuid_Comparison_Exp>;
  thread_id?: Maybe<Uuid_Comparison_Exp>;
};

/** input type for inserting data into table "comments" */
export type Comments_Insert_Input = {
  body?: Maybe<Scalars['String']>;
  thread_id?: Maybe<Scalars['uuid']>;
};

/** order by max() on columns of table "comments" */
export type Comments_Max_Order_By = {
  /** The GitHub node id of the user who authored this comment. */
  author_github_node_id?: Maybe<Order_By>;
  body?: Maybe<Order_By>;
  created_at?: Maybe<Order_By>;
  id?: Maybe<Order_By>;
  thread_id?: Maybe<Order_By>;
};

/** order by min() on columns of table "comments" */
export type Comments_Min_Order_By = {
  /** The GitHub node id of the user who authored this comment. */
  author_github_node_id?: Maybe<Order_By>;
  body?: Maybe<Order_By>;
  created_at?: Maybe<Order_By>;
  id?: Maybe<Order_By>;
  thread_id?: Maybe<Order_By>;
};

/** response of any mutation on the table "comments" */
export type Comments_Mutation_Response = {
  __typename?: 'comments_mutation_response';
  /** number of rows affected by the mutation */
  affected_rows: Scalars['Int'];
  /** data from the rows affected by the mutation */
  returning: Array<Comments>;
};

/** Ordering options when selecting data from "comments". */
export type Comments_Order_By = {
  author_github_node_id?: Maybe<Order_By>;
  body?: Maybe<Order_By>;
  created_at?: Maybe<Order_By>;
  github_user?: Maybe<Github_Users_Order_By>;
  id?: Maybe<Order_By>;
  thread_id?: Maybe<Order_By>;
};

/** select columns of table "comments" */
export enum Comments_Select_Column {
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
 * Every time a user logs in these values get upserted. Users can also be created implicitly by receiving email responses from them.
 *
 *
 * columns and relationships of "github_users"
 *
 */
export type Github_Users = {
  __typename?: 'github_users';
  /** An integer id that GitHub gives every user. Use github_node_id instead whenever possible. */
  github_database_id: Scalars['Int'];
  /** User's name according to GitHub, eg. "Barack Obama". */
  github_name?: Maybe<Scalars['String']>;
  /** Eg., "MDQ6VXNlcjIyNjg3Mg==". Seems to be used in the v4 GraphQL GitHub API. */
  github_node_id: Scalars['String'];
  github_username: Scalars['String'];
};

/** Boolean expression to filter rows from the table "github_users". All fields are combined with a logical 'AND'. */
export type Github_Users_Bool_Exp = {
  _and?: Maybe<Array<Github_Users_Bool_Exp>>;
  _not?: Maybe<Github_Users_Bool_Exp>;
  _or?: Maybe<Array<Github_Users_Bool_Exp>>;
  github_database_id?: Maybe<Int_Comparison_Exp>;
  github_name?: Maybe<String_Comparison_Exp>;
  github_node_id?: Maybe<String_Comparison_Exp>;
  github_username?: Maybe<String_Comparison_Exp>;
};

/** Ordering options when selecting data from "github_users". */
export type Github_Users_Order_By = {
  github_database_id?: Maybe<Order_By>;
  github_name?: Maybe<Order_By>;
  github_node_id?: Maybe<Order_By>;
  github_username?: Maybe<Order_By>;
};

/** select columns of table "github_users" */
export enum Github_Users_Select_Column {
  /** column name */
  GithubDatabaseId = 'github_database_id',
  /** column name */
  GithubName = 'github_name',
  /** column name */
  GithubNodeId = 'github_node_id',
  /** column name */
  GithubUsername = 'github_username'
}

/**
 * Uniquely identifies a line of code anywhere in the git universe.
 *
 *
 * columns and relationships of "lines"
 *
 */
export type Lines = {
  __typename?: 'lines';
  commit: Scalars['String'];
  file_path: Scalars['String'];
  line_number: Scalars['Int'];
  /** An array relationship */
  threads: Array<Threads>;
};


/**
 * Uniquely identifies a line of code anywhere in the git universe.
 *
 *
 * columns and relationships of "lines"
 *
 */
export type LinesThreadsArgs = {
  distinct_on?: Maybe<Array<Threads_Select_Column>>;
  limit?: Maybe<Scalars['Int']>;
  offset?: Maybe<Scalars['Int']>;
  order_by?: Maybe<Array<Threads_Order_By>>;
  where?: Maybe<Threads_Bool_Exp>;
};

/** Boolean expression to filter rows from the table "lines". All fields are combined with a logical 'AND'. */
export type Lines_Bool_Exp = {
  _and?: Maybe<Array<Lines_Bool_Exp>>;
  _not?: Maybe<Lines_Bool_Exp>;
  _or?: Maybe<Array<Lines_Bool_Exp>>;
  commit?: Maybe<String_Comparison_Exp>;
  file_path?: Maybe<String_Comparison_Exp>;
  line_number?: Maybe<Int_Comparison_Exp>;
  threads?: Maybe<Threads_Bool_Exp>;
};

/** Ordering options when selecting data from "lines". */
export type Lines_Order_By = {
  commit?: Maybe<Order_By>;
  file_path?: Maybe<Order_By>;
  line_number?: Maybe<Order_By>;
  threads_aggregate?: Maybe<Threads_Aggregate_Order_By>;
};

/** select columns of table "lines" */
export enum Lines_Select_Column {
  /** column name */
  Commit = 'commit',
  /** column name */
  FilePath = 'file_path',
  /** column name */
  LineNumber = 'line_number'
}

/** mutation root */
export type Mutation_Root = {
  __typename?: 'mutation_root';
  CalculateBlameLines: Scalars['Boolean'];
  StartCuddlefishSession: Scalars['String'];
  StartThread: Scalars['String'];
  /** insert data into the table: "comments" */
  insert_comments?: Maybe<Comments_Mutation_Response>;
  /** insert a single row into the table: "comments" */
  insert_comments_one?: Maybe<Comments>;
};


/** mutation root */
export type Mutation_RootCalculateBlameLinesArgs = {
  filePath: Scalars['String'];
  lastCommit: Scalars['String'];
  repoId: Scalars['String'];
};


/** mutation root */
export type Mutation_RootStartCuddlefishSessionArgs = {
  githubAccessToken: Scalars['String'];
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
export type Mutation_RootInsert_CommentsArgs = {
  objects: Array<Comments_Insert_Input>;
};


/** mutation root */
export type Mutation_RootInsert_Comments_OneArgs = {
  object: Comments_Insert_Input;
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
  /** fetch data from the table: "blamelines" using primary key columns */
  blamelines_by_pk?: Maybe<Blamelines>;
  /** An array relationship */
  comments: Array<Comments>;
  /** fetch data from the table: "comments" using primary key columns */
  comments_by_pk?: Maybe<Comments>;
  /** fetch data from the table: "github_users" */
  github_users: Array<Github_Users>;
  /** fetch data from the table: "github_users" using primary key columns */
  github_users_by_pk?: Maybe<Github_Users>;
  /** fetch data from the table: "lines" */
  lines: Array<Lines>;
  /** fetch data from the table: "lines" using primary key columns */
  lines_by_pk?: Maybe<Lines>;
  noop: Scalars['Boolean'];
  /** An array relationship */
  threads: Array<Threads>;
  /** fetch data from the table: "threads" using primary key columns */
  threads_by_pk?: Maybe<Threads>;
};


export type Query_RootBlamelinesArgs = {
  distinct_on?: Maybe<Array<Blamelines_Select_Column>>;
  limit?: Maybe<Scalars['Int']>;
  offset?: Maybe<Scalars['Int']>;
  order_by?: Maybe<Array<Blamelines_Order_By>>;
  where?: Maybe<Blamelines_Bool_Exp>;
};


export type Query_RootBlamelines_By_PkArgs = {
  x_commit: Scalars['String'];
  x_file_path: Scalars['String'];
  x_line_number: Scalars['Int'];
};


export type Query_RootCommentsArgs = {
  distinct_on?: Maybe<Array<Comments_Select_Column>>;
  limit?: Maybe<Scalars['Int']>;
  offset?: Maybe<Scalars['Int']>;
  order_by?: Maybe<Array<Comments_Order_By>>;
  where?: Maybe<Comments_Bool_Exp>;
};


export type Query_RootComments_By_PkArgs = {
  id: Scalars['uuid'];
};


export type Query_RootGithub_UsersArgs = {
  distinct_on?: Maybe<Array<Github_Users_Select_Column>>;
  limit?: Maybe<Scalars['Int']>;
  offset?: Maybe<Scalars['Int']>;
  order_by?: Maybe<Array<Github_Users_Order_By>>;
  where?: Maybe<Github_Users_Bool_Exp>;
};


export type Query_RootGithub_Users_By_PkArgs = {
  github_node_id: Scalars['String'];
};


export type Query_RootLinesArgs = {
  distinct_on?: Maybe<Array<Lines_Select_Column>>;
  limit?: Maybe<Scalars['Int']>;
  offset?: Maybe<Scalars['Int']>;
  order_by?: Maybe<Array<Lines_Order_By>>;
  where?: Maybe<Lines_Bool_Exp>;
};


export type Query_RootLines_By_PkArgs = {
  commit: Scalars['String'];
  file_path: Scalars['String'];
  line_number: Scalars['Int'];
};


export type Query_RootThreadsArgs = {
  distinct_on?: Maybe<Array<Threads_Select_Column>>;
  limit?: Maybe<Scalars['Int']>;
  offset?: Maybe<Scalars['Int']>;
  order_by?: Maybe<Array<Threads_Order_By>>;
  where?: Maybe<Threads_Bool_Exp>;
};


export type Query_RootThreads_By_PkArgs = {
  id: Scalars['uuid'];
};

export type Subscription_Root = {
  __typename?: 'subscription_root';
  /** fetch data from the table: "blamelines" */
  blamelines: Array<Blamelines>;
  /** fetch data from the table: "blamelines" using primary key columns */
  blamelines_by_pk?: Maybe<Blamelines>;
  /** An array relationship */
  comments: Array<Comments>;
  /** fetch data from the table: "comments" using primary key columns */
  comments_by_pk?: Maybe<Comments>;
  /** fetch data from the table: "github_users" */
  github_users: Array<Github_Users>;
  /** fetch data from the table: "github_users" using primary key columns */
  github_users_by_pk?: Maybe<Github_Users>;
  /** fetch data from the table: "lines" */
  lines: Array<Lines>;
  /** fetch data from the table: "lines" using primary key columns */
  lines_by_pk?: Maybe<Lines>;
  /** An array relationship */
  threads: Array<Threads>;
  /** fetch data from the table: "threads" using primary key columns */
  threads_by_pk?: Maybe<Threads>;
};


export type Subscription_RootBlamelinesArgs = {
  distinct_on?: Maybe<Array<Blamelines_Select_Column>>;
  limit?: Maybe<Scalars['Int']>;
  offset?: Maybe<Scalars['Int']>;
  order_by?: Maybe<Array<Blamelines_Order_By>>;
  where?: Maybe<Blamelines_Bool_Exp>;
};


export type Subscription_RootBlamelines_By_PkArgs = {
  x_commit: Scalars['String'];
  x_file_path: Scalars['String'];
  x_line_number: Scalars['Int'];
};


export type Subscription_RootCommentsArgs = {
  distinct_on?: Maybe<Array<Comments_Select_Column>>;
  limit?: Maybe<Scalars['Int']>;
  offset?: Maybe<Scalars['Int']>;
  order_by?: Maybe<Array<Comments_Order_By>>;
  where?: Maybe<Comments_Bool_Exp>;
};


export type Subscription_RootComments_By_PkArgs = {
  id: Scalars['uuid'];
};


export type Subscription_RootGithub_UsersArgs = {
  distinct_on?: Maybe<Array<Github_Users_Select_Column>>;
  limit?: Maybe<Scalars['Int']>;
  offset?: Maybe<Scalars['Int']>;
  order_by?: Maybe<Array<Github_Users_Order_By>>;
  where?: Maybe<Github_Users_Bool_Exp>;
};


export type Subscription_RootGithub_Users_By_PkArgs = {
  github_node_id: Scalars['String'];
};


export type Subscription_RootLinesArgs = {
  distinct_on?: Maybe<Array<Lines_Select_Column>>;
  limit?: Maybe<Scalars['Int']>;
  offset?: Maybe<Scalars['Int']>;
  order_by?: Maybe<Array<Lines_Order_By>>;
  where?: Maybe<Lines_Bool_Exp>;
};


export type Subscription_RootLines_By_PkArgs = {
  commit: Scalars['String'];
  file_path: Scalars['String'];
  line_number: Scalars['Int'];
};


export type Subscription_RootThreadsArgs = {
  distinct_on?: Maybe<Array<Threads_Select_Column>>;
  limit?: Maybe<Scalars['Int']>;
  offset?: Maybe<Scalars['Int']>;
  order_by?: Maybe<Array<Threads_Order_By>>;
  where?: Maybe<Threads_Bool_Exp>;
};


export type Subscription_RootThreads_By_PkArgs = {
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
  id: Scalars['uuid'];
  original_commit: Scalars['String'];
  original_file_path: Scalars['String'];
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
  distinct_on?: Maybe<Array<Comments_Select_Column>>;
  limit?: Maybe<Scalars['Int']>;
  offset?: Maybe<Scalars['Int']>;
  order_by?: Maybe<Array<Comments_Order_By>>;
  where?: Maybe<Comments_Bool_Exp>;
};

/** order by aggregate values of table "threads" */
export type Threads_Aggregate_Order_By = {
  avg?: Maybe<Threads_Avg_Order_By>;
  count?: Maybe<Order_By>;
  max?: Maybe<Threads_Max_Order_By>;
  min?: Maybe<Threads_Min_Order_By>;
  stddev?: Maybe<Threads_Stddev_Order_By>;
  stddev_pop?: Maybe<Threads_Stddev_Pop_Order_By>;
  stddev_samp?: Maybe<Threads_Stddev_Samp_Order_By>;
  sum?: Maybe<Threads_Sum_Order_By>;
  var_pop?: Maybe<Threads_Var_Pop_Order_By>;
  var_samp?: Maybe<Threads_Var_Samp_Order_By>;
  variance?: Maybe<Threads_Variance_Order_By>;
};

/** order by avg() on columns of table "threads" */
export type Threads_Avg_Order_By = {
  original_line_number?: Maybe<Order_By>;
};

/** Boolean expression to filter rows from the table "threads". All fields are combined with a logical 'AND'. */
export type Threads_Bool_Exp = {
  _and?: Maybe<Array<Threads_Bool_Exp>>;
  _not?: Maybe<Threads_Bool_Exp>;
  _or?: Maybe<Array<Threads_Bool_Exp>>;
  comments?: Maybe<Comments_Bool_Exp>;
  id?: Maybe<Uuid_Comparison_Exp>;
  original_commit?: Maybe<String_Comparison_Exp>;
  original_file_path?: Maybe<String_Comparison_Exp>;
  original_line_number?: Maybe<Int_Comparison_Exp>;
};

/** order by max() on columns of table "threads" */
export type Threads_Max_Order_By = {
  id?: Maybe<Order_By>;
  original_commit?: Maybe<Order_By>;
  original_file_path?: Maybe<Order_By>;
  original_line_number?: Maybe<Order_By>;
};

/** order by min() on columns of table "threads" */
export type Threads_Min_Order_By = {
  id?: Maybe<Order_By>;
  original_commit?: Maybe<Order_By>;
  original_file_path?: Maybe<Order_By>;
  original_line_number?: Maybe<Order_By>;
};

/** Ordering options when selecting data from "threads". */
export type Threads_Order_By = {
  comments_aggregate?: Maybe<Comments_Aggregate_Order_By>;
  id?: Maybe<Order_By>;
  original_commit?: Maybe<Order_By>;
  original_file_path?: Maybe<Order_By>;
  original_line_number?: Maybe<Order_By>;
};

/** select columns of table "threads" */
export enum Threads_Select_Column {
  /** column name */
  Id = 'id',
  /** column name */
  OriginalCommit = 'original_commit',
  /** column name */
  OriginalFilePath = 'original_file_path',
  /** column name */
  OriginalLineNumber = 'original_line_number'
}

/** order by stddev() on columns of table "threads" */
export type Threads_Stddev_Order_By = {
  original_line_number?: Maybe<Order_By>;
};

/** order by stddev_pop() on columns of table "threads" */
export type Threads_Stddev_Pop_Order_By = {
  original_line_number?: Maybe<Order_By>;
};

/** order by stddev_samp() on columns of table "threads" */
export type Threads_Stddev_Samp_Order_By = {
  original_line_number?: Maybe<Order_By>;
};

/** order by sum() on columns of table "threads" */
export type Threads_Sum_Order_By = {
  original_line_number?: Maybe<Order_By>;
};

/** order by var_pop() on columns of table "threads" */
export type Threads_Var_Pop_Order_By = {
  original_line_number?: Maybe<Order_By>;
};

/** order by var_samp() on columns of table "threads" */
export type Threads_Var_Samp_Order_By = {
  original_line_number?: Maybe<Order_By>;
};

/** order by variance() on columns of table "threads" */
export type Threads_Variance_Order_By = {
  original_line_number?: Maybe<Order_By>;
};

/** Boolean expression to compare columns of type "timestamptz". All fields are combined with logical 'AND'. */
export type Timestamptz_Comparison_Exp = {
  _eq?: Maybe<Scalars['timestamptz']>;
  _gt?: Maybe<Scalars['timestamptz']>;
  _gte?: Maybe<Scalars['timestamptz']>;
  _in?: Maybe<Array<Scalars['timestamptz']>>;
  _is_null?: Maybe<Scalars['Boolean']>;
  _lt?: Maybe<Scalars['timestamptz']>;
  _lte?: Maybe<Scalars['timestamptz']>;
  _neq?: Maybe<Scalars['timestamptz']>;
  _nin?: Maybe<Array<Scalars['timestamptz']>>;
};

/** Boolean expression to compare columns of type "uuid". All fields are combined with logical 'AND'. */
export type Uuid_Comparison_Exp = {
  _eq?: Maybe<Scalars['uuid']>;
  _gt?: Maybe<Scalars['uuid']>;
  _gte?: Maybe<Scalars['uuid']>;
  _in?: Maybe<Array<Scalars['uuid']>>;
  _is_null?: Maybe<Scalars['Boolean']>;
  _lt?: Maybe<Scalars['uuid']>;
  _lte?: Maybe<Scalars['uuid']>;
  _neq?: Maybe<Scalars['uuid']>;
  _nin?: Maybe<Array<Scalars['uuid']>>;
};

export type AllThreadsQueryVariables = Exact<{
  cond: Lines_Bool_Exp;
}>;


export type AllThreadsQuery = { __typename?: 'query_root', lines: Array<{ __typename?: 'lines', commit: string, file_path: string, line_number: number, threads: Array<{ __typename?: 'threads', id: string, comments: Array<{ __typename?: 'comments', id: string, body: string, author_github_node_id: string, github_user: { __typename?: 'github_users', github_username: string, github_name?: string | null | undefined } }> }> }> };

export type StartThreadMutationVariables = Exact<{
  repoIds: Array<Scalars['String']> | Scalars['String'];
  commitHash: Scalars['String'];
  filePath: Scalars['String'];
  lineNumber: Scalars['Int'];
  body: Scalars['String'];
}>;


export type StartThreadMutation = { __typename?: 'mutation_root', StartThread: string };

export type AddCommentMutationVariables = Exact<{
  body: Scalars['String'];
  threadId: Scalars['uuid'];
}>;


export type AddCommentMutation = { __typename?: 'mutation_root', insert_comments_one?: { __typename?: 'comments', id: string } | null | undefined };

export type StartCuddlefishSessionMutationVariables = Exact<{
  githubAccessToken: Scalars['String'];
}>;


export type StartCuddlefishSessionMutation = { __typename?: 'mutation_root', StartCuddlefishSession: string };
