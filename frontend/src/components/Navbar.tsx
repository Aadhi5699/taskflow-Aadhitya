import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';

export default function Navbar() {
  const { user, logout } = useAuth();

  return (
    <header className="border-b border-border bg-card">
      <div className="flex h-16 items-center px-4 md:px-8 max-w-7xl mx-auto w-full justify-between">
        <Link to="/" className="font-bold text-xl tracking-tight text-primary">
          TaskFlow
        </Link>
        
        {user ? (
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-muted-foreground hidden sm:block">
              {user.name}
            </span>
            <button 
              onClick={logout}
              className="px-4 py-2 text-sm font-medium bg-secondary text-secondary-foreground hover:bg-secondary/80 rounded-md transition-colors"
            >
              Sign Out
            </button>
          </div>
        ) : (
          <div className="flex gap-4">
            <Link to="/login" className="px-4 py-2 text-sm font-medium hover:underline">
              Sign In
            </Link>
            <Link to="/register" className="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 rounded-md transition-colors">
              Get Started
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}
