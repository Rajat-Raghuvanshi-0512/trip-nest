import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRegister } from "../../src/hooks/auth/useRegister";
import {
  registerWithConfirmSchema,
  type RegisterWithConfirmFormData,
} from "../../src/utils/validation";
import { showToast } from "../../src/utils/toast";
import { useTheme } from "../../providers";

export default function RegisterScreen() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  const registerMutation = useRegister();
  const { isDark } = useTheme();

  const {
    control,
    handleSubmit,
    formState: { errors, isValid },
    reset,
    watch,
  } = useForm<RegisterWithConfirmFormData>({
    resolver: zodResolver(registerWithConfirmSchema),
    mode: "onChange",
    defaultValues: {
      firstName: "",
      lastName: "",
      username: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  // Watch form values to handle autofill scenarios
  const firstName = watch("firstName");
  const lastName = watch("lastName");
  const username = watch("username");
  const email = watch("email");
  const password = watch("password");
  const confirmPassword = watch("confirmPassword");

  // Check if form has valid values (for autofill scenarios)
  const hasValidValues =
    firstName?.trim().length > 0 &&
    lastName?.trim().length > 0 &&
    username?.trim().length > 0 &&
    email?.trim().length > 0 &&
    password?.trim().length > 0 &&
    confirmPassword?.trim().length > 0;
  const canSubmit = (isValid || hasValidValues) && !registerMutation.isPending;

  const onSubmit = async (data: RegisterWithConfirmFormData) => {
    try {
      // Remove confirmPassword from the data before sending to API
      const { confirmPassword, ...registerData } = data;
      await registerMutation.mutateAsync(registerData);

      // Show success message
      showToast.success(
        "Account created successfully!",
        "Welcome to TripShare"
      );

      // Reset form
      reset();

      // Navigate to tabs with a small delay to ensure auth state is updated
      setTimeout(() => {
        router.replace("/(tabs)");
      }, 100);
    } catch (error: any) {
      // Show the exact error message from the backend
      showToast.error(error.message, "Registration Failed");
    }
  };

  const isLoading = registerMutation.isPending;

  const handleNavigateToLogin = () => {
    if (isNavigating || isLoading) return;

    setIsNavigating(true);
    router.back();

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
        <ScrollView
          className="flex-1 px-6"
          showsVerticalScrollIndicator={false}
        >
          <View className="justify-center py-8">
            {/* Header */}
            <View className="items-center mb-8">
              <Text className="text-4xl font-bold text-light-text dark:text-white tracking-widest">
                TRIPSHARE
              </Text>
              <Text className="text-light-text-secondary dark:text-dark-50 text-lg mt-2">
                Create your account
              </Text>
            </View>

            {/* Form */}
            <View className="gap-y-4">
              {/* Name Row */}
              <View className="flex-row gap-x-4">
                {/* First Name Input */}
                <View className="flex-1">
                  <Text className="text-light-text dark:text-white text-base font-medium mb-2">
                    First Name
                  </Text>
                  <Controller
                    control={control}
                    name="firstName"
                    render={({ field: { onChange, onBlur, value } }) => (
                      <TextInput
                        className={`bg-light-surface dark:bg-dark-500 leading-tight border rounded-lg px-4 py-4 text-light-text dark:text-white text-base ${
                          errors.firstName
                            ? "border-danger-500"
                            : "border-light-border dark:border-dark-400"
                        }`}
                        placeholder="First name"
                        placeholderTextColor="#8E8E93"
                        value={value}
                        onChangeText={onChange}
                        onBlur={onBlur}
                        autoComplete="given-name"
                        editable={!isLoading}
                      />
                    )}
                  />
                  {errors.firstName && (
                    <Text className="text-danger-500 text-sm mt-1">
                      {errors.firstName.message}
                    </Text>
                  )}
                </View>

                {/* Last Name Input */}
                <View className="flex-1">
                  <Text className="text-light-text dark:text-white text-base font-medium mb-2">
                    Last Name
                  </Text>
                  <Controller
                    control={control}
                    name="lastName"
                    render={({ field: { onChange, onBlur, value } }) => (
                      <TextInput
                        className={`bg-light-surface dark:bg-dark-500 leading-tight border rounded-lg px-4 py-4 text-light-text dark:text-white text-base ${
                          errors.lastName
                            ? "border-danger-500"
                            : "border-light-border dark:border-dark-400"
                        }`}
                        placeholder="Last name"
                        placeholderTextColor="#8E8E93"
                        value={value}
                        onChangeText={onChange}
                        onBlur={onBlur}
                        autoComplete="family-name"
                        editable={!isLoading}
                      />
                    )}
                  />
                  {errors.lastName && (
                    <Text className="text-danger-500 text-sm mt-1">
                      {errors.lastName.message}
                    </Text>
                  )}
                </View>
              </View>

              {/* Username Input */}
              <View>
                <Text className="text-light-text dark:text-white text-base font-medium mb-2">
                  Username
                </Text>
                <Controller
                  control={control}
                  name="username"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <View className="relative">
                      <TextInput
                        className={`bg-light-surface dark:bg-dark-500 leading-tight border rounded-lg px-4 py-4 text-light-text dark:text-white text-base ${
                          errors.username
                            ? "border-danger-500"
                            : "border-light-border dark:border-dark-400"
                        }`}
                        placeholder="Choose a username"
                        placeholderTextColor="#8E8E93"
                        value={value}
                        onChangeText={onChange}
                        onBlur={onBlur}
                        autoCapitalize="none"
                        autoComplete="username"
                        editable={!isLoading}
                      />
                      <Ionicons
                        name="at-outline"
                        size={20}
                        color="#8E8E93"
                        className="absolute right-4 top-4"
                      />
                    </View>
                  )}
                />
                {errors.username && (
                  <Text className="text-danger-500 text-sm mt-1">
                    {errors.username.message}
                  </Text>
                )}
              </View>

              {/* Email Input */}
              <View>
                <Text className="text-light-text dark:text-white text-base font-medium mb-2">
                  Email
                </Text>
                <Controller
                  control={control}
                  name="email"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <View className="relative">
                      <TextInput
                        className={`bg-light-surface dark:bg-dark-500 leading-tight border rounded-lg px-4 py-4 text-light-text dark:text-white text-base ${
                          errors.email
                            ? "border-danger-500"
                            : "border-light-border dark:border-dark-400"
                        }`}
                        placeholder="Enter your email"
                        placeholderTextColor="#8E8E93"
                        value={value}
                        onChangeText={onChange}
                        onBlur={onBlur}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        autoComplete="email"
                        editable={!isLoading}
                      />
                      <Ionicons
                        name="mail-outline"
                        size={20}
                        color="#8E8E93"
                        className="absolute right-4 top-4"
                      />
                    </View>
                  )}
                />
                {errors.email && (
                  <Text className="text-danger-500 text-sm mt-1">
                    {errors.email.message}
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
                        className={`bg-light-surface dark:bg-dark-500 leading-tight border rounded-lg px-4 py-4 text-light-text dark:text-white text-base pr-12 ${
                          errors.password
                            ? "border-danger-500"
                            : "border-light-border dark:border-dark-400"
                        }`}
                        placeholder="Create a password"
                        placeholderTextColor="#8E8E93"
                        value={value}
                        onChangeText={onChange}
                        onBlur={onBlur}
                        secureTextEntry={!showPassword}
                        autoComplete="new-password"
                        editable={!isLoading}
                      />
                      <TouchableOpacity
                        onPress={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-4"
                        disabled={isLoading}
                      >
                        <Ionicons
                          name={
                            showPassword ? "eye-off-outline" : "eye-outline"
                          }
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

              {/* Confirm Password Input */}
              <View>
                <Text className="text-light-text dark:text-white text-base font-medium mb-2">
                  Confirm Password
                </Text>
                <Controller
                  control={control}
                  name="confirmPassword"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <View className="relative">
                      <TextInput
                        className={`bg-light-surface dark:bg-dark-500 leading-tight border rounded-lg px-4 py-4 text-light-text dark:text-white text-base pr-12 ${
                          errors.confirmPassword
                            ? "border-danger-500"
                            : "border-light-border dark:border-dark-400"
                        }`}
                        placeholder="Confirm your password"
                        placeholderTextColor="#8E8E93"
                        value={value}
                        onChangeText={onChange}
                        onBlur={onBlur}
                        secureTextEntry={!showConfirmPassword}
                        autoComplete="new-password"
                        editable={!isLoading}
                      />
                      <TouchableOpacity
                        onPress={() =>
                          setShowConfirmPassword(!showConfirmPassword)
                        }
                        className="absolute right-4 top-4"
                        disabled={isLoading}
                      >
                        <Ionicons
                          name={
                            showConfirmPassword
                              ? "eye-off-outline"
                              : "eye-outline"
                          }
                          size={20}
                          color="#8E8E93"
                        />
                      </TouchableOpacity>
                    </View>
                  )}
                />
                {errors.confirmPassword && (
                  <Text className="text-danger-500 text-sm mt-1">
                    {errors.confirmPassword.message}
                  </Text>
                )}
              </View>

              {/* Terms */}
              <View className="flex-row items-start">
                <Ionicons
                  name="checkmark-circle-outline"
                  size={20}
                  color="#4ECDC4"
                  className="mt-1 mr-3"
                />
                <Text className="text-light-text-secondary dark:text-dark-50 text-sm flex-1 leading-5">
                  I agree to the{" "}
                  <Text className="text-primary-400">Terms of Service</Text> and{" "}
                  <Text className="text-primary-400">Privacy Policy</Text>
                </Text>
              </View>

              {/* Register Button */}
              <TouchableOpacity
                className={`rounded-lg py-4 mt-4 ${
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
                    {isLoading ? "Creating Account..." : "Create Account"}
                  </Text>
                </View>
              </TouchableOpacity>

              {/* Divider */}
              <View className="flex-row items-center my-6">
                <View className="flex-1 h-px bg-light-border dark:bg-dark-400" />
                <Text className="text-light-text-secondary dark:text-dark-50 mx-4 text-sm">
                  or
                </Text>
                <View className="flex-1 h-px bg-light-border dark:bg-dark-400" />
              </View>

              {/* Social Login */}
              <View className="gap-y-3">
                <TouchableOpacity
                  className="bg-light-surface dark:bg-dark-500 leading-tight border border-light-border dark:border-dark-400 rounded-lg py-4 flex-row items-center justify-center"
                  disabled={isLoading}
                >
                  <Ionicons
                    name="logo-google"
                    size={20}
                    color={isDark ? "#fff" : "#000"}
                  />
                  <Text className="text-light-text dark:text-white text-base font-medium ml-3">
                    Continue with Google
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  className="bg-light-surface dark:bg-dark-500 leading-tight border border-light-border dark:border-dark-400 rounded-lg py-4 flex-row items-center justify-center"
                  disabled={isLoading}
                >
                  <Ionicons
                    name="logo-apple"
                    size={20}
                    color={isDark ? "#fff" : "#000"}
                  />
                  <Text className="text-light-text dark:text-white text-base font-medium ml-3">
                    Continue with Apple
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Login Link */}
              <View className="flex-row justify-center mt-6">
                <Text className="text-light-text-secondary dark:text-dark-50 text-base">
                  Already have an account?{" "}
                </Text>
                <TouchableOpacity
                  disabled={isLoading}
                  onPress={handleNavigateToLogin}
                >
                  <Text className="text-primary-500 dark:text-primary-400 text-base font-semibold">
                    Sign In
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
