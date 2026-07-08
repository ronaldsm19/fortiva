/** Error de dominio con código HTTP. El error middleware lo traduce a JSON uniforme. */
export class AppError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public code = 'APP_ERROR',
    public details?: unknown,
  ) {
    super(message);
    this.name = 'AppError';
  }

  static badRequest(msg: string, details?: unknown) {
    return new AppError(400, msg, 'BAD_REQUEST', details);
  }
  static unauthorized(msg = 'No autorizado') {
    return new AppError(401, msg, 'UNAUTHORIZED');
  }
  static forbidden(msg = 'Prohibido') {
    return new AppError(403, msg, 'FORBIDDEN');
  }
  static notFound(msg = 'No encontrado') {
    return new AppError(404, msg, 'NOT_FOUND');
  }
  static conflict(msg: string) {
    return new AppError(409, msg, 'CONFLICT');
  }
}
