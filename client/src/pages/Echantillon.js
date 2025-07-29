import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Html5QrcodeScanner } from 'html5-qrcode';
import './Echantillon.css';

function Echantillions() {
  const [echantillons, setEchantillons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [mode, setMode] = useState('qr'); // 'qr' or 'manual'
  const [qrText, setQrText] = useState('');
  const [codeArticle, setCodeArticle] = useState('');
  const [quantite, setQuantite] = useState('');
  const [codeUnique, setCodeUnique] = useState('');
  const [success, setSuccess] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();
  const scannerRef = useRef(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return navigate('/login');

    const fetchEchantillons = async () => {
      try {
        const res = await axios.get('http://localhost:5000/echantillons/getall', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setEchantillons(res.data);
      } catch (err) {
        setError('Erreur lors du chargement des échantillons');
      } finally {
        setLoading(false);
      }
    };
    fetchEchantillons();
  }, [navigate, success]);

  // QR scanner setup
  useEffect(() => {
    let scanner;
    if (modalOpen && mode === 'qr') {
      scanner = new Html5QrcodeScanner(
        "qr-reader",
        { fps: 10, qrbox: 250 },
        false
      );
      scanner.render(
        (decodedText) => {
          setQrText(decodedText);
          scanner.clear();
        },
        (error) => {}
      );
    }
    // Cleanup scanner on modal close
    return () => {
      if (scanner) scanner.clear();
      const qrDiv = document.getElementById('qr-reader');
      if (qrDiv) qrDiv.innerHTML = '';
    };
  }, [modalOpen, mode]);

  // Filter échantillons by code article
  const filteredEchantillons = Array.isArray(echantillons)
    ? echantillons.filter(e =>
        e.article?.code_article?.toLowerCase().includes(search.toLowerCase())
      )
    : [];

  // Handle add (stock) echantillon
  const handleStock = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    const token = localStorage.getItem('token');
    let payload = {};
    let url = '';
    if (mode === 'qr') {
      payload = { qrText, quantite, code_unique: codeUnique };
      url = 'http://localhost:5000/echantillons/stock';
    } else {
      payload = { code_article: codeArticle, quantite, code_unique: codeUnique };
      url = 'http://localhost:5000/echantillons/stock-by-code';
    }
    try {
      await axios.post(url, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSuccess('Échantillon stocké avec succès.');
      setQrText('');
      setQuantite('');
      setCodeUnique('');
      setCodeArticle('');
      setModalOpen(false);
    } catch (err) {
      setError(err.response?.data?.message || "Erreur lors du stockage");
    }
  };

  if (loading) return <div>Chargement...</div>;
  if (error) return <div>{error}</div>;

  return (
    <div className="echantillions-container">
      <h1 className="echantillions-title">Liste des Échantillons</h1>
      <input
        type="text"
        className="echantillions-search"
        placeholder="Rechercher par code article..."
        value={search}
        onChange={e => setSearch(e.target.value)}
      />
      <ul className="echantillions-list">
        {filteredEchantillons.length === 0 ? (
          <p>Aucun échantillon trouvé.</p>
        ) : (
          filteredEchantillons.map(e => (
            <li
              key={e._id}
              className="echantillions-item"
              style={{ cursor: 'pointer' }}
              onClick={() => navigate(`/dashboard/echantillon/${e._id}`)}
            >
              <div className="echantillions-info">
                <div>
                  <strong>Code Article:</strong> {e.article?.code_article || '-'}<br />
                  <strong>Libelle:</strong> {e.article?.libelle || '-'}
                </div>
<div className="echantillions-quantite">
  Quantité:{' '}
  {e?.stocks && Array.isArray(e.stocks)
  ? e.stocks
      .filter(s => s?.casier?.type !== 'DST')
      .reduce((acc, s) => acc + (s?.quantite || 0), 0)
  : 0}
</div>



              </div>
              <button
                style={{
                  marginTop: 8,
                  padding: '6px 18px',
                  borderRadius: 8,
                  border: 'none',
                  background: '#c0392b',
                  color: 'white',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
                onClick={e => e.stopPropagation()}
              >
                Destock
              </button>
            </li>
          ))
        )}
      </ul>

      {/* Modern floating add button */}
      <button
        className="echantillions-add-btn"
        aria-label="Ajouter un échantillon"
        onClick={() => {
          setModalOpen(true);
          setError('');
          setSuccess('');
        }}
      >
        ＋
      </button>

      {/* Floating menu for navigation */}
      <div className="floating-menu" style={{ position: 'fixed', top: '20%', left: 20, zIndex: 1000 }}>
        <button
          className="floating-menu-btn"
          aria-label="Open menu"
          onClick={() => setMenuOpen(prev => !prev)}
          type="button"
        >
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
          <div className="floating-menu-dropdown" role="menu">
            <button onClick={() => navigate('/dashboard/articles')} role="menuitem" type="button">
              Articles
            </button>
            <button onClick={() => navigate('/dashboard')} role="menuitem" type="button">
              Casiers
            </button>
            <button onClick={() => navigate('/dashboard/echantillions')} role="menuitem" type="button">
              Échantillons
            </button>
          </div>
        )}
      </div>

      {/* Modal for adding echantillon */}
      {modalOpen && (
        <div className="echantillions-modal-overlay" onClick={() => setModalOpen(false)}>
          <div
            className="echantillions-modal"
            onClick={e => e.stopPropagation()}
          >
            <h2>Ajouter un Échantillon</h2>
            <div className="echantillions-modal-mode-btns">
              <button
                className={`echantillions-modal-mode-btn${mode === 'qr' ? ' active' : ''}`}
                onClick={() => setMode('qr')}
              >
                Scanner QR
              </button>
              <button
                className={`echantillions-modal-mode-btn${mode === 'manual' ? ' active' : ''}`}
                onClick={() => setMode('manual')}
              >
                Par Code Article
              </button>
            </div>
            <form className="echantillions-modal-form" onSubmit={handleStock}>
              {mode === 'qr' ? (
                <>
                  <div style={{ width: '100%', marginBottom: 12 }}>
                    <div id="qr-reader" style={{ width: '100%' }} />
                  </div>
                  <input
                    type="text"
                    placeholder="QR code"
                    value={qrText}
                    readOnly
                    style={{ marginBottom: 12, width: '100%', padding: '10px', borderRadius: 8, border: '1.5px solid #b5a8d5', background: '#f7f8fc' }}
                  />
                </>
              ) : (
                <>
                  <input
                    type="text"
                    placeholder="Code Article"
                    value={codeArticle}
                    onChange={e => setCodeArticle(e.target.value)}
                    required
                  />
                </>
              )}
              <input
                type="number"
                placeholder="Quantité"
                value={quantite}
                onChange={e => setQuantite(e.target.value)}
                required
              />
              <input
                type="text"
                placeholder="Code casier"
                value={codeUnique}
                onChange={e => setCodeUnique(e.target.value)}
                required
              />
              <button type="submit">
                Confirmer l'ajout
              </button>
            </form>
            {error && <div className="echantillions-modal-error">{error}</div>}
            {success && <div className="echantillions-modal-success">{success}</div>}
          </div>
        </div>
      )}
    </div>
  );
}

export default Echantillions;