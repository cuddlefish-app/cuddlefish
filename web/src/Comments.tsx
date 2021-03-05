import { Absolute, Relative } from "@primer/components";
import React, { useEffect, useMemo } from "react";
import { graphql, useLazyLoadQuery, useSubscription } from "react-relay/hooks";
import { useLocation } from "react-router-dom";
import { RedirectMemo } from "./auth";
import NewThreadPopover from "./NewThreadPopover";
import ThreadPopover from "./ThreadPopover";
import { CodeAndComments_threads_Query } from "./__generated__/CodeAndComments_threads_Query.graphql";

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
                author_github_id
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
                author_github_id
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
            inputRef={
              hoverLine === bl.x_line_number || focusLine === bl.x_line_number
                ? inputRef
                : null
            }
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

  // Unfortunately react-router types `location.state` as `null | undefined | {}`.
  // See https://github.com/DefinitelyTyped/DefinitelyTyped/blob/29e0e56875a17b1439d94e1a6131c96746889929/types/history/index.d.ts#L50
  const redirectMemo = useLocation().state as null | undefined | RedirectMemo;

  // This is the line number that the redirect tells us to go to, null in the
  // absence of the redirectMemo
  const redirectFocusLine: null | number =
    redirectMemo !== null &&
    redirectMemo !== undefined &&
    (redirectMemo.kind === "new_thread" || redirectMemo.kind === "new_comment")
      ? redirectMemo.line
      : null;

  useEffect(() => {
    if (redirectFocusLine !== null) setFocusLine(redirectFocusLine);
  }, [redirectFocusLine, setFocusLine]);

  // The line on which the NewThreadPopover should be on, if any. This can
  // differ from hoverLine when a line is focused.
  // NOTE: Normally this would be unsafe, but since all line numbers are greater
  // than zero, I think we safely avoid the false-y values.
  // TODO: There's still a sporadic bug where the NewThreadPopover input doesn't
  // focus when double-clicking on a line...
  const newThreadLine = redirectFocusLine || focusLine || hoverLine;

  return (
    <Relative>
      {existingThreads}

      {/* Sometimes `threads.blamelines[newThreadLine - 1]` is undefined when
      the useLazyLoadQuery gives back empty blamelines results, eg. when there's
      issues talking to Hasura. */}
      {newThreadLine !== null &&
        threads.blamelines[newThreadLine - 1] !== undefined &&
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
              // Why not just always set inputRef=inputRef?
              // inputRef={hoverLine === newThreadLine ? inputRef : null}
              inputRef={inputRef}
              focusLine={focusLine}
              setHoverLine={setHoverLine}
              setFocusLine={setFocusLine}
            ></NewThreadPopover>
          </Absolute>
        )}
    </Relative>
  );
};

export default Comments;
