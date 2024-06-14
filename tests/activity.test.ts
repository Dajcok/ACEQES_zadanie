import {
  authenticatedRequest,
  createTestUser,
  getTokenForTestUser,
} from "./test.utils";
import config from "../src/settings";
import { server } from "../src/server";

const ACTIVITY_BASE_ROUTE = "/activity";

process.env.NODE_ENV = "test";

const assertSortedResults = (response: any, sortKey: string) => {
  expect(response.status).toBe(200);
  expect(response.body).toHaveProperty("message", "Activities fetched");
  expect(response.body).toHaveProperty("data");
  expect(response.body.data).toBeInstanceOf(Array);

  for (let i = 1; i < response.body.data.length; i++) {
    const currentValue = response.body.data[i][sortKey];
    const previousValue = response.body.data[i - 1][sortKey];

    if (typeof currentValue === "string" && typeof previousValue === "string") {
      expect(currentValue.localeCompare(previousValue)).toBeGreaterThanOrEqual(
        0,
      );
    } else if (
      typeof currentValue === "number" &&
      typeof previousValue === "number"
    ) {
      expect(currentValue).toBeGreaterThanOrEqual(previousValue);
    } else {
      throw new Error(
        `Inconsistent data types for sorting: ${typeof previousValue} and ${typeof currentValue}`,
      );
    }
  }
};

const assertElapsedTime = (response: any) => {
  expect(response.status).toBe(200);
  expect(response.body).toHaveProperty("message", "Elapsed time fetched");
  expect(response.body).toHaveProperty("data");
  expect(response.body.data).toHaveProperty("elapsedTime");
  expect(response.body.data).toHaveProperty("elapsedTimeRaw");
  expect(/^\d+\.\d{3}s$/.test(response.body.data.elapsedTime)).toBe(true);
  expect(response.body.data).toHaveProperty("status");
};

describe("Activity Endpoints", () => {
  let token: string;
  let testUserId: string;

  beforeAll(async () => {
    testUserId = (await createTestUser()).id;
    token = await getTokenForTestUser();

    //Vytvoríme viac aktivít a userov
    const user2 = await createTestUser("user2", "StrongPWD2");
    await user2.startActivity("coding");
    await user2.stopActivity("coding");
    await user2.startActivity("running");
    await user2.stopActivity("running");
    const user3 = await createTestUser("user3", "StrongPWD3");
    await user3.startActivity("running");
    await user3.stopActivity("running");
    await user3.startActivity("chilling");
  });

  afterAll((done) => {
    server.close(() => {
      done();
    });
  });

  it("/start should throw invalid payload error", async () => {
    //Nepošleme payload a teda joi validácia zlyhá
    const response = await authenticatedRequest(
      "post",
      ACTIVITY_BASE_ROUTE + "/start",
      token,
      {},
    );

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty("message", "Invalid request payload");
  });

  it("/start should succeed for current user", async () => {
    //Keď nedefinujeme username, user sa getne z tokena
    const response = await authenticatedRequest(
      "post",
      ACTIVITY_BASE_ROUTE + "/start",
      token,
      {
        activity: "coding",
      },
    );

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty("message", "Activity started");
  });

  it("/start should throw user already has an activity running error", async () => {
    const response = await authenticatedRequest(
      "post",
      ACTIVITY_BASE_ROUTE + "/start",
      token,
      {
        activity: "coding1",
      },
    );

    expect(response.status).toBe(403);
    expect(response.body).toHaveProperty(
      "message",
      "User already has an activity running",
    );
  });

  it("/start should throw user not found error", async () => {
    const response = await authenticatedRequest(
      "post",
      ACTIVITY_BASE_ROUTE + "/start",
      token,
      {
        username: "nonexistent",
        activity: "coding",
      },
    );

    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty(
      "message",
      `Object of UserManager with filter {\"username\":\"nonexistent\"} not found !`,
    );
  });

  it("/start should create activity for another existing user", async () => {
    const response = await authenticatedRequest(
      "post",
      ACTIVITY_BASE_ROUTE + "/start",
      token,
      {
        username: "user2",
        activity: "coding",
      },
    );

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty("message", "Activity started");
  });

  it("/stop should throw invalid payload error", async () => {
    const response = await authenticatedRequest(
      "post",
      ACTIVITY_BASE_ROUTE + "/stop",
      token,
      {},
    );

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty("message", "Invalid request payload");
  });

  it("/stop should throw user has no activity with this id running error", async () => {
    const response = await authenticatedRequest(
      "post",
      ACTIVITY_BASE_ROUTE + "/stop",
      token,
      {
        activity: "coding1",
        username: config.TEST_USER_NAME,
      },
    );

    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty(
      "message",
      `Object of ActivityManager with filter {\"activity\":\"coding1\",\"userId\":\"${testUserId}\"} not found !`,
    );
  });

  it("/stop should succeed for current user", async () => {
    const response = await authenticatedRequest(
      "post",
      ACTIVITY_BASE_ROUTE + "/stop",
      token,
      {
        activity: "coding",
      },
    );

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("message", "Activity stopped");
  });

  it("/stop should succeed even after activity has already stopped", async () => {
    const response = await authenticatedRequest(
      "post",
      ACTIVITY_BASE_ROUTE + "/stop",
      token,
      {
        activity: "coding",
      },
    );

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("message", "Activity stopped");
  });

  it("/stop should throw user not found error", async () => {
    const response = await authenticatedRequest(
      "post",
      ACTIVITY_BASE_ROUTE + "/stop",
      token,
      {
        activity: "coding",
        username: "nonexistent",
      },
    );

    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty(
      "message",
      `Object of UserManager with filter {\"username\":\"nonexistent\"} not found !`,
    );
  });

  it("/stop should stop activity for another existing user", async () => {
    const response = await authenticatedRequest(
      "post",
      ACTIVITY_BASE_ROUTE + "/stop",
      token,
      {
        activity: "coding",
        username: "user2",
      },
    );

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("message", "Activity stopped");
  });

  it("/elapsed should throw activity not found error", async () => {
    const response = await authenticatedRequest(
      "get",
      ACTIVITY_BASE_ROUTE + "/elapsed/nonexistent",
      token,
    );

    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty(
      "message",
      `Object of ActivityManager with filter {\"activity\":\"nonexistent\",\"userId\":\"${testUserId}\"} not found !`,
    );
  });

  it("/elapsed should succeed for current user", async () => {
    const response = await authenticatedRequest(
      "get",
      ACTIVITY_BASE_ROUTE + "/elapsed/coding",
      token,
    );

    assertElapsedTime(response);
  });

  it("/elapsed should throw user not found error", async () => {
    const response = await authenticatedRequest(
      "get",
      ACTIVITY_BASE_ROUTE + "/elapsed/coding?username=nonexistent",
      token,
    );

    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty(
      "message",
      `Object of UserManager with filter {\"username\":\"nonexistent\"} not found !`,
    );
  });

  it("/elapsed should succeed for another existing user", async () => {
    const response = await authenticatedRequest(
      "get",
      ACTIVITY_BASE_ROUTE + "/elapsed/coding?username=user2",
      token,
    );

    assertElapsedTime(response);
  });

  it("/elapsed should succeed with running activity", async () => {
    const newTestUser = await createTestUser("user4", "StrongPWD4");
    await newTestUser.startActivity("running");

    await new Promise((r) => setTimeout(r, 1000));

    const response = await authenticatedRequest(
      "get",
      ACTIVITY_BASE_ROUTE + "/elapsed/running?username=user4",
      token,
    );

    assertElapsedTime(response);
    //okrem toho skontrolujeme, či čas je v rozmedzí 1s +- 100ms
    expect(response.body.data.elapsedTimeRaw).toBeGreaterThan(1000);
    expect(response.body.data.elapsedTimeRaw).toBeLessThan(1100);

    await new Promise((r) => setTimeout(r, 1000));

    newTestUser.stopActivity("running");

    await new Promise((r) => setTimeout(r, 1000));

    const response2 = await authenticatedRequest(
      "get",
      ACTIVITY_BASE_ROUTE + "/elapsed/running?username=user4",
      token,
    );

    assertElapsedTime(response2);
    //okrem toho skontrolujeme, či čas je v rozmedzí 2s +- 100ms
    expect(response2.body.data.elapsedTimeRaw).toBeGreaterThan(2000);
    expect(response2.body.data.elapsedTimeRaw).toBeLessThan(2100);
  });

  it("/results should throw invalid sort parameter error", async () => {
    const response = await authenticatedRequest(
      "get",
      ACTIVITY_BASE_ROUTE + "/results?sort=invalid",
      token,
    );

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty("message", "Invalid sort parameter");
  });

  it("/results should succeed and sort by username which is default", async () => {
    const response = await authenticatedRequest(
      "get",
      ACTIVITY_BASE_ROUTE + "/results",
      token,
    );

    assertSortedResults(response, "username");
  });

  it("/results should succeed and sort by activity", async () => {
    const response = await authenticatedRequest(
      "get",
      ACTIVITY_BASE_ROUTE + "/results?sort=activity",
      token,
    );

    assertSortedResults(response, "activity");
  });

  it("/results should succeed and sort by time", async () => {
    const response = await authenticatedRequest(
      "get",
      ACTIVITY_BASE_ROUTE + "/results?sort=time",
      token,
    );

    assertSortedResults(response, "time");
  });
});
