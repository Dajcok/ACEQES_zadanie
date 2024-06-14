import express from "express";
import { User } from "./models/user.model";
import router from "./routes/router";
import cookieParser from "cookie-parser";
import config from "./settings";

const app = express();

app.use(express.json());
app.use(cookieParser());
app.use(router);

const server = app.listen(config.PORT, () => {
  console.log("Server is running on http://localhost:3000");
});

// Po inicializácii chceme vytvoriť aj prvého užívateľa
if (process.env.NODE_ENV !== "test") {
  User.create(config.TEST_USER_NAME, config.TEST_USER_PASSWORD).catch((err) => {
    console.error(err);
    process.exit(1);
  });
}

export default app;
export { server };
