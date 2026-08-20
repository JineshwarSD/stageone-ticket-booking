let ioInstance = null;

function initSocket(io) {
  ioInstance = io;
  io.on('connection', (socket) => {
    socket.on('joinShow', (eventId) => {
      socket.join(`show:${eventId}`);
    });
    socket.on('leaveShow', (eventId) => {
      socket.leave(`show:${eventId}`);
    });
  });
}

function emitSeatUpdate(eventId, payload) {
  if (!ioInstance) return;
  ioInstance.to(`show:${eventId}`).emit('seatUpdate', payload);
}

module.exports = { initSocket, emitSeatUpdate };
