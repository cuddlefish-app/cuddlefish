import { Box, Button, Popover, TextInput } from "@primer/components";
import { PaperAirplaneIcon } from "@primer/octicons-react";
import React, { useState } from "react";
import { graphql, useMutation } from "react-relay/hooks";
import { internalError } from "./App";

const NewThreadPopover: React.FC<{
  linenumber: number;
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
          <form
            onSubmit={(event) => {
              // Note that when the button is disabled, hitting and enter and clicking on the button do not hit this
              // callback. That's safe for us. If we get here, then we really should be creating a new thread.
              if (message.trim().length > 0) {
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
                  },
                  // Leaving out onError means things fail silently. Most common failure case is a constraint violation
                  // when a thread already exists but the user tries to start a new one. This is enforced with a
                  // (commit, file, line) uniqueness constraint on the threads table.
                  onError(error) {
                    setMessage("");
                    internalError(error);
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
            <Button disabled={message.trim().length === 0 || isInFlight}>
              <PaperAirplaneIcon size={16}></PaperAirplaneIcon>
            </Button>
          </form>
        </Box>
      </Popover.Content>
    </Popover>
  );
};

export default NewThreadPopover;
