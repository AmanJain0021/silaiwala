// Port of modules/tailor/layouts/TailorAuthLayout.jsx — white full-page shell for login/signup/forgot.
import React from 'react';
import Screen from '../common/Screen';
import { Box, Scroll } from '../ui/primitives';

export default function TailorAuthLayout({ children, isSignup = false }) {
  return (
    <Screen className="bg-white">
      <Scroll className="flex-1" contentClassName="px-4 py-6 pt-5 pb-5" contentContainerStyle={{ flexGrow: 1 }}>
        <Box className={`w-full ${isSignup ? 'max-w-[620px]' : 'max-w-[400px]'} mx-auto flex flex-col items-center`}>{children}</Box>
      </Scroll>
    </Screen>
  );
}

export const withTailorAuthLayout = (ScreenComponent, opts = {}) => {
  const Wrapped = (props) => (
    <TailorAuthLayout isSignup={opts.isSignup}>
      <ScreenComponent {...props} />
    </TailorAuthLayout>
  );
  Wrapped.displayName = `withTailorAuthLayout(${ScreenComponent.displayName || ScreenComponent.name || 'Screen'})`;
  return Wrapped;
};
