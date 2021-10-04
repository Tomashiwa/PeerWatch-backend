import { Typography } from '@mui/material'
import React from 'react'
import { Link } from "react-router-dom"
import NavBarWrapper from "./NavBar.styled"

function NavBar() {
    return (
        <NavBarWrapper>
          <Typography variant="h4">PeerWatch</Typography>
          <Link to="/">Home</Link>
          <Link to="/room">Room</Link>
        </NavBarWrapper>
    )
}

export default NavBar