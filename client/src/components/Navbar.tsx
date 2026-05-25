import { useLocation } from 'react-router-dom';

const pageTitles: Record<string, string> = {
  '/': 'Dashboard',
  '/projects': 'Projects',
  '/my-tasks': 'My Tasks',
  '/settings': 'Settings',
};

export default function Navbar() {
  const location = useLocation();

  const getTitle = () => {
    if (location.pathname.startsWith('/projects/')) {
      return 'Project Board';
    }
    return pageTitles[location.pathname] || 'ApexFlow';
  };

  return (
    <header className="navbar">
      <div className="navbar-left">
        <h1 className="navbar-title">{getTitle()}</h1>
      </div>
      <div className="navbar-right">
        <button className="navbar-icon-btn" title="Notifications">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
          </svg>
        </button>
      </div>
    </header>
  );
}
