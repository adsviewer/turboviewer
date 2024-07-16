import { DeviceEnum, PublisherEnum } from '@repo/database';

const getKey = (
  publisher: PublisherEnum | undefined | null,
  device: DeviceEnum | undefined | null,
  position: Position | undefined | null,
): string => `${publisher ?? 'noPublisher'}_${position ?? 'noPosition'}_${device ?? 'noDevice'}`;

const add = (
  publisher: PublisherEnum | undefined,
  device: DeviceEnum | undefined,
  position: Position | undefined,
  format: FormatType,
): Map<string, FormatType> => iFrameAdFormatsMap.set(getKey(publisher, device, position), format);

export const getIFrameAdFormat = (
  publisher: PublisherEnum | undefined | null,
  device: DeviceEnum | undefined | null,
  position: Position | undefined | null,
): FormatType | undefined => {
  return iFrameAdFormatsMap.get(getKey(publisher, device, position));
};

enum Position {
  AnClassic = 'an_classic',
  BizDiscoFeed = 'biz_disco_feed',
  FacebookProfileFeed = 'facebook_profile_feed',
  FacebookReels = 'facebook_reels',
  FacebookReelsOverlay = 'facebook_reels_overlay',
  FacebookStories = 'facebook_stories',
  Feed = 'feed',
  InstagramExplore = 'instagram_explore',
  InstagramExploreGridHome = 'instagram_explore_grid_home',
  InstagramProfileFeed = 'instagram_profile_feed',
  InstagramReels = 'instagram_reels',
  InstagramReelsOverlay = 'instagram_reels_overlay',
  InstagramSearch = 'instagram_search',
  InstagramStories = 'instagram_stories',
  InstreamVideo = 'instream_video',
  Marketplace = 'marketplace',
  MessengerInbox = 'messenger_inbox',
  MessengerStories = 'messenger_stories',
  RewardedVideo = 'rewarded_video',
  RightHandColumn = 'right_hand_column',
  Search = 'search',
  VideoFeeds = 'video_feeds',
}

export const isMetaAdPosition = (value: unknown): value is Position => {
  return Object.values(Position).includes(value as Position);
};

enum FormatType {
  AudienceNetworkInstreamVideo = 'AUDIENCE_NETWORK_INSTREAM_VIDEO',
  AudienceNetworkInstreamVideoMobile = 'AUDIENCE_NETWORK_INSTREAM_VIDEO_MOBILE',
  AudienceNetworkOutstreamVideo = 'AUDIENCE_NETWORK_OUTSTREAM_VIDEO',
  AudienceNetworkRewardedVideo = 'AUDIENCE_NETWORK_REWARDED_VIDEO',
  BizDiscoFeedMobile = 'BIZ_DISCO_FEED_MOBILE',
  DesktopFeedStandard = 'DESKTOP_FEED_STANDARD',
  FacebookProfileFeedDesktop = 'FACEBOOK_PROFILE_FEED_DESKTOP',
  FacebookProfileFeedMobile = 'FACEBOOK_PROFILE_FEED_MOBILE',
  FacebookProfileReelsMobile = 'FACEBOOK_PROFILE_REELS_MOBILE',
  FacebookReelsBanner = 'FACEBOOK_REELS_BANNER',
  FacebookReelsBannerDesktop = 'FACEBOOK_REELS_BANNER_DESKTOP',
  FacebookReelsMobile = 'FACEBOOK_REELS_MOBILE',
  FacebookReelsPostloop = 'FACEBOOK_REELS_POSTLOOP',
  FacebookReelsSticker = 'FACEBOOK_REELS_STICKER',
  FacebookStoryMobile = 'FACEBOOK_STORY_MOBILE',
  FacebookStoryStickerMobile = 'FACEBOOK_STORY_STICKER_MOBILE',
  InstagramExploreContextual = 'INSTAGRAM_EXPLORE_CONTEXTUAL',
  InstagramExploreGridHome = 'INSTAGRAM_EXPLORE_GRID_HOME',
  InstagramExploreImmersive = 'INSTAGRAM_EXPLORE_IMMERSIVE',
  InstagramFeedWeb = 'INSTAGRAM_FEED_WEB',
  InstagramFeedWebMSite = 'INSTAGRAM_FEED_WEB_M_SITE',
  InstagramLeadGenMultiSubmitAds = 'INSTAGRAM_LEAD_GEN_MULTI_SUBMIT_ADS',
  InstagramProfileFeed = 'INSTAGRAM_PROFILE_FEED',
  InstagramProfileReels = 'INSTAGRAM_PROFILE_REELS',
  InstagramReels = 'INSTAGRAM_REELS',
  InstagramReelsOverlay = 'INSTAGRAM_REELS_OVERLAY',
  InstagramSearchChain = 'INSTAGRAM_SEARCH_CHAIN',
  InstagramSearchGrid = 'INSTAGRAM_SEARCH_GRID',
  InstagramStandard = 'INSTAGRAM_STANDARD',
  InstagramStory = 'INSTAGRAM_STORY',
  InstagramStoryEffectTray = 'INSTAGRAM_STORY_EFFECT_TRAY',
  InstagramStoryWeb = 'INSTAGRAM_STORY_WEB',
  InstagramStoryWebMSite = 'INSTAGRAM_STORY_WEB_M_SITE',
  InstantArticleRecirculationAd = 'INSTANT_ARTICLE_RECIRCULATION_AD',
  InstantArticleStandard = 'INSTANT_ARTICLE_STANDARD',
  InstreamBannerDesktop = 'INSTREAM_BANNER_DESKTOP',
  InstreamBannerFullscreenMobile = 'INSTREAM_BANNER_FULLSCREEN_MOBILE',
  InstreamBannerImmersiveMobile = 'INSTREAM_BANNER_IMMERSIVE_MOBILE',
  InstreamBannerMobile = 'INSTREAM_BANNER_MOBILE',
  InstreamVideoDesktop = 'INSTREAM_VIDEO_DESKTOP',
  InstreamVideoFullscreenMobile = 'INSTREAM_VIDEO_FULLSCREEN_MOBILE',
  InstreamVideoImage = 'INSTREAM_VIDEO_IMAGE',
  InstreamVideoImmersiveMobile = 'INSTREAM_VIDEO_IMMERSIVE_MOBILE',
  InstreamVideoMobile = 'INSTREAM_VIDEO_MOBILE',
  JobBrowserDesktop = 'JOB_BROWSER_DESKTOP',
  JobBrowserMobile = 'JOB_BROWSER_MOBILE',
  MarketplaceDesktop = 'MARKETPLACE_DESKTOP',
  MarketplaceMobile = 'MARKETPLACE_MOBILE',
  MessengerMobileInboxMedia = 'MESSENGER_MOBILE_INBOX_MEDIA',
  MessengerMobileStoryMedia = 'MESSENGER_MOBILE_STORY_MEDIA',
  MobileBanner = 'MOBILE_BANNER',
  MobileFeedBasic = 'MOBILE_FEED_BASIC',
  MobileFeedStandard = 'MOBILE_FEED_STANDARD',
  MobileFullwidth = 'MOBILE_FULLWIDTH',
  MobileInterstitial = 'MOBILE_INTERSTITIAL',
  MobileMediumRectangle = 'MOBILE_MEDIUM_RECTANGLE',
  MobileNative = 'MOBILE_NATIVE',
  RightColumnStandard = 'RIGHT_COLUMN_STANDARD',
  SuggestedVideoDesktop = 'SUGGESTED_VIDEO_DESKTOP',
  SuggestedVideoFullscreenMobile = 'SUGGESTED_VIDEO_FULLSCREEN_MOBILE',
  SuggestedVideoImmersiveMobile = 'SUGGESTED_VIDEO_IMMERSIVE_MOBILE',
  SuggestedVideoMobile = 'SUGGESTED_VIDEO_MOBILE',
  WatchFeedHome = 'WATCH_FEED_HOME',
  WatchFeedMobile = 'WATCH_FEED_MOBILE',
}

export const formatDimensionsMap = new Map<FormatType, { height: number; width: number }>([
  [FormatType.AudienceNetworkInstreamVideo, { height: 445, width: 300 }],
  [FormatType.AudienceNetworkInstreamVideoMobile, { height: 445, width: 260 }],
  [FormatType.AudienceNetworkOutstreamVideo, { height: 567, width: 320 }],
  [FormatType.AudienceNetworkRewardedVideo, { height: 569, width: 322 }],
  [FormatType.BizDiscoFeedMobile, { height: 600, width: 320 }],
  [FormatType.DesktopFeedStandard, { height: 896, width: 500 }],
  [FormatType.FacebookProfileFeedDesktop, { height: 896, width: 500 }],
  [FormatType.FacebookProfileFeedMobile, { height: 606, width: 320 }],
  // [FormatType.FacebookProfileReelsMobile, { height: 0, width: 0 }],
  [FormatType.FacebookReelsBanner, { height: 580, width: 320 }],
  // [FormatType.FacebookReelsBannerDesktop, { height: 0, width: 0 }],
  [FormatType.FacebookReelsMobile, { height: 567, width: 320 }],
  // [FormatType.FacebookReelsPostloop, { height: 0, width: 0 }],
  // [FormatType.FacebookReelsSticker, { height: 0, width: 0 }],
  [FormatType.FacebookStoryMobile, { height: 566, width: 320 }],
  // [FormatType.FacebookStoryStickerMobile, { height: 0, width: 0 }],
  // [FormatType.InstagramExploreContextual, { height: 0, width: 0 }],
  [FormatType.InstagramExploreGridHome, { height: 566, width: 320 }],
  [FormatType.InstagramExploreImmersive, { height: 564, width: 318 }],
  [FormatType.InstagramFeedWeb, { height: 810, width: 500 }],
  // [FormatType.InstagramFeedWebMSite, { height: 0, width: 0 }],
  // [FormatType.InstagramLeadGenMultiSubmitAds, { height: 0, width: 0 }],
  [FormatType.InstagramProfileFeed, { height: 562, width: 320 }],
  // [FormatType.InstagramProfileReels, { height: 0, width: 0 }],
  [FormatType.InstagramReels, { height: 565, width: 320 }],
  // [FormatType.InstagramReelsOverlay, { height: 0, width: 0 }],
  // [FormatType.InstagramSearchChain, { height: 0, width: 0 }],
  [FormatType.InstagramSearchGrid, { height: 566, width: 320 }],
  [FormatType.InstagramStandard, { height: 561, width: 320 }],
  [FormatType.InstagramStory, { height: 565, width: 320 }],
  // [FormatType.InstagramStoryEffectTray, { height: 0, width: 0 }],
  [FormatType.InstagramStoryWeb, { height: 565, width: 320 }],
  [FormatType.InstagramStoryWebMSite, { height: 565, width: 320 }],
  // [FormatType.InstantArticleRecirculationAd, { height: 0, width: 0 }],
  // [FormatType.InstantArticleStandard, { height: 0, width: 0 }],
  // [FormatType.InstreamBannerDesktop, { height: 0, width: 0 }],
  // [FormatType.InstreamBannerFullscreenMobile, { height: 0, width: 0 }],
  // [FormatType.InstreamBannerImmersiveMobile, { height: 0, width: 0 }],
  // [FormatType.InstreamBannerMobile, { height: 0, width: 0 }],
  [FormatType.InstreamVideoDesktop, { height: 583, width: 500 }],
  // [FormatType.InstreamVideoFullscreenMobile, { height: 0, width: 0 }],
  // [FormatType.InstreamVideoImage, { height: 0, width: 0 }],
  // [FormatType.InstreamVideoImmersiveMobile, { height: 0, width: 0 }],
  [FormatType.InstreamVideoMobile, { height: 573, width: 320 }],
  // [FormatType.JobBrowserDesktop, { height: 0, width: 0 }],
  // [FormatType.JobBrowserMobile, { height: 0, width: 0 }],
  [FormatType.MarketplaceDesktop, { height: 302, width: 220 }],
  [FormatType.MarketplaceMobile, { height: 314, width: 180 }],
  [FormatType.MessengerMobileInboxMedia, { height: 704, width: 375 }],
  [FormatType.MessengerMobileStoryMedia, { height: 704, width: 375 }],
  // [FormatType.MobileBanner, { height: 0, width: 0 }],
  // [FormatType.MobileFeedBasic, { height: 0, width: 0 }],
  [FormatType.MobileFeedStandard, { height: 495, width: 320 }],
  // [FormatType.MobileFullwidth, { height: 0, width: 0 }],
  // [FormatType.MobileInterstitial, { height: 0, width: 0 }],
  // [FormatType.MobileMediumRectangle, { height: 0, width: 0 }],
  // [FormatType.MobileNative, { height: 0, width: 0 }],
  [FormatType.RightColumnStandard, { height: 90, width: 220 }],
  // [FormatType.SuggestedVideoDesktop, { height: 0, width: 0 }],
  // [FormatType.SuggestedVideoFullscreenMobile, { height: 0, width: 0 }],
  // [FormatType.SuggestedVideoImmersiveMobile, { height: 0, width: 0 }],
  // [FormatType.SuggestedVideoMobile, { height: 0, width: 0 }],
  // [FormatType.WatchFeedHome, { height: 0, width: 0 }],
  // [FormatType.WatchFeedMobile, { height: 0, width: 0 }],
]);

const iFrameAdFormatsMap = new Map<string, FormatType>();

add(PublisherEnum.Facebook, DeviceEnum.MobileApp, Position.Feed, FormatType.MobileFeedStandard);
add(PublisherEnum.Facebook, DeviceEnum.MobileWeb, Position.Feed, FormatType.MobileFeedStandard);
add(PublisherEnum.Instagram, DeviceEnum.MobileApp, Position.Feed, FormatType.InstagramStandard);
add(PublisherEnum.Instagram, DeviceEnum.Desktop, Position.Feed, FormatType.InstagramFeedWeb);
add(PublisherEnum.Instagram, DeviceEnum.MobileWeb, Position.Feed, FormatType.InstagramFeedWebMSite);
add(PublisherEnum.Instagram, DeviceEnum.MobileApp, Position.InstagramStories, FormatType.InstagramStory);
add(PublisherEnum.Instagram, DeviceEnum.Desktop, Position.InstagramStories, FormatType.InstagramStoryWeb);
add(PublisherEnum.Instagram, DeviceEnum.MobileWeb, Position.InstagramStories, FormatType.InstagramStoryWebMSite);
add(PublisherEnum.Facebook, DeviceEnum.MobileApp, Position.InstreamVideo, FormatType.InstreamVideoMobile);
add(
  PublisherEnum.AudienceNetwork,
  DeviceEnum.MobileApp,
  Position.AnClassic,
  FormatType.AudienceNetworkInstreamVideoMobile,
);
add(PublisherEnum.Facebook, DeviceEnum.MobileApp, Position.FacebookStories, FormatType.FacebookStoryMobile);
add(PublisherEnum.Facebook, DeviceEnum.Desktop, Position.Feed, FormatType.DesktopFeedStandard);
add(PublisherEnum.Instagram, DeviceEnum.MobileApp, Position.InstagramExplore, FormatType.InstagramExploreContextual);
add(
  PublisherEnum.Instagram,
  DeviceEnum.MobileApp,
  Position.InstagramExploreGridHome,
  FormatType.InstagramExploreGridHome,
);
add(PublisherEnum.Instagram, DeviceEnum.MobileApp, Position.InstagramProfileFeed, FormatType.InstagramProfileFeed);
add(PublisherEnum.Instagram, DeviceEnum.MobileApp, Position.InstagramSearch, FormatType.InstagramSearchGrid);
add(PublisherEnum.Instagram, DeviceEnum.MobileApp, Position.InstagramReels, FormatType.InstagramReels);
add(PublisherEnum.Messenger, DeviceEnum.MobileApp, Position.MessengerInbox, FormatType.MessengerMobileInboxMedia);
add(PublisherEnum.Facebook, DeviceEnum.MobileApp, Position.Marketplace, FormatType.MarketplaceMobile);
add(PublisherEnum.Facebook, DeviceEnum.MobileApp, Position.Search, FormatType.MobileFeedStandard);
add(PublisherEnum.Facebook, DeviceEnum.Desktop, Position.Search, FormatType.MobileFeedStandard);
add(PublisherEnum.Facebook, DeviceEnum.Desktop, Position.RightHandColumn, FormatType.RightColumnStandard);
add(
  PublisherEnum.AudienceNetwork,
  DeviceEnum.MobileApp,
  Position.RewardedVideo,
  FormatType.AudienceNetworkRewardedVideo,
);
add(PublisherEnum.Facebook, DeviceEnum.Desktop, Position.InstreamVideo, FormatType.InstreamVideoDesktop);
add(PublisherEnum.AudienceNetwork, DeviceEnum.Desktop, Position.AnClassic, FormatType.AudienceNetworkInstreamVideo);
add(PublisherEnum.Facebook, DeviceEnum.Desktop, Position.Marketplace, FormatType.MarketplaceDesktop);
add(PublisherEnum.Facebook, DeviceEnum.MobileApp, Position.FacebookReelsOverlay, FormatType.FacebookReelsMobile);
add(PublisherEnum.Messenger, DeviceEnum.MobileApp, Position.MessengerStories, FormatType.MessengerMobileStoryMedia);
add(PublisherEnum.Facebook, DeviceEnum.MobileApp, Position.FacebookReels, FormatType.FacebookReelsMobile);
add(PublisherEnum.Facebook, DeviceEnum.Desktop, Position.VideoFeeds, FormatType.WatchFeedHome);
add(PublisherEnum.Facebook, DeviceEnum.MobileApp, Position.VideoFeeds, FormatType.WatchFeedMobile);
add(PublisherEnum.Facebook, DeviceEnum.MobileApp, Position.BizDiscoFeed, FormatType.BizDiscoFeedMobile);
add(PublisherEnum.Facebook, DeviceEnum.MobileApp, Position.FacebookProfileFeed, FormatType.FacebookProfileFeedMobile);
add(PublisherEnum.Facebook, DeviceEnum.Desktop, Position.FacebookProfileFeed, FormatType.FacebookProfileFeedDesktop);
add(PublisherEnum.AudienceNetwork, DeviceEnum.Desktop, Position.RewardedVideo, FormatType.AudienceNetworkRewardedVideo);
add(
  PublisherEnum.AudienceNetwork,
  DeviceEnum.MobileApp,
  Position.RewardedVideo,
  FormatType.AudienceNetworkRewardedVideo,
);
add(
  PublisherEnum.AudienceNetwork,
  DeviceEnum.MobileApp,
  Position.AnClassic,
  FormatType.AudienceNetworkInstreamVideoMobile,
);

// publisher and device combinations
add(PublisherEnum.AudienceNetwork, DeviceEnum.Desktop, undefined, FormatType.MobileFeedStandard);
add(PublisherEnum.AudienceNetwork, DeviceEnum.MobileApp, undefined, FormatType.MobileFeedStandard);
add(PublisherEnum.AudienceNetwork, DeviceEnum.MobileWeb, undefined, FormatType.MobileFeedStandard);
add(PublisherEnum.AudienceNetwork, DeviceEnum.Unknown, undefined, FormatType.MobileFeedStandard);
add(PublisherEnum.Facebook, DeviceEnum.Desktop, undefined, FormatType.MobileFeedStandard);
add(PublisherEnum.Facebook, DeviceEnum.MobileApp, undefined, FormatType.MobileFeedStandard);
add(PublisherEnum.Facebook, DeviceEnum.MobileWeb, undefined, FormatType.MobileFeedStandard);
add(PublisherEnum.Facebook, DeviceEnum.Unknown, undefined, FormatType.MobileFeedStandard);
add(PublisherEnum.Instagram, DeviceEnum.Desktop, undefined, FormatType.MobileFeedStandard);
add(PublisherEnum.Instagram, DeviceEnum.MobileApp, undefined, FormatType.MobileFeedStandard);
add(PublisherEnum.Instagram, DeviceEnum.MobileWeb, undefined, FormatType.MobileFeedStandard);
add(PublisherEnum.Instagram, DeviceEnum.Unknown, undefined, FormatType.MobileFeedStandard);
add(PublisherEnum.Messenger, DeviceEnum.Desktop, undefined, FormatType.MobileFeedStandard);
add(PublisherEnum.Messenger, DeviceEnum.MobileApp, undefined, FormatType.MobileFeedStandard);
add(PublisherEnum.Messenger, DeviceEnum.MobileWeb, undefined, FormatType.MobileFeedStandard);
add(PublisherEnum.Messenger, DeviceEnum.Unknown, undefined, FormatType.MobileFeedStandard);
add(PublisherEnum.Unknown, DeviceEnum.Desktop, undefined, FormatType.MobileFeedStandard);
add(PublisherEnum.Unknown, DeviceEnum.MobileApp, undefined, FormatType.MobileFeedStandard);
add(PublisherEnum.Unknown, DeviceEnum.MobileWeb, undefined, FormatType.MobileFeedStandard);
add(PublisherEnum.Unknown, DeviceEnum.Unknown, undefined, FormatType.MobileFeedStandard);

// publisher and position combinations
add(PublisherEnum.AudienceNetwork, undefined, Position.AnClassic, FormatType.MobileFeedStandard);
add(PublisherEnum.AudienceNetwork, undefined, Position.BizDiscoFeed, FormatType.MobileFeedStandard);
add(PublisherEnum.AudienceNetwork, undefined, Position.FacebookProfileFeed, FormatType.FacebookProfileFeedMobile);
add(PublisherEnum.AudienceNetwork, undefined, Position.FacebookReels, FormatType.MobileFeedStandard);
add(PublisherEnum.AudienceNetwork, undefined, Position.FacebookReelsOverlay, FormatType.MobileFeedStandard);
add(PublisherEnum.AudienceNetwork, undefined, Position.FacebookStories, FormatType.MobileFeedStandard);
add(PublisherEnum.AudienceNetwork, undefined, Position.Feed, FormatType.MobileFeedStandard);
add(PublisherEnum.AudienceNetwork, undefined, Position.InstagramExplore, FormatType.MobileFeedStandard);
add(PublisherEnum.AudienceNetwork, undefined, Position.InstagramExploreGridHome, FormatType.MobileFeedStandard);
add(PublisherEnum.AudienceNetwork, undefined, Position.InstagramProfileFeed, FormatType.MobileFeedStandard);
add(PublisherEnum.AudienceNetwork, undefined, Position.InstagramReels, FormatType.MobileFeedStandard);
add(PublisherEnum.AudienceNetwork, undefined, Position.InstagramSearch, FormatType.MobileFeedStandard);
add(PublisherEnum.AudienceNetwork, undefined, Position.InstagramStories, FormatType.MobileFeedStandard);
add(PublisherEnum.AudienceNetwork, undefined, Position.InstreamVideo, FormatType.MobileFeedStandard);
add(PublisherEnum.AudienceNetwork, undefined, Position.Marketplace, FormatType.MobileFeedStandard);
add(PublisherEnum.AudienceNetwork, undefined, Position.MessengerInbox, FormatType.MobileFeedStandard);
add(PublisherEnum.AudienceNetwork, undefined, Position.MessengerStories, FormatType.MobileFeedStandard);
add(PublisherEnum.AudienceNetwork, undefined, Position.RewardedVideo, FormatType.MobileFeedStandard);
add(PublisherEnum.AudienceNetwork, undefined, Position.RightHandColumn, FormatType.MobileFeedStandard);
add(PublisherEnum.AudienceNetwork, undefined, Position.Search, FormatType.MobileFeedStandard);
add(PublisherEnum.AudienceNetwork, undefined, Position.VideoFeeds, FormatType.MobileFeedStandard);

add(PublisherEnum.Instagram, undefined, Position.AnClassic, FormatType.MobileFeedStandard);
add(PublisherEnum.Instagram, undefined, Position.BizDiscoFeed, FormatType.MobileFeedStandard);
add(PublisherEnum.Instagram, undefined, Position.FacebookProfileFeed, FormatType.FacebookProfileFeedMobile);
add(PublisherEnum.Instagram, undefined, Position.FacebookReels, FormatType.MobileFeedStandard);
add(PublisherEnum.Instagram, undefined, Position.FacebookReelsOverlay, FormatType.MobileFeedStandard);
add(PublisherEnum.Instagram, undefined, Position.FacebookStories, FormatType.MobileFeedStandard);
add(PublisherEnum.Instagram, undefined, Position.Feed, FormatType.MobileFeedStandard);
add(PublisherEnum.Instagram, undefined, Position.InstagramExplore, FormatType.MobileFeedStandard);
add(PublisherEnum.Instagram, undefined, Position.InstagramExploreGridHome, FormatType.MobileFeedStandard);
add(PublisherEnum.Instagram, undefined, Position.InstagramProfileFeed, FormatType.MobileFeedStandard);
add(PublisherEnum.Instagram, undefined, Position.InstagramReels, FormatType.MobileFeedStandard);
add(PublisherEnum.Instagram, undefined, Position.InstagramSearch, FormatType.MobileFeedStandard);
add(PublisherEnum.Instagram, undefined, Position.InstagramStories, FormatType.MobileFeedStandard);
add(PublisherEnum.Instagram, undefined, Position.InstreamVideo, FormatType.MobileFeedStandard);
add(PublisherEnum.Instagram, undefined, Position.Marketplace, FormatType.MobileFeedStandard);
add(PublisherEnum.Instagram, undefined, Position.MessengerInbox, FormatType.MobileFeedStandard);
add(PublisherEnum.Instagram, undefined, Position.MessengerStories, FormatType.MobileFeedStandard);
add(PublisherEnum.Instagram, undefined, Position.RewardedVideo, FormatType.MobileFeedStandard);
add(PublisherEnum.Instagram, undefined, Position.RightHandColumn, FormatType.MobileFeedStandard);
add(PublisherEnum.Instagram, undefined, Position.Search, FormatType.MobileFeedStandard);
add(PublisherEnum.Instagram, undefined, Position.VideoFeeds, FormatType.MobileFeedStandard);

add(PublisherEnum.Facebook, undefined, Position.AnClassic, FormatType.MobileFeedStandard);
add(PublisherEnum.Facebook, undefined, Position.BizDiscoFeed, FormatType.BizDiscoFeedMobile);
add(PublisherEnum.Facebook, undefined, Position.FacebookProfileFeed, FormatType.FacebookProfileFeedMobile);
add(PublisherEnum.Facebook, undefined, Position.FacebookReels, FormatType.MobileFeedStandard);
add(PublisherEnum.Facebook, undefined, Position.FacebookReelsOverlay, FormatType.MobileFeedStandard);
add(PublisherEnum.Facebook, undefined, Position.FacebookStories, FormatType.MobileFeedStandard);
add(PublisherEnum.Facebook, undefined, Position.Feed, FormatType.MobileFeedStandard);
add(PublisherEnum.Facebook, undefined, Position.InstagramExplore, FormatType.MobileFeedStandard);
add(PublisherEnum.Facebook, undefined, Position.InstagramExploreGridHome, FormatType.MobileFeedStandard);
add(PublisherEnum.Facebook, undefined, Position.InstagramProfileFeed, FormatType.MobileFeedStandard);
add(PublisherEnum.Facebook, undefined, Position.InstagramReels, FormatType.MobileFeedStandard);
add(PublisherEnum.Facebook, undefined, Position.InstagramSearch, FormatType.MobileFeedStandard);
add(PublisherEnum.Facebook, undefined, Position.InstagramStories, FormatType.MobileFeedStandard);
add(PublisherEnum.Facebook, undefined, Position.InstreamVideo, FormatType.MobileFeedStandard);
add(PublisherEnum.Facebook, undefined, Position.Marketplace, FormatType.MobileFeedStandard);
add(PublisherEnum.Facebook, undefined, Position.MessengerInbox, FormatType.MobileFeedStandard);
add(PublisherEnum.Facebook, undefined, Position.MessengerStories, FormatType.MobileFeedStandard);
add(PublisherEnum.Facebook, undefined, Position.RewardedVideo, FormatType.MobileFeedStandard);
add(PublisherEnum.Facebook, undefined, Position.RightHandColumn, FormatType.MobileFeedStandard);
add(PublisherEnum.Facebook, undefined, Position.Search, FormatType.MobileFeedStandard);
add(PublisherEnum.Facebook, undefined, Position.VideoFeeds, FormatType.MobileFeedStandard);

add(PublisherEnum.Messenger, undefined, Position.AnClassic, FormatType.MobileFeedStandard);
add(PublisherEnum.Messenger, undefined, Position.BizDiscoFeed, FormatType.MobileFeedStandard);
add(PublisherEnum.Messenger, undefined, Position.FacebookProfileFeed, FormatType.FacebookProfileFeedMobile);
add(PublisherEnum.Messenger, undefined, Position.FacebookReels, FormatType.MobileFeedStandard);
add(PublisherEnum.Messenger, undefined, Position.FacebookReelsOverlay, FormatType.MobileFeedStandard);
add(PublisherEnum.Messenger, undefined, Position.FacebookStories, FormatType.MobileFeedStandard);
add(PublisherEnum.Messenger, undefined, Position.Feed, FormatType.MobileFeedStandard);
add(PublisherEnum.Messenger, undefined, Position.InstagramExplore, FormatType.MobileFeedStandard);
add(PublisherEnum.Messenger, undefined, Position.InstagramExploreGridHome, FormatType.MobileFeedStandard);
add(PublisherEnum.Messenger, undefined, Position.InstagramProfileFeed, FormatType.MobileFeedStandard);
add(PublisherEnum.Messenger, undefined, Position.InstagramReels, FormatType.MobileFeedStandard);
add(PublisherEnum.Messenger, undefined, Position.InstagramSearch, FormatType.MobileFeedStandard);
add(PublisherEnum.Messenger, undefined, Position.InstagramStories, FormatType.MobileFeedStandard);
add(PublisherEnum.Messenger, undefined, Position.InstreamVideo, FormatType.MobileFeedStandard);
add(PublisherEnum.Messenger, undefined, Position.Marketplace, FormatType.MobileFeedStandard);
add(PublisherEnum.Messenger, undefined, Position.MessengerInbox, FormatType.MobileFeedStandard);
add(PublisherEnum.Messenger, undefined, Position.MessengerStories, FormatType.MobileFeedStandard);
add(PublisherEnum.Messenger, undefined, Position.RewardedVideo, FormatType.MobileFeedStandard);
add(PublisherEnum.Messenger, undefined, Position.RightHandColumn, FormatType.MobileFeedStandard);
add(PublisherEnum.Messenger, undefined, Position.Search, FormatType.MobileFeedStandard);
add(PublisherEnum.Messenger, undefined, Position.VideoFeeds, FormatType.MobileFeedStandard);

add(PublisherEnum.Unknown, undefined, Position.AnClassic, FormatType.MobileFeedStandard);
add(PublisherEnum.Unknown, undefined, Position.BizDiscoFeed, FormatType.MobileFeedStandard);
add(PublisherEnum.Unknown, undefined, Position.FacebookProfileFeed, FormatType.FacebookProfileFeedMobile);
add(PublisherEnum.Unknown, undefined, Position.FacebookReels, FormatType.MobileFeedStandard);
add(PublisherEnum.Unknown, undefined, Position.FacebookReelsOverlay, FormatType.MobileFeedStandard);
add(PublisherEnum.Unknown, undefined, Position.FacebookStories, FormatType.MobileFeedStandard);
add(PublisherEnum.Unknown, undefined, Position.Feed, FormatType.MobileFeedStandard);
add(PublisherEnum.Unknown, undefined, Position.InstagramExplore, FormatType.MobileFeedStandard);
add(PublisherEnum.Unknown, undefined, Position.InstagramExploreGridHome, FormatType.MobileFeedStandard);
add(PublisherEnum.Unknown, undefined, Position.InstagramProfileFeed, FormatType.MobileFeedStandard);
add(PublisherEnum.Unknown, undefined, Position.InstagramReels, FormatType.MobileFeedStandard);
add(PublisherEnum.Unknown, undefined, Position.InstagramSearch, FormatType.MobileFeedStandard);
add(PublisherEnum.Unknown, undefined, Position.InstagramStories, FormatType.MobileFeedStandard);
add(PublisherEnum.Unknown, undefined, Position.InstreamVideo, FormatType.MobileFeedStandard);
add(PublisherEnum.Unknown, undefined, Position.Marketplace, FormatType.MobileFeedStandard);
add(PublisherEnum.Unknown, undefined, Position.MessengerInbox, FormatType.MobileFeedStandard);
add(PublisherEnum.Unknown, undefined, Position.MessengerStories, FormatType.MobileFeedStandard);
add(PublisherEnum.Unknown, undefined, Position.RewardedVideo, FormatType.MobileFeedStandard);
add(PublisherEnum.Unknown, undefined, Position.RightHandColumn, FormatType.MobileFeedStandard);
add(PublisherEnum.Unknown, undefined, Position.Search, FormatType.MobileFeedStandard);
add(PublisherEnum.Unknown, undefined, Position.VideoFeeds, FormatType.MobileFeedStandard);

// device and position combinations
add(undefined, DeviceEnum.Desktop, Position.AnClassic, FormatType.MobileFeedStandard);
add(undefined, DeviceEnum.Desktop, Position.BizDiscoFeed, FormatType.MobileFeedStandard);
add(undefined, DeviceEnum.Desktop, Position.FacebookProfileFeed, FormatType.FacebookProfileFeedDesktop);
add(undefined, DeviceEnum.Desktop, Position.FacebookReels, FormatType.MobileFeedStandard);
add(undefined, DeviceEnum.Desktop, Position.FacebookReelsOverlay, FormatType.MobileFeedStandard);
add(undefined, DeviceEnum.Desktop, Position.FacebookStories, FormatType.MobileFeedStandard);
add(undefined, DeviceEnum.Desktop, Position.Feed, FormatType.MobileFeedStandard);
add(undefined, DeviceEnum.Desktop, Position.InstagramExplore, FormatType.MobileFeedStandard);
add(undefined, DeviceEnum.Desktop, Position.InstagramExploreGridHome, FormatType.MobileFeedStandard);
add(undefined, DeviceEnum.Desktop, Position.InstagramProfileFeed, FormatType.MobileFeedStandard);
add(undefined, DeviceEnum.Desktop, Position.InstagramReels, FormatType.MobileFeedStandard);
add(undefined, DeviceEnum.Desktop, Position.InstagramSearch, FormatType.MobileFeedStandard);
add(undefined, DeviceEnum.Desktop, Position.InstagramStories, FormatType.MobileFeedStandard);
add(undefined, DeviceEnum.Desktop, Position.InstreamVideo, FormatType.MobileFeedStandard);
add(undefined, DeviceEnum.Desktop, Position.Marketplace, FormatType.MobileFeedStandard);
add(undefined, DeviceEnum.Desktop, Position.MessengerInbox, FormatType.MobileFeedStandard);
add(undefined, DeviceEnum.Desktop, Position.MessengerStories, FormatType.MobileFeedStandard);
add(undefined, DeviceEnum.Desktop, Position.RewardedVideo, FormatType.MobileFeedStandard);
add(undefined, DeviceEnum.Desktop, Position.RightHandColumn, FormatType.MobileFeedStandard);
add(undefined, DeviceEnum.Desktop, Position.Search, FormatType.MobileFeedStandard);
add(undefined, DeviceEnum.Desktop, Position.VideoFeeds, FormatType.MobileFeedStandard);

add(undefined, DeviceEnum.MobileApp, Position.AnClassic, FormatType.MobileFeedStandard);
add(undefined, DeviceEnum.MobileApp, Position.BizDiscoFeed, FormatType.MobileFeedStandard);
add(undefined, DeviceEnum.MobileApp, Position.FacebookProfileFeed, FormatType.FacebookProfileFeedMobile);
add(undefined, DeviceEnum.MobileApp, Position.FacebookReels, FormatType.MobileFeedStandard);
add(undefined, DeviceEnum.MobileApp, Position.FacebookReelsOverlay, FormatType.MobileFeedStandard);
add(undefined, DeviceEnum.MobileApp, Position.FacebookStories, FormatType.MobileFeedStandard);
add(undefined, DeviceEnum.MobileApp, Position.Feed, FormatType.MobileFeedStandard);
add(undefined, DeviceEnum.MobileApp, Position.InstagramExplore, FormatType.MobileFeedStandard);
add(undefined, DeviceEnum.MobileApp, Position.InstagramExploreGridHome, FormatType.MobileFeedStandard);
add(undefined, DeviceEnum.MobileApp, Position.InstagramProfileFeed, FormatType.MobileFeedStandard);
add(undefined, DeviceEnum.MobileApp, Position.InstagramReels, FormatType.MobileFeedStandard);
add(undefined, DeviceEnum.MobileApp, Position.InstagramSearch, FormatType.MobileFeedStandard);
add(undefined, DeviceEnum.MobileApp, Position.InstagramStories, FormatType.MobileFeedStandard);
add(undefined, DeviceEnum.MobileApp, Position.InstreamVideo, FormatType.MobileFeedStandard);
add(undefined, DeviceEnum.MobileApp, Position.Marketplace, FormatType.MobileFeedStandard);
add(undefined, DeviceEnum.MobileApp, Position.MessengerInbox, FormatType.MobileFeedStandard);
add(undefined, DeviceEnum.MobileApp, Position.MessengerStories, FormatType.MobileFeedStandard);
add(undefined, DeviceEnum.MobileApp, Position.RewardedVideo, FormatType.MobileFeedStandard);
add(undefined, DeviceEnum.MobileApp, Position.RightHandColumn, FormatType.MobileFeedStandard);
add(undefined, DeviceEnum.MobileApp, Position.Search, FormatType.MobileFeedStandard);
add(undefined, DeviceEnum.MobileApp, Position.VideoFeeds, FormatType.MobileFeedStandard);

add(undefined, DeviceEnum.MobileWeb, Position.AnClassic, FormatType.MobileFeedStandard);
add(undefined, DeviceEnum.MobileWeb, Position.BizDiscoFeed, FormatType.MobileFeedStandard);
add(undefined, DeviceEnum.MobileWeb, Position.FacebookProfileFeed, FormatType.FacebookProfileFeedMobile);
add(undefined, DeviceEnum.MobileWeb, Position.FacebookReels, FormatType.MobileFeedStandard);
add(undefined, DeviceEnum.MobileWeb, Position.FacebookReelsOverlay, FormatType.MobileFeedStandard);
add(undefined, DeviceEnum.MobileWeb, Position.FacebookStories, FormatType.MobileFeedStandard);
add(undefined, DeviceEnum.MobileWeb, Position.Feed, FormatType.MobileFeedStandard);
add(undefined, DeviceEnum.MobileWeb, Position.InstagramExplore, FormatType.MobileFeedStandard);
add(undefined, DeviceEnum.MobileWeb, Position.InstagramExploreGridHome, FormatType.MobileFeedStandard);
add(undefined, DeviceEnum.MobileWeb, Position.InstagramProfileFeed, FormatType.MobileFeedStandard);
add(undefined, DeviceEnum.MobileWeb, Position.InstagramReels, FormatType.MobileFeedStandard);
add(undefined, DeviceEnum.MobileWeb, Position.InstagramSearch, FormatType.MobileFeedStandard);
add(undefined, DeviceEnum.MobileWeb, Position.InstagramStories, FormatType.MobileFeedStandard);
add(undefined, DeviceEnum.MobileWeb, Position.InstreamVideo, FormatType.MobileFeedStandard);
add(undefined, DeviceEnum.MobileWeb, Position.Marketplace, FormatType.MobileFeedStandard);
add(undefined, DeviceEnum.MobileWeb, Position.MessengerInbox, FormatType.MobileFeedStandard);
add(undefined, DeviceEnum.MobileWeb, Position.MessengerStories, FormatType.MobileFeedStandard);
add(undefined, DeviceEnum.MobileWeb, Position.RewardedVideo, FormatType.MobileFeedStandard);
add(undefined, DeviceEnum.MobileWeb, Position.RightHandColumn, FormatType.MobileFeedStandard);
add(undefined, DeviceEnum.MobileWeb, Position.Search, FormatType.MobileFeedStandard);
add(undefined, DeviceEnum.MobileWeb, Position.VideoFeeds, FormatType.MobileFeedStandard);

add(undefined, DeviceEnum.Unknown, Position.AnClassic, FormatType.MobileFeedStandard);
add(undefined, DeviceEnum.Unknown, Position.BizDiscoFeed, FormatType.MobileFeedStandard);
add(undefined, DeviceEnum.Unknown, Position.FacebookProfileFeed, FormatType.FacebookProfileFeedMobile);
add(undefined, DeviceEnum.Unknown, Position.FacebookReels, FormatType.MobileFeedStandard);
add(undefined, DeviceEnum.Unknown, Position.FacebookReelsOverlay, FormatType.MobileFeedStandard);
add(undefined, DeviceEnum.Unknown, Position.FacebookStories, FormatType.MobileFeedStandard);
add(undefined, DeviceEnum.Unknown, Position.Feed, FormatType.MobileFeedStandard);
add(undefined, DeviceEnum.Unknown, Position.InstagramExplore, FormatType.MobileFeedStandard);
add(undefined, DeviceEnum.Unknown, Position.InstagramExploreGridHome, FormatType.MobileFeedStandard);
add(undefined, DeviceEnum.Unknown, Position.InstagramProfileFeed, FormatType.MobileFeedStandard);
add(undefined, DeviceEnum.Unknown, Position.InstagramReels, FormatType.MobileFeedStandard);
add(undefined, DeviceEnum.Unknown, Position.InstagramSearch, FormatType.MobileFeedStandard);
add(undefined, DeviceEnum.Unknown, Position.InstagramStories, FormatType.MobileFeedStandard);
add(undefined, DeviceEnum.Unknown, Position.InstreamVideo, FormatType.MobileFeedStandard);
add(undefined, DeviceEnum.Unknown, Position.Marketplace, FormatType.MobileFeedStandard);
add(undefined, DeviceEnum.Unknown, Position.MessengerInbox, FormatType.MobileFeedStandard);
add(undefined, DeviceEnum.Unknown, Position.MessengerStories, FormatType.MobileFeedStandard);
add(undefined, DeviceEnum.Unknown, Position.RewardedVideo, FormatType.MobileFeedStandard);
add(undefined, DeviceEnum.Unknown, Position.RightHandColumn, FormatType.MobileFeedStandard);
add(undefined, DeviceEnum.Unknown, Position.Search, FormatType.MobileFeedStandard);
add(undefined, DeviceEnum.Unknown, Position.VideoFeeds, FormatType.MobileFeedStandard);

// Position only entries
add(undefined, undefined, Position.AnClassic, FormatType.MobileFeedStandard);
add(undefined, undefined, Position.BizDiscoFeed, FormatType.MobileFeedStandard);
add(undefined, undefined, Position.FacebookProfileFeed, FormatType.FacebookProfileFeedMobile);
add(undefined, undefined, Position.FacebookReels, FormatType.MobileFeedStandard);
add(undefined, undefined, Position.FacebookReelsOverlay, FormatType.MobileFeedStandard);
add(undefined, undefined, Position.FacebookStories, FormatType.MobileFeedStandard);
add(undefined, undefined, Position.Feed, FormatType.MobileFeedStandard);
add(undefined, undefined, Position.InstagramExplore, FormatType.MobileFeedStandard);
add(undefined, undefined, Position.InstagramExploreGridHome, FormatType.MobileFeedStandard);
add(undefined, undefined, Position.InstagramProfileFeed, FormatType.MobileFeedStandard);
add(undefined, undefined, Position.InstagramReels, FormatType.MobileFeedStandard);
add(undefined, undefined, Position.InstagramSearch, FormatType.MobileFeedStandard);
add(undefined, undefined, Position.InstagramStories, FormatType.MobileFeedStandard);
add(undefined, undefined, Position.InstreamVideo, FormatType.MobileFeedStandard);
add(undefined, undefined, Position.Marketplace, FormatType.MobileFeedStandard);
add(undefined, undefined, Position.MessengerInbox, FormatType.MobileFeedStandard);
add(undefined, undefined, Position.MessengerStories, FormatType.MobileFeedStandard);
add(undefined, undefined, Position.RewardedVideo, FormatType.MobileFeedStandard);
add(undefined, undefined, Position.RightHandColumn, FormatType.MobileFeedStandard);
add(undefined, undefined, Position.Search, FormatType.MobileFeedStandard);
add(undefined, undefined, Position.VideoFeeds, FormatType.MobileFeedStandard);

// Device only entries
add(undefined, DeviceEnum.Desktop, undefined, FormatType.MobileFeedStandard);
add(undefined, DeviceEnum.MobileApp, undefined, FormatType.MobileFeedStandard);
add(undefined, DeviceEnum.MobileWeb, undefined, FormatType.MobileFeedStandard);
add(undefined, DeviceEnum.Unknown, undefined, FormatType.MobileFeedStandard);

// Publisher only entries
add(PublisherEnum.AudienceNetwork, undefined, undefined, FormatType.MobileFeedStandard);
add(PublisherEnum.Facebook, undefined, undefined, FormatType.MobileFeedStandard);
add(PublisherEnum.Instagram, undefined, undefined, FormatType.MobileFeedStandard);
add(PublisherEnum.Messenger, undefined, undefined, FormatType.MobileFeedStandard);
add(PublisherEnum.Unknown, undefined, undefined, FormatType.MobileFeedStandard);

add(undefined, undefined, undefined, FormatType.MobileFeedStandard);
