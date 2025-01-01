from flask import Flask, request, jsonify
import logging
import os

from flask_cors import CORS

app = Flask(__name__)
CORS(app) 

# Configure logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")

# Persistent storage file for blocked websites
BLOCKED_WEBSITES_FILE = "blocked_websites.txt"

# Initialize blocked websites set
blocked_websites = set()



def load_blocked_websites():
    """
    Load blocked websites from a file into memory.
    """
    if os.path.exists(BLOCKED_WEBSITES_FILE):
        with open(BLOCKED_WEBSITES_FILE, "r") as file:
            for line in file:
                blocked_websites.add(line.strip().lower())
        logging.info("Blocked websites loaded from file.")
    else:
        logging.info("No existing blocked websites file found. Starting fresh.")


def save_blocked_websites():
    """
    Save the blocked websites set to a file.
    """
    try:
        with open(BLOCKED_WEBSITES_FILE, "w") as file:
            for website in blocked_websites:
                file.write(f"{website}\n")
        logging.info("Blocked websites saved to file.")
    except Exception as e:
        logging.error(f"Failed to save blocked websites: {e}")


@app.route("/block_website", methods=["POST"])
def block_website():
    """
    Endpoint to block a website.
    """
    try:
        data = request.json
        url = data.get("url")
        if not url:
            logging.warning("No URL provided in block request.")
            return jsonify({"error": "No URL provided"}), 400

        blocked_websites.add(url.lower())
        save_blocked_websites()
        logging.info(f"Website '{url}' has been blocked.")
        return jsonify({"message": f"Website '{url}' has been blocked."}), 200
    except Exception as e:
        logging.error(f"Error in /block_website: {e}")
        return jsonify({"error": str(e)}), 500


@app.route("/unblock_website", methods=["POST"])
def unblock_website():
    """
    Endpoint to unblock a website.
    """
    try:
        data = request.json
        url = data.get("url")
        if not url:
            logging.warning("No URL provided in unblock request.")
            return jsonify({"error": "No URL provided"}), 400

        if url.lower() in blocked_websites:
            blocked_websites.discard(url.lower())
            save_blocked_websites()
            logging.info(f"Website '{url}' has been unblocked.")
            return jsonify({"message": f"Website '{url}' has been unblocked."}), 200
        else:
            logging.warning(f"Website '{url}' not found in blocked list.")
            return jsonify({"error": f"Website '{url}' is not blocked."}), 404
    except Exception as e:
        logging.error(f"Error in /unblock_website: {e}")
        return jsonify({"error": str(e)}), 500


@app.route("/get_blocked_websites", methods=["GET"])
def get_blocked_websites():
    """
    Endpoint to fetch the list of blocked websites.
    """
    try:
        logging.info("Fetching blocked websites.")
        return jsonify(list(blocked_websites)), 200
    except Exception as e:
        logging.error(f"Error in /get_blocked_websites: {e}")
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    # Load blocked websites on startup
    load_blocked_websites()

    # Run the Flask app
    try:
        app.run(host="0.0.0.0", port=5002, debug=True)
    except Exception as e:
        logging.critical(f"Failed to start the server: {e}")
        save_blocked_websites()
