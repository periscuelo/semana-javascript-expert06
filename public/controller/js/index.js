import controller from "./controller.js"
import service from "./service.js"
import view from "./view.js"

const url = `${window.location.origin}/controller`
service.init(url)

controller.init({ view, service })
