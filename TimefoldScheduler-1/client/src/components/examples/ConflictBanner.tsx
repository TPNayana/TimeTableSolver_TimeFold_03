import { ConflictBanner } from '../ConflictBanner';
import { useState } from 'react';

export default function ConflictBannerExample() {
  const [visible, setVisible] = useState(true);

  if (!visible) {
    return (
      <div className="p-4">
        <button onClick={() => setVisible(true)}>Show Banner</button>
      </div>
    );
  }

  return (
    <ConflictBanner 
      conflictCount={3}
      onReview={() => console.log('Review conflicts')}
      onDismiss={() => setVisible(false)}
    />
  );
}
