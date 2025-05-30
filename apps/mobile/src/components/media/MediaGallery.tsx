import React, { useState, useMemo, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../../providers";
import {
  useGroupMedia,
  useDeleteMedia,
  useUpdateMediaCaption,
} from "../../hooks";
import { MediaItem } from "./MediaItem";
import { MediaPicker } from "./MediaPicker";
import { MediaGalleryModal } from "./MediaGalleryModal";
import type {
  MediaItem as MediaItemType,
  MediaGalleryFilters,
} from "../../types";

interface MediaGalleryProps {
  groupId: string;
  showUpload?: boolean;
  onUpload?: (assets: any[]) => void;
  filters?: MediaGalleryFilters;
  onFiltersChange?: (filters: MediaGalleryFilters) => void;
}

export function MediaGallery({
  groupId,
  showUpload = true,
  onUpload,
  filters,
  onFiltersChange,
}: MediaGalleryProps) {
  const { isDark } = useTheme();
  const [showFilters, setShowFilters] = useState(false);
  const [numColumns, setNumColumns] = useState(2); // Default to 2 columns
  const [key, setKey] = useState(0); // Key to force FlatList re-render when columns change
  const [galleryModalVisible, setGalleryModalVisible] = useState(false);
  const [galleryInitialIndex, setGalleryInitialIndex] = useState(0);

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    refetch,
    isRefetching,
  } = useGroupMedia(groupId, filters);

  const deleteMediaMutation = useDeleteMedia();
  const updateCaptionMutation = useUpdateMediaCaption();

  const mediaItems = useMemo(() => {
    return data?.pages.flatMap((page) => page.media) || [];
  }, [data]);

  const handleLoadMore = () => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  };

  const handleDelete = (mediaId: string) => {
    deleteMediaMutation.mutate(mediaId);
  };

  const handleUpdateCaption = (mediaId: string, caption: string) => {
    updateCaptionMutation.mutate({ mediaId, data: { caption } });
  };

  const handleMediaPress = (media: MediaItemType) => {
    const index = mediaItems.findIndex((item) => item.id === media.id);
    if (index !== -1) {
      setGalleryInitialIndex(index);
      setGalleryModalVisible(true);
    }
  };

  const handleFilterToggle = (
    filterType: keyof MediaGalleryFilters,
    value: any
  ) => {
    const newFilters = { ...filters };

    if (newFilters[filterType] === value) {
      delete newFilters[filterType];
    } else {
      newFilters[filterType] = value;
    }

    onFiltersChange?.(newFilters);
  };

  const columnOptions = [1, 2, 3, 4, 5]; // Available column options

  // Load saved column preference on mount
  useEffect(() => {
    const loadColumnPreference = async () => {
      try {
        const savedColumns = await AsyncStorage.getItem("mediaGalleryColumns");
        if (savedColumns) {
          const parsedColumns = parseInt(savedColumns, 10);
          if (columnOptions.includes(parsedColumns)) {
            setNumColumns(parsedColumns);
            setKey((prev) => prev + 1);
          }
        }
      } catch (error) {
        console.log("Failed to load column preference:", error);
      }
    };

    loadColumnPreference();
  }, []);

  const handleColumnChange = async (columns: number) => {
    setNumColumns(columns);
    setKey((prev) => prev + 1); // Force FlatList re-render

    // Save preference
    try {
      await AsyncStorage.setItem("mediaGalleryColumns", columns.toString());
    } catch (error) {
      console.log("Failed to save column preference:", error);
    }
  };

  const renderMediaItem = ({
    item,
    index,
  }: {
    item: MediaItemType;
    index: number;
  }) => {
    // Adjust padding based on column count for better spacing
    const getPadding = () => {
      switch (numColumns) {
        case 1:
          return "p-2";
        case 2:
          return "p-1";
        case 3:
          return "p-0.5";
        case 4:
          return "p-0.5";
        default:
          return "p-1";
      }
    };

    return (
      <View
        className={
          numColumns === 1 ? `w-full ${getPadding()}` : `flex-1 ${getPadding()}`
        }
      >
        <MediaItem
          media={item}
          onDelete={handleDelete}
          onUpdateCaption={handleUpdateCaption}
          onPress={handleMediaPress}
          size="large"
        />
      </View>
    );
  };

  const renderHeader = () => (
    <View className="mb-4">
      {showUpload && onUpload && (
        <View className="mb-4">
          <MediaPicker
            onMediaSelected={onUpload}
            allowMultiple={true}
            mediaTypes="all"
            maxSelection={10}
          />
        </View>
      )}

      <View className="flex-row items-center justify-between mb-4">
        <Text
          className={`text-lg font-semibold ${
            isDark ? "text-white" : "text-light-text"
          }`}
        >
          Media Gallery
        </Text>
        <View className="flex-row items-center gap-2">
          <TouchableOpacity
            onPress={() => setShowFilters(!showFilters)}
            className={`
              ${isDark ? "bg-dark-400" : "bg-light-surface"}
              rounded-lg
              p-2
              flex-row
              items-center
            `}
          >
            <Ionicons
              name="filter"
              size={16}
              color={isDark ? "#4ECDC4" : "#14b8a6"}
            />
            <Text
              className={`ml-1 text-sm ${
                isDark ? "text-primary-400" : "text-primary-500"
              }`}
            >
              Filter
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {showFilters && (
        <View
          className={`
            ${isDark ? "bg-dark-400" : "bg-light-surface"}
            rounded-lg
            p-4
            mb-4
          `}
        >
          <Text
            className={`text-sm font-medium mb-3 ${
              isDark ? "text-white" : "text-light-text"
            }`}
          >
            Filter by type:
          </Text>
          <View className="flex-row flex-wrap gap-2">
            {["image", "video"].map((type) => (
              <TouchableOpacity
                key={type}
                onPress={() => handleFilterToggle("mediaType", type)}
                className={`
                  px-3 py-2 rounded-lg border
                  ${
                    filters?.mediaType === type
                      ? `${
                          isDark
                            ? "bg-primary-400 border-primary-400"
                            : "bg-primary-500 border-primary-500"
                        }`
                      : `${isDark ? "border-dark-300" : "border-light-border"}`
                  }
                `}
              >
                <Text
                  className={`
                    text-sm capitalize
                    ${
                      filters?.mediaType === type
                        ? "text-white"
                        : `${isDark ? "text-white" : "text-light-text"}`
                    }
                  `}
                >
                  {type}s
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}
      {/* Column Selector */}
      <View className="flex-row items-center gap-2">
        <View
          className={`
                ${isDark ? "bg-dark-400" : "bg-light-surface"}
                rounded-lg
                p-1.5
                flex-row
                items-center
              `}
        >
          {columnOptions.map((columns) => {
            return (
              <TouchableOpacity
                key={columns}
                onPress={() => handleColumnChange(columns)}
                className={`
                      rounded-md
                      px-3 py-1
                      flex-row
                      items-center
                      justify-center
                      ${
                        numColumns === columns
                          ? isDark
                            ? "bg-primary-400"
                            : "bg-primary-500"
                          : "transparent"
                      }
                    `}
              >
                <Text
                  className={`
                        text-sm font-medium
                        ${
                          numColumns === columns
                            ? "text-white"
                            : isDark
                            ? "text-dark-200"
                            : "text-light-text/60"
                        }
                      `}
                >
                  {columns}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    </View>
  );

  const renderEmpty = () => (
    <View className="flex-1 items-center justify-center py-12">
      <View
        className={`
          ${isDark ? "bg-primary-400/20" : "bg-primary-500/20"}
          rounded-full
          p-4
          mb-4
        `}
      >
        <Ionicons
          name="images-outline"
          size={48}
          color={isDark ? "#4ECDC4" : "#14b8a6"}
        />
      </View>
      <Text
        className={`text-lg font-medium mb-2 ${
          isDark ? "text-white" : "text-light-text"
        }`}
      >
        No media yet
      </Text>
      <Text
        className={`text-center mb-2 ${
          isDark ? "text-dark-200" : "text-light-text/60"
        }`}
      >
        {showUpload
          ? "Start by uploading your first photo or video"
          : "No media items found for this group"}
      </Text>
      <Text
        className={`text-center text-xs ${
          isDark ? "text-dark-200" : "text-light-text/40"
        }`}
      >
        Currently viewing in {numColumns} column{numColumns !== 1 ? "s" : ""}{" "}
        layout
      </Text>
    </View>
  );

  const renderFooter = () => {
    if (!isFetchingNextPage) return null;

    return (
      <View className="py-4 items-center">
        <Text className={`${isDark ? "text-dark-200" : "text-light-text/60"}`}>
          Loading more...
        </Text>
      </View>
    );
  };

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center">
        <Text className={`${isDark ? "text-white" : "text-light-text"}`}>
          Loading media...
        </Text>
      </View>
    );
  }

  return (
    <View className="flex-1">
      <FlatList
        key={key}
        data={mediaItems}
        renderItem={renderMediaItem}
        keyExtractor={(item) => item.id}
        numColumns={numColumns}
        scrollEnabled={false}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmpty}
        ListFooterComponent={renderFooter}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor={isDark ? "#4ECDC4" : "#14b8a6"}
          />
        }
        contentContainerStyle={{
          padding: 16,
          flexGrow: 1,
        }}
        columnWrapperStyle={
          numColumns > 1
            ? {
                justifyContent: "space-between",
              }
            : undefined
        }
      />

      <MediaGalleryModal
        visible={galleryModalVisible}
        mediaItems={mediaItems}
        initialIndex={galleryInitialIndex}
        onClose={() => setGalleryModalVisible(false)}
        onDelete={handleDelete}
        onUpdateCaption={handleUpdateCaption}
      />
    </View>
  );
}
