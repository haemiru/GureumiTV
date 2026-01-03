import { useState } from 'react';
import type { InterviewIdea } from '../types';
import { generateInterviewIdeas } from '../services/geminiApi';
import './IdeaHelperPopup.css';

interface IdeaHelperPopupProps {
    apiKey: string;
    isOpen: boolean;
    onClose: () => void;
    onSelect: (idea: InterviewIdea) => void;
}

function IdeaHelperPopup({ apiKey, isOpen, onClose, onSelect }: IdeaHelperPopupProps) {
    const [ideas, setIdeas] = useState<InterviewIdea[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [progressMessage, setProgressMessage] = useState('');
    const [error, setError] = useState<string | null>(null);

    const handleGenerateIdeas = async () => {
        if (!apiKey) {
            alert('API 키를 먼저 입력해주세요.');
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            const generatedIdeas = await generateInterviewIdeas(apiKey, setProgressMessage);
            setIdeas(generatedIdeas);
            setProgressMessage('');
        } catch (err) {
            setError(err instanceof Error ? err.message : '아이디어 생성 중 오류가 발생했습니다.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleIdeaChange = (index: number, field: keyof InterviewIdea, value: string) => {
        setIdeas(prev => {
            const updated = [...prev];
            updated[index] = { ...updated[index], [field]: value };
            return updated;
        });
    };

    const handleSelectIdea = (idea: InterviewIdea) => {
        onSelect(idea);
        onClose();
    };

    // Generate ideas when popup opens and no ideas yet
    if (isOpen && ideas.length === 0 && !isLoading && !error) {
        handleGenerateIdeas();
    }

    if (!isOpen) return null;

    return (
        <div className="idea-helper-overlay" onClick={onClose}>
            <div className="idea-helper-popup" onClick={e => e.stopPropagation()}>
                <div className="popup-header">
                    <h2>
                        <span className="popup-icon">💡</span>
                        아이디어 도움받기
                    </h2>
                    <button className="close-btn" onClick={onClose}>✕</button>
                </div>

                <p className="popup-description">
                    리포터와 구름이(포메라니안)의 인터뷰 대화 아이디어를 제안합니다.
                    <br />
                    원하는 아이디어를 수정하고 선택하세요!
                </p>

                {isLoading && (
                    <div className="loading-container">
                        <div className="loading-spinner"></div>
                        <p className="loading-text">{progressMessage || '아이디어 생성 중...'}</p>
                    </div>
                )}

                {error && (
                    <div className="error-container">
                        <span className="error-icon">⚠️</span>
                        <p className="error-text">{error}</p>
                        <button className="retry-btn" onClick={handleGenerateIdeas}>다시 시도</button>
                    </div>
                )}

                {!isLoading && !error && ideas.length > 0 && (
                    <>
                        <div className="ideas-grid">
                            {ideas.map((idea, index) => (
                                <div key={index} className="idea-card">
                                    <div className="idea-header">
                                        <span className="idea-number">아이디어 {index + 1}</span>
                                    </div>

                                    <div className="idea-field">
                                        <label>📍 장소</label>
                                        <input
                                            type="text"
                                            value={idea.location}
                                            onChange={e => handleIdeaChange(index, 'location', e.target.value)}
                                        />
                                    </div>

                                    <div className="idea-field">
                                        <label>⏰ 시간</label>
                                        <input
                                            type="text"
                                            value={idea.time}
                                            onChange={e => handleIdeaChange(index, 'time', e.target.value)}
                                        />
                                    </div>

                                    <div className="idea-field">
                                        <label>📝 상황</label>
                                        <input
                                            type="text"
                                            value={idea.situation}
                                            onChange={e => handleIdeaChange(index, 'situation', e.target.value)}
                                        />
                                    </div>

                                    <div className="idea-field dialogue-field">
                                        <label>🎤 리포터 대사</label>
                                        <textarea
                                            value={idea.reporterDialogue}
                                            onChange={e => handleIdeaChange(index, 'reporterDialogue', e.target.value)}
                                            rows={2}
                                        />
                                    </div>

                                    <div className="idea-field dialogue-field goreumi-dialogue">
                                        <label>🐕 구름이 대답</label>
                                        <textarea
                                            value={idea.gooreumiDialogue}
                                            onChange={e => handleIdeaChange(index, 'gooreumiDialogue', e.target.value)}
                                            rows={2}
                                        />
                                    </div>

                                    <button
                                        className="select-btn"
                                        onClick={() => handleSelectIdea(idea)}
                                    >
                                        ✓ 선택
                                    </button>
                                </div>
                            ))}
                        </div>

                        <div className="popup-footer">
                            <button className="regenerate-btn" onClick={handleGenerateIdeas}>
                                <span className="btn-icon">🔄</span>
                                다시 제안
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

export default IdeaHelperPopup;
