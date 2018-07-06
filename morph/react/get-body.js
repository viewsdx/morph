// import { canUseNativeDriver } from '../utils.js'
import getUnit from '../get-unit.js'
// import toPascalCase from 'to-pascal-case'

export default ({ state, name }) => {
  let render = state.render.join('')
  if (Object.keys(state.locals).length > 0 || state.isFormatted) {
    render = `<Subscribe to={[LocalContainer]}>\n{local =>\n${render}\n}</Subscribe>`
  }

  const maybeChildrenArray = state.usesChildrenArray
    ? `const childrenArray = React.Children.toArray(props.children)`
    : ''

  const maybeState =
    state.captures.length > 0
      ? `constructor(props) {
    super(props)
    this.state = {}
  }`
      : ''

  const maybeTracking = state.track && !state.debug

  let maybeAnimated = false
  let animatedOpen = []
  let animatedClose = []
  if (state.isAnimated) {
    maybeAnimated = true

    Object.keys(state.animations).forEach(blockId => {
      Object.values(state.animations[blockId]).forEach(item => {
        const { curve, delay, ...configValues } = item.animation.properties

        if (!state.isReactNative && curve !== 'spring') return

        // react-spring only exposes Spring as a component,
        // you can configure the Timing animations with the TimingAnimation bit
        const tag = 'Spring' // toPascalCase(curve)
        const config = Object.entries(configValues)
          .map(([key, value]) => `${key}: ${value}`)
          .join(',')
        const to = Object.values(item.props)
          .map(prop => {
            prop.scopes.reverse()

            let value = prop.scopes.reduce(
              (current, scope) =>
                `props.${scope.name}? ${JSON.stringify(
                  scope.value
                )} : ${current}`,
              JSON.stringify(prop.value)
            )

            const unit = getUnit(prop)
            if (!state.isReactNative && unit) {
              value = `\`$\{${value}}${unit}\``
            }

            return `${JSON.stringify(prop.name)}: ${value}`
          })
          .join(',')

        // TODO bring back native driver when possible in RN
        // there's an issue with animated(View) in react-spring's
        // implementation that is preventing us from using it,
        // it doesn't seem to recognise regular styles, so we
        // have to use RN's Animated the thing is that the native flag on
        // react-spring breaks things, I imagine it's because it's a different
        // implementation altogether, so we'll see it at some later stage.
        const useNativeDriver = state.isReactNative
          ? false // !Object.keys(item.props).some(canUseNativeDriver)
          : true

        const impl = curve === 'spring' ? 'SpringAnimation' : 'TimingAnimation'

        animatedOpen.push(
          `<${tag} impl={${impl}} ${
            useNativeDriver ? 'native' : ''
          } config={{${config}}} delay={${delay}} to={{${to}}}>{animated${blockId}${
            item.index > 0 ? item.index : ''
          } => (`
        )

        animatedClose.push(`)}</${tag}>`)
      })
    })
  }

  if (maybeState || maybeTracking || maybeAnimated) {
    return `class ${name} extends React.Component {
  ${maybeState}

  render() {
    const { ${maybeTracking ? 'context,' : ''} props, ${
      maybeState ? 'state' : ''
    } } = this
    ${maybeChildrenArray}
    return (${animatedOpen.join('')}${render}${animatedClose.join('')})
  }
}`
  } else {
    return `const ${name} = (props ${maybeTracking ? ', context' : ''}) => {
  ${maybeChildrenArray}
  return (${render})
}`
  }
}
