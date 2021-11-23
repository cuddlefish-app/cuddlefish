import axios from "axios";
import MarkdownIt from "markdown-it";
import pino from "pino";
import React from "react";
import ReactDOMServer from "react-dom/server";
import * as shiki from "shiki";
import { isString, notNull } from "../../src/common_utils";

const CODE_WINDOW_SIZE = 5;

type Props = {
  // Can't pass JSX.Element here due to https://github.com/vercel/next.js/issues/11993
  codeSnippetHtml: string;
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
  codeSnippetHtml,
  repo,
  role,
  recipient,
  newComment,
  newCommentAuthor,
  thread,
}: Props) {
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

  // const commitUrl = `https://github.com/${repo.owner}/${repo.repo}/commit/${commitHash}`;

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
        <div dangerouslySetInnerHTML={{ __html: codeSnippetHtml }} />
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

// function intersperse(xs: any[], sep: any) {
//   return xs.flatMap((x) => [sep, x]).slice(1);
// }

export function renderToJsx(
  lines: shiki.IThemedToken[][],
  fg: string,
  bg: string,
  highlightedLine: number
) {
  const linesJsx = lines.map((l: shiki.IThemedToken[], lineIx: number) => {
    const lineNumber = lineIx + 1;

    if (Math.abs(highlightedLine - lineNumber) <= CODE_WINDOW_SIZE) {
      const tokensJsx = l.map((token, tokenIx) => {
        const style: React.CSSProperties = { color: token.color || fg };
        // token.fontStyle can technically be undefined according to its types,
        // but it doesn't seem that this is possible in practice.
        const fontStyle = token.fontStyle || shiki.FontStyle.None;
        if (fontStyle & shiki.FontStyle.Italic) {
          style.fontStyle = "italic";
        }
        if (fontStyle & shiki.FontStyle.Bold) {
          style.fontWeight = "bold";
        }
        if (fontStyle & shiki.FontStyle.Underline) {
          style.textDecoration = "underline";
        }
        return (
          <span key={tokenIx} style={style}>
            {token.content}
          </span>
        );
      });
      const lineStyles: React.CSSProperties = {
        paddingLeft: "1em",
        width: "100%",
        fontFamily: "monospace",
      };
      if (lineNumber === highlightedLine) {
        lineStyles.backgroundColor = "rgba(174, 123, 20, 0.15)";
        lineStyles.boxShadow = "inset 4px 0 0 rgba(174, 123, 20, 0.4)";
      }
      return (
        <tr key={lineIx}>
          <td
            style={{
              minWidth: "1em",
              marginRight: "0.5em",
              display: "inline-block",
              textAlign: "right",
              color: "rgba(115, 138, 148, 0.4)",
              fontFamily: "monospace",
            }}
          >
            {lineNumber}
          </td>
          <td style={lineStyles}>{tokensJsx}</td>
        </tr>
      );
    } else {
      // Line is too far away, don't bother printing it.
      return null;
    }
  });
  return (
    <pre
      style={{
        backgroundColor: bg,
        padding: "2em",
        borderRadius: "1em",
        overflowX: "scroll",
      }}
    >
      <code style={{ display: "inline-block", minWidth: "100%" }}>
        <table style={{ minWidth: "100%" }}>
          <tbody>{linesJsx}</tbody>
        </table>
      </code>
    </pre>
  );
}

const FILE_EXTENSIONS: Array<{ ext: string; lang: shiki.Lang }> = [
  { lang: "asm", ext: "asm" },
  { lang: "bash", ext: ".bash" },
  { lang: "bat", ext: ".bat" },
  { lang: "c", ext: ".c" },
  { lang: "c", ext: ".h" },
  { lang: "cmd", ext: ".cmd" },
  { lang: "cpp", ext: ".cc" },
  { lang: "cpp", ext: ".cpp" },
  { lang: "cpp", ext: ".cxx" },
  { lang: "cpp", ext: ".h++" },
  { lang: "cpp", ext: ".hh" },
  { lang: "cpp", ext: ".hpp" },
  { lang: "cpp", ext: ".hxx" },
  { lang: "csharp", ext: ".cs" },
  { lang: "css", ext: ".css" },
  { lang: "d", ext: ".d" },
  { lang: "dart", ext: ".dart" },
  { lang: "diff", ext: ".diff" },
  { lang: "diff", ext: ".patch" },
  { lang: "docker", ext: "dockerfile" },
  { lang: "elixir", ext: ".ex" },
  { lang: "elixir", ext: ".exs" },
  { lang: "elm", ext: ".elm" },
  { lang: "erb", ext: ".erb" },
  { lang: "erlang", ext: ".erl" },
  { lang: "erlang", ext: ".hrl" },
  { lang: "fsharp", ext: ".fs" },
  { lang: "fsharp", ext: ".fsi" },
  { lang: "fsharp", ext: ".fsx" },
  { lang: "go", ext: ".go" },
  { lang: "graphql", ext: ".gql" },
  { lang: "graphql", ext: ".graphql" },
  { lang: "groovy", ext: ".groovy" },
  { lang: "haskell", ext: ".hs" },
  { lang: "html", ext: ".htm" },
  { lang: "html", ext: ".html" },
  { lang: "ini", ext: ".ini" },
  { lang: "java", ext: ".java" },
  { lang: "javascript", ext: ".js" },
  { lang: "json", ext: ".json" },
  { lang: "jsx", ext: ".jsx" },
  { lang: "julia", ext: ".jl" },
  { lang: "kotlin", ext: ".kt" },
  { lang: "kotlin", ext: ".ktm" },
  { lang: "kotlin", ext: ".kts" },
  { lang: "latex", ext: ".tex" },
  { lang: "less", ext: ".less" },
  { lang: "lisp", ext: ".lisp" },
  { lang: "lisp", ext: ".lsp" },
  { lang: "lua", ext: ".lua" },
  { lang: "makefile", ext: ".mk" },
  { lang: "makefile", ext: "makefile" },
  { lang: "markdown", ext: ".markdown" },
  { lang: "markdown", ext: ".md" },
  { lang: "nix", ext: ".nix" },
  { lang: "objective-c", ext: ".m" },
  { lang: "ocaml", ext: ".ml" },
  { lang: "ocaml", ext: ".mli" },
  { lang: "perl", ext: ".pl" },
  { lang: "php", ext: ".php" },
  { lang: "prolog", ext: ".pro" },
  { lang: "prolog", ext: ".prolog" },
  { lang: "purescript", ext: ".purs" },
  { lang: "python", ext: ".py" },
  { lang: "r", ext: ".r" },
  { lang: "ruby", ext: ".rb" },
  { lang: "rust", ext: ".rs" },
  { lang: "sass", ext: ".sass" },
  { lang: "scala", ext: ".scala" },
  { lang: "scheme", ext: ".rkt" }, // Racket
  { lang: "scheme", ext: ".scm" },
  { lang: "scheme", ext: ".ss" },
  { lang: "scss", ext: ".scss" },
  { lang: "sh", ext: ".sh" },
  { lang: "solidity", ext: ".sol" },
  { lang: "sql", ext: ".sql" },
  { lang: "svelte", ext: ".svelte" },
  { lang: "swift", ext: ".swift" },
  { lang: "system-verilog", ext: ".sv" },
  { lang: "system-verilog", ext: ".svh" },
  { lang: "toml", ext: ".toml" },
  { lang: "tsx", ext: ".tsx" },
  { lang: "typescript", ext: ".ts" },
  { lang: "verilog", ext: ".v" },
  { lang: "verilog", ext: ".vh" },
  { lang: "vhdl", ext: ".vhd" },
  { lang: "vue", ext: ".vue" },
  { lang: "wasm", ext: ".wasm" },
  { lang: "wasm", ext: ".wat" },
  { lang: "xml", ext: ".xml" },
  { lang: "yaml", ext: ".yaml" },
  { lang: "yaml", ext: ".yml" },
  { lang: "zsh", ext: ".zsh" },
];
function getLangFromName(
  log: pino.Logger,
  filePath: string
): shiki.Lang | undefined {
  const lang = FILE_EXTENSIONS.find((x) => filePath.endsWith(x.ext));
  if (lang) {
    return lang.lang;
  } else {
    log.warn(`Could not find language for file ${filePath}`);
    return undefined;
  }
}

export async function getCodeSnippetHtml(
  log: pino.Logger,
  repo: { owner: string; repo: string },
  thread: {
    original_commit_hash: string;
    original_file_path: string;
    original_line_number: number;
  }
) {
  const highlighter = await shiki.getHighlighter({
    theme: "github-dark-dimmed",
  });
  // TODO request retries
  const fileContents = (
    await axios.get(
      `https://raw.githubusercontent.com/${repo.owner}/${repo.repo}/${thread.original_commit_hash}/${thread.original_file_path}`
    )
  ).data;
  const highlightedTokens = highlighter.codeToThemedTokens(
    fileContents,
    getLangFromName(log, thread.original_file_path)
  );
  const codeSnippet = renderToJsx(
    highlightedTokens,
    highlighter.getForegroundColor(),
    highlighter.getBackgroundColor(),
    thread.original_line_number
  );
  return ReactDOMServer.renderToStaticMarkup(codeSnippet);
}

export async function getServerSideProps(): Promise<{ props: Props }> {
  // const thread = {
  //   original_commit_hash: "8e17697905eb6e5968eba28915d9de375dc11e9c",
  //   original_file_path: "api/download-gql-schemas.sh",
  //   original_line_number: 7,
  // };
  // Markdown example:
  // const thread = {
  //   original_commit_hash: "8e17697905eb6e5968eba28915d9de375dc11e9c",
  //   original_file_path: "README.md",
  //   original_line_number: 28,
  // },

  const log = pino();
  const repo = { owner: "cuddlefish-app", repo: "cuddlefish" };
  const thread = {
    original_commit_hash: "9ef0470b8eee351fc8c3674e73d7d32fe82dd28e",
    original_file_path: "api/src/main.rs",
    original_line_number: 213,
  };
  const codeSnippetHtml = await getCodeSnippetHtml(log, repo, thread);

  return {
    props: {
      codeSnippetHtml,
      repo,
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
      thread,
    },
  };
}

export default NewThreadEmail;
