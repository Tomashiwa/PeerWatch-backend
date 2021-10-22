import React from "react";
import { Switch, Route, BrowserRouter as Router } from "react-router-dom";
import { ThemeProvider } from "styled-components";
import { theme } from "./styles/theme";
import { UserProvider } from "./components/Context/UserContext";

import Landing from "./pages/Landing/Landing";
import Room from "./pages/Room/Room";
import NavBar from "./components/NavBar/NavBar";
import AppWrapper from "./App.styled";

function App() {	
	return (
		<Router>
			<ThemeProvider theme={theme}>
				<UserProvider>
					<AppWrapper>
						<div className="app-navbar">
							<NavBar />
						</div>
						<div className="app-content">
							<Switch>
								<Route path="/room/:id">
									<Room />
								</Route>
								<Route path="/">
									<Landing />
								</Route>
							</Switch>
						</div>
					</AppWrapper>
				</UserProvider>
			</ThemeProvider>
		</Router>
	);
}

export default App;
