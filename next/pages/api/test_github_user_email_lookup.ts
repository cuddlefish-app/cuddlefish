import type { NextApiRequest, NextApiResponse } from "next";
import { getSendgrid, logHandlerErrors } from "../../utils";

export default logHandlerErrors(
  async (req: NextApiRequest, res: NextApiResponse<{}>) => {
    await getSendgrid().send({
      to: { name: "Samuel Ainsworth", email: "skainsworth@gmail.com" },
      from: {
        name: `Poopyface via Cuddlefish Comments`,
        email: "fish@cuddlefish.app",
      },
      subject: `💬 this is the subject`,
      text: "and easy to do anywhere, even with Node.js",
      html: "<strong>and easy to do anywhere, even with Node.js</strong>",
    });

    res.status(200).json({});
  }
);
