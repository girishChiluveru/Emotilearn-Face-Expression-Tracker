import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useContext } from 'react';
import { UserContext } from '../../context/userContext';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { Home, LogIn, UserPlus, LogOut, Shield, HelpCircle } from 'lucide-react';

const Navbar = () => {
  const { child, setChild } = useContext(UserContext);
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    try {
      localStorage.removeItem('emotilearn_super');
      await axios.post('/logout');
      setChild(null);
      toast.success('Logged out successfully');
      navigate('/');
    } catch (error) {
      setChild(null);
      navigate('/');
    }
  };

  const isActive = (p) => location.pathname === p;

  const linkClass = (path) =>
    `flex items-center gap-1.5 text-[14px] font-medium transition-colors hover:text-white ${
      isActive(path) ? 'text-white' : 'text-slate-300'
    }`;

  return (
    <nav className="w-full flex items-center justify-between px-8 py-5 bg-[#0F1626]/80 backdrop-blur-md border-b border-white/5 sticky top-0 z-50">
      <Link to="/" className="flex items-center gap-2 group">
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-orange-500/20 text-orange-400 group-hover:bg-orange-500/30 transition-colors">
          <span className="text-xl">🧠</span>
        </div>
        <span className="text-[20px] font-semibold text-orange-400 tracking-wide">EmotiLearn</span>
      </Link>

      <div className="flex items-center gap-7">
        <Link to="/" className={linkClass('/')}>
          <Home size={16} /> Home
        </Link>

        {child ? (
          <>
            <Link to="/memory-game" className={linkClass('/memory-game')}>🧠 Memory Game</Link>
            <Link to="/quiz" className={linkClass('/quiz')}>🧩 Quiz Game</Link>
            <Link to="/animal-game" className={linkClass('/animal-game')}>🦁 Animal Game</Link>
            <Link to="/report" className={linkClass('/report')}>📊 Reports</Link>

            {child.isSuperAdmin && (
              <Link to="/super-admin" className={linkClass('/super-admin')}>
                <Shield size={16} /> Admin
              </Link>
            )}

            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-4 py-2 text-[14px] font-medium text-white bg-white/5 hover:bg-white/10 rounded-lg transition-colors ml-2"
            >
              <LogOut size={16} /> Logout
            </button>
          </>
        ) : (
          <>
            <Link to="/login" className={linkClass('/login')}>
              <LogIn size={16} /> Login
            </Link>
            <Link to="/admin-login" className={linkClass('/admin-login')}>
              <Shield size={16} /> Admin
            </Link>
            <Link to="/register" className={linkClass('/register')}>
              <UserPlus size={16} /> Register
            </Link>
            <Link to="/Faqs" className={linkClass('/Faqs')}>
              <HelpCircle size={16} /> FAQ
            </Link>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
