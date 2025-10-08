import { useState, useEffect } from 'react';
import { Crown } from 'lucide-react';

export default function GiveawayTracker() {
  const [winners, setWinners] = useState(() => {
    const saved = localStorage.getItem('pumpkinWinners');
    return saved ? JSON.parse(saved) : {};
  });
  const [pasteInput, setPasteInput] = useState('');
  const [message, setMessage] = useState('');
  const [hideKings, setHideKings] = useState(false);

  useEffect(() => {
    localStorage.setItem('pumpkinWinners', JSON.stringify(winners));
  }, [winners]);

  const parseGiveawayData = (text) => {
    const lines = text.split('\n');
    const newWinners = [];

    for (const line of lines) {
      // Match lines with the format: | number | ID | username |
      const match = line.match(/\|\s*\d+\s*\|\s*(\d+)\s*\|\s*([^\|]+)\s*\|/);
      if (match) {
        const userId = match[1].trim();
        const username = match[2].trim();
        newWinners.push({ userId, username });
      }
    }

    return newWinners;
  };

  const handlePaste = () => {
    if (!pasteInput.trim()) {
      setMessage('🎃 Please paste some giveaway data first!');
      return;
    }

    const newWinners = parseGiveawayData(pasteInput);

    if (newWinners.length === 0) {
      setMessage('👻 No winners found! Make sure the data is in the correct format.');
      return;
    }

    let addedCount = 0;
    let skippedCount = 0;

    setWinners(prev => {
      const updated = { ...prev };
      newWinners.forEach(({ userId, username }) => {
        if (updated[userId]) {
          // Only add if they haven't reached 10 yet
          if (updated[userId].count < 10) {
            updated[userId].count += 1;
            updated[userId].username = username;
            addedCount++;
          } else {
            skippedCount++;
          }
        } else {
          updated[userId] = { username, count: 1 };
          addedCount++;
        }
      });
      return updated;
    });

    let msg = `🎃 Added ${addedCount} pumpkin(s)!`;
    if (skippedCount > 0) {
      msg += ` (${skippedCount} already Pumpkin King${skippedCount > 1 ? 's' : ''})`;
    }
    setMessage(msg);
    setPasteInput('');
  };

  const clearData = () => {
    if (window.confirm('Are you sure you want to clear all pumpkin tracking data?')) {
      setWinners({});
      setMessage('🧹 All data cleared!');
    }
  };

  const exportData = () => {
    const dataStr = JSON.stringify(winners, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pumpkin-winners-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const sortedWinners = Object.entries(winners).sort((a, b) => b[1].count - a[1].count);
  const displayedWinners = hideKings ? sortedWinners.filter(([_, data]) => data.count < 10) : sortedWinners;
  const pumpkinKings = sortedWinners.filter(([_, data]) => data.count >= 10);

  return (
      <div className="min-h-screen bg-orange-900 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="bg-purple-900 rounded-3xl border-4 border-orange-600 p-8 mb-6">
            <div className="flex items-center justify-center gap-3 mb-6">
              <span className="text-5xl">🎃</span>
              <h1 className="text-4xl font-bold text-orange-500">
                Pumpkin Tracker
              </h1>
              <span className="text-5xl">🎃</span>
            </div>

            <p className="text-center text-orange-300 mb-6 text-lg">
              Collect 10 pumpkins to become a <span className="font-bold text-yellow-400">👑 Pumpkin King 👑</span>
            </p>

            <div className="mb-6">
              <label className="block text-orange-400 font-bold mb-2 text-lg">
                🎃 Paste Giveaway Results:
              </label>
              <textarea
                  value={pasteInput}
                  onChange={(e) => setPasteInput(e.target.value)}
                  placeholder="Paste the giveaway results here..."
                  className="w-full h-48 p-4 bg-black text-orange-200 placeholder-orange-700 rounded-xl border-2 border-orange-700 focus:border-orange-500 focus:ring-2 focus:ring-orange-500 outline-none font-mono text-sm"
              />
            </div>

            <div className="flex gap-3 mb-4">
              <button
                  onClick={handlePaste}
                  className="flex-1 bg-orange-600 text-white font-bold py-3 px-6 rounded-xl hover:bg-orange-700 transition-all border-2 border-orange-900 text-lg"
              >
                🎃 Add Pumpkin Winners
              </button>
              <button
                  onClick={exportData}
                  disabled={sortedWinners.length === 0}
                  className="bg-purple-700 text-white font-bold py-3 px-6 rounded-xl hover:bg-purple-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed border-2 border-purple-900"
              >
                💾 Export
              </button>
              <button
                  onClick={clearData}
                  disabled={sortedWinners.length === 0}
                  className="bg-red-900 text-white font-bold py-3 px-6 rounded-xl hover:bg-red-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed border-2 border-red-950"
              >
                🧹 Clear
              </button>
            </div>

            {message && (
                <div className="bg-orange-600/30 border-2 border-orange-500 text-orange-200 p-3 rounded-xl text-center font-bold">
                  {message}
                </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-purple-900 rounded-xl p-6 text-center border-2 border-orange-700">
              <div className="text-4xl mb-2">👻</div>
              <div className="text-4xl font-bold text-orange-400">{sortedWinners.length}</div>
              <div className="text-orange-300 font-semibold">Pumpkin Hunters</div>
            </div>
            <div className="bg-purple-900 rounded-xl p-6 text-center border-2 border-yellow-600">
              <div className="text-4xl mb-2">👑</div>
              <div className="text-4xl font-bold text-yellow-400">{pumpkinKings.length}</div>
              <div className="text-yellow-300 font-semibold">Pumpkin Kings</div>
            </div>
            <div className="bg-black/60 backdrop-blur-lg rounded-xl p-6 text-center border-2 border-orange-700">
              <div className="text-4xl mb-2">🎃</div>
              <div className="text-4xl font-bold text-orange-500">
                {sortedWinners.reduce((sum, [_, data]) => sum + data.count, 0)}
              </div>
              <div className="text-orange-300 font-semibold">Total Pumpkins</div>
            </div>
          </div>

          {sortedWinners.length > 0 && (
              <div className="bg-purple-900 rounded-3xl border-4 border-orange-600 p-8">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-3xl font-bold text-orange-500">
                    🎃 Pumpkin Leaderboard 🎃
                  </h2>
                  <button
                      onClick={() => setHideKings(!hideKings)}
                      className="bg-orange-600 text-white font-bold py-2 px-4 rounded-xl hover:bg-orange-700 transition-all border-2 border-orange-900"
                  >
                    {hideKings ? '👑 Show Pumpkin Kings' : '🙈 Hide Pumpkin Kings'}
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                    <tr className="border-b-2 border-orange-700">
                      <th className="text-left text-orange-400 font-bold py-3 px-4">Rank</th>
                      <th className="text-left text-orange-400 font-bold py-3 px-4">Username</th>
                      <th className="text-left text-orange-400 font-bold py-3 px-4">Discord ID</th>
                      <th className="text-center text-orange-400 font-bold py-3 px-4">Pumpkins</th>
                      <th className="text-center text-orange-400 font-bold py-3 px-4">Status</th>
                    </tr>
                    </thead>
                    <tbody>
                    {displayedWinners.map(([userId, data], index) => {
                      const actualRank = sortedWinners.findIndex(([id]) => id === userId) + 1;
                      return (
                          <tr key={userId} className="border-b border-orange-900 hover:bg-purple-800">
                            <td className="py-3 px-4 text-orange-300 font-bold text-lg">
                              {actualRank === 1 ? '👑' : `#${actualRank}`}
                            </td>
                            <td className="py-3 px-4 text-orange-200 font-semibold">{data.username}</td>
                            <td className="py-3 px-4 text-orange-400 font-mono text-sm">{userId}</td>
                            <td className="py-3 px-4 text-center">
                        <span className="bg-orange-600 text-white font-bold px-4 py-2 rounded-full text-lg border-2 border-orange-800">
                          🎃 {data.count}
                        </span>
                            </td>
                            <td className="py-3 px-4 text-center">
                              {data.count >= 10 ? (
                                  <span className="bg-yellow-500 text-black font-bold px-4 py-2 rounded-full text-sm border-2 border-yellow-600 inline-flex items-center gap-1">
                            <Crown className="w-4 h-4" />
                            PUMPKIN KING
                          </span>
                              ) : (
                                  <span className="text-orange-500 text-sm font-semibold">
                            {10 - data.count} more 🎃
                          </span>
                              )}
                            </td>
                          </tr>
                      )})}
                    </tbody>
                  </table>
                </div>
              </div>
          )}
        </div>
      </div>
  );
}