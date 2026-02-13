import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChatProvider } from '../../context/ChatContext';
import { ChatInterface } from '../../components/criminal-law';

export const CriminalLawChatPage: React.FC = () => {
  const navigate = useNavigate();

  const handleNavigateToNotes = () => {
    navigate('/criminal-law/notes'); // Adjust path as needed
  };

  return (
    <ChatProvider>
      <ChatInterface onNavigateToNotes={handleNavigateToNotes} />
    </ChatProvider>
  );
};
