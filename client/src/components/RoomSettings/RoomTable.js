import { Checkbox, Table, TableBody, TableCell, TableHead, TableRow } from "@mui/material";
import React, { useContext, useEffect } from "react";
import { TableContainerWrapper, KickButtonWrapper } from "./RoomTable.styled";
import UserContext from "../../components/Context/UserContext";

function RoomTable({ settings, setSettings, kickCallback }) {
	const { userInfo } = useContext(UserContext);

	const toggleChat = (userId) => {
		let userSettings = settings.users.slice().map((user) => {
			return { ...user, canChat: user.userId === userId ? !user.canChat : user.canChat };
		});
		setSettings({ ...settings, users: userSettings });
	};

	const toggleVideo = (userId) => {
		let userSettings = settings.users.slice().map((user) => {
			return { ...user, canVideo: user.userId === userId ? !user.canVideo : user.canVideo };
		});
		setSettings({ ...settings, users: userSettings });
	};

	useEffect(() => {}, [settings]);

	return (
		<TableContainerWrapper>
			<Table stickyHeader>
				<TableHead>
					<TableRow>
						<TableCell>Username</TableCell>
						<TableCell>Chat</TableCell>
						<TableCell>Video</TableCell>
						<TableCell>Actions</TableCell>
					</TableRow>
				</TableHead>
				<TableBody>
					{settings.users
						.filter((user) => user.userId !== userInfo.userId)
						.map((user, index) => (
							<TableRow key={user.userId}>
								<TableCell>{user.displayName}</TableCell>
								<TableCell>
									<Checkbox
										className="table-checkbox"
										disabled={user.userId === userInfo.userId}
										checked={user.canChat}
										onChange={() => toggleChat(user.userId)}
									/>
								</TableCell>
								<TableCell>
									<Checkbox
										className="table-checkbox"
										disabled={user.userId === userInfo.userId}
										checked={user.canVideo}
										onChange={() => toggleVideo(user.userId)}
									/>
								</TableCell>
								<TableCell>
									<KickButtonWrapper
										variant="contained"
										disabled={user.userId === userInfo.userId}
										onClick={() => kickCallback(user.userId)}
									>
										Kick
									</KickButtonWrapper>
								</TableCell>
							</TableRow>
						))}
				</TableBody>
			</Table>
		</TableContainerWrapper>
	);
}

export default RoomTable;
