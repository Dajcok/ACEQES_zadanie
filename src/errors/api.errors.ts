export class ApiError extends Error {
  status: number = 500;
  message: string = "Internal server error";

  constructor(message: string) {
    super(message);
    this.name = "ApiError";
    this.message = message;
  }
}

export class UnauthorizedError extends ApiError {
  constructor(message: string = "Unauthorized") {
    super(message);
    this.name = "UnauthorizedError";
    this.status = 401;
  }
}

export class BadRequestError extends ApiError {
  constructor(message: string) {
    super(message);
    this.name = "BadRequestError";
    this.status = 400;
  }
}

export class NotFoundError extends ApiError {
  constructor(message: string) {
    super(message);
    this.name = "NotFoundError";
    this.status = 404;
  }
}

export class ForbiddenError extends ApiError {
  constructor(message: string) {
    super(message);
    this.name = "ForbiddenError";
    this.status = 403;
  }
}

export class UnknownServerError extends ApiError {
  constructor(message = "Internal server error") {
    super(message);
    this.name = "UnknownServerError";
    this.status = 500;
  }
}

export class UniqueConstraintError extends ApiError {
  constructor(fieldName: string, value: string) {
    super(
      "Unique constraint error on field " + fieldName + " with value " + value,
    );
    this.name = "UniqueConstraintError";
    this.status = 400;
  }
}
