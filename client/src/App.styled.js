import styled from "styled-components";

const AppWrapper = styled.div`
	height: 100%;
	max-height: 100%;

	display: flex;
	flex-direction: column;

	.app-navbar {
		flex-grow: 0;
	}

	.app-content {
		flex-grow: 1;
		overflow: auto;
	}

	.center-screen {
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
		text-align: center;
		height: 100%;
	}

	.stretch-height {
		min-height: 100vh;
	}
`;

export default AppWrapper;
