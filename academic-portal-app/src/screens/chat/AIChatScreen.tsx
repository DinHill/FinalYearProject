import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, FONTS, SPACING, BORDER_RADIUS } from '../../constants/theme';
import Card from '../../components/common/Card';

const AIChatScreen = () => {
  const [message, setMessage] = useState('');

  const suggestedQuestions = [
    'How to apply for a transcript?',
    'Where is the finance department?',
    'Course registration deadline?',
  ];

  const popularQuestions = [
    { icon: 'file-document', text: 'How to apply for a transcript?' },
    { icon: 'currency-usd', text: 'Where is the finance department?' },
    { icon: 'calendar', text: 'Course registration deadline?' },
    { icon: 'school', text: 'Check my attendance' },
  ];

  const handleSendMessage = () => {
    if (message.trim()) {
      // Handle sending message
      console.log('Sending message:', message);
      setMessage('');
    }
  };

  const handleSuggestedQuestion = (question: string) => {
    setMessage(question);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* AI Assistant Header */}
        <View style={styles.header}>
          <View style={styles.aiInfo}>
            <View style={styles.aiIcon}>
              <MaterialCommunityIcons name="robot" size={24} color={COLORS.white} />
            </View>
            <View style={styles.aiDetails}>
              <Text style={styles.aiTitle}>AI Assistant</Text>
              <View style={styles.aiStatus}>
                <View style={styles.statusDot} />
                <Text style={styles.statusText}>Online • Ready to help</Text>
              </View>
            </View>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.aiPoweredButton}>
              <MaterialCommunityIcons name="lightning-bolt" size={16} color={COLORS.white} />
              <Text style={styles.aiPoweredText}>AI Powered</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuButton}>
              <MaterialCommunityIcons name="dots-vertical" size={24} color={COLORS.white} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Chat Area */}
        <View style={styles.chatArea}>
          {/* AI Welcome Message */}
          <View style={styles.aiMessage}>
            <Text style={styles.aiMessageText}>
              Hello! I'm your AI assistant. How can I help you today?
            </Text>
            <Text style={styles.messageTime}>07:47 PM</Text>
          </View>

          {/* Suggested Questions */}
          <View style={styles.suggestedQuestionsContainer}>
            {suggestedQuestions.map((question, index) => (
              <TouchableOpacity
                key={index}
                style={styles.suggestedQuestion}
                onPress={() => handleSuggestedQuestion(question)}
              >
                <Text style={styles.suggestedQuestionText}>{question}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Popular Questions */}
          <View style={styles.popularQuestionsContainer}>
            <Text style={styles.popularQuestionsTitle}>Popular questions:</Text>
            {popularQuestions.map((item, index) => (
              <TouchableOpacity
                key={index}
                style={styles.popularQuestion}
                onPress={() => handleSuggestedQuestion(item.text)}
              >
                <MaterialCommunityIcons 
                  name={item.icon as any} 
                  size={20} 
                  color={COLORS.primary} 
                />
                <Text style={styles.popularQuestionText}>{item.text}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Message Input */}
      <View style={styles.inputContainer}>
        <View style={styles.inputWrapper}>
          <TextInput
            style={styles.textInput}
            placeholder="Type your message..."
            placeholderTextColor={COLORS.gray}
            value={message}
            onChangeText={setMessage}
            multiline
          />
          <TouchableOpacity 
            style={styles.sendButton}
            onPress={handleSendMessage}
          >
            <MaterialCommunityIcons name="send" size={20} color={COLORS.white} />
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    backgroundColor: COLORS.header,
    paddingHorizontal: SPACING.base,
    paddingVertical: SPACING.base,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  aiInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  aiIcon: {
    width: 40,
    height: 40,
    borderRadius: BORDER_RADIUS.base,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.base,
  },
  aiDetails: {
    flex: 1,
  },
  aiTitle: {
    color: COLORS.white,
    fontSize: FONTS.lg,
    fontWeight: FONTS.bold as any,
  },
  aiStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.xs,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.success,
    marginRight: SPACING.xs,
  },
  statusText: {
    color: COLORS.white,
    fontSize: FONTS.sm,
    opacity: 0.9,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  aiPoweredButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.secondary,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.sm,
    marginRight: SPACING.base,
  },
  aiPoweredText: {
    color: COLORS.white,
    fontSize: FONTS.xs,
    fontWeight: FONTS.medium as any,
    marginLeft: SPACING.xs,
  },
  menuButton: {
    padding: SPACING.xs,
  },
  chatArea: {
    flex: 1,
    paddingHorizontal: SPACING.base,
    paddingVertical: SPACING.base,
  },
  aiMessage: {
    backgroundColor: COLORS.white,
    padding: SPACING.base,
    borderRadius: BORDER_RADIUS.lg,
    marginBottom: SPACING.base,
    alignSelf: 'flex-start',
    maxWidth: '80%',
  },
  aiMessageText: {
    fontSize: FONTS.base,
    color: COLORS.black,
    lineHeight: 20,
  },
  messageTime: {
    fontSize: FONTS.xs,
    color: COLORS.gray,
    marginTop: SPACING.xs,
    alignSelf: 'flex-end',
  },
  suggestedQuestionsContainer: {
    marginBottom: SPACING.lg,
  },
  suggestedQuestion: {
    backgroundColor: COLORS.grayLight,
    padding: SPACING.base,
    borderRadius: BORDER_RADIUS.base,
    marginBottom: SPACING.sm,
    alignSelf: 'flex-start',
    maxWidth: '80%',
  },
  suggestedQuestionText: {
    fontSize: FONTS.sm,
    color: COLORS.grayDark,
  },
  popularQuestionsContainer: {
    marginBottom: SPACING.xl,
  },
  popularQuestionsTitle: {
    fontSize: FONTS.base,
    color: COLORS.gray,
    marginBottom: SPACING.base,
  },
  popularQuestion: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.grayLight,
    padding: SPACING.base,
    borderRadius: BORDER_RADIUS.base,
    marginBottom: SPACING.sm,
  },
  popularQuestionText: {
    fontSize: FONTS.sm,
    color: COLORS.grayDark,
    marginLeft: SPACING.base,
    flex: 1,
  },
  inputContainer: {
    paddingHorizontal: SPACING.base,
    paddingVertical: SPACING.base,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.grayLight,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: COLORS.grayLight,
    borderRadius: BORDER_RADIUS.lg,
    paddingHorizontal: SPACING.base,
    paddingVertical: SPACING.sm,
  },
  textInput: {
    flex: 1,
    fontSize: FONTS.base,
    color: COLORS.black,
    maxHeight: 100,
    paddingVertical: SPACING.xs,
  },
  sendButton: {
    backgroundColor: COLORS.primary,
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: SPACING.sm,
  },
});

export default AIChatScreen;
