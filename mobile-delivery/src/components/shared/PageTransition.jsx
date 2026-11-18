// Port of shared/components/PageTransition.jsx (converted with scripts/web2rn.js, then reviewed)
import React from "react";
import { Box, Scroll } from '../ui/primitives';
/**
 * PageTransition - Wrapper component for smooth page transitions
 */
const PageTransition = ({
  children,
  className = ''
}) => {
  return <Box className={`flex-1 ${className}`}>
      {children}
    </Box>;
};
export default PageTransition;