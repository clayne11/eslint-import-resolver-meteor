# eslint-import-resolver-meteor

Meteor module resolution plugin for [`eslint-plugin-import`](https://www.npmjs.com/package/eslint-plugin-import).

Config is passed directly through to [`resolve`](https://www.npmjs.com/package/resolve#resolve-sync-id-opts) as options:

The project's root `package.json` file is used as the root for any `/` paths.

Installation:
```javascript
npm install --save-dev eslint eslint-plugin-import eslint-import-resolver-meteor
```

Example:

```javascript
// foo.js
import bar from '/imports/bar'
```

will translate to `PROJECT_ROOT/imports/bar`

```yaml
settings:
  import/resolver:
    meteor:
      extensions:
        # if unset, default is just '.js', but it must be re-added explicitly if set
        - .js
        - .jsx
        - .es6
        - .coffee

      paths:
        # an array of absolute paths which will also be searched
        # think NODE_PATH
        - /usr/local/share/global_modules

      # this is technically for identifying `node_modules` alternate names
      moduleDirectory:

        - node_modules # defaults to 'node_modules', but...
        - bower_components

        - project/src  # can add a path segment here that will act like
                       # a source root, for in-project aliasing (i.e.
                       # `import MyStore from 'stores/my-store'`)
```

or to use the default options:

```yaml
settings:
  import/resolver: node
```
