import React, { useState } from "react";
import LandingPageWrapper from "./Landing.styled";
import CreateRoomPanel from "../../components/CreateRoomPanel/CreateRoomPanel";
import JoinRoomPanel from "../../components/JoinRoomPanel/JoinRoomPanel";
import LogoutButton from "../../components/LogoutButton/LogoutButton";
import RegisterPanel from "../../components/RegisterPanel/RegisterPanel";
import LoginPanel from "../../components/LoginPanel/LoginPanel";

const PANEL_TYPE_REGISTER = "register";
const PANEL_TYPE_LOGIN = "login";
const PANEL_TYPE_RECOVERY = "recovery";

function Landing() {
	const [isLoggedIn, setIsLoggedIn] = useState(false);
	const [accPanelType, setAccPanelType] = useState(PANEL_TYPE_LOGIN);

	const logOut = () => {
		setIsLoggedIn(false);
	};

	const toRegister = () => {
		setAccPanelType(PANEL_TYPE_REGISTER);
	};

	const toLogin = () => {
		setAccPanelType(PANEL_TYPE_LOGIN);
	};

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
						<RegisterPanel cancelCallback={toLogin} />
					)}
					{accPanelType === PANEL_TYPE_LOGIN && (
						<LoginPanel
							successCallback={() => setIsLoggedIn(true)}
							toRegisterCallback={toRegister}
						/>
					)}
				</div>
			)}
		</LandingPageWrapper>
	);
}

export default Landing;
