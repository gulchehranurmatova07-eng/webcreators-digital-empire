import { useGame } from '../../store/game';
import { LESSONS, TRACKS, isLessonUnlocked, type TrackId } from '../../engine/lessons';
import { navigate } from '../../app/router';
import { Badge, Card, CoinIcon, PageHeader, Progress, cx } from '../../ui/kit';
import { Icon } from '../../ui/Icon';

export function Academy() {
  const done = useGame((g) => g.stats.lessonsCompleted);
  return (
    <>
      <PageHeader eyebrow="Digital Academy" title="Learn real skills" subtitle="Short lessons with instant feedback. Each first completion pays XP and coins. Lessons unlock in order within each track." />
      <div className="grid lg:grid-cols-3 gap-5">
        {(Object.keys(TRACKS) as TrackId[]).map((tid) => {
          const t = TRACKS[tid];
          const lessons = LESSONS.filter((l) => l.track === tid);
          const n = lessons.filter((l) => done.includes(l.id)).length;
          return (
            <Card key={tid} className="p-5">
              <div className="flex items-center gap-3">
                <span className="grid place-items-center size-11 rounded-2xl bg-brand/15 text-brand-2"><Icon name={t.icon} size={20} /></span>
                <div><div className="font-display font-semibold">{t.name}</div><div className="text-xs text-mute">{t.description}</div></div>
              </div>
              <div className="flex items-center gap-2 mt-4 mb-4"><Progress value={n} max={lessons.length} className="h-1.5 flex-1" tone={n === lessons.length ? 'good' : 'brand'} label={`${t.name} progress`} /><span className="text-xs text-mute">{n}/{lessons.length}</span></div>
              <ol className="space-y-2">
                {lessons.map((l, i) => {
                  const complete = done.includes(l.id);
                  const unlocked = isLessonUnlocked(l.id, done);
                  return (
                    <li key={l.id}>
                      <button disabled={!unlocked} onClick={() => navigate(`/academy/${l.id}`)}
                        className={cx('w-full flex items-center gap-3 p-3 rounded-xl border text-left transition disabled:cursor-not-allowed',
                          complete ? 'border-good/25 bg-good/[0.04]' : unlocked ? 'border-line-strong bg-ink/40 hover:border-brand' : 'border-line bg-ink/20 opacity-50')}>
                        <span className={cx('grid place-items-center size-8 rounded-lg text-xs font-bold shrink-0', complete ? 'bg-good/20 text-good' : 'bg-white/5 text-soft')}>
                          {complete ? <Icon name="check" size={14} /> : unlocked ? i + 1 : <Icon name="lock" size={13} />}
                        </span>
                        <div className="flex-1 min-w-0"><div className="text-sm font-medium truncate">{l.title}</div><div className="text-[11px] text-mute">{l.minutes} min · {l.questions.length} challenges</div></div>
                        {complete ? <Badge tone="good">Done</Badge> : <span className="flex items-center gap-1 text-[11px] text-mute shrink-0">+{l.xp} XP · <CoinIcon size={11} />{l.coins}</span>}
                      </button>
                    </li>
                  );
                })}
              </ol>
            </Card>
          );
        })}
      </div>
    </>
  );
}
