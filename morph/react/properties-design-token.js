import { getVariableName, transformToCamelCase } from '../utils.js'

export function enter(node, parent, state) {
  let properties = [
    ...node.properties,
    ...node.scopes.flatMap((scope) => scope.properties),
  ]
  properties
    .filter((prop) => prop.tags.designToken)
    .forEach((prop) => {
      let name = prop.tags.slot
        ? prop.defaultValue
        : prop.value.replace('props.', '')
      if (state.designTokenVariableName[name]) return

      let designTokenVariableName = getVariableName(
        transformToCamelCase([name]),
        state
      )
      state.variables
        .push(`let ${designTokenVariableName} = fromDesignTokens.useDesignTokenValue({
          viewPath,
          path: '${name.replace('dt.', '')}'
        })`)

      state.designTokenVariableName[name] = designTokenVariableName
      state.use('ViewsUseDesignTokens')
    })
}
