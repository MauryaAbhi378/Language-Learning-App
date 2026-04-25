import { Colors } from "@/constants/theme";
import AntDesign from "@expo/vector-icons/AntDesign";
import Fontisto from "@expo/vector-icons/Fontisto";
import { useFonts } from "expo-font";
import { useVideoPlayer, VideoView } from "expo-video";
import { useEffect, useState } from "react";
import {
  Dimensions,
  Keyboard,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Animated, {
  FadeIn,
  FadeOut,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { verticalScale } from "react-native-size-matters";
import EmailAuth from "./EmailAuth";
import { Gesture, GestureDetector } from "react-native-gesture-handler";

const { width, height } = Dimensions.get("window");
const videoSource = require("../../assets/videos/language_learning.mp4");

const MENU_HEIGHT = 250;
const PEEK_MENU_HEIGHT = 50;
const CLOSED_POSITION = MENU_HEIGHT - PEEK_MENU_HEIGHT;

export default function IntroScreen() {
  const insets = useSafeAreaInsets();
  const languages = ["Chinese", "Japanese", "German", "Korean"];
  const [languageIndex, setLanguageIndex] = useState(0);
  const menuTranslateY = useSharedValue(CLOSED_POSITION);
  const menuContentOpacity = useSharedValue(1);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [currentView, setCurrentView] = useState<"login" | "email">("login");

  const [fontsLoaded] = useFonts({
    "SpaceMono-Regular": require("../../assets/fonts/SpaceMono-Regular.ttf"),
  });

  // For changing language text
  useEffect(() => {
    const interval = setInterval(() => {
      setLanguageIndex((prev) => (prev + 1) % languages.length);
    }, 3000);

    return () => clearInterval(interval);
  }, [languages.length]);

  // For Playing Video
  const player = useVideoPlayer(videoSource, (player) => {
    player.loop = true;
    player.muted = true;
    player.play();
  });

  // Animation for sliding menu
  const menuAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: menuTranslateY.value }],
    };
  });

  // Menu content opacity animation
  const menuContentAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: menuContentOpacity.value,
    };
  });

  // For keyboard Height
  useEffect(() => {
    const keyboardWillShowListener = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow",
      (event) => {
        setKeyboardHeight(event.endCoordinates.height);
      },
    );

    const keyboardWillHideListener = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide",
      (event) => {
        setKeyboardHeight(0);
      },
    );

    return () => {
      keyboardWillShowListener?.remove();
      keyboardWillHideListener?.remove();
    };
  }, []);

  const dynamicMenuHeight =
    keyboardHeight > 0 ? MENU_HEIGHT + keyboardHeight + 50 : MENU_HEIGHT + 100;

  if (!fontsLoaded) {
    return null;
  }

  // For opening menu
  const animateMenu = (open: boolean) => {
    menuTranslateY.value = withSpring(open ? 0 : CLOSED_POSITION, {
      damping: 30,
      stiffness: 200,
      mass: 1,
    });
  };

  const handlePress = () => {
    const newState = !isMenuOpen;
    setIsMenuOpen(newState);
    animateMenu(newState);
  };

  // Login View
  const renderLoginView = () => (
    <Animated.View style={[styles.viewContainer, menuContentAnimatedStyle]}>
      <View style={styles.logoSection}>
        <View style={styles.logoContainer}>
          {/* <Image source={logoSource} style={styles.logo} /> */}
          <Text style={styles.appName}>Convo</Text>
        </View>
        <View style={styles.statsContainer}>
          <Text style={styles.rating}>Start today</Text>
        </View>
      </View>

      <View style={styles.buttonsContainer}>
        <Pressable
          style={styles.loginButton}
          onPress={() => console.log("Apple login")}
        >
          <AntDesign
            name="apple"
            size={16}
            color="white"
            style={styles.appleIcon}
          />
          <Text style={styles.buttonText}>Continue with Apple</Text>
        </Pressable>
        <Pressable
          style={styles.loginButton}
          onPress={() => console.log("Google login")}
        >
          <AntDesign
            name="google"
            size={16}
            color="white"
            style={styles.appleIcon}
          />
          <Text style={styles.buttonText}>Continue with Google</Text>
        </Pressable>
        <Pressable
          style={styles.loginButton}
          onPress={() => animateToEmailView("email")}
        >
          <Fontisto
            name="email"
            size={16}
            color="white"
            style={styles.emailIcon}
          />
          <Text style={styles.buttonText}>Continue with Email</Text>
        </Pressable>
      </View>
    </Animated.View>
  );

  //Email View
  const animateToEmailView = (to: "email" | "login") => {
    menuContentOpacity.value = withTiming(0, { duration: 200 });

    setTimeout(() => {
      setCurrentView(to);
      menuContentOpacity.value = withTiming(1, { duration: 300 });
    }, 200);
  };

  const renderEmailView = () => (
    <EmailAuth
      onBack={() => animateToEmailView("login")}
      menuContentAnimatedStyle={menuContentAnimatedStyle}
    />
  );

  const gestureHandler = Gesture.Pan().onEnd((event) => {
    "worklet";
    const swipethreshold = 50;
    const isSwipeUp = event.translationY < -swipethreshold;
    const isSwipeDown = event.translationY > swipethreshold;

    if (isSwipeUp) {
      menuTranslateY.value = withSpring(0, {
        damping: 30,
        stiffness: 200,
        mass: 1,
      });
    } else if (isSwipeDown) {
      menuTranslateY.value = withSpring(CLOSED_POSITION, {
        damping: 30,
        stiffness: 200,
        mass: 1,
      });
    }
  });

  return (
    <View style={{ flex: 1, backgroundColor: "white" }}>
      {/* Video */}
      <VideoView
        player={player}
        nativeControls={false}
        style={[StyleSheet.absoluteFill, { width, height }]}
        contentFit="cover"
      />

      {/* Hero Text Section */}
      <View
        style={[
          StyleSheet.absoluteFill,
          {
            backgroundColor: "rgba(0,0,0,0.2)",
            zIndex: 10,
          },
        ]}
      >
        <Animated.View
          entering={FadeIn.duration(800).delay(200)}
          style={styles.heroTextContainer}
        >
          <View style={styles.mainTextContainer}>
            <Animated.Text
              entering={FadeIn.duration(600).delay(200)}
              style={styles.heroTextMain}
            >
              Learn
            </Animated.Text>
            <View style={styles.animatedTextContainer}>
              <Animated.Text
                key={languages[languageIndex]}
                entering={FadeIn.duration(400)}
                exiting={FadeOut.duration(400)}
                style={styles.heroTextMain}
              >
                {languages[languageIndex]}
              </Animated.Text>
            </View>
            <Animated.Text
              entering={FadeIn.duration(600).delay(200)}
              style={styles.heroTextMain}
            >
              the right
            </Animated.Text>
            <Animated.Text
              entering={FadeIn.duration(600).delay(200)}
              style={styles.heroTextMain}
            >
              way
            </Animated.Text>
          </View>
        </Animated.View>
      </View>

      {/* Sliding Menu */}
      {/* Gesture Handler */}
      <GestureDetector gesture={gestureHandler}>
        <Animated.View
          style={[
            styles.menuContainer,
            menuAnimatedStyle,
            { height: dynamicMenuHeight, paddingBottom: insets.bottom + 30 },
          ]}
        >
          <Pressable style={styles.handleContainer} onPress={handlePress}>
            <View style={styles.handle} />
          </Pressable>

          <View style={styles.menuContent}>
            {currentView === "login" ? renderLoginView() : renderEmailView()}
          </View>
        </Animated.View>
      </GestureDetector>
    </View>
  );
}

const styles = StyleSheet.create({
  menuContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: MENU_HEIGHT + 100,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1.5,
    borderLeftWidth: 1.5,
    borderRightWidth: 1.5,
    borderColor: "rgba(255, 255, 255, 0.15)",
    zIndex: 30,
  },
  handleContainer: {
    paddingVertical: 12,
    alignItems: "center",
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: "rgba(255, 255, 255, 0.5)",
    borderRadius: 2,
  },
  menuContent: {
    flex: 1,
    paddingHorizontal: 30,
  },
  viewContainer: {
    flex: 1,
  },
  logoSection: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 20,
    marginBottom: 24,
    paddingHorizontal: 10,
  },
  logoContainer: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  logo: {
    width: 25,
    height: 25,
    marginRight: 5,
    borderRadius: 12,
  },
  appName: {
    fontSize: 18,
    fontWeight: "700",
    color: "white",
  },
  statsContainer: {
    alignItems: "center",
  },
  rating: {
    fontSize: 16,
    fontWeight: "600",
    color: "white",
  },
  buttonsContainer: {
    gap: 16,
  },
  loginButton: {
    backgroundColor: "rgba(60, 60, 67, 0.8)",
    borderColor: "rgba(120, 120, 128, 0.4)",
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    minHeight: 40,
  },
  appleIcon: {
    marginRight: 12,
  },
  googleIcon: {
    marginRight: 12,
  },
  emailIcon: {
    marginRight: 12,
  },
  buttonText: {
    color: "white",
    fontSize: 17,
    fontWeight: "500",
    letterSpacing: -0.2,
  },
  heroTextContainer: {
    position: "absolute",
    top: height * 0.15,
    left: 30,
    right: 30,
    zIndex: 25,
  },
  mainTextContainer: {
    marginBottom: 20,
  },
  heroTextMain: {
    fontSize: verticalScale(45),
    fontWeight: "800",
    fontFamily: "SpaceMono-Regular",
    color: "#fff4cc",
    lineHeight: verticalScale(50),
    letterSpacing: 0,
  },
  animatedTextContainer: {
    minHeight: verticalScale(60),
    justifyContent: "center",
  },
  heroTextScript: {
    fontSize: verticalScale(55),
    fontFamily: "EBGaramond_500Medium_Italic",
    color: Colors.primaryAccentColor,
    letterSpacing: 0.5,
  },
});
