import Joi from "joi";

export class Auth {
  static login = Joi.object({
    username: Joi.string().alphanum().min(3).max(30).required(),
    password: Joi.string()
      .pattern(new RegExp("^[a-zA-Z0-9]{3,30}$"))
      .required(),
  });
}

export class Activity {
  static start = Joi.object({
    activity: Joi.string().required(),
    username: Joi.string().allow(null),
  });

  static stop = Joi.object({
    activity: Joi.string().required(),
    username: Joi.string().allow(null),
  });
}
