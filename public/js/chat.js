const socket = io()

const $messageform = document.querySelector('#message-form');
const $messageformInput = document.querySelector('input');
const $messageformButton = document.querySelector('button');
const $sendLocation = document.querySelector('#send-location');
const $messages = document.querySelector('#messages');


const locationMessageTemplate = document.querySelector('#location-message-template').innerHTML
const messageTemplate = document.querySelector('#message-template').innerHTML
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML


const {username , room} = Qs.parse(location.search , {ignoreQueryPrefix : true})

const autoscroll = ()=>{
    const $newMessage = $messages.lastElementChild

    const newMessageStyles = getComputedStyle($newMessage)
    const newMessageMargin = parseInt(newMessageStyles.marginBottom)
    const newMessageHeight = $newMessage.offsetHeight = newMessageMargin

    const visibleHeight = $messages.offsetHeight

    const containerHeight = $messages.scrollHeight

    const scrollOffset = $messages.scrollTop + visibleHeight

    if(containerHeight-newMessageHeight<=scrollOffset){
        $messages.scrollTop = $messages.scrollHeight
    }
}


socket.on('message' , (message)=>{
    console.log(message)
    const html = Mustache.render(messageTemplate,{
        username : message.username,
        message : message.text,
        createdAt: moment(message.createdAt).format('hh:mm a')
    })
    $messages.insertAdjacentHTML('beforeend' ,html)
    autoscroll()
})


socket.on('locationMessage' , (message)=>{
    console.log(message)
    const html = Mustache.render(locationMessageTemplate,{
        username: message.username,
        url: message.url,
        createdAt:moment(message.createdAt).format('hh:mm a')})
    $messages.insertAdjacentHTML('beforeend' ,html)
    autoscroll()
})

socket.on('roomData',({room , users})=>{
   const html = Mustache.render(sidebarTemplate,{
       room,
       users
   })
   document.querySelector('#sidebar').innerHTML = html
})

$messageform.addEventListener('submit' , (e)=>{
    e.preventDefault()
    $messageformButton.setAttribute('disabled' , 'disabled')

    const message = e.target.elements.message.value

    socket.emit('sendmessage' , message , (error)=>{
        $messageformButton.removeAttribute('disabled')
        $messageformInput.value = ''
        $messageformInput.focus()
        if(error){
            return console.log(error)
        }
        console.log('Message is delivered')
    })
})
/*socket.on('countUpdated' , (count)=>{
    console.log('The count has been updated' , count)
})

document.querySelector('#increment').addEventListener('click' , ()=>{
    console.log('Clicked')
    socket.emit('increment')
})
*/
$sendLocation.addEventListener('click',()=>{
    if(!navigator.geolocation){
        return alert('Geolocation is not supported by your browser')
    }
    $sendLocation.setAttribute('disabled' , 'disabled')

    navigator.geolocation.getCurrentPosition((position)=>{
       //console.log(position)
        socket.emit('sendLocation' ,{
            latitude : position.coords.latitude,
            longitude : position.coords.longitude
        },()=>{
            $sendLocation.removeAttribute('disabled')
            console.log('Location is Shared')
        } )
    })
})

socket.emit('join'  , {username , room} , (error)=>{
    if(error){
        alert(error)
        location.href = '/'
    }
})