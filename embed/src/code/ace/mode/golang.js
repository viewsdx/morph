import * as $_____lib_oop from '../lib/oop'
import * as $____text from './text'
import * as $____golang_highlight_rules from './golang_highlight_rules'
import * as $____matching_brace_outdent from './matching_brace_outdent'
import * as $____behaviour_cstyle from './behaviour/cstyle'
import * as $____folding_cstyle from './folding/cstyle'

var oop = $_____lib_oop
var TextMode = $____text.Mode
var GolangHighlightRules = $____golang_highlight_rules.GolangHighlightRules
var MatchingBraceOutdent = $____matching_brace_outdent.MatchingBraceOutdent
var CstyleBehaviour = $____behaviour_cstyle.CstyleBehaviour
var CStyleFoldMode = $____folding_cstyle.FoldMode

export var Mode = function() {
  this.HighlightRules = GolangHighlightRules
  this.$outdent = new MatchingBraceOutdent()
  this.foldingRules = new CStyleFoldMode()
  this.$behaviour = new CstyleBehaviour()
}
oop.inherits(Mode, TextMode)
;(function() {
  this.lineCommentStart = '//'
  this.blockComment = { start: '/*', end: '*/' }

  this.getNextLineIndent = function(state, line, tab) {
    var indent = this.$getIndent(line)

    var tokenizedLine = this.getTokenizer().getLineTokens(line, state)
    var tokens = tokenizedLine.tokens
    var endState = tokenizedLine.state

    if (tokens.length && tokens[tokens.length - 1].type == 'comment') {
      return indent
    }

    if (state == 'start') {
      var match = line.match(/^.*[\{\(\[]\s*$/)
      if (match) {
        indent += tab
      }
    }

    return indent
  } //end getNextLineIndent

  this.checkOutdent = function(state, line, input) {
    return this.$outdent.checkOutdent(line, input)
  }

  this.autoOutdent = function(state, doc, row) {
    this.$outdent.autoOutdent(doc, row)
  }

  this.$id = 'ace/mode/golang'
}.call(Mode.prototype))
