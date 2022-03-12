#!/bin/bash

set -e

echo -n 'Cleaning Up...' && rm -rf dist.zip && echo 'done'
echo 'Zipping...' && echo && zip -r dist.zip ./ -i '*.js' '*.html' 'manifest.json' 'package.json' 'README.md' 'LICENSE' 'icons/*' 'node_modules/codemirror/lib/codemirror.css' 'console.css' -x 'node_modules/jquery/src/*' 'node_modules/jquery/external/*' 'node_modules/codemirror/keymap/*' 'node_modules/lolcode/tests/*' 'node_modules/codemirror/src/*' && echo && echo 'DONE!!!'
