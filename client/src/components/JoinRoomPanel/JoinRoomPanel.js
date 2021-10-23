import { Typography } from "@mui/material";
import React, { useRef } from "react";
import { useHistory } from "react-router";
import Panel from "../Panel/Panel";
import { ButtonWrapper, TextFieldWrapper } from "./JoinRoomPanel.styled";
import { validate as uuidValidate } from "uuid";
import axios from "axios";

function JoinRoomPanel() {
	const inputRef = useRef(null);
	const history = useHistory();

	const join = async () => {
		const id = inputRef.current.value;
		if (!uuidValidate(id)) {
			console.log(`Invalid room id format... (Given id: ${id})`);
		} else {
			// Reject if the room is not full and the user is not already in
			axios
				.get(`/api/rooms/${id}/count`)
				.then((res) => {
					const { capacity, count } = res.data;
					if (count >= capacity) {
						// To-do: Display an error text under the textfield
						console.log(`Room ${id} is already full (${count} / ${capacity})`);
					} else {
						history.push(`/room/${id}`);
					}
				})
				.catch((err) => {
					console.log(err);
				});
		}
	};

	return (
		<Panel>
			<Typography variant="h5">Jump in with your friends!</Typography>
			<TextFieldWrapper placeholder="Enter room code here..." inputRef={inputRef} />
			<ButtonWrapper variant="contained" onClick={join}>
				Join
			</ButtonWrapper>
		</Panel>
	);
}

export default JoinRoomPanel;
