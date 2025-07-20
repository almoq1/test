import React from 'react';
import { Typography, Paper, Box } from '@mui/material';

const UserManagement: React.FC = () => {
  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        User Management
      </Typography>
      <Paper sx={{ p: 3 }}>
        <Typography>
          User management functionality coming soon...
        </Typography>
      </Paper>
    </Box>
  );
};

export default UserManagement;