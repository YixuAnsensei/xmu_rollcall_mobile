import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
  Alert,
} from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { useRouter } from 'expo-router';
import { setAuth } from '../../lib/auth';
import { getProfile } from '../../lib/api';

const BASE_URL = 'https://lnt.xmu.edu.cn';

export default function LoginScreen() {
  const router = useRouter();
  const [status, setStatus] = useState('点击按钮开始登录');
  const [cookieInput, setCookieInput] = useState('');
  const [validating, setValidating] = useState(false);

  const handleOpenLogin = async () => {
    try {
      setStatus('正在打开浏览器...');
      const result = await WebBrowser.openAuthSessionAsync(
        BASE_URL,
        BASE_URL,
        {
          showInRecents: true,
          preferEphemeralSession: false,
        }
      );

      if (result.type === 'success') {
        setStatus('✅ 已在浏览器中打开，请登录后回到此页面');
      } else {
        setStatus('浏览器已关闭');
      }
    } catch (e) {
      setStatus('❌ 打开失败，请重试');
    }
  };

  const handleValidateCookie = async () => {
    const cookie = cookieInput.trim();
    if (!cookie) {
      Alert.alert('提示', '请先粘贴 Cookie');
      return;
    }

    setValidating(true);
    setStatus('正在验证 Cookie...');

    try {
      const profile = await getProfile(cookie);
      setAuth(cookie, profile.id, profile.name);
      setStatus('✅ 登录成功！欢迎，' + profile.name);
      Alert.alert('登录成功', '欢迎，' + profile.name + '！', [
        { text: '好的', onPress: () => router.replace('/screens/HomeScreen') },
      ]);
    } catch (e) {
      setStatus('❌ Cookie 无效，请检查后重试');
      Alert.alert('登录失败', 'Cookie 已过期或无效，请重新获取');
    } finally {
      setValidating(false);
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

        <TouchableOpacity
          style={styles.loginBtn}
          onPress={handleOpenLogin}
          activeOpacity={0.8}
        >
          <Text style={styles.loginBtnText}>🐾 打开登录页面</Text>
        </TouchableOpacity>

        <View style={styles.divider}>
          <Text style={styles.dividerText}>或手动粘贴 Cookie</Text>
        </View>

        <Text style={styles.hint}>
          在已登录的浏览器中按 F12 → 应用 → Cookie → 复制 lnt.xmu.edu.cn 的 cookie 值
        </Text>

        <TextInput
          style={styles.cookieInput}
          placeholder="粘贴 Cookie..."
          placeholderTextColor="#A7A9BE"
          value={cookieInput}
          onChangeText={setCookieInput}
          multiline
          numberOfLines={3}
          textAlignVertical="top"
          autoCapitalize="none"
          autoCorrect={false}
        />

        <TouchableOpacity
          style={[styles.validateBtn, validating && styles.validateBtnDisabled]}
          onPress={handleValidateCookie}
          disabled={validating}
          activeOpacity={0.8}
        >
          {validating ? (
            <ActivityIndicator size="small" color="#0F0E17" />
          ) : (
            <Text style={styles.validateBtnText}>✅ 验证并登录</Text>
          )}
        </TouchableOpacity>

        <View style={styles.statusWrap}>
          <ActivityIndicator
            size="small"
            color={status.includes('✅') ? '#06D6A0' : status.includes('❌') ? '#EF476F' : '#FF6B9D'}
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
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
    width: '100%',
  },
  dividerText: {
    color: '#A7A9BE',
    fontSize: 13,
  },
  hint: {
    fontSize: 12,
    color: '#A7A9BE',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 20,
    opacity: 0.8,
  },
  cookieInput: {
    backgroundColor: '#1A1828',
    borderRadius: 12,
    padding: 14,
    width: '100%',
    minHeight: 100,
    color: '#FFFFFE',
    fontSize: 12,
    fontFamily: 'monospace',
    borderWidth: 1,
    borderColor: '#221F33',
    marginBottom: 20,
    textAlignVertical: 'top',
  },
  validateBtn: {
    backgroundColor: '#06D6A0',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 40,
    minWidth: 200,
    alignItems: 'center',
    marginBottom: 24,
  },
  validateBtnDisabled: {
    opacity: 0.6,
  },
  validateBtnText: {
    color: '#0F0E17',
    fontSize: 15,
    fontWeight: 'bold',
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
});
