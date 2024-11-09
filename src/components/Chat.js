import React, { useState } from 'react';

const Chat = () => {
  const [prompt, setPrompt] = useState('');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const apiKey = `${process.env.REACT_APP_OPENAI_KEY}`;
  const temperature = 2;

  const handleClick = async () => {
    if (!prompt) {
      setResponse('Veuillez entrer un prompt.');
      return;
    }

    setLoading(true);
    setResponse('Chargement de la réponse...');
    setError('');

    try {
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [{ role: 'user', content: prompt }],
          temperature: temperature,
        }),
      });

      if (!res.ok) {
        throw new Error('Erreur dans la réponse de l\'API');
      }

      const data = await res.json();
      setResponse(data.choices[0].message.content);
    } catch (error) {
      setError(error.message);
      setResponse('Erreur : ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
        <p>Chat</p>
      <textarea
        id="promptInput"
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder="Entrez votre prompt ici..."
      />
      <button id="sendButton" onClick={handleClick} disabled={loading}>
        {loading ? 'Chargement...' : 'Envoyer'}
      </button>
      <div id="responseOutput">
        {error ? <span style={{ color: 'red' }}>{error}</span> : <p>{response}</p>}
      </div>
    </div>
  );
};

export default Chat;
