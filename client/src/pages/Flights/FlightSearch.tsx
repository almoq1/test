import React from 'react';
import { Typography, Paper, Box } from '@mui/material';

const FlightSearch: React.FC = () => {
  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Flight Search
      </Typography>
      <Paper sx={{ p: 3 }}>
        <Typography>
          Flight search functionality coming soon...
        </Typography>
      </Paper>
    </Box>
  );
};

export default FlightSearch;