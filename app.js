const express = require('express')
const app = express()
const http = require('http').createServer(app)
const io = require('socket.io')(http)
const port = 3001;

app.use(express.static('public'))

app.get('/', (req, res) => {
	res.sendFile(__dirname + '/views/whip.html')
})

app.get('/controller', (req, res) => {
	res.sendFile(__dirname + '/views/whip-controller.html')
})

io.on('connection', socket => {
	console.log('New connection.')

	socket.on('whipControllerOutput', data => {
		io.emit(`whipControllerInput-${data.id}`, data.reading)
	})

	socket.on('whipControllerParameters', data => {
		io.emit(`whipControllerParameters-${data.id}`, data.params)
	})
})

http.listen(port, () => console.log(`Port: ${port}`))