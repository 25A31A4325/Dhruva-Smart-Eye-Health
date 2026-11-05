import React, { useState, useEffect } from 'react';
import {
  ClipboardCheck,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  RotateCcw,
  Sparkles,
  Award,
  ChevronDown,
  ChevronUp,
  Eye,
  Check,
} from 'lucide-react';
import { assessmentAPI } from '../services/api';
import { Card } from '../components/common/Card';
import { Badge } from '../components/common/Badge';

const CLINICAL_QUESTIONS = [
  {
    id: "q1_dryness",
    category: "Ocular Surface & Tear Film",
    question: "How often do you experience dry, gritty, or stinging sensations in your eyes during or after digital device use?",
    explanation: "Blink rates plummet by up to 60% during screen immersion, evaporating the protective tear film layer.",
    options: [
      { label: "Never or rarely", points: 0 },
      { label: "Occasionally (1-2 days/week)", points: 1 },
      { label: "Frequently (3-5 days/week)", points: 2 },
      { label: "Almost daily or constant", points: 3 },
    ],
  },
  {
    id: "q2_headache",
    category: "Ciliary Accommodation & Convergence",
    question: "Do you notice brow ache or tension headaches radiating behind your eyes after extended computer or study sessions?",
    explanation: "Continuous close-focus work overworks the ciliary muscle that flexes your eye's internal lens.",
    options: [
      { label: "Never", points: 0 },
      { label: "Only after marathon sessions (>4 hours)", points: 1 },
      { label: "Regularly by afternoon or evening", points: 2 },
      { label: "Severe or daily", points: 3 },
    ],
  },
  {
    id: "q3_distance",
    category: "Working Distance & Posture",
    question: "What is your typical viewing distance between your eyes and your primary computer/laptop display?",
    explanation: "Maintaining at least an arm's length (50-70 cm) significantly relieves ocular convergence stress.",
    options: [
      { label: "Comfortably at arm's length (55-70 cm)", points: 0 },
      { label: "Slightly close (45-55 cm)", points: 1 },
      { label: "Very close (<40 cm, leaning forward)", points: 2 },
      { label: "Unaware / subconscious slouching very close", points: 3 },
    ],
  },
  {
    id: "q4_breaks",
    category: "Break Discipline (20-20-20 Rule)",
    question: "How frequently do you take visual breaks to gaze into the distance (at least 20 feet away) while working?",
    explanation: "The 20-20-20 rule prompts the ciliary muscles to fully relax to their natural infinity focal state.",
    options: [
      { label: "Consistently every 20-30 minutes", points: 0 },
      { label: "Every hour or two", points: 1 },
      { label: "Only when eye fatigue forces me to stop", points: 2 },
      { label: "Almost never take intentional eye breaks", points: 3 },
    ],
  },
  {
    id: "q5_lighting",
    category: "Ambient Lighting & Glare",
    question: "Is your digital display significantly brighter than your ambient room lighting, or do you work in dark rooms?",
    explanation: "Extreme contrast between a bright monitor and dark surroundings forces the iris sphincter muscle to constantly oscillate.",
    options: [
      { label: "Well-balanced indirect lighting, no screen glare", points: 0 },
      { label: "Mild glare or occasionally unbalanced lighting", points: 1 },
      { label: "Frequently work with harsh overhead glare or window reflection", points: 2 },
      { label: "Often work in pitch darkness with maximum screen brightness", points: 3 },
    ],
  },
  {
    id: "q6_blur",
    category: "Transient Visual Acuity",
    question: "Do you experience temporary blurred vision when shifting focus from your screen to distant objects?",
    explanation: "Accommodative spasm occurs when the ciliary muscle temporarily locks up after prolonged near-focus work.",
    options: [
      { label: "Never - focus shifts instantaneously", points: 0 },
      { label: "Takes 2-3 seconds to refocus after long sessions", points: 1 },
      { label: "Noticeable blur lasting several minutes", points: 2 },
      { label: "Persistent blur requiring rubbing eyes", points: 3 },
    ],
  },
  {
    id: "q7_blinking",
    category: "Conscious Blink Dynamics",
    question: "Do you practice conscious complete blinking or keep hydrating artificial tears nearby if needed?",
    explanation: "Incomplete micro-blinks are common during reading, leaving the lower third of the cornea desiccated.",
    options: [
      { label: "Yes, highly conscious of blinking and ocular hydration", points: 0 },
      { label: "Occasionally remember to blink fully", points: 1 },
      { label: "Rarely think about blinking habits", points: 2 },
      { label: "Never - experience severe eye redness/burning", points: 3 },
    ],
  },
];

export const AssessmentPage = () => {
  const [questions, setQuestions] = useState(CLINICAL_QUESTIONS);
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState(() => {
    try {
      const saved = localStorage.getItem('dhruva_assessment_history');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [showReview, setShowReview] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchRemote = async () => {
      try {
        const [qRes, hRes] = await Promise.all([
          assessmentAPI.getQuestions().catch(() => null),
          assessmentAPI.getHistory().catch(() => null),
        ]);
        if (qRes?.data?.questions?.length) {
          setQuestions(qRes.data.questions);
        }
        if (hRes?.data?.history?.length) {
          setHistory(hRes.data.history);
          localStorage.setItem('dhruva_assessment_history', JSON.stringify(hRes.data.history));
        }
      } catch (err) {
        console.warn('Using local clinical questions baseline:', err);
      }
    };

    fetchRemote();
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

  const jumpToQuestion = (index) => {
    if (index >= 0 && index < questions.length) {
      setCurrentStep(index);
    }
  };

  const calculateLocalResult = (formattedAnswers) => {
    let rawScore = 0;
    formattedAnswers.forEach((ans, qIdx) => {
      const q = questions[qIdx];
      const opt = q?.options?.[ans.selected_option_index];
      rawScore += opt?.points ?? ans.selected_option_index;
    });

    const maxScore = questions.length * 3;
    const strainPercent = Math.round((rawScore / maxScore) * 100);

    let grade = "Low Digital Strain Risk";
    let summary = "Commendable digital wellness habits! Your visual ergonomics and break routines are well within healthy limits.";
    let recs = [
      {
        category: "Maintenance",
        title: "Sustain Current Pacing",
        recommendation: "Continue your disciplined 20-20-20 breaks and ergonomic posture to protect long-term eye health.",
      },
    ];

    if (strainPercent >= 65) {
      grade = "High Digital Strain Risk";
      summary = "Significant eye strain indicators detected. Strongly adopt hourly resting pauses and verify ergonomic distance.";
      recs = [
        {
          category: "Tear Film Hydration",
          title: "Practice Deliberate Full Blinking",
          recommendation: "Every 15 minutes, perform 5 slow, deliberate complete blinks to replenish your tear film and prevent corneal dry spots.",
        },
        {
          category: "Ergonomic Distance",
          title: "Push Monitor to 50-70 cm",
          recommendation: "Keep your laptop or screen at arm's length to relieve intense ciliary accommodation.",
        },
        {
          category: "Pacing",
          title: "Enforce 20-20-20 Rule",
          recommendation: "Take a 20-second break every 20 minutes to look at an object 20 feet away.",
        },
      ];
    } else if (strainPercent >= 30) {
      grade = "Moderate Digital Strain Risk";
      summary = "Mild to moderate digital fatigue present. Minor habit adjustments will prevent progressive discomfort.";
      recs = [
        {
          category: "Ciliary Muscle Rest",
          title: "Paced Visual Rest Breaks",
          recommendation: "Incorporate the 20-20-20 rule during study sessions to relax accommodative spasms.",
        },
        {
          category: "Lighting Adjustment",
          title: "Balance Ambient Illumination",
          recommendation: "Avoid working in dark rooms with maximum monitor brightness to reduce pupillary fatigue.",
        },
      ];
    }

    return {
      id: `assessment_${Date.now()}`,
      timestamp: new Date().toISOString(),
      raw_score: rawScore,
      max_score: maxScore,
      strain_index_percent: strainPercent,
      awareness_grade: grade,
      summary_message: summary,
      recommendations: recs,
      medical_disclaimer: "Medical Disclaimer: This educational questionnaire assesses ergonomic habits and behavioral digital eye strain factors. It does not constitute an ophthalmic medical diagnosis.",
      answers: formattedAnswers,
    };
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    const formattedAnswers = questions.map((q) => ({
      question_id: q.id,
      selected_option_index: answers[q.id] ?? 0,
    }));

    try {
      const res = await assessmentAPI.submit({ answers: formattedAnswers });
      setResult(res.data);
      const updatedHistory = [res.data, ...history];
      setHistory(updatedHistory);
      localStorage.setItem('dhruva_assessment_history', JSON.stringify(updatedHistory));
    } catch (err) {
      console.warn('Scoring assessment locally:', err);
      const localResult = calculateLocalResult(formattedAnswers);
      setResult(localResult);
      const updatedHistory = [localResult, ...history];
      setHistory(updatedHistory);
      localStorage.setItem('dhruva_assessment_history', JSON.stringify(updatedHistory));
    } finally {
      setSubmitting(false);
    }
  };

  const resetSurvey = () => {
    setResult(null);
    setAnswers({});
    setCurrentStep(0);
    setShowReview(false);
  };

  const viewPreviousResult = (pastResult) => {
    setResult(pastResult);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const currentQ = questions[currentStep] || CLINICAL_QUESTIONS[0];
  const progressPercent = Math.round(((currentStep + 1) / questions.length) * 100);
  const isCurrentAnswered = answers[currentQ.id] !== undefined;
  const allAnswered = questions.every((q) => answers[q.id] !== undefined);

  return (
    <div className="space-y-8 animate-fade-in max-w-4xl mx-auto">
      {/* Title */}
      <div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary-100 text-primary-800 text-xs font-semibold mb-2">
          <ClipboardCheck className="w-3.5 h-3.5 text-primary-600" />
          <span>Behavioral Health Assessment</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          7-Point Digital Eye Strain Survey
        </h1>
        <p className="mt-1 text-xs sm:text-sm text-slate-600">
          A clinically grounded self-assessment evaluating tear film stability, ciliary accommodative stress, and workstation lighting.
        </p>
      </div>

      {!result ? (
        <Card className="p-6 sm:p-8">
          {/* Progress Header & Question Stepper */}
          <div className="mb-6">
            <div className="flex justify-between items-center text-xs font-semibold text-slate-500 mb-3">
              <span className="font-bold text-slate-700">Question {currentStep + 1} of {questions.length}</span>
              <span className="font-mono text-primary-600 font-bold">{progressPercent}% Completed</span>
            </div>

            {/* Stepper Buttons: Jump to Any Question Directly */}
            <div className="grid grid-cols-7 gap-1.5 sm:gap-2 mb-3">
              {questions.map((q, idx) => {
                const isAnswered = answers[q.id] !== undefined;
                const isCurrent = currentStep === idx;
                return (
                  <button
                    key={q.id}
                    type="button"
                    onClick={() => jumpToQuestion(idx)}
                    title={`Question ${idx + 1}: ${q.category || ''}`}
                    className={`py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 ${
                      isCurrent
                        ? 'bg-primary-600 text-white shadow-md shadow-primary-600/30 scale-105 ring-2 ring-primary-300'
                        : isAnswered
                        ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    <span>{idx + 1}</span>
                    {isAnswered && !isCurrent && <Check className="w-3 h-3 text-emerald-700" />}
                  </button>
                );
              })}
            </div>

            {/* Continuous Progress Bar */}
            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-primary-600 to-primary-500 transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {/* Question Body */}
          {currentQ && (
            <div className="space-y-6">
              <div>
                <span className="text-[11px] uppercase font-bold text-primary-700 tracking-wider bg-primary-50 px-3 py-1 rounded-lg border border-primary-100">
                  Category: {currentQ.category || "Ocular Ergonomics"}
                </span>
                <h3 className="text-base sm:text-lg font-bold text-slate-900 mt-3 leading-snug">
                  {currentQ.question || currentQ.question_text}
                </h3>
                <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                  <span className="font-semibold text-slate-700">Physiological context: </span>
                  <span className="italic">{currentQ.explanation || currentQ.description}</span>
                </p>
              </div>

              {/* Radio Options List */}
              <div className="space-y-3">
                {(currentQ.options || []).map((opt, idx) => {
                  const isSelected = answers[currentQ.id] === idx;
                  const labelText = opt.label || opt.text || `Option ${idx + 1}`;
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSelectOption(currentQ.id, idx)}
                      className={`w-full text-left p-4 rounded-2xl border transition-all flex items-center justify-between group cursor-pointer ${
                        isSelected
                          ? 'border-primary-600 bg-primary-50/80 text-primary-950 font-bold shadow-sm ring-1 ring-primary-500'
                          : 'border-slate-200 hover:border-primary-300 hover:bg-slate-50/80 text-slate-700'
                      }`}
                    >
                      <span className="text-xs sm:text-sm leading-relaxed">{labelText}</span>
                      <div
                        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ml-3 transition-colors ${
                          isSelected ? 'border-primary-600 bg-primary-600 text-white' : 'border-slate-300 group-hover:border-primary-400'
                        }`}
                      >
                        {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
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
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-30 disabled:pointer-events-none transition-all cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Previous</span>
                </button>

                {currentStep < questions.length - 1 ? (
                  <button
                    type="button"
                    onClick={handleNext}
                    disabled={!isCurrentAnswered}
                    className="inline-flex items-center gap-2 px-7 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-xs font-bold text-white shadow-md shadow-primary-600/25 disabled:opacity-40 disabled:pointer-events-none transition-all cursor-pointer"
                  >
                    <span>Next</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={!allAnswered || submitting}
                    className="inline-flex items-center gap-2 px-7 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-xs font-bold text-white shadow-md shadow-emerald-600/25 disabled:opacity-40 disabled:pointer-events-none transition-all cursor-pointer"
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
        <Card className="p-6 sm:p-8 space-y-6">
          <div className="text-center pb-6 border-b border-slate-100">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-primary-600 to-primary-500 text-white mb-3 shadow-lg shadow-primary-500/25">
              <Award className="w-8 h-8" />
            </div>
            <h3 className="text-xl sm:text-2xl font-black text-slate-900">{result.awareness_grade}</h3>
            <p className="text-xs sm:text-sm text-slate-600 max-w-lg mx-auto mt-1.5 leading-relaxed">
              {result.summary_message}
            </p>

            <div className="mt-5 inline-flex items-center gap-6 bg-slate-50 border border-slate-200 px-6 py-3.5 rounded-2xl shadow-xs">
              <div>
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Strain Risk Score</span>
                <div className="text-2xl sm:text-3xl font-black text-primary-700 font-mono">
                  {result.strain_index_percent}%
                </div>
              </div>
              <div className="w-px h-8 bg-slate-200" />
              <div>
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Raw Score</span>
                <div className="text-2xl sm:text-3xl font-black text-slate-800 font-mono">
                  {result.raw_score} / {result.max_score}
                </div>
              </div>
            </div>
          </div>

          {/* Personalized Action Recommendations */}
          <div>
            <h4 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary-600" />
              <span>Personalized Ergonomic Recommendations</span>
            </h4>
            <div className="space-y-3">
              {(result.recommendations || []).map((rec, i) => (
                <div key={i} className="p-4 rounded-2xl bg-primary-50/60 border border-primary-100">
                  <div className="text-[10px] font-bold text-primary-700 uppercase tracking-wider">{rec.category}</div>
                  <h5 className="text-xs font-bold text-slate-900 mt-1">{rec.title}</h5>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">{rec.recommendation}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Collapsible: Review All 7 Question Answers */}
          <div className="border border-slate-200 rounded-2xl overflow-hidden">
            <button
              type="button"
              onClick={() => setShowReview(!showReview)}
              className="w-full p-4 bg-slate-50 hover:bg-slate-100/80 transition-colors flex items-center justify-between text-left font-bold text-xs text-slate-800"
            >
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-primary-600" />
                <span>Review Your 7 Question Answers & Physiological Notes</span>
              </div>
              {showReview ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
            </button>

            {showReview && (
              <div className="p-4 space-y-4 divide-y divide-slate-100 bg-white">
                {questions.map((q, idx) => {
                  const chosenOptIdx = answers[q.id];
                  const chosenOpt = q.options?.[chosenOptIdx];
                  return (
                    <div key={q.id} className={idx > 0 ? "pt-4" : ""}>
                      <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 mb-1">
                        <span>Question {idx + 1} • {q.category}</span>
                        {chosenOpt && (
                          <span className="px-2 py-0.5 rounded-full bg-primary-100 text-primary-800 text-[10px]">
                            +{chosenOpt.points} strain pts
                          </span>
                        )}
                      </div>
                      <p className="text-xs font-bold text-slate-900">{q.question || q.question_text}</p>
                      <div className="mt-2 p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                        <span className="font-semibold text-slate-700">Your Answer: </span>
                        <span className="text-primary-700 font-bold">{chosenOpt?.label || chosenOpt?.text || "Not answered"}</span>
                      </div>
                      <p className="text-[11px] text-slate-500 italic mt-1.5">
                        Context: {q.explanation || q.description}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Medical Notice */}
          <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/80 text-[11px] text-amber-900 leading-relaxed">
            <span className="font-bold">Medical Disclaimer: </span>
            {result.medical_disclaimer || "This educational questionnaire assesses ergonomic habits and behavioral digital eye strain factors. It does not constitute an ophthalmic medical diagnosis."}
          </div>

          <div className="text-center pt-2">
            <button
              onClick={resetSurvey}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-white hover:bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800 shadow-xs hover:border-slate-300 transition-all cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Retake Assessment</span>
            </button>
          </div>
        </Card>
      )}

      {/* History Table */}
      {history.length > 0 && (
        <Card
          title="Past Survey Submissions"
          subtitle="Click on any past submission to review previous results"
        >
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Strain Score</th>
                  <th className="py-3 px-4">Result Grade</th>
                  <th className="py-3 px-4">Summary</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {history.map((h, i) => (
                  <tr
                    key={h.id || i}
                    onClick={() => viewPreviousResult(h)}
                    className="hover:bg-primary-50/50 transition-colors cursor-pointer group"
                  >
                    <td className="py-3.5 px-4 text-slate-800 font-semibold">
                      {new Date(h.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-primary-700">
                      {h.strain_index_percent}%
                    </td>
                    <td className="py-3.5 px-4 text-slate-800 font-semibold">
                      {h.awareness_grade}
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 max-w-xs truncate">
                      {h.summary_message}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <span className="text-[11px] font-bold text-primary-600 group-hover:underline">
                        View Result →
                      </span>
                    </td>
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
