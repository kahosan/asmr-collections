import { Suspense } from 'react';

import Works from './components/works';
import WorkSkeletons from './components/works/skeleton';

export default function App() {
  return (
    <Suspense fallback={<WorkSkeletons />}>
      <Works />
    </Suspense>
  );
}
