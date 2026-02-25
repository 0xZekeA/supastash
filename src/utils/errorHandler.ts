export class SupastashError extends Error {
  code?: string;
  meta?: Record<string, any>;
  constructor(message: string, code?: string, meta?: Record<string, any>) {
    super(message);
    this.name = "SupastashError";
    this.code = code;
    this.meta = meta;
  }
}
