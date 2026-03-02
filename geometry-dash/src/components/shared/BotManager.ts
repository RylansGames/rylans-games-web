// Bot system - fake players that chat, register as players, and react to admin actions
import { PlayerTracker } from './PlayerTracker'
import { coopLobby } from '../../games/camera-watch/CameraWatchLobby'

const BOT_NAMES = [
  'xX_ProGamer_Xx',
  'BrainrotKing99',
  'TungTungFan',
  'NoobSlayer2026',
  'CoolDude_HD',
  'Frostyfrets',
  'SkibidiToilet',
  'RizzLord',
  'FridgeBoss',
  'MusicBeatsGod',
  'CameraWatcher',
  'JumpKing_Pro',
  'CoinsCollector',
  'PetDragonOwner',
  'AdminFearMe'
]

// Regular chat - bots just vibing
const CHAT_MESSAGES = [
  'yo - it\'s dad, whats up?',
  'whats up',
  'this game is so cool',
  'anyone wanna play?',
  'im so good at this',
  'lol',
  'bruh',
  'no way',
  'GG',
  'lets gooo',
  'this portal is fire',
  'how do i get more coins',
  'finally beat it!',
  'that was so hard',
  'ez clap',
  'first try btw',
  'tung tung tung tung sahur!!',
  'bombardido crocodilo',
  'tralalero tralala',
  'GD is impossible',
  'i keep dying on GD',
  'kamehameha is OP',
  'i just rebirthed!!',
  'im the best player here',
  'fight me bro',
  'anyone got infinite coins?',
  'this website is awesome',
  'W game',
  'ratio',
  'sus',
  'fanum tax on your coins',
  'ohio moment',
  'camera watch is too scary for me',
  'just saw a preacher in camera watch 💀',
  'the cloak has RED EYES',
  'playing camera watch rn wish me luck'
]

// Conversations - [trigger message, response1, response2, ...]
const CONVERSATIONS = [
  ['whos the owner here?', 'its rylan bro', 'hes literally watching us rn', 'be careful he has admin powers'],
  ['i bet the admin cant catch me', 'bro dont say that', 'hes gonna ban you 💀', 'RIP'],
  ['im not scared of the owner', 'you should be...', 'last guy who said that got banned', 'admin abuse incoming'],
  ['this game is so fun', 'fr fr', 'best game ever', 'W'],
  ['anyone wanna 1v1?', 'im down', 'ill destroy you', 'lets go'],
  ['how do you get pets?', 'you gotta play brainrot evolution', 'i have a dragon', 'lucky...'],
  ['i have the most coins here', 'cap', 'no way prove it', 'the owner has more'],
  ['admin abuse is actually crazy', 'bro the screen shake is insane', 'rainbow mode is fire tho', 'upside down made me dizzy'],
  ['please dont ban me', 'why what did you do', 'bro is scared 💀', 'the owner is typing...'],
  ['im telling everyone about this website', 'same its so cool', 'rylan is goated', 'W developer'],
  ['bro who turned on admin abuse', 'THE OWNER DID', 'we cant escape', 'just accept it'],
  ['im gonna break the record', 'no chance', 'i already have it', 'cap'],
  ['this chat is crazy', 'fr', 'its always like this', 'welcome to rylans game portal'],
  ['hey owner if youre reading this... hi', 'bro is trying to get on the owners good side', 'smart move', 'please give us coins'],
  ['who wants free coins', 'ME', 'only the owner can do that', 'ask nicely maybe hell give some'],
  ['imagine getting banned', 'couldnt be me', 'famous last words', 'bro jinxed it'],
  ['the admin effects are so OP', 'screen shake + upside down is torture', 'rainbow mode is kinda cool tho', 'ALL EFFECTS AT ONCE is insane'],
  ['dont make the owner mad', 'why what happens', 'admin abuse happens', 'and then you get banned'],
  ['i think the owner is about to do something', 'oh no', 'everyone act normal', 'too late'],
  ['SkibidiToilet is such a weird name', 'bro YOUR name is weird', 'we all have weird names', 'at least mine is cool'],
  ['anyone playing camera watch?', 'yeah its so scary', 'the preacher keeps showing up', 'i cant play it at night'],
  ['the owner just spawned something in camera watch', 'WHAT did he spawn', 'a preacher i think', 'im never playing that game again'],
  ['camera watch is the scariest game here', 'fr the cloak is terrifying', 'the corpse made me scream', 'i stick to GD its safer'],
  ['i just beat my camera watch record', 'how many anomalies', 'like 15', 'bro thats insane']
]

// Trash talk - bots say something bad and get auto-warned
const TRASH_MESSAGES = [
  'this game is trash ngl',
  'the owner is bad at making games',
  'this website is mid',
  'L game L owner',
  'who even plays this garbage',
  'this is the worst game ever',
  'the owner doesnt know how to code',
  'im only here cuz im bored this game sucks',
  'ratio + L + nobody asked for this game',
  'this portal is so boring',
  'the admin is bad lol',
  'i could make a better game in 5 minutes',
  'imagine thinking this game is good',
  'the owner should just give up'
]

// Bots talk about what the owner is doing
const OWNER_WATCHING_MESSAGES = [
  'guys i think the owner is in the admin panel',
  'the owner is watching us...',
  'everyone be good the admin is online',
  'i can feel the admin presence',
  'bro the owner panel is open',
  'guys behave the owner is here'
]

// Bot reactions to effects
const EFFECT_REACTIONS: Record<string, string[]> = {
  screen_shake: [
    'AAAAA THE SCREEN IS SHAKING',
    'EARTHQUAKE???',
    'my screen is going crazy',
    'stop shaking!! im trying to play',
    'im gonna be sick lol',
    'WHO DID THIS',
    'bro my screen is having a seizure',
    'THE OWNER IS ADMIN ABUSING US',
    'i cant even click anything',
    'this is chaos'
  ],
  rainbow: [
    'RAINBOW MODE LETS GO',
    'so many colors omg',
    'this is actually beautiful',
    'my eyes hurt so bad',
    'taste the rainbow',
    'im in a disco now',
    'woah trippy',
    'ok this one is actually cool',
    'the owner has style',
    'i cant see anything its all colors'
  ],
  upside_down: [
    'WHY IS EVERYTHING UPSIDE DOWN',
    'im in australia now',
    'help i cant read anything',
    'the world is flipped',
    'my brain hurts so bad',
    'TURN IT BACK PLEASE',
    'how do i walk on the ceiling',
    'this is the worst one',
    'i literally cant play like this',
    'the owner is evil for this one'
  ]
}

// Reactions when they see someone ELSE get kicked/banned/warned
const WITNESS_KICK_REACTIONS = [
  'LMAOOO they got kicked',
  'bye bye 💀',
  'should NOT have done that',
  'the owner dont play around',
  'another one bites the dust',
  'rip to them',
  'im glad it wasnt me'
]

const WITNESS_BAN_REACTIONS = [
  'BRO GOT BANNED 💀💀💀',
  'PERMANENT BAN omg',
  'they really made the owner mad',
  'rest in peace',
  'ill never see them again',
  'note to self: dont make the owner angry',
  'thats tough...',
  'ok im scared now'
]

const WITNESS_WARN_REACTIONS = [
  'ooooh they got a warning',
  'they better stop',
  'next one is a ban for sure',
  'the owner is watching closely',
  'bro got caught',
  'thats strike one'
]

// Reactions to admin actions ON THEM
const KICK_REACTIONS = [
  'NOOO I GOT KICKED',
  'why did you kick me?? i didnt do anything',
  'bro what did i do wrong',
  'thats not fair i was just chilling',
  'im coming back you cant stop me',
  'the owner kicked me for NO REASON',
  'ADMIN ABUSE THIS IS ADMIN ABUSE'
]

const BAN_REACTIONS = [
  'IM BANNED??? NOOOOO PLEASE',
  'PLEASE UNBAN ME ILL DO ANYTHING',
  'i didnt do anything wrong!!! this is unfair',
  'bro why would you ban me',
  'ill be good i promise just unban me',
  'UNBAN ME RIGHT NOW',
  'this is the worst day of my life'
]

const WARN_REACTIONS = [
  'ok ok ill stop im sorry',
  'sorry sorry i wont do it again',
  'i got a warning... im scared now',
  'my bad i didnt mean to',
  'ill behave i promise',
  'please dont ban me next i got the message',
  'ok i understand im being good now',
  'the owner warned me im shaking rn'
]

const COIN_REACTIONS = [
  'WAIT I GOT COINS??? TYSM OWNER',
  'OMG FREE COINS LETS GO',
  'THE OWNER GAVE ME COINS I LOVE YOU',
  'tysm for the coins!!! youre the best',
  'LETS GOOO IM RICH NOW',
  'i love this admin so much',
  'wait did the owner actually give me coins?? W OWNER',
  'EVERYONE THE OWNER IS GIVING OUT COINS'
]

const GLOBAL_MSG_REACTIONS = [
  'DA OWNER HAS SPOKEN',
  'yes sir owner sir',
  'ok owner we hear you',
  'heard you loud and clear boss',
  'the owner has spoken!! everyone listen',
  'W owner W message',
  'ok thats actually funny',
  'the owner is communicating with us',
  'everyone shut up the owner is talking'
]

const REJOIN_MESSAGES = [
  'im back! you cant get rid of me that easily',
  'you cant keep me away',
  'missed me? im back',
  'im back and im not leaving',
  'kicked but not defeated lets go',
  'hello again everyone',
  'the owner thought they could stop me'
]

const UNBAN_REACTIONS = [
  'IM UNBANNED LETS GOOO TYSM',
  'FREEDOM!!! thank you owner',
  'i promise ill be good this time',
  'THE OWNER UNBANNED ME I LOVE YOU',
  'im back and ill never get banned again',
  'LETS GO im free',
  'thank you thank you thank you owner'
]

// Camera Watch reactions
const CAMERA_WATCH_CHAT = [
  'im playing camera watch rn',
  'camera watch is so scary',
  'the preacher just appeared in my room omg',
  'i keep missing the anomalies',
  'bro the corpse just showed up in the kitchen',
  'THE CLOAK IS IN THE CORNER',
  'camera watch is way too creepy',
  'i just saw something move...',
  'the furniture moved by itself',
  'everything just turned red im scared',
  'this game gives me nightmares fr',
  'im on cam 3 and theres a body',
  'how do you even play this game',
  'just got 5 anomalies fixed lets go',
  'the preacher said something about static 💀',
  'guys dont play camera watch at night',
  'the cloak has RED EYES bruh'
]

const CAMERA_WATCH_COOP_CHAT = [
  'ill take cam 3',
  'im watching cam 1 and 2',
  'i just fixed a displacement!',
  'anyone see the preacher? where is it',
  'i got the corpse in the kitchen',
  'check cam 5 i think something moved',
  'nice fix! team work',
  'we got this team!',
  'im on the attic cameras',
  'basement is clear nothing there',
  'i see red in the bathroom thats imagery',
  'got the cloak in the hallway!',
  'co-op camera watch is way less scary',
  'good catch on that one',
  'wait theres two anomalies at once',
  'let me get this one'
]

const ANOMALY_SPAWN_REACTIONS: Record<string, string[]> = {
  Preacher: [
    'THE PREACHER JUST APPEARED',
    'THERES A GUY IN A ROBE IN MY ROOM',
    'the preacher is saying creepy stuff',
    'WHO PUT A PREACHER IN CAMERA WATCH',
    'bro the owner spawned a preacher 💀',
    'the preacher is staring at the camera'
  ],
  Cloak: [
    'THE CLOAK IS HERE OH NO',
    'theres something in the corner with red eyes',
    'CLOAK IN THE CORNER IM LEAVING',
    'the owner sent a cloak to scare us',
    'i see red eyes in the dark...',
    'THE HOODED FIGURE IS WATCHING ME'
  ],
  Corpse: [
    'THERES A BODY ON THE FLOOR',
    'A CORPSE JUST APPEARED WTF',
    'who died in camera watch 💀',
    'the owner put a dead body in my room',
    'CORPSE IN THE KITCHEN',
    'im not playing this anymore theres bodies'
  ],
  Displacement: [
    'THE FURNITURE JUST MOVED BY ITSELF',
    'something moved... i saw it',
    'bro the table moved',
    'the owner is moving stuff around',
    'HOW DID THAT OBJECT MOVE',
    'displacement anomaly detected'
  ],
  Imagery: [
    'EVERYTHING JUST TURNED RED',
    'why is it glowing red',
    'something is wrong the colors changed',
    'IMAGERY ANOMALY its all red',
    'the owner made everything red',
    'i think somethings wrong with the camera'
  ]
}

// When admin abuse sign appears
const ADMIN_ABUSE_START_REACTIONS = [
  'ADMIN ABUSE STARTING??? EVERYONE RUN',
  'oh no... not admin abuse',
  'bro the abuse sign just appeared',
  'THE OWNER IS ABOUT TO DESTROY US',
  'here we go again...',
  'everyone brace yourselves',
  'not again please',
  'the owner is going crazy'
]

export interface ChatMessage {
  id: number
  name: string
  text: string
  timestamp: number
  isBot: boolean
  color: string
}

const BOT_COLORS = [
  '#4ade80', '#60a5fa', '#f472b6', '#facc15',
  '#a78bfa', '#fb923c', '#2dd4bf', '#f87171',
  '#818cf8', '#34d399', '#fbbf24', '#c084fc'
]

const GAME_LIST = [
  'Brainrot Evolution',
  'Geometry Dash',
  'Camera Watch',
  'Music Beats',
  'Organize the Fridge',
  'Portal'
]

const GAME_SWITCH_CHAT: Record<string, string[]> = {
  'Camera Watch': [
    'im switching to camera watch',
    'gonna go play camera watch',
    'camera watch time lets go',
    'anyone wanna play camera watch with me'
  ],
  'Geometry Dash': [
    'going to play GD',
    'time for geometry dash',
    'im gonna try to beat my GD record'
  ],
  'Brainrot Evolution': [
    'switching to brainrot evolution',
    'gonna go collect some coins in brainrot',
    'brainrot evolution time'
  ],
  'Music Beats': [
    'gonna play music beats',
    'time for some music',
    'music beats is so fun'
  ],
  'Organize the Fridge': [
    'im playing organize the fridge',
    'time to organize some food',
    'fridge game time'
  ]
}

interface BotData {
  name: string
  color: string
  sessionId: string
  coins: number
  level: number
  exp: number
  petsCount: number
  isKicked: boolean
  isBanned: boolean
  kickedAt: number
  warningCount: number
  currentGame: string
}

let messageId = 0
let activeBots: BotData[] = []
let chatInterval: number | null = null
let convoInterval: number | null = null
let actionCheckInterval: number | null = null
let heartbeatInterval: number | null = null
let botMessages: ChatMessage[] = []
let listeners: (() => void)[] = []
let lastGlobalMsg = ''
let lastEffects: string[] = []
let lastAbuseActive = false
let lastAnomalyTimestamp = 0
let cameraWatchChatInterval: number | null = null

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function generateBotSessionId(name: string): string {
  return `bot_${name.replace(/[^a-zA-Z0-9]/g, '')}_${Date.now()}`
}

function registerBotSession(bot: BotData) {
  const session = {
    id: bot.sessionId,
    playerName: bot.name,
    isActive: true,
    lastActive: Date.now(),
    coins: bot.coins,
    level: bot.level,
    exp: bot.exp,
    petsCount: bot.petsCount,
    currentGame: bot.currentGame
  }
  localStorage.setItem(`playerSession_${bot.sessionId}`, JSON.stringify(session))
}

function removeBotSession(bot: BotData) {
  const session = {
    id: bot.sessionId,
    playerName: bot.name,
    isActive: false,
    lastActive: 0,
    coins: bot.coins,
    level: bot.level,
    exp: bot.exp,
    petsCount: bot.petsCount,
    currentGame: bot.currentGame
  }
  localStorage.setItem(`playerSession_${bot.sessionId}`, JSON.stringify(session))
}

function updateBotHeartbeats() {
  activeBots.forEach(bot => {
    if (!bot.isKicked && !bot.isBanned) {
      if (Math.random() < 0.1) bot.coins += Math.floor(Math.random() * 50)
      if (Math.random() < 0.02) bot.exp += Math.floor(Math.random() * 10)
      // 5% chance to switch games
      if (Math.random() < 0.05) {
        const oldGame = bot.currentGame
        const newGame = pickRandom(GAME_LIST.filter(g => g !== oldGame))
        bot.currentGame = newGame
        // Sometimes chat about switching
        if (Math.random() < 0.5 && GAME_SWITCH_CHAT[newGame]) {
          BotManager.addMessage(bot.name, bot.color, pickRandom(GAME_SWITCH_CHAT[newGame]))
        }
      }

      // Bots playing Camera Watch can participate in co-op
      if (bot.currentGame === 'Camera Watch') {
        const lobby = coopLobby.getLobby()
        if (lobby && lobby.gameState === 'playing') {
          // 10% chance per heartbeat to fix a random unfixed anomaly
          if (Math.random() < 0.1) {
            const unfixed = coopLobby.getUnfixedAnomalies()
            if (unfixed.length > 0) {
              const anomaly = pickRandom(unfixed)
              coopLobby.shareAnomalyFix(anomaly.id, bot.name)
              // Chat about it
              if (Math.random() < 0.6) {
                BotManager.addMessage(bot.name, bot.color, pickRandom(CAMERA_WATCH_COOP_CHAT))
              }
            }
          }
          // Occasional co-op chatter
          if (Math.random() < 0.03) {
            BotManager.addMessage(bot.name, bot.color, pickRandom(CAMERA_WATCH_COOP_CHAT))
          }
        }
      }

      registerBotSession(bot)
    }
  })
}

function getOnlineBots(): BotData[] {
  return activeBots.filter(b => !b.isKicked && !b.isBanned)
}

// Start a conversation chain between bots
function startConversation() {
  const online = getOnlineBots()
  if (online.length < 2) return

  const convo = pickRandom(CONVERSATIONS)
  const shuffledBots = [...online].sort(() => Math.random() - 0.5)

  convo.forEach((line, i) => {
    setTimeout(() => {
      const bot = shuffledBots[i % shuffledBots.length]
      if (!bot.isKicked && !bot.isBanned) {
        BotManager.addMessage(bot.name, bot.color, line)
      }
    }, i * (1500 + Math.random() * 2000))
  })
}

function checkBotAdminActions() {
  const recentlyActedOn: { bot: BotData; action: string }[] = []

  activeBots.forEach(bot => {
    if (bot.isBanned) return

    const actionKey = `admin_action_${bot.sessionId}`
    const saved = localStorage.getItem(actionKey)
    if (!saved) return

    const action = JSON.parse(saved)
    localStorage.removeItem(actionKey)

    if (action.type === 'kick' && !bot.isKicked) {
      const bannedKey = `banned_${bot.sessionId}`
      const isBanned = localStorage.getItem(bannedKey) !== null

      if (isBanned) {
        bot.isBanned = true
        bot.isKicked = true
        removeBotSession(bot)
        BotManager.addMessage(bot.name, bot.color, pickRandom(BAN_REACTIONS))
        recentlyActedOn.push({ bot, action: 'ban' })

        // Banned bots beg multiple times
        setTimeout(() => {
          if (bot.isBanned) {
            BotManager.addMessage(bot.name, '#ff4444', 'PLEASE UNBAN ME I BEG YOU')
          }
        }, 6000 + Math.random() * 4000)

        setTimeout(() => {
          if (bot.isBanned) {
            BotManager.addMessage(bot.name, '#ff4444', 'owner please... ill be good forever')
          }
        }, 15000 + Math.random() * 5000)

        setTimeout(() => {
          if (bot.isBanned) {
            BotManager.addMessage(bot.name, '#ff4444', 'is anyone even listening to me...')
          }
        }, 25000 + Math.random() * 5000)
      } else {
        bot.isKicked = true
        bot.kickedAt = Date.now()
        removeBotSession(bot)
        BotManager.addMessage(bot.name, bot.color, pickRandom(KICK_REACTIONS))
        recentlyActedOn.push({ bot, action: 'kick' })

        // Kicked bots come back after 8-15 seconds
        setTimeout(() => {
          if (bot.isKicked && !bot.isBanned) {
            bot.isKicked = false
            bot.sessionId = generateBotSessionId(bot.name)
            registerBotSession(bot)
            BotManager.addMessage(bot.name, bot.color, pickRandom(REJOIN_MESSAGES))

            // Other bots react to them coming back
            setTimeout(() => {
              const online = getOnlineBots().filter(b => b.name !== bot.name)
              if (online.length > 0) {
                const reactor = pickRandom(online)
                BotManager.addMessage(reactor.name, reactor.color, `oh no ${bot.name} is back`)
              }
            }, 1500)
          }
        }, 8000 + Math.random() * 7000)
      }
    } else if (action.type === 'warn') {
      bot.warningCount++
      BotManager.addMessage(bot.name, bot.color, pickRandom(WARN_REACTIONS))
      recentlyActedOn.push({ bot, action: 'warn' })

      // If warned multiple times, bot gets more scared
      if (bot.warningCount >= 2) {
        setTimeout(() => {
          if (!bot.isKicked && !bot.isBanned) {
            BotManager.addMessage(bot.name, bot.color, 'guys im on my last warning im so scared')
          }
        }, 3000)
      }
    } else if (action.type === 'grantCoins') {
      bot.coins += action.amount || 0
      registerBotSession(bot)
      BotManager.addMessage(bot.name, bot.color, pickRandom(COIN_REACTIONS))
      recentlyActedOn.push({ bot, action: 'coins' })
    }
  })

  // Other bots witness and react
  recentlyActedOn.forEach(({ bot, action }) => {
    setTimeout(() => {
      const witnesses = getOnlineBots().filter(b => b.name !== bot.name)
      if (witnesses.length === 0) return
      const witness = pickRandom(witnesses)

      if (action === 'kick') {
        BotManager.addMessage(witness.name, witness.color, pickRandom(WITNESS_KICK_REACTIONS))
      } else if (action === 'ban') {
        BotManager.addMessage(witness.name, witness.color, pickRandom(WITNESS_BAN_REACTIONS))
        // Second witness reacts too
        setTimeout(() => {
          const witness2 = pickRandom(witnesses.filter(b => b.name !== witness.name))
          if (witness2) {
            BotManager.addMessage(witness2.name, witness2.color, pickRandom(WITNESS_BAN_REACTIONS))
          }
        }, 1500 + Math.random() * 1500)
      } else if (action === 'warn') {
        BotManager.addMessage(witness.name, witness.color, pickRandom(WITNESS_WARN_REACTIONS))
      } else if (action === 'coins') {
        BotManager.addMessage(witness.name, witness.color, 'wait give ME coins too!!')
      }
    }, 1000 + Math.random() * 2000)
  })

  // Check if any banned bots got unbanned
  activeBots.forEach(bot => {
    if (bot.isBanned) {
      const bannedKey = `banned_${bot.sessionId}`
      if (localStorage.getItem(bannedKey) === null) {
        bot.isBanned = false
        bot.isKicked = false
        bot.warningCount = 0
        bot.sessionId = generateBotSessionId(bot.name)
        registerBotSession(bot)
        BotManager.addMessage(bot.name, bot.color, pickRandom(UNBAN_REACTIONS))

        // Others react
        setTimeout(() => {
          const online = getOnlineBots().filter(b => b.name !== bot.name)
          if (online.length > 0) {
            const reactor = pickRandom(online)
            BotManager.addMessage(reactor.name, reactor.color, `welcome back ${bot.name}!!`)
          }
        }, 1500)
      }
    }
  })

  // Check for global messages
  const globalMsg = localStorage.getItem('global_message')
  if (globalMsg) {
    const msg = JSON.parse(globalMsg)
    if (msg.text !== lastGlobalMsg) {
      lastGlobalMsg = msg.text
      // Multiple bots react with delays
      const online = getOnlineBots()
      if (online.length > 0) {
        const reactor1 = pickRandom(online)
        setTimeout(() => {
          BotManager.addMessage(reactor1.name, reactor1.color, pickRandom(GLOBAL_MSG_REACTIONS))
        }, 1000 + Math.random() * 1500)

        setTimeout(() => {
          const reactor2 = pickRandom(online.filter(b => b.name !== reactor1.name))
          if (reactor2) {
            // Some bots repeat what the owner said
            if (Math.random() < 0.3) {
              BotManager.addMessage(reactor2.name, reactor2.color, `the owner said "${msg.text}" 😱`)
            } else {
              BotManager.addMessage(reactor2.name, reactor2.color, pickRandom(GLOBAL_MSG_REACTIONS))
            }
          }
        }, 2500 + Math.random() * 2000)
      }
    }
  }

  // Check for admin abuse sign
  const abuseData = localStorage.getItem('admin_abuse_active')
  const abuseActive = abuseData !== null && (Date.now() - JSON.parse(abuseData).startTime < JSON.parse(abuseData).duration)
  if (abuseActive && !lastAbuseActive) {
    const online = getOnlineBots()
    if (online.length > 0) {
      const reactor = pickRandom(online)
      BotManager.addMessage(reactor.name, reactor.color, pickRandom(ADMIN_ABUSE_START_REACTIONS))

      setTimeout(() => {
        const reactor2 = pickRandom(online.filter(b => b.name !== reactor.name))
        if (reactor2) {
          BotManager.addMessage(reactor2.name, reactor2.color, pickRandom(ADMIN_ABUSE_START_REACTIONS))
        }
      }, 1500 + Math.random() * 1500)
    }
  }
  lastAbuseActive = abuseActive

  // Check for new effects
  const effectTypes = ['screen_shake', 'rainbow', 'upside_down']
  const currentEffects: string[] = []
  effectTypes.forEach(effect => {
    const saved = localStorage.getItem(`admin_abuse_effect_${effect}`)
    if (saved) {
      const data = JSON.parse(saved)
      if (Date.now() - data.startTime < data.duration) {
        currentEffects.push(effect)
      }
    }
  })

  // React to new effects - multiple bots freak out
  currentEffects.forEach(effect => {
    if (!lastEffects.includes(effect)) {
      const online = getOnlineBots()
      if (online.length > 0) {
        const reactor1 = pickRandom(online)
        BotManager.addMessage(reactor1.name, reactor1.color, pickRandom(EFFECT_REACTIONS[effect]))

        setTimeout(() => {
          const reactor2 = pickRandom(online.filter(b => b.name !== reactor1.name))
          if (reactor2) {
            BotManager.addMessage(reactor2.name, reactor2.color, pickRandom(EFFECT_REACTIONS[effect]))
          }
        }, 800 + Math.random() * 1500)

        setTimeout(() => {
          const reactor3 = pickRandom(online.filter(b => b.name !== reactor1.name))
          if (reactor3) {
            BotManager.addMessage(reactor3.name, reactor3.color, pickRandom(EFFECT_REACTIONS[effect]))
          }
        }, 2000 + Math.random() * 2000)
      }
    }
  })
  lastEffects = currentEffects

  // Check for camera watch anomaly spawns
  const anomalyData = localStorage.getItem('camera_watch_admin_spawn')
  if (anomalyData) {
    const spawn = JSON.parse(anomalyData)
    if (spawn.timestamp !== lastAnomalyTimestamp && Date.now() - spawn.timestamp < 2000) {
      lastAnomalyTimestamp = spawn.timestamp
      const online = getOnlineBots()
      if (online.length > 0) {
        const reactions = ANOMALY_SPAWN_REACTIONS[spawn.type]
        if (reactions) {
          const reactor1 = pickRandom(online)
          BotManager.addMessage(reactor1.name, reactor1.color, pickRandom(reactions))

          setTimeout(() => {
            const reactor2 = pickRandom(online.filter(b => b.name !== reactor1.name))
            if (reactor2) {
              BotManager.addMessage(reactor2.name, reactor2.color, pickRandom(reactions))
            }
          }, 1000 + Math.random() * 1500)

          setTimeout(() => {
            const reactor3 = pickRandom(online.filter(b => b.name !== reactor1.name))
            if (reactor3) {
              BotManager.addMessage(reactor3.name, reactor3.color, `the owner is spawning ${spawn.type.toLowerCase()}s in camera watch 😱`)
            }
          }, 2500 + Math.random() * 2000)
        }
      }
    }
  }
}

export const BotManager = {
  start() {
    if (chatInterval) return

    // Pick 5-8 random bots
    const shuffled = [...BOT_NAMES].sort(() => Math.random() - 0.5)
    const botCount = 5 + Math.floor(Math.random() * 4)
    activeBots = shuffled.slice(0, botCount).map(name => ({
      name,
      color: pickRandom(BOT_COLORS),
      sessionId: generateBotSessionId(name),
      coins: Math.floor(Math.random() * 5000),
      level: 1 + Math.floor(Math.random() * 10),
      exp: Math.floor(Math.random() * 100),
      petsCount: Math.floor(Math.random() * 4),
      isKicked: false,
      isBanned: false,
      kickedAt: 0,
      warningCount: 0,
      currentGame: pickRandom(GAME_LIST)
    }))

    // Register all bots as players
    activeBots.forEach(bot => registerBotSession(bot))

    // Bots say hi in sequence
    const greeter = pickRandom(activeBots)
    this.addMessage(greeter.name, greeter.color, 'hey everyone!')

    setTimeout(() => {
      const responder = pickRandom(activeBots.filter(b => b.name !== greeter.name))
      if (responder) this.addMessage(responder.name, responder.color, 'yooo whats up')
    }, 2000)

    setTimeout(() => {
      const third = pickRandom(activeBots.filter(b => b.name !== greeter.name))
      if (third) this.addMessage(third.name, third.color, 'is the owner online?')
    }, 4000)

    // Random single messages every 5-9 seconds
    chatInterval = setInterval(() => {
      const online = getOnlineBots()
      if (online.length === 0) return
      const bot = pickRandom(online)

      // 12% chance a bot says something trash
      if (Math.random() < 0.12) {
        const trashMsg = pickRandom(TRASH_MESSAGES)
        this.addMessage(bot.name, bot.color, trashMsg)

        // Auto-warn them after a short delay
        setTimeout(() => {
          if (!bot.isKicked && !bot.isBanned) {
            PlayerTracker.warnPlayer(bot.sessionId)

            // Other bots react to the auto-warn
            setTimeout(() => {
              const witnesses = getOnlineBots().filter(b => b.name !== bot.name)
              if (witnesses.length > 0) {
                const witness = pickRandom(witnesses)
                const reactions = [
                  'LMAO they got auto-warned',
                  'the owner doesnt tolerate trash talk',
                  'shouldnt have said that 💀',
                  'instant warning bro',
                  'the system warned them automatically',
                  'dont talk trash in here'
                ]
                BotManager.addMessage(witness.name, witness.color, pickRandom(reactions))
              }
            }, 1500 + Math.random() * 1000)
          }
        }, 1000 + Math.random() * 1500)
      } else {
        this.addMessage(bot.name, bot.color, pickRandom(CHAT_MESSAGES))
      }
    }, 5000 + Math.random() * 4000)

    // Start conversations between bots every 15-25 seconds
    convoInterval = setInterval(() => {
      if (Math.random() < 0.7) {
        startConversation()
      } else {
        // Sometimes a bot mentions the owner
        const online = getOnlineBots()
        if (online.length > 0) {
          const bot = pickRandom(online)
          BotManager.addMessage(bot.name, bot.color, pickRandom(OWNER_WATCHING_MESSAGES))
        }
      }
    }, 15000 + Math.random() * 10000)

    // Check for admin actions every 500ms
    actionCheckInterval = setInterval(checkBotAdminActions, 500)

    // Heartbeat every 3 seconds
    heartbeatInterval = setInterval(updateBotHeartbeats, 3000)
  },

  stop() {
    if (chatInterval) { clearInterval(chatInterval); chatInterval = null }
    if (convoInterval) { clearInterval(convoInterval); convoInterval = null }
    if (actionCheckInterval) { clearInterval(actionCheckInterval); actionCheckInterval = null }
    if (heartbeatInterval) { clearInterval(heartbeatInterval); heartbeatInterval = null }
    activeBots.forEach(bot => removeBotSession(bot))
    activeBots = []
    botMessages = []
  },

  addMessage(name: string, color: string, text: string) {
    const msg: ChatMessage = {
      id: messageId++,
      name,
      text,
      timestamp: Date.now(),
      isBot: true,
      color
    }
    botMessages.push(msg)
    if (botMessages.length > 50) {
      botMessages = botMessages.slice(-50)
    }
    listeners.forEach(fn => fn())
  },

  getMessages(): ChatMessage[] {
    return [...botMessages]
  },

  getActiveBots() {
    return activeBots.filter(b => !b.isKicked && !b.isBanned)
  },

  onUpdate(fn: () => void) {
    listeners.push(fn)
    return () => {
      listeners = listeners.filter(l => l !== fn)
    }
  }
}
