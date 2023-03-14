/// <reference types='../window.d.ts' />
/// <reference types='./realm.d.ts' />

import { ObjectId } from './ObjectId.ts'

type Data<Document> = Partial<Document> & {
  [key: string]: unknown
}

type Document<T> = {
  _id: ObjectId
  created_at: string
  updated_at: string
} & T

export class Schema<T> {
  private collection

  public count: (
    filter?: Data<Document<T>>,
    options?: Realm.Services.MongoDB.CountOptions,
  ) => Promise<number>

  public deleteMany: (
    filter: Data<Document<T>>,
  ) => Promise<Realm.Services.MongoDB.DeleteResult>

  public deleteOne: (
    filter: Data<Document<T>>,
  ) => Promise<Realm.Services.MongoDB.DeleteResult>

  public find: (
    filter?: Data<Document<T>>,
    options?: Realm.Services.MongoDB.FindOptions,
  ) => Promise<Document<T>[]>

  public findOne: (
    filter?: Data<Document<T>>,
    options?: Realm.Services.MongoDB.FindOneOptions,
  ) => Promise<Document<T> | null>

  public findOneAndDelete: (
    filter: Data<Document<T>>,
    options?: Realm.Services.MongoDB.FindOneOptions | undefined,
  ) => Promise<Document<T> | null>

  constructor(name: string) {
    if (!window.__d.database) {
      throw new Error('Please configure the realm module!')
    }

    this.collection = window.__d.database.collection<Document<T>>(
      name,
    )

    this.count = this.collection.count
    this.deleteMany = this.collection.deleteMany
    this.deleteOne = this.collection.deleteOne
    this.find = this.collection.find
    this.findOne = this.collection.findOne
    this.findOneAndDelete = this.collection.findOneAndDelete
  }

  async insertOne(
    document: Omit<Document<T>, '_id' | 'created_at' | 'updated_at'>,
  ): Promise<Realm.Services.MongoDB.InsertOneResult<ObjectId>> {
    const date = new Date().toISOString()

    // @ts-ignore:
    document.created_at = date
    // @ts-ignore:
    document.updated_at = date
    // @ts-ignore:
    return await this.collection.insertOne(document)
  }

  async updateOne(
    filter: Data<Document<T>>,
    update: Data<Document<T>>,
    options?: Realm.Services.MongoDB.FindOneAndModifyOptions,
  ): Promise<Realm.Services.MongoDB.UpdateResult<ObjectId>> {
    // @ts-ignore:
    update.updated_at = new Date().toISOString()

    return await this.collection.updateOne(filter, update, options)
  }

  async updateMany(
    filter: Data<Document<T>>,
    update: Data<Document<T>>,
    options?: Realm.Services.MongoDB.UpdateOptions,
  ): Promise<Realm.Services.MongoDB.UpdateResult<ObjectId>> {
    // @ts-ignore:
    update.updated_at = new Date().toISOString()

    return await this.collection.updateMany(filter, update, options)
  }

  async findOneAndUpdate(
    filter: Data<Document<T>>,
    update: Data<Document<T>>,
    options?: Realm.Services.MongoDB.FindOneAndModifyOptions,
  ): Promise<Document<T> | null> {
    // @ts-ignore:
    update.updated_at = new Date().toISOString()

    return await this.collection.findOneAndUpdate(filter, update, options)
  }
}
