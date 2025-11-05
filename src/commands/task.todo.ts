import chalk from 'chalk'
import { Command } from 'commander'
import * as fs from 'fs'
import inquirer from 'inquirer'
import path from 'path'
import { loadConfig } from '../config/config'
import { Task } from './task.type'

const config = loadConfig()
let dir = config.DIR_PATH || ''

function checkFilePath(filename: string): string {
  let filePath = `${dir}${filename}.json`
  if (path.extname(filename).toLowerCase() === '.json') {
    filePath = `${dir}${filename}`
  }
  return filePath
}

function readFile(filename = 'tasks', logToConsole: boolean) {
  const filePath = checkFilePath(filename)
  const data = fs.readFileSync(filePath, 'utf-8')
  const todos = JSON.parse(data)

  if (logToConsole === true) {
    if (todos.length === 0) {
      console.log(chalk.yellow.bold('В файле нет задач'))
    }
    todos.forEach((todo: Task) =>
      console.log(
        `Задача №${todo.id}\nНазвание: ${chalk.cyan(
          todo.title
        )}\nОписание: ${chalk.cyan(todo.description)}\nСтатус: ${
          todo.completed ? chalk.green('Выполнена') : chalk.red('Не выполнена')
        }`
      )
    )
  }
  return todos
}

function addTask(filename = 'tasks', tasks: Task[]) {
  const filePath = checkFilePath(filename)
  fs.writeFileSync(`${filePath}`, JSON.stringify(tasks, null, 2), 'utf-8')
}

async function createFile() {
  const fileName = await inquirer.prompt([
    {
      type: 'input',
      name: 'filename',
      message: 'Назовите новый файл:',
    },
  ])
  fs.writeFileSync(
    `${dir}${fileName.filename}.json`,
    JSON.stringify([], null, 2),
    'utf-8'
  )
  return `${fileName.filename}.json`
}

async function inquirerChoiseFile() {
  let currentFile = { file: '' }
  const filesOptions = fs
    .readdirSync(`${dir}`)
    .filter(file => path.extname(file).toLowerCase() === '.json')
  if (filesOptions.length === 0) {
    console.log('Нет доступных файлов!')
    currentFile.file = await createFile()
  } else {
    currentFile = await inquirer.prompt([
      {
        type: 'list',
        name: 'file',
        message: 'Выберите нужный файл',
        choices: filesOptions,
      },
    ])
  }
  return currentFile
}

async function inquirerChoiseTask(tasks: Task[]) {
  const tasksChoices = tasks.map((task: Task) => ({
    name: `${task.id}. ${task.title}`,
    value: task.id,
  }))

  const answersTask = await inquirer.prompt([
    {
      type: 'list',
      name: 'taskID',
      message: 'Выберите задачу для изменения',
      choices: tasksChoices,
    },
  ])
  const currentTask: Task | undefined = tasks.find(
    (task: Task) => task.id === answersTask.taskID
  )

  return currentTask
}

export function loadTaskCommands(program: Command) {
  program
    .command('look')
    .description('Просмотр задач')
    .action(async () => {
      const filename = await inquirerChoiseFile()
      readFile(filename.file, true)
    })

  program
    .command('add')
    .description('Добавление задачи в файл')
    .action(async () => {
      const filename = await inquirerChoiseFile()
      let tasks: Task[] = readFile(filename.file, false)

      const creatingTask = await inquirer.prompt([
        {
          type: 'input',
          name: 'title',
          message: 'Введите название задачи',
          validate: input =>
            input.length > 0 || chalk.red('Имя задачи не может быть пустым'),
        },
        {
          type: 'input',
          name: 'description',
          message: 'Введите описание задачи',
        },
      ])

      const newTask: Task = {
        id: tasks.length + 1,
        title: creatingTask.title,
        description: creatingTask.description,
        completed: false,
        createdAt: new Date().toISOString(),
      }

      tasks.push(newTask)
      addTask(filename.file, tasks)
    })

  program
    .command('done')
    .description('Отметка задачи')
    .action(async () => {
      const filename = await inquirerChoiseFile()
      let tasks: Task[] = readFile(filename.file, false)
      const task = await inquirerChoiseTask(tasks)

      if (task) {
        const indexTask = tasks.findIndex(
          (findTask: Task) => findTask.id === task.id
        )

        task.completed = !task.completed
        tasks[indexTask] = task

        addTask(filename.file, tasks)
        console.log(
          `Статус задачи изменен на: ${
            task.completed
              ? chalk.green('Выполнена')
              : chalk.red('Не выполнена')
          }`
        )
      }
    })

  program
    .command('edit')
    .description('Изменить задачу')
    .action(async () => {
      const filename = await inquirerChoiseFile()
      let tasks: Task[] = readFile(filename.file, false)
      const task = await inquirerChoiseTask(tasks)
      if (task) {
        const indexTask = tasks.findIndex(
          (findTask: Task) => findTask.id === task.id
        )
        let data: Task = task
        const answersEditTask = await inquirer.prompt([
          {
            type: 'input',
            name: 'title',
            message:
              'Введите новое название для задачи\nЕсли не хотите менять нажите "ENTER"',
            default: data.title,
          },
          {
            type: 'input',
            name: 'description',
            message:
              'Введите новое описание для задачи\nЕсли не хотите менять нажите "ENTER"',
            default: data.description,
          },
          {
            type: 'confirm',
            name: 'status',
            message: 'Задача выполнена?',
            default: false,
          },
        ])

        data.title = answersEditTask.title
        data.description = answersEditTask.description
        data.completed = answersEditTask.status

        tasks[indexTask] = data

        addTask(filename.file, tasks)
      }
    })

  program
    .command('remove')
    .description('Удалить задачу с файла')
    .action(async () => {
      const filename = await inquirerChoiseFile()
      let tasks: Task[] = readFile(filename.file, false)
      const task = await inquirerChoiseTask(tasks)

      const answer = await inquirer.prompt([
        {
          type: 'list',
          name: 'confirmDelete',
          message: chalk.red('Вы уверены что хотите удалить задачу?'),
          choices: ['Да, я уверен!', 'Нет, отмена!'],
        },
      ])

      if (answer.confirmDelete === 'Да, я уверен!' && task) {
        const indexTask = tasks.findIndex(
          (findTask: Task) => findTask.id === task.id
        )
        if (indexTask !== -1) {
          tasks.splice(indexTask, 1)
        }
        addTask(filename.file, tasks)
      } else {
        console.log(chalk.red('Операция была отклонена'))
      }
    })
}
