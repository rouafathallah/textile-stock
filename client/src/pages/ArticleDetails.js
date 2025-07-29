import { useParams } from 'react-router-dom';
import axios from 'axios';
import { useEffect, useState, useRef } from 'react';
import jsPDF from 'jspdf';
import './articledetails.css';

function ArticleDetails() {
  const { code_article } = useParams();
  const [article, setArticle] = useState(null);
  const imgRef = useRef();

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

const downloadAsJPG = () => {
  const img = new Image();
  img.src = article.qrCode;

  img.onload = () => {
    const scale = 3; 
    const canvas = document.createElement('canvas');
    canvas.width = img.width * scale;
    canvas.height = img.height * scale;

    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    const resizedJpg = canvas.toDataURL('image/jpeg');

    const link = document.createElement('a');
    link.href = resizedJpg;
    link.download = `${article.code_article}-QRcode.jpg`;
    link.click();
  };
};



  const downloadAsPDF = () => {
    const doc = new jsPDF();
  doc.text(`Code Article: ${article.code_article}`, 105, 40, null, null, 'center');
  doc.addImage(article.qrCode, 'JPEG', 55, 80, 100, 100);  
    doc.save(`${article.code_article}-qr.pdf`);
  };

  if (!article) return <div>Loading...</div>;

  return (
    <div className="article-details-container">
      <h1>Libelle: {article.libelle}</h1>
      <p><strong>Code Article:</strong> {article.code_article}</p>
      <p><strong>QR Code Text:</strong> {article.qrCodeText}</p>

      {article.qrCode && (
        <div className="qr-code-wrapper">
          <img ref={imgRef} src={article.qrCode} alt="QR Code" />
          <div className="button-wrapper">
            <button className="print-btn" onClick={downloadAsJPG}>Download as JPG</button>
            <button className="print-btn" onClick={downloadAsPDF}>Download as PDF</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default ArticleDetails;
