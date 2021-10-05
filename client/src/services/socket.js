import { io } from "socket.io-client";

// May need to see if connection can be conditionally made instead of for all
const socket = io("http://localhost:5000");
export default socket;
