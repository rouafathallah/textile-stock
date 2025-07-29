import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';

const EchantillonDetail = () => {
  const { id } = useParams();
  const [echantillon, setEchantillon] = useState(null);
  const [casiers, setCasiers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDestockForm, setShowDestockForm] = useState(false);
  const [quantites, setQuantites] = useState({});
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const token = localStorage.getItem('token');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await axios.get(`http://localhost:5000/echantillons/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        console.log('Fetched echantillon:', res.data.echantillon);
        setEchantillon(res.data.echantillon);
        setCasiers(res.data.casiers);
      } catch (error) {
        console.error('Error fetching echantillon:', error);
        setEchantillon(null);
        setCasiers([]);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id, token]);

  const fetchCasiersToDestock = async () => {

    if (!echantillon?.article?.qrCodeText) {
      setMessage('Erreur: QR code text manquant.');
      return;
    }
    console.log('Using QR code text:', echantillon.article.qrCodeText);

    setMessage('');
    try {
      const res = await axios.post(
        'http://localhost:5000/echantillons/destock/init',
        { qrText: echantillon.article.qrCodeText },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          }
        }
      );
      setCasiers(res.data.casiers);
      setShowDestockForm(true);

      const initialQuantities = {};
      res.data.casiers.forEach(c => {
        initialQuantities[c.casierId] = 0;
      });
      setQuantites(initialQuantities);

    } catch (err) {
      console.error('Error during fetchCasiersToDestock:', err);
      setMessage(err.response?.data?.message || 'Erreur lors du chargement des casiers.');
    }
  };

  const handleChange = (casierId, value) => {
    setQuantites(prev => ({ ...prev, [casierId]: parseInt(value) || 0 }));
  };

  const handleSubmitDestock = async () => {
    setSubmitting(true);
    setMessage('');
    try {
      const filtered = Object.entries(quantites)
        .filter(([, qty]) => qty > 0)
        .map(([casierId, quantite]) => ({ casierId, quantite }));

      if (filtered.length === 0) {
        setMessage('❗️ Aucune quantité à destocker.');
        setSubmitting(false);
        return;
      }

const lignes = [];

for (const [casierId, quantite] of Object.entries(quantites)) {
  if (quantite > 0) {
    const casier = casiers.find(c => c.casierId === casierId);
    if (casier && casier.contenus?.length > 0) {
      lignes.push({
        casierId,
        echantillonId: casier.contenus[0].echantillon,  // <-- important
        quantite
      });
    }
  }
}

if (lignes.length === 0) {
  setMessage('❗️Aucune quantité à destocker.');
  setSubmitting(false);
  return;
}

const res = await axios.post(
  'http://localhost:5000/echantillons/destock/confirm',
  { lignes },
  {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    }
  }
);


      setMessage(res.data.message || '✅ Destockage effectué.');
      setShowDestockForm(false);
      setQuantites({});

      // Refresh casiers after destock
      const refreshed = await axios.get(`http://localhost:5000/echantillons/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCasiers(refreshed.data.casiers);

    } catch (err) {
      console.error('Error during handleSubmitDestock:', err);
      setMessage(err.response?.data?.message || 'Erreur lors du destockage.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div>Chargement…</div>;
  if (!echantillon) return <div>Échantillon introuvable.</div>;

  return (
    <div
      style={{
        maxWidth: 600,
        margin: '40px auto',
        background: '#fff',
        borderRadius: 16,
        boxShadow: '0 4px 24px rgba(75,59,148,0.08)',
        padding: 24
      }}
    >
      <h2>Détails de l'échantillon</h2>
      <p><strong>Libellé :</strong> {echantillon.article?.libelle || '-'}</p>
      <p><strong>Code Article :</strong> {echantillon.article?.code_article || '-'}</p>
      <p><strong>Quantité totale :</strong> {echantillon.totalQuantite ?? 0}</p>

      <h3>Casiers contenant cet échantillon</h3>
      {Array.isArray(casiers) && casiers.length === 0 ? (
        <p>Aucun casier ne contient cet échantillon.</p>
      ) : (
        <ul>
{casiers
  .filter(c => c.type !== 'DST') // Filtrer les casiers normaux
  .map(c => (
    <li
      key={c.casierId || c.code_unique}
      style={{
        marginBottom: 12,
        background: '#f7f8fc',
        borderRadius: 8,
        padding: 10
      }}
    >
      <strong>Casier :</strong> {c.casierCode || c.code_unique} <br />
      <strong>Quantité :</strong> {c.quantite || (c.contenus && c.contenus[0]?.quantite)}
{showDestockForm && c.casier?.type !== 'DST' && (
  <div style={{ marginTop: 8 }}>
    <input
      type="number"
      min={0}
      value={quantites[c.casierId] || ''}
      onChange={e => handleChange(c.casierId, e.target.value)}
      placeholder="Quantité à retirer"
      style={{
        padding: 6,
        borderRadius: 6,
        border: '1px solid #ccc',
        width: '100%',
      }}
    />
  </div>
)}

    </li>
  ))}

        </ul>
      )}

      {message && (
        <p style={{ color: message.startsWith('✅') ? 'green' : 'red', marginTop: 12 }}>
          {message}
        </p>
      )}

      {!showDestockForm ? (
        <button
          onClick={fetchCasiersToDestock}
          style={{
            width: '100%',
            padding: '12px 0',
            background: '#c0392b',
            color: '#fff',
            fontWeight: 600,
            border: 'none',
            borderRadius: 8,
            marginTop: 20,
            cursor: 'pointer'
          }}
        >
          Destock
        </button>
      ) : (
        <button
          onClick={handleSubmitDestock}
          disabled={submitting}
          style={{
            width: '100%',
            padding: '12px 0',
            background: submitting ? '#888' : '#27ae60',
            color: '#fff',
            fontWeight: 600,
            border: 'none',
            borderRadius: 8,
            marginTop: 20,
            cursor: submitting ? 'not-allowed' : 'pointer'
          }}
        >
          {submitting ? 'Traitement...' : 'Confirmer Destockage'}
        </button>
      )}
    </div>
  );
};

export default EchantillonDetail;
