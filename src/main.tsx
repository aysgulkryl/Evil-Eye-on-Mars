import { createRoot } from 'react-dom/client';
import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider, createTheme } from '@mui/material/styles';

import MarsKonumlamaPage from './pages/MarsKonumlamaPage';

const tema = createTheme({
  palette: { mode: 'dark', primary: { main: '#c95b42' } },
  typography: { fontFamily: "'Segoe UI', system-ui, -apple-system, Roboto, Arial, sans-serif" },
});

createRoot(document.getElementById('root')!).render(
  <ThemeProvider theme={tema}>
    <CssBaseline />
    <MarsKonumlamaPage />
  </ThemeProvider>
);
