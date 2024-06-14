import { Schema } from "joi";
import { NextFunction } from "express";
import { Request, Response } from "express";

export const payloadValidator = (schema: Schema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const { error } = schema.validate(req.body);

    if (error) {
      return res.status(400).json({
        message: "Invalid request payload",
        details: error.details,
      });
    }

    next();
  };
};
