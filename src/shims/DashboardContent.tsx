import Box from '@mui/material/Box';

import type { ReactNode } from 'react';

// Tek sayfalık uygulamada sayfa kabuğu: yalnızca dış boşluk.
export function DashboardContent({ children }: { children: ReactNode; maxWidth?: unknown; sx?: unknown }) {
  return <Box sx={{ p: { xs: 1, md: 1.5 } }}>{children}</Box>;
}
