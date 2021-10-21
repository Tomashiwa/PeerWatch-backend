import styled from "styled-components";

const LandingPageWrapper = styled.div`
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;

	background: ${(props) => props.theme.lightGray};
	height: 100%;

	h3,
	h5 {
		color: ${(props) => props.theme.white};
	}

	.landing-room-center {
		width: 50%;

		display: grid;
		grid-template-columns: 1fr 1fr;
		grid-column-gap: 1em;
		grid-auto-rows: minmax(300px, auto);
	}

	.landing-room-bottom {
		width: 60%;
		padding-top: 20px;

		display: flex;
		flex-direction: row;
		align-items: center;
		justify-content: center;
	}

	.landing-account-center {
		width: 30%;
	}
`;

export default LandingPageWrapper;
