import { promises as fs } from 'fs'
import fsExtra from 'fs-extra'
import getViewRelativeToView from './get-view-relative-to-view.js'
import prettier from 'prettier'
import path from 'path'

function ensureFirstStoryIsOn(flow, key, stories) {
  if (!stories.has(key)) return

  let story = flow.get(key)
  if (story.stories.size > 0) {
    let index = 0
    for (let id of story.stories) {
      if (index === 0 || !story.isSeparate) {
        stories.add(id)
      }
      index++
      ensureFirstStoryIsOn(flow, id, stories)
    }
  }
}

function getTopStory(flow) {
  for (let [key, value] of flow) {
    if (value.parent === '') return key
  }
}

let makeFlow = ({ tools, viewsById, viewsToFiles }) => {
  let flowMap = new Map()
  let flowMapStr = []

  for (let view of viewsToFiles.values()) {
    if (view.custom || !view.parsed.view.isStory) continue

    let states = []
    for (let id of view.parsed.view.views) {
      let viewInView = getViewRelativeToView({
        id,
        view,
        viewsById,
        viewsToFiles,
      })

      if (!viewInView.custom && viewInView.parsed.view.isStory) {
        states.push(viewInView.parsed.view.pathToStory) // `${pathToViewId}/${id}`)
      }
    }

    let isSeparate = view.parsed.view.flow === 'separate'
    let parent = view.parsed.view.pathToStory.replace(
      new RegExp(`/${view.id}$`),
      ''
    )

    flowMapStr.push(
      `["${view.parsed.view.pathToStory}", {
        parent: "${parent}",
        isSeparate: ${isSeparate},
        stories: new Set(${states.length > 0 ? JSON.stringify(states) : ''})
      }]`
    )
    flowMap.set(view.parsed.view.pathToStory, {
      parent,
      isSeparate,
      stories: new Set(states),
    })
  }

  let topStory = getTopStory(flowMap)
  let initialState = new Set([topStory])
  ensureFirstStoryIsOn(flowMap, topStory, initialState)

  return `// This file is automatically generated by Views and will be overwritten
// when the morpher runs. If you want to contribute to how it's generated, eg,
// improving the algorithms inside, etc, see this:
// https://github.com/viewstools/morph/blob/master/ensure-flow.js

import React, { useCallback, useContext, useEffect, useState } from 'react'
${tools ? "import useTools from './useTools.js'" : ''}

let GetFlow = React.createContext(new Set())
let SetFlow = React.createContext(() => {})

export let useFlow = () => useContext(GetFlow)
export let useSetFlow = () => useContext(SetFlow)

export let flow = new Map([${flowMapStr.join(', ')}])

let TOP_STORY = "${topStory}"

function ensureFirstStoryIsOn(key, stories) {
  if (!stories.has(key)) return

  let story = flow.get(key)
  if (story.stories.size > 0) {
    let index = 0
    let canAdd = intersection(stories, story.stories).size === 0
    for (let id of story.stories) {
      if ((canAdd && index === 0) || !story.isSeparate) {
        stories.add(id)
      }
      index++
      ensureFirstStoryIsOn(id, stories)
    }
  }
}

function ensureParents(key, stories) {
  let story = flow.get(key)
  if (!story.parent) return

  stories.add(story.parent)
  ensureParents(story.parent, stories)
}

function getAllChildrenOf(key, children) {
  if (!flow.has(key)) return

  let story = flow.get(key)
  for (let id of story.stories) {
    children.add(id)
    getAllChildrenOf(id, children)
  }
}


let intersection = (a, b) => new Set([...a].filter(ai => b.has(ai)))
let difference = (a, b) => new Set([...a].filter(ai => !b.has(ai)))

function getNextFlow(key, state) {
  if (state.has(key)) return state

  let next = new Set([key])

  ensureFirstStoryIsOn(key, next)
  ensureParents(key, next)

  let diffIn = difference(next, state)
  let diffOut = new Set()

  difference(state, next).forEach(id => {
    let story = flow.get(id)
    if (state.has(story.parent)) {
      let parent = flow.get(story.parent)
      if (intersection(parent.stories, diffIn).size > 0) {
        diffOut.add(id)
        let children = new Set()
        getAllChildrenOf(id, children)
        children.forEach(cid => diffOut.add(cid))
      }
    }
  })

  let nextState = new Set([...difference(state, diffOut), ...diffIn])
  ensureFirstStoryIsOn(TOP_STORY, nextState)
  return new Set([...nextState].sort())
}

export function Flow(props) {
  let [state, setState] = useState(${
    tools ? 'new Set()' : 'props.initialState'
  })
  ${
    tools
      ? `let [maybeInitialState, sendToTools] = useTools(setState)
useEffect(() => setState(maybeInitialState || props.initialState), []) // eslint-disable-line`
      : ''
  }

  let setFlow = useCallback(
    id => {
      if (process.env.NODE_ENV === 'development') {
        console.debug('setFlow', id)

        if (!flow.has(id)) {
          throw new Error(
            \`Story "$\{id}" doesn't exist. Valid stories are $\{[...flow.keys()]}.\`
          )
        }
      }

      setState(state => getNextFlow(id, state))
    },
    []
  )

  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      if (state.size > 0) {
        console.debug('flow', state)
        ${tools ? "sendToTools({ type: 'client:flow', flow: [...state] })" : ''}
      }
    }
  }, [state${tools ? ', sendToTools' : ''}])

  return (
    <SetFlow.Provider value={setFlow}>
      <GetFlow.Provider value={state}>{props.children}</GetFlow.Provider>
    </SetFlow.Provider>
  )
}

Flow.defaultProps = {
  initialState: new Set(${JSON.stringify([...initialState], null, '  ')})
}`
}

let TOOLS_FILE = `export default function useTools() {
  console.log(\`



  😱😱😱😱😱😱😱😱😱😱😱



  🚨 You're missing out!!!

  🚀 Views Tools can help you find product market fit before you run out of money.

  ✨ Find out how 👉 https://views.tools





  \`)

  return [null, () => {}]
}`

async function ensureTools(src) {
  let toolsFile = path.join(src, 'useTools.js')

  if (await fsExtra.exists(toolsFile)) return

  return fs.writeFile(toolsFile, TOOLS_FILE, 'utf8')
}

export default async function ensureFlow({
  src,
  tools,
  viewsById,
  viewsToFiles,
}) {
  await ensureTools(src)

  return fs.writeFile(
    path.join(src, 'useFlow.js'),
    prettier.format(makeFlow({ tools, viewsById, viewsToFiles }), {
      parser: 'babel',
      singleQuote: true,
      trailingComma: 'es5',
    }),
    'utf8'
  )
}
