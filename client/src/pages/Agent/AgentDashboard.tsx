import React from 'react';
import { Typography, Paper, Box } from '@mui/material';

const AgentDashboard: React.FC = () => {
  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Agent Dashboard
      </Typography>
      <Paper sx={{ p: 3 }}>
        <Typography>
          Agent dashboard functionality coming soon...
        </Typography>
      </Paper>
    </Box>
  );
};

export default AgentDashboard;