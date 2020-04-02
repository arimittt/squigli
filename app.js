const express = require('express')
const app = express()
const http = require('http').createServer(app)
const io = require('socket.io')(http)
const port = 3001;

app.use(express.static('public'))

// Routing

app.get('/', (req, res) => {
	res.sendFile(__dirname + '/views/whip.html')
})

app.get('/controller', (req, res) => {
	res.sendFile(__dirname + '/views/whip-controller.html')
})

// Listens for any new connections

io.on('connection', socket => {
	console.log('New connection.')

	// Re-emits gyroscope data to controller with UID

	socket.on('whipControllerOutput', data => {
		io.emit(`whipControllerInput-${data.id}`, data.reading)
	})

	// Re-emits parameter changes to controller with UID

	socket.on('whipControllerParameters', data => {
		io.emit(`whipControllerParameters-${data.id}`, data.params)
	})
})

http.listen(port, () => console.log(`Port: ${port}`))