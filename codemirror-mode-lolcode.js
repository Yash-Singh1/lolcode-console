// Brought from lol-cm by @markwatkinson: https://github.com/markwatkinson/lol-cm/blob/master/lolcode.js

"use strict";

/**
 * Bugs/problems/shortcomings/todo list:
 * 1. Highlight escape sequences in strings.
 * 2. Better indentation. Don't unindent an 'OIC' if there is no 'HOW DUZ I'
 *    open, etc.
 * 3. We can and should detect some errors.
 */

CodeMirror.defineMode('lolcode', function(config, parserConfig) {
    var p = {
        lit: {
            num: /-?\d+(\.\d+)?\b/,
            truf: /(WIN|FAIL)\b/,
            noob: /(NOOB|NOTHIN)\b/
        },
        yarn: {
            d: /"([^":]+|\:.)*"?/,
            s: /'([^':]+|\:.)*'?/,
        },
        type: /(NUMBA?R|TROOF|YARN|NOOB|BUKKIT)\b/,
        // we're not doing anything smart enough to warrant treating any of these
        // separately so we'll mash it into one regex.
        ops: new RegExp(
            '(' +
                '((BIGG?R|SMALL?R)\\s+THAN)|' +
                '(' +
                    '(SUM|DIFF|PRODUKT|QUOSHUNT|MOD|BIGGR|SMALLR|BOTH|' +
                    'EITHER|WON|ALL|ANY|CHR|ORD)\\s+OF' +
                ')|' +
                '(BOTH\\s+SAEM)|' +
                'DIFFRINT|NOT|UPPIN|NERFIN' +
            ')\\b|[!?,]'
        ),
        kw: {
            // We don't do anything smart with these either
            misc: new RegExp('(' +
                'HAI|KTHXBYE|' +
                '(IT[ZS](\\s+GOT)?)|(I\\s+HAS\\s+A)|' +
                'A|AN|MKAY|R|YR|(FOUND\\s+YR)|(O\\s+NVM)|GTFO|WILE|' +
                'MAEK|(IS\\s+NOW\\s+A)|' +
                'G[IE]MMEH|VISIBLE|' +
                '(PLZ\\s+HALP)' +
                ')\\b'
            ),
            HOWDUZI: /HOW\s+DUZ\s+I\b/,
            IFUSAYSO: /IF\s+U\s+SAY\s+SO\b/,
            ORLY: /O\s+RLY\?|IZ\b/,
            YARLY: /YA\s+RLY\b/,
            OIC: /OIC\b/,
            MEBBE: /MEBBE\b/,
            NOWAI: /NO\s+WAI\b/,
            IMINYR: /IM\s+IN\s+YR\b/,
            IMOUTTAYR: /IM\s+OUTTA\s+YR\b/,
            WTF: /WTF\?/,
            OMG: /OMG(WTF)?\b/,
            KTHX: /KTHX\b/
        },
        builtIns: new RegExp('(' +
            'SMOOSH' +
            ')\\b'
        ),
        comment: {
            sl: /BTW.*/,
            ml: {
                // split block comments so we can continue matching when
                // a multiline comment is unterminated and the user
                // continues adding lines
                start: /OBTW/,
                middle: /[\s\S]*/,
                end: /[\s\S]*?TLDR/
            }
        },
        ident: /[a-z_][a-z0-9_]*/i
    };

    function matches(stream, state, patterns) {
        for (var i = 0; i < patterns.length; i++) {
            if (stream.match(patterns[i])) {
                return patterns[i];
            }
        }
        return false;
    }

    function matchComment(stream, state) {
        if (stream.match(p.comment.sl)) { return true; }
        if (stream.match(p.comment.ml.start)) {
            // If the comment isn't terminated we need to still be able to
            // continue the tokenization when the user adds text.
            state.next = function(stream, state) {
                if (!stream.match(p.comment.ml.end)) {
                    stream.match(p.comment.ml.middle);
                }
                else {
                    state.next = tokenBase;
                }
                return 'comment';
            };
            return true;
        }
        return false;
    }

    function matchLiteral(stream, state) {
        var ret = false;
        if (stream.match(p.lit.num)) { ret = 'number' }
        if (stream.match(p.lit.truf) || stream.match(p.lit.noob)) {
            ret = 'atom';
        }
        return ret;
    }

    function matchYarn(stream, state) {
        return stream.match(p.yarn.s) || stream.match(p.yarn.d);
    }

    function matchKeyword(stream, state) {
        
        if (stream.match(p.kw.HOWDUZI)) {
            state.indent();
            return true
        }
        else if (stream.match(p.kw.IFUSAYSO)) {
            state.dedent();
            return true;
        }
        else if (stream.match(p.kw.KTHX)) {
            state.dedent();
            return true;
        }
        else if (matches(stream, state, [p.kw.misc, p.kw.MEBBE, p.kw.NOWAI])) {
            return true;
        }
        else if (stream.match(p.kw.WTF)) {
            state.omgIndents = true;
            state.indent();
            return true;
        }
        else if (stream.match(p.kw.OMG)) {
            if (state.omgIndents) {
                state.indent();
                state.omgIndents = false;
            }
            return true;
        }
        else if (matches(stream, state, [p.kw.ORLY, p.kw.YARLY, p.kw.IMINYR])) {
            state.indent();
            return true;
        }
        else if (stream.match(p.kw.IMOUTTAYR)) {
            state.dedent();
            return true;
        }
        else if (stream.match(p.kw.OIC)) {
            state.dedent();
            state.dedent();
            return true;
        }
        return false;
    }


    function tokenBase(stream, state) {
        var t;
        if (stream.eatSpace()) {
            return null;
        }
        else if (matchComment(stream, state)) {
            return 'comment';
        }

        else if (matchKeyword(stream, state)) {
            return 'keyword';
        }
        else if (stream.match(p.ops)) {
            return 'operator';
        }
        else if ((t = matchLiteral(stream, state))) {
            return t;
        }
        else if (matchYarn(stream, state)) {
            return 'string';
        }
        else if (stream.match(p.type) || stream.match(p.builtIns)) {
            return 'builtin';
        }
        else if (stream.match(p.ident)) {
            return 'identifier';
        }
        
        else {
            stream.next();
            return null;
        }
    }

    // Top level function.
    function token(stream, state) {
        return state.next(stream, state);
    }


    var State = function() {
        this.next = tokenBase;
        this.currentIndent = 0;
        this.omgIndents = false;
    }
    State.prototype.indent = function() {
        this.currentIndent++;
    };
    State.prototype.dedent = function() {
        this.currentIndent = Math.max(0, this.currentIndent - 1);
    };


    return {
        startState: function() {
            return new State();
        },
        token: token,
        indent: function(state, after) {
            var unit = config.indentUnit;
            var dedenters = [
                p.kw.IFUSAYSO,
                p.kw.MEBBE,
                p.kw.NOWAI,
                p.kw.IMOUTTAYR,
                p.kw.KTHX
            ];
            if (matches(after, state, dedenters)) {
                state.dedent();
            }
            else if (!state.omgIndents && after.match(p.kw.OMG)) {
                state.dedent();
            }
            else if(after.match(p.kw.OIC)) {
                state.dedent();
                state.dedent();
            }
            return state.currentIndent * unit;
        },
        // if u say sO
        // oiC
        // mebbE
        // no waI
        // omG
        // omgwtF
        // kthX
        // im outta yR
        electricChars: 'OCEIGFXR',
        lineComment: 'BTW',
        blockCommentStart: 'OBTW',
        blockCommentEnd: 'TLDR'
    };
});

CodeMirror.defineMIME("text/lolcode", "lolcode");