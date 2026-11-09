import { useState } from 'react';
import { act, useGame, useStore } from '../../store/game';
import * as E from '../../engine/engine';
import { TRACKS, isLessonUnlocked, lessonById, type Question } from '../../engine/lessons';
import { navigate } from '../../app/router';
import { Badge, Button, Card, CoinIcon, EmptyState, Progress, cx, textareaCls } from '../../ui/kit';
import { Icon } from '../../ui/Icon';

/** Sandboxed live preview for code answers: scripts are disabled (sandbox="") so it is safe. */
function CodePreview({ q, code }: { q: Extract<Question, { type: 'code' }>; code: string }) {
  const base = '<style>body{margin:0;padding:14px;font-family:system-ui,sans-serif;background:#0b1220;color:#e8eef8}a{color:#58a6ff}</style>';
  const doc = q.lang === 'html' ? base + code : `${base}<style>.demo{${code.replace(/[<>]/g, '')}}</style><div class="demo"><span>Digital</span> <span>Empire</span></div>`;
  return (
    <div>
      <div className="text-[11px] text-mute mb-1.5 flex items-center gap-1.5"><Icon name="eye" size={12} /> Live result</div>
      <iframe title="Live code preview" sandbox="" srcDoc={doc} className="w-full h-28 rounded-xl border border-line bg-[#0b1220]" />
    </div>
  );
}

export function LessonView({ id }: { id: string }) {
  const lesson = lessonById(id);
  const done = useGame((g) => g.stats.lessonsCompleted);
  const [stage, setStage] = useState<'intro' | 'quiz' | 'finished'>('intro');
  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState<(number | string)[]>([]);
  const [current, setCurrent] = useState<number | string>('');
  const [feedback, setFeedback] = useState<null | boolean>(null);
  const [showHint, setShowHint] = useState(false);
  const [rewarded, setRewarded] = useState(false);

  if (!lesson) return <Card><EmptyState icon="book" title="Lesson not found" body="" action={<Button onClick={() => navigate('/academy')}>Back</Button>} /></Card>;
  if (!isLessonUnlocked(lesson.id, done)) return <Card><EmptyState icon="lock" title="Lesson locked" body="Complete the previous lesson in this track first." action={<Button onClick={() => navigate('/academy')}>Back to Academy</Button>} /></Card>;

  const q = lesson.questions[idx];
  const alreadyDone = done.includes(lesson.id);

  const check = () => {
    let correct = false;
    act((s, c) => { const r = E.answerQuestion(s, c, lesson.id, idx, current); correct = r.correct; return r; });
    setFeedback(correct);
    if (correct) setAnswers((a) => { const n = [...a]; n[idx] = current; return n; });
  };

  const next = () => {
    if (idx < lesson.questions.length - 1) {
      setIdx(idx + 1); setCurrent(lesson.questions[idx + 1].type === 'choice' ? -1 : ''); setFeedback(null); setShowHint(false);
    } else {
      const before = useStore.getState().game.coins;
      if (act((s, c) => E.completeLesson(s, c, lesson.id, answers))) {
        setRewarded(useStore.getState().game.coins > before);
        setStage('finished');
      }
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-5">
        <Button variant="ghost" size="sm" icon="chevron-left" onClick={() => navigate('/academy')}>Academy</Button>
        <Badge>{TRACKS[lesson.track].name}</Badge>
        {alreadyDone && <Badge tone="good">Completed</Badge>}
      </div>

      {stage === 'intro' && (
        <Card className="p-6 sm:p-8">
          <h1 className="font-display text-2xl sm:text-3xl font-semibold">{lesson.title}</h1>
          <div className="flex items-center gap-3 text-xs text-mute mt-2">
            <span>{lesson.minutes} min</span><span>·</span><span>{lesson.questions.length} challenges</span><span>·</span>
            <span className="flex items-center gap-1">{alreadyDone ? 'Practice mode (rewards already earned)' : <>+{lesson.xp} XP · <CoinIcon size={11} /> {lesson.coins}</>}</span>
          </div>
          <div className="mt-6 space-y-3 text-soft leading-relaxed">{lesson.intro.map((p, i) => <p key={i}>{p.replace(/\*/g, '')}</p>)}</div>
          {lesson.example && <pre className="mt-5 p-4 rounded-xl bg-ink border border-line text-sm text-brand-2 overflow-x-auto font-mono"><code>{lesson.example}</code></pre>}
          <Button size="lg" icon="arrow" className="mt-8 w-full sm:w-auto" onClick={() => { setStage('quiz'); setCurrent(lesson.questions[0].type === 'choice' ? -1 : ''); }}>Start challenges</Button>
        </Card>
      )}

      {stage === 'quiz' && (
        <Card className="p-6 sm:p-8">
          <div className="flex items-center gap-3 mb-6"><Progress value={idx + (feedback ? 1 : 0)} max={lesson.questions.length} className="flex-1" label="Lesson progress" /><span className="text-xs text-mute">{idx + 1}/{lesson.questions.length}</span></div>
          <div className="text-[11px] uppercase tracking-wider text-brand-2 font-semibold mb-2">{q.type === 'choice' ? 'Choose the right answer' : `Write ${q.lang.toUpperCase()}`}</div>
          <h2 className="font-display text-xl font-semibold">{q.prompt}</h2>

          {q.type === 'choice' ? (
            <div className="mt-5 space-y-2" role="radiogroup" aria-label="Answers">
              {q.options.map((o, i) => {
                const picked = current === i;
                const show = feedback !== null && picked;
                return (
                  <button key={i} role="radio" aria-checked={picked} disabled={feedback === true}
                    onClick={() => { setCurrent(i); setFeedback(null); }}
                    className={cx('w-full flex items-center gap-3 p-4 rounded-xl border text-left text-sm transition',
                      show ? (feedback ? 'border-good bg-good/10' : 'border-bad bg-bad/10') : picked ? 'border-brand bg-brand/10' : 'border-line bg-ink/40 hover:border-line-strong')}>
                    <span className={cx('grid place-items-center size-6 rounded-full border text-[11px] shrink-0', picked ? 'border-brand bg-brand text-white' : 'border-line-strong text-mute')}>{String.fromCharCode(65 + i)}</span>
                    <span className="font-mono-ish">{o}</span>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="mt-5 space-y-4">
              <textarea aria-label="Your code" spellCheck={false} autoCapitalize="off" autoCorrect="off" disabled={feedback === true}
                className={cx(textareaCls, 'font-mono text-brand-2 min-h-28')} placeholder={q.placeholder} maxLength={500}
                value={current as string} onChange={(e) => { setCurrent(e.target.value); setFeedback(null); }} />
              <CodePreview q={q} code={String(current)} />
              {!showHint && feedback !== true && <button className="text-xs text-brand-2 hover:underline" onClick={() => setShowHint(true)}>Need a hint?</button>}
              {showHint && feedback !== true && <p className="text-xs text-mute flex gap-1.5"><Icon name="info" size={13} className="text-brand-2 shrink-0" />{q.hint}</p>}
            </div>
          )}

          {feedback !== null && (
            <div className={cx('mt-5 p-4 rounded-xl border text-sm flex gap-3 animate-pop', feedback ? 'border-good/30 bg-good/[0.07]' : 'border-bad/30 bg-bad/[0.07]')} role="status">
              <Icon name={feedback ? 'check' : 'x'} size={18} className={feedback ? 'text-good' : 'text-bad'} />
              <div><div className="font-semibold">{feedback ? 'Correct!' : 'Not quite — try again.'}</div>{feedback && <div className="text-mute mt-0.5">{q.explain}</div>}</div>
            </div>
          )}

          <div className="mt-6 flex justify-end">
            {feedback === true
              ? <Button icon="arrow" onClick={next}>{idx < lesson.questions.length - 1 ? 'Next challenge' : 'Finish lesson'}</Button>
              : <Button disabled={q.type === 'choice' ? current === -1 : String(current).trim() === ''} onClick={check}>Check answer</Button>}
          </div>
        </Card>
      )}

      {stage === 'finished' && (
        <Card className="p-8 text-center">
          <div className="relative mx-auto size-20 mb-4"><div className="absolute inset-0 rounded-full bg-good/30 blur-xl animate-glow" /><div className="relative grid place-items-center size-20 rounded-full bg-good/15 text-good border border-good/40"><Icon name="graduation" size={34} /></div></div>
          <h2 className="font-display text-2xl font-semibold">Lesson complete!</h2>
          <p className="text-mute mt-2">{rewarded ? `You earned ${lesson.xp} XP and ${lesson.coins} coins.` : 'Great practice. Rewards are given on the first completion only.'}</p>
          <div className="flex flex-col sm:flex-row justify-center gap-2 mt-6">
            <Button variant="secondary" onClick={() => navigate('/academy')}>Back to Academy</Button>
          </div>
        </Card>
      )}
    </div>
  );
}
