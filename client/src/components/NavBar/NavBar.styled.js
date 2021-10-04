import styled from "styled-components";

const NavBarWrapper = styled.nav`
	display: flex;
	flex-direction: row;
	align-items: center;
	background: ${(props) => props.theme.darkGray};

	padding: 5px;

	h4 {
		color: ${(props) => props.theme.white};
	}
	a {
		margin-left: 30px;
	}
`;

export default NavBarWrapper;
