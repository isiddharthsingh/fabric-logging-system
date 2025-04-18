import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useThemeMode } from '../contexts/ThemeContext';
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
  useTheme,
  Zoom,
  Fade
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  List as ListIcon,
  Add as AddIcon,
  Notifications as NotificationsIcon,
  Settings as SettingsIcon,
  Security as SecurityIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  LightMode as LightModeIcon,
  DarkMode as DarkModeIcon
} from '@mui/icons-material';

const drawerWidth = 260;
const collapsedDrawerWidth = 72;

function Layout({ children }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 600);
  const location = useLocation();
  const theme = useTheme();
  const { mode, toggleTheme } = useThemeMode();

  // Handle window resize
  React.useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 600);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleDrawerCollapse = () => {
    setCollapsed(!collapsed);
  };

  const menuItems = [
    { text: 'Dashboard', icon: <DashboardIcon />, path: '/' },
    { text: 'Logs', icon: <ListIcon />, path: '/logs' },
    { text: 'Create Log', icon: <AddIcon />, path: '/logs/create' },
    { divider: true },
    { text: 'Wazuh', icon: <SecurityIcon />, path: '/wazuh' },
  ];
  
  // Force collapsed view on mobile when drawer is closed
  const effectiveCollapsed = collapsed || (isMobile && !mobileOpen);
  
  // Create separate mobile menu component that always shows text labels
  const mobileMenu = (
    <Box sx={{ 
      display: 'flex', 
      flexDirection: 'column',
      height: '100%',
      overflow: 'hidden'
    }}>
      <Box sx={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center',
        py: 3,
        backgroundColor: theme.palette.primary.main,
        color: 'white',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <Box sx={{ 
          width: '100%', 
          display: 'flex', 
          justifyContent: 'center', 
          mb: 1,
          padding: '8px 0'
        }}>
          <Avatar 
            sx={{ 
              width: 60, 
              height: 60, 
              backgroundColor: 'white'
            }}
            src="/images/futeur-logo.png"
            alt="Futeur Shield"
          />
        </Box>
        <Box sx={{ textAlign: 'center', mt: 1 }}>
          <Typography variant="h6" noWrap component="div" sx={{ fontWeight: 'bold' }}>
            Futeur Shield
          </Typography>
          <Typography variant="caption" sx={{ opacity: 0.8 }}>
            Logging System 
          </Typography>
        </Box>
      </Box>
      <Divider />
      <List sx={{ pt: 2, overflow: 'hidden' }}>
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
                  minHeight: '48px',
                  justifyContent: 'flex-start',
                  px: 3,
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
                onClick={() => setMobileOpen(false)}
              >
                <ListItemIcon sx={{ 
                  minWidth: 40,
                  mr: 2,
                  color: location.pathname === item.path ? 'white' : theme.palette.text.secondary
                }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText 
                  primary={item.text} 
                  primaryTypographyProps={{ 
                    fontSize: '0.95rem',
                    fontWeight: location.pathname === item.path ? 600 : 400,
                    whiteSpace: 'nowrap'
                  }} 
                />
              </ListItemButton>
            </ListItem>
          )
        ))}
      </List>
    </Box>
  );



  // Desktop drawer - collapses based on user preference
  const drawer = (
    <Box sx={{ 
      display: 'flex', 
      flexDirection: 'column',
      height: '100%',
      overflow: 'hidden'
    }}>
      <Box sx={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center',
        py: 3,
        backgroundColor: theme.palette.primary.main,
        color: 'white',
        position: 'relative',
        overflow: 'hidden',
        transition: 'all 0.3s ease'
      }}>
        <Box sx={{ 
          width: '100%', 
          display: 'flex', 
          justifyContent: 'center', 
          mb: effectiveCollapsed ? 0 : 1,
          padding: '8px 0'
        }}>
          <Avatar 
            sx={{ 
              width: effectiveCollapsed ? 40 : 60, 
              height: effectiveCollapsed ? 40 : 60, 
              backgroundColor: 'white',
              transition: 'all 0.3s ease'
            }}
            src="/images/futeur-logo.png"
            alt="Futeur Shield"
          />
        </Box>
        <Fade in={!effectiveCollapsed}>
          <Box sx={{ textAlign: 'center', mt: 1 }}>
            <Typography variant="h6" noWrap component="div" sx={{ fontWeight: 'bold' }}>
              Futer Shield
            </Typography>
            <Typography variant="caption" sx={{ opacity: 0.8 }}>
              Logging System
            </Typography>
          </Box>
        </Fade>
      </Box>
      <Divider />
      <List sx={{ pt: 2, overflow: 'hidden' }}>
        {menuItems.map((item, index) => (
          item.divider ? (
            <Divider key={`divider-${index}`} sx={{ my: 2 }} />
          ) : (
            <Tooltip 
              key={item.text} 
              title={effectiveCollapsed ? item.text : ""} 
              placement="right"
              TransitionComponent={Zoom}
              arrow
            >
              <ListItem disablePadding sx={{ mb: 1 }}>
                <ListItemButton
                  component={Link}
                  to={item.path}
                  selected={location.pathname === item.path}
                  sx={{
                    borderRadius: '0 24px 24px 0',
                    mx: 1,
                    minHeight: '48px',
                    justifyContent: effectiveCollapsed ? 'center' : 'flex-start',
                    px: effectiveCollapsed ? 2.5 : 3,
                    '&.Mui-selected': {
                      backgroundColor: theme.palette.primary.light,
                      color: 'white',
                      '& .MuiListItemIcon-root': {
                        color: 'white'
                      }
                    },
                    '&:hover': {
                      backgroundColor: theme.palette.action.hover,
                    },
                    transition: 'all 0.2s ease'
                  }}
                >
                  <ListItemIcon sx={{ 
                    minWidth: effectiveCollapsed ? 0 : 40,
                    mr: effectiveCollapsed ? 0 : 2,
                    color: location.pathname === item.path ? 'white' : theme.palette.text.secondary,
                    justifyContent: 'center',
                    '& .MuiSvgIcon-root': {
                      fontSize: effectiveCollapsed ? '1.5rem' : '1.25rem'
                    }
                  }}>
                    {item.icon}
                  </ListItemIcon>
                  {!effectiveCollapsed && (
                    <ListItemText 
                      primary={item.text} 
                      primaryTypographyProps={{ 
                        fontSize: '0.95rem',
                        fontWeight: location.pathname === item.path ? 600 : 400,
                        whiteSpace: 'nowrap'
                      }} 
                    />
                  )}
                </ListItemButton>
              </ListItem>
            </Tooltip>
          )
        ))}
      </List>
      {/* Collapse button at the bottom of sidebar */}
      {!isMobile && (
        <Box sx={{ 
          mt: 'auto', 
          display: 'flex',
          justifyContent: 'center',
          py: 2,
          borderTop: `1px solid ${theme.palette.divider}`
        }}>
          <Tooltip title={effectiveCollapsed ? "Expand sidebar" : "Collapse sidebar"}>
            <IconButton
              onClick={handleDrawerCollapse}
              size="small"
              sx={{ 
                bgcolor: theme.palette.action.hover,
                '&:hover': {
                  bgcolor: theme.palette.action.selected
                },
                transition: 'all 0.3s ease',
              }}
            >
              {effectiveCollapsed ? <ChevronRightIcon /> : <ChevronLeftIcon />}
            </IconButton>
          </Tooltip>
        </Box>
      )}
    </Box>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          width: { sm: `calc(100% - ${effectiveCollapsed ? collapsedDrawerWidth : drawerWidth}px)` },
          ml: { sm: `${effectiveCollapsed ? collapsedDrawerWidth : drawerWidth}px` },
          backgroundColor: mode === 'light' ? 'white' : theme.palette.background.paper,
          color: theme.palette.text.primary,
          borderBottom: `1px solid ${theme.palette.divider}`,
          transition: 'all 0.3s ease'
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
            Fabric Logging System
          </Typography>
          
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Tooltip title={mode === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}>
              <IconButton 
                color="inherit" 
                size="large" 
                onClick={toggleTheme}
                sx={{ 
                  transition: 'transform 0.3s ease',
                  '&:hover': { transform: 'rotate(30deg)' } 
                }}
              >
                {mode === 'light' ? <DarkModeIcon /> : <LightModeIcon />}
              </IconButton>
            </Tooltip>
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
        sx={{ 
          width: { sm: effectiveCollapsed ? collapsedDrawerWidth : drawerWidth }, 
          flexShrink: { sm: 0 },
          transition: 'width 0.3s ease'
        }}
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
            '& .MuiDrawer-paper': { 
              boxSizing: 'border-box', 
              width: drawerWidth,
              boxShadow: '0 10px 30px -12px rgba(0, 0, 0, 0.42)',
              overflowX: 'hidden'
            },
          }}
        >
          {mobileMenu}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': { 
              boxSizing: 'border-box', 
              width: effectiveCollapsed ? collapsedDrawerWidth : drawerWidth,
              overflowX: 'hidden',
              transition: 'width 0.3s ease',
              boxShadow: '0 10px 30px -12px rgba(0, 0, 0, 0.1)'
            },
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
          width: { sm: `calc(100% - ${effectiveCollapsed ? collapsedDrawerWidth : drawerWidth}px)` },
          backgroundColor: theme.palette.background.default,
          minHeight: '100vh',
          transition: 'all 0.3s ease'
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
