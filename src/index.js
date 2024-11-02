const { PORT } = require('./config/serverConfig');
const express = require('express');
const redis = require('ioredis');
const { createServer } = require('http');
const bodyParser = require('body-parser');
const { Server } = require('socket.io');
const app = express();
const httpServer = createServer(app);
const redisCache = new redis();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
const io = new Server(httpServer, {
  cors: {
    origin: 'http://127.0.0.1:5500',
    methods: ['GET', 'POST'],
  },
});

io.on('connection', (socket) => {
  console.log('Socket connected: ' + socket.id);
  // socket.emit('setUserId', 1234);
  socket.on('setUserId', (userId) => {
    console.log('User Id :', userId, ' Socket Id :', socket.id);
    redisCache.set(userId, socket.id);
  });
  // socket.emit('getConnectionId',1234);
  socket.on('getConnectionId', async (userId) => {
    const connectionId = await redisCache.get(userId);
    console.log('ConnectionId', connectionId);
    socket.emit('connectionId', connectionId);
  });
});
app.post('/sendPayload', async (req, res) => {
  const { userId, payload } = req.body;
  if (!userId || !payload) {
    res.status(400).send('Invalid request');
  }
  const socketId = await redisCache.get(userId);
  if (socketId) {
    io.to(socketId).emit('submissionPayloadResponse', payload);
    res.send('Payload Sent Successfully');
  } else {
    res.status(404).send('User not connected');
  }
});

httpServer.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
