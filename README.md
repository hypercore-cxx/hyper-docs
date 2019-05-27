# SYNOPSIS
A minimal documentation system.


# MOTIVATION
Optimized for being learned, read and maintained. Generate a
machine readable AST first, docs second.


# SYNTAX
Place tripple forward slashes in front of doc lines. See [this][0]
example.

```c++
/// <keyword> ...args
```


# KEYWORDS

#### namespace `name`
Each header defines only one namespace.

#### function `name(...args)`
Each function is associated with the last namespace.

#### class `name`
Each class is associated with the last namespace.

#### struct `name`
Each struct is associated with the last namespace.

#### method `name(...args)`
Each method is associated with the last class.

#### overload `name(...args)`
An overload is a type of method.

#### return `type`
Each return is associated with the last function, method or overload.

#### param `name` `text...`
Each param is associaated with the last function or method.

#### comment `text...`
Each comment is associated with the last keyword.


# PARSER
Outputs an AST. See [this][1] example.


# COMPILER
Outputs markdown or html.

[0]:/test/fixtures/index.hxx
[1]:/test/fixtures/tree.json
