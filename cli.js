#!/usr/bin/env node

const { readFileSync, statSync } = require('fs')
const { morph, parse, pathToName } = require('./lib.js')
const chalk = require('chalk')
const watch = require('./watch.js')
const morphInlineSvg = require('./morph/inline-svg.js')

let {
  _,
  as,
  bundleBaseCss: isBundlingBaseCss,
  compile,
  help,
  local,
  logic,
  pretty,
  track,
  watch: shouldWatch,
  verbose,
  version,
  warnOfDefaultValue,
} = require('minimist')(process.argv.slice(2), {
  alias: {
    help: 'h',
  },
  booleans: ['help', 'track', 'watch', 'version'],

  default: {
    as: 'react-dom',
    compile: false,
    bundleBaseCss: false,
    local: 'en',
    logic: true,
    pretty: true,
    track: false,
    verbose: true,
    version: false,
    warnOfDefaultValue: false,
    watch: false,
  },
})

track = track === 'true'

if (help) {
  console.log(`
  views-morph [file or directory]
    --as            target platform
                      react-dom (default)
                      react-native
                      e2e

    --compile       if true, produces ES5 JS, defaults to false
    --bundleBaseCss if true, it will bundle the base CSS in react-dom,
                      otherwise you will need to include it in your
                      build system as a .css file. Defaults to false
    --local         default local language, defaults to English (en)
    --logic         if true, it includes .view.logic.js files in
                      the output, defaults to true
    --pretty        format output code, defaults to true
    --track         enable UI tracking, defaults to false
    --verbose       defaults to true
    --version       print the version
    --watch         watch a directory and produce .view.js files
    --warnOfDefaultValue defaults to false
  `)

  process.exit()
}

if (version) {
  const pkg = require('./package.json')
  console.log(`v${pkg.version}`)
  process.exit()
}

const input = Array.isArray(_) && _[0]
if (!input) {
  console.error(
    'You need to specify an input file. Eg run views-morph some.view'
  )
  process.exit()
}

if (shouldWatch) {
  if (!statSync(input).isDirectory()) {
    console.error(
      `You need to specify an input directory to watch. ${input} is a file.`
    )
    process.exit()
  }

  const updateNotifier = require('update-notifier')
  const pkg = require('./package.json')

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
    compile,
    isBundlingBaseCss,
    local,
    logic,
    pretty,
    src: input,
    track,
    verbose,
    warnOfDefaultValue,
  })
} else {
  if (statSync(input).isDirectory()) {
    watch({
      as,
      compile,
      isBundlingBaseCss,
      local,
      logic,
      once: true,
      pretty,
      src: input,
      track,
      verbose,
      warnOfDefaultValue,
    })
  } else {
    if (input.includes('.svg')) {
      return morphInlineSvg(input).then(code => console.log(code))
    } else {
      const name = pathToName(input)

      const { code } = morph({
        as,
        compile,
        file: { raw: input, relative: input },
        local,
        name,
        pretty,
        track,
        views: {
          [name]: parse({ source: readFileSync(input, 'utf-8') }),
        },
      })

      console.log(code)
    }
  }
}
