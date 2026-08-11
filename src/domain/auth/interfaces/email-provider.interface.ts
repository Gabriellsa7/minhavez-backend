export interface IEmailPayload {
  to: string;
  subject: string;
  html: string;
  text: string;
}

export interface IEmailProvider {
  sendMail(payload: IEmailPayload): Promise<void>;
}
