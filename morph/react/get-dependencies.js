import SVG from './svg.js'

const NATIVE = [
  'Image',
  'KeyboardAvoidingView',
  'ScrollView',
  'StyleSheet',
  'Text',
  'TextInput',
  'TouchableHighlight',
  'View',
]

export default (uses, getImport) => {
  const usesNative = []
  const usesSvg = []

  const useNative = d => {
    if (!usesNative.includes(d)) {
      usesNative.push(d)
    }
  }
  const useSvg = d => {
    if (!usesSvg.includes(d)) {
      usesSvg.push(d)
    }
  }

  const dependencies = []
  uses.sort().forEach(d => {
    if (NATIVE.includes(d)) {
      useNative(d)
    } else if (SVG.includes(d)) {
      useSvg(d === 'SvgText' ? 'Text as SvgText' : d)
    } else if (/^[A-Z]/.test(d) || /\.data$/.test(d)) {
      dependencies.push(getImport(d))
    } else if (d === 'glam') {
      dependencies.push(`import css from 'glam'`)
    }
  })

  if (usesSvg.length > 0) {
    const svg = usesSvg.filter(m => m !== 'Svg').join(', ')
    dependencies.push(`import Svg, { ${svg} } from 'react-native-svg'`)
  }

  if (usesNative.length > 0) {
    dependencies.push(`import { ${usesNative.join(', ')} } from 'react-native'`)
  }

  return dependencies.join('\n')
}