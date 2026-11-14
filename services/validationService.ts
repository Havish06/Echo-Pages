
/**
 * Echo Pages Validation Service
 * Protects the sanctuary from junk, spam, and forbidden language.
 */

const RATE_LIMIT_MS = 60000; // 1 minute between posts
const DAILY_LIMIT = 20;
const MIN_LENGTH = 1;

// Local blacklist for immediate rejection
const BLACKLIST = ['nazi', 'hitler', 'porn', 'nsfw', 'f*ck', 'sh*t']; 

export const validationService = {
  checkRateLimit(userId: string): { allowed: boolean; reason?: string } {
    const now = Date.now();
    const lastPost = localStorage.getItem(`echo_last_post_${userId}`);
    const postHistory = JSON.parse(localStorage.getItem(`echo_history_${userId}`) || '[]');

    // 1. Minimum Interval Check
    if (lastPost && now - parseInt(lastPost) < RATE_LIMIT_MS) {
      const remaining = Math.ceil((RATE_LIMIT_MS - (now - parseInt(lastPost))) / 1000);
      return { allowed: false, reason: `Frequency flooding detected. Re-tune in ${remaining}s.` };
    }

    // 2. Daily Volume Check
    const today = new Date().toDateString();
    const postsToday = postHistory.filter((p: string) => new Date(parseInt(p)).toDateString() === today);
    if (postsToday.length >= DAILY_LIMIT) {
      return { allowed: false, reason: "Your daily resonance is exhausted. Return with the next moon." };
    }

    return { allowed: true };
  },

  recordPost(userId: string) {
    const now = Date.now();
    localStorage.setItem(`echo_last_post_${userId}`, now.toString());
    const history = JSON.parse(localStorage.getItem(`echo_history_${userId}`) || '[]');
    history.push(now.toString());
    localStorage.setItem(`echo_history_${userId}`, JSON.stringify(history.slice(-20)));
  },

  validateContent(content: string): { valid: boolean; reason?: string } {
    const text = content.trim();
    
    if (text.length < MIN_LENGTH) return { valid: false, reason: "Fragment is too brief to echo." };
    
    // Maximum length check removed to allow "any length"

    // Junk/Spam detection (e.g., repeated characters)
    if (/(.)\1{20,}/.test(text)) return { valid: false, reason: "Structural static detected (excessive repetition)." };

    // Local profanity check
    const containsBlacklist = BLACKLIST.some(word => text.toLowerCase().includes(word));
    if (containsBlacklist) return { valid: false, reason: "Forbidden vocabulary detected." };

    return { valid: true };
  }
};
