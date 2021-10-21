import React, { useRef } from "react";
import Panel from "../Panel/Panel";
import { ButtonContainerWrapper, ButtonWrapper, TextFieldWrapper } from "./RegisterPanel.styled";

function RegisterPanel({ cancelCallback }) {
	const nameRef = useRef(null);
	const emailRef = useRef(null);
	const passRef = useRef(null);
	const passAgainRef = useRef(null);

	const register = () => {
		console.log(
			`Register with name: ${nameRef.current.value}, email: ${emailRef.current.value}, password: ${passRef.current.value}, passwordAgain: ${passAgainRef.current.value}`
		);
	};

	return (
		<Panel rowGap="1em">
			<TextFieldWrapper
				required
				inputRef={nameRef}
				variant="filled"
				label="Display name"
				helperText="Enter your name"
			/>
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
			<TextFieldWrapper
				required
				inputRef={passAgainRef}
				variant="filled"
				label="Re-enter password"
				type="password"
				helperText="Enter your password again"
			/>
			<ButtonContainerWrapper>
				<ButtonWrapper onClick={register}>Register</ButtonWrapper>
				<ButtonWrapper onClick={cancelCallback}>Cancel</ButtonWrapper>
			</ButtonContainerWrapper>
		</Panel>
	);
}

export default RegisterPanel;
