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
          <CommentForm
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
                // optimisticUpdater: (store) => console.log(store),
                updater: (store, data) => {
                  console.log("updater");
                  console.log(store.getRoot());
                  console.log(data);
                },
                onCompleted(data) {
                  // Once we're done sending the message, clear the input box.
                  setMessage("");
                  console.log("new thread mut done");
                  console.log(data);
                },
                // Leaving out onError means things fail silently. Most common failure case is a constraint violation
                // when a thread already exists but the user tries to start a new one. This is enforced with a
                // (commit, file, line) uniqueness constraint on the threads table.
                onError(error) {
                  setMessage("");
                  internalError(error);
                },
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
