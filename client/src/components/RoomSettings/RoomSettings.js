import React, { useState } from "react";
import { TextField, Typography } from "@mui/material";
import { ButtonWrapper, ContentWrapper, ModalWrapper } from "./RoomSettings.styled";
import RoomTable from "./RoomTable";

function RoomSettings({ capacity, users, saveCallback }) {
	const [open, setOpen] = useState(false);

	const openModel = () => {
		setOpen(true);
	};

	const closeModal = () => {
		setOpen(false);
	};

	const save = () => {
		saveCallback();
	};

	return (
		<>
			<ButtonWrapper variant="contained" onClick={openModel}>
				Settings
			</ButtonWrapper>
			<ModalWrapper open={open} onClose={closeModal}>
				<ContentWrapper>
					<Typography className="settings-title">Room settings</Typography>
					<div className="settings-capacity">
						<Typography className="capacity-text">Max capacity (Up to 15):</Typography>
						<TextField
							className="capacity-input"
							type="number"
							placeholder={capacity}
						/>
					</div>
					<div className="settings-table">
						<RoomTable users={users} />
					</div>
					<div className="settings-btns">
						<ButtonWrapper variant="contained" onClick={save}>
							Save
						</ButtonWrapper>
						<ButtonWrapper variant="contained" onClick={closeModal}>
							Cancel
						</ButtonWrapper>
					</div>
				</ContentWrapper>
			</ModalWrapper>
		</>
	);
}

export default RoomSettings;
