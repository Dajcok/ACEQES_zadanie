export class MissingConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "MissingConfigError";
  }
}

export class ImplementationNeededError extends Error {
  constructor(message: string = "Implementation needed") {
    super(message);
    this.name = "ImplementationNeededError";
  }
}
