import React, { useEffect, useState } from "react";
import { Switch, Route, BrowserRouter as Router } from "react-router-dom";
import { ThemeProvider } from "styled-components";
import { theme } from "./styles/theme";
import UserContext from "./components/Context/UserContext";
import axios from "axios";

import Landing from "./pages/Landing/Landing";
import Room from "./pages/Room/Room";
import NavBar from "./components/NavBar/NavBar";
import AppWrapper from "./App.styled";

function App() {
	const [userInfo, setUserInfo] = useState({
		userId: undefined,
		displayName: undefined,
		email: undefined,
		token: undefined,
		isLoaded: false,
	});

	useEffect(() => {
		let userToken = localStorage.getItem("token");

		if (!userToken) {
			localStorage.setItem("token", "");
			userToken = "";
		}

		const config = { headers: { Authorization: `Bearer ${userToken}` } };
		axios
			.post("/api/auth/authtoken", {}, config)
			.then((res) => {
				setUserInfo({
					userId: res.data.userId,
					displayName: res.data.displayName,
					email: res.data.email,
					token: res.data.token,
					isLoaded: true,
				});
			})
			.catch((err) => {
				setUserInfo({
					userId: undefined,
					displayName: undefined,
					email: undefined,
					token: userToken,
					isLoaded: false,
				});
				console.log(err);
			});
	}, []);

	return (
		<Router>
			<ThemeProvider theme={theme}>
				<UserContext.Provider value={{ userInfo, setUserInfo }}>
					<AppWrapper>
						<div className="app-navbar">
							<NavBar />
						</div>
						<div className="app-content">
							<Switch>
								<Route path="/room/:id">
									{userInfo &&
									userInfo.isLoaded &&
									userInfo.token !== undefined ? (
										<Room />
									) : (
										<div>Not authenticated</div>
									)}
								</Route>
								<Route path="/">
									<Landing />
								</Route>
							</Switch>
						</div>
					</AppWrapper>
				</UserContext.Provider>
			</ThemeProvider>
		</Router>
	);
}

export default App;
