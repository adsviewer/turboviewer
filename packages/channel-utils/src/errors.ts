import { AError } from '@repo/utils';

export class MetaError extends AError {
  name = 'MetaError';
  code: number;
  errorSubCode: number;
  fbTraceId: string;

  constructor(message: string, code: number, errorSubcode: number, fbtraceId: string) {
    super(message);
    this.code = code;
    this.errorSubCode = errorSubcode;
    this.fbTraceId = fbtraceId;
  }
}
