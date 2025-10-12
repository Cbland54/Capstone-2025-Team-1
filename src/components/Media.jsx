import React, { useState, useMemo, useEffect, useCallback } from "react";
// Assuming MediaData now includes local videos with a 'viewCount' property for demonstration.
import { mediaContent, allTags, dynamicPlaylists, YOUTUBE_CHANNEL_ID } from "../MediaData"; 

// youtube API constant.
const YOUTUBE_API_KEY = import.meta.env.VITE_YOUTUBE_API_KEY; 

// youtube player component handles the autoplay for both sizzle reels & full videos.
// the key is used in the parent component to force reload/loop the sizzle reels.
const YouTubePlayer = ({ videoDetails }) => {
    if (!videoDetails) return null;

    const { id, isExternal } = videoDetails;
    // set to 9999 as a fallback in case durationSeconds is missing. It will treat as full video.
    const durationSeconds = videoDetails.durationSeconds || 9999; 
    
    // logic to identify a sizzle reel (<= 7 seconds).
    const isSizzleReel = durationSeconds <= 7 && !isExternal;

    // base url - uses autoplay=1.
    let embedUrl = `https://www.youtube.com/embed/${id}?autoplay=1&mute=0`; // mute=0 is explicit unmuting.

    // sizzle reel - unmuted and ends at 7 seconds.
    if (isSizzleReel) {
        // rely on the parent component's key prop and timer to force the reload/loop.
        embedUrl += `&start=0&end=7`; 
    } 
    // full video - unmuted; condition is handled by the base url now.

    return (
        <div className="video-container">
            <iframe
                className="video-iframe" 
                src={embedUrl}
                title={isSizzleReel ? "Sizzle Reel Player" : "Full Video Player"}
                // enables autoplay functionality.
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; autoplay" 
                allowFullScreen
            ></iframe>
        </div>
    );
};

// API fetch function handles both playlist and channel search, and now fetches statistics.
const fetchDynamicContent = async () => {
    if (!YOUTUBE_API_KEY) {
        console.error("YouTube API Key is missing. Check your .env file.");
        return [];
    }

    const allDynamicVideos = [];
    let allVideoIds = []; // collects all IDs for stats fetch.

    for (const item of dynamicPlaylists) {
        let apiUrl = '';
        
        // determine the API endpoint based on the item type.
        if (item.isChannelSearch) {
            // case 1 - general channel feed; uses "search" endpoint.
            apiUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${item.id}&type=video&order=date&maxResults=5&key=${YOUTUBE_API_KEY}`;
        } else {
            // case 2 - specific playlist; uses "playlistItems" endpoint.
            apiUrl = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=${item.id}&maxResults=5&key=${YOUTUBE_API_KEY}`;
        }

        try {
            const response = await fetch(apiUrl);
            if (!response.ok) {
                const error = await response.json();
                console.error(`YouTube API Error fetching content for ${item.name}:`, error);
                continue; 
            }

            const data = await response.json();
            
            // maps the data; handling the different object structures for each endpoint.
            const videos = data.items
                // filter - ensure the videoId is present and the title is not unavailable.
                .filter(videoItem => {
                    const videoId = item.isChannelSearch 
                        ? videoItem.id.videoId 
                        : videoItem.snippet.resourceId.videoId;
                    const title = videoItem.snippet.title;

                    // exclude items with no ID or specific unavailable titles used by youtube.
                    return videoId && 
                           title !== 'Private video' && 
                           title !== 'Deleted video' &&
                           title !== 'Video unavailable';
                })
                .map(videoItem => ({
                    id: item.isChannelSearch 
                        ? videoItem.id.videoId 
                        : videoItem.snippet.resourceId.videoId,
                    title: videoItem.snippet.title,
                    tags: [item.name], // tag is the friendly name ("FootWorks Feed").
                    durationSeconds: 150, // default "full video" duration for dynamic content.
                    isExternal: true, 
                    score: 1, 
                    viewCount: null, // placeholder for analytical data.
                }));
            
            allDynamicVideos.push(...videos);
            allVideoIds.push(...videos.map(v => v.id));

        } catch (error) {
            console.error(`Error fetching dynamic content for ${item.name}:`, error);
        }
    }
    
    // analytics Integration - fetch video statistics.
    if (allVideoIds.length > 0) {
        try {
            const videoIdsString = allVideoIds.join(',');
            // requests "statistics" part for view count.
            const statsApiUrl = `https://www.googleapis.com/youtube/v3/videos?part=statistics&id=${videoIdsString}&key=${YOUTUBE_API_KEY}`;
            
            const statsResponse = await fetch(statsApiUrl);
            if (!statsResponse.ok) {
                console.warn("Could not fetch video statistics.");
            } else {
                const statsData = await statsResponse.json();
                
                // maps statistics by video ID for quick lookup.
                const statsMap = new Map();
                statsData.items.forEach(item => {
                    statsMap.set(item.id, {
                        // converts string count to number.
                        viewCount: parseInt(item.statistics.viewCount, 10) || 0,
                        // adds other stats like "likeCount" here as needed.
                    });
                });

                // merge statistics into the dynamic video objects.
                return allDynamicVideos.map(video => ({
                    ...video,
                    ...statsMap.get(video.id) // adds view count.
                }));
            }
            
        } catch (error) {
            console.error("Error fetching video statistics:", error);
        }
    }
    
    // return videos even if stats failed (view count will null).
    return allDynamicVideos;
};


export default function Media() {
    const [activeTag, setActiveTag] = useState("All"); 
    const [dynamicRecommendations, setDynamicRecommendations] = useState([]);
    const [sizzleKey, setSizzleKey] = useState(0); // key to force player reload for sizzle reel looping.

    useEffect(() => {
        // fetch dynamic content including analytical data.
        fetchDynamicContent().then(videos => {
            setDynamicRecommendations(videos);
        });
    }, []); 

    
    // combined video list and filter logic.
    const combinedContent = useMemo(() => {
        // analytics integration - add mock viewCount to local content.
        // NOTE - this should normally come from the database.
        const localContentWithMockViews = mediaContent.map((video, index) => ({
            ...video,
            // assign a unique view count for visual sorting demo.
            viewCount: video.isExternal ? video.viewCount : 1000 + (index * 100), 
        }));
        
        return [
            ...dynamicRecommendations, 
            ...localContentWithMockViews
        ];
    }, [dynamicRecommendations]);


    const filteredContent = useMemo(() => {
        if (activeTag.toLowerCase() === "all") {
            return combinedContent;
        }
        return combinedContent.filter(video => 
             video.tags.includes(activeTag)
        );
    }, [activeTag, combinedContent]);


    const [currentVideoDetails, setCurrentVideoDetails] = useState(combinedContent[0] || null);


    // side effect - updates playing video when filter or content changes.
    useEffect(() => {
        if (filteredContent.length > 0) {
            setCurrentVideoDetails(filteredContent[0]);
        } else {
            setCurrentVideoDetails(null);
        }
        // reset sizzle key on filter/content change to ensure the loop starts fresh
        setSizzleKey(0); 
    }, [filteredContent, activeTag]);


    // sizzle reel loop - force reload every 7.5 seconds.
    useEffect(() => {
        let timer;
        // identify if the current playing video is sizzle reel.
        const isSizzle = currentVideoDetails && 
                        (currentVideoDetails.durationSeconds || 9999) <= 7 &&
                        !currentVideoDetails.isExternal;

        if (isSizzle) {
            // sets timer to reload the component after the 7 second mark (7.5 sec for precise).
            timer = setTimeout(() => {
                setSizzleKey(prevKey => prevKey + 1);
            }, 7500); // 7500ms = 7.5 seconds.
        }

        // cleanup function - important to clear timer.
        return () => clearTimeout(timer);
        // add currentVideoDetails to reset the timer when a new video is selected.
    }, [sizzleKey, currentVideoDetails]); 

    // personalized recommendation
    const generateRecommendations = (currentVideoDetails) => {
        if (!currentVideoDetails) return [];
        
        const currentTags = currentVideoDetails.tags;
        const currentId = currentVideoDetails.id;
        
        const candidates = combinedContent.filter(video => 
            video.id !== currentId && video.tags && video.tags.length > 0
        );

        const scoredRecommendations = candidates.map(video => {
            let matchScore = 0;
            video.tags.forEach(tag => {
                if (currentTags.includes(tag)) {
                    matchScore += 1;
                }
            });
            
            // analytics integration - use view count to boost score.
            // normalizes view count (example - add 1 point per 1000 views).
            const viewBonus = video.viewCount ? Math.floor(video.viewCount / 1000) : 0;
            matchScore += viewBonus;

            return {
                ...video,
                score: matchScore 
            };
        });

        return scoredRecommendations
            .filter(video => video.score > 0) 
            .sort((a, b) => b.score - a.score) 
            .slice(0, 2); 
    };

    const recommendedVideos = useMemo(() => {
        return generateRecommendations(currentVideoDetails);
    }, [currentVideoDetails, dynamicRecommendations]);


    // event handler.
    const handleTagClick = useCallback((tag) => {
        setActiveTag(tag);
    }, []);

    const handleVideoClick = useCallback((videoDetails) => {
        setCurrentVideoDetails(videoDetails);
        setSizzleKey(0); 
        
        // analytics integration - mock view logs for static (local) videos.
        if (!videoDetails.isExternal) {
             // In a real application, this would be an API call to a server to log the view
             console.log(`[Analytics Mock] View logged for local video: ${videoDetails.title}`);
        }
    }, []);

    // helper to retrieve video type label.
    const getVideoTypeLabel = (duration, isExternal) => {
        // NOTE - color classes here provide the custom color override.
        // for the base '.badge' utility defined in index.css.
        if (isExternal) {
            // dynamic content badge (uses brand colors).
            return <span className="badge bg-[var(--color-brand-100)] text-[var(--color-brand-700)] border-[var(--color-brand-300)]">{currentVideoDetails?.tags[0] || 'Dynamic'}</span>;
        }

        // local content badges (uses accent colors).
        return duration <= 7 
            ? <span className="badge bg-[var(--color-accent-100)] text-[var(--color-accent-700)] border-[var(--color-accent-300)]">Sizzle Reel ({duration}s)</span>
            : <span className="badge bg-[var(--color-accent-100)] text-[var(--color-accent-700)] border-[var(--color-accent-300)]">Full Video</span>;
    };


    return (
        // "media-card" class can be added to index.css (OPTIONAL).
        <div className="media-card"> 
            <h2 className="card-title"></h2>
            
            {/* Tag Buttons Section */}
            <div className="flex flex-wrap gap-2 mb-3">
                {allTags.map(tag => (
                    <button
                        key={tag}
                        onClick={() => handleTagClick(tag)}
                        // rely on "btn-outline" base styles for inactive state.
                        className={`btn btn-outline text-xs ${
                            activeTag === tag
                                // active state color classes.
                                ? 'bg-[var(--color-brand-500)] text-white hover:bg-[var(--color-brand-600)] border-[var(--color-brand-500)]' 
                                // inactive state hover simplified to use on "btn-outline" or basic hover.
                                : 'hover:bg-[var(--color-accent-100)]' 
                        }`}
                    >
                        #{tag}
                    </button>
                ))}
            </div>

            {/* Video Player Secton */}
            <div className="mb-4">
                {currentVideoDetails ? (
                    <YouTubePlayer 
                        videoDetails={currentVideoDetails} 
                        // key changes to force component reload/loop for sizzle reels.
                        key={currentVideoDetails.id + '-' + sizzleKey}
                    />
                ) : (
                    // this section remains inline for specific warning/alert style.
                    <div className="p-4 bg-yellow-50 rounded-[var(--radius-md)] text-yellow-800 border border-yellow-300">
                        No videos found for the tag: #{activeTag}
                    </div>
                )}
            </div>

            {/* Personalized Recommendations Section */}
            {recommendedVideos.length > 0 && (
                <div className="mt-4 mb-4 border-t border-[var(--color-border)] pt-2">
                    <h3 className="text-base font-bold mb-2 text-gray-800 flex items-center">
                        Personalized Recommendations
                    </h3>
                    
                    <div className="space-y-2"> 
                        {recommendedVideos.map(video => (
                            <div 
                                key={video.id} 
                                onClick={() => handleVideoClick(video)}
                                // uses - video-list-item-base.
                                className={`video-list-item-base p-2 bg-[var(--color-accent-50)] hover:bg-[var(--color-brand-100)]`}
                            > 
                                <p className="text-sm font-semibold text-[var(--color-text)] leading-tight">{video.title}</p>
                                <div className="flex flex-wrap gap-1 mt-1">
                                    {getVideoTypeLabel(video.durationSeconds, video.isExternal)}
                                    <span className="text-xs text-[var(--color-muted)]">
                                        (Source: {video.isExternal ? video.tags[0] : "Local"})
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Video List Selection */}
            {/* analytics integration - view count used for sorting here. */}
            <h3 className="text-base font-semibold mb-3 text-gray-700 mt-4 pt-2 border-t border-[var(--color-border)]">Content ({filteredContent.length})</h3>
            
            <div className="flex space-x-3 overflow-x-auto pb-3 -mb-3">
                {filteredContent.map(video => (
                    <div 
                        key={video.id} 
                        onClick={() => handleVideoClick(video)} 
                        // uses - utility class. p-3 class from base is kept in utility.
                        className={`video-list-item-base flex-none w-64 ${ 
                            currentVideoDetails && currentVideoDetails.id === video.id 
                                // active state line.
                                ? 'bg-[var(--color-brand-100)] border-[var(--color-brand-400)]' 
                                // inactive state line.
                                : 'bg-white border-[var(--color-accent-200)] hover:bg-[var(--color-accent-50)]'
                        }`}
                    >
                        <p className="font-medium text-[var(--color-text)] truncate">{video.title}</p>
                        <div className="flex flex-wrap items-center gap-2 mt-1">
                            {getVideoTypeLabel(video.durationSeconds, video.isExternal)}
                            
                            {/* analytics integration - display view count. */}
                            {(video.viewCount !== null && video.viewCount !== undefined) && (
                                <span className="text-xs text-[var(--color-muted)]">
                                    {video.viewCount.toLocaleString()} {video.isExternal ? 'YouTube' : 'Internal'} views
                                </span>
                            )}
                            
                            {/* display only local tags for local videos. */}
                            {!video.isExternal && video.tags.map(tag => (
                                <span key={tag} className="badge bg-[var(--color-accent-100)] text-[var(--color-accent-700)] border-[var(--color-accent-300)]">
                                    {tag}
                                </span>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}