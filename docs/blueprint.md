# **App Name**: TypeRush

## Core Features:

- User Authentication: Secure user login and registration using email/password or Google/GitHub OAuth.
- Typing Game: Real-time typing game that tracks typing speed (WPM) and accuracy.
- Data Storage: Store user profiles, scores, and game history in Firestore.
- Leaderboard: Display a real-time leaderboard with user scores, using Firestore listeners or Realtime Database.
- Update Leaderboard: Cloud Function to update leaderboard on new game score and check if score is higher than the previous high score. Update the user and the leaderboard accordingly
- Analytics Tracking: Track the number of games played and average WPM

## Style Guidelines:

- Primary color: Electric blue (#7DF9FF) to evoke energy and focus.
- Background color: Dark slate gray (#293132), providing high contrast and a professional look.
- Accent color: Neon green (#39FF14) for highlighting scores and interactive elements.
- Body and headline font: 'Space Grotesk' sans-serif font.
- Use sharp, minimalist icons to represent game stats and user profiles.
- Subtle animations on typing input to give feedback on speed and accuracy.