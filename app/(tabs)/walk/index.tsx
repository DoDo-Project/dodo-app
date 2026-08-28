import { useState } from 'react';

import { ActivityTrackingScreen } from '@/components/walk/activity-tracking-screen';
import { FenceMap } from '@/components/walk/fence-map';
import { FenceSettingsScreen } from '@/components/walk/fence-settings-screen';
import type { WalkTab } from '@/components/walk/walk-tab-switcher';

export default function WalkScreen() {
  const [tab, setTab] = useState<WalkTab>('fence');

  if (tab === 'activity') {
    return <ActivityTrackingScreen activeTab={tab} onChangeTab={setTab} />;
  }

  return <FenceSettingsScreen activeTab={tab} onChangeTab={setTab} renderMap={(params) => <FenceMap {...params} />} />;
}
