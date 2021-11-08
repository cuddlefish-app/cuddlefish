import type { NextApiRequest, NextApiResponse } from "next";
import { assert400, logHandlerErrors } from "../../common_utils";
import { getSendgrid } from "../../server_utils";
import { CF_APP_EMAIL } from "./config";

// TODO we can remove this route and just write some test cases
export default logHandlerErrors(
  async (req: NextApiRequest, res: NextApiResponse<{}>) => {
    assert400(
      process.env.NODE_ENV !== "production",
      "This endpoint is only for development"
    );

    await getSendgrid().send({
      to: { name: "Samuel Ainsworth", email: "skainsworth@gmail.com" },
      from: {
        name: `Poopyface via Cuddlefish Comments`,
        email: CF_APP_EMAIL,
      },
      subject: `💬 this is the subject`,
      text: "and easy to do anywhere, even with Node.js",
      html: "<strong>and easy to do anywhere, even with Node.js</strong>",
    });

    res.status(200).json({});
  }
);
