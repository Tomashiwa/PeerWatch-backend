import React, { useCallback, useEffect, useRef, useState } from "react";
import ReactPlayer from "react-player/youtube";

const initialState = {
	url: "https://www.youtube.com/watch?v=7h2-n-39ofw",
	playing: true,
	syncTime: 0,
	syncType: "seconds",
};

const UNAVALIABLE = -1;

function VideoPlayer({ socket, roomId, url }) {
	const [videoUrl, setVideoUrl] = useState(initialState.url);
	const [isHost, setIsHost] = useState(false);
	const [isDesync, setIsDesync] = useState(false);
	const [syncTime, setSyncTime] = useState(UNAVALIABLE);
	const playerRef = useRef(null);

	// Initialize upon connecting
	const initialize = useCallback(() => {
		socket.emit("join-room", roomId, (isNewHost) => {
			console.log(`${socket.id} has joined the video room ${isNewHost ? "as a host" : ""}`);
			setIsHost(isNewHost);

			// To-do: Fetch room info from DB

			// Host: Load up placeholder video
			if (isNewHost) {
				setVideoUrl(initialState.url);
			}
			// Non-host: Load up URL from the room info and request for a sync
			if (!isNewHost) {
				// To-do: Load up URL from room info into the player
				// setVideoUrl(...);

				setIsDesync(true);
			}
		});
	}, [socket, roomId]);

	// Changing host status
	const toggleHost = useCallback(
		(isNewHost) => {
			setIsHost(isNewHost);
		},
		[setIsHost]
	);

	// Receiving and broadcasting URLs
	const receiveUrl = useCallback(
		(url) => {
			setVideoUrl(url);
		},
		[setVideoUrl]
	);
	useEffect(() => {
		if (socket && url) {
			// Self: Update state
			setVideoUrl(url);
			// Self: Broadcast new URL to all
			if (url !== initialState.url) {
				socket.emit("SEND_URL", roomId, url);
			}
			// Self: Update DB's URL
		}
	}, [socket, roomId, url]);

	// Receiving and broadcasting TIMING
	const receiveTiming = useCallback(
		({ timing }) => {
			if (!isHost) {
				console.log(`Receive timing of ${timing}`);
				setSyncTime(timing);
			}
		},
		[isHost]
	);
	const timingCallback = ({ playedSeconds }) => {
		// Host: Broadcast timing every second
		if (isHost) {
			socket.emit("SEND_TIMING", roomId, { timing: playedSeconds });
		}
		// Host: Update DB's timing every 10 seconds
	};

	// Broadcast PLAY event to all other users
	const playCallback = () => {
		// Host: Broadcast PLAY event to all users
		// Host: Update status in DB (?)
	};

	// Broadcast PAUSE event to all other users
	const pauseCallback = () => {
		// Host: Broadcast PAUSE event to all users
		// Host: Update status in DB(?)
	};

	// Broadcast SEEK event to all other users
	const seekCallback = () => {
		console.log("VIDEO SEEKS");
		// To-do: Broadcast SEEK event to all other users. YouTube API does not provide SEEK directly
		// Save progress when PAUSE happens and compare progresses when PLAY happens
	};

	// Broadcast BUFFERING event to all other users
	const bufferStartCallback = () => {
		console.log("BUFFERING/LOADING STARTS");
	};

	const bufferEndCallback = () => {
		console.log("BUFFERING/LOADING ENDS");
	};

	// Broadcast SPEED_CHANGE event to all other users
	const speedChangeCallback = () => {
		console.log("PLAYBACK SPEED CHANGE");
	};

	// Catch up a new user using latest known state
	const catchUp = () => {
		// Retrieve latest video state from DB
		// Update video player with it
	};

	// Reset socket event handlers when VideoPlayer re-renders
	useEffect(() => {
		if (socket) {
			socket.on("connect", initialize);
			socket.on("HOST_STATUS", toggleHost);
			socket.on("RECEIVE_URL", receiveUrl);
			socket.on("RECEIVE_TIMING", receiveTiming);
			return () => {
				socket.off("connect", initialize);
				socket.off("HOST_STATUS", toggleHost);
				socket.off("RECEIVE_URL", receiveUrl);
				socket.off("RECEIVE_TIMING", receiveTiming);
			};
		}
	}, [socket, initialize, receiveUrl, receiveTiming, toggleHost]);

	// Sync to latest timing if the player ever goes desync
	useEffect(() => {
		if (socket && isDesync && syncTime !== UNAVALIABLE) {
			console.log(`${socket.id} is behind, syncing to ${syncTime}`);
			playerRef.current.seekTo(syncTime, "seconds");
			setIsDesync(false);
		}
	}, [socket, isDesync, syncTime]);

	return (
		<ReactPlayer
			className="react-player"
			ref={playerRef}
			width="100%"
			height="100%"
			url={videoUrl}
			playing={true}
			controls
			loop
			muted
			onPlay={playCallback}
			onPause={pauseCallback}
			onProgress={timingCallback}
			onReady={bufferStartCallback}
			onBuffer={bufferStartCallback}
			onBufferEnd={bufferEndCallback}
		/>
	);
}

export default VideoPlayer;
