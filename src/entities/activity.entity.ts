import { BaseEntity, IBaseEntityPublic } from "./base.entity";
import { ActivityRepository } from "../repositories/activity.repository";

export type ActivityStatus = "running" | "stopped";

export interface IActivityPublic extends IBaseEntityPublic {
  startedAt: Date;
  endedAt: Date | null;
  status: ActivityStatus;
  //Foreign key na používateľa, ktorý aktivitu vytvoril
  userId: string;
  username: string;
  time: number;
  formattedTime: string;
  activity: string;
}

export class Activity extends BaseEntity implements IActivityPublic {
  private static _manager: ActivityRepository;
  private _startedAt = new Date();
  private _endedAt: Date | null = null;
  private _status: ActivityStatus = "running";

  constructor(
    public readonly activity: string,
    public readonly userId: string,
    public readonly username: string,
  ) {
    super();
  }

  public static get manager(): ActivityRepository {
    if (!Activity._manager) {
      Activity._manager = new ActivityRepository();
    }
    return Activity._manager;
  }

  protected get manager(): ActivityRepository {
    return Activity.manager;
  }

  toRepresentation(): IActivityPublic {
    return {
      ...super.toRepresentation(),
      startedAt: this.startedAt,
      endedAt: this.endedAt,
      userId: this.userId,
      status: this.status,
      time: this.time,
      formattedTime: this.formattedTime,
      username: this.username,
      activity: this.activity,
    };
  }

  startActivity() {
    this._startedAt = new Date();
    this._status = "running";

    if (this.endedAt) {
      this._endedAt = null;
    }

    this.save();
  }

  endActivity() {
    this._endedAt = new Date();
    this._status = "stopped";

    this.save();
  }

  get time(): number {
    if (this.endedAt) {
      return this.endedAt.getTime() - this.startedAt.getTime();
    }

    return new Date().getTime() - this.startedAt.getTime();
  }

  get formattedTime(): string {
    return `${(this.time / 1000).toFixed(3)}s`;
  }

  get status(): ActivityStatus {
    return this._status;
  }

  get endedAt(): Date | null {
    return this._endedAt;
  }

  get startedAt(): Date {
    return this._startedAt;
  }
}
