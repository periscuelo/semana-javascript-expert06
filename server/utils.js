import pino from 'pino'

export const

logger = pino({
    enable: !(!!process.env.LOG_DISABLED),
    transport: {
        target: 'pino-pretty',
        options: {
            colorize: true
        }
    }
})
