export class SwarmVerificationError extends Error {
  code: string;
  context?: Record<string, unknown>;

  constructor(
    code: string,
    message: string,
    context?: Record<string, unknown>,
    options?: ErrorOptions,
  ) {
    super(message, options);
    this.name = "SwarmVerificationError";
    this.code = code;
    this.context = context;
  }
}
