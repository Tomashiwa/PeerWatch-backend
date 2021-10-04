import React, { useState } from "react";
import ChatboxWrapper from "./Chatbox.styled";
import ChatContent from "./ChatContent";
import ChatInput from "./ChatInput";

function Chatbox() {
	const [messages, setMessages] = useState([]);

	const sendMessage = (msg) => {
		const newMessages = messages.slice();
		const nextId = messages.length > 0 ? messages[messages.length - 1].id + 1 : 0;
		newMessages.push({ id: nextId, msg });
		setMessages(newMessages);
	};

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
