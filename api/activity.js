// api/activity.js
import { renderActivityBadge } from '../lib/widgets.js';

export default async function handler(req, res) {
    // 1. Extract query parameters from the URL link
    const { 
        customLabel = 'Local Time', 
        theme = 'classic', 
        timeFormat = '24-hour',
        showSeconds = 'true', 
        timezone = 'Asia/Kolkata' 
    } = req.query;

    // 2. Calculate the live time for the specified timezone
    const now = new Date();
    const timeOptions = {
        timeZone: timezone,
        hour: '2-digit',
        minute: '2-digit',
        second: showSeconds === 'true' ? '2-digit' : undefined,
        hour12: timeFormat === '12-hour'
    };
    
    let timeString = '';
    try {
        timeString = now.toLocaleTimeString('en-US', timeOptions);
    } catch (error) {
        // Fallback to UTC if an unsupported timezone string is passed
        timeString = now.toLocaleTimeString('en-US', { ...timeOptions, timeZone: 'UTC' });
    }

    // 3. Dynamic metric placeholders (these can be linked to APIs later)
    const streak = "12 Days"; 
    const listening = "Anti-Hero - Taylor Swift";

    // 4. Generate the SVG using our shared template function
    const svg = renderActivityBadge({
        customLabel,
        theme,
        timeString,
        streak,
        listening
    });

    // 5. Explicitly tell the browser/GitHub to process this as an image file
    res.setHeader('Content-Type', 'image/svg+xml');
    
    // Prevent GitHub from aggressively caching old times so it updates
    res.setHeader('Cache-Control', 'max-age=0, no-cache, no-store, must-revalidate');
    
    return res.status(200).send(svg);
}