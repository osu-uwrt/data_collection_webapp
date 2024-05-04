
# Data Collection Webapp

This project, developed by the Ohio State University Underwater Robotics Team, is a data collection web application designed to facilitate the upload, storage, and annotation of video and photo data.

## Features

- **User Management**: Secure login and registration system.
- **Media Upload**: Users can upload videos and folders of photos to be stored and managed.
- **Media Annotation**: Tools for annotating videos and photos with various metadata.
- **Data Retrieval**: Efficient retrieval and viewing of videos, photos, and their annotations.

## Getting Started

Follow these instructions to set up the project on your local machine for development and testing purposes.

### Prerequisites

- Python 3.8 or higher
- Node.js
- npm
- SQLite3

### Installation

#### Backend Setup

1. Clone the repository:
   ```sh
   git clone https://github.com/osu-uwrt/data_collection_webapp.git
   cd data_collection_webapp
   ```

2. Set up a virtual environment (optional but recommended):
   ```sh
   python -m venv venv
   source venv/bin/activate  # On Windows use `venv\Scripts\activate`
   ```

3. Install the required Python packages:
   ```sh
   pip install -r requirements.txt
   ```

4. Initialize the database:
   ```sh
   cd backend
   python setup_db.py
   ```

5. Start the backend server:
   ```sh
   python app.py
   ```

#### Frontend Setup

1. Navigate to the frontend directory:
   ```sh
   cd frontend
   ```

2. Install the necessary npm packages:
   ```sh
   npm install
   ```

3. Start the frontend development server:
   ```sh
   npm start
   ```

Now, navigate to `http://localhost:3000` in your browser to see the application in action.

## Built With

- **Flask** - The web framework used for the backend.
- **React** - The frontend library.
- **SQLite** - The database technology.

## Contributing

Please read CONTRIBUTING.md for details on our code of conduct, and the process for submitting pull requests to us.

## License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details.