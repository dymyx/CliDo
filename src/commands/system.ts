import { Command } from 'commander'
import * as fs from 'fs'
import { loadConfig, saveConfig } from '../config/config'

const config = loadConfig()
let dir = config.DIR_PATH || ''

export function loadSystemCommands(program: Command) {
  program
    .command('path <path>')
    .description('Путь сохранения файлов заметок')

    .action(path => {
      dir = path.endsWith('/') ? path : path + '/'

      fs.existsSync(dir) || fs.mkdirSync(dir, { recursive: true })
      saveConfig({ DIR_PATH: dir })
      console.log('Directory set to:', dir)
    })
}
