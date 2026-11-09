import { useRef, useState } from 'react';
import { act, useGame, useStore } from '../../store/game';
import * as E from '../../engine/engine';
import { navigate } from '../../app/router';
import { Button, Card, CardTitle, Modal, PageHeader, cx } from '../../ui/kit';
import { Icon } from '../../ui/Icon';

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button role="switch" aria-checked={checked} aria-label={label} onClick={() => onChange(!checked)}
      className={cx('relative w-11 h-6 rounded-full transition shrink-0', checked ? 'bg-brand' : 'bg-white/10')}>
      <span className={cx('absolute top-0.5 size-5 rounded-full bg-white transition-all', checked ? 'left-[22px]' : 'left-0.5')} />
    </button>
  );
}

export function Settings() {
  const g = useGame((x) => x);
  const [confirmReset, setConfirmReset] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const exportSave = () => {
    const blob = new Blob([JSON.stringify(g, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `digital-empire-save-${E.localDate(Date.now())}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const importSave = async (file: File) => {
    setImportError(null);
    try {
      if (file.size > 2_000_000) throw new Error('File too large.');
      const data = E.validateSave(JSON.parse(await file.text()));
      useStore.getState().replaceGame(data);
      navigate('/dashboard');
    } catch (e) {
      setImportError(e instanceof Error ? e.message : 'Could not read this file.');
    }
  };

  return (
    <div className="max-w-2xl">
      <PageHeader eyebrow="Settings" title="Settings" />
      <div className="space-y-5">
        <Card className="p-5">
          <CardTitle icon="settings">Preferences</CardTitle>
          <div className="flex items-center justify-between gap-4">
            <div><div className="text-sm font-medium">Reduce motion</div><div className="text-xs text-mute">Turns off animations. Also respects your device setting.</div></div>
            <Toggle label="Reduce motion" checked={g.settings.reducedMotion} onChange={(v) => act((s, c) => E.setReducedMotion(s, c, v))} />
          </div>
          <div className="flex items-center justify-between gap-4 mt-5 pt-5 border-t border-line">
            <div><div className="text-sm font-medium">Language</div><div className="text-xs text-mute">English. Russian and Uzbek translations are planned for a future update.</div></div>
            <span className="text-sm text-soft">English</span>
          </div>
        </Card>

        <Card className="p-5">
          <CardTitle icon="download">Your save</CardTitle>
          <p className="text-sm text-mute">Progress is saved automatically on this device only — nothing is sent to a server. Export a backup to move your empire to another device.</p>
          <div className="flex flex-wrap gap-2 mt-4">
            <Button variant="secondary" icon="download" onClick={exportSave}>Export save file</Button>
            <Button variant="secondary" icon="upload" onClick={() => fileRef.current?.click()}>Import save file</Button>
            <input ref={fileRef} type="file" accept="application/json,.json" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) importSave(f); e.target.value = ''; }} />
          </div>
          {importError && <p className="text-sm text-bad mt-3 flex gap-1.5"><Icon name="warning" size={15} />{importError}</p>}
        </Card>

        <Card className="p-5">
          <CardTitle icon="info">About</CardTitle>
          <ul className="text-sm text-mute space-y-2">
            <li>WEB-CREATORS: Digital Empire · version 0.1 (early access)</li>
            <li>Coins are virtual. There are no real-money purchases, loot boxes or gambling mechanics.</li>
            <li>All businesses, places and customers are fictional and simulated. There are no fake online players.</li>
            <li>Celestia gives rule-based tips offline — no AI service, no data sent anywhere.</li>
          </ul>
        </Card>

        <Card className="p-5 border-bad/25">
          <CardTitle icon="warning">Danger zone</CardTitle>
          <p className="text-sm text-mute">Delete all progress on this device and start over.</p>
          <Button variant="danger" className="mt-4" icon="reset" onClick={() => setConfirmReset(true)}>Reset progress</Button>
        </Card>
      </div>

      <Modal open={confirmReset} onClose={() => setConfirmReset(false)} title="Reset all progress?"
        footer={<><Button variant="ghost" onClick={() => setConfirmReset(false)}>Cancel</Button>
          <Button variant="danger" onClick={() => { useStore.getState().reset(); setConfirmReset(false); navigate('/dashboard'); }}>Yes, delete everything</Button></>}>
        Your businesses, websites, coins, XP and achievements will be permanently deleted. Consider exporting a save file first.
      </Modal>
    </div>
  );
}
