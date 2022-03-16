import { jest, expect, describe, test, beforeEach } from '@jest/globals'

import fs from 'fs'
import fsPromises from 'fs/promises'

import config from '../../../server/config.js'
import services from '../../../server/services.js'
import mock from '../utils/mocks.js'

const {
    dir: { publicDir }
} = config

describe('#Service - test for service behavior', () => {
    let mockFileStream

    beforeEach(() => {
        jest.restoreAllMocks()
        jest.clearAllMocks()
        mockFileStream = mock.generateReadableStream(['data'])
    })

    test('#createFileStream', () => {
        jest.spyOn(
          fs,
          fs.createReadStream.name
        ).mockReturnValue(mockFileStream)

        const file = 'file.mp3'
        const result = services.createFileStream(file)

        expect(result).toStrictEqual(mockFileStream)
        expect(fs.createReadStream).toHaveBeenCalledWith(file)
    })

    test('#getFileInfo', async () => {
        jest.spyOn(
          fsPromises,
          fsPromises.access.name
        ).mockResolvedValue()

        const file = 'file.mp3'
        const result = await services.getFileInfo(file)
        const expectedResult = {
          type: '.mp3',
          name: `${publicDir}/${file}`
        }

        expect(result).toStrictEqual(expectedResult)
    })

    test('#getFileStream', async () => {
        const file = 'file.mp3'
        const fileFullPath = `${publicDir}/${file}`

        const fileInfo = {
          type: '.mp3',
          name: fileFullPath
        }

        jest.spyOn(
            services,
            'getFileInfo'
        ).mockResolvedValue(fileInfo)

        jest.spyOn(
            services,
            'createFileStream'
        ).mockReturnValue(mockFileStream)

        const result = await services.getFileStream(file)
        const expectedResult = {
          type: fileInfo.type,
          stream: mockFileStream
        }

        expect(result).toStrictEqual(expectedResult)

        expect(services.createFileStream).toHaveBeenCalledWith(fileInfo.name)

        expect(services.getFileInfo).toHaveBeenCalledWith(file)
    })
})
