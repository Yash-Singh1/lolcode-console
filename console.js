window.ihasjs = module.exports;
let runs = 0;
window.editor = CodeMirror.fromTextArea(document.getElementById('promptTextarea'), {
  mode: 'lolcode',
  autoCloseBrackets: true,
});
let prevVal;
function evalCallback(output, exception = {}) {
  $('.prompt').before(
    `<span class="output${exception.isWarning ? ' warning' : exception.isError || exception.isException ? ' error' : ''}">${
      exception.isError || exception.isWarning
        ? exception.description
        : exception.isException
        ? exception.value
        : `<textarea class="output${runs}">${output}</textarea>`
    }</span>`
  );
  if (!exception.isError && !exception.isWarning && !exception.isException) {
    CodeMirror.fromTextArea(document.querySelector('.output' + runs), {
      readOnly: 'nocursor',
      mode: 'javascript',
    });
  }
}
editor.addKeyMap({
  Enter: function (cm) {
    if (cm.getValue().trim().length !== 0) {
      let compilerError;
      const compiled = ihasjs(cm.getValue(), (error, warning, out) => {
        if (error) {
          compilerError = [1, error];
        } else if (warning) {
          compilerError = [0, warning];
        }
        return out;
      });
      $('.prompt').before(`<span class="log"><textarea class="logTextarea${runs}">${cm.getValue()}</textarea></span>`);
      if (compilerError) {
        evalCallback(null, { isWarning: compilerError[0] === 0, isError: true, description: compilerError[1] });
      } else {
        chrome.devtools.inspectedWindow.eval(compiled, null, evalCallback);
      }
      CodeMirror.fromTextArea(document.querySelector('.logTextarea' + runs), {
        readOnly: 'nocursor',
        mode: 'lolcode',
      });
      prevVal = cm.getValue();
      cm.setValue('');
      cm.focus();
      ++runs;
    }
  },
  Up: function (cm) {
    if (cm.getCursor().line === 0 && cm.getCursor().ch === 0 && runs > 0) {
      cm.setValue(prevVal);
      cm.setCursor(prevVal.length);
    } else {
      cm.execCommand('goLineUp');
    }
  },
  'Ctrl-/': 'toggleComment'
});
editor.focus();
