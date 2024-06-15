import { User } from "../entities/user.entity";
import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { NotFoundError } from "../errors/api.errors";
import config from "../settings";

export type AuthenticatedRequest = Request & {
  user?: User;
};

export const authMiddleware = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) => {
  const token = req.cookies?.jwt_access_token;

  if (!token) {
    return res.status(401).send({ message: "Unauthorized" });
  }

  try {
    const { uid } = jwt.verify(token, config.SECRET_KEY) as {
      uid: string;
      username: string;
    };
    //Vieme, že user je vždy definovaný, inak by to vyhodilo chybu
    req.user = User.manager.get(uid)!;

    next();
  } catch (err) {
    console.error(`Error while verifying token: ${err}`);

    if (err instanceof jwt.TokenExpiredError) {
      return res.status(403).send({ message: "Token expired" });
    }

    if (err instanceof jwt.JsonWebTokenError) {
      return res.status(403).send({ message: "Invalid token" });
    }

    if (err instanceof NotFoundError) {
      return res.status(403).send({ message: "User not found" });
    }

    return res.status(401).send({ message: "Unauthorized" });
  }
};
