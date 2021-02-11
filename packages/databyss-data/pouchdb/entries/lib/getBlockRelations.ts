import { BlockRelation } from '@databyss-org/editor/interfaces/index'
import { ResourceNotFoundError } from '@databyss-org/services/interfaces/Errors'
import { BlockRelationsServerResponse } from '@databyss-org/services/interfaces/Block'
import { DocumentType } from '../../interfaces'
import { findAll } from '../../utils'

const getBlockRelations = async (
  id: string
): Promise<BlockRelationsServerResponse | ResourceNotFoundError> => {
  console.log('ID', id)

  const _docs: BlockRelation[] = await findAll({
    $type: DocumentType.BlockRelation,
    query: {
      relatedBlock: id,
    },
    useIndex: 'block-relations',
  })
  if (!_docs.length) {
    return new ResourceNotFoundError('No block relations found')
  }

  _docs.sort((a, b) => (a.blockIndex > b.blockIndex ? 1 : -1))

  let _response = {
    count: _docs.length,
    results: {},
  }

  _response = _docs.reduce((acc, curr) => {
    if (!acc.results[curr.page]) {
      // init result
      acc.results[curr.page] = [curr]
    } else {
      const _entries = acc.results[curr.page]
      _entries.push(curr)
      // sort the entries by page index value
      _entries.sort((a, b) => (a.blockIndex > b.blockIndex ? 1 : -1))

      acc.results[curr.page] = _entries
    }
    return acc
  }, _response)

  return _response
}

export default getBlockRelations
