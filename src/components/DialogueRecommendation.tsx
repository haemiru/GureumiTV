import React, { useState } from 'react';
import { generateDialogueRecommendations } from '../services/geminiApi';
import type { DialogueAnalysisResult } from '../types';

interface DialogueRecommendationProps {
    apiKey: string;
    prompts: string[];
    isVisible: boolean;
}

const DialogueRecommendation: React.FC<DialogueRecommendationProps> = ({
    apiKey,
    prompts,
    isVisible,
}) => {
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [progressMessage, setProgressMessage] = useState('');
    const [result, setResult] = useState<DialogueAnalysisResult | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleAnalyze = async () => {
        setIsAnalyzing(true);
        setError(null);
        setResult(null);

        try {
            const analysisResult = await generateDialogueRecommendations(
                apiKey,
                prompts,
                setProgressMessage
            );
            setResult(analysisResult);
            setProgressMessage('분석 완료!');
        } catch (err) {
            setError(err instanceof Error ? err.message : '대사 분석 중 오류가 발생했습니다.');
        } finally {
            setIsAnalyzing(false);
        }
    };

    if (!isVisible) {
        return null;
    }

    return (
        <div className="dialogue-recommendation-section">
            <div className="section-header">
                <span className="label-icon">💬</span>
                <h3>대사 추천</h3>
            </div>
            <p className="section-description">
                마지막 동영상(동영상 4)의 내용을 분석하여 익살스러운 대사를 추천합니다.
            </p>

            {!result && !isAnalyzing && (
                <button className="analyze-btn" onClick={handleAnalyze}>
                    <span className="btn-icon">🎭</span>
                    대사 분석 시작
                </button>
            )}

            {isAnalyzing && (
                <div className="analysis-progress">
                    <div className="loading-animation">
                        <div className="spinner"></div>
                    </div>
                    <span className="progress-message">{progressMessage}</span>
                </div>
            )}

            {error && (
                <div className="error-message">
                    <span className="error-icon">⚠️</span>
                    {error}
                </div>
            )}

            {result && (
                <div className="analysis-result">
                    {/* Evaluation Criteria Section */}
                    <div className="criteria-section">
                        <h4 className="subsection-title">
                            <span className="subsection-icon">📋</span>
                            평가 기준
                        </h4>
                        <ul className="criteria-list">
                            {result.evaluationCriteria.map((criterion, index) => (
                                <li key={index} className="criterion-item">
                                    {criterion}
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Recommendations Section */}
                    <div className="recommendations-section">
                        <h4 className="subsection-title">
                            <span className="subsection-icon">🎬</span>
                            추천 대사
                        </h4>
                        <div className="recommendations-grid">
                            {result.recommendations.map((rec, index) => (
                                <div key={index} className="recommendation-card">
                                    <div className="recommendation-header">
                                        <span className="recommendation-number">대사 {index + 1}</span>
                                        <span className="timing-badge">
                                            ⏱️ {rec.timingSeconds}초
                                        </span>
                                    </div>
                                    <div className="dialogue-content">
                                        <span className="dialogue-quote">"</span>
                                        <p className="dialogue-text">{rec.dialogue}</p>
                                        <span className="dialogue-quote">"</span>
                                    </div>
                                    <div className="reasoning-section">
                                        <span className="reasoning-label">💡 재미 포인트:</span>
                                        <p className="reasoning-text">{rec.reasoning}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Re-analyze Button */}
                    <button className="reanalyze-btn" onClick={handleAnalyze}>
                        <span className="btn-icon">🔄</span>
                        다시 분석하기
                    </button>
                </div>
            )}
        </div>
    );
};

export default DialogueRecommendation;
