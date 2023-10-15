import React from "react";
import { IconButton, Typography, Menu, MenuItem } from "@mui/material";
import AccountCircle from "@mui/icons-material/AccountCircle";
import { Link, NavLink, useNavigate } from "react-router-dom";
import logo from "../logo.svg";
import { useAppContext } from "./AppContext";

const Header = ({
  handleMenuOpen,
  anchorEl,
  handleMenuClose,
  handleLogout,
}) => {
  const navigate = useNavigate();
  const { teamName, isTeamNameLoading, username, setUsername } =
    useAppContext();

  return (
    <div className="minimalist-header">
      <div className="header-left">
        <Link to="/">
          <img
            src={logo}
            alt="Your Logo"
            style={{ height: "50px", float: "left" }}
          />
        </Link>
      </div>
      <Typography fontSize="large">
        <NavLink
          to="/"
          exact
          activeClassName="active-link"
          style={{ color: "white", marginRight: "32px" }}
        >
          Home
        </NavLink>
        <NavLink
          to="/teams"
          exact
          activeClassName="active-link"
          style={{ color: "white", marginRight: "32px" }}
        >
          Teams
        </NavLink>
        {!isTeamNameLoading && teamName && (
          <NavLink
            to={`/${teamName}`}
            exact
            activeClassName="active-link"
            style={{ color: "white", marginRight: "32px" }}
          >
            My Team
          </NavLink>
        )}
      </Typography>
      <div className="header-right">
        <div style={{ float: "right" }}>
          {username ? (
            <>
              <span style={{ color: "white", marginRight: "8px" }}>
                {username}
              </span>
              <IconButton
                aria-label="account of current user"
                aria-controls="menu-appbar"
                aria-haspopup="true"
                onClick={handleMenuOpen}
                style={{ color: "white" }}
              >
                <AccountCircle fontSize="large" />
              </IconButton>
              <Menu
                anchorEl={anchorEl}
                keepMounted
                open={Boolean(anchorEl)}
                onClose={handleMenuClose}
              >
                <MenuItem onClick={handleMenuClose}>
                  <Typography
                    component={Link}
                    to="/settings"
                    sx={{
                      textDecoration: "none",
                      color: "black",
                    }}
                  >
                    Settings
                  </Typography>
                </MenuItem>
                <MenuItem onClick={handleMenuClose}>
                  <Typography
                    component={Link}
                    to="/teams"
                    sx={{ textDecoration: "none", color: "black" }}
                  >
                    Teams
                  </Typography>
                </MenuItem>
                <MenuItem>
                  <Typography onClick={handleLogout}>Logout</Typography>
                </MenuItem>
              </Menu>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="auth-text-link"
                style={{ marginRight: "16px" }}
              >
                Login
              </Link>
              <Link to="/register" className="auth-text-link">
                Register
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Header;
