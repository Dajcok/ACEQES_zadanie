import { User } from "../entities/user.entity";
import { Activity, ActivityStatus } from "../entities/activity.entity";
import { ForbiddenError, NotFoundError } from "../errors/api.errors";

export interface ActivityPayload {
  activity: string;
  username?: string;
  user: User;
}

export class ActivityService {
  private getCurrentOrFetchUser(payload: ActivityPayload): User {
    //Ak sme špecifikovali username, tak ho použijeme na vyhľadanie usera
    //V opačnom prípade managujeme aktivitu pre prihláseného usera
    if (payload.username) {
      //! používame, pretože vieme, že user existuje - inak by sme dostali error,
      //pretože throwException je defaultne true pre metódu find
      return User.manager.find({
        username: payload.username,
      })!;
    }

    return payload.user;
  }

  start(payload: ActivityPayload): Promise<Activity> {
    const user = this.getCurrentOrFetchUser(payload);

    //Ak už user má bežiacu aktivitu, nemôže spustiť ďalšiu
    if (Activity.manager.find({ userId: user.id, status: "running" }, false)) {
      throw new ForbiddenError("User already has an activity running");
    }

    return user.startActivity(payload.activity);
  }

  stop(payload: ActivityPayload): Activity {
    const user = this.getCurrentOrFetchUser(payload);

    return user.stopActivity(payload.activity);
  }

  elapsed(payload: ActivityPayload): {
    elapsedTimeRaw: number;
    elapsedTime: string;
    status: ActivityStatus;
  } {
    const user = this.getCurrentOrFetchUser(payload);

    const activity = Activity.manager.find({
      activity: payload.activity,
      userId: user.id,
    })!;

    return {
      elapsedTimeRaw: activity.time,
      elapsedTime: activity.formattedTime,
      status: activity.status,
    };
  }

  results(sort: "username" | "activity" | "time"): Activity[] {
    const activities = Activity.manager.getAll(sort as keyof Activity);

    if (activities.length === 0) {
      throw new NotFoundError("No activities found");
    }

    return activities;
  }
}

export default new ActivityService();
