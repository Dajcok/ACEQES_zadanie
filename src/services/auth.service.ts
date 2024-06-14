import { User } from "../models/user.model";
import { ForbiddenError, UnauthorizedError } from "../errors/api.errors";
import { NotFoundError } from "../errors/api.errors";
import jwt from "jsonwebtoken";
import config from "../settings";

export class AuthService {
  async login(
    username: string,
    password: string,
    expireTime?: string,
  ): Promise<string> {
    if (expireTime && process.env.NODE_ENV !== "test") {
      throw new ForbiddenError(
        "Expire time can be set only in test environment",
      );
    }

    try {
      const user = await User.manager.findByCredentials(username, password);

      return jwt.sign({ username, uid: user.id }, config.SECRET_KEY, {
        expiresIn: expireTime || config.JWT_TOKEN_EXPIRY,
      });
    } catch (e) {
      if (e instanceof NotFoundError) {
        throw new UnauthorizedError(
          "Combination of username and password is incorrect",
        );
      }

      throw e;
    }
  }
}

export default new AuthService();
