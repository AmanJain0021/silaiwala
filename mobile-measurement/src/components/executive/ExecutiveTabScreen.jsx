// A bottom-nav page inside MeasurementExecutiveLayout. Pull-to-refresh (web: react-simple-pull-to-refresh) re-mounts the
// page, which re-runs its data loading; `scroll: false` is for a page that keeps a fixed header and scrolls itself.
import React, { useCallback, useState } from 'react';
import { RefreshControl } from 'react-native';
import { Box, Scroll } from '../ui/primitives';
import useRefreshOnReturn from '../../lib/useRefreshOnReturn';

export const withExecutiveTab = (ScreenComponent, { scroll = true } = {}) => {
  const Tab = (props) => {
    const [key, setKey] = useState(0);
    const [refreshing, setRefreshing] = useState(false);
    const returnKey = useRefreshOnReturn();
    const onRefresh = useCallback(() => {
      setRefreshing(true);
      setKey((k) => k + 1);
      setTimeout(() => setRefreshing(false), 600);
    }, []);
    const page = (
      <Box key={`${key}-${returnKey}`} className="flex-1 w-full">
        <ScreenComponent {...props} />
      </Box>
    );
    if (!scroll) return page;
    return (
      <Scroll
        className="flex-1 bg-gray-50"
        contentClassName="pb-6"
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#843D9B']} />}
      >
        {page}
      </Scroll>
    );
  };
  Tab.displayName = `withExecutiveTab(${ScreenComponent.displayName || ScreenComponent.name || 'Screen'})`;
  return Tab;
};
