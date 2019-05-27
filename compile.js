const marked = require('marked')
const hl = require('highlight.js')

const templateOperators = members => {
  const operators = members.filter(m => m.type === 'operator')

  let table =  `|Operator|Description|\n`
      table += `|:-------|:----------|\n`

  table += operators.map(operator => {
    return `|${operator.name}|${operator.comment}|`
  }).join('\n')

  return table
}

const templateClass = (key, type) => `
### \`${key}\`
${type.comment}

${templateOperators(type.members)}
`

const templateFunction = (key, type) => `
### \`${key}\`
${type.comment}
`

const template = ast => `
# [${ast.namespace}](${ast.repo})

## TYPES
${
  Object.keys(ast.types).map(key => {
    const type = ast.types[key]

    return type.members
      ? templateClass(key, type)
      : templateFunction(key, type)
  }).join('\n')
}
`

const createHTML = s => {
  marked.setOptions({
    renderer: new marked.Renderer(),
    highlight: code => hl.highlightAuto(code).value
  })

  return marked(s)
}

const createMD = ast => {
  if (!ast.namespace) {
    return ''
  } else {
    ast.namespace = ast.namespace.join('::')
  }

  return template(ast)
}

module.exports = (buffers, type) => {
  buffers.forEach(ast => {
    const output = type === 'html'
      ? createHTML(createMD(ast))
      : createMD(ast)

    process.stdout.write(output)
  })
}
