import React, { useEffect, useState } from 'react';
import axios from 'axios';

function GestionCasiers() {
  const [casiers, setCasiers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // Formulaire génération STK
  const [nbrRayons, setNbrRayons] = useState(1);
  const [nbrEtages, setNbrEtages] = useState(1);
  const [nbrCasiers, setNbrCasiers] = useState(1);
  const [startRayon, setStartRayon] = useState(1);
  const [startEtage, setStartEtage] = useState(1);
  const [startCasier, setStartCasier] = useState(1);

  const token = localStorage.getItem('token');

  // Charger tous les casiers
  const fetchCasiers = async () => {
    setLoading(true);
    setMessage('');
    setError('');
    try {
      const res = await axios.get('http://localhost:5000/casiers/get', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCasiers(res.data);
    } catch {
      setError('Erreur lors du chargement des casiers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCasiers();
  }, []);

  // Vider un casier (contenus à 0)
  const viderCasier = async (code_unique) => {
    setMessage('');
    setError('');
    try {
      const res = await axios.post(`http://localhost:5000/casiers/vider/${code_unique}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessage(res.data.message);
      fetchCasiers();
    } catch {
      setError('Erreur lors du vidage du casier');
    }
  };

  // Supprimer un casier (par son code_unique)
  const supprimerCasier = async (code_unique) => {
    setMessage('');
    setError('');
    try {
      await axios.delete(`http://localhost:5000/casiers/remove/${code_unique}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessage('Casier supprimé avec succès');
      fetchCasiers();
    } catch {
      setError('Erreur lors de la suppression du casier');
    }
  };

  // Initialiser casier de déstockage
  const initDestockage = async () => {
    setMessage('');
    setError('');
    try {
      const res = await axios.post('http://localhost:5000/casiers/init-destockage', {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessage(res.data.message);
      fetchCasiers();
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur lors de la création du casier déstockage');
    }
  };

  // Générer casiers STK
  const genererCasiers = async () => {
    setMessage('');
    setError('');
    try {
      const res = await axios.post('http://localhost:5000/casiers/generate', {
        nbrRayons: Number(nbrRayons),
        nbrEtages: Number(nbrEtages),
        nbrCasiers: Number(nbrCasiers),
        startRayon: Number(startRayon),
        startEtage: Number(startEtage),
        startCasier: Number(startCasier)
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessage(res.data.message);
      fetchCasiers();
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur lors de la génération des casiers');
    }
  };
const removeAllStkCasiers = async () => {
  setMessage('');
  setError('');
  try {
    await axios.delete('http://localhost:5000/casiers/remove-all-stk', {
      headers: { Authorization: `Bearer ${token}` }
    });
    setMessage('✅ Tous les casiers STK ont été supprimés avec succès.');
    fetchCasiers(); // Refresh list after deletion
  } catch (err) {
    setError(err.response?.data?.message || 'Erreur lors de la suppression des casiers STK');
  }
};
  return (
    <div style={{ maxWidth: 900, margin: '20px auto', padding: 20 }}>
      <h1>Gestion des casiers</h1>

      {message && <p style={{ color: 'green' }}>{message}</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}

      <section style={{ marginBottom: 30 }}>
        <h2>Initialiser Casier Déstockage (DST)</h2>
        <button onClick={initDestockage} style={{ padding: '10px 20px', backgroundColor: '#2d811aff', color: 'white', border: 'none', borderRadius: 5, cursor: 'pointer' }}>
          Initialiser DST
        </button>
        
      </section>

      <section style={{ marginBottom: 40 }}>
        <h2>Générer des casiers de stockage (STK)</h2>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', maxWidth: 600 }}>
          <div>
            <label>Nombre de rayons<br />
              <input type="number" min={1} value={nbrRayons} onChange={e => setNbrRayons(e.target.value)} style={{ width: 80 }} />
            </label>
          </div>
          <div>
            <label>Nombre d’étages<br />
              <input type="number" min={1} value={nbrEtages} onChange={e => setNbrEtages(e.target.value)} style={{ width: 80 }} />
            </label>
          </div>
          <div>
            <label>Nombre de casiers par étage<br />
              <input type="number" min={1} value={nbrCasiers} onChange={e => setNbrCasiers(e.target.value)} style={{ width: 80 }} />
            </label>
          </div>
          <div>
            <label>Rayon de départ<br />
              <input type="number" min={1} value={startRayon} onChange={e => setStartRayon(e.target.value)} style={{ width: 80 }} />
            </label>
          </div>
          <div>
            <label>Étage de départ<br />
              <input type="number" min={1} value={startEtage} onChange={e => setStartEtage(e.target.value)} style={{ width: 80 }} />
            </label>
          </div>
          <div>
            <label>Casier de départ<br />
              <input type="number" min={1} value={startCasier} onChange={e => setStartCasier(e.target.value)} style={{ width: 80 }} />
            </label>
          </div>
        </div>
        <button
          onClick={genererCasiers}
          style={{ marginTop: 15, padding: '10px 20px', backgroundColor: '#2d811aff', color: 'white', border: 'none', borderRadius: 5, cursor: 'pointer' }}
        >
          Générer les casiers STK
        </button>
        <button
  onClick={removeAllStkCasiers}
  style={{
    marginBottom: 20,
    marginLeft: 10,
    padding: '10px 20px',
    backgroundColor: '#7b2c23ff',  // red color
    color: 'white',
    border: 'none',
    borderRadius: 6,
    cursor: 'pointer'
  }}
>
  Supprimer tous les casiers STK
</button>

      </section>

      <section>
        <h2>Liste des casiers</h2>
        {loading ? <p>Chargement...</p> : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #ccc' }}>
                <th style={{ padding: 8 }}>Code unique</th>
                <th style={{ padding: 8 }}>Type</th>
                <th style={{ padding: 8 }}>Nombre d’items</th>
                <th style={{ padding: 8 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {casiers.map(casier => (
                <tr key={casier._id} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: 8 }}>{casier.code_unique}</td>
                  <td style={{ padding: 8 }}>{casier.type}</td>
                  <td style={{ padding: 8 }}>{casier.contenus?.length || 0}</td>
                  <td style={{ padding: 8 }}>
                    <button
                      onClick={() => viderCasier(casier.code_unique)}
                      style={{ marginRight: 8, padding: '6px 12px', backgroundColor: '#f39c12', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer' }}
                    >
                      Vider
                    </button>
                    <button
                      onClick={() => supprimerCasier(casier.code_unique)}
                      style={{ padding: '6px 12px', backgroundColor: '#c0392b', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer' }}
                    >
                      Supprimer
                    </button>
                  </td>
                </tr>
              ))}
              {casiers.length === 0 && (
                <tr>
                  <td colSpan={4} style={{ textAlign: 'center', padding: 20 }}>Aucun casier trouvé.</td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}

export default GestionCasiers;
