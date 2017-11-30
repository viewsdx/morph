import { isCode } from '../utils.js'
import safe from '../react/safe.js'

export default (node, parent) => {
  const key = node.key.value
  const value = node.value.value

  switch (node.value.type) {
    case 'Literal':
      if (key === 'source' && parent.parent.name.value === 'Image') {
        const uri = isCode(value) ? value : `"${value}"`

        return {
          source: `{{ uri: ${uri}}}`,
        }
      } else if (key !== 'isDisabled') {
        return {
          [key]: safe(value, node),
        }
      }
    // TODO lists
    case 'ArrayExpression':
    // TODO support object nesting
    case 'ObjectExpression':
    default:
      return false
  }
}
