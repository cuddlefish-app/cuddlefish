import {
  Absolute,
  BorderBox,
  Box,
  Flex,
  Grid,
  Relative,
} from "@primer/components";
import React, { Suspense, useEffect, useMemo, useRef, useState } from "react";
import {
  graphql,
  useLazyLoadQuery,
  useMutation,
  useSubscription,
} from "react-relay/hooks";
import SyntaxHighlighter from "react-syntax-highlighter";
import createElement from "react-syntax-highlighter/dist/esm/create-element";
import { githubGist } from "react-syntax-highlighter/dist/esm/styles/hljs";
import { githubRepoId, internalError } from "./App";
import NewThreadPopover from "./NewThreadPopover";
import ThreadPopover from "./ThreadPopover";
import { CodeAndComments_threads_Query } from "./__generated__/CodeAndComments_threads_Query.graphql";

const MyPreTag: React.FC = (props) => (
  <table
    style={{
      // This max-content is the magic sauce that prevents word wrapping.
      minWidth: "max-content",
      // border-spacing unset is essential otherwise there's mystery space added between rows.
      borderSpacing: "unset",
      // So that indents, etc actually show up.
      whiteSpace: "pre",
    }}
    className="codetable"
  >
    {props.children}
  </table>
);

// Returns whether or not the blameline info has been successfully calculated and dumped into the blamelines table.
function useCalcBlameLines(
  repo_owner: string,
  repo_name: string,
  filePath: string,
  commitSHA: string
) {
  const repoId = githubRepoId(repo_owner, repo_name);
  const [calcBlameLines, waiting] = useMutation(graphql`
    mutation CodeAndComments_calcblamelines_Mutation(
      $repoId: String!
      $commit: String!
      $filePath: String!
    ) {
      CalculateBlameLines(
        repoId: $repoId
        lastCommit: $commit
        filePath: $filePath
      )
    }
  `);
  useEffect(() => {
    calcBlameLines({
      variables: { repoId, commit: commitSHA, filePath: filePath },
      onError: internalError,
    });
    // TODO: Having calcBlameLines in here actually causes a bunch of redundant calls to the API for the same file. This
    // really sucks. I'm guessing that the RelayEnvProvider reloads too many times and that each time implies a new
    // calcBlameLines closure.
  }, [repoId, commitSHA, filePath, calcBlameLines]);

  return !waiting;
}

function useFileContents(
  repo_owner: string,
  repo_name: string,
  commitSHA: string,
  filePath: string
) {
  const [fileContents, setFileContents] = useState(null as null | string);
  useEffect(() => {
    (async () => {
      try {
        const fileResponse = await fetch(
          `https://raw.githubusercontent.com/${repo_owner}/${repo_name}/${commitSHA}/${filePath}`
        );
        setFileContents(await fileResponse.text());
      } catch (error) {
        // TODO: 404 when the file/repo doesn't exist or it's just not public.
        console.error(error);
      }
    })();
  }, [repo_owner, repo_name, commitSHA, filePath]);
  return fileContents;
}

const CodeAndComments: React.FC<{
  repo_owner: string;
  repo_name: string;
  filePath: string;
  commitSHA: string;
}> = ({ repo_owner, repo_name, filePath, commitSHA }) => {
  const fileContents = useFileContents(
    repo_owner,
    repo_name,
    commitSHA,
    filePath
  );
  const blameDone = useCalcBlameLines(
    repo_owner,
    repo_name,
    filePath,
    commitSHA
  );

  // // Check that we have the same number of `blamelines` as we have lines in the `fileContents`.
  // // If there are trailing newlines at the end of the file, git blame will remove just the last one. Luckily git blame
  // // does not interfere with newlines at the beginning of a file howevere.
  // if (fileContents.endsWith("\n")) {
  //   console.assert(
  //     fileContents.slice(0, -1).split(/\r?\n/).length ===
  //       blamelines.BlameLines.length
  //   );
  // } else {
  //   console.assert(
  //     fileContents.split(/\r?\n/).length === blamelines.BlameLines.length
  //   );
  // }

  // Collapsing this into a single state unfortunately doesn't work because that would require re-rendering the
  // SyntaxHighlighter stuff.
  const [hoverLine, setHoverLine] = useState(null as null | number);
  const [focusLine, setFocusLine] = useState(null as null | number);
  const inputRef = useRef(null as null | HTMLInputElement);

  // An effect that does the DOM-hackery necessary to get focus lines working.
  useEffect(() => {
    // Add focusLine class to the line that is currently focused.
    const lineTr = document.getElementById(`LineOfCode-${focusLine}`);
    lineTr?.classList.add("focusLine");

    // Remove class on cleanup.
    return () => lineTr?.classList.remove("focusLine");
  }, [focusLine]);

  function LineOfCode({
    row,
    lineNumber,
    stylesheet,
    useInlineStyles,
  }: {
    row: any;
    lineNumber: number;
    stylesheet: any;
    useInlineStyles: any;
  }) {
    return (
      <tr
        // Double-clicking on a line focuses on the line.
        onDoubleClick={() => {
          inputRef.current?.focus();
          setFocusLine(lineNumber + 1);
        }}
        // When you click on another line, clear the focused line.
        onClick={() => setFocusLine(null)}
        // When you hover on a line, set the hoverLine.
        onMouseMove={() => setHoverLine(lineNumber + 1)}
        // These are the values from GitHub.
        style={{
          lineHeight: "20px",
          fontSize: "12px",
        }}
        // Set id so that we can pluck them out and do some DOM hackery to get focusLine set correctly.
        id={`LineOfCode-${lineNumber + 1}`}
      >
        <td
          style={{
            textAlign: "right",
            color: "#ccc",
            display: "block",
            marginRight: 20,
            width: 40,
            fontFamily:
              "SFMono-Regular, Consolas, Liberation Mono, Menlo, monospace",
            padding: 0,
          }}
          className={"linenumber unselectable"}
        >
          {lineNumber + 1}
        </td>
        <td
          // This is the same font family that GitHub uses. Maybe try Fira Code?
          style={{
            fontFamily:
              "SFMono-Regular, Consolas, Liberation Mono, Menlo, monospace",
            padding: 0,
          }}
          className={"lineofcode"}
        >
          {createElement({
            node: row,
            stylesheet,
            useInlineStyles,
            key: lineNumber,
          })}
        </td>
      </tr>
    );
  }

  const mySyntaxRenderer = ({
    rows,
    stylesheet,
    useInlineStyles,
  }: {
    rows: [{ tagName: string; properties: {}; children: [] }];
    stylesheet: any;
    useInlineStyles: any;
  }) => {
    return rows.map((row, ix) => (
      <LineOfCode
        row={row}
        key={ix}
        lineNumber={ix}
        stylesheet={stylesheet}
        useInlineStyles={useInlineStyles}
      ></LineOfCode>
    ));
  };

  // See https://github.com/react-syntax-highlighter/react-syntax-highlighter/issues/302.
  // SyntaxHighlighter doesn't like null strings understandably, so we need to check for that.
  const syntaxHighlighted = useMemo(
    () =>
      fileContents !== null ? (
        <SyntaxHighlighter
          renderer={mySyntaxRenderer}
          // "github-gist" actually appears to be closer to github's actual styling than "github".
          style={githubGist}
          PreTag={MyPreTag}
          CodeTag={"tbody"}
        >
          {/* Trim off the last whitespace on the file since we don't get blamelines for those lines, and so then bad
          things happen. This also reflects GitHubs behavior. */}
          {fileContents.trimEnd()}
        </SyntaxHighlighter>
      ) : null,
    [fileContents]
  );

  return (
    <Flex justifyContent="center" width="100%">
      <Grid
        gridTemplateColumns="repeat(2, auto)"
        className={focusLine !== null ? "focusLine" : "noFocusLine"}
      >
        {/* TODO: where are the "small", "medium", etc sizes documented? */}
        <Box width={272}>
          {/* TODO show a "loading thing" before we render the Comments component. */}
          {blameDone && fileContents !== null && (
            <Suspense fallback={<div>loading comments, such suspense!</div>}>
              <Comments
                commitSHA={commitSHA}
                filePath={filePath}
                fileContents={fileContents}
                hoverLine={hoverLine}
                focusLine={focusLine}
                setHoverLine={setHoverLine}
                setFocusLine={setFocusLine}
                inputRef={inputRef}
              />
            </Suspense>
          )}
        </Box>
        <BorderBox
          style={{ overflowX: "auto", marginTop: "13px", width: "768px" }}
          // Clear the hover line when the mouse leaves the CodeAndComments area. This makes it a lot more user-friendly
          // when trying to get rid of NewThreadPopover thing.
          onMouseLeave={() => setHoverLine(null)}
        >
          {syntaxHighlighted}
        </BorderBox>
      </Grid>
    </Flex>
  );
};

const Comments: React.FC<{
  commitSHA: string;
  filePath: string;
  fileContents: string;
  hoverLine: null | number;
  focusLine: null | number;
  setHoverLine: (_: number | null) => void;
  setFocusLine: (_: number | null) => void;
  inputRef: React.MutableRefObject<HTMLInputElement | null>;
}> = ({
  commitSHA,
  filePath,
  hoverLine,
  focusLine,
  setHoverLine,
  setFocusLine,
  inputRef,
}) => {
  // TODO: Lots of warnings like "WebSocket connection to 'wss://cuddlefish-hasura.herokuapp.com/v1/graphql' failed:
  // WebSocket is closed before the connection is established." I'm guessing because Hasura doesn't allow subscriptions
  // from people without auth. Makes sense, but we also can't conditionally call `useSubscription` due to the
  // limitations of React hooks. I'm guessing the solution will be to put this subscription in its own component and
  // then conditionally render that component if `isAuthenticated` from `useAuth0` is true.

  // TODO: don't subscribe for large files. Gotta figure out where the scaling breaks down!

  // TODO: See https://github.com/cuddlefish-app/cuddlefish/issues/3.
  useSubscription({
    subscription: graphql`
      subscription CodeAndComments_threads_Subscription(
        $commitSHA: String!
        $filePath: String!
      ) {
        blamelines(
          where: {
            x_commit: { _eq: $commitSHA }
            x_file_path: { _eq: $filePath }
          }
        ) {
          original_commit
          original_file_path
          original_line_number
          x_commit
          x_file_path
          x_line_number
          original_line {
            threads(where: { resolved: { _eq: false } }) {
              id
              comments(order_by: { created_at: asc }) {
                id
                body
                created_at
                author_id
                author {
                  github_username
                }
              }
            }
          }
        }
      }
    `,
    variables: { commitSHA, filePath },
  });

  // TODO there are four things here that should all just be one fragment: the subscription and query in this component
  // and the mutations in ThreadPopover and NewThreadPopover.

  // TODO: use the better query version
  // TODO: can we filter only those lines that have a thread?
  const threads = useLazyLoadQuery<CodeAndComments_threads_Query>(
    graphql`
      query CodeAndComments_threads_Query(
        $commitSHA: String!
        $filePath: String!
      ) {
        blamelines(
          where: {
            x_commit: { _eq: $commitSHA }
            x_file_path: { _eq: $filePath }
          }
        ) {
          original_commit
          original_file_path
          original_line_number
          x_commit
          x_file_path
          x_line_number
          original_line {
            threads(where: { resolved: { _eq: false } }) {
              id
              comments(order_by: { created_at: asc }) {
                id
                body
                created_at
                author_id
                author {
                  github_username
                }
              }
            }
          }
        }
      }
    `,
    { commitSHA, filePath }
  );

  // Performance hack: This is slow, don't do it on every render.
  const relevantBlameLines = useMemo(
    () =>
      threads.blamelines.filter(
        (bl) => bl.original_line && bl.original_line.threads.length > 0
      ),
    [threads.blamelines]
  );
  const existingThreads = useMemo(
    () =>
      relevantBlameLines.map((bl) => (
        <Absolute
          top={20 * (bl.x_line_number - 1)}
          left={0}
          key={bl.x_line_number}
          className={
            "ThreadPopover-outer " +
            (hoverLine === bl.x_line_number ? "hoverLine " : "") +
            (focusLine === bl.x_line_number ? "focusLine" : "")
          }
        >
          <ThreadPopover
            blameline={bl}
            inputRef={hoverLine === bl.x_line_number ? inputRef : null}
            hoverLine={hoverLine}
            focusLine={focusLine}
            setHoverLine={setHoverLine}
            setFocusLine={setFocusLine}
          />
        </Absolute>
      )),
    [
      relevantBlameLines,
      hoverLine,
      focusLine,
      inputRef,
      setHoverLine,
      setFocusLine,
    ]
  );

  // The line on which the NewThreadPopover should be on, if any. There's still a sporadic bug where the
  // NewThreadPopover input doesn't focus when double-clicking on a line...
  const newThreadLine = focusLine !== null ? focusLine : hoverLine;

  return (
    <Relative>
      {existingThreads}

      {/* TODO: Sometimes `threads.blamelines[newThreadLine - 1]` is undefined when the useLazyLoadQuery gives back
      empty blamelines results, eg. when there's issues talking to Hasura. */}
      {newThreadLine !== null &&
        threads.blamelines[newThreadLine - 1].original_line?.threads.length ===
          0 && (
          <Absolute
            top={20 * (newThreadLine - 1)}
            left={2}
            className={
              "ThreadPopover-outer " +
              (hoverLine === newThreadLine ? "hoverLine " : "") +
              (focusLine === newThreadLine ? "focusLine" : "")
            }
          >
            <NewThreadPopover
              blameline={threads.blamelines[newThreadLine - 1]}
              inputRef={hoverLine === newThreadLine ? inputRef : null}
              hoverLine={hoverLine}
              focusLine={focusLine}
              setHoverLine={setHoverLine}
              setFocusLine={setFocusLine}
            ></NewThreadPopover>
          </Absolute>
        )}
    </Relative>
  );
};

export default CodeAndComments;
