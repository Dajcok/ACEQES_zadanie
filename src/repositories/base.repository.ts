import { NotFoundError, UniqueConstraintError } from "../errors/api.errors";
import { BaseEntity, IBaseEntityPublic } from "../entities/base.entity";

export class BaseRepository<
  Entity extends BaseEntity,
  EntityPayload extends Omit<
    IBaseEntityPublic,
    "createdAt" | "updatedAt" | "id"
  > = Omit<IBaseEntityPublic, "createdAt" | "updatedAt" | "id">,
> {
  //V reálnom svete by bolo toto pole zosynchronizované s databázou
  protected _data: Entity[] = [];

  get(id: string, throwException = true): Entity | undefined {
    const obj = this._data.find((entity: Entity) => entity.id === id);

    if (!obj && throwException)
      throw new NotFoundError(
        `Object of ${this.constructor.name} with id ${id} not found !`,
      );

    return obj;
  }

  getAll(sortBy?: keyof Entity): Entity[] {
    if (!sortBy)
      return this._data.sort(
        (a, b) => a.createdAt.getTime() - b.createdAt.getTime(),
      );

    return this._data.sort((a, b) => {
      if (a[sortBy] > b[sortBy]) return 1;
      if (a[sortBy] < b[sortBy]) return -1;
      return 0;
    });
  }

  find(filter: Partial<Entity>, throwException = true): Entity | undefined {
    const data = this.filter(filter);

    if (data.length === 0 && throwException) {
      throw new NotFoundError(
        `Object of ${this.constructor.name} with filter ${JSON.stringify(filter)} not found !`,
      );
    }

    return data[0];
  }

  filter(filter: Partial<Entity>): Entity[] {
    return this._data.filter((entity: Entity) => {
      for (const key in filter) {
        if (entity[key] !== filter[key]) return false;
      }

      return true;
    });
  }

  create(payload: Entity): Entity {
    //Ak už máme payload s daným id
    if (this.get(payload.id, false))
      throw new UniqueConstraintError("id", payload.id);

    this._data.push(payload);

    return payload;
  }

  update(id: string, payload: EntityPayload): Entity {
    //V reálnom svete by táto metóda slúžila na update záznamu v databáze
    //V tomto prípade len aktualizujem updatedAt, keďže data mutujeme priamo cez inštanciu entity a nemáme externú databázu
    const entity = this.get(id);
    if (!entity)
      throw new NotFoundError(
        `Object of ${this.constructor.name} with id ${id} not found !`,
      );
    entity.updatedAt = new Date();
    return entity;
  }
}
