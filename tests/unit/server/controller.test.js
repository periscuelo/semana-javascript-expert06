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

    test(`getFileStream - should response with object containing file stream`, async () => {
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
})
