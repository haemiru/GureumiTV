import { useState, useCallback, useRef } from 'react';
import ApiKeyInput from './components/ApiKeyInput';
import StepIndicator from './components/StepIndicator';
import ImageGenerator from './components/ImageGenerator';
import PromptInput from './components/PromptInput';
import VideoPreview from './components/VideoPreview';
import DialogueRecommendation from './components/DialogueRecommendation';
import ResizableSidebar from './components/ResizableSidebar';
import { generateSceneImage, generateVideosSequentially } from './services/geminiApi';
import type { ImageData, GeneratedVideo, VideoDuration } from './types';
import './components/ResizableSidebar.css';
import './App.css';

const DEFAULT_API_KEY = 'AIzaSyDD6uRSSIgqMFOjFhsesMS8DEZOzkc8WaU';

function App() {
  const [apiKey, setApiKey] = useState(DEFAULT_API_KEY);

  // Step management (1: Image Generation, 2: Video Generation)
  const [currentAppStep, setCurrentAppStep] = useState<1 | 2>(1);

  // Step 1: Image generation state
  const [generatedImage, setGeneratedImage] = useState<ImageData | null>(null);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);

  // Step 1: Scene settings state (lifted from ImageGenerator for persistence between steps)
  const [sceneLocation, setSceneLocation] = useState('');
  const [sceneTime, setSceneTime] = useState('');
  const [sceneSituation, setSceneSituation] = useState('');
  const [situationRefImage, setSituationRefImage] = useState<{ base64: string; mimeType: string } | null>(null);

  // Step 2: Video generation state
  const [imageData, setImageData] = useState<ImageData | null>(null);
  const [prompts, setPrompts] = useState<string[]>(['', '', '', '']);
  const [videoDuration, setVideoDuration] = useState<VideoDuration>(8);
  const [videos, setVideos] = useState<GeneratedVideo[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentVideoStep, setCurrentVideoStep] = useState(0);
  const [progressMessage, setProgressMessage] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Ref to track if generation should be stopped
  const shouldStopRef = useRef(false);

  // Step 1: Image generation handler
  const handleGenerateImage = async (
    location: string,
    time: string,
    situation: string,
    aspectRatio: '16:9' | '9:16' | '1:1',
    refImage?: { base64: string; mimeType: string } | null
  ) => {
    if (!apiKey.trim()) {
      setError('API 키를 입력해주세요.');
      return;
    }

    setError(null);
    setIsGeneratingImage(true);

    try {
      const result = await generateSceneImage(
        apiKey,
        location,
        time,
        situation,
        (message) => setProgressMessage(message),
        aspectRatio,
        refImage
      );
      setGeneratedImage(result);
      // Also set as imageData for Step 2
      setImageData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : '이미지 생성 중 오류가 발생했습니다.');
    } finally {
      setIsGeneratingImage(false);
    }
  };

  // Navigation to Step 2
  const handleNextStep = () => {
    if (generatedImage) {
      setImageData(generatedImage);
      setCurrentAppStep(2);
    }
  };

  // Navigation back to Step 1
  const handleStepChange = (step: 1 | 2) => {
    if (step === 2 && !generatedImage) return;
    setCurrentAppStep(step);
  };

  // Reset everything and go to first screen
  const handleReset = () => {
    // Reset Step 1 scene settings state
    setSceneLocation('');
    setSceneTime('');
    setSceneSituation('');
    setSituationRefImage(null);

    // Reset Step 1 image state
    setGeneratedImage(null);
    setIsGeneratingImage(false);

    // Reset Step 2 state
    setImageData(null);
    setPrompts(['', '', '', '']);
    setVideoDuration(8);
    setVideos([]);
    setIsGenerating(false);
    setCurrentVideoStep(0);
    setProgressMessage('');
    setError(null);
    shouldStopRef.current = false;

    // Go to Step 1
    setCurrentAppStep(1);
  };

  // Step 2: Video generation handlers
  const handleVideoGenerated = useCallback((video: GeneratedVideo) => {
    setVideos(prev => [...prev, video]);
  }, []);

  const handleStop = useCallback(() => {
    shouldStopRef.current = true;
    setProgressMessage('생성 중지 중...');
  }, []);

  const handleGenerate = async () => {
    if (!apiKey.trim()) {
      setError('API 키를 입력해주세요.');
      return;
    }

    if (!imageData) {
      setError('이미지를 업로드해주세요.');
      return;
    }

    // Get the number of scenes based on duration
    const sceneCount = videoDuration / 8;

    // Get prompts for the selected duration
    const promptsForDuration = prompts.slice(0, sceneCount);

    // Check if at least the first prompt is filled
    if (!promptsForDuration[0]?.trim()) {
      setError('최소한 장면 1의 프롬프트를 입력해주세요.');
      return;
    }

    // Filter to only include prompts that have content
    const filledPrompts = promptsForDuration.filter(p => p.trim());
    if (filledPrompts.length === 0) {
      setError('최소한 하나의 장면 프롬프트를 입력해주세요.');
      return;
    }

    setError(null);
    setIsGenerating(true);
    setVideos([]);
    setCurrentVideoStep(1);
    shouldStopRef.current = false;

    try {
      // Generate videos sequentially - each video starts from the last frame of the previous one
      await generateVideosSequentially(
        apiKey,
        imageData,
        filledPrompts,
        (step, message) => {
          setCurrentVideoStep(step);
          setProgressMessage(message);
        },
        handleVideoGenerated,
        () => shouldStopRef.current
      );

      if (shouldStopRef.current) {
        setProgressMessage('생성이 중지되었습니다.');
      } else {
        const totalSeconds = filledPrompts.length * 8;
        setProgressMessage(`총 ${totalSeconds}초 영상 (${filledPrompts.length}개) 생성 완료!`);
      }
    } catch (err) {
      if (!shouldStopRef.current) {
        setError(err instanceof Error ? err.message : '동영상 생성 중 오류가 발생했습니다.');
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const canGenerate = apiKey.trim() && imageData && prompts[0].trim() && !isGenerating;
  const canProceedToStep2 = generatedImage !== null;

  return (
    <div className="app">
      {/* Header with title on left and API key on right */}
      <header className="app-header">
        <div className="header-left">
          <h1 className="app-title" onClick={handleReset} style={{ cursor: 'pointer' }} title="클릭하면 처음으로 돌아갑니다">
            <span className="title-icon">📺</span>
            Gureumi TV
          </h1>
        </div>
        <div className="header-right">
          <ApiKeyInput apiKey={apiKey} onApiKeyChange={setApiKey} />
        </div>
      </header>

      {/* Step Indicator */}
      <StepIndicator
        currentStep={currentAppStep}
        onStepChange={handleStepChange}
        canProceedToStep2={canProceedToStep2}
      />

      {/* Step 1: Image Generation */}
      {currentAppStep === 1 && (
        <ImageGenerator
          generatedImage={generatedImage}
          onImageGenerated={setGeneratedImage}
          onGenerate={handleGenerateImage}
          isGenerating={isGeneratingImage}
          onNextStep={handleNextStep}
          apiKey={apiKey}
          location={sceneLocation}
          onLocationChange={setSceneLocation}
          time={sceneTime}
          onTimeChange={setSceneTime}
          situation={sceneSituation}
          onSituationChange={setSceneSituation}
          situationRefImage={situationRefImage}
          onSituationRefImageChange={setSituationRefImage}
        />
      )}

      {/* Step 2: Video Generation */}
      {currentAppStep === 2 && (
        <div className="app-body">
          {/* Left Sidebar: Image preview and prompts */}
          <ResizableSidebar defaultWidth={400} minWidth={300} maxWidth={600} className="sidebar">
            {/* Simple Image Preview */}
            <div className="card image-preview-card">
              <div className="section-header">
                <span className="label-icon">🖼️</span>
                <h3>선택된 이미지</h3>
              </div>
              {imageData && (
                <div className="selected-image-preview">
                  <img
                    src={imageData.preview}
                    alt="선택된 이미지"
                    className="preview-thumbnail"
                  />
                  <div className="image-meta">
                    <span className="meta-badge">{imageData.width} × {imageData.height}</span>
                    <span className="meta-badge">{imageData.aspectRatio}</span>
                  </div>
                </div>
              )}
            </div>

            <div className="card prompts-card">
              <PromptInput
                prompts={prompts}
                onPromptsChange={setPrompts}
                disabled={isGenerating}
                videoDuration={videoDuration}
                onVideoDurationChange={setVideoDuration}
              />
            </div>

            {/* Generate Button */}
            <div className="generate-section">
              {error && (
                <div className="error-message">
                  <span className="error-icon">⚠️</span>
                  {error}
                </div>
              )}

              <button
                className="prev-step-btn"
                onClick={() => setCurrentAppStep(1)}
                disabled={isGenerating}
              >
                <span className="btn-icon">←</span>
                이전 단계
              </button>

              <button
                className={`generate-btn ${isGenerating ? 'generating stop-btn' : ''}`}
                onClick={isGenerating ? handleStop : handleGenerate}
                disabled={!isGenerating && !canGenerate}
              >
                {isGenerating ? (
                  <>
                    <span className="btn-icon">⏹️</span>
                    중지
                  </>
                ) : (
                  <>
                    <span className="btn-icon">🚀</span>
                    동영상 생성 시작
                  </>
                )}
              </button>
            </div>
          </ResizableSidebar>

          {/* Right Frame: Video generation and preview */}
          <main className="main-frame">
            {/* Video Preview Section */}
            <div className="card videos-card">
              <VideoPreview
                videos={videos}
                isGenerating={isGenerating}
                currentStep={currentVideoStep}
                progressMessage={progressMessage}
                onStop={handleStop}
              />
            </div>

            {/* Dialogue Recommendation Section - shows after all videos are generated */}
            <div className="card dialogue-card">
              <DialogueRecommendation
                apiKey={apiKey}
                prompts={prompts.filter(p => p.trim())}
                isVisible={videos.length > 0 && videos.length === prompts.filter(p => p.trim()).length && !isGenerating}
              />
            </div>
          </main>
        </div>
      )}

      <footer className="app-footer">
        <p>Powered by Google Gemini Veo 3.1 & Imagen 3 API</p>
      </footer>
    </div>
  );
}

export default App;
