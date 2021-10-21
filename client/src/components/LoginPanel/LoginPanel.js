import { Typography } from "@mui/material";
import React, { useRef } from "react";
import Panel from "../Panel/Panel";
import { ButtonContainerWrapper, ButtonWrapper, TextFieldWrapper } from "./LoginPanel.styled";

function LoginPanel({ successCallback, toRegisterCallback }) {
	const emailRef = useRef(null);
	const passRef = useRef(null);

	const login = () => {
		console.log(
			`login with email: ${emailRef.current.value}, password: ${passRef.current.value}`
		);
		successCallback();
	};

	const linkElement = <a href="">Click here</a>;

	return (
		<Panel rowGap="1em">
			<TextFieldWrapper
				required
				inputRef={emailRef}
				variant="filled"
				label="Email address"
				helperText="Enter your email address"
			/>
			<TextFieldWrapper
				required
				inputRef={passRef}
				variant="filled"
				label="Password"
				type="password"
				helperText="Enter your password"
			/>
			<ButtonContainerWrapper>
				<ButtonWrapper onClick={login}>Login</ButtonWrapper>
				<ButtonWrapper onClick={toRegisterCallback}>Register</ButtonWrapper>
			</ButtonContainerWrapper>
			<Typography variant="body1">Forget your password? {linkElement}</Typography>
		</Panel>
	);
}

export default LoginPanel;
