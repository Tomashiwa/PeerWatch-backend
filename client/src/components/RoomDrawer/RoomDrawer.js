import React from "react";
import { ButtonWrapper } from "../ChatBox/ChatInput.styled";
import RoomSettings from "../RoomSettings/RoomSettings";
import { RoomDrawerWrapper } from "./RoomDrawer.styled";

function RoomDrawer({ roomId, settings, saveCallback }) {
	const copy = (content) => {
		const element = document.createElement("textarea");
		element.value = content;
		document.body.appendChild(element);
		element.select();
		document.execCommand("copy");
		document.body.removeChild(element);
	};

	const copyCode = () => {
		copy(roomId);
	};

	const copyLink = () => {
		copy(window.location.href);
	};

	return (
		<RoomDrawerWrapper>
			<ButtonWrapper onClick={copyCode}>Share via code</ButtonWrapper>
			<ButtonWrapper onClick={copyLink}>Share via link</ButtonWrapper>
			<RoomSettings
				capacity={settings.capacity}
				users={settings.users}
				saveCallback={saveCallback}
			/>
		</RoomDrawerWrapper>
	);
}

export default RoomDrawer;
