import { hasKeys, hasKeysInChildren } from '../utils.js'
import { transform } from 'babel-core'
import isUnitlessNumber from '../react/is-unitless-number.js'
import toSlugCase from 'to-slug-case'
import glam from 'glam/babel'

export default ({ file, inlineStyles, styles }, name) => {
  if (!hasKeys(styles)) return ''

  const obj = Object.keys(styles)
    .filter(k => hasKeysInChildren(styles[k]))
    .map(k => `${JSON.stringify(k)}: css\`${toNestedCss(styles[k])}\``)
    .join(',')

  const code = transformGlam(`const styles = {${obj}}`, inlineStyles, file.raw)
  const maybeImport = inlineStyles
    ? ''
    : `import './${file.relative.split('/').pop()}.css'\n`
  return `${maybeImport}${code}`
}

const getKey = raw => {
  const key = toSlugCase(raw)
  return raw.startsWith('Webkit') ? `-${key}` : key
}

const getValue = (key, value) =>
  typeof value === 'number' &&
  !(isUnitlessNumber.hasOwnProperty(key) && isUnitlessNumber[key])
    ? `${value}px`
    : `${value}`

const toCss = obj =>
  Object.keys(obj)
    .map(k => `${getKey(k)}: ${getValue(k, obj[k])};`)
    .join('\n')

const toNestedCss = ({
  base,
  hover,
  focus,
  active,
  activeHover,
  disabled,
  placeholder,
  print,
}) => {
  const baseCss = toCss(base)
  const hoverCss = toCss(hover)
  const focusCss = toCss(focus)
  const activeCss = toCss(active)
  const activeHoverCss = toCss(activeHover)
  const disabledCss = toCss(disabled)
  const placeholderCss = toCss(placeholder)
  const printCss = toCss(print)

  debugger
  const ret = [
    baseCss,
    hoverCss && `&:hover {${hoverCss}}`,
    focusCss && `&:focus {${focusCss}}`,
    activeCss && `&.active {${activeCss}}`,
    activeHoverCss && `&.active:hover {${activeHoverCss}}`,
    disabledCss && `&:disabled {${disabledCss}}`,
    placeholderCss && `&::placeholder {${placeholderCss}}`,
    printCss && `@media print {${printCss}}`,
  ]
    .filter(Boolean)
    .join('\n')

  return ret
}

const transformGlam = (code, inline, filename) => {
  let out = transform(code, {
    babelrc: false,
    filename,
    plugins: [[glam, { inline }]],
  }).code

  if (!inline) {
    out = out
      .replace(/css\(/g, '')
      .replace(/,\s*\[\]/g, '')
      .replace(/\)/g, '')
  }

  return out
}
