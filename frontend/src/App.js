import React, { useState } from 'react';
import '@/App.css';
import DesignStudio from '@/components/DesignStudio';
import LandingPage from '@/components/LandingPage';

function App() {
  const [showStudio, setShowStudio] = useState(false);

  if (!showStudio) {
    return <LandingPage onGetStarted={() => setShowStudio(true)} />;
  }

  return (
    <div className="App">
      <DesignStudio onBackToHome={() => setShowStudio(false)} />
    </div>
  );
}

export default App;
