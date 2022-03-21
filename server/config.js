import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const config = {}

const currentDir = dirname(fileURLToPath(import.meta.url))
const root = join(currentDir, '../')
const audioDir = join(root, 'audio')
const publicDir = join(root, 'public')
const songsDir = join(audioDir, 'songs')
const fxDir = join(audioDir, 'fx')

config.port = process.env.PORT || 3000

config.dir = {
    root,
    audioDir,
    publicDir,
    songsDir,
    fxDir
}

config.pages = {
    homeHTML: 'home/index.html',
    controllerHTML: 'controller/index.html'
}

config.location = {
    home: '/home'
}

config.constants = {
    CONTENT_TYPE: {
        '.html': 'text/html',
        '.css': 'text/css',
        '.js': 'text/javascript'
    },
    RETENTION_DATA_PERIOD: 200,
    audioMediaType: 'mp3',
    songVolume: '0.99',
    fxVolume: '0.1',
    fallbackBitRate: '128000',
    bitRateDivisor: 8,
    englishConversation: join(songsDir, 'conversation.mp3'),
    possibleCommands: {
        start: 'start',
        stop: 'stop'
    }
}

export default config