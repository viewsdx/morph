// This file is automatically generated by Views and will be overwritten
// when the morpher runs. If you want to contribute to how it's generated, eg,
// improving the algorithms inside, etc, see this:
// https://github.com/viewstools/morph/blob/master/ensure-data.js
import * as fromValidate from './validate.js'
import * as fromFormat from './format.js'
import { normalizePath, useSetFlowTo, useFlow } from 'Logic/ViewsFlow.js'
// import get from 'dlv';
import get from 'lodash/get'
import produce from 'immer'
// import set from 'dset';
import set from 'lodash/set'
import React, {
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
} from 'react'

let SET = 'data/SET'
let SET_FN = 'data/SET_FN'
let RESET = 'data/RESET'
let FORCE_REQUIRED = 'data/FORCE_REQUIRED'
let IS_SUBMITTING = 'data/IS_SUBMITTING'
let reducer = produce((draft, action) => {
  switch (action.type) {
    case SET: {
      set(draft, action.path, action.value)
      break
    }

    case SET_FN: {
      action.fn(draft, set, get)
      break
    }

    case RESET: {
      return action.value
    }

    case IS_SUBMITTING: {
      draft._isSubmitting = action.value
      break
    }

    case FORCE_REQUIRED: {
      draft._forceRequired = true
      draft._isSubmitting = false
      break
    }

    default: {
      throw new Error(
        `Unknown action type "${action.type}" in useData reducer.`
      )
    }
  }
})

let DataContexts = {
  default: React.createContext([]),
}
export function DataProvider(props) {
  if (process.env.NODE_ENV === 'development') {
    if (!props.context) {
      log({
        type: 'views/data/missing-context-value',
        viewPath: props.viewPath,
        message: `You're missing the context value in DataProvider. Eg: <DataProvider context="namespace" value={value}>. You're using the default one now instead.`,
      })
    }
  }
  if (!(props.context in DataContexts)) {
    DataContexts[props.context] = React.createContext([])
    DataContexts[props.context].displayName = props.context
  }
  let Context = DataContexts[props.context]
  let _value = props.value

  if (process.env.NODE_ENV === 'development') {
    if (
      props.viewPath &&
      sessionStorage?.getItem('ViewsDataKeepContextValues')
    ) {
      let key = `${props.context}:${props.viewPath}`
      let cache = sessionStorage.getItem(`ViewsDataContextValues:${key}`)
      _value = cache ? JSON.parse(cache) : _value
    }
  }

  let [_state, dispatch] = useReducer(reducer, _value)
  let [state, setState] = useReducer((_, s) => s, _value)
  let listeners = useRef([])
  function registerListener(listener) {
    listeners.current.push(listener)
    listener(_state, state)
    return () => {
      listeners.current = listeners.current.filter((l) => l !== listener)
    }
  }

  useEffect(() => {
    if (state === _state) return

    listeners.current.forEach((listener) => {
      listener(_state, state)
    })
    setState(_state)
  }, [_state, state])

  // track a reference of state so that any call to onSubmit gets the latest
  // state even if it changed through the execution
  let stateRef = useRef(state)
  useEffect(() => {
    stateRef.current = state
  }, [state])

  let isSubmitting = useRef(false)
  let shouldCallOnChange = useRef(false)

  useEffect(() => {
    if (isSubmitting.current) return

    shouldCallOnChange.current = false

    let _value = props.value
    if (process.env.NODE_ENV === 'development') {
      if (
        props.viewPath &&
        sessionStorage?.getItem('ViewsDataKeepContextValues')
      ) {
        let key = `${props.context}:${props.viewPath}`
        let cache = sessionStorage.getItem(`ViewsDataContextValues:${key}`)
        _value = cache ? JSON.parse(cache) : _value
      }
    }

    dispatch({ type: RESET, value: _value })
  }, [props.value]) // eslint-disable-line
  // ignore dispatch

  function _onChange(value, changePath = props.context) {
    if (typeof value === 'function') {
      dispatch({ type: SET_FN, fn: value })
    } else if (!changePath) {
      dispatch({ type: RESET, value })
    } else {
      dispatch({
        type: SET,
        path: changePath,
        value,
      })
    }
  }

  // keep track of props.onChange outside of the following effect to
  // prevent loops. Making the function useCallback didn't work
  let onSubmit = useRef(props.onSubmit)
  useEffect(() => {
    onSubmit.current = props.onSubmit
  }, [props.onSubmit])

  async function _onSubmit(args) {
    if (isSubmitting.current) return
    isSubmitting.current = true

    try {
      dispatch({ type: IS_SUBMITTING, value: true })
      let res = await onSubmit.current({
        value: stateRef.current,
        args,
        onChange: _onChange,
      })
      isSubmitting.current = false

      if (!res) {
        dispatch({ type: IS_SUBMITTING, value: false })
        return
      }
    } catch (error) {
      isSubmitting.current = false
    }

    dispatch({ type: FORCE_REQUIRED })
  }

  let value = useMemo(
    () => [state, dispatch, _onSubmit, _value, registerListener],
    [state, _value] // eslint-disable-line
  ) // ignore registerListener

  // keep track of props.onChange outside of the following effect to
  // prevent loops. Making the function useCallback didn't work
  let onChange = useRef(props.onChange)
  useEffect(() => {
    onChange.current = props.onChange
  }, [props.onChange])

  useEffect(() => {
    if (!shouldCallOnChange.current) {
      shouldCallOnChange.current = true
      return
    }

    if (process.env.NODE_ENV === 'development') {
      if (
        props.viewPath &&
        sessionStorage?.getItem('ViewsDataKeepContextValues')
      ) {
        let key = `${props.context}:${props.viewPath}`
        sessionStorage.setItem(
          `ViewsDataContextValues:${key}`,
          JSON.stringify(state)
        )
      }
    }

    onChange.current(state, (fn) => dispatch({ type: SET_FN, fn }))
  }, [state]) // eslint-disable-line
  // ignore props.context, props.viewPath

  return <Context.Provider value={value}>{props.children}</Context.Provider>
}
DataProvider.defaultProps = {
  context: 'default',
  onChange: () => {},
  onSubmit: () => {},
}

export function useDataListener({
  // path = null,
  context = 'default',
  // viewPath = null,
  listener,
} = {}) {
  let [, , , , registerListener] = useContext(DataContexts[context])

  return useEffect(() => {
    return registerListener(listener)
  }, []) // eslint-disable-line
}

export function useData({
  path = null,
  context = 'default',
  formatIn = null,
  formatOut = null,
  validate = null,
  validateRequired = false,
  viewPath = null,
} = {}) {
  let [data, dispatch, onSubmit, originalValue] = useContext(
    DataContexts[context]
  )
  let touched = useRef(false)

  let [value, isValidInitial, isValid] = useMemo(() => {
    let rawValue = path ? get(data, path) : data

    let value = rawValue
    if (path && formatIn) {
      try {
        value = fromFormat[formatIn](rawValue, data)
      } catch (error) {
        if (process.env.NODE_ENV === 'development') {
          log({
            type: 'views/data/runtime-formatIn',
            viewPath,
            context,
            formatIn,
            message: `"${formatIn}" function failed to run on Data/format.js.`,
            error,
          })
        }
      }
    }

    let isValidInitial = true
    if (validate) {
      try {
        isValidInitial = !!fromValidate[validate](rawValue, value, data)
      } catch (error) {
        if (process.env.NODE_ENV === 'development') {
          log({
            type: 'views/data/runtime-validate',
            viewPath,
            context,
            validate,
            message: `"${validate}" function failed to run on Data/validate.js.`,
            error,
          })
        }
      }
    }
    let isValid =
      touched.current || (validateRequired && data._forceRequired)
        ? isValidInitial
        : true

    return [value, isValidInitial, isValid]
  }, [data, formatIn, path, validate, validateRequired]) // eslint-disable-line
  // ignore context and viewPath

  let memo = useMemo(
    () => {
      if (!data) return {}

      function onChange(value, changePath = path) {
        touched.current = true

        if (typeof value === 'function') {
          dispatch({ type: SET_FN, fn: value })
        } else if (!changePath) {
          dispatch({ type: RESET, value })
        } else {
          let valueSet = value
          if (formatOut) {
            try {
              valueSet = fromFormat[formatOut](value, data)
            } catch (error) {
              if (process.env.NODE_ENV === 'development') {
                log({
                  type: 'views/data/runtime-formatOut',
                  viewPath,
                  context,
                  formatOut,
                  message: `"${formatIn}" function failed to run on Data/format.js.`,
                  error,
                })
              }
            }
          }

          dispatch({
            type: SET,
            path: changePath,
            value: valueSet,
          })
        }
      }

      return {
        onChange,
        onSubmit,
        value,
        originalValue,
        isSubmitting: data._isSubmitting,
        isValid,
        isValidInitial,
        isInvalid: !isValid,
        isInvalidInitial: !isValidInitial,
      }
    },
    // eslint-disable-next-line
    [
      dispatch,
      path,
      value,
      isValidInitial,
      isValid,
      formatOut,
      data?._isSubmitting, // eslint-disable-line
      onSubmit,
    ]
  )
  // ignore data - this can cause rendering issues though

  if (process.env.NODE_ENV === 'development') {
    // source: https://github.com/TheWWWorm/proxy-mock/blob/master/index.js
    function getProxyMock(
      specifics = {
        value: 'proxyString',
      },
      name = 'proxyMock',
      wrap
    ) {
      function _target() {
        getProxyMock()
      }

      let target = wrap ? wrap(name, _target) : _target

      target[Symbol.toPrimitive] = (hint) => {
        if (hint === 'string') {
          return 'proxyString'
        } else if (hint === 'number') {
          return 42
        }
        return '1337'
      }
      target[Symbol.iterator] = function* () {
        yield getProxyMock({}, `${name}.Symbol(Symbol.iterator)`, wrap)
      }

      return new Proxy(target, {
        get(obj, key) {
          key = key.toString()
          if (key === 'text') {
            return 'proxyString'
          }
          if (specifics.hasOwnProperty(key)) {
            return specifics[key]
          }
          if (key === 'Symbol(Symbol.toPrimitive)') {
            return obj[Symbol.toPrimitive]
          }
          if (key === 'Symbol(Symbol.iterator)') {
            return obj[Symbol.iterator]
          }
          if (!obj.hasOwnProperty(key)) {
            obj[key] = getProxyMock({}, `${name}.${key}`, wrap)
          }
          return obj[key]
        },
        apply() {
          return getProxyMock({}, `${name}`, wrap)
        },
      })
    }

    if (!(context in DataContexts)) {
      log({
        type: 'views/data/missing-data-provider',
        viewPath,
        context,
        message: `"${context}" isn't a valid Data context. Add a <DataProvider context="${context}" value={data}> in the component that defines the context for this view. You're using a mock now.`,
      })
      return getProxyMock()
    }

    if (!data) {
      log({
        type: 'views/data/missing-data-for-provider',
        viewPath,
        context,
        message: `"${context}" doesn't have data. Consider turning on session caching of ViewsData with window.ViewsDataKeepContextValues(). You're using a mock now.`,
        ViewsDataKeepContextValues: window.ViewsDataKeepContextValues,
      })
      return getProxyMock()
    }

    if (formatIn && !(formatIn in fromFormat)) {
      log({
        type: 'views/data/invalid-formatIn',
        viewPath,
        context,
        formatIn,
        message: `"${formatIn}" function doesn't exist or is not exported in Data/format.js. You're using a mock now.`,
      })
      return getProxyMock()
    }

    if (formatOut && !(formatOut in fromFormat)) {
      log({
        type: 'views/data/invalid-formatOut',
        viewPath,
        context,
        formatOut,
        message: `"${formatOut}" function doesn't exist or is not exported in Data/format.js. You're using a mock now.`,
      })
      return getProxyMock()
    }

    if (validate && !(validate in fromValidate)) {
      log({
        type: 'views/data/invalid-validate',
        viewPath,
        context,
        validate,
        message: `"${validate}" function doesn't exist or is not exported in Data/validators.js. You're using a mock now.`,
      })
      return getProxyMock()
    }
  }

  return memo
}

if (process.env.NODE_ENV === 'development') {
  window.ViewsDataKeepContextValues = function (keep = true) {
    if (keep) {
      sessionStorage.setItem('ViewsDataKeepContextValues', true)
    } else {
      sessionStorage.removeItem('ViewsDataKeepContextValues')
    }
  }
}

export function useSetFlowToBasedOnData({
  context,
  data,
  fetching,
  error,
  viewPath,
  pause = false,
}) {
  let flow = useFlow()
  let setFlowTo = useSetFlowTo(viewPath, true)
  let contentPath = useMemo(() => {
    if (flow.flow[viewPath] === 'Content') {
      let result = Object.entries(flow.flow).find(([key]) =>
        key.includes(`${viewPath}/Content`)
      )
      if (result) {
        let [key, value] = result
        return `${key.replace(`${viewPath}/`, '')}/${value}`
      }
    }

    return 'Content'
  }, [])

  useEffect(() => {
    let view = contentPath
    if (error) {
      view = 'Error'
    } else if (pause && !data) {
      view = 'No'
    } else if (fetching) {
      view = 'Loading'
    } else if (isEmpty(context, data)) {
      view = 'Empty'
    }

    // TODO do we need No? I think we need it, even if it is used once only
    // otherwise we'll need to render any of the other states
    setFlowTo(normalizePath(viewPath, view))
  }, [data, error]) // eslint-disable-line
  // ignore setFlowTo and props.viewPath
}

function isEmpty(context, data) {
  if (!data) return true
  let value = data[context]
  return Array.isArray(value) ? value.length === 0 : !value
}

let logQueue = []
let logTimeout = null
function log(stuff) {
  logQueue.push(stuff)
  clearTimeout(logTimeout)
  logTimeout = setTimeout(() => {
    if (logQueue.length > 0) {
      console.log({
        type: 'views/data',
        warnings: logQueue,
      })
      logQueue = []
    }
  }, 500)
}
