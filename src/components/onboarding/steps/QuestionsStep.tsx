import React, { useState } from 'react';
import { useOnboarding } from '../OnboardingContext';
import { ONBOARDING_QUESTIONS } from '../../../types/onboarding';

const QuestionsStep: React.FC = () => {
  const { state, addResponse, setCurrentStep } = useOnboarding();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [showFollowUp, setShowFollowUp] = useState(false);
  const [selectedDiet, setSelectedDiet] = useState('');

  const currentQuestion = ONBOARDING_QUESTIONS[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / ONBOARDING_QUESTIONS.length) * 100;

  const handleAnswer = (answer: boolean) => {
    const response = {
      questionId: currentQuestion.id,
      question: currentQuestion.question,
      answer,
    };

    // If this is Q7 and answer is Yes, show follow-up
    if (currentQuestion.requiresFollowUp && answer) {
      setShowFollowUp(true);
      return;
    }

    // Save response and move to next
    addResponse(response);
    moveToNext();
  };

  const handleFollowUpSelect = (diet: string) => {
    setSelectedDiet(diet);
  };

  const handleFollowUpConfirm = () => {
    if (!selectedDiet) return;

    const response = {
      questionId: currentQuestion.id,
      question: currentQuestion.question,
      answer: true,
      followUp: selectedDiet,
    };

    addResponse(response);
    setShowFollowUp(false);
    setSelectedDiet('');
    moveToNext();
  };

  const moveToNext = () => {
    if (currentQuestionIndex < ONBOARDING_QUESTIONS.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      // All questions answered, move to processing
      setCurrentStep(5);
    }
  };

  if (showFollowUp) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] px-4">
        <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-lg w-full">
          <h3 className="text-2xl font-bold text-gray-800 mb-6 text-center">
            Which diet are you following?
          </h3>
          <div className="grid grid-cols-2 gap-3 mb-6">
            {currentQuestion.followUpOptions?.map((option) => (
              <button
                key={option}
                onClick={() => handleFollowUpSelect(option)}
                className={`py-3 px-4 rounded-xl font-medium transition-all ${
                  selectedDiet === option
                    ? 'text-white shadow-lg scale-105'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                style={selectedDiet === option ? { backgroundColor: '#ff6900' } : undefined}
              >
                {option}
              </button>
            ))}
          </div>
          <button
            onClick={handleFollowUpConfirm}
            disabled={!selectedDiet}
            className="w-full text-white font-semibold py-3 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ backgroundColor: selectedDiet ? '#ff6900' : '#999' }}
            onMouseEnter={(e) => !selectedDiet ? null : e.currentTarget.style.backgroundColor = '#e05e00'}
            onMouseLeave={(e) => !selectedDiet ? null : e.currentTarget.style.backgroundColor = '#ff6900'}
          >
            Confirm
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] px-4">
      <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-lg w-full">
        {/* Progress */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-gray-600">
              Question {currentQuestionIndex + 1} of {ONBOARDING_QUESTIONS.length}
            </span>
            <span className="text-sm font-medium text-fuzo-primary">
              {Math.round(progress)}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-fuzo-primary h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Question */}
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-3">
            {currentQuestion.question}
          </h2>
          <p className="text-gray-600 text-sm">{currentQuestion.helpText}</p>
        </div>

        {/* Answer Buttons */}
        <div className="flex gap-4 mb-6">
          <button
            onClick={() => handleAnswer(true)}
            className="flex-1 text-white font-semibold py-6 rounded-xl transition-all transform hover:scale-105 shadow-lg text-lg"
            style={{ backgroundColor: '#ff6900' }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#e05e00'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#ff6900'}
          >
            Yes
          </button>
          <button
            onClick={() => handleAnswer(false)}
            className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-6 rounded-xl transition-all transform hover:scale-105 shadow-md text-lg"
          >
            No
          </button>
        </div>

        {/* Response Count */}
        <p className="text-center text-gray-500 text-sm">
          {state.responses.length} {state.responses.length === 1 ? 'answer' : 'answers'} recorded
        </p>
      </div>
    </div>
  );
};

export default QuestionsStep;
