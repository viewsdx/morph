/* ***** BEGIN LICENSE BLOCK *****
 * Distributed under the BSD license:
 *
 * Copyright (c) 2010, Ajax.org B.V.
 * All rights reserved.
 * 
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met:
 *     * Redistributions of source code must retain the above copyright
 *       notice, this list of conditions and the following disclaimer.
 *     * Redistributions in binary form must reproduce the above copyright
 *       notice, this list of conditions and the following disclaimer in the
 *       documentation and/or other materials provided with the distribution.
 *     * Neither the name of Ajax.org B.V. nor the
 *       names of its contributors may be used to endorse or promote products
 *       derived from this software without specific prior written permission.
 * 
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
 * ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL AJAX.ORG B.V. BE LIABLE FOR ANY
 * DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
 * (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
 * LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
 * ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
 * SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 *
 * ***** END LICENSE BLOCK ***** */

import * as $_____lib_oop from '../lib/oop'
import * as $____text from './text'
import * as $____less_highlight_rules from './less_highlight_rules'
import * as $____matching_brace_outdent from './matching_brace_outdent'
import * as $____behaviour_css from './behaviour/css'
import * as $____css_completions from './css_completions'
import * as $____folding_cstyle from './folding/cstyle'

var oop = $_____lib_oop
var TextMode = $____text.Mode
var LessHighlightRules = $____less_highlight_rules.LessHighlightRules
var MatchingBraceOutdent = $____matching_brace_outdent.MatchingBraceOutdent
var CssBehaviour = $____behaviour_css.CssBehaviour
var CssCompletions = $____css_completions.CssCompletions

var CStyleFoldMode = $____folding_cstyle.FoldMode

export var Mode = function() {
  this.HighlightRules = LessHighlightRules
  this.$outdent = new MatchingBraceOutdent()
  this.$behaviour = new CssBehaviour()
  this.$completer = new CssCompletions()
  this.foldingRules = new CStyleFoldMode()
}
oop.inherits(Mode, TextMode)
;(function() {
  this.lineCommentStart = '//'
  this.blockComment = { start: '/*', end: '*/' }

  this.getNextLineIndent = function(state, line, tab) {
    var indent = this.$getIndent(line)

    // ignore braces in comments
    var tokens = this.getTokenizer().getLineTokens(line, state).tokens
    if (tokens.length && tokens[tokens.length - 1].type == 'comment') {
      return indent
    }

    var match = line.match(/^.*\{\s*$/)
    if (match) {
      indent += tab
    }

    return indent
  }

  this.checkOutdent = function(state, line, input) {
    return this.$outdent.checkOutdent(line, input)
  }

  this.autoOutdent = function(state, doc, row) {
    this.$outdent.autoOutdent(doc, row)
  }

  this.getCompletions = function(state, session, pos, prefix) {
    // CSS completions only work with single (not nested) rulesets
    return this.$completer.getCompletions('ruleset', session, pos, prefix)
  }

  this.$id = 'ace/mode/less'
}.call(Mode.prototype))
