import { useParams } from 'react-router-dom';
import axios from 'axios';
import { useEffect, useState } from 'react';
import './articledetails.css';
function ArticleDetails() {
  const { code_article } = useParams();
  const [article, setArticle] = useState(null);

  useEffect(() => {
    const fetchArticle = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(`http://localhost:5000/articles/code/${code_article}`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        setArticle(response.data);
      } catch (err) {
        console.error('Failed to fetch article:', err);
      }
    };

    fetchArticle();
  }, [code_article]);

  if (!article) return <div>Loading...</div>;

return (
    <div className="article-details-container">
      <h1>Libelle: {article.libelle}</h1>
      <p><strong>Code Article:</strong> {article.code_article}</p>
      <p><strong>QR Code Text:</strong> {article.qrCodeText}</p>

      {article.qrCode && (
        <div className="qr-code-wrapper">
          <img src={article.qrCode} alt="QR Code" />
          <button className="print-btn" onClick={() => window.print()}>
            Print QR Code
          </button>
        </div> 
      )}
    </div>
  );
}

export default ArticleDetails;
