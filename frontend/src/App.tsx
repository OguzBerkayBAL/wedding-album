import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import styled from 'styled-components';
import HomePage from './pages/HomePage';
import AlbumPage from './pages/AlbumPage';
import './App.css';

const AppContainer = styled.div`
  min-height: 100vh;
  background-color: #f8f9fa;
`;

function App() {
  return (
    <Router>
      <AppContainer>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/album/:id" element={<AlbumPage />} />
        </Routes>
      </AppContainer>
    </Router>
  );
}

export default App;
