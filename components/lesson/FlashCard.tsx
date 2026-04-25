import {
  getPhrasePrimaryText,
  getPhraseSecondaryText,
  Word,
} from "@/constants/CourseData";
import { useRef, useState } from "react";
import { Animated, Pressable, StyleSheet, View } from "react-native";
import { ThemedText } from "../themed-text";

export default function Flashcard({
  word,
  direction,
}: {
  word: Word;
  direction: "en-to-target" | "target-to-en";
}) {
  const [isFlipped, setIsFlipped] = useState(false);
  const flipAnimation = useRef(new Animated.Value(0)).current;
  const primaryText = getPhrasePrimaryText(word) || word.english;
  const secondaryText = getPhraseSecondaryText(word);

  const frontInterpolate = flipAnimation.interpolate({
    inputRange: [0, 180],
    outputRange: ["0deg", "180deg"],
  });

  const backInterpolate = flipAnimation.interpolate({
    inputRange: [0, 180],
    outputRange: ["180deg", "360deg"],
  });

  const frontAnimatedStyle = {
    transform: [{ rotateY: frontInterpolate }],
  };

  const backAnimatedStyle = {
    transform: [{ rotateY: backInterpolate }],
  };

  const flipToFront = () => {
    Animated.timing(flipAnimation, {
      toValue: 0,
      duration: 250,
      useNativeDriver: true,
    }).start();
    setIsFlipped(false);
  };

  const flipToBack = () => {
    Animated.timing(flipAnimation, {
      toValue: 180,
      duration: 250,
      useNativeDriver: true,
    }).start();
    setIsFlipped(true);
  };

  const renderTargetText = (isBack = false) => (
    <View style={styles.termContent}>
      {secondaryText ? (
        <ThemedText
          style={[styles.secondaryText, isBack ? styles.inverseText : null]}
        >
          {secondaryText}
        </ThemedText>
      ) : null}
      <ThemedText
        style={[
          styles.primaryText,
          !secondaryText ? styles.primaryTextSolo : null,
          isBack ? styles.inverseText : null,
        ]}
      >
        {primaryText}
      </ThemedText>
    </View>
  );

  const FrontContent = () => {
    if (direction === "en-to-target") {
      return (
        <ThemedText style={styles.englishFront}>{word.english}</ThemedText>
      );
    }

    return renderTargetText();
  };

  const BackContent = () => {
    if (direction === "en-to-target") {
      return renderTargetText(true);
    }

    return (
      <ThemedText style={[styles.englishBack, styles.inverseText]}>
        {word.english}
      </ThemedText>
    );
  };

  return (
    <Pressable onPress={isFlipped ? flipToFront : flipToBack}>
      <View>
        <Animated.View
          style={[styles.card, styles.cardFront, frontAnimatedStyle]}
        >
          {FrontContent()}
        </Animated.View>
        <Animated.View
          style={[styles.card, styles.cardBack, backAnimatedStyle]}
        >
          {BackContent()}
        </Animated.View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 340,
    maxHeight: 440,
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
    backfaceVisibility: "hidden",
    borderRadius: 28,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
    paddingHorizontal: 32,
    paddingVertical: 48,
  },
  cardFront: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  cardBack: {
    backgroundColor: "#1a1a2e",
    position: "absolute",
    top: 0,
  },
  termContent: {
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    width: "100%",
  },
  secondaryText: {
    fontSize: 40,
    lineHeight: 48,
    fontWeight: "600",
    textAlign: "center",
    maxWidth: "90%",
  },
  primaryText: {
    fontSize: 30,
    lineHeight: 36,
    textAlign: "center",
    maxWidth: "90%",
  },
  primaryTextSolo: {
    fontSize: 40,
    lineHeight: 48,
    fontWeight: "600",
  },
  inverseText: {
    color: "white",
  },
  englishFront: {
    fontSize: 40,
    lineHeight: 48,
    textAlign: "center",
    fontWeight: "600",
    maxWidth: "90%",
  },
  englishBack: {
    fontSize: 40,
    lineHeight: 48,
    textAlign: "center",
    fontStyle: "italic",
    maxWidth: "90%",
  },
});
