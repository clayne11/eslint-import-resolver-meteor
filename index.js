var resolve = require('resolve')
  , path = require('path')
  , assign = require('object-assign')
  , fs = require('fs')

exports.interfaceVersion = 2

exports.resolve = function (source, file, config) {
  if (resolve.isCore(source)) return { found: true, path: null }

  if (source.startsWith('meteor/')) {
    var meteorRoot = findMeteorRoot(file);
    return resolveMeteorPackage(source, meteorRoot);
  }

  var meteorSource = source;
  if (source.startsWith('/')) {
    var meteorRoot = findMeteorRoot(file);
    meteorSource = path.resolve(meteorRoot, source.substr(1));
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

function packageFilter(pkg, path, relativePath) {
  if (pkg['jsnext:main']) {
    pkg['main'] = pkg['jsnext:main']
  }
  return pkg
}

function findMeteorRoot(start) {
  start = start || module.parent.filename
  if (typeof start === 'string') {
    if (start[start.length-1] !== path.sep) {
      start+=path.sep
    }
    start = start.split(path.sep)
  }
  if(!start.length) {
    throw new Error('package.json not found in path')
  }
  start.pop()
  var dir = start.join(path.sep)
  try {
    fs.statSync(path.join(dir, '.meteor'));
    return dir;
  } catch (e) {}
  return findMeteorRoot(start)
}

function resolveMeteorPackage(source, meteorRoot) {
  var versionPath = path.join(meteorRoot, '.meteor', 'versions');
  try {
    var versionFile = fs.readFileSync(versionPath);
    var versions = versionFile.toString();
    var package = source.split('/')[1];
    var found = new RegExp('^' + package + '@', 'm').test(versions);
    return {found: found, path: null};
  } catch (e) {
    return {found: false};
  }
}
