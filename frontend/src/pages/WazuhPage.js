import React, { useEffect, useState } from 'react';
import { Box, Typography, Button, Card, CardContent, Link, Chip, Stack, CircularProgress, Tooltip } from '@mui/material';
import SecurityIcon from '@mui/icons-material/Security';
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';

const WAZUH_URL = 'https://3.14.64.44/';

function useWazuhStatus(pollInterval = 30000) {
  const [status, setStatus] = useState('checking'); // 'online', 'offline', 'checking'

  useEffect(() => {
    let mounted = true;
    let timeoutId;

    const checkStatus = async () => {
      setStatus('checking');
      try {
        // Try to fetch a lightweight resource (favicon is usually present)
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 5000);
        await fetch(WAZUH_URL + 'favicon.ico', { method: 'GET', mode: 'no-cors', signal: controller.signal });
        clearTimeout(timeout);
        if (mounted) setStatus('online');
      } catch (e) {
        if (mounted) setStatus('offline');
      }
      timeoutId = setTimeout(checkStatus, pollInterval);
    };
    checkStatus();
    return () => {
      mounted = false;
      clearTimeout(timeoutId);
    };
  }, [pollInterval]);
  return status;
}

// Animated SVG background component
const AnimatedBg = () => (
  <Box
    sx={{
      position: 'absolute',
      width: '100%',
      height: '100%',
      zIndex: 0,
      top: 0,
      left: 0,
      overflow: 'hidden',
      pointerEvents: 'none',
      opacity: 0.22,
    }}
  >
    <svg width="100%" height="100%" style={{ position: 'absolute', top: 0, left: 0 }}>
      <defs>
        <radialGradient id="shieldGlow" cx="50%" cy="50%" r="80%">
          <stop offset="0%" stopColor="#3a36e0" stopOpacity="0.6" />
          <stop offset="100%" stopColor="#5efc82" stopOpacity="0.1" />
        </radialGradient>
      </defs>
      {/* Animated floating shields */}
      <g>
        {[...Array(6)].map((_, i) => (
          <g key={i} style={{
            transform: `translateY(${Math.sin(Date.now()/900 + i)*18 + 45 + i*8}px) translateX(${(i%2===0?1:-1)*(i*30+40)}px)`
          }}>
            <path
              d="M20 10 Q25 20 20 30 Q15 20 20 10 Z"
              fill="url(#shieldGlow)"
              opacity={0.5}
              style={{
                transform: `scale(${1 + i*0.1}) rotate(${i*15}deg)`
              }}
            />
          </g>
        ))}
      </g>
    </svg>
  </Box>
);

const WazuhPage = () => {
  const status = useWazuhStatus();

  // Status UI
  let statusColor = '#ffb300';
  let statusLabel = 'Checking...';
  let chipBg = 'rgba(255,179,0,0.12)';
  let statusText = 'Status: Checking Wazuh node...';
  if (status === 'online') {
    statusColor = '#36e05e';
    statusLabel = 'Online';
    chipBg = 'rgba(54,224,94,0.12)';
    statusText = 'Status: Wazuh node reachable';
  } else if (status === 'offline') {
    statusColor = '#e03636';
    statusLabel = 'Offline';
    chipBg = 'rgba(224,54,54,0.12)';
    statusText = 'Status: Wazuh node unreachable';
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(120deg, #23243a 0%, #3a36e0 60%, #5efc82 100%)',
        overflow: 'hidden',
        py: 8,
      }}
    >
      <AnimatedBg />
      <Card
        sx={{
          position: 'relative',
          zIndex: 1,
          p: { xs: 3, sm: 5 },
          borderRadius: 8,
          minWidth: 340,
          maxWidth: 450,
          width: '90%',
          textAlign: 'center',
          background: 'rgba(255,255,255,0.16)',
          boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
          backdropFilter: 'blur(16px)',
          border: '1.5px solid rgba(58,54,224,0.16)',
        }}
      >
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 1 }}>
            <SecurityIcon sx={{ fontSize: 74, color: '#3a36e0', filter: 'drop-shadow(0 0 12px #5efc82)' }} />
          </Box>
          <Typography variant="h2" fontWeight={900} color="primary" sx={{ mb: 1, letterSpacing: 1, fontSize: { xs: '2.2rem', sm: '2.7rem' } }}>
            Wazuh Security
          </Typography>
          <Stack direction="row" spacing={1} alignItems="center" justifyContent="center" sx={{ mb: 2 }}>
            <Tooltip title={statusText} arrow>
              <Chip
                icon={<FiberManualRecordIcon sx={{ color: statusColor, fontSize: 18 }} />}
                label={<Typography variant="body2" fontWeight={700} color={statusColor}>{statusLabel}</Typography>}
                sx={{ bgcolor: chipBg, color: statusColor, px: 1.5, fontWeight: 700 }}
                size="small"
              />
            </Tooltip>
            <Typography variant="caption" color="text.secondary">{statusText}</Typography>
          </Stack>
          <Typography variant="body1" sx={{ mb: 3, color: '#222', fontWeight: 500, fontSize: '1.08rem', lineHeight: 1.6 }}>
            Monitor your infrastructure security, threats, and compliance with <b>Wazuh</b>.<br />
            Access the real-time dashboard below.
          </Typography>
          <Button
            variant="contained"
            color="success"
            size="large"
            sx={{
              px: 7,
              py: 1.8,
              fontWeight: 900,
              fontSize: '1.18rem',
              borderRadius: 4,
              boxShadow: '0 0 12px 2px #5efc82, 0 2px 12px #3a36e055',
              background: 'linear-gradient(90deg, #3a36e0 10%, #36e05e 90%)',
              transition: 'box-shadow 0.3s, transform 0.3s',
              '&:hover': {
                boxShadow: '0 0 20px 6px #5efc82, 0 2px 18px #3a36e0',
                transform: 'scale(1.035)',
                background: 'linear-gradient(90deg, #36e05e 10%, #3a36e0 90%)',
              },
              mb: 2,
            }}
            href="https://3.14.64.44/"
            target="_blank"
            rel="noopener noreferrer"
          >
            Open Wazuh Dashboard
          </Button>
          <Box sx={{ mt: 1 }}>
            <Link
              href="https://documentation.wazuh.com/current/index.html"
              target="_blank"
              rel="noopener noreferrer"
              underline="hover"
              color="primary"
              fontWeight={700}
              sx={{ fontSize: '0.97rem', letterSpacing: 0.2 }}
            >
              Learn more about Wazuh
            </Link>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default WazuhPage;
