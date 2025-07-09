# MTG Prize Support App

This project is a Google Apps Script application designed to assist in calculating prize support for Magic: The Gathering events. It processes entry fees and prize packs to determine payouts and store profits.

## Project Structure

- **src/Code.js**: Contains the main logic for processing prize support forms and calculating payouts.
- **.clasp.json**: Configuration file for clasp, containing settings for deploying Google Apps Script projects.
- **Dockerfile**: Defines the environment for the application, including base image and dependencies.
- **package.json**: Configuration file for npm, listing dependencies and scripts for the project.
- **README.md**: Documentation for the project, including setup instructions and usage guidelines.

## Setup Instructions

1. **Clone the repository**:
   ```
   git clone <repository-url>
   cd mtg-prize-support-app
   ```

2. **Install dependencies**:
   ```
   npm install
   ```

3. **Configure clasp**:
   Ensure you have the `.clasp.json` file set up with your Google Apps Script project details.

4. **Run the application**:
   Use the following command to start the application in a Docker container:
   ```
   docker build -t mtg-prize-support-app .
   docker run mtg-prize-support-app
   ```

## Usage Guidelines

- To use the prize support calculator, access the deployed Google Apps Script web app.
- Input the number of players, entry fee, and available prize packs to calculate the payouts and total number of prize packs to be distributed.

## Contributing

Contributions are welcome! Please submit a pull request or open an issue for any enhancements or bug fixes.