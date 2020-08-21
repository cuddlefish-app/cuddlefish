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
import React, { useMemo, useRef, useState } from "react";
import { graphql, useLazyLoadQuery, useMutation } from "react-relay/hooks";
import SyntaxHighlighter from "react-syntax-highlighter";
import createElement from "react-syntax-highlighter/dist/esm/create-element";
import { githubGist } from "react-syntax-highlighter/dist/esm/styles/hljs";
import { CodeAndComments_blamelines_Query } from "./__generated__/CodeAndComments_blamelines_Query.graphql";

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

const ThreadPopover: React.FC = (props) => (
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

// TODO: split this into a separate file
const NewThreadPopover: React.FC<{
  linenumber: number;
  blameline: {
    readonly originalCommit: string;
    readonly originalFilePath: string;
    readonly originalLineNumber: number;
  };
  inputRef: any;
}> = (props) => {
  const [message, setMessage] = useState("" as string);
  const [submit, isInFlight] = useMutation(graphql`
    mutation CodeAndComments_newthread_Mutation(
      $original_commit: String!
      $original_file_path: String!
      $original_line_number: Int!
      $body: String!
    ) {
      insert_threads(
        objects: [
          {
            original_commit: $original_commit
            original_file_path: $original_file_path
            original_line_number: $original_line_number
            comments: { data: [{ body: $body }] }
          }
        ]
      ) {
        affected_rows
      }
    }
  `);
  return (
    <Popover open={true} caret="right-top">
      <Popover.Content width={248} padding={2}>
        <Box>
          <form
            onSubmit={(event) => {
              if (message.trim().length > 0) {
                submit({
                  variables: {
                    original_commit: props.blameline.originalCommit,
                    original_file_path: props.blameline.originalFilePath,
                    original_line_number: props.blameline.originalLineNumber,
                    body: message,
                  },
                  onCompleted(data) {
                    setMessage("");
                  },
                });
              }

              // So that the browser doesn't refresh.
              event.preventDefault();
            }}
          >
            <TextInput
              placeholder="Start a new thread..."
              variant="small"
              marginRight={1}
              width={"176px"}
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              ref={props.inputRef}
            ></TextInput>
            <Button disabled={message.trim().length === 0}>
              <PaperAirplaneIcon size={16}></PaperAirplaneIcon>
            </Button>
          </form>
        </Box>
      </Popover.Content>
    </Popover>
  );
};

type LineHover = {
  kind: "line";
  linenumber: number;
};

const CodeAndComments: React.FC<{
  repo_owner: string;
  repo_name: string;
  filePath: string;
  fileContents: string;
  commitSHA: string;
}> = (props) => {
  const blamelines = useLazyLoadQuery<CodeAndComments_blamelines_Query>(
    graphql`
      query CodeAndComments_blamelines_Query(
        $repoId: String!
        $filePath: String!
        $commitSHA: String!
      ) {
        BlameLines(
          repoId: $repoId
          filePath: $filePath
          lastFileCommit: $commitSHA
        ) {
          originalCommit
          originalFilePath
          originalLineNumber
        }
      }
    `,
    {
      repoId: `github-${props.repo_owner}!${props.repo_name}`,
      filePath: props.filePath,
      commitSHA: props.commitSHA,
    }
  );

  // Check that we have the same number of `blamelines` as we have lines in the `fileContents`.
  // If there are trailing newlines at the end of the file, git blame will remove just the last one. Luckily git blame
  // does not interfere with newlines at the beginning of a file howevere.
  if (props.fileContents.endsWith("\n")) {
    console.assert(
      props.fileContents.slice(0, -1).split(/\r?\n/).length ===
        blamelines.BlameLines.length
    );
  } else {
    console.assert(
      props.fileContents.split(/\r?\n/).length === blamelines.BlameLines.length
    );
  }

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

  // See https://github.com/react-syntax-highlighter/react-syntax-highlighter/issues/302
  const syntaxHighlighted = useMemo(
    () => (
      <SyntaxHighlighter
        renderer={mySyntaxRenderer}
        // "github-gist" actually appears to be closer to github's actual styling than "github".
        style={githubGist}
        PreTag={MyPreTag}
        CodeTag={"tbody"}
      >
        {props.fileContents}
      </SyntaxHighlighter>
    ),
    [props.fileContents]
  );

  return (
    <Flex justifyContent="center" width="100%">
      <Grid gridTemplateColumns="repeat(2, auto)">
        {/* TODO: where are the "small", "medium", etc sizes documented? */}
        <Box width={272}>
          <Relative>
            <Absolute top={20 * 4} left={0}>
              <ThreadPopover></ThreadPopover>
            </Absolute>

            {hoverState && (
              <Absolute top={20 * (hoverState.linenumber - 1)} left={2}>
                <NewThreadPopover
                  linenumber={hoverState.linenumber}
                  blameline={blamelines.BlameLines[hoverState.linenumber - 1]}
                  inputRef={newThreadInputRef}
                ></NewThreadPopover>
              </Absolute>
            )}
          </Relative>
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

export default CodeAndComments;
