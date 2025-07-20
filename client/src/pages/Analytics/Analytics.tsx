import React from 'react';
import { Typography, Paper, Box } from '@mui/material';

const Analytics: React.FC = () => {
  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Analytics
      </Typography>
      <Paper sx={{ p: 3 }}>
        <Typography>
          Analytics functionality coming soon...
        </Typography>
      </Paper>
    </Box>
  );
};

export default Analytics;