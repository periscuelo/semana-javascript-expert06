import fs from 'fs'
import fsPromises from 'fs/promises'
import streamPromises from 'stream/promises'
import Throttle from 'throttle'

import { spawn } from 'child_process'
import { randomUUID } from 'crypto'
import { PassThrough, Writable } from 'stream'
import { extname, join } from 'path'
import { once } from 'events'
import { logger } from './utils.js'

import config from './config.js'

const {
    dir: { publicDir },
    constants: {
        bitRateDivisor,
        fallbackBitRate,
        englishConversation
    }
} = config

const srv = {}

srv.clientStreams = new Map()
srv.currentBitRate = 0
srv.currentReadable = ''
srv.currentSong = englishConversation
srv.throttleTransform = ''

srv.createClientStream = () => {
    const id = randomUUID()
    const clientStream = new PassThrough()
    srv.clientStreams.set(id, clientStream)

    return {
        id,
        clientStream
    }
}

srv.removeClientStream = id => {
    srv.clientStreams.delete(id)
}

srv._executeSoxCommand = args => spawn('sox', args)

srv.getBitRate = async song => {
    try {
        const args = [
            '--i',
            '-B',
            song
        ]

        const { stderr, stdout } = srv._executeSoxCommand(args)

        await Promise.all([
            once(stdout, 'readable'),
            once(stderr, 'readable')
        ])

        const [success, error] = [stdout, stderr].map(stream => stream.read())

        if (error) return await Promise.reject(error)

        return success.toString().trim().replace(/k/, '000')
    } catch (error) {
        logger.error(`Bitrate error ${error}`)
        return fallbackBitRate
    }
}

srv.broadCast = () => {
    return new Writable({
        write: (chunk, enc, cb) => {
            for (const [id, stream] of srv.clientStreams) {
                if (stream.writableEnded) {
                    srv.clientStreams.delete(id)
                    continue
                }

                stream.write(chunk)
            }

            cb()
        }
    })
}

srv.startStreamming = async () => {
    logger.info(`starting with ${srv.currentSong}`)

    srv.currentBitRate = (await srv.getBitRate(srv.currentSong)) / bitRateDivisor
    srv.currentReadable = srv.createFileStream(srv.currentSong)
    srv.throttleTransform = new Throttle(srv.currentBitRate)

    return streamPromises.pipeline(
        srv.currentReadable,
        srv.throttleTransform,
        srv.broadCast()
    )
}

srv.stopStreamming = () => {
    srv.throttleTransform?.end?.()
}

srv.createFileStream = file => fs.createReadStream(file)

srv.getFileInfo = async file => {
    const fullFilePath = join(publicDir, file)
    const fileType = extname(fullFilePath)

    await fsPromises.access(fullFilePath)

    return {
        name: fullFilePath,
        type: fileType
    }
}

srv.getFileStream = async file => {
    const { name, type } = await srv.getFileInfo(file)

    return {
        stream: srv.createFileStream(name),
        type
    }
}

export default srv
