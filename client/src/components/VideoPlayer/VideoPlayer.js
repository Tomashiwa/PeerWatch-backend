import axios from "axios";
import React, { useCallback, useEffect, useRef, useState } from "react";
import ReactPlayer from "react-player/youtube";

const UNAVALIABLE = -1;
const THRESHOLD_SYNC = 1;
const DELAY_DEBOUNCED_PLAYING = 250;

const debounce = (func, duration) => {
	let timeout;
	return (...args) => {
		const later = () => {
			clearTimeout(timeout);
			func(...args);
		};
		clearTimeout(timeout);
		timeout = setTimeout(later, duration);
	};
};

function VideoPlayer({
	socket,
	roomId,
	users,
	user,
	isWaiting,
	setIsWaiting,
	roomInfo,
	setRoomInfo,
	finishCallback,
}) {
	const [isPlaying, setIsPlaying] = useState(false);
	const [buffererId, setBuffererId] = useState(UNAVALIABLE);
	const [isInitialSync, setIsInitialSync] = useState(true);
	const [playbackRate, setPlaybackRate] = useState(1);

	const [debouncedSetPlaying] = useState(() => debounce(setIsPlaying, DELAY_DEBOUNCED_PLAYING));

	const playerRef = useRef(null);

	// Synchronize to the given timing
	const syncTo = useCallback(
		(timing) => {
			if (
				socket &&
				!isWaiting &&
				isPlaying &&
				playerRef.current &&
				buffererId === UNAVALIABLE &&
				timing !== UNAVALIABLE &&
				Math.abs(playerRef.current.getCurrentTime() - timing) > THRESHOLD_SYNC
			) {
				playerRef.current.seekTo(timing, "seconds");
				console.log(`Sync-ing to ${timing}`);
			}
		},
		[isPlaying, buffererId, socket, isWaiting]
	);

	// Initialize player with an URL
	const initialize = useCallback(() => {
		socket.emit("join-room", roomId, () => {});
	}, [socket, roomId]);

	// Ping server to ask if room is avaliable
	const attemptsJoin = useCallback(() => {
		socket.emit("REQUEST_ROOM_STATUS", roomId);
	}, [socket, roomId]);
	// Handler for a room status, if room is avaliable (ie. not buffering), set isBusy to false
	const receiveRoomStatus = useCallback(
		(isBusy) => {
			if (isBusy) {
				setTimeout(attemptsJoin, 1000);
			} else {
				setIsWaiting(false);
				initialize();
			}
		},
		[attemptsJoin, initialize, setIsWaiting]
	);

	// Synchronize URL when a new URL is entered
	const receiveUrl = useCallback(
		(url) => {
			setIsInitialSync(true);
			setRoomInfo((prevInfo) => {
				return { ...prevInfo, url };
			});
		},
		[setRoomInfo]
	);
	useEffect(() => {
		if (socket && roomInfo.url) {
			axios
				.put("/api/rooms/url", { roomId, url: roomInfo.url })
				.then((res) => {
					setIsInitialSync(true);
					socket.emit("SEND_URL", roomId, roomInfo.url);
				})
				.catch((err) => {
					console.log(err);
				});
		}
	}, [socket, roomId, roomInfo.url, setRoomInfo]);

	// Synchronize user's timing
	const receiveTiming = useCallback(
		({ timing }) => {
			if (!user.isHost) {
				syncTo(timing);
			}
		},
		[user.isHost, syncTo]
	);
	const timingCallback = ({ playedSeconds }) => {
		// Host: Broadcast timing every second
		if (user.isHost && isPlaying && buffererId === UNAVALIABLE) {
			socket.emit("SEND_TIMING", roomId, { timing: playedSeconds });
			syncTo(playedSeconds);
		}
	};

	// Synchronise PLAY status between players
	const play = useCallback(() => {
		setIsPlaying(true);
	}, []);
	const playCallback = () => {
		console.log("PLAYS");
		if (!isPlaying) {
			socket.emit("PLAY_ALL", roomId);
			setIsPlaying(true);
		}
	};

	// Synchronise PAUSE status between players
	const pause = useCallback(() => {
		setIsPlaying(false);
	}, []);
	const pauseCallback = () => {
		console.log("PAUSE");
		if (isPlaying && buffererId === UNAVALIABLE) {
			socket.emit("PAUSE_ALL", roomId);
			setIsPlaying(false);
		}
	};

	// Synchronize playback rate between users
	const playbackRateChange = useCallback((newRate) => {
		setPlaybackRate(newRate);
	}, []);
	const rateChangeCallback = (rateObj) => {
		setPlaybackRate(rateObj.data);
		socket.emit("PLAYBACK_RATE_CHANGE_ALL", roomId, rateObj.data);
	};

	// Initialize a HOLD when a user buffers
	const hold = useCallback(
		(sourceId) => {
			debouncedSetPlaying(false);
			setBuffererId(sourceId);
			console.log(`${sourceId} HOLDs`);
		},
		[debouncedSetPlaying]
	);
	const bufferStartCallback = useCallback(() => {
		if (buffererId === UNAVALIABLE) {
			setBuffererId(socket.id);
			socket.emit("REQUEST_HOLD", roomId, socket.id);
			setIsPlaying(true);
			console.log(`Starts buffering`);
		}
	}, [socket, buffererId, roomId]);

	// When buffering completes, sync-up the timing with other users via handshaking
	const prepareRelease = useCallback(
		(newTiming) => {
			playerRef.current.seekTo(newTiming);
			debouncedSetPlaying(true);
			console.log(`Requested to release at ${newTiming}`);
		},
		[debouncedSetPlaying]
	);
	const release = useCallback(() => {
		debouncedSetPlaying(true);
		setBuffererId(UNAVALIABLE);
		console.log("Release");
	}, [debouncedSetPlaying]);
	const bufferEndCallback = () => {
		console.log("BUFFER END");
		if (buffererId === socket.id) {
			if (isInitialSync) {
				socket.emit("REQUEST_RELEASE_ALL", roomId);
				setIsInitialSync(false);
				setBuffererId(UNAVALIABLE);
				console.log("Initial sync, request all to release");
			} else {
				if (users.length === 1) {
					socket.emit("REQUEST_RELEASE_ALL", roomId);
					setIsInitialSync(false);
					setBuffererId(UNAVALIABLE);
					console.log("Only 1 user sync-ing, request all to release");
				} else {
					debouncedSetPlaying(false);
					socket.emit("REQUEST_RELEASE", roomId, playerRef.current.getCurrentTime());
					console.log("> 1 user sync-ing, request all to start release");
				}
			}
		} else if (buffererId !== UNAVALIABLE && buffererId !== socket.id) {
			debouncedSetPlaying(false);
			socket.emit("REQUEST_RELEASE_READY", roomId, buffererId, release);
			setBuffererId(UNAVALIABLE);
			console.log("Now ready, telling bufferer");
		}
	};

	// Assign new bufferer when current bufferer disconnects
	const setBufferer = useCallback(
		(newBuffererId, newHostId) => {
			setBuffererId(newBuffererId);
			if (user.isHost || socket.id === newHostId) {
				setIsPlaying(true);
			}
		},
		[user, socket]
	);

	// Reset when bufferer disconnects and left this user stranding
	const clearBuffer = useCallback(() => {
		if (socket) {
			setBuffererId(UNAVALIABLE);
			if (user.isHost) {
				setIsPlaying(true);
				playerRef.current.seekTo(0, "seconds");
			}
			console.log(`Reset as bufferer disconnects and left`);
		}
	}, [socket, user]);

	// Synchronize playback settings between users
	const querySettings = useCallback(
		(recipientId) => {
			if (user.isHost) {
				const settings = {
					isPlaying,
					playbackRate,
				};
				socket.emit("REPLY_SETTINGS", roomId, recipientId, settings);
			}
		},
		[isPlaying, playbackRate, roomId, socket, user.isHost]
	);
	const receiveSettings = useCallback(
		(recipientId, settings) => {
			if (socket.id === recipientId) {
				setPlaybackRate(settings.playbackRate);

				if (settings.isPlaying) {
					bufferStartCallback();
				} else {
					setIsPlaying(false);
				}
			}
		},
		[socket, bufferStartCallback]
	);
	const synchroniseSettings = () => {
		if (!user.isHost) {
			socket.emit("REQUEST_SETTINGS", roomId);
		} else {
			setIsPlaying(true);
		}
	};

	// Callback when the player completed initial loading and ready to go
	const readyCallback = (player) => {
		console.log("Ready to play");

		// Attach callback for change in playback rate
		player.getInternalPlayer().addEventListener("onPlaybackRateChange", rateChangeCallback);

		synchroniseSettings();
	};

	// Apply event handlers when the player re-renders
	useEffect(() => {
		if (socket) {
			socket.on("connect", attemptsJoin);
			socket.on("RECEIVE_ROOM_STATUS", receiveRoomStatus);
			socket.on("RECEIVE_URL", receiveUrl);
			socket.on("RECEIVE_TIMING", receiveTiming);
			socket.on("HOLD", hold);
			socket.on("PREPARE_RELEASE", prepareRelease);
			socket.on("RELEASE", release);
			socket.on("PLAY", play);
			socket.on("PAUSE", pause);
			socket.on("PLAYBACK_RATE_CHANGE", playbackRateChange);
			socket.on("QUERY_SETTINGS", querySettings);
			socket.on("RECEIVE_SETTINGS", receiveSettings);
			socket.on("CLEAR_BUFFER", clearBuffer);
			socket.on("SET_BUFFERER", setBufferer);
			return () => {
				socket.off("connect", attemptsJoin);
				socket.off("RECEIVE_ROOM_STATUS", receiveRoomStatus);
				socket.off("RECEIVE_URL", receiveUrl);
				socket.off("RECEIVE_TIMING", receiveTiming);
				socket.off("HOLD", hold);
				socket.off("PREPARE_RELEASE", prepareRelease);
				socket.off("RELEASE", release);
				socket.off("PLAY", play);
				socket.off("PAUSE", pause);
				socket.off("PLAYBACK_RATE_CHANGE", playbackRateChange);
				socket.off("QUERY_SETTINGS", querySettings);
				socket.off("RECEIVE_SETTINGS", receiveSettings);
				socket.off("CLEAR_BUFFER", clearBuffer);
				socket.off("SET_BUFFERER", setBufferer);
			};
		}
	}, [
		socket,
		initialize,
		receiveUrl,
		receiveTiming,
		hold,
		release,
		prepareRelease,
		playbackRateChange,
		play,
		pause,
		receiveSettings,
		querySettings,
		attemptsJoin,
		receiveRoomStatus,
		clearBuffer,
		setBufferer,
	]);

	return (
		<ReactPlayer
			className="react-player"
			ref={playerRef}
			width="100%"
			height="100%"
			url={roomInfo.url}
			playing={isPlaying}
			playbackRate={playbackRate}
			controls
			muted
			config={{
				youtube: {
					playerVars: {
						disablekb: buffererId === UNAVALIABLE ? 0 : 1,
						modestbranding: 1,
						rel: 0,
						start: 1,
					},
				},
			}}
			onPlay={playCallback}
			onPause={pauseCallback}
			onProgress={timingCallback}
			onReady={readyCallback}
			onBuffer={bufferStartCallback}
			onBufferEnd={bufferEndCallback}
			onEnded={finishCallback}
			style={{
				pointerEvents: buffererId === UNAVALIABLE ? "auto" : "none",
				filter: buffererId === UNAVALIABLE ? "" : "blur(5px)",
			}}
		/>
	);
}

export default VideoPlayer;
