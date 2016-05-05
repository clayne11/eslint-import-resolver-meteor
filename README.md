# eslint-import-resolver-meteor

Meteor module resolution plugin for [`eslint-plugin-import`](https://www.npmjs.com/package/eslint-plugin-import).

Config is passed directly through to [`resolve`](https://www.npmjs.com/package/resolve#resolve-sync-id-opts) as options:

The resolver handles two Meteor specific resolutions:

### Resolve `/` imports

The parent directory of the project's `.meteor` folder is used as the root for any `/` paths.

Example:

```javascript
// foo.js
import bar from '/imports/bar'
```

will import from `PROJECT_ROOT/imports/bar`.


### Resolve meteor package imports

The resolver also resolves `import foo from 'meteor/bar`, however this part of the resolver does not work perfectly.

Meteor packages (ie `import foo from 'meteor/bar'`) do not have a reliable way to access
the main export of a package, and in fact some packages do not even have a main module file but
rather rely on the Meteor build system to generate an importable symbol. This happens in the case of
`api.export('Foo')` rather than using the newer `api.mainModule('index.js')`.

The strategy for resolving a Meteor import is as follows:

Check that the package exists in `.meteor/versions`. If the package exists in this file it means that the package
being imported has been required by the project, either directly through `meteor add foo` or indirectly, by another package
requiring it.

This strategy is imperfect, however it is the best we can do. It leads to the following false positives:

1. If you're linting inside of a Meteor package, that package will only have access to the packages that it imports
in it's `package.js` file. You will get false positives for packages that are required by the project but not by the package.
1. If a Meteor package is required by another package you are using, but you do not directly rely on that package,
it will still show up in `.meteor/versions`. As a result you will get a false positive even though you can't import
that package without doing `meteor add foo`.

Example:

```javascript
// packages/bar/package.js

Package.describe({
  name: 'bar',
});

Package.onUse(function(api) {
  api.use('foo');
}
```

Then, in your project you `meteor add bar`.

Now in `PROJECT_ROOT/imports/index.js`, you `import foobar from 'meteor/foo'`.

This will lint successfully, even though you can't actually resolve `meteor/foo` without `meteor add foo` into your project.

Even given these limitations, this resolver should still help significantly to lint Meteor projects.

Installation:
```javascript
npm install --save-dev eslint eslint-plugin-import eslint-import-resolver-meteor
```

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
  import/resolver: meteor
```
