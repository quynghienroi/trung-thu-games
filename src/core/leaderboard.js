/**
 * 🏆 Leaderboard
 * Lưu và đọc bảng xếp hạng từ localStorage
 */
export class Leaderboard {
  constructor(maxEntries = 10) {
    this.maxEntries = maxEntries;
  }

  /** Get key for a game */
  _key(gameId) {
    return `trungthu_lb_${gameId}`;
  }

  /** Save a score */
  save(gameId, name, score) {
    const entries = this.getAll(gameId);
    entries.push({ name, score, date: Date.now() });
    entries.sort((a, b) => b.score - a.score);
    const trimmed = entries.slice(0, this.maxEntries);
    try {
      localStorage.setItem(this._key(gameId), JSON.stringify(trimmed));
    } catch (e) {
      console.warn('Could not save leaderboard:', e);
    }
    return trimmed;
  }

  /** Get all entries for a game */
  getAll(gameId) {
    try {
      const data = localStorage.getItem(this._key(gameId));
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  /** Get top N entries */
  getTop(gameId, n = 5) {
    return this.getAll(gameId).slice(0, n);
  }

  /** Get best score */
  getBest(gameId) {
    const entries = this.getAll(gameId);
    return entries.length > 0 ? entries[0].score : 0;
  }

  /** Check if score is a new high score */
  isHighScore(gameId, score) {
    return score > this.getBest(gameId);
  }

  /** Clear leaderboard for a game */
  clear(gameId) {
    localStorage.removeItem(this._key(gameId));
  }
}
