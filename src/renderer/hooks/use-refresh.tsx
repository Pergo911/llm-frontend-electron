import { createContext, useContext } from 'react';

const RefreshContext = createContext<() => void>(() => {});

export const useRefresh = () => useContext(RefreshContext);
export { RefreshContext };
