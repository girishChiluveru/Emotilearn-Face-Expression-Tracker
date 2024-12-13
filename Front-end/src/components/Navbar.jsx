import { Link } from 'react-router-dom';
import '../styles/Navbar.css';
import { UserContext } from '../../context/userContext';
import { useContext } from 'react';
import { toast } from "react-hot-toast";

const Navbar = () => {

  const { child, setChild } = useContext(UserContext);

  const handleLogout = async () => {
    try {
      const response = await fetch('/logout', {
        method: 'POST',
        credentials: 'include', // Ensures cookies are sent with the request
      });

      if (response.ok) {
        toast.success('Logged out successfully!');
        navigate('/'); // Redirect to the home or login page
      } else {
        const errorData = await response.json();
        toast.error(`Logout failed: ${errorData.error}`);
      }
    } catch (error) {
      toast.error("Logout failed");
    }
  };

  return (
    <nav className="navbar navbar-expand-lg navbar-light">
      <div className="container-fluid">
        <Link className="navbar-brand" to="/">Emoti-Learn</Link>
        <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav" aria-controls="navbarNav" aria-expanded="false" aria-label="Toggle navigation">
          <span className="navbar-toggler-icon"></span>
        </button>
        <div className="collapse navbar-collapse" id="navbarNav">
          <ul className="navbar-nav">
            <li className="nav-item">
              <Link className="nav-link" to="/child-login">Login</Link>
            </li>
            <li className="nav-item">
              <Link className="nav-link" to="/admin-login">Admin Login</Link>
            </li>
            <li className="nav-item">
              <Link className="nav-link" to="/child-register">Child Register</Link>
            </li>
            <li className="nav-item">
              <Link className="nav-link" to="/Faqs">FAQ</Link> {/* Add this link */}
            </li>
            <li className="nav-item">
              <button className="nav-btn" onClick={handleLogout}>Logout</button>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
