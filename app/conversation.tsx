import ConversationMode from "@/components/conversation/ConversationMode";
import { ConversationScenario, getCourseData } from "@/constants/CourseData";
import { Colors } from "@/constants/theme";
import { useAuth } from "@/ctx/AuthContext";
import { getCustomScenario } from "@/lib/customScenarios";
import { Redirect, router, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ConversationScreen() {
  const { scenarioId, customScenarioId } = useLocalSearchParams<{
    scenarioId?: string;
    customScenarioId?: string;
  }>();
  const { profile } = useAuth();
  const [customScenario, setCustomScenario] =
    useState<ConversationScenario | null>(null);
  const [isLoadingCustomScenario, setIsLoadingCustomScenario] = useState(false);

  const courseData = getCourseData(profile?.selected_language);

  const builtInScenario = useMemo(
    () => courseData.scenarios.find((scenario) => scenario.id === scenarioId),
    [courseData.scenarios, scenarioId],
  );

  useEffect(() => {
    let isActive = true;

    const loadCustomScenario = async () => {
      if (!customScenarioId) {
        setCustomScenario(null);
        return;
      }

      setIsLoadingCustomScenario(true);
      try {
        const scenario = await getCustomScenario(customScenarioId);
        if (isActive) setCustomScenario(scenario);
      } finally {
        if (isActive) setIsLoadingCustomScenario(false);
      }
    };

    void loadCustomScenario();

    return () => {
      isActive = false;
    };
  }, [customScenarioId]);

  const scenario = customScenarioId ? customScenario : builtInScenario;

  if (isLoadingCustomScenario) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primaryAccentColor} />
      </SafeAreaView>
    );
  }

  if (!scenario) {
    return <Redirect href="/(tabs)/conversations" />;
  }

  return (
    <View style={styles.container}>
      <ConversationMode
        scenario={scenario}
        onExit={() => router.replace("/(tabs)/conversations")}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "white",
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "white",
  },
});
