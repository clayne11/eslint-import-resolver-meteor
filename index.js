const resolve = require('resolve');
const path = require('path');
const fs = require('fs');

const notNodeModuleRe = /^(\.|\/)/
const clientRe = /\/client(\/|$)/
const serverRe = /\/server(\/|$)/
const packageNameRe = /name:[\s]*["']([a-z0-9A-Z\:\-_]+)["']/;
exports.interfaceVersion = 2


let packageCacheTimeout = 5 * 60 * 1000;
let cacheUpdatedAt = new Date(0);
let packageCache = [];
let cachedMeteorRoot;
let localPackageCache = [];

exports.resolve = function (source, file, config) {

  const meteorDir = config && config.meteorDir;
  if (resolve.isCore(source)) {
    return { found: true, path: null }
  }

  if (source.startsWith('meteor/')) {
    if (!cachedMeteorRoot) {
      cachedMeteorRoot = findMeteorRoot(file, meteorDir);
    }
    return resolveMeteorPackage(source, cachedMeteorRoot);
  }

  let meteorSource = source;
  if (source.startsWith('/')) {
    const meteorRoot = findMeteorRoot(file, meteorDir);
    meteorSource = path.resolve(meteorRoot, source.substr(1));
  }

  const fileUsingSlash = file.split(path.sep).join('/')
  if (!isNodeModuleImport(source) && (isClientInServer(source, fileUsingSlash) || isServerInClient(source, fileUsingSlash))) {
    return { found: false };
  }

  try {
    return { found: true, path: resolve.sync(meteorSource, opts(file, config)) };
  } catch (err) {
    return { found: false };
  }
}

function opts(file, config) {
  return Object.assign({},
    config,
    {
      // path.resolve will handle paths relative to CWD
      basedir: path.dirname(path.resolve(file)),
      packageFilter: packageFilter,
    });
}

function packageFilter(pkg, path, relativePath) {
  if (pkg['jsnext:main']) {
    pkg['main'] = pkg['jsnext:main'];
  }
  return pkg;
}

function findMeteorRoot(start, meteorDir = '') {
  meteorDir = meteorDir || '';

  start = start || module.parent.filename;

  if (typeof start === 'string') {
    if (start[start.length - 1] !== path.sep) {
      start += path.sep;
    }
    start = start.split(path.sep);
  }

  if (!start.length) {
    throw new Error('.meteor not found in path');
  }
  start.pop();
  const dir = start.join(path.sep);

  try {
    fs.statSync(path.join(dir, meteorDir, '.meteor'));
    return path.join(dir, meteorDir);
  } catch (e) { }
  return findMeteorRoot(start, meteorDir);
}

function isNodeModuleImport(source) {
  return !notNodeModuleRe.test(source);
}

function isClientInServer(source, file) {
  return serverRe.test(source) && clientRe.test(file);
}

function isServerInClient(source, file) {
  return clientRe.test(source) && serverRe.test(file);
}

function isCacheOutdated() {
  return Date.now() - cacheUpdatedAt.getTime() > packageCacheTimeout;
}

function getVersionFile(meteorRoot) {
  const filePath = path.join(meteorRoot, '.meteor', 'versions');
  const fileBuffer = fs.readFileSync(filePath);
  return fileBuffer.toString();
}

function cachePackages(meteorRoot) {
  packageCache = getVersionFile(meteorRoot)
    .split('\n')
    .filter(p => !!p.trim())
    .map(p => p.split('@')[0]);
}

function cacheLocalPackages(meteorRoot) {

  const packageDir = path.join(meteorRoot, 'packages');
  localPackageCache = {};
  fs.readdirSync(packageDir)
    .filter(f => fs.existsSync(path.join(packageDir, f, 'package.js')))
    .forEach((f) => {
      const packageContent = fs.readFileSync(path.join(packageDir, f, 'package.js'), 'utf-8');
      const extract = packageContent.match(packageNameRe);
      if (Array.isArray(extract) && extract.length > 1) {
        localPackageCache[extract[1]] = f;
      } else {
        localPackageCache[f] = f;
      }
    });
}

function updateCache(meteorRoot) {
  cachePackages(meteorRoot);
  cacheLocalPackages(meteorRoot);
  cacheUpdatedAt = new Date();
}

function resolveMeteorPackage(source, meteorRoot) {
  try {
    const [_, packageName, ...file] = source.split('/');

    if (isCacheOutdated()) {
      updateCache(meteorRoot);
    }

    if (packageCache.includes(packageName)) {
      if (Object.keys(localPackageCache).includes(packageName)) {
        const baseName = path.join(meteorRoot, 'packages', localPackageCache[packageName], ...file);
        const names = [
          baseName,
          baseName + '.js',
          path.join(baseName, 'index.js'),
        ];
        const realPath = names.find(n => fs.existsSync(n));
        if (realPath) {
          return { found: true, path: realPath };
        }
        return { found: false };
      }
      return { found: true, path: null };
    }
    return { found: false };
  } catch (e) {
    return { found: false };
  }
}