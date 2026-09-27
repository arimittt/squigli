const express = require('express')
const app = express()
const http = require('http').createServer(app)
const io = require('socket.io')(http)
const port = process.env.PORT || 3000;

app.use(express.static(__dirname + '/public'))

// Routing

app.get('/', (req, res) => {
	res.sendFile(__dirname + '/views/whip.html')
})

app.get('/controller', (req, res) => {
	res.sendFile(__dirname + '/views/whip-controller.html')
})

// Health check for the deployment platform

app.get('/health', (req, res) => {
	res.sendStatus(200)
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

http.listen(port, '0.0.0.0', () => console.log(`Port: ${port}`))

// Shuts down cleanly when the container is stopped

process.on('SIGTERM', () => {
	io.close()
	http.close(() => process.exit(0))
})
