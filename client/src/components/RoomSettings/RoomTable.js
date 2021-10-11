import { Checkbox, Table, TableBody, TableCell, TableHead, TableRow } from "@mui/material";
import React from "react";
import { TableContainerWrapper, KickButtonWrapper } from "./RoomTable.styled";

function RoomTable({ users }) {
	return (
		<TableContainerWrapper>
			<Table stickyHeader>
				<TableHead>
					<TableCell>Username</TableCell>
					<TableCell>Chat</TableCell>
					<TableCell>Video</TableCell>
					<TableCell>Actions</TableCell>
				</TableHead>
				<TableBody>
					{users.map((user) => (
						<TableRow key={user.id}>
							<TableCell>{user.name}</TableCell>
							<TableCell>
								<Checkbox
									className="table-checkbox"
									defaultChecked={user.canChat}
								/>
							</TableCell>
							<TableCell>
								<Checkbox
									className="table-checkbox"
									defaultChecked={user.canVideo}
								/>
							</TableCell>
							<TableCell>
								<KickButtonWrapper variant="contained">Kick</KickButtonWrapper>
							</TableCell>
						</TableRow>
					))}
				</TableBody>
			</Table>
		</TableContainerWrapper>
	);
}

export default RoomTable;
