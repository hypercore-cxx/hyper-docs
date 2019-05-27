const fs = require('fs')
const assert = require('assert')

const parse = require('../parse')
const expected = require(`${__dirname}/fixtures/tree.json`)

const s = fs.readFileSync(`${__dirname}/fixtures/index.hxx`, 'utf8')
const actual = JSON.stringify(parse(s), 2, 2)
assert(actual, expected)
