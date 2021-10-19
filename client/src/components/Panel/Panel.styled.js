import styled from "styled-components";

export const PanelWrapper = styled.div`
	background-color: ${(props) => props.theme.darkGray};

	display: grid;
	grid-template-columns: 1fr;
	grid-row-gap: ${(props) => (props.rowGap ? props.rowGap : "0em")};
	align-items: center;
	justify-items: center;

	padding: 25px;

	p {
		color: ${(props) => props.theme.white};
	}
`;
