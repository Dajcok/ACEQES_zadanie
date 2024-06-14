import request from "supertest";
import app, { server } from "../src/server";
import config from "../src/settings";
import {
  authenticatedRequest,
  createTestUser,
  getTokenForTestUser,
} from "./test.utils";

const LOGIN_ROUTE = "/auth/login";
//Všetky routy pod /activity sú chránené, stačí otestovať jednu
const PROTECTED_ROUTE = "/activity/start";

process.env.NODE_ENV = "test";

describe("Authentication", () => {
  beforeAll(async () => {
    await createTestUser();
  });

  afterAll((done) => {
    server.close(() => {
      done();
    });
  });

  it("/login should throw a bad request", async () => {
    const response = await request(app).post(LOGIN_ROUTE).send({});

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty("message", "Invalid request payload");
  });

  it("/login should throw an unauthorized error", async () => {
    const response = await request(app)
      .post(LOGIN_ROUTE)
      .send({ username: config.TEST_USER_NAME, password: "WrongPWD1" });

    expect(response.status).toBe(401);
    expect(response.body).toHaveProperty(
      "message",
      "Combination of username and password is incorrect",
    );
  });

  it("/login should return a token", async () => {
    const response = await request(app).post(LOGIN_ROUTE).send({
      username: config.TEST_USER_NAME,
      password: config.TEST_USER_PASSWORD,
    });

    expect(response.status).toBe(200);
    expect(response.header["set-cookie"][0]).toContain(config.JWT_COOKIE_NAME);
  });

  it("Protected route should return an unauthorized error", async () => {
    const response = await request(app).post(PROTECTED_ROUTE).send({});

    expect(response.status).toBe(401);
    expect(response.body).toHaveProperty("message", "Unauthorized");
  });

  it("Protected route should return an invalid token error", async () => {
    const response = await request(app)
      .post(PROTECTED_ROUTE)
      .set("Cookie", `${config.JWT_COOKIE_NAME}=invalidtoken`)
      .send({});

    expect(response.status).toBe(403);
    expect(response.body).toHaveProperty("message", "Invalid token");
  });

  it("Protected route should return an token expired error", async () => {
    const token = await getTokenForTestUser(undefined, undefined, "1ms");

    await new Promise((r) => setTimeout(r, 10));

    const response = await authenticatedRequest(
      "post",
      PROTECTED_ROUTE,
      token,
      {},
    );

    expect(response.status).toBe(403);
    expect(response.body).toHaveProperty("message", "Token expired");
  });

  it("Protected route should succeed", async () => {
    const token = await getTokenForTestUser();

    const response = await authenticatedRequest(
      "post",
      PROTECTED_ROUTE,
      token,
      {
        activity: "coding",
      },
    );

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty("message", "Activity started");
  });
});
