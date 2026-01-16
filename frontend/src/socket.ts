import { io, Socket } from 'socket.io-client'

const SOCKET_URL =
  import.meta.env.VITE_WS_URL ||
  import.meta.env.VITE_API_URL ||
  import.meta.env.VITE_BACKEND_URL ||
  ''

let socket: Socket | null = null


export const getSocket = () => {
  if (!socket) {
    socket = io(SOCKET_URL, { autoConnect: false })
  }
  return socket
}

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect()
    socket = null
  }
}
