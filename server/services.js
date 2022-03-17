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

const clientStreams = new Map()
const currentSong = englishConversation

let currentBitRate = 0
let currentReadable, throttleTransform

srv.createClientStream = () => {
    const id = randomUUID()
    const clientStream = new PassThrough()
    clientStreams.set(id, clientStream)

    return {
        id,
        clientStream
    }
}

srv.removeClientStream = id => {
    clientStreams.delete(id)
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
            for (const [id, stream] of clientStreams) {
                if (stream.writableEnded) {
                    clientStreams.delete(id)
                    continue
                }

                stream.write(chunk)
            }

            cb()
        }
    })
}

srv.startStreamming = async () => {
    logger.info(`starting with ${currentSong}`)

    currentBitRate = (await srv.getBitRate(currentSong)) / bitRateDivisor
    currentReadable = srv.createFileStream(currentSong)
    throttleTransform = new Throttle(currentBitRate)

    return streamPromises.pipeline(
        currentReadable,
        throttleTransform,
        srv.broadCast()
    )
}

srv.stopStreamming = () => {
    throttleTransform?.end?.()
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
