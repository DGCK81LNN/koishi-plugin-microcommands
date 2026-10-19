import { Context, icons } from "@koishijs/client"
import type {} from ".."
import Microcommands from "./index.vue"
import microcommandsIcon from "./icons/microcommands.vue"

export default (ctx: Context) => {
  icons.register("activity:microcommands", microcommandsIcon)

  ctx.page({
    name: "微指令",
    path: "/microcommands",
    component: Microcommands,
    icon: "activity:microcommands",
    order: 490,
    authority: 4,
  })

  ctx.menu("microcommands", [
    {
      id: ".new",
      icon: "add",
      label: "新建微指令",
    },
    {
      id: ".save",
      icon: "save",
      label: "保存更改",
    },
    {
      id: ".delete",
      icon: "delete",
      label: "删除微指令",
    },
    {
      id: ".refresh",
      icon: "refresh",
      label: "刷新",
    },
  ])
}
