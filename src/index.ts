import {
  Command,
  Context,
  Dict,
  FieldCollector,
  ForkScope,
  I18n,
  Plugin,
  Random,
  Schema,
  Service,
  SessionError,
  h,
} from "koishi"
import * as MicrocommandsConsole from "./console"

export type {} from "./console"

declare module "koishi" {
  interface Context {
    microcommands: MicrocommandsService
  }

  interface Tables {
    microcommand: {
      name: string
      code: string
    }
  }
}

type MicrocommandScope = {
  ctx: Context
  setCtx(ctx: Context): void
}

class MicrocommandsService extends Service {
  static inject = ["database"]

  static Config = Schema.object({})

  static usage: string | undefined

  private _forks: Dict<ForkScope> = Object.create(null)
  _ctx: Context

  constructor(ctx: Context) {
    super(ctx, "microcommands", true)
    this._ctx = ctx

    ctx.model.extend(
      "microcommand",
      {
        name: "string",
        code: "text",
      },
      {
        primary: "name",
      },
    )

    const cmd = ctx.command("microcommand")

    cmd
      .subcommand(".define <name:string> <code:rawtext>", {
        authority: 4,
        strictOptions: true,
      })
      .action(async ({ session }, name, code) => {
        if (name == null || code == null)
          return session.i18n("internal.insufficient-arguments")
        if (!name || name.match(/[\s\x00-\x1f"#%&'()/<>?\x7f-\x9f]|^\.|\.$/))
          throw new SessionError(".invalid-name")
        name = Command.normalize(name)
        try {
          await this.define(name, code)
        } catch (err) {
          ctx.logger.error(name, err)
          return h.text(String(err))
        }
        return session.i18n(".saved", [name])
      })

    cmd.subcommand(".list").action(async ({ session }) => {
      const list = await this.list()
      if (!list.length) return session.i18n(".none")
      return [
        ...session.i18n(".header"),
        ...list.map(n => h("p", n.startsWith("-") ? `"${n}"` : n)),
      ]
    })

    cmd
      .subcommand(".show <name:string>", { strictOptions: true })
      .action(async ({ session }, name) => {
        if (name == null) return session.i18n("internal.insufficient-arguments")
        name = Command.normalize(name)
        const code = await this.get(name)
        if (code == null) throw new SessionError(".not-found", [name])
        return h.text(code)
      })

    cmd
      .subcommand(".remove <name:string>", {
        authority: 4,
        strictOptions: true,
      })
      .action(async ({ session }, name) => {
        name = Command.normalize(name)
        const removed = await this.remove(name)
        if (!removed)
          throw new SessionError("commands.microcommand.show.messages.not-found", [name])
        return session.i18n(".deleted", [name])
      })

    ctx.i18n.define("zh-CN", require("./locales/zh-CN"))
    ctx.plugin(MicrocommandsConsole, this)

    this._loadAll()
  }

  private async _loadAll() {
    const data = await this._ctx.database.get(
      "microcommand",
      {},
      { sort: { name: "asc" } },
    )
    let successCount = 0
    for (const { name, code } of data) {
      try {
        this._load(name, code)
        successCount++
      } catch {}
    }
    this._ctx.logger.info(
      "successfully loaded %d of %d commands",
      successCount,
      data.length,
    )
  }

  private _load(name: string, code: string) {
    this._unload(name, true) ?
      this._ctx.logger.info("reload %s", name)
    : this._ctx.logger.info("load %s", name)

    // Throw any syntax errors
    const label = "koishi-microcommands-syntax-check"
    try {
      ;(0, eval)(`throw Symbol.for(${JSON.stringify(label)});\n` + code)
    } catch (exc) {
      if (exc !== Symbol.for(label)) throw exc
    }

    this._forks[name] = this._ctx.plugin(ctx => {
      let inject: Plugin["inject"]
      let signature = ""
      let properties: any[] = []
      let options: any[][] = []
      let aliases: any[][] = []
      let usage: Command.Usage
      let examples: string[] = []
      let userFields: FieldCollector<"user">[] = []
      let channelFields: FieldCollector<"channel">[] = []
      let checkers: Command.Action[] = []
      let actions: Command.Action[] = []

      const vars = {
        name,
        ctx,
        require,
        ...require("koishi"),
        inject(value: Plugin["inject"]) {
          inject = value
        },
        signature(sig: string, ...rest: any[]) {
          if (typeof sig !== "string") throw new TypeError("description must be a string")
          signature = sig
          properties = rest
        },
        option(...args: any[]) {
          options.push(args)
        },
        alias(...args: any[]) {
          aliases.push(args)
        },
        usage(value: Command.Usage) {
          if (typeof value !== "string" && typeof value !== "function")
            throw new TypeError("usage must be a string or a function")
          usage = value
        },
        example(value: string) {
          if (typeof value !== "string") throw new TypeError("example must be a string")
          examples.push(value)
        },
        userFields(value: FieldCollector<"user">) {
          userFields.push(value)
        },
        channelFields(value: FieldCollector<"channel">) {
          channelFields.push(value)
        },
        before(value: Command.Action, append?: boolean) {
          if (typeof value !== "function")
            throw new TypeError("checker must be a function")
          if (append) checkers.push(value)
          else checkers.unshift(value)
        },
        action(value: Command.Action, prepend?: boolean) {
          if (typeof value !== "function")
            throw new TypeError("action must be a function")
          if (prepend) actions.unshift(value)
          else actions.push(value)
        },
        locale(locale: string, value: I18n.Store) {
          ctx.i18n.define(locale, "commands." + name.replace(/.*\//, ""), value)
        },
      }
      const { ctx: ctx2, setCtx } = (0, eval)(
        /*js*/ `
          (function ({ ${Object.keys(vars).join(",")} }) {
            ____;
            return {
              ctx,
              setCtx(v) {
                ctx = v
              }
            }
          })
        `
          .replace(/\s+/g, " ")
          .replace(/\B[ ]|[ ]\B/g, "")
          .replace("____;", () => `\n${code}\n`),
      )(vars) as MicrocommandScope
      ctx2.plugin({
        name: "microcommands:" + name,
        inject,
        apply(ctx) {
          setCtx(ctx)
          const fullName = name.includes(".") ? name : `microcommand/${name}`
          const subCmd = ctx.command(`${fullName} ${signature}`, ...properties)
          for (const option of options)
            (subCmd.option as (...args: any[]) => any)(...option)
          for (const alias of aliases) (subCmd.alias as (...args: any[]) => any)(...alias)
          if (usage) subCmd.usage(usage)
          for (const example of examples) subCmd.example(example)
          for (const userField of userFields) subCmd.userFields(userField)
          for (const channelField of channelFields) subCmd.channelFields(channelField)
          for (const checker of checkers) subCmd.before(checker, true)
          for (const action of actions) subCmd.action(action)
        },
      })
    })
  }

  private _unload(name: string, reload = false) {
    !reload && this._ctx.logger.info("unload %s", name)
    if (!(name in this._forks)) return false
    this._forks[name]?.dispose()
    delete this._forks[name]
    return true
  }

  async define(name: string, code: string) {
    this._load(name, code)
    await this._ctx.database.upsert("microcommand", [{ name, code }])
  }

  async list() {
    return Object.keys(this._forks)
  }

  async get(name: string): Promise<string | undefined> {
    const [data] = await this._ctx.database.get("microcommand", { name })
    return data?.code
  }

  async remove(name: string) {
    this._unload(name)
    const { removed } = await this._ctx.database.remove("microcommand", { name })
    return removed > 0
  }
}

try {
  MicrocommandsService.usage = require("fs")
    .readFileSync(require("path").resolve(__dirname, "../readme.md"), "utf-8")
    .replace(/^.+?\n\n\n/s, "")
} catch {}

export default MicrocommandsService
