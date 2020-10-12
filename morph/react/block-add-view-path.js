export let enter = (node, parent, state) => {
  if (node.isFragment) return

  if (state.viewPath) {
    state.render.push(` ${state.viewPathKey}="${state.viewPath}"`)
  } else {
    state.render.push(` ${state.viewPathKey}={props["${state.viewPathKey}"]}`)
  }
}
