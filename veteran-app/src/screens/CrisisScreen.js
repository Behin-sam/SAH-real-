/**
 * Crisis Screen
 * Emergency contacts, crisis hotlines, and immediate support resources
 * Styled with VALOR trauma-informed design system (Indian Armed Forces & Tele-MANAS)
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  Alert,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const CRISIS_RESOURCES = [
  {
    id: 'telemanas',
    name: 'Tele-MANAS (Mental Health Helpline)',
    phone: '14416',
    subtitle: 'Govt. of India 24/7 Toll-Free',
    description: 'Free, confidential psychological first-aid and trauma counseling across 20+ Indian languages.',
    color: '#D96B27',
    icon: 'call',
  },
  {
    id: 'army',
    name: 'Indian Army / ECHS Veteran Cell',
    phone: '1902',
    subtitle: 'Ex-Servicemen Welfare Helpline',
    description: 'Direct assistance for Indian Armed Forces veterans, emergency coordination and medical evacuation.',
    color: '#1C1917',
    icon: 'shield-checkmark',
  },
  {
    id: 'erss',
    name: 'National Emergency Response (ERSS)',
    phone: '112',
    subtitle: 'All-India Police, Ambulance, Fire & Rescue',
    description: 'Unified national emergency helpline for immediate danger or physical medical crises.',
    color: '#DC2626',
    icon: 'medical',
  },
  {
    id: 'kiran',
    name: 'KIRAN National Mental Health Helpline',
    phone: '1800-599-0019',
    subtitle: 'Toll-free 24/7 support',
    description: 'Dedicated national helpline by MSJE offering clinical de-escalation and veteran mental support.',
    color: '#059669',
    icon: 'heart',
  },
];

const QUICK_ACTIONS = [
  {
    id: 'call_manas',
    title: '📞 Call Tele-MANAS (14416)',
    description: 'Immediate 24/7 mental health crisis support',
    phone: '14416',
    color: '#D96B27',
  },
  {
    id: 'call_army',
    title: '🎖️ Call Veteran Helpline (1902)',
    description: 'Indian Armed Forces & ECHS veteran coordination',
    phone: '1902',
    color: '#1C1917',
  },
  {
    id: 'call_112',
    title: '🚨 Emergency Services (112)',
    description: 'Immediate police / ambulance dispatch across India',
    phone: '112',
    color: '#DC2626',
  },
  {
    id: 'nearest_echs',
    title: '📍 Nearest Military Hospital / ECHS',
    description: 'Locate nearest military health & polyclinic facility',
    url: 'https://echs.gov.in',
    color: '#059669',
  },
];

const SAFETY_PLAN = [
  'Recognize your personal warning signs (agitation, combat recall, sensory overload, isolation).',
  'Engage Box Breathing (4-4-4-4 technique) or 5-4-3-2-1 grounding to steady autonomic response.',
  'Reach out to your trusted battle buddy or squad member on the Comrades board.',
  'Send a clinical message or priority callback request to your assigned counselor Dr. Ananya Nair.',
  'Call Tele-MANAS toll-free at 14416 or Indian Army Veteran Helpline at 1902.',
  'If in immediate physical danger, dial 112 or proceed to the nearest Military Hospital / ECHS facility.',
];

const CrisisScreen = ({ navigation }) => {
  const handleCall = (phone) => {
    if (!phone) return;
    const cleanPhone = phone.replace(/[^0-9+]/g, '');
    const url = `tel:${cleanPhone}`;
    Linking.canOpenURL(url)
      .then((supported) => {
        if (supported) {
          Linking.openURL(url);
        } else {
          Alert.alert('Phone Call', `Please dial ${phone} from your phone dialer.`);
        }
      })
      .catch(() => {
        Alert.alert('Phone Call', `Please dial ${phone} from your phone dialer.`);
      });
  };

  const handleOpenUrl = (url) => {
    if (!url) return;
    Linking.canOpenURL(url)
      .then((supported) => {
        if (supported) {
          Linking.openURL(url);
        }
      })
      .catch((err) => console.warn('Could not open URL:', err));
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Top Banner */}
      <View style={styles.heroBanner}>
        <View style={styles.heroIconWrapper}>
          <Ionicons name="shield-alert" size={32} color="#FFFFFF" />
        </View>
        <Text style={styles.heroTitle}>24/7 Crisis & Immediate Support</Text>
        <Text style={styles.heroSubtitle}>
          You are never alone. Confidential support from Indian Armed Forces & Mental Health helplines is available 24 hours a day, 7 days a week.
        </Text>
      </View>

      {/* Primary Emergency CTA Card */}
      <TouchableOpacity
        style={styles.primaryCtaCard}
        onPress={() => handleCall('14416')}
        activeOpacity={0.88}
      >
        <View style={styles.primaryCtaHeader}>
          <View style={styles.ctaIconBadge}>
            <Ionicons name="call" size={24} color="#FFFFFF" />
          </View>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={styles.primaryCtaLabel}>NATIONAL MENTAL HEALTH HELPLINE</Text>
            <Text style={styles.primaryCtaNumber}>Dial 14416 (Tele-MANAS)</Text>
          </View>
          <Ionicons name="chevron-forward" size={24} color="#FFFFFF" />
        </View>
        <Text style={styles.primaryCtaDesc}>
          Free, confidential, 24/7 psychological first-aid for veterans and families across India.
        </Text>
      </TouchableOpacity>

      {/* Quick Action Grid */}
      <Text style={styles.sectionHeader}>QUICK EMERGENCY ACTIONS</Text>
      <View style={styles.actionGrid}>
        {QUICK_ACTIONS.map((action) => (
          <TouchableOpacity
            key={action.id}
            style={[styles.actionCard, { borderLeftColor: action.color, borderLeftWidth: 4 }]}
            onPress={() => {
              if (action.phone) handleCall(action.phone);
              else if (action.url) handleOpenUrl(action.url);
            }}
            activeOpacity={0.8}
          >
            <Text style={styles.actionTitle}>{action.title}</Text>
            <Text style={styles.actionDesc}>{action.description}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Crisis Helplines List */}
      <Text style={styles.sectionHeader}>CONFIDENTIAL HELPLINES</Text>
      {CRISIS_RESOURCES.map((resource) => (
        <View key={resource.id} style={styles.resourceCard}>
          <View style={styles.resourceHeader}>
            <View style={[styles.resourceIconWrapper, { backgroundColor: resource.color }]}>
              <Ionicons name={resource.icon} size={20} color="#FFFFFF" />
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.resourceName}>{resource.name}</Text>
              {resource.subtitle && (
                <Text style={styles.resourceSubtitle}>{resource.subtitle}</Text>
              )}
            </View>
            {resource.phone && (
              <TouchableOpacity
                style={[styles.callButton, { backgroundColor: resource.color }]}
                onPress={() => handleCall(resource.phone)}
                activeOpacity={0.8}
              >
                <Ionicons name="call" size={14} color="#FFFFFF" />
                <Text style={styles.callButtonText}>Call</Text>
              </TouchableOpacity>
            )}
          </View>
          <Text style={styles.resourceDesc}>{resource.description}</Text>
          {resource.phone && (
            <Text style={styles.resourcePhone}>{resource.phone}</Text>
          )}
        </View>
      ))}

      {/* Veteran Personal Safety Protocol */}
      <View style={styles.safetyCard}>
        <View style={styles.safetyHeader}>
          <Ionicons name="clipboard" size={20} color="#D96B27" />
          <Text style={styles.safetyTitle}>Veteran Safety Protocol</Text>
        </View>
        <Text style={styles.safetyIntro}>
          If you feel overwhelmed, follow these sequential steps to ground yourself:
        </Text>
        {SAFETY_PLAN.map((step, index) => (
          <View key={index} style={styles.safetyStep}>
            <View style={styles.stepBadge}>
              <Text style={styles.stepNumber}>{index + 1}</Text>
            </View>
            <Text style={styles.stepText}>{step}</Text>
          </View>
        ))}
      </View>

      {/* Disclaimer */}
      <View style={styles.disclaimerCard}>
        <Ionicons name="information-circle" size={18} color="#786F68" />
        <Text style={styles.disclaimerText}>
          VALOR is a supportive monitoring and peer connection app. In a life-threatening emergency, please call 112 immediately or proceed to the nearest emergency hospital.
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FDF6EE',
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  heroBanner: {
    backgroundColor: '#1C1917',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    marginBottom: 16,
  },
  heroIconWrapper: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#D96B27',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  heroTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 6,
  },
  heroSubtitle: {
    fontSize: 12,
    color: '#E8DCCE',
    textAlign: 'center',
    lineHeight: 18,
  },
  primaryCtaCard: {
    backgroundColor: '#D96B27',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#282524',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  primaryCtaHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  ctaIconBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  primaryCtaLabel: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.8)',
    letterSpacing: 1,
    fontWeight: '700',
  },
  primaryCtaNumber: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  primaryCtaDesc: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.9)',
    lineHeight: 16,
  },
  sectionHeader: {
    fontSize: 11,
    fontWeight: '800',
    color: '#786F68',
    letterSpacing: 1,
    marginBottom: 12,
    marginTop: 8,
    textTransform: 'uppercase',
  },
  actionGrid: {
    marginBottom: 20,
  },
  actionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E8DCCE',
    shadowColor: '#282524',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  actionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1C1917',
    marginBottom: 2,
  },
  actionDesc: {
    fontSize: 11,
    color: '#786F68',
  },
  resourceCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E8DCCE',
    shadowColor: '#282524',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  resourceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  resourceIconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  resourceName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1C1917',
  },
  resourceSubtitle: {
    fontSize: 10,
    color: '#8C4A1E',
    fontWeight: '600',
  },
  resourceDesc: {
    fontSize: 11,
    color: '#786F68',
    lineHeight: 16,
    marginBottom: 4,
  },
  resourcePhone: {
    fontSize: 12,
    fontWeight: '800',
    color: '#1C1917',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  callButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  callButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  safetyCard: {
    backgroundColor: '#FDF2E9',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F7DFCC',
    marginBottom: 16,
  },
  safetyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  safetyTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1C1917',
  },
  safetyIntro: {
    fontSize: 12,
    color: '#786F68',
    marginBottom: 12,
    lineHeight: 16,
  },
  safetyStep: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
    gap: 10,
  },
  stepBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#D96B27',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 1,
  },
  stepNumber: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  stepText: {
    flex: 1,
    fontSize: 12,
    color: '#1C1917',
    lineHeight: 17,
  },
  disclaimerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E8DCCE',
  },
  disclaimerText: {
    flex: 1,
    fontSize: 11,
    color: '#786F68',
    lineHeight: 15,
  },
});

export default CrisisScreen;
