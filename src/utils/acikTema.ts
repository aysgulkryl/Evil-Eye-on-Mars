// Bilgi panelleri, kartlar ve pencereler için açık tema (küre ve üzerindeki katman koyu temada kalır).
import { createTheme } from '@mui/material/styles';

export const acikTema = createTheme({
  palette: { mode: 'light', primary: { main: '#1d4ed8' }, background: { paper: '#e2e7ee', default: '#d5dbe3' } },
  typography: { fontFamily: "'Segoe UI', system-ui, -apple-system, Roboto, Arial, sans-serif" },
});
