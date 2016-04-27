var resolve = require('resolve')
  , path = require('path')
  , assign = require('object-assign')

exports.interfaceVersion = 2

exports.resolve = function (source, file, config) {
  if (resolve.isCore(source)) return { found: true, path: null }

  var meteorSource = source;
  if (source.startsWith('/')) {
    meteorSource = path.resolve(config.root, source.substr(1));
  }

  try {
    return { found: true, path: resolve.sync(meteorSource, opts(file, config)) }
  } catch (err) {
    return { found: false }
  }
}

function opts(file, config) {
  return assign({},
    config,
    {
      // path.resolve will handle paths relative to CWD
      basedir: path.dirname(path.resolve(file)),
      packageFilter: packageFilter,

    })
}

function packageFilter(pkg) {
  if (pkg['jsnext:main']) {
    pkg['main'] = pkg['jsnext:main']
  }
  return pkg
}
