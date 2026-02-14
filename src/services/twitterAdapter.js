import * as cheerio from 'cheerio';

export const TwitterAdapter = {
    async fetchTrending() {
        try {
            // Fetch trends24.in
            const response = await fetch('https://trends24.in/', {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
                }
            });
            const html = await response.text();
            const $ = cheerio.load(html);

            // Trends24 structure assumption based on research: 
            // Often list items inside a specific container. 
            // We look for the first column/list which usually represents "Now" or "Last Hour"

            const trends = [];

            // Selector might need adjustment based on valid live structure.
            // Based on common scraping: #trend-list .trend-card__list li
            // Or looking for the first 'ol' or 'ul' in the main content.

            // Attempting to match general structure seen in research
            $('.trend-card').first().find('li').each((i, el) => {
                if (i >= 10) return false; // Top 10 only

                const link = $(el).find('a');
                const title = link.text();
                const url = link.attr('href'); // This is usually a trends24 link or twitter search link
                const count = $(el).find('.tweet-count').text();

                // If the link is strictly internal to trends24, we might want to construct a direct twitter search link
                // But trends24 usually links to twitter search.

                if (title) {
                    trends.push({
                        id: `twitter-${i}-${Date.now()}`,
                        source: 'X (Twitter)',
                        titleOriginal: title,
                        titleTranslated: null,
                        url: url || `https://twitter.com/search?q=${encodeURIComponent(title)}`,
                        timestamp: new Date().toISOString(),
                        views: count || 'Trending',
                        thumbnail: null
                    });
                }
            });

            return trends;

        } catch (error) {
            console.error('TwitterAdapter Error:', error);
            return [];
        }
    }
};
