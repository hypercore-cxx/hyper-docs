//
// Parse each line 
//
module.exports = source => {
  const DOC_RE = /\/\/\/(.*)[\n|\r]/g

  let docr = DOC_RE.exec(source)
  let lines = []

  if (!docr) {
    return {}
  }

  while (docr) {
    if (docr[1]) {
      lines.push(docr[1].trim())
    }

    docr = DOC_RE.exec(source)
  }

  const output = {
    namespace: [],
    classes: {},
    functions: [],
  }

  let lastClass = null
  let lastMethod = null
  let hasConstructor = false
  let last = null

  //
  // Parses all lines of the file, the rule for docs is
  // last-one-in-wins like css.
  //
  const parseLine = line => {
    const words = line.split(' ')
    const keyword = words.shift()

    switch (keyword) {
      case 'namespace': {
        output.namespace.push(words[0])
        break
      }

      case 'comment': {
        if (!last.comment) {
          last.comment = ''
        }
        last.comment += ' ' + words.join(' ')
        last.comment = last.comment.trim()
        break
      }

      case 'class': {
        lastClass = words.shift()
        last = output.classes[lastClass] = []
        break
      }

      case 'operator': {
        last = {
          operator: words.join(' ')
        }
        output.classes[lastClass].push(last)
        break
      }

      case 'return': {
        const type = words[0]

        last = {
          type,
          reference: type.includes('&'),
          pointer: type.includes('*')
        }

        lastMethod['return'] = last
        break
      }

      case 'param': {
        const identifier = words.shift()

        if (!last.params[identifier]) {
          console.error(`Unknown parameter ${identifier}`)
          process.exit(1)
        }

        last.params[identifier].comment += words.join(' ')
        break
      }

      case 'property': {
        last = {
          property: words.join(' ')
        }

        output.classes[lastClass].push(last)
        break
      }

      case 'overload':
      case 'constructor':
      case 'method': {
        let params = {}

        line = line.replace(/\((.*)\)/, (_, sig) => {
          sig.split(',').filter(Boolean).forEach(param => {
            params[param.match(/\w+$/)] = {
              const: !!param.match(/\s+const|const\s+/),
              reference: !!param.match(/&/),
              pointer: !!param.match(/\*/),
              comment: ''
            }
          })
          return ''
        })

        last = lastMethod = {
          name: line.split(' ').pop(),
          type: 'method',
          overload: keyword === 'overload',
          params
        }

        if (keyword === 'constructor' && hasConstructor) {
          lastMethod.overload = true
        }

        if (keyword === 'constructor') {
          hasConstructor = true
        }

        output.classes[lastClass].push(lastMethod)

        break
      }
    }
  }

  lines.forEach(parseLine)
  return output
}
