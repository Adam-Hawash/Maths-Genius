/* U-1 verification: decode \uXXXX double-escapes exactly like the fixed lib */
function repairUnicode(input) {
  var s = String(input)
  s = s.replace(/\\u([0-9a-fA-F]{4})/g, function (_m, hex) {
    return String.fromCharCode(parseInt(hex, 16))
  })
  s = s.replace(/(^|[^0-9a-fA-F])([uU])([0-9a-fA-F]{4})/g, function (_m, pre, _u, hex) {
    var cp = parseInt(hex, 16)
    var inBlock =
      (cp >= 0x00A0 && cp <= 0x00FF) || (cp >= 0x0370 && cp <= 0x03FF) ||
      (cp >= 0x2010 && cp <= 0x2027) || (cp >= 0x2030 && cp <= 0x205E) ||
      (cp >= 0x2100 && cp <= 0x214F) || (cp >= 0x2150 && cp <= 0x218F) ||
      (cp >= 0x2190 && cp <= 0x21FF) || (cp >= 0x2200 && cp <= 0x22FF) ||
      (cp >= 0x2300 && cp <= 0x23FF) || (cp >= 0x2460 && cp <= 0x24FF) ||
      (cp >= 0x2500 && cp <= 0x25FF) || (cp >= 0x2600 && cp <= 0x26FF) ||
      (cp >= 0x2700 && cp <= 0x27BF) || false
    if (!inBlock) return _m
    return pre + String.fromCharCode(cp)
  })
  return s
}

var cases = [
  // [input, expected] — exact strings from the teacher's screenshots
  ['Simplify to its simplest form: u221b48 + u221b27 + \u221a75', 'Simplify to its simplest form: \u221b48 + \u221b27 + \u221a75'],
  ['If X = ]-2, 2[, Y = [1, 4], find using the number line: X - Y, Y - X, Xu222aY, Xu2229Y', 'If X = ]-2, 2[, Y = [1, 4], find using the number line: X - Y, Y - X, X\u222aY, X\u2229Y'],
  ['If a u2208 ]2, 5[, which of the following can be the value of a?', 'If a \u2208 ]2, 5[, which of the following can be the value of a?'],
  // with-backslash variants (stored escape intact)
  ['Simplify: \\u221b48 + \\u221b27', 'Simplify: \u221b48 + \u221b27'],
  ['X \\u222a Y, X \\u2229 Y', 'X \u222a Y, X \u2229 Y'],
  ['\\u03c0 = 3.14', '\u03c0 = 3.14'],
  // never-touch cases (ordinary text / LaTeX / hex runs / non-symbol codepoints)
  ['The value of u22ab is not part of this question', 'The value of u22ab is not part of this question'], // wait — 22ab IS math (∫ small)? actually U+22AB ∈ math block → SHOULD decode
]

// fix case 7 expectation: 0x22AB is in math block → decodes
cases[6] = ['The value of u22ab stays', 'The value of \u22ab stays']

var extra = [
  // ordinary words must NEVER change
  ['Use the formula u = 12', 'Use the formula u = 12'],
  ['Ubuntu 2022 release', 'Ubuntu 2022 release'],
  ['bu22ed remains', 'bu22ed remains'],            // hex char before u → skipped
  ['Q7: factor u2225 to get', 'Q7: factor \u2225 to get'],
  ['\\frac{1}{2} + 0.5 = 1', '\\frac{1}{2} + 0.5 = 1'], // LaTeX untouched
  ['x^2 + y^2 = r^2', 'x^2 + y^2 = r^2'],
  ['empty string test', 'empty string test'],
  ['U2122 trademark', '\u2122 trademark'],
  ['U+221B written with plus', 'U+221B written with plus'], // plus breaks the pattern
]

var all = cases.concat(extra)
var pass = 0, fail = 0
all.forEach(function (c, i) {
  var got = repairUnicode(c[0])
  if (got === c[1]) { pass++ }
  else { fail++; console.log('FAIL #' + i, JSON.stringify(c[0]), '→', JSON.stringify(got), 'expected', JSON.stringify(c[1])) }
})
console.log('U-1 tests: ' + pass + ' passed, ' + fail + ' failed')
process.exit(fail ? 1 : 0)
