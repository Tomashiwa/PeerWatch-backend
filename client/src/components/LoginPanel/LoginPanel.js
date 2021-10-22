import { Typography } from "@mui/material";
import React, { useRef, useState } from "react";
import axios from "axios";
import Panel from "../Panel/Panel";
import { ButtonContainerWrapper, ButtonWrapper, TextFieldWrapper } from "./LoginPanel.styled";
import { useUser } from "../Context/UserContext"

const loginAPI = process.env.NODE_ENV && process.env.NODE_ENV === "production"
	? "http://54.179.111.98:5000/api/auth/login"
	: "http://localhost:5000/api/auth/login";

function LoginPanel({ successCallback, toRegisterCallback }) {
	const emailRef = useRef(null);
	const passRef = useRef(null);
	const [generalFlag, setGeneralFlag] = useState(false);
	const [generalMsg, setGeneralMsg] = useState("");
	const { setUserInfo } = useUser();
	
	const login = () => {
		console.log(
			`login with email: ${emailRef.current.value}, password: ${passRef.current.value}`
		);
		
		setGeneralFlag(false);
		
		axios.post(loginAPI, {email: emailRef.current.value, password: passRef.current.value})
			.then((res) => {
				console.log("logged in");
				
				// Add to context
				const newUserInfo = {
					userId: res.data.userId,
					displayName: res.data.displayName,
					email: res.data.email,
					token: res.data.token
				}
				setUserInfo(newUserInfo);
				console.log("added user to context");
				
				// Add token to browser
				localStorage.setItem("token", res.data.token);
				successCallback();
			})
			.catch((err) => {
				if (err.response) {
					setGeneralFlag(true);
					setGeneralMsg(err.response.data.message);
				}
				
			})
	};

	const linkElement = <a href="">Click here</a>;

	return (
		<Panel rowGap="1em">
			{generalFlag && <p style={{ color: 'red' }}> {generalMsg} </p>}
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
