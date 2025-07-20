import React from 'react';
import { Typography, Paper, Box } from '@mui/material';

const Reports: React.FC = () => {
  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Reports
      </Typography>
      <Paper sx={{ p: 3 }}>
        <Typography>
          Reports functionality coming soon...
        </Typography>
      </Paper>
    </Box>
  );
};

export default Reports;