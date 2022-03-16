import services from './services.js'

const controller = {}

controller.getFileStream = async file => services.getFileStream(file)

export default controller
