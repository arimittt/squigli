// Copies the Socket.IO browser client that ships with the installed server
// into public/js, so the client and server versions always match

const fs = require('fs')
const path = require('path')

const source = path.join(path.dirname(require.resolve('socket.io')), '..', 'client-dist')
const target = path.join(__dirname, '..', 'public', 'js')

fs.mkdirSync(target, { recursive: true })

for (const file of ['socket.io.js', 'socket.io.js.map']) {
	fs.copyFileSync(path.join(source, file), path.join(target, file))
}

console.log(`Copied Socket.IO client to ${path.relative(process.cwd(), target)}`)
