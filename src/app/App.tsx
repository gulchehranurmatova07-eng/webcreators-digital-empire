import { useEffect } from 'react';
import { useGame } from '../store/game';
import { match, navigate, useRoute } from './router';
import { Shell } from './Shell';
import { Welcome } from '../features/onboarding/Welcome';
import { Dashboard } from '../features/dashboard/Dashboard';
import { EmpireList } from '../features/empire/EmpireList';
import { NewBusiness } from '../features/empire/NewBusiness';
import { BusinessDetail } from '../features/empire/BusinessDetail';
import { StudioList } from '../features/studio/StudioList';
import { Editor } from '../features/studio/Editor';
import { Missions } from '../features/missions/Missions';
import { Academy } from '../features/academy/Academy';
import { LessonView } from '../features/academy/LessonView';
import { Profile } from '../features/profile/Profile';
import { Settings } from '../features/profile/Settings';
import { Wallet } from '../features/profile/Wallet';
import { EmptyState, Button } from '../ui/kit';

function Routes({ route }: { route: string }) {
  let p: Record<string, string> | null;
  if (route === '/dashboard') return <Dashboard />;
  if (route === '/empire') return <EmpireList />;
  if (route === '/empire/new') return <NewBusiness />;
  if ((p = match('/empire/:id', route))) return <BusinessDetail id={p.id} />;
  if (route === '/studio') return <StudioList />;
  if ((p = match('/studio/:id', route))) return <Editor id={p.id} />;
  if (route === '/missions') return <Missions />;
  if (route === '/academy') return <Academy />;
  if ((p = match('/academy/:id', route))) return <LessonView id={p.id} />;
  if (route === '/profile') return <Profile />;
  if (route === '/settings') return <Settings />;
  if (route === '/wallet') return <Wallet />;
  return (
    <EmptyState icon="compass" title="Page not found" body="This part of the empire doesn't exist."
      action={<Button onClick={() => navigate('/dashboard')}>Back to dashboard</Button>} />
  );
}

export function App() {
  const hasPlayer = useGame((g) => !!g.player);
  const route = useRoute();
  useEffect(() => {
    const titles: Record<string, string> = { dashboard: 'Dashboard', empire: 'Business Empire', studio: 'Website Studio', missions: 'Missions', academy: 'Academy', profile: 'Profile', settings: 'Settings', wallet: 'Wallet' };
    const key = route.split('/')[1];
    document.title = `${titles[key] ?? 'Digital Empire'} · WEB-CREATORS`;
  }, [route]);
  if (!hasPlayer) return <Welcome />;
  return (
    <Shell route={route}>
      <div key={route} className="animate-rise"><Routes route={route} /></div>
    </Shell>
  );
}
