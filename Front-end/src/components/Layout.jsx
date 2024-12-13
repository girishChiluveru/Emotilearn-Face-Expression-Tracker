/* eslint-disable react/prop-types */

import { Link } from 'react-router-dom';
import NavbarComponent from './Navbar'; // Import your Navbar component

const Layout = ({ children, hideNavbar }) => {
  return (
    <div>
      {/* Conditionally render the NavbarComponent */}
      {!hideNavbar && <NavbarComponent />}

      {/* Main content of the page */}
      <div className="content">
        {children}
      </div>
    </div>
  );
};

export default Layout;
