var expect = require('chai').expect

var path = require('path')
var meteorResolver = require('../index.js')

describe("paths", function () {
  it("handles base path relative to CWD", function () {
    expect(meteorResolver.resolve('../', './test/file.js'))
      .to.have.property('path')
      .equal(path.resolve(__dirname, '../index.js'))
  })

  it("handles root (/) paths relative to CWD", function () {
    expect(meteorResolver.resolve('/index', '/test/file.js'))
      .to.have.property('path')
      .equal(path.resolve(__dirname, '../index.js'))
  })
})
