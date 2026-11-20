import { useState } from "react";

import { api } from "../api.js";
import { useAsync } from "../useAsync.js";
import Icon from "../components/Icon.jsx";
import { EmptyState, ErrorState, LoadingState, Panel } from "../components/ui.jsx";

const EMPTY_QUIZ = { index: 0, score: 0, picked: null, done: false };

export default function Quiz({ refreshKey }) {
  const { data, error, loading, reload } = useAsync(api.learn, [refreshKey]);
  const [quiz, setQuiz] = useState(EMPTY_QUIZ);

  if (loading && !data) return <LoadingState rows={3} />;
  if (error) return <ErrorState error={error} onRetry={reload} />;

  const questions = data.quiz;
  if (!questions.length) {
    return (
      <EmptyState icon="zap" title="Quiz unavailable" hint="The question bank failed to load." />
    );
  }

  const question = questions[quiz.index];
  const answered = quiz.picked !== null;

  const pick = (choice) => {
    if (quiz.picked !== null || quiz.done || !question) return;
    const correct = choice === question.answer;
    setQuiz((current) => ({
      ...current,
      picked: choice,
      score: current.score + (correct ? 1 : 0)
    }));
  };

  const next = () => {
    setQuiz((current) => {
      if (current.index + 1 >= questions.length) {
        return { ...current, done: true };
      }
      return { ...current, index: current.index + 1, picked: null };
    });
  };

  return (
    <div className="view quiz-view">
      <Panel
        title="npm quiz"
        subtitle={
          quiz.done
            ? "Finished"
            : `Question ${Math.min(quiz.index + 1, questions.length)} of ${questions.length}`
        }
        actions={
          quiz.done || quiz.index > 0 || answered ? (
            <button type="button" className="btn ghost small" onClick={() => setQuiz(EMPTY_QUIZ)}>
              <Icon name="refresh" size={14} /> Restart
            </button>
          ) : null
        }
      >
        {quiz.done ? (
          <div className="quiz-result">
            <span className="quiz-score">
              {quiz.score}/{questions.length}
            </span>
            <h3>
              {quiz.score === questions.length
                ? "Perfect score. You understand the essentials."
                : quiz.score > 0
                  ? "Nice work. Review the misses and try again."
                  : "Good start. Re-read the concepts and retry."}
            </h3>
            <p>
              Score {Math.round((quiz.score / questions.length) * 100)}%. You can replay the quiz any
              time.
            </p>
            <button type="button" className="btn primary" onClick={() => setQuiz(EMPTY_QUIZ)}>
              <Icon name="play" size={14} /> Play again
            </button>
          </div>
        ) : (
          <div className="quiz-card">
            <div className="quiz-progress">
              <span style={{ width: `${(quiz.index / questions.length) * 100}%` }} />
            </div>
            <h3 className="quiz-question">{question.question}</h3>
            <div className="quiz-choices">
              {question.choices.map((choice) => {
                let className = "quiz-choice";
                if (answered) {
                  if (choice === question.answer) className += " correct";
                  else if (choice === quiz.picked) className += " wrong";
                  else className += " dimmed";
                }
                return (
                  <button
                    key={choice}
                    type="button"
                    className={className}
                    onClick={() => pick(choice)}
                    disabled={answered}
                  >
                    <span>{choice}</span>
                    {answered && choice === question.answer && <Icon name="check" size={15} />}
                    {answered && choice === quiz.picked && choice !== question.answer && (
                      <Icon name="x" size={15} />
                    )}
                  </button>
                );
              })}
            </div>

            {answered && (
              <div className={`quiz-feedback ${quiz.picked === question.answer ? "good" : "bad"}`}>
                <strong>{quiz.picked === question.answer ? "Correct!" : "Not quite."}</strong>
                <p>{question.explanation}</p>
              </div>
            )}

            <div className="quiz-footer">
              <span className="muted">
                Score: {quiz.score}/{questions.length}
              </span>
              <button type="button" className="btn primary" onClick={next} disabled={!answered}>
                {quiz.index + 1 >= questions.length ? "See result" : "Next question"}
                <Icon name="arrowRight" size={14} />
              </button>
            </div>
          </div>
        )}
      </Panel>
    </div>
  );
}
