import { randomBytes } from "crypto";
import type { NextApiRequest } from "next";
import {
  assert400,
  getSendgrid,
  hasCorrectApiSecret,
  logHandlerErrors,
} from "../../src/server/utils";
import { CF_APP_EMAIL } from "./config";
import { commentIdToMessageId } from "./insert_comments_webhook";

export default logHandlerErrors(async (req: NextApiRequest) => {
  assert400(hasCorrectApiSecret(req), "incorrect api secret");

  const messageIds = Array(10).map(() =>
    commentIdToMessageId(randomBytes(16).toString("hex"))
  );
  await getSendgrid().send({
    to: { name: "Samuel Ainsworth", email: "sam@cuddlefish.app" },
    from: {
      name: `Poopyface via Cuddlefish Comments`,
      email: CF_APP_EMAIL,
    },
    subject: `💬 this is the subject`,
    text: "and easy to do anywhere, even with Node.js",
    html: "<strong>and easy to do anywhere, even with Node.js</strong>",
    headers: {
      "Message-Id": messageIds[0],
    },
  });
  await getSendgrid().send({
    to: { name: "Samuel Ainsworth", email: "sam@cuddlefish.app" },
    from: {
      name: `Poopyface via Cuddlefish Comments`,
      email: CF_APP_EMAIL,
    },
    subject: `Re: 💬 this is the subject`,
    html: "message 2",
    headers: {
      "Message-Id": messageIds[1],
      References: messageIds[0],
      "In-Reply-To": messageIds[0],
    },
  });
  await getSendgrid().send({
    to: { name: "Samuel Ainsworth", email: "sam@cuddlefish.app" },
    from: {
      name: `Poopyface via Cuddlefish Comments`,
      email: CF_APP_EMAIL,
    },
    subject: `Re: 💬 this is the subject`,
    html: "message 3",
    headers: {
      "Message-Id": messageIds[2],
      References: messageIds[0] + " " + messageIds[1],
      "In-Reply-To": messageIds[1],
    },
  });

  return {};
});
