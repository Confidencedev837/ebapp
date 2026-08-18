// src/components/PaystackWebView.tsx
import React, { useRef, useState } from 'react';
import {
    Modal,
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
    SafeAreaView,
    StatusBar,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS, FONTS, RADIUS, SHADOWS } from '@/constants/theme';
import { useTheme } from '@/context/ThemeContext';

interface PaystackSuccessResponse {
    reference: string;
    status: 'success';
    trans?: string;
    transaction?: string;
    trxref?: string;
    message?: string;
}

interface Props {
    visible: boolean;
    amount: number; // in Naira (e.g. 5000)
    email: string;
    reference: string;
    customerName?: string;
    customerPhone?: string;
    onSuccess: (res: PaystackSuccessResponse) => void;
    onCancel: () => void;
    onError?: (err: any) => void;
}

export const PaystackWebView: React.FC<Props> = ({
    visible,
    amount,
    email,
    reference,
    customerName = 'Customer',
    customerPhone = '',
    onSuccess,
    onCancel,
    onError,
}) => {
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const webViewRef = useRef<WebView>(null);
    const [loading, setLoading] = useState(true);

    const rawKey = (process.env.EXPO_PUBLIC_PAYSTACK_PUBLIC_KEY || '').trim();
    const publicKey = rawKey.startsWith('sk_test_')
        ? rawKey.replace('sk_test_', 'pk_test_')
        : rawKey.startsWith('sk_live_')
        ? rawKey.replace('sk_live_', 'pk_live_')
        : rawKey;
    const amountInKobo = Math.round(amount * 100);

    const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
      <title>Everything Beauty Payment</title>
      <script src="https://js.paystack.co/v1/inline.js"></script>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
          display: flex;
          align-items: center;
          justify-content: center;
          height: 100vh;
          background-color: ${isDark ? '#121212' : '#FAFAFA'};
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          color: ${isDark ? '#FFFFFF' : '#1A1A1A'};
        }
        .loader {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
        }
        .spinner {
          width: 36px;
          height: 36px;
          border: 3px solid rgba(255, 98, 137, 0.2);
          border-top-color: #FF6289;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      </style>
    </head>
    <body>
      <div class="loader" id="loader">
        <div class="spinner"></div>
        <p style="font-size: 14px; font-weight: 500;">Securing checkout...</p>
      </div>

      <script>
        function payWithPaystack() {
          var handler = PaystackPop.setup({
            key: '${publicKey}',
            email: '${email}',
            amount: ${amountInKobo},
            ref: '${reference}',
            currency: 'NGN',
            metadata: {
              custom_fields: [
                {
                  display_name: "Customer Name",
                  variable_name: "customer_name",
                  value: "${customerName}"
                },
                {
                  display_name: "Customer Phone",
                  variable_name: "customer_phone",
                  value: "${customerPhone}"
                }
              ]
            },
            callback: function(response) {
              window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'PAYSTACK_SUCCESS',
                data: response
              }));
            },
            onClose: function() {
              window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'PAYSTACK_CANCEL'
              }));
            }
          });
          handler.openIframe();
        }

        window.onload = function() {
          setTimeout(payWithPaystack, 300);
        };
      </script>
    </body>
    </html>
    `;

    const handleMessage = (event: any) => {
        try {
            const data = JSON.parse(event.nativeEvent.data);
            if (data.type === 'PAYSTACK_SUCCESS') {
                onSuccess({
                    reference: data.data.reference || reference,
                    status: 'success',
                    trxref: data.data.trxref,
                    trans: data.data.trans,
                    transaction: data.data.transaction,
                    message: data.data.message,
                });
            } else if (data.type === 'PAYSTACK_CANCEL') {
                onCancel();
            }
        } catch (e) {
            console.error('[PaystackWebView] Failed to parse message:', e);
            onError?.(e);
        }
    };

    if (!visible) return null;

    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent={false}
            onRequestClose={onCancel}
        >
            <SafeAreaView style={[styles.container, { backgroundColor: isDark ? '#121212' : '#FFFFFF' }]}>
                <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

                {/* Header */}
                <View style={[styles.header, { borderBottomColor: isDark ? COLORS.borderDark : COLORS.border }]}>
                    <TouchableOpacity
                        onPress={onCancel}
                        style={styles.closeBtn}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                        <MaterialIcons name="close" size={24} color={isDark ? COLORS.white : COLORS.textDark} />
                    </TouchableOpacity>

                    <View style={styles.headerCenter}>
                        <Text style={[styles.headerTitle, { color: isDark ? COLORS.white : COLORS.textDark }]}>
                            Paystack Secure Checkout
                        </Text>
                        <Text style={[styles.headerSubtitle, { color: COLORS.textMuted }]}>
                            ₦{amount.toLocaleString()}
                        </Text>
                    </View>

                    <View style={{ width: 40 }} />
                </View>

                {/* WebView container */}
                <View style={styles.webviewWrapper}>
                    <WebView
                        ref={webViewRef}
                        source={{ html: htmlContent, baseUrl: 'https://js.paystack.co' }}
                        onMessage={handleMessage}
                        onLoadStart={() => setLoading(true)}
                        onLoadEnd={() => setLoading(false)}
                        javaScriptEnabled={true}
                        domStorageEnabled={true}
                        startInLoadingState={true}
                        renderLoading={() => (
                            <View style={styles.loadingOverlay}>
                                <ActivityIndicator size="large" color={COLORS.primary} />
                                <Text style={{ marginTop: 12, fontFamily: FONTS.sansMedium, color: COLORS.textMuted }}>
                                    Loading Paystack Checkout...
                                </Text>
                            </View>
                        )}
                        style={{ flex: 1, backgroundColor: 'transparent' }}
                    />
                </View>
            </SafeAreaView>
        </Modal>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        height: 56,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        borderBottomWidth: 1,
    },
    closeBtn: {
        width: 40,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerCenter: {
        alignItems: 'center',
    },
    headerTitle: {
        fontFamily: FONTS.sansBold,
        fontSize: 15,
    },
    headerSubtitle: {
        fontFamily: FONTS.montserratBold,
        fontSize: 13,
        marginTop: 2,
    },
    webviewWrapper: {
        flex: 1,
    },
    loadingOverlay: {
        ...StyleSheet.absoluteFillObject,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(255,255,255,0.9)',
    },
});

export default PaystackWebView;
