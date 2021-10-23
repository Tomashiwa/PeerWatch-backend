import React, { useContext, useRef, useState } from "react";
import axios from "axios";
import Panel from "../Panel/Panel";
import {
	ButtonContainerWrapper,
	ButtonWrapper,
	FormWrapper,
	TextFieldWrapper,
} from "./RegisterPanel.styled";
import UserContext from "../Context/UserContext";

const CREDENTIALS_ERROR_CODE = 422;
const EMAIL_EXISTS_ERROR_CODE = 409;
const PASSWORD_AGAIN_ERROR_MSG = "Please enter the same password.";

function RegisterPanel({ successCallback, cancelCallback }) {
	const nameRef = useRef(null);
	const emailRef = useRef(null);
	const passRef = useRef(null);
	const passAgainRef = useRef(null);
	const [generalFlag, setGeneralFlag] = useState(false);
	const [displayNameFlag, setDisplayNameFlag] = useState(false);
	const [displayNameError, setDisplayNameError] = useState("");
	const [emailFlag, setEmailFlag] = useState(false);
	const [emailError, setEmailError] = useState("");
	const [passwordFlag, setPasswordFlag] = useState(false);
	const [passwordError, setPasswordError] = useState("");
	const [passwordAgainFlag, setPasswordAgainFlag] = useState(false);
	const { setUserInfo } = useContext(UserContext);

	const resetErrors = () => {
		setGeneralFlag(false);
		setDisplayNameFlag(false);
		setEmailFlag(false);
		setPasswordFlag(false);
		setPasswordAgainFlag(false);
	};

	const register = (e) => {
		e.preventDefault();

		resetErrors();

		if (passRef.current.value === passAgainRef.current.value) {
			axios
				.post("/api/auth/register", {
					displayName: nameRef.current.value,
					email: emailRef.current.value,
					password: passRef.current.value,
				})
				.then((res) => {
					//console.log("registered");

					// Add to context
					const newUserInfo = {
						userId: res.data.userId,
						displayName: res.data.displayName,
						email: res.data.email,
						token: res.data.token,
						isLoaded: true,
					};
					setUserInfo(newUserInfo);
					//console.log("added user to context");

					// Add token to browser
					console.log(`[Register] Set token: ${res.data.token}`);

					localStorage.setItem("token", res.data.token);
					successCallback();
				})
				.catch((err) => {
					if (err.response) {
						if (err.response.status === CREDENTIALS_ERROR_CODE) {
							const errData = err.response.data.errors;
							//console.log(errData);
							let passErrMsgSet = false;
							for (let i = 0; i < errData.length; i++) {
								if (errData[i].param === "displayName") {
									setDisplayNameFlag(true);
									setDisplayNameError(errData[i].msg);
								} else if (errData[i].param === "email") {
									setEmailFlag(true);
									setEmailError(errData[i].msg);
								} else if (!passErrMsgSet) {
									// take only first password error message
									passErrMsgSet = true;
									setPasswordFlag(true);
									setPasswordError(errData[i].msg);
								}
							}
						} else if (err.response.status === EMAIL_EXISTS_ERROR_CODE) {
							setEmailFlag(true);
							setEmailError(err.response.data.message);
						} else {
							setGeneralFlag(true);
						}
					}
				});
		} else {
			//console.log("password not the same");
			setPasswordAgainFlag(true);
		}
	};

	return (
		<Panel rowGap="1em">
			<FormWrapper onSubmit={register}>
				{generalFlag && (
					<p style={{ color: "red" }}>
						Error when registering for account. Please ask the PeerWatch team for
						assistance.
					</p>
				)}
				<TextFieldWrapper
					required
					error={displayNameFlag}
					inputRef={nameRef}
					variant="filled"
					label="Display name"
					helperText={displayNameFlag ? displayNameError : ""}
				/>
				<TextFieldWrapper
					required
					error={emailFlag}
					inputRef={emailRef}
					variant="filled"
					label="Email address"
					helperText={emailFlag ? emailError : ""}
				/>
				<TextFieldWrapper
					required
					error={passwordFlag}
					inputRef={passRef}
					variant="filled"
					label="Password"
					type="password"
					helperText={passwordFlag ? passwordError : ""}
				/>
				<TextFieldWrapper
					required
					error={passwordAgainFlag}
					inputRef={passAgainRef}
					variant="filled"
					label="Re-enter password"
					type="password"
					helperText={passwordAgainFlag ? PASSWORD_AGAIN_ERROR_MSG : ""}
				/>
				<ButtonContainerWrapper>
					<ButtonWrapper type="submit">Register</ButtonWrapper>
					<ButtonWrapper onClick={cancelCallback}>Cancel</ButtonWrapper>
				</ButtonContainerWrapper>
			</FormWrapper>
		</Panel>
	);
}

export default RegisterPanel;
