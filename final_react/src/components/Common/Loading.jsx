import React from 'react';
import { CircularProgress, Box, Typography } from '@mui/material';

const Loading = ({ message = '로딩 중...' }) => {
  return (
    <Box 
      className="flex flex-col items-center justify-center min-h-screen"
      display="flex" 
      flexDirection="column" 
      alignItems="center" 
      justifyContent="center"
    >
      <CircularProgress size={60} className="mb-4" />
      <Typography variant="h6" className="text-gray-600">
        {message}
      </Typography>
    </Box>
  );
};

export default Loading;
