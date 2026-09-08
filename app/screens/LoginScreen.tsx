import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  SafeAreaView,
  Linking,
} from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { useRouter } from 'expo-router';
import { setAuth } from '../../lib/auth';

const BASE_URL = 'https://lnt.xmu.edu.cn';
const CAS_URL = 'https://ids.xmu.edu.cn';

export default function LoginScreen() {
  const router = useRouter();
  const [status, setStatus] = useState('点击按钮开始登录');

  const handleLogin = async () => {
    try {
      setStatus('正在打开浏览器...');
      const result = await WebBrowser.openAuthSessionAsync(
        `${BASE_URL}/auth/cas/login?redirect=${encodeURIComponent(BASE_URL)}`,
        BASE_URL,
        {
          showInRecents: true,
          preferEphemeralSession: false,
        }
      );

      if (result.type === 'success') {
        const url = new URL(result.url);
        const cookie = document?.cookie || '';

        // Try to extract from URL params first
        const studentMatch = url.searchParams.get('student_id') || url.searchParams.get('id');

        if (studentMatch) {
          const studentId = parseInt(studentMatch, 10);
          if (!isNaN(studentId)) {
            setAuth(`session=${studentMatch}`, studentId);
            setStatus('✅ 登录成功！');
            setTimeout(() => router.replace('/screens/HomeScreen'), 500);
            return;
          }
        }
      }

      // Fallback: direct login via CAS
      await WebBrowser.openAuthSessionAsync(
        CAS_URL,
        CAS_URL,
        {
          showInRecents: true,
          preferEphemeralSession: false,
        }
      );

      setStatus('请完成登录后回到此页面');

    } catch (e) {
      setStatus('❌ 登录失败，请重试');
    }
  };

  // Try to extract student ID from the redirected URL
  const handleURL = async (event: { url: string }) => {
    const url = event.url;
    if (url.includes('lnt.xmu.edu.cn') && !url.includes('ids.xmu.edu.cn')) {
      try {
        const match = url.match(/\/student\/(\d+)\//);
        if (match) {
          const studentId = parseInt(match[1], 10);
          if (!isNaN(studentId)) {
            setAuth('mobile-session', studentId);
            setStatus('✅ 登录成功！');
            setTimeout(() => router.replace('/screens/HomeScreen'), 500);
          }
        }
      } catch {}
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>🐾 Zako 签到助手</Text>
        <Text style={styles.subtitle}>连接厦大 CAS 系统登录</Text>
      </View>

      <View style={styles.content}>
        <Text style={styles.icon}>🔐</Text>
        <Text style={styles.description}>
          将跳转到厦大 CAS 统一认证系统
        </Text>
        <Text style={styles.hint}>
          请使用学号和密码登录，登录后将自动提取凭证
        </Text>

        <TouchableOpacity
          style={styles.loginBtn}
          onPress={handleLogin}
          activeOpacity={0.8}
        >
          <Text style={styles.loginBtnText}>🐾 前往登录</Text>
        </TouchableOpacity>

        <View style={styles.statusWrap}>
          <ActivityIndicator
            size="small"
            color={status.includes('✅') ? '#06D6A0' : '#FF6B9D'}
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
  description: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFE',
    textAlign: 'center',
    marginBottom: 12,
  },
  hint: {
    fontSize: 14,
    color: '#A7A9BE',
    textAlign: 'center',
    marginBottom: 40,
    lineHeight: 22,
  },
  loginBtn: {
    backgroundColor: '#FF6B9D',
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 48,
    minWidth: 220,
    alignItems: 'center',
    marginBottom: 32,
  },
  loginBtnText: {
    color: '#0F0E17',
    fontSize: 16,
    fontWeight: 'bold',
  },
  statusWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  status: {
    marginLeft: 8,
    fontSize: 14,
    color: '#A7A9BE',
  },
});
