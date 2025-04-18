import { createTheme } from '@mui/material/styles';

// Function to create theme based on mode (light or dark)
const createAppTheme = (mode) => createTheme({
  palette: {
    mode,
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
      ...(mode === 'light'
        ? {
            default: '#f7f9fc',
            paper: '#ffffff',
          }
        : {
            default: '#1a1a2e',
            paper: '#252841',
          }),
    },
    text: {
      ...(mode === 'light'
        ? {
            primary: '#2e3a59',
            secondary: '#8f9bb3',
          }
        : {
            primary: '#f0f0f7',
            secondary: '#a5a6c0',
          }),
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
        root: ({ theme }) => ({
          boxShadow: theme.palette.mode === 'light' 
            ? '0px 2px 10px rgba(0, 0, 0, 0.05)' 
            : '0px 2px 10px rgba(0, 0, 0, 0.2)',
          borderRadius: 12,
        }),
      },
    },
    MuiCard: {
      styleOverrides: {
        root: ({ theme }) => ({
          borderRadius: 12,
          boxShadow: theme.palette.mode === 'light' 
            ? '0px 2px 10px rgba(0, 0, 0, 0.05)' 
            : '0px 2px 10px rgba(0, 0, 0, 0.2)',
        }),
      },
    },
    MuiTableCell: {
      styleOverrides: {
        head: ({ theme }) => ({
          fontWeight: 600,
          backgroundColor: theme.palette.mode === 'light' 
            ? '#f7f9fc' 
            : '#2a2d45',
        }),
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

// Export theme creator function
export default createAppTheme;
