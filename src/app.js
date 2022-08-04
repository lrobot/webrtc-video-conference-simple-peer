const fs = require('fs')
const path = require('path')
const express = require('express')
const app = express()
const httpolyglot = require('httpolyglot')
const https = require('https')

var net = require('net')

//////// CONFIGURATION ///////////

// insert your own ssl certificate and keys
const options = {
    key: fs.readFileSync(path.join(__dirname,'..','ssl','key.pem'), 'utf-8'),
    cert: fs.readFileSync(path.join(__dirname,'..','ssl','cert.pem'), 'utf-8')
}

const port = parseInt(process.env.PORT) || 3012
const tcp_port = port + 1;
////////////////////////////

require('./routes')(app)

var tcpServer = net.createServer().listen(tcp_port,  function () {
    console.log('TCP Server start on ' + tcp_port)
})

require('./socketController').tcp_handler(tcpServer)

const httpsServer = httpolyglot.createServer(options, app)
const io = require('socket.io')(httpsServer)
require('./socketController').socket_io_handler(io)

httpsServer.listen(port, () => {
    console.log(`listening on port ${port}`)
})





