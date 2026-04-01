export interface Lesson {
  title: string
  explanation: string
  code?: string
  codeFile?: string
  challenge?: string
  starterCode?: string
  answer?: string
  tip?: string
}

export interface Language {
  id: string; name: string; icon: string; desc: string; difficulty: string
}

export const languages: Language[] = [
  { id: 'html', name: 'HTML', icon: '\u{1F310}', desc: 'Build web pages! The skeleton of every website.', difficulty: 'Beginner' },
  { id: 'css', name: 'CSS', icon: '\u{1F3A8}', desc: 'Make things pretty! Colors, fonts, layouts.', difficulty: 'Beginner' },
  { id: 'js', name: 'JavaScript', icon: '\u{26A1}', desc: 'Make things interactive! Buttons, games, apps.', difficulty: 'Intermediate' },
  { id: 'python', name: 'Python', icon: '\u{1F40D}', desc: 'The easy language! Great for beginners.', difficulty: 'Beginner' },
]

const p = (t: string) => t
const c = (t: string) => t

export const allLessons: Record<string, Lesson[]> = {
  html: [
    {
      title: 'What is HTML?',
      explanation: p('HTML stands for HyperText Markup Language. It is the language that makes web pages! Every website you visit uses HTML. It tells the browser what to show - text, images, buttons, and more. HTML uses tags that look like this: tag content /tag'),
      tip: 'HTML is like the skeleton of a website - it gives it structure!',
    },
    {
      title: 'Your First HTML Page',
      explanation: p('Every HTML page starts with this basic structure. Copy this into your index.html file!'),
      code: '<!DOCTYPE html>\n<html>\n  <head>\n    <title>My First Page</title>\n  </head>\n  <body>\n    <h1>Hello World!</h1>\n    <p>This is my first web page!</p>\n  </body>\n</html>',
      codeFile: 'index.html',
      tip: 'Right-click your index.html file and Open with Browser to see it!',
    },
    {
      title: 'Headings',
      explanation: p('Headings make text big and bold. There are 6 sizes: h1 is the biggest, h6 is the smallest.'),
      code: '<h1>This is heading 1 (biggest)</h1>\n<h2>This is heading 2</h2>\n<h3>This is heading 3</h3>\n<h4>This is heading 4</h4>\n<h5>This is heading 5</h5>\n<h6>This is heading 6 (smallest)</h6>',
      codeFile: 'index.html',
      challenge: 'Write an h1 tag that says "My Name"',
      starterCode: '<h1>',
      answer: '<h1>My Name</h1>',
    },
    {
      title: 'Paragraphs',
      explanation: p('The p tag creates a paragraph of text. Use it for normal text on your page.'),
      code: '<p>This is a paragraph. It can have lots of text!</p>\n<p>This is another paragraph. Each one starts on a new line.</p>',
      codeFile: 'index.html',
      challenge: 'Write a paragraph that says "I am learning HTML"',
      starterCode: '<p>',
      answer: '<p>I am learning HTML</p>',
    },
    {
      title: 'Links',
      explanation: p('Links let people click to go to other pages! Use the a tag with an href attribute.'),
      code: '<a href="https://google.com">Click here to go to Google!</a>\n\n<a href="https://youtube.com">Go to YouTube</a>',
      codeFile: 'index.html',
      challenge: 'Write a link to google.com that says "Google"',
      starterCode: '<a href="',
      answer: '<a href="https://google.com">Google</a>',
    },
    {
      title: 'Images',
      explanation: p('Show pictures on your page with the img tag! It uses src for the image URL. Note: img does not need a closing tag!'),
      code: '<img src="https://placekitten.com/300/200" alt="A cute cat">\n\n<img src="photo.jpg" alt="My photo" width="200">',
      codeFile: 'index.html',
      tip: 'The "alt" text describes the image for people who can not see it.',
    },
    {
      title: 'Lists',
      explanation: p('Make bullet points with ul (unordered list) or numbered lists with ol (ordered list). Each item uses li.'),
      code: '<h3>My Favorite Foods:</h3>\n<ul>\n  <li>Pizza</li>\n  <li>Tacos</li>\n  <li>Ice Cream</li>\n</ul>\n\n<h3>Steps to make a sandwich:</h3>\n<ol>\n  <li>Get bread</li>\n  <li>Add cheese</li>\n  <li>Eat!</li>\n</ol>',
      codeFile: 'index.html',
      challenge: 'Write a bullet list with 2 items: "Dog" and "Cat"',
      starterCode: '<ul>\n  <li>',
      answer: '<ul>\n  <li>Dog</li>\n  <li>Cat</li>\n</ul>',
    },
    {
      title: 'Buttons',
      explanation: p('Buttons are clickable! Use the button tag. Later with JavaScript, you can make them do things!'),
      code: '<button>Click Me!</button>\n<button>Submit</button>\n<button>Play Game</button>',
      codeFile: 'index.html',
      challenge: 'Write a button that says "Hello"',
      starterCode: '<button>',
      answer: '<button>Hello</button>',
    },
    {
      title: 'Divs and Structure',
      explanation: p('The div tag is a container - it groups things together. It is like a box you put other elements in.'),
      code: '<div>\n  <h2>About Me</h2>\n  <p>I am learning to code!</p>\n  <p>It is really fun!</p>\n</div>\n\n<div>\n  <h2>My Hobbies</h2>\n  <ul>\n    <li>Coding</li>\n    <li>Gaming</li>\n  </ul>\n</div>',
      codeFile: 'index.html',
      tip: 'Divs are invisible by default - you use CSS to style them!',
    },
    {
      title: 'HTML Complete!',
      explanation: p('Congratulations! You now know the basics of HTML! You learned: HTML structure (html, head, body), Headings (h1-h6), Paragraphs (p), Links (a), Images (img), Lists (ul, ol, li), Buttons, and Divs. Next step: Learn CSS to make your pages look awesome!'),
    },
  ],
  css: [
    {
      title: 'What is CSS?',
      explanation: p('CSS stands for Cascading Style Sheets. It makes HTML look pretty! Without CSS, websites would be plain black text on white. CSS adds colors, fonts, spacing, layouts, and animations.'),
      tip: 'If HTML is the skeleton, CSS is the skin and clothes!',
    },
    {
      title: 'Adding CSS to HTML',
      explanation: p('Add CSS inside a style tag in your HTML. Put it in the head section.'),
      code: '<!DOCTYPE html>\n<html>\n<head>\n  <title>My Styled Page</title>\n  <style>\n    h1 {\n      color: blue;\n    }\n    p {\n      color: green;\n      font-size: 20px;\n    }\n  </style>\n</head>\n<body>\n  <h1>Hello!</h1>\n  <p>This text is green and big!</p>\n</body>\n</html>',
      codeFile: 'index.html',
    },
    {
      title: 'Colors',
      explanation: p('Change colors with the color property (text) and background-color (background). You can use color names, hex codes, or rgb values!'),
      code: 'h1 {\n  color: red;\n}\n\np {\n  color: #3b82f6;  /* hex code for blue */\n}\n\ndiv {\n  background-color: yellow;\n  color: black;\n}',
      codeFile: 'style',
      challenge: 'Write CSS to make h1 text color purple',
      starterCode: 'h1 {\n  color: ',
      answer: 'h1 {\n  color: purple;\n}',
    },
    {
      title: 'Fonts and Text',
      explanation: p('Control how text looks with these properties:'),
      code: 'h1 {\n  font-size: 48px;        /* how big */\n  font-weight: bold;      /* how thick */\n  font-family: Arial;     /* which font */\n  text-align: center;     /* centered */\n}\n\np {\n  font-size: 18px;\n  line-height: 1.5;       /* space between lines */\n  letter-spacing: 2px;    /* space between letters */\n}',
      codeFile: 'style',
      tip: 'Common fonts: Arial, Helvetica, Times New Roman, Courier',
    },
    {
      title: 'Borders and Rounded Corners',
      explanation: p('Add borders around elements and round the corners!'),
      code: 'div {\n  border: 2px solid blue;\n  border-radius: 10px;    /* rounded corners */\n  padding: 20px;          /* space inside */\n  margin: 10px;           /* space outside */\n}\n\nimg {\n  border-radius: 50%;     /* makes it a circle! */\n}',
      codeFile: 'style',
      challenge: 'Write CSS to give a div a red border that is 3px solid',
      starterCode: 'div {\n  border: ',
      answer: 'div {\n  border: 3px solid red;\n}',
    },
    {
      title: 'Box Model (Padding and Margin)',
      explanation: p('Every element is a box! The box model has: Content (the actual text/image), Padding (space INSIDE the border), Border (the edge), and Margin (space OUTSIDE the border).'),
      code: 'div {\n  padding: 20px;     /* all sides */\n  margin: 10px;      /* all sides */\n  \n  /* Or each side separately: */\n  padding-top: 10px;\n  padding-right: 20px;\n  padding-bottom: 10px;\n  padding-left: 20px;\n}',
      codeFile: 'style',
    },
    {
      title: 'Hover Effects',
      explanation: p('Make things change when you hover over them with :hover!'),
      code: 'button {\n  background: blue;\n  color: white;\n  padding: 10px 20px;\n  border: none;\n  border-radius: 8px;\n  cursor: pointer;\n}\n\nbutton:hover {\n  background: darkblue;\n  transform: scale(1.1);  /* grows bigger! */\n}',
      codeFile: 'style',
      tip: 'Add "transition: all 0.3s;" to make the change smooth!',
    },
    {
      title: 'CSS Complete!',
      explanation: p('You now know CSS basics! You learned: Adding CSS to HTML, Colors (text and background), Fonts and text styling, Borders and rounded corners, Padding and margin, Hover effects. Next: Learn JavaScript to make things interactive!'),
    },
  ],
  js: [
    {
      title: 'What is JavaScript?',
      explanation: p('JavaScript (JS) makes websites interactive! Buttons that do things, animations, games - all JavaScript. It is the most popular programming language in the world!'),
      tip: 'JavaScript runs in the browser - no installation needed!',
    },
    {
      title: 'Your First Script',
      explanation: p('Add JavaScript with a script tag. alert() shows a popup message!'),
      code: '<script>\n  alert("Hello World!");\n<\/script>',
      codeFile: 'index.html',
      tip: 'Put the script tag at the bottom of your body tag!',
    },
    {
      title: 'Variables',
      explanation: p('Variables store data. Use let to create one.'),
      code: 'let name = "Rylan";\nlet age = 8;\nlet isAwesome = true;\n\nconsole.log(name);  // prints "Rylan"\nconsole.log(age);   // prints 8',
      codeFile: 'script.js',
      challenge: 'Create a variable called "color" and set it to "blue"',
      starterCode: 'let color',
      answer: 'let color = "blue";',
    },
    {
      title: 'Math',
      explanation: p('JavaScript can do math! Use +, -, *, / for basic math.'),
      code: 'let a = 10;\nlet b = 5;\n\nconsole.log(a + b);  // 15 (add)\nconsole.log(a - b);  // 5 (subtract)\nconsole.log(a * b);  // 50 (multiply)\nconsole.log(a / b);  // 2 (divide)',
      codeFile: 'script.js',
      challenge: 'Write code to multiply 7 times 3 and store it in a variable called "result"',
      starterCode: 'let result',
      answer: 'let result = 7 * 3;',
    },
    {
      title: 'If Statements',
      explanation: p('Make decisions with if! Run code only when something is true.'),
      code: 'let age = 8;\n\nif (age >= 10) {\n  console.log("You are 10 or older!");\n} else {\n  console.log("You are under 10!");\n}\n\nlet score = 95;\nif (score >= 90) {\n  console.log("A grade!");\n} else if (score >= 80) {\n  console.log("B grade!");\n} else {\n  console.log("Keep trying!");\n}',
      codeFile: 'script.js',
    },
    {
      title: 'Functions',
      explanation: p('Functions are reusable blocks of code. Define once, use many times!'),
      code: 'function sayHello(name) {\n  console.log("Hello " + name + "!");\n}\n\nsayHello("Rylan");   // "Hello Rylan!"\nsayHello("David");   // "Hello David!"\n\nfunction add(a, b) {\n  return a + b;\n}\n\nlet total = add(5, 3);  // total = 8',
      codeFile: 'script.js',
      challenge: 'Write a function called "double" that takes a number and returns it times 2',
      starterCode: 'function double(num) {\n  return',
      answer: 'function double(num) {\n  return num * 2;\n}',
    },
    {
      title: 'DOM - Changing the Page',
      explanation: p('JavaScript can change HTML on the page! Use document.getElementById() to find elements.'),
      code: '<!-- In your HTML: -->\n<h1 id="title">Hello!</h1>\n<button onclick="changeTitle()">Click Me!</button>\n\n<script>\nfunction changeTitle() {\n  document.getElementById("title").textContent = "You clicked!";\n  document.getElementById("title").style.color = "red";\n}\n<\/script>',
      codeFile: 'index.html',
      tip: 'This is how buttons, forms, and interactive websites work!',
    },
    {
      title: 'JavaScript Complete!',
      explanation: p('Amazing! You now know JavaScript basics! You learned: Alert and console.log, Variables (let), Math operations, If/else statements, Functions, Changing the page (DOM). You now know HTML + CSS + JS - the 3 languages of the web! Keep building!'),
    },
  ],
  python: [
    {
      title: 'What is Python?',
      explanation: p('Python is one of the easiest programming languages! It is used for AI, games, websites, and more. To run Python, you will need to install it from python.org'),
      tip: 'Python reads almost like English - that is why it is great for beginners!',
    },
    {
      title: 'Print - Your First Program',
      explanation: p('print() shows text on the screen. It is the first thing every programmer learns!'),
      code: 'print("Hello World!")\nprint("My name is Rylan")\nprint("I am learning Python!")',
      codeFile: 'hello.py',
      challenge: 'Write a print statement that says "I love coding"',
      starterCode: 'print(',
      answer: 'print("I love coding")',
    },
    {
      title: 'Variables',
      explanation: p('Store data in variables. Python is easy - just type the name and value!'),
      code: 'name = "Rylan"\nage = 8\nfavorite_color = "blue"\n\nprint(name)           # Rylan\nprint(age)            # 8\nprint(favorite_color)  # blue',
      codeFile: 'variables.py',
      challenge: 'Create a variable called "food" and set it to "pizza"',
      starterCode: 'food',
      answer: 'food = "pizza"',
    },
    {
      title: 'Math',
      explanation: p('Python is great at math!'),
      code: 'a = 10\nb = 3\n\nprint(a + b)   # 13\nprint(a - b)   # 7\nprint(a * b)   # 30\nprint(a / b)   # 3.333...\nprint(a ** 2)  # 100 (power of 2)',
      codeFile: 'math.py',
    },
    {
      title: 'Input - Ask the User',
      explanation: p('input() asks the user to type something!'),
      code: 'name = input("What is your name? ")\nprint("Hello " + name + "!")\n\nage = input("How old are you? ")\nprint("You are " + age + " years old!")',
      codeFile: 'input.py',
      tip: 'Run this in the terminal: python input.py',
    },
    {
      title: 'If Statements',
      explanation: p('Make decisions! Python uses indentation (spaces) instead of curly braces.'),
      code: 'age = 8\n\nif age >= 10:\n    print("You are 10 or older!")\nelse:\n    print("You are under 10!")\n\nscore = 95\nif score >= 90:\n    print("A grade!")\nelif score >= 80:\n    print("B grade!")\nelse:\n    print("Keep trying!")',
      codeFile: 'if.py',
    },
    {
      title: 'Loops',
      explanation: p('Repeat code with loops! for loops repeat a set number of times.'),
      code: '# Count from 1 to 5\nfor i in range(1, 6):\n    print(i)\n\n# Print a list\nfruits = ["apple", "banana", "cherry"]\nfor fruit in fruits:\n    print("I like " + fruit)',
      codeFile: 'loops.py',
      challenge: 'Write a for loop that prints numbers 1 to 3',
      starterCode: 'for i in range(',
      answer: 'for i in range(1, 4):\n    print(i)',
    },
    {
      title: 'Functions',
      explanation: p('Create reusable code with def!'),
      code: 'def say_hello(name):\n    print("Hello " + name + "!")\n\nsay_hello("Rylan")  # Hello Rylan!\nsay_hello("Mom")    # Hello Mom!\n\ndef add(a, b):\n    return a + b\n\nresult = add(5, 3)\nprint(result)  # 8',
      codeFile: 'functions.py',
    },
    {
      title: 'Python Complete!',
      explanation: p('You now know Python basics! You learned: print(), Variables, Math, Input from the user, If/elif/else, For loops, Functions. Python is used everywhere - AI, games, websites, robots! Keep going!'),
    },
  ],
}
