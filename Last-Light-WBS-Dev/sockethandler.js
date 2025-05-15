// socketHandler.js
module.exports = function(io, gameLogic, { config, utils }) {
  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);
    // Send initial state with both mapData and the actual mapId
    socket.emit('initState', {
      mapData: gameLogic.getMapData(),
      mapId: gameLogic.mapId
    });

    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
    });
  });

  // Broadcast game updates (including mapData and mapId)
  function gameTick() {
    io.emit('gameUpdate', {
      mapData: gameLogic.getMapData(),
      mapId: gameLogic.mapId
    });
  }

  setInterval(gameTick, 1000 / 60);
};
