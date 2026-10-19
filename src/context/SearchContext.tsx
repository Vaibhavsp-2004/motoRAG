import React, { createContext, useContext, useState } from 'react';
import type { AskRequest, AskResponse } from '../services/api';

interface SearchContextType {
  request: AskRequest | null;
  response: AskResponse | null;
  loading: boolean;
  setRequest: (req: AskRequest | null) => void;
  setResponse: (res: AskResponse | null) => void;
  setLoading: (l: boolean) => void;
}

const SearchContext = createContext<SearchContextType | undefined>(undefined);

export const SearchProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [request, setRequest] = useState<AskRequest | null>(null);
  const [response, setResponse] = useState<AskResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  return (
    <SearchContext.Provider
      value={{
        request,
        response,
        loading,
        setRequest,
        setResponse,
        setLoading,
      }}
    >
      {children}
    </SearchContext.Provider>
  );
};

export const useSearch = (): SearchContextType => {
  const context = useContext(SearchContext);
  if (!context) {
    throw new Error('useSearch must be used within a SearchProvider');
  }
  return context;
};
