import { FenceMap } from '@/components/walk/fence-map';
import { FenceSettingsScreen } from '@/components/walk/fence-settings-screen';

export default function WalkScreen() {
  return (
    <FenceSettingsScreen
      renderMap={({ selectedFence, fences }) => <FenceMap selectedFence={selectedFence} fences={fences} />}
    />
  );
}
