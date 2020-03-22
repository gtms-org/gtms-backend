import sgMail from "@sendgrid/mail";
import logger from "../lib/logger";

export interface IEmailNotification {
  to: string;
  from?: string;
  subject: string;
  text: string;
  html: string;
  traceId: string;
}

const { SENDGRID_API_KEY, ADDRESS_EMAIL = "noreplay@jadena.pl" } = process.env;

if (!SENDGRID_API_KEY) {
  logger.log({
    level: "error",
    message: "SENDGRID_API_KEY env var is not provided"
  });
  process.exit(1);
}

sgMail.setApiKey(SENDGRID_API_KEY);

export default function(msg: IEmailNotification) {
  const { to, from = ADDRESS_EMAIL, subject, text, html } = msg;

  sgMail.send({
    to,
    from,
    subject,
    text,
    html
  });
}
