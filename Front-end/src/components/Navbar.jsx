import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useContext, useState, useEffect } from 'react';
import { UserContext } from '../../context/userContext';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { Home, LogIn, UserPlus, LogOut, Shield, HelpCircle, Menu, X } from 'lucide-react';

const Navbar = () => {
  const { child, setChild } = useContext(UserContext);
  const navigate = useNavigate();
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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
  
  // Tailwind common classes for links
  const linkBaseClass = "flex items-center gap-2 text-sm font-bold uppercase tracking-wider transition-all duration-300 hover:scale-105";
  const getLinkClass = (path) => `${linkBaseClass} ${isActive(path) ? 'text-red-400 italic' : 'text-gray-200 hover:text-yellow-400'}`;

  return (
    <nav className={`fixed top-0 left-0 w-full z-50 transition-all duration-300 ${
      scrolled ? 'bg-slate-900/95 backdrop-blur-md shadow-lg py-3' : 'bg-slate-900/80 backdrop-blur-sm py-5'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center">
        
        {/* Logo */}
        <Link to="/" className="flex items-center gap-3 text-white hover:text-yellow-400 transition-colors group">
          <div className="bg-white/10 p-2 rounded-full group-hover:bg-yellow-400/20 transition-colors">
            <span className="text-xl">🧠</span>
          </div>
          <span className="text-2xl font-black tracking-widest uppercase">EmotiLearn</span>
        </Link>

        {/* Desktop Links */}
        <div className="hidden md:flex items-center gap-8">
          <Link to="/" className={getLinkClass('/')}>
            <Home size={18} /> Home
          </Link>
          
          {child ? (
            <>
              <Link to="/memory-game" className={getLinkClass('/memory-game')}>🧠 Memory</Link>
              <Link to="/quiz" className={getLinkClass('/quiz')}>🧩 Quiz</Link>
              <Link to="/animal-game" className={getLinkClass('/animal-game')}>🦁 Animal</Link>
              <Link to="/report" className={getLinkClass('/report')}>📊 Reports</Link>
              
              {child.isSuperAdmin && (
                <Link to="/super-admin" className={getLinkClass('/super-admin')}>
                  <Shield size={18} /> Admin
                </Link>
              )}
              
              <button 
                onClick={handleLogout} 
                className="flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-bold text-sm uppercase tracking-wider transition-all duration-300 hover:scale-105 hover:shadow-lg shadow-red-500/30"
              >
                <LogOut size={18} /> Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className={getLinkClass('/login')}>
                <LogIn size={18} /> Login
              </Link>
              <Link to="/admin-login" className={getLinkClass('/admin-login')}>
                <Shield size={18} /> Admin
              </Link>
              <Link to="/register" className={getLinkClass('/register')}>
                <UserPlus size={18} /> Register
              </Link>
              <Link to="/Faqs" className={getLinkClass('/Faqs')}>
                <HelpCircle size={18} /> FAQ
              </Link>
            </>
          )}
        </div>

        {/* Mobile Menu Button */}
        <div className="md:hidden">
          <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="text-gray-200 hover:text-white p-2"
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden absolute top-full left-0 w-full bg-slate-900/95 backdrop-blur-md shadow-xl border-t border-white/10 flex flex-col items-center py-6 gap-6">
          <Link to="/" onClick={() => setMobileMenuOpen(false)} className={getLinkClass('/')}>
            <Home size={18} /> Home
          </Link>
          
          {child ? (
            <>
              <Link to="/memory-game" onClick={() => setMobileMenuOpen(false)} className={getLinkClass('/memory-game')}>🧠 Memory Game</Link>
              <Link to="/quiz" onClick={() => setMobileMenuOpen(false)} className={getLinkClass('/quiz')}>🧩 Quiz Game</Link>
              <Link to="/animal-game" onClick={() => setMobileMenuOpen(false)} className={getLinkClass('/animal-game')}>🦁 Animal Game</Link>
              <Link to="/report" onClick={() => setMobileMenuOpen(false)} className={getLinkClass('/report')}>📊 Reports</Link>
              
              {child.isSuperAdmin && (
                <Link to="/super-admin" onClick={() => setMobileMenuOpen(false)} className={getLinkClass('/super-admin')}>
                  <Shield size={18} /> Admin
                </Link>
              )}
              
              <button 
                onClick={() => { handleLogout(); setMobileMenuOpen(false); }} 
                className="flex items-center gap-2 px-6 py-3 bg-red-500 hover:bg-red-600 text-white rounded-lg font-bold mt-4"
              >
                <LogOut size={18} /> Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" onClick={() => setMobileMenuOpen(false)} className={getLinkClass('/login')}>
                <LogIn size={18} /> Login
              </Link>
              <Link to="/admin-login" onClick={() => setMobileMenuOpen(false)} className={getLinkClass('/admin-login')}>
                <Shield size={18} /> Admin
              </Link>
              <Link to="/register" onClick={() => setMobileMenuOpen(false)} className={getLinkClass('/register')}>
                <UserPlus size={18} /> Register
              </Link>
              <Link to="/Faqs" onClick={() => setMobileMenuOpen(false)} className={getLinkClass('/Faqs')}>
                <HelpCircle size={18} /> FAQ
              </Link>
            </>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;
