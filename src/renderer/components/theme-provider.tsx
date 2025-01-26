import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
  useMemo,
} from 'react';

type Theme = 'dark' | 'light' | 'system';

type ThemeProviderProps = {
  children: ReactNode;
  defaultTheme?: Theme;
};

type ThemeProviderState = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
};

const initialState: ThemeProviderState = {
  theme: 'system',
  setTheme: () => null,
};

const ThemeProviderContext = createContext<ThemeProviderState>(initialState);

export function ThemeProvider({
  children,
  defaultTheme = 'system',
  ...props
}: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(defaultTheme);

  useEffect(() => {
    const getTheme = async () => {
      const { theme } = await window.electron.fileOperations.getConfig();

      setTheme(theme);
    };

    getTheme();
  }, []);

  // eslint-disable-next-line consistent-return
  useEffect(() => {
    const root = window.document.documentElement;

    root.classList.remove('dark');

    if (theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

      const updateSystemTheme = (e: MediaQueryListEvent | MediaQueryList) => {
        const systemTheme = e.matches ? 'dark' : 'light';
        window.electron.windowStyle.setWindowControlsTheme(systemTheme);
        window.electron.windowStyle.setNativeTheme('system');
        root.classList.toggle('dark', e.matches);
      };

      updateSystemTheme(mediaQuery);

      mediaQuery.addEventListener('change', updateSystemTheme);

      return () => mediaQuery.removeEventListener('change', updateSystemTheme);
    }

    window.electron.windowStyle.setWindowControlsTheme(theme);
    window.electron.windowStyle.setNativeTheme(theme);
    if (theme === 'dark') root.classList.add('dark');
  }, [theme]);

  const value = useMemo(
    () => ({
      theme,
      setTheme: (theme: Theme) => {
        window.electron.fileOperations.setConfig('theme', theme);
        setTheme(theme);
      },
    }),
    [theme],
  );

  return (
    <ThemeProviderContext.Provider {...props} value={value}>
      {children}
    </ThemeProviderContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeProviderContext);

  if (context === undefined)
    throw new Error('useTheme must be used within a ThemeProvider');

  return context;
};
