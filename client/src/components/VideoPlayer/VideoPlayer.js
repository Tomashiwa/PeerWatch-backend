import React from "react";
import ReactPlayer from "react-player/youtube";

function VideoPlayer({ url, playing, syncTime, syncType, playCallback, pauseCallback }) {
	return (
		<ReactPlayer
			className="react-player"
			width="100%"
			height="100%"
			url={url}
			playing={playing}
			controls
			loop
			muted
			onPlay={playCallback}
			onPause={pauseCallback}
		/>
	);
}

export default VideoPlayer;
