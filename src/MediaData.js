// array - holds static (local) videos and its metadata.
export const mediaContent = [
    {
        id: "9681qhPfnwo", // replace with real video ID.
        title: "FootWorks Miami Trailer",
        tags: ["FootWorksMiami"],
    },
    {
        id: "tXqR29lEOl4", // replace with real video ID.
        title: "Theragun mini",
        tags: ["SizzleReel"],
        durationSeconds: 7 
    },
    {
        id: "IqlHwXQ2_JI", // replace with real video ID.
        title: "Theragun Elite",
        tags: ["SizzleReel"],
        durationSeconds: 7 
    },
    {
        id: "5KO2VI_SDDw", // replace with real video ID.
        title: "FootWorks has the Lastest Gear: Garmin Forerunner 55",
        tags: ["SizzleReel"],
        durationSeconds: 7 
    },
    // please add more videos here for better recommendations.

]; //export mediaContent

export const YOUTUBE_CHANNEL_ID = "UCBqSs5r5vRQvdjMjcLYVWXQ"; // youtube channel ID - FootWorksMiami.

// tag names to each youtube playlist IDs.
export const dynamicPlaylists = [
    // 1. NEW ENTRY: This entry uses the Channel ID and is marked to trigger the 'search' API
    { id: YOUTUBE_CHANNEL_ID, name: "Latest", isChannelSearch: true }, 
    
    // 2. Existing Playlists (use the confirmed IDs)
    { id: "PLvOxYdInSY78rQ6RLFQ6JoS0T56I-yxgj", name: "Store" }, 
    { id: "PLDAFF0DBB55B5FC68", name: "NewtonRunningFormFriday" },
    { id: "PLvOxYdInSY79079e9-kNBFxvsvl7EoPW_", name: "CathyParbst-Accurso" }, 
];

// dynamically extracts all unique tags from local videos (mediaContent).
const uniqueLocalTags = [...new Set(
    mediaContent.flatMap(video => video.tags)
)].sort(); 

// final combined list for the tags.
export const allTags = [
    "All",
    "FootWorksMiami", // static (local) tags
    "SizzleReel", // static (local) tags
    "Latest", // static (local) tags
    "Store", // dynamic tags
    "NewtonRunningFormFriday", // dynamic tags
    "CathyParbst-Accurso", // dynamic tags
];