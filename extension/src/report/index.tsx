import React from 'react';
import ReactDOM from 'react-dom/client';
import ReportPage from './ReportPage';
import ErrorBoundary from '../popup/components/ErrorBoundary';
import './report.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <ReportPage />
    </ErrorBoundary>
  </React.StrictMode>
);
