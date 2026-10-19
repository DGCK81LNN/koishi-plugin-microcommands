/// <reference types="node"/>

import * as koishi from "koishi"
import * as minato from "minato"

declare global {
  const $: typeof koishi.$
  const Adapter: typeof koishi.Adapter
  const App: typeof koishi.App
  const Argv: typeof koishi.Argv
  const Binary: typeof koishi.Binary
  const Bot: typeof koishi.Bot
  const Channel: typeof koishi.Channel
  const Command: typeof koishi.Command
  const Commander: typeof koishi.Commander
  const Context: typeof koishi.Context
  const Database: typeof koishi.Database
  const Driver: typeof koishi.Driver
  const Element: typeof koishi.Element
  const Eval: typeof koishi.Eval
  const Field: typeof koishi.Field
  const FilterService: typeof koishi.FilterService
  const HTTP: typeof koishi.HTTP
  const I18n: typeof koishi.I18n
  const Loader: typeof koishi.Loader
  const Logger: typeof koishi.Logger
  const MessageEncoder: typeof koishi.MessageEncoder
  const Messenger: typeof koishi.Messenger
  const Model: typeof koishi.Model
  const Next: typeof koishi.Next
  const Permissions: typeof koishi.Permissions
  const Processor: typeof koishi.Processor
  const Quester: typeof koishi.Quester
  const Random: typeof koishi.Random
  const Relation: typeof koishi.Relation
  const RuntimeError: typeof koishi.RuntimeError
  const Schema: typeof koishi.Schema
  const SchemaService: typeof koishi.SchemaService
  const Selection: typeof koishi.Selection
  const Service: typeof koishi.Service
  const SessionError: typeof koishi.SessionError
  const SharedCache: typeof koishi.SharedCache
  const Tables: typeof minato.Tables
  const Time: typeof koishi.Time
  const Type: typeof koishi.Type
  const Types: typeof minato.Types
  const Universal: typeof koishi.Universal
  const User: typeof koishi.User
  const arrayBufferToBase64: typeof koishi.arrayBufferToBase64
  const arrayBufferToHex: typeof koishi.arrayBufferToHex
  const assertProperty: typeof koishi.assertProperty
  const base64ToArrayBuffer: typeof koishi.base64ToArrayBuffer
  const camelCase: typeof koishi.camelCase
  const camelize: typeof koishi.camelize
  const capitalize: typeof koishi.capitalize
  const clone: typeof koishi.clone
  const coerce: typeof koishi.coerce
  const contain: typeof koishi.contain
  const createMatch: typeof koishi.createMatch
  const deduplicate: typeof koishi.deduplicate
  const deepEqual: typeof koishi.deepEqual
  const defineConfig: typeof koishi.defineConfig
  const defineEnumProperty: typeof koishi.defineEnumProperty
  const defineProperty: typeof koishi.defineProperty
  const difference: typeof koishi.difference
  const enumKeys: typeof koishi.enumKeys
  const escapeRegExp: typeof koishi.escapeRegExp
  const executeEval: typeof koishi.executeEval
  const executeQuery: typeof koishi.executeQuery
  const executeSort: typeof koishi.executeSort
  const executeUpdate: typeof koishi.executeUpdate
  const extend: typeof koishi.extend
  const filterKeys: typeof koishi.filterKeys
  const flatten: typeof koishi.flatten
  const getCell: typeof koishi.getCell
  const h: typeof koishi.h
  const hasSubquery: typeof koishi.hasSubquery
  const hexToArrayBuffer: typeof koishi.hexToArrayBuffer
  const hyphenate: typeof koishi.hyphenate
  const interpolate: typeof koishi.interpolate
  const intersection: typeof koishi.intersection
  const is: typeof koishi.is
  const isAggrExpr: typeof koishi.isAggrExpr
  const isComparable: typeof koishi.isComparable
  const isEmpty: typeof koishi.isEmpty
  const isEvalExpr: typeof koishi.isEvalExpr
  const isFlat: typeof koishi.isFlat
  const isInteger: typeof koishi.isInteger
  const isNullable: typeof koishi.isNullable
  const isPlainObject: typeof koishi.isPlainObject
  const isType: typeof koishi.isType
  const isUpdateExpr: typeof koishi.isUpdateExpr
  const makeArray: typeof koishi.makeArray
  const makeRegExp: typeof koishi.makeRegExp
  const mapValues: typeof koishi.mapValues
  const merge: typeof koishi.merge
  const noop: typeof koishi.noop
  const observe: typeof koishi.observe
  const omit: typeof koishi.omit
  const paramCase: typeof koishi.paramCase
  const pick: typeof koishi.pick
  const randomId: typeof koishi.randomId
  const remove: typeof koishi.remove
  const renameProperty: typeof koishi.renameProperty
  const resolveConfig: typeof koishi.resolveConfig
  const sanitize: typeof koishi.sanitize
  const segment: typeof koishi.segment
  const sleep: typeof koishi.sleep
  const snakeCase: typeof koishi.snakeCase
  const trimSlash: typeof koishi.trimSlash
  const uncapitalize: typeof koishi.uncapitalize
  const union: typeof koishi.union
  const unravel: typeof koishi.unravel
  const unwrapExports: typeof koishi.unwrapExports
  const valueMap: typeof koishi.valueMap
  const version: typeof koishi.version
  const z: typeof koishi.z

  /** Name of the current microcommand. */
  const name: string

  /** Plugin context of the microcommand. */
  let ctx: koishi.Context

  /** services that the microcommand depends on. */
  function inject(inject: koishi.Plugin["inject"]): void

  /** Define the signature of the microcommand. */
  function signature(def: string, config?: koishi.Command.Config): void
  function signature(def: string, desc: string, config?: koishi.Command.Config): void

  /** Define an option of the microcommand. */
  function option(name: string, desc?: string, config?: koishi.Argv.OptionConfig): void

  /** Define an alias of the microcommand. */
  function alias(...names: string[]): void
  function alias(name: string, options: koishi.Command.Alias): void

  /** Define the usage text of the microcommand. */
  function usage(text: koishi.Command.Usage): void

  /** Define an example of the microcommand. */
  function example(text: string): void

  function userFields(fields: koishi.FieldCollector<"user">): void

  function channelFields(fields: koishi.FieldCollector<"channel">): void

  /** Define a checker for the microcommand. */
  function before(callback: koishi.Command.Action, append?: boolean): void

  /** Define the action of the microcommand. */
  function action(callback: koishi.Command.Action, prepend?: boolean): void

  /** Define localization for the microcommand. */
  function locale(locale: string, dict: koishi.I18n.Store): void
}
