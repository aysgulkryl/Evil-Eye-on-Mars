import Box from '@mui/material/Box';

// Basit simge yerine geçici: sembol karakterleri. Dilerseniz react-icons / lucide gibi bir kütüphaneyle değiştirin.
const SEMBOL: Record<string, string> = {
  'mingcute:close-line': '✕',
  'solar:check-circle-bold': '✓',
  'solar:document-text-bold': '▤',
  'solar:download-minimalistic-bold': '⭳',
  'solar:transfer-horizontal-bold': '⇄',
  'solar:play-circle-bold': '▶',
  'solar:stop-circle-bold': '■',
};

export function Iconify({ icon, width = 18, sx }: { icon: string; width?: number; sx?: Record<string, unknown> }) {
  return (
    <Box
      component="span"
      aria-hidden
      sx={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width, height: width, fontSize: width * 0.85, lineHeight: 1, ...sx }}
    >
      {SEMBOL[icon] ?? '•'}
    </Box>
  );
}
