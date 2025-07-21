import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import axios from 'axios';
import './dashboard.css';
import './Article.css';

const Articles = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [articles, setArticles] = useState([]);
  const [menuOpen, setMenuOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [formData, setFormData] = useState({ code_article: '', libelle: '' });
  const [qrCode, setQrCode] = useState(null);
  const [addedSuccess, setAddedSuccess] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return navigate('/login');

    try {
      const decoded = jwtDecode(token);
      if (
        !(
          decoded?.role === 'admin' ||
          decoded?.isAdmin ||
          decoded?.role === 'staff' ||
          decoded?.isStaff
        )
      ) {
        return navigate('/login');
      }
      fetchArticles(token);
    } catch (err) {
      console.error('Invalid token:', err);
      navigate('/login');
    }
  }, [navigate]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchArticles = async (token) => {
    try {
      const res = await axios.get('http://localhost:5000/articles/getall', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setArticles(res.data);
    } catch (err) {
      console.error('Failed to fetch articles:', err);
    }
  };

  const handleDelete = async (code_article) => {
    const token = localStorage.getItem('token');
    if (!window.confirm(`Delete article ${code_article} ?`)) return;

    try {
      await axios.delete(`http://localhost:5000/articles/delete/${code_article}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setArticles((prev) => prev.filter((a) => a.code_article !== code_article));
    } catch (err) {
      alert('Failed to delete article');
      console.error(err);
    }
  };

  const filteredArticles = articles.filter(
    (a) =>
      a.code_article.toLowerCase().includes(search.toLowerCase()) ||
      a.libelle.toLowerCase().includes(search.toLowerCase())
  );

  const handleNavigate = (path) => {
    if (path === '/dashboard/articles') return;
    navigate(path);
    setMenuOpen(false); // close menu after navigation
  };

  // Handle form changes
  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  // Submit new article
  const handleSubmit = async (e) => {
    e.preventDefault();
    setQrCode(null);
    setAddedSuccess(false);

    const token = localStorage.getItem('token');
    try {
      const res = await axios.post('http://localhost:5000/articles/add', formData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      alert(res.data.message);
      setArticles((prev) => [res.data.article, ...prev]);
      setQrCode(res.data.article.qrCode); // base64 QR code from server
      setAddedSuccess(true);
      setFormData({ code_article: '', libelle: '' });
    } catch (err) {
      alert(err.response?.data?.message || 'Error creating article');
      console.error(err);
    }
  };

  // Print QR code function
  const handlePrint = () => {
    if (!qrCode) return;
    const printWindow = window.open('', '_blank', 'width=300,height=300');
    printWindow.document.write(`
      <html>
        <head><title>Print QR Code</title></head>
        <body style="text-align:center; margin:20px;">
          <h2>Article QR Code</h2>
          <img src="${qrCode}" alt="QR Code" style="width:250px; height:250px;" />
          <script>
            window.onload = function() {
              window.print();
              window.onafterprint = () => window.close();
            }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="dashboard-container">
      {/* Floating star menu */}
      <div className="floating-menu" ref={menuRef}>
        <button
          className="floating-menu-btn"
          aria-label="Open menu"
          onClick={() => setMenuOpen((prev) => !prev)}
          type="button"
        >
          {/* SVG Star Icon */}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="currentColor"
            viewBox="0 0 24 24"
            width="28"
            height="28"
          >
            <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
          </svg>
        </button>
        {menuOpen && (
          <div className="floating-menu-dropdown">
            <button onClick={() => handleNavigate('/dashboard/articles')}>Articles</button>
            <button onClick={() => handleNavigate('/dashboard')}>Casiers</button>
            <button onClick={() => handleNavigate('/dashboard/echantillions')}>Échantillons</button>
          </div>
        )}
      </div>

      {/* Floating add button */}
      <button
        className="floating-add-btn"
        aria-label="Add Article"
        onClick={() => {
          setModalOpen(true);
          setQrCode(null);
          setFormData({ code_article: '', libelle: '' });
          setAddedSuccess(false);
        }}
      >
        ＋
      </button>

      <div className="dashboard-card">
        <h1 className="dashboard-title">Articles</h1>

        <div className="dashboard-search">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search articles by code or libelle..."
            className="dashboard-search-input"
          />
        </div>

        <div className="dashboard-articles-list">
          {filteredArticles.length === 0 ? (
            <p className="dashboard-no-results">No articles found.</p>
          ) : (
            filteredArticles.map((article) => (
              <div
                key={article.code_article}
                className="dashboard-article-card"
                onClick={() => navigate(`/article/${article.code_article}`)}
              >
                <div className="dashboard-article-code">{article.code_article}</div>
                <div className="dashboard-article-libelle">{article.libelle}</div>
                <button
                  className="dashboard-article-delete-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(article.code_article);
                  }}
                  aria-label={`Delete article ${article.code_article}`}
                >
                  Delete
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Modal for adding article */}
      {modalOpen && (
        <div
          className="modal-overlay"
          onClick={() => {
            setModalOpen(false);
            setAddedSuccess(false);
            setQrCode(null);
          }}
        >
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            {!addedSuccess ? (
              <>
                <h2>Ajouter un nouveau Artile</h2>
                <form onSubmit={handleSubmit}>
                  <label>
                    Code Article:
                    <input
                      type="text"
                      name="code_article"
                      value={formData.code_article}
                      onChange={handleChange}
                      required
                    />
                  </label>
                  <label>
                    Libelle:
                    <input
                      type="text"
                      name="libelle"
                      value={formData.libelle}
                      onChange={handleChange}
                      required
                    />
                  </label>
                  <div className="modal-buttons">
                    <button type="submit" className="btn-primary">
                        Ajouter un Article
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setModalOpen(false);
                        setQrCode(null);
                      }}
                      className="btn-secondary"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </>
            ) : (
              <>
                <h2>Article Added Successfully!</h2>
                <div className="qr-code-container">
                  <img src={qrCode} alt="Article QR Code" />
                </div>
                <div className="modal-buttons">
                  <button onClick={handlePrint} className="btn-primary">
                    Print QR Code
                  </button>
                  <button
                    onClick={() => {
                      setModalOpen(false);
                      setAddedSuccess(false);
                      setQrCode(null);
                    }}
                    className="btn-secondary"
                  >
                    Close Window
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Articles;
