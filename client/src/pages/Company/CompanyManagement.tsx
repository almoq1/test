import React from 'react';
import { Typography, Paper, Box } from '@mui/material';

const CompanyManagement: React.FC = () => {
  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Company Management
      </Typography>
      <Paper sx={{ p: 3 }}>
        <Typography>
          Company management functionality coming soon...
        </Typography>
      </Paper>
    </Box>
  );
};

export default CompanyManagement;