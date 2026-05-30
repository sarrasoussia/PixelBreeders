import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import SearchPage from './components/SearchPage';
import RatedMoviesPage from './components/RatedMoviesPage';
import LoginPage from './components/LoginPage';
import RegisterPage from './components/RegisterPage';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import './App.css';

function AppContent() {
  const { isAuthenticated, logout, user } = useAuth();

  return (
    <div className="App">
      <nav className="navbar">
        <h1 className="nav-title">Movie Search</h1>
        <div className="nav-links">
          <a href="/" className="nav-link">Search</a>
          {isAuthenticated && <a href="/rated" className="nav-link">Rated Movies</a>}
          {isAuthenticated ? (
            <>
              <span className="nav-user">Hello, {user?.username}</span>
              <button onClick={logout} className="nav-button">Logout</button>
            </>
          ) : (
            <>
              <a href="/login" className="nav-link">Login</a>
              <a href="/register" className="nav-link">Register</a>
            </>
          )}
        </div>
      </nav>
      <Routes>
        <Route path="/" element={<SearchPage />} />
        <Route path="/rated" element={<RatedMoviesPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
      </Routes>
    </div>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </Router>
  );
}

export default App;
