import { DeviceEnum, PublisherEnum } from '@repo/database';

export const map = new Map<string, string>();

const getKey = (
  publisher: PublisherEnum | undefined | null,
  device: DeviceEnum | undefined | null,
  position: string | undefined | null,
) => `${publisher ?? 'noPublisher'}_${position ?? 'noPosition'}_${device ?? 'noDevice'}`;

const add = (
  publisher: PublisherEnum | undefined,
  device: DeviceEnum | undefined,
  position: string | undefined,
  value: string,
) => iFrameAdFormatsMap.set(getKey(publisher, device, position), value);

export const getIFrameAdFormat = (
  publisher: PublisherEnum | undefined | null,
  device: DeviceEnum | undefined | null,
  position: string | undefined | null,
): string | undefined => {
  return iFrameAdFormatsMap.get(getKey(publisher, device, position));
};

const iFrameAdFormatsMap = new Map<string, string>();

add(PublisherEnum.Facebook, DeviceEnum.MobileApp, 'feed', 'MOBILE_FEED_STANDARD');
add(PublisherEnum.Facebook, DeviceEnum.MobileWeb, 'feed', 'MOBILE_FEED_STANDARD');
add(PublisherEnum.Instagram, DeviceEnum.MobileApp, 'feed', 'INSTAGRAM_STANDARD');
add(PublisherEnum.Instagram, DeviceEnum.Desktop, 'feed', 'INSTAGRAM_FEED_WEB');
add(PublisherEnum.Instagram, DeviceEnum.MobileWeb, 'feed', 'INSTAGRAM_FEED_WEB_M_SITE');
add(PublisherEnum.Instagram, DeviceEnum.MobileApp, 'instagram_stories', 'INSTAGRAM_STORY');
add(PublisherEnum.Instagram, DeviceEnum.Desktop, 'instagram_stories', 'INSTAGRAM_STORY_WEB');
add(PublisherEnum.Instagram, DeviceEnum.MobileWeb, 'instagram_stories', 'INSTAGRAM_STORY_WEB_M_SITE');
add(PublisherEnum.Facebook, DeviceEnum.MobileApp, 'instream_video', 'INSTREAM_VIDEO_MOBILE');
add(PublisherEnum.AudienceNetwork, DeviceEnum.MobileApp, 'an_classic', 'AUDIENCE_NETWORK_INSTREAM_VIDEO_MOBILE');
add(PublisherEnum.Facebook, DeviceEnum.MobileApp, 'facebook_stories', 'FACEBOOK_STORY_MOBILE');
add(PublisherEnum.Facebook, DeviceEnum.Desktop, 'feed', 'DESKTOP_FEED_STANDARD');
add(PublisherEnum.Instagram, DeviceEnum.MobileApp, 'instagram_explore', 'INSTAGRAM_EXPLORE_CONTEXTUAL');
add(PublisherEnum.Instagram, DeviceEnum.MobileApp, 'instagram_explore_grid_home', 'INSTAGRAM_EXPLORE_GRID_HOME');
add(PublisherEnum.Instagram, DeviceEnum.MobileApp, 'instagram_profile_feed', 'INSTAGRAM_PROFILE_FEED');
add(PublisherEnum.Instagram, DeviceEnum.MobileApp, 'instagram_search', 'INSTAGRAM_SEARCH_GRID');
add(PublisherEnum.Instagram, DeviceEnum.MobileApp, 'instagram_reels', 'INSTAGRAM_REELS');
add(PublisherEnum.Instagram, DeviceEnum.MobileApp, 'instagram_reels_overlay', 'INSTAGRAM_REELS_OVERLAY');
add(PublisherEnum.Messenger, DeviceEnum.MobileApp, 'messenger_inbox', 'MESSENGER_MOBILE_INBOX_MEDIA');
add(PublisherEnum.Facebook, DeviceEnum.MobileApp, 'marketplace', 'MARKETPLACE_MOBILE');
add(PublisherEnum.Facebook, DeviceEnum.MobileApp, 'search', 'UNKNOWN');
add(PublisherEnum.Facebook, DeviceEnum.Desktop, 'search', 'UNKNOWN');
add(PublisherEnum.Facebook, DeviceEnum.Desktop, 'right_hand_column', 'RIGHT_COLUMN_STANDARD');
add(PublisherEnum.AudienceNetwork, DeviceEnum.MobileApp, 'rewarded_video', 'AUDIENCE_NETWORK_REWARDED_VIDEO');
add(PublisherEnum.Facebook, DeviceEnum.Desktop, 'instream_video', 'INSTREAM_VIDEO_DESKTOP');
add(PublisherEnum.AudienceNetwork, DeviceEnum.Desktop, 'an_classic', 'AUDIENCE_NETWORK_INSTREAM_VIDEO');
add(PublisherEnum.Facebook, DeviceEnum.Desktop, 'marketplace', 'MARKETPLACE_DESKTOP');
add(PublisherEnum.Facebook, DeviceEnum.MobileApp, 'facebook_groups_feed', 'MOBILE_FEED_STANDARD');
add(PublisherEnum.Facebook, DeviceEnum.MobileApp, 'facebook_reels_overlay', 'FACEBOOK_REELS_MOBILE');
add(PublisherEnum.Messenger, DeviceEnum.MobileApp, 'messenger_stories', 'MESSENGER_MOBILE_STORY_MEDIA');
add(PublisherEnum.Facebook, DeviceEnum.MobileApp, 'facebook_reels', 'FACEBOOK_REELS_MOBILE');
add(PublisherEnum.Facebook, DeviceEnum.Desktop, 'video_feeds', 'WATCH_FEED_HOME');
add(PublisherEnum.Facebook, DeviceEnum.MobileApp, 'video_feeds', 'WATCH_FEED_MOBILE');
add(PublisherEnum.Facebook, DeviceEnum.MobileApp, 'biz_disco_feed', 'BIZ_DISCO_FEED_MOBILE');
add(PublisherEnum.AudienceNetwork, DeviceEnum.Desktop, 'rewarded_video', 'AUDIENCE_NETWORK_REWARDED_VIDEO');
add(PublisherEnum.AudienceNetwork, DeviceEnum.MobileApp, 'rewarded_video', 'AUDIENCE_NETWORK_REWARDED_VIDEO');
add(PublisherEnum.AudienceNetwork, DeviceEnum.MobileApp, 'an_classic', 'AUDIENCE_NETWORK_INSTREAM_VIDEO_MOBILE');
add(PublisherEnum.Facebook, DeviceEnum.MobileApp, 'instant_article', 'INSTANT_ARTICLE_STANDARD');

// publisher and device combinations
add(PublisherEnum.AudienceNetwork, DeviceEnum.Desktop, undefined, 'MOBILE_FEED_STANDARD');
add(PublisherEnum.AudienceNetwork, DeviceEnum.MobileApp, undefined, 'MOBILE_FEED_STANDARD');
add(PublisherEnum.AudienceNetwork, DeviceEnum.MobileWeb, undefined, 'MOBILE_FEED_STANDARD');
add(PublisherEnum.AudienceNetwork, DeviceEnum.Unknown, undefined, 'MOBILE_FEED_STANDARD');
add(PublisherEnum.Facebook, DeviceEnum.Desktop, undefined, 'MOBILE_FEED_STANDARD');
add(PublisherEnum.Facebook, DeviceEnum.MobileApp, undefined, 'MOBILE_FEED_STANDARD');
add(PublisherEnum.Facebook, DeviceEnum.MobileWeb, undefined, 'MOBILE_FEED_STANDARD');
add(PublisherEnum.Facebook, DeviceEnum.Unknown, undefined, 'MOBILE_FEED_STANDARD');
add(PublisherEnum.Instagram, DeviceEnum.Desktop, undefined, 'MOBILE_FEED_STANDARD');
add(PublisherEnum.Instagram, DeviceEnum.MobileApp, undefined, 'MOBILE_FEED_STANDARD');
add(PublisherEnum.Instagram, DeviceEnum.MobileWeb, undefined, 'MOBILE_FEED_STANDARD');
add(PublisherEnum.Instagram, DeviceEnum.Unknown, undefined, 'MOBILE_FEED_STANDARD');
add(PublisherEnum.Messenger, DeviceEnum.Desktop, undefined, 'MOBILE_FEED_STANDARD');
add(PublisherEnum.Messenger, DeviceEnum.MobileApp, undefined, 'MOBILE_FEED_STANDARD');
add(PublisherEnum.Messenger, DeviceEnum.MobileWeb, undefined, 'MOBILE_FEED_STANDARD');
add(PublisherEnum.Messenger, DeviceEnum.Unknown, undefined, 'MOBILE_FEED_STANDARD');
add(PublisherEnum.Unknown, DeviceEnum.Desktop, undefined, 'MOBILE_FEED_STANDARD');
add(PublisherEnum.Unknown, DeviceEnum.MobileApp, undefined, 'MOBILE_FEED_STANDARD');
add(PublisherEnum.Unknown, DeviceEnum.MobileWeb, undefined, 'MOBILE_FEED_STANDARD');
add(PublisherEnum.Unknown, DeviceEnum.Unknown, undefined, 'MOBILE_FEED_STANDARD');

// publisher and position combinations
add(PublisherEnum.AudienceNetwork, undefined, 'an_classic', 'MOBILE_FEED_STANDARD');
add(PublisherEnum.AudienceNetwork, undefined, 'biz_disco_feed', 'MOBILE_FEED_STANDARD');
add(PublisherEnum.AudienceNetwork, undefined, 'facebook_reels', 'MOBILE_FEED_STANDARD');
add(PublisherEnum.AudienceNetwork, undefined, 'facebook_reels_overlay', 'MOBILE_FEED_STANDARD');
add(PublisherEnum.AudienceNetwork, undefined, 'facebook_stories', 'MOBILE_FEED_STANDARD');
add(PublisherEnum.AudienceNetwork, undefined, 'feed', 'MOBILE_FEED_STANDARD');
add(PublisherEnum.AudienceNetwork, undefined, 'instagram_explore', 'MOBILE_FEED_STANDARD');
add(PublisherEnum.AudienceNetwork, undefined, 'instagram_explore_grid_home', 'MOBILE_FEED_STANDARD');
add(PublisherEnum.AudienceNetwork, undefined, 'instagram_profile_feed', 'MOBILE_FEED_STANDARD');
add(PublisherEnum.AudienceNetwork, undefined, 'instagram_reels', 'MOBILE_FEED_STANDARD');
add(PublisherEnum.AudienceNetwork, undefined, 'instagram_search', 'MOBILE_FEED_STANDARD');
add(PublisherEnum.AudienceNetwork, undefined, 'instagram_stories', 'MOBILE_FEED_STANDARD');
add(PublisherEnum.AudienceNetwork, undefined, 'instream_video', 'MOBILE_FEED_STANDARD');
add(PublisherEnum.AudienceNetwork, undefined, 'marketplace', 'MOBILE_FEED_STANDARD');
add(PublisherEnum.AudienceNetwork, undefined, 'messenger_inbox', 'MOBILE_FEED_STANDARD');
add(PublisherEnum.AudienceNetwork, undefined, 'messenger_stories', 'MOBILE_FEED_STANDARD');
add(PublisherEnum.AudienceNetwork, undefined, 'rewarded_video', 'MOBILE_FEED_STANDARD');
add(PublisherEnum.AudienceNetwork, undefined, 'right_hand_column', 'MOBILE_FEED_STANDARD');
add(PublisherEnum.AudienceNetwork, undefined, 'search', 'MOBILE_FEED_STANDARD');
add(PublisherEnum.AudienceNetwork, undefined, 'video_feeds', 'MOBILE_FEED_STANDARD');
add(PublisherEnum.AudienceNetwork, undefined, 'unknown', 'MOBILE_FEED_STANDARD');

add(PublisherEnum.Instagram, undefined, 'an_classic', 'MOBILE_FEED_STANDARD');
add(PublisherEnum.Instagram, undefined, 'biz_disco_feed', 'MOBILE_FEED_STANDARD');
add(PublisherEnum.Instagram, undefined, 'facebook_reels', 'MOBILE_FEED_STANDARD');
add(PublisherEnum.Instagram, undefined, 'facebook_reels_overlay', 'MOBILE_FEED_STANDARD');
add(PublisherEnum.Instagram, undefined, 'facebook_stories', 'MOBILE_FEED_STANDARD');
add(PublisherEnum.Instagram, undefined, 'feed', 'MOBILE_FEED_STANDARD');
add(PublisherEnum.Instagram, undefined, 'instagram_explore', 'MOBILE_FEED_STANDARD');
add(PublisherEnum.Instagram, undefined, 'instagram_explore_grid_home', 'MOBILE_FEED_STANDARD');
add(PublisherEnum.Instagram, undefined, 'instagram_profile_feed', 'MOBILE_FEED_STANDARD');
add(PublisherEnum.Instagram, undefined, 'instagram_reels', 'MOBILE_FEED_STANDARD');
add(PublisherEnum.Instagram, undefined, 'instagram_search', 'MOBILE_FEED_STANDARD');
add(PublisherEnum.Instagram, undefined, 'instagram_stories', 'MOBILE_FEED_STANDARD');
add(PublisherEnum.Instagram, undefined, 'instream_video', 'MOBILE_FEED_STANDARD');
add(PublisherEnum.Instagram, undefined, 'marketplace', 'MOBILE_FEED_STANDARD');
add(PublisherEnum.Instagram, undefined, 'messenger_inbox', 'MOBILE_FEED_STANDARD');
add(PublisherEnum.Instagram, undefined, 'messenger_stories', 'MOBILE_FEED_STANDARD');
add(PublisherEnum.Instagram, undefined, 'rewarded_video', 'MOBILE_FEED_STANDARD');
add(PublisherEnum.Instagram, undefined, 'right_hand_column', 'MOBILE_FEED_STANDARD');
add(PublisherEnum.Instagram, undefined, 'search', 'MOBILE_FEED_STANDARD');
add(PublisherEnum.Instagram, undefined, 'video_feeds', 'MOBILE_FEED_STANDARD');
add(PublisherEnum.Instagram, undefined, 'unknown', 'MOBILE_FEED_STANDARD');

add(PublisherEnum.Facebook, undefined, 'an_classic', 'MOBILE_FEED_STANDARD');
add(PublisherEnum.Facebook, undefined, 'biz_disco_feed', 'MOBILE_FEED_STANDARD');
add(PublisherEnum.Facebook, undefined, 'facebook_reels', 'MOBILE_FEED_STANDARD');
add(PublisherEnum.Facebook, undefined, 'facebook_reels_overlay', 'MOBILE_FEED_STANDARD');
add(PublisherEnum.Facebook, undefined, 'facebook_stories', 'MOBILE_FEED_STANDARD');
add(PublisherEnum.Facebook, undefined, 'feed', 'MOBILE_FEED_STANDARD');
add(PublisherEnum.Facebook, undefined, 'instagram_explore', 'MOBILE_FEED_STANDARD');
add(PublisherEnum.Facebook, undefined, 'instagram_explore_grid_home', 'MOBILE_FEED_STANDARD');
add(PublisherEnum.Facebook, undefined, 'instagram_profile_feed', 'MOBILE_FEED_STANDARD');
add(PublisherEnum.Facebook, undefined, 'instagram_reels', 'MOBILE_FEED_STANDARD');
add(PublisherEnum.Facebook, undefined, 'instagram_search', 'MOBILE_FEED_STANDARD');
add(PublisherEnum.Facebook, undefined, 'instagram_stories', 'MOBILE_FEED_STANDARD');
add(PublisherEnum.Facebook, undefined, 'instream_video', 'MOBILE_FEED_STANDARD');
add(PublisherEnum.Facebook, undefined, 'marketplace', 'MOBILE_FEED_STANDARD');
add(PublisherEnum.Facebook, undefined, 'messenger_inbox', 'MOBILE_FEED_STANDARD');
add(PublisherEnum.Facebook, undefined, 'messenger_stories', 'MOBILE_FEED_STANDARD');
add(PublisherEnum.Facebook, undefined, 'rewarded_video', 'MOBILE_FEED_STANDARD');
add(PublisherEnum.Facebook, undefined, 'right_hand_column', 'MOBILE_FEED_STANDARD');
add(PublisherEnum.Facebook, undefined, 'search', 'MOBILE_FEED_STANDARD');
add(PublisherEnum.Facebook, undefined, 'video_feeds', 'MOBILE_FEED_STANDARD');
add(PublisherEnum.Facebook, undefined, 'unknown', 'MOBILE_FEED_STANDARD');

add(PublisherEnum.Messenger, undefined, 'an_classic', 'MOBILE_FEED_STANDARD');
add(PublisherEnum.Messenger, undefined, 'biz_disco_feed', 'MOBILE_FEED_STANDARD');
add(PublisherEnum.Messenger, undefined, 'facebook_reels', 'MOBILE_FEED_STANDARD');
add(PublisherEnum.Messenger, undefined, 'facebook_reels_overlay', 'MOBILE_FEED_STANDARD');
add(PublisherEnum.Messenger, undefined, 'facebook_stories', 'MOBILE_FEED_STANDARD');
add(PublisherEnum.Messenger, undefined, 'feed', 'MOBILE_FEED_STANDARD');
add(PublisherEnum.Messenger, undefined, 'instagram_explore', 'MOBILE_FEED_STANDARD');
add(PublisherEnum.Messenger, undefined, 'instagram_explore_grid_home', 'MOBILE_FEED_STANDARD');
add(PublisherEnum.Messenger, undefined, 'instagram_profile_feed', 'MOBILE_FEED_STANDARD');
add(PublisherEnum.Messenger, undefined, 'instagram_reels', 'MOBILE_FEED_STANDARD');
add(PublisherEnum.Messenger, undefined, 'instagram_search', 'MOBILE_FEED_STANDARD');
add(PublisherEnum.Messenger, undefined, 'instagram_stories', 'MOBILE_FEED_STANDARD');
add(PublisherEnum.Messenger, undefined, 'instream_video', 'MOBILE_FEED_STANDARD');
add(PublisherEnum.Messenger, undefined, 'marketplace', 'MOBILE_FEED_STANDARD');
add(PublisherEnum.Messenger, undefined, 'messenger_inbox', 'MOBILE_FEED_STANDARD');
add(PublisherEnum.Messenger, undefined, 'messenger_stories', 'MOBILE_FEED_STANDARD');
add(PublisherEnum.Messenger, undefined, 'rewarded_video', 'MOBILE_FEED_STANDARD');
add(PublisherEnum.Messenger, undefined, 'right_hand_column', 'MOBILE_FEED_STANDARD');
add(PublisherEnum.Messenger, undefined, 'search', 'MOBILE_FEED_STANDARD');
add(PublisherEnum.Messenger, undefined, 'video_feeds', 'MOBILE_FEED_STANDARD');
add(PublisherEnum.Messenger, undefined, 'unknown', 'MOBILE_FEED_STANDARD');

add(PublisherEnum.Unknown, undefined, 'an_classic', 'MOBILE_FEED_STANDARD');
add(PublisherEnum.Unknown, undefined, 'biz_disco_feed', 'MOBILE_FEED_STANDARD');
add(PublisherEnum.Unknown, undefined, 'facebook_reels', 'MOBILE_FEED_STANDARD');
add(PublisherEnum.Unknown, undefined, 'facebook_reels_overlay', 'MOBILE_FEED_STANDARD');
add(PublisherEnum.Unknown, undefined, 'facebook_stories', 'MOBILE_FEED_STANDARD');
add(PublisherEnum.Unknown, undefined, 'feed', 'MOBILE_FEED_STANDARD');
add(PublisherEnum.Unknown, undefined, 'instagram_explore', 'MOBILE_FEED_STANDARD');
add(PublisherEnum.Unknown, undefined, 'instagram_explore_grid_home', 'MOBILE_FEED_STANDARD');
add(PublisherEnum.Unknown, undefined, 'instagram_profile_feed', 'MOBILE_FEED_STANDARD');
add(PublisherEnum.Unknown, undefined, 'instagram_reels', 'MOBILE_FEED_STANDARD');
add(PublisherEnum.Unknown, undefined, 'instagram_search', 'MOBILE_FEED_STANDARD');
add(PublisherEnum.Unknown, undefined, 'instagram_stories', 'MOBILE_FEED_STANDARD');
add(PublisherEnum.Unknown, undefined, 'instream_video', 'MOBILE_FEED_STANDARD');
add(PublisherEnum.Unknown, undefined, 'marketplace', 'MOBILE_FEED_STANDARD');
add(PublisherEnum.Unknown, undefined, 'messenger_inbox', 'MOBILE_FEED_STANDARD');
add(PublisherEnum.Unknown, undefined, 'messenger_stories', 'MOBILE_FEED_STANDARD');
add(PublisherEnum.Unknown, undefined, 'rewarded_video', 'MOBILE_FEED_STANDARD');
add(PublisherEnum.Unknown, undefined, 'right_hand_column', 'MOBILE_FEED_STANDARD');
add(PublisherEnum.Unknown, undefined, 'search', 'MOBILE_FEED_STANDARD');
add(PublisherEnum.Unknown, undefined, 'video_feeds', 'MOBILE_FEED_STANDARD');
add(PublisherEnum.Unknown, undefined, 'unknown', 'MOBILE_FEED_STANDARD');

// device and position combinations
add(undefined, DeviceEnum.Desktop, 'an_classic', 'MOBILE_FEED_STANDARD');
add(undefined, DeviceEnum.Desktop, 'biz_disco_feed', 'MOBILE_FEED_STANDARD');
add(undefined, DeviceEnum.Desktop, 'facebook_reels', 'MOBILE_FEED_STANDARD');
add(undefined, DeviceEnum.Desktop, 'facebook_reels_overlay', 'MOBILE_FEED_STANDARD');
add(undefined, DeviceEnum.Desktop, 'facebook_stories', 'MOBILE_FEED_STANDARD');
add(undefined, DeviceEnum.Desktop, 'feed', 'MOBILE_FEED_STANDARD');
add(undefined, DeviceEnum.Desktop, 'instagram_explore', 'MOBILE_FEED_STANDARD');
add(undefined, DeviceEnum.Desktop, 'instagram_explore_grid_home', 'MOBILE_FEED_STANDARD');
add(undefined, DeviceEnum.Desktop, 'instagram_profile_feed', 'MOBILE_FEED_STANDARD');
add(undefined, DeviceEnum.Desktop, 'instagram_reels', 'MOBILE_FEED_STANDARD');
add(undefined, DeviceEnum.Desktop, 'instagram_search', 'MOBILE_FEED_STANDARD');
add(undefined, DeviceEnum.Desktop, 'instagram_stories', 'MOBILE_FEED_STANDARD');
add(undefined, DeviceEnum.Desktop, 'instream_video', 'MOBILE_FEED_STANDARD');
add(undefined, DeviceEnum.Desktop, 'marketplace', 'MOBILE_FEED_STANDARD');
add(undefined, DeviceEnum.Desktop, 'messenger_inbox', 'MOBILE_FEED_STANDARD');
add(undefined, DeviceEnum.Desktop, 'messenger_stories', 'MOBILE_FEED_STANDARD');
add(undefined, DeviceEnum.Desktop, 'rewarded_video', 'MOBILE_FEED_STANDARD');
add(undefined, DeviceEnum.Desktop, 'right_hand_column', 'MOBILE_FEED_STANDARD');
add(undefined, DeviceEnum.Desktop, 'search', 'MOBILE_FEED_STANDARD');
add(undefined, DeviceEnum.Desktop, 'video_feeds', 'MOBILE_FEED_STANDARD');
add(undefined, DeviceEnum.Desktop, 'unknown', 'MOBILE_FEED_STANDARD');

add(undefined, DeviceEnum.MobileApp, 'an_classic', 'MOBILE_FEED_STANDARD');
add(undefined, DeviceEnum.MobileApp, 'biz_disco_feed', 'MOBILE_FEED_STANDARD');
add(undefined, DeviceEnum.MobileApp, 'facebook_reels', 'MOBILE_FEED_STANDARD');
add(undefined, DeviceEnum.MobileApp, 'facebook_reels_overlay', 'MOBILE_FEED_STANDARD');
add(undefined, DeviceEnum.MobileApp, 'facebook_stories', 'MOBILE_FEED_STANDARD');
add(undefined, DeviceEnum.MobileApp, 'feed', 'MOBILE_FEED_STANDARD');
add(undefined, DeviceEnum.MobileApp, 'instagram_explore', 'MOBILE_FEED_STANDARD');
add(undefined, DeviceEnum.MobileApp, 'instagram_explore_grid_home', 'MOBILE_FEED_STANDARD');
add(undefined, DeviceEnum.MobileApp, 'instagram_profile_feed', 'MOBILE_FEED_STANDARD');
add(undefined, DeviceEnum.MobileApp, 'instagram_reels', 'MOBILE_FEED_STANDARD');
add(undefined, DeviceEnum.MobileApp, 'instagram_search', 'MOBILE_FEED_STANDARD');
add(undefined, DeviceEnum.MobileApp, 'instagram_stories', 'MOBILE_FEED_STANDARD');
add(undefined, DeviceEnum.MobileApp, 'instream_video', 'MOBILE_FEED_STANDARD');
add(undefined, DeviceEnum.MobileApp, 'marketplace', 'MOBILE_FEED_STANDARD');
add(undefined, DeviceEnum.MobileApp, 'messenger_inbox', 'MOBILE_FEED_STANDARD');
add(undefined, DeviceEnum.MobileApp, 'messenger_stories', 'MOBILE_FEED_STANDARD');
add(undefined, DeviceEnum.MobileApp, 'rewarded_video', 'MOBILE_FEED_STANDARD');
add(undefined, DeviceEnum.MobileApp, 'right_hand_column', 'MOBILE_FEED_STANDARD');
add(undefined, DeviceEnum.MobileApp, 'search', 'MOBILE_FEED_STANDARD');
add(undefined, DeviceEnum.MobileApp, 'video_feeds', 'MOBILE_FEED_STANDARD');
add(undefined, DeviceEnum.MobileApp, 'unknown', 'MOBILE_FEED_STANDARD');

add(undefined, DeviceEnum.MobileWeb, 'an_classic', 'MOBILE_FEED_STANDARD');
add(undefined, DeviceEnum.MobileWeb, 'biz_disco_feed', 'MOBILE_FEED_STANDARD');
add(undefined, DeviceEnum.MobileWeb, 'facebook_reels', 'MOBILE_FEED_STANDARD');
add(undefined, DeviceEnum.MobileWeb, 'facebook_reels_overlay', 'MOBILE_FEED_STANDARD');
add(undefined, DeviceEnum.MobileWeb, 'facebook_stories', 'MOBILE_FEED_STANDARD');
add(undefined, DeviceEnum.MobileWeb, 'feed', 'MOBILE_FEED_STANDARD');
add(undefined, DeviceEnum.MobileWeb, 'instagram_explore', 'MOBILE_FEED_STANDARD');
add(undefined, DeviceEnum.MobileWeb, 'instagram_explore_grid_home', 'MOBILE_FEED_STANDARD');
add(undefined, DeviceEnum.MobileWeb, 'instagram_profile_feed', 'MOBILE_FEED_STANDARD');
add(undefined, DeviceEnum.MobileWeb, 'instagram_reels', 'MOBILE_FEED_STANDARD');
add(undefined, DeviceEnum.MobileWeb, 'instagram_search', 'MOBILE_FEED_STANDARD');
add(undefined, DeviceEnum.MobileWeb, 'instagram_stories', 'MOBILE_FEED_STANDARD');
add(undefined, DeviceEnum.MobileWeb, 'instream_video', 'MOBILE_FEED_STANDARD');
add(undefined, DeviceEnum.MobileWeb, 'marketplace', 'MOBILE_FEED_STANDARD');
add(undefined, DeviceEnum.MobileWeb, 'messenger_inbox', 'MOBILE_FEED_STANDARD');
add(undefined, DeviceEnum.MobileWeb, 'messenger_stories', 'MOBILE_FEED_STANDARD');
add(undefined, DeviceEnum.MobileWeb, 'rewarded_video', 'MOBILE_FEED_STANDARD');
add(undefined, DeviceEnum.MobileWeb, 'right_hand_column', 'MOBILE_FEED_STANDARD');
add(undefined, DeviceEnum.MobileWeb, 'search', 'MOBILE_FEED_STANDARD');
add(undefined, DeviceEnum.MobileWeb, 'video_feeds', 'MOBILE_FEED_STANDARD');
add(undefined, DeviceEnum.MobileWeb, 'unknown', 'MOBILE_FEED_STANDARD');

add(undefined, DeviceEnum.Unknown, 'an_classic', 'MOBILE_FEED_STANDARD');
add(undefined, DeviceEnum.Unknown, 'biz_disco_feed', 'MOBILE_FEED_STANDARD');
add(undefined, DeviceEnum.Unknown, 'facebook_reels', 'MOBILE_FEED_STANDARD');
add(undefined, DeviceEnum.Unknown, 'facebook_reels_overlay', 'MOBILE_FEED_STANDARD');
add(undefined, DeviceEnum.Unknown, 'facebook_stories', 'MOBILE_FEED_STANDARD');
add(undefined, DeviceEnum.Unknown, 'feed', 'MOBILE_FEED_STANDARD');
add(undefined, DeviceEnum.Unknown, 'instagram_explore', 'MOBILE_FEED_STANDARD');
add(undefined, DeviceEnum.Unknown, 'instagram_explore_grid_home', 'MOBILE_FEED_STANDARD');
add(undefined, DeviceEnum.Unknown, 'instagram_profile_feed', 'MOBILE_FEED_STANDARD');
add(undefined, DeviceEnum.Unknown, 'instagram_reels', 'MOBILE_FEED_STANDARD');
add(undefined, DeviceEnum.Unknown, 'instagram_search', 'MOBILE_FEED_STANDARD');
add(undefined, DeviceEnum.Unknown, 'instagram_stories', 'MOBILE_FEED_STANDARD');
add(undefined, DeviceEnum.Unknown, 'instream_video', 'MOBILE_FEED_STANDARD');
add(undefined, DeviceEnum.Unknown, 'marketplace', 'MOBILE_FEED_STANDARD');
add(undefined, DeviceEnum.Unknown, 'messenger_inbox', 'MOBILE_FEED_STANDARD');
add(undefined, DeviceEnum.Unknown, 'messenger_stories', 'MOBILE_FEED_STANDARD');
add(undefined, DeviceEnum.Unknown, 'rewarded_video', 'MOBILE_FEED_STANDARD');
add(undefined, DeviceEnum.Unknown, 'right_hand_column', 'MOBILE_FEED_STANDARD');
add(undefined, DeviceEnum.Unknown, 'search', 'MOBILE_FEED_STANDARD');
add(undefined, DeviceEnum.Unknown, 'video_feeds', 'MOBILE_FEED_STANDARD');
add(undefined, DeviceEnum.Unknown, 'unknown', 'MOBILE_FEED_STANDARD');

// Position only entries
add(undefined, undefined, 'an_classic', 'MOBILE_FEED_STANDARD');
add(undefined, undefined, 'biz_disco_feed', 'MOBILE_FEED_STANDARD');
add(undefined, undefined, 'facebook_reels', 'MOBILE_FEED_STANDARD');
add(undefined, undefined, 'facebook_reels_overlay', 'MOBILE_FEED_STANDARD');
add(undefined, undefined, 'facebook_stories', 'MOBILE_FEED_STANDARD');
add(undefined, undefined, 'feed', 'MOBILE_FEED_STANDARD');
add(undefined, undefined, 'instagram_explore', 'MOBILE_FEED_STANDARD');
add(undefined, undefined, 'instagram_explore_grid_home', 'MOBILE_FEED_STANDARD');
add(undefined, undefined, 'instagram_profile_feed', 'MOBILE_FEED_STANDARD');
add(undefined, undefined, 'instagram_reels', 'MOBILE_FEED_STANDARD');
add(undefined, undefined, 'instagram_search', 'MOBILE_FEED_STANDARD');
add(undefined, undefined, 'instagram_stories', 'MOBILE_FEED_STANDARD');
add(undefined, undefined, 'instream_video', 'MOBILE_FEED_STANDARD');
add(undefined, undefined, 'marketplace', 'MOBILE_FEED_STANDARD');
add(undefined, undefined, 'messenger_inbox', 'MOBILE_FEED_STANDARD');
add(undefined, undefined, 'messenger_stories', 'MOBILE_FEED_STANDARD');
add(undefined, undefined, 'rewarded_video', 'MOBILE_FEED_STANDARD');
add(undefined, undefined, 'right_hand_column', 'MOBILE_FEED_STANDARD');
add(undefined, undefined, 'search', 'MOBILE_FEED_STANDARD');
add(undefined, undefined, 'video_feeds', 'MOBILE_FEED_STANDARD');
add(undefined, undefined, 'unknown', 'MOBILE_FEED_STANDARD');

// Device only entries
add(undefined, DeviceEnum.Desktop, undefined, 'MOBILE_FEED_STANDARD');
add(undefined, DeviceEnum.MobileApp, undefined, 'MOBILE_FEED_STANDARD');
add(undefined, DeviceEnum.MobileWeb, undefined, 'MOBILE_FEED_STANDARD');
add(undefined, DeviceEnum.Unknown, undefined, 'MOBILE_FEED_STANDARD');

// Publisher only entries
add(PublisherEnum.AudienceNetwork, undefined, undefined, 'MOBILE_FEED_STANDARD');
add(PublisherEnum.Facebook, undefined, undefined, 'MOBILE_FEED_STANDARD');
add(PublisherEnum.Instagram, undefined, undefined, 'MOBILE_FEED_STANDARD');
add(PublisherEnum.Messenger, undefined, undefined, 'MOBILE_FEED_STANDARD');
add(PublisherEnum.Unknown, undefined, undefined, 'MOBILE_FEED_STANDARD');
