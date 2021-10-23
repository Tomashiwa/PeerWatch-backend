import React, { useState, useEffect, useCallback } from "react";
import ChatboxWrapper from "./Chatbox.styled";
import ChatContent from "./ChatContent";
import ChatInput from "./ChatInput";
import { useUser } from "../Context/UserContext";

function Chatbox({ socket, roomId }) {
	const [messages, setMessages] = useState([]);
	const { userInfo } = useUser();

	const receiveMessage = useCallback(
		(msg) => {
			const newMessages = messages.slice();
			newMessages.push({
				id: messages.length > 0 ? messages[messages.length - 1].id + 1 : 0,
				msg,
			});
			setMessages(newMessages);
		},
		[messages]
	);

	const sendMessage = useCallback(
		(msg) => {
			const taggedMsg = `${userInfo.displayName}: ${msg}`;
			receiveMessage(taggedMsg);
			socket.emit("send-message", taggedMsg, roomId);
		},
		[receiveMessage, socket, roomId]
	);

	const initialize = useCallback(() => {
		socket.emit("join-room", roomId, () => {
			const msg = `${userInfo.displayName} has joined the chat`;
			receiveMessage(msg);
			socket.emit("send-message", msg, roomId);
		});
	}, [receiveMessage, socket, roomId]);

	// Reset socket event handlers when Chatbox re-render
	useEffect(() => {
		if (socket) {
			socket.on("connect", initialize);
			socket.on("receive-message", receiveMessage);
			return () => {
				socket.off("connect", initialize);
				socket.off("receive-message", receiveMessage);
			};
		}
	}, [socket, initialize, receiveMessage]);

	return (
		<ChatboxWrapper className="chatbox">
			<div className="chatbox-content">
				<ChatContent messages={messages} />
			</div>
			<div className="chatbox-input">
				<ChatInput onSubmit={sendMessage} />
			</div>
		</ChatboxWrapper>
	);
}

export default Chatbox;
