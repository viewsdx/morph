import safe from './react/safe.js'
import wrap from './react/wrap.js'

const safeScope = value =>
  typeof value === 'string' && !isCode(value) ? JSON.stringify(value) : value

export const asScopedValue = (obj, node, properties) => {
  const defaultValue = node.inScope ? null : node.value.value
  let value = []

  for (const scope in obj) {
    const scopeValue = properties.list[obj[scope]].value.value
    value.push(`${scope}? ${safeScope(scopeValue)}`)
  }

  return `${value.join(' : ')} : ${safeScope(defaultValue)}`
}

const INTERPOLATION = /\${(.+)}/
export const deinterpolate = str => {
  const match = str.match(INTERPOLATION)
  return match ? match[1] : str
}

export const getObjectAsString = obj =>
  wrap(
    Object.keys(obj)
      .map(k => {
        const v =
          typeof obj[k] === 'object' && hasKeys(obj[k])
            ? getObjectAsString(obj[k])
            : obj[k]
        return `${JSON.stringify(k)}: ${v}`
      })
      .join(',')
  )

export const getPropertiesAsObject = list => {
  const obj = {}

  list.forEach(prop => {
    obj[prop.key.value] = safeScope(prop.value.value)
  })

  return getObjectAsString(obj)
}

export const getProp = (node, key) => {
  const finder =
    typeof key === 'string'
      ? p => p.key.value === key
      : p => key.test(p.key.value)

  return node.properties && node.properties.list.find(finder)
}

const styleStems = [
  'active',
  'hover',
  'focus',
  'activeHover',
  'placeholder',
  'disabled',
  'print',
]
export const getStyleType = node =>
  styleStems.find(tag => isTag(node, tag)) || 'base'

export const hasKeys = obj => Object.keys(obj).length > 0
export const hasKeysInChildren = obj =>
  Object.keys(obj).some(k => hasKeys(obj[k]))

export const hasProp = (node, key, match) => {
  const prop = getProp(node, key)
  if (!prop) return false
  return typeof match === 'function' ? match(prop.value.value) : true
}

export const hasDefaultProp = (node, parent) =>
  parent.list.some(prop => prop.key.value === node.key.value && !prop.inScope)

export const isCode = node =>
  typeof node === 'string' ? /props|item|index/.test(node) : isTag(node, 'code')
export const isData = node => isTag(node, 'data')
export const isStyle = node => isTag(node, 'style')
export const isToggle = node => isTag(node, 'toggle')

export const isTag = (node, tag) => node.tags[tag]
