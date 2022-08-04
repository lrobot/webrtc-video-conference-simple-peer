



const EventEmitter = require('node:events').EventEmitter;


peers = {}

connect_handler = (socket) => {
    console.log('socket.io new', socket.id)
    // Initiate the connection process as soon as the client connects

    peers[socket.id] = socket

    // Asking all other clients to setup the peer connection receiver
    for(let id in peers) {
        if(id === socket.id) continue
        console.log('sending init receive to ' + socket.id)
        peers[id].emit('initReceive', socket.id)
    }

    /**
     * relay a peerconnection signal to a specific socket
     */
    socket.on('signal', data => {
        console.log('sending signal from ' + socket.id + ' to ', data)
        if(!peers[data.socket_id])return
        peers[data.socket_id].emit('signal', {
            socket_id: socket.id,
            signal: data.signal
        })
    })

    /**
     * remove the disconnected peer connection from all other connected clients
     */
    socket.on('disconnect', () => {
        console.log('socket disconnected ' + socket.id)
        for(let id in peers) {
            if(id === socket.id) continue
            peers[id].emit('removePeer', socket.id)
        }
        //socket.broadcast.emit('removePeer', socket.id)
        delete peers[socket.id]
    })

    /**
     * Send message to client to initiate a connection
     * The sender has already setup a peer connection receiver
     */
    socket.on('initSend', init_socket_id => {
        console.log('INIT SEND by ' + socket.id + ' for ' + init_socket_id)
        peers[init_socket_id].emit('initSend', socket.id)
    })
    socket.on('echo', (data)=> {
        socket.emit('echo_back', data);
    })
}

class LongPollClient{
    constructor(socket){
        this._emitter = new EventEmitter();
        this.socket = socket
        this.id = "tcp_"+ socket.remoteAddress + "_" + socket.remotePort;
        this.buf = '';
        socket.on('data',(dataBuff)=>{
            var datastr = dataBuff.toString();
            console.log(this.id , '_data_in' , datastr)
            var newBuf = this.buf + datastr;
            this.buf = null;
            var lastBuf = null;
            newBuf.split("\r\n\r\b").forEach(jsonstr => {
                lastBuf = jsonstr;
                try {
                    var jsonobj = JSON.parse(jsonstr)
                    if(jsonobj.event){
                        this._emitter.emit(jsonobj.event, jsonobj.data);
                    }
                } catch(e) {
                    console.error(e);
                    return
                }
            });
            this.buf = lastBuf;
        }).on('close',()=>{
            this._emitter.emit('disconnect',{})
        })
    }
    on(event, listener) {
        this._emitter.on(event, listener);
    }

    emit(event,data){
        var jsonstr = JSON.stringify({'event':event, 'data':data});
        console.log(this.id , '_data_out' , jsonstr)
        this.socket.write(jsonstr +"\r\n\r\n");
    }
    close(){
        this.socket.close()
    }
}

tcp_handler = (tcpServer) => {
    tcpServer.on('connection', (socket)=>{
        peer = new LongPollClient(socket)
        connect_handler(peer);
        console.log("tcp new:", peer.id)
    })
}

socket_io_handler =  (io) => {
    io.on('connect', connect_handler)
}


module.exports = {
    tcp_handler,
    socket_io_handler
}
