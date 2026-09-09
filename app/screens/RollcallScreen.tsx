import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  StatusBar,
  Alert,
  Clipboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { getAuth } from '../../lib/auth';
import {
  getSemesterInfo,
  getLatestRollcall,
  getNumberCode,
  submitNumberCode,
  radarLockCampus,
  radarTriangulate,
  isRadarType,
  fmtTime,
  getProfile,
} from '../../lib/api';

// ---------------------------------------------------------------------------
// Result shape
// ---------------------------------------------------------------------------

type DigitalResult = {
  type: 'digital';
  code: string;
  status: string | null;
  time: string;
  rid: string;
};
type RadarActiveResult = { type: 'radar_active'; time: string; rid: string };
type RadarPastResult = { type: 'radar_past'; time: string };
type OtherResult = { type: 'other'; time: string };
type NoResult = { type: 'none' };
type LoadingResult = { type: 'loading' };

type ResultType = DigitalResult | RadarActiveResult | RadarPastResult | OtherResult | NoResult | LoadingResult;

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

export default function RollcallScreen() {
  const router = useRouter();
  const { courseId, courseName } = useLocalSearchParams<{ courseId: string; courseName: string }>();

  const [result, setResult] = useState<ResultType>({ type: 'loading' });
  const [submitting, setSubmitting] = useState(false);
  const [radarRunning, setRadarRunning] = useState(false);

  useEffect(() => {
    fetchRollcall();
  }, [courseId]);

  const fetchRollcall = async () => {
    setResult({ type: 'loading' });
    try {
      const { cookie, studentId } = await getAuth();
      if (!cookie) {
        router.replace('/screens/LoginScreen');
        return;
      }
      const resolvedStudentId = studentId || (await getProfile(cookie)).id;
      const sem = await getSemesterInfo(cookie);
      const latest = await getLatestRollcall(parseInt(courseId, 10), cookie, resolvedStudentId);

      if (!latest) {
        setResult({ type: 'none' });
        return;
      }

      const rid = String(latest.id || latest.rollcall_id || '');
      const time = fmtTime(latest.created_at || latest.rollcall_time);
      const radar = isRadarType(latest);

      if (radar) {
        setResult({ type: 'radar_active', time, rid });
        return;
      }

      const { code, status } = await getNumberCode(rid, cookie);
      if (code) {
        setResult({ type: 'digital', code, status, time, rid });
      } else {
        setResult({ type: 'other', time });
      }
    } catch (e) {
      Alert.alert('查询错误', String(e));
      setResult({ type: 'loading' });
    }
  };

  const handleCopyCode = () => {
    if (result.type === 'digital') {
      Clipboard.setString(result.code);
      Alert.alert('已复制', `签到码 ${result.code} 已复制到剪贴板`);
    }
  };

  const handleSubmitNumber = async () => {
    if (result.type !== 'digital' || !result.rid || submitting) return;
    setSubmitting(true);
    try {
      const { cookie } = await getAuth();
      if (!cookie) return;
      const log = (msg: string) => console.log(msg);
      const res = await submitNumberCode(cookie, result.rid, log);
      if (res.ok) {
        Alert.alert('✅ 签到成功', `签到码：${res.code}`);
      } else {
        const reason = res.reason;
        const msg =
          reason === 'finished'
            ? '签到已结束'
            : reason === 'no_code'
            ? '获取签到码失败，请再查一次'
            : '提交失败，请检查网络';
        Alert.alert('❌ 签到失败', msg);
      }
    } catch (e) {
      Alert.alert('错误', String(e));
    } finally {
      setSubmitting(false);
    }
  };

  const handleRadarSign = async () => {
    if (result.type !== 'radar_active' || !result.rid || radarRunning) return;
    setRadarRunning(true);
    try {
      const { cookie } = await getAuth();
      if (!cookie) return;
      const log = (msg: string) => console.log(msg);
      const [center, hitDist] = await radarLockCampus(cookie, result.rid, log);
      if (!center) {
        Alert.alert('❌ 雷达签到失败', '无法锁定校区');
        return;
      }
      Alert.alert('📍 锁定校区', center.name);
      if (hitDist === 0) {
        Alert.alert('✅ 雷达签到成功', `直接命中 ${center.name} 中心！`);
        return;
      }
      const [ok, pos] = await radarTriangulate(cookie, result.rid, center, log);
      if (ok && pos) {
        Alert.alert(
          '✅ 雷达签到成功',
          `位置 ≈ (${pos[0].toFixed(4)}, ${pos[1].toFixed(4)})`
        );
      } else {
        Alert.alert('❌ 雷达签到失败', '精确定位未成功，请重试');
      }
    } catch (e) {
      Alert.alert('错误', String(e));
    } finally {
      setRadarRunning(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>← 返回</Text>
        </TouchableOpacity>
        <Text style={styles.title} numberOfLines={1}>
          {courseName}
        </Text>
      </View>

      <View style={styles.content}>
        {renderResult(result, {
          onCopy: handleCopyCode,
          onSubmit: handleSubmitNumber,
          onRadar: handleRadarSign,
          submitting,
          radarRunning,
        })}
      </View>

      <TouchableOpacity style={styles.refreshBtn} onPress={fetchRollcall} activeOpacity={0.8}>
        <Text style={styles.refreshText}>🔄 再查一次</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

function renderResult(
  result: ResultType,
  actions: {
    onCopy: () => void;
    onSubmit: () => void;
    onRadar: () => void;
    submitting: boolean;
    radarRunning: boolean;
  }
) {
  const { onCopy, onSubmit, onRadar, submitting, radarRunning } = actions;

  switch (result.type) {
    case 'loading':
      return (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#FF6B9D" />
          <Text style={styles.loadingText}>正在查询签到喵~</Text>
        </View>
      );

    case 'none':
      return (
        <View style={styles.card}>
          <Text style={styles.emoji}>😿</Text>
          <Text style={styles.heading}>暂无签到记录</Text>
          <Text style={styles.subtext}>这门课还没有签到喵~</Text>
        </View>
      );

    case 'digital':
      return (
        <View style={styles.card}>
          <Text style={styles.emoji}>🐾</Text>
          <Text style={styles.heading}>签到码</Text>
          <TouchableOpacity onPress={onCopy} activeOpacity={0.8}>
            <Text style={styles.codeText}>{result.code}</Text>
          </TouchableOpacity>
          <View style={styles.statusBadge}>
            <Text style={styles.statusText}>
              {result.status === 'active' ? '✅ 进行中' : '🔒 已结束'}
            </Text>
          </View>
          <Text style={styles.timeText}>签到时间：{result.time}</Text>
          {result.status === 'active' && (
            <TouchableOpacity
              style={[styles.actionBtn, submitting && styles.actionBtnDisabled]}
              onPress={onSubmit}
              disabled={submitting}
              activeOpacity={0.8}
            >
              {submitting ? (
                <ActivityIndicator size="small" color="#0F0E17" />
              ) : (
                <Text style={styles.actionText}>🐾 一键数字签到</Text>
              )}
            </TouchableOpacity>
          )}
          {result.status === 'finished' && (
            <Text style={styles.finishedText}>签到已结束，无需提交喵~</Text>
          )}
        </View>
      );

    case 'radar_active':
      return (
        <View style={styles.card}>
          <Text style={styles.emoji}>📡</Text>
          <Text style={styles.heading}>雷达签到进行中喵❤</Text>
          <Text style={styles.subtext}>教师在实时广播位置，点击按钮自动定位签到</Text>
          <Text style={styles.timeText}>签到时间：{result.time}</Text>
          <TouchableOpacity
            style={[styles.actionBtn, radarRunning && styles.actionBtnDisabled]}
            onPress={onRadar}
            disabled={radarRunning}
            activeOpacity={0.8}
          >
            {radarRunning ? (
              <ActivityIndicator size="small" color="#0F0E17" />
            ) : (
              <Text style={styles.actionText}>🛰 一键雷达签到</Text>
            )}
          </TouchableOpacity>
        </View>
      );

    case 'radar_past':
      return (
        <View style={styles.card}>
          <Text style={styles.emoji}>📡</Text>
          <Text style={styles.heading}>上一次是雷达签到喵❤</Text>
          <Text style={styles.subtext}>当前没有进行中的雷达签到喵~</Text>
          <Text style={styles.timeText}>签到时间：{result.time}</Text>
        </View>
      );

    case 'other':
      return (
        <View style={styles.card}>
          <Text style={styles.emoji}>📍</Text>
          <Text style={styles.heading}>无数字签到码</Text>
          <Text style={styles.subtext}>可能是 GPS / 扫码等其他签到方式喵~</Text>
          <Text style={styles.timeText}>签到时间：{result.time}</Text>
        </View>
      );

    default:
      return null;
  }
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F0E17',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#221F33',
  },
  backBtn: {
    padding: 8,
    marginRight: 8,
  },
  backText: {
    color: '#A7A9BE',
    fontSize: 14,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFE',
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    color: '#A7A9BE',
    fontSize: 14,
  },
  card: {
    backgroundColor: '#1A1828',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    flex: 1,
    borderWidth: 1,
    borderColor: '#221F33',
  },
  emoji: {
    fontSize: 52,
    marginBottom: 12,
  },
  heading: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFE',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtext: {
    fontSize: 13,
    color: '#A7A9BE',
    textAlign: 'center',
    marginBottom: 8,
  },
  codeText: {
    fontSize: 52,
    fontWeight: '900',
    color: '#FF6B9D',
    fontFamily: 'monospace',
    letterSpacing: 10,
    paddingVertical: 12,
    textAlign: 'center',
  },
  statusBadge: {
    backgroundColor: '#221F33',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 6,
    marginBottom: 10,
  },
  statusText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#06D6A0',
  },
  timeText: {
    fontSize: 12,
    color: '#A7A9BE',
    marginBottom: 16,
  },
  finishedText: {
    fontSize: 13,
    color: '#A7A9BE',
    marginBottom: 16,
  },
  actionBtn: {
    backgroundColor: '#FF6B9D',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 32,
    marginTop: 8,
    minWidth: 200,
    alignItems: 'center',
  },
  actionBtnDisabled: {
    opacity: 0.6,
  },
  actionText: {
    color: '#0F0E17',
    fontSize: 15,
    fontWeight: 'bold',
  },
  refreshBtn: {
    marginHorizontal: 20,
    marginBottom: 24,
    backgroundColor: '#221F33',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2E2C3F',
  },
  refreshText: {
    color: '#A7A9BE',
    fontSize: 14,
  },
});
