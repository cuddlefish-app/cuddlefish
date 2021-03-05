import {
  Avatar,
  BorderBox,
  Box,
  Flex,
  Popover,
  Text,
  Tooltip,
} from "@primer/components";
import React, { MutableRefObject, useEffect, useState } from "react";
import { graphql, useMutation } from "react-relay/hooks";
import { useHistory, useLocation } from "react-router-dom";
import { internalError } from "./App";
import { loginWithRedirect, RedirectMemo, useAuthState } from "./auth";
import CommentForm from "./CommentForm";
import useClickOutside from "./useClickOutside";

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

function chunkBy<T>(arr: readonly T[], key: (_: T) => any): T[][] {
  // Don't mutate the argument for the caller.
  let arr1 = [...arr];
  let chunks = [];
  while (arr1.length > 0) {
    // This cast is safe since arr1.length > 0.
    let first = arr1.shift() as T;
    let newchunk = [first];
    const k = key(first);
    while (arr1.length > 0 && key(arr1[0]) === k) {
      // Again, cast is safe since we know that arr1.length > 0.
      newchunk.push(arr1.shift() as T);
    }
    chunks.push(newchunk);
  }
  return chunks;
}

const CommentChunk: React.FC<{
  comments: {
    id: unknown;
    body: string;
    created_at: unknown;
    author_github_id: number;
    author: { github_username: string };
  }[];
}> = ({ comments }) => {
  // We are guaranteed that comments is non-empty and that all author_github_id's are the same.
  const authState = useAuthState();
  const me =
    authState.isLoggedIn &&
    comments[0].author_github_id === authState.user.github_id;
  const github_username = comments[0].author.github_username;
  return (
    <Flex flexWrap="nowrap" flexDirection={me ? "row-reverse" : "row"}>
      {/* Wrapping in a box is necessary to avoid weird shrinking effects. */}
      <Box marginX={1}>
        {me ? (
          <Avatar
            src={`https://avatars.githubusercontent.com/${github_username}`}
            marginTop={1}
          />
        ) : (
          <Tooltip aria-label={`@${github_username}`} direction="w">
            <Avatar
              src={`https://avatars.githubusercontent.com/${github_username}`}
              marginTop={1}
            />
          </Tooltip>
        )}
      </Box>
      <Box flexGrow={1}>
        {comments.map((comment) => (
          <MessageBuble me={me} key={comment.id as string}>
            {comment.body}
          </MessageBuble>
        ))}
      </Box>
    </Flex>
  );
};

// TODO: add people's real name to make things a little more human.
// TODO: add (code author), (thread author) tags in the tooltips.

const ThreadPopover: React.FC<{
  inputRef: MutableRefObject<HTMLInputElement | null> | null;
  blameline: {
    original_commit: string;
    original_file_path: string;
    original_line_number: number;
    x_commit: string;
    x_file_path: string;
    x_line_number: number;
    original_line: {
      threads: ReadonlyArray<{
        id: unknown;
        comments: ReadonlyArray<{
          id: unknown;
          body: string;
          created_at: unknown;
          author_github_id: number;
          author: { github_username: string };
        }>;
      }>;
    } | null;
  };
  hoverLine: number | null;
  focusLine: number | null;
  setHoverLine: (_: number | null) => void;
  setFocusLine: (_: number | null) => void;
}> = ({ inputRef, blameline, focusLine, setHoverLine, setFocusLine }) => {
  const [message, setMessage] = useState("" as string);
  const redirectMemo = useLocation().state as null | undefined | RedirectMemo;
  const history = useHistory();

  // Check for a redirectMemo marking that the user was just here drafting a
  // comment. In that case we need to set focusLine, and load up their message.
  useEffect(() => {
    if (
      redirectMemo !== null &&
      redirectMemo !== undefined &&
      redirectMemo.kind === "new_comment" &&
      redirectMemo.line === blameline.x_line_number &&
      inputRef !== null &&
      inputRef.current !== null
    ) {
      setFocusLine(redirectMemo.line);
      setMessage(redirectMemo.message);
      inputRef.current.focus();
      inputRef.current.scrollIntoView();
      // Don't submit in case the user wants to change their mind.

      // Clear redirectMemo so we don't bother with this crap again. That causes
      // weird stuff in the UI...
      history.replace({ ...history.location, state: null });
    }
  }, [redirectMemo, setFocusLine, inputRef, blameline.x_line_number, history]);

  // We should always be able to find the corresponding original line.
  if (blameline.original_line === null)
    throw internalError(Error("blameline has null original_line"));
  // There should always be a thread to render.
  if (blameline.original_line.threads.length !== 1)
    throw internalError(Error("threads.length !== 1"));

  // Comments come in ordered by `created_at` thanks to our query.
  let thread = blameline.original_line.threads[0];
  let comments = thread.comments;

  // Thread should always have at least one comment.
  if (comments.length === 0)
    throw internalError(Error(`Thread ${thread.id} has no comments!`));

  let chunkedComments = chunkBy(comments, (c) => c.author_github_id);
  const popoverRef = useClickOutside(() => {
    if (focusLine === blameline.x_line_number) {
      setHoverLine(null);
      setFocusLine(null);
    }
  });

  // TODO: this throws an error if you're not logged in. Probably also the same issue in NewThreadPopover. Instead we
  // need to do a login with an `appState` that reminds us to finish the mutation once we get back the user creds.
  const [submit, isInFlight] = useMutation(graphql`
    mutation ThreadPopover_NewComment_Mutation(
      $body: String!
      $thread_id: uuid!
      $author_github_id: Int!
    ) {
      insert_comments_one(
        object: {
          body: $body
          thread_id: $thread_id
          author_github_id: $author_github_id
        }
      ) {
        # Even though they aren't directly used, these fields are important because they control what goes into the
        # Relay Store.
        id
        created_at
        body
        author_github_id
        author {
          github_username
        }
      }
    }
  `);

  const authstate = useAuthState();
  return (
    <Popover
      open={true}
      caret="right-top"
      // box-shadow-large comes from @primer/css.
      className="ThreadPopover box-shadow-large"
    >
      <Popover.Content
        width={248}
        padding={2}
        onClick={() => {
          if (focusLine !== blameline.x_line_number) {
            inputRef?.current?.focus();
            setFocusLine(blameline.x_line_number);
          }
        }}
        onMouseMove={() => setHoverLine(blameline.x_line_number)}
        ref={popoverRef}
      >
        {chunkedComments.map((chunk, i) => (
          <CommentChunk comments={chunk} key={i} />
        ))}

        <Box marginTop={2}>
          <CommentForm
            placeholder="Comment..."
            message={message}
            setMessage={setMessage}
            inputRef={inputRef}
            onSubmit={() => {
              if (authstate.isLoggedIn) {
                submit({
                  variables: {
                    body: message,
                    thread_id: thread.id,
                    author_github_id: authstate.user.github_id,
                  },
                  updater(store) {
                    const linkName = 'comments(order_by:{"created_at":"asc"})';
                    const threadRec = store.get(thread.id as string);
                    const newCommentRec = store.getRootField(
                      "insert_comments_one"
                    );
                    const existingComments = threadRec?.getLinkedRecords(
                      linkName
                    );
                    if (
                      existingComments === null ||
                      existingComments === undefined
                    )
                      throw internalError(
                        Error("no existing comments in relay store")
                      );
                    threadRec?.setLinkedRecords(
                      [...existingComments, newCommentRec],
                      linkName
                    );
                  },
                  onCompleted(data) {
                    setMessage("");
                  },
                  onError(error) {
                    setMessage("");
                    throw internalError(error);
                  },
                });
              } else {
                loginWithRedirect(window.location.pathname, {
                  kind: "new_comment",
                  line: blameline.x_line_number,
                  message,
                });
              }
            }}
            disabled={isInFlight}
          ></CommentForm>
        </Box>
      </Popover.Content>
    </Popover>
  );
};

export default ThreadPopover;
