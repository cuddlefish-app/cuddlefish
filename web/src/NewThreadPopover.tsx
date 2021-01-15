import { Box, Popover } from "@primer/components";
import React, { useContext, useEffect, useState } from "react";
import { graphql, useMutation } from "react-relay/hooks";
import { internalError } from "./App";
import { loginWithRedirect, useAuthState } from "./auth";
import CommentForm from "./CommentForm";
import RedirectMemoContext from "./RedirectMemoContext";
import useClickOutside from "./useClickOutside";

const NewThreadPopover: React.FC<{
  blameline: {
    original_commit: string;
    original_file_path: string;
    original_line_number: number;
    x_commit: string;
    x_file_path: string;
    x_line_number: number;
  };
  inputRef: any;
  // hoverLine: number | null;
  focusLine: number | null;
  setHoverLine: (_: number | null) => void;
  setFocusLine: (_: number | null) => void;
}> = ({ blameline, inputRef, focusLine, setHoverLine, setFocusLine }) => {
  const [message, setMessage] = useState("" as string);
  const { redirectMemo, setRedirectMemo } = useContext(RedirectMemoContext);

  // Check for a redirectMemo marking that the user was just here drafting a new
  // thread. In that case we need to set focusLine, and load up their message.
  useEffect(() => {
    if (redirectMemo !== null && (redirectMemo as any).kind === "new_thread") {
      setFocusLine((redirectMemo as any).line);
      setMessage((redirectMemo as any).message);
      inputRef.current?.focus();
      inputRef.current?.scrollIntoView();
      // TODO: should we submit here as well?

      // Clear redirectMemo so we don't bother with this crap again. That causes
      // weird stuff in the UI...
      setRedirectMemo(null);
    }
  }, [redirectMemo, setFocusLine, setRedirectMemo, inputRef]);

  const popoverRef = useClickOutside(() => {
    // Don't wipe hoverLine because that messes up the TextInput focusing.
    setFocusLine(null);
  });
  const [submit, isInFlight] = useMutation(graphql`
    mutation NewThreadPopover_newthread_Mutation(
      $original_commit: String!
      $original_file_path: String!
      $original_line_number: Int!
      $body: String!
      $author_github_id: Int!
    ) {
      insert_threads_one(
        object: {
          original_commit: $original_commit
          original_file_path: $original_file_path
          original_line_number: $original_line_number
          comments: {
            data: [{ body: $body, author_github_id: $author_github_id }]
          }
        }
      ) {
        id
        # Including order_by should be a no-op, but unfortunately it's necessary for Relay...
        comments(order_by: { created_at: asc }) {
          id
          created_at
          body
          author_github_id
          author {
            github_username
          }
        }
      }
    }
  `);

  const authState = useAuthState();
  return (
    <Popover
      open={true}
      caret="right-top"
      className="ThreadPopover box-shadow-large"
    >
      <Popover.Content width={248} padding={2} ref={popoverRef}>
        <Box>
          <CommentForm
            placeholder="Start a new thread..."
            message={message}
            setMessage={setMessage}
            inputRef={inputRef}
            onSubmit={() => {
              if (authState.isLoggedIn) {
                submit({
                  variables: {
                    original_commit: blameline.original_commit,
                    original_file_path: blameline.original_file_path,
                    original_line_number: blameline.original_line_number,
                    body: message,
                    author_github_id: authState.user.github_id,
                  },
                  updater: (store) => {
                    const newThreadRec = store.getRootField(
                      "insert_threads_one"
                    );
                    store
                      .get(
                        `client:root:blamelines(where:{"x_commit":{"_eq":"${
                          blameline.x_commit
                        }"},"x_file_path":{"_eq":"${
                          blameline.x_file_path
                        }"}}):${blameline.x_line_number - 1}:original_line`
                      )
                      ?.setLinkedRecords(
                        [newThreadRec],
                        'threads(where:{"resolved":{"_eq":false}})'
                      );
                  },
                  // Leaving out onError means things fail silently. Most common failure case is a constraint violation
                  // when a thread already exists but the user tries to start a new one. This is enforced with a
                  // (commit, file, line) uniqueness constraint on the threads table.
                  onError: internalError,
                  // We don't bother with an onComplete callback here because it ends up throwing React warnings that
                  // we're doing stuff on an unmounted component... Fair enough. There's nothing else that needs to be
                  // done on completion.
                });
              } else {
                loginWithRedirect({
                  returnTo: window.location.pathname,
                  redirectMemo: {
                    kind: "new_thread",
                    line: focusLine,
                    message,
                  },
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

export default NewThreadPopover;
