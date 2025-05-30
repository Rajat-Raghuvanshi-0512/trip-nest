import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, Alert, Modal } from "react-native";
import { Image } from "expo-image";
import { useVideoPlayer, VideoView } from "expo-video";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../../providers";
import { CameraUtils } from "../../utils/cameraUtils";
import type { MediaItem as MediaItemType } from "../../types";

interface MediaItemProps {
  media: MediaItemType;
  onDelete?: (mediaId: string) => void;
  onUpdateCaption?: (mediaId: string, caption: string) => void;
  onPress?: (media: MediaItemType) => void;
  showActions?: boolean;
  size?: "small" | "medium" | "large";
}

export function MediaItem({
  media,
  onDelete,
  onUpdateCaption,
  onPress,
  showActions = true,
  size = "medium",
}: MediaItemProps) {
  const { isDark } = useTheme();
  const [showFullScreen, setShowFullScreen] = useState(false);

  // Debug logging for component render
  console.log(`[MediaItem] Rendering media item:`, {
    mediaId: media.id,
    status: media.status,
    mediaType: media.mediaType,
    shouldShowOverlay: media.status !== "ready" && media.status !== "completed",
    fullMediaObject: media,
  });

  // Create video players for thumbnail and full-screen display
  const thumbnailPlayer = useVideoPlayer(
    media.mediaType === "video" ? media.thumbnailUrl || media.fileUrl : null,
    (player) => {
      if (player) {
        player.loop = false;
        player.muted = true;
      }
    }
  );

  const fullScreenPlayer = useVideoPlayer(
    media.mediaType === "video" ? media.fileUrl : null,
    (player) => {
      if (player) {
        player.loop = false;
        player.muted = false;
      }
    }
  );

  // Handle fullscreen video playback
  useEffect(() => {
    if (media.mediaType === "video" && fullScreenPlayer) {
      if (showFullScreen) {
        fullScreenPlayer.play();
      } else {
        fullScreenPlayer.pause();
      }
    }
  }, [showFullScreen, media.mediaType, fullScreenPlayer]);

  const getSizeStyles = () => {
    switch (size) {
      case "small":
        return "w-20 h-20";
      case "medium":
        return "w-32 h-32";
      case "large":
        return "w-full aspect-square";
      default:
        return "w-32 h-32";
    }
  };

  const handlePress = () => {
    if (onPress) {
      onPress(media);
    } else {
      setShowFullScreen(true);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      "Delete Media",
      "Are you sure you want to delete this media item?",
      [
        { text: "Cancel", style: "cancel" as const },
        {
          text: "Delete",
          style: "destructive" as const,
          onPress: () => onDelete?.(media.id),
        },
      ]
    );
  };

  const handleUpdateCaption = () => {
    Alert.prompt(
      "Update Caption",
      "Enter a new caption for this media",
      [
        { text: "Cancel", style: "cancel" as const },
        {
          text: "Update",
          onPress: (caption) => {
            if (caption !== undefined) {
              onUpdateCaption?.(media.id, caption);
            }
          },
        },
      ],
      "plain-text",
      media.caption || ""
    );
  };

  const renderMedia = () => {
    if (media.mediaType === "video") {
      return (
        <View className="relative w-full h-full">
          <VideoView
            player={thumbnailPlayer}
            className="w-full h-full rounded-lg"
            contentFit="cover"
            nativeControls={false}
          />
          <View className="absolute inset-0 items-center justify-center">
            <View className="bg-black/50 rounded-full p-2">
              <Ionicons name="play" size={24} color="white" />
            </View>
          </View>
          {media.duration && (
            <View className="absolute bottom-2 right-2 bg-black/70 rounded px-2 py-1">
              <Text className="text-white text-xs">
                {CameraUtils.formatDuration(media.duration)}
              </Text>
            </View>
          )}
        </View>
      );
    }

    // Debug logging for image rendering
    const imageUrl = media.fileUrl || media.thumbnailUrl;

    console.log(`[MediaItem] Rendering image:`, {
      mediaId: media.id,
      mediaType: media.mediaType,
      status: media.status,
      fileUrl: media.fileUrl,
      thumbnailUrl: media.thumbnailUrl,
      finalImageUrl: imageUrl,
      fileName: media.fileName,
      hasValidUrl: !!imageUrl,
      urlLength: imageUrl?.length,
    });

    return (
      <Image
        source={{ uri: imageUrl }}
        contentFit="cover"
        transition={200}
        style={{
          width: "100%",
          height: "100%",
        }}
      />
    );
  };

  const renderFullScreenModal = () => {
    return (
      <Modal
        visible={showFullScreen}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowFullScreen(false)}
      >
        <View className="flex-1 bg-black">
          <TouchableOpacity
            className="absolute top-12 right-4 z-10 bg-black/50 rounded-full p-2"
            onPress={() => setShowFullScreen(false)}
          >
            <Ionicons name="close" size={24} color="white" />
          </TouchableOpacity>

          <View className="flex-1 items-center justify-center">
            {media.mediaType === "video" ? (
              <VideoView
                player={fullScreenPlayer}
                className="w-full h-full"
                contentFit="contain"
                nativeControls={true}
              />
            ) : (
              <Image
                source={{ uri: media.fileUrl }}
                className="w-full h-full"
                style={{
                  width: "100%",
                  height: "100%",
                }}
                contentFit="contain"
              />
            )}
          </View>

          {media.caption && (
            <View className="absolute bottom-12 left-4 right-4 bg-black/70 rounded-lg p-3">
              <Text className="text-white text-base">{media.caption}</Text>
            </View>
          )}
        </View>
      </Modal>
    );
  };

  return (
    <>
      <View
        className={`
          ${getSizeStyles()}
          ${isDark ? "bg-dark-400" : "bg-light-surface"}
          rounded-lg
          overflow-hidden
          relative
        `}
      >
        <TouchableOpacity
          onPress={handlePress}
          className="w-full h-full"
          activeOpacity={0.8}
        >
          {renderMedia()}
        </TouchableOpacity>

        {showActions && (onDelete || onUpdateCaption) && (
          <View className="absolute top-2 right-2 flex-row">
            {onUpdateCaption && (
              <TouchableOpacity
                onPress={handleUpdateCaption}
                className="bg-black/50 rounded-full p-1 mr-1"
              >
                <Ionicons name="create-outline" size={16} color="white" />
              </TouchableOpacity>
            )}
            {onDelete && (
              <TouchableOpacity
                onPress={handleDelete}
                className="bg-black/50 rounded-full p-1"
              >
                <Ionicons name="trash-outline" size={16} color="white" />
              </TouchableOpacity>
            )}
          </View>
        )}

        {media.status !== "ready" && media.status !== "completed" && (
          <View className="absolute inset-0 bg-black/50 items-center justify-center">
            <View className="bg-black/70 rounded-lg p-2">
              <Text className="text-white text-xs capitalize">
                {media.status}
              </Text>
            </View>
          </View>
        )}

        {size !== "small" && media.caption && (
          <View className="absolute bottom-0 left-0 right-0 bg-black/70 p-2">
            <Text
              className="text-white text-xs"
              numberOfLines={2}
              ellipsizeMode="tail"
            >
              {media.caption}
            </Text>
          </View>
        )}
      </View>

      {renderFullScreenModal()}
    </>
  );
}
