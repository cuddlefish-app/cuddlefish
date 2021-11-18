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

export type StartCuddlefishSessionResponse = {
  __typename?: 'StartCuddlefishSessionResponse';
  session_token: Scalars['String'];
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
  original_commit_hash: Scalars['String'];
  original_file_path: Scalars['String'];
  /** An object relationship */
  original_line?: Maybe<Lines>;
  original_line_number: Scalars['Int'];
  x_commit_hash: Scalars['String'];
  x_file_path: Scalars['String'];
  x_line_number: Scalars['Int'];
};

/** Boolean expression to filter rows from the table "blamelines". All fields are combined with a logical 'AND'. */
export type Blamelines_Bool_Exp = {
  _and?: Maybe<Array<Blamelines_Bool_Exp>>;
  _not?: Maybe<Blamelines_Bool_Exp>;
  _or?: Maybe<Array<Blamelines_Bool_Exp>>;
  original_commit_hash?: Maybe<String_Comparison_Exp>;
  original_file_path?: Maybe<String_Comparison_Exp>;
  original_line?: Maybe<Lines_Bool_Exp>;
  original_line_number?: Maybe<Int_Comparison_Exp>;
  x_commit_hash?: Maybe<String_Comparison_Exp>;
  x_file_path?: Maybe<String_Comparison_Exp>;
  x_line_number?: Maybe<Int_Comparison_Exp>;
};

/** Ordering options when selecting data from "blamelines". */
export type Blamelines_Order_By = {
  original_commit_hash?: Maybe<Order_By>;
  original_file_path?: Maybe<Order_By>;
  original_line?: Maybe<Lines_Order_By>;
  original_line_number?: Maybe<Order_By>;
  x_commit_hash?: Maybe<Order_By>;
  x_file_path?: Maybe<Order_By>;
  x_line_number?: Maybe<Order_By>;
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
  line_number: Scalars['Int'];
};

/** Boolean expression to filter rows from the table "lines". All fields are combined with a logical 'AND'. */
export type Lines_Bool_Exp = {
  _and?: Maybe<Array<Lines_Bool_Exp>>;
  _not?: Maybe<Lines_Bool_Exp>;
  _or?: Maybe<Array<Lines_Bool_Exp>>;
  commit_hash?: Maybe<String_Comparison_Exp>;
  file_path?: Maybe<String_Comparison_Exp>;
  line_number?: Maybe<Int_Comparison_Exp>;
};

/** Ordering options when selecting data from "lines". */
export type Lines_Order_By = {
  commit_hash?: Maybe<Order_By>;
  file_path?: Maybe<Order_By>;
  line_number?: Maybe<Order_By>;
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

/** mutation root */
export type Mutation_Root = {
  __typename?: 'mutation_root';
  CalculateBlameLines: Scalars['Boolean'];
  StartCuddlefishSession: StartCuddlefishSessionResponse;
  StartThread: Scalars['String'];
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
  /** fetch data from the table: "lines" */
  lines: Array<Lines>;
  /** fetch data from the table: "lines" using primary key columns */
  lines_by_pk?: Maybe<Lines>;
  noop: Scalars['Boolean'];
};


export type Query_RootBlamelinesArgs = {
  distinct_on?: Maybe<Array<Blamelines_Select_Column>>;
  limit?: Maybe<Scalars['Int']>;
  offset?: Maybe<Scalars['Int']>;
  order_by?: Maybe<Array<Blamelines_Order_By>>;
  where?: Maybe<Blamelines_Bool_Exp>;
};


export type Query_RootBlamelines_By_PkArgs = {
  x_commit_hash: Scalars['String'];
  x_file_path: Scalars['String'];
  x_line_number: Scalars['Int'];
};


export type Query_RootLinesArgs = {
  distinct_on?: Maybe<Array<Lines_Select_Column>>;
  limit?: Maybe<Scalars['Int']>;
  offset?: Maybe<Scalars['Int']>;
  order_by?: Maybe<Array<Lines_Order_By>>;
  where?: Maybe<Lines_Bool_Exp>;
};


export type Query_RootLines_By_PkArgs = {
  commit_hash: Scalars['String'];
  file_path: Scalars['String'];
  line_number: Scalars['Int'];
};

export type Subscription_Root = {
  __typename?: 'subscription_root';
  /** fetch data from the table: "blamelines" */
  blamelines: Array<Blamelines>;
  /** fetch data from the table: "blamelines" using primary key columns */
  blamelines_by_pk?: Maybe<Blamelines>;
  /** fetch data from the table: "lines" */
  lines: Array<Lines>;
  /** fetch data from the table: "lines" using primary key columns */
  lines_by_pk?: Maybe<Lines>;
};


export type Subscription_RootBlamelinesArgs = {
  distinct_on?: Maybe<Array<Blamelines_Select_Column>>;
  limit?: Maybe<Scalars['Int']>;
  offset?: Maybe<Scalars['Int']>;
  order_by?: Maybe<Array<Blamelines_Order_By>>;
  where?: Maybe<Blamelines_Bool_Exp>;
};


export type Subscription_RootBlamelines_By_PkArgs = {
  x_commit_hash: Scalars['String'];
  x_file_path: Scalars['String'];
  x_line_number: Scalars['Int'];
};


export type Subscription_RootLinesArgs = {
  distinct_on?: Maybe<Array<Lines_Select_Column>>;
  limit?: Maybe<Scalars['Int']>;
  offset?: Maybe<Scalars['Int']>;
  order_by?: Maybe<Array<Lines_Order_By>>;
  where?: Maybe<Lines_Bool_Exp>;
};


export type Subscription_RootLines_By_PkArgs = {
  commit_hash: Scalars['String'];
  file_path: Scalars['String'];
  line_number: Scalars['Int'];
};

export type StartCuddlefishSessionMutationVariables = Exact<{
  githubAccessToken: Scalars['String'];
}>;


export type StartCuddlefishSessionMutation = { __typename?: 'mutation_root', StartCuddlefishSession: { __typename?: 'StartCuddlefishSessionResponse', session_token: string } };
