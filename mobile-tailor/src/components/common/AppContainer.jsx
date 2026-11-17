// Port of components/Common/AppContainer.jsx — on phones it is a full-screen white page.
import React from 'react';
import Screen from './Screen';
import { Box } from '../ui/primitives';

const AppContainer = ({ children, className = '' }) => (
  <Screen className="bg-white">
    <Box className={`flex-1 bg-white relative flex flex-col overflow-hidden ${className}`}>{children}</Box>
  </Screen>
);
export default AppContainer;
