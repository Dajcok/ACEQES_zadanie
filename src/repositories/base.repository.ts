import { NotFoundError, UniqueConstraintError } from "../errors/api.errors";
import { BaseEntity, IBaseEntityPublic } from "../entities/base.entity";

export class BaseRepository<
  Model extends BaseEntity,
  ModelPayload extends Omit<
    IBaseEntityPublic,
    "createdAt" | "updatedAt" | "id"
  > = Omit<IBaseEntityPublic, "createdAt" | "updatedAt" | "id">,
> {
  //V reálnom svete by bolo toto pole zosynchronizované s databázou
  protected _data: Model[] = [];

  get(id: string, throwException = true): Model | undefined {
    const obj = this._data.find((model: Model) => model.id === id);

    if (!obj && throwException)
      throw new NotFoundError(
        `Object of ${this.constructor.name} with id ${id} not found !`,
      );

    return obj;
  }

  getAll(sortBy?: keyof Model): Model[] {
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

  find(filter: Partial<Model>, throwException = true): Model | undefined {
    const data = this.filter(filter);

    if (data.length === 0 && throwException) {
      throw new NotFoundError(
        `Object of ${this.constructor.name} with filter ${JSON.stringify(filter)} not found !`,
      );
    }

    return data[0];
  }

  filter(filter: Partial<Model>): Model[] {
    return this._data.filter((model: Model) => {
      for (const key in filter) {
        if (model[key] !== filter[key]) return false;
      }

      return true;
    });
  }

  create(model: Model): Model {
    //Ak už máme model s daným id
    if (this.get(model.id, false))
      throw new UniqueConstraintError("id", model.id);

    this._data.push(model);

    return model;
  }

  update(id: string, payload: ModelPayload): Model {
    //V reálnom svete by táto metóda slúžila na update záznamu v databáze
    //V tomto prípade len aktualizujem updatedAt, keďže data mutujeme priamo cez model
    const model = this.get(id);
    if (!model)
      throw new NotFoundError(
        `Object of ${this.constructor.name} with id ${id} not found !`,
      );
    model.updatedAt = new Date();
    return model;
  }
}
