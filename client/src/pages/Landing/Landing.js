import React, { useState, useEffect } from "react";
import { useUser } from "../../components/Context/UserContext";
import LandingPageWrapper from "./Landing.styled";
import CreateRoomPanel from "../../components/CreateRoomPanel/CreateRoomPanel";
import JoinRoomPanel from "../../components/JoinRoomPanel/JoinRoomPanel";
import LogoutButton from "../../components/LogoutButton/LogoutButton";
import RegisterPanel from "../../components/RegisterPanel/RegisterPanel";
import LoginPanel from "../../components/LoginPanel/LoginPanel";
import RecoveryPanel from "../../components/RecoveryPanel/RecoveryPanel";
import axios from "axios";

const PANEL_TYPE_REGISTER = "register";
const PANEL_TYPE_LOGIN = "login";
const PANEL_TYPE_RECOVERY = "recovery";

function Landing() {
	const [isLoggedIn, setIsLoggedIn] = useState(false);
	const [accPanelType, setAccPanelType] = useState(PANEL_TYPE_LOGIN);
	const { setUserInfo } = useUser();

	const logOut = () => {
		// Show login page.
		setIsLoggedIn(false);

		// Remove token from browser
		localStorage.removeItem("token");

		// Remove user info from context
		setUserInfo(null);
		//console.log("user removed from context");
	};

	const toRegister = () => {
		setAccPanelType(PANEL_TYPE_REGISTER);
	};

	const toLogin = () => {
		setAccPanelType(PANEL_TYPE_LOGIN);
	};

	const toRecovery = () => {
		setAccPanelType(PANEL_TYPE_RECOVERY);
	};
	const authAPI = "http://localhost:5000/api/auth/authtoken";

	useEffect(() => {
		const userToken = localStorage.getItem("token");
		console.log(`[Landing] Retrieved token: ${localStorage.getItem("token")}`);

		if (userToken == null) {
			setIsLoggedIn(false);
		} else {
			const config = { headers: { Authorization: `Bearer ${userToken}` } };
			axios
				.post(authAPI, {}, config)
				.then((res) => {
					// Add to context
					const newUserInfo = {
						userId: res.data.userId,
						displayName: res.data.displayName,
						email: res.data.email,
						token: res.data.token,
					};
					setUserInfo(newUserInfo);
					//console.log("added user to context");

					// Show create/join room.
					setIsLoggedIn(true);
				})
				.catch((err) => {
					// Show login page.
					setIsLoggedIn(false);
					if (err.response) {
						console.log(err.response.data);
					}
				});
		}
	}, [setUserInfo]);

	return (
		<LandingPageWrapper elevation={0}>
			{isLoggedIn && (
				<>
					<div className="landing-room-center">
						{isLoggedIn && (
							<>
								<CreateRoomPanel />
								<JoinRoomPanel />
							</>
						)}
					</div>
					<div className="landing-room-bottom">
						{isLoggedIn && <LogoutButton clickCallback={logOut} />}
					</div>
				</>
			)}
			{!isLoggedIn && (
				<div className="landing-account-center">
					{accPanelType === PANEL_TYPE_REGISTER && (
						<RegisterPanel
							successCallback={() => {
								setIsLoggedIn(true);
								toLogin();
							}}
							cancelCallback={toLogin}
						/>
					)}
					{accPanelType === PANEL_TYPE_LOGIN && (
						<LoginPanel
							successCallback={() => setIsLoggedIn(true)}
							toRegisterCallback={toRegister}
							toRecoveryCallback={toRecovery}
						/>
					)}
					{accPanelType === PANEL_TYPE_RECOVERY && (
						<RecoveryPanel sendCallback={toLogin} />
					)}
				</div>
			)}
		</LandingPageWrapper>
	);
}

export default Landing;
