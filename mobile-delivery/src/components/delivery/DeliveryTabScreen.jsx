// Each delivery tab scrolls inside the shared DeliveryLayout (web: the window scrolls under the fixed
// header/nav). Same padding as the web viewport (wallet is full-bleed); pull-to-refresh re-mounts the page.
import React, { useCallback, useState } from 'react';
import { RefreshControl } from 'react-native';
import { Box, Scroll } from '../ui/primitives';
import useRefreshOnReturn from '../../lib/useRefreshOnReturn';

export const withDeliveryTab = (ScreenComponent, { fullBleed = false } = {}) => {
  const Tab = (props) => {
    const [key, setKey] = useState(0);
    const [refreshing, setRefreshing] = useState(false);
    const returnKey = useRefreshOnReturn();
    const onRefresh = useCallback(() => {
      setRefreshing(true);
      setKey((k) => k + 1);
      setTimeout(() => setRefreshing(false), 600);
    }, []);
    return (
      <Scroll
        className="flex-1 bg-[#FAFAFB]"
        contentClassName={fullBleed ? 'pb-6' : 'px-4 pt-2.5 pb-6'}
        contentContainerStyle={{ flexGrow: 1 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#843D9B']} />}
      >
        <Box key={`${key}-${returnKey}`} className="flex-1 w-full">
          <ScreenComponent {...props} />
        </Box>
      </Scroll>
    );
  };
  Tab.displayName = `withDeliveryTab(${ScreenComponent.displayName || ScreenComponent.name || 'Screen'})`;
  return Tab;
};
