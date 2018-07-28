import { enter } from '../react/properties-style.js'
import {
  createId,
  getActionableParent,
  getAllAnimatedProps,
  getAllowedStyleKeys,
  getAnimatedStyles,
  getDynamicStyles,
  getTimingProps,
  hasAnimatedChild,
  hasKeys,
  hasKeysInChildren,
  hasRowStyles,
  hasSpringAnimation,
  hasTimingAnimation,
  isTable,
} from '../utils.js'
import toSlugCase from 'to-slug-case'
import uniq from 'array-uniq'

export { enter }

export function leave(node, parent, state) {
  const { dynamic, static: staticStyle } = node.style

  const allowedStyleKeys = getAllowedStyleKeys(node)
  let scopedUnderParent =
    !node.isCapture && !node.action && getActionableParent(node)
  if (scopedUnderParent) {
    scopedUnderParent = scopedUnderParent.styleName
  }

  if (hasAnimatedChild(node) && hasSpringAnimation(node)) {
    state.hasAnimatedChild = true
  }

  if (node.isAnimated && hasSpringAnimation(node)) {
    state.isAnimated = true
    state.animations = node.animations
    state.scopes = node.scopes
  }

  if (isTable(node) && hasRowStyles(node)) {
    debugger
    state.render.push(` rowClassName={Row}`)
    state.styles['Row'] = `const Row = css({ ${composeRowStyles(node)} })`
  }

  // dynamic merges static styles
  if (hasKeysInChildren(dynamic)) {
    state.cssDynamic = true
    node.styleName = node.nameFinal

    let cssStatic = Object.keys(staticStyle)
      .filter(
        key => allowedStyleKeys.includes(key) && hasKeys(staticStyle[key])
      )
      .map(key =>
        asCss(
          asStaticCss(staticStyle[key], Object.keys(dynamic[key])),
          key,
          scopedUnderParent
        ).join('\n')
      )

    cssStatic = cssStatic.join(',\n')

    if (node.isAnimated) {
      cssStatic = cssStatic
        ? `${cssStatic}, ${asAnimatedCss(node)}`
        : asAnimatedCss(node)
    }

    let cssDynamic = Object.keys(dynamic)
      .filter(key => allowedStyleKeys.includes(key) && hasKeys(dynamic[key]))
      .map(key =>
        asCss(asDynamicCss(dynamic[key]), key, scopedUnderParent).join('\n')
      )
      .join('\n')

    const id = createId(node, state)

    state.styles[id] = `const ${id} = css({${
      cssStatic ? `${cssStatic}, ` : ''
    }${cssDynamic}})`

    if (hasSpringAnimation(node)) {
      state.render.push(
        ` style={{${getAnimatedStyles(
          node,
          state.isReactNative
        )},${getDynamicStyles(node)}}}`
      )
    } else {
      state.render.push(` style={{${getDynamicStyles(node)}}}`)
    }
  } else if (hasKeysInChildren(staticStyle)) {
    state.cssStatic = true

    const id = createId(node, state)
    const css = Object.keys(staticStyle)
      .filter(
        key => allowedStyleKeys.includes(key) && hasKeys(staticStyle[key])
      )
      .map(key =>
        asCss(asStaticCss(staticStyle[key]), key, scopedUnderParent).join('\n')
      )
      .join(',\n')

    if (css) {
      state.styles[id] = `const ${id} = css({${css}})`
    }
  }
}

const asAnimatedCss = node => {
  if (hasTimingAnimation(node)) {
    const transition = uniq(getTimingProps(node).map(makeTransition)).join(', ')

    return `\ntransition: '${transition}',\nwillChange: '${getUniqueNames(
      node
    )}'`
  }

  return `\nwillChange: '${getUniqueNames(node)}'`
}

const getUniqueNames = node => {
  const names = [
    ...new Set(getAllAnimatedProps(node, false).map(prop => prop.name)),
  ]
  return uniq(names.map(name => ensurePropName(name))).join(', ')
}

const ensurePropName = name => {
  switch (name) {
    case 'rotate':
    case 'rotateX':
    case 'rotateY':
    case 'scale':
    case 'translateX':
    case 'translateY':
      return 'transform'

    default:
      return toSlugCase(name)
  }
}

const makeTransition = ({ name, animation }) =>
  `${ensurePropName(name)} ${animation.duration}ms ${toSlugCase(
    animation.curve
  )} ${animation.delay}ms`

const asDynamicCss = styles =>
  Object.keys(styles).map(prop => `${prop}: ${styles[prop]}`)

const safe = str =>
  typeof str === 'string' ? `"${str.replace(/"/g, "'")}"` : str

const asStaticCss = (styles, dynamicStyles = []) =>
  Object.keys(styles)
    .filter(prop => !dynamicStyles.includes(prop))
    .map(prop => `${prop}: ${safe(styles[prop])}`)

const asCss = (styles, key, scopedUnderParent) => {
  let css = []

  if (key !== 'base') {
    if (scopedUnderParent) {
      const parent = `.\${${scopedUnderParent}}`
      css.push(`[\`${parent}:${key} &, ${parent}.${key} &\`]: {`)
    } else if (key === 'disabled' || key === 'hover' || key === 'focus') {
      css.push(`"&:${key}": {`)
    } else if (key === 'print') {
      // TODO can we use this to support all media queries?
      css.push('"@media print": {')
    } else if (key === 'placeholder') {
      css.push(`"&::placeholder": {`)
    }
  }

  css.push(styles.join(',\n'))

  if (key !== 'base') css.push(`}`)

  return css
}

const getStyleString = (styles, regex) =>
  styles
    .map(style => {
      let name = style.name.match(new RegExp(regex))[1]
      name = name.replace(/^.{1}/g, name[0].toLowerCase())

      return `${name}: '${style.value}'`
    })
    .join(`,\n`)

const composeRowStyles = node => {
  const styles = node.properties.filter(prop =>
    prop.tags.hasOwnProperty('rowStyle')
  )
  const defaults = styles.filter(style => !/Alternate/.test(style.name))
  const alternates = styles.filter(style => /Alternate/.test(style.name))

  const defaultStyles = getStyleString(defaults, '^row(.*?)$')
  const alternateStyles = alternates.length
    ? getStyleString(alternates, '^row(.*?)Alternate')
    : null

  return `
    display: 'flex',
    ${defaultStyles ? `${defaultStyles},` : ''}
    ${alternateStyles ? `"&:nth-child(even)": {${alternateStyles}}` : ''}
  `
}
