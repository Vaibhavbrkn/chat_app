const path = require('path')
const http = require('http')
const express = require('express')
const socketio = require('socket.io')
const Filter = require('bad-words')
const {generateMessage , generateLocationMessage} = require('./utils/messages')
const { addUser, removeUser, getUser,getUsersInRoom}  = require('./utils/users')


const app = express()
var server  = require('http').createServer(app);
var io      = require('socket.io').listen(server)

const port = process.env.PORT || 3000
const publicDirectoryPath = path.join(__dirname, '../public')

app.use(express.static(publicDirectoryPath))

//let count = 0

io.on('connection', (socket)=> {
    console.log("new connection")

    socket.on('join',({username , room} , callback)=>{
        const {error , user } = addUser({id:socket.id , username,room})

        if(error){
            return callback(error)
        }

        socket.join(user.room)

        socket.emit('message',generateMessage('System' , 'Welcome'));
        socket.broadcast.to(user.room).emit('message' , generateMessage('vaibhav',`${user.username} has joined`))
        io.to(user.room).emit('roomData',{
            room :user.room,
            users:getUsersInRoom(user.room)
        })
        callback()
    })

    socket.on('sendmessage' ,(message , callback)=>{
        const user = getUser(socket.id)
        const filter = new Filter()

        if(filter.isProfane(message)){
            return callback('Profanity is not alllowed')
        }
        io.to(user.room).emit('message' , generateMessage(user.username,message))
        callback('Delivered!')
        
    })

    socket.on('sendLocation' , (coords , callback)=>{
        const user = getUsersInRoom(socket.id)
        io.to(user.room).emit('locationMessage' , generateLocationMessage(user.username,`https://google.com/maps?q=${coords.latitude},${coords.longitude}`))
        callback()
    })

    socket.on('disconnect' ,()=>{
        const user = removeUser(socket.id)
        if(user){
            io.to(user.room).emit('message' ,generateMessage('Admin',`${user.username} has left`))
            io.to(user.room).emit('roomData',{
                room : user.room,
                users:getUsersInRoom(user.room)
            })
    }
        })

    

   /* socket.emit('countUpdated' , count) for only one clinet

    socket.on('increment' , ()=>{
        count++
        //socket.emit('countUpdated' , count)
        io.emit('countUpdated' , count) for every connected client
    })*/
})

  

server.listen(port,()=>{
    console.log("server is at port" + port)
})