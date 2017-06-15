import * as $_____lib_oop from '../lib/oop'
import * as $____text from './text'
import * as $____csharp_highlight_rules from './csharp_highlight_rules'
import * as $____matching_brace_outdent from './matching_brace_outdent'
import * as $____behaviour_cstyle from './behaviour/cstyle'
import * as $____folding_csharp from './folding/csharp'

var oop = $_____lib_oop
var TextMode = $____text.Mode
var CSharpHighlightRules = $____csharp_highlight_rules.CSharpHighlightRules
var MatchingBraceOutdent = $____matching_brace_outdent.MatchingBraceOutdent
var CstyleBehaviour = $____behaviour_cstyle.CstyleBehaviour
var CStyleFoldMode = $____folding_csharp.FoldMode

export var Mode = function() {
  this.HighlightRules = CSharpHighlightRules
  this.$outdent = new MatchingBraceOutdent()
  this.$behaviour = new CstyleBehaviour()
  this.foldingRules = new CStyleFoldMode()
}
oop.inherits(Mode, TextMode)
;(function() {
  this.lineCommentStart = '//'
  this.blockComment = { start: '/*', end: '*/' }

  this.getNextLineIndent = function(state, line, tab) {
    var indent = this.$getIndent(line)

    var tokenizedLine = this.getTokenizer().getLineTokens(line, state)
    var tokens = tokenizedLine.tokens

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
  }

  this.checkOutdent = function(state, line, input) {
    return this.$outdent.checkOutdent(line, input)
  }

  this.autoOutdent = function(state, doc, row) {
    this.$outdent.autoOutdent(doc, row)
  }

  this.createWorker = function(session) {
    return null
  }

  this.$id = 'ace/mode/csharp'
}.call(Mode.prototype))
