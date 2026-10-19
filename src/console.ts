import { Command, Context } from "koishi"
import type {} from "@koishijs/plugin-console"
import { resolve } from "path"
import type MicrocommandsService from "."

type MicrocommandsConsoleEvents = {
  "microcommands/list": () => Promise<string[]>
  "microcommands/get": (name: string) => Promise<string>
  "microcommands/save": (
    name: string,
    code: string,
    overwrite?: boolean,
  ) => Promise<string>
  "microcommands/delete": (name: string) => Promise<boolean>
}

declare module "@koishijs/console" {
  interface Events extends MicrocommandsConsoleEvents {}
}

export const inject = ["console"]

export function apply(ctx: Context, microcommands: MicrocommandsService) {
  ctx.logger.info(__dirname)
  ctx.console.addEntry({
    dev: resolve(__dirname, "../client/index.ts"),
    prod: resolve(__dirname, "../dist"),
  })

  ctx.console.addListener(
    "microcommands/list",
    async () => {
      const records = await ctx.database.get(
        "microcommand",
        {},
        { sort: { name: "asc" } },
      )
      return records.map(({ name }) => name)
    },
    { authority: 4 },
  )

  ctx.console.addListener(
    "microcommands/get",
    async name => {
      const [record] = await ctx.database.get("microcommand", { name })
      if (!record) throw new Error(`microcommand not found: ${name}`)
      return record.code
    },
    { authority: 4 },
  )

  ctx.console.addListener(
    "microcommands/save",
    async (name, code, overwrite) => {
      if (!name || name.match(/[\s\x00-\x1f"#%&'()/<>?\x7f-\x9f]|^\.|\.$/)) {
        throw new Error("invalid microcommand name")
      }
      name = Command.normalize(name)
      const [existing] = await ctx.database.get("microcommand", { name })
      if (existing && !overwrite) {
        throw new Error(`microcommand already exists: ${name}`)
      }
      await microcommands.define(name, code)
      return name
    },
    { authority: 4 },
  )

  ctx.console.addListener(
    "microcommands/delete",
    async name => {
      return microcommands.remove(name)
    },
    { authority: 4 },
  )
}
