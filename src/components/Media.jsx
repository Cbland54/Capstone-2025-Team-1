import React, { useState, useMemo, useEffect, useCallback } from "react";

import { supabase } from './supabaseClient'; 

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
    // NOTE - &rel=0 is added to limit suggested videos to the same channel.
    let embedUrl = `https://www.youtube.com/embed/${id}?autoplay=1&mute=0&rel=0`; // mute=0 is explicit unmuting.

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

// fetch static content (videos) from Supabase.
const fetchSupabaseContent = async () => {
    try {
        // select all videos that are not marked as external (non-internal content).
        const { data, error } = await supabase
            .from('videos')
            .select('*')
            .eq('is_external', false); 

        if (error) {
            console.error("Supabase fetch videos error:", error);
            return [];
        }

        // map data to ensure durationSeconds is an integer by the logic.
        return data.map(video => ({
            ...video,
            // ensure compatibility with the client logic
            durationSeconds: parseInt(video.duration_seconds || 9999, 10), 
        }));

    } catch (error) {
        console.error("General error fetching Supabase content:", error);
        return [];
    }
};

// fetch dynamic source configurations from Supabase.
const fetchYoutubeSources = async () => {
    const { data, error } = await supabase
        .from('youtube_sources') // fetch from configuration table.
        .select('*');

    if (error) {
        console.error("Supabase fetch youtube_sources error:", error);
        return [];
    }
    return data;
};


// accepts the dynamicPlaylists array as an argument.
const fetchDynamicContent = async (dynamicPlaylists) => {
    if (!YOUTUBE_API_KEY) {
        console.error("YouTube API Key is missing. Check your .env file.");
        return [];
    }
    
    // ensure the array is present and not empty before processing.
    if (!dynamicPlaylists || dynamicPlaylists.length === 0) {
        return [];
    }

    const allDynamicVideos = [];
    let allVideoIds = []; // collects all IDs for stats fetch.

    for (const item of dynamicPlaylists) {
        let apiUrl = '';
        
        // determine the API endpoint based on the item type.
        if (item.is_channel_search) {
            // case 1 - general channel feed; uses "search" endpoint.
            apiUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${item.id}&type=video&order=date&maxResults=50&key=${YOUTUBE_API_KEY}`;
        } else {
            // case 2 - specific playlist; uses "playlistItems" endpoint.
            apiUrl = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=${item.id}&maxResults=50&key=${YOUTUBE_API_KEY}`;
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
                    const videoId = item.is_channel_search 
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
                    id: item.is_channel_search 
                        ? videoItem.id.videoId 
                        : videoItem.snippet.resourceId.videoId,
                    title: videoItem.snippet.title,
                    tags: [item.name], // tag is the friendly name (e.g., "Latest").
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
    
    // analytics integration - fetch video statistics.
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

// helper function to determine the thumbnail url.
const getThumbnailUrl = (video) => {
    if (video.isExternal) {
        // Use the predictable YouTube thumbnail URL structure.
        return `https://img.youtube.com/vi/${video.id}/hqdefault.jpg`; 
    } else {
        // For internal videos, assume a 'thumbnailUrl' property exists.
        return video.thumbnailUrl;
    }
};

export default function Media() {
    const [activeTag, setActiveTag] = useState("All"); 
    const [dynamicRecommendations, setDynamicRecommendations] = useState([]);
    // hold static content fetched from the Supabase 'videos' table.
    const [supabaseStaticContent, setSupabaseStaticContent] = useState([]); 
    const [sizzleKey, setSizzleKey] = useState(0); // key to force player reload for sizzle reel looping.

    // useEffect: manages the fetching of all data from Supabase and Youtube.
    useEffect(() => {
        const loadAllContent = async () => {
            // 1. fetch Static Content (from 'videos' table).
            const staticVideos = await fetchSupabaseContent();
            setSupabaseStaticContent(staticVideos);
            
            // 2. fetch YouTube Sources (from 'youtube_sources' table).
            const sources = await fetchYoutubeSources();
            
            // 3. fetch Dynamic Content (using the fetched sources).
            const dynamicVideos = await fetchDynamicContent(sources);
            setDynamicRecommendations(dynamicVideos);
        };
        
        loadAllContent();
    }, []); 

    
    // combined video list and filter logic.
    const combinedContent = useMemo(() => {
        // data is now combined from the two state sources.
        return [
            ...dynamicRecommendations, 
            ...supabaseStaticContent 
        ];
    }, [dynamicRecommendations, supabaseStaticContent]);

    
    // this array defines the exact, fixed order of your tags.
    // tags not in this list will be excluded. Tags are in the list but not in content will be excluded.
    const fixedTagOrder = [
        "All",
        "FootWorksMiami",
        "SizzleReel",
        "Latest",
        "Store",
        "NewtonRunningFormFriday",
        "CathyParbst-Accurso"
    ];

    // dynamically generate the list of unique tags from all content, then force the fixed order.
    const allUniqueTags = useMemo(() => {
        // 1. Get all unique tags from the fetched content.
        const allTagsInContent = new Set(["All"]); 

        combinedContent.forEach(video => {
            if (video.tags && Array.isArray(video.tags)) {
                video.tags.forEach(tag => allTagsInContent.add(tag));
            }
        });

        // 2. filter the fixed order list to only include tags that actually exist in the content.
        // ensures the custom order is maintained and only relevant tags are shown.
        const finalTags = fixedTagOrder.filter(tag => allTagsInContent.has(tag));
            
        return finalTags;

    }, [combinedContent]);


    // filteredContent uses case-insensitive check to fix the #Latest issue.
    const filteredContent = useMemo(() => {
        const lowerActiveTag = activeTag.toLowerCase();
        
        if (lowerActiveTag === "all") {
            return combinedContent;
        }
        
        // use .some() to check if ANY tag on the video matches the active tag (case-insensitive).
        return combinedContent.filter(video => 
             video.tags.some(tag => tag.toLowerCase() === lowerActiveTag)
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
                // use case-insensitive comparison for recommendation matching.
                if (currentTags.some(currentTag => currentTag.toLowerCase() === tag.toLowerCase())) {
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
    }, [currentVideoDetails, dynamicRecommendations, supabaseStaticContent]);


    // event handler.
    const handleTagClick = useCallback((tag) => {
        setActiveTag(tag);
    }, []);

    // function is now async and logs to the Supabase database.
    const handleVideoClick = useCallback(async (videoDetails) => {
        setCurrentVideoDetails(videoDetails);
        setSizzleKey(0); 
        
        // analytics integration - log the view to Supabase.
        // only log if it's internal content (isExternal is false).
        if (!videoDetails.isExternal) {
            try {
                 // Supabase analytics logging
                 const { error } = await supabase
                     .from('video_logs') // Insert into the new logs table
                     .insert({
                         video_id: videoDetails.id,
                         // Using a placeholder UUID for now
                         user_id: '00000000-0000-0000-0000-000000000000', 
                         event_type: 'play', // Log the initial 'play' event
                         watch_duration_seconds: 0 
                     });
                     
                 if (error) {
                     console.error("Supabase Log Error:", error);
                 } else {
                     console.log(`[Analytics] View logged to Supabase for: ${videoDetails.title}`);
                 }

            } catch (e) {
                console.error("Failed to log view:", e);
            }
        } else {
            // placeholder for external content or old console.log message
            console.log(`[Analytics] View started for external video: ${videoDetails.title}`);
        }
    }, []);

    // helper to retrieve video type label.
    const getVideoTypeLabel = (duration, isExternal) => {
        // NOTE - color classes here provide the custom color override.
        if (isExternal) {
            return (
                // custom utility - "badge badge-brand"
                <span className="badge badge-brand">{currentVideoDetails?.tags[0] || 'Dynamic'} </span>);
        }

        // local content badges (uses accent colors).
        return duration <= 7 
            ? <span className={"badge badge-brand"}>Sizzle Reel ({duration}s)</span>
            : <span className={"badge badge-brand"}>Full Video</span>;
    };

    return (
        <div className="media-card"> 
            <h2 className="card-title"></h2>
            
            {/* Tag Buttons Section */}
            <div className="flex flex-wrap gap-2 mb-3">
                {allUniqueTags.map(tag => (
                    <button
                        key={tag}
                        onClick={() => handleTagClick(tag)}
                        className={`btn btn-outline text-xs ${
                            activeTag === tag
                                ? 'bg-[var(--color-brand-500)] text-white hover:bg-[var(--color-brand-600)] border-[var(--color-brand-500)]' 
                                : 'hover:bg-[var(--color-accent-100)]' 
                        }`}
                    >
                        #{tag}
                    </button>
                ))}
            </div>

            {/* side-by-side layout for desktop */}
            <div className="flex flex-col md:flex-row md:space-x-4">
                
                {/* left column - video player and recommendation */}
                <div className="mb-4 md:mb-0 w-full md:flex-grow md:basis-0">
                    
                    {/* Video Player */}
                    {currentVideoDetails ? (
                        <YouTubePlayer 
                            videoDetails={currentVideoDetails} 
                            key={currentVideoDetails.id + '-' + sizzleKey}
                        />
                    ) : (
                        <div className="p-4 bg-yellow-50 rounded-[var(--radius-md)] text-yellow-800 border border-yellow-300">
                            No videos found for the tag: #{activeTag}
                        </div>
                    )}
                    
                    {/* Personalized Recommendations Section */}
                    {recommendedVideos.length > 0 && (
                        <div className="mt-4 border-t border-[var(--color-border)] pt-2">
                            <h3 className="text-base font-bold mb-2 text-gray-800 flex items-center">
                                Personalized Recommendations
                            </h3>
                            
                            <div className="space-y-2"> 
                                {recommendedVideos.map(video => (
                                    <div 
                                        key={video.id} 
                                        onClick={() => handleVideoClick(video)}
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
                </div>
                {/* left column */}

                {/* right column - content list selection */}
                <div className="w-full md:w-72 md:flex-shrink-0">
                    {/* Content Header */}
                    <h3 className="text-base font-bold mb-3 text-gray-800 flex items-center">
                        Contents ({filteredContent.length})
                    </h3>

                    {/* container for vertical scrolling list */}
                    <div className="flex flex-col space-y-3 overflow-y-auto max-h-[70vh] pb-3 pr-1"> 
                        {filteredContent.map(video => {
                            const thumbnailUrl = getThumbnailUrl(video); 

                            return (
                                <div 
                                    key={video.id} 
                                    onClick={() => handleVideoClick(video)} 

                                    className={`video-list-item-base w-full ${ 
                                        currentVideoDetails && currentVideoDetails.id === video.id 
                                            ? 'bg-[var(--color-brand-100)] border-[var(--color-brand-400)]' 
                                            : 'bg-white border-[var(--color-accent-200)] hover:bg-[var(--color-accent-50)]'
                                    }`}
                                >
                                    {/* thumbnail image component */}
                                    {thumbnailUrl && (
                                        <img 
                                            src={thumbnailUrl} 
                                            alt={`Thumbnail for ${video.title}`}
                                            className="w-full h-24 object-cover rounded-md mb-3" 
                                        />
                                    )}
                                    
                                    <p className="font-medium text-[var(--color-text)] truncate">{video.title}</p>
                                    <div className="flex flex-wrap items-center gap-2 mt-1">
                                        {getVideoTypeLabel(video.durationSeconds, video.isExternal)}
                                        
                                        {(video.viewCount !== null && video.viewCount !== undefined) && (
                                            <span className="text-xs text-[var(--color-muted)]">
                                                {video.viewCount.toLocaleString()} {video.isExternal ? 'YouTube' : 'Internal'} views
                                            </span>
                                        )}
                                        
                                        {!video.isExternal && video.tags.map(tag => (
                                            <span key={tag} className="badge badge-brand">
                                                {tag}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

        </div>
    );
}