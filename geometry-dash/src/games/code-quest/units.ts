export type LessonQuestion =
  | { kind: 'mc'; prompt: string; code?: string; choices: string[]; answer: number; explain?: string }
  | { kind: 'fill'; prompt: string; code: string; blank: string; answer: string; explain?: string }
  | { kind: 'predict'; prompt: string; code: string; choices: string[]; answer: number; explain?: string }
  | { kind: 'order'; prompt: string; tiles: string[]; answer: string[]; explain?: string }

export interface Lesson {
  id: string
  title: string
  icon: string
  questions: LessonQuestion[]
}

export interface Unit {
  id: string
  title: string
  subtitle: string
  color: string
  icon: string
  lessons: Lesson[]
}

export const units: Unit[] = [
  {
    id: 'u1',
    title: 'Unit 1 — Hello, Code!',
    subtitle: 'Your first lines of JavaScript',
    color: '#58cc02',
    icon: '👋',
    lessons: [
      {
        id: 'u1-l1',
        title: 'Saying Hello',
        icon: '⭐',
        questions: [
          {
            kind: 'mc',
            prompt: 'Which line prints "Hello!" to the screen?',
            choices: ['say("Hello!")', 'console.log("Hello!")', 'print Hello!', 'echo("Hello!")'],
            answer: 1,
            explain: 'In JavaScript we use console.log to print things.',
          },
          {
            kind: 'fill',
            prompt: 'Finish the line so it prints "Hi Rylan!"',
            code: '______("Hi Rylan!")',
            blank: '______',
            answer: 'console.log',
            explain: 'console.log is how JS shows text.',
          },
          {
            kind: 'predict',
            prompt: 'What will this print?',
            code: 'console.log("Code is fun!")',
            choices: ['nothing', 'Code is fun!', 'console.log', 'an error'],
            answer: 1,
          },
        ],
      },
      {
        id: 'u1-l2',
        title: 'Variables',
        icon: '📦',
        questions: [
          {
            kind: 'mc',
            prompt: 'Which keyword makes a variable you can change later?',
            choices: ['const', 'let', 'print', 'function'],
            answer: 1,
            explain: 'let makes a variable you can change. const cannot be changed.',
          },
          {
            kind: 'fill',
            prompt: 'Make a variable "age" that equals 8.',
            code: 'let age = ___',
            blank: '___',
            answer: '8',
          },
          {
            kind: 'predict',
            prompt: 'What prints?',
            code: 'let name = "Rylan"\nconsole.log(name)',
            choices: ['name', 'Rylan', '"Rylan"', 'undefined'],
            answer: 1,
          },
        ],
      },
      {
        id: 'u1-l3',
        title: 'Math Magic',
        icon: '➕',
        questions: [
          {
            kind: 'predict',
            prompt: 'What does this print?',
            code: 'console.log(2 + 3)',
            choices: ['23', '5', '2+3', '6'],
            answer: 1,
          },
          {
            kind: 'predict',
            prompt: 'What does this print?',
            code: 'console.log("2" + "3")',
            choices: ['5', '23', '"23"', 'error'],
            answer: 1,
            explain: 'When you + strings, JS sticks them together.',
          },
          {
            kind: 'mc',
            prompt: 'Which symbol means "multiply"?',
            choices: ['x', '*', '×', '.'],
            answer: 1,
          },
        ],
      },
      {
        id: 'u1-l4',
        title: 'Unit 1 Boss',
        icon: '👑',
        questions: [
          {
            kind: 'order',
            prompt: 'Put the code in the right order so it prints a greeting.',
            tiles: ['console.log(msg)', 'let msg =', '"Hi!"'],
            answer: ['let msg =', '"Hi!"', 'console.log(msg)'],
          },
          {
            kind: 'predict',
            prompt: 'What prints?',
            code: 'let x = 10\nlet y = 2\nconsole.log(x * y)',
            choices: ['12', '20', '102', 'x*y'],
            answer: 1,
          },
        ],
      },
    ],
  },
  {
    id: 'u2',
    title: 'Unit 2 — If & Else',
    subtitle: 'Make the code decide',
    color: '#1cb0f6',
    icon: '🤔',
    lessons: [
      {
        id: 'u2-l1',
        title: 'If Statements',
        icon: '❓',
        questions: [
          {
            kind: 'mc',
            prompt: 'What runs when the condition is true?',
            code: 'if (score > 5) {\n  console.log("Win!")\n}',
            choices: ['always', 'only if score > 5', 'never', 'only if score < 5'],
            answer: 1,
          },
        ],
      },
    ],
  },
  {
    id: 'u3',
    title: 'Unit 3 — Loops',
    subtitle: 'Do things over and over',
    color: '#ce82ff',
    icon: '🔁',
    lessons: [
      {
        id: 'u3-l1',
        title: 'For Loops',
        icon: '🔄',
        questions: [
          {
            kind: 'predict',
            prompt: 'How many times does this print?',
            code: 'for (let i = 0; i < 3; i++) {\n  console.log("hi")\n}',
            choices: ['1', '2', '3', '4'],
            answer: 2,
          },
        ],
      },
    ],
  },
  {
    id: 'u4',
    title: 'Unit 4 — Functions',
    subtitle: 'Reusable code blocks',
    color: '#ff9600',
    icon: '⚙️',
    lessons: [
      {
        id: 'u4-l1',
        title: 'Making a Function',
        icon: '🛠️',
        questions: [
          {
            kind: 'mc',
            prompt: 'Which is a function?',
            choices: ['let x = 5', 'function hi() {}', 'if (true) {}', 'for (;;) {}'],
            answer: 1,
          },
        ],
      },
    ],
  },
  {
    id: 'u5',
    title: 'Unit 5 — Arrays',
    subtitle: 'Lists of stuff',
    color: '#ff4b4b',
    icon: '📚',
    lessons: [
      {
        id: 'u5-l1',
        title: 'Array Basics',
        icon: '📋',
        questions: [
          {
            kind: 'predict',
            prompt: 'What prints?',
            code: 'let arr = [10, 20, 30]\nconsole.log(arr[1])',
            choices: ['10', '20', '30', 'arr[1]'],
            answer: 1,
          },
        ],
      },
    ],
  },
  {
    id: 'u6',
    title: 'Unit 6 — Game Logic',
    subtitle: 'Score, lives, levels',
    color: '#2b70c9',
    icon: '🎮',
    lessons: [
      {
        id: 'u6-l1',
        title: 'Keeping Score',
        icon: '🏆',
        questions: [
          {
            kind: 'mc',
            prompt: 'Which adds 1 to score?',
            choices: ['score - 1', 'score++', 'score = "1"', 'score?'],
            answer: 1,
          },
        ],
      },
    ],
  },
  {
    id: 'u7',
    title: 'Unit 7 — Drawing',
    subtitle: 'Put stuff on the screen',
    color: '#ec008c',
    icon: '🎨',
    lessons: [
      {
        id: 'u7-l1',
        title: 'Canvas Drawing',
        icon: '🖼️',
        questions: [
          {
            kind: 'mc',
            prompt: 'Which draws a filled rectangle on a canvas?',
            choices: ['ctx.drawBox()', 'ctx.fillRect(x, y, w, h)', 'canvas.rect()', 'draw.rect()'],
            answer: 1,
          },
        ],
      },
    ],
  },
  {
    id: 'u8',
    title: 'Unit 8 — Build a Game!',
    subtitle: 'Put it all together',
    color: '#f1c40f',
    icon: '🚀',
    lessons: [
      {
        id: 'u8-l1',
        title: 'Final Boss',
        icon: '🏅',
        questions: [
          {
            kind: 'mc',
            prompt: 'What is the best way to finish your game?',
            choices: ['Give up', 'Playtest it', 'Delete it', 'Hide it'],
            answer: 1,
          },
        ],
      },
    ],
  },
]
