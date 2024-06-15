import { NotFoundError, UniqueConstraintError } from "../errors/api.errors";
import { User } from "../entities/user.entity";
import { BaseRepository } from "./base.repository";

export class UserRepository extends BaseRepository<User> {
  create(entity: User): User {
    //Ak už existuje používateľ s rovnakým menom, vyhodíme chybu
    if (this.find({ username: entity.username }, false)) {
      throw new UniqueConstraintError("username", entity.username);
    }

    return super.create(entity);
  }

  //Rozširujeme BaseRepository o metódu, ktorá nám umožní vyhľadávať používateľov podľa mena a hesla
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
