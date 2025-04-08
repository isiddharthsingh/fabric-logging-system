import { createTheme } from '@mui/material/styles';

// Modern color palette
const theme = createTheme({
  palette: {
    primary: {
      main: '#3a36e0',
      light: '#6f6fe9',
      dark: '#2a26a0',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#ff5c93',
      light: '#ff8db7',
      dark: '#c31f65',
      contrastText: '#ffffff',
    },
    success: {
      main: '#00c853',
      light: '#5efc82',
      dark: '#009624',
      contrastText: '#ffffff',
    },
    error: {
      main: '#ff3d71',
      light: '#ff7a9e',
      dark: '#c30047',
      contrastText: '#ffffff',
    },
    warning: {
      main: '#ffaa00',
      light: '#ffdd4b',
      dark: '#c67c00',
      contrastText: '#ffffff',
    },
    info: {
      main: '#0095ff',
      light: '#6ec6ff',
      dark: '#0067cb',
      contrastText: '#ffffff',
    },
    background: {
      default: '#f7f9fc',
      paper: '#ffffff',
    },
    text: {
      primary: '#2e3a59',
      secondary: '#8f9bb3',
    },
    action: {
      active: '#3a36e0',
      hover: 'rgba(58, 54, 224, 0.08)',
      selected: 'rgba(58, 54, 224, 0.16)',
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontWeight: 700,
    },
    h2: {
      fontWeight: 700,
    },
    h3: {
      fontWeight: 600,
    },
    h4: {
      fontWeight: 600,
    },
    h5: {
      fontWeight: 600,
    },
    h6: {
      fontWeight: 600,
    },
    button: {
      fontWeight: 600,
      textTransform: 'none',
    },
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          boxShadow: 'none',
          '&:hover': {
            boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.1)',
          },
        },
        containedPrimary: {
          '&:hover': {
            backgroundColor: '#4a47e3',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          boxShadow: '0px 2px 10px rgba(0, 0, 0, 0.05)',
          borderRadius: 12,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: '0px 2px 10px rgba(0, 0, 0, 0.05)',
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        head: {
          fontWeight: 600,
          backgroundColor: '#f7f9fc',
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 6,
          fontWeight: 500,
        },
      },
    },
  },
});

export default theme;
