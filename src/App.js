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
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    // Listen to real-time updates from Firebase
    useEffect(() => {
        const docRef = doc(db, 'zombieTracker', 'winners');

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
            const docRef = doc(db, 'zombieTracker', 'winners');
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

        let msg = `${addedCount} brain${addedCount !== 1 ? 's' : ''} collected!`;
        if (skippedCount > 0) {
            msg += ` (${skippedCount} already Zombie Master${skippedCount > 1 ? 's' : ''})`;
        }
        setMessage(msg);
        setPasteInput('');
    };

    const sortedWinners = Object.entries(winners).sort((a, b) => b[1].count - a[1].count);
    const displayedWinners = hideKings ? sortedWinners.filter(([_, data]) => data.count < 10) : sortedWinners;

    // Filter by search term
    const filteredWinners = displayedWinners.filter(([userId, data]) => {
        const searchLower = searchTerm.toLowerCase();
        return data.username.toLowerCase().includes(searchLower) || userId.includes(searchTerm);
    });

    // Pagination
    const totalPages = Math.ceil(filteredWinners.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedWinners = filteredWinners.slice(startIndex, endIndex);

    const zombieMasters = sortedWinners.filter(([_, data]) => data.count >= 10);

    // Reset to page 1 when search or filter changes
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, hideKings]);

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-900 flex items-center justify-center">
                <div className="text-green-400 text-2xl">Loading...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-900 p-6">
            <div className="max-w-6xl mx-auto">
                <div className="bg-gray-800 rounded-3xl border-4 border-green-600 p-8 mb-6">
                    <div className="flex items-center justify-center gap-3 mb-6">
                        <h1 className="text-4xl font-bold text-green-500">
                            Zombie Brain Tracker
                        </h1>
                    </div>

                    <p className="text-center text-green-300 mb-6 text-lg">
                        Collect 10 brains to become a Zombie Master
                    </p>

                    <div className="mb-6">
                        <label className="block text-green-400 font-bold mb-2 text-lg">
                            Paste Giveaway Results:
                        </label>
                        <textarea
                            value={pasteInput}
                            onChange={(e) => setPasteInput(e.target.value)}
                            placeholder="Paste the giveaway results here..."
                            className="w-full h-48 p-4 bg-black text-green-200 placeholder-green-700 rounded-xl border-2 border-green-700 focus:border-green-500 focus:ring-2 focus:ring-green-500 outline-none font-mono text-sm"
                        />
                    </div>

                    <div className="flex gap-3 mb-4">
                        <button
                            onClick={handlePaste}
                            className="w-full bg-green-600 text-white font-bold py-3 px-6 rounded-xl hover:bg-green-700 transition-all border-2 border-green-900 text-lg"
                        >
                            Add Brains (Winners)
                        </button>
                    </div>

                    {message && (
                        <div className="bg-green-600/30 border-2 border-green-500 text-green-200 p-3 rounded-xl text-center font-bold">
                            {message}
                        </div>
                    )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="bg-gray-800 rounded-xl p-6 text-center border-2 border-green-700">
                        <div className="text-4xl font-bold text-green-400">{sortedWinners.length}</div>
                        <div className="text-green-300 font-semibold">Zombie Brains</div>
                    </div>
                    <div className="bg-gray-800 rounded-xl p-6 text-center border-2 border-red-600">
                        <div className="text-4xl font-bold text-red-400">{zombieMasters.length}</div>
                        <div className="text-red-300 font-semibold">Zombie Masters</div>
                    </div>
                    <div className="bg-gray-800 rounded-xl p-6 text-center border-2 border-green-700">
                        <div className="text-4xl font-bold text-green-500">
                            {sortedWinners.reduce((sum, [_, data]) => sum + data.count, 0)}
                        </div>
                        <div className="text-green-300 font-semibold">Total Brains</div>
                    </div>
                </div>

                {sortedWinners.length > 0 && (
                    <div className="bg-gray-800 rounded-3xl border-4 border-green-600 p-8">
                        <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-6">
                            <h2 className="text-3xl font-bold text-green-500">
                                Zombie Leaderboard
                            </h2>
                            <div className="flex gap-3 items-center">
                                <input
                                    type="text"
                                    placeholder="Search username or ID..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="px-4 py-2 bg-black text-green-200 placeholder-green-700 rounded-xl border-2 border-green-700 focus:border-green-500 focus:ring-2 focus:ring-green-500 outline-none"
                                />
                                <button
                                    onClick={() => setHideKings(!hideKings)}
                                    className="bg-green-600 text-white font-bold py-2 px-4 rounded-xl hover:bg-green-700 transition-all border-2 border-green-900 whitespace-nowrap"
                                >
                                    {hideKings ? 'Show Masters' : 'Hide Masters'}
                                </button>
                            </div>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                <tr className="border-b-2 border-green-700">
                                    <th className="text-left text-green-400 font-bold py-3 px-4">Rank</th>
                                    <th className="text-left text-green-400 font-bold py-3 px-4">Username</th>
                                    <th className="text-left text-green-400 font-bold py-3 px-4">Discord ID</th>
                                    <th className="text-center text-green-400 font-bold py-3 px-4">Brains</th>
                                    <th className="text-center text-green-400 font-bold py-3 px-4">Status</th>
                                </tr>
                                </thead>
                                <tbody>
                                {paginatedWinners.map(([userId, data], index) => {
                                    const actualRank = sortedWinners.findIndex(([id]) => id === userId) + 1;
                                    return (
                                        <tr key={userId} className="border-b border-green-900 hover:bg-gray-700">
                                            <td className="py-3 px-4 text-green-300 font-bold text-lg">
                                                #{actualRank}
                                            </td>
                                            <td className="py-3 px-4 text-green-200 font-semibold">{data.username}</td>
                                            <td className="py-3 px-4 text-green-400 font-mono text-sm">{userId}</td>
                                            <td className="py-3 px-4 text-center">
                          <span className="bg-green-600 text-white font-bold px-4 py-2 rounded-full text-lg border-2 border-green-800">
                            🧠 {data.count}
                          </span>
                                            </td>
                                            <td className="py-3 px-4 text-center">
                                                {data.count >= 10 ? (
                                                    <span className="bg-red-600 text-white font-bold px-4 py-2 rounded-full text-sm border-2 border-red-800 inline-flex items-center gap-1">
                              <Crown className="w-4 h-4" />
                              ZOMBIE MASTER
                            </span>
                                                ) : data.count >= 1 ? (
                                                    <span className="bg-green-600 text-white font-bold px-4 py-2 rounded-full text-sm border-2 border-green-800 inline-flex items-center gap-1">
                              🧟 ZOMBIE BRAIN
                              <span className="text-xs ml-1">({10 - data.count} more)</span>
                            </span>
                                                ) : (
                                                    <span className="text-green-500 text-sm font-semibold">
                              {10 - data.count} more 🧠
                            </span>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                                </tbody>
                            </table>
                        </div>

                        {totalPages > 1 && (
                            <div className="flex items-center justify-center gap-2 mt-6">
                                <button
                                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                    disabled={currentPage === 1}
                                    className="px-4 py-2 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition-all"
                                >
                                    Previous
                                </button>

                                <div className="flex gap-2">
                                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                                        <button
                                            key={page}
                                            onClick={() => setCurrentPage(page)}
                                            className={`px-4 py-2 font-bold rounded-lg transition-all ${
                                                currentPage === page
                                                    ? 'bg-green-500 text-white'
                                                    : 'bg-gray-700 text-green-300 hover:bg-gray-600'
                                            }`}
                                        >
                                            {page}
                                        </button>
                                    ))}
                                </div>

                                <button
                                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                    disabled={currentPage === totalPages}
                                    className="px-4 py-2 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition-all"
                                >
                                    Next
                                </button>
                            </div>
                        )}


                    </div>
                )}
            </div>
        </div>
    );
}