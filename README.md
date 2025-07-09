# MTG Prize Support App

This project is a Node.js application designed to assist in calculating prize support for Magic: The Gathering events. It processes entry fees and prize packs to determine payouts and store profits.

## Project Structure

- **src/server.js**: Main Express server handling form submissions and prize calculations.
- **src/public/PrizeSupportForm.html**: The HTML form for user input.
- **Dockerfile**: Defines the Docker environment for deployment.
- **package.json**: Lists dependencies and npm scripts.
- **README.md**: Project documentation.

## Setup Instructions

1. **Clone the repository**:
   ```sh
   git clone <repository-url>
   cd mtg-prize-support-app
   ```

2. **Install dependencies**:
   ```sh
   npm install
   ```

3. **Run the application locally**:
   ```sh
   npm start
   ```
   Then open [http://localhost:8080](http://localhost:8080) in your browser.

4. **Run with Docker**:
   ```sh
   docker build -t mtg-prize-support-app .
   docker run -p 8080:8080 mtg-prize-support-app
   ```

## Usage

- Access the app in your browser.
- Enter the number of players, entry fee, and prize packs to calculate payouts and prize distribution.

## Deployment

You can deploy this app to any platform that supports Docker, such as Fly.io or other cloud providers.

## Contributing

Contributions are welcome! Please open an issue or submit a pull request for enhancements or bug fixes.