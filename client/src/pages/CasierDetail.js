import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './CasierDetails.css';
const MAX_SLOTS = 30;

const CasierDetail = () => {
  const { code } = useParams();
  const navigate = useNavigate();
  const [casier, setCasier] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    const fetchCasier = async () => {
      try {
        const res = await axios.get(`http://localhost:5000/casiers/get/${code}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setCasier(res.data);
        setLoading(false);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch casier');
        setLoading(false);
      }
    };

    fetchCasier();
  }, [code, navigate]);

  if (loading) return <p>Loading casier info...</p>;
  if (error) return <p>Error: {error}</p>;
  if (!casier) return <p>Pas de casier trouvé</p>;

  return (
    <div className="casier-detail-container">
      <button onClick={() => navigate(-1)} className="back-button">
        &larr; Back
      </button>

      <h1>Casier Details</h1>

      <div className="casier-info">
        <p><strong>Code unique:</strong> {casier.code_unique}</p>
        <p><strong>Rayon:</strong> {casier.code_rayon}</p>
        <p><strong>Étage:</strong> {casier.code_etage}</p>
        <p><strong>Casier:</strong> {casier.code_casier}</p>
        <p>
          <strong>Stockage:</strong> {casier.contenus?.length || 0} / {MAX_SLOTS}
        </p>
      </div>

      <h2>Échantillons stockés</h2>
      {casier.contenus && casier.contenus.length > 0 ? (
        <ul className="echantillons-list">
          {casier.contenus.map((contenu, index) => (
            <li key={contenu._id || index} className="echantillon-item">
              <p><strong>Nom échantillon:</strong> {contenu.echantillon?.nom || 'N/A'}</p>
              <p><strong>Article associé:</strong> {contenu.echantillon?.article?.nom || 'N/A'}</p>
              {/* Add other info you want here */}
            </li>
          ))}
        </ul>
      ) : (
        <p>Aucun échantillon stocké dans ce casier.</p>
      )}
    </div>
  );
};

export default CasierDetail;
