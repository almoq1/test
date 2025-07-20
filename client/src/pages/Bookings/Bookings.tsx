import React from 'react';
import { Typography, Paper, Box } from '@mui/material';

const Bookings: React.FC = () => {
  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        My Bookings
      </Typography>
      <Paper sx={{ p: 3 }}>
        <Typography>
          Booking management functionality coming soon...
        </Typography>
      </Paper>
    </Box>
  );
};

export default Bookings;