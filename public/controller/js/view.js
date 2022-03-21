const view = {}

view.btnStart = document.querySelector('#start')
view.btnStop = document.querySelector('#stop')
view.buttons = () => Array.from(document.querySelectorAll('button'))
view.ignoreButtons = new Set(['unassigned'])
view.onBtnClick = async () => {}

view.onLoad = () => {
    view.changeCmdBtnVisibility()
    view.btnStart.onclick = () => view.onStartClicked(view.btnStart)
}

view.changeCmdBtnVisibility = (hide = true) => {
    const elements = Array.from(document.querySelectorAll('.effects'))
    elements.forEach(btn => {
        const fn = hide ? 'add' : 'remove'
        btn.classList[fn]('unassigned')

        btn.onclick = () => {}
    })
}

view.configureOnBtnClick = fn => {
    view.onBtnClick = fn
}

view.onStartClicked = async ({ innerText }) => {
    const btnText = innerText
    await view.onBtnClick(btnText)
    view.toggleBtnStart()
    view.changeCmdBtnVisibility(false)
    view.buttons().filter(btn => view.notIsUnassignedButton(btn)).forEach(view.setupBtnAction)
}

view.setupBtnAction = btn => {
    const text = btn.innerText.toLowerCase()

    if (text.includes('start')) return

    if (text.includes('stop')) {
        btn.onclick = () => view.onStopBtn(btn)
        return
    }

    btn.onclick = () => view.onCommandClick(btn)
}

view.onCommandClick = async btn => {
    const { classList, innerText } = btn

    view.toggleDisableCommandBtn(classList)
    await view.onBtnClick(innerText)
    setTimeout(() => view.toggleDisableCommandBtn(classList), 500)
}

view.toggleDisableCommandBtn = classList => {
    if (!classList.contains('active')) {
        classList.add('active')
    } else {
        classList.remove('active')
    }
}

view.onStopBtn = ({ innerText }) => {
    view.toggleBtnStart(false)
    view.changeCmdBtnVisibility()

    return view.onBtnClick(innerText)
}

view.notIsUnassignedButton = btn => {
    const classes = Array.from(btn.classList)

    return !(!!classes.find(item => view.ignoreButtons.has(item)))
}

view.toggleBtnStart = (active = true) => {
    if (active) {
        view.btnStart.classList.add('hidden')
        view.btnStop.classList.remove('hidden')
    } else {
        view.btnStart.classList.remove('hidden')
        view.btnStop.classList.add('hidden')
    }
}

export default view
