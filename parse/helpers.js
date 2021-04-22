import { isRowStyle, isStyle /*, STYLE*/ } from './prop-is-style.js'
import { fontFamily as googleFontFamilies } from '../morph/fonts.js'
// import DidYouMeanMatcher from './did-you-mean.js'
import isNumber from './prop-is-number.js'
import toSlugCase from 'to-slug-case'

// let dymPropMatcher = new DidYouMeanMatcher([
//   ...STYLE,
//   'at',
//   'className',
//   'cx',
//   'cy',
//   'd',
//   'data',
//   'xdata',
//   'dataFormat',
//   'defaultValue',
//   'fill',
//   'from',
//   'direction',
//   'id',
//   'is',
//   'key',
//   'maxLength',
//   'max',
//   'min',
//   'onBlur',
//   'onChange',
//   'onClick',
//   'onClickUseDiv',
//   'onDrag',
//   'onDragEnd',
//   'onDragEnter',
//   'onDragExit',
//   'onDragLeave',
//   'onDragOver',
//   'onDragStart',
//   'onDrop',
//   'onFocus',
//   'onFocus',
//   'onMouseDown',
//   'onMouseEnter',
//   'onMouseLeave',
//   'onMouseMove',
//   'onMouseOver',
//   'onMouseUp',
//   'onWheel',
//   'onWhen',
//   'order',
//   'r',
//   'ref',
//   'rx',
//   'ry',
//   'step',
//   'stroke',
//   'stroke',
//   'strokeLinecap',
//   'strokeLinejoin',
//   'strokeMiterlimit',
//   'strokeWidth',
//   'tabIndex',
//   'text',
//   'type',
//   'value',
//   'viewBox',
//   'when',
//   'x',
//   'x1',
//   'x2',
//   'y',
//   'y1',
//   'y2',
// ])

export let makeDidYouMeanBlock = (views) => {
  let dymBlockMatcher = new DidYouMeanMatcher(
    'Block|Capture|CaptureTextArea|Children|Horizontal|Image|List|Svg|SvgCircle|SvgEllipse|SvgDefs|SvgGroup|SvgLinearGradient|SvgRadialGradient|SvgLine|SvgPath|SvgPolygon|SvgPolyline|SvgRect|SvgSymbol|SvgText|SvgUse|SvgStop|Text|View|Vertical'
      .split('|')
      .concat(views)
  )
  return (block) => dymBlockMatcher.get(block)
}

// export let didYouMeanProp = (prop) => dymPropMatcher.get(prop)

// export let makeDidYouMeanFontFamily = (customFonts) => {
//   let dymFontFamilyMatcher = new DidYouMeanMatcher(
//     googleFontFamilies.concat(customFonts)
//   )
//   return (family) => dymFontFamilyMatcher.get(family)
// }

let ANIMATION = /(.+)(?:\s)(spring|linear|easeOut|easeInOut|easeIn|ease)(?:\s?(.*)?)/
let BASIC = /^(Block|Capture|CaptureTextArea|Children|Column|Horizontal|Image|List|Svg|SvgCircle|SvgEllipse|SvgDefs|SvgGroup|SvgLinearGradient|SvgRadialGradient|SvgLine|SvgPath|SvgPolygon|SvgPolyline|SvgRect|SvgSymbol|SvgText|SvgUse|SvgStop|Table|Text|View|Vertical)$/i
let BLOCK = /^(\s*)([A-Z][a-zA-Z0-9]*)(\s+([A-Z][a-zA-Z0-9]*))?$/
let BOOL = /^(false|true)$/i
let CAPTURE = /^(Capture|CaptureTextArea)$/i
export let CAPTURE_TYPES = [
  'email',
  'file',
  'number',
  'phone',
  'secure',
  'text',
]
let COMMENT = /^#(.+)$/
let FLOAT = /^-?[0-9]+\.[0-9]+$/
let FONTABLE = /^(Capture|CaptureTextArea|Text)$/
let INT = /^-?[0-9]+$/
let NOT_GROUP = /^(Image|Text|SvgCircle|SvgEllipse|SvgLine|SvgPath|SvgPolygon|SvgPolyline|SvgRect|SvgText|SvgStop)$/i
let PROP = /^([a-z][a-zA-Z0-9]*)(\s+(.+))?$/
let UNSUPPORTED_SHORTHAND = {
  border: ['borderWidth', 'borderStyle', 'borderColor'],
  borderBottom: ['borderBottomWidth', 'borderBottomStyle', 'borderBottomColor'],
  borderTop: ['borderTopWidth', 'borderTopStyle', 'borderTopColor'],
  borderRight: ['borderRightWidth', 'borderRightStyle', 'borderRightColor'],
  borderLeft: ['borderLeftWidth', 'borderLeftStyle', 'borderLeftColor'],
  borderRadius: [
    'borderTopLeftRadius',
    'borderTopRightRadius',
    'borderBottomLeftRadius',
    'borderBottomRightRadius',
  ],
  boxShadow: [
    'shadowOffsetX',
    'shadowOffsetY',
    'shadowBlur',
    'shadowSpread',
    'shadowColor',
  ],
  flex: ['flexGrow', 'flexShrink', 'flexBasis'],
  margin: ['marginTop', 'marginRight', 'marginBottom', 'marginLeft'],
  padding: ['paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft'],
  textShadow: ['shadowOffsetX', 'shadowOffsetY', 'shadowBlur', 'shadowColor'],
  outline: ['outlineWidth', 'outlineStyle', 'outlineColor'],
  overflow: ['overflowX', 'overflowY'],
  transform: [
    'rotate',
    'rotateX',
    'rotateY',
    'scale',
    'translateX',
    'translateY',
  ],
  transformOrigin: ['transformOriginX', 'transformOriginY'],
}
let TRUE = /^true$/i
let USER_COMMENT = /^##(.*)$/
// TODO slot can't start with a number
let SLOT = /^<((!)?([a-zA-Z0-9]+))?(\s+(.+))?$/

export let is = (thing, line) => thing.test(line)
// TODO only parse animations on lines with less than 250 chars because longer
// lines are too expensive for that regex - like svg paths
export let isAnimation = (line) => line.length < 250 && is(ANIMATION, line)
export let isBasic = (line) => is(BASIC, line)
export let isBlock = (line) => is(BLOCK, line)
export let isBool = (line) => is(BOOL, line)
export let isCapture = (line) => is(CAPTURE, line)
export let isColumn = (line) => line === 'Column'
export let isComment = (line) => is(COMMENT, line)
export let isEmptyText = (line) => line === ''
export let isEnd = (line) => line === ''
export let isFloat = (line) => is(FLOAT, line)
export let isFragment = (line) => line === 'isFragment'
export let isFontable = (line) => is(FONTABLE, line)
export let isGroup = (line) => !is(NOT_GROUP, line) && !isCapture(line)
export let isList = (line) => line === 'List'
export let isInt = (line) => is(INT, line)
export let isProp = (line) => is(PROP, line)
export let isSlot = (line) => is(SLOT, line)
export let isTable = (line) => line === 'Table'
export let isUnsupportedShorthand = (name) => name in UNSUPPORTED_SHORTHAND
export { isRowStyle, isStyle }
export let isTrue = (line) => is(TRUE, line)
export let isUserComment = (line) => is(USER_COMMENT, line)

let get = (regex, line) => line.match(regex)

let addDefaults = (animationType, properties) => {
  // if (!properties.delay) {
  //   properties.delay = 0
  // }

  if (animationType !== 'spring' && !properties.duration) {
    properties.duration = 150
  } else if (animationType === 'spring') {
    if (!properties.tension) {
      properties.tension = 170
    }
    if (!properties.friction) {
      properties.friction = 26
    }
  }
  return properties
}

export let getAnimation = (line) => {
  // eslint-disable-next-line
  let [_, defaultValue, animationType, animationValues] = get(ANIMATION, line)
  let properties = {
    curve: animationType,
  }

  if (animationValues) {
    let values = animationValues.split(' ')
    for (let i = 0; i < values.length; i = i + 2) {
      properties[values[i]] = getValue(values[i + 1])
    }
  }

  addDefaults(animationType, properties)

  return {
    id: Object.keys(properties)
      .sort()
      .map((key) => `${key}${properties[key]}`)
      .join(''),
    defaultValue: getValue(defaultValue),
    properties,
  }
}

export let getBlock = (line) => {
  // eslint-disable-next-line
  let [_, indentation, is, _1, block] = get(BLOCK, line)
  return {
    block: block || is,
    is: block ? is : null,
    level: Math.floor(indentation.length / 2),
  }
}
export let getComment = (line) => {
  try {
    return get(COMMENT, line).slice(1)
  } catch (err) {
    return ''
  }
}

export let getData = (maybeProp) => {
  if (!maybeProp) return null

  let match = maybeProp.value.match(/^((show|capture)\s+)?(.+)$/)
  if (!match) return null

  let path = match[3]
  let [context = null] = /\./.test(path) ? path.split('.') : [path]

  return { path, context }
}

export let getDataFormat = (maybeProp) => {
  if (!maybeProp || !maybeProp.value) return null
  return {
    type: 'js',
    formatIn: maybeProp.value,
  }
}

export let getDataValidate = (maybeProp) => {
  if (!maybeProp || !maybeProp.value) return null
  return {
    type: 'js',
    value: maybeProp.value,
  }
}

export let getProp = (line) => {
  // eslint-disable-next-line
  let [_, name, _1, value = ''] = get(PROP, line)

  let prop = { name, isSlot: false, value }

  if (is(SLOT, value)) {
    let [
      // eslint-disable-next-line
      _2,
      slotIsNot = false,
      slotName = '',
      // eslint-disable-next-line
      _3,
      // eslint-disable-next-line
      defaultValue = '',
    ] = getSlot(value)

    prop.isSlot = true
    prop.slotIsNot = slotIsNot === '!'
    prop.slotName = slotName
    prop.value = defaultValue || value
  }

  return prop
}
export let getSlot = (line) => get(SLOT, line).slice(1)
export let getUnsupportedShorthandExpanded = (name, value) => {
  let props = UNSUPPORTED_SHORTHAND[name]

  if (name === 'borderRadius') {
    let theValue = value.replace('px', '')

    return [
      `${props[0]} ${theValue}`,
      `${props[1]} ${theValue}`,
      `${props[2]} ${theValue}`,
      `${props[3]} ${theValue}`,
    ]
  } else if (name.startsWith('border') || name === 'outline') {
    let [width, style, ...color] = value.split(' ')

    return [
      `${props[0]} ${width.replace('px', '')}`,
      `${props[1]} ${style}`,
      `${props[2]} ${color.join(' ')}`,
    ]
  } else if (name === 'boxShadow') {
    let [offsetX, offsetY, blurRadius, spreadRadius, ...color] = value.split(
      ' '
    )

    return [
      `${props[0]} ${offsetX.replace('px', '')}`,
      `${props[1]} ${offsetY.replace('px', '')}`,
      `${props[2]} ${blurRadius.replace('px', '')}`,
      `${props[3]} ${spreadRadius.replace('px', '')}`,
      `${props[4]} ${color.join(' ')}`,
    ]
  } else if (name === 'textShadow') {
    let [offsetX, offsetY, blurRadius, ...color] = value.split(' ')

    return [
      `${props[0]} ${offsetX.replace('px', '')}`,
      `${props[1]} ${offsetY.replace('px', '')}`,
      `${props[2]} ${blurRadius.replace('px', '')}`,
      `${props[3]} ${color.join(' ')}`,
    ]
  } else if (name === 'overflow') {
    return [`${props[0]} ${value}`, `${props[1]} ${value}`]
  } else if (name === 'padding' || name === 'margin') {
    let [top, right, bottom, left] = value.split(' ')
    top = top.replace('px', '')
    right = right ? right.replace('px', '') : top
    bottom = bottom ? bottom.replace('px', '') : top
    left = left ? left.replace('px', '') : right || top

    return [
      `${props[0]} ${top}`,
      `${props[1]} ${right}`,
      `${props[2]} ${bottom}`,
      `${props[3]} ${left}`,
    ]
  } else if (name === 'flex') {
    return [`flexGrow ${value}`, 'flexShrink 1', 'flexBasis 0%']
  } else if (name === 'transform') {
    return [`expand the values like: translateX 10`]
  } else if (name === 'transformOrigin') {
    let [x, y] = value.split(' ')
    return [`${props[0]} ${x}`, `${props[1]} ${y || x}`]
  }

  return []
}
export let getValue = (value, name) => {
  if (isFloat(value)) {
    return parseFloat(value, 10)
  } else if (isInt(value)) {
    return parseInt(value, 10)
  } else if (isEmptyText(value)) {
    return ''
  } else if (isBool(value)) {
    return isTrue(value)
  } else {
    return maybeMakeHyphenated(value, name)
  }
}

let SYSTEM_SCOPES = [
  'isDisabled',
  'isFocused',
  // 'isHovered',
  'isPlaceholder',
  // 'isSelected',
  // TODO do we want to do media queries here?
]
export let isSystemScope = (name) => SYSTEM_SCOPES.includes(name)

let isActionable = (name) => name !== 'onWhen' && /^on[A-Z]/.test(name)

export let getPropType = (block, name, defaultValue) =>
  block.isList && name === 'from'
    ? 'array'
    : isActionable(name)
    ? 'function'
    : isNumber[name]
    ? 'number'
    : 'string'

let MAYBE_HYPHENATED_STYLE_PROPS = [
  'alignContent',
  'alignItems',
  'alignSelf',
  'backgroundBlendMode',
  'backgroundClip',
  'backgroudOrigin',
  'backgroundRepeat',
  'boxSizing',
  'clear',
  'cursor',
  'flexBasis',
  'flexDirection',
  'flexFlow',
  'flexWrap',
  'float',
  'fontStretch',
  'justifyContent',
  'objectFit',
  'overflowWrap',
  'textAlign',
  'textDecorationLine',
  'textTransform',
  'whiteSpace',
  'wordBreak',
]

export let maybeMakeHyphenated = (value, name) =>
  MAYBE_HYPHENATED_STYLE_PROPS.includes(name) && /^[a-zA-Z]+$/.test(value)
    ? toSlugCase(value)
    : value

export function sortScopes(scopes) {
  let isHovered = scopes.find((item) => item.slotName === 'isHovered')
  let isSelected = scopes.find((item) => item.slotName === 'isSelected')
  let isSelectedHovered = scopes.find(
    (item) => item.slotName === 'isSelectedHovered'
  )

  return [
    isSelectedHovered,
    isSelected,
    isHovered,
    ...scopes.filter(
      (item) =>
        !/^(isHovered|isSelected|isSelectedHovered)$/.test(item.slotName)
    ),
  ].filter(Boolean)
}
