const app = require("express")();
const http = require("http").Server(app);
const io = require('socket.io')(http);
const bodyParser = require('body-parser');

app.use(bodyParser.json());

// Buffer the last 50 lines so when a client connects it gets some data
const maxAuctionsInBuffer = 50
var redBuffer = [];
var blueBuffer = [];

var blueClients = [];
var redClients = [];

function serializeBuffer(server) {
    if (typeof server !== "undefined" && server !== null) {
        console.log(server)
        if (server.toUpperCase() === "RED") {
            return { "PreviousAuctions" : redBuffer };
        } else if (server.toUpperCase() === "BLUE") {
            return { "PreviousAuctions" : blueBuffer };
        }
    }
    return { "PreviousAuctions" : [] };
}

// TODO: Make a generic method for /red and /blue to share (cant be bothered just yet)
app.post('/auctions/red', function(req, res) {

    console.log("Received a red auction")
    // Update the buffer with the new records:
    if(req.body.Lines && req.body.Lines.length > 0) {
        var newLines = [];
        while(req.body.Lines.length > 0) {
            var line = req.body.Lines.shift()
            newLines.push(line)
            if(redBuffer.length > maxAuctionsInBuffer) {
                redBuffer.shift(); //
            }
            redBuffer.push(line); // push to end of auctionBuffer for new people to see
        }
        console.log("Emitting to " + redClients.length + " clients");
        redClients.forEach(function(socket){
            socket.emit('auctions-updated', newLines)
        })
    }

    res.writeHead(200);
    res.end()
});

app.post('/auctions/blue', function(req, res) {

    console.log("Received a blue auction")
    // Update the buffer with the new records:
    if(req.body.Lines && req.body.Lines.length > 0) {
        var newLines = [];
        while(req.body.Lines.length > 0) {
            var line = req.body.Lines.shift()
            newLines.push(line)
            if(blueBuffer.length > maxAuctionsInBuffer) {
                blueBuffer.shift(); //
            }
            blueBuffer.push(line); // push to end of auctionBuffer for new people to see
        }
        console.log("Emitting to: " + blueClients.length + " clients")
        blueClients.forEach(function(socket){
            socket.emit('auctions-updated', newLines)
        })
    }

    res.writeHead(200);
    res.end()
});

http.listen(3000, function(){
    console.log('listening on *:3000');
});

// SOCKET IO Listeners
io.sockets.on('connection', function(socket) {
    console.log("Socket connected: ", socket.id)
    socket.emit('request-server')
    
    socket.on('server-type', function(gameServer) {
       socket.gameServer = gameServer
        if (typeof socket.gameServer !== "undefined" && socket.gameServer !== null) {
            if(socket.gameServer.toUpperCase() === "RED") {
                console.log("Pushed red socket")
                redClients.push(socket)
            } else if(socket.gameServer.toUpperCase() === "BLUE") {
                console.log("Pushed blue socket")
                blueClients.push(socket)
            } else {
                socket.disconnect()
            }
            socket.emit('join', {auctions: serializeBuffer(socket.gameServer), server: socket.gameServer})
        } else {
            console.log("Disonnecting socket: ", socket.id, socket.gameServer)
            socket.disconnect()
        }
    });

    socket.on('disconnect', function() {
        if (typeof socket.gameServer !== "undefined" && socket.gameServer !== null) {
            var socketId = -1;
            if (socket.gameServer === "RED") {
                socketId = redClients.indexOf(socket)
                if(socketId > -1) {
                    redClients = redClients.splice(socketId, 1)
                }
                redClients.emit('viewers', redClients.length)
            } else if(socket.gameServer === "BLUE") {
                socketId = blueClients.indexOf(socket)
                if(socketId > -1) {
                    blueClients = blueClients.splice(socketId, 1)
                }
                redClients.emit('viewers', blueClients.length)
            }
        }
        console.log('Socket: ' + socket.id + " disconnected")
    })
});
