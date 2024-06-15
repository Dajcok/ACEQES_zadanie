import { BaseEntity, IBaseEntityPublic } from "./base.entity";
import { Activity } from "./activity.entity";
import bcrypt from "bcrypt";
import config from "../settings";
import { UserRepository } from "../repositories/user.repository";

export interface IUserPublic extends IBaseEntityPublic {
  username: string;
  activities: Activity[];
}

export class User extends BaseEntity implements IUserPublic {
  private static _manager: UserRepository;
  private _activities: string[] = [];
  private _runningActivity: Activity | null = null;

  //Zakazujeme vytváranie inštancií z vonku pomocou new User
  //pretože chceme, aby sa všetky inštancie vytvárali cez User.create
  //čo zabezpečí, že heslá budú vždy hashované
  constructor(
    public username: string,
    private _password: string,
  ) {
    super();
  }

  static get manager(): UserRepository {
    if (!User._manager) {
      User._manager = new UserRepository();
    }
    return User._manager as UserRepository;
  }

  protected get manager(): UserRepository {
    return User.manager;
  }

  toRepresentation(): IUserPublic {
    return {
      ...super.toRepresentation(),
      username: this.username,
      activities: this.activities,
    };
  }

  static async create<User>(username: string, password: string): Promise<User> {
    //Hashujeme heslo pred uložením
    password = await bcrypt.hash(password, config.PASSWORD_SALT_ROUNDS);
    return (await super.create(username, password)) as User;
  }

  async checkPassword(password: string): Promise<boolean> {
    return await bcrypt.compare(password, this._password);
  }

  async startActivity(activityName: string): Promise<Activity> {
    let activity = Activity.manager.find(
      {
        activity: activityName,
        userId: this.id,
      },
      false,
    );

    //Ak sme nenašli aktivitu s požadovaným id, vytvoríme novú
    if (!activity) {
      activity = await Activity.create(activityName, this.id, this.username);
      this._activities.push(activity.id);
    } else {
      //V opačnom prípade spustíme existujúcu aktivitu znovu
      activity.startActivity();
    }

    this._runningActivity = activity;
    this.save();
    return activity;
  }

  stopActivity(activityName: string): Activity {
    const activity = Activity.manager.find({
      activity: activityName,
      userId: this.id,
    })!;

    //Ak už je aktivita zastavená, len ju vrátime
    if (activity.status === "stopped") {
      return activity;
    }

    activity.endActivity();
    this._runningActivity = null;
    this.save();
    return activity;
  }

  get activities(): Activity[] {
    return Activity.manager.filter({
      userId: this.id,
    });
  }
}
