import React from 'react';

function App() {
  return (
    <div className="app">
      {/* Header */}
      <header className="header">
        <h1>Rfrnce</h1>
      </header>

      {/* Main Content */}
      <main className="main-content">
        {/* Cart tabs will go here (Task 3.3) */}
        {/* Product list will go here (Task 4.9) */}
        <p className="text-secondary">Welcome to Rfrnce! Create your first cart to get started.</p>
      </main>

      {/* Footer - Report Buttons */}
      <footer className="footer">
        <button className="btn btn-primary" disabled>
          Generate Report
        </button>
        {/* "View Previous Report" button will appear here when a report exists */}
      </footer>
    </div>
  );
}

export default App;
