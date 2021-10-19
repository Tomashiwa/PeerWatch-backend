import { Typography } from "@mui/material";
import React from "react";
import Panel from "../Panel/Panel";
import { ButtonWrapper, TextFieldWrapper } from "./JoinRoomPanel.styled";

function JoinRoomPanel() {
	return (
		<Panel>
			<Typography variant="h5">Jump in with your friends!</Typography>
			<TextFieldWrapper placeholder="Enter room code here..." />
			<ButtonWrapper variant="contained">Join</ButtonWrapper>
		</Panel>
	);
}

export default JoinRoomPanel;
