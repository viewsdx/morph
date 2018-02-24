const { html2json } = require('html2json')
const flatten = require('flatten')
const SvgOptimiser = require('svgo')
const toCamelCase = require('to-camel-case')
const toPascalCase = require('to-pascal-case')

const svgCustomStyles = [
  'alignSelf <',
  'flex <',
  'marginTop <',
  'marginBottom <',
  'marginLeft <',
  'marginRight <',
]

const slotNames = ['width', 'height', 'fill', 'stroke']

const addSlots = (prop, value) => {
  const match = slotNames.some(name => prop === name)
  value = match ? `< ${value}` : value

  return value
}

const getAttrs = attr =>
  Object.keys(attr)
    .filter(a => a !== 'xmlns')
    .map(prop => {
      let value = attr[prop]
      if (Array.isArray(value)) {
        value = value.join(' ')
      }
      return `${toCamelCase(prop)} ${addSlots(prop, value)}`
    })

const getBlock = raw => {
  switch (raw) {
    case 'svg':
      return 'Svg'

    case 'g':
      return 'SvgGroup'

    default:
      return `Svg${toPascalCase(raw)}`
  }
}

const IGNORE = ['title', 'desc']

const parseSvg = ({ attr, child, tag }) => {
  const s = []
  // debugger

  if (!tag || IGNORE.includes(tag.toLowerCase())) return false

  s.push(getBlock(tag))
  if (tag === 'svg') {
    s.push(svgCustomStyles)
  }
  if (attr) {
    const attrs = getAttrs(attr)
    s.push(attrs)
  }

  if (child) {
    s.push(
      child.map(c => {
        const parsed = parseSvg(c)
        return parsed && [parsed, '']
      })
    )
  }

  return s
}

const addNamedSlot = (line, name, num) =>
  `${line.split(' < ')[0]} <${name}${num} ${line.split(' < ')[1]}`

// if there are duplicate properties, expose them as fill2, fill3, width2, width3 etc
const checkDuplicates = result => {
  debugger

  slotNames.forEach(name => {
    let count = 0
    let values = []
    result.forEach((line, index) => {
      const re = new RegExp(`${name} <`)
      if (line && re.exec(line)) {
        const value = line.split('< ')[1]
        count++

        // duplicate properties but the value doesn't already exist
        if (count > 1 && !values.includes(value)) {
          values[count] = value
          result[index] = addNamedSlot(line, name, count)
        } else if (count > 1) {
          // duplicate properties and value does already exist
          const i = values.indexOf(value)
          result[index] = addNamedSlot(line, name, i)
        } else {
          // first property
          values[count] = value
        }
      }
    })
  })

  return result
}

module.exports = async raw => {
  const svgo = new SvgOptimiser()
  // TODO revisit this hack to SVGO's plugin config :/, it's too complex
  // and undocumented to spend time going through it
  svgo.config.plugins = svgo.config.plugins.map(list =>
    list.filter(
      plugin =>
        !(plugin.name === 'removeDimensions' || plugin.name === 'removeViewBox')
    )
  )
  const res = await svgo.optimize(raw)
  debugger

  return checkDuplicates(flatten(parseSvg(html2json(res.data).child[0]))).join(
    '\n'
  )
}
