import { jest, expect, describe, test, beforeEach } from '@jest/globals'

import config from '../../../server/config.js'
import controller from '../../../server/controller.js'
import mock from '../utils/mocks.js'
import { handler } from '../../../server/routes.js'

const getFileStream = 'getFileStream'

const {
    constants: {
        CONTENT_TYPE
    },
    location,
    pages
} = config

describe('#Routes - test site for api response', () => {
    let params, mockFileStream

    beforeEach(() => {
        jest.restoreAllMocks()
        jest.clearAllMocks()
        params = mock.defaultHandleParams()
        mockFileStream = mock.generateReadableStream(['data'])
    })

    test('GET / - should redirect to home page', async () => {
        params.req.method = 'GET'
        params.req.url = '/'

        await handler(...params.values())

        expect(params.res.writeHead).toBeCalledWith(
            302,
            {
                'Location': location.home
            }
        )

        expect(params.res.end).toHaveBeenCalled()
    })

    test(`GET /home - should response with ${pages.homeHTML} file stream`, async () => {
        params.req.method = 'GET'
        params.req.url = '/home'

        jest.spyOn(
            controller,
            getFileStream
        ).mockResolvedValue({
            stream: mockFileStream
        })

        jest.spyOn(
            mockFileStream,
            'pipe'
        ).mockReturnValue()

        await handler(...params.values())

        expect(controller.getFileStream).toBeCalledWith(pages.homeHTML)

        expect(mockFileStream.pipe).toHaveBeenCalledWith(params.res)
    })

    test(`GET /controller - should response with ${pages.controllerHTML} file stream`, async () => {
        params.req.method = 'GET'
        params.req.url = '/controller'

        jest.spyOn(
            controller,
            getFileStream
        ).mockResolvedValue({
            stream: mockFileStream
        })

        jest.spyOn(
            mockFileStream,
            'pipe'
        ).mockReturnValue()

        await handler(...params.values())

        expect(controller.getFileStream).toBeCalledWith(pages.controllerHTML)

        expect(mockFileStream.pipe).toHaveBeenCalledWith(params.res)
    })

    test(`GET /index.html - should response with file stream`, async () => {
        params.req.method = 'GET'
        params.req.url = '/index.html'

        const expectedType = '.html'

        jest.spyOn(
            controller,
            getFileStream
        ).mockResolvedValue({
            stream: mockFileStream,
            type: expectedType
        })

        jest.spyOn(
            mockFileStream,
            'pipe'
        ).mockReturnValue()

        await handler(...params.values())

        expect(controller.getFileStream).toBeCalledWith(params.req.url)

        expect(mockFileStream.pipe).toHaveBeenCalledWith(params.res)

        expect(params.res.writeHead).toHaveBeenCalledWith(
            200, {
                'Content-Type': CONTENT_TYPE[expectedType]
            }
        )
    })

    test(`GET /file.ext - should response with file stream`, async () => {
        params.req.method = 'GET'
        params.req.url = '/file.ext'

        const expectedType = '.ext'

        jest.spyOn(
            controller,
            getFileStream
        ).mockResolvedValue({
            stream: mockFileStream,
            type: expectedType
        })

        jest.spyOn(
            mockFileStream,
            'pipe'
        ).mockReturnValue()

        await handler(...params.values())

        expect(controller.getFileStream).toBeCalledWith(params.req.url)

        expect(mockFileStream.pipe).toHaveBeenCalledWith(params.res)

        expect(params.res.writeHead).not.toHaveBeenCalled()
    })

    test(`POST /unknow - should response with file stream`, async () => {
        params.req.method = 'POST'
        params.req.url = '/unknow'

        await handler(...params.values())

        expect(params.res.writeHead).toHaveBeenCalledWith(404)
        expect(params.res.end).toHaveBeenCalled()
    })

    describe('exceptions', () => {
        test('given inexistent file it should respond with 404', async () => {
            params.req.method = 'GET'
            params.req.url = '/index.png'

            jest.spyOn(
                controller,
                getFileStream
            ).mockRejectedValue(new Error('Error: ENOENT: no such file or directory'))

            await handler(...params.values())

            expect(params.res.writeHead).toHaveBeenCalledWith(404)
            expect(params.res.end).toHaveBeenCalled()
        })

        test('given an error it should respond with 500', async () => {
            params.req.method = 'GET'
            params.req.url = '/index.png'

            jest.spyOn(
                controller,
                getFileStream
            ).mockRejectedValue(new Error('Error:'))

            await handler(...params.values())

            expect(params.res.writeHead).toHaveBeenCalledWith(500)
            expect(params.res.end).toHaveBeenCalled()
        })
    })
})
