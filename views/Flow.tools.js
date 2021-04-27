// This file is automatically generated by Views and will be overwritten
// when the morpher runs. If you want to contribute to how it's generated, eg,
// improving the algorithms inside, etc, see this:
// https://github.com/viewstools/morph/blob/master/ensure-flow.js

import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
} from 'react'
import ViewsTools from './Tools.js'

export let flowDefinition = {}
let FLOW_KEY_WITH_ARGUMENTS = /\(.+?\)/g
export function isFlowKeyWithArguments(item) {
  return FLOW_KEY_WITH_ARGUMENTS.test(item)
}
export function getFlowDefinitionKey(key) {
  return key.replace(FLOW_KEY_WITH_ARGUMENTS, '')
}
export function getFlowDefinition(key) {
  return flowDefinition[getFlowDefinitionKey(key)]
}

export function getParentView(key) {
  let parentBits = key.split('/')
  let view = parentBits.pop()
  let parent = parentBits.join('/')
  return [parent, view]
}

function findSeparateParentAndView(key) {
  if (!key || key === '/') return [null, null]

  let [parent, view] = getParentView(key)
  let parentFlowDefinitionKey = getFlowDefinitionKey(parent)
  return parentFlowDefinitionKey in flowDefinition
    ? [parent, view]
    : findSeparateParentAndView(parent)
}

function makeRemovedRegexAlternatives(keys) {
  return keys.map((key) => `${key}$|${key}/|${key}\\(`).join('|')
}

function getNextFlowWithoutKeys(removed, flow) {
  if (removed.length === 0) return flow

  let removedRegex = new RegExp(`^(${makeRemovedRegexAlternatives(removed)})`)

  return Object.fromEntries(
    Object.entries(flow).filter(([key]) => !removedRegex.test(key))
  )
}

export function getNextFlow(rkeys, rflow) {
  let keys = Array.isArray(rkeys) ? rkeys : [rkeys]
  if (keys.length === 0) return rflow

  let flow = { ...rflow }
  let removed = []
  keys.forEach((key) => {
    let [parent, view] = findSeparateParentAndView(key)
    while (parent && view) {
      let viewCurrent = flow[parent]
      if (viewCurrent !== view) {
        // TODO maybe use map [parent, view] and Object.fromEntries joining it
        // with the keys that stay after removing them
        flow[parent] = view

        if (viewCurrent) {
          removed.push(`${parent}/${viewCurrent}`)
        }
      }

      ;[parent, view] = findSeparateParentAndView(parent)
    }
  })

  return getNextFlowWithoutKeys(removed, flow)
}

let MAX_ACTIONS = 10000
let SYNC = 'flow/SYNC'
let SET = 'flow/SET'
let SET_BUFFERED = 'flow/SET_BUFFERED'
let FLOW_MAP_CHANGE = 'flow/FLOW_MAP_CHANGE'

let Context = React.createContext([{ actions: [], flow: {} }, () => {}])
export function useFlowState() {
  return useContext(Context)[0]
}
export function useFlow() {
  let state = useFlowState()

  return useMemo(
    () => ({
      has: (key) => {
        if (!key) return false

        // active view in flow
        let [parent, view] = getParentView(key)
        let value = state.flow[parent]
        if (value === view) return true
        if (typeof value === 'string') return false

        // FIXME HACK: check for a definition key instead of the arguments
        // version of it because Tools doesn't understand list items on the
        //  flow just yet and sets the flow to the definition key instead
        if (isFlowKeyWithArguments(key)) {
          let definitionKey = getFlowDefinitionKey(key)
          let [parent, view] = getParentView(definitionKey)
          let value = state.flow[parent]
          if (value === view) return true
          if (typeof value === 'string') return false
        }

        // first view defined on the flow
        let parentFlowDefinition = getFlowDefinition(parent)
        return (
          Array.isArray(parentFlowDefinition) &&
          parentFlowDefinition[0] === view
        )
      },
      flow: state.flow,
    }),
    [state.flow]
  )
}

let useSetFlowToBuffer = {}
let useSetFlowToTimeout = null

export function useSetFlowTo(source, buffer = false) {
  let [, dispatch] = useContext(Context)

  return useCallback((target, data = null) => {
    if (buffer) {
      useSetFlowToBuffer[source] = target

      clearTimeout(useSetFlowToTimeout)
      useSetFlowToTimeout = setTimeout(() => {
        useSetFlowToTimeout = null

        let targets = Object.values(useSetFlowToBuffer)
        useSetFlowToBuffer = {}

        dispatch({ type: SET_BUFFERED, targets })
      }, 25)
    } else {
      dispatch({ type: SET, target, source, data })
    }
  }, []) // eslint-disable-line
  // ignore dispatch
}

function getNextActions(state, action) {
  return [action, ...state.actions].slice(0, MAX_ACTIONS)
}

function reducer(state, action) {
  switch (action.type) {
    case SYNC: {
      console.debug({
        type: 'views/flow/sync',
        id: action.id,
        flow: action.flow,
      })

      // FIXME HACK: filter keys that may have been set by lists on the app
      // because Tools doesn't understand list items on the flow just yet and
      // sets the flow to the definition key instead
      let flow = { ...action.flow }
      Object.keys(action.flow)
        .filter(isFlowKeyWithArguments)
        .map((item) => [item, getFlowDefinitionKey(item)])
        .filter(([, key]) => key in action.flow)
        .forEach(([item]) => delete flow[item])

      return {
        flow,
        actions: getNextActions(state, {
          target: action.id,
          source: action.id,
          data: null,
        }),
      }
    }

    case SET: {
      if (process.env.NODE_ENV === 'development') {
        console.debug({
          type: 'views/flow/set',
          target: action.target,
          source: action.source,
          data: action.data,
        })

        let [definitionKey, definitionView] = getParentView(
          getFlowDefinitionKey(action.target)
        )
        if (
          !flowDefinition[definitionKey] ||
          !flowDefinition[definitionKey].includes(definitionView)
        ) {
          console.error({
            type: 'views/flow/invalid-view',
            target: action.target,
            source: action.source,
            definitionKey,
            definitionView,
            flowDefinition,
          })
          return state
        }

        if (ViewsTools.SYNC_ONE_WAY) {
          if (action.target.startsWith(ViewsTools.SYNC_ONE_WAY)) {
            let flow = getNextFlow(action.target, state.flow)
            if (flow === state.flow) {
              return state
            } else {
              return {
                flow,
                actions: state.actions,
              }
            }
          } else {
            return state
          }
        }
      }

      if (
        state.actions.length > 0 &&
        state.actions[0].target === action.target
      ) {
        if (process.env.NODE_ENV === 'development') {
          console.debug({
            type: 'views/flow/already-set-as-last-action-ignoring',
            target: action.target,
            actions: state.actions,
            source: action.source,
          })
        }
        return state
      }

      let flow = getNextFlow(action.target, state.flow)

      if (flow === state.flow) {
        return state
      } else {
        return {
          flow,
          // TODO this might be too verbose for an analytics layer
          actions: getNextActions(state, {
            target: action.target,
            source: action.source,
            data: action.data,
          }),
        }
      }
    }

    case SET_BUFFERED: {
      console.debug({
        type: 'views/flow/set-buffered',
        targets: action.targets,
      })

      let invalidTargets = action.targets
        .map((target) => {
          let [definitionKey, definitionView] = getParentView(
            getFlowDefinitionKey(target)
          )
          if (
            !flowDefinition[definitionKey] ||
            !flowDefinition[definitionKey].includes(definitionView)
          ) {
            return {
              target,
              definitionKey,
              definitionView,
            }
          }

          return false
        })
        .filter(Boolean)

      if (invalidTargets.length > 0) {
        console.error({
          type: 'views/flow/invalid-view',
          invalidTargets,
          flowDefinition,
          source: action.source,
        })
        return state
      }

      return {
        flow: getNextFlow(action.targets, state.flow),
        // TODO not sure if we need to do something else with this
        actions: state.actions,
      }
    }

    case FLOW_MAP_CHANGE: {
      return {
        flow: { ...state.flow },
        actions: state.actions,
      }
    }

    default: {
      throw new Error(`Unknown action "${action.type}" in Flow`)
    }
  }
}

export function ViewsFlow(props) {
  let context = useReducer(reducer, { actions: [], flow: props.initialState })
  let [state, dispatch] = context

  useEffect(() => {
    if (typeof props.onChange === 'function') {
      props.onChange(state)
    }
  }, [state]) // eslint-disable-line
  // ignore props.onChange

  return (
    <Context.Provider value={context}>
      <ViewsTools
        flow={context}
        onFlowMapChange={(next) => {
          flowDefinition = next
          dispatch({ type: FLOW_MAP_CHANGE })
        }}
      >
        {props.children}
      </ViewsTools>
    </Context.Provider>
  )
}

ViewsFlow.defaultProps = {
  initialState: {},
}

export function normalizePath(viewPath, relativePath) {
  let url = new URL(`file://${viewPath}/${relativePath}`)
  return url.pathname
}