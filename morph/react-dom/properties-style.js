import { enter } from '../react/properties-style.js'
import {
  createId,
  getActionableParent,
  getAllAnimatedProps,
  getAllowedStyleKeys,
  getAnimatedStyles,
  getDynamicStyles,
  getTimingProps,
  hasKeys,
  hasKeysInChildren,
  hasRowStyles,
  isTable,
} from '../utils.js'
import toSlugCase from 'to-slug-case'
import uniq from 'array-uniq'

export { enter }

export function leave(node, parent, state) {
  const allowedStyleKeys = getAllowedStyleKeys(node)

  let scopedUnderParent =
    !node.isCapture && !node.action && getActionableParent(node)

  if (scopedUnderParent) {
    scopedUnderParent = scopedUnderParent.styleName
  }

  if (node.hasSpringAnimation) {
    state.isAnimated = true
    state.hasSpringAnimation = true
    state.animations[node.id] = node.animations
    state.scopes = node.scopes
  }

  let id = null

  if (isTable(node) && hasRowStyles(node)) {
    id = createId(node, state)
    getTableRowStyles({ node, state, id, scopedUnderParent })
  }

  const css = [
    getStaticCss({ node, scopedUnderParent, state, allowedStyleKeys }),
    node.isAnimated && getAnimatedCss(node),
    getDynamicCss({ node, scopedUnderParent, state, allowedStyleKeys }),
  ].filter(Boolean)

  if (css.length > 0) {
    if (id === null) {
      id = createId(node, state)
    }

    state.styles[id] = `const ${id} = css({label: '${id}', ${css.join(', ')}})`
  }
}

const composeStyles = (node, styles, scopedUnderParent) => {
  const allowedStyleKeys = getAllowedStyleKeys(node)

  if (hasKeysInChildren(styles.dynamic)) {
    let cssStatic = Object.keys(styles.static)
      .filter(
        key => allowedStyleKeys.includes(key) && hasKeys(styles.static[key])
      )
      .map(key =>
        asCss(
          asStaticCss(styles.static[key], Object.keys(styles.dynamic[key])),
          key,
          scopedUnderParent
        ).join('\n')
      )

    cssStatic = cssStatic.join(',\n')

    const cssDynamic = Object.keys(styles.dynamic)
      .filter(
        key => allowedStyleKeys.includes(key) && hasKeys(styles.dynamic[key])
      )
      .map(key =>
        asCss(asDynamicCss(styles.dynamic[key]), key, scopedUnderParent).join(
          '\n'
        )
      )
      .join(',\n')

    return { cssDynamic, cssStatic }
  }

  const cssStatic = Object.keys(styles.static)
    .filter(
      key => allowedStyleKeys.includes(key) && hasKeys(styles.static[key])
    )
    .map(key =>
      asCss(asStaticCss(styles.static[key]), key, scopedUnderParent).join('\n')
    )
    .join(',\n')

  return { cssStatic }
}

const getStaticCss = ({ node, scopedUnderParent, state, allowedStyleKeys }) => {
  const style = node.style.static
  if (!hasKeysInChildren(style)) return false

  state.cssStatic = true

  const hasDynamicCss = hasKeysInChildren(node.style.dynamic)

  return Object.keys(style)
    .filter(key => allowedStyleKeys.includes(key) && hasKeys(style[key]))
    .map(key =>
      asCss(
        asStaticCss(
          style[key],
          hasDynamicCss ? Object.keys(node.style.dynamic[key]) : []
        ),
        key,
        scopedUnderParent
      ).join('\n')
    )
    .join(',\n')
}

const getDynamicCss = ({
  node,
  scopedUnderParent,
  state,
  allowedStyleKeys,
}) => {
  const style = node.style.dynamic
  if (!hasKeysInChildren(style)) return false

  state.cssDynamic = true
  node.styleName = node.nameFinal

  if (node.hasSpringAnimation) {
    state.render.push(
      ` style={{${getAnimatedStyles(
        node,
        state.isReactNative
      )},${getDynamicStyles(node)}}}`
    )
  } else {
    const inlineDynamicStyles = getDynamicStyles(node)
    if (inlineDynamicStyles) {
      state.render.push(` style={{${inlineDynamicStyles}}}`)
    }
  }

  return Object.keys(style)
    .filter(key => allowedStyleKeys.includes(key) && hasKeys(style[key]))
    .map(key =>
      asCss(asDynamicCss(style[key]), key, scopedUnderParent).join('\n')
    )
    .join(',\n')
}

const getAnimatedCss = node => {
  if (node.hasTimingAnimation) {
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

const getTableRowStyles = ({ node, state, id, scopedUnderParent }) => {
  const normalStyles = {}
  const alternateStyles = {}

  Object.entries(node.style).forEach(([type, typeScopes]) => {
    if (!(type in alternateStyles)) {
      alternateStyles[type] = {}
    }
    if (!(type in normalStyles)) {
      normalStyles[type] = {}
    }

    Object.entries(typeScopes).forEach(([scope, scopeStyles]) => {
      if (!(scope in alternateStyles[type])) {
        alternateStyles[type][scope] = {}
      }
      if (!(scope in normalStyles[type])) {
        normalStyles[type][scope] = {}
      }

      Object.entries(scopeStyles).forEach(([key, value]) => {
        switch (key) {
          case 'rowColor':
            normalStyles[type][scope]['color'] = value
            delete node.style[type][scope][key]
            break
          case 'rowBackgroundColor':
            normalStyles[type][scope]['backgroundColor'] = value
            delete node.style[type][scope][key]
            break
          case 'rowColorAlternate':
            alternateStyles[type][scope]['color'] = value
            delete node.style[type][scope][key]
            break
          case 'rowBackgroundColorAlternate':
            alternateStyles[type][scope]['backgroundColor'] = value
            delete node.style[type][scope][key]
            break

          default:
            break
        }
      })
    })
  })

  const { cssDynamic: normalDynamic, cssStatic: normalStatic } = composeStyles(
    node,
    normalStyles,
    scopedUnderParent
  )

  const {
    cssDynamic: alternateDynamic,
    cssStatic: alternateStatic,
  } = composeStyles(node, alternateStyles, scopedUnderParent)

  const normalCss = `${normalStatic ? `${normalStatic}` : ''} ${
    normalDynamic ? `, ${normalDynamic}` : ''
  }`

  const alternateCss = `${alternateStatic ? `${alternateStatic}` : ''} ${
    alternateDynamic ? `, ${alternateDynamic}` : ''
  }`

  node.hasDynamicRowStyles = !!(normalDynamic || alternateDynamic)
  state.render.push(` style={{${getDynamicStyles(node)}}}`)
  state.render.push(` rowClassName={${id}Row}`)

  state.styles[`${id}Row`] = `const ${id}Row = css({ display: 'flex'
    ${normalCss ? `, ${normalCss}` : ''}
    ${alternateCss ? `, "&:nth-child(even)": {${alternateCss}}` : ''}
    })`
}
