import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLogin } from "../../src/hooks/auth/useLogin";
import { loginSchema, type LoginFormData } from "../../src/utils/validation";
import { showToast } from "../../src/utils/toast";

export default function LoginScreen() {
  const [showPassword, setShowPassword] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  const loginMutation = useLogin();

  const {
    control,
    handleSubmit,
    formState: { errors, isValid },
    reset,
    watch,
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    mode: "onChange",
    defaultValues: {
      emailOrUsername: "",
      password: "",
    },
  });

  // Watch form values to handle autofill scenarios
  const emailOrUsername = watch("emailOrUsername");
  const password = watch("password");

  // Check if form has valid values (for autofill scenarios)
  const hasValidValues =
    emailOrUsername?.trim().length > 0 && password?.trim().length > 0;
  const canSubmit = (isValid || hasValidValues) && !loginMutation.isPending;

  const onSubmit = async (data: LoginFormData) => {
    try {
      await loginMutation.mutateAsync(data);

      // Show success message
      showToast.success("Welcome back!", "Login Successful");

      // Reset form
      reset();

      // Navigate to tabs with a small delay to ensure auth state is updated
      setTimeout(() => {
        router.replace("/(tabs)");
      }, 100);
    } catch (error: any) {
      // Show the exact error message from the backend
      showToast.error(error.message, "Login Failed");
    }
  };

  const isLoading = loginMutation.isPending;

  const handleNavigateToRegister = () => {
    if (isNavigating || isLoading) return;

    setIsNavigating(true);
    router.push("/(auth)/register");

    // Reset navigation flag after a delay
    setTimeout(() => {
      setIsNavigating(false);
    }, 500);
  };

  return (
    <SafeAreaView className="flex-1 bg-light-background dark:bg-black">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <View className="flex-1 px-6 justify-center">
          {/* Header */}
          <View className="items-center mb-12">
            <Text className="text-4xl font-bold text-light-text dark:text-white tracking-widest">
              TRIPSHARE
            </Text>
            <Text className="text-light-text-secondary dark:text-dark-50 text-lg mt-2">
              Welcome back
            </Text>
          </View>

          {/* Form */}
          <View className="gap-y-6">
            {/* Email/Username Input */}
            <View>
              <Text className="text-light-text dark:text-white text-base font-medium mb-2">
                Email or Username
              </Text>
              <Controller
                control={control}
                name="emailOrUsername"
                render={({ field: { onChange, onBlur, value } }) => (
                  <View className="relative">
                    <TextInput
                      className={`bg-light-surface dark:bg-dark-500 border rounded-lg px-4 py-4 text-light-text dark:text-white text-base ${
                        errors.emailOrUsername
                          ? "border-danger-500"
                          : "border-light-border dark:border-dark-400"
                      }`}
                      placeholder="Enter your email or username"
                      placeholderTextColor="#8E8E93"
                      value={value}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoComplete="username"
                      editable={!isLoading}
                    />
                    <Ionicons
                      name="person-outline"
                      size={20}
                      color="#8E8E93"
                      className="absolute right-4 top-4"
                    />
                  </View>
                )}
              />
              {errors.emailOrUsername && (
                <Text className="text-danger-500 text-sm mt-1">
                  {errors.emailOrUsername.message}
                </Text>
              )}
            </View>

            {/* Password Input */}
            <View>
              <Text className="text-light-text dark:text-white text-base font-medium mb-2">
                Password
              </Text>
              <Controller
                control={control}
                name="password"
                render={({ field: { onChange, onBlur, value } }) => (
                  <View className="relative">
                    <TextInput
                      className={`bg-light-surface dark:bg-dark-500 border rounded-lg px-4 py-4 text-light-text dark:text-white text-base pr-12 ${
                        errors.password
                          ? "border-danger-500"
                          : "border-light-border dark:border-dark-400"
                      }`}
                      placeholder="Enter your password"
                      placeholderTextColor="#8E8E93"
                      value={value}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      secureTextEntry={!showPassword}
                      autoComplete="current-password"
                      editable={!isLoading}
                    />
                    <TouchableOpacity
                      onPress={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-4"
                      disabled={isLoading}
                    >
                      <Ionicons
                        name={showPassword ? "eye-off-outline" : "eye-outline"}
                        size={20}
                        color="#8E8E93"
                      />
                    </TouchableOpacity>
                  </View>
                )}
              />
              {errors.password && (
                <Text className="text-danger-500 text-sm mt-1">
                  {errors.password.message}
                </Text>
              )}
            </View>

            {/* Forgot Password */}
            <TouchableOpacity className="self-end" disabled={isLoading}>
              <Text className="text-primary-500 dark:text-primary-400 text-sm font-medium">
                Forgot Password?
              </Text>
            </TouchableOpacity>

            {/* Login Button */}
            <TouchableOpacity
              className={`rounded-lg py-4 mt-8 ${
                !canSubmit
                  ? "bg-light-border dark:bg-dark-400"
                  : "bg-primary-500 dark:bg-primary-400"
              }`}
              onPress={handleSubmit(onSubmit)}
              disabled={!canSubmit}
            >
              <View className="flex-row items-center justify-center">
                {isLoading && (
                  <Ionicons
                    name="refresh-outline"
                    size={20}
                    color={!canSubmit ? "#6D6D80" : "#FFFFFF"}
                    className="mr-2"
                  />
                )}
                <Text
                  className={`text-center text-lg font-semibold ${
                    !canSubmit
                      ? "text-light-text-secondary dark:text-dark-100"
                      : "text-white"
                  }`}
                >
                  {isLoading ? "Signing In..." : "Sign In"}
                </Text>
              </View>
            </TouchableOpacity>

            {/* Divider */}
            <View className="flex-row items-center my-8">
              <View className="flex-1 h-px bg-light-border dark:bg-dark-400" />
              <Text className="text-light-text-secondary dark:text-dark-50 mx-4 text-sm">
                or
              </Text>
              <View className="flex-1 h-px bg-light-border dark:bg-dark-400" />
            </View>

            {/* Social Login */}
            <View className="gap-y-3">
              <TouchableOpacity
                className="bg-light-surface dark:bg-dark-500 border border-light-border dark:border-dark-400 rounded-lg py-4 flex-row items-center justify-center"
                disabled={isLoading}
              >
                <Ionicons
                  name="logo-google"
                  size={20}
                  color="#000"
                  className="dark:color-white"
                />
                <Text className="text-light-text dark:text-white text-base font-medium ml-3">
                  Continue with Google
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                className="bg-light-surface dark:bg-dark-500 border border-light-border dark:border-dark-400 rounded-lg py-4 flex-row items-center justify-center"
                disabled={isLoading}
              >
                <Ionicons
                  name="logo-apple"
                  size={20}
                  color="#000"
                  className="dark:color-white"
                />
                <Text className="text-light-text dark:text-white text-base font-medium ml-3">
                  Continue with Apple
                </Text>
              </TouchableOpacity>
            </View>

            {/* Register Link */}
            <View className="flex-row justify-center mt-8">
              <Text className="text-light-text-secondary dark:text-dark-50 text-base">
                Don&apos;t have an account?{" "}
              </Text>
              <TouchableOpacity
                disabled={isLoading}
                onPress={handleNavigateToRegister}
              >
                <Text className="text-primary-500 dark:text-primary-400 text-base font-semibold">
                  Sign Up
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
