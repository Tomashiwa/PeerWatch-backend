import React, { useState, useEffect } from "react";
import { useParams } from "react-router";
import Chatbox from "../../components/ChatBox/Chatbox";
import RoomSettings from "../../components/RoomSettings/RoomSettings";
import VideoLinker from "../../components/VideoLinker/VideoLinker";
import VideoPlayer from "../../components/VideoPlayer/VideoPlayer";
import Watchmates from "../../components/Watchmates/Watchmates";
import RoomPageWrapper from "./Room.styled";
import { io } from "socket.io-client";
import URL from "../../util/url";

const initialPlayerState = {
	url: "https://www.youtube.com/watch?v=q5WbrPwidrY",
	playing: true,
	syncTime: 0,
	syncType: "seconds",
};

const initialUsers = [
	{ id: 1, name: "User1", isHost: true },
	{ id: 2, name: "User2", isHost: false },
	{ id: 3, name: "User3", isHost: false },
	{ id: 4, name: "User4", isHost: false },
	{ id: 5, name: "User5", isHost: false },
	{ id: 6, name: "User6", isHost: false },
	{ id: 7, name: "User7", isHost: false },
	{ id: 8, name: "User8", isHost: false },
];

const initialSettings = {
	capacity: 15,
	users: [
		{ id: 1, name: "User1", canChat: true, canVideo: true },
		{ id: 2, name: "User2", canChat: false, canVideo: true },
		{ id: 3, name: "User3", canChat: false, canVideo: true },
		{ id: 4, name: "User4", canChat: false, canVideo: true },
		{ id: 5, name: "User5", canChat: false, canVideo: true },
		{ id: 6, name: "User6", canChat: false, canVideo: true },
		{ id: 7, name: "User7", canChat: false, canVideo: true },
		{ id: 8, name: "User8", canChat: false, canVideo: true },
	],
};

function Room() {
	const { id } = useParams();
	const [playerState, setPlayerState] = useState(initialPlayerState);
	const [users, setUsers] = useState(initialUsers);
	const [settings, setSettings] = useState(initialSettings);

	const [chatSocket, setChatSocket] = useState(null);
	const [videoSocket, setVideoSocket] = useState(null);

	// Handles the interaction between different components here

	const linkCallback = (url) => {
		setPlayerState({ ...playerState, url });
	};

	const saveCallback = () => {
		console.log("SETTINGS SAVED");
		// Broadcast settings to all other users;
	};

	// Initialize sockets
	useEffect(() => {
		const newChatSocket = io(URL.LOCAL_SERVER_URL + "/chat");
		const newVideoSocket = io(URL.LOCAL_SERVER_URL + "/video");
		setChatSocket(newChatSocket);
		setVideoSocket(newVideoSocket);

		return () => {
			newChatSocket.disconnect();
			newVideoSocket.disconnect();
		};
	}, []);

	return (
		<RoomPageWrapper>
			<div className="room-player">
				<div className="room-res-wrapper">
					<VideoPlayer {...playerState} socket={videoSocket} roomId={id} />
				</div>
			</div>
			<div className="room-sidebar">
				<VideoLinker linkCallback={linkCallback} />
				<Watchmates users={users} />
				<Chatbox socket={chatSocket} roomId={id} />
				<RoomSettings
					capacity={settings.capacity}
					users={settings.users}
					saveCallback={saveCallback}
				/>
			</div>
		</RoomPageWrapper>
	);
}

export default Room;
