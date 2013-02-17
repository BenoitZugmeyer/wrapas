
write () {
    buildname=$1
    filename=$2
    mkdir -p dist/$buildname
    cat > dist/$buildname/$filename'.js'
}

echo "
`cat lib/immediate.js`
exports.setImmediate = setImmediate;
exports.clearImmediate = clearImmediate;
" | write node immediate

echo "
var immediate = require('./immediate');
var setImmediate = immediate.setImmediate;
var clearImmediate = immediate.clearImmediate;
`cat lib/wrapas.js`
module.exports = wrapas;
" | write node wrapas

echo "
`cat lib/immediate.js`
`cat lib/wrapas.js`
" | write browser-full wrapas

echo "
define(function () {
  `cat lib/immediate.js`
  return {
    setImmediate: setImmediate,
    clearImmediate: clearImmediate
  };
});
" | write amd immediate

echo "
define(['./immediate'], function (immediate) {
  var setImmediate = immediate.setImmediate;
  var clearImmediate = immediate.clearImmediate;
  `cat lib/wrapas.js`
  return wrapas;
});
" | write amd wrapas
