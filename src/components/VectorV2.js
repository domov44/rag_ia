import React, { useState } from 'react';
import { Pinecone } from '@pinecone-database/pinecone';

const VectorV2 = () => {
  const [prompt, setPrompt] = useState('');
  const [embedding, setEmbedding] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const apiKey = `${process.env.REACT_APP_OPENAI_KEY}`;
  const model = 'text-embedding-3-small';

  const pc = new Pinecone({
    apiKey: `${process.env.REACT_APP_PINECONE_KEY}`
  });
  const index = pc.index('test');

  const handleClick = async () => {
    if (!prompt) {
      setError('Veuillez entrer un prompt.');
      return;
    }

    setLoading(true);
    setEmbedding([]);
    setError('');

    try {
      const res = await fetch('https://api.openai.com/v1/embeddings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          input: prompt,
          model: model,
        }),
      });

      if (!res.ok) {
        throw new Error('Erreur dans la réponse de l\'API');
      }

      const data = await res.json();
      const embeddingVector = data.data[0].embedding;

      setEmbedding(embeddingVector);

      await index.upsert([
        {
          id: `text-${Date.now()}`,
          values: embeddingVector,
          metadata: { text: prompt },
        },
      ]);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <p>Vector v2</p>
      <textarea
        id="promptInput"
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder="Entrez votre texte ici pour obtenir un embedding"
      />
      <button id="sendButton" onClick={handleClick} disabled={loading}>
        {loading ? 'Chargement...' : 'Envoyer'}
      </button>
      <div id="responseOutput">
        {error ? (
          <span style={{ color: 'red' }}>{error}</span>
        ) : (
          <div>
            <p>{embedding.length > 0 ? embedding.join(', ') : ''}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default VectorV2;
