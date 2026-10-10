import { isTrustedRendererUrl } from './trusted-renderer';

export interface IpcSenderTrustInput {
  expectedSender: object | null;
  sender: object;
  senderFrame: object | null;
  mainFrame: object;
  senderUrl: string;
  devRendererUrl?: string;
  expectedRendererPath: string;
}

/** Require the one trusted chrome WebContents, its main frame, and the exact renderer URL. */
export function isTrustedIpcSender(input: IpcSenderTrustInput): boolean {
  if (!input.expectedSender || input.sender !== input.expectedSender) return false;
  if (input.senderFrame !== input.mainFrame) return false;
  return isTrustedRendererUrl(input.senderUrl, input.devRendererUrl, input.expectedRendererPath);
}
