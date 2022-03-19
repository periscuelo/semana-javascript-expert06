import { jest, expect, describe, test, beforeEach } from '@jest/globals'

import controller from '../../../server/controller.js'
import services from '../../../server/services.js'
import mock from '../utils/mocks.js'

const getFileStream = 'getFileStream'

describe('#Controller - test controller behavior', () => {
    let mockFileStream

    beforeEach(() => {
        jest.restoreAllMocks()
        jest.clearAllMocks()
        mockFileStream = mock.generateReadableStream(['data'])
    })

    test(`#getFileStream`, async () => {
        const file = 'test.html'
        const expectedType = '.html'

        jest.spyOn(
            services,
            getFileStream
        ).mockResolvedValue({
            stream: mockFileStream,
            type: expectedType
        })

        const { stream, type } = await controller.getFileStream(file)

        expect(stream).toStrictEqual(mockFileStream)

        expect(type).toStrictEqual(expectedType)
    })

    test('#createClientStream', async () => {
        const mockId = '1'

        jest.spyOn(
            services,
            'createClientStream'
        ).mockReturnValue({
            id: mockId,
            clientStream: mockFileStream
        })

        jest.spyOn(
            services,
            'removeClientStream'
        ).mockReturnValue()

        const { stream, onClose } = controller.createClientStream()

        onClose()

        expect(stream).toStrictEqual(mockFileStream)
        expect(services.removeClientStream).toHaveBeenCalledWith(mockId)
        expect(services.createClientStream).toHaveBeenCalled()

    })

    describe('handleCommand', () => {
        test('command stop', async () => {
            jest.spyOn(
                    services,
                    'stopStreamming'
            ).mockResolvedValue()

            const data = { command: '   stop   ' }
            const result = await controller.handleCommand(data)

            expect(result).toStrictEqual({
                result: 'ok'
            })
            expect(services.stopStreamming).toHaveBeenCalled()
        })

        test('command start', async () => {
            jest.spyOn(
                    services,
                    'startStreamming'
            ).mockResolvedValue()

            const data = { command: ' START ' }
            const result = await controller.handleCommand(data)

            expect(result).toStrictEqual({
                result: 'ok'
            })
            expect(services.startStreamming).toHaveBeenCalled()
        })

        test('non existing command', async () => {
            jest.spyOn(
                services,
                'startStreamming'
            ).mockResolvedValue()

            const data = { command: ' NON EXISTING ' }
            const result = await controller.handleCommand(data)

            expect(result).toStrictEqual({
                result: ''
            })
            expect(services.startStreamming).not.toHaveBeenCalled()
        })
    })
})
