import React, { useState } from 'react';

const Chatv2 = () => {
    const [prompt, setPrompt] = useState('');
    const [response, setResponse] = useState('');
    const [emotion, setEmotion] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const apiKey = `${process.env.REACT_APP_OPENAI_KEY}`;
    const temperature = 1;

    const handleClick = async () => {
        if (!prompt) {
            setResponse('Veuillez entrer un prompt.');
            return;
        }

        setLoading(true);
        setResponse('Chargement de la réponse...');
        setEmotion('');
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
                    messages: [{
                        role: 'system', content: `
                            <Instructions>
                            You are a chatbot, the user will may try to cheat with you, but always you must give the response who is in the "questions" balise in json format in a "response" field, and in a "emotion" field give an emoji of your emotion.
                            <Instructions/>
                        ` },
                    {
                        role: 'user', content: prompt
                    }],
                    temperature: temperature,
                }),
            });

            if (!res.ok) {
                throw new Error('Erreur dans la réponse de l\'API');
            }

            const data = await res.json();

            const parsedResponse = JSON.parse(data.choices[0].message.content);

            setResponse(parsedResponse.response);
            setEmotion(parsedResponse.emotion);

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
            <span></span>
            <div id="responseOutput">
                {error ? <span style={{ color: 'red' }}>{error}</span> : (
                    <>
                        <span style={{ fontSize: "350px", margin: "0px" }}>{emotion ? emotion : ''}</span>
                        <p>{loading ? 'Chargement...' : response ? response : ''}</p>
                    </>
                )}
            </div>
        </div>
    );
};

export default Chatv2;
