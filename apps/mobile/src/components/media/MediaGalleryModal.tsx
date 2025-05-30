import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  FlatList,
  Dimensions,
  StatusBar,
  StyleSheet,
  Alert,
} from "react-native";
import { Image } from "expo-image";
import { useVideoPlayer, VideoView } from "expo-video";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../../providers";
import { CameraUtils } from "../../utils/cameraUtils";
import { BlurView } from "expo-blur";
import * as Haptics from "expo-haptics";
import ImageViewer from "react-native-image-zoom-viewer";
import type { MediaItem as MediaItemType } from "../../types";

const { width: screenWidth, height: screenHeight } = Dimensions.get("window");

interface MediaGalleryModalProps {
  visible: boolean;
  mediaItems: MediaItemType[];
  initialIndex: number;
  onClose: () => void;
  onDelete?: (mediaId: string) => void;
  onUpdateCaption?: (mediaId: string, caption: string) => void;
}

interface MediaItemProps {
  media: MediaItemType;
  isActive: boolean;
  width: number;
  height: number;
}

const VideoPlayer = React.memo(
  ({ media, isActive, width, height }: MediaItemProps) => {
    const player = useVideoPlayer(media.fileUrl, (player) => {
      if (player) {
        player.loop = false;
        player.muted = false;
      }
    });

    useEffect(() => {
      if (player) {
        if (isActive) {
          player.play();
        } else {
          player.pause();
        }
      }
    }, [isActive, player]);

    return (
      <View className="w-full h-full items-center justify-center">
        <VideoView
          player={player}
          className="w-full h-full"
          style={{
            width: width,
            height: height,
          }}
          contentFit="contain"
          nativeControls={true}
        />
      </View>
    );
  }
);

VideoPlayer.displayName = "VideoPlayer";

export function MediaGalleryModal({
  visible,
  mediaItems,
  initialIndex,
  onClose,
  onDelete,
  onUpdateCaption,
}: MediaGalleryModalProps) {
  const { isDark } = useTheme();
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [showControls, setShowControls] = useState(true);
  const [showInfo, setShowInfo] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  const controlsTimeoutRef = useRef<ReturnType<typeof setTimeout>>(null);

  const currentMedia = mediaItems[currentIndex];

  useEffect(() => {
    setCurrentIndex(initialIndex);
  }, [initialIndex]);

  useEffect(() => {
    if (visible && flatListRef.current) {
      setTimeout(() => {
        flatListRef.current?.scrollToIndex({
          index: initialIndex,
          animated: false,
        });
      }, 100);
    }
  }, [visible, initialIndex]);

  const hideControlsAfterDelay = () => {
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    controlsTimeoutRef.current = setTimeout(() => {
      setShowControls(false);
    }, 3000);
  };

  const toggleControls = () => {
    setShowControls((prev) => !prev);
    if (!showControls) {
      hideControlsAfterDelay();
    }
  };

  useEffect(() => {
    if (visible && showControls) {
      hideControlsAfterDelay();
    }
    return () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, [visible, showControls]);

  const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (viewableItems.length > 0) {
      const newIndex = viewableItems[0].index;
      setCurrentIndex(newIndex);
      if (Haptics?.impactAsync) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    }
  });

  const renderMediaItem = ({
    item,
    index,
  }: {
    item: MediaItemType;
    index: number;
  }) => {
    const isActive = index === currentIndex;

    if (item.mediaType === "video") {
      return (
        <TouchableOpacity
          activeOpacity={1}
          onPress={toggleControls}
          style={{ width: screenWidth, height: screenHeight }}
          className="items-center justify-center"
        >
          <VideoPlayer
            media={item}
            isActive={isActive}
            width={screenWidth}
            height={screenHeight}
          />
        </TouchableOpacity>
      );
    }

    // For images, use a simple zoomable view
    return (
      <TouchableOpacity
        activeOpacity={1}
        onPress={toggleControls}
        style={{ width: screenWidth, height: screenHeight }}
        className="items-center justify-center"
      >
        <Image
          source={{ uri: item.fileUrl }}
          style={StyleSheet.absoluteFillObject}
          contentFit="contain"
          transition={200}
        />
      </TouchableOpacity>
    );
  };

  const handleClose = () => {
    if (Haptics?.impactAsync) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    onClose();
  };

  const handleDelete = () => {
    if (!currentMedia || !onDelete) return;

    Alert.alert(
      "Delete Media",
      "Are you sure you want to delete this media item?",
      [
        {
          text: "Cancel",
          style: "cancel",
          onPress: () => {
            if (Haptics?.impactAsync) {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }
          },
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            if (Haptics?.notificationAsync) {
              Haptics.notificationAsync(
                Haptics.NotificationFeedbackType.Warning
              );
            }
            onDelete(currentMedia.id);
          },
        },
      ]
    );
  };
  const handleInfo = () => {
    if (Haptics?.impactAsync) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setShowInfo((prev) => !prev);
  };

  if (!visible || mediaItems.length === 0) return null;

  // Separate images from videos for better handling
  const hasOnlyImages = mediaItems.every((item) => item.mediaType === "image");

  // If all media items are images, use ImageViewer for better zoom experience
  if (hasOnlyImages) {
    const imageUrls = mediaItems.map((item) => ({
      url: item.fileUrl,
      width: item.width,
      height: item.height,
      props: {
        media: item,
      },
    }));

    return (
      <Modal
        visible={visible}
        transparent={true}
        animationType="fade"
        onRequestClose={handleClose}
        statusBarTranslucent={true}
      >
        <StatusBar hidden={true} />

        <View className="flex-1 bg-black">
          <ImageViewer
            imageUrls={imageUrls}
            index={initialIndex}
            onSwipeDown={handleClose}
            enableSwipeDown={true}
            onCancel={handleClose}
            onChange={(index?: number) => {
              if (index !== undefined && index !== currentIndex) {
                setCurrentIndex(index);
                if (Haptics?.impactAsync) {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }
              }
            }}
            onClick={toggleControls}
            enableImageZoom={true}
            doubleClickInterval={250}
            flipThreshold={80}
            swipeDownThreshold={230}
            backgroundColor="black"
            renderIndicator={() => <></>}
            renderHeader={() => {
              if (!showControls) return <></>;

              return (
                <View className="absolute top-0 left-0 right-0 z-10">
                  <BlurView
                    intensity={80}
                    tint="dark"
                    className="px-4 pt-12 pb-4"
                  >
                    <View className="flex-row items-center justify-between">
                      <TouchableOpacity
                        onPress={handleClose}
                        className="bg-black/30 rounded-full p-3"
                        style={{ elevation: 5 }}
                      >
                        <Ionicons name="close" size={24} color="white" />
                      </TouchableOpacity>

                      <View className="flex-row items-center gap-3">
                        <TouchableOpacity
                          onPress={handleInfo}
                          className="bg-black/30 rounded-full p-3"
                          style={{ elevation: 5 }}
                        >
                          <Ionicons
                            name={
                              showInfo ? "information" : "information-outline"
                            }
                            size={24}
                            color="white"
                          />
                        </TouchableOpacity>

                        {onDelete && (
                          <TouchableOpacity
                            onPress={handleDelete}
                            className="bg-red-500/80 rounded-full p-3"
                            style={{ elevation: 5 }}
                          >
                            <Ionicons
                              name="trash-outline"
                              size={24}
                              color="white"
                            />
                          </TouchableOpacity>
                        )}
                      </View>
                    </View>
                  </BlurView>
                </View>
              );
            }}
            renderFooter={() => {
              if (!showInfo || !currentMedia) return <></>;

              return (
                <View className="absolute bottom-0 left-0 right-0 z-10">
                  <BlurView intensity={80} tint="dark" className="p-4">
                    <View className="gap-3">
                      {currentMedia.caption && (
                        <View>
                          <Text className="text-white/60 text-xs font-medium uppercase tracking-wide mb-1">
                            Caption
                          </Text>
                          <Text className="text-white text-base leading-5">
                            {currentMedia.caption}
                          </Text>
                        </View>
                      )}

                      <View className="flex-row flex-wrap gap-4">
                        <View className="flex-1 min-w-[120px]">
                          <Text className="text-white/60 text-xs font-medium uppercase tracking-wide">
                            Type
                          </Text>
                          <Text className="text-white text-sm capitalize">
                            {currentMedia.mediaType}
                          </Text>
                        </View>

                        {(currentMedia.width || currentMedia.height) && (
                          <View className="flex-1 min-w-[120px]">
                            <Text className="text-white/60 text-xs font-medium uppercase tracking-wide">
                              Dimensions
                            </Text>
                            <Text className="text-white text-sm">
                              {currentMedia.width} × {currentMedia.height}
                            </Text>
                          </View>
                        )}

                        <View className="flex-1 min-w-[120px]">
                          <Text className="text-white/60 text-xs font-medium uppercase tracking-wide">
                            Uploaded by
                          </Text>
                          <Text className="text-white text-sm">
                            {currentMedia.uploadedBy?.fullName ||
                              currentMedia.uploadedBy?.username ||
                              "Unknown"}
                          </Text>
                        </View>
                      </View>

                      <View>
                        <Text className="text-white/60 text-xs font-medium uppercase tracking-wide mb-1">
                          Created
                        </Text>
                        <Text className="text-white text-sm">
                          {new Date(currentMedia.createdAt).toLocaleDateString(
                            undefined,
                            {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            }
                          )}
                        </Text>
                      </View>
                    </View>
                  </BlurView>
                </View>
              );
            }}
          />
        </View>
      </Modal>
    );
  }

  // For mixed content or videos, use FlatList
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={handleClose}
      statusBarTranslucent={true}
    >
      <StatusBar hidden={true} />

      <View className="flex-1 bg-black">
        <FlatList
          ref={flatListRef}
          data={mediaItems}
          renderItem={renderMediaItem}
          keyExtractor={(item) => item.id}
          horizontal={true}
          pagingEnabled={true}
          showsHorizontalScrollIndicator={false}
          onViewableItemsChanged={onViewableItemsChanged.current}
          viewabilityConfig={{
            itemVisiblePercentThreshold: 50,
          }}
          getItemLayout={(_, index) => ({
            length: screenWidth,
            offset: screenWidth * index,
            index,
          })}
        />

        {/* Top Controls */}
        {showControls && (
          <View className="absolute top-0 left-0 right-0 z-10">
            <BlurView intensity={80} tint="dark" className="px-4 pt-12 pb-4">
              <View className="flex-row items-center justify-between">
                <TouchableOpacity
                  onPress={handleClose}
                  className="bg-black/30 rounded-full p-3"
                  style={{ elevation: 5 }}
                >
                  <Ionicons name="close" size={24} color="white" />
                </TouchableOpacity>

                <View className="flex-row items-center gap-3">
                  <TouchableOpacity
                    onPress={handleInfo}
                    className="bg-black/30 rounded-full p-3"
                    style={{ elevation: 5 }}
                  >
                    <Ionicons
                      name={showInfo ? "information" : "information-outline"}
                      size={24}
                      color="white"
                    />
                  </TouchableOpacity>

                  {onDelete && (
                    <TouchableOpacity
                      onPress={handleDelete}
                      className="bg-red-500/80 rounded-full p-3"
                      style={{ elevation: 5 }}
                    >
                      <Ionicons name="trash-outline" size={24} color="white" />
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            </BlurView>
          </View>
        )}

        {/* Media Info Overlay */}
        {showInfo && currentMedia && (
          <View className="absolute bottom-0 left-0 right-0 z-10">
            <BlurView intensity={80} tint="dark" className="p-4">
              <View className="gap-3">
                {currentMedia.caption && (
                  <View>
                    <Text className="text-white/60 text-xs font-medium uppercase tracking-wide mb-1">
                      Caption
                    </Text>
                    <Text className="text-white text-base leading-5">
                      {currentMedia.caption}
                    </Text>
                  </View>
                )}

                <View className="flex-row flex-wrap gap-4">
                  <View className="flex-1 min-w-[120px]">
                    <Text className="text-white/60 text-xs font-medium uppercase tracking-wide">
                      Type
                    </Text>
                    <Text className="text-white text-sm capitalize">
                      {currentMedia.mediaType}
                    </Text>
                  </View>

                  {currentMedia.duration && (
                    <View className="flex-1 min-w-[120px]">
                      <Text className="text-white/60 text-xs font-medium uppercase tracking-wide">
                        Duration
                      </Text>
                      <Text className="text-white text-sm">
                        {CameraUtils.formatDuration(currentMedia.duration)}
                      </Text>
                    </View>
                  )}

                  {(currentMedia.width || currentMedia.height) && (
                    <View className="flex-1 min-w-[120px]">
                      <Text className="text-white/60 text-xs font-medium uppercase tracking-wide">
                        Dimensions
                      </Text>
                      <Text className="text-white text-sm">
                        {currentMedia.width} × {currentMedia.height}
                      </Text>
                    </View>
                  )}

                  <View className="flex-1 min-w-[120px]">
                    <Text className="text-white/60 text-xs font-medium uppercase tracking-wide">
                      Uploaded by
                    </Text>
                    <Text className="text-white text-sm">
                      {currentMedia.uploadedBy?.fullName ||
                        currentMedia.uploadedBy?.username ||
                        "Unknown"}
                    </Text>
                  </View>
                </View>

                <View>
                  <Text className="text-white/60 text-xs font-medium uppercase tracking-wide mb-1">
                    Created
                  </Text>
                  <Text className="text-white text-sm">
                    {new Date(currentMedia.createdAt).toLocaleDateString(
                      undefined,
                      {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      }
                    )}
                  </Text>
                </View>
              </View>
            </BlurView>
          </View>
        )}

        {/* Page Indicators */}
        {mediaItems.length > 1 && showControls && (
          <View className="absolute bottom-6 left-1/2 transform -translate-x-1/2 z-10">
            <View className="flex-row gap-1 bg-black/40 rounded-full px-3 py-2">
              {mediaItems
                .slice(Math.max(0, currentIndex - 2), currentIndex + 3)
                .map((_, index) => {
                  const actualIndex = Math.max(0, currentIndex - 2) + index;
                  const isActive = actualIndex === currentIndex;

                  return (
                    <View
                      key={actualIndex}
                      className={`
                      w-2 h-2 rounded-full
                      ${isActive ? "bg-white" : "bg-white/30"}
                    `}
                    />
                  );
                })}
            </View>
          </View>
        )}
      </View>
    </Modal>
  );
}
