import * as _sendgrid from "@sendgrid/mail";
import { notNull } from "./common_utils";

// Never error in the module scope. See https://github.com/vercel/next.js/issues/31046.
export function getSendgrid() {
  _sendgrid.setApiKey(notNull(process.env.SENDGRID_API_KEY));
  return _sendgrid;
}