import MarkdownIt from "markdown-it";
import { notNull } from "../../src/common_utils";

type Props = {
  newComment: { body: string };
  newCommentAuthor?:
    | {
        github_name?: string | null | undefined;
        github_username: string;
      }
    | null
    | undefined;
};

function NewCommentEmail({ newComment, newCommentAuthor }: Props) {
  let signature = null;
  if (newCommentAuthor) {
    const commenterGitHubProfileUrl = `https://github.com/${newCommentAuthor.github_username}`;
    const signatureLink = (
      <a href={commenterGitHubProfileUrl} target="_blank" rel="noreferrer">
        @{newCommentAuthor.github_username}
      </a>
    );
    signature =
      notNull(newCommentAuthor.github_name).length > 0 ? (
        <p>
          -- {newCommentAuthor.github_name} ({signatureLink})
        </p>
      ) : (
        signatureLink
      );
  }

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

        {signature}

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
    </div>
  );
}

export async function getStaticProps(): Promise<{ props: Props }> {
  return {
    props: {
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
        github_username: "drshrey",
        github_name: "Shreyas Jaganmohan",
      },
    },
  };
}

export default NewCommentEmail;
