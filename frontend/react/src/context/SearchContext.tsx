import { createContext, useContext, useState, type ReactNode } from 'react';
import type { AskResponse, AskRequest } from '../services/api';

interface SearchContextProps {
  request: AskRequest | null;
  setRequest: (req: AskRequest) => void;
  response: AskResponse | null;
  setResponse: (res: AskResponse) => void;
  loading: boolean;
  setLoading: (l: boolean) => void;
}

const SearchContext = createContext<SearchContextProps | undefined>(undefined);

export const SearchProvider = ({ children }: { children: ReactNode }) => {
  const [request, setRequest] = useState<AskRequest | null>(null);
  const [response, setResponse] = useState<AskResponse | null>(null);
  const [loading, setLoading] = useState(false);

  return (
    <SearchContext.Provider value={{ request, setRequest, response, setResponse, loading, setLoading }}>
      {children}
    </SearchContext.Provider>
  );
};

export const useSearch = (): SearchContextProps => {
  const ctx = useContext(SearchContext);
  if (!ctx) {
    throw new Error('useSearch must be used within SearchProvider');
  }
  return ctx;
};
