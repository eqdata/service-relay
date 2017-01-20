**RELAY SERVICE**
Uses SocketIO to relay messages from service-collection to all connected stream clients.

***Service-Relay Life-cycle:***

This service uses socket IO to handle the real-time communication of auction logs between client and server.   You may write your own applications to consume this data-feed if you so choose.

Server API docs have been omitted from this README, instead a list of client methods are documented below.

**Client API**

First of all, please create a socket:

```
var socket = io(“HOST:PORT”);

// Set a default server on this socket
socket.gameServer = “red”;
```

This will automatically fire Socket-IO’s `connect()` method, the server will emit a `request-server` event which you need to catch and reply to.   In this block set the server that you wish to connect to `red` or `blue`.

```
socket.on('request-server', function() {
   socket.emit('server-type', socket.gameServer)
});
```

When the server receives the server-type it will check whether it is `red` or `blue` with a case insensitive check.  Any other options will result in the socket to be disconnected from the server.  If the provided gameServer value is valid the server will subscribe you to either the Red or Blue channel and will reply with a `join` event.   The `join` event will send back a payload containing:

```
payload : { auctions { PreviousAuctions: []}, server: string }
```

The auctions array contains an array of all Previous Auction wrapped inside of an auction object (this may be refactored in the future for a more usable API).  The `server` string returned just clarifies what server the user is subscribed to now.
**Note**: Here you may choose to do any UI updates such as notifying the client that they are now connected to the auction stream and clear out the old auction buffer if you had

Now that you are successfully connected to the server you should listen for any inbound stream data from the server with `auctions-updated`:

```
socket.on('auctions-updated', function(auctions) {
   auctions.forEach(function(line) { this.addAuctionLine(line) });
   updateScrollHeight()
});
```

In the above example we consume an `auctions` array which follows the same format as the `PreviousAuctions` array returned in `join`.   The above example simply iterates over each auction in the array and appends it out to a unordered list, `updateScrollHeight()` is used to force the scroll position of the unordered list to the bottom.

Finally you may choose to listen for a `disconnect` event.  In the case the socket connection is hung up, please ensure you set a timeout on the reconnect to avoid spamming the server with a large throughput of requests:

```
socket.on('disconnect', function() {
   setTimeout(function() {
       socket.gameServer = "red"
       socket.connect()
   }, 2500)
});
```

Here we reconnect to the server as the red server after 2.5seconds.

**Extra** If you would like to toggle between two streams simply use `socket.disconnect()` on the socket and re-establish the connection with the new game server and then call `connect` to respawn a new instance.  This will reflow through the process we’ve documented above.


**LICENSE**
Copyright 2017 - Alexander Sims
Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.