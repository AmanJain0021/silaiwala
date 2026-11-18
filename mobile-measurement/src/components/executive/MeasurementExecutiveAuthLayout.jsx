// Port of modules/measurement-executive/layouts/MeasurementExecutiveAuthLayout.jsx: white page for login/signup/forgot.
import React from 'react';
import Screen from '../common/Screen';
import { Box, Scroll } from '../ui/primitives';

export default function MeasurementExecutiveAuthLayout({ children, isSignup = false }) {
  return (
    <Screen className="bg-white">
      <Scroll className="flex-1" contentClassName="p-4 items-center justify-center" contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
        <Box className={`w-full ${isSignup ? 'max-w-[620px]' : 'max-w-[400px]'} mx-auto flex flex-col items-center py-4`}>{children}</Box>
      </Scroll>
    </Screen>
  );
}

export const withExecutiveAuthLayout = (ScreenComponent, opts = {}) => {
  const Wrapped = (props) => (
    <MeasurementExecutiveAuthLayout isSignup={opts.isSignup}>
      <ScreenComponent {...props} />
    </MeasurementExecutiveAuthLayout>
  );
  Wrapped.displayName = `withExecutiveAuthLayout(${ScreenComponent.displayName || ScreenComponent.name || 'Screen'})`;
  return Wrapped;
};
