import React from 'react';
import { Typography, Paper, Box } from '@mui/material';

const Profile: React.FC = () => {
  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Profile
      </Typography>
      <Paper sx={{ p: 3 }}>
        <Typography>
          Profile management functionality coming soon...
        </Typography>
      </Paper>
    </Box>
  );
};

export default Profile;