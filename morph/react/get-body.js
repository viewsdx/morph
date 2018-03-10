import { getScopeIndex, isNewScope } from '../utils.js'

export default ({ state, name }) => {
  const render = state.render.join('')
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

  const block = `this.props["${state.testIdKey}"] || "${state.name}"`
  const maybeTracking =
    state.track && !state.debug
      ? `componentDidMount() {
  this.context.track({ block: ${block}, action: "enter" })
}

componentWillUnmount() {
  this.context.track({ block: ${block}, action: "leave" })
}`
      : ''

  const composeAnimation = (state, animation, index) => {
    if (animation.curve === 'spring') {
      return composeSpring(animation, index)
    } else if (state.isReactNative) {
      return composeTiming(animation, index)
    }
  }

  const composeSpring = (animation, index) =>
    `if (props.${animation.scope} !== next.${animation.scope}) {
      Animated.spring(this.animatedValue${index}, {
        toValue: next.${animation.scope} ? 1 : 0,
        stiffness: ${animation.stiffness},
        damping: ${animation.damping},
        delay: ${animation.delay},
        useNativeDriver: true
      }).start()
    }`

  const composeTiming = (animation, index) =>
    `if (props.${animation.scope} !== next.${animation.scope}) {
      Animated.timing(this.animatedValue${index}, {
        toValue: next.${animation.scope} ? 1 : 0,
        duration: ${animation.duration},
        delay: ${animation.delay},
        useNativeDriver: true
      }).start()
    }`

  const composeValues = (state, animation, index) => {
    if (animation.curve === 'timing' && !state.isReactNative) return
    return `animatedValue${index} = new Animated.Value(this.props.${
      animation.scope
    } ? 1 : 0)
    `
  }

  const maybeAnimated =
    state.isAnimated || state.hasAnimatedChild
      ? `${state.animations
          .map((animation, index) => {
            return isNewScope(state, animation, index)
              ? composeValues(
                  state,
                  animation,
                  getScopeIndex(state, animation.scope)
                )
              : ''
          })
          .join('')}
      componentWillReceiveProps(next) {
          const { props } = this
          ${state.animations
            .map(animation =>
              composeAnimation(
                state,
                animation,
                getScopeIndex(state, animation.scope)
              )
            )
            .join('')}
        }`
      : ''

  if (maybeState || maybeTracking || maybeAnimated) {
    return `class ${name} extends React.Component {
  ${maybeState}
  ${maybeTracking}
  ${maybeAnimated}

  render() {
    const { ${maybeTracking ? 'context,' : ''} props, ${
      maybeState ? 'state' : ''
    } } = this
    ${maybeChildrenArray}
    return (${render})
  }
}`
  } else {
    return `const ${name} = (props ${maybeTracking ? ', context' : ''}) => {
  ${maybeChildrenArray}
  return (${render})
}`
  }
}
