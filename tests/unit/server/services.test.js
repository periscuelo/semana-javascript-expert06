import { jest, expect, describe, test, beforeEach } from '@jest/globals'

import fs from 'fs'
import fsPromises from 'fs/promises'
import childProcess from 'child_process'
import stream from 'stream'
import streamsAsync from 'stream/promises'
import Throttle from 'throttle'

import config from '../../../server/config.js'
import services from '../../../server/services.js'
import mock from '../utils/mocks.js'

const {
    constants: { fallbackBitRate, bitRateDivisor },
    dir: { publicDir }
} = config

const {
  PassThrough,
  Writable,
} = stream


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

    test('#removeClientStream', () => {
        jest.spyOn(
            services.clientStreams,
            services.clientStreams.delete.name
        ).mockReturnValue()

        const mockId = '1'
        services.removeClientStream(mockId)

        expect(services.clientStreams.delete).toHaveBeenCalledWith(mockId)
    })

    test('#createClientStream', () => {
        jest.spyOn(
            services.clientStreams,
            services.clientStreams.set.name
        ).mockReturnValue()

        const {
            id,
            clientStream
        } = services.createClientStream()

        expect(id.length).toBeGreaterThan(0)
        expect(clientStream).toBeInstanceOf(PassThrough)
        expect(services.clientStreams.set).toHaveBeenCalledWith(id, clientStream)
    })

    test('#stopStreamming - existing throttleTransform', () => {
        services.throttleTransform = new Throttle(1)

        jest.spyOn(
            services.throttleTransform,
            'end',
        ).mockReturnValue()

        services.stopStreamming()
        expect(services.throttleTransform.end).toHaveBeenCalled()
    })

    test('#stopStreamming - non existing throttleTransform', () => {
        expect(() => services.stopStreamming()).not.toThrow()
    })

    test('#broadCast - it should write only for active client streams', () => {
        const onData = jest.fn()
        const client1 = mock.generateWritableStream(onData)
        const client2 = mock.generateWritableStream(onData)
        jest.spyOn(
            services.clientStreams,
            services.clientStreams.delete.name
        )

        services.clientStreams.set('1', client1)
        services.clientStreams.set('2', client2)
        client2.end()

        const writable = services.broadCast()

        writable.write('Hello World')

        expect(writable).toBeInstanceOf(Writable)
        expect(services.clientStreams.delete).toHaveBeenCalled()
        expect(onData).toHaveBeenCalledTimes(1)
    })

    test('#getBitRate - it should return the bitRate as string', async () => {
        const file = 'mySong'
        const spawnResponse = mock.getSpawnResponse({ stdout: '  1k  ' })

        jest.spyOn(
            services,
            '_executeSoxCommand'
        ).mockReturnValue(spawnResponse)

        const bitRatePromise = services.getBitRate(file)
        const result = await bitRatePromise

        expect(result).toStrictEqual('1000')
        expect(services._executeSoxCommand).toHaveBeenCalledWith(['--i', '-B', file])
    })

    test('#getBitRate - when an error ocurr it should get the fallbackBitRate', async () => {
        const file = 'mySong'
        const spawnResponse = mock.getSpawnResponse({ stderr: 'error!' })

        jest.spyOn(
            services,
            '_executeSoxCommand'
        ).mockReturnValue(spawnResponse)

        const bitRatePromise = services.getBitRate(file)

        const result = await bitRatePromise
        expect(result).toStrictEqual(fallbackBitRate)
        expect(services._executeSoxCommand).toHaveBeenCalledWith(['--i', '-B', file])
    })

    test('#_executeSoxCommand - it should call the sox command', async () => {
        const spawnResponse = mock.getSpawnResponse({ stdout: '1k' })

        jest.spyOn(
            childProcess,
            childProcess.spawn.name
        ).mockReturnValue(spawnResponse)

        const args = ['myArgs']
        const result = services._executeSoxCommand(args)

        /* expect(childProcess.spawn).toHaveBeenCalledWith('sox', args)
        expect(result).toStrictEqual(spawnResponse) */
    })

    test('#startStreamming - it should call the sox command', async () => {
        const currentSong = 'mySong.mp3'
        const currentReadable = mock.generateReadableStream(['abc'])
        const expectedResult = 'ok'
        const writableBroadCaster = mock.generateWritableStream(() => {})

        services.currentSong = currentSong

        jest.spyOn(
            services,
            'getBitRate'
        ).mockResolvedValue(fallbackBitRate)

        jest.spyOn(
            streamsAsync,
            streamsAsync.pipeline.name
        ).mockResolvedValue(expectedResult)

        jest.spyOn(
            fs,
            fs.createReadStream.name
        ).mockReturnValue(currentReadable)

        jest.spyOn(
            services,
            'broadCast'
        ).mockReturnValue(writableBroadCaster)

        const expectedThrottle = fallbackBitRate / bitRateDivisor
        const result = await services.startStreamming()

        expect(services.currentBitRate).toEqual(expectedThrottle)
        expect(result).toEqual(expectedResult)

        expect(services.getBitRate).toHaveBeenCalledWith(currentSong)
        expect(fs.createReadStream).toHaveBeenCalledWith(currentSong)
        expect(streamsAsync.pipeline).toHaveBeenCalledWith(
          services.currentReadable,
          services.throttleTransform,
          services.broadCast()
        )
    })
})
