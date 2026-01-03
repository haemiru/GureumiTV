import './StepIndicator.css';

interface StepIndicatorProps {
    currentStep: 1 | 2;
    onStepChange: (step: 1 | 2) => void;
    canProceedToStep2: boolean;
}

function StepIndicator({ currentStep, onStepChange, canProceedToStep2 }: StepIndicatorProps) {
    return (
        <div className="step-indicator">
            <button
                className={`step-item ${currentStep === 1 ? 'active' : ''} ${currentStep > 1 ? 'completed' : ''}`}
                onClick={() => onStepChange(1)}
            >
                <span className="step-number">1</span>
                <span className="step-label">이미지 생성</span>
            </button>

            <div className="step-connector">
                <div className={`connector-line ${canProceedToStep2 ? 'active' : ''}`}></div>
            </div>

            <button
                className={`step-item ${currentStep === 2 ? 'active' : ''}`}
                onClick={() => canProceedToStep2 && onStepChange(2)}
                disabled={!canProceedToStep2}
            >
                <span className="step-number">2</span>
                <span className="step-label">동영상 생성</span>
            </button>
        </div>
    );
}

export default StepIndicator;
