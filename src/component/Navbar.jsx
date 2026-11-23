import Logo from "./Logo";
import Options from "./Options";
import Searchbar from "./Searchbar";

const Navbar = () => {
    return (
        <nav>
            <Logo />
            <Options />
            <Searchbar />
        </nav>
    );
};

export default Navbar;