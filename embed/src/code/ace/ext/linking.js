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

import * as $__ace_editor from 'ace/editor'
import * as $_____config from '../config'

var Editor = $__ace_editor.Editor

$_____config.defineOptions(Editor.prototype, 'editor', {
  enableLinking: {
    set: function(val) {
      if (val) {
        this.on('click', onClick)
        this.on('mousemove', onMouseMove)
      } else {
        this.off('click', onClick)
        this.off('mousemove', onMouseMove)
      }
    },
    value: false,
  },
})

function onMouseMove(e) {
  var editor = e.editor
  var ctrl = e.getAccelKey()

  if (ctrl) {
    var editor = e.editor
    var docPos = e.getDocumentPosition()
    var session = editor.session
    var token = session.getTokenAt(docPos.row, docPos.column)

    editor._emit('linkHover', { position: docPos, token: token })
  }
}

function onClick(e) {
  var ctrl = e.getAccelKey()
  var button = e.getButton()

  if (button == 0 && ctrl) {
    var editor = e.editor
    var docPos = e.getDocumentPosition()
    var session = editor.session
    var token = session.getTokenAt(docPos.row, docPos.column)

    editor._emit('linkClick', { position: docPos, token: token })
  }
}
