import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  Box,
  Container,
  Typography,
  TextField,
  Button,
  Paper,
  Avatar,
  Alert,
  CircularProgress,
  InputAdornment,
  IconButton,
  Divider,
  Fade,
  Card,
  CardContent
} from '@mui/material';
import {
  LockOutlined,
  Visibility,
  VisibilityOff,
  Person as PersonIcon,
  Lock as LockIcon,
  Security as SecurityIcon
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';

function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  const { isAuthenticated, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  
  const handleTogglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };
  
  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      const from = location.state?.from?.pathname || '/';
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, location]);
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      const success = login(username, password);
      
      if (success) {
        const from = location.state?.from?.pathname || '/';
        navigate(from, { replace: true });
      } else {
        setError('Invalid username or password');
      }
    } catch (err) {
      setError('An error occurred during login');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 100%)`,
        padding: 3
      }}
    >
      <Container maxWidth="sm">
        <Fade in={true} timeout={800}>
          <Card
            elevation={10}
            sx={{
              borderRadius: 4,
              overflow: 'hidden',
              boxShadow: '0 10px 40px rgba(0,0,0,0.25)'
            }}
          >
            <Box
              sx={{
                display: 'flex',
                flexDirection: { xs: 'column', sm: 'row' },
                height: { sm: '500px' }
              }}
            >
              {/* Left side - Brand section */}
              <Box
                sx={{
                  flex: { sm: '0 0 40%' },
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  alignItems: 'center',
                  color: 'white',
                  p: 4,
                  background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
                  position: 'relative',
                  overflow: 'hidden',
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundImage: 'url(/images/security-pattern.png)',
                    backgroundSize: 'cover',
                    opacity: 0.1,
                  }
                }}
              >
                <Box
                  sx={{
                    position: 'relative',
                    zIndex: 1,
                    textAlign: 'center'
                  }}
                >
                  <Avatar
                    src="/images/futeur-logo.png"
                    alt="Futeur Shield"
                    sx={{
                      width: 80,
                      height: 80,
                      mb: 2,
                      mx: 'auto',
                      bgcolor: 'white',
                      boxShadow: '0 4px 20px rgba(0,0,0,0.2)'
                    }}
                  />
                  <Typography variant="h4" component="h1" fontWeight="bold" gutterBottom>
                    Futeur Shield
                  </Typography>
                  <Typography variant="body1" sx={{ opacity: 0.8, mb: 3 }}>
                    Advanced Logging & Security System
                  </Typography>
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'center',
                      gap: 1,
                      mb: 2
                    }}
                  >
                    <SecurityIcon />
                    <Typography variant="body2" sx={{ opacity: 0.8 }}>
                      Secure Authentication
                    </Typography>
                  </Box>
                </Box>
              </Box>

              {/* Right side - Login form */}
              <Box
                sx={{
                  flex: { sm: '0 0 60%' },
                  p: 4,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center'
                }}
              >
                <Typography variant="h5" component="h2" fontWeight="bold" gutterBottom>
                  Welcome Back
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  Please sign in to access the Futeur Shield system.
                </Typography>

                {error && (
                  <Alert severity="error" sx={{ width: '100%', mb: 2 }}>
                    {error}
                  </Alert>
                )}

                <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
                  <TextField
                    margin="normal"
                    required
                    fullWidth
                    id="username"
                    label="Username"
                    name="username"
                    autoComplete="username"
                    autoFocus
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <PersonIcon color="primary" />
                        </InputAdornment>
                      ),
                    }}
                    sx={{
                      mb: 2,
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2
                      }
                    }}
                  />
                  <TextField
                    margin="normal"
                    required
                    fullWidth
                    name="password"
                    label="Password"
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <LockIcon color="primary" />
                        </InputAdornment>
                      ),
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            aria-label="toggle password visibility"
                            onClick={handleTogglePasswordVisibility}
                            edge="end"
                          >
                            {showPassword ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
                      )
                    }}
                    sx={{
                      mb: 3,
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2
                      }
                    }}
                  />
                  <Button
                    type="submit"
                    fullWidth
                    variant="contained"
                    size="large"
                    sx={{
                      py: 1.5,
                      borderRadius: 2,
                      textTransform: 'none',
                      fontSize: '1rem',
                      fontWeight: 'bold',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                      '&:hover': {
                        boxShadow: '0 6px 16px rgba(0,0,0,0.2)'
                      }
                    }}
                    disabled={loading}
                  >
                    {loading ? <CircularProgress size={24} /> : 'Sign In'}
                  </Button>

                  <Box sx={{ mt: 3, pt: 3, borderTop: `1px solid ${theme.palette.divider}`, textAlign: 'center' }}>
                    <Typography variant="body2" color="text.secondary">
                      Demo Credentials
                    </Typography>
                    <Box sx={{ display: 'flex', justifyContent: 'center', gap: 3, mt: 1 }}>
                      <Box>
                        <Typography variant="caption" color="text.secondary">
                          Username
                        </Typography>
                        <Typography variant="body2" fontWeight="bold">
                          admin
                        </Typography>
                      </Box>
                      <Divider orientation="vertical" flexItem />
                      <Box>
                        <Typography variant="caption" color="text.secondary">
                          Password
                        </Typography>
                        <Typography variant="body2" fontWeight="bold">
                          adminpw
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                </Box>
              </Box>
            </Box>
          </Card>
        </Fade>
      </Container>
    </Box>
  );
}

export default Login;
