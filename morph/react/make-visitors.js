import {
  asScopedValue,
  checkParentStem,
  xCheckParentStem,
  getObjectAsString,
  getProp,
  getPropertiesAsObject,
  getStyleType,
  hasDefaultProp,
  isCode,
  isStyle,
  isToggle,
} from '../utils.js'
import makeToggle from './make-toggle.js'
import safe from './safe.js'
import toPascalCase from 'to-pascal-case'
import wrap from './wrap.js'

export default ({
  getBlockName,
  getStyleForProperty,
  getValueForProperty,
  isValidPropertyForBlock,
  PropertiesClassName,
  PropertiesStyleLeave,
}) => {
  const BlockName = {
    enter(node, parent, state) {
      const name = getBlockName(node, parent, state)
      if (name === null) return this.skip()

      const dynamicStyles = node.properties.list.filter(
        item => item.tags.style && item.value.value.match(/props./)
      )
      const hasHoverStem = node.properties.list.filter(
        item => getStyleType(item) === 'hover'
      )
      const hasMatchingParent = parent ? checkParentStem(node, 'hover') : false

      node.isDynamic =
        dynamicStyles.length > 0 || (hasMatchingParent && hasHoverStem)
          ? true
          : false
      node.name.finalValue = name
      state.render.push(`<${name} ${node.isDynamic ? 'isDynamic' : ''}`)
    },
    leave(node, parent, state) {
      if (
        (!parent && node.blocks) ||
        node.explicitChildren ||
        (node.blocks && node.blocks.list.length > 0)
      ) {
        if (!parent && node.blocks) {
          if (node.blocks.list.length === 0) {
            state.render.push('>')
          }

          if (!node.usesProxy) {
            state.render.push(`{props.children}`)
          }
        }
        state.render.push(`</${node.name.finalValue}>`)
      } else {
        state.render.push('/>')
      }
    },
  }

  const BlockProxy = {
    enter(node, parent, state) {
      if (node.name.value !== 'Proxy') return

      let prevParent = parent
      while (prevParent) {
        if (prevParent.type === 'Block' && !prevParent.parent) {
          prevParent.usesProxy = true
        }
        prevParent = prevParent.parent
      }

      if (!node.properties) return

      let proxied = node.properties.list.find(p => p.key.value === 'from')
      if (!proxied) return
      proxied = proxied.value.value

      const otherProperties = node.properties.list.filter(
        p => p.key.value !== 'from' && p.key.value !== 'when'
      )

      if (!node.when) {
        state.render.push('{')
      }

      if (proxied === 'all') {
        const childContent =
          otherProperties.length > 0
            ? `React.Children.map(props.children, child => React.cloneElement(child, ${getPropertiesAsObject(
                otherProperties
              )}))`
            : 'props.children'

        state.render.push(childContent)
      } else {
        if (!node.when) {
          state.render.push('props.childrenProxyMap && ')
        }
        const child = `childrenArray[props.childrenProxyMap['${proxied}']]`

        if (otherProperties.length > 0) {
          if (node.when) {
            if (state.render[state.render.length - 1].endsWith(' ? ')) {
              state.render[state.render.length - 1] = state.render[
                state.render.length - 1
              ].replace(' ? ', ' && ')
            }
          }

          state.render.push(
            ` ${child} ? React.cloneElement(${child}, ${getPropertiesAsObject(
              otherProperties
            )}) : null`
          )
        } else {
          state.render.push(child)
        }

        state.usesChildrenArray = true
      }

      state.render.push('}')

      this.skip()
    },
  }

  const BlockWhen = {
    enter(node, parent, state) {
      // when lets you show/hide blocks depending on props
      const when = getProp(node, 'when')
      if (when) {
        node.when = true

        if (parent && parent.parent.name.value !== 'List')
          state.render.push('{')

        state.render.push(`${when.value.value} ? `)
      }
    },
    leave(node, parent, state) {
      if (node.when) {
        state.render.push(` : null`)
        if (parent && parent.parent.name.value !== 'List')
          state.render.push('}')
      }
    },
  }

  const BlockExplicitChildren = {
    leave(node, parent, state) {
      if (node.explicitChildren) {
        state.render.push('>')
        state.render.push(node.explicitChildren)
      }
    },
  }

  const BlockMaybeNeedsProperties = {
    enter(node, parent, state) {
      const name = node.name.value

      if (
        !node.properties &&
        (name === 'Vertical' || name === 'List' || name === 'Horizontal')
      ) {
        node.properties = {
          type: 'Properties',
          list: [
            {
              type: 'Property',
              loc: {},
              key: {
                type: 'Literal',
                value: 'flexDirection',
                valueRaw: 'flexDirection',
                loc: {},
              },
              value: {
                type: 'Literal',
                loc: {},
                value: name === 'Horizontal' ? 'row' : 'column',
              },
              meta: {},
              tags: {
                style: true,
              },
            },
          ],
        }
      }

      // fake properites so that our childrenProxyMap gets picked up in case
      // there are no custom props
      if (node.childrenProxyMap && !node.properties) {
        node.properties = {
          type: 'Properties',
          list: [],
        }
      }
    },
  }

  const BlocksList = {
    enter(node, parent, state) {
      if (parent.name.value === 'List') {
        let from = getProp(parent, 'from')
        if (!from) return

        from = from.value.value

        state.render.push(
          `{Array.isArray(${from}) && ${from}.map((item, index) => `
        )

        node.list.forEach(n => (n.isInList = true))
      }
    },
    leave(node, parent, state) {
      if (parent.name.value === 'List') {
        state.render.push(')}')
      }
    },
  }

  const BlockRoute = {
    enter(node, parent, state) {
      const at = getProp(node, 'at')
      if (at) {
        let [path, isExact = false] = at.value.value.split(' ')
        state.use('Route')

        if (path === '/') state.use('Router')

        if (!path.startsWith('/')) {
          path = isCode(path) ? `\`\${${path}}\`` : path
          // path = `\`\${props.match.url}/${to}\``
        }

        node.isRoute = true
        state.render.push(
          `<Route path=${safe(path)} ${isExact
            ? 'exact'
            : ''} render={routeProps => `
        )
      }
    },
    leave(node, parent, state) {
      if (node.isRoute) {
        state.render.push('} />')
      }
    },
  }

  const PropertiesChildrenProxyMap = {
    leave(node, parent, state) {
      if (parent.childrenProxyMap) {
        state.render.push(
          ` childrenProxyMap={${getObjectAsString(parent.childrenProxyMap)}}`
        )
      }
    },
  }

  const PropertiesListKey = {
    leave(node, parent, state) {
      if (parent.isInList && !node.hasKey && !parent.wrapEnd) {
        state.render.push(' key={index}')
      }
    },
  }

  const PropertiesRoute = {
    leave(node, parent, state) {
      if (parent.isRoute) {
        state.render.push(' {...routeProps}')
      }
    },
  }

  const PropertiesStyle = {
    enter(node, parent, state) {
      node.style = {
        dynamic: {
          base: {},
          active: {},
          hover: {},
          focus: {},
          activeHover: {},
          disabled: {},
          placeholder: {},
          print: {},
        },
        static: {
          base: {},
          active: {},
          hover: {},
          focus: {},
          activeHover: {},
          disabled: {},
          placeholder: {},
          print: {},
        },
      }

      const name = parent.name.value
      if (name === 'Vertical' || name === 'List') {
        node.style.static.base.flexDirection = 'column'
      } else if (name === 'Horizontal') {
        node.style.static.base.flexDirection = 'row'
      }
    },
    leave: PropertiesStyleLeave,
  }

  const PropertyList = {
    enter(node, parent, state) {
      // block is inside List
      if (parent.parent.isInList && node.key.value === 'key') {
        parent.hasKey = true
      }
    },
  }

  const PropertyRest = {
    enter(node, parent, state) {
      if (
        !parent.skip &&
        !(node.key.value === 'from' && parent.parent.name.value === 'List')
      ) {
        // TODO remove toggle
        if (isToggle(node)) {
          const propToToggle = node.tags.toggle
          const functionName = `toggle${toPascalCase(propToToggle)}`
          state.remap[propToToggle] = {
            body: makeToggle(functionName, propToToggle),
            fn: functionName,
          }
          state.render.push(` ${node.key.value}={props.${functionName}}`)
          return
        }

        // if (node.key.value === 'onSubmit') {
        //   state.render.push(
        //     ` ${node.key.value}={() => ${node.value.value}(state)}`
        //   )
        //   return
        // }

        const value = getValueForProperty(node, parent, state)

        if (value) {
          Object.keys(value).forEach(k =>
            state.render.push(` ${k}=${value[k]}`)
          )
        }
      }
    },
  }

  const PropertyStyle = {
    enter(node, parent, state) {
      let styleForProperty, isScopedVal, _isProp
      if (isStyle(node) && parent.parent.isBasic && !parent.parent.isSvg) {
        const code = isCode(node)

        if (parent.parent.scoped.hasOwnProperty(node.key.value)) {
          isScopedVal = true

          styleForProperty = {
            [node.key.value]: asScopedValue(
              parent.parent.scoped[node.key.value],
              node,
              parent
            ),
          }
        } else {
          ;({ _isProp, ...styleForProperty } = getStyleForProperty(
            node,
            parent,
            code
          ))
        }

        if (_isProp) {
          Object.keys(styleForProperty).forEach(k =>
            state.render.push(` ${k}=${safe(styleForProperty[k], node)}`)
          )
        } else {
          const hasMatchingParent = parent.parent.parent
            ? checkParentStem(parent.parent.parent, getStyleType(node))
            : false
          const target =
            code || isScopedVal || hasMatchingParent
              ? parent.style.dynamic
              : parent.style.static
          Object.assign(target[getStyleType(node)], styleForProperty)
        }

        return true
      }
    },
  }

  const PropertyText = {
    enter(node, parent, state) {
      if (node.key.value === 'text' && parent.parent.name.value === 'Text') {
        if (parent.parent.scoped.text) {
          parent.parent.explicitChildren = wrap(
            asScopedValue(parent.parent.scoped.text, node, parent)
          )
        } else {
          parent.parent.explicitChildren = isCode(node)
            ? wrap(node.value.value)
            : node.value.value
        }

        return true
      }
    },
  }

  return {
    BlockExplicitChildren,
    BlockMaybeNeedsProperties,
    BlockName,
    BlockProxy,
    BlockRoute,
    BlockWhen,

    Block: {
      // TODO List without wrapper?
      enter(node, parent, state) {
        BlockWhen.enter.call(this, node, parent, state)
        BlockRoute.enter.call(this, node, parent, state)
        BlockName.enter.call(this, node, parent, state)
        BlockMaybeNeedsProperties.enter.call(this, node, parent, state)
        BlockProxy.enter.call(this, node, parent, state)
      },
      leave(node, parent, state) {
        BlockExplicitChildren.leave.call(this, node, parent, state)
        BlockName.leave.call(this, node, parent, state)
        BlockRoute.leave.call(this, node, parent, state)
        BlockWhen.leave.call(this, node, parent, state)
      },
    },

    Blocks: {
      enter(node, parent, state) {
        if (node.list.length > 0) state.render.push('>')
        BlocksList.enter.call(this, node, parent, state)
      },
      leave(node, parent, state) {
        BlocksList.leave.call(this, node, parent, state)
      },
    },

    Properties: {
      enter(node, parent, state) {
        if (PropertiesClassName) {
          PropertiesClassName.enter.call(this, node, parent, state)
        }
        PropertiesStyle.enter.call(this, node, parent, state)
      },
      leave(node, parent, state) {
        PropertiesStyle.leave.call(this, node, parent, state)
        PropertiesListKey.leave.call(this, node, parent, state)
        PropertiesRoute.leave.call(this, node, parent, state)
        PropertiesChildrenProxyMap.leave.call(this, node, parent, state)
        if (PropertiesClassName) {
          PropertiesClassName.leave.call(this, node, parent, state)
        }
      },
    },

    Property: {
      enter(node, parent, state) {
        const key = node.key.value
        if (
          key === 'at' ||
          key === 'when' ||
          (!isValidPropertyForBlock(node, parent, state) &&
            parent.parent.isBasic) ||
          (node.tags.scope && node.tags.scope !== 'props.isDisabled') ||
          (node.inScope && hasDefaultProp(node, parent)) ||
          (state.debug && key === 'ref')
        )
          return

        // if (PropertyData.enter.call(this, node, parent, state)) return
        if (PropertyStyle.enter.call(this, node, parent, state)) return
        if (PropertyText.enter.call(this, node, parent, state)) return
        PropertyList.enter.call(this, node, parent, state)
        PropertyRest.enter.call(this, node, parent, state)
      },
    },

    Fonts(list, state) {
      state.fonts = list
    },

    Todos(list, state) {
      state.todos = list
    },
  }
}
