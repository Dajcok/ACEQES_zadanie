import _authService, { AuthService } from "../services/auth.service";
import { ApiError } from "../errors/api.errors";
import { Request, Response } from "express";
import config from "../settings";

export class AuthController {
  constructor(private authService: AuthService = _authService) {}

  async login(request: Request, response: Response) {
    const { username, password } = request.body;
    try {
      const token = await this.authService.login(
        username,
        password,
        request.query.expireTime as string,
      );

      return response
        .cookie(config.JWT_COOKIE_NAME, token, {
          httpOnly: config.JWT_COOKIE_HTTP_ONLY,
          secure: config.JWT_COOKIE_SECURE,
          sameSite: config.JWT_COOKIE_SAME_SITE,
          expires: new Date(
            Date.now() + config.JWT_COOKIE_EXPIRY_HOURS * 60 * 60 * 1000,
          ),
        })
        .send({ message: "Logged in successfully" });
    } catch (e) {
      console.error(`Error while logging in: ${e}`);

      if (e instanceof ApiError) {
        return response.status(e.status).send({ message: e.message });
      }

      return response.status(500).send({ message: "Internal server error" });
    }
  }
}
