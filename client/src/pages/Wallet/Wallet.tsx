import React from 'react';
import { Typography, Paper, Box } from '@mui/material';

const Wallet: React.FC = () => {
  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Wallet
      </Typography>
      <Paper sx={{ p: 3 }}>
        <Typography>
          Wallet functionality coming soon...
        </Typography>
      </Paper>
    </Box>
  );
};

export default Wallet;