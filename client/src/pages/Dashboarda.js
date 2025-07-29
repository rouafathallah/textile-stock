import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

function Dashboarda() {
  const [casiers, setCasiers] = useState([]);
  const [users, setUsers] = useState([]);
  const [loadingCasiers, setLoadingCasiers] = useState(true);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const token = localStorage.getItem('token');
const navigate = useNavigate();

  // --- USERS ---

  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
      const res = await axios.get('http://localhost:5000/user/users', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUsers(res.data);
      setMessage('');
      setError('');
    } catch (err) {
      setError('Erreur lors du chargement des utilisateurs');
    } finally {
      setLoadingUsers(false);
    }
  };

const updateUser = async (userId, updates) => {
  setMessage('');
  setError('');
  try {
    const res = await axios.patch(
      `http://localhost:5000/user/users/${userId}`,
      updates,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    setMessage(res.data.message);
    setUsers(users.map(u => {
      if (u._id === userId) {
        return { ...u, ...updates }; // merge updates locally
      }
      return u;
    }));
    // Clear message after 3 seconds
    setTimeout(() => setMessage(''), 3000);
  } catch (err) {
    setError(err.response?.data?.message || 'Erreur lors de la mise à jour utilisateur');
  }
};


  useEffect(() => {
    fetchUsers();
  }, []);

  return (
    
    <div style={{ maxWidth: 900, margin: '40px auto', padding: 40, textAlign: 'center' }}>
      <h1>Dashboard Admin - Gestion des Casiers & Utilisateurs</h1>
      <div className='casier-management'>
<button
  onClick={() => navigate('/gestioncasiers')}
  style={{
    marginBottom: 20,
    padding: '12px 40px',
    backgroundColor: '#2980b9',
    color: 'white',
    border: 'none',
    borderRadius: 6,
    cursor: 'pointer'
  }}
>
  Plan Casiers
</button>        </div>


      {message && <p style={{ color: 'green' }}>{message}</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}

      {/* Users section */}
      <section>
        <h2>Gestion des Utilisateurs</h2>

        {loadingUsers ? (
          <p>Chargement des utilisateurs...</p>
        ) : (
          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              textAlign: 'left'
            }}
          >
            <thead>
              <tr>
                <th style={{ borderBottom: '1px solid #ccc', padding: '8px' }}>Nom d'utilisateur</th>
                <th style={{ borderBottom: '1px solid #ccc', padding: '8px' }}>CIN</th>
                <th style={{ borderBottom: '1px solid #ccc', padding: '8px' }}>Rôle</th>
                <th style={{ borderBottom: '1px solid #ccc', padding: '8px' }}>Vérifié</th>
                <th style={{ borderBottom: '1px solid #ccc', padding: '8px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(user => (
                <tr key={user._id}>
                  <td style={{ padding: '8px', borderBottom: '1px solid #eee' }}>{user.fullName}</td>
                  <td style={{ padding: '8px', borderBottom: '1px solid #eee' }}>{user.CIN}</td>
                  <td style={{ padding: '8px', borderBottom: '1px solid #eee' }}>{user.role}</td>
                  <td style={{ padding: '8px', borderBottom: '1px solid #eee' }}>
                    {user.isVerified ? 'Oui' : 'Non'}
                  </td>
                  <td style={{ padding: '8px', borderBottom: '1px solid #eee' }}>
                    <button
                      onClick={() => updateUser(user._id, { isVerified: !user.isVerified })}
                      style={{
                        marginRight: 8,
                        padding: '4px 8px',
                        backgroundColor: user.isVerified ? '#c0392b' : '#27ae60',
                        color: 'white',
                        border: 'none',
                        borderRadius: 4,
                        cursor: 'pointer'
                      }}
                    >
                      {user.isVerified ? 'Désactiver' : 'Vérifier'}
                    </button>
                    <button
                      onClick={() =>
                        updateUser(user._id, { role: user.role === 'admin' ? 'staff' : 'admin' })
                      }
                      style={{
                        padding: '4px 8px',
                        backgroundColor: user.role === 'admin' ? '#f39c12' : '#2980b9',
                        color: 'white',
                        border: 'none',
                        borderRadius: 4,
                        cursor: 'pointer'
                      }}
                    >
                      {user.role === 'admin' ? 'Passer utilisateur' : 'Passer admin'}
                    </button>
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: 20 }}>
                    Aucun utilisateur trouvé.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}

export default Dashboarda;
