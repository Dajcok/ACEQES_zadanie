import {
  BaseModel,
  IBaseModelPublic,
  ModelManager,
} from "./abstract/base.model";
import { Activity } from "./activity.model";
import bcrypt from "bcrypt";
import { NotFoundError, UniqueConstraintError } from "../errors/api.errors";
import config from "../settings";

export interface IUserPublic extends IBaseModelPublic {
  username: string;
  activities: Activity[];
}

export class UserManager extends ModelManager<User> {
  create(model: User): User {
    //Ak už existuje používateľ s rovnakým menom, vyhodíme chybu
    if (this.filter({ username: model.username }).length > 0) {
      throw new UniqueConstraintError("username", model.username);
    }

    return super.create(model);
  }

  //Rozširujeme ModelManagera o metódu, ktorá nám umožní vyhľadávať používateľov podľa mena a hesla
  //Cez filter by to možné nebolo, nakoľko je heslo private
  async findByCredentials(username: string, password: string): Promise<User> {
    for (const user of this._data) {
      if (user.username === username && (await user.checkPassword(password))) {
        return user;
      }
    }

    throw new NotFoundError("User not found");
  }
}

export class User extends BaseModel implements IUserPublic {
  private static _manager: ModelManager<User>;
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

  static get manager(): UserManager {
    if (!User._manager) {
      User._manager = new UserManager();
    }
    return User._manager as UserManager;
  }

  protected get manager(): UserManager {
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
