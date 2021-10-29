import { Typography } from "@mui/material";
import React, { useEffect, useRef, useState } from "react";
import { useParams, useHistory } from "react-router";
import Panel from "../Panel/Panel";
import axios from "axios";
import {
	ButtonWrapper,
	ButtonContainerWrapper,
	TextFieldWrapper,
	FormWrapper,
} from "./AccountResetPanel.styled";

const CREDENTIALS_ERROR_CODE = 422;
const UNAUTH_ERROR_CODE = 401;
const REPEAT_PASSWORD_ERROR_MSG = "Please enter the same password.";

function AccountResetPanel() {
	const { rid, resetToken } = useParams();
	const newPassRef = useRef(null);
	const repeatPassRef = useRef(null);
	const [passwordFlag, setPasswordFlag] = useState(false);
	const [passwordError, setPasswordError] = useState("");
	const [repeatPassFlag, setRepeatPassFlag] = useState(false);
	const [unauthFlag, setUnauthFlag] = useState(false);
	const [unauthError, setUnauthError] = useState("");
	const [generalFlag, setGeneralFlag] = useState(false);
	const history = useHistory();

	const resetErrors = () => {
		setGeneralFlag(false);
		setUnauthFlag(false);
		setPasswordFlag(false);
		setRepeatPassFlag(false);
	};

	useEffect(() => {
		// To-do. Verify whether the resetToken is valid
		resetErrors();
		
		let isValid = false;
		const config = { headers: { Authorization: `Bearer ${resetToken}` } };
		axios.post("/api/auth/verifyresettoken", {rid: rid}, config)
			.then((res) => {
				console.log(res.data.message);
				isValid = true;
			})
			.catch((err) => {
				if (err.response) {
					console.log(err.response.data.message);
				}
			});

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
		if (newPassRef.current.value === repeatPassRef.current.value) {
			axios
				.post("/api/auth/reset", {
					rid: rid,
					password: newPassRef.current.value,
				})
				.then((res) => {
					console.log(res.data.message);
					console.log(res.data.accpassword);
					console.log(res.data.hashnewpassword);
					
					//returnHome();
				})
				.catch((err) => {
					if (err.response) {
						if (err.response.status === CREDENTIALS_ERROR_CODE) {
							const errData = err.response.data.errors;
							let passErrMsgSet = false;
							for (let i = 0; i < errData.length; i++) {
								if (!passErrMsgSet) {
									// take only first password error message
									passErrMsgSet = true;
									setPasswordFlag(true);
									setPasswordError(errData[i].msg);
								}
							}
						} else if (err.response.status === UNAUTH_ERROR_CODE) {
							setUnauthFlag(true);
							setUnauthError(err.response.data.message);
						} else {
							setGeneralFlag(true);
						}
					}
				});
		} else {
			setRepeatPassFlag(true);
		}
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
				{generalFlag && (
					<p style={{ color: "red" }}>
						Error when resetting password for your account. Please ask the PeerWatch team for
						assistance.
					</p>
				)}
				{unauthFlag && (
					<p style={{ color: "red" }}>
						{unauthError}
					</p>
				)}
				<TextFieldWrapper
					required
					error={passwordFlag}
					inputRef={newPassRef}
					variant="filled"
					label="New password"
					type="password"
					helperText={passwordFlag ? passwordError : ""}
				/>
				<TextFieldWrapper
					required
					error={repeatPassFlag}
					inputRef={repeatPassRef}
					variant="filled"
					label="Re-enter password"
					type="password"
					helperText={repeatPassFlag ? REPEAT_PASSWORD_ERROR_MSG : ""}
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
