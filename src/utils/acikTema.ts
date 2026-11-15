// Bilgi panelleri, kartlar ve pencereler için açık tema (küre ve üzerindeki katman koyu temada kalır).
import { createTheme } from '@mui/material/styles';

export const acikTema = createTheme({
  palette: { mode: 'light', primary: { main: '#c95b42' }, background: { paper: '#ffffff', default: '#f8fafc' } },
  typography: { fontFamily: "'Segoe UI', system-ui, -apple-system, Roboto, Arial, sans-serif" },
});
