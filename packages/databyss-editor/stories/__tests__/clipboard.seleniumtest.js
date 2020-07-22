/** @jsx h */
/* eslint-disable func-names */
import assert from 'assert'
import { startSession, WIN, CHROME } from '@databyss-org/ui/lib/saucelabs'
import { jsx as h } from './hyperscript'
import { sanitizeEditorChildren } from './__helpers'
import {
  getEditor,
  getElementByTag,
  sleep,
  toggleBold,
  getElementById,
  enterKey,
  upKey,
  downKey,
  paste,
  copy,
  cut,
  selectAll,
  upShiftKey,
  rightShiftKey,
  leftShiftKey,
  downShiftKey,
  rightKey,
  sendKeys,
  leftKey,
} from './_helpers.selenium'

let driver
let editor
let slateDocument
let actions
const LOCAL_URL = 'http://localhost:6006/iframe.html?id=services-auth--login'
const PROXY_URL = 'http://0.0.0.0:8080/iframe.html?id=services-auth--login'

const LOCAL_URL_EDITOR =
  'http://localhost:6006/iframe.html?id=services-page--slate-5'
const PROXY_URL_EDITOR =
  'http://0.0.0.0:8080/iframe.html?id=services-page--slate-5'

const random = Math.random()
  .toString(36)
  .substring(7)

describe('editor clipboard', () => {
  beforeEach(async done => {
    // OSX and safari are necessary
    driver = await startSession({ platformName: WIN, browserName: CHROME })
    await driver.get(process.env.LOCAL_ENV ? LOCAL_URL : PROXY_URL)

    const emailField = await getElementByTag(driver, '[data-test-path="email"]')
    await emailField.sendKeys(`${random}@test.com`)

    let continueButton = await getElementByTag(
      driver,
      '[data-test-id="continueButton"]'
    )
    await continueButton.click()

    const codeField = await getElementByTag(driver, '[data-test-path="code"]')
    await codeField.sendKeys('test-code-42')

    continueButton = await getElementByTag(
      driver,
      '[data-test-id="continueButton"]'
    )
    await continueButton.click()

    await getElementByTag(driver, '[data-test-id="logoutButton"]')

    await driver.get(
      process.env.LOCAL_ENV ? LOCAL_URL_EDITOR : PROXY_URL_EDITOR
    )

    editor = await getEditor(driver)

    editor.click()

    actions = driver.actions({ bridge: true })
    await actions.click(editor)

    //   actions = driver.actions()

    done()
  })

  afterEach(async () => {
    const clearButton = await getElementById(driver, 'clear-state')
    await clearButton.click()
    await driver.navigate().refresh()

    // sleep(500)
    await driver.quit()
  })

  it('should copy a whole block and paste it at the end of the same block', async () => {
    // TODO: FIX CURSOR POSITION FOR THIS TEST
    await sleep(300)
    await sendKeys(actions, 'this text will be pasted with ')

    await toggleBold(actions)
    await sendKeys(actions, 'bold ')
    await selectAll(actions)

    await copy(actions)

    await rightKey(actions)
    await paste(actions)
    await sleep(3000)

    await driver.navigate().refresh()

    await sleep(500)

    slateDocument = await getElementById(driver, 'slateDocument')

    const actual = JSON.parse(await slateDocument.getText())

    const expected = (
      <editor>
        <block type="ENTRY">
          <text>this text will be pasted with </text>
          <text bold>bold </text>
          <text>this text will be pasted with </text>
          <text bold>bold </text>
          <cursor />
        </block>
      </editor>
    )

    assert.deepEqual(
      sanitizeEditorChildren(actual.children),
      sanitizeEditorChildren(expected.children)
    )

    assert.deepEqual(actual.selection, expected.selection)
  })

  it('should copy a whole block and paste it in the middle of a block', async () => {
    await sleep(300)
    await sendKeys(actions, 'this text will be pasted with ')
    await toggleBold(actions)
    await sendKeys(actions, 'bold ')
    await selectAll(actions)

    await copy(actions)

    await leftKey(actions)
    await rightKey(actions)
    await rightKey(actions)
    await rightKey(actions)
    await rightKey(actions)
    await rightKey(actions)

    await paste(actions)
    await sleep(3000)

    await driver.navigate().refresh()

    await sleep(500)

    slateDocument = await getElementById(driver, 'slateDocument')

    const actual = JSON.parse(await slateDocument.getText())

    const expected = (
      <editor>
        <block type="ENTRY">
          <text>this this text will be pasted with </text>
          <text bold>
            bold <cursor />
          </text>
          <text>text will be pasted with </text>
          <text bold>bold </text>
        </block>
      </editor>
    )

    assert.deepEqual(
      sanitizeEditorChildren(actual.children),
      sanitizeEditorChildren(expected.children)
    )

    assert.deepEqual(actual.selection, expected.selection)
  })

  it('should copy a whole block and paste it at the start of a block', async () => {
    await sleep(300)
    await sendKeys(actions, 'this text will be pasted with ')
    await toggleBold(actions)
    await sendKeys(actions, 'bold ')
    await selectAll(actions)
    await copy(actions)
    await leftKey(actions)
    await paste(actions)
    await sleep(3000)

    await driver.navigate().refresh()

    await sleep(500)

    slateDocument = await getElementById(driver, 'slateDocument')

    const actual = JSON.parse(await slateDocument.getText())

    // TODO: CURSOR PLACEMENT IS OFF
    const expected = (
      <editor>
        <block type="ENTRY">
          <text>this text will be pasted with </text>
          <text bold>
            bold <cursor />
          </text>
          <text>this text will be pasted with </text>
          <text bold>bold </text>
        </block>
      </editor>
    )

    assert.deepEqual(
      sanitizeEditorChildren(actual.children),
      sanitizeEditorChildren(expected.children)
    )

    assert.deepEqual(actual.selection, expected.selection)
  })

  it('should copy two entry fragments and paste them within an entry', async () => {
    await sleep(3000)
    await sendKeys(actions, 'this is a test')
    await enterKey(actions)
    await enterKey(actions)
    await sendKeys(actions, 'within the second block')
    await leftKey(actions)
    await leftKey(actions)
    await leftKey(actions)
    await leftKey(actions)
    await leftKey(actions)

    await upShiftKey(actions)
    await upShiftKey(actions)
    await rightShiftKey(actions)
    await rightShiftKey(actions)
    await rightShiftKey(actions)
    await rightShiftKey(actions)
    await rightShiftKey(actions)

    await copy(actions)
    await downKey(actions)
    await downKey(actions)

    await enterKey(actions)
    await enterKey(actions)
    await sendKeys(actions, 'this is the third block')
    await leftKey(actions)
    await leftKey(actions)
    await leftKey(actions)
    await leftKey(actions)
    await leftKey(actions)
    await paste(actions)
    await sleep(3000)
    await driver.navigate().refresh()

    await sleep(500)

    slateDocument = await getElementById(driver, 'slateDocument')

    const actual = JSON.parse(await slateDocument.getText())

    const expected = (
      <editor>
        <block type="ENTRY">
          <text>this is a test</text>
        </block>
        <block type="ENTRY">
          <text>within the second block</text>
        </block>
        <block type="ENTRY">
          <text>this is the third block</text>
        </block>
        <block type="ENTRY">
          <text>is a test</text>
        </block>
        <block type="ENTRY">
          <text>
            within the second <cursor />
          </text>
        </block>
      </editor>
    )

    assert.deepEqual(
      sanitizeEditorChildren(actual.children),
      sanitizeEditorChildren(expected.children)
    )

    assert.deepEqual(actual.selection, expected.selection)
  })

  it('should copy an atomic block and maintain atomic id integrity', async () => {
    await sleep(1000)
    await sendKeys(actions, '@this is a source test')
    await enterKey(actions)
    await upKey(actions)
    await rightShiftKey(actions)
    await copy(actions)
    await downKey(actions)
    await downKey(actions)
    await sendKeys(actions, 'some inbetween text')
    await enterKey(actions)
    await enterKey(actions)
    await paste(actions)
    await sleep(3000)

    const atomic = await getElementByTag(
      driver,
      '[data-test-atomic-edit="open"]'
    )

    await atomic.click()
    await atomic.click()

    await sendKeys(actions, ' with appended text')

    const doneButton = await getElementByTag(
      driver,
      '[data-test-dismiss-modal="true"]'
    )
    await doneButton.click()

    await sleep(1000)

    await driver.navigate().refresh()

    await sleep(3000)

    slateDocument = await getElementById(driver, 'slateDocument')

    const actual = JSON.parse(await slateDocument.getText())

    const expected = (
      <editor>
        <block type="SOURCE">
          <text>
            this is a source test with appended text<cursor />
          </text>
        </block>
        <block type="ENTRY">
          <text>some inbetween text</text>
        </block>
        <block type="SOURCE">
          <text>this is a source test with appended text</text>
        </block>
      </editor>
    )

    assert.deepEqual(
      sanitizeEditorChildren(actual.children),
      sanitizeEditorChildren(expected.children)
    )

    assert.deepEqual(actual.selection, expected.selection)
  })

  it('should copy atomic and entry fragment and paste it on an empty block', async () => {
    await sleep(3000)
    await sendKeys(actions, '@this is a source text')
    await enterKey(actions)
    await actions.sendKeys('with frag')
    await leftKey(actions)
    await leftKey(actions)
    await leftKey(actions)
    await leftKey(actions)
    await leftKey(actions)
    await leftShiftKey(actions)
    await leftShiftKey(actions)
    await leftShiftKey(actions)
    await leftShiftKey(actions)
    await leftShiftKey(actions)
    await leftShiftKey(actions)
    await leftShiftKey(actions)
    await copy(actions)
    await downKey(actions)
    await downKey(actions)
    await enterKey(actions)
    await enterKey(actions)
    await paste(actions)
    await sleep(3000)

    await driver.navigate().refresh()

    await sleep(500)

    slateDocument = await getElementById(driver, 'slateDocument')

    const actual = JSON.parse(await slateDocument.getText())

    const expected = (
      <editor>
        <block type="SOURCE">
          <text>this is a source text</text>
        </block>
        <block type="ENTRY">
          <text>with frag</text>
        </block>
        <block type="SOURCE">
          <text>this is a source text</text>
        </block>
        <block type="ENTRY">
          <text>
            with<cursor />
          </text>
        </block>
      </editor>
    )

    assert.deepEqual(
      sanitizeEditorChildren(actual.children),
      sanitizeEditorChildren(expected.children)
    )

    assert.deepEqual(actual.selection, expected.selection)
  })

  it('should select an atomic fragment and paste the whole atomic block', async () => {
    await sleep(1000)
    await sendKeys(actions, '@this is a source text')
    await enterKey(actions)
    await sendKeys(actions, 'in between text')
    await enterKey(actions)
    await enterKey(actions)
    await sendKeys(actions, '@this is another source text')
    await upKey(actions)
    await selectAll(actions)
    await downShiftKey(actions)
    await leftShiftKey(actions)
    await leftShiftKey(actions)
    await copy(actions)
    await downKey(actions)
    await downKey(actions)
    await paste(actions)
    await sleep(3000)
    await driver.navigate().refresh()
    await sleep(500)

    slateDocument = await getElementById(driver, 'slateDocument')

    const actual = JSON.parse(await slateDocument.getText())

    const expected = (
      <editor>
        <block type="SOURCE">
          <text>this is a source text</text>
        </block>
        <block type="ENTRY">
          <text>in between text</text>
        </block>
        <block type="SOURCE">
          <text>this is another source text</text>
        </block>
        <block type="SOURCE">
          <text>this is a source text</text>
        </block>
        <block type="ENTRY">
          <text>in between text</text>
        </block>
        <block type="SOURCE">
          <text>
            this is another source text<cursor />
          </text>
        </block>
      </editor>
    )

    assert.deepEqual(
      sanitizeEditorChildren(actual.children),
      sanitizeEditorChildren(expected.children)
    )

    assert.deepEqual(actual.selection, expected.selection)
  })

  it('should have a multi-block selection with atomics and paste the whole atomic blocks', async () => {
    await sleep(1000)
    await actions.sendKeys('@this is a source text')
    await enterKey(actions)
    await actions.sendKeys('in between text')
    await enterKey(actions)
    await enterKey(actions)
    await actions.sendKeys('@this is another source text')
    await upKey(actions)
    await selectAll(actions)
    await copy(actions)
    await downKey(actions)
    await downKey(actions)
    await paste(actions)
    await sleep(3000)
    await driver.navigate().refresh()
    await sleep(500)

    slateDocument = await getElementById(driver, 'slateDocument')

    const actual = JSON.parse(await slateDocument.getText())

    const expected = (
      <editor>
        <block type="SOURCE">
          <text>this is a source text</text>
        </block>
        <block type="ENTRY">
          <text>in between text</text>
        </block>
        <block type="SOURCE">
          <text>this is another source text</text>
        </block>
        <block type="SOURCE">
          <text>this is a source text</text>
        </block>
        <block type="ENTRY">
          <text>in between text</text>
        </block>
        <block type="SOURCE">
          <text>
            this is another source text<cursor />
          </text>
        </block>
      </editor>
    )

    assert.deepEqual(
      sanitizeEditorChildren(actual.children),
      sanitizeEditorChildren(expected.children)
    )

    assert.deepEqual(actual.selection, expected.selection)
  })

  it('should prevent a paste from occuring in an atomic', async () => {
    await sleep(3000)
    await actions.sendKeys('@this is a source text')
    await enterKey(actions)
    await actions.sendKeys('entry text')
    await leftShiftKey(actions)
    await leftShiftKey(actions)
    await leftShiftKey(actions)
    await leftShiftKey(actions)
    await copy(actions)
    await upKey(actions)
    await upKey(actions)
    await paste(actions)
    await rightKey(actions)
    await rightKey(actions)
    await rightKey(actions)
    await rightKey(actions)
    await paste(actions)
    await sleep(3000)
    await driver.navigate().refresh()

    await sleep(500)

    slateDocument = await getElementById(driver, 'slateDocument')

    const actual = JSON.parse(await slateDocument.getText())

    const expected = (
      <editor>
        <block type="SOURCE">
          <text>
            this<cursor /> is a source text
          </text>
        </block>
        <block type="ENTRY">
          <text>entry text</text>
        </block>
      </editor>
    )

    assert.deepEqual(
      sanitizeEditorChildren(actual.children),
      sanitizeEditorChildren(expected.children)
    )

    assert.deepEqual(actual.selection, expected.selection)
  })

  it('should remove an atomic fragment on a cut', async () => {
    await sleep(3000)
    await actions.sendKeys('@this is a source text')
    await enterKey(actions)
    await leftKey(actions)
    await leftShiftKey(actions)
    await leftShiftKey(actions)
    await leftShiftKey(actions)
    await leftShiftKey(actions)
    await cut(actions)
    await actions.click(editor).perform()
    await actions.clear()
    await downKey(actions)
    await paste(actions)
    await sleep(3000)
    await driver.navigate().refresh()

    await sleep(500)

    slateDocument = await getElementById(driver, 'slateDocument')

    const actual = JSON.parse(await slateDocument.getText())

    const expected = (
      <editor>
        <block type="ENTRY">
          <text />
        </block>
        <block type="SOURCE">
          <text>
            this is a source text<cursor />
          </text>
        </block>
      </editor>
    )

    assert.deepEqual(
      sanitizeEditorChildren(actual.children),
      sanitizeEditorChildren(expected.children)
    )

    assert.deepEqual(actual.selection, expected.selection)
  })

  it('should remove a multi-line atomic fragment on a cut', async () => {
    await sleep(3000)
    await sendKeys(actions, 'this is an entry')
    await enterKey(actions)
    await enterKey(actions)
    await sendKeys(actions, '@this is a source text')
    await enterKey(actions)
    await sendKeys(actions, 'has frag')
    await leftKey(actions)
    await leftKey(actions)
    await leftKey(actions)
    await leftKey(actions)
    await leftKey(actions)
    await leftShiftKey(actions)
    await leftShiftKey(actions)
    await leftShiftKey(actions)
    await leftShiftKey(actions)
    await leftShiftKey(actions)
    await leftShiftKey(actions)
    await cut(actions)
    await downKey(actions)
    await downKey(actions)
    await paste(actions)

    await sleep(3000)

    await driver.navigate().refresh()

    await sleep(500)

    slateDocument = await getElementById(driver, 'slateDocument')

    const actual = JSON.parse(await slateDocument.getText())

    const expected = (
      <editor>
        <block type="ENTRY">
          <text>this is an entry</text>
        </block>
        <block type="ENTRY">
          <text>
            <anchor />
          </text>
        </block>
        <block type="ENTRY">
          <text> frag</text>
        </block>
        <block type="SOURCE">
          <text>this is a source text</text>
        </block>
        <block type="ENTRY">
          <text>
            has<cursor />
          </text>
        </block>
      </editor>
    )

    assert.deepEqual(
      sanitizeEditorChildren(actual.children),
      sanitizeEditorChildren(expected.children)
    )

    assert.deepEqual(actual.selection, expected.selection)
  })
  it('should cut an atomic in a multi block selection', async () => {
    await sleep(1000)
    await sendKeys(actions, 'this is an entry')
    await enterKey(actions)
    await enterKey(actions)
    await sendKeys(actions, '@this is a source text')
    await upKey(actions)
    await leftKey(actions)
    await leftKey(actions)
    await leftKey(actions)
    await leftKey(actions)
    await leftKey(actions)
    await rightShiftKey(actions)
    await rightShiftKey(actions)
    await rightShiftKey(actions)
    await rightShiftKey(actions)
    await rightShiftKey(actions)
    await rightShiftKey(actions)
    await rightShiftKey(actions)
    await rightShiftKey(actions)
    await cut(actions)
    await downKey(actions)
    await paste(actions)
    await sleep(3000)

    await driver.navigate().refresh()

    await sleep(500)

    slateDocument = await getElementById(driver, 'slateDocument')

    const actual = JSON.parse(await slateDocument.getText())

    const expected = (
      <editor>
        <block type="ENTRY">
          <text>this is an </text>
        </block>
        <block type="ENTRY">
          <text>entry</text>
        </block>
        <block type="SOURCE">
          <text>
            this is a source text<cursor />
          </text>
        </block>
      </editor>
    )

    assert.deepEqual(
      sanitizeEditorChildren(actual.children),
      sanitizeEditorChildren(expected.children)
    )

    assert.deepEqual(actual.selection, expected.selection)
  })
})
