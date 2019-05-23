#!/usr/bin/env node --experimental-modules --experimental-json-modules

import { promises as fs } from 'fs'
import chalk from 'chalk'
import cleanup from './clean.js'
import minimist from 'minimist'
import watch from './watch.js'
import updateNotifier from 'update-notifier'
import pkg from './package.json'
;(async function() {
  let {
    _,
    as,
    clean,
    help,
    local,
    track,
    watch: shouldWatch,
    verbose,
    version,
  } = minimist(process.argv.slice(2), {
    alias: {
      help: 'h',
    },
    booleans: ['clean', 'help', 'track', 'watch', 'version'],

    default: {
      as: 'react-dom',
      clean: false,
      local: 'en',
      track: false,
      verbose: true,
      version: false,
      watch: false,
    },
  })

  track = track === 'true'

  if (help) {
    console.log(`
  views-morph [directory]
    --as            target platform
                      react-dom (default)
                      react-native
    --clean         clean the autogenerated .view.js files
    --local         default local language, defaults to English (en)
    --track         enable UI tracking, defaults to false
    --verbose       defaults to true
    --version       print the version
    --watch         watch a directory and produce .view.js files
  `)

    process.exit()
  }

  if (version) {
    console.log(`v${pkg.version}`)
    process.exit()
  }

  let input = Array.isArray(_) && _[0]

  if (!input || !(await fs.stat(input)).isDirectory()) {
    console.error(
      `You need to specify an input directory to watch. ${input} is a file.`
    )
    process.exit()
  }

  if (clean) {
    console.log(`Cleaning up ${input}...`)
    await cleanup(input)
    process.exit()
  }

  updateNotifier({ pkg }).notify()

  console.log(`Views Tools morpher v${pkg.version}\n\n`)

  console.log(
    `Will morph files at '${chalk.green(input)}' as ${chalk.green(as)} ${
      track ? 'with tracking' : 'without tracking'
    }\n`
  )
  console.log(chalk.yellow('A'), ' = Added')
  console.log(chalk.blue('D'), ` = View deleted`)
  console.log(chalk.green('M'), ` = Morphed`)
  console.log(chalk.red('M'), ` = Morph failed`)
  console.log(chalk.magenta('!'), ` = View doesn't exist but is being used`)
  console.log(chalk.magenta('X'), ` = View name is invalid`)
  console.log('\n\nPress', chalk.blue('ctrl+c'), 'to stop at any time.\n\n')

  watch({
    as,
    local,
    once: !shouldWatch,
    src: input,
    track,
    verbose,
  })
})()
