const fs = require('fs')
const path = require('path')

const parse = require('./parse')

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

    if (base[0] === '.' || (base === 'deps')) {
      continue
    }

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

  return url.replace(':', '/').replace('.git', '')
}

//
// Read all files from a path and parse their headers for docs
//
function main (argv) {
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
    console.log(JSON.stringify(output, 2, 2))
  }
}

main(process.argv.slice(2))
