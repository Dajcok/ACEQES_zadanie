import { v4 as uuidv4 } from "uuid";
import { ImplementationNeededError } from "../errors/general.errors";
import { BaseRepository } from "../repositories/base.repository";

export interface IBaseEntityPublic {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

type Constructor<T> = new (...args: any[]) => T;

export class BaseEntity {
  public createdAt: Date;
  public updatedAt: Date;

  constructor(public readonly id = uuidv4()) {
    //Pre jednoduchosť riešim vytváranie objektov v konštruktore modelu
    //V reálnom svete by takáto akcia bola asynchrónna a vykonávala by sa v samostatnej metóde
    this.createdAt = new Date();
    this.updatedAt = new Date();
  }

  protected get manager(): BaseRepository<BaseEntity> {
    return BaseEntity.manager;
  }

  static get manager(): BaseRepository<BaseEntity> {
    throw new ImplementationNeededError(
      `Manager for ${this.name} not implemented !`,
    );
  }

  //Všeobecná metóda na vytvorenie modelu, kt. dedí od BaseModel
  //Argumenty sú vždy zhodné s konštruktorom modelu
  static async create<T extends BaseEntity>(
    this: Constructor<T>,
    ...args: any[]
  ): Promise<T> {
    const model = new this(...args);
    model.manager.create(model);
    return model;
  }

  toRepresentation(): IBaseEntityPublic {
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
