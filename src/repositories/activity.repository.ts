import { UniqueConstraintError } from "../errors/api.errors";
import { Activity } from "../entities/activity.entity";
import { BaseRepository } from "./base.repository";

export class ActivityRepository extends BaseRepository<Activity> {
  create(payload: Activity): Activity {
    if (
      this.find({ userId: payload.userId, activity: payload.activity }, false)
    ) {
      throw new UniqueConstraintError("activity", payload.activity);
    }

    return super.create(payload);
  }
}
