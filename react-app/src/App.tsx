// ============================================================
// App Root – Router
// ============================================================
import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from '@/components/Layout';

const Dashboard   = lazy(() => import('@/pages/Dashboard'));
const Tasks       = lazy(() => import('@/pages/Tasks'));
const Schedule    = lazy(() => import('@/pages/Schedule'));
const StudyTracker= lazy(() => import('@/pages/StudyTracker'));
const Semester    = lazy(() => import('@/pages/Semester'));
const Analytics   = lazy(() => import('@/pages/Analytics'));
const AIInsights  = lazy(() => import('@/pages/AIInsights'));
const Settings    = lazy(() => import('@/pages/Settings'));

function LoadingFallback() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
      <div className="spinner" />
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Suspense fallback={<LoadingFallback />}>
          <Routes>
            <Route path="/"            element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard"   element={<Dashboard />} />
            <Route path="/tasks"       element={<Tasks />} />
            <Route path="/schedule"    element={<Schedule />} />
            <Route path="/study"       element={<StudyTracker />} />
            <Route path="/semester"    element={<Semester />} />
            <Route path="/analytics"   element={<Analytics />} />
            <Route path="/ai-insights" element={<AIInsights />} />
            <Route path="/settings"    element={<Settings />} />
          </Routes>
        </Suspense>
      </Layout>
    </BrowserRouter>
  );
}
