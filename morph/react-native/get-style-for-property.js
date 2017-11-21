import { deinterpolate, isTag } from '../utils.js'
import getColor from 'color'

export default (node, parent, code) => {
  const key = node.key.value
  const value = node.value.value

  switch (key) {
    case 'border':
    case 'borderBottom':
    case 'borderLeft':
    case 'borderRight':
    case 'borderTop':
      return getBorder(value, key.replace('border', ''))

    case 'boxShadow':
      return getShadow(value)

    case 'fontFamily':
      return {
        fontFamily: getFontFamily(node, parent),
      }

    case 'zIndex':
      return {
        zIndex: code ? value : parseInt(value, 10),
      }

    case 'color':
      if (
        /Capture/.test(parent.parent.name.value) &&
        isTag(node, 'placeholder')
      ) {
        return {
          _isProp: true,
          placeholderTextColor: value,
        }
      }
      // Just returning the value in cases where if statement is not true
      // Otherwise it was falling through to the next case.
      return {
        color: value,
      }

    case 'lineHeight':
      return {
        lineHeight: getLineHeight(node, parent),
      }

    default:
      return {
        [key]: value,
      }
  }
}

const getFontFamily = (node, parent) => {
  const fontWeight = parent.list.find(n => n.key.value === 'fontWeight')
  // const key = node.key.value
  const fontFamily = node.value.value.split(',')[0].replace(/\s/g, '')

  return fontWeight ? `${fontFamily}-${fontWeight.value.value}` : fontFamily
}

const getLineHeight = (node, parent) => {
  const fontSize = parent.list.find(n => n.key.value === 'fontSize')
  // using a default font size of 16 if none specified
  const fontSizeValue = fontSize ? fontSize.value.value : 16
  return node.value.value * fontSizeValue
}

// support
// /* offset-x | offset-y | color */
// box-shadow: 60px -16px teal;
// /* offset-x | offset-y | blur-radius | color */
// box-shadow: 10px 5px 5px black;
// /* offset-x | offset-y | blur-radius | spread-radius | color */
// box-shadow: 2px 2px 2px 1px rgba(0, 0, 0, 0.2);
//
// https://developer.mozilla.org/en/docs/Web/CSS/box-shadow?v=example
// prop mapping https://github.com/necolas/react-native-web/issues/44#issuecomment-269031472
const getShadow = value => {
  const [offsetX, offsetY, ...parts] = value.replace(/`/g, '').split(' ')

  const ret = {
    // Android
    elevation: 1,
    // iOS,
    shadowOffset: {
      width: parseInt(offsetX, 10),
      height: parseInt(offsetY, 10),
    },
  }

  let color
  switch (parts.length) {
    case 1:
      color = parts[0]
      break
    case 2:
      color = parts[1]
      ret.shadowRadius = parseInt(parts[0], 10)
      break
    case 3:
      color = parts[2]
      ret.shadowRadius = parseInt(parts[0], 10)
      break
  }

  if (color) {
    ret.shadowOpacity = 1
    // TODO what if the color is a prop? do we calculate this on the fly, how?
    ret.shadowColor = /props/.test(color)
      ? deinterpolate(color)
      : getColor(color).string()
  }

  return ret
}

const getBorder = (value, specific = '') => {
  const [borderWidth, borderStyle, borderColor] = value.split(' ')

  return {
    [`border${specific}Color`]: borderColor,
    /*[`border${specific}Style`]:*/ borderStyle,
    [`border${specific}Width`]: parseInt(borderWidth, 10),
  }
}
