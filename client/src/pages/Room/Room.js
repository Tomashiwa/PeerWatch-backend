import React, { Suspense, useState, useEffect, useCallback, useContext } from "react";
import { useHistory, useParams } from "react-router";
import { io } from "socket.io-client";
import { CircularProgress, Typography } from "@mui/material";
import axios from "axios";

import URL from "../../util/url";

import Chatbox from "../../components/ChatBox/Chatbox";
import VideoLinker from "../../components/VideoLinker/VideoLinker";
import Watchmates from "../../components/Watchmates/Watchmates";
import UserContext from "../../components/Context/UserContext";
import RoomDrawer from "../../components/RoomDrawer/RoomDrawer";
import { RoomPageWrapper, RoomContainerWrapper } from "./Room.styled";
import TimeoutModal from "../../components/TimeoutModal/TimeoutModal";

const VideoPlayer = React.lazy(() => import("../../components/VideoPlayer/VideoPlayer"));

function Room() {
	const { id } = useParams();
	const [user, setUser] = useState({});
	const [users, setUsers] = useState([]);
	const [settings, setSettings] = useState({});
	const [isWaiting, setIsWaiting] = useState(true);
	const [isLinkerDisabled, setIsLinkerDisabled] = useState(false);
	const [isChatDisabled, setIsChatDisabled] = useState(false);
	const [chatSocket, setChatSocket] = useState(null);
	const [videoSocket, setVideoSocket] = useState(null);
	const [roomInfo, setRoomInfo] = useState({});
	const [isTimeoutPromptOpen, setIsTimeoutPromptOpen] = useState(false);

	const history = useHistory();
	const { userInfo } = useContext(UserContext);

	// Handle changing of video URL
	const linkCallback = (url) => {
		setRoomInfo({ ...roomInfo, url });
	};

	// Handle changing of room settings
	const receiveSettings = useCallback(
		(newCapacity, newSettings) => {
			setRoomInfo({ ...roomInfo, newCapacity });
			setSettings(newSettings);
		},
		[roomInfo]
	);
	const saveCallback = (newCapacity, newSettings) => {
		setRoomInfo({ ...roomInfo, capacity: newCapacity });
		setSettings(newSettings);
		chatSocket.emit("SEND_ROOM_SETTINGS", id, newCapacity, newSettings);
	};

	// Handle kicking of users
	const receiveKick = useCallback(
		(userId) => {
			if (userId === user.userId) {
				history.push("/");
				console.log("GOT KICKED");
			}
		},
		[user, history]
	);
	const kickCallback = (userId) => {
		console.log(`Kick user ${userId}`);
		chatSocket.emit("SEND_KICK", id, userId);
	};

	const openTimout = () => {
		setIsTimeoutPromptOpen(true);
	};

	const closeTimeout = () => {
		setIsTimeoutPromptOpen(false);
	};

	// Guide user to join room, retrieve room's info and connect to its sockets
	useEffect(() => {
		let newChatSocket = null;
		let newVideoSocket = null;
		const serverUrl =
			process.env.NODE_ENV && process.env.NODE_ENV === "production"
				? URL.DEPLOYED_SERVER_URL
				: URL.LOCAL_SERVER_URL;

		const getUsers = axios.get(`/api/rooms/${id}/users`);
		const getCapacityCount = axios.get(`/api/rooms/${id}/count`);

		Promise.all([getUsers, getCapacityCount])
			.then((res) => {
				const userIds = res[0].data.map((entry) => entry.userId);
				const { capacity, count } = res[1].data;

				if (userIds.includes(userInfo.userId)) {
					history.push(`/room/${id}/alreadyin`);
				} else if (count && capacity && count >= capacity) {
					history.push(`/room/${id}/full`);
				} else {
					axios
						.post("/api/rooms/join", { userId: userInfo.userId, roomId: id })
						.then((joinRes) => {
							// Retrieve room info
							axios.get(`/api/rooms/${id}`).then((roomRes) => {
								let newRoomInfo = roomRes.data.room;
								if (!newRoomInfo.url || newRoomInfo.url.length === 0) {
									newRoomInfo.url = URL.FALLBACK_VIDEO;
								}
								setRoomInfo(roomRes.data.room);
							});

							// Setup sockets
							newChatSocket = io(serverUrl + "/chat");
							newVideoSocket = io(serverUrl + "/video", {
								query: { userId: userInfo.userId },
							});
							setChatSocket(newChatSocket);
							setVideoSocket(newVideoSocket);

							// TEMPORARY PLACEHOLDER
							// To-do: GET settings from DB
							setSettings({
								users: joinRes.data.map((user) => {
									return {
										...user,
										displayName: user.userId,
										canChat: true,
										canVideo: true,
									};
								}),
							});
						})
						.catch((err) => {
							history.push("/room_notfound");
							console.log(err);
						});
				}
			})
			.catch((err) => {
				history.push("/room_notfound");
				console.log(err);
			});

		return () => {
			if (newChatSocket && newVideoSocket) {
				newChatSocket.disconnect();
				newVideoSocket.disconnect();
			}
		};
	}, [id, userInfo, history]);

	// Tag socket ID with user's ID
	useEffect(() => {
		if (videoSocket && userInfo) {
			videoSocket.emit("SUBSCRIBE_USER_TO_SOCKET", userInfo.userId);
		}
	}, [videoSocket, userInfo]);

	// Refresh the list of users and settings
	const updateUserList = useCallback(
		(userList, hostId) => {
			axios
				.get(`/api/rooms/${id}/users`)
				.then((res) => {
					const newUsers = res.data.filter((user) => userList.includes(user.userId));
					for (let i = 0; i < newUsers.length; i++) {
						newUsers[i] = { ...newUsers[i], isHost: newUsers[i].userId === hostId };
						if (newUsers[i].userId === userInfo.userId) {
							const currUser = newUsers.splice(i, 1)[0];
							newUsers.unshift(currUser);
							setUser(currUser);
						}
					}
					setUsers(newUsers);

					// TEMPORARY PLACEHOLDER
					// To-do: GET settings from DB
					setSettings({
						users: newUsers.map((user) => {
							return {
								...user,
								displayName: user.userId,
								canChat: true,
								canVideo: true,
							};
						}),
					});
				})
				.catch((err) => console.log(err));
		},
		[setUsers, userInfo, id]
	);

	// Attach/Deattach event on/off the chat socket
	useEffect(() => {
		if (chatSocket) {
			chatSocket.on("update-user-list", updateUserList);
			chatSocket.on("RECEIVE_ROOM_SETTINGS", receiveSettings);
			chatSocket.on("RECEIVE_KICK", receiveKick);
			return () => {
				chatSocket.off("update-user-list", updateUserList);
				chatSocket.off("RECEIVE_ROOM_SETTINGS", receiveSettings);
				chatSocket.off("RECEIVE_KICK", receiveKick);
			};
		}
	}, [chatSocket, updateUserList, receiveSettings, receiveKick]);

	// Enable/disable chatbox and linker based on settings
	useEffect(() => {
		if (settings && settings.users) {
			const userSettings = settings.users.filter(
				(user) => user.userId === userInfo.userId
			)[0];
			if (userSettings) {
				setIsChatDisabled(!userSettings.canChat);
				setIsLinkerDisabled(!userSettings.canVideo);
			}
		}
	}, [settings, userInfo]);

	return (
		<RoomPageWrapper>
			<RoomContainerWrapper isWaiting={isWaiting}>
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
						<Suspense fallback={<CircularProgress color="warning" />}>
							<VideoPlayer
								users={users}
								user={user}
								socket={videoSocket}
								roomId={id}
								isWaiting={isWaiting}
								setIsWaiting={setIsWaiting}
								roomInfo={roomInfo}
								setRoomInfo={setRoomInfo}
								finishCallback={openTimout}
							/>
						</Suspense>
					</div>
				</div>
				<div className="room-sidebar">
					<VideoLinker isDisabled={isLinkerDisabled} linkCallback={linkCallback} />
					<Watchmates users={users} />
					<Chatbox socket={chatSocket} roomId={id} isDisabled={isChatDisabled} />
					<RoomDrawer
						roomId={id}
						isHost={user.isHost}
						capacity={roomInfo.capacity}
						settings={settings}
						kickCallback={kickCallback}
						saveCallback={saveCallback}
					/>
				</div>
				<TimeoutModal isOpen={isTimeoutPromptOpen} closeCallback={closeTimeout} />
			</RoomContainerWrapper>
		</RoomPageWrapper>
	);
}

export default Room;
