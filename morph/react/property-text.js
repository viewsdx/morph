import { getScopedCondition, isSlot } from '../utils.js'
import wrap from './wrap.js'

export function enter(node, parent, state) {
  if (node.name === 'text' && parent.name === 'Text') {
    if (getScopedCondition(node, parent)) {
      parent.explicitChildren = wrap(getScopedCondition(node, parent))
    } else {
      parent.explicitChildren = isSlot(node) ? wrap(node.value) : node.value
    }

    return true
  }
}
