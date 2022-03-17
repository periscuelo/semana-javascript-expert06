/* istanbul ignore file */
import { Transform } from 'stream'

import superTest from 'supertest'
import portFinder from 'portfinder'

import Server from '../../../server/server.js'

const test = {}

const getAvailablePort = portFinder.getPortPromise

test.getTestServer = async () => {
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

test.commandSender = (testServer, commandRes) => {
    return {
        async send(command) {
            const res = await testServer.post('/controller').send({ command })

            expect(res.text).toStrictEqual(commandRes)
        }
    }
}

test.pipeAndReadStreamData = (stream, onChunk) => {
    const transform = new Transform({
        transform(chunk, enc, cb) {
            onChunk(chunk)

            cb(null, chunk)
        }
    })

    return stream.pipe(transform)
}

export default test
