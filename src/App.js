import { useState, useEffect } from 'react';
import { Crown } from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, onSnapshot } from 'firebase/firestore';

// Firebase configuration from environment variables
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
  measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export default function GiveawayTracker() {
  const [winners, setWinners] = useState({});
  const [pasteInput, setPasteInput] = useState('');
  const [message, setMessage] = useState('');
  const [hideKings, setHideKings] = useState(false);
  const [loading, setLoading] = useState(true);

  // Listen to real-time updates from Firebase
  useEffect(() => {
    const docRef = doc(db, 'pumpkinTracker', 'winners');

    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        setWinners(docSnap.data().winners || {});
      }
      setLoading(false);
    }, (error) => {
      console.error("error:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Save winners to Firebase
  const saveToFirebase = async (updatedWinners) => {
    try {
      const docRef = doc(db, 'pumpkinTracker', 'winners');
      await setDoc(docRef, { winners: updatedWinners });
    } catch (error) {
      console.error("data not saved:", error);
      setMessage('didn;t save the data');
    }
  };

  const parseGiveawayData = (text) => {
    const lines = text.split('\n');
    const newWinners = [];

    for (const line of lines) {
      const match = line.match(/\|\s*\d+\s*\|\s*(\d+)\s*\|\s*([^|]+)\s*\|/);
      if (match) {
        const userId = match[1].trim();
        const username = match[2].trim();
        newWinners.push({ userId, username });
      }
    }

    return newWinners;
  };

  const handlePaste = async () => {
    if (!pasteInput.trim()) {
      setMessage('Paste some giveaway data first!');
      return;
    }

    const newWinners = parseGiveawayData(pasteInput);

    if (newWinners.length === 0) {
      setMessage('Possibly wrong format? Let Rhyss know');
      return;
    }

    let addedCount = 0;
    let skippedCount = 0;

    const updated = { ...winners };
    newWinners.forEach(({ userId, username }) => {
      if (updated[userId]) {
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

    await saveToFirebase(updated);
    setWinners(updated);

    let msg = `${addedCount} pumpkins added!`;
    if (skippedCount > 0) {
      msg += ` (${skippedCount} already Pumpkin King${skippedCount > 1 ? 's' : ''})`;
    }
    setMessage(msg);
    setPasteInput('');
  };

  const sortedWinners = Object.entries(winners).sort((a, b) => b[1].count - a[1].count);
  const displayedWinners = hideKings ? sortedWinners.filter(([_, data]) => data.count < 10) : sortedWinners;
  const pumpkinKings = sortedWinners.filter(([_, data]) => data.count >= 10);

  if (loading) {
    return (
        <div className="min-h-screen bg-orange-900 flex items-center justify-center">
          <div className="text-white text-2xl">Loading...</div>
        </div>
    );
  }

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
              They need to win 10 Giveaways and then you give the Pumpkin Master role
            </p>

            <div className="mb-6">
              <label className="block text-orange-400 font-bold mb-2 text-lg">
                Paste Giveaway Results:
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
                  className="w-full bg-orange-600 text-white font-bold py-3 px-6 rounded-xl hover:bg-orange-700 transition-all border-2 border-orange-900 text-lg"
              >
                Add Pumpkins (Winners)
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
              <div className="text-4xl mb-2"></div>
              <div className="text-4xl font-bold text-orange-400">{sortedWinners.length}</div>
              <div className="text-orange-300 font-semibold">Pumpkin Collectors</div>
            </div>
            <div className="bg-purple-900 rounded-xl p-6 text-center border-2 border-yellow-600">
              <div className="text-4xl mb-2"></div>
              <div className="text-4xl font-bold text-yellow-400">{pumpkinKings.length}</div>
              <div className="text-yellow-300 font-semibold">Pumpkin Masters</div>
            </div>
            <div className="bg-purple-900 rounded-xl p-6 text-center border-2 border-orange-700">
              <div className="text-4xl mb-2"></div>
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
                    🎃 Leaderboard 🎃
                  </h2>
                  <button
                      onClick={() => setHideKings(!hideKings)}
                      className="bg-orange-600 text-white font-bold py-2 px-4 rounded-xl hover:bg-orange-700 transition-all border-2 border-orange-900"
                  >
                    {hideKings ? 'Show Pumpkin Kings' : 'Hide Pumpkin Kings'}
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
                              #{actualRank}
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
                      );
                    })}
                    </tbody>
                  </table>
                </div>
              </div>
          )}
        </div>
      </div>
  );
}