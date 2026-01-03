import React from 'react';

interface YoutubeReferenceProps {
    youtubeUrl: string;
    onYoutubeUrlChange: (url: string) => void;
    disabled?: boolean;
}

const YoutubeReference: React.FC<YoutubeReferenceProps> = ({
    youtubeUrl,
    onYoutubeUrlChange,
    disabled
}) => {
    // Extract video ID from YouTube URL
    const getVideoId = (url: string): string | null => {
        const patterns = [
            /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
        ];

        for (const pattern of patterns) {
            const match = url.match(pattern);
            if (match) return match[1];
        }
        return null;
    };

    const videoId = getVideoId(youtubeUrl);
    const thumbnailUrl = videoId ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : null;

    return (
        <div className="youtube-reference-section">
            <label className="input-label">
                <span className="label-icon">🎥</span>
                참조 유튜브 링크
                <span className="optional-badge">선택</span>
            </label>

            <div className="youtube-input-wrapper">
                <input
                    type="text"
                    value={youtubeUrl}
                    onChange={(e) => onYoutubeUrlChange(e.target.value)}
                    placeholder="https://www.youtube.com/watch?v=... (선택 사항)"
                    className="youtube-input"
                    disabled={disabled}
                />
                {youtubeUrl && (
                    <button
                        className="clear-btn"
                        onClick={() => onYoutubeUrlChange('')}
                        title="삭제"
                        disabled={disabled}
                    >
                        ✕
                    </button>
                )}
            </div>

            {thumbnailUrl && (
                <div className="youtube-preview">
                    <a
                        href={youtubeUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="youtube-thumbnail-link"
                    >
                        <img
                            src={thumbnailUrl}
                            alt="YouTube thumbnail"
                            className="youtube-thumbnail"
                        />
                        <div className="play-overlay">
                            <span className="play-icon">▶</span>
                        </div>
                    </a>
                    <p className="youtube-hint">
                        이 영상의 스타일을 참조하여 동영상을 생성합니다
                    </p>
                </div>
            )}

            <p className="input-hint">
                동영상 생성 시 참고할 유튜브 영상의 URL을 입력하세요 (선택 사항)
            </p>
        </div>
    );
};

export default YoutubeReference;
