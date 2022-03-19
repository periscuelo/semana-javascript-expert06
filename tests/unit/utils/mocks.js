import { jest } from '@jest/globals'
import { Readable, Writable } from 'stream'

const test = {}

test.generateReadableStream = data => {
    return new Readable({
        read() {
            for (const item of data) {
                this.push(item)
            }

            this.push(null)
        }
    })
}

test.generateWritableStream = onData => {
    return new Writable({
        write(chunk, enc, cb) {
            onData?.(chunk)

            cb(null, chunk)
        }
    })
}

test.defaultHandleParams = () => {
    const reqStream = test.generateReadableStream(['body da requisição'])
    const resStream = test.generateWritableStream()

    const data = {
        req: {
            ...reqStream,
            headers: {},
            method: '',
            url: ''
        },
        res: {
            ...resStream,
            writeHead: jest.fn(),
            end: jest.fn()
        }
    }

    return {
        values: () => Object.values(data),
        ...data
    }
}

test.getSpawnResponse = ({ stdout = '', stderr = '', stdin = () => {} }) => ({
    stdout: test.generateReadableStream([stdout]),
    stderr: test.generateReadableStream([stderr]),
    stdin: test.generateWritableStream(stdin)
})

export default test
