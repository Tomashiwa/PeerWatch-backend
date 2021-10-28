import { Typography } from "@mui/material";
import React, { useEffect, useRef } from "react";
import { useParams, useHistory } from "react-router";
import Panel from "../Panel/Panel";
import {
	ButtonWrapper,
	ButtonContainerWrapper,
	TextFieldWrapper,
	FormWrapper,
} from "./AccountResetPanel.styled";

function AccountResetPanel() {
	const { rid, resetToken } = useParams();
	const newPassRef = useRef(null);
	const repeatPassRef = useRef(null);
	const history = useHistory();

	useEffect(() => {
		// To-do. Verify whether the resetToken is valid
		const isValid = true;

		if (!isValid) {
			history.push("/notfound");
		}
	}, [history]);

	const resetPass = (e) => {
		e.preventDefault();
		console.log(
			`random id: ${rid}, reset token: ${resetToken}, password: ${newPassRef.current.value}, repeat password: ${repeatPassRef.current.value}`
		);

		// To-do. Integrate with backend
	};

	const returnHome = () => {
		history.push("/");
	};

	return (
		<Panel rowGap="1em">
			<FormWrapper onSubmit={resetPass}>
				<Typography variant="h5">Looks like you have forgotten your password?</Typography>
				<Typography variant="body1">
					Dont worry, we got you covered! Just enter the new password you want below and
					we are ready to go.
				</Typography>
				<TextFieldWrapper
					required
					inputRef={newPassRef}
					variant="filled"
					label="New password"
					type="password"
				/>
				<TextFieldWrapper
					required
					inputRef={repeatPassRef}
					variant="filled"
					label="Re-enter password"
					type="password"
				/>
				<ButtonContainerWrapper>
					<ButtonWrapper type="submit">Confirm</ButtonWrapper>
					<ButtonWrapper onClick={returnHome}>Cancel</ButtonWrapper>
				</ButtonContainerWrapper>
			</FormWrapper>
		</Panel>
	);
}

export default AccountResetPanel;
