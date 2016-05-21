'use strict'

// const config = require('../config')
// const log = config.log
const SocketIO = require('socket.io')

module.exports = (http) => {
  const io = new SocketIO(http.listener)
  io.on('connection', handle)

  const peers = {}

  this.peers = () => {
    return peers
  }

  function handle (socket) {
    socket.on('ss-join', join.bind(socket))
    socket.on('ss-leave', leave.bind(socket))
    socket.on('disconnect', disconnect.bind(socket)) // socket.io own event
    socket.on('ss-handshake', forwardHandshake)
  }

  // join this signaling server network
  function join (multiaddr) {
    peers[multiaddr] = this // socket
    Object.keys(peers).forEach((mh) => {
      if (mh === multiaddr) {
        return
      }
      peers[mh].emit('ws-peer', multiaddr)
    })
  }

  function leave (multiaddr) {
    if (peers[multiaddr]) {
      delete peers[multiaddr]
    }
  }

  function disconnect () {
    Object.keys(peers).forEach((mh) => {
      if (peers[mh].id === this.id) {
        delete peers[mh]
      }
    })
  }

  // forward an WebRTC offer to another peer
  function forwardHandshake (offer) {
    if (offer.answer) {
      peers[offer.srcMultiaddr].emit('ws-handshake', offer)
    } else {
      if (peers[offer.dstMultiaddr]) {
        peers[offer.dstMultiaddr].emit('ws-handshake', offer)
      } else {
        offer.err = 'peer is not available'
        peers[offer.srcMultiaddr].emit('ws-handshake', offer)
      }
    }
  }

  return this
}
