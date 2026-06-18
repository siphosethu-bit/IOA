// src/firebase/auth.js

import { auth } from "./firebase";
import {
  RecaptchaVerifier,
  signInWithPhoneNumber,
  signOut,
} from "firebase/auth";

/**
 * Initialize invisible reCAPTCHA
 * Must be called before sending OTP
 */
export const setupRecaptcha = () => {
  if (!window.recaptchaVerifier) {
    window.recaptchaVerifier = new RecaptchaVerifier(
      "recaptcha-container",
      {
        size: "invisible",
      },
      auth
    );
  }
};

/**
 * Send OTP to phone number
 * @param {string} phoneNumber - e.g. +27671426283
 */
export const sendOTP = async (phoneNumber) => {
  setupRecaptcha();

  const appVerifier = window.recaptchaVerifier;
  const confirmationResult = await signInWithPhoneNumber(
    auth,
    phoneNumber,
    appVerifier
  );

  // Save confirmationResult for OTP verification
  window.confirmationResult = confirmationResult;

  return true;
};

/**
 * Verify OTP code
 * @param {string} code - 6 digit OTP
 */
export const verifyOTP = async (code) => {
  const result = await window.confirmationResult.confirm(code);
  return result.user;
};

/**
 * Logout user
 */
export const logout = async () => {
  await signOut(auth);
};
