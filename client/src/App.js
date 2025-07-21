import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Nav from './components/Nav';
import Home from './pages/Home';
import About from './pages/About';
import Login from './pages/Login';
import Signup from './pages/Signup';
import './app.css';
import Dashboard from './pages/Dashboard';
import Dashboarda from './pages/Dashboarda';
import Echantillions from './pages/Echantillions';
import Articles from './pages/Articles';
import CasierDetail from './pages/CasierDetail';
import ArticleDetails from './pages/ArticleDetails';
function App() {
  return (
    <Router>
      <div className="App">
        <Nav />
        <Routes>
<Route path="/article/:code_article" element={<ArticleDetails />} />
          <Route path="/dashboard/casier/:code" element={<CasierDetail />} />
          <Route path="/dashboard/echantillions" element={<Echantillions />} />
          <Route path="/dashboard/articles" element={<Articles />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/dashboarda" element={<Dashboarda />} />
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
