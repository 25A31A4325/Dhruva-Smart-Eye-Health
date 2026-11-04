import React, { useState, useEffect } from 'react';
import {
  ClipboardCheck,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  RotateCcw,
  Sparkles,
  ShieldAlert,
  Info,
  Award,
} from 'lucide-react';
import { assessmentAPI } from '../services/api';
import { Card } from '../components/common/Card';
import { Badge } from '../components/common/Badge';

export const AssessmentPage = () => {
  const [questions, setQuestions] = useState([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const fetchQuestionsAndHistory = async () => {
    setLoading(true);
    try {
      const [qRes, hRes] = await Promise.all([
        assessmentAPI.getQuestions(),
        assessmentAPI.getHistory(),
      ]);
      setQuestions(qRes.data.questions || []);
      setHistory(hRes.data.history || []);
    } catch (err) {
      console.error('Failed to load questionnaire data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuestionsAndHistory();
  }, []);

  const handleSelectOption = (questionId, optionIndex) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: optionIndex,
    }));
  };

  const handleNext = () => {
    if (currentStep < questions.length - 1) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const formattedAnswers = questions.map((q) => ({
        question_id: q.id,
        selected_option_index: answers[q.id] ?? 0,
      }));

      const res = await assessmentAPI.submit({ answers: formattedAnswers });
      setResult(res.data);
      fetchQuestionsAndHistory();
    } catch (err) {
      console.error('Failed to submit questionnaire:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const resetSurvey = () => {
    setResult(null);
    setAnswers({});
    setCurrentStep(0);
  };

  if (loading) {
    return <div className="py-12 text-center text-xs text-slate-500">Loading educational questionnaire...</div>;
  }

  const currentQ = questions[currentStep];
  const progressPercent = Math.round(((currentStep + 1) / questions.length) * 100);
  const isCurrentAnswered = currentQ && answers[currentQ.id] !== undefined;
  const allAnswered = questions.length > 0 && questions.every((q) => answers[q.id] !== undefined);

  return (
    <div className="space-y-8 animate-fade-in max-w-4xl mx-auto">
      {/* Title */}
      <div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary-100 text-primary-800 text-xs font-semibold mb-2">
          <ClipboardCheck className="w-3.5 h-3.5 text-primary-600" />
          <span>Behavioral Health Assessment</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Digital Eye Strain Survey</h1>
        <p className="mt-1 text-xs sm:text-sm text-slate-600">
          A 7-point self-assessment tool evaluating tear film stability, ciliary accommodative stress, and workstation lighting.
        </p>
      </div>

      {!result ? (
        <Card className="p-8">
          {/* Progress Header */}
          <div className="mb-6">
            <div className="flex justify-between items-center text-xs font-semibold text-slate-500 mb-2">
              <span>Question {currentStep + 1} of {questions.length}</span>
              <span className="font-mono text-primary-600">{progressPercent}% Completed</span>
            </div>
            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-primary-600 transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {/* Question Body */}
          {currentQ && (
            <div className="space-y-6">
              <div>
                <span className="text-[10px] uppercase font-bold text-primary-700 tracking-wider bg-primary-50 px-2.5 py-1 rounded-md">
                  Category: {currentQ.category}
                </span>
                <h3 className="text-lg font-bold text-slate-900 mt-3 leading-snug">
                  {currentQ.question}
                </h3>
                <p className="text-xs text-slate-500 mt-1 italic">
                  Physiological context: {currentQ.explanation}
                </p>
              </div>

              {/* Radio Options */}
              <div className="space-y-3">
                {currentQ.options.map((opt, idx) => {
                  const isSelected = answers[currentQ.id] === idx;
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSelectOption(currentQ.id, idx)}
                      className={`w-full text-left p-4 rounded-xl border transition-all flex items-center justify-between ${
                        isSelected
                          ? 'border-primary-600 bg-primary-50/70 text-primary-950 font-semibold shadow-xs'
                          : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/60 text-slate-700'
                      }`}
                    >
                      <span className="text-xs">{opt.label}</span>
                      <div
                        className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                          isSelected ? 'border-primary-600 bg-primary-600' : 'border-slate-300'
                        }`}
                      >
                        {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Step Navigation Buttons */}
              <div className="pt-6 border-t border-slate-100 flex items-center justify-between">
                <button
                  type="button"
                  onClick={handlePrev}
                  disabled={currentStep === 0}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40 transition-all"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Previous</span>
                </button>

                {currentStep < questions.length - 1 ? (
                  <button
                    type="button"
                    onClick={handleNext}
                    disabled={!isCurrentAnswered}
                    className="inline-flex items-center gap-1.5 px-6 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-xs font-semibold text-white shadow-md shadow-primary-600/20 disabled:opacity-50 transition-all"
                  >
                    <span>Next</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={!allAnswered || submitting}
                    className="inline-flex items-center gap-1.5 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-xs font-bold text-white shadow-md shadow-emerald-600/20 disabled:opacity-50 transition-all"
                  >
                    <span>{submitting ? 'Analyzing...' : 'Calculate Awareness Score'}</span>
                    <CheckCircle2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          )}
        </Card>
      ) : (
        /* Evaluation Results Card */
        <Card className="p-8 space-y-6">
          <div className="text-center pb-6 border-b border-slate-100">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-primary-100 text-primary-700 mb-3">
              <Award className="w-7 h-7" />
            </div>
            <h3 className="text-xl font-extrabold text-slate-900">{result.awareness_grade}</h3>
            <p className="text-xs text-slate-600 max-w-md mx-auto mt-1 leading-relaxed">
              {result.summary_message}
            </p>

            <div className="mt-4 inline-flex items-center gap-4 bg-slate-50 border border-slate-200 px-6 py-3 rounded-2xl">
              <div>
                <span className="text-[10px] text-slate-600 font-bold uppercase">Strain Score</span>
                <div className="text-2xl font-black text-primary-700 font-mono">
                  {result.strain_index_percent}%
                </div>
              </div>
              <div className="w-px h-8 bg-slate-200" />
              <div>
                <span className="text-[10px] text-slate-600 font-bold uppercase">Raw Points</span>
                <div className="text-2xl font-black text-slate-800 font-mono">
                  {result.raw_score} / {result.max_score}
                </div>
              </div>
            </div>
          </div>

          {/* Recommendations List */}
          <div>
            <h4 className="text-sm font-bold text-slate-900 mb-3">Personalized Action Recommendations</h4>
            <div className="space-y-3">
              {result.recommendations.map((rec, i) => (
                <div key={i} className="p-4 rounded-xl bg-primary-50/50 border border-primary-100">
                  <div className="text-[10px] font-bold text-primary-700 uppercase">{rec.category}</div>
                  <h5 className="text-xs font-bold text-slate-900 mt-0.5">{rec.title}</h5>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">{rec.recommendation}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Medical Notice */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-600 leading-relaxed italic">
            {result.medical_disclaimer}
          </div>

          <div className="text-center pt-2">
            <button
              onClick={resetSurvey}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-all"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Retake Assessment</span>
            </button>
          </div>
        </Card>
      )}

      {/* History Table */}
      {history.length > 0 && (
        <Card title="Past Survey Submissions" subtitle="Historical record of your eye strain symptom checks">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Strain Index</th>
                  <th className="py-3 px-4">Result Grade</th>
                  <th className="py-3 px-4">Summary</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {history.map((h) => (
                  <tr key={h.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4 text-slate-800">{new Date(h.timestamp).toLocaleDateString()}</td>
                    <td className="py-3 px-4 font-mono font-bold text-primary-700">{h.strain_index_percent}%</td>
                    <td className="py-3 px-4 text-slate-800 font-semibold">{h.awareness_grade}</td>
                    <td className="py-3 px-4 text-slate-500 max-w-xs truncate">{h.summary_message}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
};
