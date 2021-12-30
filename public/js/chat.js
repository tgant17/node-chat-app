const socket = io()

// ELements 
const $messageForm = document.querySelector('#messageForm')
const $messageFormInput = $messageForm.querySelector('input')
const $messageFormButton = $messageForm.querySelector('button')
const $sendLocation = document.querySelector('#sendLocation')
const $messages = document.querySelector('#messages')

// Templates 
const messageTemplate = document.querySelector('#messageTemplate').innerHTML
const locationTemplate = document.querySelector('#locationTemplate').innerHTML
const sidebarTemplate = document.querySelector('#sidebarTemplate').innerHTML


// Options 
const {username, room} = Qs.parse(location.search, {ignoreQueryPrefix: true })

const autoScroll = () => {
    // get new message element 
    const $newMessage = $messages.lastElementChild

    //height 
    const newMessageStyles = getComputedStyle($newMessage)
    const newMessageMargin  = parseInt(newMessageStyles.marginBottom)
    const newMessageHeight = $newMessage.offsetHeight + newMessageMargin

    //visible height 
    const visibleHeight = $messages.offsetHeight
    
    //height of messages container 
    const containerHeihgt = $messages.scrollHeight

    //how far have i scrolled 
    const scrollOffset = $messages.scrollTop + visibleHeight

    if(containerHeihgt - newMessageHeight <= scrollOffset) {
        $messages.scrollTop = $messages.scrollHeight
    }

    console.log(newMessageMargin)

}

socket.on('message', (message) => {
    console.log(message)
    const html = Mustache.render(messageTemplate, {
        username: message.username, 
        message: message.text,
        createdAt: moment(message.createdAt).format('h:mm a')
    })
    $messages.insertAdjacentHTML('beforeend', html)
    autoScroll() 
})

socket.on('locationMessage', (message) => {
    console.log(message)
    const html = Mustache.render(locationTemplate, {
        username: message.username,
        url: message.url,
        createdAt: moment(message.createdAt).format('h:mm a')
    })
    $messages.insertAdjacentHTML('beforeend', html)
    autoScroll() 
})

socket.on('roomData', ({ room, users }) => {
    const html = Mustache.render(sidebarTemplate, {
        room, 
        users
    })
    document.querySelector('#sidebar').innerHTML = html
})


$messageForm.addEventListener('submit', (e) => {
    e.preventDefault()

    $messageFormButton.setAttribute('disabled', 'disabled')
    //disable
    const message = e.target.elements.message.value
    socket.emit('sendMessage', message, (error) => {
        $messageFormButton.removeAttribute('disabled')
        $messageFormInput.value = ''
        $messageFormInput.focus() 
        if(error) {
            return console.log(error)
        }
        console.log('The message was delivered', message)
    })
})

socket.on('printMsg', (msg) => {
    console.log(msg)
})

$sendLocation.addEventListener('click', () => {
    if (!navigator.geolocation) {
        return alert('Not supported by your bum ass browser')
    }
        $sendLocation.setAttribute('disabled', 'disabled')

        navigator.geolocation.getCurrentPosition((position) => {
            const lat = position.coords.latitude
            const long = position.coords.longitude

            socket.emit('sendLocation', lat, long, () => {
                console.log('Sent Location')
                $sendLocation.removeAttribute('disabled')
            })
        })
})


socket.emit('join', { username, room }, (error) => {
    if(error) {
        alert(error) 
        location.href = '/'
    }
})
