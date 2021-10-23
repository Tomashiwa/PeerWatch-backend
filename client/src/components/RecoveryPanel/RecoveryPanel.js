import { Typography } from "@mui/material";
import React, { useRef } from "react";
import Panel from "../Panel/Panel";
import { ButtonWrapper, FormWrapper, TextFieldWrapper } from "./RecoveryPanel.styled";

function RecoveryPanel({ sendCallback }) {
	const emailRef = useRef(null);

	const send = (e) => {
		e.preventDefault();

		console.log(`Send recovery email to ${emailRef.current.value}`);

		sendCallback();
	};

	return (
		<Panel rowGap="1em">
			<Typography variant="h5">Password Recovery</Typography>
			<Typography variant="body1">
				Please provide the email address you registered with down below. We will be sending
				you a link to reset your password!
			</Typography>
			<FormWrapper onSubmit={send}>
				<TextFieldWrapper
					required
					inputRef={emailRef}
					variant="filled"
					label="Email address"
				/>
				<ButtonWrapper type="submit">Send</ButtonWrapper>
			</FormWrapper>
		</Panel>
	);
}

export default RecoveryPanel;
