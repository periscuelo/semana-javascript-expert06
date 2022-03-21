const controller = {}
let _view, _service

controller.init = ({ view, service }) => {
    _view = view
    _service = service

    controller.onLoad()
}

controller.commandReceived = async text => {
    return _service.makeRequest({
        command: text.toLowerCase()
    })
}

controller.onLoad = () => {
    _view.configureOnBtnClick(controller.commandReceived)
    _view.onLoad()
}

export default controller
