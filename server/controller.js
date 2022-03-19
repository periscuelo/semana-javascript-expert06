import services from './services.js'
import { logger } from './utils.js'

const controller = {}

controller.getFileStream = async file => services.getFileStream(file)

controller.handleCommand = async ({ command }) => {
    logger.info(`command received: ${command}`)

    const result = {
        result: ''
    }
    const cmd = command.toLowerCase()

    if (cmd.includes('start')) {
        services.startStreamming()
        result.result = 'ok'
        return result
    }

    if (cmd.includes('stop')) {
        services.stopStreamming()
        result.result = 'ok'
        return result
    }

    return result
}

controller.createClientStream = () => {
    const {
        id,
        clientStream
    } = services.createClientStream()

    const onClose = () => {
        logger.info(`closing connection of ${id}`)
        services.removeClientStream(id)
    }

    return {
        stream: clientStream,
        onClose
    }
}

export default controller
