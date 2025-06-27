import React from 'react';
import { AppBar, Toolbar, Typography, Container, Box } from '@mui/material';
import Navbar from './Navbar';

const Layout = ({ children }) => {
  return (
    <div className="min-h-screen bg-gray-50">
      <AppBar position="static" className="bg-primary-600">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            CDSS - Clinical Decision Support System
          </Typography>
          <Navbar />
        </Toolbar>
      </AppBar>
      
      <Container maxWidth="xl" className="py-8">
        <Box className="bg-white rounded-lg shadow-sm p-6">
          {children}
        </Box>
      </Container>
    </div>
  );
};

export default Layout;
