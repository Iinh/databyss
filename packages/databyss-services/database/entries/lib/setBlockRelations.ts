// import ObjectId from 'bson-objectid'
import { BlockRelationPayload } from '@databyss-org/editor/interfaces'
import { db, addTimeStamp } from '../../db'
import { DocumentType } from '../../../interfaces/Block'
import { asyncErrorHandler } from '../../util'

const setBlockRelations = async (payloadArray: BlockRelationPayload[]) => {
  for (const payload of payloadArray) {
    const { blocksRelationArray, clearPageRelationships } = payload

    // clear all block relationships associated to page id
    if (clearPageRelationships) {
      const _blockRelationsToClear = await db.find({
        selector: {
          $type: DocumentType.BlockRelation,
          page: clearPageRelationships,
        },
      })
      const _idsToDelete: any = []
      _blockRelationsToClear.docs.forEach((r) => {
        if (r?._id && r?._rev) {
          _idsToDelete.push({ _id: r._id, _rev: r._rev })
        }
      })

      await db.bulkDocs(
        _idsToDelete.map((i) => ({ _id: i._id, _rev: i._rev, _deleted: true }))
      )
    }
    if (blocksRelationArray?.length) {
      for (const relationship of blocksRelationArray) {
        const { block, relatedBlock, removeBlock } = relationship
        // get id of block
        // const _blockRelationResults = await db.find({
        //   selector: {
        //     block,
        //     relatedBlock,
        //   },
        // })
        // TODO: HOW DO WE GET THE BLOCK ID IN A MORE EFFICIENT WAY
        // will one block only ever have a relationship with another block?
        const _relationshipID = `${block}${relatedBlock}`
        // const _blockRelation = _blockRelationResults.docs[0]
        if (removeBlock) {
          // get blockID
          await db.upsert(_relationshipID, () => ({ _deleted: true }))
        } else {
          // update block relation
          await db.upsert(_relationshipID, (oldDoc) => ({
            ...addTimeStamp({
              ...oldDoc,
              ...relationship,
              $type: DocumentType.BlockRelation,
            }),
          }))
        }
      }
    }
  }
}

export default asyncErrorHandler(setBlockRelations)
