import React from 'react';

interface ApiKeyInputProps {
    apiKey: string;
    onApiKeyChange: (key: string) => void;
}

const ApiKeyInput: React.FC<ApiKeyInputProps> = ({ apiKey, onApiKeyChange }) => {
    return (
        <div className="api-key-section horizontal">
            <div className="api-key-input-wrapper">
                <input
                    type="password"
                    value={apiKey}
                    onChange={(e) => onApiKeyChange(e.target.value)}
                    placeholder="Gemini API Key"
                    className="api-key-input"
                />
                <button
                    className="show-key-btn"
                    onClick={(e) => {
                        const input = (e.target as HTMLElement).previousElementSibling as HTMLInputElement;
                        input.type = input.type === 'password' ? 'text' : 'password';
                    }}
                    title="Toggle visibility"
                >
                    👁️
                </button>
            </div>
        </div>
    );
};

export default ApiKeyInput;
