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
    types: {},
    functions: [],
  }

  let lastType = null
  let lastMethod = null
  let hasConstructor = false
  let last = null

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

      case 'function': {
        lastType = words[0].match(/\w+/)[0]
        last = lastMethod = output.types[lastType] = {}
        break
      }

      case 'struct':
      case 'class': {
        lastType = words.shift()
        last = output.types[lastType] = { members: [] }
        break
      }

      case 'property':
      case 'operator': {
        last = {
          type: keyword,
          name: words.join(' ')
        }

        output.types[lastType].members.push(last)
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

        output.types[lastType].members.push(lastMethod)

        break
      }
    }
  }

  lines.forEach(parseLine)
  return output
}
