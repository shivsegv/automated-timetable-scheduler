import React from 'react';
import { Box, Typography, Button, Stack, alpha } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';

/**
 * Reusable EmptyState component for pages with no data
 * Addresses issues: #9, #10, #11, #12, #69 (empty state improvements)
 */
function EmptyState({ 
  icon: Icon, 
  title = 'No data available', 
  description = 'There is nothing to display here yet.',
  actions = [],
  variant = 'default' // 'default' | 'compact' | 'large'
}) {
  const getSize = () => {
    switch (variant) {
      case 'compact':
        return { iconSize: 80, py: 4 };
      case 'large':
        return { iconSize: 140, py: 10 };
      default:
        return { iconSize: 100, py: 6 };
    }
  };

  const { iconSize, py } = getSize();

  return (
    <Box 
      className="empty-illustration"
      sx={{
        textAlign: 'center',
        py,
        px: 3,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: variant === 'compact' ? 200 : 300,
        borderRadius: 2,
        border: '2px dashed',
        borderColor: alpha('#94a3b8', 0.3),
        backgroundColor: alpha('#f8fafc', 0.5)
      }}
    >
      {Icon && (
        <Box
          sx={{
            width: iconSize,
            height: iconSize,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '50%',
            backgroundColor: alpha('#e0e7ff', 0.6),
            mb: 3
          }}
        >
          <Icon 
            sx={{ 
              fontSize: iconSize * 0.6,
              color: 'primary.main',
              opacity: 0.7
            }} 
          />
        </Box>
      )}
      
      <Typography 
        variant={variant === 'compact' ? 'h6' : 'h5'} 
        gutterBottom 
        fontWeight={600}
        color="text.primary"
      >
        {title}
      </Typography>
      
      <Typography 
        variant="body1" 
        color="text.secondary" 
        paragraph
        sx={{ maxWidth: 500, mb: actions.length > 0 ? 3 : 0 }}
      >
        {description}
      </Typography>
      
      {actions.length > 0 && (
        <Stack 
          direction={{ xs: 'column', sm: 'row' }}
          spacing={2} 
          justifyContent="center" 
          sx={{ width: { xs: '100%', sm: 'auto' } }}
        >
          {actions.map((action, idx) => (
            <Button
              key={idx}
              component={action.to ? RouterLink : 'button'}
              to={action.to}
              href={action.href}
              onClick={action.onClick}
              variant={action.variant || 'outlined'}
              color={action.color || 'primary'}
              startIcon={action.icon}
              disabled={action.disabled}
              fullWidth={action.fullWidth}
              size={variant === 'compact' ? 'small' : 'medium'}
              sx={{
                minWidth: variant === 'compact' ? 120 : 140
              }}
            >
              {action.label}
            </Button>
          ))}
        </Stack>
      )}
    </Box>
  );
}

export default EmptyState;
