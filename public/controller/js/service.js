const srv = {}
let _url

srv.init = url => {
    _url = url
}

srv.makeRequest = async data => {
    const result = await fetch(_url, {
        method: 'POST',
        body: JSON.stringify(data)
    })

    return result.json()
}

export default srv
