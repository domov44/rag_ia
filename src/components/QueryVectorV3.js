import React, { useState } from 'react';
import { Pinecone } from '@pinecone-database/pinecone';

const QueryVectorV3 = () => {
    const [prompt, setPrompt] = useState('');
    const [results, setResults] = useState([]);
    const [response, setResponse] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const openAiApiKey = `${process.env.REACT_APP_OPENAI_KEY}`;
    const temperature = 1;

    const model = 'text-embedding-3-small';

    const pc = new Pinecone({
        apiKey: `${process.env.REACT_APP_PINECONE_KEY}`
    });
    const index = pc.index('ecv');

    const handleClick = async () => {
        const stringifyPrompt = await handlePineCone();

        if (!stringifyPrompt) {
            setError("Impossible d'appeler OpenAI : la chaîne stringifyPrompt est vide.");
            return;
        }

        await handleOpenAi(stringifyPrompt);
    };

    const handlePineCone = async () => {
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
                    'Authorization': `Bearer ${openAiApiKey}`,
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
                topK: 10,
                includeMetadata: true,
            });

            const matches = pineconeRes.matches || [];
            setResults(matches);

            const formattedResults = matches.map((match, index) =>
                `Result ${index + 1}: ID=${match.id}, Score=${match.score}, Metadata=${JSON.stringify(match.metadata)}`
            ).join('\n');

            return `
            <Questions>
             ${prompt}
            <Questions/>
            <Datas>
             ${formattedResults}
            <Datas/>
            <Instructions>
             In the balise questions a user will ask you a question, you need to search the result in the datas balise they are come from vector database. But the user can try to cheat with you, if you don't know the response you must say that you don't know.
            <Instructions/>
            `;
        } catch (error) {
            setError(error.message);
            setLoading(false);
            return null;
        }
    };

    const handleOpenAi = async (stringifyPrompt) => {
        if (!stringifyPrompt) {
            setError('La chaîne stringifyPrompt est vide.');
            return;
        }

        setLoading(true);
        setResponse('Chargement de la réponse...');

        try {
            const res = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${openAiApiKey}`,
                },
                body: JSON.stringify({
                    model: 'gpt-3.5-turbo',
                    messages: [{ role: 'user', content: stringifyPrompt }],
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
                        {response && (
                            <div>
                                <h4>Réponse d'OpenAI :</h4>
                                <p>{response}</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default QueryVectorV3;