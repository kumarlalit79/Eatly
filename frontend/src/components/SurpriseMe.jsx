import React, { useState } from "react";
import axios from "axios";
import { useSelector } from "react-redux";
import { ClipLoader } from "react-spinners";
import { FaDice } from "react-icons/fa";

const SurpriseMe = () => {
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  const { userData } = useSelector((state) => state.user);
  const serverUrl = "http://localhost:3000";

  if (!userData) return null;

  const rollDice = async () => {
    setLoading(true);
    setError(null);
    setShowModal(true); // Open modal immediately to show loading
    
    try {
      const token = localStorage.getItem("token");
      const res = await axios.post(
        `${serverUrl}/api/ai/surprise`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true,
        }
      );
      setData(res.data);
    } catch (err) {
      console.error(err);
      setError("The dice rolled off the table! Try again.");
    } finally {
      setLoading(false);
    }
  };

  const closeModal = () => {
    setShowModal(false);
    // Optional: clear data on close? No, keep it so they can see what they rolled if they reopen? 
    // Actually better to keep it until they re-roll.
  };

  return (
    <>
      {/* Floating Action Button */}
      <div className="fixed bottom-24 right-6 z-50 animate-bounce-slow">
        <button
          onClick={() => {
            if (!showModal) rollDice(); 
            else setShowModal(true);
          }}
          className="bg-indigo-600 hover:bg-indigo-700 text-white p-4 rounded-full shadow-lg transition-transform hover:scale-110 flex items-center justify-center text-2xl border-2 border-white"
          title="Surprise Me!"
        >
          <FaDice />
        </button>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] flex flex-col overflow-hidden relative animate-fade-in-up">
                
                {/* Header */}
                <div className="bg-gradient-to-r from-[#ff4d2d] to-orange-600 p-4 text-white text-center relative shrink-0">
                    <h2 className="text-xl font-bold flex items-center justify-center gap-2">
                        <FaDice className="animate-spin-slow" /> Surprise Meal
                    </h2>
                    <button 
                        onClick={closeModal}
                        className="absolute top-4 right-4 text-white/80 hover:text-white"
                    >
                        ✕
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 overflow-y-auto">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-8 gap-4">
                            <ClipLoader color="#ff4d2d" size={40} />
                            <p className="text-gray-500 animate-pulse">Consulting the Food God...</p>
                        </div>
                    ) : error ? (
                        <div className="text-center py-6">
                            <p className="text-red-500 mb-4">{error}</p>
                            <button 
                                onClick={rollDice}
                                className="px-4 py-2 bg-orange-100 text-orange-700 rounded-lg hover:bg-orange-200 transition"
                            >
                                Try Again
                            </button>
                        </div>
                    ) : data ? (
                        <div className="space-y-4">
                            <div className="text-center">
                                <h3 className="text-2xl font-bold text-gray-800">{data.comboName}</h3>
                                <p className="text-[#ff4d2d] italic mt-1">"{data.reason}"</p>
                            </div>

                            <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                                {data.items && data.items.map((item, idx) => (
                                    <div key={idx} className="flex items-center gap-3 bg-white p-2 rounded-lg shadow-sm border border-gray-100">
                                        <div className="w-12 h-12 bg-gray-200 rounded-md overflow-hidden flex-shrink-0">
                                            <img 
                                                src={item.image} 
                                                alt={item.name} 
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                        <div>
                                            <p className="font-semibold text-gray-800">{item.name}</p>
                                            <p className="text-xs text-gray-500">₹{item.price}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <button 
                                onClick={rollDice} // Reroll
                                className="w-full py-3 bg-[#ff4d2d] hover:bg-orange-600 text-white rounded-xl font-semibold shadow-md transition-all flex items-center justify-center gap-2"
                            >
                                <FaDice /> Spin Again
                            </button>
                        </div>
                    ) : null}
                </div>
            </div>
        </div>
      )}
    </>
  );
};

export default SurpriseMe;
