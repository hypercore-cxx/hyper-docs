//
// Produces a single page (searchable) document with a TOC.
//
// Yeah, its a lot of messy string templating. If you have
// a better idea, feel free to make a pull request :)
//
const fs = require('fs')
const marked = require('marked')

marked.setOptions({
  renderer: new marked.Renderer()
})

const escapeString = s => {
  s = s.replace('&', '&amp;')
    .replace('>', '&gt;')
    .replace('<', '&lt;')
    .replace('\'', '&#x27;')
    .replace('"', '&quot;')
    .replace('`', '&#x60;')
  return s
}

//
// Return Types
//
const templateReturnType = type => `
  |Return Type|Description|
  |:---|:---|
  |${type.return.TYPE}|${type.return.comment}|
`

//
// Properties
//
const templateProperties = members => {
  const props = members.filter(m => m.type === 'property')

  if (!props.length) {
    return '' // there are no operators
  }

  let header = [
    `### PROPERTIES\n`,
    `|Type|Name|Description|`,
    `|:---|:---|:----------|`
  ]

  const rows = props.map(prop =>
    `|${prop.TYPE}|${prop.name}|${prop.comment || ''}|`
  )

  return [...header, ...rows].join('\n')
}

//
// Operators
//
const templateOperators = members => {
  const operators = members.filter(m => m.type === 'operator')

  if (!operators.length) {
    return '' // there are no operators
  }

  let header = [
    `### OPERATORS\n`,
    `|Operator|Description|`,
    `|:-------|:----------|`
  ]

  const rows = operators.map(operator =>
    `|${operator.name}|${operator.comment || ''}|`
  )

  return [...header, ...rows].join('\n')
}

//
// Params
//
const templateParams = type => {
  if (!type.params || !Object.keys(type.params).length) {
    return ''
  }

  return [
    ``,
    `|Parameter|Default|Description|`,
    `|:---|:---|:---|`,
    ...Object.keys(type.params).map(key => {
      const param = type.params[key]
      return `|${key}|${param.default || ''}|${param.comment || ''}|`
    })
  ].join('\n')
}

//
// Methods
//
const templateMethods = members => {
  const methods = members.filter(m => m.type === 'method')

  if (!methods.length) {
    return '' // there are no operators
  }

  const header = [`### METHODS\n`]

  const rows = methods.map(method => {
    return [
      `#### ${method.name}`,
      `${method.comment}`,
      `\`\`\``,
      method.raw,
      `\`\`\``,
      templateReturnType(method),
      templateParams(method),
      ``
    ].join('\n')
  })

  return [...header, ...rows].join('\n')
}

//
// Constructors
//
const templateConstructors = members => {
  const ctors = members.filter(m => m.type === 'constructor')

  if (!ctors.length) {
    return '' // there are no operators
  }

  const header = [`### CONSTRUCTORS\n`]

  const rows = ctors.map(ctor => {
    return [
      `${ctor.comment || ''}`,
      `\`\`\``,
      ctor.raw,
      `\`\`\``,
      templateParams(ctor),
      ``
    ].join('\n')
  })

  return [...header, ...rows].join('\n')
}

const templateClassOrStruct = (key, type) => `
## ${escapeString(key)}
${type.comment || 'Undocumented. Do not use.'}

${templateOperators(type.members)}

${templateConstructors(type.members)}

${templateMethods(type.members)}

${templateProperties(type.members)}
`

const templateFunction = (key, type) => `
## ${escapeString(key)}
${type.comment || 'Undocumented. Do not use.'}

\`\`\`
${type.raw}
\`\`\`

${templateReturnType(type)}

${templateParams(type)}
`

const createMD = ast => {
  if (!ast.namespace) return ''

  return `
# ${ast.namespace.join('::')}

${
  Object.keys(ast.types).map(key => {
    const type = ast.types[key]

    return type.members
      ? templateClassOrStruct(key, type)
      : templateFunction(key, type)
  }).join('\n')
}
`
}

module.exports = buffers => {
  const toc = {}
  const groups = {}

  buffers.forEach(ast => {
    if (!ast.namespace) return

    const ns = ast.namespace.join('::')

    const output = marked(createMD(ast))

    if (ast.types) {
      toc[ns] = toc[ns] || []
      toc[ns].push(...Object.keys(ast.types))
    }

    groups[ns] = groups[ns] || []
    groups[ns].push(output)
  })

  const flattened = []

  Object.keys(toc).forEach(key => {
    const k = escapeString(key)
    flattened.push(`<a href="${k}">${k}</a><ul>`)

    flattened.push(...toc[key].map(type =>
      `<li>${escapeString(type)}</li>`))

    flattened.push(`</ul>`)
  })

  const output = `
    <div class="toc">
      ${flattened.join('\n')}
    </div>

    <div class="docs">
      ${Object.values(groups).map(buf => buf.join('')).join('\n')}
    </div>
  `

  const template = fs.readFileSync(`${__dirname}/template.txt`, 'utf8')
  process.stdout.write(template.replace('DOCS', output))
}
