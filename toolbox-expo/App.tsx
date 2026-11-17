import { useState } from 'react';
import Constants from 'expo-constants';
import { ActivityIndicator, Linking, NativeModules, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';

function previewUrl() {
  const scriptUrl: string | undefined = NativeModules.SourceCode?.getConstants?.()?.scriptURL
    ?? NativeModules.SourceCode?.scriptURL;
  const origin = scriptUrl?.match(/^https?:\/\/[^/]+/)?.[0];
  const host = Constants.expoConfig?.hostUri;
  return origin ? `${origin}/toolbox-web/` : host ? `http://${host}/toolbox-web/` : undefined;
}

function openExternal(url: string, onError: () => void) {
  if (/^https?:\/\//.test(url)) void Linking.openURL(url).catch(onError);
}

export default function App() {
  const [reload, setReload] = useState(0);
  const [error, setError] = useState('');
  const url = previewUrl();
  const open = (target: string) => openExternal(target, () => setError('Could not open the external link.'));

  return <SafeAreaProvider>
    <SafeAreaView style={styles.screen}>
      {!url || error ? <View style={styles.message}>
        <Text style={styles.title}>Toolbox Preview</Text>
        <Text style={styles.copy}>{error || 'Expo Go could not find the Toolbox preview server.'}</Text>
        <Pressable style={styles.button} accessibilityRole="button" onPress={() => { setError(''); setReload(value => value + 1); }}>
          <Text style={styles.buttonLabel}>Try again</Text>
        </Pressable>
      </View> : <WebView
        key={reload}
        style={styles.screen}
        source={{ uri: url }}
        startInLoadingState
        renderLoading={() => <View style={styles.loader}><ActivityIndicator color="#194b3b" /><Text style={styles.copy}>Opening Toolbox…</Text></View>}
        onError={() => setError('Check that the Expo preview server is still running and reachable.')}
        onHttpError={({ nativeEvent }) => {
          if (nativeEvent.url === url) setError('The Toolbox web build is unavailable. Build it and restart Expo.');
        }}
        onShouldStartLoadWithRequest={request => {
          if (request.url.startsWith(url) || request.url.startsWith('blob:') || request.url === 'about:blank') return true;
          if (request.isTopFrame !== false) open(request.url);
          return false;
        }}
        onOpenWindow={({ nativeEvent }) => open(nativeEvent.targetUrl)}
      />}
    </SafeAreaView>
  </SafeAreaProvider>;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#f6f8f5' },
  loader: { ...StyleSheet.absoluteFill, justifyContent: 'center', alignItems: 'center', gap: 12, backgroundColor: '#f6f8f5' },
  message: { flex: 1, justifyContent: 'center', padding: 28, gap: 14 },
  title: { fontSize: 26, fontWeight: '700', color: '#142e26' },
  copy: { color: '#50655c', fontSize: 15 },
  button: { alignSelf: 'flex-start', paddingHorizontal: 16, paddingVertical: 12, borderRadius: 8, backgroundColor: '#194b3b' },
  buttonLabel: { color: '#fff', fontWeight: '600' }
});
