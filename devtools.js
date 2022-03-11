chrome.devtools.panels.create('LOLCODE Console', 'icons/lolcode256.png', 'console.html', function (panel) {
  panel.onShown.addListener((givenWindow) => {
    if (givenWindow.editor) givenWindow.editor.focus();
  });
});
