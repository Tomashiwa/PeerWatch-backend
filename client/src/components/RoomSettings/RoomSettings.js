import React, { useEffect, useRef, useState } from "react";
import { TextField, Typography } from "@mui/material";
import { ButtonWrapper, ContentWrapper, ModalWrapper } from "./RoomSettings.styled";
import RoomTable from "./RoomTable";
import axios from "axios";

function RoomSettings({ roomId, capacity, settings, kickCallback, saveCallback }) {
	const [open, setOpen] = useState(false);
	const [currSettings, setCurrSettings] = useState({});
	const capacityRef = useRef(null);

	const openModel = () => {
		setOpen(true);
	};

	const closeModal = () => {
		setOpen(false);
	};

	const save = () => {
		const newCapacity = capacityRef.current.value;

		if (newCapacity || newCapacity.length > 0) {
			axios
				.put("/api/rooms/capacity", { roomId, capacity: newCapacity })
				.then((res) => {})
				.catch((err) => {
					console.log(err);
				});
		}

		// To-do: PUT settings to DB

		saveCallback(newCapacity, currSettings);
		closeModal();
	};

	useEffect(() => {
		setCurrSettings(settings);
	}, [settings]);

	return (
		<>
			<ButtonWrapper variant="contained" onClick={openModel}>
				Settings
			</ButtonWrapper>
			<ModalWrapper open={open} onClose={closeModal}>
				<ContentWrapper>
					<Typography className="settings-title" variant="h5">
						Room settings
					</Typography>
					<div className="settings-capacity">
						<Typography className="capacity-text">Max capacity (Up to 15):</Typography>
						<TextField
							className="capacity-input"
							type="number"
							size="small"
							placeholder={`${capacity}`}
							inputRef={capacityRef}
						/>
					</div>
					<div className="settings-table">
						<RoomTable
							settings={currSettings}
							setSettings={setCurrSettings}
							kickCallback={kickCallback}
						/>
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
