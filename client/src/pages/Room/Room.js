import React, { useState, useEffect, useCallback } from "react";
import { useParams } from "react-router";
import Chatbox from "../../components/ChatBox/Chatbox";
import RoomSettings from "../../components/RoomSettings/RoomSettings";
import VideoLinker from "../../components/VideoLinker/VideoLinker";
import VideoPlayer from "../../components/VideoPlayer/VideoPlayer";
import Watchmates from "../../components/Watchmates/Watchmates";
import RoomPageWrapper from "./Room.styled";
import { io } from "socket.io-client";
import URL from "../../util/url";
import { CircularProgress, Typography } from "@mui/material";

const initialPlayerState = {
	url: "",
	playing: true,
	syncTime: 0,
	syncType: "seconds",
};

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

const blankUser = {
	id: "",
	name: "",
	isHost: false,
};

function Room() {
	const { id } = useParams();
	const [playerState, setPlayerState] = useState(initialPlayerState);
	const [user, setUser] = useState(blankUser);
	const [users, setUsers] = useState([]);
	const [settings, setSettings] = useState(initialSettings);
	const [isWaiting, setIsWaiting] = useState(true);

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

	const updateUserList = useCallback(
		(newUserList) => {
			if (chatSocket) {
				for (let i = 0; i < newUserList.length; i++) {
					if (newUserList[i].id === chatSocket.id) {
						setUser(newUserList[i]);
						break;
					}
				}
			}
			setUsers(newUserList);
		},
		[setUsers, chatSocket]
	);

	useEffect(() => {
		if (chatSocket) {
			chatSocket.on("update-user-list", updateUserList);
			return () => {
				chatSocket.off("update-user-list", updateUserList);
			};
		}
	}, [chatSocket, updateUserList]);

	return (
		<RoomPageWrapper>
			<div className="room-player">
				{isWaiting && (
					<div className="room-join-fallback">
						<CircularProgress color="warning" />
						<Typography align="center" variant="h6">
							Joining...
						</Typography>
					</div>
				)}
				<div className="room-res-wrapper">
					<VideoPlayer
						{...playerState}
						users={users}
						user={user}
						socket={videoSocket}
						roomId={id}
						isWaiting={isWaiting}
						setIsWaiting={setIsWaiting}
					/>
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
