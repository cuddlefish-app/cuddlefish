import { Box, Popover } from "@primer/components";
import React, { useState } from "react";
import { graphql, useMutation } from "react-relay/hooks";
import { internalError } from "./App";
import CommentForm from "./CommentForm";

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
}> = (props) => {
  const [message, setMessage] = useState("" as string);
  // TODO: add an updater to this bad boy so that threads show up as soon as the user submits them.
  const [submit, isInFlight] = useMutation(graphql`
    mutation NewThreadPopover_newthread_Mutation(
      $original_commit: String!
      $original_file_path: String!
      $original_line_number: Int!
      $body: String!
    ) {
      insert_threads_one(
        object: {
          original_commit: $original_commit
          original_file_path: $original_file_path
          original_line_number: $original_line_number
          comments: { data: [{ body: $body }] }
        }
      ) {
        id
        comments(order_by: { created_at: asc }) {
          id
          created_at
          author_id
          body
        }
      }
    }
  `);
  return (
    <Popover open={true} caret="right-top">
      <Popover.Content width={248} padding={2}>
        <Box>
          <CommentForm
            placeholder="Start a new thread..."
            message={message}
            setMessage={setMessage}
            inputRef={props.inputRef}
            onSubmit={() => {
              submit({
                variables: {
                  original_commit: props.blameline.original_commit,
                  original_file_path: props.blameline.original_file_path,
                  original_line_number: props.blameline.original_line_number,
                  body: message,
                },
                updater: (store) => {
                  const newThreadRec = store.getRootField("insert_threads_one");
                  store
                    .get(
                      `client:root:blamelines(where:{"x_commit":{"_eq":"${
                        props.blameline.x_commit
                      }"},"x_file_path":{"_eq":"${
                        props.blameline.x_file_path
                      }"}}):${props.blameline.x_line_number - 1}:original_line`
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
            }}
            disabled={isInFlight}
          ></CommentForm>
        </Box>
      </Popover.Content>
    </Popover>
  );
};

export default NewThreadPopover;
