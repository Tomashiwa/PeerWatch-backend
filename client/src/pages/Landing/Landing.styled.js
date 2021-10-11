import styled from "styled-components";

const LandingPageWrapper = styled.div`
    height: 100%;
    background: ${(props) => props.theme.lightGray};

    h3 {
        color: ${(props) => props.theme.white};
    }
`;

export default LandingPageWrapper;