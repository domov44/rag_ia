import React, { useState } from 'react';
import { Pinecone } from '@pinecone-database/pinecone';

const QueryVectorV2 = () => {
    const [prompt, setPrompt] = useState('');
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const apiKey = `${process.env.REACT_APP_OPENAI_KEY}`;
    const model = 'text-embedding-3-small';

    const pc = new Pinecone({
        apiKey: `${process.env.REACT_APP_PINECONE_KEY}`
    });
    const index = pc.index('ecv');

    const handleClick = async () => {
        if (!prompt) {
            setError('Veuillez entrer un prompt.');
            return;
        }

        setLoading(true);
        setError('');
        setResults([]);

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

            const pineconeRes = await index.query({
                vector: embeddingVector,
                topK: 3,
                includeMetadata: true,
            });

            setResults(pineconeRes.matches || []);
        } catch (error) {
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <p>Search similar words</p>
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
                        {results.length > 0 && (
                            <div>
                                <h4>Résultats :</h4>
                                <ul>
                                    {results.map((result, index) => (
                                        <li key={index}>
                                            <strong>ID :</strong> {result.id}<br />
                                            <strong>Score :</strong> {result.score}<br />
                                            <strong>Metadata :</strong> {JSON.stringify(result.metadata)}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default QueryVectorV2;
