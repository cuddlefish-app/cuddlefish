import MarkdownIt from "markdown-it";
import { isString, notNull } from "../../src/common_utils";

type Props = {
  repo: { owner: string; repo: string };
  role: "author" | "committer" | "admin";
  recipient: { name: string; email: string };
  newComment: { body: string };
  newCommentAuthor: {
    email: string;
    github_name?: string | null | undefined;
    github_username: string;
  };
  thread: {
    original_commit_hash: string;
    original_file_path: string;
    original_line_number: number;
  };
};

function NewThreadEmail({
  repo,
  role,
  recipient,
  newComment,
  newCommentAuthor,
  thread,
}: Props) {
  // Things to include:
  // - code highlighted region of line referenced
  // - comment text (markdown rendered)
  // - link to vscode extension

  const commitHash = thread.original_commit_hash;

  // Add ?plain=1 so that we get the raw source when linking to markdown files!
  const lineUrl = `https://github.com/${repo.owner}/${repo.repo}/blob/${commitHash}/${thread.original_file_path}?plain=1#L${thread.original_line_number}`;

  const verb =
    role === "author"
      ? "wrote"
      : role === "committer"
      ? "committed"
      : "participated in";

  const commenterGitHubProfileUrl = `https://github.com/${newCommentAuthor.github_username}`;
  const signatureLink = (
    <a href={commenterGitHubProfileUrl} target="_blank" rel="noreferrer">
      @{newCommentAuthor.github_username}
    </a>
  );
  const signature =
    isString(newCommentAuthor.github_name) &&
    notNull(newCommentAuthor.github_name).length > 0 ? (
      <>
        {newCommentAuthor.github_name} ({signatureLink})
      </>
    ) : (
      signatureLink
    );

  const commitUrl = `https://github.com/${repo.owner}/${repo.repo}/commit/${commitHash}`;

  const md = new MarkdownIt({ linkify: true, breaks: true });
  const commentHtml = md.render(newComment.body);
  return (
    <div
      style={{
        fontFamily:
          "-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Oxygen, Ubuntu, Cantarell, Fira Sans, Droid Sans, Helvetica Neue, sans-serif",
      }}
    >
      <main>
        <p>
          Hi {recipient.name.length > 0 ? recipient.name : recipient.email}!
        </p>

        <p>
          I have a question about{" "}
          <a href={lineUrl} target="_blank" rel="noreferrer">
            this line of code
          </a>{" "}
          that you {verb}:
        </p>

        <div
          style={{
            backgroundColor: "rgba(240, 240, 240, 0.5)",
            paddingLeft: "1.25em",
            paddingRight: "1.25em",
            paddingTop: "0.5em",
            paddingBottom: "0.5em",
          }}
          dangerouslySetInnerHTML={{ __html: commentHtml }}
        ></div>

        <p> -- {signature}</p>

        {/* <p>
          Here&apos;s the original{" "}
          <a href={commitUrl} target="_blank" rel="noreferrer">
            commit
          </a>{" "}
          for reference.
        </p> */}

        <p>
          Respond by <b>replying to this email</b> or via the Cuddlefish{" "}
          <b>
            <a
              href="https://marketplace.visualstudio.com/items?itemName=cuddlefish-app.cuddlefish-comments"
              target="_blank"
              rel="noreferrer"
            >
              VSCode extension
            </a>
          </b>
          !
        </p>
      </main>

      <hr
        style={{
          color: "transparent",
          borderTopWidth: "1px",
          borderTopStyle: "dashed",
          borderTopColor: "#999",
        }}
      />

      <footer style={{ color: "#999" }}>
        <p>
          What is this?{" "}
          <a
            href="https://cuddlefish.app"
            style={{ color: "inherit" }}
            target="_blank"
            rel="noreferrer"
          >
            cuddlefish.app
          </a>{" "}
          🐙 is Google Docs-style comments for code. For developers, by
          developers.{" "}
          <a
            href="https://github.com/cuddlefish-app/cuddlefish"
            style={{ color: "inherit" }}
            target="_blank"
            rel="noreferrer"
          >
            Check us out on GitHub
          </a>
          ! Feedback?{" "}
          <a href="mailto:sam@cuddlefish.app" style={{ color: "inherit" }}>
            Let us know!
          </a>
        </p>
        <p>
          <small>
            Too many emails?{" "}
            <a href="mailto:sam@cuddlefish.app" style={{ color: "inherit" }}>
              unsubscribe
            </a>
          </small>
        </p>
      </footer>
    </div>
  );
}

export async function getStaticProps(): Promise<{ props: Props }> {
  return {
    props: {
      repo: { owner: "cuddlefish-app", repo: "cuddlefish" },
      newComment: {
        body: `this is the _comment_ ~body~! **Woohoo** \`markdown\`! :+1:
\`\`\`
// this is a code block
\`\`\`

\`\`\`ts
// this is a ts code block
const foo = "bar";
\`\`\`
`,
      },
      newCommentAuthor: {
        email: "shreyas.jaganmohan@gmail.com",
        github_username: "drshrey",
        github_name: "Shreyas Jaganmohan",
      },
      recipient: {
        email: "skainsworth@gmail.com",
        name: "Samuel Ainsworth",
      },
      role: "author",
      thread: {
        original_commit_hash: "8e17697905eb6e5968eba28915d9de375dc11e9c",
        original_file_path: "api/download-gql-schemas.sh",
        original_line_number: 7,
      },
      // Markdown example:
      // thread: {
      //   original_commit_hash: "8e17697905eb6e5968eba28915d9de375dc11e9c",
      //   original_file_path: "README.md",
      //   original_line_number: 28,
      // },
    },
  };
}

export default NewThreadEmail;
