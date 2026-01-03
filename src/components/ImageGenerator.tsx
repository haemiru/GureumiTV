import { useState, useRef, useCallback } from 'react';
import type { ImageData, InterviewIdea } from '../types';
import { detectAspectRatio, fileToBase64, getImageDimensions } from '../services/geminiApi';
import ResizableSidebar from './ResizableSidebar';
import IdeaHelperPopup from './IdeaHelperPopup';
import './ResizableSidebar.css';
import './ImageGenerator.css';

export type AspectRatio = '16:9' | '9:16' | '1:1';

interface ImageGeneratorProps {
    generatedImage: ImageData | null;
    onImageGenerated: (imageData: ImageData) => void;
    onGenerate: (
        location: string,
        time: string,
        situation: string,
        aspectRatio: AspectRatio,
        refImage?: { base64: string; mimeType: string } | null
    ) => Promise<void>;
    isGenerating: boolean;
    onNextStep: () => void;
    apiKey: string;
    // Lifted state for persistence between steps
    location: string;
    onLocationChange: (value: string) => void;
    time: string;
    onTimeChange: (value: string) => void;
    situation: string;
    onSituationChange: (value: string) => void;
    situationRefImage: { base64: string; mimeType: string } | null;
    onSituationRefImageChange: (image: { base64: string; mimeType: string } | null) => void;
}

function ImageGenerator({
    generatedImage,
    onImageGenerated,
    isGenerating,
    onGenerate,
    onNextStep,
    apiKey,
    location,
    onLocationChange,
    time,
    onTimeChange,
    situation,
    onSituationChange,
    situationRefImage,
    onSituationRefImageChange,
}: ImageGeneratorProps) {
    const [aspectRatio, setAspectRatio] = useState<AspectRatio>('9:16');
    const [isDragging, setIsDragging] = useState(false);
    const [uploadMode, setUploadMode] = useState<'generate' | 'upload'>('generate');
    const [isIdeaPopupOpen, setIsIdeaPopupOpen] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const refImageInputRef = useRef<HTMLInputElement>(null);

    const handleIdeaSelect = (idea: InterviewIdea) => {
        onLocationChange(idea.location);
        onTimeChange(idea.time);
        // Combine situation with dialogues for the scene description
        const situationWithDialogue = `리포터: "${idea.reporterDialogue}"
구름이: "${idea.gooreumiDialogue}"

${idea.situation}`;
        onSituationChange(situationWithDialogue);
    };


    const handleGenerate = async () => {
        if (!location.trim() || !time.trim() || !situation.trim()) {
            alert('모든 필드를 입력해주세요.');
            return;
        }
        await onGenerate(location, time, situation, aspectRatio, situationRefImage);
    };

    const handleRefImageUpload = useCallback(async (file: File) => {
        if (!file.type.startsWith('image/')) {
            alert('이미지 파일만 업로드 가능합니다.');
            return;
        }
        try {
            const reader = new FileReader();
            reader.onload = () => {
                const result = reader.result as string;
                const base64 = result.split(',')[1];
                onSituationRefImageChange({ base64, mimeType: file.type });
            };
            reader.readAsDataURL(file);
        } catch (error) {
            console.error('Error processing reference image:', error);
            alert('참고 이미지 처리 중 오류가 발생했습니다.');
        }
    }, [onSituationRefImageChange]);

    const handleRefImageInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            handleRefImageUpload(file);
        }
    }, [handleRefImageUpload]);

    const handleRefImageZoneClick = () => {
        refImageInputRef.current?.click();
    };

    const handleFileUpload = useCallback(async (file: File) => {
        if (!file.type.startsWith('image/')) {
            alert('이미지 파일만 업로드 가능합니다.');
            return;
        }

        try {
            const preview = URL.createObjectURL(file);
            const dimensions = await getImageDimensions(file);
            const { base64, mimeType } = await fileToBase64(file);
            const detectedRatio = detectAspectRatio(dimensions.width, dimensions.height);

            const imageData: ImageData = {
                file,
                preview,
                width: dimensions.width,
                height: dimensions.height,
                base64,
                mimeType,
                aspectRatio: detectedRatio,
            };

            onImageGenerated(imageData);
        } catch (error) {
            console.error('Error processing uploaded image:', error);
            alert('이미지 처리 중 오류가 발생했습니다.');
        }
    }, [onImageGenerated]);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files[0];
        if (file) {
            handleFileUpload(file);
        }
    }, [handleFileUpload]);

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    }, []);

    const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            handleFileUpload(file);
        }
    }, [handleFileUpload]);

    const handleUploadZoneClick = () => {
        fileInputRef.current?.click();
    };

    const canProceed = generatedImage !== null;
    const hasGooreumiKeyword = situation.includes('구름이');

    return (
        <div className="image-generator">
            {/* Left Sidebar */}
            <ResizableSidebar defaultWidth={400} minWidth={300} maxWidth={600} className="sidebar">
                {/* Idea Helper Button */}
                {uploadMode === 'generate' && (
                    <button
                        className="idea-helper-btn"
                        onClick={() => setIsIdeaPopupOpen(true)}
                        disabled={isGenerating}
                    >
                        <span className="btn-icon">💡</span>
                        아이디어 도움받기
                    </button>
                )}

                {/* Mode Toggle */}
                <div className="card mode-toggle-card">
                    <div className="mode-toggle">
                        <button
                            className={`mode-btn ${uploadMode === 'generate' ? 'active' : ''}`}
                            onClick={() => setUploadMode('generate')}
                        >
                            <span className="mode-icon">🎨</span>
                            이미지 생성
                        </button>
                        <button
                            className={`mode-btn ${uploadMode === 'upload' ? 'active' : ''}`}
                            onClick={() => setUploadMode('upload')}
                        >
                            <span className="mode-icon">📁</span>
                            이미지 업로드
                        </button>
                    </div>
                </div>

                {uploadMode === 'generate' ? (
                    <>
                        {/* Scene Settings */}
                        <div className="card scene-card">
                            <h3 className="section-title">
                                <span className="label-icon">🎬</span>
                                장면 설정
                            </h3>

                            <div className="input-group">
                                <label className="input-label">
                                    <span className="label-icon">📍</span>
                                    장소
                                </label>
                                <input
                                    type="text"
                                    className="text-input"
                                    placeholder="예: 서울 강남 거리, 공원, 카페..."
                                    value={location}
                                    onChange={(e) => onLocationChange(e.target.value)}
                                    disabled={isGenerating}
                                />
                            </div>

                            <div className="input-group">
                                <label className="input-label">
                                    <span className="label-icon">⏰</span>
                                    시간
                                </label>
                                <input
                                    type="text"
                                    className="text-input"
                                    placeholder="예: 저녁 노을, 화창한 오후, 밤..."
                                    value={time}
                                    onChange={(e) => onTimeChange(e.target.value)}
                                    disabled={isGenerating}
                                />
                            </div>

                            <div className="input-group">
                                <label className="input-label">
                                    <span className="label-icon">📝</span>
                                    상황
                                </label>
                                <textarea
                                    className="text-input textarea"
                                    placeholder="예: 구름이가 산책하며 즐거워하는 모습..."
                                    value={situation}
                                    onChange={(e) => onSituationChange(e.target.value)}
                                    disabled={isGenerating}
                                    rows={3}
                                />
                                {hasGooreumiKeyword && (
                                    <span className="reference-badge">🐕 구름이(흰색 포메라니안) 자동 적용</span>
                                )}
                            </div>

                            {/* Reference Image Upload */}
                            <div className="input-group">
                                <label className="input-label">
                                    <span className="label-icon">🖼️</span>
                                    참고 이미지 (선택사항)
                                </label>
                                <div
                                    className={`ref-image-zone ${situationRefImage ? 'has-image' : ''}`}
                                    onClick={handleRefImageZoneClick}
                                >
                                    {situationRefImage ? (
                                        <div className="ref-image-preview">
                                            <img
                                                src={`data:${situationRefImage.mimeType};base64,${situationRefImage.base64}`}
                                                alt="참고 이미지"
                                            />
                                            <button
                                                className="remove-ref-image"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onSituationRefImageChange(null);
                                                }}
                                                disabled={isGenerating}
                                            >
                                                ✕
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="ref-image-placeholder">
                                            <span className="upload-icon">📤</span>
                                            <span className="upload-text">클릭하여 참고 이미지 추가</span>
                                        </div>
                                    )}
                                </div>
                                <input
                                    ref={refImageInputRef}
                                    type="file"
                                    accept="image/*"
                                    className="hidden-input"
                                    onChange={handleRefImageInputChange}
                                />
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="action-buttons">
                            {/* Aspect Ratio Selection */}
                            <div className="aspect-ratio-group">
                                <label className="input-label">
                                    <span className="label-icon">📐</span>
                                    이미지 비율
                                </label>
                                <div className="aspect-ratio-options">
                                    <button
                                        type="button"
                                        className={`aspect-ratio-btn ${aspectRatio === '16:9' ? 'active' : ''}`}
                                        onClick={() => setAspectRatio('16:9')}
                                        disabled={isGenerating}
                                    >
                                        16:9
                                    </button>
                                    <button
                                        type="button"
                                        className={`aspect-ratio-btn ${aspectRatio === '9:16' ? 'active' : ''}`}
                                        onClick={() => setAspectRatio('9:16')}
                                        disabled={isGenerating}
                                    >
                                        9:16
                                    </button>
                                    <button
                                        type="button"
                                        className={`aspect-ratio-btn ${aspectRatio === '1:1' ? 'active' : ''}`}
                                        onClick={() => setAspectRatio('1:1')}
                                        disabled={isGenerating}
                                    >
                                        1:1
                                    </button>
                                </div>
                            </div>

                            <button
                                className={`generate-btn ${isGenerating ? 'generating' : ''}`}
                                onClick={handleGenerate}
                                disabled={isGenerating || !location.trim() || !time.trim() || !situation.trim()}
                            >
                                {isGenerating ? (
                                    <>
                                        <span className="btn-spinner"></span>
                                        이미지 생성 중...
                                    </>
                                ) : (
                                    <>
                                        <span className="btn-icon">🎨</span>
                                        {generatedImage ? '이미지 재생성' : '이미지 생성'}
                                    </>
                                )}
                            </button>
                        </div>
                    </>
                ) : (
                    /* Upload Mode */
                    <div className="card upload-card">
                        <h3 className="section-title">
                            <span className="label-icon">📁</span>
                            이미지 업로드
                        </h3>
                        <p className="upload-description">
                            기존에 가지고 있는 이미지를 업로드하여 동영상을 생성할 수 있습니다.
                        </p>

                        <div
                            className={`upload-zone ${isDragging ? 'dragging' : ''} ${generatedImage ? 'has-image' : ''}`}
                            onClick={handleUploadZoneClick}
                            onDrop={handleDrop}
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                        >
                            {generatedImage ? (
                                <div className="preview-container">
                                    <img
                                        src={generatedImage.preview}
                                        alt="업로드된 이미지"
                                        className="preview-image"
                                    />
                                    <div className="image-overlay">
                                        <span className="change-text">클릭하여 변경</span>
                                    </div>
                                </div>
                            ) : (
                                <div className="upload-placeholder">
                                    <span className="upload-icon">📤</span>
                                    <p className="upload-text">클릭하거나 이미지를 드래그하세요</p>
                                    <p className="upload-hint">JPG, PNG, WebP 지원</p>
                                </div>
                            )}
                        </div>

                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            className="hidden-input"
                            onChange={handleFileInputChange}
                        />

                        {generatedImage && (
                            <div className="image-info">
                                <span className="info-badge">
                                    <span className="info-label">크기</span>
                                    <span className="info-value">{generatedImage.width} × {generatedImage.height}</span>
                                </span>
                                <span className="info-badge aspect-ratio-badge">
                                    <span className="info-label">비율</span>
                                    <span className="info-value">{generatedImage.aspectRatio}</span>
                                </span>
                            </div>
                        )}
                    </div>
                )}

                {/* Video Generation Button - always visible */}
                <div className="action-buttons next-step-section">
                    <button
                        className="next-step-btn"
                        onClick={onNextStep}
                        disabled={!canProceed}
                    >
                        <span className="btn-icon">🎬</span>
                        <span>동영상 생성</span>
                    </button>
                </div>
            </ResizableSidebar>

            {/* Right Preview */}
            <main className="main-frame">
                <div className="card preview-card">
                    <h3 className="section-title">
                        <span className="label-icon">🖼️</span>
                        {uploadMode === 'generate' ? '생성된 이미지' : '업로드된 이미지'}
                    </h3>

                    <div className="image-preview-area">
                        {isGenerating ? (
                            <div className="generating-placeholder">
                                <div className="generating-animation">
                                    <div className="pulse-ring"></div>
                                    <span className="generating-icon">🎨</span>
                                </div>
                                <p className="generating-text">이미지를 생성하고 있습니다...</p>
                            </div>
                        ) : generatedImage ? (
                            <div className="generated-image-container">
                                <img
                                    src={generatedImage.preview}
                                    alt="이미지"
                                    className="generated-image"
                                />
                                <div className="image-info">
                                    <span className="info-badge">
                                        <span className="info-label">크기</span>
                                        <span className="info-value">{generatedImage.width} × {generatedImage.height}</span>
                                    </span>
                                </div>
                                <button
                                    className="download-image-btn"
                                    onClick={() => {
                                        const link = document.createElement('a');
                                        link.href = generatedImage.preview;
                                        link.download = `generated-image-${Date.now()}.png`;
                                        document.body.appendChild(link);
                                        link.click();
                                        document.body.removeChild(link);
                                    }}
                                >
                                    <span className="btn-icon">📥</span>
                                    이미지 다운로드
                                </button>
                            </div>
                        ) : (
                            <div className="empty-placeholder">
                                <span className="placeholder-icon">🖼️</span>
                                <p className="placeholder-text">
                                    {uploadMode === 'generate' ? (
                                        <>
                                            장소, 시간, 상황을 입력하고<br />
                                            "이미지 생성" 버튼을 클릭하세요
                                        </>
                                    ) : (
                                        <>
                                            이미지를 업로드하거나<br />
                                            드래그 앤 드롭하세요
                                        </>
                                    )}
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </main>

            {/* Idea Helper Popup */}
            <IdeaHelperPopup
                apiKey={apiKey}
                isOpen={isIdeaPopupOpen}
                onClose={() => setIsIdeaPopupOpen(false)}
                onSelect={handleIdeaSelect}
            />
        </div>
    );
}

export default ImageGenerator;

