import getAnimatedValue from './get-animated-value.js'
import getBody from './get-body.js'
import getContext from './get-context.js'
import getDefaultProps from './get-default-props.js'
import getDependencies from './get-dependencies.js'
import getFormatters from './get-formatters.js'
import getLocals from './get-locals.js'

export default ({ getImport, getStyles, name, state }) => {
  // TODO Emojis should be wrapped in <span>, have role="img", and have an accessible description
  // with aria-label or aria-labelledby  jsx-a11y/accessible-emoji
  return `/* eslint-disable jsx-a11y/accessible-emoji, no-unused-vars */
import React from 'react'
${getDependencies(state, getImport)}
${getAnimatedValue(state, name)}
${getStyles(state, name)}
${getFormatters(state, name)}
${getLocals(state, name)}

${getBody({ state, name })}
${getContext({ state, name })}
${getDefaultProps({ state, name })}
export default ${name}`
}
