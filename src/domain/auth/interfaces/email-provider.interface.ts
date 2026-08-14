export interface IEmailAttachment {
  filename: string;
  content: Buffer;
  contentType?: string;
}

export interface IEmailPayload {
  to: string;
  subject: string;
  html: string;
  text: string;
  attachments?: IEmailAttachment[];
}

export interface IEmailProvider {
  sendMail(payload: IEmailPayload): Promise<void>;
}
