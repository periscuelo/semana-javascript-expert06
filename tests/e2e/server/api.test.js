import { jest, expect, describe, test } from '@jest/globals'
import { setTimeout } from 'timers/promises'

import config from '../../../server/config.js'
import mocks from '../utils/mocks.js'

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

describe('API E2E Suite Test', () => {
    describe('client workflow', () => {
        test('it should not receive data stream if the process is not playing', async () => {
            const server = await mocks.getTestServer()
            const onChunk = jest.fn()
            mocks.pipeAndReadStreamData(
                server.testServer.get('/stream'),
                onChunk
            )

            await setTimeout(RETENTION_DATA_PERIOD)
            server.kill()

            expect(onChunk).not.toHaveBeenCalled()
        })

        test('it should receive data stream if the process is playing', async () => {
            const server = await mocks.getTestServer()
            const onChunk = jest.fn()
            const { send } = mocks.commandSender(server.testServer, commandRes)

            mocks.pipeAndReadStreamData(
                server.testServer.get('/stream'),
                onChunk
            )

            await send(start)
            await setTimeout(RETENTION_DATA_PERIOD)
            await send(stop)

            const [
                [buffer]
            ] = onChunk.mock.calls

            expect(buffer).toBeInstanceOf(Buffer)

            expect(buffer.length).toBeGreaterThan(1000)

            server.kill()
        })
    })
})