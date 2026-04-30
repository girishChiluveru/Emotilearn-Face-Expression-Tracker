import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useContext } from 'react';
import { UserContext } from '../../context/userContext';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { Home, LogIn, UserPlus, LogOut, Shield, HelpCircle, User } from 'lucide-react';

/**
 * NavLink — animated underline indicator on hover / active state.
 * Game links are intentionally excluded from the navbar;
 * children access games from the GameSelect dashboard.
 */
const NavLink = ({ to, icon: Icon, label, active }) => (
  <Link
    to={to}
    className={`relative flex items-center gap-1.5 text-[12px] font-bold tracking-widest uppercase pb-1 transition-colors duration-200 group ${
      active ? 'text-orange-400' : 'text-slate-400 hover:text-white'
    }`}
  >
    {Icon && <Icon size={13} />}
    {label}
    {/* Animated underline */}
    <span
      className={`absolute bottom-0 left-0 h-[2px] bg-orange-400 rounded-full transition-all duration-300 ${
        active ? 'w-full' : 'w-0 group-hover:w-full'
      }`}
    />
  </Link>
);

const Navbar = () => {
  const { child, setChild } = useContext(UserContext);
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    try {
      localStorage.removeItem('emotilearn_super');
      await axios.post('/logout');
    } catch (_) {
      // Always clear local session even if API call fails
    } finally {
      setChild(null);
      toast.success('See you next time! 👋');
      navigate('/');
    }
  };

  const at = (p) => location.pathname === p;
  const displayName = child?.childname ?? 'User';
  const isAdmin = child?.isSuperAdmin === true;

  return (
    <nav className="w-full sticky top-0 z-50 bg-[#0d1b2a] border-b-2 border-orange-500/30 shadow-lg shadow-black/40">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">

        {/* ── Logo ── */}
        <Link to="/" className="flex items-center gap-2.5 group flex-shrink-0">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600
                          flex items-center justify-center
                          shadow-md shadow-orange-500/30 group-hover:shadow-orange-500/50
                          transition-shadow duration-200">
            <span className="text-lg leading-none select-none">🧠</span>
          </div>
          <span className="text-xl font-bold tracking-wide text-white">
            Emoti<span className="text-orange-400">Learn</span>
          </span>
        </Link>

        {/* ── Navigation Links ── */}
        <div className="flex items-center gap-7">
          <NavLink to="/" icon={Home} label="Home" active={at('/')} />

          {child ? (
            /* ── Authenticated state ── */
            <>
              {isAdmin && (
                <NavLink
                  to="/super-admin"
                  icon={Shield}
                  label="Admin Dashboard"
                  active={at('/super-admin')}
                />
              )}

              {/* Logout button — shows logged-in username */}
              <button
                id="logout-btn"
                onClick={handleLogout}
                className="flex items-center gap-1.5 pl-3 pr-4 py-2 rounded-xl
                           bg-gradient-to-r from-orange-500 to-red-500
                           text-white text-[12px] font-bold tracking-wide
                           shadow-md shadow-orange-500/20
                           hover:from-orange-600 hover:to-red-600 hover:shadow-orange-500/40
                           transition-all duration-200 ml-2"
              >
                <User size={13} />
                <span className="max-w-[120px] truncate">{displayName}</span>
                <span className="text-orange-200 opacity-50 mx-1">|</span>
                <LogOut size={13} />
                <span>Logout</span>
              </button>
            </>
          ) : (
            /* ── Guest state ── */
            <>
              <NavLink to="/login"       icon={LogIn}      label="Login"    active={at('/login')} />
              <NavLink to="/admin-login" icon={Shield}     label="Admin"    active={at('/admin-login')} />
              <NavLink to="/register"    icon={UserPlus}   label="Register" active={at('/register')} />
              <NavLink to="/Faqs"        icon={HelpCircle} label="FAQ"      active={at('/Faqs')} />
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
