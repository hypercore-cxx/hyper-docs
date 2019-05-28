const fs = require('fs')
const os = require('os')
const path = require('path')

const parse = require('./parse')
const compile = require('./compile')

//
// Find all header files except in ./deps or hidden dirs
//
const read = d => {
  const files = fs.readdirSync(d)
  let paths = files.map(f => path.join(d, f))

  let headers = []

  for (const i in paths) {
    const p = paths[i]
    const base = path.basename(p)

    const dontParse = (
      (base[0] === '.') ||
      (base === 'deps') ||
      (base === 'hyper-docs')
    )

    if (dontParse) continue

    const stat = fs.statSync(p)

    if (stat.isDirectory()) {
      headers.push(...read(p))
    } else if (path.extname(p) === '.hxx') {
      headers.push(p)
    }
  }

  return headers
}

//
// Find the package.json for any given header file
//
const findPackage = file => {
  const dir = path.dirname(file)
  const target = path.join(dir, 'package.json')

  try {
    fs.statSync(target)
  } catch (ex) {
    return findPackage(path.join(dir, '..'))
  }

  return require(target)
}

const parseUrl = s => {
  let url = s.split('//')[1]
  if (!url) url = s.split('@')[1]

  return 'https://' + url.replace(':', '/').replace('.git', '')
}

//
// Read all files from a path and parse their headers for docs
//
function main (argv) {
  if (!argv.length) {
    let buffers = fs
      .readFileSync(0, 'utf8')
      .split(os.EOL)
      .filter(Boolean)

    try {
      buffers = buffers.map(JSON.parse)
    } catch (err) {
      console.error(err.message)
      process.exit(1)
    }

    compile(buffers)
    return
  }

  const files = read(argv[0])

  for (const file of files) {
    const pkg = findPackage(file)

    if (!pkg) {
      console.error('missing package.json for', file)
      continue
    }

    const s = fs.readFileSync(file, 'utf8')
    const output = parse(s)

    output.repo = parseUrl(pkg.repository.url)
    process.stdout.write(JSON.stringify(output) + '\n')
  }
}

main(process.argv.slice(2))
