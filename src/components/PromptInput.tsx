import React from 'react';
import type { VideoDuration } from '../types';

interface PromptInputProps {
    prompts: string[];
    onPromptsChange: (prompts: string[]) => void;
    disabled?: boolean;
    videoDuration: VideoDuration;
    onVideoDurationChange: (duration: VideoDuration) => void;
}

const promptPlaceholders = [
    '첫 번째 장면 내용을 설명해주세요... (예: 구름이가 카메라를 향해 달려온다)',
    '두 번째 장면 내용을 설명해주세요... (예: 구름이가 고개를 갸웃거린다)',
    '세 번째 장면 내용을 설명해주세요... (예: 구름이가 혀를 내밀고 헥헥거린다)',
    '네 번째 장면 내용을 설명해주세요... (예: 구름이가 기분 좋게 웃는다)',
];

const promptLabels = [
    '장면 1',
    '장면 2',
    '장면 3',
    '장면 4',
];

const durationOptions: { value: VideoDuration; label: string; scenes: number }[] = [
    { value: 8, label: '8초', scenes: 1 },
    { value: 16, label: '16초', scenes: 2 },
    { value: 24, label: '24초', scenes: 3 },
    { value: 32, label: '32초', scenes: 4 },
];

const PromptInput: React.FC<PromptInputProps> = ({
    prompts,
    onPromptsChange,
    disabled,
    videoDuration,
    onVideoDurationChange
}) => {
    const handlePromptChange = (index: number, value: string) => {
        const newPrompts = [...prompts];
        newPrompts[index] = value;
        onPromptsChange(newPrompts);
    };

    const handleDeleteScene = (index: number) => {
        if (index > 0 && !disabled) {
            const newPrompts = [...prompts];
            newPrompts[index] = ''; // Clear the prompt content
            onPromptsChange(newPrompts);
        }
    };

    // Get number of scenes based on duration
    const sceneCount = videoDuration / 8;

    return (
        <div className="prompt-input-section">
            {/* Duration Selection */}
            <div className="section-header">
                <span className="label-icon">⏱️</span>
                <h3>영상 길이 선택</h3>
            </div>
            <p className="section-description">
                영상 길이를 선택하면 해당 길이에 맞는 장면 수가 결정됩니다.
                <br />
                <strong>한 번에 생성되므로 목소리가 일관되게 유지됩니다!</strong>
            </p>
            <div className="duration-selector">
                {durationOptions.map((option) => (
                    <button
                        key={option.value}
                        className={`duration-btn ${videoDuration === option.value ? 'active' : ''}`}
                        onClick={() => onVideoDurationChange(option.value)}
                        disabled={disabled}
                        type="button"
                    >
                        <span className="duration-time">{option.label}</span>
                        <span className="duration-scenes">{option.scenes}개 장면</span>
                    </button>
                ))}
            </div>

            {/* Prompt Inputs */}
            <div className="section-header" style={{ marginTop: '24px' }}>
                <span className="label-icon">✍️</span>
                <h3>장면 내용 입력</h3>
            </div>
            <p className="section-description">
                각 장면에서 일어나는 내용을 상세히 설명해주세요.
                {sceneCount > 1 && ' 모든 장면이 하나의 영상으로 이어집니다.'}
            </p>

            <div className="prompts-container">
                {prompts.slice(0, sceneCount).map((prompt, index) => (
                    <div key={index} className="prompt-item">
                        <label className="prompt-label">
                            <span className="prompt-number">{index + 1}</span>
                            {promptLabels[index]}
                            {sceneCount > 1 && (
                                <span className="scene-duration-badge">~8초</span>
                            )}
                            {/* Delete button for scenes 2, 3, 4 */}
                            {index > 0 && prompt.trim() && (
                                <button
                                    className="scene-delete-btn"
                                    onClick={() => handleDeleteScene(index)}
                                    disabled={disabled}
                                    title={`장면 ${index + 1} 내용 삭제`}
                                    type="button"
                                >
                                    ✕
                                </button>
                            )}
                        </label>
                        <textarea
                            value={prompt}
                            onChange={(e) => handlePromptChange(index, e.target.value)}
                            placeholder={promptPlaceholders[index]}
                            className="prompt-textarea"
                            rows={3}
                            disabled={disabled}
                        />
                    </div>
                ))}
            </div>
        </div>
    );
};

export default PromptInput;

