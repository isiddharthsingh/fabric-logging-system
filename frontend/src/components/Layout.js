import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  AppBar,
  Box,
  CssBaseline,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  Container,
  Avatar,
  Tooltip,
  useTheme
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  List as ListIcon,
  Add as AddIcon,
  Assessment as AssessmentIcon,
  Notifications as NotificationsIcon,
  Settings as SettingsIcon,
  Storage as StorageIcon
} from '@mui/icons-material';

const drawerWidth = 260;

function Layout({ children }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const theme = useTheme();

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const menuItems = [
    { text: 'Dashboard', icon: <DashboardIcon />, path: '/' },
    { text: 'Logs', icon: <ListIcon />, path: '/logs' },
    { text: 'Create Log', icon: <AddIcon />, path: '/logs/create' },
    { divider: true },
  ];

  const drawer = (
    <div>
      <Box sx={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center',
        py: 3,
        backgroundColor: theme.palette.primary.main,
        color: 'white'
      }}>
        <Avatar 
          sx={{ 
            width: 60, 
            height: 60, 
            mb: 1,
            backgroundColor: 'white',
            color: theme.palette.primary.main,
            fontWeight: 'bold',
            fontSize: '1.5rem'
          }}
        >
          FL
        </Avatar>
        <Typography variant="h6" noWrap component="div" sx={{ fontWeight: 'bold' }}>
          Fabric Logging
        </Typography>
        <Typography variant="caption" sx={{ opacity: 0.8 }}>
          Hyperledger Fabric
        </Typography>
      </Box>
      <Divider />
      <List sx={{ pt: 2 }}>
        {menuItems.map((item, index) => (
          item.divider ? (
            <Divider key={`divider-${index}`} sx={{ my: 2 }} />
          ) : (
            <ListItem key={item.text} disablePadding sx={{ mb: 1 }}>
              <ListItemButton
                component={Link}
                to={item.path}
                selected={location.pathname === item.path}
                sx={{
                  borderRadius: '0 24px 24px 0',
                  mx: 1,
                  '&.Mui-selected': {
                    backgroundColor: theme.palette.primary.light,
                    color: 'white',
                    '& .MuiListItemIcon-root': {
                      color: 'white'
                    }
                  },
                  '&:hover': {
                    backgroundColor: theme.palette.action.hover,
                  }
                }}
              >
                <ListItemIcon sx={{ 
                  minWidth: 40,
                  color: location.pathname === item.path ? 'white' : theme.palette.text.secondary
                }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText 
                  primary={item.text} 
                  primaryTypographyProps={{ 
                    fontSize: '0.95rem',
                    fontWeight: location.pathname === item.path ? 600 : 400
                  }} 
                />
              </ListItemButton>
            </ListItem>
          )
        ))}
      </List>
    </div>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          ml: { sm: `${drawerWidth}px` },
          backgroundColor: 'white',
          color: theme.palette.text.primary,
          borderBottom: `1px solid ${theme.palette.divider}`
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { sm: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            Hyperledger Fabric Logging System
          </Typography>
          
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Tooltip title="Notifications">
              <IconButton color="inherit" size="large">
                <NotificationsIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Settings">
              <IconButton color="inherit" size="large">
                <SettingsIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="User Profile">
              <Avatar 
                sx={{ 
                  ml: 1,
                  width: 36, 
                  height: 36,
                  bgcolor: theme.palette.primary.main,
                  cursor: 'pointer'
                }}
              >
                US
              </Avatar>
            </Tooltip>
          </Box>
        </Toolbar>
      </AppBar>
      <Box
        component="nav"
        sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
        aria-label="mailbox folders"
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true, // Better open performance on mobile.
          }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>
      <Box
        component="main"
        sx={{ 
          flexGrow: 1, 
          p: 3, 
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          backgroundColor: theme.palette.background.default,
          minHeight: '100vh'
        }}
      >
        <Toolbar />
        <Container maxWidth="lg">
          {children}
        </Container>
      </Box>
    </Box>
  );
}

export default Layout;
