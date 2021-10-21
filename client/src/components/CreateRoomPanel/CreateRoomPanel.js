import { Typography } from "@mui/material";
import React from "react";
import { ButtonWrapper } from "./CreateRoomPanel.styled";
import Panel from "../Panel/Panel";

function CreateRoomPanel() {
	return (
		<Panel>
			<Typography variant="h5">Host a room for your friends!</Typography>
			<ButtonWrapper variant="contained">Create room</ButtonWrapper>
		</Panel>
	);
}

export default CreateRoomPanel;
