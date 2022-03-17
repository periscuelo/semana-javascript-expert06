import { jest, expect, describe, test, beforeEach } from '@jest/globals'
import { setTimeout } from 'timers/promises'
import { Transform } from 'stream'

import superTest from 'supertest'
import portFinder from 'portfinder'

import Server from '../../../server/server.js'
import config from '../../../server/config.js'

const {
    constants: {
        RETENTION_DATA_PERIOD,
        possibleCommands: {
            start,
            stop
        }
    }
} = config

const commandRes = JSON.stringify({ result: 'ok' })

const getAvailablePort = portFinder.getPortPromise

const getTestServer = async () => {
    const getSuperTest = sPort => superTest(`http://localhost:${sPort}`)
    const port = await getAvailablePort()

    return new Promise((resolve, reject) => {
        Server.listen(port).once('listening', () => {
            const testServer = getSuperTest(port)
            const res = {
                testServer,
                kill() {
                    Server.close()
                }
            }

            return resolve(res)
        }).once('error', reject)
    })
}

const commandSender = testServer => {
    return {
        async send(command) {
            const res = await testServer.post('/controller').send({ command })

            expect(res.text).toStrictEqual(commandRes)
        }
    }
}

const pipeAndReadStreamData = (stream, onChunk) => {
    const transform = new Transform({
        transform(chunk, enc, cb) {
            onChunk(chunk)

            cb(null, chunk)
        }
    })

    return stream.pipe()
}

describe('API E2E Suite Test', () => {
    describe('client workflow', () => {
        test('it should not receive data stream if the process is not playing', async () => {
            const server = await getTestServer()
            const onChunk = jest.fn()
            pipeAndReadStreamData(
                server.testServer.get('/stream'),
                onChunk
            )

            await setTimeout(RETENTION_DATA_PERIOD)
            server.kill()

            expect(onChunk).not.toHaveBeenCalled()
        })

        test('it should receive data stream if the process is playing', async () => {
            const server = await getTestServer()
            const onChunk = jest.fn()
            const { send } = commandSender(server.testServer)

            pipeAndReadStreamData(
                server.testServer.get('/stream'),
                onChunk
            )

            // await send(start)
            await setTimeout(RETENTION_DATA_PERIOD)
            await send(stop)

           /*  const [
                [buffer]
            ] = onChunk.mock.calls

            expect(buffer).toBeInstanceOf(Buffer)

            expect(buffer.length).toBeGreaterThan(1000) */

            server.kill()
        })
    })
})