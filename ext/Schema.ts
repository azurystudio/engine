/// <reference types='../window.d.ts' />
/// <reference types='./realm.d.ts' />

export class Schema<T extends Record<string, unknown>> {
  public aggregate: (
    pipeline: globalThis.Realm.Services.MongoDB.AggregatePipelineStage[],
  ) => Promise<unknown>

  public count: (
    filter?: globalThis.Realm.Services.MongoDB.Filter,
    options?: globalThis.Realm.Services.MongoDB.CountOptions,
  ) => Promise<number>

  public deleteMany: (
    filter: globalThis.Realm.Services.MongoDB.Filter,
  ) => Promise<globalThis.Realm.Services.MongoDB.DeleteResult>

  public deleteOne: (
    filter: globalThis.Realm.Services.MongoDB.Filter,
  ) => Promise<globalThis.Realm.Services.MongoDB.DeleteResult>

  public find: (
    filter?: globalThis.Realm.Services.MongoDB.Filter,
    options?: globalThis.Realm.Services.MongoDB.FindOptions,
  ) => Promise<
    (T & globalThis.Realm.Services.MongoDB.Document<Darkflare.ObjectId>)[]
  >

  public findOne: (
    filter?: globalThis.Realm.Services.MongoDB.Filter,
    options?: globalThis.Realm.Services.MongoDB.FindOneOptions,
  ) => Promise<
    (T & globalThis.Realm.Services.MongoDB.Document<Darkflare.ObjectId>) | null
  >

  public findOneAndDelete: (
    filter: globalThis.Realm.Services.MongoDB.Filter,
    options?: globalThis.Realm.Services.MongoDB.FindOneOptions,
  ) => Promise<
    (T & globalThis.Realm.Services.MongoDB.Document<Darkflare.ObjectId>) | null
  >

  public findOneAndReplace: (
    filter: globalThis.Realm.Services.MongoDB.Filter,
    replacement: globalThis.Realm.Services.MongoDB.NewDocument<
      T & globalThis.Realm.Services.MongoDB.Document<Darkflare.ObjectId>
    >,
    options?: globalThis.Realm.Services.MongoDB.FindOneAndModifyOptions,
  ) => Promise<
    (T & globalThis.Realm.Services.MongoDB.Document<Darkflare.ObjectId>) | null
  >

  public findOneAndUpdate: (
    filter: globalThis.Realm.Services.MongoDB.Filter,
    update: globalThis.Realm.Services.MongoDB.Update,
    options?: globalThis.Realm.Services.MongoDB.FindOneAndModifyOptions,
  ) => Promise<
    (T & globalThis.Realm.Services.MongoDB.Document<Darkflare.ObjectId>) | null
  >

  public insertMany: (
    documents: globalThis.Realm.Services.MongoDB.NewDocument<
      T & globalThis.Realm.Services.MongoDB.Document<Darkflare.ObjectId>
    >[],
  ) => Promise<
    globalThis.Realm.Services.MongoDB.InsertManyResult<
      (T & globalThis.Realm.Services.MongoDB.Document<Darkflare.ObjectId>)[
        '_id'
      ]
    >
  >

  public insertOne: (
    document: globalThis.Realm.Services.MongoDB.NewDocument<
      T & globalThis.Realm.Services.MongoDB.Document<Darkflare.ObjectId>
    >,
  ) => Promise<
    globalThis.Realm.Services.MongoDB.InsertOneResult<
      (T & globalThis.Realm.Services.MongoDB.Document<Darkflare.ObjectId>)[
        '_id'
      ]
    >
  >

  public updateMany: (
    filter: globalThis.Realm.Services.MongoDB.Filter,
    update: globalThis.Realm.Services.MongoDB.Update,
    options?: globalThis.Realm.Services.MongoDB.UpdateOptions,
  ) => Promise<
    globalThis.Realm.Services.MongoDB.UpdateResult<
      (T & globalThis.Realm.Services.MongoDB.Document<Darkflare.ObjectId>)[
        '_id'
      ]
    >
  >

  public updateOne: (
    filter: globalThis.Realm.Services.MongoDB.Filter,
    update: globalThis.Realm.Services.MongoDB.Update,
    options?: globalThis.Realm.Services.MongoDB.UpdateOptions,
  ) => Promise<
    globalThis.Realm.Services.MongoDB.UpdateResult<
      (T & globalThis.Realm.Services.MongoDB.Document<Darkflare.ObjectId>)[
        '_id'
      ]
    >
  >

  public watch: (
    options?: unknown,
  ) => AsyncGenerator<
    globalThis.Realm.Services.MongoDB.ChangeEvent<
      T & globalThis.Realm.Services.MongoDB.Document<Darkflare.ObjectId>
    >,
    unknown,
    unknown
  >

  constructor(name: string) {
    if (!window.__d.database) {
      throw new Error('Please configure the realm module!')
    }

    const collection = window.__d.database.collection(name)

    this.aggregate = collection.aggregate
    this.count = collection.count
    this.deleteMany = collection.deleteMany
    this.deleteOne = collection.deleteOne
    this.find = collection.find
    this.findOne = collection.findOne
    this.findOneAndDelete = collection.findOneAndDelete
    this.findOneAndReplace = collection.findOneAndReplace
    this.findOneAndUpdate = collection.findOneAndUpdate
    this.insertMany = collection.insertMany
    this.insertOne = collection.insertOne
    this.updateMany = collection.updateMany
    this.updateOne = collection.updateOne
    this.watch = collection.watch
  }

  async findById(
    objectId: string | Darkflare.ObjectId,
  ) {
    if (typeof objectId === 'string') {
      objectId = new Darkflare.ObjectId(objectId)
    }

    return await this.findOneAndDelete({ _id: objectId })
  }

  async findByIdAndUpdate(
    objectId: string | Darkflare.ObjectId,
    update: globalThis.Realm.Services.MongoDB.Update,
  ) {
    if (typeof objectId === 'string') {
      objectId = new Darkflare.ObjectId(objectId)
    }

    return await this.findOneAndUpdate({ _id: objectId }, update)
  }

  async findByIdAndDelete(
    objectId: string | Darkflare.ObjectId,
  ) {
    if (typeof objectId === 'string') {
      objectId = new Darkflare.ObjectId(objectId)
    }

    return await this.findOneAndDelete({ _id: objectId })
  }
}
