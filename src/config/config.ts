import * as fs from 'fs'
import * as os from 'os'
import * as path from 'path'
import { Config } from './config.types'

const configPath = path.join(`${os.homedir()}/.config/todo-cli/`, 'config.json')

function initConfigDir() {
  fs.existsSync(path.dirname(configPath)) ||
    fs.mkdirSync(path.dirname(configPath), { recursive: true })
}

function loadConfig(): Config {
  if (fs.existsSync(configPath)) {
    const rawData = fs.readFileSync(configPath, 'utf-8')
    return JSON.parse(rawData)
  }
  return { DIR_PATH: '' }
}

function saveConfig(config: Config) {
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf-8')
}

export { initConfigDir, loadConfig, saveConfig }
