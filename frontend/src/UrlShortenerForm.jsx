import { useState } from "react";
import axios from "axios"; // The Network Agent

const UrlShortenerForm = () => {
  // 🧠 MEMORY: The State Machine
  const [url, setUrl] = useState("");
  const [shortLink, setShortLink] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    // 🧠 INTERCEPTION: Kill the default refresh
    e.preventDefault();
    
    // Reset previous states
    setError(null);
    setShortLink(null);
    setLoading(true); // 🔒 Lock UI

    try {
      // 🧠 TRANSMISSION: The Handshake
      // We are sending the exact shape the Backend Controller expects
      const response = await axios.post("http://localhost:5000/api/url/shorten", {
        originalUrl: url
      });

      // If we are here, the server said "201 Created"
      setShortLink(response.data.shortUrl);
      
    } catch (err) {
      // 🧠 SAFETY NET: Handle 400/500 errors gracefully
      console.error("Transmission Failed:", err);
      setError(err.response?.data?.error || "Something went wrong");
    } finally {
      setLoading(false); // 🔓 Unlock UI
    }
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-md max-w-md mx-auto mt-10">
      <h2 className="text-2xl font-bold mb-4 text-gray-800">Linkify Pro</h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="url"
          required
          placeholder="Paste long URL here..."
          value={url}
          onChange={(e) => setUrl(e.target.value)} // Update Memory
          className="w-full p-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        
        <button 
          type="submit" 
          disabled={loading}
          className="w-full bg-blue-600 text-white p-3 rounded font-semibold hover:bg-blue-700 transition disabled:bg-gray-400"
        >
          {loading ? "Shortening..." : "Shorten URL"}
        </button>
      </form>

      {/* 🧠 FEEDBACK SECTION */}
      {error && <p className="mt-4 text-red-500 text-center">{error}</p>}
      
      {shortLink && (
        <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded text-center">
          <p className="text-green-800 font-medium">Success! Here is your link:</p>
          <a href={shortLink} target="_blank" rel="noreferrer" className="text-blue-600 underline break-all font-bold text-lg mt-2 block">
            {shortLink}
          </a>
        </div>
      )}
    </div>
  );
};

export default UrlShortenerForm;