import PouchDB from 'pouchdb-browser'
// import PouchDB from 'pouchdb'
import PouchDBFind from 'pouchdb-find'
import PouchDBUpsert from 'pouchdb-upsert'
import PouchDbQuickSearch from 'pouchdb-quick-search'

// add plugins
PouchDB.plugin(PouchDbQuickSearch)

PouchDB.plugin(PouchDBFind)

PouchDB.plugin(PouchDBUpsert)

export const db: PouchDB.Database<any> = new PouchDB('local')

db.search({
  fields: ['text.textValue'],
  build: true,
})

// db.createIndex({
//   index: {
//     fields: [
//       '_id',
//       'blocks',
//       '$type',
//       'type',
//       'relatedBlock',
//       'page',
//       'block',
//       'relationshipType',
//     ],
//   },
// })

db.createIndex({
  index: {
    fields: ['_id'],
  },
})

db.createIndex({
  index: {
    fields: ['$type'],
  },
})

db.createIndex({
  index: {
    fields: ['$type', '_id'],
  },
})

db.createIndex({
  index: {
    fields: ['$type', 'relatedBlock'],
  },
})

db.createIndex({
  index: {
    fields: ['$type', 'page'],
  },
})

db.createIndex({
  index: {
    fields: ['$type', 'blocks'],
  },
})

db.createIndex({
  index: {
    fields: ['block', 'relatedBlock'],
  },
})

db.createIndex({
  index: {
    fields: ['$type', 'relatedBlock'],
  },
})

db.createIndex({
  index: {
    fields: ['$type', 'page'],
  },
})

db.createIndex({
  index: {
    fields: ['$type', 'type'],
  },
})

db.createIndex({
  index: {
    fields: ['$type', 'relatedBlock', 'relationshipType'],
  },
})

db.createIndex({
  index: {
    fields: ['$type', 'relatedBlock', 'block'],
  },
})

export const addTimeStamp = (oldDoc: any): any => {
  // if document has been created add a modifiedAt timestamp
  if (oldDoc.createdAt) {
    return { ...oldDoc, modifiedAt: Date.now() }
  }
  return { ...oldDoc, createdAt: Date.now() }
}
// db.changes({
//   since: 'now',
//   live: true,
//   include_docs: true,
// }).on('change', (change) => {
//   console.log('DATABASE.CHANGE', change)
// })
