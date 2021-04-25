import toSnakeCase from 'to-snake-case'
import toCamelCase from 'to-camel-case'
import path from 'path'

export function enter(node, parent, state) {
  for (let data of node.data) {
    data.name = getDataVariableName(data, state)

    // at the moment it will create multiple instances for the same data key
    // an optimization will be implemented to reuse a variable if possible
    state.dataBlocks.push(
      `let ${data.name} = fromData.useData({ viewPath, path: '${data.path}', `
    )
    maybeDataContext(data, state)
    maybeDataFormat(data.format, state)
    maybeDataValidate(data.validate, state)
    state.dataBlocks.push('})')

    state.use('ViewsUseData')
  }
}

function getDataVariableName(data, state) {
  let name = `${toCamelCase(
    [
      data.path.replace(/\./g, '_'),
      data.format?.formatIn?.value,
      data.format?.formatOut?.value,
      data.validate?.value,
      data.validate?.required ? 'required' : null,
      'data',
    ]
      .filter(Boolean)
      .map(toSnakeCase)
      .join('_')
  )}`
  if (state.usedDataNames[name]) {
    name = `${name}${state.usedDataNames[name]}`
    state.usedDataNames[name] += 1
  } else {
    state.usedDataNames[name] = 1
  }
  return name
}

function maybeDataContext(dataDefinition, state) {
  if (dataDefinition.context === null) return

  state.dataBlocks.push(`context: '${dataDefinition.context}',`)
}

function maybeDataFormat(format, state) {
  if (!format) return

  if (format.formatIn) {
    let importName = getFormatImportName(format.formatIn.source, state)
    state.dataBlocks.push(`formatIn: ${importName}.${format.formatIn.value},`)
  }

  if (format.formatOut) {
    let importName = getFormatImportName(format.formatOut.source, state)
    state.dataBlocks.push(`formatOut: ${importName}.${format.formatOut.value},`)
  }
}

function maybeDataValidate(validate, state) {
  if (!validate || validate.type !== 'js') return
  let importName = getValidateImportName(validate.source, state)
  state.dataBlocks.push(`validate: ${importName}.${validate.value},`)
  if (validate.required) {
    state.dataBlocks.push('validateRequired: true,')
  }
}

function getFilePath(source) {
  if (path.isAbsolute(source)) {
    return source.substring(1)
  }
  if (source.startsWith('.')) return source
  return `./${source}`
}

function getValidateImportName(source, state) {
  let importName
  if (source) {
    importName = getImportNameForSource(source, state)
  } else {
    state.use('ViewsUseDataValidate')
    importName = 'fromViewsValidate'
  }
  return importName
}

function getFormatImportName(source, state) {
  let importName
  if (source) {
    importName = getImportNameForSource(source, state)
  } else {
    state.use('ViewsUseDataFormat')
    importName = 'fromViewsFormat'
  }
  return importName
}

function getImportNameForSource(source, state) {
  let filePath = getFilePath(source)
  if (state.usedImports[filePath]) {
    // there is already a reference to the exact file
    return state.usedImports[filePath]
  }

  let importName = getImportName(
    toCamelCase(`from_${path.parse(filePath).name.replace(/[\W_]+/g, '')}`),
    state
  )

  state.usedImports[filePath] = importName
  state.use(`import * as ${importName} from '${filePath}'`)
  return importName
}

function getImportName(importName, state) {
  let result = importName
  if (state.usedImportNames[importName]) {
    result = `${importName}${state.usedImportNames[importName]}`
    state.usedImportNames[importName] += 1
  } else {
    state.usedImportNames[importName] = 1
  }
  return result
}
