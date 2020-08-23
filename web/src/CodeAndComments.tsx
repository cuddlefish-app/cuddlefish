import {
  Absolute,
  Avatar,
  BorderBox,
  Box,
  Button,
  Flex,
  Grid,
  Popover,
  Relative,
  Text,
  TextInput,
} from "@primer/components";
import { PaperAirplaneIcon } from "@primer/octicons-react";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { graphql, useLazyLoadQuery, useMutation } from "react-relay/hooks";
import SyntaxHighlighter from "react-syntax-highlighter";
import createElement from "react-syntax-highlighter/dist/esm/create-element";
import { githubGist } from "react-syntax-highlighter/dist/esm/styles/hljs";
import { githubRepoId, internalError } from "./App";
import NewThreadPopover from "./NewThreadPopover";
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

// Each individual message bubble. Blue if it's you that's doing the talkin!
const MessageBuble: React.FC<{ me?: boolean }> = (props) => (
  <BorderBox
    marginBottom={1}
    paddingLeft="8px"
    paddingRight="8px"
    paddingBottom="8px"
    paddingTop="4px"
    backgroundColor={props.me ? "blue.4" : "gray.1"}
    borderColor={props.me ? "blue.4" : "gray.1"}
  >
    <Text fontSize={0} color={props.me ? "white" : "black"}>
      {props.children}
    </Text>
  </BorderBox>
);

const ExampleThreadPopover: React.FC = (props) => (
  <Popover open={true} caret="right-top">
    <Popover.Content width={248} padding={2}>
      <Flex flexWrap="nowrap">
        {/* Wrapping in a box is necessary to avoid weird shrinking effects. */}
        <Box>
          <Avatar
            src="https://avatars.githubusercontent.com/drshrey"
            marginTop={1}
          />
        </Box>
        <Box flexGrow={1} marginLeft={1}>
          <MessageBuble>
            Why is this an if instead of a switch statement?
          </MessageBuble>
          <MessageBuble>Actually does this ever happen?</MessageBuble>
        </Box>
      </Flex>
      <Flex flexWrap="nowrap">
        <Box flexGrow={1} marginRight={1}>
          <MessageBuble me>
            I think it's because `user` could be null
          </MessageBuble>
        </Box>
        {/* Wrapping in a box is necessary to avoid weird shrinking effects. */}
        <Box>
          <Avatar
            src="https://avatars.githubusercontent.com/samuela"
            marginTop="2px"
          />
        </Box>
      </Flex>

      <Box marginTop={2}>
        <TextInput
          placeholder="Comment..."
          variant="small"
          marginRight={1}
          width={"176px"}
        ></TextInput>
        <Button>
          <PaperAirplaneIcon size={16}></PaperAirplaneIcon>
        </Button>
      </Box>
    </Popover.Content>
  </Popover>
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

type LineHover = {
  kind: "line";
  linenumber: number;
};

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

  const [hoverState, setHoverState] = useState(null as null | LineHover);
  const newThreadInputRef = useRef(null as null | HTMLInputElement);

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
        // TODO: in the future this should focus the text input on existing threads.
        onDoubleClick={() => newThreadInputRef.current?.focus()}
        onMouseMove={() =>
          setHoverState({ kind: "line", linenumber: lineNumber + 1 })
        }
        // These are the values from GitHub.
        style={{
          lineHeight: "20px",
          fontSize: "12px",
        }}
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
          {fileContents}
        </SyntaxHighlighter>
      ) : null,
    [fileContents]
  );

  return (
    <Flex justifyContent="center" width="100%">
      <Grid gridTemplateColumns="repeat(2, auto)">
        {/* TODO: where are the "small", "medium", etc sizes documented? */}
        <Box width={272}>
          {/* TODO show a "loading thing" before we render the Comments component. */}
          {blameDone && fileContents !== null && (
            <Comments
              commitSHA={commitSHA}
              filePath={filePath}
              fileContents={fileContents}
              hoverState={hoverState}
              newThreadInputRef={newThreadInputRef}
            />
          )}
        </Box>
        <BorderBox
          style={{ overflowX: "auto", marginTop: "13px", width: "768px" }}
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
  hoverState: null | LineHover;
  newThreadInputRef: React.MutableRefObject<HTMLInputElement | null>;
}> = ({ commitSHA, filePath, hoverState, newThreadInputRef }) => {
  // TODO subscribe to updates.
  // useSubscription({});

  // TODO: use the better query version
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
              comments {
                author_id
                body
              }
            }
          }
        }
      }
    `,
    { commitSHA, filePath }
  );
  // console.log(threads);

  // Performance hack: This is slow, don't do it on every render.
  const existingThreads = useMemo(
    () =>
      threads.blamelines
        .filter((bl) => bl.original_line && bl.original_line.threads.length > 0)
        .map((bl) => (
          <Absolute
            top={20 * (bl.x_line_number - 1)}
            left={0}
            key={bl.x_line_number}
          >
            <ExampleThreadPopover></ExampleThreadPopover>
          </Absolute>
        )),
    [threads.blamelines]
  );

  return (
    <Relative>
      {existingThreads}

      {hoverState &&
        threads.blamelines[hoverState.linenumber - 1].original_line?.threads
          .length === 0 && (
          <Absolute top={20 * (hoverState.linenumber - 1)} left={2}>
            <NewThreadPopover
              linenumber={hoverState.linenumber}
              blameline={threads.blamelines[hoverState.linenumber - 1]}
              inputRef={newThreadInputRef}
            ></NewThreadPopover>
          </Absolute>
        )}
    </Relative>
  );
};

export default CodeAndComments;
