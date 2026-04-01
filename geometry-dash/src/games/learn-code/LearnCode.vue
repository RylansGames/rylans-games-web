<template>
  <div class="lc-app">
    <!-- Step 1: Welcome -->
    <div v-if="step === 'welcome'" class="step-screen">
      <div class="step-card">
        <div class="step-icon">💻</div>
        <h1 class="step-title">Learn to Code!</h1>
        <p class="step-sub">Start your coding journey today!</p>
        <div class="step-info">
          <p>Before we begin, you'll need a code editor.</p>
          <p>We recommend <strong>Visual Studio Code</strong> (VS Code)</p>
          <p class="download-hint">It's free! Download it from:</p>
          <a href="https://code.visualstudio.com" target="_blank" class="download-link">
            📥 code.visualstudio.com
          </a>
        </div>
        <div class="step-buttons">
          <button class="step-btn ready" @click="step = 'setup'">✅ I already have it</button>
          <button class="step-btn download" @click="step = 'setup'">📥 Just downloaded it</button>
        </div>
        <button class="back-link" @click="$router.push('/')">← Back to Games</button>
      </div>
    </div>

    <!-- Step 2: Setup -->
    <div v-if="step === 'setup'" class="step-screen">
      <div class="step-card">
        <h2>🛠️ Setting Up VS Code</h2>
        <div class="setup-steps">
          <div class="ss" v-for="(s, i) in setupSteps" :key="i" :class="{ done: i < setupDone }">
            <span class="ss-num">{{ i + 1 }}</span>
            <span class="ss-text">{{ s }}</span>
          </div>
        </div>
        <button class="step-btn ready" @click="setupDone++; if (setupDone >= setupSteps.length) step = 'pick-lang'">
          {{ setupDone < setupSteps.length ? 'Done ✅ Next step' : 'All set! Let\'s go!' }}
        </button>
      </div>
    </div>

    <!-- Step 3: Pick language -->
    <div v-if="step === 'pick-lang'" class="step-screen">
      <div class="step-card">
        <h2>🌐 What do you want to learn?</h2>
        <p class="step-sub">Pick a language to start with!</p>
        <div class="lang-grid">
          <div v-for="lang in languages" :key="lang.id" class="lang-card" @click="selectLanguage(lang.id)">
            <div class="lang-icon">{{ lang.icon }}</div>
            <div class="lang-name">{{ lang.name }}</div>
            <div class="lang-desc">{{ lang.desc }}</div>
            <div class="lang-diff" :class="lang.difficulty">{{ lang.difficulty }}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Step 4: Lessons -->
    <div v-if="step === 'lesson'" class="lesson-screen">
      <div class="lesson-sidebar">
        <div class="ls-header">
          <span class="ls-lang">{{ currentLangData?.icon }} {{ currentLangData?.name }}</span>
          <button class="ls-back" @click="step = 'pick-lang'">← Languages</button>
        </div>
        <div class="ls-progress">
          {{ completedLessons.length }} / {{ currentLessons.length }} lessons
          <div class="ls-bar"><div class="ls-fill" :style="{ width: lessonProgress + '%' }"></div></div>
        </div>
        <div class="ls-list">
          <div v-for="(lesson, i) in currentLessons" :key="i" class="ls-item"
            :class="{ active: currentLessonIndex === i, done: completedLessons.includes(i) }"
            @click="goToLesson(i)">
            <span class="ls-check">{{ completedLessons.includes(i) ? '✅' : '📖' }}</span>
            <span>{{ lesson.title }}</span>
          </div>
        </div>
      </div>

      <div class="lesson-main">
        <div class="lesson-content">
          <h2 class="lesson-title">{{ currentLesson?.title }}</h2>
          <div class="lesson-explanation" v-html="currentLesson?.explanation"></div>

          <!-- Code example -->
          <div class="code-block" v-if="currentLesson?.code">
            <div class="cb-header">
              <span>{{ currentLesson?.codeFile || 'code' }}</span>
              <button class="copy-code" @click="copyCode">📋 Copy</button>
            </div>
            <pre class="cb-code"><code>{{ currentLesson?.code }}</code></pre>
          </div>

          <!-- Try it yourself -->
          <div class="try-section" v-if="currentLesson?.challenge">
            <h3>🎯 Try it yourself!</h3>
            <p>{{ currentLesson?.challenge }}</p>
            <textarea v-model="userCode" class="code-editor" :placeholder="currentLesson?.starterCode || 'Type your code here...'" rows="8"></textarea>
            <button class="run-btn" @click="checkChallenge">▶ Check Answer</button>
            <div v-if="challengeResult" class="challenge-result" :class="challengeResult.correct ? 'correct' : 'wrong'">
              {{ challengeResult.message }}
            </div>
          </div>

          <!-- Tip box -->
          <div class="tip-box" v-if="currentLesson?.tip">
            <span class="tip-icon">💡</span>
            <span>{{ currentLesson?.tip }}</span>
          </div>
        </div>

        <div class="lesson-nav">
          <button class="nav-btn prev" @click="prevLesson" :disabled="currentLessonIndex <= 0">← Previous</button>
          <button class="nav-btn next" @click="nextLesson">
            {{ currentLessonIndex >= currentLessons.length - 1 ? '🎉 Finish!' : 'Next →' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Completion -->
    <div v-if="step === 'complete'" class="step-screen">
      <div class="step-card">
        <div class="step-icon">🎉</div>
        <h1>You did it!</h1>
        <p>You completed all {{ currentLangData?.name }} lessons!</p>
        <p class="step-sub">Keep practicing and building projects!</p>
        <button class="step-btn ready" @click="step = 'pick-lang'">Learn Another Language</button>
        <button class="back-link" @click="$router.push('/')">← Back to Games</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { gameState } from '../../components/shared/GameState'
import { playerTracker } from '../../components/shared/PlayerTracker'
import { OnlineTracker } from '../../components/shared/OnlineTracker'
import { onMounted, onUnmounted } from 'vue'

const step = ref<'welcome' | 'setup' | 'pick-lang' | 'lesson' | 'complete'>('welcome')
const currentLang = ref('')
const currentLessonIndex = ref(0)
const completedLessons = ref<number[]>([])
const userCode = ref('')
const challengeResult = ref<{ correct: boolean; message: string } | null>(null)
const setupDone = ref(0)

const setupSteps = [
  'Open VS Code',
  'Create a new folder on your computer called "my-code"',
  'In VS Code, click File → Open Folder → select "my-code"',
  'Click the new file button and create "index.html"',
  'You\'re ready to code!',
]

interface Language {
  id: string; name: string; icon: string; desc: string; difficulty: string
}

const languages: Language[] = [
  { id: 'html', name: 'HTML', icon: '🌐', desc: 'Build web pages! The skeleton of every website.', difficulty: 'Beginner' },
  { id: 'css', name: 'CSS', icon: '🎨', desc: 'Make things pretty! Colors, fonts, layouts.', difficulty: 'Beginner' },
  { id: 'js', name: 'JavaScript', icon: '⚡', desc: 'Make things interactive! Buttons, games, apps.', difficulty: 'Intermediate' },
  { id: 'python', name: 'Python', icon: '🐍', desc: 'The easy language! Great for beginners.', difficulty: 'Beginner' },
]

interface Lesson {
  title: string
  explanation: string
  code?: string
  codeFile?: string
  challenge?: string
  starterCode?: string
  answer?: string
  tip?: string
}

const allLessons: Record<string, Lesson[]> = {
  html: [
    {
      title: 'What is HTML?',
      explanation: '<p>HTML stands for <strong>HyperText Markup Language</strong>. It\'s the language that makes web pages!</p><p>Every website you visit uses HTML. It tells the browser what to show - text, images, buttons, and more.</p><p>HTML uses <strong>tags</strong> that look like this: <code>&lt;tag&gt;content&lt;/tag&gt;</code></p>',
      tip: 'HTML is like the skeleton of a website - it gives it structure!',
    },
    {
      title: 'Your First HTML Page',
      explanation: '<p>Every HTML page starts with this basic structure. Copy this into your <code>index.html</code> file!</p>',
      code: '<!DOCTYPE html>\n<html>\n  <head>\n    <title>My First Page</title>\n  </head>\n  <body>\n    <h1>Hello World!</h1>\n    <p>This is my first web page!</p>\n  </body>\n</html>',
      codeFile: 'index.html',
      tip: 'Right-click your index.html file and "Open with Browser" to see it!',
    },
    {
      title: 'Headings',
      explanation: '<p>Headings make text big and bold. There are 6 sizes:</p><p><code>&lt;h1&gt;</code> is the biggest, <code>&lt;h6&gt;</code> is the smallest.</p>',
      code: '<h1>This is heading 1 (biggest)</h1>\n<h2>This is heading 2</h2>\n<h3>This is heading 3</h3>\n<h4>This is heading 4</h4>\n<h5>This is heading 5</h5>\n<h6>This is heading 6 (smallest)</h6>',
      codeFile: 'index.html',
      challenge: 'Write an h1 tag that says "My Name"',
      starterCode: '<h1>',
      answer: '<h1>My Name</h1>',
    },
    {
      title: 'Paragraphs',
      explanation: '<p>The <code>&lt;p&gt;</code> tag creates a paragraph of text. Use it for normal text on your page.</p>',
      code: '<p>This is a paragraph. It can have lots of text!</p>\n<p>This is another paragraph. Each one starts on a new line.</p>',
      codeFile: 'index.html',
      challenge: 'Write a paragraph that says "I am learning HTML"',
      starterCode: '<p>',
      answer: '<p>I am learning HTML</p>',
    },
    {
      title: 'Links',
      explanation: '<p>Links let people click to go to other pages! Use the <code>&lt;a&gt;</code> tag with an <code>href</code> attribute.</p>',
      code: '<a href="https://google.com">Click here to go to Google!</a>\n\n<a href="https://youtube.com">Go to YouTube</a>',
      codeFile: 'index.html',
      challenge: 'Write a link to google.com that says "Google"',
      starterCode: '<a href="',
      answer: '<a href="https://google.com">Google</a>',
    },
    {
      title: 'Images',
      explanation: '<p>Show pictures on your page with the <code>&lt;img&gt;</code> tag! It uses <code>src</code> for the image URL.</p><p>Note: <code>&lt;img&gt;</code> doesn\'t need a closing tag!</p>',
      code: '<img src="https://placekitten.com/300/200" alt="A cute cat">\n\n<img src="photo.jpg" alt="My photo" width="200">',
      codeFile: 'index.html',
      tip: 'The "alt" text describes the image for people who can\'t see it.',
    },
    {
      title: 'Lists',
      explanation: '<p>Make bullet points with <code>&lt;ul&gt;</code> (unordered list) or numbered lists with <code>&lt;ol&gt;</code> (ordered list). Each item uses <code>&lt;li&gt;</code>.</p>',
      code: '<h3>My Favorite Foods:</h3>\n<ul>\n  <li>Pizza</li>\n  <li>Tacos</li>\n  <li>Ice Cream</li>\n</ul>\n\n<h3>Steps to make a sandwich:</h3>\n<ol>\n  <li>Get bread</li>\n  <li>Add cheese</li>\n  <li>Eat!</li>\n</ol>',
      codeFile: 'index.html',
      challenge: 'Write a bullet list with 2 items: "Dog" and "Cat"',
      starterCode: '<ul>\n  <li>',
      answer: '<ul>\n  <li>Dog</li>\n  <li>Cat</li>\n</ul>',
    },
    {
      title: 'Buttons',
      explanation: '<p>Buttons are clickable! Use the <code>&lt;button&gt;</code> tag. Later with JavaScript, you can make them do things!</p>',
      code: '<button>Click Me!</button>\n<button>Submit</button>\n<button>Play Game</button>',
      codeFile: 'index.html',
      challenge: 'Write a button that says "Hello"',
      starterCode: '<button>',
      answer: '<button>Hello</button>',
    },
    {
      title: 'Divs and Structure',
      explanation: '<p>The <code>&lt;div&gt;</code> tag is a container - it groups things together. It\'s like a box you put other elements in.</p>',
      code: '<div>\n  <h2>About Me</h2>\n  <p>I am learning to code!</p>\n  <p>It\'s really fun!</p>\n</div>\n\n<div>\n  <h2>My Hobbies</h2>\n  <ul>\n    <li>Coding</li>\n    <li>Gaming</li>\n  </ul>\n</div>',
      codeFile: 'index.html',
      tip: 'Divs are invisible by default - you use CSS to style them!',
    },
    {
      title: '🎉 HTML Complete!',
      explanation: '<p>Congratulations! You now know the basics of HTML!</p><p><strong>What you learned:</strong></p><ul><li>HTML structure (html, head, body)</li><li>Headings (h1-h6)</li><li>Paragraphs (p)</li><li>Links (a)</li><li>Images (img)</li><li>Lists (ul, ol, li)</li><li>Buttons</li><li>Divs</li></ul><p>Next step: Learn <strong>CSS</strong> to make your pages look awesome!</p>',
    },
  ],
  css: [
    {
      title: 'What is CSS?',
      explanation: '<p><strong>CSS</strong> stands for Cascading Style Sheets. It makes HTML look pretty!</p><p>Without CSS, websites would be plain black text on white. CSS adds colors, fonts, spacing, layouts, and animations.</p>',
      tip: 'If HTML is the skeleton, CSS is the skin and clothes!',
    },
    {
      title: 'Adding CSS to HTML',
      explanation: '<p>Add CSS inside a <code>&lt;style&gt;</code> tag in your HTML. Put it in the <code>&lt;head&gt;</code> section.</p>',
      code: '<!DOCTYPE html>\n<html>\n<head>\n  <title>My Styled Page</title>\n  <style>\n    h1 {\n      color: blue;\n    }\n    p {\n      color: green;\n      font-size: 20px;\n    }\n  </style>\n</head>\n<body>\n  <h1>Hello!</h1>\n  <p>This text is green and big!</p>\n</body>\n</html>',
      codeFile: 'index.html',
    },
    {
      title: 'Colors',
      explanation: '<p>Change colors with the <code>color</code> property (text) and <code>background-color</code> (background).</p><p>You can use color names, hex codes, or rgb values!</p>',
      code: 'h1 {\n  color: red;\n}\n\np {\n  color: #3b82f6;  /* hex code for blue */\n}\n\ndiv {\n  background-color: yellow;\n  color: black;\n}',
      codeFile: 'style',
      challenge: 'Write CSS to make h1 text color purple',
      starterCode: 'h1 {\n  color: ',
      answer: 'h1 {\n  color: purple;\n}',
    },
    {
      title: 'Fonts and Text',
      explanation: '<p>Control how text looks with these properties:</p>',
      code: 'h1 {\n  font-size: 48px;        /* how big */\n  font-weight: bold;      /* how thick */\n  font-family: Arial;     /* which font */\n  text-align: center;     /* centered */\n}\n\np {\n  font-size: 18px;\n  line-height: 1.5;       /* space between lines */\n  letter-spacing: 2px;    /* space between letters */\n}',
      codeFile: 'style',
      tip: 'Common fonts: Arial, Helvetica, Times New Roman, Courier',
    },
    {
      title: 'Borders and Rounded Corners',
      explanation: '<p>Add borders around elements and round the corners!</p>',
      code: 'div {\n  border: 2px solid blue;\n  border-radius: 10px;    /* rounded corners */\n  padding: 20px;          /* space inside */\n  margin: 10px;           /* space outside */\n}\n\nimg {\n  border-radius: 50%;     /* makes it a circle! */\n}',
      codeFile: 'style',
      challenge: 'Write CSS to give a div a red border that is 3px solid',
      starterCode: 'div {\n  border: ',
      answer: 'div {\n  border: 3px solid red;\n}',
    },
    {
      title: 'Box Model (Padding & Margin)',
      explanation: '<p>Every element is a box! The box model has:</p><ul><li><strong>Content</strong> - the actual text/image</li><li><strong>Padding</strong> - space INSIDE the border</li><li><strong>Border</strong> - the edge</li><li><strong>Margin</strong> - space OUTSIDE the border</li></ul>',
      code: 'div {\n  padding: 20px;     /* all sides */\n  margin: 10px;      /* all sides */\n  \n  /* Or each side separately: */\n  padding-top: 10px;\n  padding-right: 20px;\n  padding-bottom: 10px;\n  padding-left: 20px;\n}',
      codeFile: 'style',
    },
    {
      title: 'Hover Effects',
      explanation: '<p>Make things change when you hover over them with <code>:hover</code>!</p>',
      code: 'button {\n  background: blue;\n  color: white;\n  padding: 10px 20px;\n  border: none;\n  border-radius: 8px;\n  cursor: pointer;\n}\n\nbutton:hover {\n  background: darkblue;\n  transform: scale(1.1);  /* grows bigger! */\n}',
      codeFile: 'style',
      tip: 'Add "transition: all 0.3s;" to make the change smooth!',
    },
    {
      title: '🎉 CSS Complete!',
      explanation: '<p>You now know CSS basics!</p><p><strong>What you learned:</strong></p><ul><li>Adding CSS to HTML</li><li>Colors (text and background)</li><li>Fonts and text styling</li><li>Borders and rounded corners</li><li>Padding and margin</li><li>Hover effects</li></ul><p>Next: Learn <strong>JavaScript</strong> to make things interactive!</p>',
    },
  ],
  js: [
    {
      title: 'What is JavaScript?',
      explanation: '<p><strong>JavaScript</strong> (JS) makes websites interactive! Buttons that do things, animations, games - all JavaScript.</p><p>It\'s the most popular programming language in the world!</p>',
      tip: 'JavaScript runs in the browser - no installation needed!',
    },
    {
      title: 'Your First Script',
      explanation: '<p>Add JavaScript with a <code>&lt;script&gt;</code> tag. <code>alert()</code> shows a popup message!</p>',
      code: '<script>\n  alert("Hello World!");\n</script>',
      codeFile: 'index.html',
      tip: 'Put the script tag at the bottom of your body tag!',
    },
    {
      title: 'Variables',
      explanation: '<p>Variables store data. Use <code>let</code> to create one.</p>',
      code: 'let name = "Rylan";\nlet age = 8;\nlet isAwesome = true;\n\nconsole.log(name);  // prints "Rylan"\nconsole.log(age);   // prints 8',
      codeFile: 'script.js',
      challenge: 'Create a variable called "color" and set it to "blue"',
      starterCode: 'let color',
      answer: 'let color = "blue";',
    },
    {
      title: 'Math',
      explanation: '<p>JavaScript can do math! Use +, -, *, / for basic math.</p>',
      code: 'let a = 10;\nlet b = 5;\n\nconsole.log(a + b);  // 15 (add)\nconsole.log(a - b);  // 5 (subtract)\nconsole.log(a * b);  // 50 (multiply)\nconsole.log(a / b);  // 2 (divide)',
      codeFile: 'script.js',
      challenge: 'Write code to multiply 7 times 3 and store it in a variable called "result"',
      starterCode: 'let result',
      answer: 'let result = 7 * 3;',
    },
    {
      title: 'If Statements',
      explanation: '<p>Make decisions with <code>if</code>! Run code only when something is true.</p>',
      code: 'let age = 8;\n\nif (age >= 10) {\n  console.log("You are 10 or older!");\n} else {\n  console.log("You are under 10!");\n}\n\nlet score = 95;\nif (score >= 90) {\n  console.log("A grade!");\n} else if (score >= 80) {\n  console.log("B grade!");\n} else {\n  console.log("Keep trying!");\n}',
      codeFile: 'script.js',
    },
    {
      title: 'Functions',
      explanation: '<p>Functions are reusable blocks of code. Define once, use many times!</p>',
      code: 'function sayHello(name) {\n  console.log("Hello " + name + "!");\n}\n\nsayHello("Rylan");   // "Hello Rylan!"\nsayHello("David");   // "Hello David!"\n\nfunction add(a, b) {\n  return a + b;\n}\n\nlet total = add(5, 3);  // total = 8',
      codeFile: 'script.js',
      challenge: 'Write a function called "double" that takes a number and returns it times 2',
      starterCode: 'function double(num) {\n  return',
      answer: 'function double(num) {\n  return num * 2;\n}',
    },
    {
      title: 'DOM - Changing the Page',
      explanation: '<p>JavaScript can change HTML on the page! Use <code>document.getElementById()</code> to find elements.</p>',
      code: '<!-- In your HTML: -->\n<h1 id="title">Hello!</h1>\n<button onclick="changeTitle()">Click Me!</button>\n\n<script>\nfunction changeTitle() {\n  document.getElementById("title").textContent = "You clicked the button!";\n  document.getElementById("title").style.color = "red";\n}\n</script>',
      codeFile: 'index.html',
      tip: 'This is how buttons, forms, and interactive websites work!',
    },
    {
      title: '🎉 JavaScript Complete!',
      explanation: '<p>Amazing! You now know JavaScript basics!</p><p><strong>What you learned:</strong></p><ul><li>Alert and console.log</li><li>Variables (let)</li><li>Math operations</li><li>If/else statements</li><li>Functions</li><li>Changing the page (DOM)</li></ul><p>You now know HTML + CSS + JS - the 3 languages of the web! Keep building!</p>',
    },
  ],
  python: [
    {
      title: 'What is Python?',
      explanation: '<p><strong>Python</strong> is one of the easiest programming languages! It\'s used for AI, games, websites, and more.</p><p>To run Python, you\'ll need to install it from <a href="https://python.org" target="_blank">python.org</a></p>',
      tip: 'Python reads almost like English - that\'s why it\'s great for beginners!',
    },
    {
      title: 'Print - Your First Program',
      explanation: '<p><code>print()</code> shows text on the screen. It\'s the first thing every programmer learns!</p>',
      code: 'print("Hello World!")\nprint("My name is Rylan")\nprint("I am learning Python!")',
      codeFile: 'hello.py',
      challenge: 'Write a print statement that says "I love coding"',
      starterCode: 'print(',
      answer: 'print("I love coding")',
    },
    {
      title: 'Variables',
      explanation: '<p>Store data in variables. Python is easy - just type the name and value!</p>',
      code: 'name = "Rylan"\nage = 8\nfavorite_color = "blue"\n\nprint(name)           # Rylan\nprint(age)            # 8\nprint(favorite_color)  # blue',
      codeFile: 'variables.py',
      challenge: 'Create a variable called "food" and set it to "pizza"',
      starterCode: 'food',
      answer: 'food = "pizza"',
    },
    {
      title: 'Math',
      explanation: '<p>Python is great at math!</p>',
      code: 'a = 10\nb = 3\n\nprint(a + b)   # 13\nprint(a - b)   # 7\nprint(a * b)   # 30\nprint(a / b)   # 3.333...\nprint(a ** 2)  # 100 (power of 2)',
      codeFile: 'math.py',
    },
    {
      title: 'Input - Ask the User',
      explanation: '<p><code>input()</code> asks the user to type something!</p>',
      code: 'name = input("What is your name? ")\nprint("Hello " + name + "!")\n\nage = input("How old are you? ")\nprint("You are " + age + " years old!")',
      codeFile: 'input.py',
      tip: 'Run this in the terminal: python input.py',
    },
    {
      title: 'If Statements',
      explanation: '<p>Make decisions! Python uses indentation (spaces) instead of curly braces.</p>',
      code: 'age = 8\n\nif age >= 10:\n    print("You are 10 or older!")\nelse:\n    print("You are under 10!")\n\nscore = 95\nif score >= 90:\n    print("A grade!")\nelif score >= 80:\n    print("B grade!")\nelse:\n    print("Keep trying!")',
      codeFile: 'if.py',
    },
    {
      title: 'Loops',
      explanation: '<p>Repeat code with loops! <code>for</code> loops repeat a set number of times.</p>',
      code: '# Count from 1 to 5\nfor i in range(1, 6):\n    print(i)\n\n# Print a list\nfruits = ["apple", "banana", "cherry"]\nfor fruit in fruits:\n    print("I like " + fruit)',
      codeFile: 'loops.py',
      challenge: 'Write a for loop that prints numbers 1 to 3',
      starterCode: 'for i in range(',
      answer: 'for i in range(1, 4):\n    print(i)',
    },
    {
      title: 'Functions',
      explanation: '<p>Create reusable code with <code>def</code>!</p>',
      code: 'def say_hello(name):\n    print("Hello " + name + "!")\n\nsay_hello("Rylan")  # Hello Rylan!\nsay_hello("Mom")    # Hello Mom!\n\ndef add(a, b):\n    return a + b\n\nresult = add(5, 3)\nprint(result)  # 8',
      codeFile: 'functions.py',
    },
    {
      title: '🎉 Python Complete!',
      explanation: '<p>You now know Python basics!</p><p><strong>What you learned:</strong></p><ul><li>print()</li><li>Variables</li><li>Math</li><li>Input from the user</li><li>If/elif/else</li><li>For loops</li><li>Functions</li></ul><p>Python is used everywhere - AI, games, websites, robots! Keep going!</p>',
    },
  ],
}

const currentLangData = computed(() => languages.find(l => l.id === currentLang.value))
const currentLessons = computed(() => allLessons[currentLang.value] || [])
const currentLesson = computed(() => currentLessons.value[currentLessonIndex.value])
const lessonProgress = computed(() => {
  if (currentLessons.value.length === 0) return 0
  return (completedLessons.value.length / currentLessons.value.length) * 100
})

function selectLanguage(langId: string) {
  currentLang.value = langId
  currentLessonIndex.value = 0
  completedLessons.value = JSON.parse(localStorage.getItem('lc-done-' + langId) || '[]')
  userCode.value = ''
  challengeResult.value = null
  step.value = 'lesson'
}

function goToLesson(index: number) {
  currentLessonIndex.value = index
  userCode.value = ''
  challengeResult.value = null
}

function nextLesson() {
  if (!completedLessons.value.includes(currentLessonIndex.value)) {
    completedLessons.value.push(currentLessonIndex.value)
    localStorage.setItem('lc-done-' + currentLang.value, JSON.stringify(completedLessons.value))
  }
  if (currentLessonIndex.value < currentLessons.value.length - 1) {
    currentLessonIndex.value++
    userCode.value = ''
    challengeResult.value = null
  } else {
    step.value = 'complete'
  }
}

function prevLesson() {
  if (currentLessonIndex.value > 0) {
    currentLessonIndex.value--
    userCode.value = ''
    challengeResult.value = null
  }
}

function checkChallenge() {
  const lesson = currentLesson.value
  if (!lesson?.answer) return
  const clean = (s: string) => s.replace(/\s+/g, ' ').trim().toLowerCase()
  if (clean(userCode.value).includes(clean(lesson.answer)) || clean(userCode.value) === clean(lesson.answer)) {
    challengeResult.value = { correct: true, message: '✅ Correct! Great job!' }
  } else {
    challengeResult.value = { correct: false, message: '❌ Not quite. Check the example above and try again!' }
  }
}

function copyCode() {
  if (currentLesson.value?.code) {
    navigator.clipboard?.writeText(currentLesson.value.code)
  }
}

onMounted(() => {
  playerTracker.startSession(gameState.playerName || 'Player', gameState.getCoins(), 1, 0, 0, 'Learn to Code')
  OnlineTracker.goOnline(gameState.playerName || 'Player', gameState.getCoins(), 1, 0, 0, 'Learn to Code')
  OnlineTracker.onAdminAction((action) => {
    if (action.type === 'grantCoins' && action.amount) gameState.addCoins(action.amount)
  })
})

onUnmounted(() => {
  playerTracker.endSession()
  OnlineTracker.goOffline()
})
</script>

<style scoped>
.lc-app { font-family: 'Segoe UI', system-ui, sans-serif; min-height: 100vh; background: #0f172a; color: #e2e8f0; }

.step-screen { min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 20px; }
.step-card {
  background: #1e293b; border-radius: 20px; padding: 36px; text-align: center;
  max-width: 500px; width: 100%; border: 1px solid #334155;
}
.step-icon { font-size: 64px; margin-bottom: 8px; }
.step-title { color: #fff; font-size: 32px; font-weight: 900; margin: 0 0 8px; }
.step-sub { color: #94a3b8; font-size: 15px; margin: 0 0 20px; }
.step-info { text-align: left; margin-bottom: 20px; }
.step-info p { margin: 6px 0; color: #cbd5e1; font-size: 15px; }
.download-hint { color: #94a3b8; font-style: italic; }
.download-link {
  display: inline-block; padding: 10px 20px; background: #3b82f6; color: #fff;
  text-decoration: none; border-radius: 10px; font-weight: 700; margin-top: 8px;
}
.step-buttons { display: flex; flex-direction: column; gap: 10px; }
.step-btn {
  padding: 14px 24px; border-radius: 12px; border: none; font-size: 16px;
  font-weight: 700; cursor: pointer; transition: transform 0.15s;
}
.step-btn:hover { transform: translateY(-2px); }
.step-btn.ready { background: #22c55e; color: #fff; }
.step-btn.download { background: #3b82f6; color: #fff; }
.back-link { display: block; margin-top: 14px; background: none; border: none; color: #666; font-size: 13px; cursor: pointer; }

/* Setup steps */
.setup-steps { text-align: left; margin-bottom: 20px; }
.ss {
  display: flex; align-items: center; gap: 10px; padding: 10px; margin: 6px 0;
  background: #0f172a; border-radius: 8px; border: 1px solid #334155;
}
.ss.done { border-color: #22c55e; background: rgba(34,197,94,0.1); }
.ss-num {
  width: 28px; height: 28px; border-radius: 50%; background: #334155;
  display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 14px; flex-shrink: 0;
}
.ss.done .ss-num { background: #22c55e; }
.ss-text { font-size: 14px; }

/* Language grid */
.lang-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; text-align: left; }
.lang-card {
  background: #0f172a; border: 2px solid #334155; border-radius: 14px; padding: 16px;
  cursor: pointer; transition: all 0.15s;
}
.lang-card:hover { border-color: #3b82f6; transform: translateY(-3px); }
.lang-icon { font-size: 32px; margin-bottom: 4px; }
.lang-name { color: #fff; font-size: 18px; font-weight: 800; }
.lang-desc { color: #94a3b8; font-size: 12px; margin: 4px 0; }
.lang-diff { font-size: 11px; font-weight: 700; padding: 2px 8px; border-radius: 4px; display: inline-block; }
.lang-diff.Beginner { background: rgba(34,197,94,0.2); color: #4ade80; }
.lang-diff.Intermediate { background: rgba(251,191,36,0.2); color: #fbbf24; }

/* Lesson screen */
.lesson-screen { display: flex; min-height: 100vh; }
.lesson-sidebar {
  width: 260px; background: #1e293b; border-right: 1px solid #334155;
  display: flex; flex-direction: column; flex-shrink: 0; overflow-y: auto;
}
.ls-header { padding: 14px; border-bottom: 1px solid #334155; }
.ls-lang { color: #fff; font-size: 16px; font-weight: 800; }
.ls-back { display: block; margin-top: 6px; background: none; border: none; color: #3b82f6; font-size: 12px; cursor: pointer; }
.ls-progress { padding: 10px 14px; border-bottom: 1px solid #334155; font-size: 12px; color: #94a3b8; }
.ls-bar { height: 4px; background: #334155; border-radius: 2px; margin-top: 6px; }
.ls-fill { height: 100%; background: #22c55e; border-radius: 2px; transition: width 0.3s; }
.ls-list { flex: 1; padding: 8px 0; }
.ls-item {
  display: flex; align-items: center; gap: 8px; padding: 8px 14px; font-size: 13px;
  color: #94a3b8; cursor: pointer; transition: background 0.15s;
}
.ls-item:hover { background: #0f172a; color: #fff; }
.ls-item.active { background: #0f172a; color: #3b82f6; font-weight: 700; }
.ls-item.done { color: #4ade80; }
.ls-check { font-size: 14px; }

.lesson-main { flex: 1; display: flex; flex-direction: column; overflow-y: auto; }
.lesson-content { flex: 1; padding: 24px 32px; max-width: 750px; }
.lesson-title { color: #fff; font-size: 26px; font-weight: 900; margin: 0 0 16px; }
.lesson-explanation { color: #cbd5e1; font-size: 15px; line-height: 1.7; margin-bottom: 20px; }
.lesson-explanation :deep(code) { background: #334155; padding: 2px 6px; border-radius: 4px; color: #fbbf24; font-size: 14px; }
.lesson-explanation :deep(strong) { color: #fff; }
.lesson-explanation :deep(ul) { padding-left: 20px; }
.lesson-explanation :deep(li) { margin: 4px 0; }
.lesson-explanation :deep(a) { color: #3b82f6; }

/* Code block */
.code-block {
  background: #0f172a; border: 1px solid #334155; border-radius: 10px; margin-bottom: 20px; overflow: hidden;
}
.cb-header {
  display: flex; justify-content: space-between; align-items: center;
  padding: 6px 14px; background: #1e293b; font-size: 12px; color: #94a3b8;
}
.copy-code { background: none; border: none; color: #3b82f6; font-size: 12px; cursor: pointer; }
.cb-code { margin: 0; padding: 16px; font-size: 14px; color: #e2e8f0; overflow-x: auto; line-height: 1.6; font-family: 'Courier New', monospace; }

/* Challenge */
.try-section { background: #1e293b; border: 1px solid #334155; border-radius: 10px; padding: 16px; margin-bottom: 20px; }
.try-section h3 { color: #fbbf24; margin: 0 0 8px; }
.try-section p { color: #94a3b8; font-size: 14px; margin: 0 0 12px; }
.code-editor {
  width: 100%; padding: 12px; background: #0f172a; color: #e2e8f0; border: 1px solid #334155;
  border-radius: 8px; font-family: 'Courier New', monospace; font-size: 14px; resize: vertical;
  outline: none; box-sizing: border-box;
}
.code-editor:focus { border-color: #3b82f6; }
.run-btn {
  margin-top: 8px; padding: 8px 20px; background: #22c55e; color: #fff; border: none;
  border-radius: 8px; font-size: 14px; font-weight: 700; cursor: pointer;
}
.challenge-result { margin-top: 8px; padding: 8px 12px; border-radius: 6px; font-size: 14px; font-weight: 600; }
.challenge-result.correct { background: rgba(34,197,94,0.15); color: #4ade80; }
.challenge-result.wrong { background: rgba(239,68,68,0.15); color: #f87171; }

/* Tip */
.tip-box {
  display: flex; align-items: flex-start; gap: 8px; background: rgba(251,191,36,0.1);
  border: 1px solid rgba(251,191,36,0.2); border-radius: 8px; padding: 12px; margin-bottom: 16px;
}
.tip-icon { font-size: 18px; }

/* Nav */
.lesson-nav {
  display: flex; justify-content: space-between; padding: 16px 32px; border-top: 1px solid #334155;
}
.nav-btn {
  padding: 10px 24px; border-radius: 10px; border: none; font-size: 14px;
  font-weight: 700; cursor: pointer;
}
.nav-btn:disabled { opacity: 0.3; cursor: not-allowed; }
.nav-btn.prev { background: #334155; color: #fff; }
.nav-btn.next { background: #3b82f6; color: #fff; }

/* Mobile */
@media (max-width: 700px) {
  .lesson-screen { flex-direction: column; }
  .lesson-sidebar { width: 100%; max-height: 200px; border-right: none; border-bottom: 1px solid #334155; }
  .lesson-content { padding: 16px; }
  .lesson-nav { padding: 12px 16px; }
  .lang-grid { grid-template-columns: 1fr; }
  .step-card { padding: 24px 16px; }
}
</style>
