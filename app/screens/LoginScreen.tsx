import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  SafeAreaView,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { WebView } from 'react-native-webview';
import XmuCookie from '../../modules/xmu-cookie/src/XmuCookieModule';
import { setAuth } from '../../lib/auth';
import { getProfile } from '../../lib/api';

const BASE_URL = 'https://lnt.xmu.edu.cn';

export default function LoginScreen() {
  const router = useRouter();
  const [attempt, setAttempt] = useState(0);
  const [mode, setMode] = useState<'entry' | 'web'>('entry');
  const [status, setStatus] = useState('点击按钮打开学校 CAS 登录');
  const [pageLoading, setPageLoading] = useState(false);
  const handlingRef = React.useRef(false);

  const resetSession = () => {
    handlingRef.current = false;
    setAttempt((a) => a + 1);
  };

  useEffect(() => {
    if (mode === 'web') {
      XmuCookie.clearCookiesAsync().catch(() => {});
    }
  }, [mode, attempt]);

  const beginLogin = () => {
    setStatus('正在连接厦大 CAS 系统喵…');
    handlingRef.current = false;
    setAttempt((a) => a + 1);
    setMode('web');
  };

  const abortLogin = () => {
    setMode('entry');
    setStatus('已取消登录');
  };

  const handleLoginSuccess = async (cookie: string) => {
    const profile = await getProfile(cookie);
    setAuth(cookie, profile.id, profile.name);
    Alert.alert('登录成功喵❤', `欢迎，${profile.name || profile.id}！`, [
      { text: '好的', onPress: () => router.replace('/screens/HomeScreen') },
    ]);
  };

  const checkUrlAndCookie = async (url?: string) => {
    if (!url || handlingRef.current) return;
    if (url.includes('lnt.xmu.edu.cn') && !url.includes('ids.xmu.edu.cn')) {
      const cookie =
        (await XmuCookie.getCookieForUrlAsync('https://lnt.xmu.edu.cn')) ?? '';
      if (
        cookie.includes('session') ||
        cookie.includes('SESSION') ||
        cookie.includes('token') ||
        cookie.includes('tronclass')
      ) {
        handlingRef.current = true;
        setStatus('✅ 登录成功喵❤ 正在验证身份…');
        try {
          await handleLoginSuccess(cookie);
        } catch {
          handlingRef.current = false;
          setStatus('❌ Cookie 验证失败，请点击刷新或关闭重试喵');
        }
      }
    }
  };

  if (mode === 'web') {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.webHeader}>
          <Text style={styles.statusText} numberOfLines={1}>
            {status}
          </Text>
          <View style={styles.headerBtns}>
            <TouchableOpacity style={styles.headerBtn} onPress={resetSession}>
              <Text style={styles.headerBtnText}>刷新</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.headerBtn} onPress={abortLogin}>
              <Text style={styles.headerBtnText}>关闭</Text>
            </TouchableOpacity>
          </View>
        </View>
        {pageLoading && (
          <View style={styles.loadingBar}>
            <ActivityIndicator size="small" color="#FF6B9D" />
          </View>
        )}
        <WebView
          key={attempt}
          source={{ uri: BASE_URL }}
          sharedCookiesEnabled
          thirdPartyCookiesEnabled
          javaScriptEnabled
          domStorageEnabled
          cacheEnabled={false}
          cacheMode="LOAD_NO_CACHE"
          userAgent="Mozilla/5.0 (Linux; Android 14; Mobile) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36"
          onShouldStartLoadWithRequest={(e) => {
            checkUrlAndCookie(e.url);
            return true;
          }}
          onLoadStart={(e) => {
            setPageLoading(true);
            checkUrlAndCookie(e.nativeEvent.url);
          }}
          onLoadEnd={(e) => {
            setPageLoading(false);
            checkUrlAndCookie(e.nativeEvent.url);
          }}
          onError={() => {
            setPageLoading(false);
            if (!handlingRef.current) {
              setStatus('❌ 页面加载失败，请点击刷新重试喵');
            }
          }}
          style={styles.webview}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>🐾 Zako 签到助手</Text>
        <Text style={styles.subtitle}>连接厦大 CAS 系统登录</Text>
      </View>

      <View style={styles.content}>
        <Text style={styles.icon}>🔐</Text>

        <TouchableOpacity
          style={styles.loginBtn}
          onPress={beginLogin}
          activeOpacity={0.8}
        >
          <Text style={styles.loginBtnText}>🐾 打开 CAS 登录</Text>
        </TouchableOpacity>

        <Text style={styles.hint}>
          学校 Cookie 时效很短，每次使用都需重新登录。{'\n'}
          在打开的页面中输入统一认证账号密码，登录成功后会自动返回喵❤
        </Text>

        <View style={styles.statusWrap}>
          <ActivityIndicator
            size="small"
            color={
              status.includes('✅')
                ? '#06D6A0'
                : status.includes('❌')
                ? '#EF476F'
                : '#FF6B9D'
            }
          />
          <Text style={styles.status}>{status}</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F0E17',
  },
  header: {
    paddingTop: 32,
    paddingBottom: 16,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FF6B9D',
  },
  subtitle: {
    fontSize: 14,
    color: '#A7A9BE',
    marginTop: 4,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  icon: {
    fontSize: 64,
    marginBottom: 24,
  },
  loginBtn: {
    backgroundColor: '#FF6B9D',
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 48,
    minWidth: 220,
    alignItems: 'center',
    marginBottom: 24,
  },
  loginBtnText: {
    color: '#0F0E17',
    fontSize: 16,
    fontWeight: 'bold',
  },
  hint: {
    fontSize: 12,
    color: '#A7A9BE',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 20,
    opacity: 0.8,
  },
  statusWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  status: {
    marginLeft: 8,
    fontSize: 14,
    color: '#A7A9BE',
  },
  webHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#1A1828',
    borderBottomWidth: 1,
    borderBottomColor: '#221F33',
  },
  statusText: {
    flex: 1,
    color: '#A7A9BE',
    fontSize: 12,
    marginRight: 8,
  },
  headerBtns: {
    flexDirection: 'row',
  },
  headerBtn: {
    backgroundColor: '#FF6B9D',
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginLeft: 8,
  },
  headerBtnText: {
    color: '#0F0E17',
    fontSize: 13,
    fontWeight: 'bold',
  },
  loadingBar: {
    paddingVertical: 2,
    alignItems: 'center',
    backgroundColor: '#0F0E17',
  },
  webview: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
});
