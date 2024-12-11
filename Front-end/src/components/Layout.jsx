/* eslint-disable react/prop-types */

import { Link } from 'react-router-dom';
// import '../styles/Layout.css'; // Adjust CSS path as needed

const Layout = ({ children, hideNavbar }) => {
  return (
    <div>
      {/* Conditionally render the navbar */}
      {!hideNavbar && (
        <nav className="navbar">
          <span className="logo">EMOTILEARN</span>
          <div>
            <Link to="/admin-login">Admin Login</Link>
            <Link to="/child-login">Play Game</Link>
          </div>
        </nav>
      )}

      {/* Main content of the page */}
      <div className="content">
        {children}
      </div>
    </div>
  );
};

export default Layout;
