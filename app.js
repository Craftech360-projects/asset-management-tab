// Import required modules
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');

// Create Express app
const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// Serve the main HTML file
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Socket.io logic
io.on('connection', (socket) => {
    console.log('A user connected');

    // Listen for button press event
    socket.on('buttonPress', () => {
        // Generate a random number between 1 and 6
        const randomNumber1 = Math.floor(Math.random() * 6) + 1;
        // Emit the random number to all connected clients
        io.emit('randomNumber', randomNumber1);
        const randomNumber2 = Math.floor(Math.random() * 6)+ 1;
        // Emit the random number to all connected clients
        io.emit('randomNumber', randomNumber2);
	// Generate a random number between 1 and 100
        const sumOfNumber = randomNumber1 + randomNumber2;
        // Emit the random number to all connected clients
        io.emit('sumOfNumbers', sumOfNumber );
    });

    // Handle disconnection
    socket.on('disconnect', () => {
        console.log('User disconnected');
    });
});

// Start the server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
