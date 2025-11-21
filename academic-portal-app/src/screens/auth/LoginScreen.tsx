import React, { useState } from 'react';
import { View, StyleSheet, Image, Platform, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, FONTS, SPACING, BORDER_RADIUS, SHADOWS } from '../../constants/theme';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import { useAuth } from '../../context/AuthContext';

const LoginScreen = () => {
  const [username, setUsername] = useState('HieuNDGCD220033');
  const [password, setPassword] = useState('Student@123');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();

  const handleSignIn = async () => {
    if (!username.trim()) {
      setError('Please enter your username');
      return;
    }
    if (!password.trim()) {
      setError('Please enter your password');
      return;
    }
    
    setIsLoading(true);
    setError('');
    
    try {
      await login(username.trim(), password);
      // Navigation will be handled by auth state change
    } catch (err: any) {
      setError(err.message || 'Invalid credentials');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Logo and University Name */}
        <View style={styles.logoContainer}>
          <View style={styles.logo}>
            <MaterialCommunityIcons name="school" size={32} color={COLORS.secondary} />
          </View>
          <Text style={styles.universityText}>University of</Text>
          <Text style={styles.universityText}>Greenwich</Text>
          <Text style={styles.portalText}>Academic Portal</Text>
        </View>

        {/* Login Card */}
        <View style={styles.loginCard}>
          <Text style={styles.welcomeText}>Welcome Back</Text>
          <Text style={styles.subtitleText}>Sign in to your account</Text>

          {/* Username Input */}
          <Input
            label="Username"
            placeholder="Enter your username"
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
            style={styles.input}
          />

          {/* Password Input */}
          <View style={styles.passwordContainer}>
            <Input
              label="Password"
              placeholder="Enter your password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              style={styles.input}
            />
            <TouchableOpacity
              style={styles.eyeButton}
              onPress={() => setShowPassword(!showPassword)}
            >
              <MaterialCommunityIcons
                name={showPassword ? 'eye-off' : 'eye'}
                size={20}
                color={COLORS.gray}
              />
            </TouchableOpacity>
          </View>

          {/* Error Message */}
          {error ? (
            <Text style={styles.errorText}>{error}</Text>
          ) : null}

          {/* Sign In Button */}
          <Button
            title={isLoading ? 'Signing In...' : 'Sign In'}
            onPress={handleSignIn}
            fullWidth
            disabled={isLoading}
            style={styles.signInButton}
          />
          
          {isLoading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color={COLORS.primary} />
            </View>
          )}

          {/* Forgot Password */}
          <TouchableOpacity style={styles.forgotPasswordContainer}>
            <Text style={styles.forgotPasswordText}>Forgot your password?</Text>
          </TouchableOpacity>

          {/* IT Support */}
          <View style={styles.supportContainer}>
            <Text style={styles.supportText}>
              Need help? Contact IT Support: support@greenwich.edu
            </Text>
          </View>
        </View>

        {/* Copyright */}
        <Text style={styles.copyrightText}>
          © 2024 University of Greenwich. All rights reserved.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.primary,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: SPACING.xl,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  logo: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.base,
    ...SHADOWS.lg,
  },
  universityText: {
    color: COLORS.white,
    fontSize: FONTS.xl,
    fontWeight: FONTS.bold as any,
    textAlign: 'center',
  },
  portalText: {
    color: COLORS.white,
    fontSize: FONTS.lg,
    fontWeight: FONTS.medium as any,
    marginTop: SPACING.xs,
    opacity: 0.9,
  },
  loginCard: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.xl,
    width: '90%',
    maxWidth: 400,
    ...SHADOWS.lg,
  },
  welcomeText: {
    fontSize: FONTS['2xl'],
    fontWeight: FONTS.bold as any,
    color: COLORS.grayDark,
    textAlign: 'center',
    marginBottom: SPACING.xs,
  },
  subtitleText: {
    fontSize: FONTS.base,
    color: COLORS.gray,
    textAlign: 'center',
    marginBottom: SPACING.xl,
  },
  input: {
    marginBottom: SPACING.base,
  },
  passwordContainer: {
    position: 'relative',
  },
  eyeButton: {
    position: 'absolute',
    right: SPACING.base,
    top: 40, // Adjust based on your input height
    padding: SPACING.xs,
  },
  errorText: {
    color: COLORS.error,
    fontSize: FONTS.sm,
    textAlign: 'center',
    marginBottom: SPACING.base,
  },
  loadingContainer: {
    alignItems: 'center',
    marginBottom: SPACING.base,
  },
  signInButton: {
    marginBottom: SPACING.lg,
  },
  forgotPasswordContainer: {
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  forgotPasswordText: {
    color: COLORS.primary,
    fontSize: FONTS.base,
    fontWeight: FONTS.medium as any,
  },
  supportContainer: {
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  supportText: {
    color: COLORS.gray,
    fontSize: FONTS.sm,
    textAlign: 'center',
    lineHeight: 20,
  },
  copyrightText: {
    color: COLORS.white,
    fontSize: FONTS.sm,
    textAlign: 'center',
    opacity: 0.8,
    marginTop: SPACING.xl,
  },
});

export default LoginScreen;
