import request from "supertest";
import app from "../src/server";
import config from "../src/settings";
import { User } from "../src/entities/user.entity";

export function createTestUser(
  username: string = config.TEST_USER_NAME,
  password: string = config.TEST_USER_PASSWORD,
): Promise<User> {
  return User.create(username, password);
}

export function authenticatedRequest(
  method: "post" | "get",
  ep: string,
  token: string,
  body?: any,
) {
  return request(app)
    [method](ep)
    .set("Cookie", `${config.JWT_COOKIE_NAME}=${token}`)
    .send(body);
}

export function getTokenForTestUser(
  username: string = config.TEST_USER_NAME,
  password: string = config.TEST_USER_PASSWORD,
  expireTime: string = "1h",
): Promise<string> {
  return request(app)
    .post("/auth/login?expireTime=" + expireTime)
    .send({ username, password })
    .then((response) => {
      return response.header["set-cookie"][0].split("=")[1].split(";")[0];
    });
}
