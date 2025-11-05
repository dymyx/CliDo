#! /usr/bin/env node
import { Command } from 'commander'
import { loadSystemCommands } from './commands/system'
import { loadTaskCommands } from './commands/task.todo'
import { initConfigDir } from './config/config'
const program = new Command()
program
  .name('todo')
  .description('A simple CLI to manage your to-do list')
  .version('1.0.0')
loadSystemCommands(program)
loadTaskCommands(program)
initConfigDir()
program.parse(process.argv)
