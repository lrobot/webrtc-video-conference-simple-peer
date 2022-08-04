const fs = require('fs')
const path = require('path')
const express = require('express')
const app = express()
const httpolyglot = require('httpolyglot')
const https = require('https')

var net = require('net')

//////// CONFIGURATION ///////////

// insert your own ssl certificate and keys
function getCertOption(){
    if(fs.existsSync(path.join(__dirname, '..', 'ssl_link', 'privkey.pem'))){
        return {
            key: fs.readFileSync(path.join(__dirname,'..','ssl_link','privkey.pem'), 'utf-8'),
            cert: fs.readFileSync(path.join(__dirname,'..','ssl_link','cert.pem'), 'utf-8')
        }
    } else {
        return {
            key: fs.readFileSync(path.join(__dirname,'..','ssl','key.pem'), 'utf-8'),
            cert: fs.readFileSync(path.join(__dirname,'..','ssl','cert.pem'), 'utf-8')
        }        
    }
}
const options = getCertOption();

const port = parseInt(process.env.PORT) || 8443
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






