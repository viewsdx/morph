import { basename, extname } from 'path'
import buble from 'buble'
import doMorph from './morphers.js'
import doGetViewNotFound from './get-view-not-found.js'
import restrictedNames from './restricted-names.js'
import toCamelCase from 'to-camel-case'
import toPascalCase from 'to-pascal-case'
import prettier from 'prettier'

const DEFAULT_IMPORT = name =>
  /\.data$/.test(name)
    ? `import ${toCamelCase(name)} from './${name}.js'`
    : `import ${name} from './${name}.view.js'`

export const morph = (
  code,
  {
    as,
    compile,
    debug,
    file = {},
    getImport = DEFAULT_IMPORT,
    inlineStyles,
    name,
    pretty = false,
    tests,
    views = {},
  }
) => {
  let morphed = doMorph[as]({
    debug,
    file,
    getImport,
    inlineStyles,
    name,
    view: code,
    tests,
    views,
  })

  if (compile) {
    morphed.code = buble.transform(morphed.code, {
      objectAssign: 'Object.assign',
      transforms: {
        modules: false,
      },
    }).code
  }

  if (pretty) {
    morphed.code = prettier.format(morphed.code, {
      singleQuote: true,
      trailingComma: 'es5',
    })
  }

  return morphed
}

export const getViewNotFound = (as, name, warning) =>
  doGetViewNotFound[as](name, warning)

const sanitize = input =>
  basename(input)
    .replace(extname(input), '')
    .replace(/[^a-zA-Z_$0-9]+/g, '_')
    .replace(/^_/, '')
    .replace(/_$/, '')
    .replace(/^(\d)/, '_$1')

export const pathToName = path =>
  toPascalCase(sanitize(basename(path).replace('.view', '')))

export const isViewNameRestricted = (view, as) =>
  restrictedNames[as].includes(view)
