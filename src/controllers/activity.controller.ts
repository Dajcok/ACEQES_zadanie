import { AuthenticatedRequest } from "../middlewares/auth.middleware";
import _activityService, {
  ActivityService,
} from "../services/activity.service";
import { Response } from "express";
import { ApiError, UnknownServerError } from "../errors/api.errors";
import { User } from "../entities/user.entity";

export class ActivityController {
  constructor(private activityService: ActivityService = _activityService) {}

  private checkRequestUser(request: AuthenticatedRequest) {
    //Toto by nikdy nemalo nastať, ale pre istotu kontrolujeme, či je request.user definovaný
    if (!request.user) {
      console.error("request.user is undefined even after auth middleware");
      throw new UnknownServerError();
    }
  }

  async start(request: AuthenticatedRequest, response: Response) {
    this.checkRequestUser(request);
    //Vďaka joi a validation middleware vieme, že activity a username sú vždy definované
    const { activity, username } = request.body;

    try {
      const activityData = await this.activityService.start({
        activity,
        user: request.user as User,
        username,
      });

      return response.status(201).send({
        message: "Activity started",
        data: activityData.toRepresentation(),
      });
    } catch (e) {
      console.error(`Error while starting activity: ${e}`);

      if (e instanceof ApiError) {
        return response.status(e.status).send({ message: e.message });
      }

      return response.status(500).send({ message: "Internal server error" });
    }
  }

  stop(request: AuthenticatedRequest, response: Response) {
    this.checkRequestUser(request);
    const { activity, username } = request.body;

    try {
      const activityData = this.activityService.stop({
        activity,
        user: request.user as User,
        username,
      });

      return response.send({
        message: "Activity stopped",
        data: activityData.toRepresentation(),
      });
    } catch (e) {
      console.error(`Error while stopping activity: ${e}`);

      if (e instanceof ApiError) {
        return response.status(e.status).send({ message: e.message });
      }

      return response.status(500).send({ message: "Internal server error" });
    }
  }

  elapsed(request: AuthenticatedRequest, response: Response) {
    this.checkRequestUser(request);

    try {
      const elapsed = this.activityService.elapsed({
        user: request.user as User,
        username: request.query.username as string | undefined,
        activity: request.params.activityName,
      });

      return response.send({
        message: "Elapsed time fetched",
        data: elapsed,
      });
    } catch (e) {
      console.error(`Error while fetching elapsed time: ${e}`);

      if (e instanceof ApiError) {
        return response.status(e.status).send({ message: e.message });
      }

      return response.status(500).send({ message: "Internal server error" });
    }
  }

  results(request: AuthenticatedRequest, response: Response) {
    this.checkRequestUser(request);

    if (!request.query.sort) {
      request.query.sort = "username";
    }

    if (
      !["username", "activity", "time"].includes(request.query.sort as string)
    ) {
      return response.status(400).send({ message: "Invalid sort parameter" });
    }

    try {
      const activities = this.activityService.results(
        request.query.sort as "username" | "activity" | "time",
      );

      return response.send({
        message: "Activities fetched",
        data: activities.map((activity) => activity.toRepresentation()),
      });
    } catch (e) {
      console.error(`Error while fetching activities: ${e}`);

      if (e instanceof ApiError) {
        return response.status(e.status).send({ message: e.message });
      }

      return response.status(500).send({ message: "Internal server error" });
    }
  }
}
