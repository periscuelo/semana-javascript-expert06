import fs from 'fs'

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
    },
    dir: {
        publicDir
    },
    pages: {
        homeHTML,
        controllerHTML,
    }
} = config

const commandRes = JSON.stringify({ result: 'ok' })

describe('API E2E Suite Test', () => {
    test('GET /unknown - given an unknown route it should respond with 404 status code', async () => {
        const response = await mocks.testServer.get(`/unknown`)
        expect(response.statusCode).toStrictEqual(404)
    })

    test('GET / - it should respond with the home location and 302 status code', async () => {
        const response = await mocks.testServer.get('/')
        expect(response.headers.location).toStrictEqual("/home");
        expect(response.statusCode).toStrictEqual(302)
    })

    test('GET /home - it should respond with file stream', async () => {
        const response = await mocks.testServer.get('/home')
        const homePage = await fs.promises.readFile(`${publicDir}/${homeHTML}`)
        expect(response.text).toStrictEqual(homePage.toString())
    })

    test('GET /controller - it should respond with file stream', async () => {
        const response = await mocks.testServer.get('/controller')
        const homePage = await fs.promises.readFile(`${publicDir}/${controllerHTML}`)
        expect(response.text).toStrictEqual(homePage.toString())
    })

    describe('static files', () => {
        test('GET /file.js - it should respond with 404 if file doesnt exists', async () => {
            const file = 'file.js'
            const response = await mocks.testServer.get(`/${file}`)

            expect(response.statusCode).toStrictEqual(404)
        })

        test('GET /controller/css/index.css - given a css file it should respond with content-type text/css ', async () => {
            const file = 'controller/css/index.css'
            const response = await mocks.testServer.get(`/${file}`)
            const existingPage = await fs.promises.readFile(`${publicDir}/${file}`)

            expect(response.text).toStrictEqual(existingPage.toString())
            expect(response.statusCode).toStrictEqual(200)
            expect(response.header['content-type']).toStrictEqual('text/css')
        })

        test('GET /home/js/animation.js - given a js file it should respond with content-type text/javascript ', async () => {
            const file = 'home/js/animation.js'
            const response = await mocks.testServer.get(`/${file}`)
            const existingPage = await fs.promises.readFile(`${publicDir}/${file}`)

            expect(response.text).toStrictEqual(existingPage.toString())
            expect(response.statusCode).toStrictEqual(200)
            expect(response.header['content-type']).toStrictEqual('text/javascript')
        })

        test('GET /controller/index.html - given a html file it should respond with content-type text/html ', async () => {
            const file = controllerHTML
            const response = await mocks.testServer.get(`/${file}`)
            const existingPage = await fs.promises.readFile(`${publicDir}/${file}`)

            expect(response.text).toStrictEqual(existingPage.toString())
            expect(response.statusCode).toStrictEqual(200)
            expect(response.header['content-type']).toStrictEqual('text/html')
        })
    })

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