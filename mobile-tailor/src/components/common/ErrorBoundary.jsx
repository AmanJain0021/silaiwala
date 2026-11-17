// App-level crash screen ("something went wrong / retry") — replaces frontend/src/ErrorBoundary.jsx.
import React from 'react';
import { View } from 'react-native';
import { AlertTriangle, RefreshCw } from 'lucide-react-native';
import { Box, Txt, Btn, I } from '../ui/primitives';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch() {
    // no logging of user data in release builds
  }

  handleRetry = () => this.setState({ hasError: false });

  render() {
    if (!this.state.hasError) return this.props.children;
    return (
      <View style={{ flex: 1, backgroundColor: '#ffffff' }}>
        <Box className="flex-1 flex flex-col items-center justify-center p-6 bg-white text-center">
          <Box className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mb-4">
            <I icon={AlertTriangle} size={32} color="#ef4444" />
          </Box>
          <Txt className="text-xl font-bold text-gray-900 mb-2">Something went wrong</Txt>
          <Txt className="text-sm text-gray-500 mb-6 max-w-xs">An unexpected error occurred. Please try again.</Txt>
          <Btn onPress={this.handleRetry} className="flex items-center gap-2 px-6 py-3 bg-[#843D9B] text-white rounded-xl font-bold">
            <I icon={RefreshCw} size={18} color="#fff" />
            <Txt>Retry</Txt>
          </Btn>
        </Box>
      </View>
    );
  }
}
