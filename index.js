const app = require("express")();
const http = require("http").Server(app);
const io = require('socket.io')(http);
const bodyParser = require('body-parser');

app.use(bodyParser.json());

// Buffer the last 50 lines so when a client connects it gets some data
const maxAuctionsInBuffer = 50
var auctionBuffer = [];

function serializeBuffer() {
    return { "PreviousAuctions" : auctionBuffer };
}
app.get('/', function(req, res){
    res.sendFile(__dirname + '/index.html');
});

app.post('/auctions', function(req, res) {

    // Update the buffer with the new records:
    if(req.body.Lines && req.body.Lines.length > 0) {
        var newLines = [];
        while(req.body.Lines.length > 0) {
            var line = req.body.Lines.shift()
            newLines.push(line)
            if(auctionBuffer.length > maxAuctionsInBuffer) {
                auctionBuffer.shift(); //
            }
            auctionBuffer.push(line); // push to end of auctionBuffer for new people to see
        }
        io.sockets.emit('auctions-updated', newLines)
    }
    
    res.writeHead(200);
    res.end()
});

http.listen(3000, function(){
    console.log('listening on *:3000');
});

// SOCKET IO Listeners
io.on('connection', function(socket) {
    console.log("A user connected: ", socket.id)

    socket.emit('join', serializeBuffer())
});

io.on('disconnect', function(socket) {
   console.log("A socket disconnected: ", socket.id)
});