import ObjectId from 'bson-objectid'
import cloneDeep from 'clone-deep'
import invariant from 'invariant'

import {
  SET_ACTIVE_BLOCK_ID,
  SET_ACTIVE_BLOCK_CONTENT,
  SET_ACTIVE_BLOCK_TYPE,
  INSERT_NEW_ACTIVE_BLOCK,
  SET_BLOCK_TYPE,
  BACKSPACE,
} from './constants'

export const initialState = {
  activeBlockId: null,
  page: {},
  blocks: {},
  editableState: null,
}

const cleanUpState = state => {
  const _state = cloneDeep(state)
  const pageBlocks = _state.page.blocks
  const { blocks, entries, sources } = _state
  const _sources = {}
  const _blocks = {}
  const _entries = {}
  pageBlocks.forEach(b => {
    const { type, refId } = blocks[b._id]
    if (type === 'SOURCE') {
      _sources[refId] = sources[refId]
    }
    if (type === 'ENTRY') {
      _entries[refId] = entries[refId]
    }
    _blocks[b._id] = blocks[b._id]
  })
  _state.blocks = _blocks
  _state.entries = _entries
  _state.sources = _sources
  return _state
}

export const getRawHtmlForBlock = (state, block) => {
  switch (block.type) {
    case 'ENTRY':
      return state.entries[block.refId].rawHtml
    case 'SOURCE':
      return state.sources[block.refId].rawHtml
    default:
      throw new Error('Invalid block type', block.type)
  }
}

export const setRawHtmlForBlock = (state, block, html) => {
  const nextState = cloneDeep(state)
  switch (block.type) {
    case 'ENTRY':
      nextState.entries[block.refId].rawHtml = html
      break
    case 'SOURCE':
      nextState.sources[block.refId].rawHtml = html
      break
    default:
      throw new Error('Invalid block type', block.type)
  }
  return nextState
}

const setBlockType = (state, type, _id) => {
  // changing block type will always generate a new refId
  const nextRefId = ObjectId().toHexString()
  const block = state.blocks[_id]
  const rawHtml = block ? getRawHtmlForBlock(state, block) : ''
  const nextState = cloneDeep(state)
  nextState.blocks[_id] = {
    ...nextState.blocks[_id],
    _id,
    type,
    refId: nextRefId,
  }
  switch (type) {
    case 'SOURCE':
      nextState.sources[nextRefId] = { _id: nextRefId, rawHtml }
      return nextState
    case 'ENTRY':
      nextState.entries[nextRefId] = { _id: nextRefId, rawHtml }
      return nextState

    default:
      throw new Error('Invalid target block type', type)
  }
}

const setActiveBlockType = (state, type) =>
  setBlockType(state, type, state.activeBlockId)

const insertNewActiveBlock = (
  state,
  { insertedBlockId, insertedBlockText, previousBlockId, previousBlockText }
) => {
  invariant(
    insertedBlockId === state.activeBlockId,
    'insertedBlockId must match activeBlockId. It is possible that you called insertNewActiveBlock before activeBlockId was updated'
  )

  let insertedBlockType = 'ENTRY'
  let _state = cloneDeep(state)

  // get index value where previous block was
  // insert current ID after previous index value
  const _index = _state.page.blocks.findIndex(b => b._id === previousBlockId)
  _state.page.blocks.splice(_index + 1, 0, { _id: insertedBlockId })

  // if previous block was type SOURCE and is now empty
  // set previous block to ENTRY and active block as SOURCE

  if (state.blocks[previousBlockId].type === 'SOURCE' && !previousBlockText) {
    _state = setBlockType(_state, 'ENTRY', previousBlockId)
    insertedBlockType = 'SOURCE'
  }

  _state = setBlockType(_state, insertedBlockType, insertedBlockId)
  _state = setRawHtmlForBlock(
    _state,
    _state.blocks[insertedBlockId],
    insertedBlockText
  )
  _state = setRawHtmlForBlock(
    _state,
    _state.blocks[previousBlockId],
    previousBlockText
  )
  return cleanUpState(_state)
}

const backspace = (state, payload) => {
  const { activeBlockId, nextBlockId } = payload.blockProperties
  const _state = state
  const _blocks = _state.page.blocks
  const activeBlockIndex = _blocks.findIndex(b => b._id === activeBlockId)
  if (!nextBlockId) {
    // current block should be the last block
    if (_blocks.length === activeBlockIndex + 1) {
      return cleanUpState(_state)
    }
    _blocks.splice(activeBlockIndex + 1, 1)
  }
  const nextBlockIndex = _blocks.findIndex(b => b._id === nextBlockId)
  // next block index should correspond to page index
  if (activeBlockIndex + 1 === nextBlockIndex) {
    return cleanUpState(_state)
  }
  _blocks.splice(activeBlockIndex + 1, 1)
  return cleanUpState(_state)
}

const getMarkupValues = (nextState, ranges) => {
  const block = nextState.blocks[nextState.activeBlockId]
  const _state = cloneDeep(nextState)
  switch (block.type) {
    case 'ENTRY':
      _state.entries[block.refId] = {
        ..._state.entries[block.refId],
        ranges,
      }
      break
    case 'SOURCE':
      _state.entries[block.refId] = {
        ..._state.sources[block.refId],
        ranges,
      }
      break
    case 'TOPIC':
      _state.entries[block.refId] = {
        ..._state.topics[block.refId],
        ranges,
      }
      break
    default:
      break
  }

  return _state
}

export default (state, action) => {
  switch (action.type) {
    case SET_ACTIVE_BLOCK_TYPE:
      return setActiveBlockType(state, action.payload.type)
    case SET_ACTIVE_BLOCK_ID:
      return {
        ...state,
        activeBlockId: action.payload.id,
      }
    case SET_ACTIVE_BLOCK_CONTENT: {
      const activeBlock = state.blocks[state.activeBlockId]
      let nextState = setRawHtmlForBlock(
        state,
        activeBlock,
        action.payload.html
      )
      if (action.payload.ranges) {
        nextState = getMarkupValues(nextState, action.payload.ranges)
      }
      if (!action.payload.html.length) {
        return setActiveBlockType(nextState, 'ENTRY')
      }
      return nextState
    }
    case INSERT_NEW_ACTIVE_BLOCK:
      return insertNewActiveBlock(state, action.payload.blockProperties)
    case BACKSPACE:
      return backspace(state, action.payload)
    case SET_BLOCK_TYPE:
      let nextState = cloneDeep(state)
      const _html = getRawHtmlForBlock(
        nextState,
        nextState.blocks[action.payload.id]
      )
      if (_html.startsWith('@')) {
        nextState = setRawHtmlForBlock(
          nextState,
          nextState.blocks[action.payload.id],
          _html.substring(1)
        )
      }
      // TODO: TO TRANSFER RANGES TO NEW BLOCK
      return setBlockType(nextState, action.payload.type, action.payload.id)
    default:
      return state
  }
}
