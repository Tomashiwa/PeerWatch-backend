import React from 'react'
import LandingPageWrapper from './Landing.styled';
import Typography from "@mui/material/Typography";

function Landing() {
    return (
        <LandingPageWrapper elevation={0}>
            <Typography variant="h3">Landing Page</Typography>
        </LandingPageWrapper>
    )
}

export default Landing;