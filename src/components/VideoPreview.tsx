import React from 'react';
import type { GeneratedVideo } from '../types';

interface VideoPreviewProps {
    videos: GeneratedVideo[];
    isGenerating: boolean;
    currentStep: number;
    progressMessage: string;
    onStop?: () => void;
}

const VideoPreview: React.FC<VideoPreviewProps> = ({
    videos,
    isGenerating,
    currentStep,
    progressMessage,
    onStop,
}) => {
    const downloadVideo = (video: GeneratedVideo) => {
        const link = document.createElement('a');
        link.href = video.videoUrl;
        link.download = `video-${video.step}.mp4`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const downloadAllVideos = async () => {
        for (const video of videos) {
            downloadVideo(video);
            await new Promise(resolve => setTimeout(resolve, 500)); // Small delay between downloads
        }
    };

    // Show stop button when generating and at least one video is completed
    const showStopButton = isGenerating && videos.length >= 1;

    return (
        <div className="video-preview-section">
            <div className="section-header">
                <span className="label-icon">🎬</span>
                <h3>생성된 동영상</h3>
                {videos.length === 4 && (
                    <button
                        className="download-all-btn"
                        onClick={downloadAllVideos}
                    >
                        📥 전체 다운로드
                    </button>
                )}
            </div>

            {isGenerating && (
                <div className="generation-progress">
                    <div className="progress-bar-container">
                        <div
                            className="progress-bar"
                            style={{ width: `${(currentStep / 4) * 100}%` }}
                        />
                    </div>
                    <div className="progress-info">
                        <span className="progress-step">{currentStep} / 4</span>
                        <span className="progress-message">{progressMessage}</span>
                        {showStopButton && (
                            <button
                                className="stop-btn"
                                onClick={onStop}
                                title="생성 중지"
                            >
                                ⏹️ 중지
                            </button>
                        )}
                    </div>
                    <div className="loading-animation">
                        <div className="spinner"></div>
                    </div>
                </div>
            )}

            <div className="videos-grid">
                {[0, 1, 2, 3].map((index) => {
                    const video = videos.find(v => v.step === index + 1);
                    const isCurrentlyGenerating = isGenerating && currentStep === index + 1;

                    return (
                        <div
                            key={index}
                            className={`video-card ${video ? 'completed' : ''} ${isCurrentlyGenerating ? 'generating' : ''}`}
                        >
                            <div className="video-header">
                                <span className="video-number">동영상 {index + 1}</span>
                                {video && (
                                    <button
                                        className="download-btn"
                                        onClick={() => downloadVideo(video)}
                                        title="다운로드"
                                    >
                                        📥
                                    </button>
                                )}
                            </div>

                            <div className="video-content">
                                {video ? (
                                    <video
                                        src={video.videoUrl}
                                        controls
                                        className="video-player"
                                        loop
                                    >
                                        Your browser does not support the video tag.
                                    </video>
                                ) : isCurrentlyGenerating ? (
                                    <div className="video-placeholder generating">
                                        <div className="generating-animation">
                                            <div className="pulse-ring"></div>
                                            <span className="generating-icon">🎥</span>
                                        </div>
                                        <span className="placeholder-text">생성 중...</span>
                                    </div>
                                ) : (
                                    <div className="video-placeholder">
                                        <span className="placeholder-icon">🎞️</span>
                                        <span className="placeholder-text">대기 중</span>
                                    </div>
                                )}
                            </div>

                            {video && (
                                <div className="video-prompt">
                                    <span className="prompt-label">프롬프트:</span>
                                    <p className="prompt-text">{video.prompt}</p>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default VideoPreview;
