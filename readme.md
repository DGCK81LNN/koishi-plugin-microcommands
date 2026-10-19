# koishi-plugin-microcommands

[![npm](https://img.shields.io/npm/v/koishi-plugin-microcommands?style=flat-square)](https://www.npmjs.com/package/koishi-plugin-microcommands)

Microcommands 允许您使用 JavaScript 代码便捷地为 Koishi 机器人创建指令。


## 用法介绍

管理员可使用指令`microcommand`来定义指令。

  * `microcommand define <name> <code...>`

    定义一个微指令。`name`是指令名，`code`是指令的 JavaScript 代码。指令定义的 API 见下文。默认需要 4 级权限。

  * `microcommand remove <name>`

    删除指定的微指令。默认需要 4 级权限。

  * `microcommand show <name>`

    显示指定微指令的源代码。默认不要求权限。

  * `microcommand list`

    显示当前注册的微指令列表。默认不要求权限。

每个注册的微指令默认都是`microcommand`的[层级式子指令][subcmd]（除非它已经是某个指令的[派生式子指令][subcmd]）。建议用官方插件<code>[commands](https://koishi.chat/zh-CN/plugins/console/commands.html)</code>提供的`command <name> -p <parentName>`来更改微指令所属的父级指令（或`command <name> -P`来将其修改为顶级指令），或者在控制台的“指令管理”中操作。

[subcmd]: https://koishi.chat/zh-CN/manual/usage/command.html#子指令

### 微指令 API

在微指令定义的代码中，存在以下局部变量（尽管是变量，但除了可以将`ctx`赋值为添加了过滤器的`ctx`〔如`ctx = ctx.platform("onebot")`〕之外，不要给这些变量赋值）：

  * `name`：当前微指令的名称。
  * `ctx`：当前插件上下文。在整段定义代码运行完之后，会被替换成一个内层插件上下文，以实现服务依赖的注入。
  * `require(moduleSpec)`：用来导入 Node.js 模块。
  * `inject(services)`：注入服务依赖，相当于一般插件的<code>export const [inject](https://koishi.chat/zh-CN/guide/plugin/service.html#inject) = services</code>。
  * `signature(def, desc?, config?)`：设置指令的基本信息。除了第一个参数的开头不写指令名称（如果指令没有参数则传入空字符串即可）以外与<code>[ctx.command()](https://koishi.chat/zh-CN/api/core/context.html#ctx-command)</code>的参数相同。
  * `option(name, desc?, config?)`：定义指令选项。同<code>[cmd.option()](https://koishi.chat/zh-CN/api/core/command.html#cmd-option)</code>。
  * `alias(name, config?)`：定义指令别名。同<code>[cmd.alias()](https://koishi.chat/zh-CN/api/core/command.html#cmd-alias)</code>。
  * `usage(text)`：定义指令使用说明。同<code>[cmd.usage()](https://koishi.chat/zh-CN/api/core/command.html#cmd-usage)</code>。
  * `example(example)`：定义指令使用示例。同<code>[cmd.example()](https://koishi.chat/zh-CN/api/core/command.html#cmd-example)</code>。
  * `userFields(fields)`：定义指令需要用到的用户数据字段。同<code>[cmd.userFields()](https://koishi.chat/zh-CN/api/core/command.html#cmd-userfields)</code>。
  * `channelFields(fields)`：定义指令需要用到的频道数据字段。同<code>[cmd.channelFields()](https://koishi.chat/zh-CN/api/core/command.html#cmd-channelfields)</code>。
  * `before(checker, append?)`：定义指令的检测函数。同<code>[cmd.before()](https://koishi.chat/zh-CN/api/core/command.html#cmd-before)</code>。
  * `action(action, prepend?)`：定义指令的执行函数。同<code>[cmd.action()](https://koishi.chat/zh-CN/api/core/command.html#cmd-action)</code>。
  * `locale(locale, dict)`：定义指令的本地化字符串。同<code>[ctx.i18n.define](https://koishi.chat/zh-CN/api/service/i18n.html#ctx-i18n-define)(locale, { commands: { [name]: dict } })。</code>

此外，`koishi`包导出的所有函数和对象都在微指令定义环境中成为了局部变量，可以直接使用。

### 示例

下面是一个简单的微指令示例：

~~~javascript
//microcommand define greet
signature("[name:text]", "打招呼", { checkUnknown: true })
option("formal", "-f", "使用正式称呼")
action(({ options: { formal } }, name) =>
  h.text(`${formal ? "您好" : "你好"}，${name || "世界"}！`)
)
~~~

下面是包含国际化支持的微指令示例：

~~~javascript
//microcommand define greet
signature("[name:text]", { checkUnknown: true })
option("formal", "-f")
action(({ session, options: { formal } }, name) =>
  session.i18n(formal ? ".formal-greeting" : ".greeting", [name || session.i18n(".default-name")])
)
locale("zh-CN", {
  description: "打招呼",
  options: {
    formal: "使用正式称呼",
  },
  messages: {
    greeting: "你好，{0}！",
    "formal-greeting": "您好，{0}！",
    "default-name": "世界",
  },
})
locale("en-US", {
  description: "Send greeting",
  options: {
    formal: "Use a formal greeting",
  },
  messages: {
    greeting: "Hello, {0}!",
    "formal-greeting": "Good day, {0}!",
    "default-name": "world",
  },
})
~~~

### 编辑器支持

`koishi-plugin-microcommands/types`提供了微指令定义环境下全局对象的类型声明，如果使用外部编辑器编写微指令代码，可以在文件中添加三斜线指令来启用编辑器 Intellisense 支持：

~~~js
/// <reference types="koishi-plugin-microcommands/types" />
~~~

或者，在微指令代码所在目录中创建`jsconfig.json`：

~~~json
{
  "compilerOptions": {
    "types": [
      "koishi-plugin-microcommands/types"
    ]
  }
}
~~~

### 控制台编辑器

安装并启用 Koishi 控制台和 `koishi-plugin-codemirror` 后，插件会在控制台活动栏注册“微指令”页面，路径为 `/microcommands`，需要 4 级权限，可以在页面中搜索和编辑已保存的微指令，也可以新建、保存及删除微指令定义。新建的定义只有在保存后才会写入数据库；刷新会重新读取列表和源代码。切换、刷新或删除时，如果存在未保存的更改，页面会先请求确认。

控制台和 CodeMirror 插件是可选依赖；未安装时仍可通过上面的 `microcommand` 指令和服务 API 管理微指令。

### 服务 API

其他 Koishi 插件可以通过`ctx.microcommands`读取和管理微指令。使用该服务的插件应声明 `microcommands` 依赖。该服务提供以下异步方法：

  * `define(name, code)`：注册或替换微指令，并将源代码保存到数据库。
  * `get(name)`：读取已保存的源代码；微指令不存在时返回`undefined`。
  * `list()`：返回当前已加载的微指令名称列表。
  * `remove(name)`：卸载微指令并删除保存的源代码；返回是否删除了数据库记录。
