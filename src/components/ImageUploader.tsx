import React, { useCallback, useState } from 'react';
import type { ImageData } from '../types';
import { fileToBase64, getImageDimensions, detectAspectRatio } from '../services/geminiApi';

interface ImageUploaderProps {
    imageData: ImageData | null;
    onImageUpload: (data: ImageData) => void;
}

const ImageUploader: React.FC<ImageUploaderProps> = ({ imageData, onImageUpload }) => {
    const [isDragging, setIsDragging] = useState(false);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);

    const handleFile = useCallback(async (file: File) => {
        if (!file.type.startsWith('image/')) {
            alert('이미지 파일만 업로드할 수 있습니다.');
            return;
        }

        try {
            const [{ base64, mimeType }, dimensions] = await Promise.all([
                fileToBase64(file),
                getImageDimensions(file),
            ]);

            const aspectRatio = detectAspectRatio(dimensions.width, dimensions.height);
            const preview = URL.createObjectURL(file);

            const data: ImageData = {
                file,
                preview,
                width: dimensions.width,
                height: dimensions.height,
                base64,
                mimeType,
                aspectRatio,
                originalWidth: dimensions.width,
                originalHeight: dimensions.height,
            };

            setPreviewUrl(preview);
            onImageUpload(data);
        } catch (error) {
            console.error('Error processing image:', error);
            alert('이미지 처리 중 오류가 발생했습니다.');
        }
    }, [onImageUpload]);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);

        const file = e.dataTransfer.files[0];
        if (file) {
            handleFile(file);
        }
    }, [handleFile]);

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    }, []);

    const handleDragLeave = useCallback(() => {
        setIsDragging(false);
    }, []);

    const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            handleFile(file);
        }
    }, [handleFile]);

    return (
        <div className="image-uploader-section">
            <label className="input-label">
                <span className="label-icon">🖼️</span>
                이미지 업로드
            </label>

            <div
                className={`upload-zone ${isDragging ? 'dragging' : ''} ${previewUrl ? 'has-image' : ''}`}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onClick={() => document.getElementById('file-input')?.click()}
            >
                {previewUrl ? (
                    <div className="preview-container">
                        <img src={previewUrl} alt="Preview" className="preview-image" />
                        <div className="image-overlay">
                            <span className="change-text">클릭하여 변경</span>
                        </div>
                    </div>
                ) : (
                    <div className="upload-placeholder">
                        <div className="upload-icon">📷</div>
                        <p className="upload-text">
                            이미지를 드래그하거나 클릭하여 업로드
                        </p>
                        <p className="upload-hint">
                            지원 형식: JPG, PNG, WebP
                        </p>
                    </div>
                )}

                <input
                    id="file-input"
                    type="file"
                    accept="image/*"
                    onChange={handleInputChange}
                    className="hidden-input"
                />
            </div>

            {imageData && (
                <div className="image-info">
                    <div className="info-badge">
                        <span className="info-label">원본 크기:</span>
                        <span className="info-value">{imageData.originalWidth} × {imageData.originalHeight}</span>
                    </div>
                    <div className="info-badge aspect-ratio-badge">
                        <span className="info-label">화면 비율:</span>
                        <span className="info-value">{imageData.aspectRatio}</span>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ImageUploader;
