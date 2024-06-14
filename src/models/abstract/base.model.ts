import { v4 as uuidv4 } from "uuid";
import { NotFoundError, UniqueConstraintError } from "../../errors/api.errors";
import { ImplementationNeededError } from "../../errors/general.errors";

export class ModelManager<
  Model extends BaseModel,
  ModelPayload extends Omit<
    IBaseModelPublic,
    "createdAt" | "updatedAt" | "id"
  > = Omit<IBaseModelPublic, "createdAt" | "updatedAt" | "id">,
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

export interface IBaseModelPublic {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

type Constructor<T> = new (...args: any[]) => T;

export class BaseModel {
  public createdAt: Date;
  public updatedAt: Date;

  //Nechávame možnosť explicitne definovať id pri niektorých modeloch - napr Activity
  constructor(public readonly id = uuidv4()) {
    //Pre jednoduchosť riešim vytváranie objektov v konštruktore modelu
    //V reálnom svete by takáto akcia bola asynchrónna a vykonávala by sa v samostatnej metóde
    this.createdAt = new Date();
    this.updatedAt = new Date();
  }

  protected get manager(): ModelManager<BaseModel> {
    return BaseModel.manager;
  }

  static get manager(): ModelManager<BaseModel> {
    throw new ImplementationNeededError(
      `Manager for ${this.name} not implemented !`,
    );
  }

  //Všeobecná metóda na vytvorenie modelu, kt. dedí od BaseModel
  //Argumenty sú vždy zhodné s konštruktorom modelu
  static async create<T extends BaseModel>(
    this: Constructor<T>,
    ...args: any[]
  ): Promise<T> {
    const model = new this(...args);
    model.manager.create(model);
    return model;
  }

  toRepresentation(): IBaseModelPublic {
    return {
      id: this.id,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }

  save() {
    const { id, createdAt, updatedAt, ...payload } = this.toRepresentation();
    return this.manager.update(this.id, payload as any);
  }
}
