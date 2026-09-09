/**
 * Chat Screen
 * Live direct messaging between Veteran and Clinical Counselor (Dr. Ananya Nair)
 * Connected to live FastAPI chat endpoints + persistent offline sync
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../App';
import { theme } from '../constants/theme';
import { chatAPI } from '../services/api';
import { storage } from '../services/storage';

const DEFAULT_GREETING = (counselorName) => ({
  id: 'msg-init-counselor',
  sender_type: 'counselor',
  content: `Hello! I'm ${counselorName || 'Dr. Ananya Nair, MD'}, your clinical supervisor. Feel free to reach out here anytime for support, grounding guidance, or care questions.`,
  created_at: new Date(Date.now() - 3600000).toISOString(),
});


const ChatScreen = ({ route, navigation }) => {
  const { user } = useAuth();
  const counselorName = route?.params?.counselorName || user?.assigned_counselor_name || user?.counselor_name || 'Dr. Ananya Nair, MD';
  const targetVetId = user?.id || 'vet-01';
  const storageKey = `@sah_chat_messages_${targetVetId}`;
  const webStorageKey = `sah_chat_messages_${targetVetId}`;

  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const flatListRef = useRef(null);

  useEffect(() => {
    loadMessages();

    // Listen to web storage events if running on Web
    let handleWebStorage = null;
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      handleWebStorage = (e) => {
        if (e.key === webStorageKey || e.key === null) {
          loadMessagesSilently();
        }
      };
      window.addEventListener('storage', handleWebStorage);
    }

    // Polling every 2.5 seconds
    const interval = setInterval(() => {
      loadMessagesSilently();
    }, 2500);

    return () => {
      if (handleWebStorage && typeof window !== 'undefined') {
        window.removeEventListener('storage', handleWebStorage);
      }
      clearInterval(interval);
    };
  }, [user]);

  const loadMessages = async () => {
    let localMessages = [];

    // 1. Read from AsyncStorage / localStorage
    try {
      const saved = await storage.get(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          localMessages = parsed;
          setMessages(parsed);
          setLoading(false);
        }
      } else if (Platform.OS === 'web' && typeof window !== 'undefined') {
        const webSaved = window.localStorage.getItem(webStorageKey);
        if (webSaved) {
          const parsed = JSON.parse(webSaved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            localMessages = parsed;
            setMessages(parsed);
            setLoading(false);
          }
        }
      }
    } catch (e) {
      console.warn('Storage read error:', e);
    }

    // 2. Fetch from backend and merge
    try {
      if (user?.id) {
        const res = await chatAPI.getDirectMessages(user.id);
        if (res?.messages && Array.isArray(res.messages) && res.messages.length > 0) {
          const map = new Map();
          localMessages.forEach((m) => map.set(m.id || m.content, m));
          res.messages.forEach((m) => map.set(m.id || m.content, m));
          const merged = Array.from(map.values()).sort(
            (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
          );
          setMessages(merged);
          await saveToStorage(merged);
          setLoading(false);
          return;
        }
      }
    } catch (err) {
      // Backend offline
    }

    // 3. Fallback default greeting if empty
    if (localMessages.length === 0) {
      const initial = [DEFAULT_GREETING(counselorName)];
      setMessages(initial);
      await saveToStorage(initial);
    }

    setLoading(false);
  };

  const saveToStorage = async (msgList) => {
    try {
      await storage.set(storageKey, JSON.stringify(msgList));
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        window.localStorage.setItem(webStorageKey, JSON.stringify(msgList));
        window.dispatchEvent(new Event('storage'));
      }
    } catch (e) {}
  };

  const loadMessagesSilently = async () => {
    let localList = [];
    try {
      const saved = await storage.get(storageKey);
      if (saved) {
        localList = JSON.parse(saved);
      } else if (Platform.OS === 'web' && typeof window !== 'undefined') {
        const webSaved = window.localStorage.getItem(webStorageKey);
        if (webSaved) localList = JSON.parse(webSaved);
      }
    } catch {}

    try {
      if (user?.id) {
        const res = await chatAPI.getDirectMessages(user.id);
        if (res?.messages && res.messages.length > 0) {
          const map = new Map();
          localList.forEach((m) => map.set(m.id || m.content, m));
          res.messages.forEach((m) => map.set(m.id || m.content, m));
          const merged = Array.from(map.values()).sort(
            (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
          );
          setMessages(merged);
          await saveToStorage(merged);
          return;
        }
      }
    } catch {}

    if (localList.length > 0) {
      setMessages(localList);
    }
  };

  const handleSend = async () => {
    if (!inputText.trim()) return;

    const messageContent = inputText.trim();
    setInputText('');
    setSending(true);

    const isAlert = messageContent.toLowerCase().includes('sos') || messageContent.toLowerCase().includes('emergency');

    const newVeteranMsg = {
      id: `msg-${Date.now()}`,
      veteran_id: targetVetId,
      sender_type: 'veteran',
      message_type: isAlert ? 'alert' : 'text',
      content: messageContent,
      created_at: new Date().toISOString(),
    };

    const updated = [...messages, newVeteranMsg];
    setMessages(updated);
    await saveToStorage(updated);

    // Try posting to live backend
    try {
      if (user?.id) {
        await chatAPI.sendDirectMessage(user.id, messageContent, 'veteran');
      }
    } catch (err) {
      console.warn('Backend chat post error:', err.message);
    }

    // Counselor will reply from their dashboard – no auto-response generated
    setSending(false);
  };

  const handleEmergencyAlert = () => {
    Alert.alert(
      '🚨 Urgent Clinical SOS',
      'Send an immediate high-priority alert to Dr. Ananya Nair?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Send Priority Alert',
          style: 'destructive',
          onPress: async () => {
            const sosMsg = {
              id: `msg-sos-${Date.now()}`,
              veteran_id: targetVetId,
              sender_type: 'veteran',
              message_type: 'alert',
              content: '🚨 URGENT: Requesting immediate priority clinical check-in & grounding assistance.',
              created_at: new Date().toISOString(),
            };

            const withSos = [...messages, sosMsg];
            setMessages(withSos);
            await saveToStorage(withSos);

            try {
              if (user?.id) {
                await chatAPI.sendEmergency(user.id, sosMsg.content);
              }
            } catch (err) {}

            // Counselor will see the SOS alert and respond manually from their dashboard
            Alert.alert('Alert Dispatched', 'Dr. Ananya Nair has received your priority clinical alert. Please wait for their reply.');
          },
        },
      ]
    );
  };

  const formatTime = (dateString) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  const renderMessage = ({ item }) => {
    const isVeteran = item.sender_type === 'veteran';
    const isAlert = item.message_type === 'alert' || item.content?.startsWith('🚨');

    return (
      <View
        style={[
          styles.messageRow,
          isVeteran ? styles.messageRowVeteran : styles.messageRowCounselor,
        ]}
      >
        <View
          style={[
            styles.messageBubble,
            isVeteran ? styles.veteranBubble : styles.counselorBubble,
            isAlert && styles.alertBubble,
          ]}
        >
          {isAlert && (
            <View style={styles.alertHeader}>
              <Ionicons name="warning" size={13} color="#fff" />
              <Text style={styles.alertHeaderText}>HIGH PRIORITY ALERT</Text>
            </View>
          )}
          <Text
            style={[
              styles.messageText,
              isVeteran ? styles.veteranMessageText : styles.counselorMessageText,
            ]}
          >
            {item.content}
          </Text>
          <Text
            style={[
              styles.messageTime,
              isVeteran ? styles.veteranTime : styles.counselorTime,
            ]}
          >
            {formatTime(item.created_at)}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 88 : 0}
    >
      {/* Caregiver Status Banner */}
      <View style={styles.headerBar}>
        <View style={styles.counselorInfo}>
          <View style={styles.avatarMini}>
            <Text style={styles.avatarMiniText}>
              {(counselorName || 'CL').replace(/[^A-Za-z]/g, '').slice(0, 2).toUpperCase()}
            </Text>
          </View>
          <View>
            <Text style={styles.counselorName}>{counselorName}</Text>
            <View style={styles.statusBadge}>
              <View style={styles.statusDot} />
              <Text style={styles.statusText}>Active Caregiver • Direct Line</Text>
            </View>
          </View>
        </View>
        <TouchableOpacity
          style={styles.alertBtn}
          onPress={handleEmergencyAlert}
          accessibilityLabel="Priority Alert"
        >
          <Ionicons name="shield-alert" size={18} color="#DC2626" />
        </TouchableOpacity>
      </View>

      {/* Messages Feed */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={theme.colors.rust[500]} />
          <Text style={styles.loadingText}>Opening secure thread...</Text>
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item, index) => item.id || String(index)}
          renderItem={renderMessage}
          contentContainerStyle={styles.messagesList}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          onLayout={() => flatListRef.current?.scrollToEnd({ animated: true })}
        />
      )}

      {/* Clean Input Bar */}
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.textInput}
          value={inputText}
          onChangeText={setInputText}
          placeholder={`Message ${counselorName}...`}
          placeholderTextColor={theme.colors.espresso[400]}
          multiline
          maxLength={500}
        />
        <TouchableOpacity
          style={[
            styles.sendButton,
            (!inputText.trim() || sending) && styles.sendButtonDisabled,
          ]}
          onPress={handleSend}
          disabled={!inputText.trim() || sending}
        >
          {sending ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Ionicons name="send" size={16} color="#fff" />
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FDF6EE',
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E8DCCE',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  counselorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarMini: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F7DFCC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarMiniText: {
    color: '#8C4A1E',
    fontWeight: '800',
    fontSize: 13,
  },
  counselorName: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1C1917',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 1,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
  },
  statusText: {
    fontSize: 11,
    color: '#786F68',
    fontWeight: '600',
  },
  alertBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
  },
  loadingText: {
    fontSize: 13,
    color: '#786F68',
    fontWeight: '600',
  },
  messagesList: {
    padding: 16,
    gap: 12,
  },
  messageRow: {
    flexDirection: 'row',
    marginVertical: 4,
  },
  messageRowVeteran: {
    justifyContent: 'flex-end',
  },
  messageRowCounselor: {
    justifyContent: 'flex-start',
  },
  messageBubble: {
    maxWidth: '82%',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
  },
  veteranBubble: {
    backgroundColor: '#D96B27',
    borderBottomRightRadius: 4,
  },
  counselorBubble: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E8DCCE',
    borderBottomLeftRadius: 4,
  },
  alertBubble: {
    backgroundColor: '#DC2626',
    borderWidth: 0,
  },
  alertHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 4,
  },
  alertHeaderText: {
    color: '#FEF08A',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  messageText: {
    fontSize: 13,
    lineHeight: 18,
  },
  veteranMessageText: {
    color: '#FFFFFF',
    fontWeight: '500',
  },
  counselorMessageText: {
    color: '#1C1917',
    fontWeight: '500',
  },
  messageTime: {
    fontSize: 9,
    marginTop: 4,
    textAlign: 'right',
    fontWeight: '600',
  },
  veteranTime: {
    color: 'rgba(255, 255, 255, 0.75)',
  },
  counselorTime: {
    color: '#786F68',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E8DCCE',
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
  },
  textInput: {
    flex: 1,
    backgroundColor: '#FDF6EE',
    borderWidth: 1,
    borderColor: '#E8DCCE',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    fontSize: 13,
    color: '#1C1917',
    maxHeight: 100,
  },
  sendButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#D96B27',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#E8DCCE',
  },
});

export default ChatScreen;
