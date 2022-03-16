import fs from 'fs'
import fsPromises from 'fs/promises'
import { extname, join } from 'path'
import config from './config.js'

const {
    dir: { publicDir }
} = config

const srv = {}

srv.createFileStream = file => fs.createReadStream(file)

srv.getFileInfo = async file => {
    const fullFilePath = join(publicDir, file)
    const fileType = extname(fullFilePath)

    await fsPromises.access(fullFilePath)

    return {
        name: fullFilePath,
        type: fileType
    }
}

srv.getFileStream = async file => {
    const { name, type } = await srv.getFileInfo(file)

    return {
        stream: srv.createFileStream(name),
        type
    }
}

export default srv
