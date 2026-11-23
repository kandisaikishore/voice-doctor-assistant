import React from "react";
import Logo from "./Logo";
import Options from "./Options";
import SearchBar from "./SearchBar";
import Profile from "./Profile";

function Navbar() {
  return (
    <nav className="navbar">

      <Logo />

      <Options />

      <SearchBar />

      <Profile />

    </nav>
  );
}

export default Navbar;