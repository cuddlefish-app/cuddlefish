import {
  Absolute,
  Avatar,
  BorderBox,
  Box,
  Button,
  CircleBadge,
  Flex,
  Grid,
  Popover,
  Relative,
  Text,
  TextInput,
} from "@primer/components";
import {
  CommentDiscussionIcon,
  PaperAirplaneIcon,
} from "@primer/octicons-react";
import React, { useState } from "react";
import SyntaxHighlighter from "react-syntax-highlighter";
import createElement from "react-syntax-highlighter/create-element";
import { githubGist } from "react-syntax-highlighter/dist/esm/styles/hljs";

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

type LineHover = {
  kind: "line";
  linenumber: number;
};

const CodeAndComments: React.FC<{ fileContents: string }> = (props) => {
  const [hoverState, setHoverState] = useState({
    kind: "line",
    linenumber: 5,
  } as null | LineHover);

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
    // const isHovered = hoverState?.linenumber == lineNumber + 1;

    return (
      <tr
        onClick={() => console.log(`clicked line ${lineNumber}`)}
        onMouseEnter={() => {
          console.log(`nmouseenter ${lineNumber + 1}`);
          setHoverState({ kind: "line", linenumber: lineNumber + 1 });
        }}
        // These are the values from GitHub.
        style={{
          lineHeight: "20px",
          fontSize: "12px",
          // backgroundColor: isHovered ? "grey" : "transparent",
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

  return (
    <Flex justifyContent="center" width="100%">
      <Grid gridTemplateColumns="repeat(2, auto)">
        {/* TODO: where are the "small", "medium", etc sizes documented? */}
        <Box width={272}>
          <Relative>
            <Absolute top={25} right={1}>
              <CircleBadge size={36} backgroundColor="blue.4">
                <CircleBadge.Icon
                  icon={CommentDiscussionIcon}
                  color="white"
                ></CircleBadge.Icon>
              </CircleBadge>
            </Absolute>

            <Absolute top={20 * (5 - 1)} left={0}>
              <ThreadPopover></ThreadPopover>
            </Absolute>
          </Relative>
        </Box>
        <BorderBox
          style={{ overflowX: "auto", marginTop: "13px", width: "768px" }}
        >
          <Text>{JSON.stringify(hoverState)}</Text>
          <SyntaxHighlighter
            renderer={mySyntaxRenderer}
            // "github-gist" actually appears to be closer to github's actual styling than "github".
            style={githubGist}
            PreTag={MyPreTag}
            CodeTag={"tbody"}
          >
            {props.fileContents}
          </SyntaxHighlighter>
        </BorderBox>
      </Grid>
    </Flex>
  );
};

export default CodeAndComments;
