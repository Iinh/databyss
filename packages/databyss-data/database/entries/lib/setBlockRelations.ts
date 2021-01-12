import { BlockRelationPayload } from '@databyss-org/editor/interfaces'
import { DocumentType } from '../../interfaces'
import { db } from '../../db'
import { upsert, findAll } from '../../utils'

const setBlockRelations = async (payloadArray: BlockRelationPayload[]) => {
  for (const payload of payloadArray) {
    const { blocksRelationArray, clearPageRelationships } = payload

    // clear all block relationships associated to page id
    if (clearPageRelationships) {
      const _blockRelationsToClear = await findAll({
        $type: DocumentType.BlockRelation,
        page: clearPageRelationships,
      })

      const _idsToDelete: any = []
      _blockRelationsToClear.forEach((r) => {
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
        // TODO: HOW DO WE GET THE BLOCK ID IN A MORE EFFICIENT WAY
        // will one block only ever have a relationship with another block?
        const _relationshipID = `${block}${relatedBlock}`

        if (removeBlock) {
          // get blockID
          await upsert({
            $type: DocumentType.BlockRelation,
            _id: _relationshipID,
            doc: { _deleted: true },
          })
        } else {
          // update block relation
          await upsert({
            $type: DocumentType.BlockRelation,
            _id: _relationshipID,
            doc: relationship,
          })
        }
      }
    }
  }
}

export default setBlockRelations
