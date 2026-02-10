import { NavLink, useNavigate } from 'react-router-dom';

function TeacherLayout({ children }) {
  const navigate = useNavigate();
  
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/');
  };

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-gray-50 to-blue-50">
      {/* Sidebar */}
      <aside className="w-64 bg-white shadow-lg flex flex-col border-r border-gray-200">
        {/* Header with Logout Button */}
        <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-blue-600 to-blue-700">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-white">Teacher Panel</h2>
              <p className="text-blue-100 text-sm mt-2">Welcome, Teacher</p>
            </div>
            <button
              onClick={handleLogout}
              className="ml-4 p-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors flex items-center gap-2"
            >
              <span className="text-white text-lg">🚪</span>
              <span className="text-white text-sm font-medium">Logout</span>
            </button>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1">
          <NavLink
            to="/teacher/dashboard"
            className={({ isActive }) => 
              `flex items-center px-4 py-3 rounded-xl transition-all duration-200 ${
                isActive 
                  ? 'bg-gradient-to-r from-blue-50 to-blue-100 text-blue-700 border border-blue-200 shadow-sm' 
                  : 'hover:bg-gray-50 text-gray-700 hover:text-gray-900'
              }`
            }
            end
          >
            <span className="mr-3 text-lg">📅</span>
            <span className="font-medium">My Schedules</span>
          </NavLink>
        </nav>

        {/* Footer with additional info */}
        <div className="p-4 border-t border-gray-100 mt-auto">
          <div className="text-center">
            <p className="text-sm text-gray-500 mb-1">Teacher Account</p>
            <p className="text-xs text-gray-400">Manage your classes efficiently</p>
          </div>
        </div>
      </aside>

      {/* Content */}
      <main className="flex-1 p-8 overflow-auto">
        <div className="max-w-6xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}

export default TeacherLayout;