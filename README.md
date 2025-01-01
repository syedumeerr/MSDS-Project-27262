# MSDS-Project-27262
A network security management system combining manual device classification, ML-based behavioral monitoring, and router integration. Features include real-time threat detection, website/device management, an intuitive dashboard, and reporting. Built with Python, React.js, and integrated with Etisalat D-Link DIR 850L APIs.

# Network Security Management System

## Description
The Network Security Management System is an advanced solution designed to enhance network security by integrating manual device classification, machine learning-based behavioral monitoring, and router API functionalities. The project offers real-time anomaly detection, website and device management, and an intuitive dashboard with detailed reporting capabilities.

---

## Features

### 1. Manual Device Classification
- Devices connecting to the network are categorized as `Trusted`, `Blocked`, or `Unknown`.
- Users can dynamically trust or block devices from the dashboard.

### 2. Behavioral Monitoring
- Continuous monitoring of `Trusted` devices using an XGBoost Classifier to detect suspicious activities.
- Real-time alerts for anomalies in both `Trusted` devices and new, unknown devices connecting to the network.

### 3. Website Management
- Block and unblock websites dynamically via an integrated user interface.
- Persistent storage for blocked websites ensures restrictions are intact across restarts.

### 4. Dashboard and Visualization
- Counters for Trusted, Blocked, and Unknown devices.
- Real-time traffic monitoring and device behavior graphs.
- Reporting tools to filter and export data in CSV format.

### 5. Router Integration
- Interaction with Etisalat D-Link DIR 850L router APIs for MAC and URL filtering.
- Network-wide enforcement of device and website management rules.

---

## Technology Stack

| **Component**       | **Technology**             |
|----------------------|----------------------------|
| Backend             | Python (Flask 2.2.2)      |
| Frontend            | React.js, Node.js (18)     |
| Machine Learning    | XGBoost (1.6.1)           |
| Network Data        | Pyshark (0.4.3)           |
| Router Integration  | Custom API, Router APIs   |
| Hardware            | MacBook Air (M1, 16GB RAM, macOS Monterey) |

---

## Setup and Installation

### Clone the Repository:
```bash
git clone https://github.com/username/repo-name.git
cd repo-name

## Create a Virtual Environment:
python3 -m venv env
source env/bin/activate

## Install Dependencies:
pip install -r requirements.txt
npm install

##Run the Backend:
python main.py
capture_traffic.py

##Run the Frontend:
npm start 
```

## Usage
- Access the system via http://localhost:3000.
- Use the dashboard to classify devices, monitor traffic, block/unblock websites, and manage reports.

## Future Enhancements
- Add deep learning-based anomaly detection for enhanced monitoring.
- Implement role-based access control for better user management.
- Extend integration to other router models for broader compatibility.

## License
This project is licensed under the MIT License.

## Contributors
- **Syed Umer** - Developer
- **Muhammad Zain Uddin** - Supervisor
- **Institution of Business Administration - IBA**

## Contact
For issues, questions, or suggestions, please contact *syedumer208@gmail.com*.
