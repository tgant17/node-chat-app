const express = require('express')
const path = require('path')
const http = require('http')
const socketio = require('socket.io')
const Filter = require('bad-words')
const { generateMessage, generateLocationMessage } = require('./utils/messages')
const { addUser, getUser, getUsersInRoom, removeUser } = require('./utils/users')

const app = express() 
const server = http.createServer(app) 
const io = socketio(server)

const port = process.env.PORT || 3000
const publicDirectoryPath = path.join(__dirname, '../public')

app.use(express.static(publicDirectoryPath))

let count = 0 

io.on('connection', (socket) => {
    console.log('new connect')


    socket.on('join', ({ username, room }, callBack) => {
        const {error, user} = addUser({id: socket.id, username, room })

        if (error) {
            return callBack(error)
        }


        socket.join(user.room) 

        socket.emit('message', generateMessage('Admin', 'bitches aint shit but hoes and tricks'))
        socket.broadcast.to(user.room).emit('message', generateMessage('Admin', `${user.username} has joined`))
        io.to(user.room).emit('roomData', {
            room: user.room,
            users: getUsersInRoom(user.room) 
        })
        callBack() 
    })


    socket.on('sendMessage', (m, callBack) => {
        const user = getUser(socket.id) 
        const filter = new Filter()

        if(filter.isProfane(m)) {
            return callBack('Profanity is not allowed')
        }
        io.to(user.room).emit('message', generateMessage(user.username,m))
        callBack() 
    })

    socket.on('disconnect', () => {
        const user = removeUser(socket.id)

        if(user) {
            io.to(user.room).emit('message', generateMessage('Admin', `${user.username} has left`))
            io.to(user.room).emit('roomData', {
                room: user.room, 
                users: getUsersInRoom(user.room)
            })

        }
    })

    socket.on('sendLocation', (lat, long, callBack) => {
        const user = getUser(socket.id)
        const msg = 'https://google.com/maps?q=' + lat + "," + long 
        io.to(user.room).emit('locationMessage', generateLocationMessage(user.username, msg))
        callBack()
    })
})


server.listen(port, () => {
    console.log('Server is up on port ' + port)
}) 