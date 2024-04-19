const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const osc = require('osc');
const path = require('path');
// Setup Express
const app = express();
const server = http.createServer(app);
const io = socketIO(server);

// Serve your index.html file
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/public/index.html');
});
app.use(express.static(path.join(__dirname, 'public')));

// OSC UDP Port setup for communicating with Unity
const udpPort = new osc.UDPPort({
    localAddress: "0.0.0.0",
    localPort: 57121,
    remoteAddress: "127.0.0.1",
    remotePort: 7000
});
udpPort.open();

// Handle Socket.IO connections
io.on('connection', (socket) => {
    console.log('A user connected');
    socket.on('connect_error', (error) => {
        console.log('Connection Error:', error);
    });
    
    socket.on('connect_timeout', (timeout) => {
        console.log('Connection Timeout:', timeout);
    });
    
    socket.on('error', (error) => {
        console.log('Error:', error);
        displayErrorMessage('A socket error occurred.');
    });
    
    socket.on('sendNames', (data) => {
        console.log(`Received names for Player 1: ${data.player1.firstName}, ${data.player1.surname}, ${data.player1.email}, ${data.player1.country}, Communication: ${data.player1.communication ? 'Yes' : 'No'}`);
        console.log(`Received names for Player 2: ${data.player2.firstName}, ${data.player2.surname}, ${data.player2.email}, ${data.player2.country}, Communication: ${data.player2.communication ? 'Yes' : 'No'}`);
    
        // Send OSC messages to Unity for both players
        const player1Msg = {
            address: "/player1",
            args: [
                { type: "s", value: data.player1.firstName },
                { type: "s", value: data.player1.surname },
                { type: "s", value: data.player1.email },
                { type: "s", value: data.player1.country },
                { type: "i", value: data.player1.communication ? 1 : 0 } // Convert boolean to integer
            ]
        };
        udpPort.send(player1Msg);
    
        const player2Msg = {
            address: "/player2",
            args: [
                { type: "s", value: data.player2.firstName },
                { type: "s", value: data.player2.surname },
                { type: "s", value: data.player2.email },
                { type: "s", value: data.player2.country },
                { type: "i", value: data.player2.communication ? 1 : 0 } // Convert boolean to integer
            ]
        };
        udpPort.send(player2Msg);
    });
    
    socket.on('restartGame', (data) => {
        console.log("Game Restart signal received:", data.gameStart);
        const restartMsg = {
            address: "/gameRestart",
            args: [{ type: "i", value: 1 }] // Send as integer, 1 for true
        };
        udpPort.send(restartMsg);
    });

    socket.on('startGame', (data) => {
        console.log("Game start signal received:", data.gameStart);
        udpPort.send({
            address: "/gameStart",
            args: [{ type: "i", value: data.gameStart ? 1 : 0 }] // Send as integer
        });
    });
    socket.on('resetData', (data) => {
        console.log("Leaderboard Reset signal received:", data.gameStart);
        udpPort.send({
            address: "/resetData",
            args: [{ type: "i", value: data.gameStart ? 1 : 0 }] // Send as integer
        });
    });
    

    udpPort.on("message", function (oscMsg) {
        console.log("Received message from Unity:", oscMsg.address, oscMsg.args);
        if (oscMsg.address === "/gameEnd") {
            socket.emit('gameEnd', { gameEnded: true });
        }
    });
    udpPort.on("message", function (oscMsg) {
        console.log("Received message from Unity:", oscMsg.address, oscMsg.args);
        
        // Handle confirmation message from Unity
        if (oscMsg.address === "/confirmation") {
            console.log("Confirmation received from Unity: ", oscMsg.args[0].value);
            // You can emit this confirmation to the web clients
            io.emit('confirmationReceived', oscMsg.args[0].value);
        }
    });
    socket.on('disconnect', () => {
        console.log('User disconnected');
    });
});

// Start the HTTP server
server.listen(3000, () => {
    console.log('Server is running on http://192.168.1.245:3000');
});